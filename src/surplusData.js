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
const raw = [
  ['filtek-z350-xt', 'Filtek Z350 XT', 'Kompozit (4 g)', '3M', 'komp', '10/2027', 'Toshkent', 'Dr. Nodira', 4.9, 12, 850000, 1200000, 'Yopiq', '-29%'],
  ['optibond-fl', 'OptiBond FL Bonding (8 ml)', '', 'Kerr', 'bond', '10/2028', 'Samarqand', 'Dr. Azizbek', 4.9, 9, 1000000, 1250000, 'Yopiq', '-20%'],
  ['sdr-flow', 'SDR flow+ Bulk fill', 'Kompozit (2 g)', 'Dentsply', 'komp', '05/2027', 'Toshkent', 'Dr. Malika', 4.9, 15, 382000, 450000, 'Yopiq', '-15%'],
  ['protaper-gold', 'ProTaper Gold', 'Endodontik fayllar (6 dona)', 'Dentsply', 'instr', '12/2028', 'Buxoro', 'Dr. Sardor', 4.8, 8, 900000, 1200000, 'Yopiq', '-25%'],
  ['straumann-blt', 'Straumann BLT Implant', '(4.1 × 10 mm)', 'Straumann', 'impl', '11/2029', 'Toshkent', 'Dr. Kamol', 4.9, 6, 3850000, 4700000, 'Yopiq', '-18%'],
  ['gc-fuji-plus', 'GC Fuji PLUS', 'Sement (15 g)', 'GC', 'sement', '09/2027', 'Toshkent', 'Dr. Dilshod', 4.7, 10, 950000, null, 'Yopiq', null],
  ['nsk-ti-max', 'NSK Ti-Max X600L', 'Uchlik (turbina)', 'NSK', 'instr', '10/2028', 'Toshkent', 'Dr. Shaxzod', 4.9, 14, 4650000, 5650000, 'Yopiq', '-25%'],
  ['woodpecker-eq-v', 'Woodpecker EQ-V', 'Apeks lokator', 'Woodpecker', 'other', '07/2027', 'Toshkent', 'Dr. Nilufar', 4.8, 7, 2450000, 3500000, 'Yopiq', '-30%'],
  ['clearfil-se-bond-2', 'Clearfil SE Bond 2', 'Bonding to‘plami', 'Kuraray', 'bond', '03/2027', 'Namangan', 'Dr. Umid', 4.7, 6, 1520000, 1900000, 'Ochilgan', '-20%'],
  ['ultracain-ds-forte', 'Ultracain D-S forte', 'Anestezik (100 karpula)', 'Septodont', 'anes', '06/2027', 'Toshkent', 'Dr. Sarvinoz', 4.8, 11, 420000, null, 'Yopiq', null],
  ['g-aenial-achord', 'G-aenial A’CHORD', 'Kompozit (4 g)', 'GC', 'komp', '12/2027', 'Toshkent', 'Dr. Behzod', 4.9, 9, 1100000, 1500000, 'Yopiq', '-27%'],
  ['woodpecker-uds-e', 'Woodpecker UDS-E', 'Ultrasonik skaler', 'Woodpecker', 'other', '12/2027', 'Andijon', 'Dr. Feruza', 4.8, 5, 1950000, null, 'Yopiq', null],
]

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
    seller: { name: 'Dr. Ibrohim', avatar: img('seller') },
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
  rating: 4.9,
  reviews: 12,
  views: 256,
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
    name: 'Dr. Ibrohim Zokirjonov',
    avatar: img('seller'),
    rating: 4.9,
    reviews: 28,
    deals: 56,
    city: 'Toshkent',
    place: 'Klinika',
    reply: '5 daqiqa ichida',
    telegram: 'https://t.me/',
    phone: '+998 90 123 45 67',
  },
}

export const similarSurplus = [
  { id: 'filtek-a2-lot', name: 'Filtek Z350 XT', type: 'Kompozit (A2)', brand: '3M', price: 800000, oldPrice: 1000000, discount: '-20%', condition: 'Yopiq', city: 'Toshkent', image: img('i1'), cat: 'komp', expiry: '10/2028', rating: 4.8, reviews: 9, seller: { name: 'Dr. Nodira', avatar: img('u1') } },
  { id: 'optibond-fl', name: 'OptiBond FL', type: 'Bonding (8 ml)', brand: 'Kerr', price: 950000, oldPrice: 1250000, condition: 'Yopiq', city: 'Samarqand', image: img('i2'), cat: 'bond', expiry: '10/2028', rating: 4.9, reviews: 9, seller: { name: 'Dr. Azizbek', avatar: img('u2') } },
  { id: 'sdr-similar', name: 'SDR flow+', type: 'Kompozit (2 g)', brand: 'Dentsply', price: 370000, oldPrice: 450000, discount: '-18%', condition: 'Yopiq', city: 'Buxoro', image: img('i3'), cat: 'komp', expiry: '05/2027', rating: 4.8, reviews: 11, seller: { name: 'Dr. Malika', avatar: img('u3') } },
  { id: 'protaper-similar', name: 'ProTaper Gold', type: 'Endodontik fayllar', brand: 'Dentsply', price: 900000, oldPrice: 1200000, condition: 'Yopiq', city: 'Toshkent', image: img('i4'), cat: 'instr', expiry: '12/2028', rating: 4.8, reviews: 8, seller: { name: 'Dr. Sardor', avatar: img('u4') } },
  { id: 'gc-fuji-plus', name: 'GC Fuji PLUS', type: 'Sement (15 g)', brand: 'GC', price: 950000, oldPrice: 1250000, discount: '-25%', condition: 'Yopiq', city: 'Toshkent', image: img('i6'), cat: 'sement', expiry: '09/2027', rating: 4.7, reviews: 10, seller: { name: 'Dr. Dilshod', avatar: img('u6') } },
]

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
      phone: '+998 90 123 45 67',
    },
  }
}

export function getSurplusDetail(id) {
  if (!id || id === surplusDetail.id) return surplusDetail
  const item = surplusItems.find((p) => p.id === id) || similarSurplus.find((p) => p.id === id)
  return item ? fromItem(item) : surplusDetail
}

export function similarFor(id) {
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
