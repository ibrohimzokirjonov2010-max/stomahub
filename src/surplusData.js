import { UZ_CITIES } from './lib/uzRegions'
import { tashkentToday } from './tashkentDate'
const img = (n) => `/images/surplus/${n}.jpg`

export const surplusChips = [
  { key: 'all', label: 'Barchasi' },
  { key: 'komp', label: 'Kompozit' },
  { key: 'bond', label: 'Bond' },
  { key: 'sement', label: 'Sement' },
  { key: 'impl', label: 'Implant' },
  { key: 'instr', label: 'Instrument' },
  { key: 'anes', label: 'Anesteziya' },
  { key: 'other', label: 'Boshqa' },
]

export const cities = UZ_CITIES
export const conditions = ['Yopiq', 'Ochilgan']

const catName = Object.fromEntries(surplusChips.map((c) => [c.key, c.label]))

const country = {
  '3M': 'AQSh',
  Kerr: 'AQSh',
  Dentsply: 'AQSh',
  Straumann: 'Shveytsariya',
  GC: 'Yaponiya',
  NSK: 'Yaponiya',
  Kuraray: 'Yaponiya',
  Septodont: 'Fransiya',
  Woodpecker: 'Xitoy',
}

// expiry — "OO/YYYY". discount — dizayndagi yorliq, hisobdan farq qilsa beriladi
const raw = []

export const surplusItems = raw.map(([id, name, type, brand, cat, expiry, city, seller, rating, reviews, price, oldPrice, condition, discount], i) => ({
  id, name, type, brand, cat, expiry, city, rating, reviews, price, oldPrice, condition,
  seller: { name: seller, avatar: img(`u${i + 1}`) },
  discount: discount || (oldPrice ? `-${Math.round((1 - price / oldPrice) * 100)}%` : null),
  image: img(`i${i + 1}`),
  order: i,
}))

/**
 * Ortiqcha material e’lonini tekshiradi. Xatolar obyektini qaytaradi (bo‘sh — hammasi joyida).
 * expiry: "YYYY-MM" (input type=month). Server (0048 trigger) ham shu qoidalarni tekshiradi.
 */
export function validateSurplus({ name, price, oldPrice, expiry, image, city }) {
  const errs = {}
  if (!String(name || '').trim()) errs.name = 'Nomini kiriting'
  if (!(Number(price) > 0)) errs.price = 'Narxni kiriting'
  else if (Number(oldPrice) > 0 && Number(price) >= Number(oldPrice)) errs.price = 'Narx asl narxdan past bo‘lishi kerak'
  if (!expiry) errs.expiry = 'Yaroqlilik muddatini tanlang'
  else if (expiry < tashkentToday().slice(0, 7)) errs.expiry = 'Yaroqlilik muddati o‘tgan mahsulotni joylab bo‘lmaydi'
  if (!image) errs.image = 'Kamida bitta rasm yuklang'
  if (!city) errs.city = 'Shaharni tanlang'
  return errs
}

export const similarSurplus = []

function fromItem(item) {
  const opened = item.condition === 'Ochilgan'
  const vol = (item.type || '').replace(/[()]/g, '').trim() || '1 to‘plam'
  const state = opened ? 'Qisman ishlatilgan' : 'Yangi'
  return {
    id: item.id,
    cat: item.cat || 'other',
    name: item.name,
    brand: item.brand,
    category: catName[item.cat] || 'Material',
    condition: item.condition || 'Yopiq',
    state,
    expiry: item.expiry || '—',
    rating: 0,
    reviews: 0,
    views: 0,
    pending: !!item._pending,
    price: item.price,
    oldPrice: item.oldPrice || null,
    short: item.note || `${item.brand} ${item.name}. ${opened ? 'Qadoq ochilgan' : 'Yopiq, ishlatilmagan'}.`,
    description: item.note || `${item.brand} ${item.name}${item.type ? ` — ${item.type}` : ''}. Holati: ${opened ? 'ochilgan' : 'yopiq'}. Yaroqlilik muddati: ${item.expiry || '—'}.`,
    facts: [
      ['qty', 'Miqdor', `${item.qty || 1} dona`],
      ['vol', 'Hajm', vol],
      ['city', 'Shahar', item.city || '—'],
    ],
    specs: [
      ['Brend', item.brand],
      ['Mahsulot nomi', item.name],
      ['Turi', item.type || 'Stomatologik material'],
      ['Holati', `${item.condition || 'Yopiq'}, ${opened ? 'qisman ishlatilgan' : 'yangi'}`],
      ['Yaroqlilik muddati', item.expiry || '—'],
      ['Shahar', item.city],
      ['Ishlab chiqarilgan mamlakat', country[item.brand] || '—'],
    ],
    images: (item.images?.length ? item.images : [item.image]).filter(Boolean),
    thumbs: (item.images?.length ? item.images : [item.image]).filter(Boolean),
    seller: {
      name: item.seller?.name || 'Shifokor',
      avatar: item.seller?.avatar || '',
      rating: 0,
      reviews: 0,
      deals: 0,
      city: item.city || '',
      place: '',
      reply: '',
      telegram: '',
      phone: item.phone || '',
    },
  }
}

export function getSurplusDetail(id) {
  if (!id) return null
  const item = surplusItems.find((p) => p.id === id) || similarSurplus.find((p) => p.id === id)
  return item ? fromItem(item) : null
}

export function similarFor(id) {
  if (!surplusItems.length) return []
  return surplusItems
    .filter((p) => p.id !== id)
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      brand: p.brand,
      price: p.price,
      oldPrice: p.oldPrice,
      discount: p.discount,
      condition: p.condition,
      city: p.city,
      image: p.image,
    }))
}
