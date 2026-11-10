// Sotuvchi aksiyalari (seller_promotions, 0047 + 0068) — sof funksiyalar (test qilinadi).
// Server (seller_promotions_guard / seller_discount_price) bilan bir xil qoidalar.
import { tashkentToday } from '../tashkentDate.js'

export const TITLE_MAX = 80
export const BANNER_MAX_MB = 5
export const BANNER_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Aksiya hozir amalda (Asia/Tashkent sanasi bo‘yicha boshlangan va tugamagan). */
export function isLive(d, today = tashkentToday()) {
  if (!d) return false
  if (d.startsOn && String(d.startsOn).slice(0, 10) > today) return false
  if (d.endsOn && String(d.endsOn).slice(0, 10) < today) return false
  return true
}

/** Tugashigacha qolgan soniya (tugash kuni Toshkent vaqti bilan 23:59:59 gacha). Har safar hisoblanadi. */
export function leftSeconds(endsOn, now = Date.now()) {
  if (!endsOn) return 0
  const end = Date.parse(`${String(endsOn).slice(0, 10)}T23:59:59+05:00`)
  return Number.isFinite(end) ? Math.max(0, Math.floor((end - now) / 1000)) : 0
}

/** Aksiya narxi: 'all' — foiz; mahsulot — aksiya narxi / eski narx nisbati (variant va ulgurji narxlarga ham). */
export function promoPrice(d, price) {
  const p = Number(price) || 0
  if (!d || p <= 0) return p
  if (d.scope === 'all') {
    const pct = Number(d.percent || d.off) || 0
    return pct >= 1 && pct <= 90 ? Math.round(p * (1 - pct / 100)) : p
  }
  const np = Number(d.price) || 0
  const op = Number(d.oldPrice) || 0
  if (!np || !op || np >= op) return p
  return Math.round(p * np / op)
}

/** Mahsulotga tegishli aksiya(lar)dan eng arzonini qaytaradi. */
export function promoFor(product, promos = [], today = tashkentToday()) {
  let best = null
  let bestPrice = Infinity
  for (const d of promos) {
    if (!d || !isLive(d, today)) continue
    if (String(d.sellerId || '') !== String(product.sellerId || '')) continue
    if (d.scope !== 'all' && String(d.productId) !== String(product.id)) continue
    const price = promoPrice(d, product.basePrice ?? product.price)
    if (price < bestPrice) { best = d; bestPrice = price }
  }
  return best
}

const clean = (s) => String(s ?? '').replace(/[\p{Cc}<>]/gu, ' ').replace(/\s+/g, ' ').trim()
export const cleanTitle = (s) => clean(s).slice(0, TITLE_MAX)
export const isHttpsUrl = (u) => /^https:\/\/[^\s"'<>\\`]+$/i.test(String(u || '').trim()) && String(u).length <= 500

/**
 * Forma tekshiruvi. v: { scope, product_id, mode ('percent'|'price'), percent, price, starts_on, ends_on, title, banner_url, file }
 * product — tanlangan mahsulot ({ price }). Qaytaradi: { maydon: xabar }.
 */
export function validateAksiya(v, product, today = tashkentToday()) {
  const e = {}
  const scope = v.scope === 'all' ? 'all' : 'product'
  const title = cleanTitle(v.title)
  if (scope === 'all' && title.length < 3) e.title = 'Aksiya nomini kiriting (kamida 3 belgi)'
  if (String(v.title || '').length > TITLE_MAX) e.title = `Nom ${TITLE_MAX} belgidan oshmasin`
  if (scope === 'product') {
    if (!product) e.product_id = 'Mahsulotni tanlang'
    else if (!(Number(product.price) > 0)) e.product_id = 'Mahsulot narxi kiritilmagan'
  }
  const mode = scope === 'all' ? 'percent' : v.mode === 'price' ? 'price' : 'percent'
  if (mode === 'percent') {
    const pct = Number(v.percent)
    if (String(v.percent ?? '').trim() === '') e.percent = 'Chegirma foizini kiriting'
    else if (!Number.isInteger(pct) || pct < 1 || pct > 90) e.percent = 'Chegirma 1% dan 90% gacha bo‘lsin'
  } else if (product) {
    const price = Number(String(v.price ?? '').replace(/\D/g, ''))
    if (!price) e.price = 'Aksiya narxini kiriting'
    else if (price >= Number(product.price)) e.price = 'Aksiya narxi hozirgi narxdan past bo‘lsin'
  }
  const s = v.starts_on || today
  if (!v.ends_on) e.ends_on = 'Tugash sanasini kiriting'
  else if (v.ends_on < s) e.ends_on = 'Tugash sanasi boshlanishdan oldin bo‘lmasin'
  else if (v.ends_on < today) e.ends_on = 'Tugash sanasi o‘tgan kun bo‘lmasin'
  else if ((Date.parse(v.ends_on) - Date.parse(s)) / 864e5 > 365) e.ends_on = 'Aksiya muddati 1 yildan oshmasin'
  if (v.banner_url && !isHttpsUrl(v.banner_url)) e.banner = 'Banner havolasi https:// bilan boshlanishi kerak'
  if (v.file) {
    if (!BANNER_TYPES.includes(v.file.type)) e.banner = 'Faqat JPG, PNG yoki WEBP rasm yuklang'
    else if (v.file.size > BANNER_MAX_MB * 1024 * 1024) e.banner = `Rasm ${BANNER_MAX_MB} MB dan oshmasin`
  }
  return e
}

/** Forma → seller_promotions qatori (server old_price/price ni qayta hisoblaydi). */
export function toRow(v, product) {
  const scope = v.scope === 'all' ? 'all' : 'product'
  const pct = scope === 'all' || v.mode !== 'price'
  const row = {
    scope, title: cleanTitle(v.title), banner_url: String(v.banner_url || '').trim(),
    starts_on: v.starts_on, ends_on: v.ends_on,
    product_id: scope === 'all' ? null : product?.id || null,
    percent: pct ? Number(v.percent) : null,
  }
  if (scope === 'product') {
    row.old_price = Number(product?.price) || null
    row.price = pct ? Math.round(Number(product?.price) * (1 - Number(v.percent) / 100)) : Number(String(v.price).replace(/\D/g, ''))
  } else { row.old_price = null; row.price = null }
  return row
}

/** Sotuvchi kabinetidagi holat. */
export function statusOf(r, today = tashkentToday()) {
  if (!r.active) return ['To‘xtatilgan', 'off']
  if (r.ends_on < today) return ['Tugagan', 'off']
  if (r.starts_on > today) return ['Rejalashtirilgan', 'mid']
  return ['Faol', 'on']
}

/** Supabase xatolarini tushunarli qilish. */
export function aksiyaError(e) {
  const m = String(e?.message || e || '')
  if (e?.code === '23505' || /one_active/.test(m)) return 'Bu mahsulotda allaqachon faol aksiya bor. Avval uni to‘xtating.'
  if (e?.code === '42P01' || e?.code === 'PGRST205' || /seller_promotions/.test(m) && /exist|schema/.test(m)) return 'Aksiyalar hali ishga tushmagan'
  if (/scope|banner_url|title|percent/.test(m) && /column/.test(m)) return 'Aksiyalar yangilanmoqda — birozdan so‘ng qayta urinib ko‘ring'
  return m || 'Xatolik yuz berdi'
}
