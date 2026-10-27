/**
 * Visual harness for design comparison screenshots (/admin-shot/:sec).
 * Enables window.__ADMIN_SHOT__ so api.js returns fixtures.
 */
import { useEffect, useMemo, useState } from 'react'
import { NavLink, useParams, useSearchParams } from 'react-router-dom'
import { Bell, ChevronDown, Menu, Search } from 'lucide-react'
import {
  KpiRow, MidRow, OrdersAndPending, PageHead, StatsAndComplaints,
} from '../components/dashboard/Desktop'
import {
  MobileCategories, MobileChart, MobileHead, MobileKpis, MobileLists,
} from '../components/dashboard/Mobile'
import SalesDetailModal from '../components/dashboard/SalesDetailModal'
import Logo from '../components/Logo'
import { ADMIN_MOBILE_TAB, ADMIN_NAV } from '../nav'
import Foydalanuvchilar from './Foydalanuvchilar'
import Sotuvchilar from './Sotuvchilar'
import Tashkilotchilar from './Tashkilotchilar'
import Elonlar from './Elonlar'
import Buyurtmalar from './Buyurtmalar'
import Escrow from './Escrow'
import Tasdiqlashlar from './Tasdiqlashlar'
import Moliya from './Moliya'
import Shikoyatlar from './Shikoyatlar'
import Hisobotlar from './Hisobotlar'
import Sozlamalar from './Sozlamalar'

const SEC_META = {
  '01': { to: '/admin', label: 'Boshqaruv paneli' },
  '02': { to: '/admin/foydalanuvchilar', label: 'Foydalanuvchilar', Page: Foydalanuvchilar },
  '03': { to: '/admin/sotuvchilar', label: 'Sotuvchilar', Page: Sotuvchilar },
  '04': { to: '/admin/tashkilotchilar', label: 'Seminar tashkilotchilari', Page: Tashkilotchilar },
  '05': { to: '/admin/elonlar', label: 'E’lonlar', Page: Elonlar },
  '06': { to: '/admin/buyurtmalar', label: 'Buyurtmalar', Page: Buyurtmalar },
  '07': { to: '/admin/escrow', label: 'Escrow va pul aylanmasi', Page: Escrow },
  '08': { to: '/admin/tasdiqlashlar', label: 'Tasdiqlashlar', Page: Tasdiqlashlar },
  '09': { to: '/admin/moliya', label: 'Moliya va komissiya', Page: Moliya },
  '10': { to: '/admin/shikoyatlar', label: 'Shikoyatlar', Page: Shikoyatlar },
  '11': { to: '/admin/hisobotlar', label: 'Hisobotlar', Page: Hisobotlar },
  '12': { to: '/admin/sozlamalar', label: 'Sozlamalar', Page: Sozlamalar },
}

const FIXTURE = {
  turnover: 482650000, escrow: 68430000, commission: 57918000, net: 424732000,
  orders_count: 1245, orders_prev: 1018, products_count: 6320, users_count: 24581,
  active_users: 428, seminars_count: 86,
  new_users: { total: 1248, customers: 892, sellers: 213, organizers: 74 },
  daily: Array.from({ length: 31 }, (_, i) => ({
    day: i + 1,
    sum: Math.round(8e6 + Math.abs(Math.sin(i * 0.7)) * 28e6 + (i % 5) * 2e6),
  })),
  categories: [
    { name: 'Materiallar', orders: 382, sum: 298400000 },
    { name: 'Implantlar', orders: 286, sum: 198400000 },
    { name: 'Uskunalar', orders: 214, sum: 162300000 },
    { name: 'Seminarlar', orders: 132, sum: 82650000 },
    { name: 'Forma va kiyimlar', orders: 98, sum: 38450000 },
  ],
  recent_orders: [
    { id: '1', code: 'STQ-00128', created_at: '2026-10-31T16:24:00', customer_phone: '+998901112233', shop_name: 'MedStom', subtotal: 2450000, status: 'yetkazildi', payment_method: 'uzcard', category: 'Implantlar' },
    { id: '2', code: 'STQ-00127', created_at: '2026-10-31T14:18:00', customer_phone: '+998901112244', shop_name: 'DentPro', subtotal: 1750000, status: 'yetkazilmoqda', payment_method: 'humo', category: 'Materiallar' },
    { id: '3', code: 'STQ-00126', created_at: '2026-10-31T11:03:00', customer_phone: '+998901112255', shop_name: 'SmileLab', subtotal: 980000, status: 'tayyorlanmoqda', payment_method: 'click', category: 'Uskunalar' },
  ],
  pending: { sellers: 12, organizers: 5, ads: 18, products: 34, users: 7 },
  pending_sellers: [{ id: 'fixture-seller', name: 'Karimov Behzod', shop_name: 'MedStom', created_at: '2026-10-28T14:27:00' }],
  complaints: [
    { id: 'c1', code: 'SHK-00012', subject: 'Noto‘g‘ri mahsulot yetkazildi', created_at: '2026-10-30T10:00:00' },
    { id: 'c2', code: 'SHK-00011', subject: 'Kechikkan yetkazib berish', created_at: '2026-10-29T12:00:00' },
  ],
  activity: [
    { kind: 'order', title: 'Yangi buyurtma', detail: '#STQ-001286', at: '2026-10-31T16:24:00' },
    { kind: 'user', title: 'Yangi foydalanuvchi', detail: '+998 ** *** ** **', at: '2026-10-31T15:10:00' },
    { kind: 'seller', title: 'Yangi sotuvchi', detail: 'DentPro', at: '2026-10-31T12:00:00' },
  ],
}

export default function ShotHarness() {
  const { sec: secParam } = useParams()
  const [sp] = useSearchParams()
  const sec = (secParam || sp.get('s') || '01').padStart(2, '0')
  const view = sp.get('view') || 'a'
  const meta = SEC_META[sec] || SEC_META['01']
  const [month] = useState(() => new Date(2026, 9, 1))
  const data = useMemo(() => FIXTURE, [])

  useEffect(() => {
    window.__ADMIN_SHOT__ = true
    return () => { delete window.__ADMIN_SHOT__ }
  }, [])

  const Page = meta.Page
  const mobileActive = ADMIN_MOBILE_TAB.find((t) => meta.to === t.to || meta.to.startsWith(t.to + '/'))?.to
    || (sec === '02' ? '/admin/foydalanuvchilar' : '/admin')

  return (
    <div className="min-h-screen bg-[#F4F7F8] font-sans text-[#10283F]" data-shot-sec={sec}>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-[#E6EEF0] bg-white lg:flex">
        <div className="px-5 pb-5 pt-5"><Logo /></div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-6">
          {ADMIN_NAV.map((item) => {
            const active = item.to === meta.to || (item.end && meta.to === '/admin' && item.to === '/admin')
            return (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={() => `flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 text-[14px] font-medium ${active ? 'bg-[#0F766E] text-white shadow-sm' : 'text-[#1F2A3C]'}`}>
                <item.icon className="size-[20px] shrink-0" strokeWidth={1.9} />
                <span className="leading-snug">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 hidden h-[68px] items-center gap-4 border-b border-[#E6EEF0] bg-white/95 px-6 backdrop-blur lg:flex">
          <button type="button" className="rounded-lg p-1.5" aria-label="Menyu"><Menu className="size-5" /></button>
          <div className="relative max-w-xl flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5C6E80]" />
            <input placeholder="Qidirish..." readOnly className="h-10 w-full rounded-xl border border-[#E6EEF0] bg-[#F8FBFC] pl-10 pr-3 text-[14px]" />
          </div>
          <div className="ml-auto flex items-center gap-4">
            <span className="relative">
              <Bell className="size-5" />
              <span className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-[#0F766E] text-[9px] font-bold text-white">3</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-full bg-[#0F766E] text-[13px] font-bold text-white">A</span>
              <span className="hidden text-left leading-tight xl:block">
                <span className="block text-[13px] font-semibold">Admin</span>
                <span className="block text-[11.5px] text-[#5C6E80]">Bosh administrator</span>
              </span>
              <ChevronDown className="size-4 text-[#5C6E80]" />
            </div>
          </div>
        </header>
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-[#E6EEF0] bg-white px-3 py-3 lg:hidden">
          <Menu className="size-6 text-[#0F766E]" />
          <Logo size="sm" subtitle="Admin paneli" />
          <div className="ml-auto flex items-center gap-1.5">
            <span className="relative p-1.5 text-[#0F766E]">
              <Bell className="size-[22px]" />
              <span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-[#0F766E] text-[9px] font-bold text-white">3</span>
            </span>
            <span className="grid size-9 place-items-center rounded-full bg-[#0F766E] text-[13px] font-bold text-white">A</span>
          </div>
        </header>
        <main className="px-3 pb-28 pt-4 sm:px-4 lg:px-6 lg:pb-10 lg:pt-6">
          {sec === '01' ? (
            <>
              <div className="hidden lg:block">
                <PageHead month={month} onPick={() => {}} />
                <KpiRow data={data} />
                <MidRow data={data} month={month} onPick={() => {}} />
                <OrdersAndPending data={data} onOpenSeller={() => {}} />
                <StatsAndComplaints data={data} />
              </div>
              <div className="lg:hidden">
                <MobileHead month={month} onPick={() => {}} />
                <MobileKpis data={data} onOpenSales={() => {}} />
                <MobileChart data={data} month={month} />
                <MobileCategories data={data} />
                <MobileLists data={data} />
              </div>
            </>
          ) : Page ? <Page /> : null}
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#E6EEF0] bg-white pb-2 pt-1.5 lg:hidden">
        {ADMIN_MOBILE_TAB.map(({ to, label, icon: Icon }) => {
          const on = to === mobileActive || (sec === '02' && to.includes('foydalanuv')) || (to === meta.to)
          return (
            <div key={to} className={`flex flex-col items-center gap-0.5 px-1 text-[10.5px] font-medium ${on ? 'text-[#0F766E]' : 'text-[#4A5A6A]'}`}>
              <span className={`grid size-9 place-items-center rounded-xl ${on ? 'bg-[#CCFBF1]' : ''}`}>
                <Icon className="size-[22px]" strokeWidth={1.8} />
              </span>
              {label}
            </div>
          )
        })}
      </nav>
      {sec === '01' && (view === 'b' || view === 'b-mobile') && (
        <SalesDetailModal open data={data} month={month} onClose={() => {}} onPick={() => {}} />
      )}
    </div>
  )
}
