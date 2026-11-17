import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { authoredCourses, courseError, deleteCourse, loadEditor, saveCourse } from '../courseApi'

/** 0078 qo‘llanmagan: yangi RPC topilmaydi. */
export function isMissing(error) {
  const msg = String(error?.message || error || '')
  return /could not find the function|schema cache|does not exist|PGRST202|PGRST205/i.test(msg)
}

export const MIGRATION_NOTE = 'To‘liq statistika, o‘quvchilar va to‘lovlar 0078 migratsiyasi qo‘llangach chiqadi.'

/** DEV skrinshotlar uchun soxta ma’lumot (prod buildda null). */
export function authorShot() {
  try {
    if (!import.meta.env?.DEV || typeof window === 'undefined') return null
    return window.__STOMAHUB_AUTHOR_SHOT__ || null
  } catch {
    return null
  }
}

async function rpc(name, args) {
  if (!supabase) throw new Error('Supabase sozlanmagan')
  const { data, error } = await supabase.rpc(name, args || {})
  if (error) throw error
  return data
}

function okOrThrow(body, fallback) {
  if (body && body.ok === false) throw new Error(body.error || fallback)
  return body
}

/** Kurslarim: 0078 bo‘lsa to‘liq, bo‘lmasa eski course_authored(). */
export async function listMyCourses() {
  const shot = authorShot()
  if (shot?.courses) return { rows: shot.courses, legacy: !!shot.missing }
  try {
    const rows = await rpc('course_author_courses')
    return { rows: Array.isArray(rows) ? rows : [], legacy: false }
  } catch (error) {
    if (!isMissing(error)) throw error
    const rows = await authoredCourses()
    return {
      rows: (Array.isArray(rows) ? rows : []).map((row) => ({ ...row, updatedAt: row.updated_at, completed: null, paidSum: null, pendingSum: null })),
      legacy: true,
    }
  }
}

export async function loadDashboard() {
  const shot = authorShot()
  if (shot?.dashboard) return { ...shot.dashboard, legacy: !!shot.missing }
  try {
    return { ...okOrThrow(await rpc('course_author_dashboard'), 'Panel ochilmadi'), legacy: false }
  } catch (error) {
    if (!isMissing(error)) throw error
    const { rows } = await listMyCourses()
    const enrolled = rows.reduce((sum, row) => sum + (Number(row.enrolled) || 0), 0)
    return {
      legacy: true,
      totals: {
        courses: rows.length,
        published: rows.filter((row) => row.status === 'published').length,
        review: 0,
        draft: rows.filter((row) => row.status === 'draft').length,
        students: null,
        enrollments: enrolled,
        active: null,
        completed: null,
        paidSum: null,
        pendingSum: null,
        certificates: null,
      },
      monthly: [],
      recent: [],
      top: rows.filter((row) => row.enrolled > 0).sort((a, b) => b.enrolled - a.enrolled).slice(0, 5)
        .map((row) => ({ id: row.id, title: row.title, cover: row.cover, status: row.status, price: row.price, enrolled: row.enrolled, completed: null, paidSum: null })),
    }
  }
}

export async function listStudents(courseId = null) {
  const shot = authorShot()
  if (shot?.students) return { rows: courseId ? shot.students.filter((row) => row.courseId === courseId) : shot.students, legacy: !!shot.missing }
  try {
    const rows = await rpc('course_author_students', { p_course_id: courseId })
    return { rows: Array.isArray(rows) ? rows : [], legacy: false }
  } catch (error) {
    if (!isMissing(error)) throw error
    return { rows: [], legacy: true }
  }
}

export async function listPayments() {
  const shot = authorShot()
  if (shot?.payments) return { rows: shot.payments, legacy: !!shot.missing }
  try {
    const rows = await rpc('course_author_payments')
    return { rows: Array.isArray(rows) ? rows : [], legacy: false }
  } catch (error) {
    if (!isMissing(error)) throw error
    return { rows: [], legacy: true }
  }
}

export async function markPaid(courseId, userId, method, note) {
  if (authorShot()) return { ok: true, row: null }
  return okOrThrow(await rpc('course_author_mark_paid', { p_course_id: courseId, p_user_id: userId, p_method: method, p_note: note || '' }), 'Belgilanmadi')
}

/** submit | withdraw | unpublish. 0078 yo‘q bo‘lsa eski course_save orqali. */
export async function setCourseStatus(courseId, action) {
  if (authorShot()) return { ok: true, status: action === 'submit' ? 'review' : 'draft' }
  try {
    return okOrThrow(await rpc('course_author_set_status', { p_course_id: courseId, p_action: action }), 'Holat o‘zgarmadi')
  } catch (error) {
    if (!isMissing(error)) throw error
    const body = await loadEditor(courseId)
    if (!body?.ok) throw new Error(body?.error || 'Kurs ochilmadi')
    const status = action === 'submit' ? 'published' : 'draft'
    const saved = await saveCourse(legacyPayload(body.course, body.lessons, status))
    return okOrThrow({ ...saved, status }, 'Saqlanmadi')
  }
}

export async function duplicateCourse(courseId) {
  if (authorShot()) return { ok: true, id: courseId }
  try {
    return okOrThrow(await rpc('course_author_duplicate', { p_course_id: courseId }), 'Nusxa olinmadi')
  } catch (error) {
    if (!isMissing(error)) throw error
    const body = await loadEditor(courseId)
    if (!body?.ok) throw new Error(body?.error || 'Kurs ochilmadi')
    const copy = legacyPayload({ ...body.course, id: undefined, title: `${body.course.title} (nusxa)` }, (body.lessons || []).map((lesson) => ({ ...lesson, id: undefined })), 'draft')
    return okOrThrow(await saveCourse(copy), 'Nusxa olinmadi')
  }
}

export async function removeCourse(courseId) {
  if (authorShot()) return { ok: true }
  return okOrThrow(await deleteCourse(courseId), 'O‘chirilmadi')
}

export async function loadExtras(courseId) {
  try {
    const body = await rpc('course_author_extras', { p_course_id: courseId })
    return body?.ok ? { ...body, legacy: false } : { legacy: false, course: {}, lessons: [] }
  } catch (error) {
    if (!isMissing(error)) throw error
    return { legacy: true, course: {}, lessons: [] }
  }
}

export async function saveExtras(courseId, payload) {
  try {
    okOrThrow(await rpc('course_author_save_extras', { p_course_id: courseId, p_payload: payload }), 'Qo‘shimcha maydonlar saqlanmadi')
    return { saved: true }
  } catch (error) {
    if (!isMissing(error)) throw error
    return { saved: false, legacy: true }
  }
}

function legacyPayload(course, lessons, status) {
  return {
    id: course.id || undefined,
    title: course.title,
    description: course.description,
    direction: course.direction,
    level: course.level,
    format: course.format,
    price: Number(course.price) || 0,
    coverUrl: course.coverUrl || '',
    status,
    lessons: (lessons || []).map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      moduleTitle: lesson.moduleTitle,
      passThreshold: lesson.passThreshold,
      maxMistakes: lesson.maxMistakes,
      points: lesson.points,
      questions: (lesson.questions || []).map((q) => ({ prompt: q.prompt, options: q.options, correctIndex: q.correctIndex })),
    })),
  }
}

/** Oddiy yuklash hook’i: { data, status, error, reload }. */
export function useLoad(fn, deps = []) {
  const [state, setState] = useState({ data: null, status: 'loading', error: '' })
  const run = useCallback(() => {
    setState((prev) => ({ ...prev, status: prev.data ? 'refresh' : 'loading', error: '' }))
    return fn()
      .then((data) => { setState({ data, status: 'ready', error: '' }); return data })
      .catch((error) => { setState({ data: null, status: 'error', error: courseError(error) }); return null })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => { run() }, [run])
  return { ...state, reload: run }
}

/** CSV: Excel uchun BOM + nuqta-vergul. */
export function downloadCsv(filename, head, rows) {
  const esc = (value) => {
    const text = value == null ? '' : String(value)
    return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const body = [head, ...rows].map((row) => row.map(esc).join(';')).join('\r\n')
  const blob = new Blob(['\ufeff', body], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}
