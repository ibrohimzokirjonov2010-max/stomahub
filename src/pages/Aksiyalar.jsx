import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Clock, Search, Star, Store } from 'lucide-react'
import CardQtyStepper from '../components/CardQtyStepper'
import { LikeButton } from '../components/market/ProductCard'
import ShopLayout from '../components/market/ShopLayout'
import EmptyCatalog from '../components/EmptyCatalog'
import { useCatalogVersion } from '../recordSync'
import { getCatalog, clock, som, useCountdown } from '../aksiyaData'
import { useMarket } from '../buyerApi'
import { offPercent } from '../lib/discounts'
import { leftSeconds } from '../lib/aksiya'
import { matchSearch } from '../lib/searchNorm'

export const fmtDay = (iso) => {
  if (!iso) return ''
  const [y, m, d] = String(iso).slice(0, 10).split('-')
  return `${d}.${m}.${y}`
}

// Aksiyalar = sotuvchilar o‘zi yaratgan aksiyalar (seller_promotions → catalog 'deal', muddati o‘tganlari yashiriladi)
// + aksiya/chegirma narxi qo‘llangan real Marketplace mahsulotlari. Soxta "saqlash"/reyting yo‘q.
export function useAksiyalar() {
  useCatalogVersion()
  const market = useMarket()
  const deals = getCatalog()
  return useMemo(() => {
    const live = new Set(deals.map((d) => d.id))
    const shops = deals.filter((d) => d.scope === 'all' || d.title || d.banner)
    const products = market.products
      .filter((p) => offPercent(p) > 0)
      .map((p) => ({
        id: p.id, productId: p.id, link: `/product/${p.id}`, name: p.name, brand: p.brand, image: p.image,
        price: p.price, oldPrice: p.oldPrice, off: offPercent(p), reviews: p.reviews, rating: p.rating,
        sellerId: p.sellerId, promotionTitle: p.promotionId && live.has(p.promotionId) ? p.promotionTitle : '',
        left: p.promotionId && p.endsOn ? leftSeconds(p.endsOn) : 0, product: p,
      }))
    return { shops, products, status: market.status }
  }, [deals, market.products, market.status])
}

export default function Aksiyalar() {
  const { shops, products, status } = useAksiyalar()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('off')

  const list = useMemo(() => {
    let rows = products.filter((d) => matchSearch(q, d.name, d.brand, d.promotionTitle))
    if (sort === 'off') rows = [...rows].sort((a, b) => b.off - a.off)
    if (sort === 'cheap') rows = [...rows].sort((a, b) => a.price - b.price)
    if (sort === 'rich') rows = [...rows].sort((a, b) => b.price - a.price)
    if (sort === 'soon') rows = [...rows].sort((a, b) => (a.left || 9e9) - (b.left || 9e9))
    return rows
  }, [products, q, sort])
  const shopList = useMemo(() => shops.filter((d) => matchSearch(q, d.title, d.name, d.seller?.name)), [shops, q])

  return (
    <ShopLayout active="aksiya" placeholder="Mahsulot, brend yoki kategoriya qidiring...">
      <div className="pb-[max(12px,env(safe-area-inset-bottom))] pt-4">
        <h1 className="text-[22px] font-bold leading-none text-ink">Aksiyalar</h1>
        <p className="mt-1 text-[13px] text-muted">Sotuvchilarning amaldagi aksiyalari va chegirmalari</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="flex h-10 min-w-0 flex-1 basis-[220px] items-center gap-2 rounded-lg border border-line bg-white px-3">
            <Search className="size-4 shrink-0 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Aksiyalarda qidiring..."
              className="w-full min-w-0 bg-transparent text-[16px] outline-none placeholder:text-muted sm:text-[12.5px]" />
          </label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Saralash"
            className="h-10 rounded-lg border border-line bg-white px-3 text-[13px] text-ink outline-none">
            <option value="off">Chegirma bo‘yicha</option>
            <option value="soon">Tez tugaydigan</option>
            <option value="cheap">Narx: arzon</option>
            <option value="rich">Narx: qimmat</option>
          </select>
        </div>

        {shopList.length > 0 && (
          <section className="mt-4">
            <h2 className="mb-2 text-[15px] font-bold text-ink">Do‘kon aksiyalari</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shopList.map((d) => <ShopDeal key={d.id} deal={d} />)}
            </div>
          </section>
        )}

        {!products.length && !shops.length ? (
          <div className="mt-4"><EmptyCatalog title={status === 'loading' ? 'Yuklanmoqda…' : 'Hozircha aksiyalar yo‘q'} text="Sotuvchilar aksiya e’lon qilganda ular shu yerda ko‘rinadi. Barcha mahsulotlarni Marketplace’da ko‘ring." /></div>
        ) : list.length === 0 ? (
          products.length > 0 && <p className="mt-8 text-center text-[13px] text-muted">Bu qidiruv bo‘yicha aksiya topilmadi.</p>
        ) : (
          <section className="mt-4">
            <h2 className="mb-2 text-[15px] font-bold text-ink">Chegirmadagi mahsulotlar</h2>
            <div className="aksiya-grid">
              {list.map((d) => <Card key={d.id} deal={d} />)}
            </div>
          </section>
        )}
      </div>
    </ShopLayout>
  )
}

export function ShopDeal({ deal, compact = false }) {
  const sec = useCountdown(deal.left)
  const off = Number(deal.off || deal.percent) || 0
  return (
    <Link to={`/aksiyalar/${deal.id}`} className="group flex min-w-0 flex-col overflow-hidden rounded-xl bg-white shadow-card">
      <div className={`relative ${compact ? 'h-[120px]' : 'h-[150px]'} w-full overflow-hidden bg-gradient-to-br from-sea to-[#0b5b66]`}>
        {deal.banner ? <img src={deal.banner} alt="" className="size-full object-cover" loading="lazy" />
          : <div className="grid size-full place-items-center px-4 text-center text-[20px] font-bold text-white">{deal.title || deal.name}</div>}
        {off > 0 && <span className="absolute left-2.5 top-2.5 rounded-md bg-sale px-2 py-0.5 text-[12px] font-bold text-white">-{off}%</span>}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 break-words text-[14px] font-bold text-ink group-hover:text-sea">{deal.title || deal.name}</p>
        <p className="flex min-w-0 items-center gap-1 text-[12px] text-muted"><Store className="size-3.5 shrink-0" /><span className="truncate">{deal.seller?.name || 'Sotuvchi'}</span>
          {deal.scope === 'all' ? <span className="shrink-0">· barcha mahsulotlar</span> : deal.name ? <span className="truncate">· {deal.name}</span> : null}</p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-ink-2">
          <span className="flex items-center gap-1"><CalendarDays className="size-3.5" /> {fmtDay(deal.startsOn)} – {fmtDay(deal.endsOn)}</span>
          {deal.left > 0 && <span className="flex items-center gap-1 font-semibold text-sea"><Clock className="size-3.5" /> {clock(sec)}</span>}
        </p>
      </div>
    </Link>
  )
}

function Card({ deal }) {
  const sec = useCountdown(deal.left)
  return (
    <article className="relative flex min-w-0 flex-col rounded-xl bg-white p-2.5 shadow-card">
      <span className="absolute left-2.5 top-2.5 z-10 rounded-md bg-sea px-1.5 py-0.5 text-[11px] font-bold text-white">-{deal.off}%</span>
      <LikeButton productId={deal.productId} className="absolute right-2.5 top-2.5 z-10 size-7 bg-white shadow-card" />
      <Link to={deal.link} className="grid h-[128px] place-items-center overflow-hidden">
        {deal.image ? <img src={deal.image} alt={deal.name} className="max-h-[118px] max-w-full object-contain" loading="lazy" /> : <span className="text-[12px] text-muted">Rasm yo‘q</span>}
      </Link>
      {deal.left > 0 && (
        <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-sea"><Clock className="size-3" /> {clock(sec)}</p>
      )}
      {deal.promotionTitle && <p className="truncate text-[11px] font-semibold text-sale">{deal.promotionTitle}</p>}
      <Link to={deal.link} className="mt-1 truncate text-[13px] font-bold text-ink">{deal.name}</Link>
      <p className="truncate text-[11px] text-muted">{deal.brand}</p>
      {Number(deal.reviews) > 0 && (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-2"><Star className="size-3 fill-[#f5b400] text-[#f5b400]" /> {deal.rating} ({deal.reviews})</p>
      )}
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold text-ink">{som(deal.price)}</p>
          <p className="text-[11px] text-muted line-through">{deal.oldPrice > deal.price ? som(deal.oldPrice) : ''}</p>
        </div>
        <CardQtyStepper product={deal.product} />
      </div>
    </article>
  )
}
