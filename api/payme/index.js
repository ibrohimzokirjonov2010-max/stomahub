import { readJson, requirePost, send } from '../_lib/http.js'
import {
  findPaymeByMerchantId, findPaymeByProviderId, loadOrderByMerchantId, markPaid,
  orderPayableAmount, paymeAuthOk, paymeConfigured, paymeError, paymeResult,
  paymeState, tiyinsToSom, toPaymeTime, upsertPaymeTx,
} from '../_lib/payments.js'
import { adminClient } from '../_lib/supabaseAdmin.js'

/**
 * Payme Merchant API (JSON-RPC 2.0)
 * Methods: CheckPerformTransaction, CreateTransaction, PerformTransaction,
 *          CancelTransaction, CheckTransaction, GetStatement
 */
export default async function handler(req, res) {
  if (req.method === 'GET') {
    send(res, 200, { ok: true, service: 'payme', configured: paymeConfigured() })
    return
  }
  if (!requirePost(req, res)) return

  let body
  try {
    body = await readJson(req)
  } catch {
    send(res, 200, paymeError(null, -32700, 'Parse error'))
    return
  }
  const id = body?.id ?? null
  const method = body?.method
  const params = body?.params || {}

  if (!paymeConfigured()) {
    send(res, 200, paymeError(id, -32400, 'Payme sozlanmagan (demo mode)'))
    return
  }
  if (!paymeAuthOk(req)) {
    send(res, 200, paymeError(id, -32504, 'Insufficient privilege'))
    return
  }

  try {
    switch (method) {
      case 'CheckPerformTransaction':
        send(res, 200, await checkPerform(id, params))
        break
      case 'CreateTransaction':
        send(res, 200, await createTx(id, params))
        break
      case 'PerformTransaction':
        send(res, 200, await performTx(id, params))
        break
      case 'CancelTransaction':
        send(res, 200, await cancelTx(id, params))
        break
      case 'CheckTransaction':
        send(res, 200, await checkTx(id, params))
        break
      case 'GetStatement':
        send(res, 200, await getStatement(id, params))
        break
      default:
        send(res, 200, paymeError(id, -32601, 'Method not found'))
    }
  } catch (e) {
    send(res, 200, paymeError(id, -32400, e.message || 'Internal error'))
  }
}

async function resolveOrder(account) {
  const merchantId = account?.order_id || account?.order || account?.id || account?.merchant_trans_id
  if (!merchantId) return null
  return loadOrderByMerchantId(String(merchantId))
}

async function checkPerform(id, params) {
  const order = await resolveOrder(params.account || {})
  if (!order) return paymeError(id, -31050, 'Order not found', 'order_id')
  if (order.status === 'bekor_qilindi' || order.payment_status === 'refunded') {
    return paymeError(id, -31051, 'Order cancelled', 'order_id')
  }
  if (order.payment_status === 'paid' || order.payment_status === 'released') {
    return paymeError(id, -31051, 'Order already paid', 'order_id')
  }
  const dueSom = orderPayableAmount(order)
  const amountTiyin = Number(params.amount)
  if (Math.abs(amountTiyin - dueSom * 100) > 100) {
    return paymeError(id, -31001, 'Wrong amount', 'amount')
  }
  return paymeResult(id, { allow: true })
}

async function createTx(id, params) {
  const order = await resolveOrder(params.account || {})
  if (!order) return paymeError(id, -31050, 'Order not found', 'order_id')
  const dueSom = orderPayableAmount(order)
  const amountTiyin = Number(params.amount)
  if (Math.abs(amountTiyin - dueSom * 100) > 100) {
    return paymeError(id, -31001, 'Wrong amount', 'amount')
  }

  const merchantTransId = String(params.account?.order_id || params.account?.order || order.code)
  const providerId = String(params.id)

  let tx = await findPaymeByProviderId(providerId)
  if (!tx) tx = await findPaymeByMerchantId(merchantTransId)

  if (tx && tx.state === 'paid') {
    return paymeResult(id, {
      create_time: toPaymeTime(tx.create_time),
      transaction: String(tx.id),
      state: 2,
    })
  }
  if (tx && (tx.state === 'cancelled' || tx.state === 'refunded')) {
    return paymeError(id, -31008, 'Transaction cancelled')
  }

  tx = await upsertPaymeTx({
    provider_trans_id: providerId,
    merchant_trans_id: merchantTransId,
    order_id: order.id,
    buyer_id: order.buyer_id,
    seller_id: order.seller_id,
    amount: dueSom,
    commission: order.commission,
    payout: order.payout,
    state: 'pending',
    create_time: new Date(Number(params.time) || Date.now()).toISOString(),
    meta: { account: params.account || {} },
  })

  return paymeResult(id, {
    create_time: toPaymeTime(tx.create_time),
    transaction: String(tx.id),
    state: 1,
  })
}

async function performTx(id, params) {
  const providerId = String(params.id)
  let tx = await findPaymeByProviderId(providerId)
  if (!tx) {
    // fallback: id may be our uuid
    const sb = adminClient()
    const { data } = await sb.from('payment_transactions').select('*').eq('id', providerId).maybeSingle()
    tx = data
  }
  if (!tx) return paymeError(id, -31003, 'Transaction not found')
  if (tx.state === 'cancelled' || tx.state === 'refunded') {
    return paymeError(id, -31008, 'Transaction cancelled')
  }
  if (tx.state !== 'paid') {
    await markPaid({
      provider: 'payme',
      merchantTransId: tx.merchant_trans_id,
      providerTransId: tx.provider_trans_id || providerId,
      amount: Number(tx.amount),
      orderId: tx.order_id,
      meta: { action: 'perform' },
    })
    tx = await findPaymeByMerchantId(tx.merchant_trans_id)
  }
  return paymeResult(id, {
    transaction: String(tx.id),
    perform_time: toPaymeTime(tx.perform_time) || Date.now(),
    state: 2,
  })
}

async function cancelTx(id, params) {
  const providerId = String(params.id)
  let tx = await findPaymeByProviderId(providerId)
  if (!tx) {
    const sb = adminClient()
    const { data } = await sb.from('payment_transactions').select('*').eq('id', providerId).maybeSingle()
    tx = data
  }
  if (!tx) return paymeError(id, -31003, 'Transaction not found')

  const reason = Number(params.reason ?? 0)
  if (tx.state === 'paid') {
    // allow cancel after perform (refund) when reason provided
    const sb = adminClient()
    await sb.from('payment_transactions').update({
      state: 'refunded',
      reason,
      cancel_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', tx.id)
    if (tx.order_id) {
      await sb.from('seller_orders').update({
        payment_status: 'refunded',
        status: 'bekor_qilindi',
        cancel_reason: `Payme cancel reason ${reason}`,
        escrow_refunded_at: new Date().toISOString(),
        escrow_refund_reason: `Payme:${reason}`,
        updated_at: new Date().toISOString(),
      }).eq('id', tx.order_id)
    }
    tx = await findPaymeByMerchantId(tx.merchant_trans_id)
    return paymeResult(id, {
      transaction: String(tx.id),
      cancel_time: toPaymeTime(tx.cancel_time) || Date.now(),
      state: -2,
    })
  }

  const sb = adminClient()
  await sb.from('payment_transactions').update({
    state: 'cancelled',
    reason,
    cancel_time: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', tx.id)
  tx = await findPaymeByMerchantId(tx.merchant_trans_id)
  return paymeResult(id, {
    transaction: String(tx.id),
    cancel_time: toPaymeTime(tx.cancel_time) || Date.now(),
    state: -1,
  })
}

async function checkTx(id, params) {
  const providerId = String(params.id)
  let tx = await findPaymeByProviderId(providerId)
  if (!tx) {
    const sb = adminClient()
    const { data } = await sb.from('payment_transactions').select('*').eq('id', providerId).maybeSingle()
    tx = data
  }
  if (!tx) return paymeError(id, -31003, 'Transaction not found')
  const state = paymeState(tx)
  return paymeResult(id, {
    create_time: toPaymeTime(tx.create_time),
    perform_time: toPaymeTime(tx.perform_time),
    cancel_time: toPaymeTime(tx.cancel_time),
    transaction: String(tx.id),
    state: state === 2 ? 2 : state === -1 ? (tx.state === 'refunded' ? -2 : -1) : 1,
    reason: tx.reason ?? null,
  })
}

async function getStatement(id, params) {
  const from = Number(params.from || 0)
  const to = Number(params.to || Date.now())
  const sb = adminClient()
  const { data, error } = await sb
    .from('payment_transactions')
    .select('*')
    .eq('provider', 'payme')
    .gte('create_time', new Date(from).toISOString())
    .lte('create_time', new Date(to).toISOString())
    .order('create_time', { ascending: true })
  if (error) throw error
  return paymeResult(id, {
    transactions: (data || []).map((tx) => ({
      id: tx.provider_trans_id || tx.id,
      time: toPaymeTime(tx.create_time),
      amount: Math.round(Number(tx.amount) * 100),
      account: { order_id: tx.merchant_trans_id },
      create_time: toPaymeTime(tx.create_time),
      perform_time: toPaymeTime(tx.perform_time),
      cancel_time: toPaymeTime(tx.cancel_time),
      transaction: String(tx.id),
      state: paymeState(tx) === 2 ? 2 : paymeState(tx) === -1 ? (tx.state === 'refunded' ? -2 : -1) : 1,
      reason: tx.reason ?? null,
      receivers: null,
    })),
  })
}
