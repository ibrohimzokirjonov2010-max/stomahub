import { useSyncExternalStore } from 'react'
import { marketProducts } from './marketData'

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

export const courseDone = (profile, c) => Math.min(c.lessons, profile.courseDone?.[c.id] ?? c.done)

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

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY))
    return v ? { ...DEFAULT, ...v, notif: { ...DEFAULT.notif, ...v.notif } } : DEFAULT
  } catch {
    return DEFAULT
  }
}

let state = read()

function write(next) {
  state = { ...state, ...next }
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    localStorage.setItem(KEY, JSON.stringify({ ...state, avatar: '' }))
  }
  listeners.forEach((l) => l())
}

const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useProfile = () => useSyncExternalStore(subscribe, () => state)
export const allOrders = (s) => [...s.orders, ...SEED_ORDERS]

export const profileStore = {
  update: (patch) => write(patch),
  addOrder: (order) => write({ orders: [{ ...order, status: 'processing' }, ...state.orders] }),
  cancelOrder: (id) => write({ orders: state.orders.map((o) => (o.id === id ? { ...o, status: 'cancelled' } : o)) }),
  toggleFav: (key, id) => {
    const list = state[key]
    write({ [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] })
  },
  setCourseDone: (id, n) => write({ courseDone: { ...state.courseDone, [id]: n } }),
}
