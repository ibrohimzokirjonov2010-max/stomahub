const img = (n) => `/images/${n}.jpg`
const U = (n) => img(`ustalar/${n}`)

export const som = (n) => `${Number(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m`

export const USTA_CATS = [
  ['all', 'Barchasi'],
  ['kreslo', 'Kreslo'],
  ['rentgen', 'Rentgen'],
  ['ornatish', 'O‘rnatish'],
  ['tamir', 'Ta’mirlash'],
  ['konsult', 'Konsultatsiya'],
]
export const USTA_CITIES = ['Toshkent', 'Samarqand', 'Andijon', 'Buxoro']

const SVC = {
  turbina: ['Turbina ta’miri', 'Tozalash, podshipnik almashtirish', U('usta-work-wire'), 'Turbina'],
  qolcha: ['Qo‘lcha ta’miri', 'Tozalash, moylash, detallar almashtirish', U('usta-work-wire'), 'Qo‘lcha'],
  mikromotor: ['Mikromotor ta’miri', 'Cho‘tka, rotor va kabel almashtirish', U('usta-work-hands'), 'Mikromotor'],
  endomotor: ['Endomotor ta’miri', 'Diagnostika va ta’mirlash', img('product-3'), 'Endomotor'],
  apeks: ['Apekslokator ta’miri', 'Kalibrovka, kabel va klips almashtirish', img('offer-endomotor'), 'Apekslokator'],
  ultrazvuk: ['Ultrazvuk skaler ta’miri', 'Generator, uchlik va LED ta’miri', img('product-4'), 'Ultrazvuk'],
  fizio: ['Fiziodispenser ta’miri', 'Diagnostika, plata ta’miri', img('offer-endomotor'), 'Fiziodispenser'],
  kreslo: ['Stomatologik kreslo ta’miri', 'Gidravlika, elektronika, umumiy servis', img('product-6'), 'Kreslo'],
  kresloOrnatish: ['Kreslo o‘rnatish', 'To‘liq montaj, ulash va sozlash', U('usta-work-chair'), 'O‘rnatish'],
  rentgen: ['Rentgen apparati ta’miri', 'Diagnostika, sensor va trubka tekshiruvi', U('usta-work-xray'), 'Rentgen'],
  cbct: ['CBCT kalibrovka', 'Fantom bilan kalibrovka, dasturiy sozlash', img('jihozlar/planmeca'), 'CBCT'],
  avtoklav: ['Avtoklav servisi', 'Tozalash, germetiklik, sensorlar', U('usta-work-auto'), 'Avtoklav'],
  kompressor: ['Kompressor ta’miri', 'Filtr, klapan va dvigatel servisi', img('jihozlar/cattani'), 'Kompressor'],
  konsult: ['Onlayn konsultatsiya', 'Muammoni video orqali aniqlash', U('usta-work-hands'), 'Konsultatsiya'],
}

const WORKS = [U('usta-work-wire'), U('usta-work-hands'), U('usta-work-chair'), U('usta-work-auto'), img('product-3'), img('product-6'), U('usta-work-xray'), img('product-4')]

const REVIEWS = [
  { name: 'Dilshodbek', stars: 5, date: '12 mart 2025', text: 'Turbina ta’mirini juda sifatli qilib berdi. Tez va professional. Tavsiya qilaman!' },
  { name: 'Dr. Malika Saidova', stars: 5, date: '28 fevral 2025', text: 'Kreslomizning gidravlikasini bir kunda tuzatdi, narxi oldindan aytilgandek bo‘ldi.' },
  { name: 'Smile Dental', stars: 4, date: '9 fevral 2025', text: 'Ish sifati yaxshi, faqat ehtiyot qism kelishini bir kun kutdik.' },
  { name: 'Dr. Bekzod Numonov', stars: 5, date: '21 yanvar 2025', text: 'Endomotorni diagnostika qilib, muammoni aniq topdi. Kafolat ham berdi.' },
  { name: 'City Dental', stars: 5, date: '3 yanvar 2025', text: 'Har doim telefonni ko‘taradi, shoshilinch holatda o‘sha kuni keldi.' },
]

const FACES = { [U('usta-sardor')]: '30% 12%', [U('usta-dilshod')]: '23% 15%', [U('usta-azamat')]: '26% 15%', [U('usta-bobur')]: '30% 15%', [U('usta-jasur')]: '30% 15%' }

const make = ({ services, works, reviewsFrom = 0, ...m }) => ({
  online: m.status === 'online',
  face: FACES[m.photo] || '50% 20%',
  clinic: m.role,
  warranty: '1 yil',
  speed: 'Tez',
  hours: 'Dush–Shan, 09:00–19:00',
  area: [['Toshkent shahri', '1–2 soat'], ['Toshkent viloyati', '1 kun'], ['Boshqa viloyatlar', '1–3 kun']],
  ...m,
  services: services.map(([k, price]) => {
    const [name, note, image, tag] = SVC[k]
    return { id: k, name, note, image, tag, price }
  }),
  priceFrom: Math.min(...services.map(([, p]) => p)),
  works,
  reviewsList: [...REVIEWS.slice(reviewsFrom), ...REVIEWS.slice(0, reviewsFrom)],
})

export const USTALAR = [
  make({
    id: 'azizbek-tursunov', name: 'Azizbek Tursunov', verified: true, role: 'Stomatologik jihozlar ta’miri', photo: U('usta-sardor'),
    rating: 4.9, reviews: 128, years: 5, jobs: 500, city: 'Toshkent', district: 'Chilonzor', status: 'online', phone: '+998 90 123 45 67',
    tags: ['Kreslo', 'Rentgen', 'Fiziodispenser', 'Turbina', 'Qo‘lchalar'], cats: ['kreslo', 'rentgen', 'tamir', 'konsult'],
    brands: ['Sirona', 'KaVo', 'NSK', 'W&H', 'Fengdan'],
    about: 'Stomatologik ustanovka, rentgen va qo‘l asboblarini ta’mirlash bo‘yicha 5 yillik tajriba. Original ehtiyot qismlar, har bir ishga yozma kafolat.',
    services: [['turbina', 350000], ['qolcha', 250000], ['endomotor', 400000], ['fizio', 500000], ['kreslo', 800000], ['rentgen', 600000]],
    works: [U('usta-work-chair'), img('product-6'), U('usta-work-xray'), U('usta-work-hands'), U('usta-work-wire'), U('usta-work-auto'), img('product-3'), img('jihozlar/fengdan')],
  }),
  make({
    id: 'shahzod-karimov', name: 'Shahzod Karimov', role: 'Endodontik jihozlar ustasi', photo: U('usta-dilshod'),
    rating: 4.8, reviews: 96, years: 8, jobs: 420, city: 'Toshkent', district: 'Yunusobod', status: 'busy', phone: '+998 90 234 56 78',
    tags: ['Endomotor', 'Apekslokator', 'Ultrazvuk'], cats: ['tamir', 'konsult'], brands: ['Woodpecker', 'VDW', 'Dentsply', 'EMS'],
    about: 'Endomotor, apekslokator va ultrazvuk skalerlarni plata darajasida ta’mirlayman. Diagnostika bepul.',
    services: [['endomotor', 300000], ['apeks', 200000], ['ultrazvuk', 280000], ['konsult', 100000]],
    works: [img('product-3'), img('offer-endomotor'), img('product-4'), U('usta-work-hands'), U('usta-work-wire'), img('product-3'), U('usta-work-chair'), img('product-4')],
    reviewsFrom: 1,
  }),
  make({
    id: 'jasur-mirzayev', name: 'Jasur Mirzayev', verified: true, role: 'Qo‘lchalar va turbinalar ta’miri', photo: U('usta-bobur'),
    rating: 4.9, reviews: 210, years: 7, jobs: 900, city: 'Toshkent', district: 'Mirzo Ulug‘bek', status: 'online', phone: '+998 90 345 67 89',
    tags: ['Qo‘lcha', 'Turbina', 'Mikromotor'], cats: ['tamir'], brands: ['NSK', 'KaVo', 'W&H', 'Bien-Air'],
    about: 'Turbina, burchakli va to‘g‘ri qo‘lchalar, mikromotorlarni ta’mirlash. Podshipniklar doim omborda, ko‘p ishlar 1 kunda tayyor.',
    services: [['turbina', 150000], ['qolcha', 180000], ['mikromotor', 250000]],
    works: [U('usta-work-wire'), U('usta-work-hands'), U('usta-work-wire'), img('product-3'), U('usta-work-hands'), U('usta-work-chair'), U('usta-work-wire'), img('product-4')],
    reviewsFrom: 2,
  }),
  make({
    id: 'otabek-yusupov', name: 'Otabek Yusupov', verified: true, role: 'Rentgen va CBCT muhandisi', photo: U('usta-jasur'),
    rating: 4.8, reviews: 74, years: 10, jobs: 310, city: 'Toshkent', district: 'Yakkasaroy', status: 'online', phone: '+998 90 456 78 90',
    tags: ['Rentgen', 'CBCT', 'Vizio', 'O‘rnatish'], cats: ['rentgen', 'ornatish', 'konsult'], brands: ['Planmeca', 'Vatech', 'Carestream'],
    about: 'Rentgen va CBCT apparatlarini o‘rnatish, kalibrovka va ta’mirlash. Litsenziyalangan muhandis.',
    services: [['rentgen', 300000], ['cbct', 900000], ['konsult', 150000]],
    works: [U('usta-work-xray'), img('jihozlar/planmeca'), U('usta-work-xray'), U('usta-work-hands'), img('jihozlar/planmeca'), U('usta-work-chair'), U('usta-work-xray'), U('usta-work-wire')],
    reviewsFrom: 3,
  }),
  make({
    id: 'nodir-qodirov', name: 'Nodir Qodirov', verified: true, role: 'Kreslo o‘rnatish va montaj', photo: U('usta-sardor'),
    rating: 4.9, reviews: 143, years: 11, jobs: 650, city: 'Toshkent', district: 'Uchtepa', status: 'online', phone: '+998 90 567 89 01',
    tags: ['Kreslo', 'O‘rnatish', 'Kompressor'], cats: ['kreslo', 'ornatish', 'tamir'], brands: ['Fengdan', 'Anthos', 'Sirona', 'Cattani'],
    about: 'Klinikani noldan jihozlash: kreslo montaji, kompressor va aspirator ulash, suv va havo tizimlari.',
    services: [['kresloOrnatish', 1500000], ['kreslo', 600000], ['kompressor', 400000]],
    works: [U('usta-work-chair'), img('jihozlar/fengdan'), img('product-6'), img('jihozlar/cattani'), U('usta-work-chair'), U('usta-work-hands'), img('jihozlar/fengdan'), img('product-6')],
    reviewsFrom: 4,
  }),
  make({
    id: 'bekzod-aliyev', name: 'Bekzod Aliyev', role: 'Avtoklav va sterilizatsiya', photo: U('usta-azamat'),
    rating: 4.7, reviews: 58, years: 6, jobs: 240, city: 'Samarqand', district: 'Markaz', status: 'busy', phone: '+998 91 222 33 44',
    tags: ['Avtoklav', 'Sterilizator', 'Kompressor'], cats: ['tamir'], brands: ['Melag', 'W&H', 'Euronda'],
    about: 'Avtoklav va sterilizatsiya uskunalarini servis qilish, germetiklik va sensor ta’miri.',
    services: [['avtoklav', 180000], ['kompressor', 350000]],
    works: [U('usta-work-auto'), img('jihozlar/melag'), U('usta-work-auto'), U('usta-work-hands'), img('jihozlar/melag'), img('jihozlar/cattani'), U('usta-work-auto'), U('usta-work-wire')],
    reviewsFrom: 1,
  }),
  make({
    id: 'sanjar-ergashev', name: 'Sanjar Ergashev', role: 'Kompressor va aspirator ustasi', photo: U('usta-jasur'),
    rating: 4.6, reviews: 41, years: 4, jobs: 160, city: 'Andijon', district: 'Markaz', status: 'online', phone: '+998 93 444 55 66',
    tags: ['Kompressor', 'Aspirator', 'Kreslo'], cats: ['kreslo', 'tamir', 'konsult'], brands: ['Cattani', 'Durr', 'Fengdan'],
    about: 'Kompressor, aspirator va kreslo pnevmatikasini ta’mirlash. Vodiy bo‘ylab chiqib ishlayman.',
    services: [['kompressor', 200000], ['kreslo', 500000], ['konsult', 80000]],
    works: [img('jihozlar/cattani'), U('usta-work-chair'), U('usta-work-hands'), img('product-6'), img('jihozlar/cattani'), U('usta-work-wire'), U('usta-work-chair'), U('usta-work-auto')],
    reviewsFrom: 2,
  }),
]

export const getUstaM = (id) => USTALAR.find((m) => m.id === id) || null
export const USTA_SPECS = [...new Set(USTALAR.flatMap((m) => m.services.map((s) => s.tag)))]
