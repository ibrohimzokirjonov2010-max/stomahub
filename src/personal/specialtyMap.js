// Mutaxassislik -> mahsulot kalit so‘zlari / kategoriyalar / seminar yo‘nalishlari (sof funksiyalar, test: tests/personal.test.mjs).
// Mahsulotlar TUR bo‘yicha kategoriyalangan (Uskunalar, Instrumentlar, ...), shuning uchun asosiy signal — nom/tavsifdagi kalit so‘zlar.
import { normText, productText, productTitleText } from './text.js'

/** Ro‘yxatdan o‘tish, Profil va "Yo‘nalishingizni tanlang" oynasidagi yagona ro‘yxat. */
export const SPECIALTIES = [
  'Stomatolog', 'Terapevt', 'Endodontist', 'Implantolog', 'Ortoped', 'Ortodont', 'Jarroh', 'Parodontolog',
  'Estetik stomatolog', 'Bolalar stomatologi', 'Gigiyenist', 'Tish texnigi', 'Klinika egasi', 'Talaba',
]

/** Tanlash oynasidagi chiplar (shifokor yo‘nalishlari). */
export const PICKER_SPECIALTIES = ['Implantolog', 'Endodontist', 'Ortoped', 'Ortodont', 'Terapevt', 'Jarroh', 'Parodontolog', 'Estetik stomatolog', 'Bolalar stomatologi', 'Talaba']

/** Select uchun: joriy (eski yozilgan) qiymat ro‘yxatda bo‘lmasa ham yo‘qolmasin. */
export const specialtyOptions = (current) => (current && !SPECIALTIES.includes(current) ? [current, ...SPECIALTIES] : SPECIALTIES)

// [kalit, aniqlovchi regexlar] — tartib muhim: aniqroq yo‘nalishlar umumiy "stomatolog"dan oldin.
const DETECT = [
  ['implant', [/implant/, /имплант/]],
  ['endo', [/endodont/, /эндодонт/, /\bendo\b/]],
  ['orto', [/ortodont/, /ортодонт/]],
  ['ortoped', [/ortoped/, /ортопед/, /protez/, /протез/]],
  ['paro', [/parodont/, /пародонт/, /periodont/]],
  ['bolalar', [/bolalar/, /pediat/, /детск/, /педиатр/, /pedodont/]],
  ['jarroh', [/jarroh/, /xirurg/, /хирург/, /surgeon/, /chlx/]],
  ['estetik', [/estet/, /эстет/, /aesthet/]],
  ['gigiyenist', [/gigien/, /gigiyen/, /гигиен/, /hygien/]],
  ['texnik', [/texnik/, /texnig/, /техник/, /technician/, /laborant/]],
  ['klinika', [/klinika egasi/, /владел/, /owner/, /rahbar/]],
  ['talaba', [/talaba/, /студент/, /student/, /ordinator/, /ординатор/, /interna/]],
  ['terapevt', [/terapevt/, /терапевт/, /therap/]],
  ['stomatolog', [/stomatolog/, /стоматолог/, /dentist/, /tish shifokori/]],
]

/** "Implantolog", "имплантолог", "Jarroh-implantolog", "ORTOPED STOMATOLOG" -> 'implant' | 'ortoped' | ... | '' */
export function normalizeSpecialty(raw) {
  const t = normText(raw).replace(/'/g, '')
  if (!t) return ''
  for (const [key, res] of DETECT) if (res.some((r) => r.test(t))) return key
  return ''
}

// w: vazn. Kalit so‘zlar apostrofsiz/apostrofli ikkala yozuvda ham normText orqali solishtiriladi.
export const SPEC_PROFILES = {
  implant: {
    title: 'Implantologiya', seminar: ['impl', 'surg'], seminarWords: ['implant', 'sinus', 'augment'],
    kw: { implant: 6, abatment: 5, abutment: 5, formirovatel: 5, 'gingiva former': 5, suyak: 4, 'bone': 4, ksenograft: 4, granula: 3, membran: 4, fiziodispenser: 5, xirurg: 3, jarroh: 3, 'chok ip': 3, "shovning ip": 3, sutur: 3, sinus: 3, skalpel: 2 },
    cat: { Implantologiya: 6, Implantlar: 6, Sterilizatsiya: 1, Instrumentlar: 1 },
  },
  endo: {
    title: 'Endodontiya', seminar: ['endo'], seminarWords: ['endo', 'kanal'],
    kw: { fayl: 5, 'k-file': 5, 'h-file': 5, protaper: 5, reciproc: 5, apeks: 5, apex: 5, gutaperch: 5, 'gutta': 5, obturat: 5, irrigat: 5, gipoxlorit: 4, edta: 4, endomotor: 5, kofferdam: 4, 'rubber dam': 4, siler: 4, sealer: 4, 'qog\'oz shtift': 4, 'paper point': 4, kanal: 3, endodont: 4, mikroskop: 2 },
    cat: { 'Endodontik asboblar': 6 },
  },
  ortoped: {
    title: 'Ortopediya', seminar: ['estet'], seminarWords: ['ortoped', 'protez', 'toj', 'vinir', 'sirkon'],
    kw: { qolip: 4, ottisk: 4, silikon: 4, alginat: 4, toj: 4, protez: 5, sirkon: 4, keramika: 3, vinir: 4, sement: 3, tsement: 3, 'vaqtinchalik': 3, abatment: 2, 'retraksion': 4 },
    cat: { 'Qolip (ottisk) materiallari': 5, 'Qolip materiallari': 5, 'O‘lchov materiallari': 5, 'Izolyatsiya materiallari': 3, 'Yordamchi materiallar': 2, Laboratoriya: 3 },
  },
  orto: {
    title: 'Ortodontiya', seminar: ['orto'], seminarWords: ['ortodont', 'breket', 'aligner', 'eleyner'],
    kw: { breket: 6, bracket: 6, ortodont: 5, ligatur: 4, elastik: 3, 'duga': 4, "dug'": 4, 'arch wire': 4, aligner: 5, eleyner: 5, retainer: 4 },
    cat: { Ortodontiya: 6 },
  },
  terapevt: {
    title: 'Terapiya', seminar: ['estet', 'endo'], seminarWords: ['restavr', 'kompozit', 'terap'],
    kw: { kompozit: 5, composite: 5, plomba: 5, bond: 4, adgeziv: 4, travl: 3, etch: 3, 'ionomer': 4, fotopolimer: 4, lampa: 2, matrits: 3, polir: 3, kofferdam: 2, fayl: 1, 'kanal': 1 },
    cat: { 'Restavratsion materiallar': 6, 'Estetik stomatologiya': 2, 'Endodontik asboblar': 2 },
  },
  estetik: {
    title: 'Estetik stomatologiya', seminar: ['estet'], seminarWords: ['estet', 'vinir', 'oqartir', 'restavr'],
    kw: { oqartir: 6, vinir: 5, kompozit: 4, polir: 3, keramika: 3, fotopolimer: 2, 'rang ': 2 },
    cat: { 'Estetik stomatologiya': 6, 'Restavratsion materiallar': 3 },
  },
  paro: {
    title: 'Parodontologiya', seminar: ['paro'], seminarWords: ['parodont'],
    kw: { skaler: 6, scaler: 6, kyuret: 5, parodont: 5, nasadka: 3, profilakt: 4, pasta: 2, xlorgeksidin: 3, membran: 2, ultratovush: 4 },
    cat: { 'Gigiyena vositalari': 4, 'Gigiena vositalari': 4 },
  },
  jarroh: {
    title: 'Jarrohlik', seminar: ['surg', 'impl'], seminarWords: ['jarroh', 'xirurg', 'sinus', 'augment'],
    kw: { xirurg: 5, jarroh: 5, elevator: 5, 'qisqich': 3, skalpel: 4, 'chok ip': 4, sutur: 4, suyak: 4, membran: 3, implant: 2, anestez: 4, karpula: 3, 'shpris': 2 },
    cat: { Implantologiya: 3, Implantlar: 3, Instrumentlar: 3 },
  },
  bolalar: {
    title: 'Bolalar stomatologiyasi', seminar: [], seminarWords: ['bolalar', 'pediat', 'sut tish'],
    kw: { bolalar: 6, 'sut tish': 5, fissura: 5, silant: 5, ftor: 4, 'lak': 2, ionomer: 3, kompomer: 4 },
    cat: { 'Restavratsion materiallar': 2 },
  },
  gigiyenist: {
    title: 'Gigiyena', seminar: ['paro'], seminarWords: ['gigiyen', 'profilakt'],
    kw: { skaler: 5, profilakt: 5, pasta: 3, polir: 2, ultratovush: 4, nasadka: 3, ftor: 3, "so'lak": 2 },
    cat: { 'Gigiyena vositalari': 5, 'Gigiena vositalari': 5, 'Himoya vositalari': 2 },
  },
  texnik: {
    title: 'Tish texnikasi', seminar: ['other'], seminarWords: ['laborator', 'texnik', 'cad'],
    kw: { gips: 5, mum: 4, sirkon: 5, keramika: 4, frez: 3, protez: 4, qolip: 2, laborator: 5 },
    cat: { Laboratoriya: 6, 'Qolip (ottisk) materiallari': 2 },
  },
  klinika: {
    title: 'Klinika uchun', seminar: ['other'], seminarWords: ['klinika', 'menejment', 'boshqaruv'],
    kw: { avtoklav: 5, steriliz: 4, kreslo: 5, rentgen: 4, kompressor: 4, "qo'lqop": 3, "so'lak": 2 },
    cat: { Uskunalar: 4, Sterilizatsiya: 5, 'Sarflanadigan materiallar': 3, 'Himoya vositalari': 3 },
  },
  talaba: {
    title: 'Talabalar uchun', seminar: [], seminarWords: ['talaba', 'boshlang'],
    kw: { diagnostika: 4, oyna: 3, zond: 3, pinset: 3, "qo'lqop": 2, fantom: 5, model: 2 },
    cat: { Instrumentlar: 4, 'Himoya vositalari': 2 },
  },
  stomatolog: {
    title: 'Stomatologiya', seminar: [], seminarWords: [],
    kw: { kompozit: 3, plomba: 3, bond: 2, fayl: 2, apeks: 2, fotopolimer: 2, nakonechnik: 2, "qo'lqop": 1 },
    cat: { 'Restavratsion materiallar': 3, 'Endodontik asboblar': 2, Uskunalar: 1, Instrumentlar: 1 },
  },
}

/** Mahsulotning mutaxassislikka mosligi (0 — mos emas). Har bir kalit so‘z bir marta hisoblanadi. */
export function specialtyScore(product, key) {
  const prof = SPEC_PROFILES[key]
  if (!prof || !product) return 0
  const title = productTitleText(product)
  const text = productText(product)
  let s = 0
  // Nom/kategoriyadagi so‘z — to‘liq vazn, faqat tavsifda uchrasa — yarim vazn.
  for (const [stem, w] of Object.entries(prof.kw)) {
    const k = normText(stem)
    if (w <= 0) continue
    if (title.includes(k)) s += w
    else if (text.includes(k)) s += w / 2
  }
  const cat = product.rawCategory || product.category || ''
  s += prof.cat[cat] || prof.cat[product.category] || 0
  return s
}

export const SPEC_MATCH_MIN = 4
export const matchesSpecialty = (product, key) => specialtyScore(product, key) >= SPEC_MATCH_MIN

/** Seminar mutaxassislikka mosmi: kategoriya kaliti (impl, endo, ...) yoki sarlavha/teg so‘zlari bo‘yicha. */
export function seminarMatches(seminar, key) {
  const prof = SPEC_PROFILES[key]
  if (!prof || !seminar) return false
  if (prof.seminar.includes(seminar.cat)) return true
  const t = normText(`${seminar.title || ''} ${seminar.tag || ''} ${seminar.topic || ''}`)
  return prof.seminarWords.some((w) => t.includes(normText(w)))
}

/** Seminarlar: mos keladiganlari oldinda (o‘z tartibini saqlab), qolganlari o‘zgarishsiz. */
export function sortSeminarsForSpecialty(list, key) {
  if (!SPEC_PROFILES[key]) return list
  const mine = []
  const rest = []
  for (const s of list) (seminarMatches(s, key) && !s.past && !s.cancelled ? mine : rest).push(s)
  return [...mine, ...rest]
}

export const specialtyTitle = (key) => SPEC_PROFILES[key]?.title || ''
