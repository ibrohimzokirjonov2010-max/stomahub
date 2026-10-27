import { useSyncExternalStore } from 'react'
import { marketProducts } from './marketData'
import { bindBlob, touchBlob } from './recordSync'

const photo = (src) => src

export const CATEGORIES = ['Restavratsion material', 'Anesteziya', 'Implantlar', 'Endodontiya', 'Asboblar', 'Sarf materiallar', 'Dezinfeksiya', 'Profilaktika', 'Bondlar', 'Uskunalar']
export const UNITS = ['dona', 'quti', 'ml', 'g', 'kartrij', 'to‘plam', 'flakon']
export const SUPPLIERS = ['3M', 'Inibsa', 'NeoBiotech', 'Meta Biomed', 'Osstem', 'Cerkamed', 'Unigloves', 'Euronda', 'Septodont', 'Ivoclar', 'Kerr', 'Dentsply', 'StomaHub']
export const PLACES = ['Asosiy ombor', 'Shkaf A-1', 'Shkaf A-2', 'Xolodilnik', 'Steril zona']

export const STATUSES = {
  kam: { label: 'Kam zahira', bg: '#fde8e8', color: '#dc2626' },
  mavjud: { label: 'Mavjud', bg: '#e5f7ea', color: '#17803d' },
  tugash: { label: 'Tugash arafasida', bg: '#fff1df', color: '#c2410c' },
}

const CAT = {
  komp: 'Restavratsion material',
  bond: 'Bondlar',
  endo: 'Endodontiya',
  impl: 'Implantlar',
  uch: 'Asboblar',
  asb: 'Asboblar',
  usk: 'Uskunalar',
  gig: 'Profilaktika',
}

const item = (row) => ({ alert: true, place: 'Asosiy ombor', note: '', price: 0, unit: 'dona', incoming: false, ...row })

function seed() {
  return []
}

const DEMO_STOCK = []
let rows = []
const listeners = new Set()
const emit = () => {
  listeners.forEach((fn) => fn())
  touchBlob('stock')
}
bindBlob('stock', {
  seed: [],
  get: () => rows,
  empty: () => [],
  set: (next) => {
    rows = Array.isArray(next) ? next : rows
    listeners.forEach((fn) => fn())
  },
})

export function useOmbor() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => rows,
  )
}

export function addOmbor(product) {
  const qty = Number(product.qty) || 0
  const min = Number(product.min) || 0
  rows = [{ ...item(product), qty, min, status: product.status || (qty < min ? 'kam' : 'mavjud') }, ...rows]
  emit()
}

export function patchOmbor(id, patch) {
  rows = rows.map((r) => {
    if (r.id !== id) return r
    const next = { ...r, ...patch }
    next.qty = Number(next.qty) || 0
    next.min = Number(next.min) || 0
    if (!patch.status) next.status = next.qty < next.min ? 'kam' : r.status === 'tugash' ? 'tugash' : 'mavjud'
    return next
  })
  emit()
}

export function removeOmbor(id) {
  rows = rows.filter((r) => r.id !== id)
  emit()
}

export function receiveStock(lines) {
  let next = rows
  lines.forEach((line, i) => {
    const qty = Number(line.qty) || 0
    if (!qty) return
    const found = next.find((r) => r.sourceId === line.id || r.id === line.id)
    if (found) {
      const nextQty = found.qty + qty
      next = next.map((r) => (r.id === found.id ? { ...r, qty: nextQty, status: nextQty < r.min ? 'kam' : 'mavjud', incoming: true } : r))
      return
    }
    const known = marketProducts.find((p) => p.id === line.id)
    const min = 1
    next = [item({
      id: `in-${line.id}-${i}`,
      sourceId: line.id,
      name: line.name,
      category: CAT[known?.cat] || line.category || 'Sarf materiallar',
      pack: line.type || line.pack || '1 dona',
      sku: `MP-${String(line.id || 'X').replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase()}`,
      qty,
      min,
      expiry: '',
      supplier: known?.brand || line.supplier || 'StomaHub',
      status: qty < min ? 'kam' : 'mavjud',
      image: line.image || '',
      price: Number(line.price) || 0,
      unit: line.unit || 'dona',
      incoming: true,
    }), ...next]
  })
  rows = next
  emit()
}
