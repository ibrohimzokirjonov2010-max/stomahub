import { profileStore } from './profileStore'
import { useSyncExternalStore } from 'react'
import { bindBlob, touchBlob } from './recordSync'

const photo = (name) => `/images/bemorlar/${name}.jpg`

export const som = (n) => `${Number(n || 0).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m`

export const METHODS = [
  { id: 'Naqd', label: 'Naqd', bg: '#fff4cc', color: '#92600a', dot: '#f0b429', soft: '#fff8e6' },
  { id: 'Karta', label: 'Karta', bg: '#e5f7f1', color: '#0f766e', dot: '#2fbf9b', soft: '#eefbf6' },
  { id: 'Click', label: 'Click', bg: '#f1e8ff', color: '#6b3fa0', dot: '#7b68b8', soft: '#f7f1ff' },
  { id: 'Payme', label: 'Payme', bg: '#e7eeff', color: '#2546b8', dot: '#3d74d6', soft: '#f3f6ff' },
  { id: 'Otkazma', label: 'O‘tkazma', bg: '#eef2f6', color: '#334155', dot: '#64748b', soft: '#f4f7fa' },
]

export const methodOf = (id) => METHODS.find((m) => m.id === id) || METHODS[0]

export const STATUSES = {
  Tolandi: { label: 'To‘landi', bg: '#e5f7ea', color: '#17803d' },
  Qisman: { label: 'Qisman', bg: '#fff1df', color: '#c2410c' },
  Qaytarilgan: { label: 'Qaytarilgan', bg: '#fde8e8', color: '#dc2626' },
}

export const seedPayments = []

export const DAILY = []
export const WEEKLY = []
export const MONTHLY = []

export function planFor(patient) {
  if (!patient) return { name: 'Davolash rejasi', date: '14.10.2024', plan: 0, paid: 0 }
  if (patient.id === 'malika-karimova') {
    return { name: 'Implant va protez rejasi', date: '14.10.2024', plan: 9050000, paid: 8000000 }
  }
  const plan = patient.total || 2500000
  const paid = Math.min(patient.paid || 0, plan)
  return { name: 'Davolash rejasi', date: patient.last || '01.10.2026', plan, paid }
}

const DEMO_PAYMENTS = []
let paymentRows = []
const paymentListeners = new Set()
function emitPayments() {
  paymentListeners.forEach((fn) => fn())
  touchBlob('clinic_payments')
}
bindBlob('clinic_payments', {
  seed: [],
  get: () => paymentRows,
  empty: () => [],
  set: (next) => {
    paymentRows = Array.isArray(next) ? next : paymentRows
    paymentListeners.forEach((fn) => fn())
  },
})

export function useClinicPayments() {
  return useSyncExternalStore((fn) => {
    paymentListeners.add(fn)
    return () => paymentListeners.delete(fn)
  }, () => paymentRows)
}

export function replaceClinicPayments(next) {
  paymentRows = typeof next === 'function' ? next(paymentRows) : next
  emitPayments()
}

export function addClinicPayment(row) {
  paymentRows = [row, ...paymentRows]
  emitPayments()
}

export function patchClinicPayment(id, patch) {
  paymentRows = paymentRows.map((row) => (row.id === id ? { ...row, ...patch } : row))
  emitPayments()
}

export function nextClinicReceipt() {
  const n = paymentRows.reduce((max, row) => Math.max(max, Number(String(row.receipt || '').replace(/\D/g, '')) || 0), 0) + 1
  return `TL-${String(n).padStart(5, '0')}`
}

export function detailOf(row) {
  if (row.detail) return { ...row.detail, total: row.detail.total }
  const debt = row.status === 'Qisman' ? Math.round(row.amount * 0.35) : 0
  const me = profileStore.get?.() || {}
  const doctorName = me.name || ''
  const doctorRole = me.role || ''
  return {
    total: row.amount,
    doctor: doctorName,
    doctorRole,
    doctorPhoto: me.avatar || '',
    chair: '',
    lines: [{ name: row.service, tooth: '—', price: row.amount, sum: row.amount }],
    discount: 0,
    debt,
    planId: '',
    planName: row.service,
    note: row.note || '',
    history: [
      { title: 'To‘lov yaratildi', meta: `${row.date}, ${row.time}`, by: doctorName || 'Admin' },
      ...(row.status === 'Tolandi'
        ? [{ title: 'To‘lov muvaffaqiyatli qabul qilindi', meta: `${row.date}, ${row.time}`, by: `${methodOf(row.method).label} orqali` }]
        : []),
    ],
  }
}
