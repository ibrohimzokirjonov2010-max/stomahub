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

const base = [
  { id: 'bestex-erkak', title: 'Erkaklar skrab to‘plam', brand: 'Bestex', about: 'Paxta-poliester, qulay va nafas oladi', gender: 'male', cat: 'scrub', fabric: 'cotton', sizes: ['S', 'M', 'L', 'XL'], colors: ['teal', 'navy', 'black'], price: 380000, oldPrice: 450000, off: 15, rating: 4.8, reviews: 120, image: img('man-teal'), fresh: false },
  { id: 'cherokee-ayol', title: 'Ayollar skrab to‘plam', brand: 'Cherokee', about: 'Stretch mato, antibakterial', gender: 'female', cat: 'scrub', fabric: 'stretch', sizes: ['XS', 'S', 'M', 'L'], colors: ['navy', 'wine', 'black'], price: 420000, rating: 4.8, reviews: 86, image: img('woman-navy') },
  { id: 'hnl-xalat', title: 'Tibbiy xalat (erkaklar)', brand: 'HNL', about: 'Premium mato, klinika logosi bilan', gender: 'male', cat: 'coat', fabric: 'premium', sizes: ['S', 'M', 'L', 'XL', '2XL'], colors: ['white', 'navy'], price: 520000, rating: 4.7, reviews: 52, image: img('coat') },
  { id: 'bestex-ayol', title: 'Ayollar skrab to‘plam', brand: 'Bestex', about: 'Stretch mato, nafas oladi', gender: 'female', cat: 'scrub', fabric: 'stretch', sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: ['lilac', 'teal', 'navy'], price: 390000, rating: 4.8, reviews: 95, image: img('woman-lilac') },
  { id: 'zheng-shoe', title: 'Tibbiy poyabzal', brand: 'Zhengxing', about: 'Ayollar, sirpanmaydigan', gender: 'female', cat: 'shoe', fabric: 'premium', sizes: ['S', 'M', 'L', 'XL'], colors: ['white', 'black'], price: 290000, rating: 4.6, reviews: 73, image: img('clogs') },
  { id: 'bestex-cap', title: 'Tibbiy qalpoq', brand: 'Bestex', about: 'Paxta, sozlanadigan', gender: 'uni', cat: 'cap', fabric: 'cotton', sizes: ['S', 'M', 'L'], colors: ['navy', 'teal', 'white'], price: 85000, rating: 4.8, reviews: 64, image: img('cap') },
  { id: 'hnl-apron', title: 'Himoya fartuk', brand: 'HNL', about: 'Suv o‘tkazmaydigan mato', gender: 'uni', cat: 'apron', fabric: 'anti', sizes: ['S', 'M', 'L', 'XL'], colors: ['green', 'navy'], price: 120000, rating: 4.7, reviews: 38, image: img('apron') },
  { id: 'bestex-bag', title: 'Aksessuarlar (organayzer)', brand: 'Bestex', about: 'Qulay va chidamli', gender: 'uni', cat: 'accessory', fabric: 'premium', sizes: ['M'], colors: ['navy', 'black'], price: 95000, rating: 4.8, reviews: 50, image: img('bag') },
]

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
  rating: 4.8,
  reviews: 126,
  sold: 210,
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

const more = [
  ['mediform', 'Ayollar skrab to‘plam', 'Mediform', 'female', 'scrub', 'stretch', 320000, 4.7, 64, 'woman-navy'],
  ['adiform', 'Erkaklar skrab to‘plam', 'Adiform', 'male', 'scrub', 'cotton', 355000, 4.8, 91, 'man-teal'],
  ['labwear', 'Tibbiy xalat', 'Labwear', 'uni', 'coat', 'premium', 330000, 4.6, 38, 'coat'],
  ['bestex-bordo', 'Skrab to‘plam Bordo', 'Bestex', 'female', 'scrub', 'stretch', 350000, 4.7, 22, 'woman-lilac'],
  ['cherokee-flex', 'Skrab to‘plam Flex', 'Cherokee', 'uni', 'scrub', 'stretch', 390000, 4.9, 73, 'woman-navy'],
  ['dickies-erkak', 'Erkaklar skrab Classic', 'Dickies', 'male', 'scrub', 'cotton', 360000, 4.5, 44, 'man-teal'],
  ['hnl-ayol-xalat', 'Tibbiy xalat (ayollar)', 'HNL', 'female', 'coat', 'premium', 490000, 4.8, 31, 'coat'],
  ['bestex-qalpoq-2', 'Jarrohlik qalpoq', 'Bestex', 'uni', 'cap', 'cotton', 79000, 4.6, 28, 'cap'],
  ['zheng-clog-black', 'Tibbiy poyabzal qora', 'Zhengxing', 'male', 'shoe', 'premium', 310000, 4.7, 40, 'clogs'],
  ['hnl-fartuk-2', 'Steril fartuk', 'HNL', 'uni', 'apron', 'anti', 145000, 4.5, 19, 'apron'],
  ['bestex-sumka', 'Navbatchi sumkasi', 'Bestex', 'uni', 'accessory', 'premium', 125000, 4.8, 33, 'bag'],
  ['cherokee-cap', 'Tibbiy qalpoq', 'Cherokee', 'female', 'cap', 'cotton', 92000, 4.4, 17, 'cap'],
  ['dickies-ayol', 'Ayollar skrab to‘plam', 'Dickies', 'female', 'scrub', 'anti', 410000, 4.6, 26, 'woman-lilac'],
  ['labwear-fartuk', 'Laboratoriya fartugi', 'Labwear', 'uni', 'apron', 'anti', 99000, 4.3, 14, 'apron'],
  ['adiform-xalat', 'Klinik xalat', 'Adiform', 'male', 'coat', 'premium', 470000, 4.7, 21, 'coat'],
  ['mediform-poyabzal', 'Yengil poyabzal', 'Mediform', 'uni', 'shoe', 'premium', 275000, 4.5, 36, 'clogs'],
]

export const products = [
  ...base.map((p, i) => ({ ...p, rank: i, gallery: [p.image, img('folded'), img('fabric')] })),
  { ...premium, rank: base.length },
  ...more.map(([id, title, brand, gender, cat, fabric, price, rating, reviews, image], i) => ({
    id, title, brand, about: 'Klinikada kiyish uchun qulay va chidamli.', gender, cat, fabric,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['teal', 'navy', 'black'].slice(0, 2 + (i % 2)),
    price, rating, reviews, image: img(image),
    gallery: [img(image), img('folded')],
    fresh: i % 5 === 0,
    rank: base.length + 1 + i,
  })),
]

export const similarIds = ['mediform', 'adiform', 'labwear', 'hnl-xalat', 'bestex-bordo', 'cherokee-flex']

export function getForma(id) {
  return products.find((p) => p.id === id) || null
}

export function colorOf(id) {
  return colors.find((c) => c.id === id) || colors[0]
}
