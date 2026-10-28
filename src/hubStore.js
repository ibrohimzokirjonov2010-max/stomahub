import { useSyncExternalStore } from 'react'
import { FACES, IMG } from './organizer/data'
import { seminars as CATALOG } from './seminarsData'
import { friendlySupabaseError, supabase } from './supabaseClient'
import { tashkentClock, tashkentDate } from './time'
import {
  pullHub, pushCancel, pushCert, pushDeleteSeminar, pushVisibility, pushCheckIn, pushConfirm, pushDuplicate, pushMessage,
  pushParticipant, pushPromo, pushRefund, pushRemoveParticipant, pushRequisite, pushSeminar,
  pushSettingsBundle, pushSpeaker, pushTickets, pushWithdraw, remoteRegister, subscribeHub,
} from './hubRemote'

export const FEE = 0.12

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
const MON_CODE = ['YAN', 'FEV', 'MAR', 'APR', 'MAY', 'IYN', 'IYL', 'AVG', 'SEN', 'OKT', 'NOY', 'DEK']
const WEEK = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
const TOPIC_CAT = {
  Implantologiya: 'impl', Endodontiya: 'endo', Ortodontiya: 'orto', Estetika: 'estet',
  Jarrohlik: 'surg', Bolalar: 'other', Parodontologiya: 'paro',
}
const listeners = new Set()

function isoFromLabel(label) {
  const m = String(label || '').toLowerCase().match(/(\d{1,2})-([a-zʻ'’]+)\s+(\d{4})/)
  if (!m) return '2026-11-24'
  const idx = MONTHS.findIndex((name) => name.startsWith(m[2].slice(0, 3)))
  return `${m[3]}-${String((idx >= 0 ? idx : 10) + 1).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`
}

export function uzLong(iso) {
  if (!iso || !iso.includes('-')) return iso || ''
  const [y, m, d] = iso.split('-').map(Number)
  return `${d}-${MONTHS[(m || 1) - 1]} ${y}`
}

function cityOf(place, address, fallback = 'Toshkent') {
  const blob = `${place || ''} ${address || ''}`
  return ['Toshkent', 'Samarqand', 'Buxoro', 'Andijon', 'Farg‘ona', 'Namangan', 'Nukus'].find((c) => blob.includes(c)) || fallback
}

const EMPTY = {
  v: 1,
  seminars: [],
  catalog: [],
  participants: [],
  payments: [],
  promos: [],
  certs: [],
  withdrawals: [],
  requisites: [],
  activity: [],
  reviews: [],
  speakers: [],
  settings: { name: '', email: '', notes: true, city: 'Toshkent' },
  marketing: { push: true, email: true, telegram: false, budget: '' },
  qrSound: true,
  messages: [],
  myRegistrations: [],
  loading: true,
  ready: false,
  error: '',
}

export function newestSeminar(list) {
  const rows = list || []
  if (!rows.length) return null
  return rows.reduce((best, s) => ((Number(s.updatedAt) || 0) > (Number(best.updatedAt) || 0) ? s : best))
}

let state = { ...EMPTY }
let epoch = 0
let refreshTimer = null
let stopListen = () => {}

function commit(next) {
  state = next
  listeners.forEach((l) => l())
}

function publishMine(rows) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('stomahub-registrations', { detail: rows || [] }))
}

function scheduleRefresh() {
  const seen = epoch
  clearTimeout(refreshTimer)
  refreshTimer = setTimeout(async () => {
    try {
      const next = await pullHub()
      if (seen !== epoch) return
      commit({ ...next, loading: false, ready: true, error: '' })
      publishMine(next.myRegistrations)
    } catch (error) {
      if (seen !== epoch) return
      commit({ ...state, loading: false, ready: true, error: friendlySupabaseError(error) })
    }
  }, 250)
}

function remote(task) {
  const seen = epoch
  Promise.resolve().then(task).then(() => {
    if (seen === epoch) scheduleRefresh()
  }).catch((error) => {
    commit({ ...state, error: friendlySupabaseError(error) })
    scheduleRefresh()
  })
}

export function retryHub() {
  return hydrate()
}

async function hydrate() {
  const seen = epoch
  commit({ ...state, loading: true, error: '' })
  try {
    const next = await pullHub()
    if (seen !== epoch) return
    commit({ ...next, loading: false, ready: true, error: '' })
    publishMine(next.myRegistrations)
  } catch (error) {
    if (seen !== epoch) return
    commit({ ...state, loading: false, ready: true, error: friendlySupabaseError(error) })
  }
}

function boot() {
  if (!supabase) {
    commit({ ...EMPTY, loading: false, ready: true, error: 'Supabase sozlanmagan. VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY ni kiriting.' })
    return
  }
  const listen = () => {
    stopListen()
    stopListen = subscribeHub(() => scheduleRefresh())
  }
  listen()
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
      listen()
      hydrate()
    }
  })
}
boot()

function patch(fn) {
  epoch += 1
  commit(fn(state))
}

function rememberSettings() {
  const snap = getHub()
  remote(() => pushSettingsBundle({ settings: snap.settings, marketing: snap.marketing, qrSound: snap.qrSound }))
}

const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function getHub() { return state }
export function useHub() {
  return useSyncExternalStore(subscribe, getHub)
}

function nowLabel() {
  return tashkentClock()
}

function pushActivity(list, item) {
  return [{ ...item, time: item.time || nowLabel() }, ...list].slice(0, 24)
}

export function saveSeminar(form, { publish, id } = {}) {
  const name = String(form.name || '').trim()
  if (name.length < 3) return { ok: false, error: 'Seminar nomini kiriting' }
  if (String(form.about || '').trim().length < 10) return { ok: false, error: 'Qisqa tavsif kamida 10 belgi bo‘lsin' }
  if (!form.start) return { ok: false, error: 'Sana kiriting' }
  if (!String(form.place || '').trim()) return { ok: false, error: 'Joyni kiriting' }
  const tickets = form.tickets || []
  if (publish && !tickets.length) return { ok: false, error: 'Kamida bitta chipta turi kerak' }

  const existing = id ? state.seminars.find((s) => s.id === id) : null
  const nextId = existing?.id || `${name.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 36) || 'seminar'}-${Math.random().toString(36).slice(2, 6)}`
  const status = publish ? (existing && existing.status !== 'qoralama' ? existing.status : 'rejalashtirilgan') : 'qoralama'
  const seats = tickets.reduce((n, t) => n + (Number(t.seats || t.total) || 0), 0) || existing?.seats || 0
  const sold = existing?.sold || 0
  const mappedTickets = tickets.map((t) => {
    const total = Number(t.seats || t.total) || 0
    const soldN = t.sold || 0
    return {
      id: t.id, name: t.name, price: Number(t.price) || 0, seats: total, total, sold: soldN,
      left: Math.max(0, total - soldN), active: t.active !== false, perks: t.perks || [], icon: t.icon || 'gem', note: t.note || '',
    }
  })
  const speakerName = form.speakers?.[0]?.name || existing?.speaker || 'Ma’ruzachi'
  const record = {
    ...(existing || {}),
    id: nextId,
    title: name,
    speaker: speakerName,
    date: uzLong(form.start),
    city: cityOf(form.place, form.address, existing?.city),
    format: /onlayn|online/i.test(form.format || '') && /gibrid|offline|oflayn/i.test(form.format || '') ? 'Gibrid' : /onlayn|online/i.test(form.format || '') ? 'Onlayn' : 'Oflayn',
    formatDetail: form.format || 'Offline (joyida)',
    days: form.start && form.end && form.start !== form.end ? '2 kunlik seminar' : '1 kunlik seminar',
    sold,
    seats: Math.max(seats, sold),
    revenue: existing?.revenue || 0,
    status,
    published: !!publish,
    badge: status === 'qoralama' ? 'Qoralama' : status === 'bekor' ? 'Bekor qilingan' : status === 'yakunlangan' ? 'Yakunlangan' : status === 'jarayonda' ? 'Jarayonda' : 'Rejalashtirilgan',
    image: String(form.cover || '').startsWith('data:') ? (existing?.image || form.cover) : (form.cover || existing?.image || IMG.teeth),
    cover: form.cover || existing?.cover || IMG.teeth,
    topic: form.topic || existing?.topic || 'Boshqa',
    about: form.about,
    category: form.category,
    tags: form.tags || [],
    start: form.start,
    startTime: form.startTime || '10:00',
    end: form.end || form.start,
    endTime: form.endTime || '18:00',
    place: form.place,
    address: form.address || '',
    lat: form.lat ?? null, lng: form.lng ?? null,
    placeImg: form.placeImg || IMG.hall2,
    tickets: mappedTickets,
    speakers: form.speakers || [],
    template: form.template || 'teal',
    wizardPromos: form.promos || [],
    form: { ...form, tickets, speakers: form.speakers || [], promos: form.promos || [] },
    held: existing?.held || false,
    checked: existing?.checked || 0,
    updatedAt: Date.now(),
  }
  const promos = [...state.promos]
  ;(form.promos || []).filter((p) => p.on !== false && p.code).forEach((p) => {
    const code = String(p.code).toUpperCase()
    const pct = Number(String(p.off || p.value || '').replace(/[^\d]/g, '')) || 0
    const kind = /so‘m|som|sum/i.test(String(p.off || '')) || p.kind === 'summa' ? 'summa' : 'foiz'
    const row = {
      id: p.id || `pr-${code}`,
      code,
      name: p.note || code,
      kind,
      value: pct,
      used: promos.find((x) => x.code === code && (x.seminar === nextId || x.seminar === 'all'))?.used || 0,
      limit: Number(p.limit) || 100,
      from: p.from || 'bugun',
      to: p.to || p.note || 'ochiq',
      status: p.on === false ? 'nofaol' : 'faol',
      seminar: nextId,
    }
    const i = promos.findIndex((x) => x.code === code && (x.seminar === nextId || x.seminar === 'all'))
    if (i >= 0) promos[i] = { ...promos[i], ...row, id: promos[i].id }
    else promos.unshift(row)
  })
  patch((s) => ({
    ...s,
    seminars: existing ? s.seminars.map((x) => (x.id === nextId ? record : x)) : [record, ...s.seminars],
    promos,
    activity: pushActivity(s.activity, {
      icon: 'cal',
      title: publish ? 'Seminar e’lon qilindi' : 'Qoralama saqlandi',
      text: name,
    }),
  }))
  const snap = getHub()
  remote(() => pushSeminar(snap.seminars.find((item) => item.id === nextId), snap.promos.filter((item) => item.seminar === nextId), { isNew: !existing }))
  return { ok: true, id: nextId }
}

export function cancelSeminar(id, reason) {
  patch((s) => {
    let drop = 0
    const payments = s.payments.map((p) => {
      if (p.seminarId !== id || p.state !== 'ok') return p
      drop += Number(p.sum) || 0
      return { ...p, state: 'refund' }
    })
    return {
      ...s,
      payments,
      seminars: s.seminars.map((x) => (x.id === id ? {
        ...x,
        status: 'bekor',
        published: true,
        badge: 'Bekor qilingan',
        cancelReason: reason || '',
        revenue: Math.max(0, (x.revenue || 0) - drop),
      } : x)),
      activity: pushActivity(s.activity, { icon: 'cal', title: 'Seminar bekor qilindi', text: s.seminars.find((x) => x.id === id)?.title || id }),
    }
  })
  remote(() => pushCancel(id, reason))
}

export function setSeminarVisible(id, visible) {
  patch((s) => ({
    ...s,
    seminars: s.seminars.map((x) => (x.id === id ? { ...x, published: !!visible } : x)),
    activity: pushActivity(s.activity, { icon: 'cal', title: visible ? 'Seminar ko‘rsatildi' : 'Seminar yashirildi', text: s.seminars.find((x) => x.id === id)?.title || id }),
  }))
  remote(() => pushVisibility(id, !!visible))
}

export function deleteSeminar(id) {
  const sem = state.seminars.find((x) => x.id === id)
  if (!sem) return { ok: false, error: 'Seminar topilmadi' }
  const people = state.participants.filter((p) => p.seminarId === id).length
  if ((sem.sold || 0) > 0 || people > 0) return { ok: false, error: 'Ro‘yxatdan o‘tganlar bor — o‘chirish o‘rniga bekor qiling' }
  patch((s) => ({
    ...s,
    seminars: s.seminars.filter((x) => x.id !== id),
    promos: s.promos.filter((p) => p.seminar !== id),
    activity: pushActivity(s.activity, { icon: 'cal', title: 'Seminar o‘chirildi', text: sem.title }),
  }))
  remote(() => pushDeleteSeminar(id))
  return { ok: true }
}

export function duplicateSeminar(id) {
  const src = state.seminars.find((s) => s.id === id)
  if (!src) return null
  const copyId = `${src.id}-nusxa-${Math.random().toString(36).slice(2, 5)}`
  const copy = {
    ...src,
    id: copyId,
    title: `${src.title} (nusxa)`,
    status: 'qoralama',
    published: false,
    badge: 'Qoralama',
    sold: 0,
    revenue: 0,
    checked: 0,
    held: false,
    updatedAt: Date.now(),
    form: src.form ? { ...src.form, name: `${src.title} (nusxa)` } : undefined,
    tickets: (src.tickets || []).map((t) => ({ ...t, id: `${t.id}-c`, sold: 0, left: t.seats || t.total })),
  }
  patch((s) => ({ ...s, seminars: [copy, ...s.seminars] }))
  remote(() => pushDuplicate(copy))
  return copyId
}

export function confirmHeld(id) {
  const real = id === 'implant' ? 'implant-nov' : id
  patch((s) => ({
    ...s,
    seminars: s.seminars.map((x) => (x.id === real ? { ...x, status: 'yakunlangan', held: true, published: true, badge: 'Yakunlangan' } : x)),
    activity: pushActivity(s.activity, { icon: 'award', title: 'Seminar o‘tkazilgani tasdiqlandi', text: s.seminars.find((x) => x.id === real)?.title || real }),
  }))
  remote(() => pushConfirm(real))
}

export function addParticipant(row) {
  const id = row.id || Date.now()
  const person = { arrived: false, pay: 'paid', code: `QR-${id}`, avatar: FACES[id % FACES.length], ...row, id }
  patch((s) => ({
    ...s,
    participants: [person, ...s.participants],
    seminars: bumpSeminar(s.seminars, person.seminarId, { sold: person.pay === 'cancel' ? 0 : 1 }),
    activity: pushActivity(s.activity, { icon: 'user', title: `${person.name} qo‘shildi`, text: 'Ishtirokchi' }),
  }))
  remote(() => pushParticipant(person))
  return person
}

export function removeParticipant(id) {
  patch((s) => {
    const p = s.participants.find((x) => x.id === id)
    return {
      ...s,
      participants: s.participants.filter((x) => x.id !== id),
      seminars: p ? bumpSeminar(s.seminars, p.seminarId, { sold: -1 }) : s.seminars,
    }
  })
  remote(() => pushRemoveParticipant(id))
}

function bumpSeminar(list, id, { sold = 0, revenue = 0, checked = 0 } = {}) {
  return list.map((s) => {
    if (s.id !== id) return s
    const nextSold = Math.max(0, (s.sold || 0) + sold)
    const tickets = (s.tickets || []).map((t, i) => (i === 0 ? { ...t, sold: Math.max(0, (t.sold || 0) + sold), left: Math.max(0, (t.seats || t.total || 0) - Math.max(0, (t.sold || 0) + sold)) } : t))
    return { ...s, sold: nextSold, seats: Math.max(s.seats || 0, nextSold), revenue: Math.max(0, (s.revenue || 0) + revenue), checked: Math.max(0, (s.checked || 0) + checked), tickets }
  })
}

export function checkIn(id) {
  const person = state.participants.find((p) => p.id === id)
  if (!person) return null
  if (person.arrived) return person
  patch((s) => ({
    ...s,
    participants: s.participants.map((p) => (p.id === id ? { ...p, arrived: true } : p)),
    seminars: bumpSeminar(s.seminars, person.seminarId, { checked: 1 }),
    activity: pushActivity(s.activity, { icon: 'qr', title: `${person.name} — Keldi`, text: s.seminars.find((x) => x.id === person.seminarId)?.title || '' }),
  }))
  remote(() => pushCheckIn(id))
  return { ...person, arrived: true }
}

function matchPerson(pool, text) {
  const q = String(text || '').trim().toLowerCase()
  if (q.length < 2) return null
  const byCode = pool.find((p) => p.code && q.includes(String(p.code).toLowerCase()))
  if (byCode) return byCode
  const pay = state.payments.find((p) => (p.id && q.includes(String(p.id).toLowerCase())) || (p.code && q.includes(String(p.code).toLowerCase())))
  if (pay) {
    const person = pool.find((p) => p.id === pay.participantId || (p.code && p.code === pay.code) || (p.seminarId === pay.seminarId && p.phone === pay.phone && p.name === pay.who))
    if (person) return person
  }
  if (q.length >= 3) return pool.find((p) => `${p.name} ${p.phone} ${p.email} ${p.code || ''}`.toLowerCase().includes(q)) || null
  return null
}

export function checkInPayload(seminarId, raw) {
  const text = String(raw || '').trim()
  if (text.length < 2) return { ok: false, error: 'Ism yoki kod kiriting' }
  const mine = state.participants.filter((p) => !seminarId || p.seminarId === seminarId)
  const hit = matchPerson(mine, text)
  if (hit) {
    if (hit.arrived) return { ok: true, person: hit, already: true }
    return { ok: true, person: checkIn(hit.id) }
  }
  if (seminarId) {
    const other = matchPerson(state.participants.filter((p) => p.seminarId !== seminarId), text)
    if (other && ((other.code && text.toLowerCase().includes(String(other.code).toLowerCase())) || state.payments.some((p) => p.participantId === other.id && text.toLowerCase().includes(String(p.id).toLowerCase())))) {
      return { ok: false, error: 'Bu chipta boshqa seminar uchun' }
    }
  }
  return { ok: false, error: 'Ishtirokchi topilmadi' }
}

export function checkInQuery(seminarId, query) {
  const res = checkInPayload(seminarId, query)
  return res.ok ? res.person : null
}

export function quotePromo(code, seminarId, amount) {
  if (!state.ready) return { ok: false, error: 'Ma’lumotlar yuklanmoqda' }
  const c = String(code || '').trim().toUpperCase()
  if (!c) return { ok: false, error: 'Promokodni kiriting' }
  const same = state.promos.filter((x) => x.code.toUpperCase() === c)
  const live = same.filter((x) => x.status === 'faol')
  const p = live.find((x) => !x.seminar || x.seminar === 'all' || x.seminar === seminarId)
  if (!p) {
    if (!same.length || !live.length) return { ok: false, error: 'Promokod topilmadi yoki muddati o‘tgan' }
    if (live.some((x) => x.seminar && x.seminar !== 'all' && x.seminar !== seminarId)) return { ok: false, error: 'Promokod bu seminar uchun emas' }
    return { ok: false, error: 'Promokod limiti tugagan' }
  }
  if (Number(p.limit) && Number(p.used) >= Number(p.limit)) return { ok: false, error: 'Promokod limiti tugagan' }
  const discount = p.kind === 'summa' ? Math.min(amount, Number(p.value) || 0) : Math.round((amount * (Number(p.value) || 0)) / 100)
  return { ok: true, discount, promo: p }
}

function touchSeminar(list, seminar) {
  if (!seminar?.id) return list
  return list.map((item) => (item.id === seminar.id ? {
    ...item,
    sold: seminar.sold,
    revenue: Number(seminar.revenue) || 0,
    checked: seminar.checked,
    seats: seminar.seats,
    tickets: (item.tickets || []).map((ticket) => {
      const sold = ticket.name === seminar.ticketName ? (ticket.sold || 0) + 1 : ticket.sold
      return ticket.name === seminar.ticketName ? { ...ticket, sold, left: Math.max(0, (ticket.seats || ticket.total || 0) - sold) } : ticket
    }),
  } : item))
}

export async function registerSale(input) {
  const pool = [...(state.catalog || []), ...state.seminars]
  const sem = pool.find((item) => item.id === input.seminarId)
  if (sem?.status === 'bekor') return { ok: false, error: 'Seminar bekor qilingan' }
  if (!supabase) return { ok: false, error: state.error || 'Supabase sozlanmagan' }
  const res = await remoteRegister(input)
  if (!res.ok) return res
  const person = res.person
  const payment = res.payment
    ? { ...res.payment, code: res.payment.code || person?.code || '', participantId: res.payment.participantId ?? person?.id }
    : null
  patch((s) => ({
    ...s,
    participants: person ? [person, ...s.participants.filter((item) => item.id !== person.id)] : s.participants,
    payments: payment ? [payment, ...s.payments.filter((item) => item.id !== payment.id)] : s.payments,
    seminars: touchSeminar(s.seminars, { ...res.seminar, ticketName: person?.ticket }),
    catalog: touchSeminar(s.catalog || [], { ...res.seminar, ticketName: person?.ticket }),
    promos: res.promoId ? s.promos.map((item) => (String(item.id) === String(res.promoId) ? { ...item, used: (item.used || 0) + 1 } : item)) : s.promos,
    activity: pushActivity(s.activity, { icon: 'pay', title: 'To‘lov qabul qilindi', text: `${person?.name || ''} — ${(res.paid || 0).toLocaleString('ru-RU')} so‘m` }),
  }))
  scheduleRefresh()
  return { ok: true, paid: res.paid, discount: res.discount, person, payment }
}

export function refundPayment(id) {
  patch((s) => {
    const pay = s.payments.find((p) => p.id === id)
    if (!pay || pay.state === 'refund') return s
    return {
      ...s,
      payments: s.payments.map((p) => (p.id === id ? { ...p, state: 'refund' } : p)),
      seminars: bumpSeminar(s.seminars, pay.seminarId, { revenue: -(pay.sum || 0) }),
      activity: pushActivity(s.activity, { icon: 'pay', title: 'To‘lov qaytarildi', text: pay.who }),
    }
  })
  remote(() => pushRefund(id))
}

export function saveTickets(seminarId, tickets) {
  patch((s) => ({
    ...s,
    seminars: s.seminars.map((x) => {
      if (x.id !== seminarId) return x
      const seats = tickets.reduce((n, t) => n + (Number(t.seats || t.total) || 0), 0)
      return { ...x, tickets, seats: Math.max(seats, x.sold || 0), form: x.form ? { ...x.form, tickets } : x.form }
    }),
  }))
  remote(() => pushTickets(seminarId, tickets))
}

export function upsertPromo(row) {
  patch((s) => {
    const i = s.promos.findIndex((p) => p.id === row.id)
    const promos = i >= 0 ? s.promos.map((p) => (p.id === row.id ? { ...p, ...row } : p)) : [row, ...s.promos]
    return { ...s, promos }
  })
  remote(() => pushPromo(getHub().promos.find((item) => item.id === row.id) || row))
}

export async function withdraw(amount, requisite) {
  const w = walletOf(state)
  const n = Number(amount) || 0
  if (n < 1000) return { ok: false, error: 'Kamida 1 000 so‘m kiriting' }
  if (n > w.available) return { ok: false, error: 'Yechib olish mumkin bo‘lgan summadan oshmasin' }
  const saved = state.requisites.find((item) => String(item.id) === String(requisite))
  if (!saved) return { ok: false, error: 'Avval rekvizit qo‘shing' }
  const res = await pushWithdraw(n, saved.label || saved.detail || requisite)
  if (!res?.ok) return res || { ok: false, error: 'So‘rov yuborilmadi' }
  const row = { id: res.id || `w-${Date.now()}`, amount: n, card: saved.label || requisite, date: tashkentDate(), method: 'card' }
  patch((s) => ({
    ...s,
    withdrawals: [row, ...s.withdrawals],
    activity: pushActivity(s.activity, { icon: 'pay', title: 'Pul yechish so‘rovi', text: `${n.toLocaleString('ru-RU')} so‘m` }),
  }))
  scheduleRefresh()
  return { ok: true }
}

export function addRequisite(item) {
  patch((s) => ({ ...s, requisites: [...s.requisites, item] }))
  remote(() => pushRequisite(item))
}

export function issueCert(id) {
  const code = `STH-2026-${String(id).padStart(4, '0')}`
  const date = uzLong(new Date().toISOString().slice(0, 10))
  patch((s) => ({
    ...s,
    certs: s.certs.map((c) => (c.id === id ? { ...c, state: 'done', code, date } : c)),
  }))
  remote(() => pushCert(id, code, date))
  return code
}

export function saveSettings(next) {
  patch((s) => ({ ...s, settings: { ...s.settings, ...next } }))
  rememberSettings()
}

export function saveMarketing(next) {
  patch((s) => ({ ...s, marketing: { ...s.marketing, ...next } }))
  rememberSettings()
}

export function addSpeaker(row) {
  patch((s) => ({ ...s, speakers: [...s.speakers, row] }))
  remote(() => pushSpeaker(row))
}

export function setQrSound(on) {
  patch((s) => ({ ...s, qrSound: on }))
  rememberSettings()
}

export function addMessage(text) {
  patch((s) => ({ ...s, messages: [...s.messages, { id: Date.now(), text, at: nowLabel() }] }))
  remote(() => pushMessage(text))
}

export function walletOf(s = state) {
  let hold = 0
  let ready = 0
  let gross = 0
  let feeTotal = 0
  const paymentRows = []
  for (const p of s.payments) {
    if (p.state === 'wait') continue
    const sem = s.seminars.find((x) => x.id === p.seminarId)
    const sum = Number(p.sum) || 0
    const fee = p.state === 'ok' ? Math.round(sum * FEE) : 0
    const net = p.state === 'ok' ? sum - fee : 0
    if (p.state === 'ok') {
      gross += sum
      feeTotal += fee
    }
    let bucket = 'refund'
    if (p.state === 'ok' && (sem?.held || sem?.status === 'yakunlangan')) {
      bucket = 'paid'
      ready += net
    } else if (p.state === 'ok') {
      bucket = 'hold'
      hold += net
    }
    paymentRows.push({
      id: p.id, date: p.when, seminar: p.seminar, seminarId: p.seminarId, sum, fee, net, state: bucket, who: p.who,
    })
  }
  let transferred = 0
  const outs = s.withdrawals.map((w) => {
    transferred += w.amount
    ready -= w.amount
    return { id: w.id, date: w.date, seminar: `Pul yechish · **** ${w.card}`, seminarId: '', sum: w.amount, fee: 0, net: w.amount, state: 'paid', who: 'Yechish' }
  })
  return {
    hold,
    available: Math.max(0, ready),
    transferred,
    gross,
    fee: feeTotal,
    net: Math.max(0, gross - feeTotal),
    rows: [...outs, ...paymentRows].slice(0, 80),
  }
}

export function moneyOf(s = state) {
  const w = walletOf(s)
  return {
    gross: w.gross,
    fee: w.fee,
    net: w.net,
    seminars: s.seminars.length,
    participants: s.participants.length,
  }
}

function spanHours(a = '10:00', b = '18:00') {
  const toMin = (t) => { const [h, m] = String(t || '').split(':').map(Number); return (h || 0) * 60 + (m || 0) }
  const diff = toMin(b) - toMin(a)
  return diff > 0 ? `${Math.round(diff / 6) / 10} soat` : ''
}

export function toPublic(s) {
  const [y, m, d] = (s.start || isoFromLabel(s.date)).split('-').map(Number)
  const date = new Date(y, (m || 1) - 1, d || 1)
  const active = (s.tickets || []).filter((t) => t.active !== false && t.price)
  const price = active.length ? Math.min(...active.map((t) => Number(t.price) || 0)) : 450000
  const seats = (s.tickets || []).reduce((n, t) => n + (Number(t.seats || t.total) || 0), 0) || s.seats || 30
  const sold = s.sold || 0
  const cat = TOPIC_CAT[s.topic] || 'other'
  const online = /onlayn|online/i.test(s.format || '') && !/gibrid|oflayn|offline/i.test(s.format || '')
  const hybrid = /gibrid/i.test(s.format || '') || (/onlayn|online/i.test(s.formatDetail || '') && /offline|oflayn/i.test(s.formatDetail || ''))
  return {
    id: s.id,
    cat,
    day: String(d || 1).padStart(2, '0'),
    mon: MON_CODE[(m || 1) - 1],
    weekday: WEEK[date.getDay()],
    monthKey: `${y}-${String(m || 1).padStart(2, '0')}`,
    title: s.title,
    text: String(s.about || s.days || '').slice(0, 140),
    city: s.city,
    place: s.place || s.city,
    time: `${s.startTime || '10:00'} – ${s.endTime || '18:00'}`,
    hours: Number(s.form?.hours) ? `${Number(s.form.hours)} soat` : spanHours(s.startTime, s.endTime),
    noSpeaker: !(s.speakers || []).some((sp) => sp?.name),
    speaker: {
      name: s.speakers?.[0]?.name || s.speaker,
      role: s.speakers?.[0]?.role || s.topic,
      avatar: s.speakers?.[0]?.avatar || FACES[0],
    },
    cme: 6,
    left: Math.max(0, seats - sold),
    seats,
    price,
    tickets: (s.tickets || []).filter((t) => t.active !== false && t.price).map((t) => ({
      id: t.id, name: t.name, price: Number(t.price) || 0, seats: Number(t.seats || t.total) || 0, left: t.left, perks: t.perks || [],
    })),
    format: online ? 'Online' : hybrid ? 'Offline + jonli efir' : 'Offline',
    image: s.cover && !String(s.cover).startsWith('data:') ? s.cover : (s.image || IMG.teeth),
    status: s.status,
    cancelled: s.status === 'bekor',
    // Faqat tashkilotchi kiritgan dastur / o‘rganiladigan mavzular (bo‘lmasa bo‘sh — sahifada bo‘lim yashiriladi)
    program: Array.isArray(s.program) ? s.program : Array.isArray(s.form?.program) ? s.form.program : [],
    learnList: Array.isArray(s.learn) ? s.learn : Array.isArray(s.form?.learn) ? s.form.learn : [],
    organizer: true,
  }
}

export function publicRecords(s = state) {
  const source = Array.isArray(s.catalog) ? s.catalog : s.seminars
  const extra = source.filter((x) => x.published && x.status !== 'qoralama').map(toPublic)
  // Real-data mode: once hub hydrated from Supabase, never merge sample seminarsData seeds.
  if (s.ready || s.catalog?.length || s.seminars?.length) return extra
  return CATALOG.map((x) => ({ ...x }))
}

export function publicRecord(id, s = state) {
  return publicRecords(s).find((x) => x.id === id) || null
}

export function downloadText(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(a.href)
}

export function resetHub() {
  epoch += 1
  return hydrate()
}
