// Sotuvchi kabinetidan qo‘shilgan forma (seller_products, category = 'Tibbiy forma') →
// Forma bo‘limi mahsuloti; variant tanlash, savat qatori va savol matni. Sof funksiyalar.
import { FORMA_CATEGORY, formaColorName } from '../config/productCatalog.js'
import { CLOTHING_SIZES, SHOE_SIZES, ONE_SIZE } from './formaSizes.js'

const uniq = (a) => [...new Set(a.filter(Boolean))]
const ORDER = [...CLOTHING_SIZES, 'XXL', ...SHOE_SIZES, ONE_SIZE]
const bySize = (a, b) => (ORDER.indexOf(a) + 1 || 999) - (ORDER.indexOf(b) + 1 || 999)

export const isFormaMarketProduct = (p) => !!p && String(p.rawCategory || p.category || '').trim() === FORMA_CATEGORY

/** toMarketProduct() natijasi → Forma kartochkasi/sahifasi shakli. */
export function marketToForma(p) {
  const f = p.forma && typeof p.forma === 'object' ? p.forma : {}
  const variants = (Array.isArray(p.variants) ? p.variants : []).filter((v) => v && (v.size || v.color))
  const prices = variants.map((v) => Number(v.price) || 0).filter((x) => x > 0)
  const price = prices.length ? Math.min(...prices) : Number(p.price) || 0
  const text = String(p.description || '').trim()
  return {
    id: p.id,
    live: true,
    sellerId: p.sellerId,
    seller: p.seller || 'Sotuvchi',
    title: p.name,
    brand: p.brand || p.seller || '',
    about: text.split(/(?<=[.!?])\s/)[0].slice(0, 110),
    story: text,
    image: p.image,
    gallery: p.images?.length ? p.images : [p.image].filter(Boolean),
    price,
    oldPrice: Number(p.oldPrice) > price ? Number(p.oldPrice) : 0,
    cat: f.cat || 'scrub',
    gender: f.gender || 'uni',
    fabric: f.fabric || '',
    sizeType: f.size_type || '',
    sizes: uniq(variants.map((v) => v.size)).sort(bySize),
    colors: uniq(variants.map((v) => v.color)),
    variants,
    kashtaPrice: Math.max(0, Number(f.kashta_price) || 0),
    stock: Number(p.stock) || 0,
    rx: !!p.rx,
    rank: 0,
    rating: 0,
    reviews: 0,
  }
}

/** Tanlangan o‘lcham + rangga mos variant (rangsiz/o‘lchamsiz mahsulotda — bittasi yetarli). */
export function pickVariant(p, size, color) {
  const vs = p?.variants || []
  if (!vs.length) return null
  return vs.find((v) => (!p.sizes.length || v.size === size) && (!p.colors.length || v.color === color)) || null
}

/** O‘lcham shu rangda omborda bormi. */
export function sizeInStock(p, size, color) {
  const v = pickVariant(p, size, color)
  return !!v && Number(v.stock) > 0
}

export const KASHTA_MAX = 60
export const cleanKashta = (t) => String(t || '').replace(/\s+/g, ' ').trim().slice(0, KASHTA_MAX)

function hash(t) {
  let h = 0
  for (const ch of t) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h.toString(36)
}

/**
 * Savat qatori (cart.add shakli). Logo tikish yoqilgan / kashta bo‘lsa — narxga sotuvchining kashta narxi
 * qo‘shiladi; izoh matni buyurtma qatoriga (seller_order_items.note), logo fayl yo‘li — logo_path ga (0066).
 * Logo faylini mahsulot sahifasida yoki rasmiylashtirishda yuklash mumkin (logoOn: true, logo: yo‘l | yo‘q).
 * Har xil izoh — alohida savat qatori; logo fayli qatorni ajratmaydi (rasmiylashtirishda almashtiriladi).
 */
export function formaCartLine(p, v, kashtaText = '', logoOn = false, file = null) {
  if (!p?.live || !v) return null
  const on = p.kashtaPrice > 0
  const kashta = on ? cleanKashta(kashtaText) : ''
  const wantLogo = on && !!logoOn
  const logo = wantLogo ? String(file?.path || '').trim() : ''
  const extra = !!(kashta || wantLogo)
  const label = [v.size, v.color && formaColorName(v.color)].filter(Boolean).join(', ')
  const tag = wantLogo ? 'logo bilan' : kashta ? 'kashta' : ''
  return {
    id: `${p.id}-${v.sku}${extra ? `-k${hash(`${kashta}|${wantLogo ? 'L' : ''}`)}` : ''}`,
    productId: p.id,
    variant: v.sku,
    sellerId: p.sellerId,
    seller: p.seller,
    name: `${p.title}${label ? ` (${label}${tag ? `, ${tag}` : ''})` : tag ? ` (${tag})` : ''}`,
    type: label,
    price: (Number(v.price) || p.price) + (extra ? p.kashtaPrice : 0),
    image: p.image,
    stock: Math.max(0, Number(v.stock) || 0),
    ...(kashta ? { kashta } : {}),
    ...(wantLogo ? { logoOn: true } : {}),
    ...(logo ? { logo, logoName: String(file?.name || ''), logoSize: Number(file?.size) || 0 } : {}),
  }
}

/** «Sotuvchiga savol» — Telegram’da oldindan to‘ldiriladigan matn. */
export function formaQuestionText({ p, size, color, url }) {
  const pick = [size && `o‘lcham: ${size}`, color && `rang: ${formaColorName(color)}`].filter(Boolean).join(', ')
  return [
    'Assalomu alaykum! StomaHub’dagi mahsulotingiz haqida savolim bor:',
    `${p.title}${pick ? ` (${pick})` : ''}`,
    url,
  ].filter(Boolean).join('\n')
}
