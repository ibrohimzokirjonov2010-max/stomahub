import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BadgeCheck, CalendarDays, ChevronLeft, MapPin, Package, Search, Star, Store } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { isUuid, useMarket } from '../buyerApi'
import { som } from '../marketData'

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
const since = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-yil ${MONTHS[d.getMonth()]}dan` }
const SORTS = [['new', 'Eng yangi'], ['cheap', 'Arzonroq'], ['rich', 'Qimmatroq']]

// Sotuvchining ochiq profili. 0036 RPC bo‘lmasa ham mahsulotlar ro‘yxati orqali ishlaydi.
function useSellerInfo(id) {
  const [state, setState] = useState({ status: 'loading', info: null })
  useEffect(() => {
    let off = false
    if (!supabase || !isUuid(id)) { setState({ status: 'ready', info: null }); return undefined }
    supabase.rpc('seller_public_profile', { p_id: id }).then(({ data, error }) => {
      if (!off) setState({ status: 'ready', info: error ? null : data })
    })
    return () => { off = true }
  }, [id])
  return state
}

function Stars({ value, size = 'size-3.5' }) {
  return (
    <span className="inline-flex" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`${size} ${i <= Math.round(value) ? 'fill-[#f5a524] text-[#f5a524]' : 'text-[#d5dde2]'}`} />)}
    </span>
  )
}

export default function SellerPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const market = useMarket()
  const { status: infoStatus, info } = useSellerInfo(id)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [sort, setSort] = useState('new')

  const products = useMemo(() => market.products.filter((p) => p.sellerId === id), [market.products, id])
  const cats = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))], [products])
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    const r = products.filter((p) => (!cat || p.category === cat) && (!t || `${p.name} ${p.brand}`.toLowerCase().includes(t)))
    if (sort === 'cheap') return [...r].sort((a, b) => a.price - b.price)
    if (sort === 'rich') return [...r].sort((a, b) => b.price - a.price)
    return r
  }, [products, q, cat, sort])

  const loading = market.status !== 'ready' && market.status !== 'error' && !products.length
  const name = info?.shop_name || products[0]?.seller || 'Sotuvchi'
  const notFound = !loading && infoStatus === 'ready' && !info && !products.length
  const reviews = info?.reviews || []
  const rating = Number(info?.rating) || 0

  return (
    <div className="mx-auto w-full max-w-[1120px] px-3.5 pb-[120px] pt-[calc(var(--safe-top,0px)+12px)] lg:px-0 lg:pb-10 lg:pt-3">
      <button type="button" onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/marketplace'))} className="mb-3 flex h-10 items-center gap-1 rounded-xl pr-3 text-[13.5px] font-semibold text-[#0b6d73]">
        <ChevronLeft className="size-5" /> Orqaga
      </button>

      {notFound ? (
        <div className="rounded-2xl border border-line bg-white px-5 py-12 text-center">
          <Store className="mx-auto size-10 text-[#0b6d73]/60" strokeWidth={1.5} />
          <p className="mt-3 text-[15px] font-semibold text-ink">Sotuvchi topilmadi</p>
          <p className="mt-1 text-[13px] text-muted">Do‘kon yopilgan yoki hali tasdiqlanmagan bo‘lishi mumkin.</p>
          <Link to="/marketplace" className="mt-4 inline-flex h-11 items-center rounded-xl bg-[#0b6d73] px-5 text-[14px] font-semibold text-white">Marketplace’ga o‘tish</Link>
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-line bg-white p-4 lg:p-6">
            <div className="flex items-start gap-3.5 lg:gap-5">
              <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#e3f4f1] text-[22px] font-extrabold text-[#0b6d73] lg:size-20">
                {info?.avatar_url ? <img src={info.avatar_url} alt="" className="size-full object-cover" /> : name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="flex items-center gap-1.5 text-[20px] font-bold leading-tight text-ink lg:text-[24px]">
                  <span className="truncate">{name}</span> <BadgeCheck className="size-5 shrink-0 fill-[#1a73e8] text-white" aria-label="Tasdiqlangan sotuvchi" />
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-2">
                  {info?.reviews_count > 0 && <span className="flex items-center gap-1"><Stars value={rating} /> <b className="text-ink">{rating.toFixed(1)}</b> ({info.reviews_count} ta baho)</span>}
                  {info?.city && <span className="flex items-center gap-1"><MapPin className="size-3.5" />{info.city}</span>}
                  {info?.since && <span className="flex items-center gap-1"><CalendarDays className="size-3.5" />StomaHub’da {since(info.since)}</span>}
                  <span className="flex items-center gap-1"><Package className="size-3.5" />{products.length} ta mahsulot</span>
                </div>
                {info?.description && <p className="mt-3 max-w-[720px] text-[13.5px] leading-relaxed text-ink-2">{info.description}</p>}
              </div>
            </div>
          </section>

          <section className="mt-4">
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
              <h2 className="text-[16px] font-bold text-ink lg:mr-auto">Mahsulotlar</h2>
              <label className="flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-3 lg:w-[300px]">
                <Search className="size-4 text-muted" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Do‘kondan qidirish" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" />
              </label>
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Saralash" className="h-11 rounded-xl border border-line bg-white px-3 text-[13.5px] lg:w-[160px]">
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
            {loading && <p className="py-10 text-center text-[13px] text-muted">Yuklanmoqda…</p>}
            {!loading && !list.length && <p className="py-10 text-center text-[13px] text-muted">{products.length ? 'Hech narsa topilmadi' : 'Hozircha sotuvda mahsulot yo‘q'}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
              {list.map((p) => (
                <Link key={p.id} to={`/product/${p.id}`} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-card">
                  <span className="aspect-square bg-[#f3f6f9]"><img src={p.image} alt="" loading="lazy" className="size-full object-cover" /></span>
                  <span className="flex flex-1 flex-col p-2.5">
                    <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink">{p.name}</span>
                    <span className="mt-0.5 truncate text-[11.5px] text-muted">{p.category}</span>
                    <span className="mt-auto pt-1.5 text-[14px] font-bold text-[#0b6d73]">{som(p.price)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {reviews.length > 0 && (
            <section className="mt-5 rounded-2xl border border-line bg-white p-4 lg:p-6">
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
        </>
      )}
    </div>
  )
}
