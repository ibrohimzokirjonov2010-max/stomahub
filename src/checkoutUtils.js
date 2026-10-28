const MOBILE_QUERY = '(max-width: 767.98px)' // keep in sync with useMobile.js
// Shared checkout helpers (desktop Checkout.jsx + MobileCheckout.jsx).

// Demo payment methods (card/Click/Payme) are hidden until real acquiring is connected.
// Set VITE_SHOW_DEMO_PAYMENTS=1 to show them again.
export const SHOW_DEMO_PAYMENTS = import.meta.env.VITE_SHOW_DEMO_PAYMENTS === '1'
export const DEFAULT_PAYMENT = 'cash'

const pad = (n) => String(n).padStart(2, '0')
export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Current wall-clock in Asia/Tashkent regardless of the device zone. */
export function tashkentNow() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
    .formatToParts(new Date()).map((x) => [x.type, x.value]))
  return { iso: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) % 24, minute: Number(parts.minute) }
}
export const todayISO = () => tashkentNow().iso
const isoToDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d) }

/** Next working day (Mon–Sat; Sunday is skipped). */
export function nextWorkingDayISO() {
  const d = isoToDate(todayISO())
  d.setDate(d.getDate() + 1)
  if (d.getDay() === 0) d.setDate(d.getDate() + 1)
  return toISODate(d)
}

/** Never return a past date: anything earlier than today is bumped to the next working day. */
export const maxDeliveryISO = () => { const d = isoToDate(todayISO()); d.setDate(d.getDate() + 30); return toISODate(d) }

export const TIME_WINDOWS = ['09:00–12:00', '12:00–15:00', '15:00–18:00', '18:00–21:00']
/** Time windows still available on the given date (for today: window must start at least 1h from now, Tashkent time). */
export function windowsFor(iso) {
  const now = tashkentNow()
  if (iso !== now.iso) return TIME_WINDOWS
  return TIME_WINDOWS.filter((w) => Number(w.slice(0, 2)) * 60 >= now.hour * 60 + now.minute + 60)
}
/** Default: today if a window is still open, otherwise the next working day. */
export function defaultDelivery() {
  const today = todayISO()
  const left = isoToDate(today).getDay() !== 0 ? windowsFor(today) : []
  return left.length ? { date: today, slot: left[0] } : { date: nextWorkingDayISO(), slot: TIME_WINDOWS[0] }
}

export function clampDeliveryDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso) || iso < todayISO()) return nextWorkingDayISO()
  return iso
}

const MON = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
const WD = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
export function fmtDeliveryDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  const dt = isoToDate(iso)
  return `${d}-${MON[m - 1]} ${y}, ${WD[dt.getDay()]}`
}

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
  if (date) parts.push(`${pickup ? 'Olib ketish' : 'Yetkazish'} sanasi: ${fmtDeliveryDate(date)}${slot ? `, ${slot}` : ''}`)
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
