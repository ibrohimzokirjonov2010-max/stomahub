/** E'lonlar (classifieds) validation — pure, unit-tested. */

const TG_RE = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/

/** Strip @ and t.me/ prefixes; return bare username or ''. */
export function normalizeTelegram(raw) {
  let s = String(raw || '').trim()
  if (!s) return ''
  s = s.replace(/^@+/, '')
  s = s.replace(/^(https?:\/\/)?(www\.)?(t\.me|telegram\.me)\//i, '')
  s = s.replace(/^@+/, '')
  s = s.replace(/\/+$/, '').split(/[?#]/)[0]
  return s.trim()
}

export function isValidTelegram(raw) {
  const u = normalizeTelegram(raw)
  if (!u) return true // optional
  return TG_RE.test(u)
}

export function telegramUrl(raw) {
  const u = normalizeTelegram(raw)
  if (!u || !TG_RE.test(u)) return null
  return `https://t.me/${u}`
}

/** Returns { field: message } for invalid fields. */
export function validateAd(data) {
  const errs = {}
  const title = String(data?.title || '').trim()
  const deal = data?.deal || 'sale'
  const isJob = deal === 'job'
  const price = Number(String(data?.price ?? '').replace(/\D/g, '')) || 0
  const priceMax = Number(String(data?.priceMax ?? '').replace(/\D/g, '')) || 0
  const phoneDigits = String(data?.phone || '').replace(/\D/g, '')
  if (title.length < 3) errs.title = 'Sarlavhani kiriting (kamida 3 belgi)'
  if (!price || price < 0) errs.price = isJob ? 'Maoshni kiriting' : 'Narxni kiriting'
  if (isJob && priceMax > 0 && priceMax < price) errs.price = 'Maosh oralig‘i noto‘g‘ri'
  if (phoneDigits.length !== 12) errs.phone = 'Telefon raqamini to‘liq kiriting (+998…)'
  if (data?.telegram != null && String(data.telegram).trim() && !isValidTelegram(data.telegram)) {
    errs.telegram = 'Telegram username noto‘g‘ri (masalan: doctor_ali)'
  }
  if (data?.expires) {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const iso = `${y}-${m}-${d}`
    if (String(data.expires) < iso) errs.expires = 'Muddat o‘tgan sana bo‘lmasin'
  }
  const files = data?.files
  if (Array.isArray(files) && files.some((f) => f && f.size > 5 * 1024 * 1024)) {
    errs.image = 'Har bir rasm 5 MB dan oshmasin'
  }
  return errs
}

export function isAdPublic(row) {
  if (!row) return false
  if (row._pending || row.hidden) return false
  const status = row.status || 'active'
  if (status !== 'active') return false
  if (row.expires) {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    if (String(row.expires) < `${y}-${m}-${d}`) return false
  }
  return true
}

export function isAdExpired(row) {
  if (!row?.expires) return false
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return String(row.expires) < `${y}-${m}-${d}`
}
