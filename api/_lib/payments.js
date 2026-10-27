import crypto from 'node:crypto'
import { adminClient } from './supabaseAdmin.js'

export function clickConfigured() {
  return !!(
    process.env.CLICK_SECRET_KEY &&
    process.env.CLICK_MERCHANT_ID &&
    process.env.CLICK_SERVICE_ID
  )
}

export function paymeConfigured() {
  return !!(process.env.PAYME_KEY && process.env.PAYME_MERCHANT_ID)
}

export function clickSign(parts) {
  const raw = parts.join('')
  return crypto.createHash('md5').update(raw).digest('hex')
}

export function paymeAuthOk(req) {
  const key = process.env.PAYME_KEY || ''
  if (!key) return false
  const hdr = String(req.headers.authorization || '')
  if (!hdr.startsWith('Basic ')) return false
  try {
    const decoded = Buffer.from(hdr.slice(6), 'base64').toString('utf8')
    // Payme: login = Paycom (or merchant id), password = PAYME_KEY
    const [, pass] = decoded.split(':')
    return pass === key
  } catch {
    return false
  }
}

export function tiyinsToSom(amount) {
  // Payme sends tiyin (1/100 of som). Click sends som.
  return Math.round(Number(amount) / 100)
}

export async function loadOrderByMerchantId(merchantTransId) {
  const sb = adminClient()
  // merchant_trans_id is order code or uuid
  const id = String(merchantTransId || '')
  let q = sb.from('seller_orders').select('*')
  if (/^[0-9a-f-]{36}$/i.test(id)) q = q.eq('id', id)
  else q = q.eq('code', id)
  const { data, error } = await q.maybeSingle()
  if (error) throw error
  return data
}

export async function markPaid({ provider, merchantTransId, providerTransId, amount, orderId, registrationId, meta }) {
  const sb = adminClient()
  const { data, error } = await sb.rpc('payment_mark_paid', {
    p_provider: provider,
    p_merchant_trans_id: String(merchantTransId),
    p_provider_trans_id: String(providerTransId || ''),
    p_amount: amount == null ? null : Number(amount),
    p_order_id: orderId || null,
    p_registration_id: registrationId || null,
    p_meta: meta || {},
  })
  if (error) throw error
  return data
}

export async function upsertPaymeTx(row) {
  const sb = adminClient()
  const { data: existing } = await sb
    .from('payment_transactions')
    .select('*')
    .eq('provider', 'payme')
    .eq('merchant_trans_id', row.merchant_trans_id)
    .maybeSingle()
  if (existing) {
    const { data, error } = await sb
      .from('payment_transactions')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  }
  const { data, error } = await sb.from('payment_transactions').insert({ provider: 'payme', ...row }).select().single()
  if (error) throw error
  return data
}

export async function findPaymeByProviderId(providerTransId) {
  const sb = adminClient()
  const { data, error } = await sb
    .from('payment_transactions')
    .select('*')
    .eq('provider', 'payme')
    .eq('provider_trans_id', String(providerTransId))
    .maybeSingle()
  if (error) throw error
  return data
}

export async function findPaymeByMerchantId(merchantTransId) {
  const sb = adminClient()
  const { data, error } = await sb
    .from('payment_transactions')
    .select('*')
    .eq('provider', 'payme')
    .eq('merchant_trans_id', String(merchantTransId))
    .maybeSingle()
  if (error) throw error
  return data
}

export function orderPayableAmount(order) {
  if (!order) return 0
  return Math.max(0, Number(order.subtotal || 0) - Number(order.discount_amount || 0)) + Number(order.delivery_fee || 0)
}

/** Payme error helper */
export function paymeError(id, code, message, data = null) {
  return {
    jsonrpc: '2.0',
    id,
    error: { code, message: { ru: message, uz: message, en: message }, data },
  }
}

export function paymeResult(id, result) {
  return { jsonrpc: '2.0', id, result }
}

export function paymeState(tx) {
  if (!tx) return 0
  if (tx.state === 'paid') return 2
  if (tx.state === 'cancelled' || tx.state === 'refunded') return -1
  if (tx.state === 'pending' || tx.state === 'created') return 1
  return 0
}

export function toPaymeTime(iso) {
  if (!iso) return 0
  return new Date(iso).getTime()
}
