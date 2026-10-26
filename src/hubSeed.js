import {
  ACTIVITY, CERTS, FACES, IMG, ORG, PARTICIPANTS, PROMOS, REVIEWS, SEMINARS, WIZARD_SPEAKERS,
} from './organizer/data.js'

export const DEMO_ORGANIZER_ID = '11111111-1111-4111-8111-111111111111'
export const DEMO_ORGANIZER_EMAIL = 'organizer@stomahub.uz'
export const DEMO_ORGANIZER_PASSWORD = 'StomaHub-demo-2026'

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
const TICKET_PRICE = { VIP: 2500000, 'VIP chipta': 2500000, Standart: 1200000, 'Standart chipta': 1200000, Student: 800000, 'Student chipta': 800000, Guruh: 1000000, 'Guruh chipta': 1000000 }
const METHODS = ['Payme', 'Click', 'Uzum', 'Paynet']

function isoFromLabel(label) {
  const m = String(label || '').toLowerCase().match(/(\d{1,2})-([a-zʻ'’]+)\s+(\d{4})/)
  if (!m) return '2026-11-24'
  const idx = MONTHS.findIndex((name) => name.startsWith(m[2].slice(0, 3)))
  return `${m[3]}-${String((idx >= 0 ? idx : 10) + 1).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`
}

function ticketPrice(name) {
  return TICKET_PRICE[name] || 450000
}

function enrichSeminar(s) {
  const start = isoFromLabel(s.date)
  const price = s.sold ? Math.max(250000, Math.round(s.revenue / s.sold / 10000) * 10000) : 450000
  return {
    ...s,
    published: true,
    held: s.status === 'yakunlangan',
    about: `${s.title}. ${s.days}. ${s.speaker} ishtirokida.`,
    formatDetail: 'Offline (joyida)',
    category: 'Tibbiy amaliy seminar',
    tags: [s.topic],
    cover: s.image,
    start,
    startTime: '10:00',
    end: start,
    endTime: '18:00',
    place: `${s.city}, Congress Hall`,
    address: `${s.city}`,
    placeImg: IMG.hall2,
    template: 'teal',
    checked: 0,
    tickets: [{
      id: `${s.id}-std`, name: 'Standart', price, seats: s.seats, total: s.seats, sold: s.sold,
      left: Math.max(0, s.seats - s.sold), active: true, perks: ['Seminarga kirish', 'Sertifikat'], icon: 'gem', note: 'Asosiy chipta',
    }],
    speakers: [{ id: `sp-${s.id}`, name: s.speaker, role: s.topic, city: s.city, avatar: FACES[10], bio: s.days }],
    wizardPromos: [],
  }
}

/** Demo kabinet holati. localStorage o‘rniga Supabase urug‘i ham shu obyektdan olinadi. */
export function buildSeed() {
  const seminars = SEMINARS.map(enrichSeminar)
  const ids = seminars.map((s) => s.id)
  const participants = PARTICIPANTS.map((p, i) => ({
    ...p,
    seminarId: ids[i % ids.length],
    arrived: false,
    code: `QR-${String(p.id).padStart(4, '0')}`,
  }))
  const payments = participants
    .filter((p) => p.pay === 'paid' || p.pay === 'wait' || p.pay === 'cancel')
    .map((p) => {
      const sem = seminars.find((s) => s.id === p.seminarId)
      const state = p.pay === 'paid' ? 'ok' : p.pay === 'wait' ? 'wait' : 'cancel'
      return {
        id: `ST2026-${String(p.id).padStart(3, '0')}`,
        who: p.name,
        clinic: p.clinic,
        seminar: sem?.title || '',
        seminarId: p.seminarId,
        sum: ticketPrice(p.ticket),
        method: METHODS[p.id % METHODS.length],
        state,
        phone: p.phone,
        email: p.email,
        ticket: p.ticket,
        when: p.registered,
        avatar: p.avatar,
        face: (p.id - 1) % 8,
        participantId: p.id,
      }
    })
  seminars.forEach((s) => {
    const mine = participants.filter((p) => p.seminarId === s.id)
    const paid = payments.filter((p) => p.seminarId === s.id && p.state === 'ok')
    s.sold = mine.filter((p) => p.pay === 'paid' || p.pay === 'wait').length
    s.seats = Math.max(s.seats, s.sold)
    s.revenue = paid.reduce((n, p) => n + p.sum, 0)
    s.checked = mine.filter((p) => p.arrived).length
    if (s.tickets[0]) {
      s.tickets[0].sold = s.sold
      s.tickets[0].seats = s.seats
      s.tickets[0].total = s.seats
      s.tickets[0].left = Math.max(0, s.seats - s.sold)
    }
  })
  return {
    v: 1,
    seminars,
    participants,
    payments,
    promos: [
      ...PROMOS.map((p, i) => ({ ...p, seminar: i % 5 === 0 ? 'endo' : 'implant-nov' })),
      { id: 'stoma10', code: 'STOMA10', name: 'STOMA10', kind: 'foiz', value: 10, used: 0, limit: 500, status: 'faol', seminar: 'all', from: 'bugun', to: 'ochiq' },
      { id: 'doctor20', code: 'DOCTOR20', name: 'DOCTOR20', kind: 'foiz', value: 20, used: 0, limit: 500, status: 'faol', seminar: 'all', from: 'bugun', to: 'ochiq' },
      { id: 'stomahub', code: 'STOMAHUB', name: 'STOMAHUB', kind: 'foiz', value: 15, used: 0, limit: 500, status: 'faol', seminar: 'all', from: 'bugun', to: 'ochiq' },
      { id: 'early-live', code: 'EARLYBIRD', name: 'Early bird', kind: 'foiz', value: 20, used: 12, limit: 200, status: 'faol', seminar: 'all', from: 'bugun', to: 'ochiq' },
    ],
    certs: CERTS.map((c) => ({ ...c, seminarId: 'implant-nov' })),
    withdrawals: [],
    requisites: [{ id: '4521', label: 'Karta **** 4521', detail: 'Humo · 04/28' }],
    activity: ACTIVITY.map((a) => ({ ...a })),
    reviews: REVIEWS.map((r) => ({ ...r })),
    speakers: WIZARD_SPEAKERS.map((s) => ({ ...s })),
    settings: { name: ORG.name, email: 'ibrohim@stomahub.uz', notes: true, city: ORG.city },
    marketing: { push: true, email: true, telegram: false, budget: '150 000' },
    qrSound: true,
    messages: [],
  }
}
