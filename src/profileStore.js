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
  lang: 'uz',
  plus: false,
  bonus: 0,
  loggedOut: false,
  notif: { orders: true, seminars: true, promo: false, community: true, sound: true },
  addresses: [],
  defaultAddr: '',
  cards: [],
  defaultPay: 'click',
  wallets: { click: false, payme: false, uzum: false },
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
    wallets: state.wallets,
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
    avatar_url: avatar.startsWith('http') ? avatar.split('?')[0] : '',
    plus: !!state.plus,
    bonus: Number(state.bonus) || 0,
    notif: state.notif || {},
    prefs,
    updated_at: new Date().toISOString(),
  }
  if (phone && (isDemoUser() || phone !== normalizePhone(DEFAULT.phone))) patch.phone = phone
  const { data: existing, error: readError } = await supabase.from('profiles').select('id').eq('id', uid).maybeSingle()
  if (readError) throw readError
  let error
  if (!existing) {
    ;({ error } = await supabase.from('profiles').insert({ id: uid, role: 'customer', ...patch }))
    if (error && /duplicate|unique/i.test(error.message || '') && patch.phone) {
      delete patch.phone
      ;({ error } = await supabase.from('profiles').insert({ id: uid, role: 'customer', ...patch }))
    }
  } else {
    ;({ error } = await supabase.from('profiles').update(patch).eq('id', uid))
    if (error && /duplicate|unique/i.test(error.message || '') && patch.phone) {
      delete patch.phone
      ;({ error } = await supabase.from('profiles').update(patch).eq('id', uid))
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
  const addresses = state.addresses || []
  await supabase.from('customer_addresses').delete().eq('user_id', uid)
  if (addresses.length) {
    const { error } = await supabase.from('customer_addresses').insert(addresses.map((row, index) => ({
      id: `${uid}:${row.id}`,
      user_id: uid,
      payload: row,
      sort_at: index,
    })))
    if (error) throw error
  }
  await supabase.from('customer_cards').delete().eq('user_id', uid)
  if (state.cards?.length) {
    const { error } = await supabase.from('customer_cards').insert(state.cards.map((card) => ({
      id: `${uid}:${card.id}`,
      user_id: uid,
      brand: card.brand || '',
      last4: card.last4 || '',
      exp: card.exp || '',
      bank: card.bank || '',
    })))
    if (error) throw error
  }
  await supabase.from('customer_favorites').delete().eq('user_id', uid)
  const favs = [
    ...(state.favProducts || []).map((id) => ({ kind: 'product', item_id: id })),
    ...(state.favCourses || []).map((id) => ({ kind: 'course', item_id: id })),
    ...(state.favMasters || []).map((id) => ({ kind: 'master', item_id: id })),
  ]
  if (favs.length) {
    const { error } = await supabase.from('customer_favorites').insert(favs.map((row) => ({ ...row, user_id: uid })))
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

async function hydrateProfile(nextUid) {
  if (!supabase || !nextUid) {
    applyingRemote = true
    localStorage.removeItem(KEY)
    state = { ...DEFAULT, accountLive: false, loggedOut: true }
    applyingRemote = false
    listeners.forEach((l) => l())
    return
  }
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
  const seeded = profile?.prefs?.customer_seeded
  if (!seeded && isDemoUser()) {
    write({ accountLive: true, loggedOut: false, syncError: '' }, { remote: true })
    await pushProfile()
    return
  }
  if (!seeded) {
    const prefs = { ...(profile?.prefs || {}), customer_seeded: true, defaultPay: 'click', wallets: { click: false, payme: false, uzum: false }, readNotifs: [] }
    await supabase.from('profiles').update({
      prefs,
      name: profile?.name || '',
      specialty: profile?.specialty || '',
      updated_at: new Date().toISOString(),
    }).eq('id', nextUid)
    write({
      accountLive: true,
      loggedOut: false,
      syncError: '',
      name: profile?.name || '',
      role: profile?.specialty || '',
      clinic: profile?.clinic || '',
      city: profile?.city || '',
      district: profile?.district || '',
      phone: localPhone(profile?.phone),
      email: profile?.email || '',
      avatar: profile?.avatar_url || '',
      lang: profile?.lang || 'uz',
      plus: !!profile?.plus,
      bonus: profile?.bonus || 0,
      notif: { ...DEFAULT.notif, ...(profile?.notif || {}) },
      addresses: [],
      cards: [],
      defaultAddr: '',
      defaultPay: 'click',
      wallets: prefs.wallets,
      favCourses: [],
      favProducts: [],
      favMasters: [],
      orders: [],
      readNotifs: [],
      courseDone: {},
    }, { remote: true })
    return
  }
  const [addresses, cards, favs, progress] = await Promise.all([
    supabase.from('customer_addresses').select('payload,sort_at').eq('user_id', nextUid).order('sort_at'),
    supabase.from('customer_cards').select('*').eq('user_id', nextUid),
    supabase.from('customer_favorites').select('kind,item_id').eq('user_id', nextUid),
    supabase.from('customer_course_progress').select('course_id,done').eq('user_id', nextUid),
  ])
  const orders = { data: [] }
  const failed = [addresses, cards, favs, progress].find((res) => res.error)
  if (failed) {
    write({ syncError: failed.error.message, accountLive: true, loggedOut: false }, { remote: true })
    return
  }
  const prefs = profile?.prefs || {}
  const courseDone = {}
  ;(progress.data || []).forEach((row) => { courseDone[row.course_id] = row.done })
  write({
    accountLive: true,
    loggedOut: false,
    syncError: '',
    name: profile?.name || state.name,
    role: profile?.specialty || state.role,
    clinic: profile?.clinic || '',
    city: profile?.city || state.city,
    district: profile?.district || '',
    phone: localPhone(profile?.phone),
    email: profile?.email || state.email,
    avatar: profile?.avatar_url || '',
    lang: profile?.lang || 'uz',
    plus: !!profile?.plus,
    bonus: profile?.bonus || 0,
    notif: { ...DEFAULT.notif, ...(profile?.notif || {}) },
    addresses: (addresses.data || []).map((row) => row.payload),
    cards: (cards.data || []).map((card) => ({ id: String(card.id).split(':').pop(), brand: card.brand, last4: card.last4, exp: card.exp, bank: card.bank })),
    defaultAddr: prefs.defaultAddr || '',
    defaultPay: prefs.defaultPay || 'click',
    wallets: { click: false, payme: false, uzum: false, ...(prefs.wallets || {}) },
    favProducts: (favs.data || []).filter((row) => row.kind === 'product').map((row) => row.item_id),
    favCourses: (favs.data || []).filter((row) => row.kind === 'course').map((row) => row.item_id),
    favMasters: (favs.data || []).filter((row) => row.kind === 'master').map((row) => row.item_id),
    readNotifs: prefs.readNotifs || [],
    courseDone,
  }, { remote: true })
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
    const list = state[key] || []
    write({ [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] })
  },
  setCourseDone: (id, n) => write({ courseDone: { ...state.courseDone, [id]: n } }),
}
