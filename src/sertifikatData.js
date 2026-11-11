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

// Kurs sertifikati (SH-KURS / course:) — ball. Seminar CME si o‘z holicha qoladi.
export function isCourseCertificate(c) {
  const courseId = String(c?.courseId || c?.course_id || '')
  const code = String(c?.code || '')
  return courseId.startsWith('course:') || code.startsWith('SH-KURS-')
}

export function pointsBadge(c) {
  const n = Number(c?.cme) || 0
  if (n <= 0) return ''
  return isCourseCertificate(c) ? `${n} ball` : `${n} CME`
}

// "6 soat · 6 CME" yoki kurs uchun "6 soat · 6 ball". Noma’lum qiymat yashiriladi.
export function hoursLine(c) {
  return [Number(c?.hours) > 0 ? `${Number(c.hours)} soat` : '', pointsBadge(c)].filter(Boolean).join(' · ')
}

export function accreditedCme(rows) {
  return (rows || []).reduce((sum, row) => sum + (isCourseCertificate(row) ? 0 : (Number(row?.cme) || 0)), 0)
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
