import { friendlySupabaseError, supabase } from './supabaseClient'

function reviveId(id) {
  const value = String(id ?? '')
  return /^\d+$/.test(value) && value.length < 16 ? Number(value) : value
}

async function userId() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id || null
}

async function requireUid() {
  const id = await userId()
  if (!id) throw new Error('Avval tashkilotchi sifatida kiring')
  return id
}

function ticketFromRow(row) {
  const seats = Number(row.seats) || 0
  const sold = Number(row.sold) || 0
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price) || 0,
    seats,
    total: seats,
    sold,
    left: Math.max(0, seats - sold),
    active: row.active !== false,
    perks: row.perks || [],
    icon: row.icon || 'gem',
    note: row.note || '',
  }
}

function seminarFromRow(row, tickets) {
  const list = tickets
    .filter((ticket) => ticket.seminar_id === row.id)
    .sort((a, b) => (a.sort_at || 0) - (b.sort_at || 0))
  return {
    id: row.id,
    title: row.title,
    speaker: row.speaker,
    date: row.date_label,
    city: row.city,
    format: row.format,
    days: row.days,
    sold: row.sold || 0,
    seats: row.seats || 0,
    revenue: Number(row.revenue) || 0,
    status: row.status,
    badge: row.badge,
    image: row.image,
    topic: row.topic,
    published: row.published,
    held: row.held,
    about: row.about,
    category: row.category,
    tags: row.tags || [],
    cover: row.cover,
    start: row.start_date,
    startTime: row.start_time,
    end: row.end_date,
    endTime: row.end_time,
    place: row.place,
    address: row.address,
    placeImg: row.place_img,
    template: row.template,
    checked: row.checked || 0,
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : 0,
    cancelReason: row.cancel_reason || '',
    form: row.form,
    speakers: row.speakers || [],
    wizardPromos: row.form?.promos || [],
    tickets: list.map(ticketFromRow),
  }
}

function promoFromRow(row) {
  return {
    id: reviveId(row.id),
    code: row.code,
    name: row.name,
    kind: row.kind,
    value: Number(row.value) || 0,
    used: row.used || 0,
    limit: row.limit_n || 0,
    status: row.status,
    seminar: row.seminar_id || 'all',
    from: row.from_label,
    to: row.to_label,
  }
}

function personFromRow(row) {
  return {
    id: reviveId(row.id),
    name: row.name,
    clinic: row.clinic,
    phone: row.phone,
    email: row.email,
    ticket: row.ticket,
    pay: row.pay,
    registered: row.registered,
    city: row.city,
    role: row.role,
    avatar: row.avatar,
    seminarId: row.seminar_id,
    arrived: row.arrived,
    code: row.code,
  }
}

function paymentFromRow(row) {
  return {
    id: row.id,
    who: row.who,
    clinic: row.clinic,
    seminar: row.seminar_title,
    seminarId: row.seminar_id,
    sum: Number(row.sum) || 0,
    gross: row.gross == null ? undefined : Number(row.gross),
    discount: Number(row.discount) || 0,
    promo: row.promo || '',
    method: row.method,
    state: row.state,
    phone: row.phone,
    email: row.email,
    ticket: row.ticket,
    when: row.when_label,
    avatar: row.avatar,
    face: row.face || 0,
  }
}

function slimText(value, fallback = '') {
  const text = String(value || '')
  if (text.startsWith('data:')) return fallback
  return text || fallback
}

function slimForm(form) {
  if (!form) return null
  return {
    ...form,
    cover: slimText(form.cover),
    thumbs: (form.thumbs || []).filter((item) => !String(item).startsWith('data:')),
  }
}

function seminarToRow(record, uid, { isNew } = {}) {
  const row = {
    id: record.id,
    organizer_id: uid,
    title: record.title,
    speaker: record.speaker || '',
    date_label: record.date || '',
    city: record.city || '',
    format: record.format || 'Oflayn',
    days: record.days || '',
    sold: record.sold || 0,
    seats: record.seats || 0,
    revenue: record.revenue || 0,
    status: record.status || 'qoralama',
    badge: record.badge || '',
    image: slimText(record.image, '/images/seminars/teeth.jpg'),
    topic: record.topic || '',
    published: !!record.published,
    held: !!record.held,
    about: record.about || '',
    category: record.category || '',
    tags: record.tags || [],
    cover: slimText(record.cover, slimText(record.image, '/images/seminars/teeth.jpg')),
    start_date: record.start || '',
    start_time: record.startTime || '10:00',
    end_date: record.end || record.start || '',
    end_time: record.endTime || '18:00',
    place: record.place || '',
    address: record.address || '',
    place_img: record.placeImg || '',
    template: record.template || 'teal',
    checked: record.checked || 0,
    cancel_reason: record.cancelReason || '',
    form: slimForm(record.form),
    speakers: record.speakers || [],
  }
  if (isNew) row.sort_at = -Date.now()
  return row
}

function ticketToRow(ticket, seminarId, uid, index) {
  return {
    id: String(ticket.id),
    seminar_id: seminarId,
    organizer_id: uid,
    name: ticket.name,
    price: Number(ticket.price) || 0,
    seats: Number(ticket.seats || ticket.total) || 0,
    sold: Number(ticket.sold) || 0,
    active: ticket.active !== false,
    perks: ticket.perks || [],
    icon: ticket.icon || 'gem',
    note: ticket.note || '',
    sort_at: index,
  }
}

function promoToRow(promo, uid, index = 0) {
  return {
    id: String(promo.id),
    organizer_id: uid,
    seminar_id: !promo.seminar || promo.seminar === 'all' ? 'all' : promo.seminar,
    code: String(promo.code || '').toUpperCase(),
    name: promo.name || promo.code || '',
    kind: promo.kind === 'summa' ? 'summa' : 'foiz',
    value: Number(promo.value) || 0,
    used: Number(promo.used) || 0,
    limit_n: Number(promo.limit) || 0,
    status: promo.status || 'faol',
    from_label: promo.from || '',
    to_label: promo.to || '',
    sort_at: promo.sort_at ?? -Date.now() - index,
  }
}

async function must(query) {
  const { data, error } = await query
  if (error) throw error
  return data
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
}

export async function pullHub() {
  if (!supabase) {
    const error = new Error('Supabase sozlanmagan. VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY ni kiriting.')
    error.code = 'NO_SUPABASE'
    throw error
  }
  const uid = await userId()
  let organizer = false
  let profile = null
  if (uid) {
    profile = await must(supabase.from('profiles').select('role,name,email').eq('id', uid).maybeSingle())
    organizer = profile?.role === 'organizer'
  }

  const ownQuery = supabase.from('seminars').select('*').order('sort_at', { ascending: true })
  const seminarRows = await must(organizer
    ? ownQuery.eq('organizer_id', uid)
    : ownQuery.eq('published', true).neq('status', 'qoralama'))
  const catalogRows = organizer
    ? await must(supabase.from('seminars').select('*').eq('published', true).neq('status', 'qoralama').order('sort_at', { ascending: true }))
    : seminarRows

  const ids = [...new Set([...(seminarRows || []), ...(catalogRows || [])].map((row) => row.id))]
  const ticketRows = ids.length
    ? await must(supabase.from('tickets').select('*').in('seminar_id', ids))
    : []
  const promoRows = organizer
    ? await must(supabase.from('promo_codes').select('*').eq('organizer_id', uid).order('sort_at', { ascending: true }))
    : await must(supabase.from('promo_codes').select('*').eq('status', 'faol').order('sort_at', { ascending: true }))

  const myRegistrations = uid
    ? await must(supabase.from('registrations').select('*').eq('customer_id', uid))
    : []

  const next = {
    ...EMPTY,
    seminars: (seminarRows || []).map((row) => seminarFromRow(row, ticketRows || [])),
    catalog: (catalogRows || []).map((row) => seminarFromRow(row, ticketRows || [])),
    promos: (promoRows || []).map(promoFromRow),
    myRegistrations: myRegistrations || [],
  }

  if (!organizer) return next

  const [registrations, payments, certs, wallet, requisites, activity, reviews, speakers, settings, messages] = await Promise.all([
    must(supabase.from('registrations').select('*').eq('organizer_id', uid).order('sort_at', { ascending: true }).limit(2000)),
    must(supabase.from('payments').select('*').eq('organizer_id', uid).order('sort_at', { ascending: true }).limit(2000)),
    must(supabase.from('certificates').select('*').eq('organizer_id', uid).order('sort_at', { ascending: true }).limit(2000)),
    must(supabase.from('wallet_transactions').select('*').eq('organizer_id', uid).order('created_at', { ascending: false })),
    must(supabase.from('requisites').select('*').eq('organizer_id', uid)),
    must(supabase.from('activity_log').select('*').eq('organizer_id', uid).order('sort_at', { ascending: true }).limit(24)),
    must(supabase.from('seminar_reviews').select('*').eq('organizer_id', uid).order('sort_at', { ascending: true })),
    must(supabase.from('organizer_speakers').select('*').eq('organizer_id', uid).order('sort_at', { ascending: true })),
    must(supabase.from('organizer_settings').select('*').eq('organizer_id', uid).maybeSingle()),
    must(supabase.from('support_messages').select('*').eq('organizer_id', uid).order('created_at', { ascending: true })),
  ])

  const prefix = `${uid}:`
  next.participants = (registrations || []).map(personFromRow)
  next.payments = (payments || []).map(paymentFromRow)
  next.certs = (certs || []).map((row) => ({
    id: reviveId(row.id),
    name: row.name,
    clinic: row.clinic,
    seminar: row.seminar_title,
    seminarId: row.seminar_id,
    state: row.state,
    code: row.code,
    date: row.date_label,
    avatar: row.avatar,
  }))
  next.withdrawals = (wallet || []).filter((row) => row.kind === 'withdraw').map((row) => ({
    id: row.id,
    amount: Number(row.amount) || 0,
    card: row.card,
    date: row.date_label,
    method: row.method,
  }))
  next.requisites = (requisites || []).map((row) => ({
    id: String(row.id).startsWith(prefix) ? String(row.id).slice(prefix.length) : row.id,
    label: row.label,
    detail: row.detail,
  }))
  next.activity = (activity || []).map((row) => ({ icon: row.icon, title: row.title, text: row.text, time: row.time_label }))
  next.reviews = (reviews || []).map((row) => ({
    name: row.name, clinic: row.clinic, stars: row.stars, text: row.text, date: row.date_label, avatar: row.avatar,
  }))
  next.speakers = (speakers || []).map((row) => ({
    id: row.id, name: row.name, role: row.role, city: row.city, avatar: row.avatar, bio: row.bio, links: row.links || [],
  }))
  if (settings) {
    next.settings = { name: settings.name || profile?.name || '', email: settings.email || profile?.email || '', notes: settings.notes !== false, city: settings.city || 'Toshkent' }
    next.qrSound = settings.qr_sound !== false
    next.marketing = { push: true, email: true, telegram: false, budget: '', ...(settings.marketing || {}) }
  } else if (profile) {
    next.settings = { ...next.settings, name: profile.name || '', email: profile.email || '' }
  }
  next.messages = (messages || []).map((row) => ({ id: row.id, text: row.body, at: row.at_label }))
  return next
}

let channel = null

export function subscribeHub(onChange) {
  if (!supabase) return () => {}
  let closed = false
  const start = async () => {
    const uid = await userId()
    if (closed) return
    if (channel) supabase.removeChannel(channel)
    const topic = `stomahub-${uid || 'anon'}-${Math.random().toString(36).slice(2, 7)}`
    const next = supabase.channel(topic)
    const tables = ['seminars', 'tickets', 'promo_codes', 'registrations', 'payments', 'checkins', 'certificates', 'wallet_transactions']
    tables.forEach((table) => {
      const spec = { event: '*', schema: 'public', table }
      if (uid && !['seminars', 'tickets', 'promo_codes'].includes(table)) spec.filter = `organizer_id=eq.${uid}`
      next.on('postgres_changes', spec, () => onChange())
    })
    next.subscribe()
    channel = next
  }
  start()
  return () => {
    closed = true
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  }
}

export async function remoteRegister(input) {
  const { data, error } = await supabase.rpc('register_sale', {
    payload: {
      seminarId: input.seminarId,
      ticket: input.ticket || 'Standart',
      ticketId: input.ticketId || '',
      name: input.name,
      phone: input.phone || '',
      email: input.email || '',
      clinic: input.clinic || '',
      city: input.city || '',
      spec: input.spec || '',
      method: input.method || 'Click',
      subtotal: Number(input.subtotal) || 0,
      promoCode: input.promoCode || '',
    },
  })
  if (error) return { ok: false, error: friendlySupabaseError(error) }
  if (!data?.ok) return { ok: false, error: data?.error || 'Ro‘yxatdan o‘tib bo‘lmadi' }
  const person = data.person ? { ...data.person, id: reviveId(data.person.id) } : null
  return {
    ok: true,
    paid: Number(data.paid) || 0,
    discount: Number(data.discount) || 0,
    promo: data.promo || '',
    promoId: data.promoId || '',
    person,
    payment: data.payment,
    seminar: data.seminar,
  }
}

async function logActivity(uid, item) {
  const id = `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const { error } = await supabase.from('activity_log').insert({
    id,
    organizer_id: uid,
    icon: item.icon || 'cal',
    title: item.title || '',
    text: item.text || '',
    time_label: item.time || new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    sort_at: -Date.now(),
  })
  if (error) throw error
}

export async function pushSeminar(record, promos, { isNew } = {}) {
  const uid = await requireUid()
  const { error } = await supabase.from('seminars').upsert(seminarToRow(record, uid, { isNew }))
  if (error) throw error
  const tickets = (record.tickets || []).map((ticket, index) => ticketToRow(ticket, record.id, uid, index))
  if (tickets.length) {
    const { error: ticketError } = await supabase.from('tickets').upsert(tickets)
    if (ticketError) throw ticketError
  }
  const ids = tickets.map((ticket) => ticket.id)
  const existing = await must(supabase.from('tickets').select('id,sold').eq('seminar_id', record.id))
  for (const row of existing || []) {
    if (ids.includes(row.id)) continue
    if ((row.sold || 0) > 0) {
      const { error: offError } = await supabase.from('tickets').update({ active: false }).eq('id', row.id)
      if (offError) throw offError
    } else {
      const { error: delError } = await supabase.from('tickets').delete().eq('id', row.id)
      if (delError) throw delError
    }
  }
  if (promos?.length) {
    const { error: promoError } = await supabase.from('promo_codes').upsert(promos.map((promo, index) => promoToRow(promo, uid, index)))
    if (promoError) throw promoError
  }
  await logActivity(uid, {
    icon: 'cal',
    title: record.published ? 'Seminar e’lon qilindi' : 'Qoralama saqlandi',
    text: record.title,
  })
}

export async function pushDuplicate(copy) {
  const uid = await requireUid()
  const { error } = await supabase.from('seminars').insert(seminarToRow({ ...copy, sold: 0, revenue: 0, checked: 0 }, uid, { isNew: true }))
  if (error) throw error
  const tickets = (copy.tickets || []).map((ticket, index) => ticketToRow({ ...ticket, sold: 0 }, copy.id, uid, index))
  if (tickets.length) {
    const { error: ticketError } = await supabase.from('tickets').insert(tickets)
    if (ticketError) throw ticketError
  }
}

export async function pushConfirm(id) {
  const { error } = await supabase.from('seminars').update({
    status: 'yakunlangan', held: true, published: true, badge: 'Yakunlangan',
  }).eq('id', id)
  if (error) throw error
  await logActivity(await requireUid(), { icon: 'award', title: 'Seminar o‘tkazilgani tasdiqlandi', text: id })
}

export async function pushCancel(id, reason) {
  const { data, error } = await supabase.rpc('cancel_seminar', { seminar_id: id, reason: reason || '' })
  if (error) throw error
  if (data && data.ok === false) throw new Error(data.error || 'Bekor qilib bo‘lmadi')
}

export async function pushParticipant(person) {
  const { data, error } = await supabase.rpc('add_participant', {
    payload: {
      id: String(person.id),
      seminarId: person.seminarId,
      name: person.name,
      clinic: person.clinic,
      phone: person.phone,
      email: person.email,
      ticket: person.ticket,
      pay: person.pay,
      registered: person.registered,
      city: person.city,
      role: person.role,
      avatar: person.avatar,
      code: person.code,
      arrived: !!person.arrived,
    },
  })
  if (error) throw error
  if (data && data.ok === false) throw new Error(data.error || 'Qo‘shib bo‘lmadi')
}

export async function pushRemoveParticipant(id) {
  const { data, error } = await supabase.rpc('remove_participant', { registration_id: String(id) })
  if (error) throw error
  if (data && data.ok === false) throw new Error(data.error || 'O‘chirib bo‘lmadi')
}

export async function pushCheckIn(id) {
  const { data, error } = await supabase.rpc('check_in', { p_registration_id: String(id) })
  if (error) throw error
  if (data && data.ok === false) throw new Error(data.error || 'Check-in bo‘lmadi')
}

export async function pushTickets(seminarId, tickets) {
  const uid = await requireUid()
  const rows = tickets.map((ticket, index) => ticketToRow(ticket, seminarId, uid, index))
  if (rows.length) {
    const { error } = await supabase.from('tickets').upsert(rows)
    if (error) throw error
  }
  const seats = tickets.reduce((sum, ticket) => sum + (Number(ticket.seats || ticket.total) || 0), 0)
  const { error } = await supabase.from('seminars').update({ seats }).eq('id', seminarId)
  if (error) throw error
}

export async function pushPromo(row) {
  const uid = await requireUid()
  const { error } = await supabase.from('promo_codes').upsert(promoToRow(row, uid))
  if (error) throw error
}

export async function pushRefund(id) {
  const { data, error } = await supabase.rpc('refund_payment', { payment_id: String(id) })
  if (error) throw error
  if (data && data.ok === false) throw new Error(data.error || 'Qaytarib bo‘lmadi')
}

export async function pushWithdraw(amount, card) {
  const { data, error } = await supabase.rpc('withdraw_funds', { p_amount: Number(amount) || 0, p_card: String(card || '') })
  if (error) return { ok: false, error: friendlySupabaseError(error) }
  return data || { ok: false, error: 'So‘rov yuborilmadi' }
}

export async function pushRequisite(item) {
  const uid = await requireUid()
  const { error } = await supabase.from('requisites').upsert({
    id: `${uid}:${item.id}`,
    organizer_id: uid,
    label: item.label,
    detail: item.detail || '',
  })
  if (error) throw error
}

export async function pushCert(id, code, date) {
  const { error } = await supabase.from('certificates').update({
    state: 'done', code, date_label: date,
  }).eq('id', String(id))
  if (error) throw error
}

export async function pushSettingsBundle({ settings, marketing, qrSound }) {
  const uid = await requireUid()
  const { error } = await supabase.from('organizer_settings').upsert({
    organizer_id: uid,
    name: settings?.name || '',
    email: settings?.email || '',
    notes: settings?.notes !== false,
    city: settings?.city || 'Toshkent',
    qr_sound: qrSound !== false,
    marketing: marketing || {},
  })
  if (error) throw error
  if (settings?.name) {
    await supabase.from('profiles').update({ name: settings.name }).eq('id', uid)
  }
}

export async function pushSpeaker(row) {
  const uid = await requireUid()
  const { error } = await supabase.from('organizer_speakers').upsert({
    id: String(row.id),
    organizer_id: uid,
    name: row.name,
    role: row.role || '',
    city: row.city || '',
    avatar: row.avatar || '',
    bio: row.bio || '',
    links: row.links || [],
    sort_at: -Date.now(),
  })
  if (error) throw error
}

export async function pushMessage(text) {
  const uid = await userId()
  if (!uid) return
  const { error } = await supabase.from('support_messages').insert({
    id: `msg-${Date.now()}`,
    organizer_id: uid,
    author_id: uid,
    body: text,
    at_label: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
  })
  if (error) throw error
}

export { friendlySupabaseError }
