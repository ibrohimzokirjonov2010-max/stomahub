// Pure helpers for the public seller profile (/dokon/:id) — shared by the real page,
// the Sozlamalar live preview and node tests. No React, no Supabase.
import { normCategory } from '../config/productCatalog.js'

export const PUBLIC_KEYS = ['id', 'shop_name', 'description', 'shop_type', 'categories', 'city', 'avatar_url', 'cover_url', 'work_days', 'work_hours', 'phone', 'address', 'telegram', 'instagram', 'website', 'since', 'verified', 'sales_count', 'rating', 'reviews_count', 'reviews', 'featured_ids']
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
export const toPublicCard = (r) => ({ id: r.id, name: r.name, category: normCategory(r.category), brand: r.brand || '', price: Number(r.price) || 0, image: r.image_url || (Array.isArray(r.images) ? r.images[0] : '') || '/images/market/p1.jpg' })

// ---- v2 profile helpers (pure) ----
const num = (v) => (v === null || v === undefined || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null)
// Reyting: faqat haqiqiy sharhlar bo‘lsa son, aks holda null ("Yangi").
export const ratingOf = (info) => (num(info?.reviews_count) > 0 && num(info?.rating) > 0 ? Number(num(info.rating).toFixed(1)) : null)
// Sotuvlar: 0057 RPC qaytargandagina (yetkazilgan Marketplace buyurtmalari). Bo‘lmasa null — karta yashiriladi.
export const salesOf = (info) => (info && 'sales_count' in info ? num(info.sales_count) : null)
// "Tasdiqlangan": 0057 dan keyin profiles.seller_status = 'approved'. 0057 qo‘llanmagan bo‘lsa — RPC faqat
// seller_is_public (admin tasdiqlagan yoki platforma admini) sotuvchini qaytaradi, shuning uchun info bor = tasdiqlangan.
export const verifiedOf = (info) => (!info ? false : 'verified' in info ? info.verified === true : true)
export const workTimeOf = (info) => [info?.work_days, info?.work_hours].map((x) => String(x || '').trim()).filter(Boolean).join(', ')
// Xabar yozish: platformada ichki chat yo‘q — sotuvchining Telegrami, bo‘lmasa (ochiq) telefoniga SMS.
export function contactOf(info) {
  const tg = String(info?.telegram || '').trim()
  const m = tg.match(/^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/(?:s\/)?([A-Za-z0-9_+]{3,})/i)
  const name = (m ? m[1] : tg.replace(/^@+/, '')).replace(/[^A-Za-z0-9_+]/g, '')
  const digits = String(info?.phone || '').replace(/[^\d+]/g, '')
  const phone = digits.replace(/\D/g, '').length >= 7 ? digits : ''
  return {
    telegram: name ? { handle: name.startsWith('+') ? `t.me/${name}` : `@${name}`, url: `https://t.me/${name}` } : null,
    tel: phone ? `tel:${phone}` : '',
    message: name ? `https://t.me/${name}` : phone ? `sms:${phone}` : '',
    messageVia: name ? 'telegram' : phone ? 'sms' : '',
  }
}
// "Hammasi" + faqat shu sotuvchi mahsulotlarida bor kategoriyalar (birinchi uchrash tartibida).
export const categoriesOf = (products) => [...new Set((products || []).map((p) => p.category).filter(Boolean))]
// Sotuvchi tanlagan "tavsiya etilgan" mahsulotlar birinchi, qolgani o‘z tartibida.
export function orderProducts(products, featuredIds) {
  const top = pickFeatured(featuredIds, products)
  const set = new Set(top)
  return [...top, ...(products || []).filter((p) => !set.has(p))]
}

// ---- Namuna (demo) adapters: get_demo → SellerProfileView shape. No invented ratings/sales. ----
const DEMO_KIND_LABEL = { shop: 'Do‘kon', organizer: 'Seminar tashkilotchisi', bookseller: 'Kitob sotuvchisi' }
export const demoProductsLabel = (kind) => (kind === 'organizer' ? 'Seminarlar' : kind === 'bookseller' ? 'Kitoblar' : 'Mahsulotlar')
export const demoEmptyCopy = (kind) => (
  kind === 'organizer'
    ? { title: 'Hozircha seminar yo‘q', hint: 'Seminarlar qo‘shilganda shu yerda ko‘rinadi.' }
    : kind === 'bookseller'
      ? { title: 'Hozircha kitob yo‘q', hint: 'Kitoblar qo‘shilganda shu yerda ko‘rinadi.' }
      : { title: 'Hozircha sotuvda mahsulot yo‘q', hint: 'Mahsulotlar qo‘shilganda shu yerda ko‘rinadi.' }
)
// Entity → public info. verified always false (namuna ≠ tasdiqlangan sotuvchi). rating/sales omitted on purpose.
export function demoEntityToInfo(entity) {
  if (!entity || typeof entity !== 'object') return null
  return {
    shop_name: entity.name || '',
    description: entity.description || '',
    shop_type: DEMO_KIND_LABEL[entity.kind] || '',
    city: entity.city || '',
    address: entity.address || '',
    phone: entity.phone || '',
    website: entity.website || '',
    telegram: entity.telegram || '',
    avatar_url: entity.logo_url || '',
    verified: false,
    reviews: [],
    featured_ids: [],
    categories: [],
    demo_kind: entity.kind || 'shop',
  }
}
// Items → product cards. price null stays null (no "0 so‘m"). Cart/nav disabled by demo mode in the view.
export function demoItemsToCards(items, entityName = '') {
  return (Array.isArray(items) ? items : []).map((it) => {
    const extra = it?.extra && typeof it.extra === 'object' ? it.extra : {}
    let meta = ''
    if (it?.kind === 'seminar') {
      meta = [extra.date_text || extra.start_date, extra.location || extra.place, extra.speaker ? `Ma’ruzachi: ${extra.speaker}` : ''].filter(Boolean).join(' · ')
    } else if (it?.kind === 'book' && extra.author) {
      meta = String(extra.author)
    }
    const price = it?.price == null || it?.price === '' ? null : Number(it.price)
    return {
      id: it.id,
      name: it.name || '',
      price: Number.isFinite(price) ? price : null,
      priceText: it.price_text || '',
      image: it.image_url || '',
      category: '',
      seller: entityName || '',
      sellerId: null,
      kind: it.kind || 'product',
      sourceUrl: it.source_url || '',
      meta,
      description: it.description || '',
      stock: 0,
    }
  })
}
