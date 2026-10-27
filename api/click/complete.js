import { readJson, requirePost, send } from '../_lib/http.js'
import {
  clickConfigured, clickSign, loadOrderByMerchantId, markPaid, orderPayableAmount,
} from '../_lib/payments.js'

/**
 * Click SHOP API — Complete
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
    const merchantPrepareId = String(body.merchant_prepare_id ?? '')
    const amount = Number(body.amount)
    const action = Number(body.action)
    const errorIn = Number(body.error ?? 0)
    const signTime = String(body.sign_time ?? '')
    const signString = String(body.sign_string ?? '')

    const expected = clickSign([
      clickTransId,
      serviceId,
      process.env.CLICK_SECRET_KEY,
      merchantTransId,
      merchantPrepareId,
      amount,
      action,
      signTime,
    ])
    if (signString.toLowerCase() !== expected.toLowerCase()) {
      send(res, 200, { error: -1, error_note: 'SIGN CHECK FAILED' })
      return
    }

    const order = await loadOrderByMerchantId(merchantTransId)
    if (!order) {
      send(res, 200, { error: -5, error_note: 'Order not found' })
      return
    }
    if (errorIn < 0) {
      send(res, 200, {
        click_trans_id: Number(clickTransId),
        merchant_trans_id: merchantTransId,
        merchant_confirm_id: order.id,
        error: -9,
        error_note: 'Payment cancelled by Click',
      })
      return
    }

    const due = orderPayableAmount(order)
    if (Math.abs(due - amount) > 1) {
      send(res, 200, { error: -2, error_note: 'Incorrect parameter amount' })
      return
    }

    await markPaid({
      provider: 'click',
      merchantTransId,
      providerTransId: clickTransId,
      amount: due,
      orderId: order.id,
      meta: { action: 'complete', merchant_prepare_id: merchantPrepareId, sign_time: signTime },
    })

    send(res, 200, {
      click_trans_id: Number(clickTransId),
      merchant_trans_id: merchantTransId,
      merchant_confirm_id: order.id,
      error: 0,
      error_note: 'Success',
    })
  } catch (e) {
    send(res, 200, { error: -9, error_note: e.message || 'Internal error' })
  }
}
