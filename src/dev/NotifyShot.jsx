// DEV-only: bildirishnomalar skrinshotlari uchun soxta (mock) ma’lumot. Prod build’ga kirmaydi.
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import MobileMarketplace from '../components/mobile/MobileMarketplace'
import { NotificationPanel } from '../components/NotificationBell'
import { __announceForDemo, __setNotificationsForDemo } from '../notificationsStore'

const ago = (min) => new Date(Date.now() - min * 60000).toISOString()
const ITEMS = [
  { id: 'n1', kind: 'order', title: 'Buyurtma #STH-00028: Yo‘lda', body: 'Buyurtmangiz yo‘lga chiqdi.', link: '/buyurtma/kuzatish/STH-00028', created_at: ago(2) },
  { id: 'n2', kind: 'order', title: 'Buyurtma #STH-00028: Tayyorlanmoqda', body: 'Sotuvchi buyurtmangizni tayyorlayapti.', link: '/buyurtma/kuzatish/STH-00028', created_at: ago(38) },
  { id: 'n3', kind: 'order', title: 'Buyurtma #STH-00028: Qabul qilindi', body: 'Sotuvchi buyurtmangizni qabul qildi.', link: '/buyurtma/kuzatish/STH-00028', created_at: ago(75) },
  { id: 'n4', kind: 'order', title: 'Buyurtma #STH-00026: Yetkazildi', body: 'Buyurtmangiz yetkazib berildi.', link: '/buyurtma/kuzatish/STH-00026', created_at: ago(60 * 26), read_at: ago(60 * 20) },
  { id: 'n5', kind: 'order', title: 'Buyurtma #STH-00024: Bekor qilindi', body: 'Buyurtma bekor qilindi: Mahsulot omborda qolmagan.', link: '/buyurtma/kuzatish/STH-00024', created_at: ago(60 * 72), read_at: ago(60 * 70) },
]

export default function NotifyShot() {
  const { mode } = useParams()
  const [panel, setPanel] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => {
      if (mode === 'toast') {
        __setNotificationsForDemo(ITEMS.slice(1))
        setTimeout(() => __announceForDemo(ITEMS[0]), 200)
      } else __setNotificationsForDemo(ITEMS)
      if (mode === 'list') setPanel(true)
    }, 1800)
    return () => clearTimeout(t)
  }, [mode])
  return (
    <>
      <MobileMarketplace />
      {panel && <NotificationPanel onClose={() => setPanel(false)} />}
    </>
  )
}
