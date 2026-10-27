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
