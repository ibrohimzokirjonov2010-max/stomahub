/** Ustalar — real aloqa: Telegram (t.me) va telefon (tel:). Sof funksiyalar, testlangan. */
import { normalizeTelegram, isValidTelegram } from './elonValidate.js'

const WEEKDAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr']

/** Payloaddagi telegram (@user, t.me/user, https://t.me/user) → 'user' yoki ''. */
export function ustaTelegram(m) {
  const u = normalizeTelegram(m?.telegram)
  return u && isValidTelegram(u) ? u : ''
}

/** Payloaddagi telefon → '+998XXXXXXXXX' yoki '' (to‘liq bo‘lmasa). */
export function ustaPhone(m) {
  let d = String(m?.phone || '').replace(/\D/g, '')
  if (d.length === 9) d = `998${d}`
  return d.length === 12 && d.startsWith('998') ? `+${d}` : ''
}

export function phoneLabel(e164) {
  const d = String(e164 || '').replace(/\D/g, '')
  if (d.length !== 12) return e164 || ''
  return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`
}

export function telegramChatUrl(username, text) {
  const u = normalizeTelegram(username)
  if (!u || !isValidTelegram(u)) return null
  return text ? `https://t.me/${u}?text=${encodeURIComponent(text)}` : `https://t.me/${u}`
}

export function dayLabelUz(date) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getDate()}-${MONTHS[d.getMonth()]} (${WEEKDAYS[d.getDay()]})`
}

const fmtPrice = (p) => {
  if (typeof p === 'number') return `${p.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m`
  return String(p || '').trim()
}

export function listingUrl(id, origin) {
  const o = origin ?? (typeof window !== 'undefined' ? window.location.origin : '')
  return `${o}/ustalar/${id}`
}

/** Qisqa salom — «Ustaga xabar yozish». */
export function buildUstaGreeting({ m, url }) {
  return `Assalomu alaykum, ${m.name}! StomaHub orqali e’loningizni ko‘rdim — jihoz ta’miri bo‘yicha savolim bor edi.\n${url}`
}

/** Buyurtma matni — Telegram’da oldindan to‘ldiriladi. */
export function buildUstaOrderMessage({ m, service, model, problem, date, time, address, phone, url }) {
  const lines = [
    'Assalomu alaykum! StomaHub orqali buyurtma:',
    `Xizmat: ${service?.name || '—'}${service?.priceText || service?.price ? ` — ${service.priceText || fmtPrice(service.price)}` : ''}`,
  ]
  if (String(model || '').trim()) lines.push(`Jihoz modeli: ${model.trim()}`)
  lines.push(`Muammo: ${String(problem || '').trim()}`)
  lines.push(`Qachon: ${dayLabelUz(date)}${time ? `, ${time}` : ''}`)
  lines.push(`Manzil: ${String(address || '').trim()}`)
  lines.push(`Telefon: ${phoneLabel(phone)}`)
  lines.push(`E’lon: ${url}`)
  return lines.join('\n')
}

/**
 * Tashqi havolani ochish (foydalanuvchi bosishi ichida chaqiriladi).
 * iOS PWA standalone rejimida window.open ishonchsiz — o‘sha oynada ochamiz,
 * iOS t.me universal havolasini Telegram ilovasiga uzatadi.
 */
export function openExternal(url) {
  if (!url || typeof window === 'undefined') return
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
  if (!standalone) {
    // 'noopener' bilan window.open doim null qaytaradi — shuning uchun opener'ni qo‘lda uzamiz
    const w = window.open(url, '_blank')
    if (w) {
      try { w.opener = null } catch { /* ignore */ }
      return
    }
  }
  window.location.assign(url)
}
