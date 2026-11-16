// DEV-only: desktop savat toast skrinshotlari uchun namuna mahsulotlar (bazaga yozilmaydi). Prod build’ga kirmaydi.
import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { __shotMarket } from '../buyerApi'
import { useCart } from '../cart'
import { buyNowItem } from '../checkoutUtils'

const SID = '3c8d1e22-7a4b-4c55-8e90-1f2a3b4c5d6e'
const row = (n, name, brand, category, price, stock, image) => ({
  id: `7d1c0b2a-0000-4000-8000-00000000000${n}`, sellerId: SID, seller: 'DentaPro Toshkent', name, brand, category, rawCategory: category, type: category,
  price, stock, image, images: [image], description: 'Klinik amaliyot uchun sertifikatlangan material.', variants: [], uom: 'dona', minQty: 1, priceTiers: [], rx: false, live: true,
})
export const ROWS = [
  row(1, 'Kompozit plomba materiali Filtek Z250, A2', '3M', 'Terapiya', 245000, 12, '/images/product-1.jpg'),
  row(2, 'Endodontik fayllar K-File 25 mm, 6 dona', 'Dentsply', 'Endodontiya', 98000, 30, '/images/product-2.jpg'),
  row(3, 'Bir martalik qo‘lqop nitril, M, 100 dona', 'Medicom', 'Gigiyena', 75000, 0, '/images/product-3.jpg'),
  row(4, 'Bond adgeziv Single Bond Universal', '3M', 'Terapiya', 410000, 5, '/images/product-4.jpg'),
]

export default function CartToastShot() {
  const [sp] = useSearchParams()
  const [ready, setReady] = useState(false)
  const { add } = useCart()
  useEffect(() => {
    __shotMarket?.(ROWS)
    if (sp.get('add')) add(ROWS[0], 1) // checkout skrinshotlari uchun savatda bitta mahsulot
    setReady(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  if (!ready) return null
  return <Navigate to={sp.get('to') || '/marketplace'} replace state={sp.get('buynow') ? { buyNow: buyNowItem(ROWS[0], 1) } : undefined} />
}
