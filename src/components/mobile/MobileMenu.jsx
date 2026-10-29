import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  X, Home, CalendarDays, ShoppingBag, Recycle, Shirt, GraduationCap, BookOpen, Wrench,
  Megaphone, Briefcase, Stethoscope, User, Store, Presentation, LogOut, LogIn, ChevronRight,
} from 'lucide-react'
import { MenuIcons as M, SectionIcons } from '../tealIcons'
import { canEnterSeller, canEnterOrganizer, signOut, useSession } from '../../sessionStore'

// Faqat mavjud marshrutlar (App.jsx). Laboratoriya va Konsultatsiyalar uchun marshrut yo'q.
const ITEMS = [
  { to: '/', label: 'Bosh sahifa', icon: Home },
  { to: '/seminarlar', label: 'Seminarlar', icon: CalendarDays },
  { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { to: '/ortiqcha', label: 'Ortiqcha materiallar', icon: Recycle },
  { to: '/forma', label: 'Forma', icon: SectionIcons.forma },
  { to: '/jihozlar', label: 'Jihozlar', icon: SectionIcons.jihozlar },
  { to: '/talim', label: 'Ta’lim / Kurslar', icon: M.talim },
  { to: '/kitoblar', label: 'Kitoblar', icon: BookOpen },
  { to: '/ustalar', label: 'Ustalar', icon: Wrench },
  { to: '/elonlar', label: 'E’lonlar', icon: Megaphone },
  { to: '/ishlar', label: 'Vakansiyalar', icon: M.vakansiyalar },
  { to: '/klinika', label: 'Klinika CRM', icon: M.klinika },
  { to: '/profil', label: 'Profil', icon: User },
]

export function MenuButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label="Menyu" aria-haspopup="dialog" className="grid size-10 place-items-center rounded-full text-ink active:bg-white/70">
      <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>
  )
}

export default function MobileMenu({ open, onClose }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const session = useSession()
  const first = useRef(pathname)
  const panel = useRef(null)
  const loggedIn = !!session.user
  const profile = session.profile

  // Marshrut o'zgarganda yopish
  useEffect(() => {
    if (first.current !== pathname) onClose()
    first.current = pathname
  }, [pathname, onClose])

  // Body scroll lock + Escape
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    panel.current?.focus()
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const extra = []
  if (loggedIn && canEnterSeller(profile)) extra.push({ to: '/sotuvchi', label: 'Sotuvchi kabineti', icon: Store })
  if (loggedIn && canEnterOrganizer(profile)) extra.push({ to: '/tashkilotchi', label: 'Tashkilotchi kabineti', icon: Presentation })

  const row = (it) => {
    const Icon = it.icon
    const active = it.to === '/' ? pathname === '/' : pathname.startsWith(it.to)
    return (
      <li key={it.to}>
        <Link to={it.to} onClick={onClose} aria-current={active ? 'page' : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium ${active ? 'bg-[#0F766E]/10 text-[#0F766E]' : 'text-ink active:bg-[#eef7f8]'}`}>
          <span className={`grid size-9 place-items-center rounded-lg ${active ? 'bg-[#0F766E] text-white' : 'bg-[#eef7f8] text-[#0F766E]'}`}>
            <Icon className={Icon.raster ? 'size-7' : 'size-[18px]'} strokeWidth={1.9} />
          </span>
          <span className="flex-1">{it.label}</span>
          <ChevronRight className="size-4 text-slate-400" />
        </Link>
      </li>
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Menyu">
      <div className="absolute inset-0 bg-[#0b1f3a]/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <nav ref={panel} tabIndex={-1}
        className="absolute inset-y-0 left-0 flex w-[82%] max-w-[320px] flex-col bg-white shadow-2xl outline-none"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)' }}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <img src="/images/logo.png" alt="StomaHub" className="h-8 w-auto" />
          <button type="button" onClick={onClose} aria-label="Menyuni yopish" className="grid size-10 place-items-center rounded-full text-ink active:bg-[#eef7f8]">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-2">
          <ul className="space-y-0.5">{ITEMS.map(row)}</ul>
          {extra.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Kabinetlar</p>
              <ul className="space-y-0.5">{extra.map(row)}</ul>
            </>
          )}
        </div>
        <div className="border-t border-slate-100 p-2">
          {loggedIn ? (
            <button type="button" onClick={async () => { onClose(); await signOut(); navigate('/') }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-[#dc2626] active:bg-[#fdecec]">
              <span className="grid size-9 place-items-center rounded-lg bg-[#fdecec]"><LogOut className="size-[18px]" /></span>
              Chiqish
            </button>
          ) : (
            <Link to="/kirish" onClick={onClose} className="flex items-center gap-3 rounded-xl bg-[#0F766E] px-3 py-2.5 text-[15px] font-semibold text-white">
              <LogIn className="size-[18px]" /> Kirish
            </Link>
          )}
        </div>
      </nav>
    </div>,
    document.body,
  )
}
