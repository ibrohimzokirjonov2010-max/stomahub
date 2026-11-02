import { readJson, requirePost, send } from '../_lib/http.js'
import { amountsEqual, verifyClickSign } from '../_lib/paymentsCore.js'
import { clickConfigured, loadOrderByCode, markPaid, orderPayableAmount, updateTx } from '../_lib/payments.js'
import { adminClient } from '../_lib/supabaseAdmin.js'

/**
 * Click SHOP API — Complete (action=1). Imzo tasdiqlangach payment_mark_paid → buyurtma 'held' (escrow).
 * Javob: { click_trans_id, merchant_trans_id, merchant_confirm_id (int), error, error_note }
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
    if (!body.click_trans_id || !body.merchant_trans_id || body.merchant_prepare_id == null || body.amount == null) return reply(-8, 'Error in request from click')
    if (!verifyClickSign(body, process.env.CLICK_SECRET_KEY)) return reply(-1, 'SIGN CHECK FAILED!')
    if (String(body.action) !== '1') return reply(-3, 'Action not found')
    if (String(body.service_id) !== String(process.env.CLICK_SERVICE_ID)) return reply(-8, 'Error in request from click')

    const seq = Number(body.merchant_prepare_id)
    if (!Number.isSafeInteger(seq)) return reply(-6, 'Transaction does not exist')
    const { data: tx, error } = await adminClient().from('payment_transactions').select('*')
      .eq('provider', 'click').eq('seq', seq).maybeSingle()
    if (error) throw error
    if (!tx || tx.merchant_trans_id !== String(body.merchant_trans_id)) return reply(-6, 'Transaction does not exist')
    if (tx.state === 'paid') return reply(-4, 'Already paid', { merchant_confirm_id: Number(tx.seq) })
    if (['cancelled', 'refunded', 'failed'].includes(tx.state)) return reply(-9, 'Transaction cancelled')

    const order = await loadOrderByCode(tx.merchant_trans_id)
    if (!order) return reply(-5, 'User does not exist')
    const meta = { ...(tx.meta || {}), action: 'complete', click_paydoc_id: String(body.click_paydoc_id ?? tx.meta?.click_paydoc_id ?? '') }

    // Click o‘zi xatolik yuborsa (error < 0) — tranzaksiya bekor qilinadi
    if (Number(body.error ?? 0) < 0) {
      await updateTx(tx.id, { state: 'cancelled', cancel_time: new Date().toISOString(), meta: { ...meta, click_error: String(body.error), click_error_note: String(body.error_note ?? '') } })
      return reply(-9, 'Transaction cancelled')
    }
    if (order.status === 'bekor_qilindi') {
      await updateTx(tx.id, { state: 'cancelled', cancel_time: new Date().toISOString(), meta })
      return reply(-9, 'Transaction cancelled')
    }
    if (['held', 'paid', 'released'].includes(order.payment_status)) return reply(-4, 'Already paid')
    const due = orderPayableAmount(order)
    if (!amountsEqual(body.amount, due) || !amountsEqual(tx.amount, due)) return reply(-2, 'Incorrect parameter amount')

    const r = await markPaid({
      provider: 'click', merchantTransId: order.code, providerTransId: String(body.click_trans_id),
      amount: due, orderId: order.id, meta,
    })
    return reply(0, 'Success', { merchant_confirm_id: Number(r?.seq ?? tx.seq) })
  } catch (e) {
    console.error('click complete', e?.message)
    return reply(-7, 'Failed to update user')
  }
}
