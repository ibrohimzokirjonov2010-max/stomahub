import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, CalendarDays, Clock, MapPin, Package, Phone, Search, Star } from 'lucide-react'
import { MapPreview, parseGeo } from '../components/MapPicker'
import { som } from '../marketData'
import { pickFeatured } from './lib'

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
const since = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-yil ${MONTHS[d.getMonth()]}dan` }
const SORTS = [['new', 'Eng yangi'], ['cheap', 'Arzonroq'], ['rich', 'Qimmatroq']]

function Stars({ value, size = 'size-3.5' }) {
  return (
    <span className="inline-flex" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`${size} ${i <= Math.round(value) ? 'fill-[#f5a524] text-[#f5a524]' : 'text-[#d5dde2]'}`} />)}
    </span>
  )
}

const Card = ({ p }) => (
  <Link to={`/product/${p.id}`} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-card">
    <span className="aspect-square bg-white"><img src={p.image} alt="" loading="lazy" className="size-full object-contain p-2.5" /></span>
    <span className="flex flex-1 flex-col p-2.5">
      <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink">{p.name}</span>
      <span className="mt-0.5 truncate text-[11.5px] text-muted">{p.category}</span>
      <span className="mt-auto pt-1.5 text-[14px] font-bold text-[#0b6d73]">{som(p.price)}</span>
    </span>
  </Link>
)

// The buyer-facing shop body. Used by /dokon/:id AND the Sozlamalar live preview, so preview == real page.
// Responsive via container queries (@container on the wrapper), so it also renders correctly inside a narrow preview frame.
export default function SellerProfileView({ info, products, loading = false, infoLoading = false }) {
  const sk = (w) => <span aria-hidden="true" className={`inline-block h-[1em] ${w} animate-pulse rounded bg-[#e8eef2] align-middle`} />
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [sort, setSort] = useState('new')
  const cats = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))], [products])
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    const r = products.filter((p) => (!cat || p.category === cat) && (!t || `${p.name} ${p.brand}`.toLowerCase().includes(t)))
    if (sort === 'cheap') return [...r].sort((a, b) => a.price - b.price)
    if (sort === 'rich') return [...r].sort((a, b) => b.price - a.price)
    return r
  }, [products, q, cat, sort])
  const featured = useMemo(() => pickFeatured(info?.featured_ids, products), [info?.featured_ids, products])
  const name = info?.shop_name || products[0]?.seller || 'Sotuvchi'
  const reviews = info?.reviews || []
  const rating = Number(info?.rating) || 0
  return (
    <div className="@container">
          <section className="overflow-hidden rounded-2xl border border-line bg-white">
            {info?.cover_url && <img src={info.cover_url} alt="" className="h-28 w-full object-cover @4xl:h-44" />}
            <div className="p-4 @4xl:p-6">
            <div className="flex items-start gap-3.5 @4xl:gap-5">
              <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#e3f4f1] text-[22px] font-extrabold text-[#0b6d73] @4xl:size-20">
                {info?.avatar_url ? <img src={info.avatar_url} alt="" className="size-full object-cover" /> : name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="flex items-center gap-1.5 text-[20px] font-bold leading-tight text-ink @4xl:text-[24px]">
                  <span className="truncate">{infoLoading && !products.length ? sk('w-40') : name}</span> <BadgeCheck className="size-5 shrink-0 fill-[#1a73e8] text-white" aria-label="Tasdiqlangan sotuvchi" />
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-2">
                  {info?.reviews_count > 0 && <span className="flex items-center gap-1"><Stars value={rating} /> <b className="text-ink">{rating.toFixed(1)}</b> ({info.reviews_count} ta baho)</span>}
                  {info?.city && <span className="flex items-center gap-1"><MapPin className="size-3.5" />{info.city}</span>}
                  {info?.since && <span className="flex items-center gap-1"><CalendarDays className="size-3.5" />StomaHub’da {since(info.since)}</span>}
                  <span className="flex items-center gap-1"><Package className="size-3.5" />{loading ? sk('w-16') : `${products.length} ta mahsulot`}</span>
                </div>
                {info?.description && <p className="mt-3 max-w-[720px] text-[13.5px] leading-relaxed text-ink-2">{info.description}</p>}
                {(info?.work_hours || info?.phone) && <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-2">
                  {info?.work_hours && <span className="flex items-center gap-1"><Clock className="size-3.5" />{[info.work_days, info.work_hours].filter(Boolean).join(', ')}</span>}
                  {info?.phone && <a href={`tel:${info.phone}`} className="flex items-center gap-1 font-semibold text-[#0b6d73]"><Phone className="size-3.5" />{info.phone}</a>}
                </div>}
              </div>
            </div>
            {info?.address && parseGeo(info.address).text && <div className="mt-3 border-t border-line pt-3">
              <p className="flex items-center gap-1 text-[13px] text-ink-2"><MapPin className="size-4" />{parseGeo(info.address).text}</p>
              {parseGeo(info.address).lat != null && <div className="mt-2"><MapPreview lat={parseGeo(info.address).lat} lng={parseGeo(info.address).lng} /></div>}
            </div>}
            </div>
          </section>

          {featured.length > 0 && (
            <section className="mt-4" aria-label="Tavsiya etamiz">
              <h2 className="text-[16px] font-bold text-ink">Tavsiya etamiz</h2>
              <div className="mt-3 grid grid-cols-2 gap-2.5 @xl:grid-cols-4 @4xl:gap-4">{featured.map((p) => <Card key={p.id} p={p} />)}</div>
            </section>
          )}
          <section className="mt-4">
            <div className="flex flex-col gap-2.5 @4xl:flex-row @4xl:items-center">
              <h2 className="text-[16px] font-bold text-ink @4xl:mr-auto">Mahsulotlar</h2>
              <label className="flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-3 @4xl:w-[300px]">
                <Search className="size-4 text-muted" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Do‘kondan qidirish" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" />
              </label>
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Saralash" className="h-11 rounded-xl border border-line bg-white px-3 text-[13.5px] @4xl:w-[160px]">
                {SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            {cats.length > 1 && (
              <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto">
                {[['', 'Barchasi'], ...cats.map((c) => [c, c])].map(([k, l]) => (
                  <button key={k || 'all'} type="button" aria-pressed={cat === k} onClick={() => setCat(k)} className={`h-9 shrink-0 rounded-full px-3.5 text-[12.5px] font-semibold ${cat === k ? 'bg-[#0b6d73] text-white' : 'border border-line bg-white text-ink-2'}`}>{l}</button>
                ))}
              </div>
            )}
            {loading && <div className="grid grid-cols-2 gap-3 py-2 sm:grid-cols-3 lg:grid-cols-4" aria-label="Yuklanmoqda">{Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-[#eef3f6]" />)}</div>}
            {!loading && !list.length && <p className="py-10 text-center text-[13px] text-muted">{products.length ? 'Hech narsa topilmadi' : 'Hozircha sotuvda mahsulot yo‘q'}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2.5 @xl:grid-cols-3 @4xl:grid-cols-4 @4xl:gap-4">
              {list.map((p) => <Card key={p.id} p={p} />)}
            </div>
          </section>

          {reviews.length > 0 && (
            <section className="mt-5 rounded-2xl border border-line bg-white p-4 @4xl:p-6">
              <h2 className="text-[16px] font-bold text-ink">Xaridorlar baholari</h2>
              <ul className="mt-2 divide-y divide-[#eef2f4]">
                {reviews.map((r, i) => (
                  <li key={`${r.created_at}-${i}`} className="py-3">
                    <div className="flex items-center gap-2 text-[12.5px]"><Stars value={r.rating} /> <b className="text-ink">{r.author}</b> <span className="text-muted">{new Date(r.created_at).toLocaleDateString('uz-UZ')}</span></div>
                    {r.body && <p className="mt-1 text-[13.5px] text-ink-2">{r.body}</p>}
                    {r.reply && <p className="mt-1.5 rounded-xl bg-[#f3f8f8] px-3 py-2 text-[12.5px] text-ink-2"><b>Sotuvchi javobi:</b> {r.reply}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
    </div>
  )
}
