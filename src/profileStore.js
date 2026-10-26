import { useSyncExternalStore } from 'react'
import { marketProducts } from './marketData'
import { supabase } from './supabaseClient'
import { currentUid, isDemoUser, onAccount, uploadAvatar } from './recordSync'

const KEY = 'stomahub-profile'
const product = (id) => marketProducts.find((x) => x.id === id)

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
  return Math.min(c.lessons, stored ?? c.done)
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

const DEFAULT = {
  name: 'Ibrohim Zokirjonov',
  role: 'Stomatolog',
  clinic: 'Smile Dental Clinic',
  city: 'Toshkent',
  district: 'Chilonzor',
  phone: '901234567',
  email: 'ibrohim@stomahub.uz',
  avatar: '',
  lang: 'uz',
  plus: false,
  bonus: 125000,
  loggedOut: false,
  notif: { orders: true, seminars: true, promo: false, community: true, sound: true },
  addresses: [
    addr('uy', 'home', 'Ibrohim Zokirjonov', '901234567', 'Yunusobod', 'Amir Temur ko‘chasi, 25-uy', '12-xonadon'),
    addr('klinika', 'work', 'Smile Dental Clinic', '977654321', 'Chilonzor', 'Bunyodkor ko‘chasi, 15B-uy', '2-qavat'),
    addr('uy2', 'home', 'Ibrohim Zokirjonov', '901234567', 'Mirzo Ulug‘bek', 'Mustaqillik prospekti, 88-uy', '45-xonadon'),
    addr('dentalpro', 'work', 'Dental Pro Clinic', '934567890', 'Shayxontohur', 'Navoiy ko‘chasi, 10-uy', '1-qavat'),
  ],
  defaultAddr: 'uy',
  cards: [
    { id: 'c1', brand: 'Uzcard', last4: '4521', exp: '08/28', bank: 'Aloqabank' },
    { id: 'c2', brand: 'Humo', last4: '9034', exp: '03/27', bank: 'Kapitalbank' },
  ],
  defaultPay: 'click',
  wallets: { click: true, payme: true, uzum: false },
  favCourses: ['impl', 'estet'],
  favProducts: ['filtek-z550', 'root-zx-mini', 'ti-max-x600l', 'straumann-blx', 'sdr-flow', 'g-cem-one'],
  favMasters: ['sardor-rahimov', 'dilshod-mavlonov'],
  orders: [],
  readNotifs: ['n4'],
}

const seed = (n, at, lines, status, method = 'click', mode = 'courier') => {
  const items = lines.map(([id, qty]) => {
    const x = product(id)
    return { id: x.id, name: x.name, type: x.type, price: x.price, qty, image: x.image }
  })
  const goods = items.reduce((s, it) => s + it.price * it.qty, 0)
  return {
    id: `SH-${n}`, at, items, goods, fee: 0, discount: 0, total: goods, method, months: 0, mode, status,
    eta: status === 'delivered' ? at.split(',')[0] : 'Ertaga', days: '1–2 kun',
    address: mode === 'pickup' ? 'StomaHub do‘koni, Chilonzor tumani, Bunyodkor ko‘chasi, 14' : 'Toshkent, Chilonzor tumani, Qatortol ko‘chasi, 7-uy',
  }
}

export const SEED_ORDERS = [
  seed(10245, '25 okt, 2026 14:30', [['filtek-z550', 1], ['sdr-flow', 1], ['protaper-gold', 1], ['clearfil-se-bond-2', 1], ['g-cem-one', 1]], 'processing', 'click'),
  seed(10244, '24 okt, 2026 11:15', [['sdr-flow', 2], ['g-cem-one', 1], ['optibond-fl', 1], ['filtek-z550', 1]], 'shipping', 'payme'),
  seed(10240, '18 okt, 2026 10:20', [['protaper-gold', 1], ['clearfil-se-bond-2', 1], ['sdr-flow', 1], ['filtek-z550', 1]], 'delivered'),
  seed(10236, '9 okt, 2026 10:42', [['straumann-blx', 1], ['clearfil-se-bond-2', 1]], 'delivered', 'card'),
  seed(10228, '30 sen, 2026 18:30', [['filtek-z550', 3]], 'delivered', 'uzum'),
  seed(10219, '21 sen, 2026 09:15', [['ti-max-x600l', 1], ['g-cem-one', 1]], 'cancelled', 'click'),
  seed(10211, '12 sen, 2026 14:50', [['optibond-fl', 1], ['sdr-flow', 1]], 'delivered', 'cash', 'pickup'),
  seed(10203, '2 sen, 2026 12:10', [['woodpecker-uds-e', 1]], 'delivered', 'payme'),
  seed(10194, '24 avg, 2026 17:40', [['g-cem-one', 2], ['filtek-z550', 1]], 'delivered'),
  seed(10187, '13 avg, 2026 11:05', [['root-zx-mini', 1]], 'cancelled', 'nasiya'),
  seed(10172, '30 iyul, 2026 15:25', [['protaper-gold', 1], ['optibond-fl', 1]], 'delivered', 'card'),
]

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

async function pushProfile() {
  const uid = currentUid()
  if (!supabase || !uid || !state.accountLive) return
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
  let { error } = await supabase.from('profiles').update(patch).eq('id', uid)
  if (error && /duplicate|unique/i.test(error.message || '') && patch.phone) {
    delete patch.phone
    ;({ error } = await supabase.from('profiles').update(patch).eq('id', uid))
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
  if (state.orders?.length) {
    const { error } = await supabase.from('shop_orders').upsert(state.orders.map((order) => ({
      id: order.id,
      user_id: uid,
      status: order.status || 'processing',
      payload: order,
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
      city: profile?.city || 'Toshkent',
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
  const [addresses, cards, favs, progress, orders] = await Promise.all([
    supabase.from('customer_addresses').select('payload,sort_at').eq('user_id', nextUid).order('sort_at'),
    supabase.from('customer_cards').select('*').eq('user_id', nextUid),
    supabase.from('customer_favorites').select('kind,item_id').eq('user_id', nextUid),
    supabase.from('customer_course_progress').select('course_id,done').eq('user_id', nextUid),
    supabase.from('shop_orders').select('payload').eq('user_id', nextUid).order('created_at', { ascending: false }),
  ])
  const failed = [addresses, cards, favs, progress, orders].find((res) => res.error)
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
    orders: (orders.data || []).map((row) => row.payload),
    readNotifs: prefs.readNotifs || [],
    courseDone,
  }, { remote: true })
}

onAccount((id) => { hydrateProfile(id) })

const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useProfile = () => useSyncExternalStore(subscribe, () => state)
export const allOrders = (s) => (s.accountLive || currentUid() ? s.orders : [...s.orders, ...SEED_ORDERS])

export const profileStore = {
  update: (patch) => write(patch),
  addOrder: (order) => write({ orders: [{ ...order, status: order.status || 'processing' }, ...state.orders.filter((row) => row.id !== order.id)] }),
  cancelOrder: (id) => write({ orders: state.orders.map((o) => (o.id === id ? { ...o, status: 'cancelled' } : o)) }),
  toggleFav: (key, id) => {
    const list = state[key] || []
    write({ [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] })
  },
  setCourseDone: (id, n) => write({ courseDone: { ...state.courseDone, [id]: n } }),
}
