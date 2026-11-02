import { isTestProductRow } from './testData'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { supabase, friendlySupabaseError } from './supabaseClient'
import { marketProducts } from './marketData'
import { normCategory } from './config/productCatalog'

// ---- marketplace feed (active seller products) -------------------------------------
let marketState = { status: 'idle', error: '' }
const marketListeners = new Set()
const emit = () => marketListeners.forEach((l) => l())

const CAT_KEY = {
  'Restavratsion materiallar': 'komp', Implantlar: 'impl', 'Yordamchi materiallar': 'bond', 'Sarflanadigan materiallar': 'gig',
  'Endodontik asboblar': 'endo', Instrumentlar: 'asb', Uskunalar: 'usk', 'Himoya vositalari': 'gig', 'O‘lchov materiallari': 'komp',
  Ortodontiya: 'orto', 'Gigiyena vositalari': 'gig', 'Gigiena vositalari': 'gig', Boshqa: 'asb',
  Implantologiya: 'impl', Sterilizatsiya: 'usk', 'Qolip materiallari': 'komp', 'Qolip (ottisk) materiallari': 'komp', 'Izolyatsiya materiallari': 'komp',
  'Estetik stomatologiya': 'komp', Laboratoriya: 'lab',
}

export const toMarketProduct = (row) => ({
  id: row.id,
  sellerId: row.seller_id,
  seller: row.shop_name || 'Sotuvchi',
  name: row.name,
  type: [row.category, row.unit].filter(Boolean).join(' · ') || row.category || '',
  brand: row.brand || '',
  rx: !!row.rx_only,
  cat: CAT_KEY[normCategory(row.category)] || 'asb',
  category: normCategory(row.category),
  price: Number(row.price) || 0,
  stock: Number(row.stock) || 0,
  image: row.image_url || (Array.isArray(row.images) ? row.images[0] : '') || '/images/market/p1.jpg',
  images: Array.isArray(row.images) ? row.images : [],
  variants: Array.isArray(row.variants) ? row.variants : [],
  documents: Array.isArray(row.documents) ? row.documents : [],
  specs: Array.isArray(row.specs) ? row.specs.filter((x) => Array.isArray(x) && x.length === 2) : [],
  description: row.description || '',
  // 0029: product page tabs + purchase terms + medical device info
  country: row.country || '',
  unit: row.unit || '',
  clinicalUse: row.clinical_use || '',
  deliveryInfo: row.delivery_info || '',
  reorder: row.reorder && typeof row.reorder === 'object' && row.reorder.enabled ? { enabled: true, intervalDays: Number(row.reorder.interval_days) || 30 } : null,
  variantType: row.variant_type || '',
  uom: row.uom || 'dona',
  minQty: Math.max(1, Number(row.min_qty) || 1),
  priceTiers: Array.isArray(row.price_tiers) ? row.price_tiers.filter((t) => Number(t?.min_qty) > 1 && Number(t?.price) > 0) : [],
  regCertNo: row.reg_cert_no || '',
  lotNo: row.lot_no || '',
  storageTemp: row.storage_temp || '',
  expiresOn: row.expires_on || '',
  rating: 0,
  reviews: 0,
  live: true,
})

export async function loadMarketProducts() {
  if (!supabase) {
    marketProducts.splice(0, marketProducts.length)
    marketState = { status: 'error', error: 'Supabase sozlanmagan' }
    emit()
    return
  }
  marketState = { ...marketState, status: 'loading' }
  emit()
  const { data, error } = await supabase.rpc('market_products')
  let rows = data
  let err = error
  if (err) {
    // 0008 not applied yet: fall back to the RLS-protected table
    const res = await supabase.from('seller_products').select('*').eq('status', 'active').order('created_at', { ascending: false })
    rows = res.data
    err = res.error
  }
  if (err) {
    marketState = { status: 'error', error: friendlySupabaseError(err) }
  } else {
    marketProducts.splice(0, marketProducts.length, ...(rows || []).filter((r) => !isTestProductRow(r)).map(toMarketProduct))
    marketState = { status: 'ready', error: '' }
  }
  emit()
}

const subMarket = (l) => { marketListeners.add(l); return () => marketListeners.delete(l) }
export function useMarket() {
  const s = useSyncExternalStore(subMarket, () => marketState)
  useEffect(() => { if (marketState.status === 'idle') loadMarketProducts() }, [])
  return { ...s, products: marketProducts }
}

// ---- checkout -----------------------------------------------------------------------
export const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''))

export async function createOrder({ items, name, phone, city, address, note, pickup, paymentMethod = 'cash', paymentRef = '' }) {
  if (!supabase) throw new Error('Supabase sozlanmagan')
  const bad = items.filter((it) => !isUuid(it.productId || it.id))
  if (bad.length) throw new Error(`Bu mahsulot sotuvda emas: ${bad.map((b) => b.name).join(', ')}. Savatdan olib tashlang.`)
  const pay = String(paymentMethod || 'cash').toLowerCase()
  const allowed = new Set(['cash', 'naqd', 'click', 'payme'])
  if (!allowed.has(pay)) throw new Error('To‘lov usuli qo‘llab-quvvatlanmaydi')
  const { data, error } = await supabase.rpc('buyer_create_order', {
    payload: {
      name, phone, city, address, note: note || '', payment_method: pay === 'naqd' ? 'cash' : pay,
      payment_ref: paymentRef || '',
      delivery_method: pickup ? 'olib_ketish' : 'kuryer',
      items: items.map((it) => ({ product_id: it.productId || it.id, qty: it.qty, variant: it.variant || '' })),
    },
  })
  if (error) throw new Error(friendlySupabaseError(error))
  loadMarketProducts()
  notifySellers(data?.orders || [])
  return { orders: data?.orders || [], payment_method: data?.payment_method || pay, payment_ref: data?.payment_ref || paymentRef }
}

// Fire-and-forget: Telegram message to each seller about the new order (api/notify/new-order).
async function notifySellers(orders) {
  try {
    const ids = orders.map((o) => o.id).filter(Boolean)
    if (!ids.length || typeof fetch !== 'function') return
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    if (!token) return
    fetch('/api/notify/new-order', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ids }) }).catch(() => {})
  } catch { /* notification is best effort */ }
}

// ---- buyer orders ---------------------------------------------------------------------
export const ORDER_STATUS = {
  yangi: 'Yangi', tasdiqlandi: 'Tasdiqlandi', tayyorlanmoqda: 'Tayyorlanmoqda',
  yetkazilmoqda: 'Yo‘lda', yetkazildi: 'Yetkazildi', bekor_qilindi: 'Bekor qilingan',
}
// to‘lov holati (0042 escrow)
export const ESCROW_DAYS = Number(import.meta.env.VITE_ESCROW_AUTO_RELEASE_DAYS || 3)
export const PAY_STATUS = {
  pending: 'Kutilmoqda', paid: 'To‘landi', held: 'Escrowda', released: 'Sotuvchiga o‘tkazildi',
  refund_pending: 'Qaytarish kutilmoqda', refunded: 'Qaytarildi', failed: 'Bekor qilindi',
}
export const payStatusLabel = (st, method) => (st === 'pending' && method !== 'cash' ? 'To‘lov kutilmoqda' : PAY_STATUS[st] || 'Kutilmoqda')
export const canConfirmReceipt = (o) => o?.live && o.method !== 'cash' && o.paymentStatus === 'held' && ['yetkazilmoqda', 'yetkazildi'].includes(o.dbStatus) && o.dispute !== 'open'
export const canPayOnline = (o) => o?.live && ['click', 'payme'].includes(o.method) && o.paymentStatus === 'pending' && o.dbStatus !== 'bekor_qilindi'

async function rpcOrThrow(name, args) {
  if (!supabase) throw new Error('Supabase sozlanmagan')
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw new Error(friendlySupabaseError(error))
  return data
}
/** “Qabul qildim” — escrowdagi pul sotuvchiga o‘tadi. */
export const confirmReceipt = (orderId) => rpcOrThrow('buyer_confirm_receipt', { p_order: orderId })
/** “Muammo bor” — nizo ochiladi, pul admin hal qilguncha muzlatiladi. */
export function openDispute(orderId, reason) {
  const r = String(reason || '').trim()
  if (r.length < 5) return Promise.reject(new Error('Muammoni kamida 5 ta belgi bilan yozing'))
  return rpcOrThrow('buyer_open_dispute', { p_order: orderId, p_reason: r.slice(0, 1000) })
}

// map DB status to the profile UI buckets used by existing screens
export const uiStatus = (s) => (s === 'yetkazildi' ? 'delivered' : s === 'bekor_qilindi' ? 'cancelled' : s === 'yetkazilmoqda' ? 'shipping' : 'processing')
const MON = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek']
const fmt = (iso) => {
  const d = new Date(iso)
  return `${d.getDate()} ${MON[d.getMonth()]}, ${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export async function fetchMyOrders(uid) {
  const full = 'id,seller_id,code,status,subtotal,delivery_fee,discount_amount,address,city,delivery_method,payment_method,payment_status,payment_ref,tracking_url,customer_name,customer_phone,created_at,status_history,delivered_at,buyer_confirmed_at,dispute_status,dispute_reason,seller_order_items(id,product_id,name,variant,image_url,qty,price)'
  const basic = 'id,seller_id,code,status,subtotal,delivery_fee,discount_amount,address,city,delivery_method,payment_method,customer_name,customer_phone,created_at,status_history,seller_order_items(id,product_id,name,variant,image_url,qty,price)'
  let { data, error } = await supabase.from('seller_orders').select(full).eq('buyer_id', uid).order('created_at', { ascending: false })
  if (error && /payment_status|tracking_url|payment_ref|delivered_at|buyer_confirmed_at|dispute_/.test(error.message || '')) {
    ;({ data, error } = await supabase.from('seller_orders').select(basic).eq('buyer_id', uid).order('created_at', { ascending: false }))
  }
  if (error) throw new Error(friendlySupabaseError(error))
  return (data || []).map((o) => {
    const items = (o.seller_order_items || []).map((it) => ({ id: it.product_id || it.id, name: it.name, type: it.variant || '', price: Number(it.price), qty: it.qty, image: it.image_url }))
    const goods = Number(o.subtotal) || items.reduce((s, it) => s + it.price * it.qty, 0)
    const fee = Number(o.delivery_fee) || 0
    const discount = Number(o.discount_amount) || 0
    return {
      id: o.code, dbId: o.id, sellerId: o.seller_id || null, live: true, at: fmt(o.created_at), createdAt: o.created_at, items, goods, fee, discount,
      total: Math.max(0, goods + fee - discount), method: o.payment_method || 'cash', months: 0,
      mode: o.delivery_method === 'olib_ketish' ? 'pickup' : 'courier',
      status: uiStatus(o.status), dbStatus: o.status, statusLabel: ORDER_STATUS[o.status] || o.status,
      history: o.status_history || [], eta: '1–2 kun', days: '1–2 kun',
      name: o.customer_name, phone: o.customer_phone, address: [o.city, String(o.address || '').replace(/\s*\[geo:[^\]]+\]/, '')].filter(Boolean).join(', '), lat: o.lat ?? (String(o.address || '').match(/\[geo:(-?[\d.]+),/) || [])[1] ?? null, lng: o.lng ?? (String(o.address || '').match(/\[geo:[^,]+,(-?[\d.]+)\]/) || [])[1] ?? null,
      trackingUrl: o.tracking_url || '', paymentStatus: o.payment_status || '', paymentRef: o.payment_ref || '',
      paymentLabel: payStatusLabel(o.payment_status, o.payment_method), deliveredAt: o.delivered_at || null, confirmedAt: o.buyer_confirmed_at || null,
      dispute: o.dispute_status || '', disputeReason: o.dispute_reason || '',
      autoReleaseAt: o.delivered_at ? new Date(new Date(o.delivered_at).getTime() + ESCROW_DAYS * 864e5).toISOString() : null,
    }
  })
}

// ---- reviews (seller_reviews, 0003 + 0035) -----------------------------------------------
// Insert: 0003 dagi seller_reviews_buyer_insert (faqat o‘z, 'yetkazildi' buyurtmasi uchun).
// O‘qish: 0035 migratsiyasidan keyin ishlaydi; unga qadar localStorage'dagi belgi ishlatiladi.
const REV_KEY = (uid) => `stomahub:reviewed:${uid}`
const revKey = (orderDbId, productId) => `${orderDbId}:${productId || ''}`
function localReviewed(uid) {
  try { return JSON.parse(localStorage.getItem(REV_KEY(uid)) || '{}') } catch { return {} }
}
export async function fetchMyReviews(uid) {
  const out = { ...localReviewed(uid) }
  if (!supabase || !uid) return out
  const { data, error } = await supabase.from('seller_reviews').select('order_id,product_id,rating').eq('author_id', uid)
  if (!error) (data || []).forEach((r) => { out[revKey(r.order_id, r.product_id)] = r.rating })
  return out
}
export { revKey }
export async function submitReview({ uid, authorName, order, item, rating, body }) {
  if (!supabase || !uid) throw new Error('Baho qoldirish uchun hisobga kiring')
  if (!order?.dbId || !order?.sellerId) throw new Error('Buyurtma topilmadi')
  if (order.dbStatus !== 'yetkazildi') throw new Error('Faqat yetkazilgan buyurtmani baholash mumkin')
  const r = Math.round(Number(rating))
  if (!(r >= 1 && r <= 5)) throw new Error('Yulduzcha bilan baho tanlang')
  const productId = isUuid(item?.id) ? item.id : null
  const { error } = await supabase.from('seller_reviews').insert({
    seller_id: order.sellerId, order_id: order.dbId, product_id: productId, author_id: uid,
    author_name: String(authorName || '').trim().slice(0, 80), rating: r, body: String(body || '').trim().slice(0, 1000),
  })
  if (error) {
    if (error.code === '23505') throw new Error('Bu mahsulotga allaqachon baho bergansiz')
    throw new Error(friendlySupabaseError(error))
  }
  const map = localReviewed(uid); map[revKey(order.dbId, productId)] = r
  try { localStorage.setItem(REV_KEY(uid), JSON.stringify(map)) } catch { /* private mode */ }
  return r
}

export async function cancelMyOrder(dbId, reason = '') {
  const { error } = await supabase.rpc('buyer_cancel_order', { p_order: dbId, p_reason: reason })
  if (error) throw new Error(friendlySupabaseError(error))
}

// ---- notifications + bonus (0007) ----------------------------------------------------
export async function fetchNotifications() {
  const { data, error } = await supabase.from('customer_notifications').select('*').order('created_at', { ascending: false }).limit(100)
  if (error) throw new Error(friendlySupabaseError(error))
  return data || []
}
export async function markNotificationsRead(ids) {
  if (!ids.length) return
  const { error } = await supabase.from('customer_notifications').update({ read_at: new Date().toISOString() }).in('id', ids)
  if (error) throw new Error(friendlySupabaseError(error))
}
export async function fetchBonusLog() {
  const { data, error } = await supabase.from('customer_bonus_log').select('*').order('created_at', { ascending: false }).limit(100)
  if (error) throw new Error(friendlySupabaseError(error))
  return data || []
}

export function useRemote(loader, deps) {
  const [state, setState] = useState({ loading: true, error: '', data: [] })
  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true, error: '' }))
    loader().then((data) => alive && setState({ loading: false, error: '', data }), (e) => alive && setState({ loading: false, error: e.message, data: [] }))
    return () => { alive = false }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  return state
}

// ---- admin moderation (0008) ----------------------------------------------------------
export async function adminQueue() {
  const { data, error } = await supabase.rpc('admin_review_queue')
  if (error) throw new Error(friendlySupabaseError(error))
  return data || []
}
export async function adminReview(id, approve, reason = '') {
  const { error } = await supabase.rpc('admin_review_product', { p_id: id, p_approve: approve, p_reason: reason })
  if (error) throw new Error(friendlySupabaseError(error))
  loadMarketProducts()
}
