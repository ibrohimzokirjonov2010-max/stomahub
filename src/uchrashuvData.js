import { tashkentToday } from './tashkentDate'
import { useSyncExternalStore } from 'react'
import { bindBlob, touchBlob } from './recordSync'

export const ANCHOR = '2026-10-20'
export const FOCUS = '2026-10-22'
export const WDS = ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak']
export const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktyabr', 'noyabr', 'dekabr']

export const DEMO_DOCTORS_U = []
export const doctors = []

export const rooms = ['Kreslo 1', 'Kreslo 2', 'Kreslo 3', 'Kreslo 4']
export const services = ['Konsultatsiya', 'Gigiyena', 'Implant', 'Ortodontik', 'Davolash', 'Nazorat', 'Jarrohlik']

export const tones = {
  tasdiq: { bg: '#e7f8ee', bd: '#b7e4c7', dot: '#3dbe74', label: 'Tasdiqlangan' },
  kutil: { bg: '#fff6dc', bd: '#f0dc9a', dot: '#f0b429', label: 'Kutilmoqda' },
  davol: { bg: '#e7f1ff', bd: '#c5daf6', dot: '#5b93e6', label: 'Davolanmoqda' },
  yakun: { bg: '#f2f4f7', bd: '#e1e6ee', dot: '#98a2b3', label: 'Yakunlangan' },
  bekor: { bg: '#ffecee', bd: '#f6c9cf', dot: '#ef6b7b', label: 'Bekor qilingan' },
}

const pic = (name) => (name ? `/images/bemorlar/${name}.jpg` : '')

let n = 1
const a = (date, start, dur, name, photo, service, status, doctor, room, extra = {}) => ({
  id: `u${n++}`, date, start, dur, name, photo: pic(photo), service, status, doctor, room, ...extra,
})

export const seedVisits = []

const DEMO_VISITS = []
let visits = []
const listeners = new Set()
bindBlob('visits', {
  seed: [],
  get: () => visits,
  empty: () => [],
  set: (next) => {
    visits = Array.isArray(next) ? next : visits
    listeners.forEach((fn) => fn())
  },
})

export function useVisits() {
  return useSyncExternalStore((fn) => {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }, () => visits)
}

export function setVisits(next) {
  visits = typeof next === 'function' ? next(visits) : next
  listeners.forEach((fn) => fn())
  touchBlob('visits')
}

export function todayIso() {
  return tashkentToday()
}

export function pad(n) { return String(n).padStart(2, '0') }

export function parts(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m, d }
}

export function isoOf(y, m, d) {
  return `${y}-${pad(m)}-${pad(d)}`
}

export function shift(iso, days) {
  const { y, m, d } = parts(iso)
  const dt = new Date(y, m - 1, d + days)
  return isoOf(dt.getFullYear(), dt.getMonth() + 1, dt.getDate())
}

export function weekdayIndex(iso) {
  const a = parts(ANCHOR)
  const p = parts(iso)
  const diff = Math.round((new Date(p.y, p.m - 1, p.d) - new Date(a.y, a.m - 1, a.d)) / 86400000)
  return ((diff % 7) + 7) % 7
}

export function alignWeek(iso) {
  return shift(iso, -weekdayIndex(iso))
}

export function weekDays(start) {
  return WDS.map((wd, i) => {
    const iso = shift(start, i)
    const { d, m } = parts(iso)
    return { wd, iso, d, m }
  })
}

export function labelRange(start) {
  const days = weekDays(start)
  const a = days[0]
  const b = days[6]
  if (a.m === b.m) return `${a.d} – ${b.d} ${MONTHS[b.m - 1]} ${parts(b.iso).y}`
  return `${a.d} ${MONTHS[a.m - 1]} – ${b.d} ${MONTHS[b.m - 1]} ${parts(b.iso).y}`
}

export function longDate(iso) {
  const { d, m, y } = parts(iso)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

export function clockRange(start, dur) {
  const [h, m] = start.split(':').map(Number)
  const end = h * 60 + m + dur
  return `${start}–${pad(Math.floor(end / 60))}:${pad(end % 60)}`
}

export function minutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
