import { useSyncExternalStore } from 'react'
import { bindBlob, touchBlob } from './recordSync'
import { shiftIso } from './klinikaData'

const face = (n) => `/images/bemorlar/bemor-${n}.jpg`

export const TODAY = '2026-10-25'
export const CHAIR_LIST = ['Kreslo 1', 'Kreslo 2', 'Kreslo 3']
export const TIMES = ['09:00', '10:00', '11:30', '13:00', '14:00', '15:30', '17:00']
export const PAY_METHODS = ['Naqd', 'Plastik karta', 'Click', 'Payme', 'Bank o‘tkazmasi']

export const DOCTORS = [
  { id: 'sardor', name: 'Dr. Sardor Karimov', role: 'Implantolog', photo: face('sardor') },
  { id: 'kamol', name: 'Dr. Kamol Rahimov', role: 'Ortodont', photo: face('anvar') },
  { id: 'malika', name: 'Dr. Malika Yo‘ldosheva', role: 'Endodontist', photo: face('sevara') },
  { id: 'ibrohim', name: 'Dr. Ibrohim', role: 'Stomatolog', photo: '/images/avatar.jpg' },
]
export const doctorOf = (id) => DOCTORS.find((d) => d.id === id) || DOCTORS[0]

export const PLAN_STATUS = {
  reja: { label: 'Reja qilingan', bg: '#e8f0ff', color: '#3b6fd8', dot: '#3b82f6' },
  kutilmoqda: { label: 'Kutilmoqda', bg: '#fff1df', color: '#c2410c', dot: '#f59e0b' },
  jarayonda: { label: 'Jarayonda', bg: '#e3f4f5', color: '#0b8a95', dot: '#0b8a95' },
  yakunlangan: { label: 'Yakunlangan', bg: '#e6f7ec', color: '#15803d', dot: '#16a34a' },
}

export const STAGE_STATUS = {
  bajarildi: { label: 'Bajarildi', bg: '#e3f6ee', color: '#15803d', tint: '#5fd3b8' },
  jarayonda: { label: 'Jarayonda', bg: '#fff1df', color: '#c2410c', tint: '#f5a524' },
  rejada: { label: 'Rejalashtirilgan', bg: '#efeaff', color: '#6d4fd6', tint: '#a78bfa' },
}

export const money = (n) => Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')
export const dmy = (iso) => (iso ? iso.split('-').reverse().join('.') : '—')
export const totalOf = (p) => p.stages.reduce((s, x) => s + x.price, 0)
export const debtOf = (p) => Math.max(0, totalOf(p) - p.paid)
export const progressOf = (p) => {
  const n = p.stages.filter((s) => s.status !== 'rejada').length
  return { n, of: p.stages.length, pct: p.stages.length ? Math.round((n / p.stages.length) * 100) : 0 }
}

const KINDS = {
  orto: {
    title: 'Ortodontik reja',
    subtitle: 'Breket tizimi bilan tishlarni tekislash',
    steps: [
      ['Ko‘rik va diagnostika', 'Ortopantomogramma, gips modellar va sefalometriya', [], null, 1],
      ['Professional tozalash', 'Breket o‘rnatishdan oldingi gigiyena', [], null, 1],
      ['Breket o‘rnatish (yuqori jag‘)', 'Yuqori jag‘ga metall breket tizimi', [13, 12, 11, 21, 22, 23], null, 4],
      ['Breket o‘rnatish (pastki jag‘)', 'Pastki jag‘ga metall breket tizimi', [43, 42, 41, 31, 32, 33], null, 4],
      ['Nazorat va korreksiya', 'Oylik nazorat, yoyni almashtirish', [], null, 2],
    ],
  },
  tozalash: {
    title: 'Tish tozalash rejasi',
    subtitle: 'Professional gigiyena va profilaktika',
    steps: [
      ['Ko‘rik va konsultatsiya', 'Og‘iz bo‘shlig‘i ko‘rigi, gigiyena indeksi', [], null, 1],
      ['Ultratovushli tozalash', 'Tish toshlarini olish', [], null, 3],
      ['Air Flow tozalash', 'Pigmentli karashni olib tashlash', [], null, 3],
      ['Ftorlash', 'Emalni mustahkamlash', [], null, 2],
      ['Nazorat ko‘rigi', '3 oydan keyin nazorat', [], null, 1],
    ],
  },
  endo: {
    title: 'Endodontik reja',
    subtitle: 'Kanal davolash va restavratsiya',
    steps: [
      ['Ko‘rik va rentgen', 'RVG surat va diagnostika', [], null, 1],
      ['Kanal davolash', '26-tish kanallarini tozalash va plombalash', [26], 'endo', 5],
      ['Kanal davolash', '24-tish kanal davolash', [24], 'endo', 4],
      ['Kompozit plomba', '24-tish kompozit restavratsiya', [24], 'filling', 3],
      ['Nazorat rentgeni', 'Davolash natijasini tekshirish', [26, 24], null, 1],
    ],
  },
  protez: {
    title: 'Protezlash rejasi',
    subtitle: 'Metallokeramika ko‘prik protez',
    steps: [
      ['Ko‘rik va qolip olish', 'Diagnostika va qolip', [], null, 1],
      ['Tishlarni tayyorlash', '15, 17-tishlarni charxlash', [15, 17], null, 2],
      ['Vaqtinchalik koronka', 'Vaqtinchalik plastmassa koronka', [15, 17], 'crown', 2],
      ['Ko‘prik protez o‘rnatish', '15–17 metallokeramika ko‘prik', [15, 16, 17], 'crown', 8],
      ['Nazorat', 'Tishlash va gigiyena nazorati', [], null, 1],
    ],
  },
  kanal: {
    title: 'Kanal davolash rejasi',
    subtitle: 'Ko‘p kanalli tishni davolash',
    steps: [
      ['Ko‘rik va rentgen', 'Diagnostika', [], null, 1],
      ['Kanalni ochish', '46-tish kanallarini ochish va dori qo‘yish', [46], 'endo', 3],
      ['Kanal plombalash', '46-tish kanallarini gutapercha bilan plombalash', [46], 'endo', 4],
      ['Shtift o‘rnatish', '46-tishga fiberglass shtift', [46], 'post', 2],
      ['Kompozit restavratsiya', '46-tish tojini tiklash', [46], 'filling', 3],
    ],
  },
  implant: {
    title: 'Implantatsiya rejasi',
    subtitle: 'Implant + koronka',
    steps: [
      ['Ko‘rik va 3D KT', 'Kompyuter tomografiya va rejalashtirish', [], null, 1],
      ['Tish sug‘urish', '36-tishni olib tashlash', [36], 'missing', 1],
      ['Implant o‘rnatish', '36-tish o‘rniga implant', [36], 'implant', 6],
      ['Formirovatel o‘rnatish', 'Milkni shakllantirish', [36], 'implant', 1],
      ['Koronka o‘rnatish', 'Implant ustiga zirkon koronka', [36], 'crown', 3],
    ],
  },
}

const VISIT_TIMES = ['10:00', '11:30', '14:00', '15:30', '10:00']

function visitsFrom(id, stages) {
  return stages.map((s, i) => ({
    id: `${id}-v${i + 1}`,
    date: s.date,
    time: s.date ? VISIT_TIMES[i % VISIT_TIMES.length] : '',
    title: s.teeth.length ? `${s.title} (${s.teeth.join(', ')})` : s.title,
    status: s.status,
  }))
}

function build({ id, kind, patient, doctor, start, done, active, total, paid, status, chair = 'Kreslo 1' }) {
  const k = KINDS[kind]
  const wsum = k.steps.reduce((s, x) => s + x[4], 0)
  let left = total
  const stages = k.steps.map(([title, desc, teeth, art, w], i) => {
    const price = i === k.steps.length - 1 ? left : Math.round((total * w) / wsum / 50000) * 50000
    left -= price
    const st = i < done ? 'bajarildi' : i < done + active ? 'jarayonda' : 'rejada'
    const date = st === 'bajarildi' ? shiftIso(start, i) : st === 'jarayonda' ? TODAY : shiftIso(TODAY, (i - done - active + 1) * 4)
    return { id: `${id}-s${i + 1}`, title, desc, teeth, art, price, date, status: st }
  })
  return {
    id, code: id.toUpperCase(), patient, doctor, chair, title: k.title, subtitle: k.subtitle, start, status, paid,
    discount: 0, payMode: 'full', stages, visits: visitsFrom(id, stages), note: '', teeth: {},
    payments: paid ? [{ date: start, sum: paid, method: 'Plastik karta' }] : [],
  }
}

const aliyeva = (() => {
  const stages = [
    { id: 'dr-0001-s1', title: 'Ko‘rik va rentgen', desc: 'Klinik ko‘rik, rentgen suratlari va davolash rejasini tuzish', teeth: [], art: null, price: 200000, date: '2026-10-12', status: 'bajarildi' },
    { id: 'dr-0001-s2', title: 'Kanal davolash', desc: '36-tish kanal davolash (endodontik)', teeth: [36], art: 'endo', price: 1500000, date: '2026-10-15', status: 'bajarildi' },
    { id: 'dr-0001-s3', title: 'Kompozit plomba', desc: '36-tish kompozit plomba qo‘yish', teeth: [36], art: 'filling', price: 800000, date: '2026-10-20', status: 'jarayonda' },
    { id: 'dr-0001-s4', title: 'Implant o‘rnatish', desc: '46-tish implant o‘rnatish', teeth: [46], art: 'implant', price: 4500000, date: '2026-10-25', status: 'rejada' },
    { id: 'dr-0001-s5', title: 'Toj o‘rnatish', desc: '46-tish ustiga kronka o‘rnatish', teeth: [46], art: 'crown', price: 2800000, date: '', status: 'rejada' },
  ]
  return {
    id: 'dr-0001',
    code: 'DR-0001',
    patient: { id: 'aliyeva-mohira', name: 'Aliyeva Mohira', phone: '+998 90 123 45 67', age: '25 yosh', gender: 'Ayol', city: 'Toshkent', photo: face('mohira'), code: 'P-0001' },
    doctor: 'sardor',
    chair: 'Kreslo 1',
    title: 'Implant va kronka',
    subtitle: 'Implant + kronka kompleks davolash',
    start: '2026-10-12',
    status: 'jarayonda',
    paid: 5200000,
    discount: 0,
    payMode: 'stages',
    stages,
    visits: [
      { id: 'dr-0001-v1', date: '2026-10-12', time: '10:00', title: 'Ko‘rik va rentgen', status: 'bajarildi' },
      { id: 'dr-0001-v2', date: '2026-10-15', time: '11:30', title: 'Kanal davolash (36)', status: 'bajarildi' },
      { id: 'dr-0001-v3', date: '2026-10-20', time: '11:30', title: 'Kompozit plomba (36)', status: 'jarayonda' },
      { id: 'dr-0001-v4', date: '2026-10-25', time: '10:00', title: 'Implant (46)', status: 'rejada' },
      { id: 'dr-0001-v5', date: '', time: '', title: 'Kronka (46)', status: 'rejada' },
    ],
    note: 'Bemor implant va kronka uchun rozi. Keyingi uchrashuvda 36-tish plomba yakunlanadi.',
    teeth: {},
    payments: [
      { date: '2026-10-12', sum: 1700000, method: 'Naqd' },
      { date: '2026-10-20', sum: 3500000, method: 'Plastik karta' },
    ],
  }
})()

const pt = (id, name, phone, age, gender, photo, code, city = 'Toshkent') => ({ id, name, phone, age, gender, city, photo, code })

function seed() {
  return [
    aliyeva,
    build({ id: 'dr-0002', kind: 'orto', patient: pt('karimov-aziz', 'Karimov Aziz', '+998 91 987 65 43', '32 yosh', 'Erkak', face('aziz'), 'P-0002'), doctor: 'kamol', start: '2026-10-18', done: 5, active: 0, total: 3800000, paid: 3800000, status: 'yakunlangan', chair: 'Kreslo 2' }),
    build({ id: 'dr-0003', kind: 'tozalash', patient: pt('', 'Nazarova Sitora', '+998 90 111 22 33', '29 yosh', 'Ayol', '', 'P-0031'), doctor: 'malika', start: '2026-10-25', done: 1, active: 0, total: 1200000, paid: 0, status: 'kutilmoqda', chair: 'Kreslo 3' }),
    build({ id: 'dr-0004', kind: 'endo', patient: pt('', 'To‘xtayeva Dilnoza', '+998 93 555 77 88', '34 yosh', 'Ayol', face('dilnoza'), 'P-0032'), doctor: 'sardor', start: '2026-10-22', done: 3, active: 1, total: 3200000, paid: 1600000, status: 'jarayonda' }),
    build({ id: 'dr-0005', kind: 'protez', patient: pt('', 'Raximov Bobur', '+998 97 444 55 66', '41 yosh', 'Erkak', face('bobur'), 'P-0033'), doctor: 'kamol', start: '2026-10-15', done: 5, active: 0, total: 4500000, paid: 4500000, status: 'yakunlangan', chair: 'Kreslo 2' }),
    build({ id: 'dr-0006', kind: 'kanal', patient: pt('', 'Mirzayeva Munojat', '+998 91 222 33 44', '38 yosh', 'Ayol', '', 'P-0034', 'Samarqand'), doctor: 'malika', start: '2026-10-19', done: 1, active: 1, total: 2700000, paid: 1350000, status: 'jarayonda', chair: 'Kreslo 3' }),
    build({ id: 'dr-0007', kind: 'implant', patient: pt('', 'Qodirov Jasur', '+998 90 666 77 99', '45 yosh', 'Erkak', face('davron'), 'P-0035'), doctor: 'sardor', start: '2026-10-21', done: 2, active: 1, total: 5000000, paid: 2500000, status: 'jarayonda' }),
    build({ id: 'dr-0008', kind: 'orto', patient: pt('ismoilova-madina', 'Ismoilova Madina', '+998 94 333 22 11', '18 yosh', 'Ayol', face('madina'), 'P-0007'), doctor: 'kamol', start: '2026-10-17', done: 5, active: 0, total: 3600000, paid: 3600000, status: 'yakunlangan', chair: 'Kreslo 2' }),
  ]
}

let plans = seed()
let templates = []
const listeners = new Set()
const emit = () => {
  listeners.forEach((fn) => fn())
  touchBlob('plans')
}
bindBlob('plans', {
  get: () => ({ plans, templates }),
  empty: () => ({ plans: [], templates: [] }),
  set: (payload) => {
    plans = Array.isArray(payload?.plans) ? payload.plans : plans
    templates = Array.isArray(payload?.templates) ? payload.templates : []
    listeners.forEach((fn) => fn())
  },
})
const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const usePlans = () => useSyncExternalStore(subscribe, () => plans)
export const useTemplates = () => useSyncExternalStore(subscribe, () => templates)
export const getPlan = (id) => plans.find((p) => p.id === id)

export function nextPlanCode() {
  const n = plans.reduce((m, p) => Math.max(m, Number(p.code.replace(/\D/g, '')) || 0), 0) + 1
  return `DR-${String(n).padStart(4, '0')}`
}

function sync(p) {
  if (!p.stages.length) return p
  const all = p.stages.every((s) => s.status === 'bajarildi')
  if (all) return { ...p, status: 'yakunlangan' }
  if (p.status === 'yakunlangan') return { ...p, status: 'jarayonda' }
  if (p.stages.some((s) => s.status === 'jarayonda') && (p.status === 'reja' || p.status === 'kutilmoqda')) return { ...p, status: 'jarayonda' }
  return p
}

export function savePlan(plan) {
  const next = sync(plan)
  plans = plans.some((p) => p.id === plan.id) ? plans.map((p) => (p.id === plan.id ? next : p)) : [next, ...plans]
  emit()
}

export function patchPlan(id, patch) {
  plans = plans.map((p) => {
    if (p.id !== id) return p
    const changes = typeof patch === 'function' ? patch(p) : patch
    const next = { ...p, ...changes }
    return 'status' in changes ? next : sync(next)
  })
  emit()
}

export function removePlan(id) {
  plans = plans.filter((p) => p.id !== id)
  emit()
}

export function addPayment(id, sum, method, date = TODAY) {
  patchPlan(id, (p) => ({ paid: p.paid + sum, payments: [...(p.payments || []), { date, sum, method }] }))
}

export function saveTemplate(t) {
  templates = [{ ...t, id: `tpl-${Date.now()}` }, ...templates.filter((x) => x.name !== t.name)]
  emit()
}
