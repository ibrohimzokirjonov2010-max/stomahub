const face = (n) => `/images/bemorlar/${n}.jpg`
const kat = (n) => `/images/kategoriyalar/${n}.jpg`
const sem = (n) => `/images/seminars/${n}.jpg`

export const SPECS = [
  ['all', 'Barchasi'],
  ['stomatolog', 'Stomatolog'],
  ['implantolog', 'Implantolog'],
  ['ortodont', 'Ortodont'],
  ['endodont', 'Endodont'],
  ['jarroh', 'Jarroh'],
  ['estetik', 'Estetik'],
  ['pediatr', 'Bolalar'],
]

export const CITIES = ['Toshkent', 'Samarqand', 'Buxoro', 'Andijon']

const S = {
  implant: { name: 'Implant qo‘yish', note: 'Zamonaviy implant tizimlari bilan', price: 4500000, img: kat('kat-implant') },
  zirkon: { name: 'Zirkoniy koronka', note: 'Yuqori estetik va mustahkam', price: 2200000, img: kat('kat-ortopediya') },
  plomba: { name: 'Plomba (kompozit)', note: 'Estetik tiklash', price: 350000, img: '/images/market/tooth.jpg' },
  clean: { name: 'Professional tozalash', note: 'Tish toshlarini olib tashlash', price: 400000, img: face('bemor-intra') },
  breket: { name: 'Breket tizimi', note: 'Metall yoki keramik breketlar', price: 9000000, img: sem('smile') },
  aligner: { name: 'Elaynerlar', note: 'Ko‘rinmas tekislash', price: 14000000, img: sem('aligner') },
  kanal: { name: 'Kanal davolash', note: 'Mikroskop ostida, 1 kanal', price: 600000, img: sem('micro') },
  sinus: { name: 'Sinus lifting', note: 'Suyak hajmini oshirish', price: 3800000, img: sem('surgery') },
  venir: { name: 'Vinirlar', note: 'Keramik, 1 tish', price: 3000000, img: face('bemor-intra') },
  oq: { name: 'Tish oqartirish', note: 'Klinikada, 1 seans', price: 1200000, img: sem('teeth') },
  bola: { name: 'Bolalar plombasi', note: 'Og‘riqsiz, rangli plomba', price: 250000, img: '/images/channels/kids.jpg' },
  kons: { name: 'Konsultatsiya', note: 'Ko‘rik va davolash rejasi', price: 100000, img: '/images/market/tooth.jpg' },
}

const WORKS = [sem('teeth'), face('bemor-rvg'), face('bemor-intra'), sem('smile'), face('bemor-opg'), face('bemor-kt')]

const R = [
  { name: 'Shahzoda T.', date: '12 okt 2026', stars: 5, text: 'Juda e’tiborli shifokor. Hamma narsani tushuntirib berdi, og‘riqsiz davoladi.' },
  { name: 'Bekzod M.', date: '28 sen 2026', stars: 5, text: 'Implant qo‘ydirdim, natijadan juda mamnunman. Klinika toza va zamonaviy.' },
  { name: 'Nodira A.', date: '3 sen 2026', stars: 4, text: 'Yaxshi mutaxassis, faqat navbat biroz uzoq bo‘ldi.' },
]

export const DOCTORS = [
  {
    id: 'azizbek-karimov', name: 'Dr. Azizbek Karimov', role: 'Implantolog, jarroh', specs: ['implantolog', 'jarroh'], focus: 'Implantologiya',
    rating: 4.9, reviews: 124, city: 'Toshkent', district: 'Chilonzor', exp: 8, patients: '300+', cert: true, online: true,
    tags: ['Implantatsiya', 'Suyak plastikasi', 'Sinus lift'], photo: face('bemor-aziz'), clinic: 'Implant Pro Clinic', phone: '+998 90 123 45 67',
    about: 'Implantologiya va suyak plastikasi bo‘yicha mutaxassis. Murakkab atrofiyalarda ham bir bosqichli yechimlarni qo‘llaydi.',
    services: [S.implant, S.sinus, S.zirkon, S.kons],
  },
  {
    id: 'nilufar-abdullayeva', name: 'Dr. Nilufar Abdullayeva', role: 'Ortodont', specs: ['ortodont'], focus: 'Ortodontiya',
    rating: 4.8, reviews: 96, city: 'Toshkent', district: 'Yunusobod', exp: 6, patients: '500+', cert: true, online: true,
    tags: ['Breket tizimlari', 'Elaynerlar', 'Tish qatorini tuzatish'], photo: face('bemor-dilnoza'), clinic: 'Smile Line', phone: '+998 91 222 33 44',
    about: 'Bolalar va kattalar ortodontiyasi. Breket va elayner bilan tishlovni tuzatish, raqamli rejalashtirish.',
    services: [S.breket, S.aligner, S.kons],
  },
  {
    id: 'sardor-ismoilov', name: 'Dr. Sardor Ismoilov', role: 'Endodontist', specs: ['endodont', 'stomatolog'], focus: 'Endodontiya',
    rating: 4.9, reviews: 86, city: 'Samarqand', district: 'Markaz', exp: 10, patients: '700+', cert: true, online: false,
    tags: ['Endodontiya', 'Mikroskopik davolash', 'Qayta davolash'], photo: '/images/yangiliklar/yang-dilshod.jpg', clinic: 'Endo Center', phone: '+998 93 555 66 77',
    about: 'Mikroskop ostida kanal davolash va qayta davolash. Murakkab anatomiyali kanallar bilan ishlash tajribasi.',
    services: [S.kanal, S.plomba, S.kons],
  },
  {
    id: 'jahongir-rahimov', name: 'Dr. Jahongir Rahimov', role: 'Estetik stomatolog', specs: ['estetik', 'stomatolog'], focus: 'Estetika',
    rating: 4.8, reviews: 63, city: 'Toshkent', district: 'Mirobod', exp: 7, patients: '400+', cert: true, online: true,
    tags: ['Vinirlar', 'Kompozit restavratsiya', 'Estetik reabilitatsiya'], photo: face('bemor-bobur'), clinic: 'Aesthetic Dent', phone: '+998 94 777 88 99',
    about: 'Tabassum dizayni, vinirlar va kompozit restavratsiya. Har bir bemor uchun raqamli tabassum loyihasi.',
    services: [S.venir, S.oq, S.plomba, S.kons],
  },
  {
    id: 'sardor-karimov', name: 'Dr. Sardor Karimov', role: 'Stomatolog-implantolog', specs: ['implantolog', 'stomatolog'], focus: 'Implantologiya',
    rating: 4.9, reviews: 152, city: 'Toshkent', district: 'Yakkasaroy', exp: 8, patients: '600+', cert: true, online: true,
    tags: ['Implantologiya', 'Jarrohlik stomatologiya', 'Protezetika', 'Estetik stomatologiya'], photo: '/images/yangiliklar/yang-sardor.jpg', clinic: 'Dent Smile Clinic', phone: '+998 90 555 12 34',
    about: 'Zamonaviy implantologiya va jarrohlik stomatologiya bo‘yicha mutaxassis. Murakkab klinik holatlarda individual yondashuv, raqamli texnologiyalar va xalqaro standartlarga asoslangan davolash.',
    services: [S.implant, S.zirkon, S.plomba, S.clean, S.sinus],
  },
  {
    id: 'malika-saidova', name: 'Dr. Malika Saidova', role: 'Stomatolog-ortoped', specs: ['stomatolog', 'estetik'], focus: 'Ortopediya',
    rating: 4.7, reviews: 71, city: 'Buxoro', district: 'Markaz', exp: 9, patients: '500+', cert: false, online: false,
    tags: ['Koronkalar', 'Protezlash', 'Zirkoniy'], photo: face('bemor-malika'), clinic: 'Buxoro Dental', phone: '+998 95 100 20 30',
    about: 'Olinmaydigan va olinadigan protezlash, zirkoniy va E.max koronkalar.',
    services: [S.zirkon, S.venir, S.kons],
  },
  {
    id: 'sevara-aliyeva', name: 'Dr. Sevara Aliyeva', role: 'Bolalar stomatologi', specs: ['pediatr', 'stomatolog'], focus: 'Pediatriya',
    rating: 4.9, reviews: 108, city: 'Toshkent', district: 'Sergeli', exp: 5, patients: '800+', cert: true, online: true,
    tags: ['Bolalar terapiyasi', 'Profilaktika', 'Og‘riqsiz davolash'], photo: face('bemor-sevara'), clinic: 'Kids Dental', phone: '+998 97 300 40 50',
    about: 'Bolalarni qo‘rquvsiz davolash, profilaktika va sut tishlari terapiyasi.',
    services: [S.bola, S.clean, S.kons],
  },
  {
    id: 'anvar-tursunov', name: 'Dr. Anvar Tursunov', role: 'Jarroh-stomatolog', specs: ['jarroh'], focus: 'Jarrohlik',
    rating: 4.6, reviews: 49, city: 'Andijon', district: 'Markaz', exp: 12, patients: '900+', cert: true, online: false,
    tags: ['Tish olish', 'Aql tishi', 'Suyak plastikasi'], photo: face('bemor-anvar'), clinic: 'Andijon Stom', phone: '+998 99 400 50 60',
    about: 'Murakkab tish olish, aql tishlari va suyak plastikasi bo‘yicha katta tajriba.',
    services: [S.sinus, S.implant, S.kons],
  },
].map((d) => ({ ...d, works: WORKS, reviewsList: R }))

export const getDoctor = (id) => DOCTORS.find((d) => d.id === id)
export const sum = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so‘m`
