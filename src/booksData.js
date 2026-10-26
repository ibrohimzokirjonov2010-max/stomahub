import { som } from './marketData'

const c = (file) => `/images/books/${file}.jpg`

export const cats = [
  ['all', 'Barchasi'],
  ['terapiya', 'Terapiya'],
  ['endo', 'Endodontiya'],
  ['impl', 'Implantologiya'],
  ['ortoped', 'Ortopediya'],
  ['orto', 'Ortodontiya'],
  ['surgery', 'Jarrohlik'],
  ['anatomy', 'Anatomiya'],
  ['atlas', 'Atlaslar'],
]

export const formatOptions = [
  ['print', 'Bosma kitob'],
  ['pdf', 'Elektron (PDF)'],
  ['both', 'Ikkalasi'],
]

export const langOptions = [
  ['uz', 'O‘zbek'],
  ['ru', 'Rus'],
  ['en', 'Ingliz'],
]

export const stockOptions = [
  ['all', 'Barchasi'],
  ['stock', 'Omborda'],
  ['preorder', 'Oldindan buyurtma'],
]

export const publisherOptions = [
  ['quintessence', 'Quintessence'],
  ['elsevier', 'Elsevier'],
  ['springer', 'Springer'],
  ['stomamedia', 'StomaMedia'],
  ['other', 'Boshqalar'],
]

export const langName = { uz: 'O‘zbek', ru: 'Rus', en: 'Ingliz' }

export const sorts = {
  popular: 'Eng ommabop',
  rating: 'Reyting',
  cheap: 'Arzonroq',
  rich: 'Qimmatroq',
  fresh: 'Yangi',
}

export const books = [
  { id: 'misch', title: 'Contemporary Implant Dentistry', author: 'Carl E. Misch', year: 2021, pages: 1040, lang: 'en', rating: 4.9, reviews: 328, price: 420000, formats: ['print', 'pdf'], cats: ['impl'], publisher: 'quintessence', stock: 'stock', badge: 'best', cover: c('misch'), isbn: '978-0-323-07845-0', blurb: 'Implant rejalash, suyak va protezlash bosqichlari. 1-bob — bemor tanlash va diagnostika.' },
  { id: 'pathways', title: 'Pathways of the Pulp', author: 'Kenneth M. Hargreaves', year: 2021, pages: 616, lang: 'en', rating: 4.8, reviews: 196, price: 480000, oldPrice: 600000, off: 20, formats: ['print', 'pdf'], cats: ['endo'], publisher: 'elsevier', stock: 'stock', cover: c('pathways'), isbn: '978-0-323-74514-5', blurb: 'Pulpa biologiyasi, kanal tayyorlash va obturatsiya. Namuna: 4-bob, ishchi uzunlik.' },
  { id: 'fixed', title: 'Fundamentals of Fixed Prosthodontics', author: 'Herbert T. Shillingburg', year: 2019, pages: 772, lang: 'en', rating: 4.7, reviews: 172, price: 450000, formats: ['print', 'pdf'], cats: ['ortoped'], publisher: 'quintessence', stock: 'stock', cover: c('fixed'), isbn: '978-0-86715-475-7', blurb: 'Qattiq protez: preparatsiya, izolyatsiya va sementlash protokollari.' },
  { id: 'proffit', title: 'Proffit Ortodontiya', author: 'William R. Proffit', year: 2018, pages: 352, lang: 'en', rating: 4.8, reviews: 185, price: 520000, formats: ['print', 'pdf'], cats: ['orto'], publisher: 'elsevier', stock: 'stock', cover: c('proffit'), isbn: '978-0-323-08917-3', blurb: 'O‘sish, tishlov va davolash mexanikasi. Namuna: diagnostika bo‘limi.' },
  { id: 'terapiya', title: 'Terapevtik stomatologiya', author: 'A. R. Rizayev', year: 2022, pages: 540, lang: 'uz', rating: 4.9, reviews: 62, price: 250000, formats: ['pdf'], cats: ['terapiya'], publisher: 'stomamedia', stock: 'stock', badge: 'new', cover: c('terapiya'), isbn: '978-9943-7711-2-8', blurb: 'Kariyes, pulpit va restavratsiya bo‘yicha o‘zbek tilidagi qo‘llanma.' },
  { id: 'netter', title: 'Atlas of Human Anatomy', author: 'Frank H. Netter', year: 2022, pages: 640, lang: 'en', rating: 4.9, reviews: 214, price: 390000, formats: ['print', 'pdf'], cats: ['anatomy', 'atlas'], publisher: 'elsevier', stock: 'stock', cover: c('netter'), isbn: '978-0-323-39322-5', blurb: 'Bosh va bo‘yin anatomiyasi, chaynash mushaklari va nervlar.' },
  { id: 'lindhe', title: 'Clinical Periodontology and Implant Dentistry', author: 'Jan Lindhe, Niklaus Lang', year: 2015, pages: 1680, lang: 'en', rating: 4.7, reviews: 154, price: 510000, oldPrice: 600000, off: 15, formats: ['print', 'pdf'], cats: ['surgery', 'impl'], publisher: 'quintessence', stock: 'stock', cover: c('perio'), isbn: '978-0-470-67501-4', blurb: 'Parodont va implant atrofi to‘qimalari. Klinik holatlar to‘plami.' },
  { id: 'endosurg', title: 'Endodontic Surgery', author: 'Domenico Ricucci', year: 2020, pages: 480, lang: 'en', rating: 4.8, reviews: 98, price: 470000, formats: ['print', 'pdf'], cats: ['endo', 'surgery'], publisher: 'quintessence', stock: 'preorder', cover: c('endosurg'), isbn: '978-1-85097-289-1', blurb: 'Apikal jarrohlik, retrograd to‘ldirish va mikroskop ostida ishlash.' },
  { id: 'atlas', title: 'Atlas of Dental Implantology', author: 'Myron Nevins, Hom-Lay Wang', year: 2021, pages: 592, lang: 'en', rating: 4.9, reviews: 128, price: 450000, formats: ['print', 'pdf'], cats: ['impl', 'atlas'], publisher: 'quintessence', stock: 'stock', cover: c('book-atlas'), isbn: '978-1-78698-087-0', blurb: 'Atlas of Dental Implantology — implantologiya sohasidagi eng nufuzli va amaliy atlaslardan biri.', featured: true },
  { id: 'cohen', title: 'Endodontiya: klinik qo‘llanma', author: 'M. Karimova', year: 2023, pages: 286, lang: 'uz', rating: 4.6, reviews: 41, price: 180000, formats: ['pdf'], cats: ['endo'], publisher: 'stomamedia', stock: 'stock', cover: c('pathways'), isbn: '978-9943-5501-4-2', blurb: 'Kanal topish va obturatsiya bo‘yicha qisqa qo‘llanma.' },
  { id: 'ortho-ru', title: 'Ортодонтия: основы', author: 'Л. С. Персин', year: 2019, pages: 410, lang: 'ru', rating: 4.5, reviews: 77, price: 310000, formats: ['print'], cats: ['orto'], publisher: 'other', stock: 'stock', cover: c('proffit'), isbn: '978-5-9704-4988-1', blurb: 'Ortodontik tashxis va apparatlar haqida rus tilidagi darslik.' },
  { id: 'springer-surg', title: 'Oral and Maxillofacial Surgery', author: 'Lars Andersson', year: 2016, pages: 920, lang: 'en', rating: 4.6, reviews: 63, price: 690000, formats: ['print', 'pdf'], cats: ['surgery'], publisher: 'springer', stock: 'preorder', cover: c('endosurg'), isbn: '978-1-119-00548-1', blurb: 'Og‘iz va yuz-jag‘ jarrohligi bo‘yicha klinik atlas.' },
  { id: 'smile-uz', title: 'Estetik restavratsiya atlasi', author: 'K. Abdulayeva', year: 2024, pages: 220, lang: 'uz', rating: 4.8, reviews: 29, price: 210000, formats: ['pdf'], cats: ['terapiya', 'atlas'], publisher: 'stomamedia', stock: 'stock', badge: 'new', cover: c('terapiya'), isbn: '978-9943-8802-1-6', blurb: 'Qatlamli kompozit va tabiiy shaffoflik bo‘yicha amaliy atlas.' },
  { id: 'anatomy-ru', title: 'Анатомия головы и шеи', author: 'М. Р. Сапин', year: 2017, pages: 360, lang: 'ru', rating: 4.4, reviews: 52, price: 160000, formats: ['print'], cats: ['anatomy'], publisher: 'other', stock: 'stock', cover: c('netter'), isbn: '978-5-9704-4012-3', blurb: 'Bosh va bo‘yin anatomiyasi, stomatologlar uchun qisqartirilgan kurs.' },
]

export const library = [
  { id: 'lib-impl', title: 'Implantologiya asoslari', author: 'Dr. S. Raximov', size: '180 MB', cover: c('misch') },
  { id: 'lib-endo', title: 'Endodontiya atlasi', author: 'Dr. M. Karimova', size: '240 MB', cover: c('pathways') },
  { id: 'lib-est', title: 'Estetik restavratsiya', author: 'Dr. K. Abdulayeva', size: '120 MB', cover: c('terapiya') },
]

export const perks = ['Yuqori sifatli rasmlar', 'Klinik holatlar', 'Bosqichma-bosqich protokol']

export const money = (n) => som(n)

export const featured = books.find((b) => b.featured)

export const pubName = { quintessence: 'Quintessence', elsevier: 'Elsevier', springer: 'Springer', stomamedia: 'StomaMedia', other: 'Boshqa' }
export const langLong = { uz: 'O‘zbekcha', ru: 'Ruscha', en: 'Inglizcha' }

export const shelf = [
  { id: 'rel-perio', title: 'Clinical Periodontology', author: 'Lang & Lindhe', year: 2015, pages: 1480, lang: 'en', rating: 4.8, reviews: 90, price: 420000, formats: ['print', 'pdf'], cats: ['surgery'], publisher: 'quintessence', stock: 'stock', cover: c('book-perio'), isbn: '978-1-118-88962-7', blurb: 'Parodont va implant atrofi to‘qimalari bo‘yicha klinik darslik.' },
  { id: 'rel-endo', title: 'Endodontic Microsurgery', author: 'Taschieri', year: 2019, pages: 420, lang: 'en', rating: 4.7, reviews: 64, price: 380000, formats: ['print', 'pdf'], cats: ['endo'], publisher: 'quintessence', stock: 'stock', cover: c('book-endo'), isbn: '978-1-85097-178-8', blurb: 'Mikroskop ostida endodontik jarrohlik.' },
  { id: 'rel-est', title: 'Esthetic Restorative Dentistry', author: 'Ritter, Boushell', year: 2018, pages: 610, lang: 'en', rating: 4.8, reviews: 71, price: 395000, formats: ['print', 'pdf'], cats: ['terapiya'], publisher: 'elsevier', stock: 'stock', cover: c('book-esthetic'), isbn: '978-0-323-47833-5', blurb: 'Estetik restavratsiya va tabiiy shaffoflik.' },
  { id: 'rel-omfs', title: 'Oral and Maxillofacial Surgery', author: 'Miloro', year: 2016, pages: 980, lang: 'en', rating: 4.6, reviews: 58, price: 510000, formats: ['print', 'pdf'], cats: ['surgery'], publisher: 'springer', stock: 'stock', cover: c('book-omfs'), isbn: '978-1-119-00548-1', blurb: 'Og‘iz va yuz-jag‘ jarrohligi bo‘yicha klinik qo‘llanma.' },
  { id: 'rel-anat', title: 'Dental Anatomy', author: 'Nelson', year: 2020, pages: 340, lang: 'en', rating: 4.7, reviews: 44, price: 320000, formats: ['print', 'pdf'], cats: ['anatomy'], publisher: 'elsevier', stock: 'stock', cover: c('book-anatomy'), isbn: '978-0-323-67243-6', blurb: 'Tish anatomiyasi va okklyuzion yuzalar.' },
  { id: 'klinik', title: 'Stomatologiya klinik amaliyotda', author: 'Dr. Azizbek Rahimov', year: 2026, pages: 320, lang: 'uz', rating: 4.9, reviews: 36, price: 180000, formats: ['pdf'], cats: ['terapiya'], publisher: 'stomamedia', stock: 'stock', cover: c('book-klinik'), isbn: '978-9943-1001-8-2', blurb: 'Diagnostika, davolash va zamonaviy yondashuvlar.' },
]

export function getBook(id) {
  return books.find((b) => b.id === id) || shelf.find((b) => b.id === id) || null
}

const atlasToc = ['Basics of Implant Therapy', 'Treatment Planning', 'Surgical Procedures', 'Hard and Soft Tissue Management', 'Prosthetic Considerations', 'Clinical Cases']

export function productOf(book) {
  const pdf = book.id === 'atlas' ? 295000 : Math.max(90000, Math.round(book.price * 0.66))
  const toc = book.id === 'atlas' ? atlasToc : ['Kirish', 'Diagnostika', 'Davolash', 'Klinik holatlar', 'Asoratlar', 'Xulosa']
  const similar = book.id === 'atlas'
    ? shelf.filter((b) => b.id.startsWith('rel-'))
    : books.filter((b) => b.id !== book.id).slice(0, 5)
  return {
    category: 'Stomatologiya',
    pdf,
    binding: book.formats.includes('print') ? 'Qattiq muqova' : 'Elektron',
    gallery: book.id === 'atlas' ? [c('book-atlas'), c('book-spread'), c('book-page'), c('book-spread')] : [book.cover, book.cover, book.cover],
    about: book.id === 'atlas'
      ? 'Atlas of Dental Implantology — implantologiya sohasidagi eng nufuzli va amaliy atlaslardan biri. Ushbu kitobda dental implantlar bo‘yicha jarrohlik va protezik bosqichlar yuqori sifatli klinik rasmlar, bosqichma-bosqich izohlar va real klinik holatlar asosida ko‘rsatilgan. Talabalar, shifokorlar va implantologlar uchun muhim qo‘llanma.'
      : book.id === 'klinik'
        ? 'Ushbu kitob stomatologiya sohasidagi asosiy klinik holatlar, ularning diagnostikasi va zamonaviy davolash usullarini batafsil yoritadi. Har bir bob amaliy misollar, rasmlar va bosqichma-bosqich tavsiyalar bilan boyitilgan. Talabalar, rezidentlar va amaliyotchi shifokorlar uchun kundalik qo‘llanma.'
        : book.blurb,
    more: 'Nashr rasmiy manbadan. Qog‘oz nusxa Toshkent bo‘ylab 1–2 kunda yetkaziladi, elektron nusxa to‘lovdan so‘ng ochiladi.',
    toc,
    reviews: book.id === 'atlas' ? [
      { name: 'Dr. Azizbek', role: 'Implantolog', date: '12 mar 2024', stars: 5, photo: c('book-azizbek'), text: 'Juda yaxshi atlas. Rasmlar sifati ajoyib, amaliyotda foydali ma’lumotlar ko‘p.' },
      { name: 'Dr. Madina', role: 'Stomatolog', date: '28 fev 2024', stars: 4, photo: c('book-madina'), text: 'Implantologiya bilan shug‘ullanuvchilar uchun majburiy kitob. Tavsiya qilaman!' },
    ] : [
      { name: 'Dr. Azizbek', role: 'Shifokor', date: '12 mar 2024', stars: 5, photo: c('book-azizbek'), text: 'Amaliyotda foydali, rasmlar tushunarli.' },
      { name: 'Dr. Madina', role: 'Stomatolog', date: '28 fev 2024', stars: 4, photo: c('book-madina'), text: 'Kutubxonada turadigan kitob. Tavsiya qilaman.' },
    ],
    similar,
  }
}

const caries = c('book-caries')

export const klinikReader = {
  title: 'Stomatologiya klinik amaliyotda',
  subtitle: 'Diagnostika, davolash va zamonaviy yondashuvlar',
  author: 'Dr. Azizbek Rahimov',
  cover: c('book-klinik'),
  pages: 320,
  start: 45,
  chapters: [
    { id: 'c1', title: '1-bob. Kirish', page: 12 },
    { id: 'c2', title: '2-bob. Kariyes va uning davolash usullari', page: 34, children: [
      { id: 's21', title: '2.1. Kariyes tushunchasi', page: 45 },
      { id: 's22', title: '2.2. Kariyesning etiologiyasi', page: 49 },
      { id: 's23', title: '2.3. Klinik ko‘rinishi', page: 52 },
      { id: 's24', title: '2.4. Diagnostika usullari', page: 58 },
      { id: 's25', title: '2.5. Davolash usullari', page: 61 },
    ] },
    { id: 'c3', title: '3-bob. Endodontik davolash', page: 70 },
    { id: 'c4', title: '4-bob. Restavratsion stomatologiya', page: 112 },
    { id: 'c5', title: '5-bob. Jarrohlik stomatologiya', page: 148 },
    { id: 'c6', title: '6-bob. Parodontologiya', page: 188 },
    { id: 'c7', title: '7-bob. Ortodontiya', page: 216 },
    { id: 'c8', title: '8-bob. Implantologiya', page: 240 },
    { id: 'c9', title: '9-bob. Bolalar stomatologiyasi', page: 278 },
  ],
  pagesOf: {
    c1: { kicker: '1-bob. Kirish', title: '1. Kirish', lead: 'Klinik amaliyot bemorni tinglash, ko‘rik va aniq tashxisdan boshlanadi. Bu bob kitobning qolgan qismiga yo‘l ochadi.', body: ['Har bir qabulda shikoyat, anamnez va og‘iz bo‘shlig‘i ko‘rigi yozib boriladi.'] },
    s21: {
      kicker: '2-bob. Kariyes va uning davolash usullari',
      title: '2.1. Kariyes tushunchasi',
      lead: 'Kariyes — bu tish qattiq to‘qimalarining mikroblar omillar ta’sirida asta-sekin yemirilishi bilan kechadigan patologik jarayon bo‘lib, u emal, dentin va sementni zararlaydi. Kariyes jarayoni ko‘p omilli bo‘lib, unda mikroorganizmlar, uglevodlar, so‘lak va bemorning individual xususiyatlari muhim rol o‘ynaydi.',
      figure: caries,
      caption: '2.1-rasm. Kariyesning rivojlanish bosqichlari',
      labels: ['Sog‘lom tish', 'Emal kariyesi', 'Dentin kariyesi', 'Pulpa yaqin kariyes'],
      after: 'Kariyes asosan Streptococcus mutans va Lactobacillus bakteriyalarining uglevodlarni fermentatsiya qilish natijasida hosil bo‘ladigan kislotalar ta’sirida tish to‘qimalarining demineralizatsiyasi bilan boshlanadi. Bu jarayon vaqt o‘tishi bilan chuqurlashib, kavitet hosil qiladi.',
      nextKicker: '2.2. Kariyesning etiologiyasi',
      nextLead: 'Kariyes rivojlanishida quyidagi asosiy omillar ishtirok etadi:',
      point: { n: 1, title: 'Mikrobiologik omil', body: 'Streptococcus mutans, Lactobacillus va boshqa kariyesogen mikroorganizmlar.' },
      points: [
        { n: 1, title: 'Mikrobiologik omil', body: 'Streptococcus mutans, Lactobacillus va boshqa kariyesogen mikroorganizmlar.' },
        { n: 2, title: 'Uglevodlar', body: 'Ayniqsa saxaroza, glyukoza va fruktoza kabi oson fermentlanadigan uglevodlar.' },
        { n: 3, title: 'So‘lak', body: 'So‘lak miqdori va tarkibi kislotalarni neytrallash hamda remineralizatsiyaga ta’sir qiladi.' },
        { n: 4, title: 'Vaqt', body: 'Kislota ta’sirining davomiyligi va takrorlanishi jarayon tezligini belgilaydi.' },
      ],
    },
    s22: { kicker: '2-bob. Kariyes va uning davolash usullari', title: '2.2. Kariyesning etiologiyasi', lead: 'Kariyes rivojlanishida mikroorganizmlar, uglevodlar, tish yuzasi va vaqt birga ishtirok etadi.', body: ['So‘lakning himoya xususiyati kislotani neytrallashga yordam beradi.'] },
    s23: { kicker: '2-bob. Kariyes va uning davolash usullari', title: '2.3. Klinik ko‘rinishi', lead: 'Kariyesning klinik ko‘rinishi jarayonning chuqurligiga bog‘liq.', body: ['Emalda dog‘, dentinda og‘riq va kavitet, pulpaga yaqin holatda sezuvchanlik kuchayadi.'] },
    s24: { kicker: '2-bob. Kariyes va uning davolash usullari', title: '2.4. Diagnostika usullari', lead: 'Ko‘rik, zond va rentgen bir-birini to‘ldiradi.', body: ['Yashirin kontakt nuqtalar ko‘pincha faqat tasvirda ko‘rinadi.'] },
    s25: { kicker: '2-bob. Kariyes va uning davolash usullari', title: '2.5. Davolash usullari', lead: 'Kariyesni davolashda minimal invaziv yondashuvlar afzal.', body: ['Dog‘ bosqichida remineralizatsiya, kavitetda esa tozalash va tiklash ko‘rib chiqiladi.'] },
    c3: { kicker: '3-bob. Endodontik davolash', title: '3. Endodontik davolash', lead: 'Pulpa yallig‘langanda kanal davolash rejalashtiriladi.', body: ['Ishchi uzunlik va obturatsiya sifatini nazorat qilish natijani belgilaydi.'] },
    c4: { kicker: '4-bob. Restavratsion stomatologiya', title: '4. Restavratsion stomatologiya', lead: 'Tiklash materiali nuqson hajmi va estetik talabga qarab tanlanadi.', body: ['Qatlamli kompozit tabiiy shaffoflikni qaytarishga yordam beradi.'] },
    c5: { kicker: '5-bob. Jarrohlik stomatologiya', title: '5. Jarrohlik stomatologiya', lead: 'Oddiy olib tashlashdan to‘qima plastikasiigacha bo‘lgan hollar shu bobda.', body: ['Ko‘rik va tasvirsiz jarrohlik reja tuzilmaydi.'] },
    c6: { kicker: '6-bob. Parodontologiya', title: '6. Parodontologiya', lead: 'Milk va suyak holati tishning uzoq umrini belgilaydi.', body: ['Gigiyena o‘qitish har qanday parodont davolashning birinchi qadami.'] },
    c7: { kicker: '7-bob. Ortodontiya', title: '7. Ortodontiya', lead: 'Tishlovni tekislash nafaqat estetik, balki gigiyena uchun ham muhim.', body: ['Yengil holatlarda aligner, murakkabroq holatda breket ko‘rib chiqiladi.'] },
    c8: { kicker: '8-bob. Implantologiya', title: '8. Implantologiya', lead: 'Yo‘qolgan tish o‘rnini implant bilan tiklash reja va suyak hajmiga bog‘liq.', body: ['Bemorga muddat, parvarish va nazorat oldindan tushuntiriladi.'] },
    c9: { kicker: '9-bob. Bolalar stomatologiyasi', title: '9. Bolalar stomatologiyasi', lead: 'Bolada yondashuv kattalarnikidan farq qiladi: qisqa qabul va tinchlantirish muhim.', body: ['Sut tishidagi kariyes ham o‘z vaqtida ko‘riladi.'] },
  },
  marks: [
    { id: 's21', title: '2.1. Kariyes tushunchasi', page: 45, text: 'Kariyes — bu tish qattiq to‘qimalarining mikroblar omillar...' },
    { id: 's23', title: '2.3. Klinik ko‘rinishi', page: 52, text: 'Kariyesning klinik ko‘rinishi jarayonning chuqurligiga bog‘liq...' },
    { id: 's25', title: '2.5. Davolash usullari', page: 61, text: 'Kariyesni davolashda minimal invaziv yondashuvlar...' },
  ],
  notes: [
    { id: 'n1', page: 45, title: '2.1. Kariyes tushunchasi', text: 'Kariyes rivojlanishida so‘lakning himoya funksiyasi juda muhim. Buni klinik amaliyotda ham inobatga olish kerak.', when: '8 okt, 2026 14:20' },
  ],
}

export function flatReader(doc) {
  const rows = []
  doc.chapters.forEach((ch) => {
    rows.push({ id: ch.id, title: ch.title, page: ch.page, parent: null })
    ;(ch.children || []).forEach((s) => rows.push({ id: s.id, title: s.title, page: s.page, parent: ch.id }))
  })
  return rows
}

export function readerOf(book) {
  if (book.id === 'atlas' || book.id === 'klinik') return klinikReader
  const doc = {
    title: book.title,
    subtitle: book.blurb,
    author: book.author,
    cover: book.cover,
    pages: book.pages || 120,
    start: 8,
    chapters: [
      { id: 'a', title: '1-bob. Kirish', page: 8 },
      { id: 'b', title: '2-bob. Asosiy qism', page: 24, children: [
        { id: 'b1', title: '2.1. Asosiy tushuncha', page: 24 },
        { id: 'b2', title: '2.2. Amaliy qadamlar', page: 40 },
      ] },
      { id: 'c', title: '3-bob. Xulosa', page: 70 },
    ],
    pagesOf: {
      a: { kicker: '1-bob. Kirish', title: '1. Kirish', lead: book.blurb, body: [`${book.author}, ${book.year}. ${book.pages} sahifa.`] },
      b1: { kicker: '2-bob. Asosiy qism', title: '2.1. Asosiy tushuncha', lead: book.blurb, body: ['Bu namuna bob. To‘liq matn sotib olingach ochiladi.'] },
      b2: { kicker: '2-bob. Asosiy qism', title: '2.2. Amaliy qadamlar', lead: 'Qisqa amaliy eslatmalar.', body: ['Klinikada qaror har bir bemor uchun alohida qabul qilinadi.'] },
      c: { kicker: '3-bob. Xulosa', title: '3. Xulosa', lead: 'Asosiy xulosalar shu bobda jamlangan.', body: ['Mavzuni jamoangiz bilan muhokama qiling.'] },
    },
    marks: [],
    notes: [],
  }
  return doc
}

export function countBy(list, pick) {
  const map = {}
  list.forEach((b) => {
    const keys = pick(b)
    ;(Array.isArray(keys) ? keys : [keys]).forEach((k) => { map[k] = (map[k] || 0) + 1 })
  })
  return map
}
