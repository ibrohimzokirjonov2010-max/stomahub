import { useEffect } from 'react'
import { X } from 'lucide-react'

/* Centered dialog on desktop, bottom sheet on mobile. */
export default function Modal({ open, onClose, title, subtitle, children, width = 'max-w-[600px]', sheetOnMobile = true }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className={`fixed inset-0 z-50 flex ${sheetOnMobile ? 'items-end md:items-center' : 'items-center'} justify-center bg-[#0B2A2E]/45 md:p-6`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className={`max-h-[92vh] w-full overflow-y-auto bg-white shadow-[0_24px_70px_rgb(8_40_45/0.25)] ${sheetOnMobile ? 'rounded-t-[26px] md:rounded-[18px]' : 'mx-4 rounded-[18px]'} ${width}`}>
        {sheetOnMobile && <div className="mx-auto mt-2.5 h-1 w-11 rounded-full bg-[#D5DEE0] md:hidden" />}
        <div className="flex items-start justify-between gap-4 px-5 pt-4 md:px-6 md:pt-5">
          <div>
            <h2 className="text-[22px] font-extrabold tracking-tight text-[#10283F]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[14px] text-[#5C6E80]">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="hidden rounded-lg p-1 text-[#10283F] hover:bg-[#F0FDFA] md:block"><X className="size-6" /></button>
        </div>
        <div className="px-5 pb-5 pt-4 md:px-6 md:pb-6">{children}</div>
      </div>
    </div>
  )
}
