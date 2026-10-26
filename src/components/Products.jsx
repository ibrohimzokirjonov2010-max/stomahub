import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingCart } from 'lucide-react'
import Section from './Section'
import { products } from '../data'

export default function Products() {
  return (
    <Section title="Mashhur mahsulotlar">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {products.map((p) => <ProductCard key={p.name} {...p} />)}
      </div>
    </Section>
  )
}

function ProductCard({ name, price, image }) {
  const [liked, setLiked] = useState(false)
  return (
    <Link to="/product/optibond-solo-plus" className="group relative block rounded-lg bg-white p-2 shadow-card transition hover:shadow-md">
      <button
        onClick={(e) => { e.preventDefault(); setLiked(!liked) }}
        aria-label="Sevimlilarga qo‘shish"
        className="absolute right-2 top-2 z-10 grid size-6 place-items-center rounded-full text-ink-2 hover:bg-page"
      >
        <Heart className={`size-[15px] ${liked ? 'fill-danger text-danger' : ''}`} />
      </button>
      <div className="h-[76px] overflow-hidden">
        <img src={image} alt={name} className="mx-auto h-full object-contain transition group-hover:scale-105" />
      </div>
      <h3 className="mt-2 truncate text-[9.5px] font-medium text-ink">{name}</h3>
      <div className="mt-2 flex items-center justify-between">
        <p className="whitespace-nowrap text-[11.5px] font-bold text-ink">{price} so‘m</p>
        <button aria-label="Savatga qo‘shish" className="grid size-[22px] place-items-center rounded bg-brand text-white transition hover:bg-brand-600">
          <ShoppingCart className="size-3.5" />
        </button>
      </div>
    </Link>
  )
}
