// POST /api/notify/new-order { ids: [seller_order uuid] } — called by the buyer right after
// buyer_create_order. For each order that belongs to this buyer, sends the seller a Telegram
// message (profiles.telegram_id, or seller_settings.tg_chat_id from 0029) unless the seller turned
// off notify.yangi_buyurtma. Each order is notified at most once (seller_orders.tg_notified_at, 0029).
import { adminClient } from '../_lib/supabaseAdmin.js'
import { readJson, requirePost, send } from '../_lib/http.js'
import { sendTelegram } from '../_lib/telegram.js'

const SITE = (process.env.PUBLIC_SITE_URL || 'https://stomahub.uz').replace(/\/$/, '')
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const som = (n) => `${Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m`

export function orderText(o, items = []) {
  const lines = items.slice(0, 10).map((i) => `• ${i.name}${i.variant ? ` (${i.variant})` : ''} × ${i.qty} — ${som(Number(i.price) * Number(i.qty))}`)
  const total = Math.max(0, Number(o.subtotal || 0) - Number(o.discount_amount || 0)) + Number(o.delivery_fee || 0)
  return [
    `🛒 Yangi buyurtma ${o.code || ''}`.trim(),
    `Xaridor: ${o.customer_name || '—'}${o.customer_phone ? `, ${o.customer_phone}` : ''}`,
    o.delivery_method === 'olib_ketish' ? 'Olib ketish' : `Manzil: ${[o.city, o.address].filter(Boolean).join(', ') || '—'}`,
    ...lines,
    `Jami: ${som(total)} · To‘lov: ${String(o.payment_method || 'cash').toUpperCase()}`,
    `${SITE}/sotuvchi/buyurtmalar`,
  ].join('\n')
}

export default async function handler(req, res) {
  if (!requirePost(req, res)) return
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    if (!token) return send(res, 401, { ok: false, error: 'Kirish talab qilinadi' })
    const db = adminClient()
    const { data: auth } = await db.auth.getUser(token)
    if (!auth?.user) return send(res, 401, { ok: false, error: 'Sessiya yaroqsiz' })
    const { ids } = await readJson(req)
    const list = (Array.isArray(ids) ? ids : []).filter((x) => UUID.test(String(x))).slice(0, 20)
    if (!list.length) return send(res, 400, { ok: false, error: 'Buyurtma topilmadi' })
    if (!process.env.TELEGRAM_BOT_TOKEN) return send(res, 200, { ok: true, telegram: 'not_configured' })

    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { data: orders } = await db.from('seller_orders').select('*, seller_order_items(name, variant, qty, price)')
      .in('id', list).eq('buyer_id', auth.user.id).gte('created_at', since)
    const out = []
    for (const o of orders || []) {
      if (o.tg_notified_at) { out.push({ id: o.id, telegram: 'already' }); continue }
      const [{ data: prof }, { data: st }] = await Promise.all([
        db.from('profiles').select('telegram_id').eq('id', o.seller_id).maybeSingle(),
        db.from('seller_settings').select('*').eq('seller_id', o.seller_id).maybeSingle(),
      ])
      if (st?.notify && st.notify.yangi_buyurtma === false) { out.push({ id: o.id, telegram: 'off' }); continue }
      const chat = st?.tg_chat_id || prof?.telegram_id
      if (!chat) { out.push({ id: o.id, telegram: 'no_chat' }); continue }
      try {
        await sendTelegram(chat, orderText(o, o.seller_order_items || []))
        if ('tg_notified_at' in o) await db.from('seller_orders').update({ tg_notified_at: new Date().toISOString() }).eq('id', o.id)
        out.push({ id: o.id, telegram: 'sent' })
      } catch (e) {
        out.push({ id: o.id, telegram: 'failed', error: e.message })
      }
    }
    send(res, 200, { ok: true, results: out })
  } catch (e) {
    send(res, e.status || 500, { ok: false, error: e.message })
  }
}
