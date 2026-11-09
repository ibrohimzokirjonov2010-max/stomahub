import { offPercent } from '../../lib/discounts'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Star, CircleCheck } from 'lucide-react'
import { isOwnProduct } from '../../cart'
import CardQtyStepper from '../CardQtyStepper'
import { som } from '../../marketData'
import { flushProfile, profileStore, useProfile } from '../../profileStore'

export function SaleBadge({ badge, className = '' }) {
  if (!badge) return null
  const isNew = badge === 'Yangi'
  return (
    <span className={`rounded px-1.5 py-[3px] text-[9px] font-semibold leading-none ${isNew ? 'bg-sea-100 text-sea-600' : 'bg-sale text-white'} ${className}`}>
      {badge}
    </span>
  )
}

export function LikeButton({ className = '', productId = '', favKey = 'favProducts' }) {
  const profile = useProfile()
  const list = profile[favKey] || []
  const [local, setLocal] = useState(false)
  const liked = productId ? list.map(String).includes(String(productId)) : local
  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (productId) {
          profileStore.toggleFav(favKey, productId)
          flushProfile().catch(() => {})
        } else {
          setLocal(!local)
        }
      }}
      aria-label="Sevimlilarga qo‘shish"
      aria-pressed={liked}
      className={`grid size-6 place-items-center rounded-full text-ink-2 transition hover:bg-page ${className}`}
    >
      <Heart className={`size-[15px] ${liked ? 'fill-sale text-sale' : ''}`} strokeWidth={1.7} />
    </button>
  )
}

export function Rating({ rating, reviews }) {
  if (!Number(rating) || !Number(reviews)) return <p className="text-[8.5px] text-muted">Hali baho yo‘q</p>
  return (
    <p className="flex items-center gap-1 text-[8.5px] text-muted">
      <Star className="size-[10px] fill-star text-star" />
      <span className="font-medium text-ink-2">{rating}</span> ({reviews} ta sharh)
    </p>
  )
}

export function AddButton({ product, className = '' }) {
  if (isOwnProduct(product)) return <span title="Sizning mahsulotingiz" className={`shrink-0 rounded-md bg-[#eef4f4] px-1.5 py-1 text-[9px] font-semibold leading-none text-sea ${className}`}>Sizning mahsulotingiz</span>
  return <CardQtyStepper product={product} className={className} />
}

export default function ProductCard({ product }) {
  const p = product
  return (
    <Link to={`/product/${p.id}`} className="group relative flex flex-col rounded-xl bg-white p-2.5 shadow-card transition hover:shadow-md">
      <SaleBadge badge={p.badge} className="absolute left-2.5 top-2.5 z-10" />
      <LikeButton productId={product.id} className="absolute right-1.5 top-1.5 z-10" />
      {!p.badge && offPercent(p) > 0 && <span className="absolute left-2 top-2 z-10 rounded-md bg-sale px-1.5 py-0.5 text-[9px] font-bold text-white">-{offPercent(p)}%</span>}
      <div className="mt-3 h-[66px] overflow-hidden">
        <img src={p.image} alt={p.name} className="mx-auto h-full object-contain transition group-hover:scale-105" />
      </div>
      <h3 className="mt-2.5 truncate text-[10px] font-bold text-ink">{p.name}</h3>
      <p className="truncate text-[9.5px] text-ink-2">{p.type}</p>
      <p className="text-[8.5px] text-muted">{p.brand}</p>
      <div className="mt-0.5"><Rating rating={p.rating} reviews={p.reviews} /></div>
      <p className="mt-0.5 flex items-center gap-1 text-[8.5px] text-ok">
        <CircleCheck className="size-[10px]" /> Omborda bor
      </p>
      <div className="mt-auto flex items-end justify-between pt-1.5">
        <div className="leading-tight">
          {p.oldPrice && <p className="text-[8.5px] text-muted line-through">{som(p.oldPrice)}</p>}
          <p className={`whitespace-nowrap text-[11.5px] font-bold ${p.oldPrice ? 'text-sale' : 'text-sea-600'}`}>{som(p.price)}</p>
        </div>
        <AddButton product={p} />
      </div>
    </Link>
  )
}
