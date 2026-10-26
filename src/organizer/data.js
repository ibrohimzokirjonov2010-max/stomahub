/**
 * Seminar tashkilotchisi — dizayndagi qiymatlar.
 * Keyinroq API ga ulash uchun shu modullar almashtiriladi.
 * @typedef {'rejalashtirilgan'|'jarayonda'|'yakunlangan'|'bekor'} SeminarStatus
 * @typedef {'paid'|'wait'|'unpaid'|'cancel'|'refund'} PayState
 */

export const ORG = {
  name: 'Ibrohim Karimov',
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

export const DASH_BARS = [42, 58, 72, 86, 100, 114, 128, 142, 156, 170, 184, 198]
export const DASH_LINE = [22, 32, 40, 54, 46, 62, 52, 70, 80, 94, 118, 146]
export const TICKET_BARS = [16, 28, 36, 44, 58, 66, 78, 96, 112, 134, 160, 192]
export const PAY_BARS = [8, 12, 15, 17, 18, 20, 22, 26, 28, 31, 35, 39].map((m) => m * 1_000_000)

export const DASH_TICKETS = [
  { label: 'Standart', pct: 56, n: 694, color: '#0f8f86' },
  { label: 'VIP', pct: 24, n: 298, color: '#5dcec4' },
  { label: 'Student', pct: 12, n: 149, color: '#a6e4db' },
  { label: 'Bepul', pct: 8, n: 99, color: '#d9f3ef' },
]

export const SALES_TICKETS = [
  { label: 'VIP', pct: 41, n: 400, color: '#0f8f86' },
  { label: 'Standart', pct: 43, n: 420, color: '#3ec6b8' },
  { label: 'Student', pct: 12, n: 120, color: '#f0b429' },
  { label: 'Guruh', pct: 4, n: 40, color: '#f07167' },
]

export const PAY_METHODS = [
  { label: 'Payme', pct: 40, n: '39.4M', color: '#12a394' },
  { label: 'Click', pct: 32, n: '31.6M', color: '#3b82f6' },
  { label: 'Uzum', pct: 18, n: '17.7M', color: '#8b5cf6' },
  { label: 'Paynet', pct: 6, n: '5.9M', color: '#f59e0b' },
  { label: 'Boshqa', pct: 4, n: '3.9M', color: '#c5d0d4' },
]

/** @type {{icon: string, title: string, text: string, time: string}[]} */
export const ACTIVITY = [
  { icon: 'user', title: 'Aliyeva Mohira ro‘yxatdan o‘tdi', text: 'Endodontiya: kanal davolash asoslari', time: '10:24' },
  { icon: 'pay', title: 'To‘lov qabul qilindi', text: '450 000 so‘m — VIP chipta', time: '09:17' },
  { icon: 'cal', title: 'Yangi seminar yaratildi', text: 'Estetik stomatologiya', time: 'Kecha' },
  { icon: 'award', title: 'Sertifikat berildi', text: 'Karimov Shahzod', time: 'Kecha' },
  { icon: 'qr', title: 'QR orqali kirish tasdiqlandi', text: 'Oral jarrohlik seminari', time: '22.10.2026' },
]

export const UPCOMING = [
  { id: 'implant-nov', title: 'Implantologiya: nazariya va amaliyot', when: '24-noyabr 2026, 10:00', city: 'Toshkent', sold: 150, seats: 200, seat: 'open', image: IMG.teeth },
  { id: 'endo', title: 'Endodontiya: kanal davolash asoslari', when: '12-oktabr 2026, 10:00', city: 'Samarqand', sold: 120, seats: 150, seat: 'low', image: IMG.endo },
  { id: 'oral', title: 'Oral jarrohlik: amaliy ko‘nikmalar', when: '5-avgust 2026, 10:00', city: 'Toshkent', sold: 180, seats: 180, seat: 'full', image: IMG.oral },
  { id: 'bolalar', title: 'Bolalar stomatologiyasi', when: '15-dekabr 2026, 10:00', city: 'Toshkent', sold: 30, seats: 100, seat: 'open', image: IMG.child },
]

export const SEAT = {
  open: { label: 'Ro‘yxat ochiq', tone: 'green', bar: '#14a394' },
  low: { label: 'Joylar kam', tone: 'orange', bar: '#e8a317' },
  full: { label: 'To‘liq band', tone: 'red', bar: '#e11d48' },
}

/** @type {Array<{id: string, title: string, speaker: string, date: string, city: string, format: string, days: string, sold: number, seats: number, revenue: number, status: SeminarStatus, badge: string, image: string, topic: string}>} */
export const SEMINARS = [
  { id: 'implant-nov', title: 'Implantologiya: nazariya va amaliyot', speaker: 'Dr. Sardor Karimov', date: '24-noyabr 2026', city: 'Toshkent', format: 'Oflayn', days: '2 kunlik seminar', sold: 150, seats: 200, revenue: 45000000, status: 'rejalashtirilgan', badge: 'Yaqinda', image: IMG.teeth, topic: 'Implantologiya' },
  { id: 'endo', title: 'Endodontiya: kanal davolash asoslari', speaker: 'Dr. Nigora Aliyeva', date: '12-oktabr 2026', city: 'Samarqand', format: 'Oflayn', days: '2 kunlik seminar', sold: 120, seats: 150, revenue: 28400000, status: 'jarayonda', badge: 'Jarayonda', image: IMG.endo, topic: 'Endodontiya' },
  { id: 'oral', title: 'Oral jarrohlik: amaliy ko‘nikmalar', speaker: 'Dr. Azizbek Mirzayev', date: '5-avgust 2026', city: 'Toshkent', format: 'Oflayn', days: '2 kunlik seminar', sold: 180, seats: 180, revenue: 36000000, status: 'yakunlangan', badge: 'Yakunlangan', image: IMG.oral, topic: 'Jarrohlik' },
  { id: 'bolalar', title: 'Bolalar stomatologiyasi', speaker: 'Dr. Dilnoza Saidova', date: '15-dekabr 2026', city: 'Toshkent', format: 'Oflayn', days: '1 kunlik seminar', sold: 30, seats: 100, revenue: 9200000, status: 'rejalashtirilgan', badge: 'Rejalashtirilgan', image: IMG.child, topic: 'Bolalar' },
  { id: 'estetik', title: 'Estetik stomatologiya: kompozit va vinirlar', speaker: 'Dr. Malika Yo‘ldosheva', date: '10-may 2026', city: 'Toshkent', format: 'Oflayn', days: '1 kunlik seminar', sold: 200, seats: 200, revenue: 52000000, status: 'yakunlangan', badge: 'Yakunlangan', image: IMG.smile, topic: 'Estetika' },
  { id: 'ortodont', title: 'Ortodontiya: zamonaviy yondashuvlar', speaker: 'Dr. Jasur Qodirov', date: '2-noyabr 2026', city: 'Buxoro', format: 'Oflayn', days: '1 kunlik seminar', sold: 40, seats: 80, revenue: 6400000, status: 'rejalashtirilgan', badge: 'Rejalashtirilgan', image: IMG.hall2, topic: 'Ortodontiya' },
  { id: 'mikro', title: 'Mikroskopda endodontiya', speaker: 'Dr. Nigora Aliyeva', date: '8-oktabr 2026', city: 'Toshkent', format: 'Oflayn', days: '1 kunlik seminar', sold: 60, seats: 80, revenue: 12000000, status: 'jarayonda', badge: 'Jarayonda', image: IMG.endo, topic: 'Endodontiya' },
  { id: 'raqamli', title: 'Raqamli implantologiya', speaker: 'Dr. Sardor Karimov', date: '18-iyun 2026', city: 'Samarqand', format: 'Oflayn', days: '2 kunlik seminar', sold: 90, seats: 90, revenue: 18000000, status: 'yakunlangan', badge: 'Yakunlangan', image: IMG.implant, topic: 'Implantologiya' },
]

export const SEMINAR_STATUS = {
  rejalashtirilgan: 'Rejalashtirilgan',
  jarayonda: 'Jarayonda',
  yakunlangan: 'Yakunlangan',
  bekor: 'Bekor qilingan',
}

const CLINICS = ['Stoma Clinic', 'Dental Pro', 'City Dent', 'Perfect Smile', 'Stomatolog+', 'Smile Dent', 'Dental Care', 'Regale Clinic']
const GIVEN = ['Mohira', 'Sardor', 'Dilnoza', 'Behzod', 'Sevinch', 'Jamshid', 'Malika', 'Azizbek', 'Shahzod', 'Nilufar', 'Otabek', 'Madina', 'Jasur', 'Kamola', 'Aziza', 'Bobur', 'Dilshod', 'Javohir', 'Sevara', 'Bekzod']
const FAMILY = ['Aliyeva', 'Karimov', 'Ismoilova', 'Raximov', 'Yusupova', 'Nodirov', 'Tursunova', 'Mirzayev', 'Saidova', 'Qodirova', 'Ergashev', 'Nazarova', 'Soliyev', 'Abdullayeva', 'Hamidov', 'Toirova', 'Usmonova', 'Rahimova', 'Karimova', 'Yuldasheva']
const TICKET_NAMES = ['Standart', 'VIP', 'Student', 'Guruh']

export const PAY_LABEL = {
  paid: 'To‘lov qilingan',
  wait: 'To‘lov kutilmoqda',
  unpaid: 'To‘lov qilinmagan',
  cancel: 'Bekor qilingan',
  refund: 'Qaytarilgan',
}

/** @type {Array<{id: number, name: string, clinic: string, phone: string, email: string, ticket: string, pay: PayState, registered: string, city: string, role: string, avatar: string}>} */
export const PARTICIPANTS = (() => {
  const base = [
    { name: 'Aliyeva Mohira', clinic: 'Stoma Clinic', phone: '+998 90 123 45 67', email: 'm.aliyeva@mail.uz', ticket: 'Standart', pay: 'paid', registered: '24-noy 2026, 10:24', city: 'Toshkent', role: 'Stomatolog' },
    { name: 'Karimov Sardor', clinic: 'Dental Pro', phone: '+998 91 234 56 78', email: 's.karimov@mail.uz', ticket: 'VIP', pay: 'paid', registered: '23-noy 2026, 18:11', city: 'Toshkent', role: 'Implantolog' },
    { name: 'Ismoilova Dilnoza', clinic: 'City Dent', phone: '+998 93 345 67 89', email: 'd.ismoilova@mail.uz', ticket: 'Student', pay: 'wait', registered: '22-noy 2026, 16:45', city: 'Samarqand', role: 'Stomatolog' },
    { name: 'Raximov Behzod', clinic: 'Perfect Smile', phone: '+998 94 456 78 90', email: 'b.rahimov@mail.uz', ticket: 'Standart', pay: 'paid', registered: '22-noy 2026, 14:20', city: 'Toshkent', role: 'Ortodont' },
    { name: 'Yusupova Sevinch', clinic: 'Stomatolog+', phone: '+998 90 567 89 01', email: 's.yusupova@mail.uz', ticket: 'VIP', pay: 'unpaid', registered: '22-noy 2026, 11:05', city: 'Buxoro', role: 'Stomatolog' },
    { name: 'Nodirov Jamshid', clinic: 'Smile Dent', phone: '+998 93 678 90 12', email: 'j.nodirov@mail.uz', ticket: 'Standart', pay: 'paid', registered: '21-noy 2026, 19:30', city: 'Toshkent', role: 'Jarroh' },
    { name: 'Tursunova Malika', clinic: 'Dental Care', phone: '+998 91 789 01 23', email: 'm.tursunova@mail.uz', ticket: 'Student', pay: 'paid', registered: '21-noy 2026, 15:12', city: 'Samarqand', role: 'Stomatolog' },
    { name: 'Mirzayev Azizbek', clinic: 'Regale Clinic', phone: '+998 94 890 12 34', email: 'a.mirzayev@mail.uz', ticket: 'VIP', pay: 'paid', registered: '20-noy 2026, 13:40', city: 'Toshkent', role: 'Implantolog' },
  ]
  const rows = base.map((p, i) => ({ ...p, id: i + 1, avatar: FACES[i % FACES.length] }))
  const pays = [...Array(142).fill('paid'), ...Array(19).fill('wait'), ...Array(9).fill('unpaid'), ...Array(2).fill('cancel')]
  for (let i = 0; i < 172; i++) {
    const n = i + 8
    const g = GIVEN[n % GIVEN.length]
    const f = FAMILY[(n * 3) % FAMILY.length]
    rows.push({
      id: n + 1,
      name: `${f} ${g}`,
      clinic: CLINICS[n % CLINICS.length],
      phone: `+998 9${n % 10} ${100 + (n % 800)} ${10 + (n % 80)} ${10 + (n % 70)}`.replace(/(\d{3}) (\d{3}) (\d{2}) (\d{2})$/, (_, a, b, c, d) => `${a} ${b} ${c} ${d}`),
      email: `${g[0].toLowerCase()}.${f.toLowerCase()}${n}@mail.uz`,
      ticket: TICKET_NAMES[n % 4],
      pay: pays[i],
      registered: `${10 + (n % 18)}-noy 2026, ${String(9 + (n % 10)).padStart(2, '0')}:${String((n * 7) % 60).padStart(2, '0')}`,
      city: CITIES[n % CITIES.length],
      role: 'Stomatolog',
      avatar: FACES[n % FACES.length],
    })
  }
  return rows
})()

export const TICKET_TYPES = [
  { id: 1, name: 'VIP chipta', icon: 'crown', note: 'Old qator o‘rinlar, kofe-breyk, sertifikat, networking', price: 2500000, total: 100, sold: 80, left: 20, active: true, perks: ['Seminarga kirish', 'Maxsus materiallar', 'Oldingi qator o‘rinlar', 'Kofe-breyk', 'Sertifikat', 'Ma’ruzachilar bilan foto'] },
  { id: 2, name: 'Standart chipta', icon: 'gem', note: 'Seminarga kirish, sertifikat', price: 1200000, total: 500, sold: 420, left: 80, active: true, perks: ['Seminarga kirish', 'Sertifikat'] },
  { id: 3, name: 'Student chipta', icon: 'cap', note: 'Talabalar uchun maxsus narx', price: 800000, total: 300, sold: 240, left: 60, active: true, perks: ['Seminarga kirish', 'Sertifikat'] },
  { id: 4, name: 'Guruh chipta', icon: 'users', note: '3+ kishi uchun (1 kishi narxi)', price: 1000000, total: 200, sold: 160, left: 40, active: true, perks: ['Seminarga kirish', 'Sertifikat', 'Guruh chegirmasi'] },
]

export const CHECKINS = [
  { id: 1, name: 'Aliyeva Mohira', clinic: 'Stoma Clinic', time: '10:24', ticket: 'VIP chipta', ok: true, avatar: FACES[0] },
  { id: 2, name: 'Karimov Sardor', clinic: 'Dental Pro', time: '10:22', ticket: 'Standart', ok: true, avatar: FACES[1] },
  { id: 3, name: 'Ismoilova Dilnoza', clinic: 'City Dent', time: '10:18', ticket: 'Student', ok: true, avatar: FACES[2] },
  { id: 4, name: 'Raximov Behzod', clinic: 'Perfect Smile', time: '10:16', ticket: 'VIP', ok: true, avatar: FACES[3] },
  { id: 5, name: 'Yusupova Sevinch', clinic: 'Stomatolog+', time: '10:12', ticket: 'Standart', ok: true, avatar: FACES[4] },
  { id: 6, name: 'Nodirov Jamshid', clinic: 'Smile Dent', time: '10:08', ticket: 'Guruh', ok: true, avatar: FACES[5] },
  { id: 7, name: 'Tursunova Malika', clinic: 'Dental Care', time: '10:03', ticket: 'Student', ok: false, avatar: FACES[6] },
  { id: 8, name: 'Mirzayev Azizbek', clinic: 'Regale Clinic', time: '10:01', ticket: 'VIP', ok: true, avatar: FACES[7] },
]

const PAY_BASE = [
  { who: 'Aliyeva Mohira', clinic: 'Stoma Clinic', seminar: 'Implantologiya: nazariya va amaliyot', sum: 2500000, method: 'Payme', state: 'ok', phone: '+998 90 123 45 67', email: 'm.aliyeva@mail.uz', ticket: 'VIP chipta', when: '24-noy 2026, 10:24' },
  { who: 'Karimov Sardor', clinic: 'Dental Pro', seminar: 'Endodontiya: kanal davolash', sum: 1200000, method: 'Click', state: 'ok', phone: '+998 91 234 56 78', email: 's.karimov@mail.uz', ticket: 'Standart chipta', when: '23-noy 2026, 18:11' },
  { who: 'Ismoilova Dilnoza', clinic: 'City Dent', seminar: 'Oral jarrohlik: amaliy ko‘nikmalar', sum: 800000, method: 'Uzum', state: 'wait', phone: '+998 93 345 67 89', email: 'd.ismoilova@mail.uz', ticket: 'Student chipta', when: '22-noy 2026, 16:45' },
  { who: 'Raximov Behzod', clinic: 'Perfect Smile', seminar: 'Bolalar stomatologiyasi', sum: 1000000, method: 'Payme', state: 'cancel', phone: '+998 94 456 78 90', email: 'b.rahimov@mail.uz', ticket: 'Guruh chipta', when: '21-noy 2026, 14:20' },
  { who: 'Yusupova Sevinch', clinic: 'Stomatolog+', seminar: 'Estetik stomatologiya', sum: 2500000, method: 'Payme', state: 'ok', phone: '+998 90 567 89 01', email: 's.yusupova@mail.uz', ticket: 'VIP chipta', when: '20-noy 2026, 13:40' },
  { who: 'Nodirov Jamshid', clinic: 'Smile Dent', seminar: 'Implantologiya: nazariya va amaliyot', sum: 1200000, method: 'Click', state: 'refund', phone: '+998 93 678 90 12', email: 'j.nodirov@mail.uz', ticket: 'Standart chipta', when: '20-noy 2026, 11:05' },
  { who: 'Tursunova Malika', clinic: 'Dental Care', seminar: 'Endodontiya: kanal davolash', sum: 800000, method: 'Uzum', state: 'ok', phone: '+998 91 789 01 23', email: 'm.tursunova@mail.uz', ticket: 'Student chipta', when: '19-noy 2026, 17:22' },
  { who: 'Mirzayev Azizbek', clinic: 'Regale Clinic', seminar: 'Oral jarrohlik: amaliy ko‘nikmalar', sum: 1000000, method: 'Paynet', state: 'ok', phone: '+998 94 890 12 34', email: 'a.mirzayev@mail.uz', ticket: 'Guruh chipta', when: '18-noy 2026, 15:18' },
]

export const PAY_STATE = {
  ok: 'Muvaffaqiyatli',
  wait: 'Kutilmoqda',
  cancel: 'Bekor qilingan',
  refund: 'Qaytarilgan',
}

export const PAYMENTS = (() => {
  const rows = []
  const mix = [...Array(950).fill('ok'), ...Array(60).fill('wait'), ...Array(20).fill('cancel')]
  for (let i = 0; i < 15; i++) mix.push('refund')
  for (let i = 0; i < 1030; i++) {
    const b = PAY_BASE[i % PAY_BASE.length]
    const day = 24 - (i % 20)
    rows.push({
      ...b,
      id: `ST2026-${String(i + 1).padStart(3, '0')}`,
      avatar: FACES[i % FACES.length],
      state: i < 8 ? b.state : mix[i],
      when: i < 8 ? b.when : `${String(Math.max(1, day)).padStart(2, '0')}-noy 2026, ${String(8 + (i % 12)).padStart(2, '0')}:${String((i * 5) % 60).padStart(2, '0')}`,
      who: i < 8 ? b.who : `${FAMILY[i % FAMILY.length]} ${GIVEN[i % GIVEN.length]}`,
      clinic: i < 8 ? b.clinic : CLINICS[i % CLINICS.length],
    })
  }
  return rows
})()

const CERT_BASE = [
  { name: 'Aliyeva Mohira', clinic: 'Stoma Clinic', seminar: 'Implantologiya', state: 'done', code: 'STH-2026-0001', date: '24-noy 2026' },
  { name: 'Karimov Sardor', clinic: 'Dental Pro', seminar: 'Implantologiya', state: 'done', code: 'STH-2026-0002', date: '24-noy 2026' },
  { name: 'Ismoilova Dilnoza', clinic: 'City Dent', seminar: 'Implantologiya', state: 'done', code: 'STH-2026-0003', date: '24-noy 2026' },
  { name: 'Raximov Behzod', clinic: 'Perfect Smile', seminar: 'Implantologiya', state: 'progress', code: '', date: '' },
  { name: 'Yusupova Sevinch', clinic: 'Perfect Smile', seminar: 'Implantologiya', state: 'done', code: 'STH-2026-0005', date: '24-noy 2026' },
  { name: 'Nodirov Jamshid', clinic: 'Smile Dent', seminar: 'Implantologiya', state: 'none', code: '', date: '' },
  { name: 'Tursunova Malika', clinic: 'Dental Care', seminar: 'Implantologiya', state: 'done', code: 'STH-2026-0007', date: '24-noy 2026' },
  { name: 'Mirzayev Azizbek', clinic: 'Regale Clinic', seminar: 'Implantologiya', state: 'done', code: 'STH-2026-0008', date: '24-noy 2026' },
]

export const CERT_STATE = { done: 'Berilgan', progress: 'Jarayonda', none: 'Berilmagan' }

export const CERTS = (() => {
  const rows = CERT_BASE.map((c, i) => ({ ...c, id: i + 1, avatar: FACES[i % FACES.length] }))
  const rest = [...Array(174).fill('done'), ...Array(14).fill('progress'), ...Array(4).fill('none')]
  rest.forEach((state, i) => {
    const n = i + 9
    const code = state === 'done' ? `STH-2026-${String(n).padStart(4, '0')}` : ''
    rows.push({
      id: n,
      name: `${FAMILY[n % FAMILY.length]} ${GIVEN[n % GIVEN.length]}`,
      clinic: CLINICS[n % CLINICS.length],
      seminar: 'Implantologiya',
      state,
      code,
      date: state === 'done' ? '24-noy 2026' : '',
      avatar: FACES[n % FACES.length],
    })
  })
  return rows
})()

/** @type {Array<{id: number, code: string, name: string, kind: 'foiz'|'summa', value: number, used: number, limit: number, from: string, to: string, status: 'faol'|'yakun'|'reja'|'nofaol'}>} */
export const PROMOS = [
  { id: 1, code: 'STOMAHUB20', name: 'StomaHub chegirma', kind: 'foiz', value: 20, used: 86, limit: 200, from: '1-noy', to: '30-noy 2026', status: 'faol' },
  { id: 2, code: 'IMPLANT10', name: 'Implant 10', kind: 'foiz', value: 10, used: 45, limit: 100, from: '1-noy', to: '24-noy 2026', status: 'faol' },
  { id: 3, code: 'STUDENT50', name: 'Student chegirma', kind: 'foiz', value: 50, used: 38, limit: 50, from: '1-noy', to: '24-noy 2026', status: 'faol' },
  { id: 4, code: 'EARLYBIRD', name: 'Early bird', kind: 'foiz', value: 30, used: 120, limit: 150, from: '1-okt', to: '15-noy 2026', status: 'yakun' },
  { id: 5, code: 'GROUPS', name: 'Guruh', kind: 'foiz', value: 15, used: 27, limit: 100, from: '1-noy', to: '24-noy 2026', status: 'faol' },
  { id: 6, code: 'VIP2026', name: 'VIP', kind: 'summa', value: 200000, used: 18, limit: 50, from: '1-noy', to: '24-noy 2026', status: 'faol' },
  { id: 7, code: 'PARTNER', name: 'Hamkor', kind: 'summa', value: 100000, used: 12, limit: 100, from: '1-noy', to: '30-dek 2026', status: 'faol' },
  { id: 8, code: 'NEWYEAR', name: 'Yangi yil', kind: 'foiz', value: 25, used: 0, limit: 200, from: '1-yan', to: '31-yan 2027', status: 'reja' },
  { id: 9, code: 'INFLUENCER', name: 'Influencer', kind: 'summa', value: 150000, used: 9, limit: 50, from: '1-noy', to: '24-noy 2026', status: 'faol' },
  { id: 10, code: 'ORALCARE', name: 'Oral care', kind: 'foiz', value: 15, used: 0, limit: 100, from: '1-noy', to: '24-noy 2026', status: 'nofaol' },
  { id: 11, code: 'ENDO15', name: 'Endo', kind: 'foiz', value: 15, used: 11, limit: 80, from: '1-noy', to: '24-noy 2026', status: 'faol' },
  { id: 12, code: 'SPRING', name: 'Bahor', kind: 'foiz', value: 10, used: 40, limit: 40, from: '1-mar', to: '31-mar 2026', status: 'yakun' },
]

export const PROMO_STATUS = { faol: 'Faol', yakun: 'Yakunlangan', reja: 'Rejalashtirilgan', nofaol: 'Nofaol' }

export const WALLET_TX = [
  { date: '21.10.2026', seminar: 'Implantologiya: nazariya va amaliyot', sum: 5000000, fee: 600000, net: 4400000, state: 'hold' },
  { date: '15.10.2026', seminar: 'Endodontiya asoslari', sum: 3500000, fee: 420000, net: 3080000, state: 'paid' },
  { date: '10.10.2026', seminar: 'Ortodontiya: zamonaviy yondashuvlar', sum: 2000000, fee: 240000, net: 1760000, state: 'paid' },
  { date: '05.10.2026', seminar: 'Estetik stomatologiya va vinirlar', sum: 4200000, fee: 504000, net: 3696000, state: 'refund' },
  { date: '28.09.2026', seminar: 'Mikroskopda endodontiya', sum: 3800000, fee: 456000, net: 3344000, state: 'paid' },
  { date: '20.09.2026', seminar: 'Raqamli implantologiya', sum: 6000000, fee: 720000, net: 5280000, state: 'paid' },
  { date: '12.09.2026', seminar: 'Zamonaviy implant tizimlari', sum: 2500000, fee: 300000, net: 2200000, state: 'paid' },
  { date: '01.09.2026', seminar: 'Bolalarda stomatologiya', sum: 1800000, fee: 216000, net: 1584000, state: 'refund' },
]

export const WALLET_STATE = { hold: 'Ushlab turilgan', paid: 'O‘tkazildi', refund: 'Qaytarildi' }

export const CONFIRM_PEOPLE = [
  { name: 'Aliyeva Mohira', phone: '+998 90 123 45 67', time: '21.10.2026, 09:12', ok: true, avatar: FACES[0] },
  { name: 'Karimov Bekzod', phone: '+998 91 234 56 78', time: '21.10.2026, 09:18', ok: true, avatar: FACES[1] },
  { name: 'Toirov Dilshod', phone: '+998 93 345 67 89', time: '21.10.2026, 09:21', ok: true, avatar: FACES[10] },
  { name: 'Saidova Malika', phone: '+998 90 456 78 90', time: '21.10.2026, 09:25', ok: true, avatar: FACES[8] },
  { name: 'Usmonov Javohir', phone: '+998 91 567 89 01', time: '21.10.2026, 09:27', ok: true, avatar: FACES[11] },
]

export const HALL_PHOTOS = [IMG.hall, IMG.hall2, IMG.hall3, IMG.hall4, IMG.hall5]

export const DETAIL = {
  id: 'implant',
  topic: 'Implantologiya',
  title: 'Implantologiya: nazariya va amaliyot',
  when: '21 oktabr 2026, 09:00 – 18:00',
  place: 'Tashkent City Kongress Markazi',
  city: 'Toshkent, O‘zbekiston',
  status: 'Faol',
  image: IMG.teeth,
  sold: 42,
  seats: 50,
  revenue: 17500000,
  checked: 42,
  left: 8,
  description: 'Implantologiya sohasidagi zamonaviy yondashuvlar, jarrohlik protokollari va amaliy mashg‘ulotlar. Nazariy bilim va amaliy tajribani birlashtirgan ikki kunlik intensiv seminar.',
  bring: ['Noutbuk yoki planshet', 'Stomatologik lupalar (ixtiyoriy)', 'Shaxsiy ish qurollari', 'Qulay kiyim va oyoq kiyim', 'Bloknot va ruchka'],
  hours: 16,
  minPeople: 20,
  speakers: [
    { name: 'Dr. Azizbek Karimov', role: 'Implantologiya bo‘yicha 15 yillik tajriba', avatar: FACES[10] },
    { name: 'Dr. Malika Saidova', role: 'Jarrohlik va yumshoq to‘qima mutaxassisi', avatar: FACES[8] },
  ],
  venueImage: IMG.venue,
  refundPeople: 42,
  refundSum: 8400000,
}

export const WIZARD_TICKETS = [
  { id: 't1', name: 'Standart', price: 450000, seats: 100, perks: ['Seminarga kirish', 'Materiallar', 'Sertifikat'], tone: 'teal', active: true, basic: true },
  { id: 't2', name: 'VIP', price: 850000, seats: 30, perks: ['Seminarga kirish', 'Materiallar', 'Oldingi qator o‘rinlar', 'Kofe-breyk', 'Sertifikat', 'Ma’ruzachilar bilan foto'], tone: 'amber', active: true },
  { id: 't3', name: 'Student', price: 250000, seats: 50, perks: ['Seminarga kirish', 'Sertifikat'], tone: 'violet', active: true },
]

export const WIZARD_SPEAKERS = [
  { id: 's1', name: 'Dr. Alisher Karimov', role: 'Implantolog', city: 'Toshkent', avatar: FACES[10], bio: '10 yillik tajribaga ega implantolog. Xalqaro seminarlar ishtirokchisi. Astra Tech va Straumann bo‘yicha sertifikatlashgan mutaxassis.', links: ['https://', 'https://'] },
  { id: 's2', name: 'Dr. Malika Tursunova', role: 'Protezist', city: 'Samarqand', avatar: FACES[2], bio: 'Estetik protezlash va vinirlar bo‘yicha amaliyotchi.', links: [] },
  { id: 's3', name: 'Dr. Javohir Sodiqov', role: 'Jarroh', city: 'Toshkent', avatar: FACES[11], bio: 'Oral jarrohlik bo‘yicha klinik rahbar.', links: [] },
]

export const WIZARD_PROMOS = [
  { id: 'p1', code: 'EARLYBIRD', off: '−20%', note: '1-noy – 15-noy', on: true },
  { id: 'p2', code: 'STUDENT50', off: '−50%', note: 'Talabalar uchun', on: true },
  { id: 'p3', code: 'GROUPS', off: '−15%', note: '5+ kishilik guruh', on: false },
]

export const CERT_TEMPLATES = [
  { id: 'teal', name: 'Klassik (Teal)' },
  { id: 'gold', name: 'Premium Gold' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'blue', name: 'Modern Blue' },
]

export const REVIEWS = [
  { name: 'Aliyeva Mohira', clinic: 'Stoma Clinic', stars: 5, text: 'Tashkilot juda silliq o‘tdi. Ro‘yxatdan o‘tish va QR check-in qulay.', date: '22.10.2026', avatar: FACES[0] },
  { name: 'Karimov Sardor', clinic: 'Dental Pro', stars: 5, text: 'Ma’ruzachilar kuchli, materiallar sifatli. VIP chipta arzigulik.', date: '18.10.2026', avatar: FACES[1] },
  { name: 'Ismoilova Dilnoza', clinic: 'City Dent', stars: 4, text: 'Seminar foydali. Joy biroz tor edi, lekin dastur a’lo.', date: '12.10.2026', avatar: FACES[2] },
  { name: 'Nodirov Jamshid', clinic: 'Smile Dent', stars: 5, text: 'Sertifikat o‘sha kuni chiqdi. Keyingi seminarga ham yozilaman.', date: '06.08.2026', avatar: FACES[5] },
]

export const FAQ = [
  { q: 'Pulni qachon yechib olish mumkin?', a: 'Pul faqat seminar o‘tkazilgandan va StomaHub tekshiruvidan o‘tgandan keyin yechib olinadi. So‘rov 1–3 ish kuni ichida ko‘rib chiqiladi.' },
  { q: 'Platforma komissiyasi qancha?', a: 'Har bir to‘lov summasidan 12% platforma komissiyasi ushlab qolinadi.' },
  { q: 'Seminarni bekor qilsam nima bo‘ladi?', a: 'Ishtirokchilarga 100% pul qaytariladi, SMS va email yuboriladi. Bekor qilingan seminar sahifasi “Bekor qilingan” holatiga o‘tadi.' },
  { q: 'QR check-in ishlamasa?', a: 'Manuel check-in orqali ishtirokchi telefoni yoki chipta raqami bilan tasdiqlashingiz mumkin.' },
]

export const REPORT_ROWS = [
  { seminar: 'Implantologiya: nazariya va amaliyot', people: 150, revenue: 45000000, certs: 140 },
  { seminar: 'Endodontiya: kanal davolash asoslari', people: 120, revenue: 28400000, certs: 98 },
  { seminar: 'Oral jarrohlik: amaliy ko‘nikmalar', people: 180, revenue: 36000000, certs: 180 },
  { seminar: 'Estetik stomatologiya: kompozit va vinirlar', people: 200, revenue: 52000000, certs: 196 },
  { seminar: 'Bolalar stomatologiyasi', people: 30, revenue: 9200000, certs: 0 },
]

export function seminarById(id) {
  if (id === 'implant') return null
  return SEMINARS.find((s) => s.id === id) || null
}
