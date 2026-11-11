import { randomUUID } from 'node:crypto'
import { readJson, send } from './http.js'
import { adminClient, anonClient } from './supabaseAdmin.js'
import { bunnyConfigured, bunnySignature, mapBunnyStatus } from './bunny.js'
import { beginQuizGeneration, tickQuizJob } from './quizJob.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TUS = 'https://video.bunnycdn.com/tusupload'

function fail(status, error) {
  const err = new Error(error)
  err.status = status
  return err
}

async function requireUser(req) {
  const token = String(req.headers.authorization || req.headers.Authorization || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) throw fail(401, 'Kirish kerak')
  const { data, error } = await anonClient().auth.getUser(token)
  if (error || !data?.user) throw fail(401, 'Sessiya yaroqsiz. Qayta kiring')
  return data.user
}

async function ownedLesson(userId, lessonId) {
  if (!UUID.test(String(lessonId || ''))) throw fail(400, 'Dars identifikatori noto‘g‘ri')
  const admin = adminClient()
  const { data: profile, error: profileError } = await admin.from('profiles').select('role, org_status').eq('id', userId).maybeSingle()
  if (profileError) throw profileError
  const teacher = profile?.role === 'admin' || (profile?.role === 'organizer' && profile?.org_status === 'approved')
  if (!teacher) throw fail(403, 'Video yuklash uchun tasdiqlangan tashkilotchi kerak')
  const { data: lesson, error: lessonError } = await admin.from('course_lessons').select('id, title, bunny_video_id, course_id').eq('id', lessonId).maybeSingle()
  if (lessonError) throw lessonError
  if (!lesson) throw fail(404, 'Dars topilmadi. Avval kursni qoralama sifatida saqlang')
  const { data: course, error: courseError } = await admin.from('courses').select('id, author_id, title').eq('id', lesson.course_id).maybeSingle()
  if (courseError) throw courseError
  if (!course || (course.author_id !== userId && profile.role !== 'admin')) throw fail(403, 'Bu dars sizga tegishli emas')
  return { admin, lesson, course }
}

async function bunnyFetch(path, options = {}) {
  const { libraryId, apiKey, ok } = bunnyConfigured()
  if (!ok) throw fail(503, 'Video xizmati sozlanmagan')
  const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}${path}`, {
    ...options,
    headers: {
      AccessKey: apiKey,
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  })
  const text = await res.text()
  let data = {}
  try { data = text ? JSON.parse(text) : {} } catch { data = { raw: text.slice(0, 200) } }
  if (!res.ok) {
    const message = data?.Message || data?.message || data?.title || 'Bunny so‘rovi muvaffaqiyatsiz'
    throw fail(502, String(message).slice(0, 180))
  }
  return { libraryId, data }
}

async function createUpload(req) {
  const user = await requireUser(req)
  const body = await readJson(req)
  const { admin, lesson, course } = await ownedLesson(user.id, body.lessonId)
  const title = String(body.title || lesson.title || course.title || 'Dars').trim().slice(0, 120)
  const { libraryId, data } = await bunnyFetch('/videos', { method: 'POST', body: JSON.stringify({ title }) })
  const videoId = data.guid || data.videoId
  if (!videoId) throw fail(502, 'Video identifikatori kelmadi')
  const previous = lesson.bunny_video_id && lesson.bunny_video_id !== videoId ? lesson.bunny_video_id : ''
  const { error } = await admin.from('course_lessons').update({
    bunny_video_id: videoId,
    encoding_status: 'created',
    duration_seconds: 0,
  }).eq('id', lesson.id)
  if (error) throw error
  if (previous) {
    bunnyFetch(`/videos/${previous}`, { method: 'DELETE' }).catch(() => {})
  }
  const expire = Math.floor(Date.now() / 1000) + 24 * 60 * 60
  const { apiKey } = bunnyConfigured()
  return {
    ok: true,
    videoId,
    libraryId,
    expire,
    signature: bunnySignature({ libraryId, apiKey, videoId, expire }),
    endpoint: TUS,
  }
}

async function refreshStatus(req) {
  const user = await requireUser(req)
  const body = req.method === 'GET' ? {} : await readJson(req)
  const qs = new URLSearchParams((req.url || '').split('?')[1] || '')
  const lessonId = body.lessonId || qs.get('lessonId')
  const { admin, lesson } = await ownedLesson(user.id, lessonId)
  if (!lesson.bunny_video_id) return { ok: true, encoding: 'empty', duration: 0, encodeProgress: 0, ready: false }
  const { data } = await bunnyFetch(`/videos/${lesson.bunny_video_id}`)
  const mapped = mapBunnyStatus(data)
  const { error } = await admin.from('course_lessons').update({
    encoding_status: mapped.encoding,
    duration_seconds: mapped.duration,
  }).eq('id', lesson.id)
  if (error) throw error
  return { ok: true, videoId: lesson.bunny_video_id, ...mapped }
}

function configBody() {
  const { libraryId } = bunnyConfigured()
  return { ok: true, libraryId: libraryId || '805789', embedHost: 'iframe.mediadelivery.net' }
}

function quizDeps() {
  return { admin: adminClient(), fetch: globalThis.fetch, env: process.env, now: () => Date.now(), uuid: () => randomUUID() }
}

async function sendQuiz(res, work) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  if (typeof res.flushHeaders === 'function') res.flushHeaders()
  try {
    const body = await work()
    if (!res.writableEnded) res.end(JSON.stringify(body))
  } catch (error) {
    const status = error.status || 500
    if (status >= 500 && status !== 502 && status !== 503) console.error('talim quiz', error.message)
    const hidden = status >= 500 && status !== 502 && status !== 503
    const payload = { ok: false, error: hidden ? 'Savol tuzishda xato' : error.message, code: error.code || '' }
    if (!res.headersSent) res.statusCode = status
    if (!res.writableEnded) res.end(JSON.stringify(payload))
  }
}

export async function handleTalim(req, res) {
  try {
    const qs = new URLSearchParams((req.url || '').split('?')[1] || '')
    const hinted = qs.get('action') || ''
    if (req.method === 'GET' && hinted !== 'status') return send(res, 200, configBody())
    const peek = req.method === 'GET' ? {} : await readJson(req)
    const action = hinted || peek.action || (req.method === 'GET' ? 'status' : '')
    const ctx = { headers: req.headers, url: req.url, method: req.method, body: peek }
    if (action === 'config') return send(res, 200, configBody())
    if (action === 'create') return send(res, 200, await createUpload(ctx))
    if (action === 'status') return send(res, 200, await refreshStatus(ctx))
    if (action === 'quiz-start' || action === 'quiz-status') {
      const qsLesson = qs.get('lessonId') || ''
      const lessonId = peek.lessonId || qsLesson
      const jobId = peek.jobId || qs.get('jobId') || ''
      return sendQuiz(res, async () => {
        const user = await requireUser(ctx)
        if (action === 'quiz-start') return beginQuizGeneration(quizDeps(), { userId: user.id, lessonId })
        return tickQuizJob(quizDeps(), { userId: user.id, lessonId, jobId })
      })
    }
    return send(res, 400, { ok: false, error: 'Noma’lum amal' })
  } catch (error) {
    const status = error.status || 500
    if (status >= 500) console.error('talim', error.message)
    return send(res, status, { ok: false, error: status >= 500 && status !== 502 && status !== 503 ? 'Video xizmatida xato' : error.message })
  }
}
