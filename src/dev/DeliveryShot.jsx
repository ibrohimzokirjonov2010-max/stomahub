// DEV-only: yetkazish kuzatuvi (0067) skrinshotlari — mock ma’lumot, bazaga yozilmaydi. Prod build’ga kirmaydi.
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { __shotSellerState } from '../seller/api'
import { profileStore } from '../profileStore'
import BuyurtmaDetail from '../seller/pages/BuyurtmaDetail'
import MobileKuzatish from '../components/mobile/MobileKuzatish'
import OrderTracking from '../pages/OrderTracking'
import ShopLayout from '../components/market/ShopLayout'
import { Toaster } from '../seller/components/ui'

const at = (h, m) => new Date(Date.UTC(2026, 10, 10, h - 5, m)).toISOString()
const IMG = '/images/demo/forma/f1.webp'
const hist = [{ status: 'yangi', at: at(9, 12) }, { status: 'tasdiqlandi', at: at(9, 30) }, { status: 'tayyorlanmoqda', at: at(10, 5) }]
const base = { source: 'marketplace', payment_method: 'cash', payment_status: 'pending', customer_name: 'Dilnoza Karimova', customer_phone: '+998 90 123 45 67', city: 'Toshkent, Yunusobod', address: '19-mavze, 12-uy', delivery_method: 'kuryer', created_at: at(9, 12), status_history: hist,
  items: [{ id: 'i1', product_id: 'p1', name: 'Kompozit plomba materiali Charisma A2', variant: '', qty: 2, price: 185000, image_url: '/images/demo/forma/f2.webp' }, { id: 'i2', product_id: 'p2', name: 'Ayollar skrab to‘plami Comfort', variant: '', qty: 1, price: 320000, image_url: IMG }] }
const ORDERS = [
  { ...base, id: 'o-d1', code: 'STH-00041', status: 'tayyorlanmoqda', subtotal: 690000 },
  { ...base, id: 'o-d2', code: 'STH-00042', status: 'yetkazilmoqda', subtotal: 690000, status_history: [...hist, { status: 'yetkazilmoqda', at: at(11, 20) }],
    delivery_service: 'yandex', tracking_url: 'https://dostavka.yandex.uz/route/8f3c2a1b', courier_name: 'Jasur Toshmatov', courier_phone: '+998 90 765 43 21', delivery_eta: 'bugun 12:30–13:00' },
]
const BUYER = [{
  id: 'STH-00042', dbId: 'o-d2', live: true, at: '10 noy, 2026 09:12', createdAt: at(9, 12), method: 'cash', months: 0, mode: 'courier',
  items: [{ id: 'p1', name: 'Kompozit plomba materiali Charisma A2', price: 185000, qty: 2, image: '/images/demo/forma/f2.webp' }, { id: 'p2', name: 'Ayollar skrab to‘plami Comfort', price: 320000, qty: 1, image: IMG }],
  goods: 690000, fee: 0, discount: 0, total: 690000, status: 'shipping', dbStatus: 'yetkazilmoqda', statusLabel: 'Yo‘lda', history: ORDERS[1].status_history, eta: '1–2 kun', days: '1–2 kun',
  name: 'Dilnoza Karimova', phone: '+998 90 123 45 67', address: 'Toshkent, Yunusobod, 19-mavze, 12-uy',
  trackingUrl: 'https://dostavka.yandex.uz/route/8f3c2a1b', deliveryService: 'yandex', courierName: 'Jasur Toshmatov', courierPhone: '+998 90 765 43 21', deliveryEta: 'bugun 12:30–13:00',
  paymentStatus: 'pending', paymentLabel: 'Yetkazilganda', dispute: '',
}]

export default function DeliveryShot() {
  const { sec } = useParams()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    __shotSellerState?.({ products: [], orders: ORDERS, payouts: [], customers: [], reviews: [], adTopups: [] })
    profileStore.update({ orders: BUYER, ordersStatus: 'ready' })
    setReady(true)
  }, [sec])
  if (!ready) return null
  if (sec === 'seller') return <div className="min-h-screen bg-[#F6FAFA] px-4 pt-4"><BuyurtmaDetail /><Toaster /></div>
  if (window.innerWidth < 768) return <MobileKuzatish />
  return <ShopLayout active="market"><OrderTracking /></ShopLayout>
}
