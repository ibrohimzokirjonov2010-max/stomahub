import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquareText, Star } from 'lucide-react'
import Lightbox from './Lightbox'
import { reviewImageList } from '../lib/reviewPhotos'
import { formatDateUz } from '../lib/dateUz'

function Stars({ value, size = 'size-3.5' }) {
  const n = Math.round(Number(value) || 0)
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${n} yulduz`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${size} ${i <= n ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-[#d6dde6]'}`} strokeWidth={1.5} />
      ))}
    </span>
  )
}


/** Bitta sharh kartasi: yulduz, matn, rasmlar (bosilsa Lightbox). */
export function ReviewCard({ review, productName, productLink }) {
  const images = reviewImageList(review?.images || review?.photos)
  const [shot, setShot] = useState(null)
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px]">
        <Stars value={review.rating} />
        <b className="text-ink">{review.author || 'Xaridor'}</b>
        <span className="text-muted">{formatDateUz(review.created_at)}</span>
      </div>
      {productLink && productName && (
        <Link to={productLink} className="mt-1 block truncate text-[12px] font-medium text-[#0b6d73]">{productName}</Link>
      )}
      {review.body && <p className="mt-1 text-[13.5px] text-ink-2">{review.body}</p>}
      {images.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setShot(i)}
              aria-label={`Sharh rasmi ${i + 1}`}
              className="size-16 overflow-hidden rounded-lg bg-[#eef3f4] ring-1 ring-line"
            >
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {review.reply && (
        <p className="mt-1.5 rounded-xl bg-[#f3f8f8] px-3 py-2 text-[12.5px] text-ink-2">
          <b>Sotuvchi javobi:</b> {review.reply}
        </p>
      )}
      {shot !== null && (
        <Lightbox images={images} index={shot} onIndex={setShot} onClose={() => setShot(null)} alt="Sharh rasmi" />
      )}
    </li>
  )
}

/** Mahsulot / sotuvchi sahifasidagi sharhlar ro‘yxati. */
export default function ReviewList({
  reviews = [],
  emptyTitle = 'Hozircha sharhlar yo‘q',
  emptyText = 'Xaridorlar buyurtmani olgandan keyin baho va sharh qoldira oladi.',
  productNameOf,
  className = '',
}) {
  if (!reviews.length) {
    return (
      <div className={`rounded-2xl border border-[#e3eef0] bg-white px-5 py-10 text-center ${className}`}>
        <MessageSquareText className="mx-auto size-9 text-[#0b6d73]/50" strokeWidth={1.5} />
        <p className="mt-2 text-[14px] font-semibold text-ink">{emptyTitle}</p>
        <p className="mt-1 text-[12.5px] text-muted">{emptyText}</p>
      </div>
    )
  }
  return (
    <ul className={`divide-y divide-[#eef3f4] ${className}`}>
      {reviews.map((r, i) => (
        <ReviewCard
          key={r.id || `${r.created_at}-${i}`}
          review={r}
          productName={productNameOf?.(r.product_id)}
          productLink={r.product_id ? `/product/${r.product_id}` : undefined}
        />
      ))}
    </ul>
  )
}
