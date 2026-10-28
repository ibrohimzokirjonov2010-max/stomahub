import { useEffect, useState, useSyncExternalStore } from 'react'
import { supabase, friendlySupabaseError } from './supabaseClient'
import { marketProducts } from './marketData'

// ---- marketplace feed (active seller products) -------------------------------------
let marketState = { status: 'idle', error: '' }
const marketListeners = new Set()
const emit = () => marketListeners.forEach((l) => l())

const CAT_KEY = {
  'Restavratsion materiallar': 'komp', Implantlar: 'impl', 'Yordamchi materiallar': 'bond', 'Sarflanadigan materiallar': 'gig',
  'Endodontik asboblar': 'endo', Instrumentlar: 'asb', Uskunalar: 'usk', 'Himoya vositalari': 'gig', 'O‘lchov materiallari': 'komp',
  Ortodontiya: 'asb', 'Gigiena vositalari': 'gig', Boshqa: 'asb',
}

export const toMarketProduct = (row) => ({
  id: row.id,
  sellerId: row.seller_id,
  seller: row.shop_name || 'Sotuvchi',
  name: row.name,
  type: [row.category, row.unit].filter(Boolean).join(' · ') || row.category || '',
  brand: row.brand || '',
  cat: CAT_KEY[row.category] || 'asb',
  category: row.category || '',
  price: Number(row.price) || 0,
  stock: Number(row.stock) || 0,
  image: row.image_url || (Array.isArray(row.images) ? row.images[0] : '') || '/images/market/p1.jpg',
  images: Array.isArray(row.images) ? row.images : [],
  variants: Array.isArray(row.variants) ? row.variants : [],
  description: row.description || '',
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
    marketProducts.splice(0, marketProducts.length, ...(rows || []).map(toMarketProduct))
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
  const allowed = new Set(['cash', 'naqd', 'uzcard', 'humo', 'click', 'payme', 'card'])
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
  return { orders: data?.orders || [], payment_method: data?.payment_method || pay, payment_ref: data?.payment_ref || paymentRef }
}

// ---- buyer orders ---------------------------------------------------------------------
export const ORDER_STATUS = {
  yangi: 'Yangi', tasdiqlandi: 'Tasdiqlandi', tayyorlanmoqda: 'Tayyorlanmoqda',
  yetkazilmoqda: 'Yo‘lda', yetkazildi: 'Yetkazildi', bekor_qilindi: 'Bekor qilingan',
}
// map DB status to the profile UI buckets used by existing screens
export const uiStatus = (s) => (s === 'yetkazildi' ? 'delivered' : s === 'bekor_qilindi' ? 'cancelled' : s === 'yetkazilmoqda' ? 'shipping' : 'processing')
const MON = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek']
const fmt = (iso) => {
  const d = new Date(iso)
  return `${d.getDate()} ${MON[d.getMonth()]}, ${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export async function fetchMyOrders(uid) {
  const full = 'id,code,status,subtotal,delivery_fee,discount_amount,address,city,delivery_method,payment_method,payment_status,payment_ref,tracking_url,customer_name,customer_phone,created_at,status_history,seller_order_items(id,product_id,name,variant,image_url,qty,price)'
  const basic = 'id,code,status,subtotal,delivery_fee,discount_amount,address,city,delivery_method,payment_method,customer_name,customer_phone,created_at,status_history,seller_order_items(id,product_id,name,variant,image_url,qty,price)'
  let { data, error } = await supabase.from('seller_orders').select(full).eq('buyer_id', uid).order('created_at', { ascending: false })
  if (error && /payment_status|tracking_url|payment_ref/.test(error.message || '')) {
    ;({ data, error } = await supabase.from('seller_orders').select(basic).eq('buyer_id', uid).order('created_at', { ascending: false }))
  }
  if (error) throw new Error(friendlySupabaseError(error))
  return (data || []).map((o) => {
    const items = (o.seller_order_items || []).map((it) => ({ id: it.product_id || it.id, name: it.name, type: it.variant || '', price: Number(it.price), qty: it.qty, image: it.image_url }))
    const goods = Number(o.subtotal) || items.reduce((s, it) => s + it.price * it.qty, 0)
    const fee = Number(o.delivery_fee) || 0
    const discount = Number(o.discount_amount) || 0
    return {
      id: o.code, dbId: o.id, live: true, at: fmt(o.created_at), createdAt: o.created_at, items, goods, fee, discount,
      total: Math.max(0, goods + fee - discount), method: o.payment_method || 'cash', months: 0,
      mode: o.delivery_method === 'olib_ketish' ? 'pickup' : 'courier',
      status: uiStatus(o.status), dbStatus: o.status, statusLabel: ORDER_STATUS[o.status] || o.status,
      history: o.status_history || [], eta: '1–2 kun', days: '1–2 kun',
      name: o.customer_name, phone: o.customer_phone, address: [o.city, String(o.address || '').replace(/\s*\[geo:[^\]]+\]/, '')].filter(Boolean).join(', '), lat: o.lat ?? (String(o.address || '').match(/\[geo:(-?[\d.]+),/) || [])[1] ?? null, lng: o.lng ?? (String(o.address || '').match(/\[geo:[^,]+,(-?[\d.]+)\]/) || [])[1] ?? null,
      trackingUrl: o.tracking_url || '', paymentStatus: o.payment_status || '', paymentRef: o.payment_ref || '',
    }
  })
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
