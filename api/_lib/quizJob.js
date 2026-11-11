import { bunnyConfigured, pickLessonAudioSource } from './bunny.js'
import { applyDentalFixes } from './dentalGlossary.js'
import {
  audioPlanFromMoov,
  buildM4a,
  coalesceRanges,
  decodeAudioPart,
  decodeSizes,
  encodeAudioPart,
  encodeSizes,
  scanForMoov,
  splitFrames,
} from './mp4Audio.js'
import {
  cleanSystemPrompt,
  extractJson,
  questionSystemPrompt,
  repairUserPrompt,
  transcriptFromStt,
  validateQuestions,
} from './quizDraft.js'
import {
  pickVoiceLabModel,
  sttLanguage,
  voiceLabChat,
  voiceLabModels,
  voiceLabPreflight,
  voiceLabSubmitStt,
  voiceLabTranscription,
} from './voicelab.js'

/**
 * Dars videosidan test qoralamasi.
 * Har bir so‘rov bitta qisqa qadam: manba → audio oralig‘i → STT yuborish →
 * STT holati → matnni tuzatish → savollar. STT tayyor bo‘lishi daqiqalar olishi
 * mumkin, shuning uchun bir so‘rovda kutmaymiz.
 *
 * Audio: Bunny play-data dagi eng past MP4 (yoki original). CDN referrer
 * stomahub-three.vercel.app ga cheklangan — server so‘rovi shu Referer ni yuboradi.
 * Imzolangan play URL bo‘lsa undan foydalanamiz. Butun videoni buferlamaymiz.
 */

export const QUIZ_DAILY_LIMIT = 3
const BUCKET = 'course-quiz-audio'
const TICK_MS = 12_000
const BATCH_BYTES = 4 * 1024 * 1024
const BATCH_RANGES = 24
const WINDOW = 2 * 1024 * 1024
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const STAGE = {
  queued: 'Navbatda',
  resolving: 'Video tekshirilmoqda',
  extracting: 'Audio ajratilmoqda',
  uploading: 'Ovoz yuborilmoqda',
  transcribing: 'Matn yozilmoqda',
  cleaning: 'Matn tuzatilmoqda',
  generating: 'Savollar tuzilmoqda',
  ready: 'Tayyor',
  failed: 'Xato',
}

function fail(status, error, code = '', transient = false) {
  const err = new Error(error)
  err.status = status
  err.code = code
  err.transient = transient
  return err
}

function clientMessage(error) {
  if (error?.code === 'insufficient_credits' || error?.status === 402) return 'VoiceLab hisobida kredit tugadi'
  if (error?.status && error.status <= 503 && error.message) return String(error.message).slice(0, 300)
  return 'Savol tuzishda xato'
}

function mapDb(error) {
  const message = String(error?.message || error || '')
  if (/course_quiz_jobs|schema cache|does not exist|PGRST205/i.test(message)) {
    return fail(503, 'Savol tuzish bazasi hali ulanmagan. supabase/migrations/0073_course_quiz_jobs.sql ni qo‘llang.', 'migration')
  }
  return fail(502, 'Saqlashda xato', 'db', true)
}

function mapStorage(error) {
  const message = String(error?.message || error || '')
  if (/course-quiz-audio|Bucket not found|not found/i.test(message)) {
    return fail(503, 'Audio saqlash joyi yo‘q. 0073 migratsiyasini qo‘llang.', 'migration')
  }
  return fail(502, 'Audio bo‘lagini saqlab bo‘lmadi', 'storage', true)
}

export function publicJob(row) {
  if (!row) return null
  const questions = Array.isArray(row.questions) ? row.questions : []
  return {
    id: row.id,
    lessonId: row.lesson_id,
    status: row.status,
    progress: row.progress,
    stage: row.stage || STAGE[row.status] || '',
    error: row.error || '',
    errorCode: row.error_code || '',
    transcript: row.transcript_clean || '',
    questions: row.status === 'ready' ? questions : [],
    updatedAt: row.updated_at,
  }
}

function countsTowardLimit(job) {
  if (job.stt_id) return true
  if (['queued', 'resolving', 'extracting', 'uploading', 'transcribing', 'cleaning', 'generating', 'ready'].includes(job.status)) return true
  return false
}

async function maybe(admin, table, column, value, columns) {
  const { data, error } = await admin.from(table).select(columns).eq(column, value).maybeSingle()
  if (error) throw mapDb(error)
  return data
}

async function listJobs(admin, lessonId) {
  const { data, error } = await admin.from('course_quiz_jobs').select('*').eq('lesson_id', lessonId).order('created_at', { ascending: false }).limit(40)
  if (error) throw mapDb(error)
  return data || []
}

async function claim(deps, job) {
  const now = deps.now()
  const until = job.locked_until ? Date.parse(job.locked_until) : 0
  if (job.lock_token && until > now) return null
  const token = deps.uuid()
  const { data, error } = await deps.admin.from('course_quiz_jobs').update({
    lock_token: token,
    locked_until: new Date(now + 90_000).toISOString(),
  }).eq('id', job.id).eq('lock_token', job.lock_token || '').select('id').maybeSingle()
  if (error) throw mapDb(error)
  return data ? token : null
}

async function writeJob(deps, job, token, patch, { release }) {
  const next = {
    ...patch,
    updated_at: new Date(deps.now()).toISOString(),
    lock_token: release ? '' : token,
    locked_until: release ? null : new Date(deps.now() + 90_000).toISOString(),
  }
  const { data, error } = await deps.admin.from('course_quiz_jobs').update(next).eq('id', job.id).eq('lock_token', token).select('*').maybeSingle()
  if (error) throw mapDb(error)
  if (!data) throw fail(409, 'Jarayon boshqa so‘rovda yangilanmoqda', 'locked', true)
  return data
}

const save = (deps, job, token, patch) => writeJob(deps, job, token, patch, { release: true })
const touch = (deps, job, token, patch) => writeJob(deps, job, token, patch, { release: false })

function originOf(referer) {
  try { return new URL(referer).origin } catch { return 'https://stomahub-three.vercel.app' }
}

async function fetchBytes(fetchImpl, url, start, end, referer) {
  let res
  try {
    res = await fetchImpl(url, {
      headers: {
        Range: `bytes=${start}-${Math.max(start, end - 1)}`,
        Referer: referer,
        Origin: originOf(referer),
        'User-Agent': 'StomaHubQuiz/1.0',
        Accept: '*/*',
      },
    })
  } catch {
    throw fail(502, 'Video manbasiga ulanib bo‘lmadi', 'cdn', true)
  }
  if (!res.ok && res.status !== 206) {
    throw fail(502, 'Video manbasi javob bermadi', 'cdn', res.status >= 500 || res.status === 429)
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  const range = String(res.headers.get('content-range') || '')
  const total = Number(/\/(\d+)$/.exec(range)?.[1] || 0) || Number(res.headers.get('content-length') || 0) || buffer.length
  if (res.status === 206) return { buffer, total }
  if (start === 0 && buffer.length <= Math.max(end, buffer.length) && buffer.length <= 48 * 1024 * 1024) {
    return { buffer: buffer.subarray(start, Math.min(end, buffer.length)), total: buffer.length }
  }
  if (buffer.length >= end - start && buffer.length <= (end - start) + 16) return { buffer, total }
  throw fail(502, 'Video server qisqa so‘rovni qo‘llab-quvvatlamadi', 'range')
}

async function bunnyJson(deps, path) {
  const { libraryId, apiKey, ok } = bunnyConfigured(deps.env)
  if (!ok) throw fail(503, 'Video xizmati sozlanmagan', 'bunny')
  let res
  try {
    res = await deps.fetch(`https://video.bunnycdn.com/library/${libraryId}${path}`, {
      headers: { AccessKey: apiKey, Accept: 'application/json' },
    })
  } catch {
    throw fail(502, 'Video xizmatiga ulanib bo‘lmadi', 'bunny', true)
  }
  const text = await res.text()
  let data = {}
  try { data = text ? JSON.parse(text) : {} } catch { data = {} }
  if (!res.ok) throw fail(502, 'Video ma’lumoti olinmadi', 'bunny', res.status >= 500)
  return data
}

async function storageUpload(deps, path, body) {
  const { error } = await deps.admin.storage.from(BUCKET).upload(path, body, {
    contentType: 'application/octet-stream',
    upsert: true,
  })
  if (error) throw mapStorage(error)
}

async function storageDownload(deps, path) {
  const { data, error } = await deps.admin.storage.from(BUCKET).download(path)
  if (error || data == null) throw mapStorage(error || { message: 'topilmadi' })
  if (Buffer.isBuffer(data)) return data
  if (typeof data.arrayBuffer === 'function') return Buffer.from(await data.arrayBuffer())
  return Buffer.from(data)
}

async function removeAudio(deps, job) {
  const count = Number(job.plan?.partCount || 0)
  const paths = [`${job.id}/sizes.bin`]
  for (let i = 0; i < count; i += 1) paths.push(`${job.id}/part-${i}.bin`)
  const { error } = await deps.admin.storage.from(BUCKET).remove(paths)
  if (error) throw mapStorage(error)
}

async function loadMoov(deps, plan) {
  const referer = plan.referer
  let base = 0
  let total = Number(plan.sourceBytes || 0)
  for (let guard = 0; guard < 6; guard += 1) {
    const end = total ? Math.min(total, base + WINDOW) : base + WINDOW
    const got = await fetchBytes(deps.fetch, plan.sourceUrl, base, end, referer)
    total = got.total || total
    const scanned = scanForMoov(got.buffer, base, total)
    if (scanned.error) throw fail(422, scanned.error, 'no_audio')
    if (scanned.moov) return scanned.moov
    if (scanned.need) {
      const exact = await fetchBytes(deps.fetch, plan.sourceUrl, scanned.need.start, scanned.need.end, referer)
      return exact.buffer
    }
    if (!scanned.continueFrom || scanned.continueFrom <= base) throw fail(422, 'Videoda moov topilmadi', 'no_audio')
    if (total && scanned.continueFrom >= total) throw fail(422, 'Videoda moov topilmadi', 'no_audio')
    base = scanned.continueFrom
  }
  throw fail(422, 'Videoda moov topilmadi', 'no_audio')
}

async function resolveSource(deps, job, token) {
  const lesson = await maybe(deps.admin, 'course_lessons', 'id', job.lesson_id, 'id, bunny_video_id, duration_seconds, encoding_status')
  if (!lesson?.bunny_video_id || lesson.encoding_status !== 'finished') {
    throw fail(400, 'Video hali tayyor emas. Qayta ishlash tugagach urinib ko‘ring.')
  }
  const [video, play] = await Promise.all([
    bunnyJson(deps, `/videos/${lesson.bunny_video_id}`),
    bunnyJson(deps, `/videos/${lesson.bunny_video_id}/play`),
  ])
  const { cdnHost, referer } = bunnyConfigured(deps.env)
  const source = pickLessonAudioSource({ video, play, cdnHost })
  if (!source?.url) {
    throw fail(422, 'Videoda MP4 yoki original topilmadi. Kutubxonada MP4 zaxira yoqilganini tekshiring.', 'no_media')
  }
  const plan = {
    ...(job.plan || {}),
    sourceUrl: source.url,
    sourceLabel: source.label,
    sourceKind: source.kind,
    referer,
    durationSeconds: lesson.duration_seconds || job.plan?.durationSeconds || 0,
    parsed: false,
  }
  return save(deps, job, token, { status: 'extracting', progress: 10, stage: STAGE.extracting, plan, error: '', error_code: '' })
}

async function extractSlice(deps, job, token, started) {
  let plan = { ...(job.plan || {}) }
  if (!plan.parsed) {
    const moov = await loadMoov(deps, plan)
    let audio
    try { audio = audioPlanFromMoov(moov) } catch (error) {
      throw fail(error.status || 422, error.message, error.code || 'no_audio')
    }
    if (!audio.ranges.length) throw fail(422, 'Videoda audio izi topilmadi', 'no_audio')
    await storageUpload(deps, `${job.id}/sizes.bin`, encodeSizes(audio.sizes))
    plan = {
      ...plan,
      parsed: true,
      ranges: coalesceRanges(audio.ranges),
      nextRange: 0,
      partCount: 0,
      timescale: audio.timescale,
      sampleDelta: audio.sampleDelta,
      sampleEntryB64: audio.sampleEntry.toString('base64'),
      sampleCount: audio.sampleCount,
    }
    await touch(deps, job, token, { plan, progress: 14, stage: STAGE.extracting })
  }
  const ranges = plan.ranges || []
  if (plan.nextRange >= ranges.length) {
    return save(deps, job, token, { status: 'uploading', progress: 55, stage: STAGE.uploading, plan })
  }
  const sizesBuf = await storageDownload(deps, `${job.id}/sizes.bin`)
  const batch = []
  let bytes = 0
  let index = plan.nextRange
  while (index < ranges.length && batch.length < BATCH_RANGES) {
    if (batch.length && (bytes >= BATCH_BYTES || deps.now() - started > TICK_MS)) break
    const range = ranges[index]
    bytes += Math.max(0, range.end - range.start)
    batch.push(range)
    index += 1
    if (bytes >= BATCH_BYTES) break
  }
  const frames = []
  for (const range of batch) {
    const got = await fetchBytes(deps.fetch, plan.sourceUrl, range.start, range.end, plan.referer)
    const sizes = decodeSizes(sizesBuf, range.first, range.count)
    try {
      frames.push(...splitFrames(got.buffer, sizes))
    } catch (error) {
      throw fail(422, error.message, error.code || 'no_audio')
    }
  }
  await storageUpload(deps, `${job.id}/part-${plan.partCount}.bin`, encodeAudioPart(frames))
  plan = { ...plan, nextRange: index, partCount: plan.partCount + 1 }
  if (index >= ranges.length) {
    return save(deps, job, token, { status: 'uploading', progress: 55, stage: STAGE.uploading, plan })
  }
  const progress = 14 + Math.round((index / ranges.length) * 36)
  return save(deps, job, token, { status: 'extracting', progress, stage: STAGE.extracting, plan })
}

async function uploadAudio(deps, job, token) {
  if (job.stt_id) {
    return save(deps, job, token, { status: 'transcribing', progress: 70, stage: STAGE.transcribing })
  }
  const plan = job.plan || {}
  const frames = []
  for (let i = 0; i < Number(plan.partCount || 0); i += 1) {
    const part = await storageDownload(deps, `${job.id}/part-${i}.bin`)
    frames.push(...decodeAudioPart(part))
  }
  const m4a = buildM4a({
    frames,
    sampleEntry: Buffer.from(plan.sampleEntryB64 || '', 'base64'),
    timescale: plan.timescale,
    sampleDelta: plan.sampleDelta,
  })
  if (m4a.length > 80 * 1024 * 1024) throw fail(413, 'Audio 80 MB dan katta. Qisqaroq dars bilan urinib ko‘ring.', 'audio_too_large')
  const apiKey = String(deps.env.VOICELAB_API_KEY || '').trim()
  if (!apiKey) throw fail(503, 'Savol tuzish hali sozlanmagan', 'not_configured')
  const idempotencyKey = job.stt_idempotency_key || deps.uuid()
  if (!job.stt_idempotency_key) {
    await touch(deps, job, token, { stt_idempotency_key: idempotencyKey, status: 'uploading', stage: STAGE.uploading })
  }
  const durationMs = Number(plan.durationSeconds || 0) * 1000
  await voiceLabPreflight({ fetch: deps.fetch, apiKey, durationMs })
  const submitted = await voiceLabSubmitStt({
    fetch: deps.fetch,
    apiKey,
    audio: m4a,
    idempotencyKey,
    language: sttLanguage(deps.env),
    durationMs,
  })
  const saved = await save(deps, job, token, {
    status: 'transcribing',
    progress: 70,
    stage: STAGE.transcribing,
    stt_id: submitted.id,
    stt_idempotency_key: idempotencyKey,
    error: '',
    error_code: '',
  })
  try { await removeAudio(deps, saved) } catch { /* keyingi urinishda qolgan bo‘lak tozalanadi */ }
  return saved
}

async function pollStt(deps, job, token) {
  const apiKey = String(deps.env.VOICELAB_API_KEY || '').trim()
  if (!apiKey) throw fail(503, 'Savol tuzish hali sozlanmagan', 'not_configured')
  const body = await voiceLabTranscription({ fetch: deps.fetch, apiKey, id: job.stt_id })
  if (body.status === 'failed') throw fail(502, 'Matn yozilmadi. Qayta urinib ko‘ring.', 'stt_failed')
  if (body.status !== 'completed') {
    return save(deps, job, token, { status: 'transcribing', progress: 74, stage: STAGE.transcribing })
  }
  const transcript = transcriptFromStt(body).slice(0, 100_000)
  if (transcript.trim().length < 40) throw fail(422, 'Videoda yetarli nutq topilmadi', 'empty_transcript')
  return save(deps, job, token, {
    status: 'cleaning',
    progress: 82,
    stage: STAGE.cleaning,
    transcript_raw: transcript,
  })
}

async function ensureModel(deps, job, token) {
  if (job.llm_model) return { id: job.llm_model, reasoning: job.plan?.reasoning || '' }
  const override = String(deps.env.VOICELAB_LLM_MODEL || '').trim()
  const apiKey = String(deps.env.VOICELAB_API_KEY || '').trim()
  let picked = null
  if (override) picked = { id: override, reasoning: override === 'aisha-orbit' ? 'low' : '' }
  else {
    const models = await voiceLabModels({ fetch: deps.fetch, apiKey })
    picked = pickVoiceLabModel(models)
  }
  if (!picked?.id) throw fail(503, 'VoiceLab modeli topilmadi', 'model')
  const plan = { ...(job.plan || {}), reasoning: picked.reasoning }
  const saved = await touch(deps, job, token, { llm_model: picked.id, plan })
  return { id: picked.id, reasoning: picked.reasoning, job: saved }
}

async function cleanTranscript(deps, job, token) {
  const model = await ensureModel(deps, job, token)
  const current = model.job || job
  const plan = { ...(current.plan || {}) }
  const source = applyDentalFixes(current.transcript_raw || job.transcript_raw || '')
  const cleanKey = plan.cleanKey || deps.uuid()
  if (!plan.cleanKey) {
    plan.cleanKey = cleanKey
    await touch(deps, current, token, { plan })
  }
  const apiKey = String(deps.env.VOICELAB_API_KEY || '').trim()
  const text = await voiceLabChat({
    fetch: deps.fetch,
    apiKey,
    idempotencyKey: cleanKey,
    model: model.id,
    reasoning: model.reasoning,
    messages: [
      { role: 'system', content: cleanSystemPrompt() },
      { role: 'user', content: source.slice(0, 80_000) },
    ],
    maxTokens: 8192,
  })
  const transcript = applyDentalFixes(text).slice(0, 80_000)
  return save(deps, current, token, {
    status: 'generating',
    progress: 92,
    stage: STAGE.generating,
    transcript_clean: transcript || source.slice(0, 80_000),
    llm_model: model.id,
    plan,
  })
}

async function generateQuestions(deps, job, token) {
  const model = await ensureModel(deps, job, token)
  const current = model.job || job
  const plan = { ...(current.plan || {}) }
  const apiKey = String(deps.env.VOICELAB_API_KEY || '').trim()
  const transcript = (current.transcript_clean || job.transcript_clean || '').slice(0, 80_000)
  const ask = async (key, messages) => voiceLabChat({
    fetch: deps.fetch,
    apiKey,
    idempotencyKey: key,
    model: model.id,
    reasoning: model.reasoning,
    messages,
    maxTokens: 4096,
  })
  const baseMessages = [
    { role: 'system', content: questionSystemPrompt() },
    { role: 'user', content: transcript },
  ]
  const questionKey = plan.questionKey || deps.uuid()
  if (!plan.questionKey) {
    plan.questionKey = questionKey
    await touch(deps, current, token, { plan })
  }
  const first = await ask(questionKey, baseMessages)
  try {
    const questions = validateQuestions(extractJson(first))
    return save(deps, current, token, {
      status: 'ready',
      progress: 100,
      stage: STAGE.ready,
      questions,
      attempts: (current.attempts || 0) + 1,
      error: '',
      error_code: '',
      plan,
    })
  } catch (error) {
    if (error.code !== 'invalid_questions' || plan.repaired) {
      throw fail(502, 'Savollar formati noto‘g‘ri chiqdi. Qayta urinib ko‘ring.', 'invalid_questions')
    }
    const repairKey = plan.questionRepairKey || deps.uuid()
    plan.repaired = true
    plan.questionRepairKey = repairKey
    await touch(deps, current, token, { plan, attempts: (current.attempts || 0) + 1 })
    const second = await ask(repairKey, [...baseMessages, { role: 'assistant', content: first.slice(0, 4000) }, { role: 'user', content: repairUserPrompt(error.message) }])
    try {
      const questions = validateQuestions(extractJson(second))
      return save(deps, current, token, {
        status: 'ready',
        progress: 100,
        stage: STAGE.ready,
        questions,
        attempts: (current.attempts || 0) + 1,
        error: '',
        error_code: '',
        plan,
      })
    } catch {
      throw fail(502, 'Savollar formati noto‘g‘ri chiqdi. Qayta urinib ko‘ring.', 'invalid_questions')
    }
  }
}

async function runLocked(deps, job, token) {
  const started = deps.now()
  if (job.status === 'queued' || job.status === 'resolving') return resolveSource(deps, job, token)
  if (job.status === 'extracting') return extractSlice(deps, job, token, started)
  if (job.status === 'uploading') return uploadAudio(deps, job, token)
  if (job.status === 'transcribing') return pollStt(deps, job, token)
  if (job.status === 'cleaning') return cleanTranscript(deps, job, token)
  if (job.status === 'generating') return generateQuestions(deps, job, token)
  return job
}

async function assertOwner(deps, userId, courseId) {
  const profile = await maybe(deps.admin, 'profiles', 'id', userId, 'role, org_status')
  const teacher = profile?.role === 'admin' || (profile?.role === 'organizer' && profile?.org_status === 'approved')
  if (!teacher) throw fail(403, 'Savol tuzish uchun tasdiqlangan tashkilotchi kerak')
  const course = await maybe(deps.admin, 'courses', 'id', courseId, 'id, author_id')
  if (!course || (course.author_id !== userId && profile.role !== 'admin')) throw fail(403, 'Bu dars sizga tegishli emas')
  return profile
}

export async function beginQuizGeneration(deps, { userId, lessonId }) {
  if (!UUID.test(String(lessonId || ''))) throw fail(400, 'Dars identifikatori noto‘g‘ri')
  const profile = await maybe(deps.admin, 'profiles', 'id', userId, 'role, org_status')
  const teacher = profile?.role === 'admin' || (profile?.role === 'organizer' && profile?.org_status === 'approved')
  if (!teacher) throw fail(403, 'Savol tuzish uchun tasdiqlangan tashkilotchi kerak')
  const lesson = await maybe(
    deps.admin,
    'course_lessons',
    'id',
    lessonId,
    'id, title, bunny_video_id, course_id, encoding_status, duration_seconds',
  )
  if (!lesson) throw fail(404, 'Dars topilmadi. Avval kursni qoralama sifatida saqlang')
  const course = await maybe(deps.admin, 'courses', 'id', lesson.course_id, 'id, author_id, title')
  if (!course || (course.author_id !== userId && profile.role !== 'admin')) throw fail(403, 'Bu dars sizga tegishli emas')
  if (!lesson.bunny_video_id) throw fail(400, 'Avval dars videosini yuklang')
  if (lesson.encoding_status !== 'finished') throw fail(400, 'Video hali tayyor emas. Qayta ishlash tugagach urinib ko‘ring.')
  if (!String(deps.env.VOICELAB_API_KEY || '').trim()) throw fail(503, 'Savol tuzish hali sozlanmagan', 'not_configured')
  if (!bunnyConfigured(deps.env).ok) throw fail(503, 'Video xizmati sozlanmagan', 'bunny')

  const recent = await listJobs(deps.admin, lessonId)
  const active = recent.find((job) => !['ready', 'failed'].includes(job.status))
  if (active) return { ok: true, job: publicJob(active), reused: true }
  const dayAgo = deps.now() - 24 * 60 * 60 * 1000
  const used = recent.filter((job) => Date.parse(job.created_at) >= dayAgo && countsTowardLimit(job)).length
  if (used >= QUIZ_DAILY_LIMIT) {
    throw fail(429, 'Bu dars uchun kunlik limit (3 marta) tugadi. Ertaga qayta urinib ko‘ring.', 'rate_limit')
  }
  const { data, error } = await deps.admin.from('course_quiz_jobs').insert({
    lesson_id: lessonId,
    course_id: course.id,
    created_by: userId,
    status: 'queued',
    progress: 2,
    stage: STAGE.queued,
    error: '',
    error_code: '',
    stt_id: '',
    llm_model: '',
    transcript_raw: '',
    transcript_clean: '',
    questions: [],
    plan: { durationSeconds: lesson.duration_seconds || 0 },
    attempts: 0,
    lock_token: '',
    locked_until: null,
  }).select('*').maybeSingle()
  if (error) throw mapDb(error)
  return { ok: true, job: publicJob(data) }
}

export async function tickQuizJob(deps, { userId, jobId, lessonId }) {
  let job = null
  if (jobId) {
    if (!UUID.test(String(jobId))) throw fail(400, 'Jarayon identifikatori noto‘g‘ri')
    job = await maybe(deps.admin, 'course_quiz_jobs', 'id', jobId, '*')
    if (!job || (lessonId && job.lesson_id !== lessonId)) throw fail(404, 'Jarayon topilmadi')
  } else if (lessonId) {
    if (!UUID.test(String(lessonId))) throw fail(400, 'Dars identifikatori noto‘g‘ri')
    const recent = await listJobs(deps.admin, lessonId)
    job = recent[0] || null
    if (!job) return { ok: true, job: null }
  } else {
    throw fail(400, 'Dars identifikatori noto‘g‘ri')
  }
  await assertOwner(deps, userId, job.course_id)
  if (job.status === 'ready' || job.status === 'failed') return { ok: true, job: publicJob(job) }
  const token = await claim(deps, job)
  if (!token) return { ok: true, job: publicJob(job), busy: true }
  try {
    const next = await runLocked(deps, { ...job, lock_token: token }, token)
    return { ok: true, job: publicJob(next) }
  } catch (error) {
    if (error?.transient) {
      try {
        const saved = await save(deps, job, token, {
          status: job.status,
          stage: job.stage,
          progress: job.progress,
        })
        return { ok: true, job: publicJob(saved), retry: true }
      } catch { /* qulf muddati bilan qayta ochiladi */ }
      return { ok: true, job: publicJob(job), retry: true }
    }
    const message = clientMessage(error)
    try {
      const saved = await save(deps, job, token, {
        status: 'failed',
        stage: STAGE.failed,
        error: message,
        error_code: error.code || '',
        progress: job.progress || 0,
      })
      return { ok: true, job: publicJob(saved) }
    } catch {
      throw error.status ? error : fail(500, message)
    }
  }
}
