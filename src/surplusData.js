import { profileStore } from './profileStore'
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

export const cities = ['Toshkent', 'Samarqand', 'Buxoro', 'Namangan', 'Andijon']
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

export function addSurplusItem({ name, type, brand, cat, expiry, city, price, oldPrice, condition, image, qty }) {
  const item = {
    id: `elon-${Date.now()}`,
    name, type, brand, cat, expiry, city, price, condition, qty,
    oldPrice: oldPrice > price ? oldPrice : null,
    rating: 5, reviews: 0,
    seller: { name: (profileStore.get()?.name || 'Shifokor'), avatar: (profileStore.get()?.avatar || img('seller')) },
    discount: oldPrice > price ? `-${Math.round((1 - price / oldPrice) * 100)}%` : null,
    image: image || surplusItems.find((p) => p.cat === cat)?.image || img('i1'),
    order: -Date.now(),
  }
  surplusItems.unshift(item)
  return item
}

export const surplusDetail = {
  id: 'filtek-z350-xt',
  cat: 'komp',
  name: 'Filtek Z350 XT A2',
  brand: '3M',
  category: 'Kompozit',
  condition: 'Yopiq',
  state: 'Yangi',
  expiry: '10/2028',
  rating: 0,
  reviews: 0,
  views: 0,
  price: 850000,
  oldPrice: 1200000,
  short: 'Sifatli universal kompozit. Rang: A2. Yopiq, ishlatilmagan. Klinikamizda ortib qolgan, arzon narxda sotaman.',
  description: '3M Filtek Z350 XT – estetik restavratsiyalar uchun universal nanogibrid kompozit. Rang: A2. 3 dona, barchasi yopiq va ishlatilmagan. Yaroqlilik muddati: 10/2028. Klinikamizda ortib qolgan, shuning uchun arzonroq narxda sotaman.',
  facts: [
    ['qty', 'Miqdor', '3 dona'],
    ['vol', 'Hajm', '4 g (1 dona)'],
    ['city', 'Shahar', 'Toshkent'],
    ['place', 'Joylashuv', 'Klinika'],
  ],
  specs: [
    ['Brend', '3M'],
    ['Mahsulot nomi', 'Filtek Z350 XT'],
    ['Turi', 'Universal kompozit'],
    ['Rang', 'A2'],
    ['Hajm', '4 g (1 dona)'],
    ['Miqdor', '3 dona'],
    ['Holati', 'Yopiq, yangi'],
    ['Yaroqlilik muddati', '10/2028'],
    ['Lot raqami', 'N892745'],
    ['Ishlab chiqarilgan mamlakat', 'AQSh'],
  ],
  images: [img('main'), img('t2'), img('t3'), img('t4'), img('t5')],
  thumbs: [img('t1'), img('t2'), img('t3'), img('t4'), img('t5')],
  seller: {
    name: 'Shifokor',
    avatar: img('seller'),
    rating: 0,
    reviews: 0,
    deals: 0,
    city: 'Toshkent',
    place: 'Klinika',
    reply: '5 daqiqa ichida',
    telegram: 'https://t.me/',
    phone: '',
  },
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
    expiry: item.expiry || '12/2028',
    rating: item.rating ?? 4.8,
    reviews: item.reviews ?? 8,
    views: 96 + (item.reviews || 8) * 18,
    price: item.price,
    oldPrice: item.oldPrice || null,
    short: opened
      ? `${item.brand} ${item.name}. Qadoq ochilgan, mahsulot yaroqli. ${item.city} shahrida, klinikada ortib qolgan.`
      : `${item.brand} ${item.name}. Yopiq, ishlatilmagan. ${item.city}dagi klinikada ortib qolgan, arzon narxda sotiladi.`,
    description: `${item.brand} ${item.name}${item.type ? ` — ${item.type}` : ''}. Mahsulot ${opened ? 'ochilgan, lekin klinikada yaroqli holatda saqlangan' : 'zavod qadog‘ida, ochilmagan va ishlatilmagan'}. Yaroqlilik muddati: ${item.expiry}. ${item.city} shahridagi stomatologiya klinikasida ortiqcha qolgani uchun bozor narxidan pastroq taklif etiladi.`,
    facts: [
      ['qty', 'Miqdor', item.qty > 1 ? `${item.qty} dona` : '1 to‘plam'],
      ['vol', 'Hajm', vol],
      ['city', 'Shahar', item.city],
      ['place', 'Joylashuv', 'Klinika'],
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
    images: [item.image, item.image, item.image, item.image, item.image],
    thumbs: [item.image, item.image, item.image, item.image, item.image],
    seller: {
      name: item.seller?.name || 'Shifokor',
      avatar: item.seller?.avatar || img('u1'),
      rating: item.rating ?? 4.8,
      reviews: (item.reviews || 8) + 16,
      deals: 18 + (item.reviews || 8),
      city: item.city,
      place: 'Klinika',
      reply: '10 daqiqa ichida',
      telegram: 'https://t.me/',
      phone: '',
    },
  }
}

export function getSurplusDetail(id) {
  if (!id) return null
  if (id === surplusDetail.id && surplusItems.some((p) => p.id === id)) return surplusDetail
  const item = surplusItems.find((p) => p.id === id) || similarSurplus.find((p) => p.id === id)
  return item ? fromItem(item) : null
}

export function similarFor(id) {
  if (!surplusItems.length) return []
  if (!id || id === surplusDetail.id) return similarSurplus
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
