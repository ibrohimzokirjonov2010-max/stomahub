import { adminClient } from '../../_lib/supabaseAdmin.js'
import { readJson, requirePost, send } from '../../_lib/http.js'
import { normalizePhone, otpMatches, phoneEmail } from '../../_lib/phone.js'
import { issueSession } from '../../_lib/session.js'

export default async function handler(req, res) {
  if (!requirePost(req, res)) return
  try {
    const body = await readJson(req)
    const phone = normalizePhone(body.phone)
    const code = String(body.code || '').replace(/\D/g, '')
    if (!phone || code.length !== 6) {
      send(res, 400, { ok: false, error: 'Telefon va 6 xonali kodni kiriting' })
      return
    }
    const admin = adminClient()
    const found = await admin.from('phone_otps')
      .select('id,code_hash,attempts,expires_at')
      .eq('phone', phone)
      .is('consumed_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
    if (found.error) throw found.error
    const row = found.data?.[0]
    if (!row) {
      send(res, 400, { ok: false, error: 'Kod topilmadi yoki muddati tugagan' })
      return
    }
    if (row.attempts >= 5) {
      send(res, 429, { ok: false, error: 'Juda ko‘p noto‘g‘ri kod. Yangi kod so‘rang.' })
      return
    }
    if (!otpMatches(phone, code, row.code_hash)) {
      await admin.from('phone_otps').update({ attempts: row.attempts + 1 }).eq('id', row.id)
      send(res, 400, { ok: false, error: 'Kod noto‘g‘ri' })
      return
    }
    await admin.from('phone_otps').update({ consumed_at: new Date().toISOString() }).eq('id', row.id)
    const contact = await admin.from('telegram_contacts').select('name,telegram_id').eq('phone', phone).maybeSingle()
    const session = await issueSession({
      email: phoneEmail(phone),
      name: String(body.name || contact.data?.name || '').trim(),
      phone,
      telegramId: contact.data?.telegram_id || null,
      role: body.role,
    })
    send(res, 200, { ok: true, ...session })
  } catch (error) {
    send(res, error.status || 500, { ok: false, error: error.message || 'Kirib bo‘lmadi' })
  }
}
