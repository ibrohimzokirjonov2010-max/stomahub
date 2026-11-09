// Shaxsiy tavsiyalar reytingi — sof funksiyalar (tests/personal.test.mjs).
// Vaznlar: xarid (to‘ldiruvchilar) > savatcha > takroriy ko‘rish > qidiruv; mutaxassislik — faqat boshlang‘ich (cold start) signal.
import { normText, productText } from './text.js'
import { specialtyScore } from './specialtyMap.js'
import { isComplement, productKind, isConsumable, CONSUMABLE_REORDER_DAYS } from './complements.js'

const DAY = 864e5
/** Qiziqish 7 kun kuchli, keyin yarim yemirilish ~7 kun, 28 kundan keyin yo‘qoladi. */
export const INTEREST_FULL_DAYS = 7
export const INTEREST_HALF_LIFE_DAYS = 7
export const INTEREST_MAX_DAYS = 28
export function decay(at, now = Date.now()) {
  const t = typeof at === 'number' ? at : Date.parse(at || '')
  if (!Number.isFinite(t)) return 0
  const age = Math.max(0, (now - t) / DAY)
  if (age > INTEREST_MAX_DAYS) return 0
  if (age <= INTEREST_FULL_DAYS) return 1
  return 0.5 ** ((age - INTEREST_FULL_DAYS) / INTEREST_HALF_LIFE_DAYS)
}
/** Xarid ta’siri (to‘ldiruvchilar uchun) uzoqroq: 30 kun to‘liq, keyin 30 kunlik yarim yemirilish, 120 kunda tugaydi. */
export function purchaseDecay(at, now = Date.now()) {
  const t = typeof at === 'number' ? at : Date.parse(at || '')
  if (!Number.isFinite(t)) return 0
  const age = Math.max(0, (now - t) / DAY)
  if (age > 120) return 0
  return age <= 30 ? 1 : 0.5 ** ((age - 30) / 30)
}

const ts = (v) => (typeof v === 'number' ? v : Date.parse(v || '')) || 0

export const emptySignals = () => ({ products: {}, categories: {}, queries: [], popular: [] })

/**
 * Mahalliy hodisalar ({kind:'view'|'cart'|'search'|'purchase', productId, category, query, at, results})
 * va xaridlar ([{productId, category, at}]) -> umumiy signal ko‘rinishi.
 */
export function aggregateEvents(events = [], purchases = []) {
  const s = emptySignals()
  const prod = (id) => (s.products[id] ||= { views: 0, viewAt: 0, carts: 0, cartAt: 0, purchases: 0, purchaseAt: 0, category: '' })
  const qs = new Map()
  for (const e of events) {
    if (!e || !e.kind) continue
    const at = ts(e.at) || 0
    if (e.kind === 'search') {
      const q = normText(e.query).slice(0, 100)
      if (q.length < 2) continue
      const cur = qs.get(q) || { q, n: 0, at: 0 }
      cur.n += 1
      cur.at = Math.max(cur.at, at)
      qs.set(q, cur)
      continue
    }
    if (e.productId) {
      const p = prod(String(e.productId))
      if (e.category) p.category = e.category
      if (e.kind === 'view') { p.views += 1; p.viewAt = Math.max(p.viewAt, at) }
      if (e.kind === 'cart') { p.carts += 1; p.cartAt = Math.max(p.cartAt, at) }
      if (e.kind === 'purchase') { p.purchases += 1; p.purchaseAt = Math.max(p.purchaseAt, at) }
    } else if (e.category && e.kind === 'view') {
      const c = (s.categories[e.category] ||= { views: 0, at: 0 })
      c.views += 1
      c.at = Math.max(c.at, at)
    }
  }
  for (const b of purchases) {
    if (!b?.productId) continue
    const p = prod(String(b.productId))
    p.purchases += Number(b.qty) > 0 ? 1 : 1
    p.purchaseAt = Math.max(p.purchaseAt, ts(b.at))
    if (b.category) p.category = b.category
  }
  s.queries = [...qs.values()].sort((a, b) => b.at - a.at).slice(0, 20)
  return s
}

/** my_interest_profile() (0058) javobi -> signal ko‘rinishi. */
export function fromServer(json) {
  const s = emptySignals()
  if (!json || typeof json !== 'object') return s
  for (const r of json.products || []) {
    if (!r?.product_id) continue
    s.products[String(r.product_id)] = {
      views: Number(r.views) || 0, viewAt: ts(r.view_at), carts: Number(r.carts) || 0, cartAt: ts(r.cart_at),
      purchases: Number(r.purchases) || 0, purchaseAt: ts(r.purchase_at), category: r.category || '',
    }
  }
  for (const r of json.categories || []) if (r?.category) s.categories[r.category] = { views: Number(r.views) || 0, at: ts(r.at) }
  s.queries = (json.queries || []).filter((r) => r?.query).map((r) => ({ q: normText(r.query), n: Number(r.n) || 1, at: ts(r.at) }))
  s.popular = (json.popular || []).map(String)
  return s
}

/** Ikki signal to‘plamini qo‘shadi (server + hali yuborilmagan mahalliy). */
export function mergeSignals(a, b) {
  const out = emptySignals()
  for (const src of [a, b]) {
    if (!src) continue
    for (const [id, p] of Object.entries(src.products || {})) {
      const o = (out.products[id] ||= { views: 0, viewAt: 0, carts: 0, cartAt: 0, purchases: 0, purchaseAt: 0, category: '' })
      o.views += p.views || 0; o.carts += p.carts || 0; o.purchases += p.purchases || 0
      o.viewAt = Math.max(ts(o.viewAt), ts(p.viewAt)); o.cartAt = Math.max(ts(o.cartAt), ts(p.cartAt)); o.purchaseAt = Math.max(ts(o.purchaseAt), ts(p.purchaseAt))
      o.category = o.category || p.category || ''
    }
    for (const [c, v] of Object.entries(src.categories || {})) {
      const o = (out.categories[c] ||= { views: 0, at: 0 })
      o.views += v.views || 0
      o.at = Math.max(ts(o.at), ts(v.at))
    }
    const qs = new Map(out.queries.map((q) => [q.q, q]))
    for (const q of src.queries || []) {
      const cur = qs.get(q.q)
      if (cur) { cur.n += q.n; cur.at = Math.max(ts(cur.at), ts(q.at)) } else qs.set(q.q, { ...q })
    }
    out.queries = [...qs.values()]
    if (src.popular?.length && !out.popular.length) out.popular = [...src.popular]
  }
  return out
}

export function hasSignals(s, now = Date.now()) {
  if (!s) return false
  if (Object.values(s.products || {}).some((p) => decay(p.viewAt, now) > 0 || decay(p.cartAt, now) > 0 || purchaseDecay(p.purchaseAt, now) > 0)) return true
  if (Object.values(s.categories || {}).some((c) => decay(c.at, now) > 0)) return true
  return (s.queries || []).some((q) => decay(q.at, now) > 0)
}

const tokens = (q) => normText(q).split(/[^\p{L}\p{N}'-]+/u).filter((w) => w.length >= 3)

/** Mahsulot xarid qilingan va hali qayta tavsiya qilish vaqti kelmaganmi. */
export function recentlyPurchased(p, sig, now = Date.now()) {
  const pp = sig?.products?.[String(p.id)]
  if (!pp?.purchases) return false
  if (!isConsumable(p)) return true
  return (now - ts(pp.purchaseAt)) / DAY < CONSUMABLE_REORDER_DAYS
}

/**
 * Bitta mahsulot balli. ctx: { signals, specialty, products, now }
 * Qaytaradi: { score, reason, direct, sale }
 */
export function scoreProduct(p, ctx) {
  const { signals = emptySignals(), specialty = '', now = Date.now() } = ctx
  const id = String(p.id)
  const pp = signals.products?.[id]
  const bought = recentlyPurchased(p, signals, now)
  const parts = { direct: 0, search: 0, similar: 0, complement: 0, category: 0, specialty: 0, popular: 0 }
  const text = productText(p)

  // 1) O‘zi ko‘rilgan / savatga qo‘shilgan, lekin sotib olinmagan — eng tepada.
  if (pp && !bought) {
    if (pp.views) parts.direct += (10 + 4 * Math.min(pp.views - 1, 5)) * decay(pp.viewAt, now)
    if (pp.carts) parts.direct += 25 * decay(pp.cartAt, now)
  }
  // 2) Qidiruv: so‘rovdagi barcha so‘zlar mos — kuchli, qisman — kuchsizroq.
  for (const q of signals.queries || []) {
    const d = decay(q.at, now)
    if (!d) continue
    const tk = tokens(q.q)
    if (!tk.length) continue
    const hit = tk.filter((w) => text.includes(w)).length
    if (hit === tk.length) parts.search += 16 * d * Math.min(q.n, 3) ** 0.5
    else if (hit) parts.search += 5 * d * (hit / tk.length)
  }
  if (bought) parts.search = 0

  // 3) O‘xshashlar (qiziqilgan mahsulot bilan bir tur yoki kategoriya) va 4) xaridlarga to‘ldiruvchilar.
  const kind = productKind(p)
  const byId = ctx.byId || new Map((ctx.products || []).map((x) => [String(x.id), x]))
  for (const [sid, sp] of Object.entries(signals.products || {})) {
    if (sid === id) continue
    const base = byId.get(sid)
    const interest = Math.max(decay(sp.viewAt, now) * (sp.views ? 1 : 0), decay(sp.cartAt, now) * (sp.carts ? 1.5 : 0))
    if (interest > 0 && !sp.purchases) {
      if (base && kind && productKind(base) === kind) parts.similar += 7 * interest
      else if (base && isComplement(base, p)) parts.similar += 5 * interest
      else if ((base?.category || sp.category) && (base?.category || sp.category) === p.category) parts.similar += 2.5 * interest
    }
    const pd = sp.purchases ? purchaseDecay(sp.purchaseAt, now) : 0
    if (pd && base && isComplement(base, p)) parts.complement += 20 * pd
  }
  // Qidirilgan mahsulotlarga o‘xshashlar (bir tur yoki kategoriya).
  for (const seed of ctx.searchSeeds || []) {
    if (String(seed.p.id) === id) continue
    const sk = productKind(seed.p)
    if (sk && sk === kind) parts.similar += 6 * seed.d
    else if (isComplement(seed.p, p)) parts.similar += 4 * seed.d
    else if (seed.p.category && seed.p.category === p.category) parts.similar += 2 * seed.d
  }
  for (const [cat, c] of Object.entries(signals.categories || {})) {
    if (cat === p.category || cat === p.rawCategory) parts.category += Math.min(8, 2 * c.views) * decay(c.at, now)
  }
  parts.similar = Math.min(parts.similar, 14)
  parts.complement = Math.min(parts.complement, 30)

  // 5) Mutaxassislik — boshlang‘ich signal (xulq-atvor bo‘lsa ta’siri kamroq).
  const spec = Math.min(15, specialtyScore(p, specialty))
  const behaviour = parts.direct + parts.search + parts.similar + parts.complement + parts.category
  parts.specialty = spec * (behaviour > 0 ? 0.5 : 1)
  const pi = (signals.popular || []).indexOf(id)
  if (pi >= 0) parts.popular = 2 * (1 - pi / Math.max(1, signals.popular.length))

  const sale = Number(p.oldPrice) > Number(p.price)
  const boosted = parts.direct + parts.search > 0
  let score = behaviour + parts.specialty + parts.popular + (sale && boosted ? 5 : 0)
  if (p.stock === 0) score *= 0.3
  const reason = bought && !parts.complement ? 'bought'
    : parts.direct >= Math.max(parts.search, parts.complement) && parts.direct > 0 ? (pp?.carts ? 'cart' : 'viewed')
      : parts.search > 0 && parts.search >= parts.complement ? 'searched'
        : parts.complement > 0 ? 'complement'
          : parts.similar + parts.category > 0 ? 'similar'
            : parts.specialty > 0 ? 'specialty' : parts.popular > 0 ? 'popular' : ''
  return { score, reason, bought, sale: sale && boosted, behaviour, spec: parts.specialty, popular: parts.popular }
}

/** Qidiruv so‘zlariga to‘liq mos mahsulotlar — o‘xshashlarni topish uchun "urug‘". */
export function searchSeeds(products, signals, now = Date.now()) {
  const out = []
  for (const q of signals?.queries || []) {
    const d = decay(q.at, now)
    const tk = tokens(q.q)
    if (!d || !tk.length) continue
    for (const p of products) {
      const t = productText(p)
      if (tk.every((w) => t.includes(w))) out.push({ p, d })
    }
  }
  return out.slice(0, 30)
}

export const SPEC_MIN = 4
/**
 * "Siz uchun": { mode: 'behavior'|'specialty'|'popular'|'', items:[{product,...score}] }.
 * Faqat haqiqiy mahsulotlar; 2 tadan kam bo‘lsa — bo‘sh (blok yashiriladi).
 */
export function recommend(products, ctx, { limit = 12, min = 2 } = {}) {
  const list = (products || []).filter((p) => p && p.id)
  const byId = new Map(list.map((x) => [String(x.id), x]))
  const now = ctx.now ?? Date.now()
  const c = { ...ctx, now, products: list, byId, searchSeeds: searchSeeds(list, ctx.signals, now) }
  const behaviour = hasSignals(ctx.signals, now)
  const scored = list.map((p) => ({ product: p, ...scoreProduct(p, c) })).filter((x) => !x.bought)
  let mode = ''
  let picked = []
  if (behaviour) {
    picked = scored.filter((x) => x.behaviour >= 3 || x.spec >= SPEC_MIN / 2)
    mode = 'behavior'
  }
  if (picked.length < min && ctx.specialty) {
    picked = scored.filter((x) => x.behaviour >= 3 || x.spec >= SPEC_MIN)
    mode = picked.some((x) => x.behaviour > 0) ? 'behavior' : 'specialty'
  }
  if (picked.length < min && !ctx.specialty && !behaviour) {
    picked = scored.filter((x) => x.popular > 0 && x.product.stock !== 0)
    mode = 'popular'
  }
  picked.sort((a, b) => b.score - a.score || (b.sale ? 1 : 0) - (a.sale ? 1 : 0))
  const items = picked.slice(0, limit)
  return items.length >= min ? { mode, items } : { mode: '', items: [] }
}

/** Marketplace standart tartibi: ballilar oldinda (barqaror), qolganlar o‘z tartibida. */
export function orderForMarketplace(products, ctx) {
  const list = products || []
  if (!ctx || (!ctx.specialty && !hasSignals(ctx.signals, ctx.now ?? Date.now()))) return list
  const byId = new Map(list.map((x) => [String(x.id), x]))
  const now = ctx.now ?? Date.now()
  const c = { ...ctx, now, products: list, byId, searchSeeds: searchSeeds(list, ctx.signals, now) }
  const withScore = list.map((p, i) => ({ p, i, s: scoreProduct(p, c) }))
  return withScore
    .map((x) => ({ ...x, k: x.s.bought ? 0 : x.s.score }))
    .sort((a, b) => b.k - a.k || a.i - b.i)
    .map((x) => x.p)
}
