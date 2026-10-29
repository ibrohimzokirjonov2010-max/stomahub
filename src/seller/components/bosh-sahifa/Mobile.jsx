import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ChevronDown, ChevronRight, ShoppingCart, Box, CreditCard, Coins, Plus, FileText, Tag, Megaphone, Package } from 'lucide-react'
import { dmy, hm, monthTitle, som, MONTHS } from '../../format'
import ProductThumb from './ProductThumb'
import Empty from '../shell/Empty'

const MSTATUS = { yangi: 'Yangi', tasdiqlandi: 'Tasdiqlandi', tayyorlanmoqda: 'Tayyorlanmoqda', yetkazilmoqda: 'Yetkazilmoqda', yetkazildi: 'Yetkazildi', bekor_qilindi: 'Bekor qilindi' }

export function Welcome({ shop }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#E3F4F2] to-[#CCFBF1] px-4 py-5">
      <div className="relative z-10 max-w-[70%]">
        <div className="text-[17px] font-extrabold text-[#10283F]">Xush kelibsiz, {shop}!</div>
        <div className="mt-1 text-[13.5px] text-[#3D4E5F]">Do‘koningiz bugungi holati bilan tanishing.</div>
      </div>
      <img src="/images/hero-implant.jpg" alt="" className="absolute inset-y-0 right-0 h-full w-[42%] object-cover opacity-90 [mask-image:linear-gradient(to_right,transparent,black_40%)]" />
    </div>
  )
}

export function PeriodBar({ month, setMonth }) {
  const [open, setOpen] = useState(false)
  const now = new Date()
  const options = Array.from({ length: 12 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - i, 1))
  return (
    <div className="relative mt-4 flex items-center justify-between">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 text-[15px] font-semibold text-[#10283F]">
        <CalendarDays className="size-5" />{month ? monthTitle(month) : 'Barcha davrlar'}<ChevronDown className="size-4" />
      </button>
      <button type="button" onClick={() => setMonth(null)} className={`flex h-[34px] items-center gap-2 rounded-lg border px-3 text-[13px] ${month ? 'border-[#C9D6DA] text-[#10283F]' : 'border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]'}`}>
        <CalendarDays className="size-4 text-[#0F766E]" />Barcha davrlar
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-20 max-h-64 w-48 overflow-y-auto rounded-xl border border-[#E6EEF0] bg-white py-1 shadow-lg">
          {options.map((d) => (
            <button key={d.toISOString()} type="button" onClick={() => { setMonth(d); setOpen(false) }} className="block w-full px-3 py-2 text-left text-[14px] hover:bg-[#F0FDFA]">{MONTHS[d.getMonth()][0].toUpperCase() + MONTHS[d.getMonth()].slice(1)} {d.getFullYear()}</button>
          ))}
        </div>
      )}
    </div>
  )
}

export function MobileStats({ s }) {
  const items = [
    [ShoppingCart, 'Sotuv summasi', som(s.sum)],
    [Box, 'Buyurtmalar soni', `${s.count} ta`],
    [CreditCard, 'O‘rtacha chek', som(s.avg)],
    [Coins, 'Komissiya (12%)', som(s.commission)],
  ]
  return (
    <div className="mt-3 grid grid-cols-2 gap-3">
      {items.map(([Icon, l, v]) => (
        <div key={l} className="flex items-center gap-3 rounded-2xl border border-[#E6EEF0] bg-white px-3 py-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#E3F4F2] text-[#0F766E]"><Icon className="size-5" strokeWidth={1.8} /></span>
          <div className="min-w-0"><div className="text-[12px] text-[#3D4E5F]">{l}</div><div className="whitespace-nowrap text-[15px] font-extrabold tracking-tight">{v}</div></div>
        </div>
      ))}
    </div>
  )
}

export function MobileQuick({ openQuick }) {
  const items = [
    ['product', 'Mahsulot qo‘shish', Plus, true],
    ['orders', 'Buyurtmalar', FileText],
    ['discount', 'Chegirma qo‘yish', Tag],
    ['campaign', 'Reklama qilish', Megaphone],
  ]
  return (
    <section className="mt-3 rounded-2xl border border-[#E6EEF0] bg-[#F7FBFB] p-3">
      <button type="button" onClick={() => openQuick('menu')} className="mb-2 text-[15px] font-bold text-[#10283F]">Tezkor amal</button>
      <div className="grid grid-cols-4 gap-2">
        {items.map(([k, l, Icon, filled]) => {
          const body = (<>
            {filled ? <span className="grid size-[22px] place-items-center rounded-full bg-[#0F766E] text-white"><Icon className="size-4" strokeWidth={2.5} /></span> : <Icon className="size-[22px] text-[#0F766E]" strokeWidth={1.8} />}
            <span className="text-[11px] leading-tight text-[#10283F]">{l}</span></>)
          const cls = 'flex h-[62px] flex-col items-center justify-center gap-1.5 rounded-xl border border-[#E6EEF0] bg-white px-1 text-center'
          return k === 'orders'
            ? <Link key={k} to="/sotuvchi/buyurtmalar" className={cls}>{body}</Link>
            : <button key={k} type="button" onClick={() => openQuick(k)} className={cls}>{body}</button>
        })}
      </div>
    </section>
  )
}

function Head({ title, to }) {
  return (
    <div className="mb-2 mt-5 flex items-center justify-between">
      <h2 className="text-[16px] font-bold text-[#10283F]">{title}</h2>
      <Link to={to} className="flex items-center gap-1 text-[13px] text-[#0F766E]">Barchasini ko‘rish<ChevronRight className="size-4" /></Link>
    </div>
  )
}

export function MobileOrders({ orders, onOpen }) {
  return (
    <section>
      <Head title="So‘nggi buyurtmalar" to="/sotuvchi/buyurtmalar" />
      <div className="overflow-hidden rounded-2xl border border-[#E6EEF0] bg-white">
        {orders.length === 0 ? <Empty icon={FileText} title="Hozircha buyurtmalar yo‘q" text="Yangi buyurtmalar shu yerda ko‘rinadi." /> : orders.map((o) => (
          <button key={o.id} type="button" onClick={() => onOpen(o.id)} className="flex w-full items-center gap-3 border-b border-[#EEF3F4] p-2.5 text-left last:border-0">
            <ProductThumb src={o.items[0]?.image_url} className="h-[52px] w-[66px] rounded-lg" />
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-bold">#{o.code}</div>
              <div className="text-[12px] text-[#6B7A88]">{dmy(o.created_at)} {hm(o.created_at)}</div>
              <div className="text-[12px] text-[#6B7A88]">{o.items.length} ta mahsulot</div><div className="whitespace-nowrap text-[13px] font-semibold text-[#10283F]">{som(o.subtotal)}</div>
            </div>
            <span className="rounded-full bg-[#E3F4F2] px-3 py-1 text-[11.5px] font-medium text-[#115E59]">{MSTATUS[o.status]}</span>
            <ChevronRight className="size-4 text-[#3D4E5F]" />
          </button>
        ))}
      </div>
    </section>
  )
}

export function Popular({ products }) {
  return (
    <section>
      <Head title="Mashhur mahsulotlar" to="/sotuvchi/mahsulotlar" />
      {products.length === 0 ? (
        <div className="rounded-2xl border border-[#E6EEF0] bg-white"><Empty icon={Package} title="Hozircha sotilgan mahsulot yo‘q" text="Eng ko‘p sotilgan mahsulotlaringiz shu yerda chiqadi." /></div>
      ) : (
        <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
          {products.map((p) => (
            <div key={p.id} className="w-[104px] shrink-0 overflow-hidden rounded-xl border border-[#E6EEF0] bg-white">
              <ProductThumb src={p.image_url} className="h-[74px] w-full rounded-none" />
              <div className="p-1.5"><div className="truncate text-[11px]">{p.name}</div><div className="text-[12px] font-bold">{som(p.price)}</div><div className="text-[10.5px] text-[#6B7A88]">{p.sold} dona sotilgan</div></div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
