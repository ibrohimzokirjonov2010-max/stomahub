// Seminar dasturi kunlarga bo‘lingan holda: [{ title, date, items: [{ time, title }] }]
// seminars.form.program (jsonb) ichida saqlanadi. Eski format (tekis qatorlar) 1-kun sifatida o‘qiladi.

function toRow(r) {
  if (r == null) return null
  if (typeof r === 'string') {
    const s = r.trim()
    if (!s) return null
    const m = s.match(/^(\d{1,2}[:.]\d{2}(?:\s*[–—-]\s*\d{1,2}[:.]\d{2})?)\s*[—–-]?\s*(.*)$/)
    return m ? { time: m[1].trim(), title: m[2].trim() } : { time: '', title: s }
  }
  if (Array.isArray(r)) return { time: String(r[0] || ''), title: String(r[1] || ''), ...(r[2] ? { sub: String(r[2]) } : {}) }
  if (typeof r === 'object') return { ...r, time: String(r.time || ''), title: String(r.title || r.text || '') }
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

export function programError(raw) {
  const bad = programRows(raw).find((r) => (String(r.time).trim() || String(r.title).trim()) && !(String(r.time).trim() && String(r.title).trim()))
  return bad ? 'Dasturdagi har bir qatorda vaqt va mavzu bo‘lsin' : ''
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
