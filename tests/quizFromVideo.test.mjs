import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { bunnyConfigured, pickLessonAudioSource } from '../api/_lib/bunny.js'
import { applyDentalFixes } from '../api/_lib/dentalGlossary.js'
import { audioPlanFromMoov, buildM4a, scanForMoov, splitFrames } from '../api/_lib/mp4Audio.js'
import { extractJson, validateQuestions } from '../api/_lib/quizDraft.js'
import { beginQuizGeneration, publicJob, tickQuizJob } from '../api/_lib/quizJob.js'
import { pickVoiceLabModel } from '../api/_lib/voicelab.js'

const root = path.resolve(import.meta.dirname, '..')

function u32(n) {
  const buf = Buffer.alloc(4)
  buf.writeUInt32BE(n >>> 0, 0)
  return buf
}

function box(type, payload) {
  const out = Buffer.alloc(8 + payload.length)
  out.writeUInt32BE(out.length, 0)
  out.write(type, 4, 4, 'latin1')
  payload.copy(out, 8)
  return out
}

function fullBox(type, payload) {
  const head = Buffer.alloc(4)
  return box(type, Buffer.concat([head, payload]))
}

function mp4aEntry() {
  const head = Buffer.alloc(28)
  head.writeUInt16BE(1, 6)
  head.writeUInt16BE(2, 16)
  head.writeUInt16BE(16, 18)
  head.writeUInt32BE((44100 * 65536) >>> 0, 24)
  const esds = Buffer.from([
    0x03, 0x19, 0x00, 0x01, 0x00,
    0x04, 0x11, 0x40, 0x15, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x05, 0x02, 0x12, 0x10,
    0x06, 0x01, 0x02,
  ])
  return box('mp4a', Buffer.concat([head, fullBox('esds', esds)]))
}

function audioTrak(offsets, sizes) {
  const mdhd = fullBox('mdhd', Buffer.concat([u32(0), u32(0), u32(44100), u32(1024 * sizes.length), Buffer.alloc(4)]))
  const hdlr = fullBox('hdlr', Buffer.concat([u32(0), Buffer.from('soun'), Buffer.alloc(12), Buffer.from('SoundHandler\0')]))
  const stsd = fullBox('stsd', Buffer.concat([u32(1), mp4aEntry()]))
  const stts = fullBox('stts', Buffer.concat([u32(1), u32(sizes.length), u32(1024)]))
  const stsc = fullBox('stsc', Buffer.concat([u32(1), u32(1), u32(1), u32(1)]))
  const stszBody = Buffer.concat([u32(0), u32(sizes.length), ...sizes.map(u32)])
  const stsz = fullBox('stsz', stszBody)
  const stco = fullBox('stco', Buffer.concat([u32(offsets.length), ...offsets.map(u32)]))
  const minf = box('minf', box('stbl', Buffer.concat([stsd, stts, stsc, stsz, stco])))
  return box('trak', box('mdia', Buffer.concat([mdhd, hdlr, minf])))
}

function videoTrak() {
  const hdlr = fullBox('hdlr', Buffer.concat([u32(0), Buffer.from('vide'), Buffer.alloc(12), Buffer.from('VideoHandler\0')]))
  return box('trak', box('mdia', hdlr))
}

function lessonFile() {
  const frames = [Buffer.from('AAAA'), Buffer.from('BBBBBB'), Buffer.from('CCC')]
  const gapA = Buffer.alloc(80)
  const gapB = Buffer.alloc(40)
  const payload = Buffer.concat([frames[0], gapA, frames[1], gapB, frames[2]])
  const ftyp = box('ftyp', Buffer.from('isom'))
  const probe = box('moov', Buffer.concat([videoTrak(), audioTrak([0, 0, 0], frames.map((frame) => frame.length))]))
  const dataStart = ftyp.length + probe.length + 8
  const offsets = [dataStart, dataStart + frames[0].length + gapA.length, dataStart + frames[0].length + gapA.length + frames[1].length + gapB.length]
  const moov = box('moov', Buffer.concat([videoTrak(), audioTrak(offsets, frames.map((frame) => frame.length))]))
  const file = Buffer.concat([ftyp, moov, box('mdat', payload)])
  return { file, frames }
}

function memoryAdmin(seed = {}) {
  const tables = {
    profiles: [...(seed.profiles || [])],
    courses: [...(seed.courses || [])],
    course_lessons: [...(seed.lessons || [])],
    course_quiz_jobs: [...(seed.jobs || [])],
  }
  const files = new Map()
  class Builder {
    constructor(name) {
      this.name = name
      this.filters = []
      this.op = 'select'
      this.patch = null
      this.row = null
      this.one = false
      this.limitN = null
      this.orderBy = null
    }
    select() { return this }
    insert(row) { this.op = 'insert'; this.row = row; return this }
    update(patch) { this.op = 'update'; this.patch = patch; return this }
    eq(col, val) { this.filters.push((row) => row[col] === val); return this }
    order(col, opts = {}) { this.orderBy = { col, ascending: opts.ascending !== false }; return this }
    limit(n) { this.limitN = n; return this }
    maybeSingle() { this.one = true; return this }
    then(resolve, reject) {
      try { resolve(this.exec()) } catch (error) { reject(error) }
    }
    exec() {
      const table = tables[this.name]
      if (!table) return { data: null, error: { message: `relation ${this.name} does not exist` } }
      if (this.op === 'insert') {
        const row = {
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          lock_token: '',
          locked_until: null,
          stt_id: '',
          stt_idempotency_key: null,
          error: '',
          error_code: '',
          attempts: 0,
          ...this.row,
        }
        table.push(row)
        return { data: row, error: null }
      }
      let rows = table.filter((row) => this.filters.every((fn) => fn(row)))
      if (this.op === 'update') {
        rows.forEach((row) => Object.assign(row, this.patch, { updated_at: new Date().toISOString() }))
        return { data: this.one ? (rows[0] || null) : rows, error: null }
      }
      if (this.orderBy) {
        const { col, ascending } = this.orderBy
        rows = rows.slice().sort((a, b) => (a[col] < b[col] ? -1 : a[col] > b[col] ? 1 : 0) * (ascending ? 1 : -1))
      }
      if (this.limitN != null) rows = rows.slice(0, this.limitN)
      return { data: this.one ? (rows[0] || null) : rows, error: null }
    }
  }
  return {
    tables,
    files,
    from(name) { return new Builder(name) },
    storage: {
      from() {
        return {
          async upload(filePath, body) {
            files.set(filePath, Buffer.from(body))
            return { error: null }
          },
          async download(filePath) {
            if (!files.has(filePath)) return { data: null, error: { message: 'not found' } }
            return { data: files.get(filePath), error: null }
          },
          async remove(paths) {
            for (const filePath of paths) files.delete(filePath)
            return { error: null }
          },
        }
      },
    },
  }
}

const ids = {
  user: '11111111-1111-4111-8111-111111111111',
  other: '22222222-2222-4222-8222-222222222222',
  course: '33333333-3333-4333-8333-333333333333',
  lesson: '44444444-4444-4444-8444-444444444444',
}

function world({ role = 'organizer', org = 'approved', author = ids.user, jobs = [] } = {}) {
  return memoryAdmin({
    profiles: [{ id: ids.user, role, org_status: org }],
    courses: [{ id: ids.course, author_id: author, title: 'Tsirkon' }],
    lessons: [{
      id: ids.lesson,
      title: 'Ustup',
      bunny_video_id: 'vid-1',
      course_id: ids.course,
      encoding_status: 'finished',
      duration_seconds: 125,
    }],
    jobs,
  })
}

function question(index) {
  return {
    prompt: `${index}-savol: ustup qayerda olinadi, aniq aytildimi?`,
    options: ['Gingiva chetida', 'Kanal ichida', 'Implant vintida', 'Faqat okklyuziyada'],
    correctIndex: 0,
    explanation: 'Transkriptda gingiva cheti aytilgan.',
    quote: 'Ustupni gingiva chetida olamiz',
    timestampSec: 12 + index,
  }
}

function goodQuestions() {
  return { questions: [1, 2, 3, 4, 5].map(question) }
}

test('MP4 dan faqat AAC olinadi va m4a ga yig‘iladi', () => {
  const { file, frames } = lessonFile()
  const top = scanForMoov(file, 0, file.length)
  assert.ok(top.moov)
  const plan = audioPlanFromMoov(top.moov)
  assert.equal(plan.ranges.length, 3)
  const joined = Buffer.concat(plan.ranges.map((range) => file.subarray(range.start, range.end)))
  const got = splitFrames(joined, plan.sizes)
  assert.deepEqual(got.map((frame) => frame.toString()), frames.map((frame) => frame.toString()))
  const m4a = buildM4a({ frames: got, sampleEntry: plan.sampleEntry, timescale: plan.timescale, sampleDelta: plan.sampleDelta })
  assert.equal(m4a.toString('latin1', 4, 8), 'ftyp')
  const again = audioPlanFromMoov(scanForMoov(m4a, 0, m4a.length).moov)
  const round = splitFrames(Buffer.concat(again.ranges.map((range) => m4a.subarray(range.start, range.end))), again.sizes)
  assert.deepEqual(round.map((frame) => frame.toString()), frames.map((frame) => frame.toString()))

  const ftyp = box('ftyp', Buffer.from('isom'))
  const mdatHeader = Buffer.alloc(8)
  mdatHeader.writeUInt32BE(400, 0)
  mdatHeader.write('mdat', 4, 4, 'latin1')
  const lateMoov = box('moov', Buffer.from('late'))
  const lateFile = Buffer.concat([ftyp, mdatHeader, Buffer.alloc(392), lateMoov])
  const head = lateFile.subarray(0, ftyp.length + 8)
  const skipped = scanForMoov(head, 0, lateFile.length)
  assert.equal(skipped.continueFrom, ftyp.length + 400)
  const tail = scanForMoov(lateFile.subarray(skipped.continueFrom), skipped.continueFrom, lateFile.length)
  assert.equal(tail.moov.toString('latin1', 4, 8), 'moov')
})

test('lug‘at aniq STT xatolarini tuzatadi, ustozni esa o‘zi almashtirmaydi', () => {
  const fixed = applyDentalFixes("Sirkom plyrovka, rezislar, gruba to'chka, digitalniy, bo'r va bir millionta qadrlikda. Ustoz aytdi.")
  assert.match(fixed, /tsirkon/)
  assert.match(fixed, /polirovka/)
  assert.match(fixed, /retsizlar/)
  assert.match(fixed, /grubaya tochka/)
  assert.match(fixed, /distalniy/)
  assert.match(fixed, /\bbor\b/)
  assert.match(fixed, /bir millimetr qalinlikda/)
  assert.match(fixed, /Ustoz aytdi/)
  assert.equal(fixed.toLowerCase().includes('sirkom'), false)
})

test('savol JSON 4 variant va bitta to‘g‘ri javobni talab qiladi', () => {
  const ok = validateQuestions(goodQuestions())
  assert.equal(ok.length, 5)
  assert.equal(ok[0].correctIndex, 0)
  const extra = goodQuestions()
  extra.questions.push(...[6, 7, 8, 9, 10, 11].map(question))
  assert.equal(validateQuestions(extra).length, 10)
  assert.throws(() => validateQuestions({ questions: [question(1)] }), /5 ta/)
  const bad = goodQuestions()
  bad.questions.push(question(6))
  bad.questions[0] = { ...question(1), options: ['bitta', 'ikkita', 'uchta'] }
  assert.equal(validateQuestions(bad).length, 5)
  assert.throws(() => validateQuestions(extractJson('```json\n{"questions":[]}\n```')), /5 ta/)
})

test('eng past MP4 fallback tanlanadi, bo‘lmasa original', () => {
  const mp4 = pickLessonAudioSource({
    video: { guid: 'vid-1', hasMP4Fallback: true, availableResolutions: '720p,240p,480p' },
    play: { fallbackUrl: 'https://vz.b-cdn.net/vid-1/' },
    cdnHost: 'vz.b-cdn.net',
  })
  assert.equal(mp4.url, 'https://vz.b-cdn.net/vid-1/play_240p.mp4')
  const original = pickLessonAudioSource({
    video: { guid: 'vid-1', hasMP4Fallback: false, availableResolutions: '720p' },
    play: { originalUrl: 'https://vz.b-cdn.net/vid-1/original?token=secret' },
    cdnHost: 'vz.b-cdn.net',
  })
  assert.equal(original.kind, 'original')
  assert.equal(pickLessonAudioSource({ video: { guid: '' }, play: {}, cdnHost: '' }), null)
  assert.equal(pickVoiceLabModel({ data: [{ id: 'aisha-halo' }, { id: 'aisha-orbit', reasoning_efforts: ['low', 'high'] }] }).reasoning, 'low')
  assert.equal(bunnyConfigured({ BUNNY_STREAM_LIBRARY_ID: '805789', BUNNY_STREAM_API_KEY: 'k', BUNNY_STREAM_REFERER: 'https://stomahub-three.vercel.app' }).referer, 'https://stomahub-three.vercel.app/')
})

function scripted(file, { preflight = 200, questions = goodQuestions(), questionFails = 0 } = {}) {
  const calls = []
  let sttPolls = 0
  let questionCalls = 0
  const fetch = async (url, options = {}) => {
    const href = String(url)
    calls.push({ url: href, options })
    const json = (status, body) => ({
      ok: status >= 200 && status < 300,
      status,
      headers: { get: () => null },
      text: async () => JSON.stringify(body),
      arrayBuffer: async () => Buffer.from(JSON.stringify(body)),
    })
    if (href.includes('/videos/vid-1/play')) {
      return json(200, { fallbackUrl: 'https://cdn.example/vid-1/', originalUrl: null })
    }
    if (href.includes('/videos/vid-1')) {
      return json(200, { guid: 'vid-1', status: 4, hasMP4Fallback: true, availableResolutions: '240p,720p', length: 125 })
    }
    if (href.includes('/play_240p.mp4')) {
      const header = options.headers?.Range || 'bytes=0-0'
      const [start, end] = header.replace('bytes=', '').split('-').map(Number)
      const slice = file.subarray(start, Math.min(file.length, end + 1))
      const last = start + slice.length - 1
      return {
        ok: true,
        status: 206,
        headers: { get: (name) => String(name).toLowerCase() === 'content-range' ? `bytes ${start}-${last}/${file.length}` : null },
        text: async () => '',
        arrayBuffer: async () => slice,
      }
    }
    if (href.includes('/v1/stt/preflight')) {
      if (preflight === 402) return json(402, { error: { code: 'insufficient_credits' } })
      return json(200, { can_upload: true, estimated_credits: 10 })
    }
    if (href.endsWith('/v1/stt')) {
      return json(202, { id: 'stt_test', status: 'queued' })
    }
    if (href.includes('/v1/stt/transcriptions/')) {
      sttPolls += 1
      if (sttPolls === 1) return json(200, { id: 'stt_test', status: 'processing' })
      return json(200, {
        id: 'stt_test',
        status: 'completed',
        transcript: 'Sirkom plyrovka haqida. Ustupni gingiva chetida olamiz va bir millimetr qalinlikda qoldiramiz.',
        language: 'uz',
        segments: [
          { start_ms: 12000, end_ms: 18000, text: 'Sirkom plyrovka haqida.' },
          { start_ms: 18000, end_ms: 28000, text: 'Ustupni gingiva chetida olamiz va bir millimetr qalinlikda qoldiramiz.' },
        ],
      })
    }
    if (href.endsWith('/v1/models')) {
      return json(200, { data: [{ id: 'aisha-orbit', reasoning_efforts: ['low', 'medium'] }] })
    }
    if (href.endsWith('/v1/chat/completions')) {
      const body = JSON.parse(options.body)
      const system = body.messages[0].content
      assert.equal(body.model, 'aisha-orbit')
      assert.equal(body.reasoning_effort, 'low')
      if (system.includes('test tuzuvchisan')) {
        questionCalls += 1
        if (questionCalls <= questionFails) return json(200, { choices: [{ message: { content: '{"questions":[]}' } }] })
        return json(200, { choices: [{ message: { content: JSON.stringify(questions) } }] })
      }
      return json(200, { choices: [{ message: { content: body.messages.at(-1).content } }] })
    }
    throw new Error(`kutilmagan so‘rov ${href}`)
  }
  return { fetch, calls }
}

function deps(admin, fetch, envExtra = {}) {
  return {
    admin,
    fetch,
    env: {
      VOICELAB_API_KEY: 'vl-test',
      BUNNY_STREAM_API_KEY: 'bunny-secret',
      BUNNY_STREAM_LIBRARY_ID: '805789',
      BUNNY_STREAM_CDN_HOST: 'cdn.example',
      ...envExtra,
    },
    now: () => Date.now(),
    uuid: () => crypto.randomUUID(),
  }
}

async function untilReady(runtime, lessonId, jobId) {
  let last = null
  for (let i = 0; i < 12; i += 1) {
    last = await tickQuizJob(runtime, { userId: ids.user, lessonId, jobId })
    if (last.job?.status === 'ready' || last.job?.status === 'failed') return last
  }
  return last
}

test('mock Bunny va VoiceLab bilan qoralama savol tugaydi', async () => {
  const { file } = lessonFile()
  const { fetch, calls } = scripted(file)
  const admin = world()
  const runtime = deps(admin, fetch)
  const started = await beginQuizGeneration(runtime, { userId: ids.user, lessonId: ids.lesson })
  assert.equal(started.ok, true)
  assert.equal(started.job.status, 'queued')
  const done = await untilReady(runtime, ids.lesson, started.job.id)
  assert.equal(done.job.status, 'ready', done.job.error)
  assert.equal(done.job.questions.length, 5)
  assert.match(done.job.transcript, /tsirkon/)
  assert.match(done.job.transcript, /polirovka/)
  assert.equal(done.job.questions[0].options.length, 4)
  assert.equal('sourceUrl' in done.job, false)
  const cdn = calls.find((call) => call.url.includes('play_240p.mp4'))
  assert.equal(cdn.options.headers.Referer, 'https://stomahub-three.vercel.app/')
  assert.equal(cdn.options.headers.AccessKey, undefined)
  const bunny = calls.find((call) => call.url.includes('video.bunnycdn.com'))
  assert.equal(bunny.options.headers.AccessKey, 'bunny-secret')
  const stt = calls.find((call) => call.url.endsWith('/v1/stt'))
  assert.equal(stt.options.headers.Authorization, 'Bearer vl-test')
  assert.match(stt.options.headers['Idempotency-Key'], /^[0-9a-f-]{36}$/i)
  assert.equal(stt.options.body.get('language'), 'uz')
  const audio = Buffer.from(await stt.options.body.get('audio').arrayBuffer())
  assert.ok(audio.includes(Buffer.from('ftyp')))
  assert.ok(audio.includes(Buffer.from('AAAA')))
  assert.equal(admin.files.size, 0)
  const row = admin.tables.course_quiz_jobs[0]
  assert.equal(row.questions.length, 5)
  assert.equal(publicJob(row).questions.length, 5)
})

test('noto‘g‘ri JSON bir marta tuzatiladi', async () => {
  const { file } = lessonFile()
  const { fetch } = scripted(file, { questionFails: 1 })
  const admin = world()
  const runtime = deps(admin, fetch)
  const started = await beginQuizGeneration(runtime, { userId: ids.user, lessonId: ids.lesson })
  const done = await untilReady(runtime, ids.lesson, started.job.id)
  assert.equal(done.job.status, 'ready', done.job.error)
  assert.equal(done.job.questions.length, 5)
})

test('VoiceLab 402 kredit tugadi deb yoziladi va STT chaqirilmaydi', async () => {
  const { file } = lessonFile()
  const { fetch, calls } = scripted(file, { preflight: 402 })
  const admin = world()
  const runtime = deps(admin, fetch)
  const started = await beginQuizGeneration(runtime, { userId: ids.user, lessonId: ids.lesson })
  const done = await untilReady(runtime, ids.lesson, started.job.id)
  assert.equal(done.job.status, 'failed')
  assert.equal(done.job.error, 'VoiceLab hisobida kredit tugadi')
  assert.equal(calls.some((call) => call.url.endsWith('/v1/stt')), false)
})

test('kuniga 3 tadan oshmaydi, muvaffaqiyatsiz STT hisobga kirmaydi', async () => {
  const recent = (status, index) => ({
    id: `55555555-5555-4555-8555-55555555555${index}`,
    lesson_id: ids.lesson,
    course_id: ids.course,
    created_by: ids.user,
    status,
    stt_id: status === 'ready' ? 'stt' : '',
    created_at: new Date().toISOString(),
    lock_token: '',
    progress: 100,
    stage: '',
    error: '',
    error_code: '',
    questions: [],
    plan: {},
    transcript_raw: '',
    transcript_clean: '',
  })
  const limited = world({
    jobs: [recent('ready', 1), recent('ready', 2), recent('ready', 3)],
  })
  await assert.rejects(
    () => beginQuizGeneration(deps(limited, async () => { throw new Error('network') }), { userId: ids.user, lessonId: ids.lesson }),
    /kunlik limit/,
  )
  const ignored = world({
    jobs: [1, 2, 3].map((index) => recent('failed', index)),
  })
  const started = await beginQuizGeneration(deps(ignored, async () => { throw new Error('network') }), { userId: ids.user, lessonId: ids.lesson })
  assert.equal(started.job.status, 'queued')
})

test('faqat muallif yoki admin savol tuzadi', async () => {
  const runtimeFor = (seed) => deps(world(seed), async () => { throw new Error('network') })
  await assert.rejects(
    () => beginQuizGeneration(runtimeFor({ role: 'customer', org: '' }), { userId: ids.user, lessonId: ids.lesson }),
    /tashkilotchi/,
  )
  await assert.rejects(
    () => beginQuizGeneration(runtimeFor({ role: 'organizer', org: 'pending' }), { userId: ids.user, lessonId: ids.lesson }),
    /tashkilotchi/,
  )
  await assert.rejects(
    () => beginQuizGeneration(runtimeFor({ author: ids.other }), { userId: ids.user, lessonId: ids.lesson }),
    /tegishli emas/,
  )
  const admin = await beginQuizGeneration(runtimeFor({ role: 'admin', org: '', author: ids.other }), { userId: ids.user, lessonId: ids.lesson })
  assert.equal(admin.ok, true)
})

test('qulflangan jarayon ikkinchi so‘rovda qayta ishlanmaydi', async () => {
  const admin = world()
  let hits = 0
  const fetch = async () => { hits += 1; throw new Error('network') }
  const runtime = deps(admin, fetch)
  const started = await beginQuizGeneration(runtime, { userId: ids.user, lessonId: ids.lesson })
  const row = admin.tables.course_quiz_jobs[0]
  row.lock_token = 'held'
  row.locked_until = new Date(Date.now() + 60_000).toISOString()
  row.status = 'extracting'
  const tick = await tickQuizJob(runtime, { userId: ids.user, jobId: started.job.id, lessonId: ids.lesson })
  assert.equal(tick.busy, true)
  assert.equal(hits, 0)
  assert.equal(row.status, 'extracting')
})

test('migratsiya egasiga o‘qish beradi, yozish bermaydi va funksiya qo‘shmaydi', () => {
  const sql = fs.readFileSync(path.join(root, 'supabase/migrations/0073_course_quiz_jobs.sql'), 'utf8')
  assert.match(sql, /enable row level security/)
  assert.match(sql, /author_id = \(select auth\.uid\(\)\)/)
  assert.match(sql, /p\.role = 'admin'/)
  assert.match(sql, /grant select on public\.course_quiz_jobs to authenticated/)
  assert.equal(/grant insert|grant update|grant delete/i.test(sql), false)
  assert.match(sql, /course-quiz-audio/)
  assert.match(sql, /public = false/)
  const talim = fs.readFileSync(path.join(root, 'api/_lib/talim.js'), 'utf8')
  assert.match(talim, /quiz-start/)
  assert.match(talim, /quiz-status/)
  const apiDir = path.join(root, 'api')
  const files = []
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      if (name.startsWith('_')) continue
      const full = path.join(dir, name)
      if (fs.statSync(full).isDirectory()) walk(full)
      else if (name.endsWith('.js')) files.push(full)
    }
  }
  walk(apiDir)
  assert.equal(files.length, 12)
})
