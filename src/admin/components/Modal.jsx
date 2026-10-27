import { useEffect, useRef } from 'react'
import { X, ArrowLeft } from 'lucide-react'

export default function Modal({
  open, onClose, title, subtitle, children, width = 'max-w-[720px]', footer = null,
  full = false, sheet = false, headerIcon = null, headerExtra = null,
}) {
  const startY = useRef(0)
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, onClose])
  if (!open) return null

  const mobileSheet = sheet || full
  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-[#0B2A2E]/45 ${mobileSheet ? 'items-end md:items-center md:p-6' : 'items-center p-4 md:p-6'}`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex w-full flex-col overflow-hidden bg-white shadow-[0_24px_70px_rgb(8_40_45/0.25)]
          ${mobileSheet
            ? 'max-h-[96vh] rounded-t-[22px] md:max-h-[94vh] md:rounded-[18px]'
            : 'max-h-[94vh] rounded-[18px]'}
          ${width}`}
        onTouchStart={(e) => { startY.current = e.touches[0].clientY }}
        onTouchEnd={(e) => {
          if (!mobileSheet) return
          const dy = e.changedTouches[0].clientY - startY.current
          if (dy > 80) onClose()
        }}
      >
        {mobileSheet && (
          <div className="flex justify-center pt-2 md:hidden" aria-hidden>
            <span className="h-1.5 w-12 rounded-full bg-[#D5DEE3]" />
          </div>
        )}
        <div className="relative flex shrink-0 items-start justify-between gap-4 border-b border-[#E6EEF0] px-5 py-3.5 md:px-6 md:py-4">
          <button type="button" onClick={onClose} aria-label="Orqaga" className="absolute left-4 top-4 text-[#0F766E] md:hidden">
            <ArrowLeft className="size-6" />
          </button>
          <div className={`flex w-full items-start gap-3 ${mobileSheet ? 'pl-8 text-left md:pl-0' : 'text-center md:pr-8 md:text-left'}`}>
            {headerIcon && (
              <span className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]">
                {headerIcon}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-[20px] font-extrabold tracking-tight text-[#10283F] md:text-[22px]">{title}</h2>
              {subtitle && <p className="mt-0.5 text-[13.5px] text-[#5C6E80]">{subtitle}</p>}
              {headerExtra}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="hidden rounded-lg p-1 text-[#10283F] hover:bg-[#F0FDFA] md:block">
            <X className="size-6" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-6">{children}</div>
        {footer && <div className="shrink-0 border-t border-[#E6EEF0] px-5 py-3.5 md:px-6">{footer}</div>}
      </div>
    </div>
  )
}
