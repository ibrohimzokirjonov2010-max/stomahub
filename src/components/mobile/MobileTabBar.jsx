import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Presentation, ShoppingBag, Shirt } from 'lucide-react'
import { NavIcons, SectionIcons } from '../tealIcons'
import { useCart } from '../../cart'
import { TAB_MATCH, isTabActive } from './tabbarMatch'

const TEAL = '#0F766E'

const TABS = [
  { to: '/', label: 'Bosh sahifa', icon: NavIcons.home, match: TAB_MATCH.home },
  { to: '/seminarlar', label: 'Seminarlar', icon: Presentation, match: TAB_MATCH.seminarlar },
  { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag, match: TAB_MATCH.marketplace, badge: 'cart' },
  { to: '/forma', label: 'Forma', icon: SectionIcons.forma, match: TAB_MATCH.forma },
  { to: '/profil', label: 'Profil', icon: NavIcons.profil, match: TAB_MATCH.profil },
]

const spring = 'left 420ms cubic-bezier(0.32, 0.72, 0, 1), width 420ms cubic-bezier(0.32, 0.72, 0, 1), opacity 220ms ease'

export default function MobileTabBar() {
  const { pathname } = useLocation()
  const { count } = useCart()
  const listRef = useRef(null)
  const itemRefs = useRef([])
  const activeIdx = useMemo(() => TABS.findIndex(({ match }) => isTabActive(pathname, match)), [pathname])
  const [blob, setBlob] = useState({ left: 0, width: 0, ready: false })

  useEffect(() => {
    const measure = () => {
      const root = listRef.current
      const el = itemRefs.current[activeIdx]
      if (!root || !el || activeIdx < 0) {
        setBlob((b) => ({ ...b, ready: false, width: 0 }))
        return
      }
      const rr = root.getBoundingClientRect()
      const er = el.getBoundingClientRect()
      // Pill ichida biroz qisqaroq "suv" — icon+label atrofida
      const pad = 6
      setBlob({ left: er.left - rr.left + pad, width: Math.max(44, er.width - pad * 2), ready: true })
    }
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (listRef.current && ro) ro.observe(listRef.current)
    window.addEventListener('resize', measure)
    return () => { ro?.disconnect(); window.removeEventListener('resize', measure) }
  }, [activeIdx, pathname])

  return (
    <nav
      aria-label="Asosiy menyu"
      className="app-tabbar liquid-tabbar pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden"
    >
      <div className="pointer-events-auto mx-3.5 overflow-hidden rounded-[28px] border border-white/70 bg-white/55 shadow-[0_8px_32px_rgb(11_31_58/0.14),inset_0_1px_0_rgb(255_255_255/0.75)] backdrop-blur-[22px] backdrop-saturate-[180%] [-webkit-backdrop-filter:blur(22px)_saturate(180%)]">
        <ul ref={listRef} className="relative grid h-[var(--bottom-nav-h)] grid-cols-5 px-1">
          <span
            aria-hidden="true"
            className="liquid-tabbar-blob pointer-events-none absolute top-1.5 bottom-1.5 rounded-[22px] bg-[#0F766E]/14 shadow-[inset_0_1px_0_rgb(255_255_255/0.55),0_1px_8px_rgb(15_118_110/0.12)]"
            style={{
              left: blob.left,
              width: blob.width,
              opacity: blob.ready ? 1 : 0,
              transition: spring,
            }}
          />
          {TABS.map(({ to, label, icon: Icon, match, badge }, i) => {
            const active = isTabActive(pathname, match)
            const showCart = badge === 'cart' && count > 0
            return (
              <li key={to} ref={(n) => { itemRefs.current[i] = n }} className="relative z-[1] min-w-0">
                <Link
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className="relative flex h-full flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors duration-200"
                  style={{ color: active ? TEAL : '#64748B' }}
                >
                  <span className="relative grid place-items-center">
                    {Icon.raster ? (
                      <Icon className={`size-[22px] transition duration-200 ${active ? 'opacity-100' : 'opacity-60 grayscale-[30%]'}`} />
                    ) : (
                      <Icon
                        className="size-[21px] transition duration-200"
                        strokeWidth={active ? 2.25 : 1.7}
                        fill={active ? 'currentColor' : 'none'}
                        fillOpacity={active && to !== '/' ? 0.16 : 1}
                      />
                    )}
                    {showCart && (
                      <span className="absolute -right-2.5 -top-1.5 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-[#0F766E] px-1 text-[9px] font-bold leading-none text-white shadow-[0_1px_3px_rgb(15_118_110/0.35)]">
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </span>
                  <span className={`truncate ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
