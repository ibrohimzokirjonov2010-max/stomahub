import { adminClient } from './supabaseAdmin.js'
export { paymeState, clickPayUrl, paymePayUrl } from './paymentsCore.js'

export function clickConfigured() {
  return !!(process.env.CLICK_SECRET_KEY && process.env.CLICK_MERCHANT_ID && process.env.CLICK_SERVICE_ID)
}
export function clickReversalConfigured() {
  return clickConfigured() && !!process.env.CLICK_MERCHANT_USER_ID
}
export function paymeConfigured() {
  return !!(process.env.PAYME_KEY && process.env.PAYME_MERCHANT_ID)
}

export async function loadOrderByCode(code) {
  const id = String(code || '').trim()
  if (!id || id.length > 64) return null
  const { data, error } = await adminClient().from('seller_orders').select('*').eq('code', id).maybeSingle()
  if (error) throw error
  return data
}

export async function loadOrderById(id) {
  if (!/^[0-9a-f-]{36}$/i.test(String(id || ''))) return null
  const { data, error } = await adminClient().from('seller_orders').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function markPaid({ provider, merchantTransId, providerTransId, amount, orderId, meta }) {
  const { data, error } = await adminClient().rpc('payment_mark_paid', {
    p_provider: provider,
    p_merchant_trans_id: String(merchantTransId),
    p_provider_trans_id: String(providerTransId || ''),
    p_amount: amount == null ? null : Number(amount),
    p_order_id: orderId || null,
    p_registration_id: null,
    p_meta: meta || {},
  })
  if (error) throw error
  return data
}

export async function markRefunded(orderId, method, note) {
  const { data, error } = await adminClient().rpc('payment_mark_refunded', { p_order: orderId, p_method: method, p_note: note || '' })
  if (error) throw error
  return data
}

/** onlayn buyurtmalar uchun (pending yoki failed) to‘lanishi mumkinmi */
export function orderPayable(order) {
  return !!order && order.status !== 'bekor_qilindi' && ['pending', 'failed'].includes(order.payment_status)
}

export function orderPayableAmount(order) {
  if (!order) return 0
  return Math.max(0, Number(order.subtotal || 0) - Number(order.discount_amount || 0)) + Number(order.delivery_fee || 0)
}

export async function activeTx(provider, merchantTransId) {
  const { data, error } = await adminClient().from('payment_transactions').select('*')
    .eq('provider', provider).eq('merchant_trans_id', String(merchantTransId))
    .in('state', ['created', 'pending', 'paid']).order('created_at', { ascending: false }).limit(1)
  if (error) throw error
  return data?.[0] || null
}

export async function txByProviderId(provider, providerTransId) {
  const { data, error } = await adminClient().from('payment_transactions').select('*')
    .eq('provider', provider).eq('provider_trans_id', String(providerTransId)).maybeSingle()
  if (error) throw error
  return data
}

export async function updateTx(id, patch) {
  const { data, error } = await adminClient().from('payment_transactions')
    .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function insertTx(row) {
  const { data, error } = await adminClient().from('payment_transactions').insert(row).select().single()
  if (error) throw error
  return data
}

export function paymeError(id, code, message, data = null) {
  const m = typeof message === 'string' ? { ru: message, uz: message, en: message } : message
  return { jsonrpc: '2.0', id, error: { code, message: m, data } }
}
export function paymeResult(id, result) { return { jsonrpc: '2.0', id, result } }
export function toPaymeTime(iso) { return iso ? new Date(iso).getTime() : 0 }
