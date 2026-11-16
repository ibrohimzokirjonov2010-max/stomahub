import { isRestricted } from './restricted.jsx'
const MOBILE_QUERY = '(max-width: 767.98px)' // keep in sync with useMobile.js
// Shared checkout helpers (desktop Checkout.jsx + MobileCheckout.jsx).

// Demo payment methods (card/Click/Payme) are hidden until real acquiring is connected.
// Set VITE_SHOW_DEMO_PAYMENTS=1 to show them again.
export const SHOW_DEMO_PAYMENTS = import.meta.env.VITE_SHOW_DEMO_PAYMENTS === '1'
export const DEFAULT_PAYMENT = 'cash'

const pad = (n) => String(n).padStart(2, '0')
export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

import { ASAP, TIME_WINDOWS, defaultWhen, earliestISO, fmtDate, openSlots, tashkentNow, addDays, whenNote } from './lib/deliveryWhen.js'
export { ASAP, TIME_WINDOWS, tashkentNow }
export const todayISO = () => tashkentNow().iso
export const earliestDeliveryISO = (city, pickup) => earliestISO(city, pickup)
export const maxDeliveryISO = () => addDays(todayISO(), 30)
/** Ochiq oraliqlar (bugun uchun — tugashiga kamida 1 soat qolganlari). */
export const windowsFor = (iso) => openSlots(iso)
/** Sukut: «Imkon qadar tezroq». */
export const defaultDelivery = () => defaultWhen()
export const fmtDeliveryDate = fmtDate

/** Hisob-faktura: STIR (9 digits) and company name are required. Returns an error string or ''. */
export function invoiceError(on, inv) {
  if (!on) return ''
  if (!/^\d{9}$/.test(String(inv?.stir || '').trim())) return 'Hisob-faktura uchun STIR 9 ta raqamdan iborat bo‘lishi kerak.'
  if (String(inv?.company || '').trim().length < 2) return 'Hisob-faktura uchun kompaniya nomini kiriting.'
  return ''
}

/** Delivery date and invoice details travel to the seller inside the order note (no schema change). */
export function orderNote(note, { date, slot, pickup, invoice, inv } = {}) {
  const parts = []
  if (date || slot === ASAP) parts.push(whenNote({ date, slot }, pickup))
  if (invoice) parts.push(`Hisob-faktura: ${String(inv.company).trim()}, STIR ${String(inv.stir).trim()}`)
  if (note && note.trim()) parts.push(note.trim())
  return parts.join(' | ')
}

// "Hozir xarid qilish": a single-product checkout that never touches the cart.
const BUY_NOW_KEY = 'stomahub-buy-now'
/** Same shape as cart.add() produces, so createOrder gets productId/sellerId. */
export function buyNowItem(product, qty = 1) {
  const id = product.id
  const isUuid = typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  return {
    id,
    productId: product.productId || (isUuid ? id : undefined),
    sellerId: product.sellerId || product.seller_id || undefined,
    name: product.name,
    type: product.type || product.variant || '',
    variant: product.variant || '',
    price: product.price,
    image: product.image || product.image_url || product.thumbs?.[0] || '',
    qty: Math.max(1, qty | 0),
    ...(typeof product.seller === 'string' ? { seller: product.seller } : {}),
    ...(isRestricted(product) ? { rx: true } : {}),
    ...(product.kashta ? { kashta: String(product.kashta) } : {}),
    ...(product.logoOn || product.logo ? { logoOn: true } : {}),
    ...(product.logo ? { logo: String(product.logo), logoName: String(product.logoName || ''), logoSize: Number(product.logoSize) || 0 } : {}),
  }
}
/** "Hozir xarid qilish": go to checkout with ONLY this product; cart is not touched. */
export function goBuyNow(navigate, product, qty, from) {
  const item = buyNowItem(product, qty)
  startBuyNow(item)
  const mobile = typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  navigate(mobile ? '/buyurtma/rasmiylashtirish' : '/buyurtma', { state: { from, buyNow: true } })
}

export function startBuyNow(item) {
  try { sessionStorage.setItem(BUY_NOW_KEY, JSON.stringify(item)) } catch { /* storage blocked */ }
}
export function readBuyNow(state) {
  if (!state?.buyNow) return null
  if (typeof state.buyNow === 'object') return state.buyNow
  try { return JSON.parse(sessionStorage.getItem(BUY_NOW_KEY)) } catch { return null }
}
export function endBuyNow() {
  try { sessionStorage.removeItem(BUY_NOW_KEY) } catch { /* ignore */ }
}
