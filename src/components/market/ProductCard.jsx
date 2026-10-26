import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Star, CircleCheck } from 'lucide-react'
import { useCart } from '../../cart'
import { som } from '../../marketData'

export function SaleBadge({ badge, className = '' }) {
  if (!badge) return null
  const isNew = badge === 'Yangi'
  return (
    <span className={`rounded px-1.5 py-[3px] text-[9px] font-semibold leading-none ${isNew ? 'bg-sea-100 text-sea-600' : 'bg-sale text-white'} ${className}`}>
      {badge}
    </span>
  )
}

export function LikeButton({ className = '' }) {
  const [liked, setLiked] = useState(false)
  return (
    <button
      onClick={(e) => { e.preventDefault(); setLiked(!liked) }}
      aria-label="Sevimlilarga qo‘shish"
      className={`grid size-6 place-items-center rounded-full text-ink-2 transition hover:bg-page ${className}`}
    >
      <Heart className={`size-[15px] ${liked ? 'fill-sale text-sale' : ''}`} strokeWidth={1.7} />
    </button>
  )
}

export function Rating({ rating, reviews }) {
  return (
    <p className="flex items-center gap-1 text-[8.5px] text-muted">
      <Star className="size-[10px] fill-star text-star" />
      <span className="font-medium text-ink-2">{rating}</span> ({reviews} ta sharh)
    </p>
  )
}

export function AddButton({ product, className = '' }) {
  const { add } = useCart()
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        add(product)
        setDone(true)
        setTimeout(() => setDone(false), 900)
      }}
      aria-label="Savatga qo‘shish"
      className={`grid h-[22px] w-[46px] shrink-0 place-items-center rounded-md text-white transition ${done ? 'bg-ok' : 'bg-sea hover:bg-sea-600'} ${className}`}
    >
      <ShoppingCart className="size-3.5" strokeWidth={2} />
    </button>
  )
}

export default function ProductCard({ product }) {
  const p = product
  return (
    <Link to={`/product/${p.id}`} className="group relative flex flex-col rounded-xl bg-white p-2.5 shadow-card transition hover:shadow-md">
      <SaleBadge badge={p.badge} className="absolute left-2.5 top-2.5 z-10" />
      <LikeButton className="absolute right-1.5 top-1.5 z-10" />
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
