import { readJson, requirePost, send } from '../_lib/http.js'
import { amountsEqual, verifyClickSign } from '../_lib/paymentsCore.js'
import {
  activeTx, clickConfigured, insertTx, loadOrderByCode, orderPayable, orderPayableAmount, updateTx,
} from '../_lib/payments.js'

/**
 * Click SHOP API — Prepare (action=0). Click form-urlencoded POST yuboradi.
 * Javob: { click_trans_id, merchant_trans_id, merchant_prepare_id (int), error, error_note }
 * https://docs.click.uz/click-api-request/
 */
export default async function handler(req, res) {
  if (!requirePost(req, res)) return
  let body = {}
  const reply = (error, error_note, extra = {}) => send(res, 200, {
    click_trans_id: Number(body.click_trans_id) || 0,
    merchant_trans_id: String(body.merchant_trans_id ?? ''),
    error, error_note, ...extra,
  })
  try {
    if (!clickConfigured()) return send(res, 200, { error: -8, error_note: 'Click sozlanmagan' })
    body = await readJson(req)
    if (!body.click_trans_id || !body.merchant_trans_id || body.amount == null || body.sign_time == null) return reply(-8, 'Error in request from click')
    if (!verifyClickSign(body, process.env.CLICK_SECRET_KEY)) return reply(-1, 'SIGN CHECK FAILED!')
    if (String(body.action) !== '0') return reply(-3, 'Action not found')
    if (String(body.service_id) !== String(process.env.CLICK_SERVICE_ID)) return reply(-8, 'Error in request from click')

    const order = await loadOrderByCode(body.merchant_trans_id)
    if (!order) return reply(-5, 'User does not exist')
    if (['held', 'paid', 'released'].includes(order.payment_status)) return reply(-4, 'Already paid')
    if (!orderPayable(order)) return reply(-9, 'Transaction cancelled')
    const due = orderPayableAmount(order)
    if (!amountsEqual(body.amount, due)) return reply(-2, 'Incorrect parameter amount')

    const meta = { action: 'prepare', sign_time: String(body.sign_time), click_paydoc_id: String(body.click_paydoc_id ?? '') }
    let tx = await activeTx('click', order.code)
    if (tx && tx.state === 'paid') return reply(-4, 'Already paid')
    if (tx) {
      tx = await updateTx(tx.id, { provider_trans_id: String(body.click_trans_id), amount: due, state: 'pending', meta: { ...(tx.meta || {}), ...meta } })
    } else {
      tx = await insertTx({
        provider: 'click', provider_trans_id: String(body.click_trans_id), merchant_trans_id: order.code,
        order_id: order.id, buyer_id: order.buyer_id, seller_id: order.seller_id, amount: due, state: 'pending', meta,
      })
    }
    return reply(0, 'Success', { merchant_prepare_id: Number(tx.seq) })
  } catch (e) {
    console.error('click prepare', e?.message)
    return reply(-7, 'Failed to update user')
  }
}
