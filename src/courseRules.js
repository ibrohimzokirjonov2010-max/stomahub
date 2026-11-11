// Tomosha va test qoidalari. SQL (0072 course_report_progress, 0074 course_submit_quiz)
// shu raqamlarga mos: bir so‘rov bilan darsni ochib bo‘lmaydi, testni hamma variant bilan yutib bo‘lmaydi.

export const WATCH_UNLOCK_RATIO = 0.9
export const FIRST_CREDIT_SECONDS = 20
export const MAX_CREDIT_PER_REPORT = 30
export const PROGRESS_REPORT_MS = 8000
export const QUIZ_COOLDOWN_SECONDS = 60
export const QUIZ_DAILY_ATTEMPTS = 5
export const DEFAULT_MAX_MISTAKES = 2
export const BUNNY_PLAYER_ORIGIN = 'https://iframe.mediadelivery.net'
export const BUNNY_PLAYER_EVENTS = ['timeupdate', 'ended', 'pause', 'seeked']

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

/**
 * Pleer hodisasi serverga yuborilsinmi.
 * Tugashi darhol ketadi. Qolganlari 8 s da bir marta — server bir hisobotda
 * ko‘pi bilan 30 s (birinchisida 20 s) yozadi, shuning uchun tez-tez yuborish ochmaydi.
 */
export function shouldReportProgress({ lastSent = 0, now = 0, event = '' } = {}) {
  if (event === 'ended') return true
  return now - lastSent >= PROGRESS_REPORT_MS
}

/** player.js faqat `ready` yuboradi, toki ota oyna hodisalarni so‘ramaguncha. */
export function bunnyListenMessage(eventName) {
  return JSON.stringify({
    context: 'player.js',
    version: '0.0.11',
    method: 'addEventListener',
    value: eventName,
    listener: eventName,
  })
}

export function subscribeBunnyPlayer(target) {
  if (!target || typeof target.postMessage !== 'function') return false
  for (const eventName of BUNNY_PLAYER_EVENTS) {
    target.postMessage(bunnyListenMessage(eventName), BUNNY_PLAYER_ORIGIN)
  }
  return true
}

/** Mahalliy ko‘zgu. Talabaga ketadigan javob gradeQuizSubmission — xato idlarsiz. */
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

export function clampMaxMistakes(value) {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return DEFAULT_MAX_MISTAKES
  return Math.min(20, Math.max(0, n))
}

/** Talabaga ko‘rinadigan o‘tish qoidasi. */
export function mistakeRule(maxMistakes = DEFAULT_MAX_MISTAKES) {
  return `Ko‘pi bilan ${clampMaxMistakes(maxMistakes)} ta xatoga ruxsat`
}

/**
 * Bitta savol — bitta javob. Dublikat, noma’lum id yoki savoldan ko‘p qator rad etiladi.
 * Javobsiz savol xato. O‘tish: xatolar soni maxMistakes dan oshmasa (odatiy 2).
 * To‘g‘ri soni savollar sonidan oshmaydi. Qaysi savol xato ekani qaytmaydi.
 */
export function gradeQuizSubmission(questions, answers, maxMistakes = DEFAULT_MAX_MISTAKES) {
  const list = Array.isArray(questions) ? questions : []
  const given = Array.isArray(answers) ? answers : []
  const known = new Set(list.map((q) => String(q?.id ?? '')))
  if (given.length > list.length) return { ok: false, error: 'Har bir savolga bitta javob yuboring' }
  const seen = new Set()
  for (const row of given) {
    const id = String(row?.id ?? '')
    if (!known.has(id) || seen.has(id)) return { ok: false, error: 'Har bir savolga bitta javob yuboring' }
    seen.add(id)
  }
  const graded = gradeQuiz(list, given, 100)
  const correct = Math.min(Math.max(0, graded.correct), graded.total)
  const mistakes = graded.total - correct
  const allowed = clampMaxMistakes(maxMistakes)
  const score = graded.total ? Math.min(100, Math.round((100 * correct) / graded.total)) : 100
  return {
    ok: true,
    correct,
    total: graded.total,
    score,
    mistakes,
    maxMistakes: allowed,
    passed: mistakes <= allowed,
    wrongCount: mistakes,
  }
}

/** 60 soniya oralig‘i va kuniga 5 ta urinish. Vaqtlar millisoniyada. */
export function quizRetryGate({ now = 0, attempts = [], cooldown = QUIZ_COOLDOWN_SECONDS, daily = QUIZ_DAILY_ATTEMPTS } = {}) {
  const dayAgo = now - 86400000
  const recent = (Array.isArray(attempts) ? attempts : []).map(Number).filter((t) => Number.isFinite(t) && t > dayAgo).sort((a, b) => a - b)
  if (recent.length >= daily) {
    const retryAfter = Math.max(1, Math.ceil((recent[0] + 86400000 - now) / 1000))
    return {
      ok: false,
      code: 'daily',
      retryAfter,
      error: 'Bugun bu dars uchun 5 ta urinish ishlatildi. Ertaga qayta urinib ko‘ring.',
    }
  }
  const last = recent.length ? recent[recent.length - 1] : 0
  const wait = last ? cooldown - Math.floor((now - last) / 1000) : 0
  if (wait > 0) {
    return { ok: false, code: 'cooldown', retryAfter: wait, error: 'Keyingi urinishdan oldin biroz kuting.' }
  }
  return { ok: true, retryAfter: 0, attemptsLeft: daily - recent.length }
}

export function formatRetry(seconds) {
  const s = Math.max(0, Math.ceil(Number(seconds) || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h} soat ${m} daq`
  return `${m}:${String(sec).padStart(2, '0')}`
}

export function sumCoursePoints(rows) {
  return (Array.isArray(rows) ? rows : []).reduce((sum, row) => sum + Math.max(0, Math.round(Number(row?.points) || 0)), 0)
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
  const numericValue = typeof data.value === 'number' ? data.value : Number.NaN
  const current = Number(value.currentTime ?? value.seconds ?? value.position ?? (Number.isFinite(numericValue) ? numericValue : undefined) ?? data.currentTime ?? data.seconds)
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
