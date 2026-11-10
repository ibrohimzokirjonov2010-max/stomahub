/**
 * Bo‘lim posterlari (slayder) matnlari — bitta joyda, keyin osongina almashtiriladi.
 * Har bir bo‘lim: full (bo‘limda real yozuvlar bor) va empty (hali yozuv yo‘q) holatlari.
 *   title — qisqa sarlavha, text — bo‘lim nima uchun / nima qilish mumkin, cta — tugma.
 *   count(n) — faqat real son (n = bo‘limdagi haqiqiy yozuvlar), 0 bo‘lsa ko‘rsatilmaydi.
 *   action: 'scroll' (ro‘yxatga tushish) | 'post' (shu bo‘limda e’lon berish) | yo‘l ('/elonlar?joylash=1').
 * Qoidalar: "bepul", "birinchi bo‘lib", soxta hajm/raqamlar YO‘Q. O‘zbekcha: o‘ g‘ (U+2018), ’ (U+2019).
 */
export const SECTION_POSTERS = {
  marketplace: {
    full: { title: 'Kerakli material, bir joyda', text: 'Mahsulotlarni ko‘ring va bir joyda buyurtma bering', cta: 'Mahsulotlarni ko‘rish', action: 'scroll' },
    empty: { title: 'Mahsulotingizni shu yerda soting', text: 'Stomatologlar material va asboblarni shu yerdan qidiradi', cta: 'Sotuvchi bo‘lish', action: '/sotuvchi-bolish' },
    count: (n) => `${n} ta mahsulot sotuvda`,
  },
  seminarlar: {
    full: { title: 'Malakangizni oshiring', text: 'Yaqin seminarlar, sana va tashkilotchi bilan', cta: 'Seminarni tanlash', action: 'scroll' },
    empty: { title: 'Seminaringizni joylang', text: 'Stomatologlar seminar va master-klasslarni shu yerda qidiradi', cta: 'Tashkilotchi bo‘lish', action: '/tashkilotchi-bolish' },
    count: (n) => `${n} ta yaqin seminar`,
  },
  kitoblar: {
    full: { title: 'Stomatologik adabiyotlar', text: 'Darsliklar va qo‘llanmalar bir joyda', cta: 'Kitoblarni ko‘rish', action: 'scroll' },
    empty: { title: 'Stomatologik adabiyotlar', text: 'Darsliklar va qo‘llanmalar shu yerda jamlanadi', cta: 'Sotuvchi bo‘lish', action: '/sotuvchi-bolish' },
    count: (n) => `${n} ta kitob`,
  },
  forma: {
    full: { title: 'Tibbiy forma va xalatlar', text: 'O‘lcham va rang bo‘yicha tanlang, savatga qo‘shing', cta: 'Formalarni ko‘rish', action: 'scroll' },
    empty: { title: 'Tibbiy formani shu yerda soting', text: 'Shifokorlar forma, xalat va poyabzalni shu yerda qidiradi', cta: 'Sotuvchi bo‘lish', action: '/sotuvchi-bolish' },
    count: (n) => `${n} ta mahsulot`,
  },
  jihozlar: {
    full: { title: 'Klinikangiz uchun uskunalar', text: 'Yangi va ishlatilgan uskunalarni narxi va holati bo‘yicha solishtiring', cta: 'Uskunalarni ko‘rish', action: 'scroll' },
    empty: { title: 'Uskunangizni shu yerda soting', text: 'Klinikalar ustanovka, rentgen va skanerni shu yerda qidiradi', cta: 'Sotuvchi bo‘lish', action: '/sotuvchi-bolish' },
    count: (n) => `${n} ta uskuna`,
  },
  ortiqcha: {
    full: { title: 'Ortib qolgan materiallar', text: 'Hamkasblardan yaroqli materiallarni qulay narxda oling', cta: 'Materiallarni ko‘rish', action: 'scroll' },
    empty: { title: 'Ortib qolgan materialni soting', text: 'Yaroqli materialni hamkasblar shu yerda qidiradi', cta: 'E’lon berish', action: 'post' },
    count: (n) => `${n} ta e’lon`,
  },
  talim: {
    full: { title: 'Onlayn kurslar', text: 'Amaliyotchi shifokorlardan video darslar va kurslar', cta: 'Kurslarni ko‘rish', action: 'scroll' },
    empty: { title: 'Kursingizni joylang', text: 'Stomatologlar yangi kurs va darslarni shu yerda qidiradi', cta: 'Tashkilotchi bo‘lish', action: '/tashkilotchi-bolish' },
    count: (n) => `${n} ta kurs`,
  },
  ustalar: {
    full: { title: 'Uskuna ustalari', text: 'Ta’mir, o‘rnatish va servis uchun usta toping', cta: 'Ustalarni ko‘rish', action: 'scroll' },
    empty: { title: 'Xizmatingizni joylang', text: 'Klinikalar uskuna ta’miri va servis uchun ustani shu yerda qidiradi', cta: 'E’lon joylash', action: '/elonlar?joylash=1' },
    count: (n) => `${n} ta usta`,
  },
  ishlar: {
    full: { title: 'Stomatologiyada ish o‘rinlari', text: 'Lavozim, shahar va maosh bo‘yicha vakansiya tanlang', cta: 'Vakansiyalarni ko‘rish', action: 'scroll' },
    empty: { title: 'Vakansiyangizni joylang', text: 'Stomatologlar ish o‘rinlarini shu yerda qidiradi', cta: 'Vakansiya qo‘shish', action: 'post' },
    count: (n) => `${n} ta vakansiya`,
  },
  mutaxassislar: {
    full: { title: 'Mutaxassisdan maslahat oling', text: 'Murakkab holat bo‘yicha onlayn yoki klinikada konsultatsiya', cta: 'Mutaxassisni tanlash', action: 'scroll' },
    empty: { title: 'Hamkasblaringizdan so‘rang', text: 'Klinik savollar va tajriba almashish — Hamjamiyatda', cta: 'Savol berish', action: '/hamjamiyat' },
    count: (n) => `${n} ta mutaxassis`,
  },
  elonlar: {
    full: { title: 'Hamkasblar e’lonlari', text: 'Uskuna, material va ish e’lonlarini ko‘ring yoki o‘zingiz joylang', cta: 'E’lonlarni ko‘rish', action: 'scroll' },
    empty: { title: 'E’loningizni joylang', text: 'Uskuna, material yoki ish e’lonini stomatologlar shu yerda ko‘radi', cta: 'E’lon joylash', action: 'post' },
    count: (n) => `${n} ta e’lon`,
  },
}

/** Hali slayderi yo‘q sahifalar uchun tayyor matnlar (Klinika CRM, Hamjamiyat) — kerak bo‘lsa shu yerdan olinadi. */
export const PROMO_POSTERS = {
  klinika: { title: 'Klinikangiz endi daftarda emas', text: 'Bemorlar, qabullar va to‘lovlar bitta ekranda', cta: 'CRMni boshlash', action: '/klinika' },
  hamjamiyat: { title: 'Hamkasblaringizdan so‘rang', text: 'Klinik savollar va tajriba almashish', cta: 'Savol berish', action: '/hamjamiyat' },
}

/** Marketplace turkum sahifasi (turkum tanlanganda) — sarlavha = turkum nomi, matn shu yerdan. */
export const MARKET_CATEGORY_TEXT = {
  'Restavratsion materiallar': 'Kompozit, bond va plomba materiallari',
  Implantlar: 'Implant tizimlari, abatment va komponentlar',
  'Yordamchi materiallar': 'Kundalik ish uchun yordamchi materiallar',
  'Sarflanadigan materiallar': 'Har kuni kerak bo‘ladigan sarf materiallari',
  'Endodontik asboblar': 'Fayllar, gutapercha va kanal davolash uchun asboblar',
  Instrumentlar: 'Qo‘l asboblari va diagnostika to‘plamlari',
  Uskunalar: 'Klinika uchun apparat va uskunalar',
  'Himoya vositalari': 'Qo‘lqop, niqob va shaxsiy himoya vositalari',
  'Qolip (ottisk) materiallari': 'Silikon, alginat va qolip olish uchun materiallar',
  Sterilizatsiya: 'Avtoklav, paket va sterilizatsiya vositalari',
  'Estetik stomatologiya': 'Oqartirish va estetik davolash uchun mahsulotlar',
  'Izolyatsiya materiallari': 'Koferdam va ish maydonini izolyatsiya qilish vositalari',
  Ortodontiya: 'Breket, dugalar va ortodontik materiallar',
  'Gigiyena vositalari': 'Professional gigiyena va profilaktika vositalari',
}
export const categoryPoster = (label) => ({ title: label, text: MARKET_CATEGORY_TEXT[label] || 'Shu turkumdagi mahsulotlarni ko‘ring va buyurtma bering', cta: 'Mahsulotlarni ko‘rish', action: 'scroll' })

/** Bo‘lim uchun asosiy poster: real son bo‘lsa full, bo‘lmasa empty. */
export function sectionPoster(key, n) {
  const p = SECTION_POSTERS[key]
  if (!p) return null
  const base = n > 0 ? p.full : p.empty
  return { ...base, badge: n > 0 && p.count ? p.count(n) : '' }
}
