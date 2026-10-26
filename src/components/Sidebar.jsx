import {
  House, Store, BadgePercent, Shield, CalendarDays, UserRound, MonitorPlay,
  LayoutGrid, Monitor, FlaskConical, Activity, Shirt, Images, Star, CircleHelp, X,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { profileStore } from '../profileStore'
import { signOut, useSession } from '../sessionStore'
import { ToothIcon } from './icons'

const groups = [
  {
    title: "Do'kon",
    items: [
      { label: 'Marketplace', icon: Store, to: '/marketplace' },
      { label: 'Maxsus takliflar', icon: BadgePercent },
      { label: 'Yangi mahsulotlar', icon: ToothIcon },
      { label: 'Mashhur brendlar', icon: Shield },
    ],
  },
  {
    title: "Ta'lim",
    items: [
      { label: 'Seminarlar', icon: CalendarDays, to: '/seminarlar' },
      { label: 'Ustalar', icon: UserRound },
      { label: "Onlayn ta'lim", icon: MonitorPlay, to: '/talim' },
    ],
  },
  {
    title: 'Klinika',
    items: [
      { label: 'Klinika echimlari', icon: LayoutGrid },
      { label: 'Uskunalar', icon: Monitor },
      { label: 'Laboratoriya', icon: FlaskConical },
      { label: 'Diagnostika', icon: Activity },
    ],
  },
  {
    title: 'Xizmatlar',
    items: [
      { label: 'Forma', icon: Shirt },
      { label: 'Ishlar galereyasi', icon: Images },
      { label: 'Reyting va sharhlar', icon: Star },
      { label: 'Yordam', icon: CircleHelp },
    ],
  },
]

export default function Sidebar({ open, onClose }) {
  const session = useSession()
  const navigate = useNavigate()
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-ink/30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] overflow-y-auto border-r border-line bg-side px-2 pb-6 pt-4 transition-transform no-scrollbar
          lg:sticky lg:top-[46px] lg:z-0 lg:h-[calc(100dvh/var(--z)-46px)] lg:w-[176px] lg:shrink-0 lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button onClick={onClose} className="mb-2 ml-auto grid size-8 place-items-center rounded-lg text-muted hover:bg-white lg:hidden" aria-label="Yopish">
          <X className="size-5" />
        </button>

        <Link to="/" className="flex h-[30px] items-center gap-2.5 rounded-md border-l-2 border-brand bg-brand-50 px-2.5 text-[11.5px] font-semibold text-brand-600">
          <House className="size-4" strokeWidth={1.8} /> Bosh sahifa
        </Link>
        <Link to="/profil" onClick={onClose} className="mt-1 flex h-[30px] items-center gap-2.5 rounded-md px-2.5 text-[11.5px] font-semibold text-ink-2 hover:bg-white">
          <UserRound className="size-4" strokeWidth={1.8} /> Profil
        </Link>
        {session.status === 'authed' && (
          <button type="button" onClick={async () => { onClose?.(); await signOut(); profileStore.update({ loggedOut: true, accountLive: false }); navigate('/kirish') }} className="mt-1 flex h-[30px] w-full items-center gap-2.5 rounded-md px-2.5 text-left text-[11.5px] font-semibold text-[#d14343] hover:bg-white">
            Chiqish
          </button>
        )}

        {groups.map((g) => (
          <div key={g.title} className="mt-2.5 border-t border-line pt-3.5">
            <p className="mb-1 px-2.5 text-[11px] font-semibold text-ink">{g.title}</p>
            {g.items.map(({ label, icon: Icon, to }) => (
              <Link key={label} to={to || '#'} className="flex h-[29.5px] items-center gap-2.5 rounded-md px-2.5 text-[11.5px] text-ink-2 transition hover:bg-white hover:text-brand-600">
                <Icon className="size-4 text-[#3b4658]" strokeWidth={1.6} /> {label}
              </Link>
            ))}
          </div>
        ))}
      </aside>
    </>
  )
}
