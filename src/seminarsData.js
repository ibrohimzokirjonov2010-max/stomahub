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

const DEMO_SEMINARS = []

export const monthOrder = [
  { key: '2026-10', label: 'Oktabr 2026' },
  { key: '2026-11', label: 'Noyabr 2026' },
]

export const seminars = []

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

const MON_NAME = { YAN: 'yanvar', FEV: 'fevral', MAR: 'mart', APR: 'aprel', MAY: 'may', IYN: 'iyun', IYL: 'iyul', AVG: 'avgust', SEN: 'sentabr', OKT: 'oktabr', NOY: 'noyabr', DEK: 'dekabr' }

export function seminarPage(id) {
  const s = seminars.find((x) => x.id === id)
  if (!s) return null
  return buildSeminarPage(s)
}

const PRACTICE_KIND = { model: 'model', fantom: 'fantom', bemor: 'jonli bemor' }
const MATERIALS_BY = { tashkilotchi: 'materiallarni tashkilotchi beradi', ishtirokchi: 'materiallarni ishtirokchi olib keladi', aralash: 'materiallar qisman tashkilotchidan' }
export function practiceText(p) {
  if (!p?.on) return ''
  return [
    `Amaliy qism: ${PRACTICE_KIND[p.kind] || p.kind || 'amaliyot'}da`,
    Number(p.perPerson) ? `har bir ishtirokchiga ${Number(p.perPerson)} ta ${p.unit === 'tish' ? 'tish' : 'implant'}` : '',
    MATERIALS_BY[p.materials] || '',
  ].filter(Boolean).join(', ')
}
function organizerPerks(s) {
  const out = []
  if (s.practice?.on) out.push(['Amaliy qism', practiceText(s.practice).replace(/^Amaliy qism: /, '')])
  if (s.cmePoints || s.cmeHours) out.push(['Sertifikat', [s.cmeHours ? `${s.cmeHours} soat` : '', s.cmePoints ? `${s.cmePoints} CME ball` : ''].filter(Boolean).join(', ')])
  if (s.liveSurgery) out.push(['Jonli jarrohlik', s.liveSurgery.text || 'Namoyish'])
  return out
}

export function buildSeminarPage(s) {
  const speaker = {
    name: s.speaker?.name || 'Ma’ruzachi',
    role: s.speaker?.role || '',
    avatar: s.speaker?.avatar || '/images/avatar.jpg',
    rating: Number(s.speaker?.rating) || 0,
    reviews: Number(s.speaker?.reviews) || 0,
    lines: s.organizer
      ? [
          s.speaker?.degree,
          s.speaker?.years ? `${s.speaker.years} yillik tajriba` : '',
          s.speaker?.clinic,
          s.speaker?.certs ? `Sertifikatlar: ${s.speaker.certs}` : '',
        ].filter(Boolean)
      : ['Klinik amaliyot va o‘qitish', s.city, `${s.cme || 6} ballik dastur muallifi`],
  }

  return {
    ...s,
    catName: catLabel[s.cat],
    title: s.title,
    lead: s.organizer ? String(s.text || '') : `${s.text}. ${s.city}da, ${s.place}da o‘tadigan amaliy seminar.`,
    whenTitle: `${Number(s.day)}-${MON_NAME[s.mon] || 'noyabr'} ${String(s.monthKey || '2026-11').slice(0, 4)}`,
    whenText: `${s.weekday}, ${s.time}`,
    whereTitle: s.city,
    whereText: s.place,
    modeTitle: s.format.startsWith('Offline +') ? 'Offline + jonli efir' : s.format === 'Online' ? 'Online' : 'Offline',
    modeText: s.format.startsWith('Offline +') ? 'Zalda va onlayn qatnashish' : 'Zalda qatnashish',
    hero: s.image,
    about: s.organizer ? String(s.text || s.title) : `${s.title} — ${String(s.text || '').toLowerCase()}. Dastur nazariy qism, klinik holatlar va amaliy mashg‘ulotdan iborat. Ishtirokchilar sertifikat va CME ball oladi.`,
    learn: s.organizer ? (s.learnList || []).filter(Boolean) : (learnByCat[s.cat] || learnByCat.other),
    perks: s.organizer ? organizerPerks(s) : [['Amaliy mashg‘ulot', 'Kichik guruhlarda ishlash'], ['Sertifikat', `CME ${s.cme || 6} ball`], ['Materiallar', 'Tashkilotchi taqdim etadi'], ['Networking', 'Hamkasblar bilan tanishish']],
    audience: s.organizer ? (s.audience || []) : null,
    practice: s.organizer ? practiceText(s.practice) : '',
    refundPolicy: s.organizer ? (s.refundPolicy || '') : '',
    liveSurgery: s.organizer && s.liveSurgery ? (s.liveSurgery.text || 'Jonli jarrohlik namoyishi') : '',
    cmeLine: s.organizer && (s.cmeHours || s.cmePoints) ? [s.cmeHours ? `${s.cmeHours} soat` : '', s.cmePoints ? `${s.cmePoints} CME ball` : ''].filter(Boolean).join(' · ') : '',
    regClosed: !!s.regClosed,
    speaker,
    scheduleTitle: `Dastur (${s.day} ${s.mon})`,
    schedule: s.organizer
      ? (s.program || []).map((p) => Array.isArray(p) ? p : [p?.time || '', p?.title || p?.text || '', p?.sub || '']).filter((p) => p[1])
      : scheduleFor(s),
    gear: ['Shaxsiy lupa (ixtiyoriy)', 'Jarrohlik kostyumi va ruboq', 'Shaxsiy asboblar (ixtiyoriy)', 'Barcha asosiy materiallar tashkilotchilar tomonidan taqdim etiladi'],
    venue: { name: s.place, address: `${s.city}`, image: pic('hotel'), map: `https://maps.google.com/?q=${encodeURIComponent((s.place || '') + ' ' + (s.city || ''))}` },
    seatsBanner: s.left,
    plans: s.organizer && Array.isArray(s.tickets) && s.tickets.length
      ? s.tickets.filter((t) => t.price).map((t) => ({
          id: t.id,
          name: t.name,
          price: Number(t.price) || 0,
          oldPrice: t.earlyActive ? Number(t.basePrice) || 0 : 0,
          discount: t.earlyActive ? 'Early bird' : '',
          earlyUntil: t.earlyActive ? t.earlyUntil : '',
          perks: (t.perks || []).filter(Boolean),
          left: t.left,
          seats: t.seats || t.total,
        }))
      : plansFor(s),
    review: null,
    similar: seminars.filter((x) => x.id !== s.id).slice(0, 2).map((x) => ({
      id: x.id, title: x.title, date: `${x.day}-${x.mon === 'OKT' ? 'oktabr' : 'noyabr'} 2026`, city: x.city, price: x.price, image: x.image,
    })),
  }
}

const MONTHS = { YAN: 'yanvar', FEV: 'fevral', MAR: 'mart', APR: 'aprel', MAY: 'may', IYN: 'iyun', IYL: 'iyul', AVG: 'avgust', SEN: 'sentabr', OKT: 'oktabr', NOY: 'noyabr', DEK: 'dekabr' }
const cardImage = { 'implant-toj': '/images/seminar-1.jpg', 'mikroskop-endo': '/images/seminar-2.jpg', 'kompozit-old': '/images/seminar-4.jpg' }
const BREAKS = /breyk|Tushlik|qahva/i

export function seminarCard(s) {
  const days = Number(s.days) > 1 ? Number(s.days) : 1
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
    oldPrice: s.organizer ? 0 : standart.oldPrice,
    off: s.organizer ? 0 : Math.round((1 - s.price / standart.oldPrice) * 100),
    dateKey: `${s.monthKey}-${s.day}`,
    speaker: s.speaker,
  }
}

export function seminarMobile(id) {
  const s = seminars.find((x) => x.id === id)
  return s ? seminarView(s) : null
}

export function seminarView(record) {
  const page = buildSeminarPage(record)
  const card = seminarCard(record)
  const month = MONTHS[page.mon]
  const d = Number(page.day)
  const items = page.schedule.filter(([, t]) => !BREAKS.test(t))
  const program = page.organizer
    ? (items.length ? [{ label: '1-kun', date: `${d} ${month}`, items }] : [])
    : card.days > 1
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
    includes: page.organizer ? (page.includesList?.length ? page.includesList : [...new Set(page.plans.flatMap((p) => p.perks || []))]) : null,
    speaker: { ...page.speaker, bio: page.speaker.lines.join('. ') + '.' },
  }
}

export { som }
