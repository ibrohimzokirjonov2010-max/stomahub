import { readJson, requirePost, send } from '../_lib/http.js'
import {
  clickConfigured, clickSign, loadOrderByMerchantId, orderPayableAmount,
} from '../_lib/payments.js'
import { adminClient } from '../_lib/supabaseAdmin.js'

/**
 * Click SHOP API — Prepare
 * https://docs.click.uz/en/click-api/
 */
export default async function handler(req, res) {
  if (!requirePost(req, res)) return
  try {
    if (!clickConfigured()) {
      send(res, 200, { error: -1, error_note: 'Click sozlanmagan (demo mode)' })
      return
    }
    const body = await readJson(req)
    const clickTransId = String(body.click_trans_id ?? '')
    const serviceId = String(body.service_id ?? '')
    const merchantTransId = String(body.merchant_trans_id ?? '')
    const amount = Number(body.amount)
    const action = Number(body.action)
    const signTime = String(body.sign_time ?? '')
    const signString = String(body.sign_string ?? '')

    const expected = clickSign([
      clickTransId,
      serviceId,
      process.env.CLICK_SECRET_KEY,
      merchantTransId,
      amount,
      action,
      signTime,
    ])
    if (signString.toLowerCase() !== expected.toLowerCase()) {
      send(res, 200, { error: -1, error_note: 'SIGN CHECK FAILED' })
      return
    }
    if (String(serviceId) !== String(process.env.CLICK_SERVICE_ID)) {
      send(res, 200, { error: -5, error_note: 'Service not found' })
      return
    }

    const order = await loadOrderByMerchantId(merchantTransId)
    if (!order) {
      send(res, 200, { error: -5, error_note: 'Order not found' })
      return
    }
    if (order.status === 'bekor_qilindi' || order.payment_status === 'refunded') {
      send(res, 200, { error: -9, error_note: 'Order cancelled' })
      return
    }
    if (order.payment_status === 'paid' || order.payment_status === 'released') {
      send(res, 200, {
        click_trans_id: Number(clickTransId),
        merchant_trans_id: merchantTransId,
        merchant_prepare_id: order.id,
        error: 0,
        error_note: 'Success',
      })
      return
    }
    const due = orderPayableAmount(order)
    if (Math.abs(due - amount) > 1) {
      send(res, 200, { error: -2, error_note: 'Incorrect parameter amount' })
      return
    }

    const sb = adminClient()
    await sb.from('payment_transactions').upsert(
      {
        provider: 'click',
        provider_trans_id: clickTransId,
        provider_prepare_id: order.id,
        merchant_trans_id: merchantTransId,
        order_id: order.id,
        buyer_id: order.buyer_id,
        seller_id: order.seller_id,
        amount: due,
        commission: order.commission,
        payout: order.payout,
        state: 'pending',
        meta: { action: 'prepare', sign_time: signTime },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'provider,merchant_trans_id' },
    ).select()

    send(res, 200, {
      click_trans_id: Number(clickTransId),
      merchant_trans_id: merchantTransId,
      merchant_prepare_id: order.id,
      error: 0,
      error_note: 'Success',
    })
  } catch (e) {
    send(res, 200, { error: -9, error_note: e.message || 'Internal error' })
  }
}
