/**
 * DEV-only visual harness for design comparison screenshots.
 */
import { useMemo, useState } from 'react'
import { Navigate, NavLink } from 'react-router-dom'
import { Bell, ChevronDown, Menu, Search } from 'lucide-react'
import {
  KpiRow, MidRow, OrdersAndPending, PageHead, StatsAndComplaints,
} from '../components/dashboard/Desktop'
import {
  MobileCategories, MobileChart, MobileHead, MobileKpis, MobileLists,
} from '../components/dashboard/Mobile'
import SellerApplicationModal from '../components/dashboard/SellerApplicationModal'
import SalesDetailModal from '../components/dashboard/SalesDetailModal'
import Logo from '../components/Logo'
import { ADMIN_MOBILE_TAB, ADMIN_NAV } from '../nav'

const FIXTURE = {
  turnover: 482650000,
  escrow: 68430000,
  commission: 57918000,
  net: 424732000,
  orders_count: 1245,
  orders_prev: 1018,
  products_count: 6320,
  users_count: 24581,
  active_users: 428,
  seminars_count: 86,
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
    { id: '1', code: 'STQ-00128', created_at: '2026-10-31T16:24:00', customer_phone: '+998901112233', shop_name: 'MedStom', subtotal: 2450000, status: 'yetkazildi', payment_method: 'uzcard', category: 'Implantlar', image_url: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2280%22%20height%3D%2280%22%3E%3Crect%20fill%3D%22%23CCFBF1%22%20width%3D%2280%22%20height%3D%2280%22/%3E%3Ctext%20x%3D%2240%22%20y%3D%2248%22%20text-anchor%3D%22middle%22%20fill%3D%22%230F766E%22%20font-size%3D%2216%22%20font-family%3D%22sans-serif%22%20font-weight%3D%22700%22%3E1%3C/text%3E%3C/svg%3E' },
    { id: '2', code: 'STQ-00127', created_at: '2026-10-31T14:18:00', customer_phone: '+998901112244', shop_name: 'DentPro', subtotal: 1750000, status: 'yetkazilmoqda', payment_method: 'humo', category: 'Materiallar', image_url: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2280%22%20height%3D%2280%22%3E%3Crect%20fill%3D%22%2399F6E4%22%20width%3D%2280%22%20height%3D%2280%22/%3E%3Ctext%20x%3D%2240%22%20y%3D%2248%22%20text-anchor%3D%22middle%22%20fill%3D%22%230F766E%22%20font-size%3D%2216%22%20font-family%3D%22sans-serif%22%20font-weight%3D%22700%22%3E2%3C/text%3E%3C/svg%3E' },
    { id: '3', code: 'STQ-00126', created_at: '2026-10-31T11:03:00', customer_phone: '+998901112255', shop_name: 'SmileLab', subtotal: 980000, status: 'tayyorlanmoqda', payment_method: 'click', category: 'Uskunalar', image_url: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2280%22%20height%3D%2280%22%3E%3Crect%20fill%3D%22%235EEAD4%22%20width%3D%2280%22%20height%3D%2280%22/%3E%3Ctext%20x%3D%2240%22%20y%3D%2248%22%20text-anchor%3D%22middle%22%20fill%3D%22%230F766E%22%20font-size%3D%2216%22%20font-family%3D%22sans-serif%22%20font-weight%3D%22700%22%3E3%3C/text%3E%3C/svg%3E' },
    { id: '4', code: 'STQ-00125', created_at: '2026-10-30T18:42:00', customer_phone: '+998901112266', shop_name: 'OralTech', subtotal: 3200000, status: 'yetkazildi', payment_method: 'payme', category: 'Implantlar', image_url: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2280%22%20height%3D%2280%22%3E%3Crect%20fill%3D%22%23F0FDFA%22%20width%3D%2280%22%20height%3D%2280%22/%3E%3Ctext%20x%3D%2240%22%20y%3D%2248%22%20text-anchor%3D%22middle%22%20fill%3D%22%230F766E%22%20font-size%3D%2216%22%20font-family%3D%22sans-serif%22%20font-weight%3D%22700%22%3E4%3C/text%3E%3C/svg%3E' },
    { id: '5', code: 'STQ-00124', created_at: '2026-10-30T15:11:00', customer_phone: '+998901112277', shop_name: 'DentPro', subtotal: 670000, status: 'bekor_qilindi', payment_method: 'uzcard', category: 'Materiallar', image_url: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2280%22%20height%3D%2280%22%3E%3Crect%20fill%3D%22%23A7F3D0%22%20width%3D%2280%22%20height%3D%2280%22/%3E%3Ctext%20x%3D%2240%22%20y%3D%2248%22%20text-anchor%3D%22middle%22%20fill%3D%22%230F766E%22%20font-size%3D%2216%22%20font-family%3D%22sans-serif%22%20font-weight%3D%22700%22%3E5%3C/text%3E%3C/svg%3E' },
  ],
  pending: { sellers: 12, organizers: 5, ads: 18, products: 34, users: 7 },
  pending_sellers: [{ id: 'fixture-seller', name: 'Karimov Behzod', shop_name: 'MedStom', created_at: '2026-10-28T14:27:00' }],
  complaints: [
    { id: 'c1', code: 'SHK-00012', subject: 'Noto‘g‘ri mahsulot yetkazildi', created_at: '2026-10-30T10:00:00' },
    { id: 'c2', code: 'SHK-00011', subject: 'Kechikkan yetkazib berish', created_at: '2026-10-29T12:00:00' },
    { id: 'c3', code: 'SHK-00010', subject: 'Sifat shikoyati', created_at: '2026-10-28T09:00:00' },
  ],
  activity: [
    { kind: 'order', title: 'Yangi buyurtma', detail: '#STQ-001286', at: '2026-10-31T16:24:00' },
    { kind: 'user', title: 'Yangi foydalanuvchi', detail: '+998 ** *** ** **', at: '2026-10-31T15:10:00' },
    { kind: 'seller', title: 'Yangi sotuvchi', detail: 'DentPro', at: '2026-10-31T12:00:00' },
    { kind: 'seminar', title: 'Yangi seminar', detail: 'Zamonaviy implantologiya', at: '2026-10-30T18:00:00' },
    { kind: 'ad', title: 'Yangi e’lon', detail: 'Chegirma kampaniyasi', at: '2026-10-30T11:00:00' },
  ],
}

export default function ShotHarness() {
  if (!import.meta.env.DEV) return <Navigate to="/" replace />
  const [month] = useState(() => new Date(2026, 9, 1))
  const data = useMemo(() => FIXTURE, [])
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const view = params.get('view') || 'a'

  return (
    <div className="min-h-screen bg-[#F4F7F8] font-sans text-[#10283F]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-[#E6EEF0] bg-white lg:flex">
        <div className="px-5 pb-5 pt-5"><Logo /></div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-6">
          {ADMIN_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={() => `flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 text-[14px] font-medium ${item.to === '/admin' ? 'bg-[#0F766E] text-white shadow-sm' : 'text-[#1F2A3C]'}`}>
              <item.icon className="size-[20px] shrink-0" strokeWidth={1.9} />
              <span className="leading-snug">{item.label}</span>
            </NavLink>
          ))}
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
            <Bell className="size-5" />
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
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#E6EEF0] bg-white pb-2 pt-1.5 lg:hidden">
        {ADMIN_MOBILE_TAB.map(({ to, label, icon: Icon }) => (
          <div key={to} className={`flex flex-col items-center gap-0.5 px-1 text-[10.5px] font-medium ${to === '/admin' ? 'text-[#0F766E]' : 'text-[#4A5A6A]'}`}>
            <span className={`grid size-9 place-items-center rounded-xl ${to === '/admin' ? 'bg-[#CCFBF1]' : ''}`}>
              <Icon className="size-[22px]" strokeWidth={1.8} />
            </span>
            {label}
          </div>
        ))}
      </nav>
      {view === 'b-desktop' && <SellerFixture />}
      {(view === 'b' || view === 'b-mobile') && (
        <SalesDetailModal open data={data} month={month} onClose={() => {}} onPick={() => {}} />
      )}
    </div>
  )
}

function SellerFixture() {
  // Render modal shell with fixture seller (bypass RPC)
  const [open] = useState(true)
  // Monkey-patch: show static modal content via Sales-like structure
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2A2E]/45 p-6">
      <div className="max-h-[94vh] w-full max-w-[860px] overflow-y-auto rounded-[18px] bg-white shadow-2xl">
        <div className="border-b border-[#E6EEF0] px-6 py-4">
          <h2 className="text-[22px] font-extrabold text-[#10283F]">Sotuvchi arizasi</h2>
          <p className="text-[13.5px] text-[#5C6E80]">Sotuvchi tomonidan yuborilgan ma’lumotlarni ko‘rib chiqing.</p>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[20px] font-extrabold">MedStom</h3>
              <span className="rounded-full bg-[#E0F2FE] px-2.5 py-0.5 text-[12px] font-semibold text-[#0369A1]">Yangi sotuvchi</span>
            </div>
            <p className="text-[13.5px] text-[#5C6E80]">Tibbiy va stomatologik mahsulotlar</p>
            <p className="text-[12.5px] text-[#8A9AA8]">Ariza sanasi: 28.10.2026, 14:27</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E6EEF0] bg-[#F8FBFC] p-4 text-[13.5px]">
              <div className="mb-2 text-[13px] font-bold uppercase text-[#5C6E80]">Shaxsiy / tashkilot</div>
              <p><span className="text-[#8A9AA8]">Mas’ul shaxs:</span> Karimov Behzod Anvarovich</p>
              <p><span className="text-[#8A9AA8]">Telefon:</span> +998 ** *** ** **</p>
              <p><span className="text-[#8A9AA8]">Email:</span> ********@mail.uz</p>
              <p><span className="text-[#8A9AA8]">Manzil:</span> Toshkent shahri, Yunusobod tumani</p>
              <p><span className="text-[#8A9AA8]">Tashkilot turi:</span> Mas’uliyati cheklangan jamiyat (MChJ)</p>
              <p><span className="text-[#8A9AA8]">STIR:</span> 309876543</p>
            </div>
            <div className="rounded-2xl border border-[#E6EEF0] bg-[#F8FBFC] p-4 text-[13.5px]">
              <div className="mb-2 text-[13px] font-bold uppercase text-[#5C6E80]">Do‘kon</div>
              <p><span className="text-[#8A9AA8]">Do‘kon nomi:</span> MedStom</p>
              <p><span className="text-[#8A9AA8]">Kategoriyalar:</span> Materiallar, Asboblar, Uskunalar</p>
              <p><span className="text-[#8A9AA8]">Manzil:</span> Toshkent shahri, Yunusobod tumani</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-[#E6EEF0] pt-4">
            <button type="button" className="h-11 rounded-xl bg-[#0F766E] px-5 text-[14px] font-semibold text-white">Tasdiqlash</button>
            <button type="button" className="h-11 rounded-xl bg-[#1F2A3C] px-5 text-[14px] font-semibold text-white">Rad etish</button>
            <button type="button" className="h-11 rounded-xl border border-[#E6EEF0] px-5 text-[14px] font-semibold">Bloklash</button>
            <button type="button" className="ml-auto h-11 rounded-xl border border-[#E6EEF0] px-5 text-[14px] font-semibold">Yopish</button>
          </div>
        </div>
      </div>
    </div>
  )
}
