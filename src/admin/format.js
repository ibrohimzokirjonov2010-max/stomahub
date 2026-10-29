export const som = (n) => `${Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/\u00a0|,/g, ' ')} so‘m`
export const num = (n) => Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/\u00a0|,/g, ' ')
const pad = (n) => String(n).padStart(2, '0')
export const dmy = (d) => { const x = new Date(d); if (Number.isNaN(+x)) return '—'; return `${pad(x.getDate())}.${pad(x.getMonth() + 1)}.${x.getFullYear()}` }
export const hm = (d) => { const x = new Date(d); if (Number.isNaN(+x)) return ''; return `${pad(x.getHours())}:${pad(x.getMinutes())}` }
export const dmyhm = (d) => { const t = hm(d); return t ? `${dmy(d)}, ${t}` : dmy(d) }
export const MONTHS_UZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
export const monthTitle = (d) => `${MONTHS_UZ[d.getMonth()]} ${d.getFullYear()}`
export const rangeLabel = (from, to) => `${dmy(from)} - ${dmy(to)}`
/** To‘liq mask: raqam hech qachon ochiq ko‘rinmaydi. */
export const maskPhone = (p) => (p ? '+998 ** *** ** **' : '—')
export const maskEmail = (e) => {
  if (!e) return '—'
  const at = String(e).indexOf('@')
  if (at < 0) return '********'
  return `********${String(e).slice(at)}`
}

/** Dizaynda 'naqd' bo‘lishi mumkin; yangi qaror: UZCARD/HUMO/Click/Payme (demo). */
export const PAY_LABEL = {
  cash: 'Naqd',
  naqd: 'Naqd',
  uzcard: 'UZCARD',
  humo: 'HUMO',
  click: 'Click',
  payme: 'Payme',
  card: 'UZCARD',
}
export const payLabel = (m) => PAY_LABEL[String(m || 'cash').toLowerCase()] || String(m || '—')

export const ORDER_STATUS = {
  yangi: { label: 'Yangi', tone: 'teal' },
  tasdiqlandi: { label: 'Tasdiqlandi', tone: 'blue' },
  tayyorlanmoqda: { label: 'Tayyorlanmoqda', tone: 'orange' },
  yetkazilmoqda: { label: 'Yuborilgan', tone: 'blue' },
  yetkazildi: { label: 'Yetkazilgan', tone: 'teal' },
  bekor_qilindi: { label: 'Bekor qilingan', tone: 'gray' },
}

export function monthBounds(d = new Date()) {
  const from = new Date(d.getFullYear(), d.getMonth(), 1)
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
  return { from, to }
}

export function daysInMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

const CASH = new Set(['cash', 'naqd'])
export const isCash = (m) => CASH.has(String(m || '').toLowerCase())
export const PAYMENT_STATUS = {
  pending: 'Kutilmoqda', paid: 'To‘langan', held: 'Ushlab turilibdi', released: 'Sotuvchiga o‘tkazildi',
  refunded: 'Qaytarildi', failed: 'Muvaffaqiyatsiz', cancelled: 'Bekor qilindi', unpaid: 'To‘lanmagan', wait: 'Kutilmoqda',
}
/** Uzbek label for an order's payment state; cash is never escrow. */
export const payStatusLabel = (ps, method) => {
  if (isCash(method) && !['released', 'refunded'].includes(String(ps || ''))) return 'Kutilmoqda (naqd)'
  return PAYMENT_STATUS[String(ps || '').toLowerCase()] || (ps ? String(ps) : '—')
}
export const PRODUCT_STATUS = {
  review: { label: 'Tekshiruvda', tone: 'amber' }, active: { label: 'Faol', tone: 'teal' },
  rejected: { label: 'Rad etilgan', tone: 'red' }, draft: { label: 'Qoralama', tone: 'gray' },
  hidden: { label: 'Yashirilgan', tone: 'gray' }, archived: { label: 'Arxivlangan', tone: 'gray' },
}
export const ACCOUNT_STATUS = {
  none: 'Ro‘yxatdan o‘tmagan', registered: 'Ro‘yxatdan o‘tgan', pending: 'Kutilmoqda', approved: 'Tasdiqlangan',
  rejected: 'Rad etilgan', blocked: 'Bloklangan',
}
/** Full phone for admin detail views (lists stay masked). */
export const fullPhone = (p) => {
  const d = String(p || '').replace(/\D/g, '')
  if (!d) return '—'
  if (String(p).includes('*')) return String(p)
  const n = d.length === 9 ? `998${d}` : d
  return n.length === 12 ? `+${n.slice(0, 3)} ${n.slice(3, 5)} ${n.slice(5, 8)} ${n.slice(8, 10)} ${n.slice(10)}` : `+${n}`
}
