import { useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export default function Lightbox({ open, items = [], index = 0, onClose, onIndex }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onIndex?.(Math.max(0, index - 1))
      if (e.key === 'ArrowRight') onIndex?.(Math.min(items.length - 1, index + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, index, items.length, onClose, onIndex])
  if (!open || !items.length) return null
  const cur = items[index] || items[0]
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <button type="button" aria-label="Yopish" onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X className="size-6" /></button>
      {items.length > 1 && (
        <>
          <button type="button" aria-label="Oldingi" disabled={index <= 0} onClick={() => onIndex?.(index - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white disabled:opacity-30"><ChevronLeft className="size-7" /></button>
          <button type="button" aria-label="Keyingi" disabled={index >= items.length - 1} onClick={() => onIndex?.(index + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white disabled:opacity-30"><ChevronRight className="size-7" /></button>
        </>
      )}
      <div className="max-h-[90vh] max-w-3xl text-center">
        {cur.url ? (
          <img src={cur.url} alt={cur.label || ''} className="max-h-[80vh] w-auto rounded-xl object-contain" />
        ) : (
          <div className="grid h-64 w-80 place-items-center rounded-xl bg-white/10 text-white">{cur.label || 'Hujjat'}</div>
        )}
        {cur.label && <p className="mt-3 text-[15px] font-semibold text-white">{cur.label}</p>}
      </div>
    </div>
  )
}
