import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

export function verifyTelegramLogin(data, botToken = process.env.TELEGRAM_BOT_TOKEN) {
  if (!data || !botToken || !data.hash) return false
  const hash = String(data.hash)
  const check = Object.keys(data)
    .filter((key) => key !== 'hash' && data[key] !== undefined && data[key] !== null && data[key] !== '')
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('\n')
  const secret = createHash('sha256').update(botToken).digest()
  const hmac = createHmac('sha256', secret).update(check).digest('hex')
  const a = Buffer.from(hmac)
  const b = Buffer.from(hash)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false
  const authDate = Number(data.auth_date || 0)
  if (!authDate || Date.now() / 1000 - authDate > 60 * 60 * 24) return false
  return true
}

export function telegramEmail(id) {
  return `tg${id}@telegram.stomahub.uz`
}

export async function sendTelegram(chatId, text, extra = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    const error = new Error('TELEGRAM_BOT_TOKEN sozlanmagan')
    error.status = 503
    throw error
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, ...extra }),
  })
  const json = await res.json().catch(() => ({}))
  if (!json.ok) {
    const error = new Error(json.description || 'Telegram xabar yuborilmadi')
    error.status = 502
    throw error
  }
  return json
}
