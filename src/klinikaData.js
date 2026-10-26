const face = (n) => `/images/bemorlar/bemor-${n}.jpg`
const FEMALE = ['malika', 'mohira', 'dilnoza', 'sevara', 'madina', 'aziza'].map(face)
const MALE = ['aziz', 'bobur', 'sardor', 'anvar', 'davron'].map(face)

export const TODAY = '2026-10-23'
export const CHAIRS = ['Kreslo 1', 'Kreslo 2', 'Kreslo 3']
export const SLOTS = ['09:00', '10:00', '13:00', '14:00', '15:30', '17:00']
export const LUNCH = '11:30'
export const SERVICES = ['Konsultatsiya', 'Plomba', 'Davolash', 'Tozalash (professional)', 'Implant konsultatsiya', 'Endodontiya', 'Proteza', 'Jarrohlik konsultatsiya', 'Implant', 'Tozalash']
export const CITY_LIST = ['Toshkent', 'Samarqand', 'Buxoro', 'Namangan', 'Andijon', 'Farg‘ona', 'Navoiy']

export const STATUS = {
  qabulda: { label: 'Qabulda', bg: '#e3f6ee', color: '#15803d' },
  kutilmoqda: { label: 'Kutilmoqda', bg: '#fff1df', color: '#c2410c' },
  tasdiq: { label: 'Tasdiqlangan', bg: '#e3f4f5', color: '#0b8a95' },
  tugadi: { label: 'Tugallandi', bg: '#eef1f5', color: '#64748b' },
}

export const avatarOf = (name, female) => {
  const list = female ? FEMALE : MALE
  const n = [...name].reduce((s, c) => s + c.charCodeAt(0), 0)
  return list[n % list.length]
}

const v = (chair, time, name, service, status, female, phone = '') => ({
  id: `${TODAY}-${chair}-${time}`, date: TODAY, chair, time, name, service, status, female, phone, avatar: avatarOf(name, female),
})

const todayVisits = [
  v(0, '09:00', 'Aliyeva Malika', 'Konsultatsiya', 'qabulda', true, '+998 90 123 45 67'),
  v(0, '10:00', 'Karimov Akmal', 'Plomba', 'kutilmoqda', false, '+998 93 765 43 21'),
  v(0, '13:00', 'Qodirov Bekzod', 'Davolash', 'tasdiq', false, '+998 90 888 11 22'),
  v(0, '14:00', 'Saydullayeva Gulnoza', 'Tozalash (professional)', 'tasdiq', true, '+998 93 661 22 11'),
  v(0, '15:30', 'Ismoilov Diyor', 'Implant konsultatsiya', 'kutilmoqda', false, '+998 90 555 33 22'),
  v(1, '09:00', 'Tursunova Nilufar', 'Endodontiya', 'tugadi', true),
  v(1, '10:00', 'Rahmonov Sardor', 'Konsultatsiya', 'qabulda', false),
  v(1, '13:00', 'Abdullayeva Sevinch', 'Proteza', 'kutilmoqda', true),
  v(1, '15:30', 'Murodov Jasur', 'Jarrohlik konsultatsiya', 'tasdiq', false),
  v(2, '09:00', 'Xolmirzayev Aziz', 'Plomba', 'tugadi', false),
  v(2, '10:00', 'Hamitova Sarvinoz', 'Konsultatsiya', 'qabulda', true),
  v(2, '13:00', 'Nazarov Jahongir', 'Tozalash', 'tasdiq', false),
  v(2, '14:00', 'Yusupova Malika', 'Davolash', 'kutilmoqda', true),
  v(2, '15:30', 'Karimova Dilnoza', 'Implant', 'tasdiq', true),
]

const POOL = [
  ['Ergasheva Shahnoza', true], ['Norboyev Otabek', false], ['Saidova Kamola', true], ['Xolmatov Sardorbek', false],
  ['Mirzayeva Diyora', true], ['Qodirov Jahongir', false], ['Aliyev Azizbek', false], ['Tursunova Sevinch', true],
  ['Toshmatov Jasur', false], ['Yusupova Nilufar', true], ['Rahimov Bekzod', false], ['Karimova Dildora', true],
]

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

export function weekday(iso) {
  return (new Date(`${iso}T00:00:00`).getDay() + 6) % 7
}

function generated(iso) {
  if (weekday(iso) === 6) return []
  const out = []
  CHAIRS.forEach((_, chair) => {
    SLOTS.forEach((time, i) => {
      const h = hash(`${iso}${chair}${time}`)
      if (h % 10 > 5) return
      const [name, female] = POOL[(h >>> 3) % POOL.length]
      const status = iso < TODAY ? 'tugadi' : i % 3 === 0 ? 'kutilmoqda' : 'tasdiq'
      out.push({ id: `${iso}-${chair}-${time}`, date: iso, chair, time, name, service: SERVICES[(h >>> 5) % SERVICES.length], status, female, phone: '', avatar: avatarOf(name, female) })
    })
  })
  return out
}

export function seedVisits(from = '2026-09-28', days = 70) {
  const out = [...todayVisits]
  for (let i = 0; i < days; i++) {
    const iso = shiftIso(from, i)
    if (iso !== TODAY) out.push(...generated(iso))
  }
  return out
}

export function shiftIso(iso, days) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
export const MONTHS_CAP = MONTHS.map((m) => m[0].toUpperCase() + m.slice(1))
export const WD = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya']
export const WD_LONG = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba']

export function label(iso) {
  const [, m, d] = iso.split('-').map(Number)
  return `${d}-${MONTHS[m - 1]} 2026`
}

export const seedPatients = [
  { id: 'kp-1', name: 'Aliyeva Malika', female: true, phone: '+998 90 123 45 67', last: '20.10.2026', next: '27.10.2026', debt: 0, status: 'Faol' },
  { id: 'kp-2', name: 'Karimov Akmal', female: false, phone: '+998 93 765 43 21', last: '18.10.2026', next: '', debt: 1250000, status: 'Faol' },
  { id: 'kp-3', name: 'Qodirov Bekzod', female: false, phone: '+998 90 888 11 22', last: '15.10.2026', next: '29.10.2026', debt: 0, status: 'Faol' },
  { id: 'kp-4', name: 'Saydullayeva Gulnoza', female: true, phone: '+998 93 661 22 11', last: '21.10.2026', next: '', debt: 320000, status: 'Faol' },
  { id: 'kp-5', name: 'Ismoilov Diyor', female: false, phone: '+998 90 555 33 22', last: '10.10.2026', next: '24.10.2026', debt: 0, status: 'Faol' },
  { id: 'kp-6', name: 'Tursunova Nilufar', female: true, phone: '+998 91 222 41 10', last: '23.10.2026', next: '', debt: 0, status: 'Faol' },
  { id: 'kp-7', name: 'Rahmonov Sardor', female: false, phone: '+998 97 410 20 30', last: '12.10.2026', next: '23.10.2026', debt: 450000, status: 'Davolanishda' },
].map((p) => ({ ...p, avatar: avatarOf(p.name, p.female) }))

export const STAFF = [
  { id: 'ak', initials: 'AK', name: 'Dr. Aziz Karimov', role: 'Implantolog', tag: 'Shifokor', today: 5, phone: '+998 90 111 22 33', online: true, tone: '#e3f6ee', ink: '#15803d' },
  { id: 'my', initials: 'MY', name: 'Dr. Malika Yusupova', role: 'Endodontist', tag: 'Shifokor', today: 4, phone: '+998 90 222 33 44', online: true, tone: '#e6efff', ink: '#2563eb' },
  { id: 's', initials: 'S', name: 'Sarvarbek', role: 'Assistent', tag: 'Assistent', today: 3, phone: '+998 90 333 44 55', online: true, tone: '#efe9ff', ink: '#7c3aed' },
  { id: 'd', initials: 'D', name: 'Dilnoza', role: 'Admin', tag: 'Admin', today: 6, phone: '+998 90 444 55 66', online: true, tone: '#efe9ff', ink: '#7c3aed' },
  { id: 'nt', initials: 'NT', name: 'Dr. Nodir Tursunov', role: 'Ortoped', tag: 'Shifokor', today: 0, phone: '+998 90 555 66 77', online: false, tone: '#fff1df', ink: '#c2410c' },
  { id: 'gr', initials: 'GR', name: 'Gulshan Rahimova', role: 'Kassir', tag: 'Admin', today: 0, phone: '+998 90 666 77 88', online: false, tone: '#eef1f5', ink: '#475569' },
]

export const REVENUE = {
  month: { label: 'Bu oy', total: 28450000, delta: '+12%', income: [3, 5, 4, 6, 3, 7, 5, 4, 6, 8, 5, 7, 4, 6, 9, 5, 7, 6, 8, 10, 6, 7, 9, 8, 11, 7, 9, 12, 8, 10], cost: [1, 2, 1, 2, 1, 2, 2, 1, 2, 3, 2, 2, 1, 2, 3, 2, 2, 2, 3, 3, 2, 2, 3, 2, 3, 2, 3, 3, 2, 3] },
  prev: { label: 'O‘tgan oy', total: 25400000, delta: '+4%', income: [4, 3, 5, 4, 6, 5, 4, 7, 5, 6, 4, 5, 6, 7, 5, 4, 6, 8, 6, 5, 7, 6, 8, 7, 6, 9, 7, 8, 6, 9], cost: [2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 3, 2, 1, 2, 3, 2, 2, 2, 2, 3, 2, 2, 3, 2, 3, 2, 3] },
  week: { label: 'Bu hafta', total: 6820000, delta: '+8%', income: [6, 9, 7, 11, 8, 12, 3], cost: [2, 3, 2, 3, 2, 4, 1] },
}
