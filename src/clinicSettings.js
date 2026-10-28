// Umumiy klinika sozlamalari (ish vaqti, tushlik, dam olish kunlari, kreslolar, xodimlar).
// Manba: customer_clinic (asosiy maydonlar) + user_blobs 'clinic_board'.settings (tushlik, dam olish, xodimlar).
import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { loadBlob, onAccount } from './recordSync'
import { tashkentToday } from './tashkentDate'

export const DEFAULT_CLINIC = {
  open: '09:00', close: '18:00', chair_count: 0, lunch_start: '13:00', lunch_end: '14:00', lunch: true, days_off: [6], staff: [],
}
export const STAFF_ROLES = ['Shifokor', 'Assistent', 'Administrator', 'Gigiyenist', 'Texnik']

let state = { ...DEFAULT_CLINIC }
let loaded = false
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())

export function setClinicSettings(next) {
  state = { ...DEFAULT_CLINIC, ...state, ...next }
  loaded = true
  emit()
}

onAccount(async (uid) => {
  if (!uid || !supabase) { state = { ...DEFAULT_CLINIC }; loaded = !uid; emit(); return }
  const [clinic, board] = await Promise.all([
    supabase.from('customer_clinic').select('*').eq('user_id', uid).maybeSingle().then((r) => r.data).catch(() => null),
    loadBlob('clinic_board'),
  ])
  const s = board?.settings || {}
  const hours = String(clinic?.hours || '').match(/(\d{1,2}:\d{2})\s*[–\-—]\s*(\d{1,2}:\d{2})/)
  state = {
    ...DEFAULT_CLINIC,
    ...s,
    open: clinic?.open_time || hours?.[1] || s.open || DEFAULT_CLINIC.open,
    close: clinic?.close_time || hours?.[2] || s.close || DEFAULT_CLINIC.close,
    chair_count: Number(clinic?.chair_count ?? s.chair_count) || 0,
  }
  loaded = true
  emit()
})

export function useClinicSettings() {
  return useSyncExternalStore((fn) => { listeners.add(fn); return () => listeners.delete(fn) }, () => state)
}
export const clinicLoaded = () => loaded

export const toMin = (hhmm) => { const [h, m] = String(hhmm || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0) }
export const toHHMM = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
/** 0=Dushanba … 6=Yakshanba */
export const weekdayOf = (iso) => (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7

export function chairNames(settings) {
  const n = Math.max(0, Math.min(12, Number(settings?.chair_count) || 0))
  return Array.from({ length: n }, (_, i) => `Kreslo ${i + 1}`)
}

function tashkentMinutesNow() {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())
  return toMin(p)
}

/**
 * Bo‘sh slotlar: ish vaqti ichida, tushlikdan tashqari, dam olish kunida emas, bugun o‘tgan vaqt emas,
 * band slotlar bilan kesishmaydi. busy: [{start:'10:00', dur:30}]
 */
export function freeSlots(settings, iso, { dur = 30, step = 30, busy = [] } = {}) {
  if (!iso) return []
  if ((settings.days_off || []).includes(weekdayOf(iso))) return []
  const today = tashkentToday()
  if (iso < today) return []
  const open = toMin(settings.open), close = toMin(settings.close)
  const ls = settings.lunch ? toMin(settings.lunch_start) : -1, le = settings.lunch ? toMin(settings.lunch_end) : -1
  const nowMin = iso === today ? tashkentMinutesNow() : -1
  const out = []
  for (let t = open; t + dur <= close; t += step) {
    if (t <= nowMin) continue
    if (settings.lunch && t < le && t + dur > ls) continue
    if (busy.some((b) => { const s = toMin(b.start); return t < s + (Number(b.dur) || 30) && t + dur > s })) continue
    out.push(toHHMM(t))
  }
  return out
}

export const dayOffReason = (settings, iso) => ((settings.days_off || []).includes(weekdayOf(iso)) ? 'Bu kun — klinikada dam olish kuni.' : '')
