/**
 * Seminar tashkilotchisi — dizayndagi qiymatlar.
 * Keyinroq API ga ulash uchun shu modullar almashtiriladi.
 * @typedef {'rejalashtirilgan'|'jarayonda'|'yakunlangan'|'bekor'} SeminarStatus
 * @typedef {'paid'|'wait'|'unpaid'|'cancel'|'refund'} PayState
 */

export const ORG = {
  name: '',
  role: 'Tashkilotchi',
  city: 'Toshkent',
  avatar: '/images/avatar.jpg',
  brand: 'StomaHub',
}

export const CITIES = ['Toshkent', 'Samarqand', 'Buxoro', 'Andijon', 'Farg‘ona', 'Namangan', 'Nukus']

export const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']

export const num = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
export const som = (n) => `${num(n)} so‘m`

export const FACES = [
  '/images/avatar.jpg',
  '/images/seller-1.jpg',
  '/images/seller-2.jpg',
  '/images/seller-3.jpg',
  '/images/seller-4.jpg',
  '/images/seller-5.jpg',
  '/images/market/avatar2.jpg',
  '/images/surplus/seller.jpg',
  '/images/forma/woman-navy.jpg',
  '/images/forma/man-teal.jpg',
  '/images/ustalar/usta-sardor.jpg',
  '/images/ustalar/usta-jasur.jpg',
  '/images/forma/woman-lilac.jpg',
  '/images/ustalar/usta-dilshod.jpg',
  '/images/ustalar/usta-bobur.jpg',
]

export const IMG = {
  implant: '/images/hero-implant.jpg',
  teeth: '/images/seminars/teeth.jpg',
  endo: '/images/seminars/micro.jpg',
  oral: '/images/seminars/surgery.jpg',
  child: '/images/seminars/smile.jpg',
  smile: '/images/seminar-1.jpg',
  hall: '/images/ishlar/ish-hall.jpg',
  hall2: '/images/seminars/hotel.jpg',
  hall3: '/images/ishlar/ish-waiting.jpg',
  hall4: '/images/hero-main.jpg',
  hall5: '/images/ishlar/ish-chair.jpg',
  venue: '/images/ishlar/ish-dentacare.jpg',
}

export const DASH_BARS = []
export const DASH_LINE = []
export const TICKET_BARS = []
export const PAY_BARS = [].map((m) => m * 1_000_000)

export const DASH_TICKETS = []

export const SALES_TICKETS = []

export const PAY_METHODS = []

/** @type {{icon: string, title: string, text: string, time: string}[]} */
export const ACTIVITY = []

export const UPCOMING = []

export const SEAT = {
  open: { label: 'Ro‘yxat ochiq', tone: 'green', bar: '#14a394' },
  low: { label: 'Joylar kam', tone: 'orange', bar: '#e8a317' },
  full: { label: 'To‘liq band', tone: 'red', bar: '#e11d48' },
}

/** @type {Array<{id: string, title: string, speaker: string, date: string, city: string, format: string, days: string, sold: number, seats: number, revenue: number, status: SeminarStatus, badge: string, image: string, topic: string}>} */
export const SEMINARS = []

export const SEMINAR_STATUS = {
  rejalashtirilgan: 'Rejalashtirilgan',
  jarayonda: 'Jarayonda',
  yakunlangan: 'Yakunlangan',
  bekor: 'Bekor qilingan',
}

const CLINICS = ['Stoma Clinic', 'Dental Pro', 'City Dent', 'Perfect Smile', 'Stomatolog+', 'Smile Dent', 'Dental Care', 'Regale Clinic']
const GIVEN = ['Mohira', 'Sardor', 'Dilnoza', 'Behzod', 'Sevinch', 'Jamshid', 'Malika', 'Azizbek', 'Shahzod', 'Nilufar', 'Otabek', 'Madina', 'Jasur', 'Kamola', 'Aziza', 'Bobur', 'Dilshod', 'Javohir', 'Sevara', 'Bekzod']
const FAMILY = []
const TICKET_NAMES = ['Standart', 'VIP', 'Student', 'Guruh']

export const PAY_LABEL = {
  paid: 'To‘lov qilingan',
  wait: 'To‘lov kutilmoqda',
  unpaid: 'To‘lov qilinmagan',
  cancel: 'Bekor qilingan',
  refund: 'Qaytarilgan',
}

/** @type {Array<{id: number, name: string, clinic: string, phone: string, email: string, ticket: string, pay: PayState, registered: string, city: string, role: string, avatar: string}>} */
export const PARTICIPANTS = []

export const TICKET_TYPES = []

export const CHECKINS = []

const PAY_BASE = []

export const PAY_STATE = {
  ok: 'Muvaffaqiyatli',
  wait: 'Kutilmoqda',
  cancel: 'Bekor qilingan',
  refund: 'Qaytarilgan',
}

export const PAYMENTS = []

const CERT_BASE = []

export const CERT_STATE = { done: 'Berilgan', progress: 'Jarayonda', none: 'Berilmagan' }

export const CERTS = []

/** @type {Array<{id: number, code: string, name: string, kind: 'foiz'|'summa', value: number, used: number, limit: number, from: string, to: string, status: 'faol'|'yakun'|'reja'|'nofaol'}>} */
export const PROMOS = []

export const PROMO_STATUS = { faol: 'Faol', yakun: 'Yakunlangan', reja: 'Rejalashtirilgan', nofaol: 'Nofaol' }

export const WALLET_TX = []

export const WALLET_STATE = { hold: 'Ushlab turilgan', paid: 'O‘tkazildi', refund: 'Qaytarildi' }

export const CONFIRM_PEOPLE = []

export const HALL_PHOTOS = [IMG.hall, IMG.hall2, IMG.hall3, IMG.hall4, IMG.hall5]

export const DETAIL = {
  id: '',
  topic: '',
  title: '',
  when: '',
  place: '',
  city: '',
  status: '',
  image: IMG.teeth,
  sold: 0,
  seats: 0,
  revenue: 0,
  checked: 0,
  left: 0,
  description: '',
  bring: [],
  hours: 0,
  minPeople: 0,
  speakers: [],
  venueImage: IMG.venue,
  refundPeople: 0,
  refundSum: 0,
}

export const WIZARD_TICKETS = []

export const WIZARD_SPEAKERS = []

export const WIZARD_PROMOS = []

export const CERT_TEMPLATES = [
  { id: 'teal', name: 'Klassik (Teal)' },
  { id: 'gold', name: 'Premium Gold' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'blue', name: 'Modern Blue' },
]

export const REVIEWS = []

export const FAQ = [
  { q: 'Pulni qachon yechib olish mumkin?', a: 'Pul faqat seminar o‘tkazilgandan va StomaHub tekshiruvidan o‘tgandan keyin yechib olinadi. So‘rov 1–3 ish kuni ichida ko‘rib chiqiladi.' },
  { q: 'Platforma komissiyasi qancha?', a: 'Har bir to‘lov summasidan 12% platforma komissiyasi ushlab qolinadi.' },
  { q: 'Seminarni bekor qilsam nima bo‘ladi?', a: 'Ishtirokchilarga 100% pul qaytariladi, SMS va email yuboriladi. Bekor qilingan seminar sahifasi “Bekor qilingan” holatiga o‘tadi.' },
  { q: 'QR check-in ishlamasa?', a: '“Qo‘lda check-in” orqali ishtirokchi telefoni yoki chipta raqami bilan tasdiqlashingiz mumkin.' },
]

export const REPORT_ROWS = []

export function seminarById(id) {
  if (id === 'implant') return null
  return SEMINARS.find((s) => s.id === id) || null
}
