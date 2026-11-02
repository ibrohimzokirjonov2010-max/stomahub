import { readJson, send } from '../_lib/http.js'
import { PAYME_TIMEOUT_MS, paymeAuthOk, paymeState } from '../_lib/paymentsCore.js'
import {
  activeTx, insertTx, loadOrderByCode, markPaid, markRefunded, orderPayable, orderPayableAmount,
  paymeConfigured, paymeError, paymeResult, toPaymeTime, txByProviderId, updateTx,
} from '../_lib/payments.js'
import { adminClient } from '../_lib/supabaseAdmin.js'

/**
 * Payme Merchant API (JSON-RPC 2.0) — https://developer.help.paycom.uz/metody-merchant-api/
 * Auth: Basic base64("Paycom:" + PAYME_KEY). Summalar tiyinda. account.order_id = buyurtma kodi.
 * PerformTransaction → payment_mark_paid → buyurtma 'held' (escrow).
 * CancelTransaction (bajarilgan) → payment_mark_refunded (faqat escrow hali chiqarilmagan bo‘lsa).
 * GET /api/payme — ochiq konfiguratsiya (checkout uchun).
 */
const E = {
  amount: [-31001, 'Noto‘g‘ri summa'],
  notFoundTx: [-31003, 'Tranzaksiya topilmadi'],
  cantCancel: [-31007, 'Buyurtma bajarilgan, bekor qilib bo‘lmaydi'],
  cantPerform: [-31008, 'Amalni bajarib bo‘lmaydi'],
  order: [-31050, 'Buyurtma topilmadi'],
  orderState: [-31051, 'Buyurtma to‘langan yoki bekor qilingan'],
  busy: [-31099, 'Buyurtma bo‘yicha boshqa tranzaksiya kutilmoqda'],
}
const err = (id, [code, msg], data = null) => paymeError(id, code, msg, data)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const on = paymeConfigured()
    return send(res, 200, {
      ok: true, service: 'payme', configured: on,
      merchant_id: on ? String(process.env.PAYME_MERCHANT_ID) : null,
      test: String(process.env.PAYME_TEST_MODE || '') === '1',
    })
  }
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Faqat POST' })

  let body
  try { body = await readJson(req) } catch { return send(res, 200, paymeError(null, -32700, 'Parse error')) }
  const id = body?.id ?? null
  const params = body?.params || {}
  if (!paymeConfigured() || !paymeAuthOk(req.headers.authorization, process.env.PAYME_KEY)) {
    return send(res, 200, paymeError(id, -32504, 'Insufficient privilege'))
  }
  try {
    const fn = { CheckPerformTransaction: checkPerform, CreateTransaction: createTx, PerformTransaction: performTx, CancelTransaction: cancelTx, CheckTransaction: checkTx, GetStatement: getStatement }[body?.method]
    if (!fn) return send(res, 200, paymeError(id, -32601, 'Method not found'))
    return send(res, 200, await fn(id, params))
  } catch (e) {
    console.error('payme', body?.method, e?.message)
    return send(res, 200, paymeError(id, -32400, 'System error'))
  }
}

async function validateOrder(id, params) {
  const code = params.account?.order_id
  if (!code) return { error: err(id, E.order, 'order_id') }
  const order = await loadOrderByCode(code)
  if (!order) return { error: err(id, E.order, 'order_id') }
  if (!orderPayable(order)) return { error: err(id, E.orderState, 'order_id') }
  if (Number(params.amount) !== Math.round(orderPayableAmount(order) * 100)) return { error: err(id, E.amount, 'amount') }
  return { order }
}

async function checkPerform(id, params) {
  const { order, error } = await validateOrder(id, params)
  if (error) return error
  const tx = await activeTx('payme', order.code)
  if (tx && tx.provider_trans_id && tx.state === 'pending') return err(id, E.busy, 'order_id')
  return paymeResult(id, { allow: true })
}

async function expire(tx) {
  return updateTx(tx.id, { state: 'cancelled', reason: 4, cancel_time: new Date().toISOString() })
}

async function createTx(id, params) {
  const pid = String(params.id || '')
  let tx = await txByProviderId('payme', pid)
  if (tx) {
    if (paymeState(tx) !== 1) return err(id, E.cantPerform)
    if (Date.now() - toPaymeTime(tx.create_time) > PAYME_TIMEOUT_MS) { await expire(tx); return err(id, E.cantPerform) }
    return paymeResult(id, { create_time: toPaymeTime(tx.create_time), transaction: String(tx.id), state: 1 })
  }
  const { order, error } = await validateOrder(id, params)
  if (error) return error
  const active = await activeTx('payme', order.code)
  if (active && active.provider_trans_id && active.provider_trans_id !== pid) return err(id, E.busy, 'order_id')
  const row = {
    provider_trans_id: pid, amount: orderPayableAmount(order), state: 'pending',
    create_time: new Date(Number(params.time) || Date.now()).toISOString(),
    meta: { ...(active?.meta || {}), account: params.account || {} },
  }
  tx = active
    ? await updateTx(active.id, row)
    : await insertTx({ provider: 'payme', merchant_trans_id: order.code, order_id: order.id, buyer_id: order.buyer_id, seller_id: order.seller_id, ...row })
  return paymeResult(id, { create_time: toPaymeTime(tx.create_time), transaction: String(tx.id), state: 1 })
}

async function performTx(id, params) {
  let tx = await txByProviderId('payme', String(params.id || ''))
  if (!tx) return err(id, E.notFoundTx)
  if (tx.state === 'paid') return paymeResult(id, { transaction: String(tx.id), perform_time: toPaymeTime(tx.perform_time), state: 2 })
  if (paymeState(tx) !== 1) return err(id, E.cantPerform)
  if (Date.now() - toPaymeTime(tx.create_time) > PAYME_TIMEOUT_MS) { await expire(tx); return err(id, E.cantPerform) }
  try {
    await markPaid({ provider: 'payme', merchantTransId: tx.merchant_trans_id, providerTransId: tx.provider_trans_id, amount: Number(tx.amount), orderId: tx.order_id, meta: { action: 'perform' } })
  } catch (e) {
    // buyurtma bekor qilingan / summa o‘zgargan — bajarib bo‘lmaydi
    console.error('payme perform', e?.message)
    await updateTx(tx.id, { state: 'cancelled', reason: 5, cancel_time: new Date().toISOString() })
    return err(id, E.cantPerform)
  }
  tx = await txByProviderId('payme', tx.provider_trans_id)
  return paymeResult(id, { transaction: String(tx.id), perform_time: toPaymeTime(tx.perform_time), state: 2 })
}

async function cancelTx(id, params) {
  let tx = await txByProviderId('payme', String(params.id || ''))
  if (!tx) return err(id, E.notFoundTx)
  const reason = Number(params.reason ?? 0) || null
  const st = paymeState(tx)
  if (st < 0) return paymeResult(id, { transaction: String(tx.id), cancel_time: toPaymeTime(tx.cancel_time), state: st })
  if (st === 1) {
    tx = await updateTx(tx.id, { state: 'cancelled', reason, cancel_time: new Date().toISOString() })
    return paymeResult(id, { transaction: String(tx.id), cancel_time: toPaymeTime(tx.cancel_time), state: -1 })
  }
  // st === 2: bajarilgan to‘lovni qaytarish — escrow hali sotuvchiga chiqarilmagan bo‘lsagina
  const { data: order } = await adminClient().from('seller_orders').select('id,payment_status').eq('id', tx.order_id).maybeSingle()
  if (!order || order.payment_status === 'released') return err(id, E.cantCancel)
  await markRefunded(order.id, 'payme', `Payme bekor qildi (sabab ${reason ?? '-'})`)
  tx = await updateTx(tx.id, { state: 'refunded', reason, cancel_time: tx.cancel_time || new Date().toISOString() })
  return paymeResult(id, { transaction: String(tx.id), cancel_time: toPaymeTime(tx.cancel_time), state: -2 })
}

async function checkTx(id, params) {
  const tx = await txByProviderId('payme', String(params.id || ''))
  if (!tx) return err(id, E.notFoundTx)
  const st = paymeState(tx)
  return paymeResult(id, {
    create_time: toPaymeTime(tx.create_time), perform_time: toPaymeTime(tx.perform_time),
    cancel_time: st < 0 ? toPaymeTime(tx.cancel_time) : 0, transaction: String(tx.id), state: st,
    reason: st < 0 ? (tx.reason ?? null) : null,
  })
}

async function getStatement(id, params) {
  const { data, error } = await adminClient().from('payment_transactions').select('*')
    .eq('provider', 'payme').neq('provider_trans_id', '')
    .gte('create_time', new Date(Number(params.from || 0)).toISOString())
    .lte('create_time', new Date(Number(params.to || Date.now())).toISOString())
    .order('create_time', { ascending: true })
  if (error) throw error
  return paymeResult(id, {
    transactions: (data || []).map((tx) => {
      const st = paymeState(tx)
      return {
        id: tx.provider_trans_id, time: toPaymeTime(tx.create_time), amount: Math.round(Number(tx.amount) * 100),
        account: { order_id: tx.merchant_trans_id }, create_time: toPaymeTime(tx.create_time),
        perform_time: toPaymeTime(tx.perform_time), cancel_time: st < 0 ? toPaymeTime(tx.cancel_time) : 0,
        transaction: String(tx.id), state: st, reason: st < 0 ? (tx.reason ?? null) : null,
      }
    }),
  })
}
