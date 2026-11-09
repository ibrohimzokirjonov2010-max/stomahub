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

export const badgeText = (n) => (n > 9 ? '9+' : String(n))

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

/** "hozirgina", "5 daqiqa oldin", "2 soat oldin", "kecha", "3 kun oldin", yoki sana. */
export function timeAgo(iso, now = Date.now()) {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ''
  const s = Math.max(0, Math.round((now - t) / 1000))
  if (s < 60) return 'hozirgina'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} daqiqa oldin`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} soat oldin`
  const d = Math.floor(h / 24)
  if (d === 1) return 'kecha'
  if (d < 7) return `${d} kun oldin`
  const dt = new Date(t)
  const pad = (x) => String(x).padStart(2, '0')
  return `${pad(dt.getDate())}.${pad(dt.getMonth() + 1)}.${dt.getFullYear()}`
}
