import { useEffect } from 'react'
import { Banknote, ShieldCheck } from 'lucide-react'
import MobileTabBar from './MobileTabBar'
import { SubTopBar } from './MobileManzillar'

const navy = 'text-[#0d2a4a]'

// StomaHub hozircha faqat naqd to‘lovni qabul qiladi — karta saqlanmaydi.
export default function MobileTolovUsullari() {
  useEffect(() => { window.scrollTo(0, 0) }, [])
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_28%,#f6faf9_100%)] pb-[86px]">
      <div className="px-3 pt-3">
        <SubTopBar title="To‘lov usullari" subtitle="Buyurtmalar uchun to‘lov" />
        <section className="mt-3 flex items-start gap-3 rounded-2xl bg-white p-3.5 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e3f5f3] text-[#0F766E]"><Banknote className="size-5" /></span>
          <div>
            <p className={`text-[14.5px] font-bold ${navy}`}>Naqd to‘lov</p>
            <p className="mt-0.5 text-[12.5px] text-ink-2">Mahsulotni kuryerdan yoki do‘kondan olganingizda naqd to‘laysiz.</p>
          </div>
        </section>
        <p className="mt-3 flex items-start gap-2 px-1 text-[12px] text-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#0F766E]" /> Onlayn to‘lov va karta saqlash hozircha mavjud emas — hech qanday karta ma’lumoti so‘ralmaydi.
        </p>
      </div>
      <MobileTabBar />
    </div>
  )
}
