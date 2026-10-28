// POST /api/notify/role-review { id } — admin only. After admin_review_application, sends the applicant
// a Telegram message if their profile has telegram_id. Email infrastructure does not exist yet (skipped).
import { adminClient } from '../_lib/supabaseAdmin.js'
import { readJson, requirePost, send } from '../_lib/http.js'
import { sendTelegram } from '../_lib/telegram.js'

const SITE = (process.env.PUBLIC_SITE_URL || 'https://stomahub.uz').replace(/\/$/, '')

export default async function handler(req, res) {
  if (!requirePost(req, res)) return
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    if (!token) return send(res, 401, { ok: false, error: 'Kirish talab qilinadi' })
    const db = adminClient()
    const { data: auth } = await db.auth.getUser(token)
    if (!auth?.user) return send(res, 401, { ok: false, error: 'Sessiya yaroqsiz' })
    const { data: me } = await db.from('profiles').select('role').eq('id', auth.user.id).maybeSingle()
    if (me?.role !== 'admin') return send(res, 403, { ok: false, error: 'Faqat admin' })

    const { id } = await readJson(req)
    const { data: app } = await db.from('seller_applications').select('user_id,kind,status,reject_reason,shop_name').eq('id', id).maybeSingle()
    if (!app || app.status === 'pending') return send(res, 404, { ok: false, error: 'Ko‘rib chiqilgan ariza topilmadi' })
    const { data: p } = await db.from('profiles').select('telegram_id').eq('id', app.user_id).maybeSingle()
    if (!p?.telegram_id) return send(res, 200, { ok: true, telegram: 'skipped' })
    const text = app.status === 'approved'
      ? (app.kind === 'seller'
        ? `Do‘koningiz tasdiqlandi! Endi mahsulot qo‘shishingiz mumkin\n${SITE}/sotuvchi`
        : `Tashkilotchi arizangiz tasdiqlandi! ${SITE}/tashkilotchi`)
      : `Arizangiz rad etildi. Sabab: ${app.reject_reason}\nQayta ariza: ${SITE}/sotuvchi-bolish`
    await sendTelegram(p.telegram_id, text)
    send(res, 200, { ok: true, telegram: 'sent' })
  } catch (e) {
    send(res, e.status || 500, { ok: false, error: e.message })
  }
}
