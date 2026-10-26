import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, Search, Store, House, Package, FileText, UserRound, Ellipsis, LogOut } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { signOut, useSession } from '../sessionStore'
import { SELLER_NAV } from './nav'
import Logo from './components/shell/Logo'
import Modal from './components/shell/Modal'
import QuickActions from './components/bosh-sahifa/QuickActions'
import OrderDrawer from './components/bosh-sahifa/OrderDrawer'
import { useSellerData } from './api'

function useShopName() {
  const session = useSession()
  const [shop, setShop] = useState('')
  useEffect(() => {
    if (!supabase || !session.user) return
    supabase.from('profiles').select('shop_name').eq('id', session.user.id).maybeSingle()
      .then(({ data }) => setShop(data?.shop_name || ''))
  }, [session.user])
  return shop || session.profile?.name || 'Do‘kon'
}

export default function SellerLayout() {
  const shop = useShopName()
  const data = useSellerData()
  const [quick, setQuick] = useState(null) // null | 'menu' | action key
  const [orderId, setOrderId] = useState(null)
  const [more, setMore] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0); setMore(false) }, [pathname])
  const hasNew = data.orders.some((o) => o.status === 'yangi')
  const ctx = { shop, openQuick: (k = 'menu') => setQuick(k), openOrder: setOrderId }

  return (
    <div className="min-h-screen bg-[#F6FAFA] font-sans text-[#10283F]">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-[#E6EEF0] bg-white md:flex">
        <div className="px-6 pb-7 pt-6"><Logo /></div>
        <nav className="flex flex-col gap-1.5 px-3.5">
          {SELLER_NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex h-[46px] items-center gap-3.5 rounded-xl px-3.5 text-[15px] font-medium transition-colors ${isActive ? 'bg-[#F0FDFA] text-[#0F766E] shadow-[inset_0_0_0_1px_#CCFBF1]' : 'text-[#1F2A3C] hover:bg-[#F0FDFA] hover:text-[#0F766E]'}`}>
              <Icon className="size-[21px]" strokeWidth={1.9} />{label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="md:pl-[232px]">
        {/* desktop header */}
        <header className="sticky top-0 z-20 hidden h-[72px] items-center border-b border-[#E6EEF0] bg-white/95 px-6 backdrop-blur md:flex">
          <SearchBox />
          <div className="ml-auto flex items-center gap-6">
            <button type="button" onClick={() => setQuick(null)} aria-label="Bildirishnomalar" className="relative rounded-lg p-1.5 text-[#10283F] hover:bg-[#F0FDFA]">
              <Bell className="size-6" strokeWidth={1.9} />
              {hasNew && <span className="absolute right-1 top-1 size-2 rounded-full bg-[#0F766E]" />}
            </button>
            <ProfileMenu shop={shop} />
          </div>
        </header>

        {/* mobile header */}
        <header className="flex items-center px-5 pb-3 pt-4 md:hidden">
          <Logo size="sm" />
          <div className="ml-auto flex items-center gap-3">
            <span className="relative p-1"><Bell className="size-[26px]" strokeWidth={1.9} />{hasNew && <span className="absolute right-1 top-0.5 size-2.5 rounded-full border-2 border-white bg-[#0F766E]" />}</span>
            <ProfileMenu shop={shop} compact />
          </div>
        </header>

        <main className="px-4 pb-28 md:px-6 md:pb-10 md:pt-6">
          <Outlet context={ctx} />
        </main>
      </div>

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#E6EEF0] bg-white pb-[max(env(safe-area-inset-bottom),8px)] pt-2 md:hidden">
        {[
          { to: '/sotuvchi', label: 'Bosh sahifa', icon: House, end: true },
          { to: '/sotuvchi/mahsulotlar', label: 'Mahsulotlar', icon: Package },
          { to: '/sotuvchi/buyurtmalar', label: 'Buyurtmalar', icon: FileText },
          { to: '/sotuvchi/mijozlar', label: 'Mijozlar', icon: UserRound },
        ].map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex flex-col items-center gap-1 text-[12px] font-medium ${isActive ? 'text-[#0F766E]' : 'text-[#4A5A6A]'}`}>
            {({ isActive }) => (<><Icon className="size-[26px]" strokeWidth={1.8} fill={isActive ? '#0F766E' : 'none'} color={isActive ? '#0F766E' : 'currentColor'} />{label}</>)}
          </NavLink>
        ))}
        <button type="button" onClick={() => setMore(true)} className="flex flex-col items-center gap-1 text-[12px] font-medium text-[#4A5A6A]">
          <Ellipsis className="size-[26px]" strokeWidth={1.8} />Ko‘proq
        </button>
      </nav>

      <Modal open={more} onClose={() => setMore(false)} title="Bo‘limlar">
        <div className="grid grid-cols-2 gap-2.5">
          {SELLER_NAV.slice(4).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="flex items-center gap-3 rounded-xl bg-[#F0FDFA] px-3.5 py-3 text-[14px] font-semibold text-[#10283F]">
              <Icon className="size-5 text-[#0F766E]" />{label}
            </NavLink>
          ))}
        </div>
      </Modal>

      <QuickActions open={quick} setOpen={setQuick} products={data.products} />
      <OrderDrawer orderId={orderId} onClose={() => setOrderId(null)} />
    </div>
  )
}

function SearchBox() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  return (
    <form className="relative w-full max-w-[480px]" onSubmit={(e) => { e.preventDefault(); if (q.trim()) navigate(`/sotuvchi/buyurtmalar?q=${encodeURIComponent(q.trim())}`) }}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[#6B7A88]" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mahsulot, buyurtma yoki mijozni qidirish..."
        className="h-[38px] w-full rounded-[10px] border border-[#DCE5E7] bg-white pl-10 pr-3 text-[13.5px] outline-none placeholder:text-[#6B7A88] focus:border-[#0F766E]" />
    </form>
  )
}

function ProfileMenu({ shop, compact }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  useEffect(() => {
    const off = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', off)
    return () => document.removeEventListener('mousedown', off)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2.5 text-left">
        <span className={`grid place-items-center rounded-full bg-[#E3F4F2] text-[#0F766E] ${compact ? 'size-10' : 'size-[46px]'}`}><Store className={compact ? 'size-5' : 'size-6'} strokeWidth={1.8} /></span>
        <span className="leading-tight">
          <span className={`block font-bold text-[#10283F] ${compact ? 'max-w-[84px] truncate text-[13px]' : 'text-[15px]'}`}>{shop}</span>
          {!compact && <span className="block text-[12.5px] text-[#6B7A88]">Sotuvchi</span>}
        </span>
        <ChevronDown className={`size-5 text-[#10283F] ${compact ? '' : 'ml-6'}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-52 rounded-xl border border-[#E6EEF0] bg-white p-1.5 shadow-[0_12px_32px_rgb(8_40_45/0.12)]">
          <button type="button" onClick={() => navigate('/sotuvchi/sozlamalar')} className="w-full rounded-lg px-3 py-2 text-left text-[14px] hover:bg-[#F0FDFA]">Sozlamalar</button>
          <button type="button" onClick={async () => { await signOut(); navigate('/kirish') }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[14px] hover:bg-[#F0FDFA]"><LogOut className="size-4" />Chiqish</button>
        </div>
      )}
    </div>
  )
}
