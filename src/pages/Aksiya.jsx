import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDays, ChevronRight, Store, Timer } from 'lucide-react'
import ProductCard from '../components/market/ProductCard'
import { useCatalogVersion } from '../recordSync'
import { clock, getDeal, others, useCountdown } from '../aksiyaData'
import { useMarket } from '../buyerApi'
import { leftSeconds } from '../lib/aksiya'
import { fmtDay, ShopDeal } from './Aksiyalar'

// Aksiya sahifasi: banner, nom, sotuvchi, muddat va shu aksiyadagi REAL mahsulotlar (narx aksiya bilan).
// Soxta yetkazish/reyting/«buyurtma qabul» oqimlari olib tashlandi — xarid mahsulot sahifasi va savat orqali.
export default function Aksiya() {
  useCatalogVersion()
  const { id } = useParams()
  const deal = getDeal(id)
  const market = useMarket()
  const sec = useCountdown(deal?.endsOn ? leftSeconds(deal.endsOn) : 0)
  const items = useMemo(() => {
    if (!deal) return []
    return market.products.filter((p) => String(p.sellerId) === String(deal.sellerId)
      && (deal.scope === 'all' ? true : String(p.id) === String(deal.productId)))
  }, [deal, market.products])

  if (!deal) {
    return (
      <div className="pb-4 pt-6 text-center">
        <p className="text-[15px] font-bold text-ink">Aksiya topilmadi yoki muddati tugagan</p>
        <Link to="/aksiyalar" className="mt-3 inline-flex h-10 items-center rounded-xl bg-sea px-4 text-[13px] font-semibold text-white">Barcha aksiyalar</Link>
      </div>
    )
  }
  const off = Number(deal.off || deal.percent) || 0
  const more = others(deal.id)
  const title = deal.title || deal.name

  return (
    <div className="catalog-frame pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
      <p className="mb-3 flex min-w-0 flex-wrap items-center gap-1 text-[12px] text-muted">
        <Link to="/" className="hover:text-sea">Bosh sahifa</Link>
        <ChevronRight className="size-3" />
        <Link to="/aksiyalar" className="hover:text-sea">Aksiyalar</Link>
        <ChevronRight className="size-3" />
        <span className="min-w-0 truncate text-ink-2">{title}</span>
      </p>

      <section className="overflow-hidden rounded-2xl bg-white shadow-card">
        <div className="relative h-[170px] w-full bg-gradient-to-br from-sea to-[#0b5b66] sm:h-[240px]">
          {deal.banner ? <img src={deal.banner} alt="" className="size-full object-cover" />
            : <div className="grid size-full place-items-center px-6 text-center text-[24px] font-bold text-white sm:text-[30px]">{title}</div>}
          {off > 0 && <span className="absolute left-3 top-3 rounded-lg bg-sale px-2.5 py-1 text-[14px] font-bold text-white">-{off}%</span>}
        </div>
        <div className="flex flex-col gap-2 p-4">
          <span className="w-fit rounded-md bg-sea-50 px-2 py-0.5 text-[11px] font-semibold text-sea">{deal.scope === 'all' ? 'Do‘kondagi barcha mahsulotlarga' : 'Mahsulot aksiyasi'}</span>
          <h1 className="break-words text-[20px] font-bold leading-tight text-ink sm:text-[24px]">{title}</h1>
          <Link to={`/dokon/${deal.sellerId}`} className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-sea">
            <Store className="size-4" /> {deal.seller?.name || 'Sotuvchi'} <ChevronRight className="size-3.5" />
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="flex items-center gap-1.5 text-ink-2"><CalendarDays className="size-4 text-sea" /> {fmtDay(deal.startsOn)} – {fmtDay(deal.endsOn)}</span>
            {sec > 0 && <span className="flex items-center gap-1.5 rounded-lg bg-sea-50 px-2.5 py-1 font-semibold text-sea"><Timer className="size-4" /> Tugashiga: {clock(sec)}</span>}
          </div>
        </div>
      </section>

      <section className="mt-4">
        <h2 className="mb-2 text-[16px] font-bold text-ink">Aksiyadagi mahsulotlar</h2>
        {market.status === 'loading' && !items.length ? <p className="text-[13px] text-muted">Yuklanmoqda…</p>
          : !items.length ? <p className="rounded-xl bg-white p-4 text-[13px] text-muted shadow-card">Hozircha bu aksiyada sotuvdagi mahsulot yo‘q.</p>
          : <div className="aksiya-grid">{items.map((p) => <ProductCard key={p.id} product={p} />)}</div>}
      </section>

      {more.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-[16px] font-bold text-ink">Boshqa aksiyalar</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{more.map((d) => <ShopDeal key={d.id} deal={d} compact />)}</div>
        </section>
      )}
    </div>
  )
}
