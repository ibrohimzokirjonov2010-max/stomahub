import { som, marketProducts } from './marketData'
import { FORMA_COLORS } from './config/productCatalog'
import { sizesFor, CLOTHING_CHART } from './lib/formaSizes'
import { isFormaMarketProduct, marketToForma } from './lib/formaLive'

const img = (name) => `/images/forma/${name}.jpg`

export const money = (n) => som(n)

export const cats = [
  ['all', 'Barchasi'],
  ['scrub', 'Skrab to‘plam'],
  ['coat', 'Xalat'],
  ['cap', 'Qalpoq'],
  ['shoe', 'Tibbiy poyabzal'],
  ['apron', 'Fartuk'],
  ['accessory', 'Aksessuarlar'],
]

export const genders = [
  ['male', 'Erkak'],
  ['female', 'Ayol'],
  ['uni', 'Uniseks'],
]

export const allSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']

export const colors = FORMA_COLORS

export const fabrics = [
  ['cotton', 'Paxta-poliester'],
  ['stretch', 'Stretch (cho‘ziluvchan)'],
  ['premium', 'Premium mato'],
  ['anti', 'Antibakterial'],
]

export const brands = ['Bestex', 'Cherokee', 'Dickies', 'HNL', 'Zhengxing', 'Mediform', 'Adiform', 'Labwear']

export const sorts = {
  popular: 'Eng mashhur',
  cheap: 'Narxi: arzon → qimmat',
  rich: 'Narxi: qimmat → arzon',
  fresh: 'Yangi mahsulotlar',
  rating: 'Reyting',
}

export const sizeChart = CLOTHING_CHART

export const tiers = [
  ['10+ dona', '−10%'],
  ['30+ dona', '−20%'],
  ['50+ dona', '−30%'],
  ['100+ dona', 'Maxsus narx'],
]

const base = []

export const premium = {
  id: 'premium-stretch',
  title: 'Stomatolog formasi Premium Stretch',
  brand: 'BESTEX',
  about: 'Elastik mato, nafas oladi, antibakterial ishlov',
  gender: 'uni',
  cat: 'scrub',
  fabric: 'stretch',
  sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  colors: ['teal', 'navy', 'white', 'wine', 'black'],
  price: 389000,
  oldPrice: 450000,
  off: Math.round((1 - 389000 / 450000) * 100),
  rating: 0,
  reviews: 0,
  sold: 0,
  image: img('hero'),
  gallery: [img('hero'), img('back'), img('folded'), img('fabric')],
  fresh: true,
  story: 'Stomatologlar uchun zamonaviy va qulay Premium Stretch forma. Elastik mato harakat erkinligini ta’minlaydi, uzoq ish kunida ham qulaylik beradi. Klinika va shifoxonalarda foydalanish uchun ideal tanlov.',
  perks: [
    ['Elastik va qulay mato', 'Cho‘kmaydi va rangini yo‘qotmaydi'],
    ['Nafas oluvchi va tez quriydigan', 'Amaliy cho‘ntaklar'],
    ['Antibakterial ishlov', 'Zamonaviy dizayn'],
    ['Ko‘p martalik yuvishga bardoshli', 'Ayollar va erkaklar uchun mos'],
  ],
  cloth: [
    ['72% Polyester', 'Antibakterial ishlov'],
    ['21% Viskoza', 'Nafas oluvchi'],
    ['7% Spandeks', '60°C gacha yuvish mumkin'],
    ['', 'Oson dazmollanadi'],
  ],
}

const more = []

export const products = []

export const similarIds = ['mediform', 'adiform', 'labwear', 'hnl-xalat', 'bestex-bordo', 'cherokee-flex']

/** Sotuvchi kabinetidan qo‘shilgan (haqiqiy, sotuvdagi) forma mahsulotlari — market_products dan. */
export function liveForma() {
  return marketProducts.filter(isFormaMarketProduct).map(marketToForma)
}

/** Forma bo‘limi: avval haqiqiy sotuvchi mahsulotlari, keyin katalog (namuna) yozuvlari. */
export function allForma() {
  return [...liveForma(), ...products]
}

export function getForma(id) {
  return liveForma().find((p) => p.id === id) || products.find((p) => p.id === id) || null
}

export function colorOf(id) {
  return colors.find((c) => c.id === id) || colors[0]
}

/** Tanlash uchun o‘lchamlar (oyoq kiyim — EU raqamlar, bitta o‘lcham — «Universal»): lib/formaSizes. */
export const shoeSizes = Array.from({ length: 12 }, (_, i) => String(35 + i))
export function sizesOf(p) {
  return sizesFor(p)
}
