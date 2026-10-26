import { randomInt } from 'node:crypto'
import { adminClient } from '../../_lib/supabaseAdmin.js'
import { clientIp, readJson, requirePost, send } from '../../_lib/http.js'
import { hashOtp, normalizePhone } from '../../_lib/phone.js'
import { sendTelegram } from '../../_lib/telegram.js'

const WINDOW_MS = 10 * 60 * 1000

export default async function handler(req, res) {
  if (!requirePost(req, res)) return
  try {
    const body = await readJson(req)
    const phone = normalizePhone(body.phone)
    if (!phone) {
      send(res, 400, { ok: false, error: 'Telefon raqamini +998 ko‘rinishida kiriting' })
      return
    }
    const admin = adminClient()
    const since = new Date(Date.now() - WINDOW_MS).toISOString()
    const ip = clientIp(req)
    const recent = await admin.from('phone_otps').select('id', { count: 'exact', head: true }).eq('phone', phone).gte('created_at', since)
    if (recent.error) throw recent.error
    if ((recent.count || 0) >= 3) {
      send(res, 429, { ok: false, error: 'Juda ko‘p urinish. 10 daqiqadan keyin qayta urinib ko‘ring.' })
      return
    }
    if (ip) {
      const byIp = await admin.from('phone_otps').select('id', { count: 'exact', head: true }).eq('ip', ip).gte('created_at', since)
      if (byIp.error) throw byIp.error
      if ((byIp.count || 0) >= 8) {
        send(res, 429, { ok: false, error: 'Juda ko‘p urinish. Birozdan keyin qayta urinib ko‘ring.' })
        return
      }
    }
    const contact = await admin.from('telegram_contacts').select('chat_id,name').eq('phone', phone).maybeSingle()
    if (contact.error) throw contact.error
    if (!contact.data?.chat_id) {
      const username = process.env.TELEGRAM_BOT_USERNAME || process.env.VITE_TELEGRAM_BOT_USERNAME || ''
      send(res, 409, {
        ok: false,
        error: username
          ? `Avval Telegram botda telefon raqamingizni ulang: https://t.me/${username}?start=link`
          : 'Bu raqam Telegram botga ulanmagan.',
        link: username ? `https://t.me/${username}?start=link` : '',
      })
      return
    }
    const code = String(randomInt(0, 1000000)).padStart(6, '0')
    const saved = await admin.from('phone_otps').insert({
      phone,
      code_hash: hashOtp(phone, code),
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      ip,
    })
    if (saved.error) throw saved.error
    await sendTelegram(contact.data.chat_id, `StomaHub kirish kodi: ${code}\nKod 5 daqiqa amal qiladi. Hech kimga yubormang.`)
    send(res, 200, { ok: true })
  } catch (error) {
    send(res, error.status || 500, { ok: false, error: error.message || 'Kod yuborilmadi' })
  }
}
