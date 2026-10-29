import { tashkentToday } from '../tashkentDate'

/**
 * Tashkilotchi kabineti uchun yagona haqiqiy manba.
 * Seminar / chipta / promo jadvallaridagi saqlangan hisoblagichlar (sold, revenue, used)
 * eskirgan yoki seed bo‘lishi mumkin — shuning uchun hamma raqam registrations,
 * payments va certificates qatorlaridan qayta hisoblanadi.
 */

// Test / E2E seminarlar: UI da yashiriladi (o‘chirish SQL — 0030_organizer_audit.sql, qo‘llanmagan)
// Faqat aniq avtomatik test yozuvlari: "E2E ..." prefiksi, "[test]" tegi, is_test bayrog‘i yoki E2E vaqt-belgisi.
// Oddiy "test"/"demo" so‘zlari bor haqiqiy seminarlar (masalan "Demo-kun: implant") yashirilmaydi.
const TEST_TITLE = /^\s*e2e[\s_:-]|\[(test|e2e)\]|img check|live new|\b\d{12,}\b/i
export function isTestSeminar(s) {
  if (s?.is_test === true || s?.isTest === true) return true
  return TEST_TITLE.test(String(s?.title || '')) || TEST_TITLE.test(String(s?.id || '').replace(/-/g, ' '))
}

/** Tugash sanasi (Toshkent vaqti) o‘tgan bo‘lsa — true. */
export function isPast(s, today = tashkentToday()) {
  const end = s?.end || s?.start
  if (!end || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return false
  return end < today
}

const LIVE = new Set(['paid', 'wait', 'unpaid'])

export function reconcileSeminar(s, participants, payments, today = tashkentToday()) {
  const people = participants.filter((p) => p.seminarId === s.id && LIVE.has(p.pay))
  const paid = payments.filter((p) => p.seminarId === s.id && p.state === 'ok')
  const sold = people.length
  const revenue = paid.reduce((n, p) => n + (Number(p.sum) || 0), 0)
  const checked = people.filter((p) => p.arrived).length
  const tickets = (s.tickets || []).map((t) => {
    const tSold = people.filter((p) => p.ticket === t.name).length
    const total = Number(t.seats || t.total) || 0
    return { ...t, sold: tSold, left: Math.max(0, total - tSold) }
  })
  const seats = tickets.reduce((n, t) => n + (Number(t.seats || t.total) || 0), 0) || s.seats || 0
  let status = s.status === 'faol' ? 'rejalashtirilgan' : s.status
  const past = isPast(s, today)
  if (past && !['bekor', 'qoralama'].includes(status)) status = 'yakunlangan'
  const BADGE = { qoralama: 'Qoralama', bekor: 'Bekor qilingan', yakunlangan: 'Yakunlangan', jarayonda: 'Jarayonda', rejalashtirilgan: 'Rejalashtirilgan' }
  return {
    ...s,
    dbStatus: s.dbStatus || s.status,
    status,
    badge: BADGE[status] || s.badge,
    past,
    regClosed: past || status === 'bekor' || status === 'yakunlangan',
    sold,
    revenue,
    checked,
    seats: Math.max(seats, sold),
    tickets,
  }
}

export function reconcilePromos(promos, payments) {
  return promos.map((p) => {
    const hits = payments.filter((x) => x.state === 'ok' && x.promo && String(x.promo).toUpperCase() === String(p.code).toUpperCase()
      && (p.seminar === 'all' || !p.seminar || x.seminarId === p.seminar))
    return {
      ...p,
      used: hits.length,
      discountSum: hits.reduce((n, x) => n + (Number(x.discount) || 0), 0),
      revenueSum: hits.reduce((n, x) => n + (Number(x.sum) || 0), 0),
    }
  })
}

/** Butun hub holatini haqiqiy qatorlar bo‘yicha moslashtiradi. */
export function reconcileHub(next, { cabinet } = {}) {
  const today = tashkentToday()
  const catalog = (next.catalog || []).filter((s) => !isTestSeminar(s)).map((s) => {
    const past = isPast(s, today)
    const status = s.status === 'faol' ? 'rejalashtirilgan' : s.status
    return past && !['bekor', 'qoralama'].includes(status)
      ? { ...s, dbStatus: s.status, status: 'yakunlangan', badge: 'Yakunlangan', past: true, regClosed: true }
      : { ...s, status, past }
  })
  if (!cabinet) return { ...next, catalog, seminars: catalog.filter((s) => (next.seminars || []).some((x) => x.id === s.id)) }
  const participants = next.participants || []
  const payments = next.payments || []
  const seminars = (next.seminars || []).map((s) => reconcileSeminar(s, participants, payments, today))
  const visible = new Set(seminars.map((s) => s.id))
  return {
    ...next,
    catalog,
    seminars,
    hiddenTests: [], // tashkilotchi kabinetida o‘z seminarlari hech qachon yashirilmaydi
    participants: participants.filter((p) => visible.has(p.seminarId)),
    payments: payments.filter((p) => visible.has(p.seminarId)),
    certs: (next.certs || []).filter((c) => visible.has(c.seminarId)),
    promos: reconcilePromos((next.promos || []).filter((p) => p.seminar === 'all' || !p.seminar || visible.has(p.seminar)), payments),
  }
}
