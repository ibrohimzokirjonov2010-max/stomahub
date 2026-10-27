const face = (n) => `/images/bemorlar/bemor-${n}.jpg`
const FEMALE = ['malika', 'mohira', 'dilnoza', 'sevara', 'madina', 'aziza'].map(face)
const MALE = ['aziz', 'bobur', 'sardor', 'anvar', 'davron'].map(face)

import { tashkentToday } from './tashkentDate'

export const TODAY = tashkentToday()
/** Default chair labels when clinic has no chair_count yet. */
export const DEFAULT_CHAIRS = ['Kreslo 1', 'Kreslo 2', 'Kreslo 3']
export const CHAIRS = DEFAULT_CHAIRS
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
  const n = [...String(name || '')].reduce((s, c) => s + c.charCodeAt(0), 0)
  return list[n % list.length]
}

export function chairsFromSettings(settings) {
  const n = Math.max(0, Math.min(12, Number(settings?.chair_count) || 0))
  if (!n) return []
  return Array.from({ length: n }, (_, i) => `Kreslo ${i + 1}`)
}

export function weekday(iso) {
  return (new Date(`${iso}T00:00:00`).getDay() + 6) % 7
}

export function shiftIso(iso, days) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** @deprecated Demo seed removed — always empty for real accounts. */
export function seedVisits() {
  return []
}

/** @deprecated Demo seed removed. */
export const seedPatients = []

/** @deprecated Demo staff removed. */
export const STAFF = []

/** @deprecated Hardcoded revenue chart removed — use real payments. */
export const REVENUE = {}

export const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
export const MONTHS_CAP = MONTHS.map((m) => m[0].toUpperCase() + m.slice(1))
export const WD = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya']
export const WD_LONG = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba']

export function label(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d}-${MONTHS[m - 1]} ${y}`
}
