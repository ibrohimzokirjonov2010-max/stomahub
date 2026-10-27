import { Link } from 'react-router-dom'
import {
  CalendarDays, ChevronDown, ChevronRight, Coins, GraduationCap, Package,
  Percent, ShoppingBag, Store, Users, Megaphone, UserPlus, Shirt, Monitor, Syringe, Box,
} from 'lucide-react'
import { BarChart } from '../Chart'
import { PayBadge } from './StatusBadge'
import { daysInMonth, dmyhm, monthTitle, num, som } from '../../format'

const card = 'rounded-2xl border border-[#E6EEF0] bg-white shadow-[0_1px_2px_rgb(16_40_63/0.04)]'

const CAT_ICON = {
  Materiallar: Box,
  Implantlar: Syringe,
  Uskunalar: Monitor,
  Seminarlar: GraduationCap,
  'Forma va kiyimlar': Shirt,
  default: Package,
}

export function MobileHead({ month, onPick }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[24px] font-extrabold tracking-tight text-[#10283F]">Boshqaruv paneli</h1>
        <p className="mt-1 text-[13.5px] leading-snug text-[#5C6E80]">Platforma faoliyati bo‘yicha umumiy ma’lumot</p>
      </div>
      <label className="relative inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E6EEF0] bg-white px-3 text-[13.5px] font-semibold text-[#10283F] shadow-sm">
        <CalendarDays className="size-4 text-[#0F766E]" />
        {monthTitle(month)}
        <ChevronDown className="size-4 text-[#5C6E80]" />
        <input
          type="month"
          className="absolute inset-0 cursor-pointer opacity-0"
          value={`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`}
          onChange={(e) => {
            const [y, m] = e.target.value.split('-').map(Number)
            if (y && m) onPick(new Date(y, m - 1, 1))
          }}
        />
      </label>
    </div>
  )
}

export function MobileKpis({ data, onOpenSales }) {
  const items = [
    {
      icon: ShoppingBag,
      label: 'Jami buyurtmalar',
      value: `${num(data.orders_count)} ta`,
      sub: `O‘tgan oy: ${num(data.orders_prev)} ta`,
      clickable: false,
    },
    {
      icon: Coins,
      label: 'Umumiy savdo summasi',
      value: som(data.turnover),
      sub: 'UZCARD / HUMO / Click / Payme',
      clickable: true,
    },
    {
      icon: Percent,
      label: 'Platforma komissiyasi (12%)',
      value: som(data.commission),
      sub: 'Platforma daromadi',
      clickable: false,
    },
    {
      icon: Users,
      label: 'Faol foydalanuvchilar',
      value: `${num(data.active_users || data.users_count)} nafar`,
      sub: 'Ro‘yxatdan o‘tgan',
      clickable: false,
    },
  ]
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {items.map(({ icon: Icon, label, value, sub, clickable }) => {
        const Comp = clickable ? 'button' : 'div'
        return (
          <Comp
            key={label}
            type={clickable ? 'button' : undefined}
            onClick={clickable ? onOpenSales : undefined}
            className={`${card} p-3.5 text-left ${clickable ? 'active:scale-[0.99]' : ''}`}
          >
            <span className="grid size-9 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]">
              <Icon className="size-[18px]" strokeWidth={1.9} />
            </span>
            <div className="mt-2.5 text-[12px] font-medium leading-snug text-[#5C6E80]">{label}</div>
            <div className="mt-0.5 text-[15px] font-extrabold leading-tight tracking-tight text-[#10283F]">{value}</div>
            <div className="mt-0.5 text-[11px] text-[#8A9AA8]">{sub}</div>
          </Comp>
        )
      })}
    </div>
  )
}

export function MobileChart({ data, month }) {
  const n = daysInMonth(month)
  const byDay = Array.from({ length: n }, () => 0)
  data.daily.forEach((d) => { if (d.day >= 1 && d.day <= n) byDay[d.day - 1] = d.sum })
  const labels = byDay.map((_, i) => (i === 0 ? `1 Okt` : i === n - 1 ? `${n} Okt` : String(i + 1)))
  // Use month short for first/last only when October — keep generic:
  const mShort = monthTitle(month).split(' ')[0].slice(0, 3)
  const labs = byDay.map((_, i) => (i === 0 || i === n - 1 ? `${i + 1} ${mShort}` : String(i + 1)))
  return (
    <div className={`${card} mt-3 p-4`}>
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-[15px] font-bold text-[#10283F]">Kunlik savdo grafigi ({monthTitle(month)})</h2>
      </div>
      <p className="mt-1 text-[12.5px] text-[#5C6E80]">Umumiy: <span className="font-semibold text-[#10283F]">{som(data.turnover)}</span></p>
      <div className="mt-3">
        <BarChart
          labels={labs}
          values={byDay}
          height={200}
          maxTicks={8}
          tipFmt={(v, i) => `${String(i + 1).padStart(2, '0')}.${String(month.getMonth() + 1).padStart(2, '0')}.${month.getFullYear()} — ${som(v)}`}
        />
      </div>
    </div>
  )
}

export function MobileCategories({ data }) {
  const cats = data.categories?.length ? data.categories : []
  return (
    <div className="mt-4">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-[#10283F]">Bo‘limlar bo‘yicha savdo</h2>
        <Link to="/admin/hisobotlar" className="inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-[#0F766E]">
          Batafsil ko‘rish <ChevronRight className="size-4" />
        </Link>
      </div>
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
        {cats.map((c) => {
          const Icon = CAT_ICON[c.name] || CAT_ICON.default
          return (
            <div key={c.name} className={`${card} min-w-[132px] shrink-0 p-3`}>
              <span className="grid size-9 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]">
                <Icon className="size-4" />
              </span>
              <div className="mt-2 text-[12.5px] font-semibold text-[#10283F]">{c.name}</div>
              <div className="mt-0.5 text-[13px] font-extrabold text-[#0F766E]">{som(c.sum)}</div>
              <div className="text-[11px] text-[#8A9AA8]">{num(c.orders)} buyurtma</div>
            </div>
          )
        })}
        {!cats.length && (
          <div className={`${card} w-full px-4 py-8 text-center text-[13px] text-[#8A9AA8]`}>Ma’lumot yo‘q</div>
        )}
      </div>
    </div>
  )
}

export function MobileLists({ data }) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className={`${card} p-4`}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[#10283F]">So‘nggi buyurtmalar</h2>
          <Link to="/admin/buyurtmalar" className="inline-flex items-center text-[12px] font-semibold text-[#0F766E]">
            Barchasini ko‘rish <ChevronRight className="size-3.5" />
          </Link>
        </div>
        <ul className="space-y-2.5">
          {(data.recent_orders || []).slice(0, 5).map((o) => (
            <li key={o.id} className="flex items-center gap-2.5">
              <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#F0FDFA] text-[#0F766E]">
                {o.image_url ? <img src={o.image_url} alt="" className="size-full object-cover" /> : <ShoppingBag className="size-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-[#0F766E]">#{o.code}</div>
                <div className="text-[11.5px] text-[#8A9AA8]">{dmyhm(o.created_at)}</div>
              </div>
              <div className="text-right">
                <div className="text-[12.5px] font-bold text-[#10283F]">{som(o.subtotal)}</div>
                <div className="mt-0.5"><PayBadge method={o.payment_method} /></div>
              </div>
            </li>
          ))}
          {!data.recent_orders?.length && <li className="py-6 text-center text-[13px] text-[#8A9AA8]">Buyurtmalar yo‘q</li>}
        </ul>
      </div>

      <div className={`${card} p-4`}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[#10283F]">So‘nggi faolliklar</h2>
          <Link to="/admin/hisobotlar" className="inline-flex items-center text-[12px] font-semibold text-[#0F766E]">
            Barchasini ko‘rish <ChevronRight className="size-3.5" />
          </Link>
        </div>
        <ul className="relative space-y-3 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-[#E6EEF0]">
          {(data.activity || []).slice(0, 5).map((a, i) => {
            const Icon = ({ order: ShoppingBag, user: UserPlus, seller: Store, seminar: GraduationCap, ad: Megaphone }[a.kind]) || Package
            return (
              <li key={i} className="relative flex items-start gap-2.5 pl-0">
                <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E] ring-4 ring-white">
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="text-[13px] font-semibold text-[#10283F]">{a.title}</div>
                  <div className="truncate text-[12px] text-[#5C6E80]">{a.detail}</div>
                  <div className="text-[11px] text-[#8A9AA8]">{dmyhm(a.at)}</div>
                </div>
              </li>
            )
          })}
          {!data.activity?.length && <li className="py-6 text-center text-[13px] text-[#8A9AA8]">Faollik yo‘q</li>}
        </ul>
      </div>
    </div>
  )
}
