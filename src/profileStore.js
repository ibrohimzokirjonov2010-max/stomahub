import { useSyncExternalStore } from 'react'
import { cancelMyOrder, fetchMyOrders } from './buyerApi'
import { supabase } from './supabaseClient'
import { currentUid, isDemoUser, onAccount, uploadAvatar } from './recordSync'

const KEY = 'stomahub-profile'

export const ADDRESS_KINDS = [['home', 'Uy'], ['work', 'Klinika'], ['branch', 'Filial'], ['other', 'Boshqa']]

export function addr(id, kind, name, phone, district, street, extra = '', city = 'Toshkent') {
  const tag = ADDRESS_KINDS.find((k) => k[0] === kind)[1]
  const place = city === 'Toshkent' || district !== 'Markaz' ? `${district} tumani, ` : ''
  return { id, kind, tag, name, phone, city, district, street, extra, address: `${place}${street}${extra ? `, ${extra}` : ''}` }
}

export const COURSES = [
  { id: 'endo', title: 'Endodontiya asoslari', about: 'Kanal davolashning zamonaviy usullari va klinik protokollar.', author: 'Dr. Sardor Ismailov', role: 'Endodontist', avatar: '/images/surplus/u4.jpg', lessons: 12, done: 8, hours: 8, cme: 6, price: 750000, image: '/images/seminar-2.jpg', pos: 'object-[16%_center]', certDate: '' },
  { id: 'impl', title: 'Implantologiya', about: 'Implantologiyaning asosiy tamoyillari, jarrohlik protokollari va reabilitatsiya.', author: 'Dr. Azizbek Karimov', role: 'Implantolog', avatar: '/images/surplus/seller.jpg', lessons: 15, done: 6, hours: 10, cme: 8, price: 1500000, image: '/images/seminar-1.jpg', pos: 'object-[22%_center]', certDate: '' },
  { id: 'orto', title: 'Ortodontiya asoslari', about: 'Tish qo‘yilishi, breket tizimlari va davolash rejasi tuzish.', author: 'Dr. Nilufar Abdullayeva', role: 'Ortodont', avatar: '/images/surplus/u3.jpg', lessons: 12, done: 3, hours: 7, cme: 5, price: 650000, image: '/images/seminars/aligner.jpg', pos: 'object-center', certDate: '' },
  { id: 'estet', title: 'Estetik stomatologiya', about: 'Veneerlar, kompozit restavratsiyalar va g‘alaba qiluvchi tabassum dizayni.', author: 'Dr. Jahongir Rahimov', role: 'Stomatolog-estetist', avatar: '/images/surplus/u5.jpg', lessons: 10, done: 10, hours: 6, cme: 6, price: 950000, image: '/images/seminars/smile.jpg', pos: 'object-center', certDate: '12-oktabr 2026' },
  { id: 'paro', title: 'Parodontologiya', about: 'Milk kasalliklari diagnostikasi va davolash strategiyalari.', author: 'Dr. Madina Xolmatova', role: 'Parodontolog', avatar: '/images/surplus/u6.jpg', lessons: 8, done: 8, hours: 5, cme: 4, price: 480000, image: '/images/seminar-4.jpg', pos: 'object-[18%_center]', certDate: '3-sentabr 2026' },
]

export const courseDone = (profile, c) => {
  const stored = profile.courseDone?.[c.id]
  if (profile.accountLive || currentUid()) return Math.min(c.lessons, stored ?? 0)
  return Math.min(c.lessons, stored ?? 0)
}

const EMPTY_ACCOUNT = {
  name: '',
  role: '',
  clinic: '',
  city: '',
  district: '',
  phone: '',
  email: '',
  avatar: '',
  license: '',
  experience: '',
  about: '',
  verified: false,
  lang: 'uz',
  plus: false,
  bonus: 0,
  loggedOut: false,
  notif: { email: true, sms: false, market: true, courses: true, promo: false },
  addresses: [],
  defaultAddr: '',
  cards: [],
  linkedWallets: [],
  defaultPay: '',
  clinicInfo: { name: '', address: '', hours: '', phone: '', website: '', photo: '' },
  certificates: [],
  favCourses: [],
  favProducts: [],
  favMasters: [],
  orders: [],
  readNotifs: [],
  courseDone: {},
  accountLive: false,
}

// Mehmon/chiqqan foydalanuvchi uchun bo‘sh profil — soxta ma’lumot yo‘q
const DEFAULT = { ...EMPTY_ACCOUNT }
export const SEED_ORDERS = []

const listeners = new Set()
let applyingRemote = false
let pushTimer = null
let hydratedUid = null

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY))
    return v ? { ...DEFAULT, ...v, notif: { ...DEFAULT.notif, ...v.notif }, accountLive: false } : { ...DEFAULT, accountLive: false }
  } catch {
    return { ...DEFAULT, accountLive: false }
  }
}

let state = read()

function write(next, opts = {}) {
  state = { ...state, ...next }
  const cache = { ...state }
  delete cache.syncError
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    localStorage.setItem(KEY, JSON.stringify({ ...cache, avatar: '' }))
  }
  listeners.forEach((l) => l())
  if (!opts.remote && state.accountLive) schedulePush()
}

function schedulePush() {
  clearTimeout(pushTimer)
  pushTimer = setTimeout(() => { pushProfile().catch((error) => write({ syncError: error.message }, { remote: true })) }, 400)
}

export function flushProfile() {
  clearTimeout(pushTimer)
  return pushProfile()
}

async function pushProfile() {
  const uid = currentUid()
  if (!supabase || !uid) return
  let avatar = state.avatar || ''
  if (avatar.startsWith('data:')) {
    avatar = await uploadAvatar(avatar)
    write({ avatar }, { remote: true })
  }
  const phone = normalizePhone(state.phone)
  const prefs = {
    defaultPay: state.defaultPay,
    defaultAddr: state.defaultAddr,
    readNotifs: state.readNotifs,
    customer_seeded: true,
  }
  const patch = {
    name: state.name,
    specialty: state.role,
    clinic: state.clinic,
    city: state.city,
    district: state.district,
    email: state.email,
    lang: state.lang,
    license: state.license || '',
    experience_years: Number(state.experience) || 0,
    about: state.about || '',
    avatar_url: avatar.startsWith('http') ? avatar.split('?')[0] : '',
    notif: state.notif || {},
    prefs,
    updated_at: new Date().toISOString(),
  }
  if (phone && (isDemoUser() || phone !== normalizePhone(DEFAULT.phone))) patch.phone = phone
  const stripV2 = (obj) => {
    const next = { ...obj }
    delete next.license
    delete next.experience_years
    delete next.about
    return next
  }
  const { data: existing, error: readError } = await supabase.from('profiles').select('id').eq('id', uid).maybeSingle()
  if (readError) throw readError
  let error
  const tryWrite = async (body, mode) => {
    if (mode === 'insert') return supabase.from('profiles').insert({ id: uid, role: 'customer', ...body })
    return supabase.from('profiles').update(body).eq('id', uid)
  }
  if (!existing) {
    ;({ error } = await tryWrite(patch, 'insert'))
    if (error && /license|experience_years|about|schema cache|column/i.test(error.message || '')) {
      ;({ error } = await tryWrite(stripV2(patch), 'insert'))
    }
    if (error && /duplicate|unique/i.test(error.message || '') && patch.phone) {
      delete patch.phone
      ;({ error } = await tryWrite(stripV2(patch), 'insert'))
    }
  } else {
    ;({ error } = await tryWrite(patch, 'update'))
    if (error && /license|experience_years|about|schema cache|column/i.test(error.message || '')) {
      ;({ error } = await tryWrite(stripV2(patch), 'update'))
    }
    if (error && /duplicate|unique/i.test(error.message || '') && patch.phone) {
      delete patch.phone
      ;({ error } = await tryWrite(stripV2(patch), 'update'))
    }
  }
  if (error) throw error
  await syncChildren(uid)
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('998') && digits.length === 12) return `+${digits}`
  if (digits.length === 9) return `+998${digits}`
  return null
}

function localPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('998') && digits.length === 12) return digits.slice(3)
  if (digits.length === 9) return digits
  return ''
}

async function syncChildren(uid) {
  // Never wipe DB from empty local state before hydrate finished for this uid.
  if (hydratedUid !== uid) return

  const addresses = state.addresses || []
  const addrIds = new Set(addresses.map((row) => `${uid}:${row.id}`))
  const { data: existingAddrs, error: addrReadErr } = await supabase
    .from('customer_addresses').select('id').eq('user_id', uid)
  if (addrReadErr) throw addrReadErr
  const orphanAddrs = (existingAddrs || []).map((r) => r.id).filter((id) => !addrIds.has(id))
  if (orphanAddrs.length) {
    const { error } = await supabase.from('customer_addresses').delete().in('id', orphanAddrs)
    if (error) throw error
  }
  if (addresses.length) {
    const { error } = await supabase.from('customer_addresses').upsert(addresses.map((row, index) => ({
      id: `${uid}:${row.id}`,
      user_id: uid,
      payload: row,
      sort_at: index,
    })))
    if (error) throw error
  }

  const cards = state.cards || []
  const cardIds = new Set(cards.map((card) => `${uid}:${card.id}`))
  const { data: existingCards, error: cardReadErr } = await supabase
    .from('customer_cards').select('id').eq('user_id', uid)
  if (cardReadErr) throw cardReadErr
  const orphanCards = (existingCards || []).map((r) => r.id).filter((id) => !cardIds.has(id))
  if (orphanCards.length) {
    const { error } = await supabase.from('customer_cards').delete().in('id', orphanCards)
    if (error) throw error
  }
  if (cards.length) {
    const rows = cards.map((card) => ({
      id: `${uid}:${card.id}`,
      user_id: uid,
      brand: card.brand || '',
      last4: String(card.last4 || '').slice(-4),
      exp: card.exp || '',
      bank: card.bank || '',
      is_default: !!card.isDefault,
    }))
    let { error } = await supabase.from('customer_cards').upsert(rows)
    if (error && /is_default|schema cache|column/i.test(error.message || '')) {
      ;({ error } = await supabase.from('customer_cards').upsert(rows.map(({ is_default, ...r }) => r)))
    }
    if (error) throw error
  }

  {
    const wallets = state.linkedWallets || []
    const walletIds = new Set(wallets.map((w) => `${uid}:${w.id}`))
    const existing = await supabase.from('customer_wallets').select('id').eq('user_id', uid)
    if (existing.error && !/does not exist|schema cache|relation/i.test(existing.error.message || '')) throw existing.error
    if (!existing.error) {
      const orphans = (existing.data || []).map((r) => r.id).filter((id) => !walletIds.has(id))
      if (orphans.length) {
        const { error } = await supabase.from('customer_wallets').delete().in('id', orphans)
        if (error) throw error
      }
      if (wallets.length) {
        const { error } = await supabase.from('customer_wallets').upsert(wallets.map((w) => ({
          id: `${uid}:${w.id}`,
          user_id: uid,
          provider: w.provider,
          label: w.label || '',
          phone: w.phone || '',
          is_default: !!w.isDefault,
        })))
        if (error && !/does not exist|schema cache|relation/i.test(error.message || '')) throw error
      }
    }
  }

  const clinic = state.clinicInfo || {}
  let photo = clinic.photo || ''
  if (photo.startsWith('data:')) {
    photo = await uploadClinicPhoto(photo)
    write({ clinicInfo: { ...clinic, photo } }, { remote: true })
  }
  const clinicRow = {
    user_id: uid,
    name: clinic.name || state.clinic || '',
    address: clinic.address || '',
    hours: clinic.hours || '',
    phone: clinic.phone || '',
    website: clinic.website || '',
    photo_url: photo.startsWith('http') ? photo.split('?')[0] : '',
    updated_at: new Date().toISOString(),
  }
  const { error: clinicErr } = await supabase.from('customer_clinic').upsert(clinicRow)
  if (clinicErr && !/does not exist|schema cache/i.test(clinicErr.message || '')) throw clinicErr

  const favs = [
    ...(state.favProducts || []).map((id) => ({ kind: 'product', item_id: String(id) })),
    ...(state.favCourses || []).map((id) => ({ kind: 'course', item_id: String(id) })),
    ...(state.favMasters || []).map((id) => ({ kind: 'master', item_id: String(id) })),
  ]
  const favKey = (row) => `${row.kind}:${row.item_id}`
  const keepFav = new Set(favs.map(favKey))
  const { data: existingFavs, error: favReadErr } = await supabase
    .from('customer_favorites').select('kind,item_id').eq('user_id', uid)
  if (favReadErr) throw favReadErr
  const orphans = (existingFavs || []).filter((row) => !keepFav.has(`${row.kind}:${row.item_id}`))
  for (const row of orphans) {
    const { error } = await supabase.from('customer_favorites').delete()
      .eq('user_id', uid).eq('kind', row.kind).eq('item_id', row.item_id)
    if (error) throw error
  }
  const haveFav = new Set((existingFavs || []).map((row) => `${row.kind}:${row.item_id}`))
  const toInsert = favs.filter((row) => !haveFav.has(favKey(row)))
  if (toInsert.length) {
    const { error } = await supabase.from('customer_favorites').upsert(
      toInsert.map((row) => ({ ...row, user_id: uid })),
      { onConflict: 'user_id,kind,item_id' },
    )
    if (error) throw error
  }

  const progress = Object.entries(state.courseDone || {})
  if (progress.length) {
    const { error } = await supabase.from('customer_course_progress').upsert(progress.map(([course_id, done]) => ({
      user_id: uid,
      course_id,
      done: Number(done) || 0,
    })))
    if (error) throw error
  }
}

async function uploadClinicPhoto(dataUrl) {
  const uid = currentUid()
  if (!supabase || !uid || !String(dataUrl).startsWith('data:')) return dataUrl
  const [meta, b64] = String(dataUrl).split(',')
  const mime = /data:(.*?);/.exec(meta)?.[1] || 'image/jpeg'
  const binary = atob(b64 || '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  const ext = mime.includes('png') ? 'png' : 'jpg'
  const path = `${uid}/clinic.${ext}`
  const { error } = await supabase.storage.from('clinic').upload(path, bytes, { contentType: mime, upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('clinic').getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}

async function hydrateProfile(nextUid) {
  if (!supabase || !nextUid) {
    hydratedUid = null
    applyingRemote = true
    localStorage.removeItem(KEY)
    state = { ...DEFAULT, accountLive: false, loggedOut: true }
    applyingRemote = false
    listeners.forEach((l) => l())
    return
  }
  // Clear local UI immediately for non-demo accounts, but do NOT sync children yet.
  if (!isDemoUser()) {
    applyingRemote = true
    state = { ...EMPTY_ACCOUNT }
    applyingRemote = false
    listeners.forEach((l) => l())
  }

  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', nextUid).maybeSingle()
  if (error) {
    write({ syncError: error.message, accountLive: false }, { remote: true })
    return
  }

  // Always load children from DB first — never invent empty arrays over real rows.
  const [addresses, cards, favs, progress, clinicRes, walletsRes, certsRes] = await Promise.all([
    supabase.from('customer_addresses').select('payload,sort_at').eq('user_id', nextUid).order('sort_at'),
    supabase.from('customer_cards').select('*').eq('user_id', nextUid),
    supabase.from('customer_favorites').select('kind,item_id').eq('user_id', nextUid),
    supabase.from('customer_course_progress').select('course_id,done').eq('user_id', nextUid),
    supabase.from('customer_clinic').select('*').eq('user_id', nextUid).maybeSingle(),
    supabase.from('customer_wallets').select('*').eq('user_id', nextUid),
    supabase.from('customer_certificates').select('*').eq('user_id', nextUid).order('created_at', { ascending: false }),
  ])
  const softFail = (res) => res?.error && !/does not exist|schema cache|relation/i.test(res.error.message || '')
  const failed = [addresses, cards, favs, progress].find((res) => res.error)
  if (failed) {
    write({ syncError: failed.error.message, accountLive: true, loggedOut: false }, { remote: true })
    return
  }
  if (softFail(clinicRes) || softFail(walletsRes) || softFail(certsRes)) {
    const err = [clinicRes, walletsRes, certsRes].find(softFail)
    write({ syncError: err.error.message, accountLive: true, loggedOut: false }, { remote: true })
    return
  }

  const prefs = { ...(profile?.prefs || {}) }
  if (!prefs.customer_seeded) {
    prefs.customer_seeded = true
    // Mark seeded only — do not wipe children or push empty local state.
    await supabase.from('profiles').update({
      prefs,
      updated_at: new Date().toISOString(),
    }).eq('id', nextUid)
  }

  const courseDone = {}
  ;(progress.data || []).forEach((row) => { courseDone[row.course_id] = row.done })
  const clinicRow = clinicRes?.data

  // Demo organizer first-run: if no children yet, allow push of local demo seed once.
  if (isDemoUser() && !(addresses.data || []).length && !(cards.data || []).length) {
    write({ accountLive: true, loggedOut: false, syncError: '' }, { remote: true })
    hydratedUid = nextUid
    await pushProfile()
    return
  }

  write({
    accountLive: true,
    loggedOut: false,
    syncError: '',
    name: profile?.name || state.name,
    role: profile?.specialty || state.role,
    clinic: profile?.clinic || clinicRow?.name || '',
    city: profile?.city || state.city,
    district: profile?.district || '',
    phone: localPhone(profile?.phone),
    email: profile?.email || state.email,
    avatar: profile?.avatar_url || '',
    license: profile?.license || '',
    experience: profile?.experience_years ? String(profile.experience_years) : '',
    about: profile?.about || '',
    verified: !!profile?.verified,
    lang: profile?.lang || 'uz',
    plus: !!profile?.plus,
    bonus: profile?.bonus || 0,
    notif: { ...DEFAULT.notif, ...(profile?.notif || {}) },
    addresses: (addresses.data || []).map((row) => row.payload),
    cards: (cards.data || []).map((card) => ({
      id: String(card.id).split(':').pop(),
      brand: card.brand,
      last4: card.last4,
      exp: card.exp,
      bank: card.bank,
      isDefault: !!card.is_default,
    })),
    linkedWallets: (walletsRes?.data || []).map((w) => ({
      id: String(w.id).split(':').pop(),
      provider: w.provider,
      label: w.label || '',
      phone: w.phone || '',
      isDefault: !!w.is_default,
    })),
    clinicInfo: {
      name: clinicRow?.name || profile?.clinic || '',
      address: clinicRow?.address || '',
      hours: clinicRow?.hours || '',
      phone: clinicRow?.phone || '',
      website: clinicRow?.website || '',
      photo: clinicRow?.photo_url || '',
    },
    certificates: (certsRes?.data || []).map((c) => ({
      id: c.id,
      courseId: c.course_id,
      title: c.title,
      issuedAt: c.issued_at,
      fileUrl: c.file_url || '',
    })),
    defaultAddr: prefs.defaultAddr || '',
    defaultPay: prefs.defaultPay || '',
    favProducts: (favs.data || []).filter((row) => row.kind === 'product').map((row) => row.item_id),
    favCourses: (favs.data || []).filter((row) => row.kind === 'course').map((row) => row.item_id),
    favMasters: (favs.data || []).filter((row) => row.kind === 'master').map((row) => row.item_id),
    readNotifs: prefs.readNotifs || [],
    courseDone,
  }, { remote: true })
  hydratedUid = nextUid
}

async function refreshOrders() {
  const uid = currentUid()
  if (!supabase || !uid) return
  write({ ordersStatus: 'loading', ordersError: '' }, { remote: true })
  try {
    const orders = await fetchMyOrders(uid)
    write({ orders, ordersStatus: 'ready' }, { remote: true })
  } catch (e) {
    write({ ordersStatus: 'error', ordersError: e.message || 'Buyurtmalar yuklanmadi' }, { remote: true })
  }
}

onAccount((id) => { hydrateProfile(id).then(() => { if (id) refreshOrders() }) })

const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useProfile = () => useSyncExternalStore(subscribe, () => state)
export const allOrders = (s) => s.orders || []

export const profileStore = {
  update: (patch) => write(patch),
  refreshOrders,
  // Faqat "yangi" holatdagi buyurtmani server orqali bekor qiladi
  cancelOrder: async (id, reason = '') => {
    const order = state.orders.find((o) => o.id === id || o.dbId === id)
    if (!order?.dbId) throw new Error('Buyurtma topilmadi')
    await cancelMyOrder(order.dbId, reason)
    await refreshOrders()
  },
  toggleFav: (key, id) => {
    const sid = String(id)
    const list = (state[key] || []).map(String)
    write({ [key]: list.includes(sid) ? list.filter((x) => x !== sid) : [...list, sid] })
  },
  setCourseDone: (id, n) => write({ courseDone: { ...state.courseDone, [id]: n } }),
}
