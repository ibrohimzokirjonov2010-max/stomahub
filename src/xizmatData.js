import { useSyncExternalStore } from 'react'

export const CATS = [
  { key: 'profilaktika', label: 'Profilaktika', bg: '#e3f4f5', color: '#0b8a95' },
  { key: 'terapiya', label: 'Terapiya', bg: '#e6efff', color: '#2563eb' },
  { key: 'endodontiya', label: 'Endodontiya', bg: '#f1e9ff', color: '#7c3aed' },
  { key: 'jarrohlik', label: 'Jarrohlik', bg: '#f5e6ff', color: '#9333ea' },
  { key: 'implantologiya', label: 'Implantologiya', bg: '#e3f6ee', color: '#15803d' },
  { key: 'ortodontiya', label: 'Ortodontiya', bg: '#fff1df', color: '#c2410c' },
  { key: 'estetik', label: 'Estetik stomatologiya', bg: '#fde8f1', color: '#db2777' },
  { key: 'protezlash', label: 'Protezlash', bg: '#e8eefc', color: '#3b5bdb' },
  { key: 'bolalar', label: 'Bolalar stomatologiyasi', bg: '#fff7d6', color: '#a16207' },
]
export const catOf = (key) => CATS.find((c) => c.key === key) || CATS[1]

export const COLORS = ['#a7e3dc', '#bfdbfe', '#ddd6fe', '#fde68a', '#fbcfe8', '#fca5a5', '#e5e7eb']

const NAMES = {
  profilaktika: [['Professional tozalash (Air Flow)', 350000, 30], ['Ultratovushli tish toshini olish', 300000, 40], ['Ftorlash (1 jag‘)', 150000, 20], ['Fissura germetizatsiyasi', 200000, 20], ['Profilaktik ko‘rik', 100000, 15], ['Gigiyena bo‘yicha maslahat', 80000, 20]],
  terapiya: [['Kompozit plomba', 450000, 40], ['Vaqtinchalik plomba', 120000, 20], ['Karies davolash (yuza)', 350000, 40], ['Karies davolash (chuqur)', 500000, 50], ['Shisha-ionomer plomba', 300000, 30], ['Plomba almashtirish', 400000, 40], ['Tish sezuvchanligini davolash', 200000, 20], ['Restavratsiya (oldingi tish)', 900000, 60]],
  endodontiya: [['Endodontik davolash (1 kanal)', 800000, 60], ['Endodontik davolash (2 kanal)', 1200000, 80], ['Endodontik davolash (3 kanal)', 1600000, 100], ['Kanalni qayta davolash', 1500000, 90], ['Mikroskop ostida davolash', 2000000, 90], ['Pulpit davolash', 700000, 60], ['Periodontit davolash', 900000, 60], ['Kanalga vaqtinchalik dori qo‘yish', 200000, 20]],
  jarrohlik: [['Tish sug‘urish (oddiy)', 300000, 30], ['Tish sug‘urish (murakkab)', 600000, 60], ['Aql tishini olish', 900000, 60], ['Rezeksiya (ildiz uchi)', 1200000, 60], ['Kista olib tashlash', 1100000, 60], ['Frenulotomiya', 400000, 30], ['Sinus lifting', 6000000, 120]],
  implantologiya: [['Implant o‘rnatish (Straumann)', 12000000, 90], ['Implant o‘rnatish (Osstem)', 6500000, 90], ['Suyak augmentatsiyasi', 4000000, 90], ['Formirovatel o‘rnatish', 800000, 30], ['Abatment o‘rnatish', 1500000, 40], ['Implant konsultatsiyasi', 150000, 30]],
  ortodontiya: [['Breket tizimi (1 jag‘)', 5500000, 60], ['Elaynerlar (to‘liq kurs)', 25000000, 60], ['Breketni faollashtirish', 300000, 30], ['Retayner o‘rnatish', 900000, 30]],
  estetik: [['Tish oqartirish (Zoom)', 2000000, 60], ['Vinir (E-max)', 4500000, 90], ['Kompozit vinir', 1800000, 60], ['Uydagi oqartirish kappasi', 1200000, 30]],
  protezlash: [['Zirkon koronka', 3500000, 60], ['Metallokeramika koronka', 1500000, 60], ['Olinadigan protez', 4000000, 60]],
  bolalar: [['Sut tishini davolash', 250000, 30], ['Sut tishini sug‘urish', 150000, 20]],
}

const DESCRIPTIONS = {
  profilaktika: 'Tish va milklarni sog‘lom saqlash uchun profilaktik muolaja.',
  terapiya: 'Kariesni davolash va tishning shaklini tiklash.',
  endodontiya: 'Tish kanallarini tozalash, dezinfeksiya va plombalash.',
  jarrohlik: 'Ambulator jarrohlik muolajasi, mahalliy anesteziya ostida.',
  implantologiya: 'Yo‘qolgan tishni implant yordamida tiklash.',
  ortodontiya: 'Tishlar qatori va prikusni to‘g‘rilash.',
  estetik: 'Tabassum estetikasini yaxshilovchi muolaja.',
  protezlash: 'Tishni koronka yoki protez bilan tiklash.',
  bolalar: 'Bolalar uchun og‘riqsiz va qulay muolaja.',
}

const colorOf = { profilaktika: 0, terapiya: 1, endodontiya: 2, jarrohlik: 2, implantologiya: 0, ortodontiya: 3, estetik: 4, protezlash: 1, bolalar: 3 }

const firstRow = ['profilaktika', 'terapiya', 'endodontiya', 'jarrohlik', 'implantologiya', 'ortodontiya', 'estetik', 'protezlash']

function seed() {
  const ordered = []
  firstRow.forEach((cat) => ordered.push([cat, NAMES[cat][0]]))
  CATS.forEach(({ key }) => NAMES[key].forEach((row, i) => {
    if (!(i === 0 && firstRow.includes(key))) ordered.push([key, row])
  }))
  return ordered.map(([cat, [name, price, duration]], i) => ({
    id: `xzm-${i + 1}`,
    code: `XZM-${String(i + 1).padStart(3, '0')}`,
    name,
    cat,
    price,
    duration,
    teeth: '',
    status: i % 13 === 11 ? 'nofaol' : 'faol',
    short: DESCRIPTIONS[cat],
    body: '',
    materials: '',
    tags: [catOf(cat).label.split(' ')[0].toLowerCase()],
    inPlans: true,
    color: COLORS[colorOf[cat]],
    art: cat,
    image: '',
    docs: [],
  }))
}

let rows = seed()
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())

export function useXizmatlar() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => rows,
  )
}

export function nextCode() {
  const max = rows.reduce((m, r) => Math.max(m, Number(r.code.replace(/\D/g, '')) || 0), 0)
  return `XZM-${String(max + 1).padStart(3, '0')}`
}

export function saveXizmat(item) {
  rows = rows.some((r) => r.id === item.id) ? rows.map((r) => (r.id === item.id ? item : r)) : [item, ...rows]
  emit()
}

export function patchXizmat(ids, patch) {
  const set = new Set([].concat(ids))
  rows = rows.map((r) => (set.has(r.id) ? { ...r, ...patch } : r))
  emit()
}

export function removeXizmat(ids) {
  const set = new Set([].concat(ids))
  rows = rows.filter((r) => !set.has(r.id))
  emit()
}

export function importXizmat(list) {
  rows = [...list, ...rows]
  emit()
}
