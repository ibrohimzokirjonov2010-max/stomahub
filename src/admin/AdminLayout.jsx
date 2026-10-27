import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Menu, Search, X } from 'lucide-react'
import { signOut, useSession } from '../sessionStore'
import { ADMIN_MOBILE_TAB, ADMIN_NAV } from './nav'
import Logo from './components/Logo'

export default function AdminLayout() {
  const session = useSession()
  const { pathname } = useLocation()
  const [drawer, setDrawer] = useState(false)
  const [menu, setMenu] = useState(false)

  useEffect(() => { window.scrollTo(0, 0); setDrawer(false); setMenu(false) }, [pathname])

  const name = session.profile?.name || 'Admin'
  const ctx = { openSeller: null }

  return (
    <div className="min-h-screen bg-[#F4F7F8] font-sans text-[#10283F]">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-[#E6EEF0] bg-white lg:flex">
        <div className="px-5 pb-5 pt-5"><Logo /></div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-6">
          {ADMIN_NAV.map((item) => <SideLink key={item.to} {...item} />)}
        </nav>
      </aside>

      <div className="lg:pl-[248px]">
        {/* desktop header */}
        <header className="sticky top-0 z-20 hidden h-[68px] items-center gap-4 border-b border-[#E6EEF0] bg-white/95 px-6 backdrop-blur lg:flex">
          <button type="button" className="rounded-lg p-1.5 text-[#10283F] hover:bg-[#F0FDFA]" aria-label="Menyu"><Menu className="size-5" /></button>
          <div className="relative max-w-xl flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5C6E80]" />
            <input placeholder="Qidirish..." className="h-10 w-full rounded-xl border border-[#E6EEF0] bg-[#F8FBFC] pl-10 pr-3 text-[14px] outline-none placeholder:text-[#8A9AA8] focus:border-[#0F766E]" />
          </div>
          <div className="ml-auto flex items-center gap-4">
            <button type="button" aria-label="Bildirishnomalar" className="relative rounded-lg p-1.5 text-[#10283F] hover:bg-[#F0FDFA]">
              <Bell className="size-5" strokeWidth={1.9} />
            </button>
            <ProfileChip name={name} open={menu} setOpen={setMenu} />
          </div>
        </header>

        {/* mobile header */}
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-[#E6EEF0] bg-white px-3 py-3 lg:hidden">
          <button type="button" onClick={() => setDrawer(true)} aria-label="Menyu" className="rounded-lg p-1.5 text-[#0F766E]"><Menu className="size-6" /></button>
          <Logo size="sm" subtitle="Admin paneli" />
          <div className="ml-auto flex items-center gap-1.5">
            <button type="button" aria-label="Bildirishnomalar" className="relative rounded-lg p-1.5 text-[#0F766E]">
              <Bell className="size-[22px]" strokeWidth={1.9} />
              <span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-[#0F766E] text-[9px] font-bold text-white">3</span>
            </button>
            <ProfileChip name={name} open={menu} setOpen={setMenu} compact />
          </div>
        </header>

        <main className="px-3 pb-28 pt-4 sm:px-4 lg:px-6 lg:pb-10 lg:pt-6">
          <Outlet context={ctx} />
        </main>
      </div>

      {/* mobile bottom tabs */}
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

      {/* mobile drawer with full nav */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden" onMouseDown={(e) => e.target === e.currentTarget && setDrawer(false)}>
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
