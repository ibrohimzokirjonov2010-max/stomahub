// Qiziqish signallari: kirgan foydalanuvchi uchun serverda (0058 user_interest_events), mehmon uchun faqat brauzerda.
// 0058 hali qo‘llanmagan bo‘lsa — xatosiz mahalliy rejimga o‘tadi (localStorage, chiqishda tozalanadi: stomahub: prefiksi).
import { useMemo, useSyncExternalStore } from 'react'
import { supabase } from '../supabaseClient'
import { onAccount } from '../recordSync'
import { profileStore, useProfile } from '../profileStore'
import { aggregateEvents, fromServer, mergeSignals, emptySignals } from './rank.js'

const GUEST_KEY = 'stomahub:interest:guest'
const userKey = (uid) => `stomahub:interest:${uid}`
const MAX_LOCAL = 300
const DEDUPE_MS = 20000

let st = { uid: '', local: [], session: [], server: null, serverOk: null, version: 0 }
const listeners = new Set()
const bump = () => { st = { ...st, version: st.version + 1 }; listeners.forEach((l) => l()) }

const readKey = (k) => { try { const v = JSON.parse(localStorage.getItem(k) || '[]'); return Array.isArray(v) ? v : [] } catch { return [] } }
const writeKey = (k, list) => { try { if (list.length) localStorage.setItem(k, JSON.stringify(list.slice(-MAX_LOCAL))); else localStorage.removeItem(k) } catch { /* private mode */ } }
const localKey = () => (st.uid ? userKey(st.uid) : GUEST_KEY)

const toRow = (e) => ({
  kind: e.kind,
  product_id: e.productId || null,
  category: e.category ? String(e.category).slice(0, 80) : null,
  query: e.query ? String(e.query).trim().slice(0, 100) : null,
  results_count: Number.isFinite(e.results) ? e.results : null,
})

async function insertRows(rows) {
  if (!supabase || !rows.length) return false
  try {
    const { error } = await supabase.from('user_interest_events').insert(rows)
    if (error) { st.serverOk = false; return false }
    return true
  } catch { st.serverOk = false; return false }
}

const recent = new Map()
/** kind: 'view' | 'cart' | 'search'. Xaridlar server tomonda buyurtmalardan olinadi. */
export function recordInterest(kind, data = {}) {
  if (!['view', 'cart', 'search'].includes(kind)) return
  const query = kind === 'search' ? String(data.query || '').trim().slice(0, 100) : ''
  if (kind === 'search' && query.length < 2) return
  const productId = data.productId ? String(data.productId) : ''
  const dk = `${kind}|${productId}|${data.category || ''}|${query.toLowerCase()}`
  const now = Date.now()
  if (now - (recent.get(dk) || 0) < DEDUPE_MS) return
  recent.set(dk, now)
  const ev = { kind, productId, category: data.category || '', query, results: Number.isFinite(data.results) ? data.results : undefined, at: now }
  if (st.uid && st.serverOk !== false) {
    st = { ...st, session: [...st.session, ev] }
    bump()
    insertRows([toRow(ev)]).then((ok) => {
      if (!ok) {
        // Server tayyor emas (0058 qo‘llanmagan): shu va keyingi hodisalar brauzerda saqlanadi.
        st = { ...st, local: [...st.local, ...st.session], session: [] }
        writeKey(localKey(), st.local)
        bump()
      }
    })
    return
  }
  st = { ...st, local: [...st.local, ev].slice(-MAX_LOCAL) }
  writeKey(localKey(), st.local)
  bump()
}

export async function refreshInterest() {
  if (!st.uid || !supabase) return
  try {
    const { data, error } = await supabase.rpc('my_interest_profile')
    if (error) throw error
    st = { ...st, server: fromServer(data), serverOk: true, session: [] }
    // Server ishlay boshlagan bo‘lsa — oldin mahalliy saqlangan hodisalarni yuboramiz.
    if (st.local.length) {
      const ok = await insertRows(st.local.map(toRow))
      if (ok) { st = { ...st, local: [] }; writeKey(localKey(), []); const r = await supabase.rpc('my_interest_profile'); if (!r.error) st = { ...st, server: fromServer(r.data) } }
    }
  } catch {
    st = { ...st, serverOk: false, server: null }
  }
  bump()
}

async function onUser(uid) {
  const id = uid || ''
  if (id === st.uid && st.version) return
  st = { uid: id, local: readKey(id ? userKey(id) : GUEST_KEY), session: [], server: null, serverOk: null, version: st.version }
  bump()
  if (!id) return
  // Mehmon paytidagi signallar hisobga qo‘shiladi, keyin brauzerdan o‘chiriladi.
  const guest = readKey(GUEST_KEY)
  if (guest.length) {
    st = { ...st, local: [...st.local, ...guest].slice(-MAX_LOCAL) }
    writeKey(userKey(id), st.local)
    writeKey(GUEST_KEY, [])
  }
  await refreshInterest()
}

if (typeof window !== 'undefined') {
  onAccount((uid) => { onUser(uid) })
  window.addEventListener('stomahub-signed-out', () => { st = { uid: '', local: [], session: [], server: null, serverOk: null, version: st.version + 1 }; listeners.forEach((l) => l()) })
}

/** Server ishlamasa: xaridlar profildagi buyurtmalardan (bekor qilinmaganlari). */
function purchasesFromOrders(orders) {
  const out = []
  for (const o of orders || []) {
    if (!o?.live || o.dbStatus === 'bekor_qilindi') continue
    for (const it of o.items || []) if (it?.id) out.push({ productId: String(it.id), at: o.createdAt || 0 })
  }
  return out
}

export function interestSnapshot(orders = profileStore.get()?.orders) {
  const local = aggregateEvents([...st.local, ...st.session], st.serverOk ? [] : purchasesFromOrders(orders))
  return st.server ? mergeSignals(st.server, local) : local
}

const sub = (l) => { listeners.add(l); return () => listeners.delete(l) }
/** { signals, serverOk, uid } — signallar o‘zgarganda qayta hisoblanadi. */
export function useInterest() {
  const s = useSyncExternalStore(sub, () => st)
  const profile = useProfile()
  const orders = profile?.orders
  const signals = useMemo(() => (s.uid || s.local.length ? interestSnapshot(orders) : emptySignals()), [s, orders]) // eslint-disable-line react-hooks/exhaustive-deps
  return { signals, serverOk: s.serverOk, uid: s.uid }
}
