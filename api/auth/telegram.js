import { readJson, requirePost, send } from '../_lib/http.js'
import { issueSession } from '../_lib/session.js'
import { telegramEmail, verifyTelegramLogin } from '../_lib/telegram.js'

export default async function handler(req, res) {
  if (!requirePost(req, res)) return
  try {
    const body = await readJson(req)
    const user = body.user && typeof body.user === 'object' ? body.user : body
    const fields = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      photo_url: user.photo_url,
      auth_date: user.auth_date,
      hash: user.hash,
    }
    if (!verifyTelegramLogin(fields)) {
      send(res, 401, { ok: false, error: 'Telegram imzosi tasdiqlanmadi' })
      return
    }
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
    const session = await issueSession({
      email: telegramEmail(user.id),
      name,
      telegramId: Number(user.id),
      role: body.role,
    })
    send(res, 200, { ok: true, ...session })
  } catch (error) {
    send(res, error.status || 500, { ok: false, error: error.message || 'Telegram orqali kirib bo‘lmadi' })
  }
}
