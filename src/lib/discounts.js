import { tashkentToday } from '../tashkentDate'

// Sotuvchi chegirmalari (seller_discounts) xaridor narxiga — server (0048 buyer_create_order) bilan bir xil qoida:
// faqat avtomatik turlar (foiz / qat’iy summa), faol, qoralama emas, promokodsiz, min_order = 0,
// sana oralig‘i Asia/Tashkent bo‘yicha. Bir nechta mos kelsa — eng arzon narx beradigani.
export function discountApplies(d, product, today = tashkentToday()) {
  if (!d || !product || d.seller_id !== product.sellerId) return false
  if (!d.active || d.is_draft || (d.promo_code || '').trim() || Number(d.min_order || 0) > 0) return false
  if (!['foiz', 'summa'].includes(d.kind || 'foiz')) return false
  if (d.starts_on && d.starts_on > today) return false
  if (d.ends_on && d.ends_on < today) return false
  if (d.scope === 'products') return (d.product_ids || []).includes(product.id) || d.product_id === product.id
  if (d.scope === 'category') return !!d.category && d.category === (product.rawCategory || product.category)
  if (d.product_id && (d.scope || 'all') === 'all' && !(d.product_ids || []).length) return d.product_id === product.id
  return true
}

export function discountedPrice(d, price) {
  const p = Number(price) || 0
  if (!d) return p
  if ((d.kind || 'foiz') === 'summa') return Math.max(0, p - (Number(d.value) || 0))
  const pct = Number(d.value || d.percent || 0)
  return pct >= 1 && pct <= 90 ? Math.round(p * (1 - pct / 100)) : p
}

export function bestDiscount(product, discounts = [], today = tashkentToday()) {
  let best = null
  for (const d of discounts) {
    if (!discountApplies(d, product, today)) continue
    if (!best || discountedPrice(d, product.price) < discountedPrice(best, product.price)) best = d
  }
  return best
}

/** Mahsulotga chegirmani qo‘llaydi: price — chegirmali, oldPrice — asl (ustidan chizilgan). */
export function applyDiscount(product, discounts, today) {
  const d = bestDiscount(product, discounts, today)
  if (!d) return product
  const price = discountedPrice(d, product.price)
  if (price >= product.price) return product
  return {
    ...product,
    oldPrice: product.price,
    price,
    discountId: d.id,
    discountTitle: d.title || '',
    variants: (product.variants || []).map((v) => ({ ...v, oldPrice: Number(v.price) || product.price, price: discountedPrice(d, Number(v.price) || product.price) })),
    priceTiers: (product.priceTiers || []).map((t) => ({ ...t, price: discountedPrice(d, t.price) })),
  }
}

/** Faol sotuvchi aksiyasi (seller_promotions → deal payload) — chegirmadan arzonroq bo‘lsa qo‘llanadi. */
export function applyPromotion(product, promos = [], today = tashkentToday()) {
  const d = promos.find((x) => x && String(x.productId) === String(product.id)
    && (!x.startsOn || x.startsOn <= today) && (!x.endsOn || x.endsOn >= today))
  const price = Number(d?.price) || 0
  if (!d || !price || price >= product.price) return product
  const old = Math.max(Number(product.oldPrice) || 0, Number(d.oldPrice) || 0, Number(product.price) || 0)
  return { ...product, oldPrice: old, price, promotionId: d.id, endsOn: d.endsOn || '' }
}

/** Chegirma foizi (badge uchun): -15% */
export const offPercent = (p) => (p?.oldPrice > p?.price && p.price > 0 ? Math.round((1 - p.price / p.oldPrice) * 100) : 0)
