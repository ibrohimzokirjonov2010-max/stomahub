import { useEffect, useState } from 'react'
import { Timer, ChevronRight, ShoppingCart, ArrowRight, Star, ShieldCheck, Truck, CreditCard } from 'lucide-react'
import { ToothIcon } from './icons'
import { sellers } from '../data'

const card = 'rounded-xl bg-white p-3 shadow-card'

function useCountdown(start) {
  const [left, setLeft] = useState(start)
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : start)), 1000)
    return () => clearInterval(t)
  }, [start])
  const p = (n) => String(n).padStart(2, '0')
  return `${p(Math.floor(left / 3600))}:${p(Math.floor((left % 3600) / 60))}:${p(left % 60)}`
}

function SpecialOffer() {
  const time = useCountdown(2 * 3600 + 18 * 60 + 45)
  return (
    <div className={card}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[14px] font-bold text-ink">Maxsus takliflar</h2>
        <div className="flex items-center gap-2">
          <span className="flex h-[22px] items-center gap-1.5 rounded-md bg-[#fde8e8] px-2 text-[11px] font-semibold tabular-nums text-danger">
            <Timer className="size-3.5" /> {time}
          </span>
          <ChevronRight className="size-4 text-ink-2" />
        </div>
      </div>
      <div className="flex overflow-hidden rounded-lg bg-[#f2f5f9]">
        <img src="/images/offer-endomotor.jpg" alt="Endomotor Pro-X" className="h-[134px] w-[50%] object-cover" />
        <div className="flex flex-1 flex-col justify-center py-2 pl-2 pr-2">
          <h3 className="text-[12px] font-semibold leading-tight text-ink">Endomotor<br />Pro-X</h3>
          <span className="mt-2 w-fit rounded bg-danger px-1.5 py-0.5 text-[10px] font-semibold text-white">-25%</span>
          <p className="mt-2 text-[9px] text-muted line-through">28 500 000 so‘m</p>
          <p className="whitespace-nowrap text-[12px] font-bold text-ink">21 250 000 so‘m</p>
          <button aria-label="Savatga qo‘shish" className="mt-2 grid h-[26px] w-[38px] place-items-center rounded bg-brand text-white transition hover:bg-brand-600">
            <ShoppingCart className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function TopSellers() {
  return (
    <div className={card}>
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-[14px] font-bold text-ink">Top sotuvchilar</h2>
        <a href="#" className="flex items-center gap-1.5 text-[11px] font-medium text-blue hover:underline">
          Barchasi <ArrowRight className="size-3.5" />
        </a>
      </div>
      <ul>
        {sellers.map((s) => (
          <li key={s.name} className="flex items-center gap-2 py-1">
            <img src={s.logo} alt="" className="size-[24px] shrink-0 rounded-full object-cover ring-1 ring-line" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[10px] font-semibold text-ink">{s.name}</p>
                <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-medium text-ink-2">
                  <Star className="size-3 fill-star text-star" /> {s.rating}
                </span>
              </div>
              <p className="text-[9.5px] text-muted">{s.count} mahsulot</p>
            </div>
            <a href="#" className="grid h-[23px] shrink-0 place-items-center rounded-md border border-line px-2 text-[9px] font-medium text-ink-2 transition hover:border-brand hover:text-brand-600">
              Do‘konga kirish
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

const reasons = [
  { icon: ShieldCheck, title: 'Tasdiqlangan sotuvchilar', text: 'Ishonchli hamkorlar' },
  { icon: Truck, title: 'Tez yetkazib berish', text: 'Barcha hududlarga' },
  { icon: ToothIcon, title: 'Stomatologlar uchun', text: 'Maxsus tanlangan assortiment' },
  { icon: CreditCard, title: 'Qulay to‘lov usullari', text: 'Click, Payme, Uzum va boshqalar' },
]

function WhyUs() {
  return (
    <div className={card}>
      <h2 className="mb-2.5 text-[13px] font-bold text-ink">Nega StomaHub?</h2>
      <div className="grid grid-cols-2 gap-x-2 gap-y-2.5">
        {reasons.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-2">
            <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-brand-50 text-brand">
              <Icon className="size-3.5" strokeWidth={1.9} />
            </span>
            <div className="leading-tight">
              <p className="text-[8.5px] font-semibold text-ink">{title}</p>
              <p className="mt-0.5 text-[8px] text-muted">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RightColumn() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 xl:content-start">
      <SpecialOffer />
      <TopSellers />
      <div className="sm:col-span-2 xl:col-span-1"><WhyUs /></div>
    </div>
  )
}
