import { netOf, commissionOf, COMMISSION_RATE } from '../../api'
import { MONTHS } from '../../format'

export const ymOf = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
export const ymTitle = (ym) => { const [y, m] = ym.split('-'); const t = MONTHS[Number(m) - 1]; return `${t[0].toUpperCase()}${t.slice(1)} ${y}` }
export const localIso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
export const dayOf = (ts) => localIso(new Date(ts))
// davr: {from, to} — YYYY-MM-DD (ikkalasi ham kiradi)
export function monthRange(ym) { const [y, m] = ym.split('-').map(Number); return { from: `${ym}-01`, to: localIso(new Date(y, m, 0)) } }
export function presetRange(k, ym) {
  const now = new Date(); const t = localIso(now)
  if (k === 'bugun') return { from: t, to: t }
  if (k === 'hafta') return { from: localIso(new Date(now.getTime() - 6 * 864e5)), to: t }
  return monthRange(ym)
}
export const inRange = (ts, r) => { const d = dayOf(ts); return d >= r.from && d <= r.to }
export const liveOrders = (orders, r) => orders.filter((o) => o.status !== 'bekor_qilindi' && inRange(o.created_at, r))
export function days(r) { const out = []; const d = new Date(`${r.from}T12:00:00`); const e = new Date(`${r.to}T12:00:00`); while (d <= e && out.length < 400) { out.push(localIso(d)); d.setDate(d.getDate() + 1) } return out }

export function summary(list) {
  const sum = list.reduce((s, o) => s + netOf(o), 0)
  const buyers = new Set(list.map((o) => o.customer_id || o.customer_phone || o.customer_name)).size
  return { sum, count: list.length, avg: list.length ? Math.round(sum / list.length) : 0, commission: list.reduce((s, o) => s + commissionOf(o), 0), buyers }
}
export function daily(list, r, pick = netOf) { const m = Object.fromEntries(days(r).map((d) => [d, 0])); list.forEach((o) => { const d = dayOf(o.created_at); if (d in m) m[d] += pick(o) }); return m }
// mahsulot bo'yicha: sotilgan dona va summa (chegirma ulushi taqsimlanadi)
export function productSales(list, products) {
  const m = new Map()
  list.forEach((o) => { const k = netOf(o) / (Number(o.subtotal) || 1); o.items.forEach((it) => { const id = it.product_id || it.name; const x = m.get(id) || { qty: 0, sum: 0, orders: 0, name: it.name, image_url: it.image_url }; x.qty += Number(it.qty); x.sum += Math.round(Number(it.total ?? it.qty * it.price) * k); x.orders += 1; m.set(id, x) }) })
  return [...m.entries()].map(([id, x]) => { const p = products.find((q) => q.id === id); return { id, ...x, product: p, name: p?.name || x.name, image_url: p?.image_url || x.image_url, category: p?.category || 'Boshqalar', unit: p?.unit || '' } }).sort((a, b) => b.sum - a.sum)
}
export function byCategory(sales) { const m = new Map(); sales.forEach((s) => m.set(s.category || 'Boshqalar', (m.get(s.category || 'Boshqalar') || 0) + s.sum)); const arr = [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value); return arr.length > 6 ? [...arr.slice(0, 5), { label: 'Boshqalar', value: arr.slice(5).reduce((s, x) => s + x.value, 0) }] : arr }
export function byRegion(list, val = netOf) { const m = new Map(); list.forEach((o) => { const k = o.region || 'Ko‘rsatilmagan'; const x = m.get(k) || { count: 0, sum: 0 }; x.count += 1; x.sum += val(o); m.set(k, x) }); return [...m.entries()].map(([region, x]) => ({ region, ...x })).sort((a, b) => b.sum - a.sum) }

export const RTYPES = [
  ['sotuvlar', 'Sotuvlar', 'Sotuvlar summasi, mahsulotlar va hududlar bo‘yicha ma’lumotlar'],
  ['buyurtmalar', 'Buyurtmalar', 'Buyurtmalar ro‘yxati va holatlari'],
  ['mahsulotlar', 'Mahsulotlar', 'Mahsulotlar bo‘yicha sotuv va ko‘rishlar'],
  ['mijozlar', 'Mijozlar', 'Mijozlar ro‘yxati va buyurtmalari'],
  ['komissiya', 'Komissiya va to‘lovlar', `Platforma komissiyasi (${COMMISSION_RATE * 100}%) va to‘lovlar bo‘yicha ma’lumotlar`],
]
export const COLS = [['sana', 'Sana'], ['soni', 'Soni'], ['hudud', 'Hudud'], ['raqam', 'Buyurtma raqami'], ['narx', 'Narx'], ['holat', 'Buyurtma holati'], ['mijoz', 'Mijoz'], ['summa', 'Sotuv summasi'], ['telefon', 'Mijoz telefoni'], ['mahsulot', 'Mahsulot'], ['komissiya', `Komissiya (${COMMISSION_RATE * 100}%)`], ['chegirma', 'Chegirma summasi'], ['kategoriya', 'Kategoriya'], ['tolov', 'To‘lov turi (Naqd)']]
export const DEFAULT_COLS = ['sana', 'raqam', 'mijoz', 'mahsulot', 'soni', 'narx', 'summa', 'komissiya', 'tolov', 'hudud', 'holat']
