import { Percent, Coins, TicketPercent, Gift } from 'lucide-react'
import { som } from '../../format'

export const DKINDS = [
  ['foiz', 'Foiz chegirma', 'Mahsulot narxidan foiz chegirma', Percent],
  ['summa', 'Qat’iy summa', 'Mahsulot narxidan qat’iy summa chegirma', Coins],
  ['promokod', 'Promokod', 'Maxsus kod orqali chegirma', TicketPercent],
  ['bir_bepul', '2+1', 'Ikki mahsulot olsangiz, biri sovg‘a', Gift],
]
export const DKIND = Object.fromEntries(DKINDS.map((k) => [k[0], k]))
export const SCOPES = [['all', 'Barcha mahsulotlar', 'Do‘kondagi barcha mahsulotlarga'], ['products', 'Tanlangan mahsulotlar', 'Ma’lum mahsulotlarga'], ['category', 'Kategoriya', 'Ma’lum kategoriyalarga']]
export const today = () => new Date().toISOString().slice(0, 10)
export const STATUS = { faol: ['Faol', 'on'], reja: ['Rejalashtirilgan', 'mid'], tugagan: ['Tugagan', 'off'], qoralama: ['Qoralama', 'off'], toxtatilgan: ['To‘xtatilgan', 'off'] }
export function usesOf(d, orders) { return orders.filter((o) => o.discount_id === d.id && o.status !== 'bekor') }
export function statusOf(d, orders = []) {
  if (d.is_draft) return 'qoralama'
  const t = today()
  if ((d.ends_on && d.ends_on < t) || (d.usage_limit && usesOf(d, orders).length >= d.usage_limit)) return 'tugagan'
  if (d.starts_on > t) return 'reja'
  return d.active ? 'faol' : 'toxtatilgan'
}
export const valueOf = (d) => d.kind === 'summa' ? som(d.value) : d.kind === 'bir_bepul' ? '2+1' : d.kind === 'promokod' ? (d.promo_code || `${d.value}%`) : `${d.value || d.percent || 0}%`
export function productsOf(d, products) {
  if (d.scope === 'products') return products.filter((p) => (d.product_ids || []).includes(p.id) || p.id === d.product_id)
  if (d.scope === 'category') return products.filter((p) => p.category === d.category)
  return products
}
export const scopeText = (d, products) => d.scope === 'products' ? `Tanlangan mahsulotlar (${productsOf(d, products).length} ta)` : d.scope === 'category' ? `Kategoriya: ${d.category}` : 'Barcha mahsulotlar'
export function newPrice(d, price) {
  const p = Number(price || 0)
  if (d.kind === 'summa') return Math.max(0, p - Number(d.value || 0))
  if (d.kind === 'bir_bepul') return p
  return Math.round(p * (1 - Number(d.value || d.percent || 0) / 100))
}
export const days = (a, b) => (a && b ? Math.round((new Date(b) - new Date(a)) / 864e5) + 1 : null)
