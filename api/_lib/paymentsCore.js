// Sof (DB’siz) to‘lov yordamchilari — unit testlar shu faylni tekshiradi (tests/payments.test.mjs).
import crypto from 'node:crypto'

export function md5(s) { return crypto.createHash('md5').update(String(s), 'utf8').digest('hex') }
export function sha1(s) { return crypto.createHash('sha1').update(String(s), 'utf8').digest('hex') }

export function safeEqual(a, b) {
  const x = Buffer.from(String(a || '').toLowerCase())
  const y = Buffer.from(String(b || '').toLowerCase())
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y)
}

/**
 * Click SHOP API imzosi (docs.click.uz/click-api-request):
 *  Prepare (action=0):  md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)
 *  Complete (action=1): md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + merchant_prepare_id + amount + action + sign_time)
 * amount — Click yuborgan satr aynan o‘zi (masalan "1000.00"); Number() ga aylantirilmaydi.
 */
export function clickSignString(body, secret) {
  const b = body || {}
  const action = String(b.action ?? '')
  const parts = [b.click_trans_id, b.service_id, secret, b.merchant_trans_id]
  if (action === '1') parts.push(b.merchant_prepare_id)
  parts.push(b.amount, b.action, b.sign_time)
  return md5(parts.map((p) => String(p ?? '')).join(''))
}

export function verifyClickSign(body, secret) {
  if (!secret || !body?.sign_string) return false
  return safeEqual(clickSignString(body, secret), body.sign_string)
}

/** Payme Merchant API: Authorization: Basic base64("Paycom:" + KEY) */
export function paymeAuthOk(header, key) {
  if (!key) return false
  const h = String(header || '')
  if (!/^Basic\s+/i.test(h)) return false
  let decoded = ''
  try { decoded = Buffer.from(h.replace(/^Basic\s+/i, ''), 'base64').toString('utf8') } catch { return false }
  const i = decoded.indexOf(':')
  if (i < 0) return false
  const login = decoded.slice(0, i)
  const pass = decoded.slice(i + 1)
  return login === 'Paycom' && safeEqual(pass, key)
}

/** Click Merchant API (reversal va b.): Auth: merchant_user_id:sha1(timestamp + secret_key):timestamp */
export function clickMerchantAuth(merchantUserId, secret, ts = Math.floor(Date.now() / 1000)) {
  const t = String(ts)
  return `${merchantUserId}:${sha1(t + secret)}:${t}`
}

export function clickPayUrl({ serviceId, merchantId, amount, orderCode, returnUrl }) {
  const q = new URLSearchParams({ service_id: String(serviceId), merchant_id: String(merchantId), amount: String(amount), transaction_param: String(orderCode) })
  if (returnUrl) q.set('return_url', returnUrl)
  return `https://my.click.uz/services/pay?${q.toString()}`
}

/** Payme checkout (GET): base64("m=ID;ac.order_id=CODE;a=TIYIN;c=RETURN") */
export function paymePayUrl({ merchantId, amountSom, orderCode, returnUrl, test = false }) {
  const parts = [`m=${merchantId}`, `ac.order_id=${orderCode}`, `a=${Math.round(Number(amountSom) * 100)}`]
  if (returnUrl) parts.push(`c=${returnUrl}`)
  const base = test ? 'https://checkout.test.paycom.uz/' : 'https://checkout.paycom.uz/'
  return base + Buffer.from(parts.join(';'), 'utf8').toString('base64')
}

export const PAYME_TIMEOUT_MS = 12 * 60 * 60 * 1000

/** Payme tranzaksiya holati: 1 yaratilgan, 2 bajarilgan, -1 bajarilmasdan bekor, -2 bajarilgandan keyin bekor */
export function paymeState(tx) {
  if (!tx) return 0
  if (tx.state === 'paid') return 2
  if (tx.state === 'refunded') return -2
  if (tx.state === 'cancelled' || tx.state === 'failed') return tx.perform_time ? -2 : -1
  return 1
}

export function amountsEqual(a, b) { return Math.abs(Number(a) - Number(b)) < 0.005 }
