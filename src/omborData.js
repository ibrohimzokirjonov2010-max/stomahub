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

const designed = [
  item({ id: 'filtek', name: 'Filtek Universal', category: 'Restavratsion material', pack: 'Kompozit 4g', sku: 'CMP-001', qty: 12, min: 20, expiry: '15.08.2027', supplier: '3M', status: 'kam', image: photo('/images/aksiyalar/aksiya-filtek.jpg'), price: 350000 }),
  item({ id: 'articaine', name: 'Articaine 4%', category: 'Anesteziya', pack: '1.8ml kartrij', sku: 'AN-004', qty: 5, min: 20, expiry: '12.03.2026', supplier: 'Inibsa', status: 'kam', image: photo('/images/market/p2.jpg'), price: 45000, unit: 'kartrij' }),
  item({ id: 'implant', name: 'Implant NeoBiotech', category: 'Implantlar', pack: 'Ø4.0 x 10mm', sku: 'IMP-010', qty: 8, min: 10, expiry: '', supplier: 'NeoBiotech', status: 'kam', image: photo('/images/aksiyalar/aksiya-implant.jpg'), price: 2250000 }),
  item({ id: 'gutta', name: 'Gutta Percha', category: 'Endodontiya', pack: '#25 (100 dona)', sku: 'END-025', qty: 3, min: 10, expiry: '20.12.2026', supplier: 'Meta Biomed', status: 'kam', image: photo('/images/aksiyalar/aksiya-files.jpg'), price: 85000, unit: 'quti' }),
  item({ id: 'surgical', name: 'Surgical Kit', category: 'Asboblar', pack: 'Implant jarrohlik seti', sku: 'INS-100', qty: 1, min: 2, expiry: '', supplier: 'Osstem', status: 'kam', image: photo('/images/market/p11.jpg'), price: 4800000, unit: 'to‘plam' }),
  item({ id: 'naocl', name: 'NaOCl 5.25%', category: 'Endodontiya', pack: '100 ml', sku: 'END-005', qty: 25, min: 10, expiry: '10.05.2027', supplier: 'Cerkamed', status: 'mavjud', image: photo('/images/market/p3.jpg'), price: 38000, unit: 'flakon' }),
  item({ id: 'gloves', name: 'Steril qo‘lqop', category: 'Sarf materiallar', pack: 'M (100 dona)', sku: 'DISP-002', qty: 120, min: 50, expiry: '18.10.2028', supplier: 'Unigloves', status: 'mavjud', image: photo('/images/market/p8.jpg'), price: 62000, unit: 'quti' }),
  item({ id: 'mask', name: 'Maska 3 qatlamli', category: 'Sarf materiallar', pack: '50 dona', sku: 'DISP-003', qty: 40, min: 50, expiry: '22.11.2026', supplier: 'Euronda', status: 'kam', image: photo('/images/market/p10.jpg'), price: 18000, unit: 'quti' }),
  item({ id: 'xhlor', name: 'Xlorgeksidin 0.12%', category: 'Dezinfeksiya', pack: '250 ml', sku: 'DIS-010', qty: 6, min: 10, expiry: '05.01.2026', supplier: 'Septodont', status: 'tugash', image: photo('/images/market/p4.jpg'), price: 42000, unit: 'flakon' }),
  item({ id: 'polish', name: 'Polishing Pasta', category: 'Profilaktika', pack: 'Prophy pasta 100g', sku: 'PRF-001', qty: 35, min: 20, expiry: '14.09.2027', supplier: 'Ivoclar', status: 'mavjud', image: photo('/images/market/p1.jpg'), price: 96000 }),
]

const NAMES = ['Bonding Universal', 'Matritsa tizimi', 'Retraksion ip', 'Alginal massa', 'A-silikon', 'Steril salfetka', 'Igna karpulyar', 'Frezlar to‘plami', 'Kanal yuvish shpritsi', 'Vaqtinchalik sement']
const PACKS = ['5 ml', '50 dona', 'quti', '500 g', '10 dona', '100 ml']

function filler(i) {
  const qty = 8 + (i % 40)
  const min = 5 + (i % 15)
  const low = i % 17 === 0
  return item({
    id: `om-${i}`,
    name: `${NAMES[i % NAMES.length]} ${i + 1}`,
    category: CATEGORIES[i % CATEGORIES.length],
    pack: PACKS[i % PACKS.length],
    sku: `OM-${String(200 + i).padStart(4, '0')}`,
    qty: low ? Math.max(1, min - 2) : qty,
    min,
    expiry: `${String((i % 27) + 1).padStart(2, '0')}.${String((i % 12) + 1).padStart(2, '0')}.2027`,
    supplier: SUPPLIERS[i % SUPPLIERS.length],
    status: low ? 'kam' : 'mavjud',
    image: `/images/market/p${(i % 12) + 1}.jpg`,
    price: 20000 + (i % 20) * 15000,
    unit: UNITS[i % UNITS.length],
  })
}

function seed() {
  return [...designed, ...Array.from({ length: 238 }, (_, i) => filler(i))]
}

let rows = seed()
const listeners = new Set()
const emit = () => {
  listeners.forEach((fn) => fn())
  touchBlob('stock')
}
bindBlob('stock', {
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
