import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, BellOff, CheckCheck, ChevronRight, LogIn, X } from 'lucide-react'
import { useNotifications, markRead, onNewNotification } from '../notificationsStore'
import { useProfile } from '../profileStore'
import { useSession } from '../sessionStore'
import { badgeText, countUnread, groupByDay, isUnread, timeAgo } from '../lib/notifyModel'
import { notifView, StatusPill, StatusTile } from './notifyVisual'

const DESKTOP = '(min-width: 768px)'
const isDesktop = () => typeof window !== 'undefined' && window.matchMedia?.(DESKTOP).matches

/**
 * Bildirishnoma qo‘ng‘irog‘i: o‘qilmaganlar soni (99+), yangi kelganda yumshoq "puls",
 * bosilganda mobil — pastdan chiqadigan varaq (bottom sheet), desktop — ochiladigan panel.
 */
export default function NotificationBell({ className = 'relative grid size-10 place-items-center rounded-full text-ink', iconClass = 'size-[21px]', badgeClass = '', strokeWidth }) {
  const [open, setOpen] = useState(false)
  const [pulse, setPulse] = useState(false)
  const btn = useRef(null)
  const { items } = useNotifications()
  const profile = useProfile()
  const unread = countUnread(items, profile.readNotifs || [])

  useEffect(() => onNewNotification(() => {
    setPulse(false)
    requestAnimationFrame(() => setPulse(true))
  }), [])
  useEffect(() => {
    if (!pulse) return undefined
    const t = setTimeout(() => setPulse(false), 2400)
    return () => clearTimeout(t)
  }, [pulse])

  const close = useCallback(() => {
    setOpen(false)
    requestAnimationFrame(() => btn.current?.focus())
  }, [])

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={unread ? `Bildirishnomalar, ${unread} ta o‘qilmagan` : 'Bildirishnomalar'}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={className}
      >
        <Bell className={`${iconClass} ${pulse ? 'notif-ring' : ''}`} strokeWidth={strokeWidth} />
        {unread > 0 && (
          <span className={`notif-badge absolute right-0 top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-[#e5323d] px-[4px] text-[10px] font-bold leading-none tabular-nums text-white shadow-[0_1px_3px_rgb(229_50_61/0.4)] ring-2 ring-white ${pulse ? 'notif-pulse' : ''} ${badgeClass}`} aria-hidden="true">
            {badgeText(unread)}
          </span>
        )}
      </button>
      {open && <NotificationPanel anchor={btn} onClose={close} />}
    </>
  )
}

function useAnchorPos(anchor, desktop) {
  const [pos, setPos] = useState(null)
  useLayoutEffect(() => {
    if (!desktop || !anchor?.current) return undefined
    const place = () => {
      const r = anchor.current.getBoundingClientRect()
      setPos({ top: Math.round(r.bottom + 10), right: Math.max(12, Math.round(window.innerWidth - r.right - 8)) })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [anchor, desktop])
  return pos
}

export function NotificationPanel({ onClose, anchor }) {
  const { items, loaded, uid } = useNotifications()
  const profile = useProfile()
  const session = useSession()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const localRead = profile.readNotifs || []
  const unreadIds = items.filter((n) => isUnread(n, localRead)).map((n) => n.id)
  const ref = useRef(null)
  const guest = session.status === 'anon' && !uid
  const [desktop] = useState(isDesktop)
  const pos = useAnchorPos(anchor, desktop)
  const groups = groupByDay(items)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
      if (e.key === 'Tab' && ref.current) {
        // Fokus panel ichida aylanadi
        const f = ref.current.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    ref.current?.focus()
    let restore = ''
    if (!desktop) { restore = document.body.style.overflow; document.body.style.overflow = 'hidden' }
    return () => {
      window.removeEventListener('keydown', onKey)
      if (!desktop) document.body.style.overflow = restore
    }
  }, [onClose, desktop])

  const openItem = (n) => {
    markRead([n.id])
    onClose()
    if (n.link) navigate(n.link)
  }

  const body = guest ? (
    <EmptyState
      icon={Bell}
      title="Hisobingizga kiring"
      text="Buyurtmangiz holati haqidagi bildirishnomalar shu yerda ko‘rinadi."
      action={<button type="button" onClick={() => { onClose(); navigate(`/kirish?next=${encodeURIComponent(pathname)}`) }} className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl bg-[#0F766E] px-5 text-[14px] font-semibold text-white shadow-[0_6px_16px_rgb(15_118_110/0.28)] active:scale-[0.98]"><LogIn className="size-[18px]" /> Kirish</button>}
    />
  ) : !loaded ? (
    <Skeleton />
  ) : !items.length ? (
    <EmptyState icon={BellOff} title="Hozircha bildirishnoma yo‘q" text="Buyurtmangiz holati o‘zgarganda shu yerda darhol paydo bo‘ladi." />
  ) : (
    <div className="pb-2">
      {groups.map((g) => (
        <section key={g.key} aria-labelledby={`notif-g-${g.key}`}>
          <h3 id={`notif-g-${g.key}`} className="sticky top-0 z-[1] bg-white/95 px-5 pb-1.5 pt-3.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8] backdrop-blur">{g.label}</h3>
          <ul className="space-y-1 px-2.5">
            {g.items.map((n) => <NotifRow key={n.id} n={n} unread={isUnread(n, localRead)} onOpen={openItem} />)}
          </ul>
        </section>
      ))}
    </div>
  )

  const header = (
    <header className="shrink-0 border-b border-[#eef2f6] px-5 pb-3 pt-1 md:pt-4">
      <div className="flex items-center gap-2">
        <h2 id="notif-title" className="flex-1 text-[18px] font-bold tracking-[-0.01em] text-[#0b1f3a]">Bildirishnomalar</h2>
        {unreadIds.length > 0 && <span className="rounded-full bg-[#e4f6f8] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-[#087683]">{unreadIds.length} ta yangi</span>}
        <button type="button" onClick={onClose} aria-label="Yopish" className="-mr-1.5 grid size-9 place-items-center rounded-full text-[#64748b] transition hover:bg-[#f1f5f9] focus-visible:outline-2 focus-visible:outline-[#0F766E]"><X className="size-[19px]" /></button>
      </div>
      {unreadIds.length > 0 && (
        <button type="button" onClick={() => markRead(unreadIds)} className="mt-1 inline-flex items-center gap-1.5 rounded-lg py-1 text-[13px] font-semibold text-[#0F766E] transition hover:text-[#0b5e58] focus-visible:outline-2 focus-visible:outline-[#0F766E]">
          <CheckCheck className="size-4" /> Hammasini o‘qilgan deb belgilash
        </button>
      )}
    </header>
  )

  const footer = !guest && items.length > 0 && (
    <button type="button" onClick={() => { onClose(); navigate('/profil/buyurtmalar') }} className="flex shrink-0 items-center justify-center gap-1 border-t border-[#eef2f6] py-3 text-[13.5px] font-semibold text-[#0F766E] transition hover:bg-[#f7fafa]">
      Buyurtmalarim <ChevronRight className="size-4" />
    </button>
  )

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <button type="button" tabIndex={-1} aria-label="Yopish" onClick={onClose} className="notif-fade absolute inset-0 bg-[#0b1f3a]/35 backdrop-blur-[2px] md:bg-transparent md:backdrop-blur-none" />
      {desktop ? (
        <section
          ref={ref}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="notif-title"
          style={pos ? { top: pos.top, right: pos.right } : { top: 60, right: 20 }}
          className="notif-drop absolute flex max-h-[min(620px,calc(100vh-90px))] w-[392px] flex-col overflow-hidden rounded-[20px] border border-[#e7ecf3] bg-white shadow-[0_24px_60px_rgb(11_31_58/0.18),0_2px_6px_rgb(11_31_58/0.06)] outline-none"
        >
          {header}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{body}</div>
          {footer}
        </section>
      ) : (
        <section
          ref={ref}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="notif-title"
          className="notif-sheet absolute inset-x-0 bottom-0 flex max-h-[calc(100dvh-max(28px,env(safe-area-inset-top))-12px)] min-h-[46dvh] flex-col overflow-hidden rounded-t-[28px] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_rgb(11_31_58/0.18)] outline-none"
        >
          <div className="flex shrink-0 justify-center pb-2 pt-2.5" aria-hidden="true"><span className="h-[5px] w-10 rounded-full bg-[#d7dee7]" /></div>
          {header}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{body}</div>
          {footer}
        </section>
      )}
    </div>,
    document.body,
  )
}

function NotifRow({ n, unread, onOpen }) {
  const v = notifView(n)
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(n)}
        aria-label={`${n.title}${n.body ? `. ${n.body}` : ''}. ${timeAgo(n.created_at)}${unread ? '. O‘qilmagan' : ''}`}
        className={`group relative flex w-full items-start gap-3 rounded-2xl px-2.5 py-3 text-left transition active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[#0F766E] ${unread ? 'bg-[#f0f9f8] hover:bg-[#e6f5f3]' : 'hover:bg-[#f6f8fb]'}`}
      >
        <StatusTile style={v.style} />
        <NotifText n={n} v={v} unread={unread} />
        {unread && <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-[#0F766E] shadow-[0_0_0_3px_rgb(15_118_110/0.14)]" aria-hidden="true" />}
      </button>
    </li>
  )
}

/** Matn bloki: [holat belgisi · vaqt] → sarlavha → qisqa matn. Holatsiz xabarda vaqt pastda. */
export function NotifText({ n, v, unread = false, extra = null, clamp = 'line-clamp-2' }) {
  const time = timeAgo(n.created_at)
  return (
    <span className="min-w-0 flex-1">
      {v.label && v.style.pill ? (
        <span className="mb-1 flex items-center gap-2">
          <StatusPill view={v} />
          <span className="truncate text-[12px] text-[#94a3b8]">{time}</span>
        </span>
      ) : null}
      <span className={`block truncate text-[14.5px] leading-snug text-[#0b1f3a] ${unread ? 'font-bold' : 'font-semibold'}`}>{v.head}</span>
      {n.body && <span className={`mt-0.5 block text-[13px] leading-[1.4] text-[#516074] ${clamp}`}>{n.body}</span>}
      {!(v.label && v.style.pill) && <span className="mt-1 block text-[12px] text-[#94a3b8]">{time}</span>}
      {extra}
    </span>
  )
}

function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-8 pb-10 pt-9 text-center">
      <span className="relative grid size-[76px] place-items-center rounded-[26px] bg-gradient-to-b from-[#e4f6f8] to-[#f3fbfb] ring-1 ring-inset ring-[#cdeef2]">
        <Icon className="size-8 text-[#0F766E]" strokeWidth={1.8} />
      </span>
      <p className="mt-4 text-[16px] font-bold text-[#0b1f3a]">{title}</p>
      <p className="mt-1.5 max-w-[260px] text-[13.5px] leading-[1.45] text-[#64748b]">{text}</p>
      {action}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="px-5 pt-4" role="status" aria-label="Yuklanmoqda">
      <div className="mb-3 h-3 w-14 rounded-full bg-[#eef2f6]" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 py-3 motion-safe:animate-pulse">
          <div className="size-11 shrink-0 rounded-[14px] bg-[#eef2f6]" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3.5 w-3/4 rounded-full bg-[#eef2f6]" />
            <div className="h-3 w-full rounded-full bg-[#f2f5f9]" />
            <div className="h-2.5 w-20 rounded-full bg-[#f2f5f9]" />
          </div>
        </div>
      ))}
    </div>
  )
}
