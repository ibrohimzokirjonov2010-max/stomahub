// Pure helpers for the public seller profile (/dokon/:id) — shared by the real page,
// the Sozlamalar live preview and node tests. No React, no Supabase.
export const PUBLIC_KEYS = ['id', 'shop_name', 'description', 'shop_type', 'categories', 'city', 'avatar_url', 'cover_url', 'work_days', 'work_hours', 'phone', 'address', 'telegram', 'instagram', 'website', 'since', 'rating', 'reviews_count', 'reviews', 'featured_ids']
// Whitelist: only these keys are ever rendered, even if the RPC returned more (never legal/requisites).
export const pickPublic = (d) => (d && typeof d === 'object' ? Object.fromEntries(PUBLIC_KEYS.filter((k) => k in d).map((k) => [k, d[k]])) : d)
export const FEATURED_MIN = 4
export const FEATURED_MAX = 8
// Keeps the seller's order, drops ids that are not among the (active, public) products, dedupes, caps at 8.
export function pickFeatured(ids, products) {
  if (!Array.isArray(ids) || !ids.length) return []
  const byId = new Map((products || []).map((p) => [p.id, p]))
  const out = []
  for (const id of ids) { const p = byId.get(id); if (p && !out.includes(p)) out.push(p); if (out.length >= FEATURED_MAX) break }
  return out
}
export const featuredError = (ids) => (ids.length && ids.length < FEATURED_MIN ? `Kamida ${FEATURED_MIN} ta mahsulot tanlang yoki hammasini olib tashlang` : ids.length > FEATURED_MAX ? `Ko‘pi bilan ${FEATURED_MAX} ta mahsulot` : '')
export const move = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return arr; const n = [...arr]; [n[i], n[j]] = [n[j], n[i]]; return n }
// Seller's own product row (seller_products) -> the shape the public page renders.
export const toPublicCard = (r) => ({ id: r.id, name: r.name, category: r.category || '', brand: r.brand || '', price: Number(r.price) || 0, image: r.image_url || (Array.isArray(r.images) ? r.images[0] : '') || '/images/market/p1.jpg' })
