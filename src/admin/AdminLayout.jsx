import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, ChevronDown, LogOut, Menu, Search, X, Users, Store, ShoppingBag,
  BadgeCheck, CircleHelp, Megaphone,
} from 'lucide-react'
import { signOut, useSession } from '../sessionStore'
import { ADMIN_MOBILE_TAB, ADMIN_NAV } from './nav'
import Logo from './components/Logo'
import { useAdminDashboard } from './api'
import { num } from './format'

const SEARCH_TARGETS = [
  { q: ['foydalanuv', 'user', 'mijoz'], to: '/admin/foydalanuvchilar', label: 'Foydalanuvchilar' },
  { q: ['sotuvchi', 'seller', 'do‘kon', 'dokon'], to: '/admin/sotuvchilar', label: 'Sotuvchilar' },
  { q: ['tashkilot', 'organizer', 'seminar'], to: '/admin/tashkilotchilar', label: 'Seminar tashkilotchilari' },
  { q: ['e’lon', 'elon', 'kampaniya', 'reklama'], to: '/admin/elonlar', label: 'E’lonlar' },
  { q: ['buyurtma', 'order'], to: '/admin/buyurtmalar', label: 'Buyurtmalar' },
  { q: ['escrow', 'pul'], to: '/admin/escrow', label: 'Escrow va pul aylanmasi' },
  { q: ['tasdiq', 'moderatsiya'], to: '/admin/tasdiqlashlar', label: 'Tasdiqlashlar' },
  { q: ['moliya', 'komissiya'], to: '/admin/moliya', label: 'Moliya va komissiya' },
  { q: ['shikoyat', 'complaint'], to: '/admin/shikoyatlar', label: 'Shikoyatlar' },
  { q: ['hisobot', 'report'], to: '/admin/hisobotlar', label: 'Hisobotlar' },
  { q: ['sozlama', 'setting'], to: '/admin/sozlamalar', label: 'Sozlamalar' },
  { q: ['mahsulot', 'product'], to: '/admin/mahsulotlar', label: 'Mahsulotlar' },
  { q: ['boshqaruv', 'dashboard'], to: '/admin', label: 'Boshqaruv paneli' },
]

export default function AdminLayout() {
  const session = useSession()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [drawer, setDrawer] = useState(false)
  const [menu, setMenu] = useState(false)
  const [bell, setBell] = useState(false)
  const [q, setQ] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const month = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])
  const { data } = useAdminDashboard(month)

  useEffect(() => { window.scrollTo(0, 0); setDrawer(false); setMenu(false); setBell(false); setSearchOpen(false) }, [pathname])

  const name = session.profile?.name?.trim() || 'Admin'
  const pending = data?.pending || {}
  const notifItems = [
    { icon: Store, label: 'Yangi sotuvchilar', count: pending.sellers || 0, to: '/admin/sotuvchilar?tab=pending' },
    { icon: BadgeCheck, label: 'Tasdiqlashlar', count: pending.total ?? ((pending.sellers || 0) + (pending.organizers || 0) + (pending.ads || 0) + (pending.products || 0) + (pending.doctors || 0)), to: '/admin/tasdiqlashlar' },
    { icon: Megaphone, label: 'Reklama kampaniyalari', count: pending.ads || 0, to: '/admin/elonlar?tab=moderatsiyada' },
    { icon: ShoppingBag, label: 'Mahsulotlarni tasdiqlash', count: pending.products || 0, to: '/admin/mahsulotlar' },
    { icon: CircleHelp, label: 'Shikoyatlar', count: (data?.complaints || []).length, to: '/admin/shikoyatlar' },
    { icon: Users, label: 'Tashkilotchilar', count: pending.organizers || 0, to: '/admin/tashkilotchilar?tab=pending' },
  ]
  // the Tasdiqlashlar row already contains the others; count it once to avoid double badges
  const unread = (Number(notifItems[1].count) || 0) + (Number(notifItems[4].count) || 0)
  const _unusedUnread = notifItems.reduce((s, x) => s + (Number(x.count) || 0), 0)

  const hits = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return SEARCH_TARGETS.slice(0, 6)
    return SEARCH_TARGETS.filter((t) => t.q.some((k) => k.includes(s) || s.includes(k)) || t.label.toLowerCase().includes(s))
  }, [q])

  return (
    <div className="min-h-screen bg-[#F4F7F8] font-sans text-[#10283F]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-[#E6EEF0] bg-white lg:flex">
        <div className="px-5 pb-5 pt-5"><Logo /></div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-6">
          {ADMIN_NAV.map((item) => <SideLink key={item.to} {...item} />)}
        </nav>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 hidden h-[68px] items-center gap-4 border-b border-[#E6EEF0] bg-white/95 px-6 backdrop-blur lg:flex">
          <button type="button" className="rounded-lg p-1.5 text-[#10283F] hover:bg-[#F0FDFA]" aria-label="Menyu" onClick={() => setDrawer(true)}>
            <Menu className="size-5" />
          </button>
          <div className="relative max-w-xl flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5C6E80]" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setSearchOpen(true) }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && hits[0]) { navigate(hits[0].to); setSearchOpen(false); setQ('') }
              }}
              placeholder="Qidirish..."
              className="h-10 w-full rounded-xl border border-[#E6EEF0] bg-[#F8FBFC] pl-10 pr-3 text-[14px] outline-none placeholder:text-[#8A9AA8] focus:border-[#0F766E]"
            />
            {searchOpen && (
              <SearchDropdown hits={hits} onPick={(to) => { navigate(to); setSearchOpen(false); setQ('') }} onClose={() => setSearchOpen(false)} />
            )}
          </div>
          <div className="ml-auto flex items-center gap-4">
            <BellButton unread={unread} open={bell} setOpen={setBell} items={notifItems} navigate={navigate} />
            <ProfileChip name={name} open={menu} setOpen={setMenu} />
          </div>
        </header>

        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-[#E6EEF0] bg-white px-3 py-3 lg:hidden">
          <button type="button" onClick={() => setDrawer(true)} aria-label="Menyu" className="rounded-lg p-1.5 text-[#0F766E]"><Menu className="size-6" /></button>
          <Logo size="sm" subtitle="Admin paneli" />
          <div className="ml-auto flex items-center gap-1.5">
            <BellButton unread={unread} open={bell} setOpen={setBell} items={notifItems} navigate={navigate} compact />
            <ProfileChip name={name} open={menu} setOpen={setMenu} compact />
          </div>
        </header>

        <main className="px-3 pb-28 pt-4 sm:px-4 lg:px-6 lg:pb-10 lg:pt-6">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#E6EEF0] bg-white pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 lg:hidden">
        {ADMIN_MOBILE_TAB.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex flex-col items-center gap-0.5 px-1 text-[10.5px] font-medium ${isActive ? 'text-[#0F766E]' : 'text-[#4A5A6A]'}`}>
            {({ isActive }) => (
              <>
                <span className={`grid size-9 place-items-center rounded-xl ${isActive ? 'bg-[#CCFBF1]' : ''}`}>
                  <Icon className="size-[22px]" strokeWidth={1.8} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {drawer && (
        <div className="fixed inset-0 z-40" onMouseDown={(e) => e.target === e.currentTarget && setDrawer(false)}>
          <div className="absolute inset-0 bg-[#0B2A2E]/40" />
          <aside className="absolute inset-y-0 left-0 flex w-[min(86vw,300px)] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4">
              <Logo size="sm" />
              <button type="button" onClick={() => setDrawer(false)} aria-label="Yopish"><X className="size-5" /></button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-8">
              {ADMIN_NAV.map((item) => <SideLink key={item.to} {...item} onClick={() => setDrawer(false)} />)}
            </nav>
          </aside>
        </div>
      )}
    </div>
  )
}

function SearchDropdown({ hits, onPick, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [onClose])
  return (
    <div ref={ref} className="absolute left-0 right-0 top-full z-40 mt-1.5 overflow-hidden rounded-xl border border-[#E6EEF0] bg-white py-1 shadow-lg">
      {hits.length === 0 && <div className="px-3 py-3 text-[13px] text-[#8A9AA8]">Natija yo‘q</div>}
      {hits.map((h) => (
        <button key={h.to} type="button" onClick={() => onPick(h.to)} className="flex w-full items-center px-3 py-2.5 text-left text-[13.5px] font-medium hover:bg-[#F0FDFA]">
          {h.label}
        </button>
      ))}
    </div>
  )
}

function BellButton({ unread, open, setOpen, items, navigate, compact }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, setOpen])
  const badge = unread > 99 ? '99+' : String(unread)
  return (
    <div className="relative" ref={ref}>
      <button type="button" aria-label="Bildirishnomalar" onClick={() => setOpen((v) => !v)} className={`relative rounded-lg p-1.5 ${compact ? 'text-[#0F766E]' : 'text-[#10283F] hover:bg-[#F0FDFA]'}`}>
        <Bell className={compact ? 'size-[22px]' : 'size-5'} strokeWidth={1.9} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-[#0F766E] px-1 text-[9px] font-bold leading-4 text-white">{badge}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-[min(92vw,320px)] overflow-hidden rounded-xl border border-[#E6EEF0] bg-white shadow-lg">
          <div className="border-b border-[#E6EEF0] px-3 py-2.5 text-[13px] font-bold">Bildirishnomalar</div>
          <ul className="max-h-80 overflow-y-auto py-1">
            {items.map((it) => (
              <li key={it.to + it.label}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#F0FDFA]"
                  onClick={() => { setOpen(false); navigate(it.to) }}
                >
                  <span className="grid size-8 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]"><it.icon className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold">{it.label}</span>
                    <span className="block text-[12px] text-[#5C6E80]">{num(it.count)} ta</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function SideLink({ to, label, icon: Icon, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) => `flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 text-[14px] font-medium transition-colors ${isActive ? 'bg-[#0F766E] text-white shadow-sm' : 'text-[#1F2A3C] hover:bg-[#F0FDFA] hover:text-[#0F766E]'}`}
    >
      <Icon className="size-[20px] shrink-0" strokeWidth={1.9} />
      <span className="leading-snug">{label}</span>
    </NavLink>
  )
}

function ProfileChip({ name, open, setOpen, compact }) {
  const navigate = useNavigate()
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-xl p-1 hover:bg-[#F0FDFA]">
        <span className="grid size-9 place-items-center rounded-full bg-[#0F766E] text-[13px] font-bold text-white">
          {(name || 'A').slice(0, 1).toUpperCase()}
        </span>
        {!compact && (
          <span className="hidden text-left leading-tight xl:block">
            <span className="block text-[13px] font-semibold text-[#10283F]">{name}</span>
            <span className="block text-[11.5px] text-[#5C6E80]">Bosh administrator</span>
          </span>
        )}
        <ChevronDown className="size-4 text-[#5C6E80]" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-48 overflow-hidden rounded-xl border border-[#E6EEF0] bg-white py-1 shadow-lg">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13.5px] font-medium text-[#10283F] hover:bg-[#F0FDFA]"
            onClick={async () => { setOpen(false); await signOut(); navigate('/kirish') }}
          >
            <LogOut className="size-4" /> Chiqish
          </button>
        </div>
      )}
    </div>
  )
}
