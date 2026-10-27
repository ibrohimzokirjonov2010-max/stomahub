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

export const books = []

export const library = []

export const perks = ['Yuqori sifatli rasmlar', 'Klinik holatlar', 'Bosqichma-bosqich protokol']

export const money = (n) => som(n)

export const featured = books.find((b) => b.featured)

export const pubName = { quintessence: 'Quintessence', elsevier: 'Elsevier', springer: 'Springer', stomamedia: 'StomaMedia', other: 'Boshqa' }
export const langLong = { uz: 'O‘zbekcha', ru: 'Ruscha', en: 'Inglizcha' }

export const shelf = []

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
    reviews: [],
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
