import { useSyncExternalStore } from 'react'
import { registerSale } from '../../hubStore'
import { bindBlob, touchBlob } from '../../recordSync'

const KEY = 'stomahub-seminars'
const SEED_SAVED = []
export const SHOWCASE_SAVED = SEED_SAVED
const listeners = new Set()

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY))
    return { saved: Array.isArray(v?.saved) ? v.saved : [], registered: v?.registered || {} }
  } catch {
    return { saved: [], registered: {} }
  }
}

const DEMO_SEMINARS = { saved: SEED_SAVED, registered: {} }
let state = { saved: [], registered: {} }

function write(next) {
  state = next
  localStorage.setItem(KEY, JSON.stringify(next))
  listeners.forEach((l) => l())
  touchBlob('saved_seminars')
}
bindBlob('saved_seminars', {
  seed: DEMO_SEMINARS,
  get: () => ({ saved: state.saved, registered: state.registered }),
  empty: () => ({ saved: [], registered: {} }),
  set: (payload) => {
    if (!payload) return
    state = {
      saved: Array.isArray(payload.saved) ? payload.saved : [],
      registered: payload.registered && typeof payload.registered === 'object' ? payload.registered : {},
    }
    localStorage.setItem(KEY, JSON.stringify(state))
    listeners.forEach((l) => l())
  },
})

const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function toggleSaved(id) {
  const on = state.saved.includes(id)
  write({ ...state, saved: on ? state.saved.filter((x) => x !== id) : [...state.saved, id] })
  return !on
}

export async function register(id, info) {
  let next = info
  if (info?.name && info.gross != null && !info.synced) {
    const res = await registerSale({
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
      // Pullik chipta mijoz tomonida hech qachon "to‘landi" bo‘lmaydi — tashkilotchi tasdiqlaguncha kutilmoqda.
      pending: res.pending != null ? !!res.pending : Number(res.paid) > 0,
      order: res.payment?.id || info.order,
      personId: res.person?.id,
      code,
      checkin: code ? `STH:${code}|${res.payment?.id || ''}` : '',
    }
  }
  write({ ...state, registered: { ...state.registered, [id]: next } })
  return { ok: true, info: next }
}

if (typeof window !== 'undefined') {
  window.addEventListener('stomahub-registrations', (event) => {
    const rows = Array.isArray(event.detail) ? event.detail : []
    if (!rows.length) return
    const registered = { ...state.registered }
    let changed = false
    rows.forEach((row) => {
      const sid = row.seminar_id || row.seminarId
      if (!sid) return
      const prev = registered[sid] || {}
      registered[sid] = {
        ...prev,
        name: row.name || prev.name,
        phone: row.phone || prev.phone,
        email: row.email || prev.email,
        clinic: row.clinic || prev.clinic,
        city: row.city || prev.city,
        spec: row.role || prev.spec,
        ticketName: row.ticket || prev.ticketName,
        order: prev.order || row.id,
        synced: true,
      }
      changed = true
    })
    if (changed) write({ ...state, registered })
  })
}

export function useSeminarStore() {
  return useSyncExternalStore(subscribe, () => state)
}
