import { isRestricted } from '../restricted.jsx'

// Xarid cheklovlari — server (buyer_create_order + 0038 trigger) bilan bir xil qoidalar.
// Mahsulot sahifasi, savat va rasmiylashtirishda bir xil matn ko‘rsatiladi.
export const OWN_PRODUCT_TEXT = 'O‘z mahsulotingizni buyurtma qila olmaysiz'
export const RX_TEXT = 'Faqat tasdiqlangan shifokorlar uchun'

const sellerOf = (p) => p?.sellerId || p?.seller_id || ''

export function stockOf(p) {
  if (!p || p.stock === undefined || p.stock === null || p.stock === '') return null
  const n = Number(p.stock)
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null
}

/** Mahsulotni umuman savatga qo‘shib bo‘lmaydigan sabab (yoki null). */
export function purchaseBlock(p, { uid, verified } = {}) {
  if (!p) return null
  if (uid && sellerOf(p) && sellerOf(p) === uid) return { code: 'own', text: OWN_PRODUCT_TEXT }
  if (isRestricted(p) && !verified) return { code: 'rx', text: RX_TEXT }
  const s = stockOf(p)
  if (s !== null && s < 1) return { code: 'stock', text: 'Mahsulot tugagan' }
  return null
}

/** Savatdagi qator uchun muammo: cheklov yoki ombordagidan ko‘p miqdor. */
export function lineProblem(it, ctx = {}) {
  const block = purchaseBlock(it, ctx)
  if (block) return block
  const s = stockOf(it)
  if (s !== null && it.qty > s) return { code: 'qty', text: `Omborda faqat ${s} ${it.uom || 'dona'} bor` }
  return null
}

export function cartProblems(items, ctx = {}) {
  return (items || []).map((it) => ({ it, problem: lineProblem(it, ctx) })).filter((x) => x.problem)
}
