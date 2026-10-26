import { useSyncExternalStore } from 'react'
import { registerSale } from '../../hubStore'

const KEY = 'stomahub-seminars'
const SEED_SAVED = ['mikroskop-endo', 'aligner']
const listeners = new Set()

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY))
    return { saved: v?.saved || SEED_SAVED, registered: v?.registered || {} }
  } catch {
    return { saved: SEED_SAVED, registered: {} }
  }
}

let state = read()

function write(next) {
  state = next
  localStorage.setItem(KEY, JSON.stringify(next))
  listeners.forEach((l) => l())
}

const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function toggleSaved(id) {
  const on = state.saved.includes(id)
  write({ ...state, saved: on ? state.saved.filter((x) => x !== id) : [...state.saved, id] })
  return !on
}

export function register(id, info) {
  let next = info
  if (info?.name && info.gross != null && !info.synced) {
    const res = registerSale({
      seminarId: id,
      name: info.name,
      phone: info.phone,
      email: info.email,
      clinic: info.clinic,
      city: info.city,
      spec: info.spec,
      ticket: info.ticketName || 'Standart',
      method: info.methodLabel || info.method || 'Click',
      subtotal: Number(info.gross) || 0,
      promoCode: info.promo || '',
      title: info.title,
    })
    if (!res.ok) return res
    const code = res.person?.code || ''
    next = {
      ...info,
      price: res.paid,
      synced: true,
      order: res.payment?.id || info.order,
      code,
      checkin: code ? `STH:${code}|${res.payment?.id || ''}` : '',
    }
  }
  write({ ...state, registered: { ...state.registered, [id]: next } })
  return { ok: true, info: next }
}

export function useSeminarStore() {
  return useSyncExternalStore(subscribe, () => state)
}
