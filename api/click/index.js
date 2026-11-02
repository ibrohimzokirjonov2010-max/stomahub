import { readJson, send } from '../_lib/http.js'
import { clickMerchantAuth } from '../_lib/paymentsCore.js'
import { clickConfigured, clickReversalConfigured, loadOrderById, markRefunded } from '../_lib/payments.js'
import { adminClient } from '../_lib/supabaseAdmin.js'

/**
 * GET  /api/click — ochiq konfiguratsiya (checkout qaysi usullarni ko‘rsatishini biladi).
 * POST /api/click { order_id } — FAQAT admin: “Qaytarish kutilmoqda” holatidagi Click to‘lovini
 *      Click Merchant API orqali qaytaradi (DELETE /v2/merchant/payment/reversal/{service_id}/{payment_id}).
 *      Click faqat joriy oy ichidagi karta to‘lovlarini qaytaradi; aks holda admin qo‘lda qaytaradi.
 */
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const on = clickConfigured()
    return send(res, 200, {
      ok: true, service: 'click', configured: on,
      service_id: on ? String(process.env.CLICK_SERVICE_ID) : null,
      merchant_id: on ? String(process.env.CLICK_MERCHANT_ID) : null,
      reversal: clickReversalConfigured(),
    })
  }
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Faqat GET/POST' })
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    if (!token) return send(res, 401, { ok: false, error: 'Kirish talab qilinadi' })
    const db = adminClient()
    const { data: auth } = await db.auth.getUser(token)
    if (!auth?.user) return send(res, 401, { ok: false, error: 'Sessiya yaroqsiz' })
    const { data: me } = await db.from('profiles').select('role').eq('id', auth.user.id).maybeSingle()
    if (me?.role !== 'admin') return send(res, 403, { ok: false, error: 'Faqat admin' })
    if (!clickReversalConfigured()) return send(res, 400, { ok: false, error: 'Click qaytarish sozlanmagan (CLICK_MERCHANT_USER_ID). Pulni qo‘lda qaytaring.' })

    const { order_id: orderId } = await readJson(req)
    const order = await loadOrderById(orderId)
    if (!order) return send(res, 404, { ok: false, error: 'Buyurtma topilmadi' })
    if (order.payment_status !== 'refund_pending') return send(res, 400, { ok: false, error: 'Buyurtma “Qaytarish kutilmoqda” holatida emas' })
    const { data: txs } = await db.from('payment_transactions').select('*').eq('provider', 'click').eq('order_id', order.id).eq('state', 'paid').limit(1)
    const tx = txs?.[0]
    const paydoc = tx?.meta?.click_paydoc_id
    if (!tx || !paydoc) return send(res, 400, { ok: false, error: 'Click to‘lov hujjati (click_paydoc_id) topilmadi — qo‘lda qaytaring' })

    const url = `https://api.click.uz/v2/merchant/payment/reversal/${encodeURIComponent(process.env.CLICK_SERVICE_ID)}/${encodeURIComponent(paydoc)}`
    const r = await fetch(url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json', 'Content-Type': 'application/json',
        Auth: clickMerchantAuth(process.env.CLICK_MERCHANT_USER_ID, process.env.CLICK_SECRET_KEY),
      },
    })
    const j = await r.json().catch(() => ({}))
    if (Number(j.error_code) !== 0) {
      return send(res, 200, { ok: false, error: `Click rad etdi: ${j.error_note || r.status}. Pulni qo‘lda qaytaring.`, click: j })
    }
    await markRefunded(order.id, 'click', `Click reversal ${j.payment_id || paydoc}`)
    return send(res, 200, { ok: true, payment_status: 'refunded', click: { payment_id: j.payment_id } })
  } catch (e) {
    return send(res, e.status || 500, { ok: false, error: e.message })
  }
}
