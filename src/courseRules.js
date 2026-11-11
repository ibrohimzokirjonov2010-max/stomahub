// Tomosha va test qoidalari. SQL (0072_courses.sql) dagi course_report_progress
// va course_submit_quiz shu raqamlarga mos: bir so‘rov bilan darsni ochib bo‘lmaydi.

export const WATCH_UNLOCK_RATIO = 0.9
export const FIRST_CREDIT_SECONDS = 20
export const MAX_CREDIT_PER_REPORT = 30

export function clampThreshold(value) {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return 70
  return Math.min(100, Math.max(1, n))
}

/**
 * Server qabul qiladigan keyingi ko‘rilgan soniya.
 * Birinchi hisobotda ko‘pi bilan 20 s. Keyin faqat o‘tgan haqiqiy soniya (30 s dan oshmaydi),
 * shuning uchun ketma-ket chaqiruvlar darsni darhol ochmaydi.
 */
export function advanceWatch({ watched = 0, reported = 0, elapsed = 0, duration = 0, hasPriorReport = false } = {}) {
  const dur = Math.max(0, Math.floor(Number(duration) || 0))
  const prev = Math.max(0, Math.floor(Number(watched) || 0))
  const pos = Math.max(0, Math.floor(Number(reported) || 0))
  if (dur <= 0) return { watched: prev, ratio: 0, unlocked: false }
  const cap = hasPriorReport
    ? Math.min(MAX_CREDIT_PER_REPORT, Math.max(0, Math.floor(Number(elapsed) || 0)))
    : FIRST_CREDIT_SECONDS
  const next = Math.min(dur, Math.max(prev, Math.min(pos, prev + cap)))
  const ratio = next / dur
  return { watched: next, ratio, unlocked: ratio + 1e-9 >= WATCH_UNLOCK_RATIO }
}

/** To‘g‘ri javoblar qaytmaydi — faqat ball va qaysi savol xato. */
export function gradeQuiz(questions, answers, threshold = 70) {
  const list = Array.isArray(questions) ? questions : []
  const given = new Map((Array.isArray(answers) ? answers : []).map((a) => [String(a?.id ?? a?.questionId ?? ''), Number(a?.choice)]))
  let correct = 0
  const wrongIds = []
  for (const q of list) {
    const id = String(q?.id ?? '')
    const choice = given.has(id) ? given.get(id) : -1
    if (choice === Number(q?.correctIndex) && choice >= 0) correct += 1
    else wrongIds.push(id)
  }
  const total = list.length
  const score = total ? Math.round((100 * correct) / total) : 100
  const passAt = clampThreshold(threshold)
  return { correct, total, score, passed: score >= passAt, threshold: passAt, wrongIds }
}

/** Oldingi darslar yakunlanmasa keyingisi yopiq. Muallif oldindan ko‘rsa — ochiq. */
export function lessonOpen(lessons, index, { preview = false, access = false } = {}) {
  if (preview) return true
  if (!access || index < 0 || index >= lessons.length) return false
  return lessons.slice(0, index).every((lesson) => lesson?.complete)
}

export function coursePercent(lessons) {
  const list = Array.isArray(lessons) ? lessons : []
  if (!list.length) return 0
  const done = list.filter((lesson) => lesson?.complete).length
  return Math.round((100 * done) / list.length)
}

export function averageScore(lessons) {
  const list = Array.isArray(lessons) ? lessons : []
  if (!list.length) return 0
  const sum = list.reduce((acc, lesson) => acc + (lesson?.hasQuiz ? Number(lesson.quizScore) || 0 : 100), 0)
  return Math.round(sum / list.length)
}

export function formatDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0))
  if (!total) return ''
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  if (h && m) return `${h} soat ${m} daq`
  if (h) return `${h} soat`
  return `${Math.max(1, m)} daqiqa`
}

export function hoursNumber(seconds) {
  const h = (Number(seconds) || 0) / 3600
  if (h <= 0) return 0
  return Math.round(h * 10) / 10
}

export function groupLessons(lessons) {
  const groups = []
  for (const lesson of lessons || []) {
    const title = String(lesson?.moduleTitle || '').trim()
    const last = groups[groups.length - 1]
    if (last && last.title === title) last.lessons.push(lesson)
    else groups.push({ title, lessons: [lesson] })
  }
  return groups
}

/** Bunny iframe postMessage. Turli player.js shakllarini bitta ko‘rinishga keltiradi. */
export function parseBunnyMessage(raw) {
  let data = raw
  if (typeof raw === 'string') {
    const text = raw.trim()
    if (!text.startsWith('{') && !text.startsWith('[')) return null
    try { data = JSON.parse(text) } catch { return null }
  }
  if (!data || typeof data !== 'object') return null
  const event = String(data.event || data.type || data.name || '').toLowerCase()
  const value = data.value && typeof data.value === 'object' ? data.value : data
  const current = Number(value.currentTime ?? value.seconds ?? value.position ?? data.currentTime ?? data.seconds)
  const duration = Number(value.duration ?? data.duration)
  if (!event && !Number.isFinite(current)) return null
  return {
    event,
    current: Number.isFinite(current) ? current : null,
    duration: Number.isFinite(duration) && duration > 0 ? duration : null,
  }
}

export function toCatalogCard(row, index = 0) {
  const seconds = Number(row?.duration_seconds ?? row?.durationSeconds) || 0
  const publishedAt = row?.published_at || row?.publishedAt || ''
  const fresh = publishedAt ? Date.now() - new Date(publishedAt).getTime() < 21 * 86400000 : false
  return {
    id: row.id,
    title: row.title || '',
    about: row.about || row.description || '',
    direction: row.direction || 'terapiya',
    level: row.level || 'bosh',
    format: row.format || 'kurs',
    price: Number(row.price) || 0,
    cover: row.cover || row.cover_url || '',
    doctor: row.doctor || 'Muallif',
    role: row.role || '',
    avatar: row.avatar || '',
    lessons: Number(row.lessons) || 0,
    hours: hoursNumber(seconds),
    duration: formatDuration(seconds),
    durationSeconds: seconds,
    enrolled: Number(row.enrolled) || 0,
    publishedAt,
    rating: 0,
    reviews: 0,
    fresh,
    rank: index,
  }
}
