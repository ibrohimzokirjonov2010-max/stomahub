import { useRef, useState } from 'react'
import { ChevronLeft, Heart, Share2 } from 'lucide-react'
import Lightbox from './Lightbox'

// Mahsulot detali (marketplace, forma, ortiqcha): kvadrat, eniga to‘liq, object-contain.
// Orqaga / yurak / ulashish tugmalari rasm ustida; bosish to‘liq ekran ochadi.
export default function DetailHero({
  images,
  index,
  onIndex,
  alt,
  bg = 'bg-white',
  onBack,
  liked = false,
  onLike,
  likeLabel = 'Sevimlilarga',
  onShare,
  testId,
}) {
  const list = images?.length ? images : []
  const n = list.length
  const shot = n ? ((index % n) + n) % n : 0
  const [zoom, setZoom] = useState(false)
  const touch = useRef(null)
  const swiped = useRef(false)

  const go = (delta) => {
    if (n < 2) return
    onIndex((shot + delta + n) % n)
  }

  return (
    <>
      <div
        data-testid={testId}
        className={`relative w-full overflow-hidden pt-[var(--safe-top)] ${bg}`}
        onTouchStart={(e) => { touch.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (touch.current == null) return
          const dx = e.changedTouches[0].clientX - touch.current
          touch.current = null
          if (n > 1 && Math.abs(dx) > 40) {
            swiped.current = true
            go(dx < 0 ? 1 : -1)
          }
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (swiped.current) { swiped.current = false; return }
            if (list[shot]) setZoom(true)
          }}
          aria-label="Rasmni kattalashtirish"
          className="relative block aspect-square w-full"
        >
          {list[shot]
            ? <img src={list[shot]} alt={alt} className="size-full object-contain p-1" />
            : <span className="block size-full" />}
        </button>
        {n > 1 && (
          <span className="pointer-events-none absolute bottom-3 right-3.5 rounded-full bg-black/55 px-2 py-0.5 text-[11.5px] font-semibold text-white">
            {shot + 1} / {n}
          </span>
        )}
        <button type="button" onClick={onBack} aria-label="Orqaga" className="safe-overlay-top absolute left-3.5 grid size-10 place-items-center rounded-xl bg-white/95 text-ink shadow-[0_2px_8px_rgb(11_31_58/0.12)]">
          <ChevronLeft className="size-5" />
        </button>
        <div className="safe-overlay-top absolute right-3.5 flex gap-2">
          <button type="button" onClick={onLike} aria-label={likeLabel} aria-pressed={liked} className="grid size-10 place-items-center rounded-xl bg-white/95 text-ink shadow-[0_2px_8px_rgb(11_31_58/0.12)]">
            <Heart className={`size-5 ${liked ? 'fill-sale text-sale' : ''}`} />
          </button>
          <button type="button" onClick={onShare} aria-label="Ulashish" className="grid size-10 place-items-center rounded-xl bg-white/95 text-ink shadow-[0_2px_8px_rgb(11_31_58/0.12)]">
            <Share2 className="size-[18px]" />
          </button>
        </div>
      </div>
      {zoom && list.length > 0 && (
        <Lightbox images={list} index={shot} onIndex={onIndex} onClose={() => setZoom(false)} alt={alt} />
      )}
    </>
  )
}
