// Seminar manzili: matn ichidagi xarita havolasini ajratib, utm_* parametrlarini olib tashlaydi.
// Bazadagi yozuv o‘zgartirilmaydi — faqat ko‘rsatishda tozalanadi.
const URL_RE = /https?:\/\/[^\s,]+/gi

export function stripTracking(url) {
  try {
    const u = new URL(url)
    ;[...u.searchParams.keys()].forEach((k) => { if (/^utm_|^fbclid$|^gclid$/i.test(k)) u.searchParams.delete(k) })
    return u.toString()
  } catch {
    return String(url || '').replace(/[?&]utm_[^&#]*/gi, '')
  }
}

/** { text, mapUrl } — text: havolasiz manzil; mapUrl: tozalangan havola (bo‘lsa). */
export function splitAddress(raw) {
  const s = String(raw || '')
  const urls = s.match(URL_RE) || []
  const text = s.replace(URL_RE, ' ').replace(/\s*[,;]\s*(?=[,;]|$)/g, '').replace(/\s{2,}/g, ' ').replace(/^[\s,;]+|[\s,;]+$/g, '').trim()
  return { text, mapUrl: urls[0] ? stripTracking(urls[0]) : '' }
}

/** Manzil qismlarini takrorsiz birlashtiradi ("Toshkent shahri, ..., Toshkent" bo‘lmasligi uchun). */
export function joinAddress(parts) {
  const out = []
  const norm = (x) => String(x || '').toLowerCase().replace(/[‘'`ʻ’]/g, '').replace(/\b(shahri|sh\.|shahar|viloyati|vil\.)\b/g, '').replace(/[^a-zа-я0-9]+/gi, ' ').trim()
  parts.map((p) => String(p || '').trim()).filter(Boolean).forEach((p) => {
    const n = norm(p)
    if (!n) return
    if (out.some((q) => { const m = norm(q); return m === n || m.includes(n) || n.includes(m) })) return
    out.push(p)
  })
  return out.join(', ')
}

/** Telegram: "@username" ko‘rinishi va t.me havolasi (https://t.me/x, t.me/x, x, @x). */
export function telegramHandle(raw) {
  const s = String(raw || '').trim()
  if (!s) return { handle: '', url: '' }
  const m = s.match(/^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/(?:s\/)?([A-Za-z0-9_+]{3,})/i)
  const name = (m ? m[1] : s.replace(/^@+/, '')).replace(/[^A-Za-z0-9_+]/g, '')
  if (!name) return { handle: '', url: '' }
  return { handle: name.startsWith('+') ? `t.me/${name}` : `@${name}`, url: `https://t.me/${name}` }
}

/** Telefon: "+998 33 256 75 36" (O‘zbekiston raqami bo‘lmasa — o‘zgarishsiz). */
export function formatPhone(raw) {
  const s = String(raw || '').trim()
  let d = s.replace(/\D/g, '')
  if (d.startsWith('998')) d = d.slice(3)
  if (d.length !== 9) return s
  return `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`
}
