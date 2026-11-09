import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, BellOff, Box, CircleCheck, CircleX, Info, Package, Truck, X } from 'lucide-react'
import { useNotifications, markRead } from '../notificationsStore'
import { useProfile } from '../profileStore'
import { useSession } from '../sessionStore'
import { badgeText, countUnread, isUnread, statusOfTitle, timeAgo } from '../lib/notifyModel'

const TONE = {
  tasdiqlandi: ['bg-[#e6f4f3] text-[#0b6d73]', CircleCheck],
  tayyorlanmoqda: ['bg-[#fff4e0] text-[#b45309]', Box],
  yetkazilmoqda: ['bg-[#e8f0ff] text-[#2453c9]', Truck],
  yetkazildi: ['bg-[#e7f7ec] text-[#15803d]', CircleCheck],
  bekor_qilindi: ['bg-[#fdecef] text-[#be123c]', CircleX],
}

export function notifVisual(n) {
  const s = n?.kind === 'order' ? statusOfTitle(n.title) : ''
  if (TONE[s]) return TONE[s]
  if (n?.kind === 'order') return ['bg-[#e6f4f3] text-[#0b6d73]', Package]
  return ['bg-[#eef2f6] text-[#4b5b6b]', Info]
}

/**
 * Haqiqiy bildirishnoma qo‘ng‘irog‘i: o‘qilmaganlar soni + ro‘yxat paneli.
 * `className` — tugma ko‘rinishi (har bir sarlavha o‘z uslubini beradi), `iconClass` — ikonka o‘lchami.
 */
export default function NotificationBell({ className = 'relative grid size-10 place-items-center rounded-full text-ink', iconClass = 'size-[21px]', badgeClass = '', strokeWidth }) {
  const [open, setOpen] = useState(false)
  const { items } = useNotifications()
  const profile = useProfile()
  const unread = countUnread(items, profile.readNotifs || [])
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={unread ? `Bildirishnomalar, ${unread} ta yangi` : 'Bildirishnomalar'} aria-haspopup="dialog" className={className}>
        <Bell className={iconClass} strokeWidth={strokeWidth} />
        {unread > 0 && (
          <span className={`absolute right-0.5 top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-[#e11d48] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white ${badgeClass}`}>
            {badgeText(unread)}
          </span>
        )}
      </button>
      {open && <NotificationPanel onClose={() => setOpen(false)} />}
    </>
  )
}

export function NotificationPanel({ onClose }) {
  const { items, loaded, uid } = useNotifications()
  const profile = useProfile()
  const session = useSession()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const localRead = profile.readNotifs || []
  const unreadIds = items.filter((n) => isUnread(n, localRead)).map((n) => n.id)
  const ref = useRef(null)
  const guest = session.status === 'anon' && !uid

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const openItem = (n) => {
    markRead([n.id])
    onClose()
    if (n.link) navigate(n.link)
  }

  return createPortal(
    <div className="fixed inset-0 z-[90]" role="presentation">
      <button type="button" aria-label="Yopish" onClick={onClose} className="absolute inset-0 bg-[#0b1f3a]/25 md:bg-transparent" />
      <section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-label="Bildirishnomalar"
        className="absolute inset-x-3 top-[max(12px,env(safe-area-inset-top))] flex max-h-[min(78vh,620px)] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_18px_50px_rgb(11_31_58/0.22)] outline-none md:left-auto md:right-5 md:top-14 md:w-[380px]"
      >
        <header className="flex items-center gap-2 border-b border-[#eef2f6] px-4 py-3">
          <h2 className="flex-1 text-[16px] font-bold text-[#0d2a4a]">Bildirishnomalar</h2>
          {unreadIds.length > 0 && (
            <button type="button" onClick={() => markRead(unreadIds)} className="rounded-lg px-2 py-1 text-[12.5px] font-semibold text-[#0b8a84] hover:bg-[#e6f4f3]">
              Barchasini o‘qildi
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center rounded-full text-[#4b5b6b] hover:bg-[#f2f5f9]">
            <X className="size-[18px]" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {guest ? (
            <div className="px-6 py-10 text-center">
              <Bell className="mx-auto size-9 text-[#9fb3c3]" />
              <p className="mt-3 text-[14px] text-[#4b5b6b]">Buyurtmangiz holati haqida xabar olish uchun hisobga kiring.</p>
              <button type="button" onClick={() => { onClose(); navigate(`/kirish?next=${encodeURIComponent(pathname)}`) }} className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#0b8a84] px-5 text-[14px] font-semibold text-white">Kirish</button>
            </div>
          ) : !loaded ? (
            <p className="px-6 py-10 text-center text-[14px] text-[#6b7b8b]">Yuklanmoqda…</p>
          ) : !items.length ? (
            <div className="px-6 py-10 text-center">
              <BellOff className="mx-auto size-9 text-[#9fb3c3]" />
              <p className="mt-3 text-[14px] text-[#4b5b6b]">Hozircha bildirishnoma yo‘q.</p>
              <p className="mt-1 text-[12.5px] text-[#7b8b9b]">Buyurtmangiz holati o‘zgarsa, shu yerda darhol ko‘rinadi.</p>
            </div>
          ) : (
            <ul>
              {items.map((n) => {
                const [tone, Icon] = notifVisual(n)
                const fresh = isUnread(n, localRead)
                return (
                  <li key={n.id}>
                    <button type="button" onClick={() => openItem(n)} className={`flex w-full items-start gap-3 border-b border-[#f2f5f9] px-4 py-3 text-left transition hover:bg-[#f7fafb] ${fresh ? 'bg-[#f3fbfa]' : ''}`}>
                      <span className={`grid size-10 shrink-0 place-items-center rounded-full ${tone}`}><Icon className="size-[19px]" /></span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[14px] leading-snug text-[#0d2a4a] ${fresh ? 'font-bold' : 'font-semibold'}`}>{n.title}</span>
                        {n.body && <span className="mt-0.5 block text-[13px] leading-snug text-[#4b5b6b]">{n.body}</span>}
                        <span className="mt-1 block text-[11.5px] text-[#8a99a8]">{timeAgo(n.created_at)}</span>
                      </span>
                      {fresh && <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-[#0b8a84]" aria-label="Yangi" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </div>,
    document.body,
  )
}
