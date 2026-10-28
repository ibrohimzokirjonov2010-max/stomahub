import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  House, CalendarDays, Users, Ticket, QrCode, Wallet, Award, Tag, Megaphone, Mic, ChartColumn,
  Store, Wrench, Shirt, BookOpen, Settings, CircleQuestionMark, Search, MapPin, Calendar, Bell,
  ChevronDown, ChevronLeft, Star, Landmark, Ellipsis, MoreVertical, Lock, ShieldCheck,
} from 'lucide-react'
import { CITIES } from './data'
import { useHub } from '../hubStore'
import { canUseOrganizer, useSession } from '../sessionStore'
import { supabase } from '../supabaseClient'
import HubNotice from '../components/HubNotice'

const Ctx = createContext(null)
export const useOrg = () => useContext(Ctx)

const SIDEBAR = 228

const ITEM = 'flex h-8 items-center gap-2.5 rounded-[10px] px-2.5 text-[13px] leading-none'

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
const FOOTER = [
  { to: '/tashkilotchi/sozlamalar', label: 'Sozlamalar', icon: Settings },
  { to: '/tashkilotchi/yordam', label: 'Yordam', icon: CircleQuestionMark },
]

const SHEET_ORG = ORG_NAV.filter((it) => !['/tashkilotchi/seminarlar', '/tashkilotchi/qr', '/tashkilotchi/hamyon'].includes(it.to))

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

function seminarIdFrom(pathname) {
  const m = pathname.match(/^\/tashkilotchi\/seminarlar\/([^/]+)/)
  return m ? m[1] : null
}

function isSeminarScreen(pathname) {
  return /^\/tashkilotchi\/seminarlar\/.+/.test(pathname)
}

function Item({ to, icon: Icon, label, end, onClick, locked }) {
  return (
    <NavLink to={to} end={end} onClick={onClick} className={({ isActive }) => `${ITEM} ${isActive ? 'bg-[#def6f6] font-semibold text-[var(--color-org-teal)]' : 'text-[#445066] hover:bg-white'}`}>
      {({ isActive }) => (
        <>
          <Icon className={`size-[18px] shrink-0 ${isActive ? 'text-[var(--color-org-teal)]' : 'text-[#3a7a7e]'}`} strokeWidth={1.75} />
          <span className="truncate">{label}</span>
          {locked && <Lock data-testid="nav-lock" className="ml-auto size-3.5 shrink-0 text-[#9aaeb2]" aria-label="Tasdiqdan keyin ochiladi" />}
        </>
      )}
    </NavLink>
  )
}

const OPEN = ['/tashkilotchi/sozlamalar', '/tashkilotchi/yordam']
function useLocked() {
  const session = useSession()
  return (to) => to.startsWith('/tashkilotchi') && !OPEN.includes(to) && !canUseOrganizer(session.profile)
}

function ApprovalNotice({ uid }) {
  const [note, setNote] = useState(null)
  useEffect(() => {
    if (!supabase || !uid) return
    supabase.from('customer_notifications').select('id,title,body').eq('user_id', uid).eq('link', '/tashkilotchi').is('read_at', null)
      .order('created_at', { ascending: false }).limit(1).then(({ data }) => setNote(data?.[0] || null))
  }, [uid])
  if (!note) return null
  const close = () => { setNote(null); supabase.from('customer_notifications').update({ read_at: new Date().toISOString() }).eq('id', note.id).then(() => {}) }
  return (
    <div data-testid="approval-notice" role="status" className="mb-4 flex items-start gap-3 rounded-2xl bg-[#0F766E] p-4 text-white shadow-[0_10px_30px_rgb(15_118_110/0.25)]">
      <ShieldCheck className="mt-0.5 size-6 shrink-0" />
      <span className="min-w-0 flex-1"><b className="block text-[15px]">{note.title}</b><span className="text-[13.5px] text-white/90">{note.body}</span></span>
      <button type="button" onClick={close} className="rounded-lg bg-white/15 px-3 py-1.5 text-[13px] font-semibold hover:bg-white/25">Yopish</button>
    </div>
  )
}

function UnverifiedBanner({ status }) {
  const navigate = useNavigate()
  const pending = status === 'pending'
  return (
    <div data-testid="unverified-banner" className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#CCFBF1] bg-[#F0FDFA] p-4 sm:flex-row sm:items-center">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#0F766E]"><ShieldCheck className="size-5" /></span>
      <span className="min-w-0 flex-1 text-[13.5px] leading-snug text-[#3D4E5F]">
        <b className="block text-[14.5px] text-[#10283F]">{pending ? 'Arizangiz ko‘rib chiqilmoqda' : status === 'rejected' ? 'Arizangiz rad etildi' : 'Tashkilotchi hisobingiz hali tasdiqlanmagan'}</b>
        {pending ? 'Tasdiqlangach seminar qo‘shish va boshqa bo‘limlar ochiladi. Hozircha profilni to‘ldirishingiz mumkin.' : 'Hozircha faqat Sozlamalar ishlaydi. Seminar qo‘shish uchun tasdiqdan o‘ting.'}
      </span>
      {!pending && <button type="button" data-testid="banner-verify" onClick={() => navigate('/tashkilotchi/tasdiqlash')} className="h-10 shrink-0 rounded-xl bg-[#0F766E] px-4 text-[14px] font-semibold text-white">{status === 'rejected' ? 'Qayta yuborish' : 'Tasdiqdan o‘tish'}</button>}
    </div>
  )
}

function SectionLabel({ children }) {
  return <p className="mb-1 mt-3 px-2.5 text-[10px] font-semibold tracking-[0.16em] text-[#8b90a6]">{children}</p>
}

function Side({ onNavigate }) {
  const locked = useLocked()
  return (
    <div className="flex h-full flex-col">
      <nav className="px-2 pt-[13px]">
        {MAIN.map((it) => <Item key={it.to} {...it} locked={locked(it.to)} onClick={onNavigate} />)}
        <SectionLabel>SEMINAR TASHKILOTCHI</SectionLabel>
        <div className="space-y-px">
          {ORG_NAV.map((it) => <Item key={it.to} {...it} locked={locked(it.to)} onClick={onNavigate} />)}
        </div>
        <SectionLabel>PLATFORMA</SectionLabel>
        <div className="space-y-px">
          {PLATFORM.map((it) => <Item key={it.to} {...it} onClick={onNavigate} />)}
        </div>
      </nav>
      <div className="mt-auto space-y-px px-2 pb-3 pt-2">
        {FOOTER.map((it) => <Item key={it.to} {...it} onClick={onNavigate} />)}
      </div>
    </div>
  )
}

function BrandLockup({ to = '/tashkilotchi' }) {
  return (
    <Link to={to} aria-label="StomaHub" className="inline-flex min-w-0 flex-col">
      <img src="/images/logo.png" alt="" className="h-[26px] w-auto" />
      <span className="mt-1 pl-[30px] text-[11px] font-medium leading-none text-[#8b9aa3]">Seminar tashkilotchisi</span>
    </Link>
  )
}

const TAB = 'flex h-full flex-col items-center justify-center gap-0.5 text-[10.5px] leading-none'
const TAB_OFF = 'text-[#9aa3b5]'
const TAB_ON = 'font-semibold text-[var(--color-org-teal)]'

function TabLink({ to, label, icon: Icon, active, end, onClick }) {
  const cls = `${TAB} ${active ? TAB_ON : TAB_OFF}`
  const body = (
    <>
      <Icon className="size-[22px]" strokeWidth={active ? 2.15 : 1.7} fill={active ? 'currentColor' : 'none'} />
      {label}
    </>
  )
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls} aria-current={active ? 'page' : undefined}>
        {body}
      </button>
    )
  }
  return (
    <NavLink to={to} end={end} className={cls} aria-current={active ? 'page' : undefined}>
      {body}
    </NavLink>
  )
}

export default function Shell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const hub = useHub()
  const [query, setQuery] = useState('')
  const session = useSession()
  const [city, setCity] = useState('Toshkent')
  const [cityOn, setCityOn] = useState(false)
  const [panel, setPanel] = useState(null)
  const [more, setMore] = useState(false)
  const [kebab, setKebab] = useState(false)
  const [toast, setToast] = useState(null)
  const timer = useRef(null)
  const pop = useRef(null)
  const kebabRef = useRef(null)

  const verified = canUseOrganizer(session.profile)
  const perSeminar = isSeminarScreen(pathname)
  const seminarId = seminarIdFrom(pathname)
  const onSheetRoute = [...SHEET_ORG, ...PLATFORM, ...FOOTER].some((it) => pathname === it.to || pathname.startsWith(`${it.to}/`))

  useEffect(() => { setQuery(''); setPanel(null); setMore(false); setKebab(false) }, [pathname])
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
    const fn = (e) => {
      if (!pop.current?.contains(e.target)) setPanel(null)
      if (!kebabRef.current?.contains(e.target)) setKebab(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  useEffect(() => {
    if (!more && !kebab) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') { setMore(false); setKebab(false) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [more, kebab])

  const notify = (message) => {
    setToast(message)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2400)
  }
  const value = useMemo(() => ({ query, setQuery, city, cityOn, notify }), [query, city, cityOn])
  const ph = placeholderFor(pathname)

  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/tashkilotchi/seminarlar')
  }

  const sheetLink = (it) => {
    const Icon = it.icon
    const active = pathname === it.to || pathname.startsWith(`${it.to}/`)
    return (
      <Link key={it.to} to={it.to} onClick={() => setMore(false)} className={`flex h-11 items-center gap-3 rounded-xl px-2 text-[14px] ${active ? 'bg-[#e7f6f3] font-semibold text-[var(--color-org-teal)]' : 'text-[#1c3d4a]'}`}>
        <Icon className="size-5 shrink-0" strokeWidth={1.75} />
        {it.label}
        {!verified && it.to.startsWith('/tashkilotchi') && !OPEN.includes(it.to) && <Lock className="ml-auto size-4 text-[#9aaeb2]" />}
      </Link>
    )
  }

  return (
    <Ctx.Provider value={value}>
      <div className="flex h-[calc(100dvh/var(--z))] min-h-0 flex-col bg-[#f5fdfc] text-[#143044]">
        <header className="hidden h-[52px] shrink-0 items-center border-b border-[#e7f2f0] bg-white md:flex">
          <div className="flex h-full shrink-0 items-center pl-[28px]" style={{ width: SIDEBAR }}>
            <Link to="/tashkilotchi" aria-label="StomaHub" className="inline-flex">
              <img src="/images/logo.png" alt="" className="h-[30px] w-auto" />
            </Link>
          </div>
          {pathname.startsWith('/tashkilotchi/sozlamalar') ? <div className="min-w-0 flex-1" /> : (
            <div className="mr-2 flex h-8 min-w-0 flex-1 items-center gap-2 rounded-full bg-[#e8f4f3] px-3.5">
              <Search className="size-4 shrink-0 text-[#8aa4a8]" strokeWidth={1.8} />
              <input
                name="org-search"
                type="search"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={ph}
                className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#9aafb4]"
              />
            </div>
          )}
          <div ref={pop} className="relative flex shrink-0 items-center gap-7 pr-4">
            <div className="relative">
              <button type="button" onClick={() => setPanel(panel === 'city' ? null : 'city')} className="flex h-8 items-center gap-1.5 rounded-full px-1 text-[13px] font-medium text-[#1c4a5a]">
                <MapPin className="size-4 text-[var(--color-org-teal)]" strokeWidth={1.8} />
                <span className="hidden lg:inline">{city}</span>
                <ChevronDown className="size-3.5 text-[#8aa4a8]" />
              </button>
              {panel === 'city' && (
                <ul className="absolute right-0 z-40 mt-1 w-40 overflow-hidden rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
                  <li>
                    <button type="button" className="block w-full px-3 py-1.5 text-left text-[13px] hover:bg-[#f4fbfa]" onClick={() => { setCity('Toshkent'); setCityOn(false); setPanel(null) }}>Barcha shaharlar</button>
                  </li>
                  {CITIES.map((c) => (
                    <li key={c}>
                      <button type="button" className="block w-full px-3 py-1.5 text-left text-[13px] hover:bg-[#f4fbfa]" onClick={() => { setCity(c); setCityOn(true); setPanel(null) }}>{c}</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="button" aria-label="Kalendar" onClick={() => setPanel(panel === 'cal' ? null : 'cal')} className="grid size-8 place-items-center rounded-full text-[var(--color-org-teal)] hover:bg-[#f3faf8]">
              <Calendar className="size-[18px]" strokeWidth={1.75} />
            </button>
            <button type="button" aria-label="Bildirishnomalar" onClick={() => setPanel(panel === 'bell' ? null : 'bell')} className="relative grid size-8 place-items-center rounded-full text-[var(--color-org-teal)] hover:bg-[#f3faf8]">
              <Bell className="size-[18px]" strokeWidth={1.75} />
              {hub.activity?.length > 0 && <span className="absolute right-1.5 top-1.5 size-[7px] rounded-full bg-[#ef4444] ring-2 ring-white" />}
            </button>
            {panel === 'cal' && (
              <div className="absolute right-16 top-10 z-40 w-64 rounded-2xl border border-[#e6eeec] bg-white p-3 shadow-xl">
                <p className="text-[13px] font-bold">Noyabr 2026</p>
                <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] text-[#8aa0a4]">
                  {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map((d) => <span key={d}>{d}</span>)}
                  {Array.from({ length: 30 }, (_, i) => (
                    <button key={i} type="button" onClick={() => { setPanel(null); navigate(`/tashkilotchi/seminarlar?kun=${i + 1}`) }} className={`grid h-7 place-items-center rounded-lg ${i + 1 === 24 ? 'bg-[var(--color-org-teal)] text-white' : 'hover:bg-[#f3faf8]'}`}>{i + 1}</button>
                  ))}
                </div>
              </div>
            )}
            {panel === 'bell' && (
              <div className="absolute right-8 top-10 z-40 w-[320px] rounded-2xl border border-[#e6eeec] bg-white p-3 shadow-xl">
                <p className="mb-2 text-[13px] font-bold">Bildirishnomalar</p>
                <ul className="space-y-2">
                  {(hub.activity || []).map((a) => (
                    <li key={a.title} className="rounded-xl px-1 py-1 hover:bg-[#f6fbfa]">
                      <p className="text-[12.5px] font-semibold">{a.title}</p>
                      <p className="text-[11.5px] text-[#7e9398]">{a.text} · {a.time}</p>
                    </li>
                  ))}
                  {!hub.activity?.length && <li className="px-1 py-3 text-[12.5px] text-[#7e9398]">Bildirishnomalar yo‘q</li>}
                </ul>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              {session.profile?.avatar_url ? (
                <img src={session.profile.avatar_url} alt="" className="size-8 rounded-full object-cover" />
              ) : (
                <span className="grid size-8 place-items-center rounded-full bg-[#e7f7f4] text-[12px] font-bold text-[var(--color-org-teal)]">{(hub.settings?.name || session.profile?.name || 'T').slice(0, 1)}</span>
              )}
              <div className="hidden leading-tight lg:block">
                <p className="text-[13px] font-semibold text-[#143044]">{hub.settings?.name || session.profile?.name || 'Tashkilotchi'}</p>
                <p className="text-[11px] text-[#8aa0a6]">{session.profile?.specialty || 'Tashkilotchi'}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className="hidden shrink-0 overflow-y-auto bg-[#f5fdfc] md:block" style={{ width: SIDEBAR }}>
            <Side />
          </aside>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <header className="relative flex h-14 shrink-0 items-center gap-1 bg-white px-3 md:hidden">
              {perSeminar ? (
                <button type="button" onClick={goBack} aria-label="Orqaga" className="grid size-10 shrink-0 place-items-center rounded-full text-[#1c3d4a]">
                  <ChevronLeft className="size-6" strokeWidth={1.75} />
                </button>
              ) : null}
              <BrandLockup />
              <div className="ml-auto flex items-center gap-0.5">
                {perSeminar ? (
                  <div ref={kebabRef} className="relative">
                    <button type="button" aria-label="Yana amallar" onClick={() => setKebab((v) => !v)} className="grid size-10 place-items-center rounded-full text-[#1c3d4a]">
                      <MoreVertical className="size-5" />
                    </button>
                    {kebab && (
                      <div className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-2xl border border-[#e6eeec] bg-white py-1 shadow-xl">
                        {seminarId && seminarId !== 'yangi' && (
                          <Link to={`/tashkilotchi/seminarlar/yangi?tahrir=${seminarId}`} className="block px-3 py-2 text-[13px] hover:bg-[#f4fbfa]" onClick={() => setKebab(false)}>Tahrirlash</Link>
                        )}
                        {seminarId && seminarId !== 'yangi' && /^\/tashkilotchi\/seminarlar\/[^/]+$/.test(pathname) && (
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-[13px] text-[#e11d48] hover:bg-[#f4fbfa]"
                            onClick={() => {
                              setKebab(false)
                              const next = new URLSearchParams(window.location.search)
                              next.set('bekor', '1')
                              navigate(`${pathname}?${next.toString()}`, { replace: true })
                              window.dispatchEvent(new Event('org-seminar-cancel'))
                            }}
                          >
                            Bekor qilish
                          </button>
                        )}
                        <Link to="/tashkilotchi/ishtirokchilar" className="block px-3 py-2 text-[13px] hover:bg-[#f4fbfa]" onClick={() => setKebab(false)}>Ishtirokchilar</Link>
                        <Link to="/tashkilotchi/qr" className="block px-3 py-2 text-[13px] hover:bg-[#f4fbfa]" onClick={() => setKebab(false)}>QR check-in</Link>
                        <button
                          type="button"
                          className="block w-full px-3 py-2 text-left text-[13px] hover:bg-[#f4fbfa]"
                          onClick={() => {
                            const url = window.location.href
                            navigator.clipboard?.writeText(url).then(() => notify('Havola nusxalandi')).catch(() => notify(url))
                            setKebab(false)
                          }}
                        >
                          Ulashish
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <button type="button" aria-label="Bildirishnomalar" onClick={() => setPanel(panel === 'mbell' ? null : 'mbell')} className="relative grid size-10 place-items-center rounded-full text-[#243044]">
                      <Bell className="size-[22px]" strokeWidth={1.7} />
                    </button>
                    <Link to="/tashkilotchi/sozlamalar" aria-label="Profil" className="grid size-9 place-items-center rounded-full bg-[var(--color-org-teal)] text-[15px] font-semibold text-white">S</Link>
                  </>
                )}
              </div>
              {panel === 'mbell' && (
                <div className="absolute inset-x-3 top-16 z-40 rounded-2xl border border-[#e6eeec] bg-white p-3 shadow-xl">
                  <p className="mb-2 text-[13px] font-bold">Bildirishnomalar</p>
                  <ul className="space-y-2">
                    {(hub.activity || []).map((a) => (
                      <li key={a.title}>
                        <p className="text-[12.5px] font-semibold">{a.title}</p>
                        <p className="text-[11.5px] text-[#7e9398]">{a.text} · {a.time}</p>
                      </li>
                    ))}
                    {!hub.activity?.length && <li className="text-[12.5px] text-[#7e9398]">Bildirishnomalar yo‘q</li>}
                  </ul>
                </div>
              )}
            </header>
            <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[calc(96px+env(safe-area-inset-bottom))] md:py-4 md:pb-4 md:pl-0 md:pr-4">
              <HubNotice hub={hub} />
              <ApprovalNotice uid={session.user?.id} />
              {!verified && pathname !== '/tashkilotchi/tasdiqlash' && <UnverifiedBanner status={session.profile?.org_status} />}
              <Outlet />
            </main>
          </div>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e7eeec] bg-white pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Asosiy">
          <ul className="grid h-16 grid-cols-5">
            <li>
              <TabLink to="/tashkilotchi" end label="Panel" icon={House} active={pathname === '/tashkilotchi'} />
            </li>
            <li>
              <TabLink to="/tashkilotchi/seminarlar" label="Seminarlar" icon={CalendarDays} active={pathname === '/tashkilotchi/seminarlar'} />
            </li>
            <li className="relative">
              <Link to="/tashkilotchi/qr" aria-label="Check-in" className="absolute left-1/2 top-0 grid size-[58px] -translate-x-1/2 -translate-y-[22px] place-items-center rounded-full bg-[var(--color-org-teal)] text-white shadow-[0_8px_18px_rgb(12_143_134/0.35)]">
                <QrCode className="size-7" strokeWidth={1.8} />
              </Link>
              <span className={`pointer-events-none absolute inset-x-0 bottom-1.5 text-center text-[10.5px] leading-none ${pathname.startsWith('/tashkilotchi/qr') ? 'font-semibold text-[var(--color-org-teal)]' : 'text-[#9aa3b5]'}`}>Check-in</span>
            </li>
            <li>
              <TabLink to="/tashkilotchi/hamyon" label="Hamyon" icon={Wallet} active={pathname.startsWith('/tashkilotchi/hamyon')} />
            </li>
            <li>
              <TabLink label="Yana" icon={Ellipsis} active={more || onSheetRoute} onClick={() => setMore(true)} />
            </li>
          </ul>
        </nav>

        {more && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button type="button" aria-label="Yopish" className="absolute inset-0 bg-[#0e2a3a]/40" onClick={() => setMore(false)} />
            <div className="absolute inset-x-0 bottom-0 max-h-[78%] overflow-y-auto rounded-t-[24px] bg-white px-3 pb-[calc(20px+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_30px_rgb(16_40_40/0.12)]">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#d5e0de]" />
              <p className="px-2 pb-1 text-[15px] font-bold">Bo‘limlar</p>
              <p className="px-2 pb-1 pt-2 text-[10px] font-semibold tracking-[0.14em] text-[#8ea0a8]">SEMINAR TASHKILOTCHI</p>
              {SHEET_ORG.map(sheetLink)}
              <p className="px-2 pb-1 pt-3 text-[10px] font-semibold tracking-[0.14em] text-[#8ea0a8]">PLATFORMA</p>
              {PLATFORM.map(sheetLink)}
              <div className="mt-2 border-t border-[#eef3f2] pt-2">
                {FOOTER.map(sheetLink)}
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-24 left-1/2 z-[80] -translate-x-1/2 rounded-xl bg-[#143044] px-4 py-2 text-[13px] text-white shadow-lg md:bottom-4">
            {toast}
          </div>
        )}
      </div>
    </Ctx.Provider>
  )
}
