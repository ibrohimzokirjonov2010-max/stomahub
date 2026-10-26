import { useEffect, useState } from 'react'

const img = (name) => `/images/aksiyalar/${name}.jpg`
const left = (d, h, m, s) => d * 86400 + h * 3600 + m * 60 + s

export const som = (n) => `${n.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m`

export function useCountdown(start) {
  const [sec, setSec] = useState(start)
  useEffect(() => {
    setSec(start)
    const id = setInterval(() => setSec((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [start])
  return sec
}

export function clock(sec) {
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const p = (n) => String(n).padStart(2, '0')
  return `${d} kun ${p(h)}:${p(m)}:${p(s)}`
}

const sellerOf = (brand) => ({
  name: `${brand} Uzbekistan`,
  role: 'Rasmiy diler',
  products: '120+',
  rating: 4.8,
  reply: '5 daqiqa',
  address: 'Toshkent, Yakkasaroy tumani',
})

export const deals = [
  {
    id: 'filtek-universal',
    name: 'Filtek Universal Composite',
    brand: '3M',
    off: 30,
    price: 350000,
    oldPrice: 500000,
    rating: 4.8,
    reviews: 124,
    sold: '120+',
    stock: 24,
    left: left(2, 12, 30, 15),
    image: img('aksiya-filtek'),
    images: [img('aksiya-filtek')],
    about: 'Filtek Universal Composite — old va orqa tishlar uchun universal nanogibrid kompozit. Rang barqaror, yaltiroq va kundalik restavratsiyada qulay ishlaydi.',
    points: ['Universal ranglar, old va orqa tishlar', 'Yuqori yaltiroq va rang barqarorligi', 'Qulay shprits, aniq dozalar', 'Past polimerizatsiya cho‘kishi'],
  },
  {
    id: 'implant-tizimi',
    name: 'Implant tizimi',
    brand: 'Straumann',
    off: 25,
    price: 2250000,
    oldPrice: 3000000,
    rating: 4.9,
    reviews: 86,
    sold: '90+',
    stock: 8,
    left: left(5, 8, 15, 42),
    image: img('aksiya-implant'),
    images: [img('aksiya-implant')],
    about: 'Straumann implant tizimi — suyak ichiga o‘rnatiladigan implant va tayanch. Birlamchi barqarorlik va uzoq muddatli protezlash uchun mo‘ljallangan.',
    points: ['Titan implant va tayanch', 'Aniq protez ulanishi', 'Rasmiy kafolat', 'Steril qadoq'],
  },
  {
    id: 'endo-fayllar',
    name: 'Endo fayllar to‘plami',
    brand: 'Dentsply Sirona',
    off: 20,
    price: 480000,
    oldPrice: 600000,
    rating: 4.7,
    reviews: 52,
    sold: '70+',
    stock: 30,
    left: left(1, 18, 45, 20),
    image: img('aksiya-files'),
    images: [img('aksiya-files')],
    about: 'Endo fayllar to‘plami — kanalni kengaytirish va shakllantirish uchun nikel-titan fayllar. Turli o‘lchamlar bitta to‘plamda.',
    points: ['Bir nechta o‘lcham', 'Egri kanallar uchun mos', 'Rangli tutqichlar', 'Steril qadoq'],
  },
  {
    id: 'led-lampa',
    name: 'LED fotopolimer lampa',
    brand: 'Woodpecker',
    off: 35,
    price: 1300000,
    oldPrice: 2000000,
    rating: 4.8,
    reviews: 96,
    sold: '50+',
    stock: 14,
    left: left(3, 21, 10, 33),
    image: img('aksiya-lamp'),
    images: [img('aksiya-lamp')],
    about: 'LED fotopolimer lampa — kompozitni tez va tekis qotiradi. Yengil korpus va zaryadlanuvchi taglik bilan klinikada qulay.',
    points: ['Keng to‘lqin diapazoni', 'Bir nechta rejim', 'Zaryadlovchi taglik', 'Yengil tutqich'],
  },
  {
    id: 'stomatologik-unit',
    name: 'Stomatologik unit',
    brand: 'Cingol',
    off: 28,
    price: 21500000,
    oldPrice: 30000000,
    rating: 4.9,
    reviews: 38,
    sold: '30+',
    stock: 3,
    left: left(6, 14, 22, 10),
    image: img('aksiya-unit'),
    images: [img('aksiya-unit')],
    about: 'Stomatologik unit — kreslo, lampa va asbob bloki bilan to‘liq davolash o‘rni. Kundalik qabul uchun mo‘ljallangan.',
    points: ['Kreslo va chiroq', 'Asbob bloki', 'O‘rnatish xizmati', 'Rasmiy kafolat'],
  },
  {
    id: 'a-silikon',
    name: 'A-silikon otpechatka materiali',
    brand: 'Zhermack',
    off: 15,
    price: 1020000,
    oldPrice: 1200000,
    rating: 4.8,
    reviews: 67,
    sold: '100+',
    stock: 18,
    left: left(4, 9, 17, 55),
    image: img('aksiya-silikon'),
    images: [img('aksiya-silikon')],
    about: 'A-silikon otpechatka materiali — aniq protez va ortopedik ishlar uchun. Barqaror o‘lcham va qulay aralashtirish.',
    points: ['Yuqori aniqlik', 'Barqaror o‘lcham', 'Oson aralashadi', 'Ikki komponent'],
  },
  {
    id: 'ultratovush-skaler',
    name: 'Ultratovushli skaler',
    brand: 'Woodpecker',
    off: 40,
    price: 1080000,
    oldPrice: 1800000,
    rating: 4.7,
    reviews: 45,
    sold: '40+',
    stock: 11,
    left: left(7, 16, 5, 18),
    image: img('aksiya-scaler'),
    images: [img('aksiya-scaler')],
    about: 'Ultratovushli skaler — tish toshini olish va parodontal tozalash uchun. Suv idishi va bir nechta nasadka bilan.',
    points: ['Suv idishi', 'Bir nechta nasadka', 'Sokin ish rejimi', 'Oson tozalash'],
  },
  {
    id: 'ortodontik-breketlar',
    name: 'Ortodontik breketlar',
    brand: 'Ormco',
    off: 22,
    price: 980000,
    oldPrice: 1250000,
    rating: 4.8,
    reviews: 58,
    sold: '80+',
    stock: 16,
    left: left(7, 11, 33, 29),
    image: img('aksiya-brackets'),
    images: [img('aksiya-brackets')],
    about: 'Ortodontik breketlar — metall tizim, to‘liq to‘plam. Aniq yopishtirish va barqaror natija uchun.',
    points: ['To‘liq to‘plam', 'Metall breketlar', 'Aniq pozitsiya', 'Rasmiy yetkazish'],
  },
  {
    id: 'endo-smart-plus',
    name: 'Endomotor Woodpecker Endo Smart Plus',
    brand: 'Woodpecker',
    off: 25,
    price: 1200000,
    oldPrice: 1600000,
    rating: 4.8,
    reviews: 96,
    sold: '60+',
    stock: 12,
    left: left(2, 14, 32, 10),
    image: img('aksiya-endo-hero'),
    images: [img('aksiya-endo-hero'), img('aksiya-endo-head'), img('aksiya-endo-screen'), img('aksiya-files'), img('aksiya-endo-case')],
    about: 'Woodpecker Endo Smart Plus — endodontik davolash uchun zamonaviy, ixcham va ishonchli endomotor. Aniqlik, xavfsizlik va qulaylikni ta’minlaydi. Katta rangli displey, bir nechta ish rejimlari va kengaytirilgan funksiyalar tufayli har qanday klinik sharoitda samarali ishlash imkonini beradi.',
    points: [
      'Endodontik davolashda yuqori aniqlik va nazorat',
      'Katta rangli displey va qulay interfeys',
      'Bir nechta ish rejimlari (CW, CCW, Reciproc va h.k.)',
      'Yengil va ergonomik dizayn',
      'Uzoq muddatli batareya',
      'Avtoklavlanadigan burchakli nasadka',
    ],
    specs: [
      ['Brend', 'Woodpecker'],
      ['Model', 'Endo Smart Plus'],
      ['Displey', 'Rangli LCD'],
      ['Rejimlar', 'CW, CCW, Reciproc'],
      ['Nasadka', 'Avtoklavlanadi'],
      ['Kafolat', '12 oy'],
    ],
    reviewList: [
      { name: 'Dr. Sardor', role: 'Endodontist', date: '12 okt 2026', stars: 5, text: 'Displey aniq, reciproc rejimi qulay. Kanalda nazorat yaxshi, kafolat rasmiy.' },
      { name: 'Dr. Madina', role: 'Stomatolog', date: '3 okt 2026', stars: 4, text: 'Yengil, batareyasi uzoq yetadi. Yetkazib berish o‘z vaqtida keldi.' },
    ],
  },
].map((d) => ({ ...d, seller: d.seller || sellerOf(d.brand), images: d.images || [d.image] }))

export const catalog = deals.filter((d) => d.list !== false)
export const getDeal = (id) => deals.find((d) => d.id === id)
export const others = (id) => catalog.filter((d) => d.id !== id).slice(0, 4)
