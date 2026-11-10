import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useSession } from '../sessionStore'
import { markRead, onNewNotification, startNotifications, stopNotifications } from '../notificationsStore'
import { notifView, StatusTile } from './notifyVisual'
import { NotifText } from './NotificationBell'

const DURATION = 5000

/** Kirgan foydalanuvchi uchun bildirishnomalar oqimini ishga tushiradi va yangi kelganini "shisha" kartochka bilan ko‘rsatadi. */
export default function NotificationToaster() {
  const session = useSession()
  const uid = session.status === 'authed' ? session.user?.id || null : null
  const navigate = useNavigate()
  const [toast, setToast] = useState(null)
  const [leaving, setLeaving] = useState(false)
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const start = useRef(null)
  const paused = useRef(false)

  useEffect(() => {
    if (session.status === 'loading') return undefined
    startNotifications(uid)
    return undefined
  }, [uid, session.status])
  useEffect(() => () => stopNotifications(), [])
  useEffect(() => onNewNotification((n, count) => { setLeaving(false); setDrag({ x: 0, y: 0 }); setToast({ n, count, key: `${n.id}-${Date.now()}` }) }), [])

  const dismiss = useCallback(() => {
    setLeaving(true)
    setTimeout(() => { setToast(null); setLeaving(false); setDrag({ x: 0, y: 0 }) }, 220)
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timerRef = { current: null }
    const tick = () => {
      if (paused.current) { timerRef.current = setTimeout(tick, 600); return }
      dismiss()
    }
    timerRef.current = setTimeout(tick, DURATION)
    return () => clearTimeout(timerRef.current)
  }, [toast, dismiss])

  if (!toast) return null
  const { n, count } = toast
  const v = notifView(n)
  const open = () => {
    markRead([n.id])
    setToast(null)
    if (n.link) navigate(n.link)
  }
  // Tepaga yoki yon tomonga surib yopish
  const onDown = (e) => { e.currentTarget.setPointerCapture?.(e.pointerId); start.current = { x: e.clientX, y: e.clientY, moved: false }; paused.current = true }
  const onMove = (e) => {
    if (!start.current) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) start.current.moved = true
    setDrag(Math.abs(dx) > Math.abs(dy) ? { x: dx, y: 0 } : { x: 0, y: Math.min(0, dy) })
  }
  const onUp = () => {
    const s = start.current
    start.current = null
    paused.current = false
    if (s?.moved && (Math.abs(drag.x) > 70 || drag.y < -36)) { dismiss(); return }
    setDrag({ x: 0, y: 0 })
    if (s && !s.moved) open()
  }
  const dist = Math.max(Math.abs(drag.x), Math.abs(drag.y) * 2)

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[95] flex justify-center px-3 pt-[max(10px,env(safe-area-inset-top))] md:justify-end md:px-5 md:pt-16">
      <div
        key={toast.key}
        role="status"
        aria-live="polite"
        className={`notif-toast pointer-events-auto relative w-full max-w-[420px] touch-none select-none overflow-hidden rounded-[22px] border border-white/80 bg-white/[0.82] shadow-[0_14px_40px_rgb(11_31_58/0.22),inset_0_1px_0_rgb(255_255_255/0.9)] backdrop-blur-[24px] backdrop-saturate-[180%] [-webkit-backdrop-filter:blur(24px)_saturate(180%)] ${leaving ? 'notif-toast-out' : ''}`}
        style={dist ? { transform: `translate(${drag.x}px, ${drag.y}px)`, opacity: Math.max(0.3, 1 - dist / 220), transition: 'none' } : undefined}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => { start.current = null; paused.current = false; setDrag({ x: 0, y: 0 }) }}
        onMouseEnter={() => { paused.current = true }}
        onMouseLeave={() => { paused.current = false }}
      >
        <div className="flex items-start gap-3 p-3 pr-11">
          <StatusTile style={v.style} />
          <button type="button" onClick={(e) => { e.preventDefault() }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() } }} aria-label={`${n.title}. Ochish`} className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-[#0F766E]">
            <NotifText n={n} v={v} unread clamp="line-clamp-2" extra={<span className="mt-1 block text-[12px] font-semibold text-[#0F766E]">{count > 1 ? `Yana ${count - 1} ta yangi · ` : ''}Ochish</span>} />
          </button>
        </div>
        <button type="button" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={dismiss} aria-label="Yopish" className="absolute right-2 top-2 grid size-8 place-items-center rounded-full text-[#64748b] transition hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#0F766E]"><X className="size-4" /></button>
        <span className="notif-timer absolute inset-x-0 bottom-0 h-[3px] origin-left bg-[#0F766E]/35" style={{ animationDuration: `${DURATION}ms` }} aria-hidden="true" />
      </div>
    </div>
  )
}
