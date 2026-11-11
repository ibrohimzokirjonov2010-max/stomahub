import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function explain(error) {
  const msg = error?.message || String(error || '')
  if (/could not find the function|schema cache|does not exist|PGRST202|PGRST205/i.test(msg)) {
    return 'Kurslar bazasi hali ulanmagan. supabase/migrations/0072_courses.sql ni qo‘llang.'
  }
  if (/JWT|Kirish kerak/i.test(msg)) return 'Davom etish uchun kiring'
  return msg || 'Amal bajarilmadi'
}

async function rpc(name, args) {
  if (!supabase) throw new Error('Supabase sozlanmagan')
  const { data, error } = await supabase.rpc(name, args || {})
  if (error) throw error
  return data
}

async function authHeader() {
  const { data } = supabase ? await supabase.auth.getSession() : { data: {} }
  const token = data?.session?.access_token || ''
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function talim(action, payload = {}) {
  const res = await fetch(`/api/talim?action=${encodeURIComponent(action)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ action, ...payload }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.ok === false) throw new Error(body.error || 'Video xizmati javob bermadi')
  return body
}

export const listCatalog = () => rpc('course_catalog')
export const myCourses = () => rpc('my_courses')
export const loadPlayer = (courseId) => rpc('course_player', { p_course_id: courseId })
export const saveCourse = (payload) => rpc('course_save', { p_payload: payload })
export const loadEditor = (courseId) => rpc('course_editor', { p_course_id: courseId })
export const enrollCourse = (courseId) => rpc('course_enroll', { p_course_id: courseId })
export const reportProgress = (lessonId, position) => rpc('course_report_progress', { p_lesson_id: lessonId, p_position: position })
export const submitQuiz = (lessonId, answers) => rpc('course_submit_quiz', { p_lesson_id: lessonId, p_answers: answers })
export const authoredCourses = () => rpc('course_authored')
export const deleteCourse = (courseId) => rpc('course_delete', { p_course_id: courseId })
export const refreshVideo = (lessonId) => talim('status', { lessonId })
export const startQuizFromVideo = (lessonId) => talim('quiz-start', { lessonId })
export const pollQuizJob = (lessonId, jobId) => talim('quiz-status', { lessonId, jobId })

export async function bunnyLibraryId() {
  try {
    const res = await fetch('/api/talim?action=config')
    const body = await res.json()
    if (body?.libraryId) return String(body.libraryId)
  } catch { /* lokal kutubxona */ }
  return '805789'
}

export function embedUrl(libraryId, videoId) {
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=true&responsive=true`
}

export async function uploadLessonVideo(lessonId, file, title, onProgress) {
  const created = await talim('create', { lessonId, title })
  const { Upload } = await import('tus-js-client')
  await new Promise((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: created.endpoint,
      retryDelays: [0, 1000, 3000, 5000, 10000, 20000, 60000],
      chunkSize: 8 * 1024 * 1024,
      headers: {
        AuthorizationSignature: created.signature,
        AuthorizationExpire: String(created.expire),
        VideoId: created.videoId,
        LibraryId: String(created.libraryId),
      },
      metadata: { filetype: file.type || 'video/mp4', title: title || file.name },
      onError: (error) => reject(error instanceof Error ? error : new Error(String(error?.message || error || 'Yuklash to‘xtadi'))),
      onProgress: (sent, total) => onProgress?.(sent, total),
      onSuccess: () => resolve(),
    })
    upload.findPreviousUploads().then((prev) => {
      if (prev.length) upload.resumeFromPreviousUpload(prev[0])
      upload.start()
    }).catch(() => upload.start())
  })
  return refreshVideo(lessonId)
}

export function devShot(key) {
  try {
    if (!import.meta.env?.DEV || typeof window === 'undefined') return null
    return window.__STOMAHUB_COURSE_SHOT__?.[key] ?? null
  } catch {
    return null
  }
}

export function useCourseCatalog() {
  const [state, setState] = useState({ rows: [], status: 'loading', error: '' })
  useEffect(() => {
    const shot = devShot('catalog')
    if (shot) {
      setState({ rows: shot, status: 'ready', error: '' })
      return undefined
    }
    let stop = false
    listCatalog()
      .then((rows) => { if (!stop) setState({ rows: Array.isArray(rows) ? rows : [], status: 'ready', error: '' }) })
      .catch((error) => { if (!stop) setState({ rows: [], status: 'error', error: explain(error) }) })
    return () => { stop = true }
  }, [])
  return state
}

export function useMyCourses() {
  const [state, setState] = useState({ rows: [], status: 'loading', error: '' })
  const reload = () => {
    const shot = devShot('mine')
    if (shot) {
      setState({ rows: shot, status: 'ready', error: '' })
      return Promise.resolve(shot)
    }
    return myCourses()
      .then((rows) => {
        const list = Array.isArray(rows) ? rows : []
        setState({ rows: list, status: 'ready', error: '' })
        return list
      })
      .catch((error) => {
        setState({ rows: [], status: 'error', error: explain(error) })
        return []
      })
  }
  useEffect(() => { reload() }, [])
  return { ...state, reload }
}

export { explain as courseError }
