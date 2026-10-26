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
let state = { loading: true, error: '', products: [], orders: [], reviews: [], payouts: [], customers: [], loadedFor: null }
const listeners = new Set()
const commit = (patch) => { state = { ...state, ...patch }; listeners.forEach((l) => l()) }
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }

export async function reloadSeller() {
  const me = uid()
  if (!supabase || !me) { commit({ loading: false, error: 'Avval kiring' }); return }
  commit({ loading: state.loadedFor !== me, error: '' })
  const [p, o, r, w, c] = await Promise.all([
    supabase.from('seller_products').select('*').eq('seller_id', me).order('created_at', { ascending: false }),
    supabase.from('seller_orders').select('*, seller_order_items(*)').eq('seller_id', me).order('created_at', { ascending: false }),
    supabase.from('seller_reviews').select('*').eq('seller_id', me).order('created_at', { ascending: false }).limit(20),
    supabase.from('seller_payouts').select('*').eq('seller_id', me).order('created_at', { ascending: false }),
    supabase.from('seller_customers').select('*').eq('seller_id', me),
  ])
  const error = fail(p.error || o.error || r.error || w.error || c.error)
  commit({
    loading: false,
    error: error || '',
    loadedFor: me,
    products: p.data || [],
    orders: (o.data || []).map((x) => ({ ...x, items: x.seller_order_items || [] })),
    reviews: r.data || [],
    payouts: w.data || [],
    customers: c.data || [],
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
const payoutOf = (o) => Number(o.payout ?? Math.round(Number(o.subtotal || 0) * (1 - COMMISSION_RATE)))

export function computeStats({ orders, products, payouts, customers }, now = new Date()) {
  const live = orders.filter((o) => o.status !== 'bekor_qilindi')
  const delivered = orders.filter((o) => o.status === 'yetkazildi')
  const earned = delivered.reduce((s, o) => s + payoutOf(o), 0)
  const withdrawn = payouts.filter((p) => p.status !== 'rad_etildi').reduce((s, p) => s + Number(p.amount || 0), 0)
  const phones = new Set()
  orders.forEach((o) => { const k = (o.customer_phone || o.buyer_id || o.customer_name || '').trim(); if (k) phones.add(k) })
  customers.forEach((c) => { const k = (c.phone || c.name || '').trim(); if (k) phones.add(k) })
  return {
    today: orders.filter((o) => sameDay(new Date(o.created_at), now)).length,
    fresh: orders.filter((o) => o.status === 'yangi').length,
    balance: Math.max(0, earned - withdrawn),
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
  return { sum, count: inRange.length, avg: inRange.length ? Math.round(sum / inRange.length) : 0, commission: Math.round(sum * COMMISSION_RATE) }
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

export async function becomeSeller(shopName) {
  const me = uid()
  if (!supabase || !me) return { ok: false, error: 'Avval kiring' }
  const patch = { role: 'seller', updated_at: new Date().toISOString() }
  if (shopName) patch.shop_name = shopName
  const { error } = await supabase.from('profiles').update(patch).eq('id', me)
  if (error) return { ok: false, error: fail(error) }
  await refreshSession()
  return { ok: true }
}

export function useAsync() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const go = useCallback(async (fn) => {
    setBusy(true); setError('')
    const res = await fn()
    setBusy(false)
    if (!res?.ok) setError(res?.error || 'Xatolik yuz berdi')
    return res
  }, [])
  return { busy, error, setError, go }
}
