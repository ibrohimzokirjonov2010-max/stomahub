import { som } from './marketData'

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

export const colors = [
  { id: 'teal', name: 'Yashil (Teal)', hex: '#128f8a' },
  { id: 'navy', name: 'To‘q ko‘k', hex: '#1d3d66' },
  { id: 'blue', name: 'Ko‘k', hex: '#2f6fed' },
  { id: 'white', name: 'Oq', hex: '#f3f4f2' },
  { id: 'green', name: 'Yashil', hex: '#3c9a58' },
  { id: 'wine', name: 'Bordo', hex: '#7a3048' },
  { id: 'black', name: 'Qora', hex: '#22262c' },
  { id: 'lilac', name: 'Siyohrang', hex: '#8d6bb8' },
]

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

export const sizeChart = [
  ['XS', '80–84', '62–66', '155–160'],
  ['S', '84–88', '66–70', '160–165'],
  ['M', '88–92', '70–74', '165–170'],
  ['L', '92–96', '74–78', '170–175'],
  ['XL', '96–102', '78–84', '175–180'],
  ['XXL', '102–108', '84–90', '180–185'],
]

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
  off: 14,
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

export function getForma(id) {
  return products.find((p) => p.id === id) || null
}

export function colorOf(id) {
  return colors.find((c) => c.id === id) || colors[0]
}
