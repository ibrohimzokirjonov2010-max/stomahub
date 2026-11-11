export const OWNER = ''

export const TYPES = [
  { id: 'all', label: 'Barchasi' },
  { id: 'seminar', label: 'Seminarlar' },
  { id: 'online', label: 'Onlayn darslar' },
  { id: 'webinar', label: 'Vebinarlar' },
  { id: 'training', label: 'Amaliy treninglar' },
  { id: 'cme', label: 'CME ballari' },
]

export const TYPE_LABEL = { seminar: 'Seminar', online: 'Onlayn kurs', webinar: 'Vebinar', training: 'Amaliy trening' }
export const TYPE_LINE = { seminar: 'seminarida ishtirok etgan', online: 'onlayn kursini muvaffaqiyatli yakunlagan', webinar: 'mavzusidagi vebinarni muvaffaqiyatli yakunlagan', training: 'amaliy treningini muvaffaqiyatli yakunlagan' }

export const certs = []

export const STATS = { count: 0, cme: 0, done: 0 }

const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
// '2026-11-04' → '4-noyabr 2026' (xom ISO hech qachon ko‘rsatilmaydi)
export function uzDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''))
  if (!m) return String(iso || '')
  return `${Number(m[3])}-${UZ_MONTHS[Number(m[2]) - 1]} ${m[1]}`
}

// "6 soat · 6 CME" — noma’lum qiymatlar yashiriladi; ikkalasi ham bo‘lmasa '' (hech qachon "0 soat · 0 CME").
export function hoursLine(c) {
  return [Number(c?.hours) > 0 ? `${Number(c.hours)} soat` : '', Number(c?.cme) > 0 ? `${Number(c.cme)} CME` : ''].filter(Boolean).join(' · ')
}

// customer_certificates qatori → UI sertifikati (desktop + mobil bir xil manba)
export function certFromRow(c, i = 0) {
  const courseId = String(c.courseId || c.course_id || '')
  const isSeminar = courseId.startsWith('seminar:') || c.kind === 'seminar'
  const iso = String(c.issuedAt || c.issued_at || '').slice(0, 10)
  const kind = c.kind && TYPE_LINE[c.kind] ? c.kind : (isSeminar ? 'seminar' : 'online')
  const online = kind !== 'seminar' ? true : /onlayn|online/i.test(String(c.format || ''))
  return {
    id: c.id || `cert-${i}`,
    order: i + 1,
    title: c.title || 'Sertifikat',
    type: kind,
    speaker: c.speaker || '',
    date: uzDate(iso),
    iso: iso || '1970-01-01',
    place: kind === 'seminar' ? (online ? 'Onlayn' : (c.place || 'Seminar')) : 'Onlayn',
    cme: Number(c.cme) || 0,
    hours: Number(c.hours) || 0,
    holderName: c.holderName || c.holder_name || '',
    scorePct: Number(c.scorePct ?? c.score_pct) || 0,
    code: c.code || '',
    theme: 'teal',
    fileUrl: c.fileUrl || c.file_url || '',
    courseId,
  }
}
