// Bildirishnomalar uchun sof (React/Supabase’siz) yordamchilar — testlanadi.

// seller_orders.status → xaridorga ko‘rinadigan qisqa yozuv (0062 trigger bilan bir xil)
export const ORDER_STATUS_LABEL = {
  tasdiqlandi: 'Qabul qilindi',
  tayyorlanmoqda: 'Tayyorlanmoqda',
  yetkazilmoqda: 'Yo‘lda',
  yetkazildi: 'Yetkazildi',
  bekor_qilindi: 'Bekor qilindi',
}

export function orderStatusTitle(code, status) {
  const label = ORDER_STATUS_LABEL[status]
  if (!label) return ''
  return `Buyurtma #${String(code || '').replace(/^#/, '')}: ${label}`
}

export function orderStatusLink(code) {
  return `/buyurtma/kuzatish/${encodeURIComponent(String(code || '').replace(/^#/, ''))}`
}

/** Sarlavhadan holatni aniqlaydi — ro‘yxatda rangli belgi uchun. */
export function statusOfTitle(title = '') {
  const t = String(title)
  if (/Bekor qilindi|bekor qilindi/.test(t)) return 'bekor_qilindi'
  if (/Yetkazildi|yetkazildi/.test(t)) return 'yetkazildi'
  if (/Yo‘lda|Yo'lda|yo‘lda|yo'lda/.test(t)) return 'yetkazilmoqda'
  if (/Tayyorlanmoqda|tayyorlanmoqda/.test(t)) return 'tayyorlanmoqda'
  if (/Qabul qilindi|qabul qilindi/.test(t)) return 'tasdiqlandi'
  return ''
}

export const isUnread = (n, localRead = []) => !!n && !n.read_at && !localRead.includes(n.id)

export function countUnread(items = [], localRead = []) {
  return (items || []).filter((n) => isUnread(n, localRead)).length
}

export const badgeText = (n) => (n > 99 ? '99+' : String(Math.max(0, n | 0)))

const byNewest = (a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))

/** Yangi qatorni ro‘yxatga qo‘shadi (takrorlanmasdan, eng yangisi tepada, ko‘pi bilan `cap` ta). */
export function mergeNotification(items = [], row, cap = 100) {
  if (!row?.id) return items
  const rest = (items || []).filter((n) => n.id !== row.id)
  return [row, ...rest].sort(byNewest).slice(0, cap)
}

/** Ikki ro‘yxat orasida yangi paydo bo‘lgan o‘qilmagan qatorlar (fokusda qayta yuklanganda toast uchun). */
export function freshUnread(prev = [], next = [], localRead = []) {
  const seen = new Set((prev || []).map((n) => n.id))
  return (next || []).filter((n) => !seen.has(n.id) && isUnread(n, localRead))
}

export function markLocalRead(items = [], ids = [], at = new Date().toISOString()) {
  const set = new Set(ids)
  return (items || []).map((n) => (set.has(n.id) && !n.read_at ? { ...n, read_at: at } : n))
}

// ---- vaqt (Asia/Tashkent) ---------------------------------------------------------
const TZ = 'Asia/Tashkent'
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
const hmFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false })
export const OY = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']

/** Toshkent vaqti bo‘yicha kun kaliti: "2026-11-10". */
export const dayKey = (t) => dayFmt.format(new Date(t))
const dayNum = (key) => Math.round(Date.parse(`${key}T00:00:00Z`) / 86400000)
/** Necha kun oldin (Toshkent kalendari bo‘yicha): 0 — bugun, 1 — kecha. */
export function daysAgo(iso, now = Date.now()) {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return NaN
  return dayNum(dayKey(now)) - dayNum(dayKey(t))
}
export const clock = (iso) => hmFmt.format(new Date(iso))

/** "12-noyabr" yoki boshqa yil bo‘lsa "12-noyabr, 2025". */
export function uzDate(iso, now = Date.now()) {
  const [y, m, d] = dayKey(iso).split('-').map(Number)
  const ny = Number(dayKey(now).slice(0, 4))
  return `${d}-${OY[m - 1]}${y !== ny ? `, ${y}` : ''}`
}

/** "hozirgina", "5 daqiqa oldin", "2 soat oldin", "kecha, 14:30", "3 kun oldin", "12-noyabr". */
export function timeAgo(iso, now = Date.now()) {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ''
  const s = Math.max(0, Math.round((now - t) / 1000))
  if (s < 60) return 'hozirgina'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} daqiqa oldin`
  const days = daysAgo(iso, now)
  if (days <= 0) return `${Math.floor(m / 60)} soat oldin`
  if (days === 1) return `kecha, ${clock(iso)}`
  if (days < 7) return `${days} kun oldin`
  return uzDate(iso, now)
}

export const GROUPS = [['bugun', 'Bugun'], ['kecha', 'Kecha'], ['avval', 'Avvalroq']]

/** Bugun / Kecha / Avvalroq bo‘yicha guruhlaydi (eng yangisi tepada, bo‘sh guruhlar tushib qoladi). */
export function groupByDay(items = [], now = Date.now()) {
  const buckets = { bugun: [], kecha: [], avval: [] }
  for (const n of [...(items || [])].sort(byNewest)) {
    const d = daysAgo(n.created_at, now)
    buckets[d <= 0 ? 'bugun' : d === 1 ? 'kecha' : 'avval'].push(n)
  }
  return GROUPS.filter(([k]) => buckets[k].length).map(([key, label]) => ({ key, label, items: buckets[key] }))
}

/** "Buyurtma #STH-00028: Yo‘lda" → { head: 'Buyurtma #STH-00028', status: 'yetkazilmoqda', label: 'Yo‘lda' }. */
export function splitTitle(title = '') {
  const t = String(title || '')
  const i = t.lastIndexOf(': ')
  if (i > 0) {
    const label = t.slice(i + 2).trim()
    const status = Object.keys(ORDER_STATUS_LABEL).find((k) => ORDER_STATUS_LABEL[k] === label) || ''
    if (status) return { head: t.slice(0, i).trim(), status, label }
  }
  return { head: t, status: statusOfTitle(t), label: '' }
}
