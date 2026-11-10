// DEV-only: bildirishnomalar skrinshotlari uchun soxta (mock) ma’lumot. Prod build’ga kirmaydi.
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import MobileMarketplace from '../components/mobile/MobileMarketplace'
import Header from '../components/Header'
import { __announceForDemo, __setLoadingForDemo, __setNotificationsForDemo } from '../notificationsStore'

const ago = (min) => new Date(Date.now() - min * 60000).toISOString()
const yesterday = (h, m = 0) => { const d = new Date(Date.now() + 5 * 3600000); d.setUTCDate(d.getUTCDate() - 1); d.setUTCHours(h, m, 0, 0); return new Date(d.getTime() - 5 * 3600000).toISOString() }
const L = (code) => `/buyurtma/kuzatish/${code}`
export const DEMO_ITEMS = [
  { id: 'n1', kind: 'order', title: 'Buyurtma #STH-00028: Yo‘lda', body: 'Buyurtmangiz yo‘lga chiqdi.', link: L('STH-00028'), created_at: ago(2) },
  { id: 'n2', kind: 'order', title: 'Buyurtma #STH-00028: Tayyorlanmoqda', body: 'Sotuvchi buyurtmangizni tayyorlayapti.', link: L('STH-00028'), created_at: ago(38) },
  { id: 'n3', kind: 'order', title: 'Buyurtma #STH-00028: Qabul qilindi', body: 'Sotuvchi buyurtmangizni qabul qildi.', link: L('STH-00028'), created_at: ago(75) },
  { id: 'n4', kind: 'order', title: 'Buyurtma #STH-00026: Yetkazildi', body: 'Buyurtmangiz yetkazib berildi.', link: L('STH-00026'), created_at: yesterday(16, 40), read_at: ago(60) },
  { id: 'n5', kind: 'order', title: 'Buyurtma #STH-00024: Bekor qilindi', body: 'Buyurtma bekor qilindi: Mahsulot omborda qolmagan.', link: L('STH-00024'), created_at: ago(60 * 72), read_at: ago(60 * 70) },
  { id: 'n6', kind: 'info', title: 'Savolingizga javob berildi', body: 'Dentashop "Filtek Z350 XT" haqidagi savolingizga javob yozdi.', link: '/marketplace', created_at: ago(60 * 24 * 9), read_at: ago(60 * 24 * 8) },
]

const clickBell = () => document.querySelector('button[aria-haspopup="dialog"][aria-label^="Bildirishnomalar"]')?.click()

export default function NotifyShot() {
  const { mode } = useParams()
  useEffect(() => {
    const t = setTimeout(() => {
      if (mode === 'toast' || mode === 'desk-toast') {
        __setNotificationsForDemo(DEMO_ITEMS.slice(1))
        setTimeout(() => __announceForDemo(DEMO_ITEMS[0]), 200)
        return
      }
      if (mode === 'loading') { __setLoadingForDemo(); setTimeout(clickBell, 50); return }
      __setNotificationsForDemo(mode === 'empty' ? [] : DEMO_ITEMS)
      if (mode !== 'badge' && mode !== 'desk-badge') setTimeout(clickBell, 50)
    }, 1800)
    return () => clearTimeout(t)
  }, [mode])
  if (mode.startsWith('desk')) return <div className="min-h-screen bg-page"><Header variant="shop" /></div>
  return <MobileMarketplace />
}
