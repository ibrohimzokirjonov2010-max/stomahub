// DEV-only: Buyurtmalarim skrinshoti. Mock buyurtmalar, bazaga yozilmaydi. Prod build’ga kirmaydi.
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { profileStore } from '../profileStore'
import Profil from '../pages/Profil'
import MobileBuyurtmalar from '../components/mobile/MobileBuyurtmalar'

const S1 = '11111111-1111-4111-8111-111111111111'
const S2 = '22222222-2222-4222-8222-222222222222'
const pid = (n) => `33333333-3333-4333-8333-${String(n).padStart(12, '0')}`
const img = (n) => `/images/market/p${n}.jpg`

const item = (n, sellerId, shopName, name, price, qty, type = '') => ({
  id: pid(n), itemId: `i${n}`, sellerId, shopName, name, type, price, qty, image: img(n),
})

const goods = (items) => items.reduce((s, it) => s + it.price * it.qty, 0)

const multi = [
  item(1, S1, 'DentPro Market', 'Kompozit plomba Charisma A2', 185000, 2, 'A2'),
  item(2, S1, 'DentPro Market', 'Bonding agent Single Bond', 96000, 1),
  item(3, S2, 'Smile Lab', 'Nitril qo‘lqop', 45000, 3),
  item(4, S2, 'Smile Lab', 'Tibbiy niqob to‘plami', 28000, 2),
]
const pair = [
  item(5, S1, 'DentPro Market', 'Endomotor fayl', 120000, 1),
  item(6, S1, 'DentPro Market', 'Irrigatsiya eritmasi', 64000, 2),
]
const one = [item(7, S2, 'Smile Lab', 'Polimerizatsiya lampasi', 1450000, 1)]

const base = {
  live: true, months: 0, mode: 'courier', history: [], dispute: '',
  address: 'Toshkent, Yunusobod, 19-mavze, 12-uy', name: 'Aliyeva Mohira', phone: '+998901112233',
}

export const SHOT_ORDERS = [
  {
    ...base, id: 'STH-00024', dbId: 'o24', sellerId: S1, shopName: 'DentPro Market',
    at: '8 noy, 2026 14:20', createdAt: '2026-11-08T09:20:00.000Z', method: 'click',
    status: 'delivered', dbStatus: 'yetkazildi', statusLabel: 'Yetkazildi',
    paymentStatus: 'held', paymentLabel: 'Escrowda', deliveredAt: '2026-11-09T10:00:00.000Z',
    autoReleaseAt: '2026-11-12T10:00:00.000Z', items: multi, goods: goods(multi), fee: 15000, discount: 0,
    total: goods(multi) + 15000,
  },
  {
    ...base, id: 'STH-00023', dbId: 'o23', sellerId: S2, shopName: 'Smile Lab',
    at: '9 noy, 2026 11:05', createdAt: '2026-11-09T06:05:00.000Z', method: 'payme',
    status: 'processing', dbStatus: 'tayyorlanmoqda', statusLabel: 'Tayyorlanmoqda',
    paymentStatus: 'paid', paymentLabel: 'To‘landi', items: one, goods: goods(one), fee: 0, discount: 0, total: goods(one),
  },
  {
    ...base, id: 'STH-00022', dbId: 'o22', sellerId: S1, shopName: 'DentPro Market',
    at: '10 noy, 2026 09:12', createdAt: '2026-11-10T04:12:00.000Z', method: 'click',
    status: 'shipping', dbStatus: 'yetkazilmoqda', statusLabel: 'Yo‘lda',
    paymentStatus: 'held', paymentLabel: 'Escrowda', items: pair, goods: goods(pair), fee: 0, discount: 20000,
    total: Math.max(0, goods(pair) - 20000),
  },
]

function seed() {
  profileStore.update({
    orders: SHOT_ORDERS,
    ordersStatus: 'ready',
    ordersError: '',
    name: 'Aliyeva Mohira',
    role: 'Stomatolog',
    city: 'Toshkent',
    accountLive: false,
  })
}

export default function OrdersShot() {
  const { view } = useParams()
  useEffect(() => {
    seed()
    window.__shotSeedOrders = seed
    const timers = [40, 250, 800, 1600].map((ms) => setTimeout(seed, ms))
    return () => {
      timers.forEach(clearTimeout)
      delete window.__shotSeedOrders
    }
  }, [view])
  if (view === 'mobile') return <MobileBuyurtmalar />
  return <Profil section="orders" />
}
