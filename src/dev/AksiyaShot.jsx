// DEV-only: sotuvchi aksiyalari (0068) skrinshotlari — mock ma’lumot, bazaga yozilmaydi. Prod build’ga kirmaydi.
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { __shotSellerState } from '../seller/api'
import { __shotMarket, toMarketProduct } from '../buyerApi'
import { deals } from '../aksiyaData'
import { useCatalogVersion } from '../recordSync'
import { applyPromotion } from '../lib/discounts'
import SellerAksiyalar, { PromoForm } from '../seller/pages/marketing/Aksiyalar'
import Aksiyalar from '../pages/Aksiyalar'
import Aksiya from '../pages/Aksiya'
import ShopLayout from '../components/market/ShopLayout'
import { Toaster } from '../seller/components/ui'
import { tashkentToday } from '../tashkentDate'

const S = '11111111-1111-1111-1111-111111111111'
const T = tashkentToday()
const add = (n) => new Date(Date.parse(T) + n * 864e5).toISOString().slice(0, 10)
const BANNER = '/images/aksiyalar/aksiya-endo-hero.jpg'
const PRODUCTS = [
  { id: 'p1', seller_id: S, shop_name: 'DentPro Market', name: 'Kompozit plomba Charisma A2', brand: 'Kulzer', category: 'Plomba materiallari', price: 185000, stock: 40, image_url: '/images/aksiyalar/aksiya-filtek.jpg', status: 'active' },
  { id: 'p2', seller_id: S, shop_name: 'DentPro Market', name: 'Endomotor X-Smart Plus', brand: 'Dentsply', category: 'Endodontiya', price: 6500000, stock: 5, image_url: '/images/aksiyalar/aksiya-endo-head.jpg', status: 'active' },
  { id: 'p3', seller_id: S, shop_name: 'DentPro Market', name: 'Polimerizatsiya lampasi LED', brand: 'Woodpecker', category: 'Asboblar', price: 1450000, stock: 12, image_url: '/images/aksiyalar/aksiya-lamp.jpg', status: 'active' },
  { id: 'p4', seller_id: S, shop_name: 'DentPro Market', name: 'Ultratovush skaler', brand: 'Woodpecker', category: 'Asboblar', price: 3200000, stock: 3, image_url: '/images/aksiyalar/aksiya-scaler.jpg', status: 'active' },
]
const PROMOS = [
  { id: 'a1', seller_id: S, scope: 'all', title: 'Kuzgi chegirmalar haftaligi', banner_url: BANNER, percent: 15, product_id: null, price: null, old_price: null, starts_on: T, ends_on: add(12), active: true },
  { id: 'a2', seller_id: S, scope: 'product', title: '', banner_url: '', percent: 20, product_id: 'p2', price: 5200000, old_price: 6500000, starts_on: T, ends_on: add(5), active: true },
  { id: 'a3', seller_id: S, scope: 'product', title: 'Yozgi aksiya', banner_url: '', percent: null, product_id: 'p3', price: 1200000, old_price: 1450000, starts_on: add(-60), ends_on: add(-30), active: true },
]
const seller = { name: 'DentPro Market', role: 'Sotuvchi' }
const DEALS = [
  { id: 'sp-a1', scope: 'all', title: PROMOS[0].title, name: PROMOS[0].title, banner: BANNER, image: BANNER, off: 15, percent: 15, sellerId: S, startsOn: T, endsOn: add(12), seller },
  { id: 'sp-a2', scope: 'product', title: null, name: 'Endomotor X-Smart Plus', off: 20, price: 5200000, oldPrice: 6500000, productId: 'p2', sellerId: S, startsOn: T, endsOn: add(5), image: PRODUCTS[1].image_url, seller },
  // muddati o‘tgan — ko‘rinmasligi kerak
  { id: 'sp-a3', scope: 'product', title: 'Yozgi aksiya', name: 'Lampa', off: 17, price: 1200000, oldPrice: 1450000, productId: 'p3', sellerId: S, startsOn: add(-60), endsOn: add(-30), seller },
]

export default function AksiyaShot() {
  const { sec } = useParams()
  const v = useCatalogVersion()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    window.__shotPromos = PROMOS
    __shotSellerState?.({ products: PRODUCTS, orders: [], payouts: [], customers: [], reviews: [], adTopups: [] })
    deals.splice(0, deals.length, ...DEALS)
    __shotMarket?.(PRODUCTS.map(toMarketProduct).map((p) => applyPromotion(p, DEALS)))
    setReady(true)
  }, [sec, v])
  if (!ready) return null
  if (sec === 'seller') return <div className="min-h-screen bg-[#F6FAFA] px-4 pt-4"><SellerAksiyalar /><Toaster /></div>
  if (sec === 'form-empty' || sec === 'form-filled') {
    const initial = sec === 'form-filled' ? { scope: 'all', product_id: '', title: 'Kuzgi chegirmalar haftaligi', banner_url: BANNER, mode: 'percent', percent: '15', price: '', starts_on: T, ends_on: add(12), file: null } : undefined
    return <div className="min-h-screen bg-[#F6FAFA]"><PromoForm products={PRODUCTS} busyIds={['p2']} initial={initial} onClose={() => {}} onSaved={() => {}} /></div>
  }
  if (sec === 'detail') return <ShopLayout active="aksiya"><Aksiya /></ShopLayout>
  return <Aksiyalar />
}
