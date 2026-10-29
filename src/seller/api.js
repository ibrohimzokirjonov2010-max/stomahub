import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { supabase, friendlySupabaseError } from '../supabaseClient'
import { getSession, refreshSession } from '../sessionStore'

export const COMMISSION_RATE = 0.12

export const STATUS = {
  yangi: { label: 'Yangi', next: 'tasdiqlandi', action: 'Tasdiqlash' },
  tasdiqlandi: { label: 'Tasdiqlandi', next: 'tayyorlanmoqda', action: 'Tayyorlashni boshlash' },
  tayyorlanmoqda: { label: 'Tayyorlanmoqda', next: 'yetkazilmoqda', action: 'Yetkazishga topshirish' },
  yetkazilmoqda: { label: 'Yetkazilmoqda', next: 'yetkazildi', action: 'Yetkazildi deb belgilash' },
  yetkazildi: { label: 'Yetkazildi', next: null },
  bekor_qilindi: { label: 'Bekor qilindi', next: null },
}
export const OPEN_STATUSES = ['yangi', 'tasdiqlandi', 'tayyorlanmoqda', 'yetkazilmoqda']

const uid = () => getSession().user?.id

function fail(error) {
  if (!error) return null
  const msg = friendlySupabaseError(error)
  return /0001_init/.test(msg) ? 'Ma’lumotlar bazasi hali tayyor emas. Supabase’da supabase/migrations/0003_seller.sql faylini ishga tushiring.' : msg
}

// ---- tiny shared store so every widget reloads after a change ----------------
let state = { loading: true, error: '', products: [], orders: [], reviews: [], payouts: [], customers: [], discounts: [], campaigns: [], adTopups: [], adStats: [], settings: null, staff: [], branches: [], activity: [], loadedFor: null }
const listeners = new Set()
const commit = (patch) => { state = { ...state, ...patch }; listeners.forEach((l) => l()) }
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }

export async function reloadSeller() {
  const me = uid()
  if (!supabase || !me) { commit({ loading: false, error: 'Avval kiring' }); return }
  commit({ loading: state.loadedFor !== me, error: '' })
  const q = (t, order = 'created_at') => supabase.from(t).select('*').eq('seller_id', me).order(order, { ascending: false })
  const [p, o, r, w, c, d, k, at, as, st, sf, br, ac] = await Promise.all([
    q('seller_products'),
    supabase.from('seller_orders').select('*, seller_order_items(*)').eq('seller_id', me).order('created_at', { ascending: false }),
    q('seller_reviews'), q('seller_payouts'), q('seller_customers'), q('seller_discounts'), q('seller_campaigns'),
    q('seller_ad_topups'), q('seller_ad_stats', 'day'),
    supabase.from('seller_settings').select('*').eq('seller_id', me).maybeSingle(),
    q('seller_staff'), q('seller_branches'),
    supabase.from('seller_activity').select('*').eq('seller_id', me).order('created_at', { ascending: false }).limit(200),
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
    adStats: as.data || [],
    settings: st.data || null,
    staff: sf.data || [],
    branches: br.data || [],
    activity: ac.data || [],
  })
}

export function useSellerData() {
  const s = useSyncExternalStore(subscribe, () => state)
  const me = uid()
  useEffect(() => { if (me && s.loadedFor !== me) reloadSeller() }, [me, s.loadedFor])
  return s
}

// ---- derived numbers -------------------------------------------------------------
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
export const netOf = (o) => Math.max(0, Number(o.subtotal || 0) - Number(o.discount_amount || 0))
// 12% komissiya faqat yetkazilgan (Yetkazildi) buyurtmalardan olinadi; qolganlari — Kutilmoqda.
export const isDelivered = (o) => o?.status === 'yetkazildi'
export const commissionText = (o, fmt) => (isDelivered(o) ? fmt(commissionOf(o)) : 'Kutilmoqda')
export const commissionOf = (o) => Number(o.commission ?? Math.round(netOf(o) * COMMISSION_RATE))
export const payoutOf = (o) => Number(o.payout ?? (netOf(o) - Math.round(netOf(o) * COMMISSION_RATE) + Number(o.delivery_fee || 0)))

export function computeStats({ orders, products, payouts, customers, adTopups = [] }, now = new Date()) {
  const live = orders.filter((o) => o.status !== 'bekor_qilindi')
  const delivered = orders.filter((o) => o.status === 'yetkazildi')
  const earned = delivered.reduce((s, o) => s + payoutOf(o), 0)
  const withdrawn = payouts.filter((p) => p.status !== 'rad_etildi').reduce((s, p) => s + Number(p.amount || 0), 0) + adTopups.reduce((s, t) => s + Number(t.amount || 0), 0)
  const phones = new Set()
  orders.forEach((o) => { const k = (o.customer_phone || o.buyer_id || o.customer_name || '').trim(); if (k) phones.add(k) })
  customers.forEach((c) => { const k = (c.phone || c.name || '').trim(); if (k) phones.add(k) })
  return {
    today: orders.filter((o) => sameDay(new Date(o.created_at), now)).length,
    fresh: orders.filter((o) => o.status === 'yangi').length,
    balance: Math.max(0, earned - withdrawn),
    earned,
    withdrawnPayouts: payouts.filter((p) => p.status === 'tolandi').reduce((s, p) => s + Number(p.amount || 0), 0),
    pending: orders.filter((o) => OPEN_STATUSES.includes(o.status)).reduce((s, o) => s + payoutOf(o), 0),
    activeProducts: products.filter((p) => p.status === 'active').length,
    customers: phones.size,
    totalOrders: orders.length,
    revenue: delivered.reduce((s, o) => s + Number(o.subtotal || 0), 0),
    liveCount: live.length,
  }
}

export function monthStats(orders, month /* Date or null = all */) {
  const inRange = orders.filter((o) => o.status !== 'bekor_qilindi' && (!month || (new Date(o.created_at).getMonth() === month.getMonth() && new Date(o.created_at).getFullYear() === month.getFullYear())))
  const sum = inRange.reduce((s, o) => s + Number(o.subtotal || 0), 0)
  return { sum, count: inRange.length, avg: inRange.length ? Math.round(sum / inRange.length) : 0, commission: inRange.filter(isDelivered).reduce((s, o) => s + commissionOf(o), 0) }
}

export function popularProducts(orders, products, limit = 4) {
  const sold = new Map()
  orders.filter((o) => o.status !== 'bekor_qilindi').forEach((o) => o.items.forEach((it) => {
    const k = it.product_id || it.name
    sold.set(k, (sold.get(k) || 0) + Number(it.qty || 0))
  }))
  return products
    .map((p) => ({ ...p, sold: sold.get(p.id) || 0 }))
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

export const addCampaign = (v) => run(supabase.from('seller_campaigns').insert({ seller_id: uid(), title: v.title.trim(), product_id: v.product_id || null, daily_budget: Number(v.daily_budget) || 0, days: Number(v.days) || 7 }))

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
