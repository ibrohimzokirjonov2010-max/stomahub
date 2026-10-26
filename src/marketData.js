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

// price / oldPrice — so'mda, raqam
export const marketProducts = [
  { id: 'filtek-z550', name: 'Filtek Z550 XT', type: 'Kompozit (4 g)', brand: '3M', cat: 'komp', rating: 4.8, reviews: 124, price: 656000, oldPrice: 820000, badge: '-20%', image: img('p1') },
  { id: 'optibond-fl', name: 'OptiBond FL', type: 'Bonding (8 ml)', brand: 'Kerr', cat: 'bond', rating: 4.7, reviews: 98, price: 1100000, badge: 'Yangi', image: img('p2') },
  { id: 'sdr-flow', name: 'SDR flow+', type: 'Bulk fill kompozit (2 g)', brand: 'Dentsply', cat: 'komp', rating: 4.6, reviews: 76, price: 382000, oldPrice: 450000, badge: '-15%', image: img('p3') },
  { id: 'protaper-gold', name: 'ProTaper Gold', type: 'Endodontik fayllar (6 dona)', brand: 'Dentsply', cat: 'endo', rating: 4.8, reviews: 112, price: 900000, image: img('p4') },
  { id: 'ti-max-x600l', name: 'Ti-Max X600L', type: 'Uchlik (turbina)', brand: 'NSK', cat: 'uch', rating: 4.9, reviews: 64, price: 5350000, oldPrice: 5950000, badge: '-10%', image: img('p5') },
  { id: 'synea-fusion', name: 'Synea Fusion', type: 'Uchlik (turbina)', brand: 'W&H', cat: 'uch', rating: 4.8, reviews: 52, price: 6800000, badge: 'Yangi', image: img('p6') },
  { id: 'root-zx-mini', name: 'Root ZX mini', type: 'Apeks lokator', brand: 'J. Morita', cat: 'endo', rating: 4.9, reviews: 36, price: 11000000, oldPrice: 12500000, badge: '-12%', image: img('p7') },
  { id: 'g-cem-one', name: 'G-CEM ONE', type: 'Rasmiy sement (4.6 g)', brand: 'GC', cat: 'komp', rating: 4.7, reviews: 58, price: 1025000, oldPrice: 1250000, badge: '-18%', image: img('p8') },
  { id: 'straumann-blx', name: 'Straumann BLX', type: 'Implant (4.1 x 10 mm)', brand: 'Straumann', cat: 'impl', rating: 4.9, reviews: 41, price: 3840000, badge: 'Yangi', image: img('p9') },
  { id: 'clearfil-se-bond-2', name: 'Clearfil SE Bond 2', type: 'Bonding to‘plam', brand: 'Kuraray', cat: 'bond', rating: 4.8, reviews: 66, price: 1000000, oldPrice: 1250000, badge: '-20%', image: img('p10') },
  { id: 'woodpecker-uds-e', name: 'Woodpecker UDS-E', type: 'Ultrasonik skaler', brand: 'Woodpecker', cat: 'usk', rating: 4.7, reviews: 54, price: 1998000, badge: 'Yangi', image: img('p11') },
  { id: 'class-b-avtoklav', name: 'Class B avtoklav', type: '18 litr', brand: 'Woson', cat: 'usk', rating: 4.9, reviews: 28, price: 15950000, oldPrice: 21250000, badge: '-25%', image: img('p12') },
]

export const initialCart = [
  { id: 'optibond-fl', name: 'OptiBond FL', type: 'Bonding (8 ml)', price: 1100000, qty: 1, image: img('cart1'), seller: 'Dental Market' },
  { id: 'filtek-z550', name: 'Filtek Z550 XT', type: 'Kompozit (4 g)', price: 656000, qty: 2, image: img('cart2'), seller: 'Dental Market' },
  { id: 'protaper-gold', name: 'ProTaper Gold', type: 'Fayllar (6 dona)', price: 900000, qty: 1, image: img('cart3'), seller: 'Stomatex' },
  { id: 'woodpecker-uds-e', name: 'Woodpecker UDS-E', type: 'Ultrasonik skaler', price: 1998000, qty: 1, image: img('cart4'), seller: 'MedTex Servis' },
]

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

export const similarProducts = [
  { id: 'optibond-fl', name: 'OptiBond FL', type: 'Bonding (8 ml)', brand: 'Kerr', rating: 4.8, reviews: 84, price: 1100000, oldPrice: 1250000, badge: '-12%', image: img('s1') },
  { id: 'clearfil-se-bond-2', name: 'Clearfil SE Bond 2', type: 'Bonding to‘plami', brand: 'Kuraray', rating: 4.9, reviews: 72, price: 1520000, image: img('s2') },
  { id: 'single-bond-universal', name: 'Single Bond Universal', type: 'Bonding (5 ml)', brand: '3M', rating: 4.7, reviews: 61, price: 800000, oldPrice: 980000, badge: '-18%', image: img('s3') },
  { id: 'prime-bond-nt', name: 'Prime&Bond NT', type: 'Bonding (5 ml)', brand: 'Dentsply', rating: 4.6, reviews: 49, price: 750000, image: img('s4') },
]

export const sellers = {
  default: { name: 'DentalShop', logo: 'Dental', about: 'Stomatologik materiallar', rating: 4.9, reviews: 320, city: 'Toshkent' },
}

export function productById(id) {
  if (!id || id === productDetail.id) return productDetail
  const s = [...marketProducts, ...similarProducts].find((x) => x.id === id)
  if (!s) return productDetail
  return {
    ...productDetail,
    ...s,
    oldPrice: s.oldPrice,
    badge: s.badge,
    images: [s.image],
    thumbs: [s.image],
    crumb: s.type.split(' (')[0],
    short: `${s.name} — ${s.brand} brendining ${s.type.toLowerCase()} mahsuloti. Rasmiy distribyutordan, sertifikat va kafolat bilan.`,
    description: `${s.name} (${s.brand}) — klinik amaliyotda keng qo‘llaniladigan ${s.type.toLowerCase()}. Mahsulot original qadoqda, yaroqlilik muddati uzoq va sertifikatlangan.`,
    features: ['Original mahsulot, rasmiy distribyutordan', 'Sertifikat va kafolat bilan', 'Keng klinik qo‘llanish', 'Toshkent bo‘ylab 24 soatda yetkazish'],
    highlights: null,
    variants: null,
    specs: productDetail.specs.filter(([k]) => k !== 'Hajm' && k !== 'Qo‘llash usuli').map(([k, v]) => [k, k === 'Brend' ? s.brand : k === 'Mahsulot turi' ? s.type : v]),
  }
}

export const som = (n) => `${n.toLocaleString('ru-RU').replace(/ /g, ' ')} so‘m`
