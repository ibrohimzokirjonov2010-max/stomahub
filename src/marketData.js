const img = (n) => `/images/market/${n}.jpg`

export const filterChips = [
  { key: 'all', label: 'Barchasi' },
  { key: 'komp', label: 'Kompozitlar' },
  { key: 'bond', label: 'Bondlar' },
  { key: 'endo', label: 'Endodontiya' },
  { key: 'impl', label: 'Implantlar' },
  { key: 'orto', label: 'Ortodontiya' },
  { key: 'uch', label: 'Uchliklar' },
  { key: 'asb', label: 'Asboblar' },
  { key: 'usk', label: 'Uskunalar' },
  { key: 'gig', label: 'Gigiyena' },
]

export const categoryCounts = [
  ['all', 'Barchasi', 0], ['komp', 'Kompozitlar', 0], ['bond', 'Bondlar', 0], ['endo', 'Endodontiya', 0],
  ['impl', 'Implantlar', 0], ['orto', 'Ortodontiya', 0], ['uch', 'Uchliklar', 0], ['asb', 'Asboblar', 0], ['usk', 'Uskunalar', 0], ['gig', 'Gigiyena', 0],
]

export const brands = [
  ['3M', 0], ['Kerr', 0], ['Dentsply', 0], ['Tokuyama', 0], ['GC', 0], ['Ivoclar', 0], ['NSK', 0], ['W&H', 0],
  ['Kuraray', 0], ['Straumann', 0], ['J. Morita', 0], ['Woodpecker', 0], ['Woson', 0],
]

// Live list: filled from Supabase (active seller_products) by buyerApi.loadMarketProducts().
export const marketProducts = []

export const initialCart = []

export const productDetail = {
  id: 'optibond-solo-plus',
  name: '',
  type: '',
  brand: '',
  rating: 0,
  reviews: 0,
  sold: '',
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
  default: { name: '', logo: '', about: '', rating: 0, reviews: 0, city: '' },
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
    highlights: s.specs?.length ? s.specs.map(([k, v]) => `${k}: ${v}`) : null,
    variants: s.variants?.length ? s.variants.map((v) => ({ label: v.name || v.label || v.sku, sku: v.sku, price: Number(v.price) || s.price, stock: Number(v.stock) || 0 })) : null,
    specs: [
      ...(s.brand ? [['Brend', s.brand]] : []),
      ...(s.specs || []),
      ['Kategoriya', s.category || '—'],
      ['Sotuvchi', s.seller || '—'],
      ['Omborda', `${s.stock} dona`],
    ],
  }
}

export const som = (n) => `${(Number(n) || 0).toLocaleString('ru-RU').replace(/ /g, ' ')} so‘m`
