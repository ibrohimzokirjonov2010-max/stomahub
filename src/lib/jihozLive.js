// Sotuvchi kabinetidan qo‘shilgan jihoz (seller_products, category = 'Stomatologik jihozlar') →
// Jihozlar bo‘limi mahsuloti; savat qatori va Telegram savol matni. Sof funksiyalar — tests/sellerType.test.mjs.
import { JIHOZ_CATEGORY } from '../config/productCatalog.js'

export const isJihozMarketProduct = (p) => !!p && String(p.rawCategory || p.category || '').trim() === JIHOZ_CATEGORY

const KIND_NAMES = {
  unit: 'Stomatologik ustanovka', cbct: 'Rentgen va CBCT', scan: 'Intraoral skaner', autoclave: 'Avtoklav va sterilizatsiya',
  micro: 'Mikroskop', compressor: 'Kompressor va aspirator', handpiece: 'Uchliklar', lamp: 'Lampa',
}

/** toMarketProduct() natijasi → Jihozlar kartochkasi/sahifasi shakli. Hammasi yangi (status: 'new'). */
export function marketToJihoz(p) {
  const j = p.jihoz && typeof p.jihoz === 'object' ? p.jihoz : {}
  const cat = KIND_NAMES[j.cat] ? j.cat : 'unit'
  const price = Number(p.price) || 0
  const warranty = Math.max(0, Number(j.warranty) || 0)
  const year = Number(j.year) || 0
  const own = (Array.isArray(p.specs) ? p.specs : []).filter((x) => Array.isArray(x) && x[0] && x[1])
  const base = [
    ['Model', j.model || p.name],
    ['Brend', p.brand || '—'],
    ['Toifa', KIND_NAMES[cat]],
    ['Holati', 'Yangi'],
    year ? ['Yil', String(year)] : null,
    warranty ? ['Kafolat', warranty >= 12 && warranty % 12 === 0 ? `${warranty / 12} yil` : `${warranty} oy`] : null,
    j.city ? ['Shahar', j.city] : null,
    p.regCertNo ? ['Guvohnoma', p.regCertNo] : null,
  ].filter(Boolean)
  const seen = new Set(base.map(([k]) => k.toLowerCase()))
  return {
    id: p.id,
    live: true,
    sellerId: p.sellerId,
    seller: p.seller || 'Sotuvchi',
    title: p.name,
    brand: p.brand || '',
    mark: p.brand || '',
    model: j.model || '',
    crumb: KIND_NAMES[cat],
    cat,
    status: 'new',
    year: year || null,
    warranty,
    city: j.city || '',
    install: !!j.install,
    official: false,
    price,
    oldPrice: Number(p.oldPrice) > price ? Number(p.oldPrice) : 0,
    month: 0,
    image: p.image,
    gallery: p.images?.length ? p.images : [p.image].filter(Boolean),
    story: String(p.description || '').trim(),
    feature: '',
    points: [p.clinicalUse, p.deliveryInfo].filter(Boolean),
    specs: [...base, ...own.filter(([k]) => !seen.has(String(k).toLowerCase()))],
    kit: [],
    cover: [],
    deliveryInfo: p.deliveryInfo || '',
    stock: Math.max(0, Number(p.stock) || 0),
    rating: 0,
    reviews: 0,
  }
}

/** Savat qatori (cart.add shakli) — oddiy checkout (buyer_create_order) orqali sotuvchiga tushadi. */
export function jihozCartLine(p) {
  if (!p?.live) return null
  return { id: p.id, productId: p.id, sellerId: p.sellerId, seller: p.seller, name: p.title, type: p.brand, price: p.price, image: p.image, stock: p.stock }
}

/** «Sotuvchiga yozish» — Telegram’da oldindan to‘ldiriladigan matn. */
export function jihozQuestionText({ p, url, topic = '' }) {
  return [
    'Assalomu alaykum! StomaHub’dagi jihozingiz haqida savolim bor:',
    `${p.title}${p.model ? ` (${p.model})` : ''}`,
    topic,
    url,
  ].filter(Boolean).join('\n')
}
