const img = (n) => `/images/market/${n}.jpg`

export const filterChips = [
  { key: 'all', label: 'Barchasi' },
  { key: 'komp', label: 'Kompozitlar' },
  { key: 'bond', label: 'Bondlar' },
  { key: 'endo', label: 'Endodontiya' },
  { key: 'impl', label: 'Implantlar' },
  { key: 'uch', label: 'Uchliklar' },
  { key: 'asb', label: 'Asboblar' },
  { key: 'usk', label: 'Uskunalar' },
  { key: 'gig', label: 'Gigiyena' },
]

export const categoryCounts = [
  ['all', 'Barchasi', '1 248'], ['komp', 'Kompozitlar', 186], ['bond', 'Bondlar', 84], ['endo', 'Endodontiya', 152],
  ['impl', 'Implantlar', 96], ['uch', 'Uchliklar', 74], ['asb', 'Asboblar', 210], ['usk', 'Uskunalar', 128], ['gig', 'Gigiyena', 98],
]

export const brands = [
  ['3M', 124], ['Kerr', 86], ['Dentsply', 102], ['Tokuyama', 64], ['GC', 78], ['Ivoclar', 56], ['NSK', 48], ['W&H', 42],
  ['Kuraray', 38], ['Straumann', 34], ['J. Morita', 29], ['Woodpecker', 27], ['Woson', 21],
]

// Live list: filled from Supabase (active seller_products) by buyerApi.loadMarketProducts().
export const marketProducts = []

export const initialCart = []

export const productDetail = {
  id: 'optibond-solo-plus',
  name: 'OptiBond Solo Plus',
  type: 'Universal adgeziv (5 ml)',
  brand: 'Kerr',
  rating: 4.8,
  reviews: 96,
  sold: '1 250',
  price: 275000,
  oldPrice: 323529,
  badge: '-15%',
  stock: '20+',
  short: 'Yagona shisha flakonda total-etch bonding. Emal va dentinga ishonchli yopishish. Klinikada keng qo‘llaniladigan universal adgeziv.',
  description: 'OptiBond Solo Plus — universal adgeziv bo‘lib, emal va dentinga ishonchli yopishishni ta’minlaydi. Total-etch texnikasida qo‘llaniladi. Yuqori adgeziv kuch, minimal sezuvchanlik va qulay ishlash xususiyatiga ega.',
  features: ['Yuqori adgeziv kuch', 'Emal va dentinga ishonchli yopishish', 'Keng klinik qo‘llanish', 'Ishlash uchun qulay va tejamkor'],
  specs: [
    ['Brend', 'Kerr'], ['Mahsulot turi', 'Universal adgeziv'], ['Hajm', '5 ml'], ['Qo‘llash usuli', 'Total-etch'],
    ['Yaroqlilik muddati', '09/2028'], ['Lot raqami', 'KE3028484'], ['Ishlab chiqarilgan mamlakat', 'AQSh'],
  ],
  images: [img('g-main'), img('g2'), img('g3'), img('g4'), img('g5')],
  thumbs: [img('g1'), img('g2'), img('g3'), img('g4'), img('g5')],
  highlights: ['Universal adgeziv (total-etch, self-etch, selective-etch)', 'A’lo darajada bog‘lanish kuchi', 'Minimal postoperativ sezuvchanlik', 'Shisha ionomer, kompozit va keramik materiallar bilan mos'],
  variants: [{ label: '5 ml', price: 275000, oldPrice: 323500 }, { label: '3 × 5 ml (to‘plam)', price: 770000, oldPrice: 970500 }],
}

// Similar products are taken from the live list (same category first).
export const similarProducts = []
export const similarTo = (p, n = 4) => {
  const rest = marketProducts.filter((x) => x.id !== p?.id)
  return [...rest.filter((x) => x.cat && x.cat === p?.cat), ...rest.filter((x) => !x.cat || x.cat !== p?.cat)].slice(0, n)
}

export const sellers = {
  default: { name: 'DentalShop', logo: 'Dental', about: 'Stomatologik materiallar', rating: 4.9, reviews: 320, city: 'Toshkent' },
}

// Returns a detail-shaped object for a live product, or null when it is not (or no longer) on sale.
export function productById(id) {
  const s = marketProducts.find((x) => x.id === id)
  if (!s) return null
  const images = s.images?.length ? s.images : [s.image]
  return {
    ...s,
    oldPrice: undefined,
    badge: '',
    sold: '',
    images,
    thumbs: images,
    crumb: s.cat || 'Mahsulot',
    short: s.description ? s.description.slice(0, 180) : '',
    description: s.description || 'Sotuvchi tavsif qo‘shmagan.',
    features: [],
    highlights: null,
    variants: s.variants?.length ? s.variants.map((v) => ({ label: v.name || v.label || v.sku, sku: v.sku, price: Number(v.price) || s.price, stock: Number(v.stock) || 0 })) : null,
    specs: [['Brend', s.brand || '—'], ['Kategoriya', s.cat || '—'], ['Sotuvchi', s.seller || '—'], ['Omborda', `${s.stock} dona`]],
  }
}

export const som = (n) => `${(Number(n) || 0).toLocaleString('ru-RU').replace(/ /g, ' ')} so‘m`
