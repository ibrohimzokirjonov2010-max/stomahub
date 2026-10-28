import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Star, BadgeCheck, PackageOpen, CalendarDays, Barcode, Boxes, MapPinned, Truck, FileText,
  ShoppingCart, RefreshCw, MapPin, Package, ArrowRight, CircleCheck,
} from 'lucide-react'
import { marketProducts, productById, similarTo, som } from '../marketData'
import { useMarket } from '../buyerApi'
import { useCart } from '../cart'
import { QtyStepper } from '../components/market/CartPanel'
import { SaleBadge, LikeButton, Rating, AddButton } from '../components/market/ProductCard'
import { ToothIcon } from '../components/icons'

export default function Product() {
  const { id } = useParams()
  const market = useMarket()
  const p = productById(id)
  if (!p) {
    return (
      <div className="grid min-h-[320px] place-items-center text-center">
        <div>
          <p className="text-[14px] font-semibold text-ink">{market.status === 'loading' || market.status === 'idle' ? 'Mahsulot yuklanmoqda…' : market.status === 'error' ? market.error : 'Mahsulot topilmadi yoki sotuvdan olingan'}</p>
          <Link to="/marketplace" className="mt-3 inline-flex text-[13px] font-semibold text-sea">Marketplace’ga qaytish</Link>
        </div>
      </div>
    )
  }
  return <ProductBody key={p.id} p={p} />
}

function ProductBody({ p }) {
  const id = p.id
  const similarProducts = similarTo(p)
  const [img, setImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState(0)
  const { add } = useCart()
  const navigate = useNavigate()
  const n = p.images.length

  useEffect(() => { setImg(0); setQty(1); setTab(0) }, [id])

  const facts = [
    { icon: PackageOpen, label: 'Holati', value: 'Yangi (yopiq)' },
    { icon: Boxes, label: 'Miqdor', value: p.stock > 0 ? `Omborda ${p.stock}` : 'Tugagan', ok: p.stock > 0 },
    { icon: MapPinned, label: 'Sotuvchi', value: p.seller || '—' },
    { icon: Truck, label: 'To‘lov', value: 'Naqd, yetkazishda' },
  ]
  const tabs = ['Tavsif', 'Klinik qo‘llanish', 'Texnik xususiyatlar', 'Sertifikat', 'Yetkazib berish', 'Qayta buyurtma']

  return (
    <div className="pb-6 pt-2.5 lg:pl-1.5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_278px] xl:gap-x-4">
      <div className="min-w-0">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
        {['Marketplace', p.category || 'Mahsulot'].map((c) => (
          <span key={c} className="flex items-center gap-1.5">
            <Link to="/marketplace" className="hover:text-sea">{c}</Link> <ChevronRight className="size-3" />
          </span>
        ))}
        <span className="font-medium text-ink">{p.name}</span>
      </nav>

      <div className="mt-2.5 grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:gap-x-6">
        {/* Galereya */}
        <div>
          <div className="relative aspect-[380/244] overflow-hidden rounded-xl bg-[#eef3f8]">
            <img src={p.images[img]} alt={p.name} className="size-full object-cover" />
            {n > 1 && <GalleryArrow side="left" onClick={() => setImg((img - 1 + n) % n)} />}
            {n > 1 && <GalleryArrow side="right" onClick={() => setImg((img + 1) % n)} />}
          </div>
          <div className={`mt-2.5 grid grid-cols-5 gap-2 ${p.thumbs.length > 1 ? '' : 'hidden'}`}>
            {p.thumbs.map((t, i) => (
              <button
                key={t}
                onClick={() => setImg(i)}
                className={`aspect-[70/55] overflow-hidden rounded-lg bg-white ${i === img ? 'ring-2 ring-sea' : 'ring-1 ring-line hover:ring-sea/50'}`}
              >
                <img src={t} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Ma'lumot */}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="text-[12.5px] text-ink-2">{p.brand}</span>
          </div>
          <h1 className="mt-1 text-[25px] font-extrabold leading-tight tracking-tight text-ink">{p.name}</h1>
          <p className="text-[15px] text-muted">{p.type}</p>
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-ink-2">
            {p.brand || p.category}
          </div>
          <p className="mt-2.5 text-[9.5px] leading-[1.6] text-ink-2">{p.short}</p>

          <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-3.5 rounded-xl bg-white p-3 shadow-card sm:grid-cols-3">
            {facts.map(({ icon: Icon, label, value, ok }) => (
              <div key={label} className="flex gap-2">
                <Icon className="mt-0.5 size-[17px] shrink-0 text-ink-2" strokeWidth={1.5} />
                <div className="leading-tight">
                  <p className="whitespace-nowrap text-[8.5px] text-muted">{label}</p>
                  <p className={`mt-1 whitespace-nowrap text-[10px] font-medium ${ok ? 'text-ok' : 'text-ink'}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(Array.isArray(p.documents) ? p.documents : []).filter((d) => d?.url).map((d) => [d.name || 'Hujjat', d.size || '', d.url]).map(([t, s, url]) => (
              <div key={t} className="flex items-center gap-2.5 rounded-xl bg-white p-3 shadow-card">
                <FileText className="size-[22px] shrink-0 text-sale" strokeWidth={1.5} />
                <div className="flex-1 leading-tight">
                  <p className="whitespace-nowrap text-[10px] font-medium text-ink">{t}</p>
                  <p className="mt-0.5 text-[8.5px] text-muted">{s}</p>
                </div>
                <a href={url} target="_blank" rel="noreferrer" className="rounded-md bg-sea-50 px-2 py-1 text-[9px] font-semibold text-sea-600 hover:bg-sea-100">Yuklash</a>
              </div>
            ))}
          </div>
        </div>

      </div>
      </div>

        {/* Xarid bloki */}
        <aside className="h-fit rounded-xl bg-white p-3.5 shadow-card xl:mt-1">
          <div className="flex items-start justify-between">
            <div>
              <SaleBadge badge={p.badge} className="-ml-1 rounded-sm" />
              <p className="mt-1 text-[23px] font-extrabold leading-none tracking-tight text-ink">{som(p.price)}</p>
              {p.oldPrice > p.price && (
                <p className="mt-2 flex gap-3 text-[9.5px]">
                  <span className="text-muted line-through">{som(p.oldPrice)}</span>
                  <span className="font-medium text-sea">Tejaysiz: {som(p.oldPrice - p.price)}</span>
                </p>
              )}
            </div>
            <LikeButton className="size-7 bg-[#f3f6fa]" />
          </div>

          <div className="mt-3 flex items-center gap-4">
            <QtyStepper value={qty} onChange={(q) => setQty(Math.max(1, Math.min(p.stock || 1, q)))} size="lg" />
            <span className="text-[10px] text-muted">{p.stock} dona mavjud</span>
          </div>

          <button
            disabled={p.stock < 1} onClick={() => add({ ...p, image: p.thumbs[0] }, Math.min(qty, p.stock))}
            className="mt-2.5 flex h-[33px] w-full items-center justify-center gap-2.5 rounded-lg bg-sea text-[11.5px] font-semibold text-white transition hover:bg-sea-600"
          >
            <ShoppingCart className="size-4" /> Savatga qo‘shish
          </button>
          <button disabled={p.stock < 1} onClick={() => { add({ ...p, image: p.thumbs[0] }, Math.min(qty, p.stock)); navigate('/buyurtma', { state: { from: 'market' } }) }} className="mt-2 h-[32px] w-full rounded-lg border border-sea-100 bg-sea-50 text-[11px] font-semibold text-sea-600 transition hover:bg-sea-100">
            Hozir xarid qilish
          </button>

          <div className="mt-3 flex gap-3 border-t border-line pt-3">
            <div className="grid size-[48px] shrink-0 place-items-center rounded-full bg-white shadow-card ring-1 ring-line">
              <div className="text-center leading-none text-sea">
                <ToothIcon className="mx-auto size-[18px]" strokeWidth={2} />
                <p className="mt-0.5 text-[7px] font-bold text-ink">StomaHub</p>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-[10.5px] font-bold text-ink">
                {p.seller || 'Sotuvchi'} <BadgeCheck className="size-3.5 fill-[#1a73e8] text-white" />
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[9px] text-ink-2">
                <Package className="size-[10px]" /> {marketCount(p.sellerId)} ta mahsulot sotuvda
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Tablar */}
      <div className="mt-4 flex gap-1 overflow-x-auto no-scrollbar xl:-mt-3">
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`relative shrink-0 rounded-t-lg px-3.5 pb-1.5 pt-1 text-[10.5px] transition ${
              i === tab ? 'bg-sea-50 font-semibold text-ink after:absolute after:inset-x-1.5 after:bottom-0 after:h-[2px] after:rounded-full after:bg-sea' : 'text-ink-2 hover:text-sea'
            } ${i === 0 ? 'ml-2' : 'sm:ml-5'}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="grid gap-5 rounded-xl bg-white p-3.5 shadow-card lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.85fr)_240px]">
        {tab === 0 ? (
          <>
            <div>
              <p className="text-[10px] leading-[1.6] text-ink-2">{p.description}</p>
              <ul className="mt-2 space-y-1.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[9.5px] text-ink">
                    <CircleCheck className="size-[13px] fill-[#3d8fe0] text-white" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-[9.5px] font-bold text-ink">Asosiy xususiyatlar</p>
              <dl>
                {p.specs.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-2 border-b border-line/70 py-[3px] text-[8.5px] last:border-0">
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <img src="/images/market/tooth.jpg" alt="" className="hidden h-[128px] w-full rounded-lg object-cover lg:block" />
          </>
        ) : (
          <p className="py-8 text-center text-[10.5px] text-muted lg:col-span-3">Sotuvchi bu bo‘lim uchun ma’lumot qo‘shmagan</p>
        )}
      </div>

      {/* O'xshash mahsulotlar */}
      <div className="mb-2 mt-4 flex items-center justify-between">
        <h2 className="text-[13px] font-bold text-ink">O‘xshash mahsulotlar</h2>
        <Link to="/marketplace" className="flex items-center gap-1.5 text-[9px] font-medium text-sea hover:underline">
          Barchasini ko‘rish <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {similarProducts.map((s) => (
          <div key={s.id} className="relative flex gap-2 rounded-xl bg-white p-2.5 shadow-card">
            <SaleBadge badge={s.badge} className="absolute left-2 top-2 z-10" />
            <img src={s.image} alt={s.name} className="h-[88px] w-[38%] shrink-0 object-contain" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <p className="truncate text-[10px] font-bold text-ink">{s.name}</p>
                <LikeButton className="-mr-1 -mt-1" />
              </div>
              <p className="text-[9.5px] text-ink-2">{s.type}</p>
              <p className="text-[8.5px] text-muted">{s.brand}</p>
              
              <div className="mt-1 flex items-end justify-between">
                <div className="leading-tight">
                  {s.oldPrice && <p className="text-[8.5px] text-muted line-through">{som(s.oldPrice)}</p>}
                  <p className={`whitespace-nowrap text-[11.5px] font-bold ${s.oldPrice ? 'text-sale' : 'text-sea-600'}`}>{som(s.price)}</p>
                </div>
                <AddButton product={s} className="w-[34px]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function marketCount(sellerId) {
  return marketProducts.filter((x) => x.sellerId === sellerId).length
}

function GalleryArrow({ side, onClick }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      onClick={onClick}
      aria-label={side === 'left' ? 'Oldingi' : 'Keyingi'}
      className={`absolute top-1/2 grid size-[26px] -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-md transition hover:bg-white ${side === 'left' ? 'left-2.5' : 'right-2.5'}`}
    >
      <Icon className="size-4" />
    </button>
  )
}

function Stars({ value }) {
  return (
    <span className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`size-[11px] ${i <= Math.round(value - 0.3) ? 'fill-star text-star' : 'fill-star/40 text-star/40'}`} />
      ))}
    </span>
  )
}
