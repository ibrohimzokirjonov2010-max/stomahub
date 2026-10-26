import { Search, House, LayoutGrid } from 'lucide-react'

export const CKINDS = [
  ['qidiruv', 'Qidiruvda yuqorida', 'Qidiruv natijalarida yuqori o‘rinda', Search],
  ['banner', 'Bosh sahifa banneri', 'Bosh sahifadagi banner joyida', House],
  ['kategoriya', 'Kategoriyada tavsiya', 'Kategoriya sahifasida tavsiya etiladi', LayoutGrid],
]
export const CKIND = Object.fromEntries(CKINDS.map((k) => [k[0], k]))
export const REGIONS = ['Barcha hududlar', 'Toshkent shahri', 'Toshkent viloyati', 'Andijon viloyati', 'Buxoro viloyati', 'Farg‘ona viloyati', 'Jizzax viloyati', 'Xorazm viloyati', 'Namangan viloyati', 'Navoiy viloyati', 'Qashqadaryo viloyati', 'Qoraqalpog‘iston Respublikasi', 'Samarqand viloyati', 'Sirdaryo viloyati', 'Surxondaryo viloyati']
// Kampaniya holati: moderatsiyada / faol / toxtatilgan / tugagan
export const CSTATUS = { moderatsiyada: ['Moderatsiyada', 'mid'], faol: ['Faol', 'on'], toxtatilgan: ['Pauza', 'mid'], tugagan: ['Tugagan', 'off'] }
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)
export function cstatusOf(c) {
  if (c.status === 'yakunlangan' || (c.ends_on && c.ends_on < today())) return 'tugagan'
  return c.status === 'toxtatilgan' ? 'toxtatilgan' : c.status === 'moderatsiyada' ? 'moderatsiyada' : 'faol'
}
export const campProducts = (c, products) => products.filter((p) => (c.product_ids || []).includes(p.id) || p.id === c.product_id)
export function campStats(c, adStats) {
  const rows = adStats.filter((s) => s.campaign_id === c.id)
  return rows.reduce((a, r) => ({ views: a.views + Number(r.impressions || 0), clicks: a.clicks + Number(r.clicks || 0), spent: a.spent + Number(r.spent || 0) }), { views: 0, clicks: 0, spent: 0 })
}
export const adBalance = (adTopups, adStats) => adTopups.reduce((s, t) => s + Number(t.amount || 0), 0) - adStats.reduce((s, r) => s + Number(r.spent || 0), 0)
// Kampaniya davridagi, uning mahsulotlari bor buyurtmalar (bekor qilinganlarsiz)
export function campOrders(c, orders) {
  const ids = new Set([...(c.product_ids || []), c.product_id].filter(Boolean))
  const from = c.starts_on || c.created_at.slice(0, 10); const to = c.ends_on || '9999'
  return orders.filter((o) => o.status !== 'bekor_qilindi' && o.created_at.slice(0, 10) >= from && o.created_at.slice(0, 10) <= to && o.items.some((i) => ids.has(i.product_id)))
}
export const daysBetween = (a, b) => (a && b ? Math.round((new Date(b) - new Date(a)) / 864e5) + 1 : null)
