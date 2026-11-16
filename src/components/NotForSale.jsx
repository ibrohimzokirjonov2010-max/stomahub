import { Info } from 'lucide-react'
import { TEST_ORDER_TEXT } from '../lib/testSeed'

/** Savat/xarid tugmasi o‘rniga — mahsulotni hozircha buyurtma qilib bo‘lmaydi (masalan, sinov ma’lumoti). Neytral, bosilmaydi. */
export default function NotForSale({ label = TEST_ORDER_TEXT, className = '' }) {
  return (
    <div data-testid="not-for-sale" aria-disabled="true" className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line bg-[#f4f7f8] px-3 text-center text-[12.5px] font-semibold text-muted ${className}`}>
      <Info className="size-4 shrink-0" /> {label}
    </div>
  )
}
