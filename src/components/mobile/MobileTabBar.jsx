import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Presentation, ShoppingBag } from 'lucide-react'
import { NavIcons, SectionIcons } from '../tealIcons'
import { useCart } from '../../cart'
import { cartBadge } from '../../lib/toastModel'
import { TAB_MATCH, isTabActive } from './tabbarMatch'

const TEAL = '#0F766E'

const TABS = [
  { to: '/', label: 'Bosh sahifa', icon: NavIcons.home, match: TAB_MATCH.home },
  { to: '/seminarlar', label: 'Seminarlar', icon: Presentation, match: TAB_MATCH.seminarlar },
  { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag, match: TAB_MATCH.marketplace, badge: 'cart' },
  { to: '/forma', label: 'Forma', icon: SectionIcons.forma, match: TAB_MATCH.forma },
  { to: '/profil', label: 'Profil', icon: NavIcons.profil, match: TAB_MATCH.profil },
]

const spring =
  'transform 420ms cubic-bezier(0.32, 0.72, 0, 1), width 420ms cubic-bezier(0.32, 0.72, 0, 1), opacity 220ms ease'

export default function MobileTabBar() {
  const { pathname } = useLocation()
  const { count } = useCart()
  const listRef = useRef(null)
  const itemRefs = useRef([])
  const labelRefs = useRef([])
  const activeIdx = useMemo(() => TABS.findIndex(({ match }) => isTabActive(pathname, match)), [pathname])
  const [blob, setBlob] = useState({ x: 0, width: 0, ready: false })

  useEffect(() => {
    const measure = () => {
      const root = listRef.current
      const el = itemRefs.current[activeIdx]
      const labelEl = labelRefs.current[activeIdx]
      if (!root || !el || activeIdx < 0) {
        setBlob((b) => ({ ...b, ready: false, width: 0 }))
        return
      }
      const rr = root.getBoundingClientRect()
      const er = el.getBoundingClientRect()
      // Label content width (no truncate) + icon; blob wraps both with pad
      const labelW = labelEl ? Math.ceil(labelEl.scrollWidth) : 0
      const iconEl = el.querySelector('[data-tab-icon]')
      const iconW = iconEl ? Math.ceil(iconEl.getBoundingClientRect().width) : 22
      const contentW = Math.max(labelW, iconW)
      // Comfortable horizontal pad; shrink slightly on very narrow cells
      const cellW = er.width
      const padX = cellW < 64 ? 6 : 8
      let width = contentW + padX * 2
      // Prefer fitting label fully; at 360 may nearly touch pill edge
      const edge = 2
      const maxW = rr.width - edge * 2
      width = Math.min(Math.max(width, 48), maxW)
      // Center under the tab cell, then clamp into pill
      let x = er.left - rr.left + (cellW - width) / 2
      x = Math.max(edge, Math.min(x, rr.width - edge - width))
      setBlob({ x, width, ready: true })
    }
    measure()
    // Re-measure after fonts/layout settle
    const t = requestAnimationFrame(measure)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (listRef.current && ro) ro.observe(listRef.current)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(t)
      ro?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [activeIdx, pathname])

  return (
    <nav
      aria-label="Asosiy menyu"
      className="app-tabbar liquid-tabbar pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden"
    >
      <div className="liquid-tabbar-pill relative pointer-events-auto mx-3.5 overflow-hidden rounded-[28px] border border-white/80 bg-white/[0.76] shadow-[0_8px_28px_rgb(11_31_58/0.16),inset_0_1px_0_rgb(255_255_255/0.92),inset_0_-0.5px_0_rgb(255_255_255/0.35)] backdrop-blur-[24px] backdrop-saturate-[180%] [-webkit-backdrop-filter:blur(24px)_saturate(180%)]">
        <ul ref={listRef} className="relative grid h-[var(--bottom-nav-h)] grid-cols-5 px-0.5">
          <span
            aria-hidden="true"
            className="liquid-tabbar-blob pointer-events-none absolute top-1.5 bottom-1.5 left-0 rounded-[20px] bg-[#0F766E]/14 shadow-[inset_0_1px_0_rgb(255_255_255/0.55),0_1px_8px_rgb(15_118_110/0.12)]"
            style={{
              width: blob.width,
              transform: `translateX(${blob.x}px)`,
              opacity: blob.ready ? 1 : 0,
              transition: spring,
              willChange: 'transform, width',
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
                  className="relative flex h-full w-full flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] font-medium leading-tight tracking-[-0.03em] transition-colors duration-200"
                  style={{ color: active ? TEAL : '#64748B' }}
                >
                  <span data-tab-icon className="relative grid place-items-center">
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
                        {cartBadge(count)}
                      </span>
                    )}
                  </span>
                  <span
                    ref={(n) => { labelRefs.current[i] = n }}
                    className={`whitespace-nowrap ${active ? 'font-semibold' : 'font-medium'}`}
                  >
                    {label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
