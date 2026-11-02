import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

// To‘liq ekranli rasm ko‘rgich: strelkalar, klaviatura, surish (swipe), pastda kichik rasmlar.
// #root dagi zoom ta’sir qilmasligi uchun document.body ga portal qilinadi.
export default function Lightbox({ images, index, onIndex, onClose, alt = '' }) {
  const n = images.length
  const touch = useRef(null)
  const go = (d) => onIndex((index + d + n) % n)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && n > 1) onIndex((index - 1 + n) % n)
      if (e.key === 'ArrowRight' && n > 1) onIndex((index + 1) % n)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, n, onClose, onIndex])

  useEffect(() => {
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = overflow }
  }, [])

  const btn = 'grid size-11 place-items-center rounded-full bg-black/55 text-white ring-1 ring-white/25 backdrop-blur hover:bg-black/70'
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rasmlar"
      className="fixed inset-0 z-[1000] flex flex-col"
      style={{ zIndex: 2147483000, backgroundColor: '#0b1220', height: '100dvh', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', touchAction: 'pan-y' }}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (touch.current == null || n < 2) return
        const dx = e.changedTouches[0].clientX - touch.current
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
        touch.current = null
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-[14px] font-semibold tabular-nums">{index + 1} / {n}</span>
        <button type="button" onClick={onClose} aria-label="Yopish" className={btn}><X className="size-5" /></button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
        <img src={images[index]} alt={alt} className="max-h-full max-w-full select-none object-contain" draggable={false} />
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Oldingi rasm" className={`${btn} absolute left-3 top-1/2 -translate-y-1/2`}><ChevronLeft className="size-6" /></button>
            <button type="button" onClick={() => go(1)} aria-label="Keyingi rasm" className={`${btn} absolute right-3 top-1/2 -translate-y-1/2`}><ChevronRight className="size-6" /></button>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="no-scrollbar flex justify-center gap-2 overflow-x-auto px-4 py-3">
          {images.map((src, i) => (
            <button key={`${i}-${src}`} type="button" onClick={() => onIndex(i)} aria-label={`Rasm ${i + 1}`} aria-current={i === index} className={`h-14 w-16 shrink-0 overflow-hidden rounded-lg ${i === index ? 'ring-2 ring-white' : 'opacity-60 ring-1 ring-white/20 hover:opacity-100'}`}>
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  )
}
