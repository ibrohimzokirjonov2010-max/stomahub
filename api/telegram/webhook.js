import { adminClient } from '../_lib/supabaseAdmin.js'
import { readJson, send } from '../_lib/http.js'
import { normalizePhone } from '../_lib/phone.js'
import { sendTelegram } from '../_lib/telegram.js'

const CONTACT_KEYBOARD = {
  reply_markup: {
    keyboard: [[{ text: 'Telefon raqamni ulashish', request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    send(res, 200, { ok: true })
    return
  }
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secret && req.headers['x-telegram-bot-api-secret-token'] !== secret) {
    send(res, 401, { ok: false })
    return
  }
  try {
    const update = await readJson(req)
    const message = update.message || update.edited_message
    if (!message?.chat?.id) {
      send(res, 200, { ok: true })
      return
    }
    const text = String(message.text || '')
    if (text.startsWith('/start')) {
      await sendTelegram(
        message.chat.id,
        'StomaHub botiga xush kelibsiz. Telefon orqali kirish kodi shu yerga keladi. Raqamingizni ulash uchun pastdagi tugmani bosing.',
        CONTACT_KEYBOARD,
      )
      send(res, 200, { ok: true })
      return
    }
    if (message.contact?.phone_number) {
      const phone = normalizePhone(message.contact.phone_number)
      if (!phone) {
        await sendTelegram(message.chat.id, 'Bu telefon raqami qo‘llab-quvvatlanmaydi. +998 raqamini yuboring.')
        send(res, 200, { ok: true })
        return
      }
      const name = [message.from?.first_name, message.from?.last_name].filter(Boolean).join(' ')
      const admin = adminClient()
      const saved = await admin.from('telegram_contacts').upsert({
        phone,
        telegram_id: message.contact.user_id || message.from?.id || null,
        chat_id: message.chat.id,
        name,
        linked_at: new Date().toISOString(),
      })
      if (saved.error) throw saved.error
      await sendTelegram(message.chat.id, `Raqam ulandi: ${phone}. Endi StomaHub’da shu raqam bilan kod so‘rashingiz mumkin.`)
    }
    send(res, 200, { ok: true })
  } catch (error) {
    send(res, error.status || 500, { ok: false, error: error.message || 'Webhook xatosi' })
  }
}
