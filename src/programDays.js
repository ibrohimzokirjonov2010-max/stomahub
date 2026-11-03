// Seminar dasturi kunlarga bo‘lingan holda: [{ title, date, items: [{ time, title }] }]
// seminars.form.program (jsonb) ichida saqlanadi. Eski format (tekis qatorlar) 1-kun sifatida o‘qiladi.

const TIME_RE = /^(\d{1,2}[:.]\d{2}(?:\s*[–—-]\s*\d{1,2}[:.]\d{2})?)(?:\s*[—–-]\s*|\s+)(.+)$/
// '10:00–10:30 — Mavzu' → { time, title }; vaqt bo‘lmasa — null
export function splitTimeTitle(str) {
  const m = String(str || '').trim().match(TIME_RE)
  return m && m[2].trim() ? { time: m[1].trim(), title: m[2].trim() } : null
}
// Bitta maydonga yozilgan eski qatorni ajratish
function fixRow(row) {
  const t = String(row.time || '').trim(), ti = String(row.title || '').trim()
  if (t && ti) {
    const sp = splitTimeTitle(t)
    return sp ? { ...row, time: sp.time } : row
  }
  const sp = splitTimeTitle(t || ti)
  return sp ? { ...row, ...sp } : row
}

function toRow(r) {
  if (r == null) return null
  if (typeof r === 'string') {
    const s = r.trim()
    if (!s) return null
    return splitTimeTitle(s) || { time: '', title: s }
  }
  if (Array.isArray(r)) return fixRow({ time: String(r[0] || ''), title: String(r[1] || ''), ...(r[2] ? { sub: String(r[2]) } : {}) })
  if (typeof r === 'object') return fixRow({ ...r, time: String(r.time || ''), title: String(r.title || r.text || r.topic || '') })
  return null
}

const isDay = (x) => x && typeof x === 'object' && !Array.isArray(x) && Array.isArray(x.items)

export function normalizeProgram(raw) {
  if (!Array.isArray(raw) || !raw.length) return []
  if (raw.some(isDay)) {
    const days = []
    let loose = null
    for (const x of raw) {
      if (isDay(x)) {
        loose = null
        days.push({ title: String(x.title || ''), date: String(x.date || ''), items: x.items.map(toRow).filter(Boolean) })
      } else {
        const row = toRow(x)
        if (!row) continue
        if (!loose) { loose = { title: '', date: '', items: [] }; days.push(loose) }
        loose.items.push(row)
      }
    }
    return days
  }
  const items = raw.map(toRow).filter(Boolean)
  return items.length ? [{ title: '', date: '', items }] : []
}

export const programRows = (raw) => normalizeProgram(raw).flatMap((d) => d.items)

// Saqlashdan oldin: bo‘sh qatorlar va bo‘sh kunlar olib tashlanadi
export function cleanProgram(raw) {
  return normalizeProgram(raw)
    .map((d) => ({ ...d, title: d.title.trim(), items: d.items.filter((r) => String(r.time).trim() || String(r.title).trim()) }))
    .filter((d) => d.items.length || d.title)
}

// Faqat vaqt yoki faqat mavzu bor qator — xato. Bo‘sh qatorlar/kunlar e’tiborsiz (saqlashda tashlanadi)
export function programErrorAt(raw) {
  const days = normalizeProgram(raw)
  for (let d = 0; d < days.length; d++) {
    for (let r = 0; r < days[d].items.length; r++) {
      const x = days[d].items[r]
      const t = String(x.time).trim(), ti = String(x.title).trim()
      if ((t || ti) && !(t && ti)) return { day: d, row: r, missing: t ? 'title' : 'time' }
    }
  }
  return null
}

export function programError(raw) {
  const e = programErrorAt(raw)
  return e ? `Dasturdagi ${e.day + 1}-kun, ${e.row + 1}-qatorda ${e.missing === 'time' ? 'vaqt' : 'mavzu'} yetishmayapti` : ''
}

// Step 2 sanalaridan kunlar soni (1..14)
export function dayCount(start, end) {
  if (!start || !end) return 1
  const a = Date.parse(start), b = Date.parse(end)
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 1
  return Math.min(14, Math.round((b - a) / 86400000) + 1)
}

export function addDaysIso(start, n) {
  const t = Date.parse(start)
  if (!Number.isFinite(t)) return ''
  return new Date(t + n * 86400000).toISOString().slice(0, 10)
}

// Sanani har qanday saqlangan ko‘rinishdan YYYY-MM-DD ga o‘tkazish ('' — noto‘g‘ri/qisman)
const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
const monthIdx = (w) => {
  const s = String(w).toLowerCase().replace(/[‘’'`ʻ]/g, '')
  if (s.startsWith('sent')) return 8
  return UZ_MONTHS.findIndex((m) => s.startsWith(m.slice(0, 3)))
}
const pad = (n) => String(n).padStart(2, '0')
const valid = (y, m, d) => {
  const t = new Date(Date.UTC(y, m - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d ? `${y}-${pad(m)}-${pad(d)}` : ''
}
export function parseDateLoose(v, fallbackYear) {
  const s = String(v || '').trim()
  if (!s) return ''
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return valid(+m[1], +m[2], +m[3])
  m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/)
  if (m) return valid(+m[3], +m[2], +m[1])
  m = s.match(/^(\d{1,2})\s*[-–\s]\s*([A-Za-z‘’'`ʻ]+)\.?(?:\s+(\d{4}))?/)
  if (m) {
    const mi = monthIdx(m[2])
    const y = m[3] ? +m[3] : fallbackYear ? +fallbackYear : 0
    return mi >= 0 && y ? valid(y, mi + 1, +m[1]) : ''
  }
  return ''
}

// Kun sanalarini boshlanish sanasidan hosil qilish: N-kun = start + (N-1).
// Bo‘sh/noto‘g‘ri sana to‘ldiriladi; prevStart berilsa, avtomatik (eski start bo‘yicha) sanalar suriladi.
export function withDayDates(days, start, prevStart) {
  const s = parseDateLoose(start)
  const p = parseDateLoose(prevStart)
  const year = s ? s.slice(0, 4) : undefined
  return days.map((d, i) => {
    const iso = parseDateLoose(d.date, year)
    if (!s) return iso === d.date ? d : { ...d, date: iso }
    const auto = addDaysIso(s, i)
    const date = !iso || (p && p !== s && iso === addDaysIso(p, i)) ? auto : iso
    return date === d.date ? d : { ...d, date }
  })
}

// '12–13-noyabr 2026', '30-noyabr – 2-dekabr 2026', '12-noyabr 2026'
export function dateRangeLabel(start, end) {
  const a = parseDateLoose(start), b = parseDateLoose(end)
  if (!a) return ''
  const [ay, am, ad] = a.split('-').map(Number)
  const one = (y, m, d) => `${d}-${UZ_MONTHS[m - 1]}`
  if (!b || b <= a) return `${one(ay, am, ad)} ${ay}`
  const [by, bm, bd] = b.split('-').map(Number)
  if (ay !== by) return `${one(ay, am, ad)} ${ay} – ${one(by, bm, bd)} ${by}`
  if (am !== bm) return `${one(ay, am, ad)} – ${one(by, bm, bd)} ${by}`
  return `${ad}–${bd}-${UZ_MONTHS[am - 1]} ${ay}`
}
