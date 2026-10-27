import { useEffect } from 'react'
import { X, ArrowLeft } from 'lucide-react'

export default function Modal({ open, onClose, title, subtitle, children, width = 'max-w-[720px]', footer = null, full = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0B2A2E]/45 md:items-center md:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[94vh] w-full flex-col overflow-hidden bg-white shadow-[0_24px_70px_rgb(8_40_45/0.25)] ${full ? 'h-full rounded-none md:h-auto md:rounded-[18px]' : 'rounded-t-[22px] md:rounded-[18px]'} ${width}`}
      >
        <div className="relative flex shrink-0 items-start justify-between gap-4 border-b border-[#E6EEF0] px-5 py-4 md:px-6">
          <button type="button" onClick={onClose} aria-label="Orqaga" className="absolute left-4 top-4 text-[#0F766E] md:hidden"><ArrowLeft className="size-6" /></button>
          <div className="w-full text-center md:pr-8 md:text-left">
            <h2 className="text-[20px] font-extrabold tracking-tight text-[#10283F] md:text-[22px]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[13.5px] text-[#5C6E80]">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="hidden rounded-lg p-1 text-[#10283F] hover:bg-[#F0FDFA] md:block"><X className="size-6" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-6">{children}</div>
        {footer && <div className="shrink-0 border-t border-[#E6EEF0] px-5 py-3.5 md:px-6">{footer}</div>}
      </div>
    </div>
  )
}
