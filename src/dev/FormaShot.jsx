// DEV-only: Forma ↔ sotuvchi kabineti skrinshotlari (mock ma’lumot, bazaga yozilmaydi). Prod build’ga kirmaydi.
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { __shotSellerState } from '../seller/api'
import { __shotMarket } from '../buyerApi'
import ProductForm from '../seller/components/mahsulotlar/ProductForm'
import Buyurtmalar from '../seller/pages/Buyurtmalar'
import BuyurtmaDetail from '../seller/pages/BuyurtmaDetail'
import MobileFormaItem from '../components/mobile/MobileFormaItem'
import { Toaster } from '../seller/components/ui'
import { products as uniforms } from '../formaData'
import { useCatalogVersion } from '../recordSync'

const PID = '9b2f6a10-4c3e-4f7a-9d21-6a1e0c5b7f01'
const SID = '3c8d1e22-7a4b-4c55-8e90-1f2a3b4c5d6e'
const V = (size, color, stock, price = 320000) => ({ type: 'forma', size, color, price, stock, sku: `MS-${size}-${color}`, label: `${size} · ${color === 'navy' ? 'To‘q ko‘k' : color === 'wine' ? 'Bordo' : 'Oq'}` })
const VARIANTS = [V('S', 'navy', 3), V('M', 'navy', 6), V('L', 'navy', 0), V('XL', 'navy', 2), V('S', 'wine', 4), V('M', 'wine', 5), V('L', 'wine', 1), V('XL', 'wine', 0)]
export const FORMA_ROW = {
  id: PID, sellerId: SID, seller: 'MedStyle Toshkent', name: 'Ayollar skrab to‘plami Comfort', brand: 'MedStyle', category: 'Tibbiy forma', rawCategory: 'Tibbiy forma',
  price: 320000, stock: 21, image: '/images/demo/forma/f1.webp', images: ['/images/demo/forma/f1.webp', '/images/demo/forma/f2.webp'],
  description: 'Cho‘ziluvchan stretch mato, V-yoqa va 5 ta cho‘ntak. 60 °C da yuvishga chidamli, rangini yo‘qotmaydi. Uzoq qabul kunlari uchun yengil va qulay.',
  variants: VARIANTS, variantType: 'forma', forma: { cat: 'scrub', gender: 'female', fabric: 'stretch', size_type: 'clothing', kashta_price: 35000 },
  uom: 'dona', minQty: 1, priceTiers: [], rx: false, live: true,
}
const SELLER_PRODUCT = { id: PID, seller_id: SID, name: FORMA_ROW.name, category: 'Tibbiy forma', variant_type: 'forma', variants: VARIANTS, sku: 'MS-COMFORT', status: 'active', price: 320000, stock: 21, image_url: FORMA_ROW.image, images: FORMA_ROW.images }
const at = (h, m) => new Date(Date.UTC(2026, 10, 10, h - 5, m)).toISOString()
const ORDERS = [
  { id: 'o-f1', code: 'STH-00031', status: 'yangi', source: 'marketplace', payment_method: 'cash', payment_status: 'pending', customer_name: 'Dilnoza Karimova', customer_phone: '+998 90 123 45 67', city: 'Toshkent, Yunusobod', address: '19-mavze, 12-uy', subtotal: 710000, delivery_method: 'kuryer', created_at: at(14, 42),
    items: [
      { id: 'i1', product_id: PID, name: FORMA_ROW.name, variant: 'MS-M-wine', qty: 1, price: 355000, note: 'Logo tikish: chap ko‘krakda, ostida «Dr. Karimova D.»', logo_path: '/images/logo.png', image_url: FORMA_ROW.image },
      { id: 'i2', product_id: PID, name: FORMA_ROW.name, variant: 'MS-S-navy', qty: 1, price: 355000, note: 'Kashta: Dr. Karimova D. — Stomatolog', image_url: FORMA_ROW.image },
    ] },
  { id: 'o-f2', code: 'STH-00029', status: 'tayyorlanmoqda', source: 'marketplace', payment_method: 'click', payment_status: 'held', customer_name: 'Jasur Aliyev', customer_phone: '+998 93 555 11 22', city: 'Samarqand', address: 'Registon ko‘chasi 4', subtotal: 640000, delivery_method: 'kuryer', created_at: at(11, 5),
    items: [{ id: 'i3', product_id: PID, name: FORMA_ROW.name, variant: 'MS-XL-navy', qty: 2, price: 320000, note: '', image_url: FORMA_ROW.image }] },
]
const DRAFT = {
  name: 'Ayollar skrab to‘plami Comfort', category: 'Tibbiy forma', brand: 'MedStyle', country: 'O‘zbekiston', description: 'Cho‘ziluvchan stretch mato, V-yoqa va 5 ta cho‘ntak.', price: '320000', stock: '', sku: 'MS-COMFORT', expires_on: '', unit: '',
  images: FORMA_ROW.images, variant_type: 'forma', variants: VARIANTS.slice(0, 4).map((x) => ({ ...x, price: String(x.price), stock: String(x.stock), sku: '' })), documents: [], specs: [], clinical_use: '', delivery_info: '', reorder_enabled: false, reorder_days: 30, uom: 'dona', min_qty: '1', price_tiers: [], reg_cert_no: '', lot_no: '', storage_temp: '',
  forma: { cat: 'scrub', gender: 'female', fabric: 'stretch', size_type: 'clothing', kashta_on: true, kashta_price: '35000' },
}

export default function FormaShot() {
  const { sec, id } = useParams()
  const [ready, setReady] = useState(false)
  const cv = useCatalogVersion()
  const [, bump] = useState(0)
  // 0064 migratsiyasi qo‘llangandagi holat: namuna qalpoq — bitta (universal) o‘lcham
  useEffect(() => {
    const cap = uniforms.find((x) => x.id === 'demo-forma-qalpoq-3')
    if (sec === 'buyer' && id === 'demo-forma-qalpoq-3' && cap && !cap.sizeType) { Object.assign(cap, { sizeType: 'one', sizes: ['Universal'] }); bump((n) => n + 1) }
  }, [sec, id, cv])
  useEffect(() => {
    __shotSellerState?.({ products: [SELLER_PRODUCT], orders: ORDERS, payouts: [], customers: [], reviews: [], adTopups: [] })
    __shotMarket?.([FORMA_ROW])
    if (sec === 'form') try { localStorage.setItem('sh:seller:product-draft', JSON.stringify({ v: DRAFT, at: Date.now() })) } catch { /* */ }
    setReady(true)
  }, [sec])
  if (!ready) return null
  if (sec === 'form') return <div className="min-h-screen bg-[#F6FAFA]"><ProductForm open onClose={() => {}} product={null} /><Toaster /></div>
  if (sec === 'orders') return <div className="min-h-screen bg-[#F6FAFA] px-4 pt-4"><Buyurtmalar /></div>
  if (sec === 'order') return <div className="min-h-screen bg-[#F6FAFA] px-4 pt-4"><BuyurtmaDetail /></div>
  return <MobileFormaItem />
}
