import { Link } from 'react-router-dom'
import {
  CalendarDays, ChevronDown, Coins, Percent, ShoppingBag, UserPlus, Users, Store,
  GraduationCap, Package, Megaphone, CircleHelp,
} from 'lucide-react'
import { BarChart } from '../Chart'
import StatusBadge from './StatusBadge'
import { daysInMonth, dmy, maskPhone, monthTitle, num, rangeLabel, som } from '../../format'

const card = 'rounded-2xl border border-[#E6EEF0] bg-white shadow-[0_1px_2px_rgb(16_40_63/0.04)]'

export function PageHead({ month, onPick }) {
  const { from, to } = (() => {
    const from = new Date(month.getFullYear(), month.getMonth(), 1)
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    return { from, to }
  })()
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-[#10283F]">Boshqaruv paneli</h1>
        <p className="mt-1 text-[14px] text-[#5C6E80]">Platforma faoliyati bo‘yicha umumiy ma’lumot</p>
      </div>
      <MonthRange month={month} onPick={onPick} label={rangeLabel(from, to)} />
    </div>
  )
}

function MonthRange({ month, onPick, label }) {
  return (
    <label className="relative inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E6EEF0] bg-white px-3 text-[13.5px] font-medium text-[#10283F] shadow-sm">
      <CalendarDays className="size-4 text-[#0F766E]" />
      <span>{label}</span>
      <ChevronDown className="size-4 text-[#5C6E80]" />
      <input
        type="month"
        className="absolute opacity-0"
        value={`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`}
        onChange={(e) => {
          const [y, m] = e.target.value.split('-').map(Number)
          if (y && m) onPick(new Date(y, m - 1, 1))
        }}
      />
    </label>
  )
}

export function KpiRow({ data }) {
  const items = [
    { icon: Coins, label: 'Umumiy aylanma', value: som(data.turnover), sub: 'Platformadagi jami savdolar' },
    { icon: ShoppingBag, label: 'Escrowdagi mablag‘', value: som(data.escrow), sub: 'Sotuvchilarga to‘lanmagan' },
    { icon: Percent, label: 'Komissiya daromadi (12%)', value: som(data.commission), sub: 'Platforma daromadi' },
  ]
  return (
    <div className="mt-5 grid grid-cols-3 gap-4">
      {items.map(({ icon: Icon, label, value, sub }) => (
        <div key={label} className={`${card} flex items-start gap-3.5 p-4`}>
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]">
            <Icon className="size-5" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-[#5C6E80]">{label}</div>
            <div className="mt-0.5 truncate text-[20px] font-extrabold tracking-tight text-[#10283F]">{value}</div>
            <div className="mt-0.5 text-[12px] text-[#8A9AA8]">{sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function MidRow({ data, month, onPick }) {
  const n = daysInMonth(month)
  const byDay = Array.from({ length: n }, (_, i) => 0)
  data.daily.forEach((d) => { if (d.day >= 1 && d.day <= n) byDay[d.day - 1] = d.sum })
  const nu = data.new_users
  return (
    <div className="mt-4 grid grid-cols-[1.7fr_1fr] gap-4">
      <div className={`${card} p-5`}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#10283F]">Platforma aylanmasi</h2>
          <MonthChip month={month} onPick={onPick} />
        </div>
        <BarChart labels={byDay.map((_, i) => String(i + 1))} values={byDay} height={230} maxTicks={16} />
      </div>
      <div className={`${card} p-5`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-[#10283F]">Yangi foydalanuvchilar</h2>
            <p className="mt-0.5 text-[12.5px] text-[#5C6E80]">{monthTitle(month)}</p>
          </div>
          <span className="grid size-10 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]"><UserPlus className="size-5" /></span>
        </div>
        <div className="mt-4 text-[28px] font-extrabold tracking-tight text-[#10283F]">{num(nu.total)}</div>
        <ul className="mt-4 space-y-3">
          {[
            { icon: Users, label: 'Xaridorlar', value: nu.customers },
            { icon: Store, label: 'Sotuvchilar', value: nu.sellers },
            { icon: GraduationCap, label: 'Seminar tashkilotchilari', value: nu.organizers },
          ].map(({ icon: Icon, label, value }) => (
            <li key={label} className="flex items-center gap-3 rounded-xl bg-[#F8FBFC] px-3 py-2.5">
              <span className="grid size-9 place-items-center rounded-full bg-white text-[#0F766E] shadow-sm"><Icon className="size-4" /></span>
              <span className="flex-1 text-[13.5px] font-medium text-[#3D4E5F]">{label}</span>
              <span className="text-[15px] font-bold text-[#10283F]">{num(value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function MonthChip({ month, onPick }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E6EEF0] bg-[#F8FBFC] px-2.5 py-1.5 text-[12.5px] font-medium text-[#10283F]">
      {monthTitle(month)}
      <ChevronDown className="size-3.5 text-[#5C6E80]" />
      <input type="month" className="absolute inset-0 cursor-pointer opacity-0"
        value={`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`}
        onChange={(e) => { const [y, m] = e.target.value.split('-').map(Number); if (y && m) onPick(new Date(y, m - 1, 1)) }}
      />
    </label>
  )
}

export function OrdersAndPending({ data, onOpenSeller }) {
  return (
    <div className="mt-4 grid grid-cols-[1.7fr_1fr] gap-4">
      <div className={`${card} overflow-hidden`}>
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="text-[16px] font-bold text-[#10283F]">So‘nggi buyurtmalar</h2>
          <Link to="/admin/buyurtmalar" className="text-[13px] font-semibold text-[#0F766E]">Barchasini ko‘rish</Link>
        </div>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead className="bg-[#F8FBFC] text-[12px] text-[#5C6E80]">
              <tr>
                {['#', 'Sana', 'Xaridor', 'Sotuvchi', 'Summa', 'Holat'].map((h) => (
                  <th key={h} className="px-4 py-2.5 font-semibold first:pl-5 last:pr-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.recent_orders || []).slice(0, 5).map((o) => (
                <tr key={o.id} className="border-t border-[#EEF3F4]">
                  <td className="px-4 py-3 pl-5 font-semibold text-[#0F766E]">#{o.code}</td>
                  <td className="px-4 py-3 text-[#3D4E5F]">{dmy(o.created_at)}</td>
                  <td className="px-4 py-3 text-[#3D4E5F]">{maskPhone(o.customer_phone)}</td>
                  <td className="px-4 py-3 font-medium">{o.shop_name || '—'}</td>
                  <td className="px-4 py-3 font-semibold">{som(o.subtotal)}</td>
                  <td className="px-4 py-3 pr-5"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
              {!data.recent_orders?.length && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-[#8A9AA8]">Buyurtmalar yo‘q</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`${card} p-5`}>
        <h2 className="text-[16px] font-bold text-[#10283F]">Kutilayotgan tasdiqlashlar</h2>
        <ul className="mt-3 space-y-2">
          {[
            { key: 'sellers', label: 'Yangi sotuvchilar', icon: Store, to: '/admin/sotuvchilar', open: true },
            { key: 'organizers', label: 'Seminar tashkilotchilari', icon: GraduationCap, to: '/admin/tashkilotchilar' },
            { key: 'ads', label: 'E’lonlar', icon: Megaphone, to: '/admin/elonlar' },
            { key: 'products', label: 'Mahsulotlar', icon: Package, to: '/admin/mahsulotlar' },
            { key: 'users', label: 'Foydalanuvchilar', icon: Users, to: '/admin/foydalanuvchilar' },
          ].map(({ key, label, icon: Icon, to, open }) => (
            <li key={key} className="flex items-center gap-3 rounded-xl bg-[#F8FBFC] px-3 py-2.5">
              <span className="grid size-9 place-items-center rounded-full bg-white text-[#0F766E] shadow-sm"><Icon className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-medium text-[#10283F]">{label}</div>
                <div className="text-[12px] text-[#5C6E80]">{num(data.pending?.[key] || 0)} ta</div>
              </div>
              {open && data.pending_sellers?.[0] ? (
                <button type="button" onClick={() => onOpenSeller(data.pending_sellers[0].id)} className="rounded-lg border border-[#CCFBF1] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#0F766E] hover:bg-[#F0FDFA]">Ko‘rish</button>
              ) : (
                <Link to={to} className="rounded-lg border border-[#CCFBF1] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#0F766E] hover:bg-[#F0FDFA]">Ko‘rish</Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function StatsAndComplaints({ data }) {
  const stats = [
    { icon: ShoppingBag, label: 'Jami buyurtmalar', value: num(data.orders_count), sub: 'Tanlangan oy' },
    { icon: Package, label: 'Jami mahsulotlar', value: num(data.products_count), sub: 'Platformada' },
    { icon: Users, label: 'Jami foydalanuvchilar', value: num(data.users_count), sub: 'Barcha turlar' },
    { icon: GraduationCap, label: 'Jami seminarlar', value: num(data.seminars_count), sub: 'Tanlangan oy' },
  ]
  return (
    <div className="mt-4 grid grid-cols-[1.7fr_1fr] gap-4">
      <div className={`${card} p-5`}>
        <h2 className="text-[16px] font-bold text-[#10283F]">Platforma statistikasi</h2>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {stats.map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="rounded-xl bg-[#F8FBFC] p-3 text-center">
              <span className="mx-auto grid size-10 place-items-center rounded-full bg-white text-[#0F766E] shadow-sm"><Icon className="size-5" /></span>
              <div className="mt-2 text-[18px] font-extrabold text-[#10283F]">{value}</div>
              <div className="mt-0.5 text-[12px] font-medium text-[#3D4E5F]">{label}</div>
              <div className="text-[11px] text-[#8A9AA8]">{sub}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={`${card} p-5`}>
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#10283F]">So‘nggi shikoyatlar</h2>
          <Link to="/admin/shikoyatlar" className="text-[13px] font-semibold text-[#0F766E]">Barchasi</Link>
        </div>
        <ul className="mt-3 space-y-2">
          {(data.complaints || []).slice(0, 3).map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-xl bg-[#F8FBFC] px-3 py-2.5">
              <span className="grid size-9 place-items-center rounded-full bg-white text-[#0F766E] shadow-sm"><CircleHelp className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-[#0F766E]">#{c.code}</div>
                <div className="truncate text-[12.5px] text-[#3D4E5F]">{c.subject}</div>
                <div className="text-[11.5px] text-[#8A9AA8]">{dmy(c.created_at)}</div>
              </div>
              <Link to="/admin/shikoyatlar" className="rounded-lg border border-[#CCFBF1] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#0F766E]">Ko‘rish</Link>
            </li>
          ))}
          {!data.complaints?.length && (
            <li className="rounded-xl bg-[#F8FBFC] px-3 py-8 text-center text-[13px] text-[#8A9AA8]">Shikoyatlar yo‘q</li>
          )}
        </ul>
      </div>
    </div>
  )
}
