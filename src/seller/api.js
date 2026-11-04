import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { supabase, friendlySupabaseError } from '../supabaseClient'
import { getSession, refreshSession } from '../sessionStore'

import { COMMISSION_RATE, netOf, isDelivered, isCancelled, commissionOf, payoutOf, isCash, realOrders, metrics, commissionDebt, tkDay, tkToday, ALL, monthRange, OPEN, addDays } from './lib/metrics'
export { COMMISSION_RATE, netOf, isDelivered, isCancelled, commissionOf, payoutOf, isCash }

export const STATUS = {
  yangi: { label: 'Yangi', next: 'tasdiqlandi', action: 'Tasdiqlash' },
  tasdiqlandi: { label: 'Tasdiqlangan', next: 'tayyorlanmoqda', action: 'Tayyorlashni boshlash' },
  tayyorlanmoqda: { label: 'Tayyorlanmoqda', next: 'yetkazilmoqda', action: 'Yetkazishga topshirish' },
  yetkazilmoqda: { label: 'Yetkazilmoqda', next: 'yetkazildi', action: 'Yetkazildi deb belgilash' },
  yetkazildi: { label: 'Yetkazildi', next: null },
  bekor_qilindi: { label: 'Bekor qilindi', next: null },
}
export const OPEN_STATUSES = OPEN

const uid = () => getSession().user?.id

function fail(error) {
  if (!error) return null
  const msg = friendlySupabaseError(error)
  return /0001_init/.test(msg) ? 'Ma’lumotlar bazasi hali tayyor emas. Supabase’da supabase/migrations/0003_seller.sql faylini ishga tushiring.' : msg
}

// ---- tiny shared store so every widget reloads after a change ----------------
let state = { loading: true, error: '', products: [], orders: [], reviews: [], payouts: [], customers: [], discounts: [], campaigns: [], adTopups: [], adRequests: [], adStats: [], settings: null, staff: [], branches: [], activity: [], loadedFor: null }
const listeners = new Set()
const commit = (patch) => { state = { ...state, ...patch }; listeners.forEach((l) => l()) }
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }

export async function reloadSeller() {
  const me = uid()
  if (!supabase || !me) { commit({ loading: false, error: 'Avval kiring' }); return }
  commit({ loading: state.loadedFor !== me, error: '' })
  const q = (t, order = 'created_at') => supabase.from(t).select('*').eq('seller_id', me).order(order, { ascending: false })
  const [p, o, r, w, c, d, k, at, as, st, sf, br, ac, ar, lg, wl] = await Promise.all([
    q('seller_products'),
    supabase.from('seller_orders').select('*, seller_order_items(*)').eq('seller_id', me).order('created_at', { ascending: false }),
    q('seller_reviews'), q('seller_payouts'), q('seller_customers'), q('seller_discounts'), q('seller_campaigns'),
    q('seller_ad_topups'), q('seller_ad_stats', 'day'),
    supabase.from('seller_settings').select('*').eq('seller_id', me).maybeSingle(),
    q('seller_staff'), q('seller_branches'),
    supabase.from('seller_activity').select('*').eq('seller_id', me).order('created_at', { ascending: false }).limit(200),
    q('seller_ad_topup_requests'),
    q('seller_payout_ledger', 'released_at'),
    supabase.rpc('seller_wallet'),
  ])
  // 0004 jadvallari hali yo'q bo'lsa ham asosiy ma'lumotlar ishlayversin
  const error = fail(p.error || o.error || r.error || w.error || c.error)
  const extraErr = [d, k, at, as, st, sf, br, ac].find((x) => x.error)
  commit({
    loading: false,
    error: error || '',
    needs0004: !!extraErr,
    loadedFor: me,
    products: p.data || [],
    orders: (o.data || []).map((x) => ({ ...x, items: x.seller_order_items || [] })),
    reviews: r.data || [],
    payouts: w.data || [],
    customers: c.data || [],
    discounts: d.data || [],
    campaigns: k.data || [],
    adTopups: at.data || [],
    adRequests: ar.data || [],
    adStats: as.data || [],
    settings: st.data || null,
    staff: sf.data || [],
    branches: br.data || [],
    activity: ac.data || [],
    // 0042 escrow: haqiqiy hamyon (bo‘lmasa eski hisob-kitob)
    ledger: lg.error ? [] : lg.data || [],
    wallet: wl.error ? null : wl.data || null,
  })
}

export function useSellerData() {
  const s = useSyncExternalStore(subscribe, () => state)
  const me = uid()
  useEffect(() => { if (me && s.loadedFor !== me) reloadSeller() }, [me, s.loadedFor])
  return s
}

// ---- derived numbers (yagona qoidalar: ./lib/metrics.js) ---------------------------------
export const commissionText = (o, fmt) => (isCancelled(o) ? fmt(0) : isDelivered(o) ? fmt(commissionOf(o)) : 'Kutilmoqda')

export function computeStats({ orders, products, payouts, customers, adTopups = [], wallet = null }, now = new Date()) {
  const real = realOrders(orders)
  const all = metrics(orders, ALL)
  const earned = all.delivered.filter((o) => !isCash(o)).reduce((s, o) => s + payoutOf(o), 0)
  const withdrawn = payouts.filter((p) => p.status !== 'rad_etildi').reduce((s, p) => s + Number(p.amount || 0), 0) + adTopups.reduce((s, t) => s + Number(t.amount || 0), 0)
  const phones = new Set()
  real.forEach((o) => { const k = (o.customer_phone || o.buyer_id || o.customer_name || '').trim(); if (k) phones.add(k) })
  customers.forEach((c) => { const k = (c.phone || c.name || '').trim(); if (k) phones.add(k) })
  const today = tkToday(now)
  return {
    today: real.filter((o) => tkDay(o.created_at) === today).length,
    fresh: real.filter((o) => o.status === 'yangi').length,
    // 0042 escrow: wallet (RPC) bo‘lsa haqiqiy balans/held/to‘lovlar; aks holda eski hisob
    balance: wallet ? Number(wallet.available || 0) : Math.max(0, earned - withdrawn),
    earned: wallet ? Number(wallet.earned || 0) : earned,
    held: wallet ? Number(wallet.held || 0) : 0,
    paidOut: wallet ? Number(wallet.paid_out || 0) : payouts.filter((p) => p.status === 'tolandi').reduce((s, p) => s + Number(p.amount || 0), 0),
    requested: wallet ? Number(wallet.requested || 0) : payouts.filter((p) => p.status === 'kutilmoqda').reduce((s, p) => s + Number(p.amount || 0), 0),
    disputes: wallet ? Number(wallet.disputes || 0) : 0,
    live: !!wallet,
    withdrawnPayouts: payouts.filter((p) => p.status === 'tolandi').reduce((s, p) => s + Number(p.amount || 0), 0),
    commissionOwed: wallet ? Number(wallet.commission_owed || 0) : commissionDebt(orders),
    commissionTotal: all.commission,
    cashPending: all.open.filter(isCash).length,
    pending: all.open.filter((o) => !isCash(o)).reduce((s, o) => s + payoutOf(o), 0),
    openCount: all.openCount,
    // Escrowda faqat onlayn (Click/Payme) va to‘langan buyurtmalar; naqd buyurtmalar kirmaydi
    heldCount: real.filter((o) => !isCash(o) && ['held', 'paid'].includes(o.payment_status)).length,
    openSum: all.openSum,
    activeProducts: products.filter((p) => p.status === 'active').length,
    customers: phones.size,
    totalOrders: real.length,
    deliveredCount: all.count,
    revenue: all.revenue,
    liveCount: real.filter((o) => !isCancelled(o)).length,
  }
}

/** month: Date (oyning istalgan kuni) yoki null = barcha vaqt */
// Bosh sahifa davr filtri — bitta tanlov (standart: oxirgi 30 kun)
export const PERIODS = [['7', 'Oxirgi 7 kun'], ['30', 'Oxirgi 30 kun'], ['month', 'Bu oy'], ['all', 'Barcha davr']]
export function periodRange(key, today = tkToday()) {
  if (key === '7') return { from: addDays(today, -6), to: today }
  if (key === '30') return { from: addDays(today, -29), to: today }
  if (key === 'month') return monthRange(today.slice(0, 7))
  return ALL
}
export function periodStats(orders, key) {
  const m = metrics(orders, periodRange(key))
  return { sum: m.revenue, count: m.count, avg: m.avg, commission: m.commission, openCount: m.openCount, openSum: m.openSum }
}

export function monthStats(orders, month) {
  const r = month ? monthRange(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`) : ALL
  const m = metrics(orders, r)
  return { sum: m.revenue, count: m.count, avg: m.avg, commission: m.commission, openCount: m.openCount, openSum: m.openSum }
}

export function popularProducts(orders, products, limit = 4) {
  const sold = new Map()
  const inOrders = new Map()
  realOrders(orders).filter((o) => !isCancelled(o)).forEach((o) => (o.items || []).forEach((it) => {
    const p = products.find((x) => x.id === it.product_id || (!it.product_id && x.name === it.name)); if (!p) return; const k = p.id
    sold.set(k, (sold.get(k) || 0) + Number(it.qty || 0))
    if (!inOrders.has(k)) inOrders.set(k, new Set())
    inOrders.get(k).add(o.id)
  }))
  return products
    .map((p) => ({ ...p, sold: sold.get(p.id) || 0, orderCount: inOrders.get(p.id)?.size || 0 }))
    .filter((p) => p.sold > 0)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, limit)
}

// ---- mutations ---------------------------------------------------------------------
async function run(promise) {
  const { data, error } = await promise
  if (error) return { ok: false, error: fail(error) }
  await reloadSeller()
  return { ok: true, data }
}

export const setOrderStatus = (id, status, reason = '') =>
  run(supabase.from('seller_orders').update(status === 'bekor_qilindi' ? { status, cancel_reason: reason } : { status }).eq('id', id).eq('seller_id', uid()).select().single())

export const setTrackingUrl = (id, url) =>
  run(supabase.rpc('seller_set_tracking_url', { p_order: id, p_url: url || '' }))

export const addProduct = (v) => run(supabase.from('seller_products').insert({
  seller_id: uid(), name: v.name.trim(), sku: v.sku || '', category: v.category || '', price: Number(v.price) || 0, stock: Number(v.stock) || 0, image_url: v.image_url || '',
}).select().single())

export const updateProductStock = (id, stock) => run(supabase.from('seller_products').update({ stock: Number(stock) || 0, updated_at: new Date().toISOString() }).eq('id', id).eq('seller_id', uid()))

export const addCustomer = (v) => run(supabase.from('seller_customers').insert({ seller_id: uid(), name: v.name.trim(), phone: v.phone || '', city: v.city || '', note: v.note || '' }))

export const addDiscount = (v) => run(supabase.from('seller_discounts').insert({ seller_id: uid(), title: v.title.trim(), percent: Number(v.percent), product_id: v.product_id || null, ends_on: v.ends_on || null }))

// ---- Reklama: to‘ldirish so‘rovi (naqd / bank o‘tkazma) — admin tasdiqlaydi -----------
// Yangi so‘rovlar hamyondan hech narsa ayirmaydi (alohida jadval). Eski seller_ad_topups
// (hamyondan o‘tkazmalar) tarix sifatida hisobda qoladi.
export const requestAdTopup = (v) => run(supabase.rpc('seller_ad_topup_request', { p_amount: Number(v.amount), p_method: v.method, p_receipt_url: v.receipt_url || '', p_note: v.note || '' }))
export const cancelAdTopup = (id) => run(supabase.rpc('seller_ad_topup_cancel', { p_id: id }))
// Kelajakdagi Click to‘lovi uchun (hozircha o‘chiq): VITE_ADS_CLICK_TOPUP=1 bo‘lsagina UI’da ko‘rinadi.
export const CLICK_TOPUP_ENABLED = import.meta.env.VITE_ADS_CLICK_TOPUP === '1'
export async function startClickTopup() { return { ok: false, error: 'Click orqali to‘ldirish tez orada ishga tushadi' } }

export const requestPayout = (v) => run(supabase.from('seller_payouts').insert({ seller_id: uid(), amount: Number(v.amount), note: v.note || '' }))

export const addManualOrder = (v) => run(supabase.rpc('seller_create_manual_order', {
  payload: { customer_name: v.customer_name, customer_phone: v.customer_phone, address: v.address, note: v.note, items: [{ product_id: v.product_id, qty: Number(v.qty) || 1 }] },
}))

// Sotuvchi bo'lish = ariza (seller_status = 'pending'). Kabinet faqat admin tasdiqlagach ochiladi.
export async function becomeSeller(shopName) {
  const me = uid()
  if (!supabase || !me) return { ok: false, error: 'Avval kiring' }
  let { error } = await supabase.rpc('request_seller_role', { p_shop_name: shopName || '' })
  if (error && /function|schema cache|not find/i.test(error.message || '')) {
    const patch = { role: 'seller', seller_status: 'pending', updated_at: new Date().toISOString() }
    if (shopName) patch.shop_name = shopName
    ;({ error } = await supabase.from('profiles').update(patch).eq('id', me))
  }
  if (error) return { ok: false, error: fail(error) }
  await refreshSession()
  return { ok: true }
}

export function useAsync() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const go = useCallback(async (fn, onOk) => {
    setBusy(true); setError('')
    const res = await fn()
    setBusy(false)
    if (!res?.ok) setError(res?.error || 'Xatolik yuz berdi')
    else onOk?.(res)
    return res
  }, [])
  return { busy, error, setError, go }
}

// ---- generic helpers used by sections 02..10 ------------------------------------------
export { uid }
export const insertRow = (table, row) => run(supabase.from(table).insert({ seller_id: uid(), ...row }).select().single())
export const updateRow = (table, id, patch) => run(supabase.from(table).update(patch).eq('id', id).eq('seller_id', uid()).select().single())
export const deleteRow = (table, id) => run(supabase.from(table).delete().eq('id', id).eq('seller_id', uid()))
export const upsertSettings = (patch) => run(supabase.from('seller_settings').upsert({ seller_id: uid(), ...patch, updated_at: new Date().toISOString() }).select().single())
export const createOrder = (payload) => run(supabase.rpc('seller_create_manual_order', { payload }))
export async function logActivity(action, details = '') {
  if (!supabase || !uid()) return
  await supabase.from('seller_activity').insert({ seller_id: uid(), action, details })
}

export async function uploadMedia(file, folder = 'misc') {
  if (!supabase || !uid()) return { ok: false, error: 'Avval kiring' }
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: 'Fayl 10 MB dan katta' }
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
  const path = `${uid()}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('seller-media').upload(path, file, { contentType: file.type, upsert: false })
  if (error) return { ok: false, error: fail(error) }
  const { data } = supabase.storage.from('seller-media').getPublicUrl(path)
  return { ok: true, url: data.publicUrl, name: file.name, size: file.size, type: file.type }
}

export const PRODUCT_STATUS = {
  active: { label: 'Faol', tone: 'on' },
  review: { label: 'Tekshiruvda', tone: 'mid' },
  rejected: { label: 'Rad etilgan', tone: 'off' },
  inactive: { label: 'Faolsiz', tone: 'off' },
  archived: { label: 'Arxiv', tone: 'off' },
  draft: { label: 'Qoralama', tone: 'off' },
}

export function csvDownload(filename, rows) {
  const esc = (v) => { const t = String(v ?? ''); return /[",;\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t }
  const blob = new Blob(['\ufeff' + rows.map((r) => r.map(esc).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

// Remove a seller's own uploaded files (best effort) by public URL.
export async function removeMedia(urls = []) {
  if (!supabase || !uid()) return
  const mark = '/storage/v1/object/public/seller-media/'
  const paths = urls.filter(Boolean).map((u) => { const i = String(u).indexOf(mark); return i < 0 ? null : decodeURIComponent(String(u).slice(i + mark.length).split('?')[0]) }).filter((p) => p && p.startsWith(`${uid()}/`))
  if (paths.length) await supabase.storage.from('seller-media').remove(paths).catch(() => {})
}

/** Yagona “Kam qolgan” chegarasi: 5 dona yoki undan kam. */
export const LOW_STOCK_LIMIT = 5

/** Dev-only: skrinshot uchun soxta sotuvchi ma’lumoti (production bundle’da yo‘q). */
export const __shotSellerState = import.meta.env.DEV ? (patch) => commit({ ...patch, loading: false, error: '', loadedFor: uid() ?? null }) : undefined
