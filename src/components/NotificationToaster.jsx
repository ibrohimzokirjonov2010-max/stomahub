import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useSession } from '../sessionStore'
import { markRead, onNewNotification, startNotifications, stopNotifications } from '../notificationsStore'
import { notifVisual } from './NotificationBell'

/** Kirgan foydalanuvchi uchun bildirishnomalar oqimini ishga tushiradi va yangi kelganini toast qiladi. */
export default function NotificationToaster() {
  const session = useSession()
  const uid = session.status === 'authed' ? session.user?.id || null : null
  const navigate = useNavigate()
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (session.status === 'loading') return undefined
    startNotifications(uid)
    return undefined
  }, [uid, session.status])
  useEffect(() => () => stopNotifications(), [])

  useEffect(() => onNewNotification((n, count) => setToast({ n, count, key: n.id })), [])
  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(t)
  }, [toast])

  if (!toast) return null
  const { n, count } = toast
  const [tone, Icon] = notifVisual(n)
  const open = () => {
    markRead([n.id])
    setToast(null)
    if (n.link) navigate(n.link)
  }
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-3 top-[max(10px,env(safe-area-inset-top))] z-[95] flex justify-center md:inset-x-auto md:right-5 md:top-16">
      <div className="pointer-events-auto flex w-full max-w-[420px] items-start gap-3 rounded-2xl bg-white p-3 pr-2 shadow-[0_14px_40px_rgb(11_31_58/0.25)] ring-1 ring-[#e6eef2] animate-[notifIn_.28s_ease-out]">
        <button type="button" onClick={open} className="flex min-w-0 flex-1 items-start gap-3 text-left">
          <span className={`grid size-10 shrink-0 place-items-center rounded-full ${tone}`}><Icon className="size-[19px]" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-bold leading-snug text-[#0d2a4a]">{n.title}</span>
            {n.body && <span className="mt-0.5 block truncate text-[13px] text-[#4b5b6b]">{n.body}</span>}
            <span className="mt-1 block text-[12px] font-semibold text-[#0b8a84]">{count > 1 ? `Yana ${count - 1} ta yangi · ` : ''}Ko‘rish</span>
          </span>
        </button>
        <button type="button" onClick={() => setToast(null)} aria-label="Yopish" className="grid size-8 shrink-0 place-items-center rounded-full text-[#6b7b8b] hover:bg-[#f2f5f9]"><X className="size-4" /></button>
      </div>
    </div>
  )
}
