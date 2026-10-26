import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import {
  House, CalendarDays, Users, Ticket, QrCode, Wallet, Award, Tag, Megaphone, Mic, ChartColumn,
  Store, Wrench, Shirt, BookOpen, Settings, CircleQuestionMark, Search, MapPin, Calendar, Bell,
  ChevronDown, Menu, X, Star, Landmark,
} from 'lucide-react'
import { Logo } from '../components/icons'
import { ACTIVITY, CITIES, ORG } from './data'

const Ctx = createContext(null)
export const useOrg = () => useContext(Ctx)

const ITEM = 'flex h-[34px] items-center gap-2.5 rounded-xl px-2.5 text-[13px]'

const MAIN = [
  { to: '/tashkilotchi', label: 'Boshqaruv paneli', icon: House, end: true },
]
const ORG_NAV = [
  { to: '/tashkilotchi/seminarlar', label: 'Mening seminarlarim', icon: CalendarDays },
  { to: '/tashkilotchi/ishtirokchilar', label: 'Ishtirokchilar', icon: Users },
  { to: '/tashkilotchi/chiptalar', label: 'Chiptalar', icon: Ticket },
  { to: '/tashkilotchi/qr', label: 'QR Check-in', icon: QrCode },
  { to: '/tashkilotchi/tolovlar', label: 'To‘lovlar', icon: Wallet },
  { to: '/tashkilotchi/hamyon', label: 'Hamyon', icon: Landmark },
  { to: '/tashkilotchi/sertifikatlar', label: 'Sertifikatlar', icon: Award },
  { to: '/tashkilotchi/promo', label: 'Promo-kodlar', icon: Tag },
  { to: '/tashkilotchi/marketing', label: 'Marketing', icon: Megaphone },
  { to: '/tashkilotchi/maruzachilar', label: 'Ma’ruzachilar', icon: Mic },
  { to: '/tashkilotchi/hisobotlar', label: 'Hisobotlar', icon: ChartColumn },
  { to: '/tashkilotchi/reyting', label: 'Reyting va sharhlar', icon: Star },
]
const PLATFORM = [
  { to: '/marketplace', label: 'Marketplace', icon: Store },
  { to: '/ustalar', label: 'Ustalar', icon: Wrench },
  { to: '/forma', label: 'Forma', icon: Shirt },
  { to: '/talim', label: 'Ta’lim', icon: BookOpen },
]

const PLACE = [
  ['/tashkilotchi/seminarlar', 'Seminar nomi, ma’ruzachi yoki joy bo‘yicha qidiring...'],
  ['/tashkilotchi/ishtirokchilar', 'Seminar, ishtirokchi, ma’ruzachi yoki boshqa narsa qidiring...'],
  ['/tashkilotchi/chiptalar', 'Seminar, ishtirokchi, chipta yoki to‘lovni qidiring...'],
  ['/tashkilotchi/qr', 'Seminar, ishtirokchi, chipta yoki QR kod qidiring...'],
  ['/tashkilotchi/tolovlar', 'Seminar, ishtirokchi, to‘lov yoki tranzaksiya qidiring...'],
  ['/tashkilotchi/sertifikatlar', 'Seminar, ishtirokchi, sertifikat yoki QR kod qidiring...'],
  ['/tashkilotchi/promo', 'Seminar, ishtirokchi, promokod yoki boshqa qidiring...'],
  ['/tashkilotchi/seminarlar/yangi', 'Seminar, ma’ruzachi, mavzu yoki shahar bo‘yicha qidiring...'],
]

function placeholderFor(path) {
  const hit = PLACE.find(([p]) => path === p || (p !== '/tashkilotchi/seminarlar' && path.startsWith(p)))
  if (path.startsWith('/tashkilotchi/seminarlar')) {
    if (path.includes('/yangi')) return PLACE.find(([p]) => p.endsWith('yangi'))[1]
    return 'Seminar nomi, ma’ruzachi yoki joy bo‘yicha qidiring...'
  }
  return hit?.[1] || 'Seminar, ishtirokchi, ma’ruzachi yoki to‘lovni qidiring...'
}

function Item({ to, icon: Icon, label, end, onClick }) {
  return (
    <NavLink to={to} end={end} onClick={onClick} className={({ isActive }) => `${ITEM} ${isActive ? 'bg-[#e7f6f3] font-semibold text-[#0c8f86]' : 'text-[#3e5a62] hover:bg-white'}`}>
      <Icon className="size-[18px] shrink-0" strokeWidth={1.8} />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

function Side({ onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <nav className="space-y-0.5">
        {MAIN.map((it) => <Item key={it.to} {...it} onClick={onNavigate} />)}
      </nav>
      <p className="mb-1 mt-4 px-2.5 text-[10px] font-semibold tracking-[0.14em] text-[#93a8ad]">SEMINAR TASHKILOTCHI</p>
      <nav className="space-y-0.5">
        {ORG_NAV.map((it) => <Item key={it.to} {...it} onClick={onNavigate} />)}
      </nav>
      <p className="mb-1 mt-4 px-2.5 text-[10px] font-semibold tracking-[0.14em] text-[#93a8ad]">PLATFORMA</p>
      <nav className="space-y-0.5">
        {PLATFORM.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} onClick={onNavigate} className={`${ITEM} text-[#3e5a62] hover:bg-white`}>
            <Icon className="size-[18px]" strokeWidth={1.8} /> {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto space-y-0.5 pt-4">
        <Item to="/tashkilotchi/sozlamalar" icon={Settings} label="Sozlamalar" onClick={onNavigate} />
        <Item to="/tashkilotchi/yordam" icon={CircleQuestionMark} label="Yordam" onClick={onNavigate} />
      </div>
    </div>
  )
}

export default function Shell() {
  const { pathname } = useLocation()
  const [query, setQuery] = useState('')
  const [city, setCity] = useState(ORG.city)
  const [menu, setMenu] = useState(false)
  const [panel, setPanel] = useState(null)
  const [toast, setToast] = useState(null)
  const timer = useRef(null)
  const pop = useRef(null)

  useEffect(() => { setQuery(''); setMenu(false); setPanel(null) }, [pathname])
  useEffect(() => {
    const id = 'org-fonts'
    if (document.getElementById(id)) return undefined
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap'
    document.head.appendChild(link)
    return undefined
  }, [])
  useEffect(() => {
    const fn = (e) => { if (!pop.current?.contains(e.target)) setPanel(null) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const notify = (message) => {
    setToast(message)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2400)
  }
  const value = useMemo(() => ({ query, setQuery, city, notify }), [query, city])
  const ph = placeholderFor(pathname)

  return (
    <Ctx.Provider value={value}>
      <div className="flex h-[calc(100dvh/var(--z))] min-h-0 flex-col bg-[#f3faf8] text-[#143044]">
        <header className="relative flex h-16 shrink-0 items-center gap-2 border-b border-[#e7f2f0] bg-white px-3 sm:gap-3 sm:px-4">
          <button type="button" onClick={() => setMenu(true)} aria-label="Menyu" className="grid size-10 place-items-center rounded-xl text-[#0c8f86] lg:hidden"><Menu className="size-5" /></button>
          <Logo />
          <label className="mx-auto hidden h-11 min-w-0 max-w-[520px] flex-1 items-center gap-2 rounded-full border border-[#e5f0ee] bg-[#f7fbfb] px-4 md:flex">
            <Search className="size-4 shrink-0 text-[#8aa4a8]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ph} className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#9aafb4]" />
          </label>
          <div ref={pop} className="ml-auto flex items-center gap-1 sm:gap-1.5">
            <div className="relative">
              <button type="button" onClick={() => setPanel(panel === 'city' ? null : 'city')} className="hidden h-10 items-center gap-1.5 rounded-full px-2 text-[13px] font-medium text-[#1c4a5a] md:flex">
                <MapPin className="size-4 text-[#0c8f86]" /> {city} <ChevronDown className="size-3.5 text-[#8aa4a8]" />
              </button>
              {panel === 'city' && (
                <ul className="absolute right-0 z-40 mt-1 w-40 overflow-hidden rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
                  {CITIES.map((c) => (
                    <li key={c}><button type="button" className="block w-full px-3 py-1.5 text-left text-[13px] hover:bg-[#f4fbfa]" onClick={() => { setCity(c); setPanel(null) }}>{c}</button></li>
                  ))}
                </ul>
              )}
            </div>
            <button type="button" aria-label="Kalendar" onClick={() => setPanel(panel === 'cal' ? null : 'cal')} className="grid size-10 place-items-center rounded-full text-[#0c8f86] hover:bg-[#f3faf8]"><Calendar className="size-[18px]" /></button>
            <button type="button" aria-label="Bildirishnomalar" onClick={() => setPanel(panel === 'bell' ? null : 'bell')} className="relative grid size-10 place-items-center rounded-full text-[#0c8f86] hover:bg-[#f3faf8]">
              <Bell className="size-[18px]" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-[#ef4444] ring-2 ring-white" />
            </button>
            {panel === 'cal' && (
              <div className="absolute right-24 top-16 z-40 w-64 rounded-2xl border border-[#e6eeec] bg-white p-3 shadow-xl">
                <p className="text-[13px] font-bold">Noyabr 2026</p>
                <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] text-[#8aa0a4]">
                  {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map((d) => <span key={d}>{d}</span>)}
                  {Array.from({ length: 30 }, (_, i) => (
                    <button key={i} type="button" onClick={() => { notify(`${i + 1}-noyabr tanlandi`); setPanel(null) }} className={`grid h-7 place-items-center rounded-lg ${i + 1 === 24 ? 'bg-[#0c8f86] text-white' : 'hover:bg-[#f3faf8]'}`}>{i + 1}</button>
                  ))}
                </div>
              </div>
            )}
            {panel === 'bell' && (
              <div className="absolute right-16 top-16 z-40 w-[320px] rounded-2xl border border-[#e6eeec] bg-white p-3 shadow-xl">
                <p className="mb-2 text-[13px] font-bold">Bildirishnomalar</p>
                <ul className="space-y-2">
                  {ACTIVITY.map((a) => (
                    <li key={a.title} className="rounded-xl px-1 py-1 hover:bg-[#f6fbfa]">
                      <p className="text-[12.5px] font-semibold">{a.title}</p>
                      <p className="text-[11.5px] text-[#7e9398]">{a.text} · {a.time}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="ml-1 flex items-center gap-2 pl-1">
              <img src={ORG.avatar} alt="" className="size-9 rounded-full object-cover" />
              <div className="hidden leading-tight sm:block">
                <p className="text-[13px] font-semibold">{ORG.name}</p>
                <p className="text-[11px] text-[#7e9398]">{ORG.role}</p>
              </div>
            </div>
          </div>
        </header>
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-[228px] shrink-0 overflow-y-auto border-r border-[#e7f2f0] bg-[#f7fcfb] px-2.5 py-3 lg:block">
            <Side />
          </aside>
          {menu && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button type="button" aria-label="Yopish" className="absolute inset-0 bg-[#0e2a3a]/30" onClick={() => setMenu(false)} />
              <aside className="absolute inset-y-0 left-0 flex w-[268px] flex-col overflow-y-auto bg-[#f7fcfb] px-2.5 py-3 shadow-xl">
                <button type="button" onClick={() => setMenu(false)} aria-label="Yopish" className="mb-2 ml-auto grid size-8 place-items-center"><X className="size-4" /></button>
                <Side onNavigate={() => setMenu(false)} />
              </aside>
            </div>
          )}
          <main className="min-w-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
            <div className="mb-3 md:hidden">
              <label className="flex h-10 items-center gap-2 rounded-full border border-[#e5f0ee] bg-white px-3">
                <Search className="size-4 text-[#8aa4a8]" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Qidirish..." className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" />
              </label>
            </div>
            <Outlet />
          </main>
        </div>
        {toast && <div className="fixed bottom-4 left-1/2 z-[80] -translate-x-1/2 rounded-xl bg-[#143044] px-4 py-2 text-[13px] text-white shadow-lg">{toast}</div>}
      </div>
    </Ctx.Provider>
  )
}
