import { useSyncExternalStore } from 'react'
import { bindBlob, touchBlob } from './recordSync'

const photo = (name) => `/images/bemorlar/${name}.jpg`
export const som = (n) => `${n.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m`
export const STATUSES = ['Faol', 'Davolanishda', 'Yangi', 'Kuzatuvda', 'Nofaol']
export const CITIES = ['Toshkent', 'Samarqand', 'Buxoro', 'Namangan', 'Andijon', 'Farg‘ona', 'Navoiy']
export const SOURCES = ['Instagram', 'Telegram', 'Do‘st tavsiyasi', 'Reklama', 'Klinika', 'Boshqa']

export const statusClass = {
  Faol: 'bg-[#e5f8ee] text-[#1c9a52]',
  Davolanishda: 'bg-[#fff3d6] text-[#b07d00]',
  Yangi: 'bg-[#e7f0ff] text-[#3a6fd6]',
  Kuzatuvda: 'bg-[#f3e9ff] text-[#8a4ec4]',
  Nofaol: 'bg-[#ffe6ec] text-[#e15b78]',
}

const malikaTeeth = {
  18: 'caries', 17: 'caries', 16: 'filling', 15: 'healthy', 14: 'endo', 13: 'healthy', 12: 'filling', 11: 'healthy',
  21: 'healthy', 22: 'healthy', 23: 'filling', 24: 'crown', 25: 'healthy', 26: 'healthy', 27: 'missing', 28: 'healthy',
  48: 'crown', 47: 'caries', 46: 'filling', 45: 'healthy', 44: 'filling', 43: 'healthy', 42: 'healthy', 41: 'healthy',
  31: 'implant', 32: 'healthy', 33: 'healthy', 34: 'crown', 35: 'crown', 36: 'filling', 37: 'missing', 38: 'healthy',
}

const mini = (seed) => {
  const states = ['ok', 'ok', 'ok', 'care', 'done', 'bad', 'ok', 'ok']
  return Array.from({ length: 16 }, (_, i) => states[(i + seed) % states.length])
}

const designed = [
  { id: 'aliyeva-mohira', name: 'Aliyeva Mohira', age: '25 yosh', birth: '14.03.2001', gender: 'Ayol', phone: '+998 90 123 45 67', city: 'Toshkent', status: 'Faol', last: '12.10.2026', next: '20.10.2026', code: 'P-0001', email: 'mohiraaliyeva@gmail.com', photo: photo('bemor-mohira'), telegram: '@mohiraaliyeva', address: 'Yakkasaroy tumani, Shota Rustaveli 18', tags: ['Faol bemor', 'Implant', 'Ortodontik davolash', 'VIP'], allergy: ['Penitsillin', 'Aspirin'], diseases: ['Gipertoniya (yengil)', 'Diabet (2 tip)'], note: 'Bemorda anesteziyaga nisbatan sezuvchanlik mavjud. Davolash oldidan og‘iz bo‘shimi tekshirilsin.', teeth: malikaTeeth, docs: [
    { name: 'OPG', date: '12 okt 2024', image: photo('bemor-opg') },
    { name: 'RVG 11', date: '15 sen 2024', image: photo('bemor-rvg') },
    { name: '3D KT', date: '15 sen 2024', image: photo('bemor-kt') },
    { name: 'Intraoral foto', date: '15 sen 2024', image: photo('bemor-intra') },
    { name: 'Davolash rejasi', date: '28 sen 2024' },
  ], mini: ['ok', 'ok', 'ok', 'care', 'ok', 'done', 'ok', 'bad', 'ok', 'ok', 'ok', 'ok', 'done', 'ok', 'ok', 'ok'], visits: [
    { date: '12 okt 2024', kind: 'Endodontik davolash', tooth: '11', doctor: 'Dr. Ibrohim', done: true, note: '14 tish – plomba' },
    { date: '28 sen 2024', kind: 'Konsultatsiya', doctor: 'Dr. Sardor', done: true, note: 'Ortodontik maslahat' },
    { date: '15 sen 2024', kind: 'Implant o‘rnatish', tooth: '31', doctor: 'Dr. Ibrohim', done: true },
    { date: '2 sen 2024', kind: 'Profilaktik ko‘rik', doctor: 'Dr. Nigora', done: true, note: 'Professional tozalash' },
  ] },
  { id: 'karimov-aziz', name: 'Karimov Aziz', age: '32 yosh', birth: '02.06.1994', gender: 'Erkak', phone: '+998 93 234 56 78', city: 'Toshkent', status: 'Davolanishda', last: '10.10.2026', next: '15.10.2026', code: 'P-0002', email: 'aziz.karimov@mail.uz', photo: photo('bemor-aziz') },
  { id: 'normatova-dilnoza', name: 'Normatova Dilnoza', age: '28 yosh', birth: '19.01.1998', gender: 'Ayol', phone: '+998 90 345 67 89', city: 'Samarqand', status: 'Yangi', last: '', next: '18.10.2026', code: 'P-0003', email: 'dilnoza.n@gmail.com', photo: photo('bemor-dilnoza') },
  { id: 'tursunov-bobur', name: 'Tursunov Bobur', age: '40 yosh', birth: '11.11.1985', gender: 'Erkak', phone: '+998 91 456 78 90', city: 'Toshkent', status: 'Faol', last: '08.10.2026', next: '', code: 'P-0004', email: 'bobur.t@mail.uz', photo: photo('bemor-bobur') },
  { id: 'jabborova-sevara', name: 'Jabborova Sevara', age: '22 yosh', birth: '07.04.2004', gender: 'Ayol', phone: '+998 93 567 89 01', city: 'Toshkent', status: 'Kuzatuvda', last: '05.10.2026', next: '05.01.2027', code: 'P-0005', email: 'sevara.j@gmail.com', photo: photo('bemor-sevara') },
  { id: 'raximov-sardor', name: 'Raximov Sardor', age: '35 yosh', birth: '23.08.1991', gender: 'Erkak', phone: '+998 90 678 90 12', city: 'Buxoro', status: 'Davolanishda', last: '11.10.2026', next: '25.10.2026', code: 'P-0006', email: 'sardor.r@mail.uz', photo: photo('bemor-sardor') },
  { id: 'ismoilova-madina', name: 'Ismoilova Madina', age: '18 yosh', birth: '30.12.2007', gender: 'Ayol', phone: '+998 93 789 01 23', city: 'Toshkent', status: 'Faol', last: '07.10.2026', next: '', code: 'P-0007', email: 'madina.i@gmail.com', photo: photo('bemor-madina') },
  { id: 'xudoyberdiyev-anvar', name: 'Xudoyberdiyev Anvar', age: '45 yosh', birth: '16.02.1981', gender: 'Erkak', phone: '+998 91 890 12 34', city: 'Toshkent', status: 'Nofaol', last: '01.09.2026', next: '', code: 'P-0008', email: 'anvar.x@mail.uz', photo: photo('bemor-anvar') },
  { id: 'qodirova-aziza', name: 'Qodirova Aziza', age: '27 yosh', birth: '05.05.1999', gender: 'Ayol', phone: '+998 90 901 23 45', city: 'Namangan', status: 'Faol', last: '09.10.2026', next: '22.10.2026', code: 'P-0009', email: 'aziza.q@gmail.com', photo: photo('bemor-aziza') },
  { id: 'usmonov-davron', name: 'Usmonov Davron', age: '30 yosh', birth: '28.09.1996', gender: 'Erkak', phone: '+998 93 012 34 56', city: 'Toshkent', status: 'Davolanishda', last: '13.10.2026', next: '27.10.2026', code: 'P-0010', email: 'davron.u@mail.uz', photo: photo('bemor-davron') },
].map((p, i) => ({
  ...p,
  mini: p.mini || mini(i),
  address: p.address || p.city,
  source: 'Instagram',
  telegram: p.telegram || '',
  tags: p.tags || (p.status === 'Faol' ? ['Faol bemor'] : [p.status]),
  allergy: p.allergy || [],
  diseases: p.diseases || [],
  meds: 'Yo‘q',
  habits: 'Yo‘q',
  note: p.note || '',
  total: p.total || 2500000 + i * 400000,
  paid: p.paid || 1500000 + i * 200000,
  teeth: p.teeth || {},
  docs: p.docs || [],
  visits: p.visits || [{ date: p.last || p.next, kind: 'Ko‘rik', note: 'Birlamchi qabul', doctor: 'Dr. Ibrohim' }],
}))

const malika = {
  id: 'malika-karimova',
  name: 'Malika Karimova',
  age: '28 yosh',
  birth: '12 fev 1996',
  birthIso: '1996-02-12',
  gender: 'Ayol',
  phone: '+998 90 123 45 67',
  city: 'Toshkent',
  status: 'Faol',
  last: '12.10.2024',
  next: '02.11.2024',
  code: '000184',
  email: 'malika.karimova@mail.uz',
  photo: photo('bemor-malika'),
  address: 'Mirzo Ulug‘bek tumani, Buyuk Ipak Yo‘li 45',
  source: 'Instagram',
  telegram: '@malikakarimova',
  tags: ['Faol bemor', 'Implant', 'Ortodontik davolash', 'VIP'],
  allergy: ['Penitsillin', 'Aspirin'],
  diseases: ['Gipertoniya (yengil)', 'Diabet (2 tip)'],
  meds: 'Yo‘q',
  habits: 'Yo‘q',
  note: 'Bemorda anesteziyaga nisbatan sezuvchanlik mavjud. Davolash oldidan og‘iz bo‘shimi tekshirilsin.',
  total: 12500000,
  paid: 8000000,
  teeth: malikaTeeth,
  mini: ['ok', 'care', 'done', 'ok', 'ok', 'bad', 'ok', 'done', 'ok', 'ok', 'implant', 'ok', 'ok', 'done', 'ok', 'ok'],
  visits: [
    { date: '12 okt 2024', kind: 'Endodontik davolash', tooth: '11', doctor: 'Dr. Ibrohim', done: true },
    { date: '28 sen 2024', kind: 'Konsultatsiya', doctor: 'Dr. Sardor', done: true },
    { date: '15 sen 2024', kind: 'Implant o‘rnatish', tooth: '31', doctor: 'Dr. Ibrohim', done: true },
    { date: '2 sen 2024', kind: 'Profilaktik ko‘rik', doctor: 'Dr. Nigora', done: true },
  ],
  docs: [
    { name: 'OPG', date: '12 okt 2024', image: photo('bemor-opg') },
    { name: 'RVG 11', date: '15 sen 2024', image: photo('bemor-rvg') },
    { name: '3D KT', date: '15 sen 2024', image: photo('bemor-kt') },
    { name: 'Intraoral foto', date: '15 sen 2024', image: photo('bemor-intra') },
    { name: 'Davolash rejasi', date: '28 sen 2024' },
  ],
}

const firstNames = ['Jasur', 'Nilufar', 'Bekzod', 'Gulnora', 'Otabek', 'Shahnoza', 'Kamola', 'Sardorbek', 'Diyora', 'Jahongir', 'Malika', 'Azizbek', 'Sevinch', 'Dildora']
const lastNames = ['Toshmatov', 'Yusupova', 'Rahimov', 'Ergasheva', 'Norboyev', 'Saidova', 'Karimova', 'Xolmatov', 'Mirzayeva', 'Qodirov', 'Aliyev', 'Tursunova']
const fillerStatuses = ['Faol', 'Davolanishda', 'Faol', 'Yangi', 'Kuzatuvda', 'Faol', 'Nofaol', 'Davolanishda']

function filler(i) {
  const name = `${lastNames[i % lastNames.length]} ${firstNames[i % firstNames.length]}`
  const city = CITIES[i % CITIES.length]
  const status = fillerStatuses[i % fillerStatuses.length]
  const day = String((i % 27) + 1).padStart(2, '0')
  const month = String((i % 9) + 1).padStart(2, '0')
  return {
    id: `bemor-${i + 1}`,
    name,
    age: `${20 + (i % 35)} yosh`,
    birth: `${day}.${month}.${1975 + (i % 30)}`,
    gender: i % 2 ? 'Ayol' : 'Erkak',
    phone: `+998 9${i % 4} ${String(100 + (i % 800)).padStart(3, '0')} ${String(10 + (i % 89)).padStart(2, '0')} ${String(10 + (i % 80)).padStart(2, '0')}`,
    city,
    status,
    last: i % 5 === 0 ? '' : `${day}.${month}.2026`,
    next: i % 4 === 0 ? '' : `${String((i % 26) + 1).padStart(2, '0')}.${String(((i + 3) % 9) + 1).padStart(2, '0')}.2026`,
    code: `P-${String(i + 20).padStart(4, '0')}`,
    email: `bemor${i}@mail.uz`,
    photo: '',
    address: city,
    source: SOURCES[i % SOURCES.length],
    telegram: '',
    tags: [status],
    allergy: [],
    diseases: [],
    meds: 'Yo‘q',
    habits: 'Yo‘q',
    note: '',
    total: 800000 + (i % 12) * 250000,
    paid: 400000 + (i % 8) * 150000,
    teeth: {},
    mini: mini(i),
    visits: [{ date: `${day}.${month}.2026`, kind: 'Ko‘rik', note: 'Rejali qabul', doctor: 'Dr. Ibrohim' }],
    docs: [],
  }
}

function seed() {
  const fillers = Array.from({ length: 237 }, (_, i) => filler(i))
  return [...designed, malika, ...fillers].map((p) => ({ debt: Math.max(0, p.total - p.paid), ...p }))
}

let rows = seed()
const listeners = new Set()
const emit = () => {
  listeners.forEach((fn) => fn())
  touchBlob('patients')
}
bindBlob('patients', {
  get: () => rows,
  empty: () => [],
  set: (next) => {
    rows = Array.isArray(next) ? next : rows
    listeners.forEach((fn) => fn())
  },
})

export function useBemorlar() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => rows,
  )
}

export const getBemor = (id) => rows.find((p) => p.id === id)

export function addBemor(p) {
  rows = [{ debt: Math.max(0, (p.total || 0) - (p.paid || 0)), teeth: {}, visits: [], docs: [], mini: mini(3), tags: ['Yangi'], allergy: [], diseases: [], ...p }, ...rows]
  emit()
}

export function patchBemor(id, patch) {
  rows = rows.map((p) => (p.id === id ? { ...p, ...patch, debt: Math.max(0, (patch.total ?? p.total) - (patch.paid ?? p.paid)) } : p))
  emit()
}

export function removeBemor(id) {
  rows = rows.filter((p) => p.id !== id)
  emit()
}

export const docsOf = {
  opg: photo('bemor-opg'),
  rvg: photo('bemor-rvg'),
  kt: photo('bemor-kt'),
  intra: photo('bemor-intra'),
}
