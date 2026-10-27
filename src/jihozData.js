const photo = (name) => `/images/jihozlar/${name}.jpg`

export function money(n) {
  return `${Number(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m`
}

export const catList = [
  ['all', 'Barchasi'],
  ['unit', 'Stomatologik ustanovka'],
  ['cbct', 'Rentgen va CBCT'],
  ['scan', 'Intraoral skaner'],
  ['autoclave', 'Avtoklav va sterilizatsiya'],
  ['micro', 'Mikroskop'],
  ['compressor', 'Kompressor va aspirator'],
  ['handpiece', 'Uchliklar'],
  ['lamp', 'Lampa'],
]
export const catName = Object.fromEntries(catList)

export const statusList = [
  ['new', 'Yangi'],
  ['used', 'Ishlatilgan'],
  ['demo', 'Ko‘rgazmali'],
]
export const statusName = Object.fromEntries(statusList)

export const primaryBrands = ['Sirona', 'Planmeca', 'KaVo', 'NSK', 'W&H', 'Carl Zeiss', '3shape', 'Melag']
export const warranties = [6, 12, 24, 36]
export const cities = ['Toshkent', 'Samarqand', 'Andijon', 'Buxoro', 'Namangan', 'Farg‘ona']
export const sorts = {
  popular: 'Eng mashhur',
  cheap: 'Narxi: arzon → qimmat',
  rich: 'Narxi: qimmat → arzon',
  fresh: 'Yangi mahsulotlar',
  rating: 'Reyting',
}
export const perks = [
  ['Rasmiy distribyutorlar', 'BadgeCheck'],
  ['Kafolat va servis', 'ShieldCheck'],
  ['Lizing / bo‘lib to‘lash', 'CreditCard'],
  ['O‘rnatish xizmati', 'Wrench'],
]
export const why = [
  ['Rasmiy distribyutorlar', 'Original mahsulotlar'],
  ['Kafolat va servis', 'Butun O‘zbekiston bo‘ylab'],
  ['Lizing / bo‘lib to‘lash', 'Qulay to‘lov shartlari'],
  ['O‘rnatish va trening', 'Mutaxassislar tomonidan'],
  ['Klinikangizga yetkazish', 'Texnik qo‘llab-quvvatlash'],
  ['24/7 maslahat', 'Muhandis doim aloqada'],
]

const base = (p) => ({
  status: 'new',
  year: 2024,
  warranty: 24,
  lizing: true,
  install: true,
  official: true,
  city: 'Toshkent',
  rating: 0,
  reviews: 0,
  feature: 'O‘rnatish va kafolat bilan',
  month: Math.round(p.price / 12 / 1000) * 1000,
  ...p,
})

const designed = []

export const fengdan = base({
  id: 'fengdan-ql2028',
  brand: 'Fengdan',
  mark: 'FENGDAN',
  title: 'Dental unit Fengdan QL2028',
  crumb: 'Stomatologik kreslo',
  cat: 'unit',
  year: 2024,
  warranty: 24,
  feature: 'O‘rnatish va trening bilan',
  price: 68500000,
  oldPrice: 82000000,
  month: 5708000,
  rating: 0,
  reviews: 0,
  sold: '220+',
  image: photo('fengdan'),
  gallery: [photo('fengdan'), photo('fengdan-arm'), photo('fengdan-screen'), photo('fengdan-room')],
  story: 'Fengdan QL2028 – zamonaviy va ishonchli stomatologik ustanovka. Ergonomik dizayn, shifokor va bemor uchun qulaylik, keng funksionallik va sifatli materiallar klinikangiz uchun ideal tanlovdir.',
  points: [
    'Zamonaviy ergonomik dizayn',
    'Shifokor va bemor uchun qulay',
    'Ishonchli va bardoshli komponentlar',
    'Keng funksionallik',
    'Klinikalar uchun optimal yechim',
  ],
  specs: [
    ['Model', 'QL2028'],
    ['Quvvat', '220V / 50Hz'],
    ['Yoritish', '8 000 – 26 000 lux'],
    ['Kreslo harakati', 'Gidravlik, 9 xotira bilan'],
    ['Boshqaruv paneli', 'Sensorli, ergonomik displey'],
    ['Uchliklar', '4 teshikli / 2 teshikli (ixtiyoriy)'],
    ['Ultratovush skaler', 'Mavjud (EMS/NSK)'],
    ['Pnevmatik tupurugich', 'Mavjud'],
    ['Suv tizimi', 'Avtomatik dezinfeksiya'],
    ['Og‘irligi', '210 kg'],
  ],
  kit: [
    'Stomatologik kreslo',
    'Shifokor bloki (3 ta uchlik)',
    'Assistent bloki',
    'LED operatsion chiroq',
    'Pnevmatik tupurugich',
    'Suv va havo tizimi',
    'Raqamli boshqaruv paneli',
    'Ultratovush skaler',
    'O‘rnatish yo‘riqnomasi',
  ],
  cover: [
    '2 yil rasmiy kafolat',
    'Toshkentda servis markazi',
    'Original ehtiyot qismlar',
    'O‘rnatish va sozlash',
    'O‘qitish (trening)',
  ],
})

const similar = []

const seeds = [
  ['NSK', 'NSK', 'handpiece', 'NSK Ti-Max Z95L', 4800000, 'ivoclar'],
  ['W&H', 'W&H', 'handpiece', 'W&H Synea Vision', 6500000, 'ivoclar'],
  ['Woodpecker', 'WOODPECKER', 'handpiece', 'Woodpecker U600', 3200000, 'ivoclar'],
  ['Sirona', 'SIRONA', 'unit', 'Sirona Intego Ambition', 165000000, 'sirona'],
  ['Planmeca', 'PLANMECA', 'cbct', 'Planmeca ProX', 310000000, 'planmeca'],
  ['KaVo', 'KAVO', 'unit', 'KaVo Estetica E50', 98000000, 'kavo'],
  ['Carl Zeiss', 'ZEISS', 'micro', 'Zeiss OPMI pico', 240000000, 'zeiss'],
  ['3shape', '3shape', 'scan', '3Shape TRIOS 3', 120000000, 'trios'],
  ['Melag', 'MELAG', 'autoclave', 'Melag Vacuklav 23', 28000000, 'melag'],
  ['Cattani', 'CATTANI', 'compressor', 'Cattani Turbo-Jet', 18000000, 'cattani'],
  ['Ivoclar', 'ivoclar', 'lamp', 'Ivoclar Bluephase G4', 7200000, 'ivoclar'],
  ['Fengdan', 'FENGDAN', 'unit', 'Fengdan QL3000', 54000000, 'plus'],
  ['Runyes', 'RUNYES', 'unit', 'Runyes S400', 46000000, 'runyes'],
  ['Anthos', 'ANTHOS', 'unit', 'Anthos A3', 78000000, 'anthos'],
  ['Diplomat', 'DIPLOMAT', 'unit', 'Diplomat Adept DA170', 69000000, 'diplomat'],
  ['A-dec', 'A-DEC', 'unit', 'A-dec 500', 210000000, 'sirona'],
  ['Belmont', 'BELMONT', 'unit', 'Belmont Clesta', 150000000, 'kavo'],
  ['Fona', 'FONA', 'cbct', 'Fona XPan 3D', 190000000, 'planmeca'],
  ['Stern Weber', 'STERN', 'unit', 'Stern Weber S200', 88000000, 'anthos'],
  ['NSK', 'NSK', 'lamp', 'NSK LED operatsion chiroq', 5400000, 'ivoclar'],
  ['W&H', 'W&H', 'autoclave', 'W&H sterilizator', 22000000, 'melag'],
]

const cityOf = ['Toshkent', 'Toshkent', 'Samarqand', 'Andijon', 'Buxoro', 'Namangan', 'Farg‘ona']
const extras = []

export const products = []
export const similarIds = similar.map((p) => p.id)
export const compareSeed = ['sirona-intego', 'planmeca-promax']

export function getJihoz(id) {
  return products.find((p) => p.id === id) || null
}

export function specsOf(p) {
  if (p.specs) return p.specs
  return [
    ['Model', p.title],
    ['Brend', p.brand],
    ['Toifa', catName[p.cat]],
    ['Yil', `${p.year}`],
    ['Holati', statusName[p.status]],
    ['Kafolat', `${p.warranty} oy`],
    ['Shahar', p.city],
  ]
}

export function kitOf(p) {
  if (p.kit) return p.kit
  return ['Asosiy qurilma', 'O‘rnatish yo‘riqnomasi', 'Kafolat taloni', p.install ? 'O‘rnatish xizmati' : 'Yetkazib berish']
}

export function coverOf(p) {
  if (p.cover) return p.cover
  return [`${p.warranty / 12 >= 1 ? `${p.warranty / 12} yil` : `${p.warranty} oy`} kafolat`, 'Original ehtiyot qismlar', 'Servis qo‘llab-quvvatlash', p.install ? 'O‘rnatish va sozlash' : 'Masofadan maslahat']
}

export const installer = {
  name: 'Sardor Rahimov',
  rating: 0,
  reviews: 0,
  city: 'Toshkent',
  brands: ['Fengdan', 'Sirona', 'KaVo'],
  price: 1500000,
  photo: photo('installer'),
}
export const engineer = photo('engineer')

export const shipping = [
  ['Toshkent shahri', 'Bepul', '1 kun'],
  ['Toshkent viloyati', money(350000), '2–3 kun'],
  ['Boshqa viloyatlar', money(350000), '3–5 kun'],
]
