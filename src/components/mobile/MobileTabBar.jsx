import { Link, useLocation } from 'react-router-dom'
import { Presentation, ShoppingBag, Shirt } from 'lucide-react'
import { NavIcons } from '../tealIcons'

const TABS = [
  { to: '/', label: 'Bosh sahifa', icon: NavIcons.home, match: ['/', '/ishlar', '/ustalar'] },
  { to: '/seminarlar', label: 'Seminarlar', icon: Presentation, match: ['/seminarlar'] },
  { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag, match: ['/marketplace', '/product', '/ortiqcha', '/jihozlar', '/kategoriyalar', '/brendlar', '/kitoblar', '/sertifikatlar', '/mutaxassislar', '/elonlar', '/buyurtma'] },
  { to: '/forma', label: 'Forma', icon: Shirt, match: ['/forma'] },
  { to: '/profil', label: 'Profil', icon: NavIcons.profil, match: ['/profil', '/klinika', '/community', '/bemorlar', '/uchrashuvlar', '/tolovlar', '/ombor'] },
]

const isActive = (pathname, match) => match.some((m) => (m === '/' ? pathname === '/' : pathname === m || pathname.startsWith(`${m}/`)))

export default function MobileTabBar() {
  const { pathname } = useLocation()
  return (
    <nav className="app-tabbar fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[max(env(safe-area-inset-bottom,0px),var(--safe-bottom-sim))] backdrop-blur md:hidden">
      <ul className="grid h-[var(--bottom-nav-h)] grid-cols-5">
        {TABS.map(({ to, label, icon: Icon, match }) => {
          const active = isActive(pathname, match)
          return (
            <li key={to}>
              <Link to={to} aria-current={active ? 'page' : undefined} className={`relative flex h-full flex-col items-center justify-center gap-1 text-[10.5px] ${active ? 'font-semibold text-sea' : 'text-muted'}`}>
                {Icon.raster ? (
                  <>
                    {active && <span aria-hidden="true" className="absolute top-0 h-[3px] w-7 rounded-b-full bg-sea" />}
                    <Icon className={`size-[24px] transition ${active ? 'opacity-100' : 'opacity-55 grayscale-[35%]'}`} />
                  </>
                ) : <Icon className="size-[22px]" strokeWidth={active ? 2.2 : 1.7} fill={active ? 'currentColor' : 'none'} fillOpacity={active && to !== '/' ? 0.18 : 1} />}
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
