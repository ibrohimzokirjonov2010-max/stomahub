import { som } from './marketData'

const pic = (n) => `/images/seminars/${n}.jpg`

export const seminarChips = [
  { key: 'all', label: 'Barchasi' },
  { key: 'impl', label: 'Implantologiya' },
  { key: 'endo', label: 'Endodontiya' },
  { key: 'orto', label: 'Ortodontiya' },
  { key: 'estet', label: 'Estetik restavratsiya' },
  { key: 'paro', label: 'Parodontologiya' },
  { key: 'surg', label: 'Jarrohlik' },
  { key: 'other', label: 'Boshqa' },
]

const catLabel = Object.fromEntries(seminarChips.map((c) => [c.key, c.label]))

export const seminars = [
  {
    id: 'implant-toj', cat: 'impl', day: '24', mon: 'OKT', weekday: 'Juma', monthKey: '2026-10',
    title: 'Implantologiya: implantdan tojgacha',
    text: 'Diagnostika, jarrohlik protokoli, implant protezlash',
    city: 'Toshkent', place: 'EMU Universiteti', time: '09:00 – 18:00', hours: '8 soat',
    speaker: { name: 'Dr. Sardor Raximov', role: 'Implantolog, PhD', avatar: '/images/surplus/u5.jpg' },
    cme: 8, left: 18, seats: 30, price: 1200000, format: 'Offline + jonli efir', image: pic('teeth'), mine: true,
  },
  {
    id: 'mikroskop-endo', cat: 'endo', day: '28', mon: 'OKT', weekday: 'Seshanba', monthKey: '2026-10',
    title: 'Mikroskop yordamida endodontik davolash',
    text: 'Mikroskopda ishlash protokoli va klinik holatlar',
    city: 'Samarqand', place: 'Hyatt Regency', time: '09:00 – 17:00', hours: '7 soat',
    speaker: { name: 'Dr. Malika Karimova', role: 'Endodontist', avatar: '/images/surplus/u1.jpg' },
    cme: 6, left: 12, seats: 25, price: 850000, format: 'Offline', image: pic('micro'),
  },
  {
    id: 'sinus-lifting', cat: 'surg', day: '30', mon: 'OKT', weekday: 'Chorshanba', monthKey: '2026-10',
    title: 'Sinus lifting va vertikal augmentatsiya',
    text: 'Amaliyot va jonli jarrohlik ko‘rsatmalari',
    city: 'Toshkent', place: 'Nexus Clinic', time: '09:00 – 18:00', hours: '8 soat',
    speaker: { name: 'Dr. Javohir Ahmedov', role: 'Jarroh, PhD', avatar: '/images/surplus/u4.jpg' },
    cme: 8, left: 8, seats: 20, price: 2500000, format: 'Offline', image: pic('surgery'),
  },
  {
    id: 'kompozit-old', cat: 'estet', day: '31', mon: 'OKT', weekday: 'Juma', monthKey: '2026-10',
    title: 'Kompozit restavratsiya: oldingi tishlar',
    text: 'To‘g‘ridan-to‘g‘ri va bilvosita restavratsiya texnikalari',
    city: 'Toshkent', place: 'Dentoshon Center', time: '09:00 – 17:00', hours: '7 soat',
    speaker: { name: 'Dr. Kamola Abdullayeva', role: 'Estetik stomatolog', avatar: '/images/surplus/u3.jpg' },
    cme: 5, left: 20, seats: 30, price: 1000000, format: 'Offline', image: pic('smile'),
  },
  {
    id: 'aligner', cat: 'orto', day: '02', mon: 'NOY', weekday: 'Dushanba', monthKey: '2026-11',
    title: 'Aligner terapiya: case selection',
    text: 'Klinik holatlar va davolash rejasi',
    city: 'Toshkent', place: 'Joy Congress Hall', time: '10:00 – 18:00', hours: '7 soat',
    speaker: { name: 'Dr. Ferrukh Khaydarov', role: 'Ortodontist', avatar: '/images/surplus/seller.jpg' },
    cme: 5, left: 25, seats: 40, price: 900000, format: 'Offline', image: pic('aligner'),
  },
  {
    id: 'raqamli-ortopediya', cat: 'other', day: '15', mon: 'NOY', weekday: 'Yakshanba', monthKey: '2026-11',
    title: 'Raqamli ortopediya',
    text: 'Skaner, dizayn va frezerlashning klinik protokoli',
    city: 'Toshkent', place: 'Nexus Clinic', time: '10:00 – 17:00', hours: '6 soat',
    speaker: { name: 'Dr. Sevara Ahmedova', role: 'Ortoped', avatar: '/images/surplus/u6.jpg' },
    cme: 5, left: 16, seats: 30, price: 1100000, format: 'Offline', image: '/images/seminar-3.jpg', mine: true,
  },
  {
    id: 'raqamli-implant', cat: 'impl', day: '28', mon: 'NOY', weekday: 'Shanba', monthKey: '2026-11',
    title: 'Raqamli implantologiya va skanerlar',
    text: 'Intraoral skaner va raqamli jarrohlik shabloni',
    city: 'Samarqand', place: 'Hyatt Regency', time: '10:00 – 18:00', hours: '7 soat',
    speaker: { name: 'Dr. Aziz Karimov', role: 'Implantolog, jarroh', avatar: '/images/surplus/seller.jpg' },
    cme: 6, left: 14, seats: 24, price: 1000000, format: 'Offline + jonli efir', image: '/images/hero-implant.jpg',
  },
]

export const monthOrder = [
  { key: '2026-10', label: 'Oktabr 2026' },
  { key: '2026-11', label: 'Noyabr 2026' },
]

export const mySeminars = seminars.filter((s) => s.mine)

export const whyAttend = [
  { title: 'Dunyo darajasidagi spikerlar', text: 'Tajribali mutaxassislardan o‘rganing' },
  { title: 'Amaliy ko‘nikmalar', text: 'Hands-on mashg‘ulotlar' },
  { title: 'Sertifikat va CME ballari', text: 'Rasmiy sertifikat va tan olish' },
  { title: 'Kasbiy aloqa', text: 'Hamkasblar bilan tanishish' },
]

const learnByCat = {
  impl: ['Diagnostika va implant rejalashtirish', 'Jarrohlik protokoli va yumshoq to‘qima', 'Abutment va toj tanlash', 'Asoratlarning oldini olish', 'Amaliy mashg‘ulot: phantom modellarda'],
  endo: ['Mikroskopda ishlash ergonomikasi', 'Kanal topish va kengaytirish', 'Irrigatsiya protokollari', 'Murakkab anatomiya', 'Klinik holatlarni tahlil qilish'],
  surg: ['Sinus lifting ko‘rsatmasi', 'Vertikal augmentatsiya', 'Membrana va suyak materiali', 'Jonli jarrohlik kuzatuvi', 'Operatsiyadan keyingi parvarish'],
  estet: ['Rang tanlash va qatlamlash', 'Oldingi tishlar anatomiyasi', 'To‘g‘ridan-to‘g‘ri restavratsiya', 'Bilvosita restavratsiya', 'Polirovka va yakuniy nazorat'],
  orto: ['Case selection mezonlari', 'Aligner rejasini o‘qish', 'Attachment va IPR', 'Nazorat tashriflari', 'Murakkab holatlarni saralash'],
  paro: ['Parodontal diagnostika', 'Konservativ davolash', 'Jarrohlik usullari', 'Qo‘llab-quvvatlovchi terapiya'],
  other: ['Raqamli oqim: skaner va dizayn', 'Klinik protokol', 'Laboratoriya bilan ishlash', 'Xatolarning oldini olish'],
}

function plansFor(s) {
  if (s.id === 'implant-toj') {
    return [
      { id: 'standart', name: 'Standart', price: 1200000, oldPrice: 1400000, discount: '-15%', perks: ['Zalda qatnashish', 'Kofe-breyk va tushlik', 'Sertifikat (CME 8 ball)'], left: 18, seats: 30 },
      { id: 'hands', name: 'Amaliy (hands-on)', price: 2500000, oldPrice: 2900000, discount: '-15%', perks: ['Zalda + amaliy mashg‘ulotlar', 'Har bir ishtirokchiga implant tizimi', 'Sertifikat (CME 8 ball)'], left: 8, seats: 20 },
      { id: 'online', name: 'Online', price: 600000, oldPrice: 800000, discount: '-25%', perks: ['Jonli efirda qatnashish', 'Yozuvlarga 3 oy kirish', 'Sertifikat (CME 6 ball)'], left: 50, seats: 100 },
    ]
  }
  const hands = Math.round(s.price * 1.7 / 10000) * 10000
  const online = Math.round(s.price * 0.55 / 10000) * 10000
  return [
    { id: 'standart', name: 'Standart', price: s.price, oldPrice: Math.round(s.price * 1.15 / 10000) * 10000, discount: '-15%', perks: ['Zalda qatnashish', 'Kofe-breyk va tushlik', `Sertifikat (CME ${s.cme} ball)`], left: s.left, seats: s.seats },
    { id: 'hands', name: 'Amaliy (hands-on)', price: hands, oldPrice: Math.round(hands * 1.15 / 10000) * 10000, discount: '-15%', perks: ['Zalda + amaliy mashg‘ulot', 'Materiallar taqdim etiladi', `Sertifikat (CME ${s.cme} ball)`], left: Math.max(4, Math.round(s.left * 0.6)), seats: Math.max(10, Math.round(s.seats * 0.7)) },
    { id: 'online', name: 'Online', price: online, oldPrice: Math.round(online * 1.25 / 10000) * 10000, discount: '-20%', perks: ['Jonli efirda qatnashish', 'Yozuvlarga 3 oy kirish', `Sertifikat (CME ${Math.max(4, s.cme - 2)} ball)`], left: 40, seats: 80 },
  ]
}

function scheduleFor(s) {
  if (s.id === 'implant-toj') {
    return [
      ['09:30 – 10:00', 'Ro‘yxatdan o‘tish va qahva'],
      ['10:00 – 10:40', 'Implantologiyada diagnostika va rejalashtirish'],
      ['10:40 – 11:20', 'Suyak augmentatsiyasi va sinus lifting'],
      ['11:20 – 12:00', 'Suyak-breyk'],
      ['12:00 – 13:00', 'Implant o‘rnatish jarrohligi: jonli amaliy ko‘rsatma'],
      ['13:00 – 14:00', 'Tushlik'],
      ['14:00 – 15:00', 'Implant usti protezlash: abutment va toj tanlash'],
      ['15:00 – 15:50', 'Kofe-breyk'],
      ['15:50 – 17:30', 'Amaliy mashg‘ulot (phantom modellarda)'],
      ['17:30 – 18:00', 'Savol-javob va sertifikat topshirish'],
    ]
  }
  return [
    ['09:30 – 10:00', 'Ro‘yxatdan o‘tish va qahva'],
    ['10:00 – 11:30', s.text],
    ['11:30 – 12:00', 'Kofe-breyk'],
    ['12:00 – 13:30', 'Klinik holatlar va munozara'],
    ['13:30 – 14:30', 'Tushlik'],
    ['14:30 – 16:30', 'Amaliy mashg‘ulot'],
    ['16:30 – 17:30', 'Savol-javob va sertifikat'],
  ]
}

export function seminarPage(id) {
  const s = seminars.find((x) => x.id === id) || seminars[0]
  const featured = s.id === 'implant-toj'
  const speaker = featured
    ? { name: 'Dr. Aziz Karimov, PhD', role: 'Implantolog, jarroh', avatar: '/images/surplus/seller.jpg', rating: 4.9, reviews: 132, lines: ['15 yil tajriba', '5 000+ implant operatsiyasi', 'Xalqaro treninglar va sertifikatlar', 'Toshkent, DentAKI Clinic'] }
    : { name: s.speaker.name, role: s.speaker.role, avatar: s.speaker.avatar, rating: 4.8, reviews: 48, lines: ['Klinik amaliyot va o‘qitish', s.city, `${s.cme} ballik dastur muallifi`] }

  return {
    ...s,
    catName: catLabel[s.cat],
    title: featured ? 'Implantologiya: Implantdan tojgacha' : s.title,
    lead: featured
      ? 'Diagnostika, jarrohlik protokoli, implant o‘rnatish va implant usti protezlash bo‘yicha intensiv 2 kunlik seminar.'
      : `${s.text}. ${s.city}da, ${s.place}da o‘tadigan amaliy seminar.`,
    whenTitle: featured ? '24-oktabr 2026' : `${s.day}-${s.mon === 'OKT' ? 'oktabr' : 'noyabr'} 2026`,
    whenText: featured ? 'Shanba, 10:00 – 18:00' : `${s.weekday}, ${s.time}`,
    whereTitle: s.city,
    whereText: featured ? 'Hyatt Regency, konferens-zal' : s.place,
    modeTitle: s.format.startsWith('Offline +') ? 'Offline + jonli efir' : s.format === 'Online' ? 'Online' : 'Offline',
    modeText: s.format.startsWith('Offline +') ? 'Zalda va onlayn qatnashish' : 'Zalda qatnashish',
    hero: featured ? pic('surgery') : s.image,
    about: featured
      ? 'Ushbu amaliy va nazariy seminar implantologiyada zamonaviy yondashuvlarni qamrab oladi: diagnostika, suyak augmentatsiyasi, implant o‘rnatish protokoli, implant usti protezlash va asoratlarning oldini olish. Nazariy bilimlar amaliy mashg‘ulotlar bilan mustahkamlanadi.'
      : `${s.title} — ${s.text.toLowerCase()}. Dastur nazariy qism, klinik holatlar va amaliy mashg‘ulotdan iborat. Ishtirokchilar sertifikat va CME ball oladi.`,
    learn: featured
      ? ['Implantologiyada diagnostika va rejalashtirish', 'Suyak augmentatsiyasi va sinus lifting', 'Implant o‘rnatish bosqichlari va jarrohlik protokollari', 'Abutment tanlash va vaqtinchalik/doimiy toj protezlash', 'Asoratlar va ularning oldini olish', 'Amaliy mashg‘ulot: phantom modellarda']
      : learnByCat[s.cat],
    perks: featured
      ? [['Amaliy mashg‘ulotlar', 'Har bir ishtirokchi implant tizimi'], ['Kichik guruhlar', 'Individual yondashuv'], ['Sertifikat beriladi', 'CME 8 ball'], ['Ilmiy materiallar', 'Nazariy bilimlar va protokollar'], ['Networking', 'Hamkasblar bilan tanishish']]
      : [['Amaliy mashg‘ulot', 'Kichik guruhlarda ishlash'], ['Sertifikat', `CME ${s.cme} ball`], ['Materiallar', 'Tashkilotchi taqdim etadi'], ['Networking', 'Hamkasblar bilan tanishish']],
    speaker,
    scheduleTitle: featured ? 'Dastur (24-oktabr 2026)' : `Dastur (${s.day} ${s.mon})`,
    schedule: scheduleFor(s),
    gear: ['Shaxsiy lupa (ixtiyoriy)', 'Jarrohlik kostyumi va ruboq', 'Shaxsiy asboblar (ixtiyoriy)', 'Barcha asosiy materiallar tashkilotchilar tomonidan taqdim etiladi'],
    venue: featured
      ? { name: 'Hyatt Regency Tashkent', address: 'Toshkent sh., Navoi ko‘chasi, 1A', image: pic('hotel'), map: 'https://maps.google.com/?q=Hyatt+Regency+Tashkent' }
      : { name: s.place, address: `${s.city}`, image: pic('hotel'), map: `https://maps.google.com/?q=${encodeURIComponent(s.place + ' ' + s.city)}` },
    seatsBanner: featured ? 30 : s.left,
    plans: plansFor(s),
    review: {
      name: 'Dr. Sevara Ahmedova', avatar: '/images/surplus/u6.jpg', date: '12.02.2026', rating: 5,
      text: 'Juda foydali va amaliy seminar. Amaliy qism ayniqsa zo‘r bo‘ldi, tavsiya qilaman!',
    },
    similar: featured
      ? [
          { id: 'sinus-lifting', title: 'Sinus lifting va vertikal augmentatsiya', date: '12-noyabr 2026', city: 'Toshkent', price: 1800000, image: pic('surgery') },
          { id: 'raqamli-implant', title: 'Raqamli implantologiya va skanerlar', date: '28-noyabr 2026', city: 'Samarqand', price: 1000000, image: '/images/hero-implant.jpg' },
        ]
      : seminars.filter((x) => x.id !== s.id).slice(0, 2).map((x) => ({
          id: x.id, title: x.title, date: `${x.day}-${x.mon === 'OKT' ? 'oktabr' : 'noyabr'} 2026`, city: x.city, price: x.price, image: x.image,
        })),
  }
}

const MONTHS = { OKT: 'oktabr', NOY: 'noyabr' }
const cardImage = { 'implant-toj': '/images/seminar-1.jpg', 'mikroskop-endo': '/images/seminar-2.jpg', 'kompozit-old': '/images/seminar-4.jpg' }
const BREAKS = /breyk|Tushlik|qahva/i

export function seminarCard(s) {
  const days = s.id === 'implant-toj' ? 2 : 1
  const d = Number(s.day)
  const month = MONTHS[s.mon]
  const standart = plansFor(s)[0]
  return {
    ...s,
    days,
    image: cardImage[s.id] || s.image,
    tag: s.format === 'Online' ? 'Onlayn seminar' : `${days} kunlik seminar`,
    online: s.format === 'Online',
    dateLabel: days > 1 ? `${d}–${d + days - 1} ${month}, ${s.monthKey.slice(0, 4)}` : `${d} ${month}, ${s.monthKey.slice(0, 4)}`,
    dateShort: days > 1 ? `${d}–${d + days - 1} ${month}` : `${d} ${month}`,
    placeLabel: s.format === 'Online' ? 'Online (Zoom)' : `${s.city}, ${s.place}`,
    oldPrice: standart.oldPrice,
    off: Math.round((1 - s.price / standart.oldPrice) * 100),
    dateKey: `${s.monthKey}-${s.day}`,
    speaker: s.id === 'implant-toj' ? { name: 'Dr. Aziz Karimov', role: 'Implantolog, jarroh', avatar: '/images/surplus/seller.jpg' } : s.speaker,
  }
}

export function seminarMobile(id) {
  const page = seminarPage(id)
  const card = seminarCard(seminars.find((x) => x.id === page.id))
  const month = MONTHS[page.mon]
  const d = Number(page.day)
  const items = page.schedule.filter(([, t]) => !BREAKS.test(t))
  const program = card.days > 1
    ? [
        { label: '1-kun', date: `${d} ${month}`, items: items.slice(0, 4) },
        {
          label: '2-kun',
          date: `${d + 1} ${month}`,
          items: [
            ['09:00 – 11:00', 'Amaliy mashg‘ulot (implant o‘rnatish)'],
            ['11:30 – 13:00', 'Yumshoq to‘qima boshqaruvi'],
            ['14:00 – 15:30', 'Protetik bosqich va reabilitatsiya'],
            ['16:00 – 17:00', 'Savol-javob va sertifikat topshirish'],
          ],
        },
      ]
    : [{ label: '1-kun', date: `${d} ${month}`, items }]
  return {
    ...page,
    ...card,
    title: page.title,
    lead: page.lead,
    about: page.about,
    hero: card.image,
    timeLabel: `${page.time}${card.days > 1 ? ` (${card.days} kun)` : ''}`,
    program,
    speaker: { ...page.speaker, bio: page.speaker.lines.join('. ') + '.' },
  }
}

export { som }
