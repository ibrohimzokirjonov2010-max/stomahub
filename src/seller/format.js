import { MONTHS_UZ, formatDateUz } from '../lib/dateUz'
export { formatDateUz }
export const som = (n) => `${Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/\u00a0|,/g, ' ')} so‘m`
export const num = (n) => Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/\u00a0|,/g, ' ')
const pad = (n) => String(n).padStart(2, '0')
export const dmy = (d) => { const x = new Date(d); return `${pad(x.getDate())}.${pad(x.getMonth() + 1)}.${x.getFullYear()}` }
export const hm = (d) => { const x = new Date(d); return `${pad(x.getHours())}:${pad(x.getMinutes())}` }
export const MONTHS = MONTHS_UZ
export const longDate = (d) => { const x = new Date(d); const base = formatDateUz(x); return base ? `${base} ${hm(x)}` : '' }
export const monthTitle = (d) => { const m = MONTHS[d.getMonth()]; return `${m[0].toUpperCase()}${m.slice(1)} ${d.getFullYear()}` }
export const maskPhone = (p) => (p ? '+998 ** *** ** **' : '—')
export const itemsLabel = (n) => `${n} ta mahsulot`

/** Buyurtma qatoridagi variant: SKU o‘rniga o‘qiladigan nom (masalan «M · To‘q ko‘k»), topilmasa — SKU. */
export function itemVariantText(it, products = []) {
  if (!it?.variant) return ''
  const p = products.find((x) => x.id === it.product_id)
  const v = (p?.variants || []).find((x) => (x.sku || '') === it.variant)
  return v?.label || it.variant
}
