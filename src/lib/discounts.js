import { tashkentToday } from '../tashkentDate.js'
import { promoFor, promoPrice } from './aksiya.js'

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

/**
 * Faol sotuvchi aksiyasi (seller_promotions → deal payload, 0047/0068) — chegirmadan arzonroq bo‘lsa qo‘llanadi.
 * Server (0068 seller_discount_price) bilan bir xil: asl narxdan hisoblanadi, chegirma bilan qo‘shilmaydi (eng arzoni).
 * 'all' — sotuvchining barcha mahsulotlariga foiz; mahsulot aksiyasi — narx nisbati (variantlarga ham).
 */
export function applyPromotion(product, promos = [], today = tashkentToday()) {
  const base = Number(product.discountId ? product.oldPrice : product.price) || 0
  const d = promoFor({ ...product, basePrice: base }, promos, today)
  if (!d) return product
  const price = promoPrice(d, base)
  if (!price || price >= product.price) return product
  const old = Math.max(Number(product.oldPrice) || 0, base)
  return {
    ...product,
    oldPrice: old,
    price,
    promotionId: d.id,
    promotionTitle: d.title || '',
    endsOn: d.endsOn || '',
    variants: (product.variants || []).map((v) => {
      const vb = Number(product.discountId ? v.oldPrice || v.price : v.price) || base
      const vp = promoPrice(d, vb)
      return vp < (Number(v.price) || Infinity) ? { ...v, oldPrice: vb, price: vp } : v
    }),
    priceTiers: (product.priceTiers || []).map((t) => ({ ...t, price: Math.min(Number(t.price) || 0, promoPrice(d, t.price)) })),
  }
}

/** Chegirma foizi (badge uchun): -15% */
export const offPercent = (p) => (p?.oldPrice > p?.price && p.price > 0 ? Math.round((1 - p.price / p.oldPrice) * 100) : 0)
