import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Heart, Search, ShoppingCart, Star } from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import { useCart } from '../cart'
import { catalog, clock, som, useCountdown } from '../aksiyaData'

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export default function Aksiyalar() {
  const [q, setQ] = useState('')
  const [letter, setLetter] = useState('all')
  const [sort, setSort] = useState('pop')
  const [saved, setSaved] = useState({})

  const list = useMemo(() => {
    const query = q.trim().toLowerCase()
    let rows = catalog.filter((d) => {
      const okLetter = letter === 'all' || d.name[0].toUpperCase() === letter
      const okQuery = !query || `${d.name} ${d.brand}`.toLowerCase().includes(query)
      return okLetter && okQuery
    })
    if (sort === 'off') rows = [...rows].sort((a, b) => b.off - a.off)
    if (sort === 'cheap') rows = [...rows].sort((a, b) => a.price - b.price)
    if (sort === 'rich') rows = [...rows].sort((a, b) => b.price - a.price)
    return rows
  }, [q, letter, sort])

  return (
    <ShopLayout active="aksiya" placeholder="Mahsulot, brend yoki kategoriya qidiring...">
      <div className="pb-2 pt-4">
        <h1 className="text-[22px] font-bold leading-none text-ink">Aksiyalar</h1>
        <p className="mt-1 text-[13px] text-muted">Maxsus takliflar va chegirmalar</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-line bg-white px-3">
            <Search className="size-4 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Aksiyalarda qidiring..."
              className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-muted"
            />
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-9 rounded-lg border border-line bg-white px-3 text-[12.5px] text-ink outline-none"
          >
            <option value="pop">Mashhurlik bo‘yicha</option>
            <option value="off">Chegirma bo‘yicha</option>
            <option value="cheap">Narx: arzon</option>
            <option value="rich">Narx: qimmat</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          <Letter on={letter === 'all'} onClick={() => setLetter('all')}>Barchasi</Letter>
          {letters.map((ch) => (
            <Letter key={ch} on={letter === ch} onClick={() => setLetter(ch)}>{ch}</Letter>
          ))}
        </div>

        {list.length === 0 ? (
          <p className="mt-8 text-center text-[13px] text-muted">Bu filtrda aksiya topilmadi.</p>
        ) : (
          <div className="aksiya-grid mt-3">
            {list.map((d) => (
              <Card key={d.id} deal={d} saved={!!saved[d.id]} onSave={() => setSaved((s) => ({ ...s, [d.id]: !s[d.id] }))} />
            ))}
          </div>
        )}
      </div>
    </ShopLayout>
  )
}

function Letter({ on, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`h-7 min-w-7 rounded-md px-2 text-[11.5px] font-semibold ${on ? 'bg-sea text-white' : 'bg-white text-ink-2 shadow-card'}`}
    >
      {children}
    </button>
  )
}

function Card({ deal, saved, onSave }) {
  const { add } = useCart()
  const sec = useCountdown(deal.left)
  return (
    <article className="relative flex min-w-0 flex-col rounded-xl bg-white p-2.5 shadow-card">
      <span className="absolute left-2.5 top-2.5 z-10 rounded-md bg-sea px-1.5 py-0.5 text-[11px] font-bold text-white">-{deal.off}%</span>
      <button onClick={onSave} className="absolute right-2.5 top-2.5 z-10 grid size-7 place-items-center rounded-full bg-white text-muted shadow-card" aria-label="Saqlash">
        <Heart className={`size-3.5 ${saved ? 'fill-sale text-sale' : ''}`} />
      </button>
      <Link to={`/aksiyalar/${deal.id}`} className="grid h-[128px] place-items-center overflow-hidden">
        <img src={deal.image} alt={deal.name} className="max-h-[118px] max-w-full object-contain" />
      </Link>
      <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-sea">
        <Clock className="size-3" /> {clock(sec)}
      </p>
      <Link to={`/aksiyalar/${deal.id}`} className="mt-1 truncate text-[13px] font-bold text-ink">{deal.name}</Link>
      <p className="text-[11px] text-muted">{deal.brand}</p>
      <div className="mt-1 flex items-center justify-between gap-1 text-[11px]">
        <span className="flex items-center gap-1 text-ink-2">
          <Star className="size-3 fill-[#f5b400] text-[#f5b400]" /> {deal.rating} ({deal.reviews})
        </span>
        <span className="shrink-0 text-muted">{deal.sold} sotilgan</span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold text-ink">{som(deal.price)}</p>
          <p className="text-[11px] text-muted line-through">{som(deal.oldPrice)}</p>
        </div>
        <button
          onClick={() => add({ id: deal.id, name: deal.name, type: deal.brand, price: deal.price, image: deal.image })}
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-sea text-white"
          aria-label="Savatga"
        >
          <ShoppingCart className="size-4" />
        </button>
      </div>
    </article>
  )
}
