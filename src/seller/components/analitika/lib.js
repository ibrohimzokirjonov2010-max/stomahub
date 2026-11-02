import { netOf, commissionOf, COMMISSION_RATE, tkYm, tkToday, addDays, monthRange, ymTitle, days, doneDay, deliveredIn, metrics, inR } from '../../lib/metrics'

export { ymTitle, monthRange, days, inR }
export const ymOf = () => tkYm()
export const dayOf = doneDay
// davr: {from, to} — YYYY-MM-DD (ikkalasi ham kiradi), Toshkent vaqti
export function presetRange(k, ym) {
  const t = tkToday()
  if (k === 'bugun') return { from: t, to: t }
  if (k === 'hafta') return { from: addDays(t, -6), to: t }
  return monthRange(ym)
}
/** Analitika uchun asosiy ro‘yxat: davrda yetkazilgan, demo bo‘lmagan buyurtmalar. */
export const liveOrders = (orders, r) => deliveredIn(orders, r)
export function summary(list) {
  const m = metrics(list, { from: '', to: '' })
  return { sum: m.revenue, count: m.count, avg: m.avg, commission: m.commission, buyers: m.buyers }
}
export function daily(list, r, pick = netOf) { const m = Object.fromEntries(days(r).map((d) => [d, 0])); list.forEach((o) => { const d = doneDay(o); if (d in m) m[d] += pick(o) }); return m }
// mahsulot bo‘yicha: sotilgan dona, summa (chegirma ulushi taqsimlanadi), komissiya va noyob buyurtmalar soni
export function productSales(list, products) {
  const m = new Map()
  list.forEach((o) => {
    const k = netOf(o) / (Number(o.subtotal) || 1); const ck = commissionOf(o) / (netOf(o) || 1)
    o.items.forEach((it) => {
      const id = it.product_id || it.name
      const x = m.get(id) || { qty: 0, sum: 0, commission: 0, orderIds: new Set(), name: it.name, image_url: it.image_url }
      const line = Math.round(Number(it.total ?? it.qty * it.price) * k)
      x.qty += Number(it.qty); x.sum += line; x.commission += Math.round(line * ck); x.orderIds.add(o.id); m.set(id, x)
    })
  })
  return [...m.entries()].map(([id, { orderIds, ...x }]) => { const p = products.find((q) => q.id === id); return { id, ...x, orders: orderIds.size, product: p, name: p?.name || x.name, image_url: p?.image_url || x.image_url, category: p?.category || 'Boshqalar', unit: p?.unit || '' } }).sort((a, b) => b.sum - a.sum)
}
export function byCategory(sales) {
  const m = new Map(); sales.forEach((s) => m.set(s.category || 'Boshqalar', (m.get(s.category || 'Boshqalar') || 0) + s.sum))
  const arr = [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  if (arr.length <= 6) return arr
  const head = arr.slice(0, 5).filter((x) => x.label !== 'Boshqalar')
  const rest = arr.filter((x) => !head.includes(x)).reduce((s, x) => s + x.value, 0)
  return [...head, { label: 'Boshqalar', value: rest }]
}
export function byRegion(list, val = netOf) { const m = new Map(); list.forEach((o) => { const k = o.region || o.city || 'Ko‘rsatilmagan'; const x = m.get(k) || { count: 0, sum: 0 }; x.count += 1; x.sum += val(o); m.set(k, x) }); return [...m.entries()].map(([region, x]) => ({ region, ...x })).sort((a, b) => b.sum - a.sum) }

export const RTYPES = [
  ['sotuvlar', 'Sotuvlar', 'Yetkazilgan buyurtmalar bo‘yicha sotuv, mahsulot va hududlar'],
  ['buyurtmalar', 'Buyurtmalar', 'Davrda yaratilgan barcha buyurtmalar va holatlari'],
  ['mahsulotlar', 'Mahsulotlar', 'Mahsulotlar bo‘yicha sotuv va stok'],
  ['mijozlar', 'Mijozlar', 'Mijozlar ro‘yxati va yetkazilgan buyurtmalari'],
  ['komissiya', 'Komissiya va to‘lovlar', `Platforma komissiyasi (${COMMISSION_RATE * 100}%) va pul yechish so‘rovlari`],
]
export const COLS = [['sana', 'Sana'], ['soni', 'Soni'], ['hudud', 'Hudud'], ['raqam', 'Buyurtma raqami'], ['narx', 'Narx'], ['holat', 'Buyurtma holati'], ['mijoz', 'Mijoz'], ['summa', 'Sotuv summasi'], ['telefon', 'Mijoz telefoni'], ['mahsulot', 'Mahsulot'], ['komissiya', `Komissiya (${COMMISSION_RATE * 100}%)`], ['chegirma', 'Chegirma summasi'], ['kategoriya', 'Kategoriya'], ['tolov', 'To‘lov turi']]
export const DEFAULT_COLS = ['sana', 'raqam', 'mijoz', 'mahsulot', 'soni', 'narx', 'summa', 'komissiya', 'tolov', 'hudud', 'holat']
