import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import ShopSidebar, { activeKeyFor } from '../market/ShopSidebar'

// Barcha mobil sahifalar uchun yagona (accordion) menyu.
export default function MobileNavDrawer({ open, onClose }) {
  const { pathname } = useLocation()
  const first = useRef(pathname)
  useEffect(() => {
    if (first.current !== pathname) onClose()
    first.current = pathname
  }, [pathname, onClose])
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="relative z-[100]" role="dialog" aria-modal="true" aria-label="Menyu">
      <ShopSidebar active={activeKeyFor(pathname)} open onClose={onClose} />
    </div>,
    document.body,
  )
}
