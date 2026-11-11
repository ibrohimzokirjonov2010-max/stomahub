const BADGE_TONE = {
  amaliy: 'bg-[#0e9aa2]',
  mix: 'bg-[#e39b2b]',
  master: 'bg-[#7b61c9]',
  online: 'bg-[#3b82f6]',
  info: 'bg-[#0e9aa2]',
}

function practiceOn(s) {
  if (s?.practice && typeof s.practice === 'object') return !!s.practice.on
  if (s?.practiceRaw?.on) return true
  return false
}

export function hasCertificate(s = {}) {
  if (Number(s.cmePoints || s.cme) > 0 || Number(s.cmeHours) > 0) return true
  const perks = []
    .concat(s.tickets || [])
    .flatMap((t) => t?.perks || [])
    .concat(s.includesList || [])
    .concat(s.perks || [])
  return perks.some((p) => /sertifikat/i.test(typeof p === 'string' ? p : p?.[0] || ''))
}

/** Format yorlig‘i — faqat seminarning o‘z maydonlaridan. Bo‘lmasa null. */
export function formatBadge(s = {}) {
  const kind = String(s.kind || s.category || '')
  const title = String(s.title || '')
  const blob = `${kind} ${title} ${s.text || ''} ${s.aboutFull || ''}`
  if (/master[\s-]*klass/i.test(`${kind} ${title}`)) return { label: 'Master-klass', tone: 'master', className: BADGE_TONE.master }
  if (/vebinar/i.test(kind) || /vebinar/i.test(title)) return { label: 'Vebinar', tone: 'online', className: BADGE_TONE.online }
  if (/konferensiya/i.test(kind)) return { label: 'Konferensiya', tone: 'info', className: BADGE_TONE.info }
  const hands = practiceOn(s)
  const theory = /nazariy/i.test(blob)
  if (hands && theory) return { label: 'Nazariy + Amaliy', tone: 'mix', className: BADGE_TONE.mix }
  if (hands || /amaliy/i.test(kind) || /amaliy/i.test(title)) return { label: 'Amaliy kurs', tone: 'amaliy', className: BADGE_TONE.amaliy }
  if (s.online || s.format === 'Online') return { label: 'Onlayn', tone: 'online', className: BADGE_TONE.online }
  if (kind && !/^tibbiy/i.test(kind)) return { label: kind, tone: 'info', className: BADGE_TONE.info }
  return null
}

export function dayCountOf(s = {}) {
  const start = s.startIso || s.start
  const end = s.endIso || s.end
  if (start && end && end > start) {
    const n = Math.round((Date.parse(end) - Date.parse(start)) / 864e5) + 1
    if (n > 0 && n < 31) return n
  }
  const n = Number(s.dayCount) || parseInt(s.days, 10) || 0
  return n > 0 ? n : 1
}

export function durationBadge(s = {}) {
  const days = dayCountOf(s)
  const intensiv = /intensiv/i.test(s.title || '')
  if (days > 1) return `${days} kunlik${intensiv ? ' intensiv' : ''} kurs`
  if (/vebinar/i.test(`${s.kind || ''} ${s.category || ''} ${s.title || ''}`)) return 'Vebinar'
  if (s.online || s.format === 'Online') return 'Onlayn seminar'
  return '1 kunlik seminar'
}

export function featureBits(s = {}) {
  const blob = `${s.title || ''} ${s.text || ''} ${s.aboutFull || ''} ${(s.learnList || []).join(' ')}`
  const bits = []
  const hands = practiceOn(s) || /amaliy/i.test(blob) || /amaliy/i.test(s.kind || s.category || '')
  if (/nazariy/i.test(blob)) bits.push('Nazariya')
  if (hands) bits.push('Amaliyot')
  if (hasCertificate(s)) bits.push('Sertifikat')
  return bits
}

export function seatsLabel(s = {}) {
  const seats = Number(s.seats)
  const left = Number(s.left)
  if (!Number.isFinite(seats) || seats <= 0 || !Number.isFinite(left)) return ''
  if (left <= 0) return 'Joy qolmadi'
  return `${left} ta joy qoldi`
}

export function dateLine(s = {}) {
  return String(s.dateLabel || '').replaceAll('–', '-')
}

/** To‘lov kodi serverdagi formula bilan bir xil: ST{yil}-{ro‘yxat id}. */
export function paymentDisplay(reg = {}) {
  const order = String(reg.order || '').trim()
  if (/^ST\d{4}-/.test(order)) return order
  const id = String(reg.personId || reg.id || '').trim()
  if (!id || /^SEM-/i.test(id)) return order
  let year = NaN
  if (reg.at) year = new Date(reg.at).getFullYear()
  else if (reg.created_at) year = new Date(reg.created_at).getFullYear()
  else if (/^\d{13}/.test(id)) year = new Date(Number(id.slice(0, 13))).getFullYear()
  if (!Number.isFinite(year) || year < 2020 || year > 2100) return order
  return `ST${year}-${id}`
}

/** QR matni check-in skaneri topadigan kodni o‘z ichiga oladi (registrations.code yoki to‘lov id). */
export function ticketQrText({ code, order, checkin } = {}) {
  const ready = String(checkin || '').trim()
  if (ready) return ready
  const c = String(code || '').trim()
  const o = String(order || '').trim()
  if (c && o && c !== o) return `STH:${c}|${o}`
  if (c) return c.startsWith('STH:') ? c : `STH:${c}`
  if (o) return o.startsWith('STH:') ? o : `STH:${o}`
  return ''
}

export function ticketDisplayCode({ code, order } = {}) {
  const o = String(order || '').trim()
  const c = String(code || '').trim()
  if (/^ST\d{4}-/.test(o)) return o
  return c || o
}

export function ticketStatus(reg = {}) {
  if (!reg || typeof reg !== 'object') return null
  const pay = String(reg.pay || '')
  if (pay === 'cancel' || reg.cancelled) return { label: 'Bekor qilingan', tone: 'bad' }
  const price = Number(reg.price)
  const free = price === 0 || reg.method === 'free'
  if (!free && (reg.pending === true || pay === 'wait') && !reg.paidConfirmed && pay !== 'paid') {
    return { label: 'Kutilmoqda', tone: 'wait' }
  }
  if (free || pay === 'paid' || reg.paidConfirmed || reg.pending === false) return { label: 'Tasdiqlangan', tone: 'ok' }
  if (reg.order || reg.code) return price > 0 ? { label: 'Kutilmoqda', tone: 'wait' } : { label: 'Tasdiqlangan', tone: 'ok' }
  return null
}

function icsEscape(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

function icsStamp(iso, hm) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return ''
  const [h = '00', min = '00'] = String(hm || '00:00').split(':')
  return `${m[1]}${m[2]}${m[3]}T${String(h).padStart(2, '0')}${String(min || '00').padStart(2, '0')}00`
}

export function buildIcs(view) {
  if (!view?.title) return ''
  const start = icsStamp(view.startIso, view.from)
  const end = icsStamp(view.endIso || view.startIso, view.to)
  if (!start) return ''
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//StomaHub//Seminar//UZ',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${icsEscape(view.id || 'seminar')}-${icsEscape(view.code || 'ticket')}@stomahub.uz`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    end ? `DTEND:${end}` : '',
    `SUMMARY:${icsEscape(view.title)}`,
    view.place ? `LOCATION:${icsEscape(view.place)}` : '',
    `DESCRIPTION:${icsEscape([view.code && `Chipta: ${view.code}`, 'StomaHub'].filter(Boolean).join('\n'))}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].filter(Boolean).join('\r\n')
}

export function googleCalendarUrl(view) {
  const start = icsStamp(view?.startIso, view?.from)
  const end = icsStamp(view?.endIso || view?.startIso, view?.to)
  if (!start) return ''
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: view.title || 'Seminar',
    dates: `${start}/${end || start}`,
    details: view.code ? `Chipta: ${view.code}` : 'StomaHub',
    location: view.place || '',
  })
  return `https://calendar.google.com/calendar/render?${q.toString()}`
}
