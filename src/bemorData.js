import { useSyncExternalStore } from 'react'
import { bindBlob, touchBlob } from './recordSync'
import { PROFILE_VISIT_OPTS, profileVisitKey, reconcileList } from './teeth/autoToothStatus'

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

const mini = (seed) => {
  const states = ['ok', 'ok', 'ok', 'care', 'done', 'bad', 'ok', 'ok']
  return Array.from({ length: 16 }, (_, i) => states[(i + seed) % states.length])
}

let rows = []
const listeners = new Set()
const emit = () => {
  listeners.forEach((fn) => fn())
  touchBlob('patients')
}
bindBlob('patients', {
  seed: [],
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
  rows = [{ debt: Math.max(0, (p.total || 0) - (p.paid || 0)), teeth: {}, visits: [], docs: [], mini: mini(3), tags: ['Yangi'], allergy: [], diseases: [], created: Date.now(), ...p }, ...rows]
  emit()
}

// Profil tashrifi "bajarildi" bo'lsa, shu tishning holati xizmatga qarab avtomatik qo'yiladi.
function withAutoTeeth(p, patch) {
  if (!Array.isArray(patch.visits)) return patch
  const r = reconcileList(p.visits, patch.visits, patch.teeth ?? p.teeth ?? {}, profileVisitKey, PROFILE_VISIT_OPTS)
  return r.changed ? { ...patch, visits: r.list, teeth: r.teeth } : patch
}

export function patchBemor(id, patch0) {
  rows = rows.map((p) => {
    if (p.id !== id) return p
    const patch = withAutoTeeth(p, patch0)
    return { ...p, ...patch, debt: Math.max(0, (patch.total ?? p.total) - (patch.paid ?? p.paid)) }
  })
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
