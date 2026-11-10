// DEV-only: sotuvchi turi (0065) skrinshotlari — mock sessiya/ma’lumot, bazaga yozilmaydi. Prod build’ga kirmaydi.
//   /seller-type-shot/picker            — tasdiqlangandan keyingi tanlash oynasi (kabinet ustida)
//   /seller-type-shot/cabinet/:type     — kabinet (hamma turda bir xil)
//   /seller-type-shot/form/:type        — mahsulot qo‘shish formasi (stomatologik | forma | jihozlar)
//   /seller-type-shot/jihoz/:id         — xaridor: sotuvchi qo‘shgan jihoz sahifasi
import { useEffect, useState } from 'react'
import { Routes, Route, useParams } from 'react-router-dom'
import { __shotSellerState } from '../seller/api'
import { __shotMarket } from '../buyerApi'
import { __shotSession } from '../sessionStore'
import SellerLayout from '../seller/SellerLayout'
import BoshSahifa from '../seller/pages/BoshSahifa'
import ProductForm from '../seller/components/mahsulotlar/ProductForm'
import MobileJihozItem from '../components/mobile/MobileJihozItem'
import JihozItem from '../pages/JihozItem'
import { Toaster } from '../seller/components/ui'
import { useMobile } from '../useMobile'

const SID = '3c8d1e22-7a4b-4c55-8e90-1f2a3b4c5d6e'
export const JIHOZ_PID = '7d1e0c5b-2a4f-4b3e-9c61-0f2a6b9e4d11'
const profile = (type) => ({ id: SID, role: 'seller', seller_status: 'approved', shop_name: 'Dental Tech Toshkent', name: 'Akmal Yusupov', seller_type: type || null })
const JIHOZ_ROW = {
  id: JIHOZ_PID, sellerId: SID, seller: 'Dental Tech Toshkent', name: 'Stomatologik ustanovka Sirona Intego', brand: 'Sirona', category: 'Stomatologik jihozlar', rawCategory: 'Stomatologik jihozlar',
  price: 245000000, stock: 2, image: '/images/jihozlar/sirona.jpg', images: ['/images/jihozlar/sirona.jpg', '/images/jihozlar/kavo.jpg'],
  description: 'Yangi, zavod qadoqida. Gigiyena tizimi, LED chiroq, 5 ta asbob uchun panel. O‘rnatish va xodimlarni o‘qitish narxga kiradi.',
  specs: [['Quvvat', '1,4 kVt'], ['Kuchlanish', '220 V'], ['Og‘irligi', '180 kg']], variants: [], uom: 'dona', minQty: 1, priceTiers: [], live: true,
  deliveryInfo: 'Toshkent bo‘ylab 3 kun ichida yetkazib, o‘rnatib beramiz. Viloyatlarga — kelishuv asosida.',
  jihoz: { cat: 'unit', model: 'Intego', year: 2025, warranty: 24, city: 'Toshkent', install: true },
}
const P = (name, category, price, image, status = 'active', stock = 12) => ({ id: crypto.randomUUID?.() || name, seller_id: SID, name, category, price, stock, status, image_url: image, images: [image], variants: [] })
const PRODUCTS = [P('Kompozit Filtek Z250 (4 g)', 'Plomba materiallari', 185000, '/images/market/p1.jpg'), P('Nitril qo‘lqop (100 dona)', 'Gigiyena vositalari', 65000, '/images/market/p2.jpg', 'active', 3), P('Endomotor X-Smart', 'Endodontiya', 4200000, '/images/market/p3.jpg', 'review')]
const at = (h, m) => new Date(Date.UTC(2026, 10, 10, h - 5, m)).toISOString()
const ORDERS = [
  { id: 'o1', code: 'STH-00041', status: 'yangi', source: 'marketplace', payment_method: 'cash', payment_status: 'pending', customer_name: 'Dilnoza Karimova', customer_phone: '+998901234567', city: 'Toshkent', address: 'Yunusobod 19', subtotal: 370000, delivery_method: 'kuryer', created_at: at(14, 42), items: [{ id: 'i1', name: 'Kompozit Filtek Z250 (4 g)', qty: 2, price: 185000 }] },
  { id: 'o2', code: 'STH-00038', status: 'yetkazildi', source: 'marketplace', payment_method: 'click', payment_status: 'paid', customer_name: 'Jasur Aliyev', customer_phone: '+998935551122', city: 'Samarqand', address: 'Registon 4', subtotal: 650000, delivery_method: 'kuryer', created_at: at(10, 5), items: [{ id: 'i2', name: 'Nitril qo‘lqop (100 dona)', qty: 10, price: 65000 }] },
]
const COMMON = { documents: [], specs: [], clinical_use: '', delivery_info: '', reorder_enabled: false, reorder_days: 30, uom: 'dona', min_qty: '1', price_tiers: [], reg_cert_no: '', lot_no: '', storage_temp: '', stock: '', expires_on: '', unit: '', variants: [], variant_type: 'rang' }
const DRAFTS = {
  stomatologik: { ...COMMON, name: 'Kompozit Filtek Z250 (4 g)', category: 'Plomba materiallari', brand: '3M', country: 'AQSH', description: 'Universal nanogibrid kompozit, old va yon tishlar uchun.', price: '185000', stock: '40', sku: 'FZ250-A2', unit: '4 g', images: ['/images/market/p1.jpg'] },
  forma: { ...COMMON, name: 'Ayollar skrab to‘plami Comfort', category: 'Tibbiy forma', brand: 'MedStyle', country: 'O‘zbekiston', description: 'Cho‘ziluvchan stretch mato, V-yoqa va 5 ta cho‘ntak.', price: '320000', sku: 'MS-COMFORT', images: ['/images/demo/forma/f1.webp'], variant_type: 'forma',
    forma: { cat: 'scrub', gender: 'female', fabric: 'stretch', size_type: 'clothing', kashta_on: true, kashta_price: '35000' } },
  jihozlar: { ...COMMON, name: 'Stomatologik ustanovka Sirona Intego', category: 'Stomatologik jihozlar', brand: 'Sirona', country: 'Germaniya', description: 'Yangi, zavod qadoqida. O‘rnatish va o‘qitish narxga kiradi.', price: '245000000', stock: '2', sku: 'SIR-INTEGO', images: ['/images/jihozlar/sirona.jpg', '/images/jihozlar/kavo.jpg'], reg_cert_no: 'TV/X 04512/03/25',
    specs: [['Quvvat', '1,4 kVt'], ['Kuchlanish', '220 V']], jihoz: { cat: 'unit', model: 'Intego', year: '2025', warranty: '24', city: 'Toshkent', install: true } },
}

export default function SellerTypeShot() {
  const { sec, id } = useParams()
  const mobile = useMobile()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    __shotSession?.(profile(sec === 'picker' ? null : id || 'stomatologik'))
    __shotSellerState?.({ products: PRODUCTS, orders: ORDERS, payouts: [], customers: [], reviews: [], adTopups: [], settings: { seller_id: SID } })
    __shotMarket?.([JIHOZ_ROW])
    if (sec === 'form') try { localStorage.setItem('sh:seller:product-draft', JSON.stringify({ v: DRAFTS[id] || DRAFTS.stomatologik, at: Date.now() })) } catch { /* */ }
    setReady(true)
  }, [sec, id])
  if (!ready) return null
  if (sec === 'form') return <div className="min-h-screen bg-[#F6FAFA]"><ProductForm open onClose={() => {}} product={null} /><Toaster /></div>
  if (sec === 'jihoz') return mobile ? <MobileJihozItem /> : <div className="mx-auto max-w-[1120px] px-4"><JihozItem /></div>
  return <Routes><Route element={<SellerLayout />}><Route path="*" element={<BoshSahifa />} /></Route></Routes>
}
