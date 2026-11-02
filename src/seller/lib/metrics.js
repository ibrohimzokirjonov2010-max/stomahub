// Sotuvchi kabinetidagi barcha pul/sotuv ko‘rsatkichlari uchun yagona qoidalar.
// Analitika, Hamyon, Bosh sahifa va hisobotlar shu moduldan foydalanadi.
//  • Demo buyurtmalar (note ichida "[demo:") hisobga olinmaydi.
//  • Sotuv summasi / buyurtmalar / o‘rtacha chek / komissiya — faqat "Yetkazildi".
//  • Ochiq (yangi…yetkazilmoqda) buyurtmalar alohida — "Kutilayotgan".
//  • Mantiq payment_status ga emas, buyurtma holati + demo belgisiga tayanadi.
//  • Sanalar Asia/Tashkent (UTC+5, yozgi vaqt yo‘q) bo‘yicha guruhlanadi.
import { MONTHS } from '../format'

export const COMMISSION_RATE = 0.12
export const OPEN = ['yangi', 'tasdiqlandi', 'tayyorlanmoqda', 'yetkazilmoqda']
const TZ_MS = 5 * 3600e3

// ---- vaqt (Toshkent) ---------------------------------------------------------------
export const tkDay = (ts) => { const t = Date.parse(ts); return Number.isFinite(t) ? new Date(t + TZ_MS).toISOString().slice(0, 10) : '' }
export const tkToday = (now = new Date()) => tkDay(now.toISOString())
export const tkYm = (now = new Date()) => tkToday(now).slice(0, 7)
export const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10)
export const ymShift = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return d.toISOString().slice(0, 7) }
export const ymTitle = (ym) => { const [y, m] = ym.split('-'); const t = MONTHS[Number(m) - 1]; return `${t[0].toUpperCase()}${t.slice(1)} ${y}` }
export const monthRange = (ym) => ({ from: `${ym}-01`, to: addDays(`${ymShift(ym, 1)}-01`, -1) })
export const ALL = { from: '', to: '' } // Barcha vaqt
export const isAll = (r) => !r || (!r.from && !r.to)
export const inR = (day, r) => !!day && (isAll(r) || ((!r.from || day >= r.from) && (!r.to || day <= r.to)))
export function days(r) { const out = []; let d = r.from; while (d && d <= r.to && out.length < 400) { out.push(d); d = addDays(d, 1) } return out }
export function rangeLabel(r) {
  if (isAll(r)) return 'Jami (barcha vaqt)'
  const m = /^(\d{4}-\d{2})-01$/.exec(r.from)
  if (m && monthRange(m[1]).to === r.to) return ymTitle(m[1])
  const f = (d) => d.split('-').reverse().join('.')
  return r.from === r.to ? f(r.from) : `${f(r.from)} – ${f(r.to)}`
}
// oldingi teng davr: oy bo‘lsa — oldingi oy, aks holda shuncha kun oldin
export function prevRange(r) {
  if (isAll(r)) return null
  const m = /^(\d{4}-\d{2})-01$/.exec(r.from)
  if (m && monthRange(m[1]).to === r.to) return monthRange(ymShift(m[1], -1))
  const n = days(r).length
  return { from: addDays(r.from, -n), to: addDays(r.from, -1) }
}
export const pct = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null)

// ---- buyurtma qoidalari --------------------------------------------------------------
export const isDemo = (o) => /\[demo:/i.test(String(o?.note || ''))
export const isDelivered = (o) => o?.status === 'yetkazildi'
export const isCancelled = (o) => o?.status === 'bekor_qilindi'
export const isOpen = (o) => OPEN.includes(o?.status)
export const isCash = (o) => (o?.payment_method || 'cash') === 'cash'
export const netOf = (o) => Math.max(0, Number(o?.subtotal || 0) - Number(o?.discount_amount || 0))
export const commissionOf = (o) => (isDelivered(o) ? Number(o.commission ?? Math.round(netOf(o) * COMMISSION_RATE)) : 0)
export const expectedCommission = (o) => (isCancelled(o) ? 0 : Number(o.commission ?? Math.round(netOf(o) * COMMISSION_RATE)))
export const payoutOf = (o) => (isCancelled(o) ? 0 : Number(o.payout ?? (netOf(o) - expectedCommission(o) + Number(o.delivery_fee || 0))))
export const realOrders = (orders = []) => orders.filter((o) => !isDemo(o))
// Yetkazilgan sana: status_history dagi "yetkazildi" → delivered_at → updated_at → created_at
export function doneAt(o) {
  const h = Array.isArray(o?.status_history) ? o.status_history.filter((x) => x?.status === 'yetkazildi').map((x) => x.at).filter(Boolean) : []
  return h.length ? h[h.length - 1] : o.delivered_at || o.updated_at || o.created_at
}
export const doneDay = (o) => tkDay(doneAt(o))
export const createdDay = (o) => tkDay(o.created_at)

export const PAY = { cash: 'Naqd', uzcard: 'Karta (Uzcard)', humo: 'Karta (Humo)', card: 'Karta', visa: 'Karta (Visa)', click: 'Click', payme: 'Payme', transfer: 'Bank o‘tkazmasi' }
export const payLabel = (m) => PAY[String(m || 'cash').toLowerCase()] || String(m)

/** Davrdagi yetkazilgan (demo emas) buyurtmalar — yetkazilgan sana bo‘yicha. */
export const deliveredIn = (orders, r) => realOrders(orders).filter((o) => isDelivered(o) && inR(doneDay(o), r))
/** Davrda yaratilgan ochiq (demo emas) buyurtmalar. */
export const openIn = (orders, r) => realOrders(orders).filter((o) => isOpen(o) && inR(createdDay(o), r))
const buyerKey = (o) => o.customer_id || o.buyer_id || (o.customer_phone || '').trim() || (o.customer_name || '').trim()

export function metrics(orders, r = ALL) {
  const d = deliveredIn(orders, r)
  const op = openIn(orders, r)
  const revenue = d.reduce((s, o) => s + netOf(o), 0)
  const commission = d.reduce((s, o) => s + commissionOf(o), 0)
  return {
    revenue, count: d.length, avg: d.length ? Math.round(revenue / d.length) : 0, commission,
    commissionCash: d.filter(isCash).reduce((s, o) => s + commissionOf(o), 0),
    buyers: new Set(d.map(buyerKey).filter(Boolean)).size,
    openCount: op.length, openSum: op.reduce((s, o) => s + netOf(o), 0),
    delivered: d, open: op,
  }
}
/** Jami komissiya qarzi = naqd, yetkazilgan, demo bo‘lmagan buyurtmalarning saqlangan komissiyasi (barcha vaqt). */
export const commissionDebt = (orders) => metrics(orders, ALL).commissionCash
/** Joriy davr + oldingi davr va % o‘zgarish. */
export function compare(orders, r) {
  const cur = metrics(orders, r); const pr = prevRange(r); const prev = pr ? metrics(orders, pr) : null
  const d = (k) => (prev ? pct(cur[k], prev[k]) : null)
  return { cur, prev, prevRange: pr, delta: { revenue: d('revenue'), count: d('count'), avg: d('avg'), commission: d('commission') } }
}
