// Ilova bo‘ylab yagona bildirishnomalar manbai: public.customer_notifications.
// - kirgan foydalanuvchi uchun yuklaydi, Supabase Realtime (INSERT) orqali darhol yangilanadi;
// - ilova fokusga qaytganda va har 60 soniyada (ko‘rinib turganda) qayta yuklaydi — Realtime
//   ulanmagan bo‘lsa ham bildirishnoma yo‘qolmaydi;
// - yangi bildirishnoma kelganda toast tinglovchilariga xabar beradi.
import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { fetchNotifications, markNotificationsRead } from './buyerApi'
import { profileStore } from './profileStore'
import { freshUnread, markLocalRead, mergeNotification } from './lib/notifyModel'

let state = { uid: null, items: [], loaded: false, live: false }
const listeners = new Set()
const toastListeners = new Set()
let channel = null
let timer = null
let detach = null

function commit(patch) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

function announce(rows) {
  const list = rows.filter(Boolean)
  if (!list.length) return
  toastListeners.forEach((l) => l(list[0], list.length))
  if (list.some((n) => n.kind === 'order')) {
    // Buyurtmalar ro‘yxati/kuzatish sahifasi yangi holatni ko‘rsatsin
    Promise.resolve(profileStore.refreshOrders?.()).catch(() => {})
  }
}

async function reload({ toast = true } = {}) {
  const uid = state.uid
  if (!uid) return
  try {
    const rows = await fetchNotifications()
    if (state.uid !== uid) return
    const fresh = state.loaded && toast ? freshUnread(state.items, rows) : []
    commit({ items: rows, loaded: true })
    announce(fresh)
  } catch {
    /* tarmoq xatosi — keyingi urinishda */
  }
}

function onInsert(payload) {
  const row = payload?.new
  if (!row?.id || row.user_id !== state.uid) return
  const known = state.items.some((n) => n.id === row.id)
  commit({ items: mergeNotification(state.items, row) })
  if (!known) announce([row])
}

export function startNotifications(uid) {
  if (state.uid === uid) return
  stopNotifications()
  if (!uid) return
  commit({ uid, items: [], loaded: false, live: false })
  reload({ toast: false })
  if (supabase) {
    channel = supabase
      .channel(`notifications:${uid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'customer_notifications', filter: `user_id=eq.${uid}` }, onInsert)
      .subscribe((status) => commit({ live: status === 'SUBSCRIBED' }))
  }
  if (typeof window !== 'undefined') {
    const onFocus = () => { if (document.visibilityState !== 'hidden') reload() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    timer = setInterval(() => { if (document.visibilityState === 'visible') reload() }, 60_000)
    detach = () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }
}

export function stopNotifications() {
  if (channel && supabase) supabase.removeChannel(channel)
  channel = null
  if (timer) clearInterval(timer)
  timer = null
  detach?.()
  detach = null
  if (state.uid) commit({ uid: null, items: [], loaded: false, live: false })
}

export async function markRead(ids) {
  const list = (ids || []).filter((id) => state.items.some((n) => n.id === id && !n.read_at))
  if (!list.length) return
  commit({ items: markLocalRead(state.items, list) })
  try { await markNotificationsRead(list) } catch { /* keyingi yuklashda qayta tekshiriladi */ }
}

export function onNewNotification(fn) {
  toastListeners.add(fn)
  return () => toastListeners.delete(fn)
}

export function getNotifications() {
  return state
}

/** Faqat skrinshot/dev uchun: tarmoqsiz holatni o‘rnatadi. */
export function __setNotificationsForDemo(items, uid = 'demo') {
  commit({ uid, items, loaded: true, live: true })
}
export function __setLoadingForDemo(uid = 'demo') {
  commit({ uid, items: [], loaded: false, live: false })
}
export function __announceForDemo(row) {
  commit({ items: mergeNotification(state.items, row) })
  toastListeners.forEach((l) => l(row, 1))
}

export function useNotifications() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, getNotifications)
}
