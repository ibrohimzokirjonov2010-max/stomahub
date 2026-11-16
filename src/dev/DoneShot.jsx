// DEV-only: «Buyurtmangiz qabul qilindi» sahifasi skrinshotlari uchun namuna (bazaga yozilmaydi, haqiqiy buyurtma emas). Prod build’ga kirmaydi.
import { useSearchParams } from 'react-router-dom'
import ShopLayout from '../components/market/ShopLayout'
import { CheckoutDone } from '../pages/Checkout'
import { MobileCheckoutDone } from '../components/mobile/MobileCheckout'
import { useMobile } from '../useMobile'
import { ROWS } from './CartToastShot'

const ITEMS = [{ ...ROWS[0], qty: 2 }, { ...ROWS[1], qty: 1 }, { ...ROWS[3], qty: 1 }]
const goods = ITEMS.reduce((s, it) => s + it.price * it.qty, 0)
const CODE = 'NAMUNA-0001'

export default function DoneShot() {
  const [sp] = useSearchParams()
  const pickup = sp.get('pickup') === '1'
  const delivery = sp.get('asap') === '1' ? { date: '', slot: 'asap' } : { date: '2026-11-17', slot: '12:00–15:00' }
  const mobile = useMobile()
  if (mobile) {
    return <MobileCheckoutDone order={{ id: CODE, method: 'cash', mode: pickup ? 'pickup' : 'courier', payLinks: [], at: '16-noyabr 2026, 14:05', eta: delivery.slot === 'asap' ? 'Imkon qadar tezroq' : 'Ertaga, 17-noyabr (seshanba), 12:00–15:00', days: 'sotuvchi tasdiqlagach', total: goods, items: ITEMS }} />
  }
  return (
    <ShopLayout active="market" search="plain" placeholder="Mahsulot, brend yoki kategoriya qidiring...">
      <div className="py-6">
        <CheckoutDone origin={{ to: '/marketplace' }} placed={{ id: CODE, items: ITEMS, goods, grand: goods, method: { id: 'cash', title: 'Naqd pul' }, shipMode: pickup ? 'pickup' : 'courier', form: { city: 'Toshkent', district: 'Yunusobod tumani', address: '19-mavze, 12-uy' }, delivery, payLinks: [] }} />
      </div>
    </ShopLayout>
  )
}
