import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  House, ShoppingCart, BookOpen, FolderOpen, Handshake, Users, UserRound, Settings,
  Store, LayoutGrid, BadgeCheck, Tag, Shirt, Monitor, Recycle,
  Presentation, MonitorPlay, IdCard,
  CalendarDays, CalendarCheck, ClipboardList, Wallet, HeartPulse, Warehouse, ChartPie,
  Wrench, MessagesSquare, Newspaper, Rss, Briefcase,
  ChevronDown, LogOut, X,
} from 'lucide-react'
import { profileStore } from '../../profileStore'
import { signOut, useSession } from '../../sessionStore'
import { todayIso, useVisits } from '../../uchrashuvData'

const GROUPS = [
  {
    id: 'xarid',
    title: 'Xaridlar',
    icon: ShoppingCart,
    items: [
      { label: 'Marketplace', icon: Store, to: '/marketplace', keys: ['all', 'market'] },
      { label: 'Kategoriyalar', icon: LayoutGrid, to: '/kategoriyalar', keys: ['cats'] },
      { label: 'Brendlar', icon: BadgeCheck, to: '/brendlar', keys: ['brands'] },
      { label: 'Aksiyalar', icon: Tag, to: '/aksiyalar', keys: ['aksiya'] },
      { label: 'Forma', icon: Shirt, to: '/forma', keys: ['forma'] },
      { label: 'Jihozlar', icon: Monitor, to: '/jihozlar', keys: ['jihozlar'] },
      { label: 'Ishlatilgan va ortiqcha', icon: Recycle, to: '/ortiqcha', keys: ['surplus'] },
    ],
  },
  {
    id: 'talim',
    title: 'Ta’lim va rivojlanish',
    icon: BookOpen,
    items: [
      { label: 'Seminarlar', icon: Presentation, to: '/seminarlar', keys: ['seminars'] },
      { label: 'Onlayn darslar', icon: MonitorPlay, to: '/talim', keys: ['education'] },
      { label: 'Kitoblar', icon: BookOpen, to: '/kitoblar', keys: ['books'] },
      { label: 'Sertifikatlarim', icon: IdCard, to: '/sertifikatlar', keys: ['certs'] },
    ],
  },
  {
    id: 'klinika',
    title: 'Klinika CRM',
    icon: FolderOpen,
    items: [
      { label: 'Bemorlar CRM', icon: Users, to: '/bemorlar', keys: ['bemorlar'] },
      { label: 'Qabul jadvali', icon: CalendarDays, to: '/klinika', keys: ['klinika'] },
      { label: 'Uchrashuvlar', icon: CalendarCheck, to: '/uchrashuvlar', keys: ['uchrashuv'], badge: 'today' },
      { label: 'Davolash rejalari', icon: ClipboardList, to: '/davolash-rejalari', keys: ['rejalar'] },
      { label: 'To‘lovlar', icon: Wallet, to: '/tolovlar', keys: ['tolov'] },
      { label: 'Xizmatlar', icon: HeartPulse, to: '/xizmatlar', keys: ['xizmatlar'] },
      { label: 'Ombor', icon: Warehouse, to: '/ombor', keys: ['ombor'] },
      { label: 'Hisobotlar', icon: ChartPie, to: '/hisobotlar', keys: ['hisobot'] },
    ],
  },
  {
    id: 'hamkor',
    title: 'Xizmatlar va hamkorlar',
    icon: Handshake,
    items: [
      { label: 'Ustalar', icon: Wrench, to: '/ustalar', keys: ['ustalar'] },
      { label: 'Vakansiyalar', icon: Briefcase, to: '/ishlar', keys: ['ishlar'] },
    ],
  },
  {
    id: 'hamjamiyat',
    title: 'Hamjamiyat',
    icon: Users,
    items: [
      { label: 'Lenta', icon: MessagesSquare, to: '/community', keys: ['community'] },
      { label: 'Yangiliklar', icon: Newspaper, to: '/yangiliklar', keys: ['yangiliklar'] },
      { label: 'Foydali kanallar', icon: Rss, to: '/kanallar', keys: ['channels'] },
    ],
  },
]

const groupOf = (active) => GROUPS.find((g) => g.items.some((it) => it.keys.includes(active)))?.id || ''

export default function ShopSidebar({ active = 'all', open, onClose, flush = false }) {
  const [openId, setOpenId] = useState(() => groupOf(active))
  const visits = useVisits()
  const today = todayIso()
  const todayCount = visits.filter((v) => v.date === today && v.status !== 'bekor').length

  useEffect(() => { setOpenId(groupOf(active)) }, [active])

  const toggle = (id) => setOpenId((cur) => (cur === id ? '' : id))

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-ink/30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-[calc(100dvh/var(--z))] w-[300px] flex-col bg-white shadow-[1px_0_0_#e6eef2] transition-transform
          ${flush ? 'lg:w-[280px] lg:translate-x-0 lg:shadow-none' : 'lg:sticky lg:top-[46px] lg:z-0 lg:h-[calc(100dvh/var(--z)-46px)] lg:w-[280px] lg:shrink-0 lg:translate-x-0 lg:shadow-none'}
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <Link to="/" aria-label="StomaHub" onClick={onClose} className="inline-flex">
            <img src="/images/stomahub-logo-desktop.png" alt="StomaHub" className="h-10 w-auto" />
          </Link>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-xl text-[#17324d] hover:bg-[#f3faf8] lg:hidden" aria-label="Yopish">
            <X className="size-5" />
          </button>
        </div>

        <nav aria-label="Asosiy menyu" className="no-scrollbar flex-1 overflow-y-auto px-3 pb-3">
          <Item to="/" icon={House} label="Bosh sahifa" active={active === 'home'} onClick={onClose} />
          {GROUPS.map((g) => (
            <Group
              key={g.id}
              group={g}
              open={openId === g.id}
              onToggle={() => toggle(g.id)}
              active={active}
              todayCount={todayCount}
              onNavigate={onClose}
            />
          ))}
          <Item to="/profil" icon={UserRound} label="Profil" active={active === "profil"} onClick={onClose} />
        </nav>

        <div className="border-t border-[#e7eef3] px-3 py-3">
          <Item to="/sozlamalar" icon={Settings} label="Sozlamalar" onClick={onClose} />
          <SignOutRow onClick={onClose} />
        </div>
      </aside>
    </>
  )
}

function Group({ group, open, onToggle, active, todayCount, onNavigate }) {
  const Icon = group.icon
  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-semibold transition ${open ? 'text-[#0b8a84]' : 'text-[#17324d] hover:bg-[#f3faf8]'}`}
      >
        <Icon className="size-5 shrink-0 text-[#0b8a84]" strokeWidth={1.8} />
        <span className="min-w-0 flex-1 truncate">{group.title}</span>
        <ChevronDown className={`size-4 shrink-0 text-[#0b8a84] transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mb-1 ml-3 border-l border-[#e3f2f0] pl-2">
          {group.items.map((it) => (
            <Item
              key={it.label}
              {...it}
              active={it.keys.includes(active)}
              badge={it.badge === 'today' ? todayCount : 0}
              onClick={onNavigate}
              nested
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SignOutRow({ onClick }) {
  const navigate = useNavigate()
  const session = useSession()
  if (session.status !== 'authed') return null
  return (
    <button
      type="button"
      onClick={async () => {
        onClick?.()
        await signOut()
        profileStore.update({ loggedOut: true, accountLive: false })
        navigate('/kirish')
      }}
      className="mt-1 flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-semibold text-[#d14343] hover:bg-[#fff5f5]"
    >
      <LogOut className="size-5 shrink-0" strokeWidth={1.8} /> Chiqish
    </button>
  )
}

function Item({ to, state, icon: Icon, label, active, badge, onClick, nested }) {
  const cls = `flex items-center gap-3 rounded-xl px-3 font-medium transition ${nested ? 'h-10 text-[14px]' : 'mt-0.5 h-11 text-[15px]'} ${
    active ? 'bg-[#e5f6f3] font-semibold text-[#0b7c76]' : 'text-[#17324d] hover:bg-[#f3faf8]'
  }`
  const inner = (
    <>
      <Icon className={`shrink-0 text-[#0b8a84] ${nested ? 'size-[18px]' : 'size-5'}`} strokeWidth={1.8} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#0b8a84] px-1.5 text-[11px] font-bold text-white">{badge}</span>}
    </>
  )
  if (!to) return <span className={cls}>{inner}</span>
  return <Link to={to} state={state} onClick={onClick} className={cls}>{inner}</Link>
}
