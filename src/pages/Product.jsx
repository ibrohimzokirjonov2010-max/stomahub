import { useEffect, useState } from 'react'
import { RestrictedNotice, BlockNotice, useDoctorVerified } from '../restricted.jsx'
import { purchaseBlock } from '../lib/purchaseGuard'
import { useSession } from '../sessionStore'
import { goBuyNow } from '../checkoutUtils'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Star, BadgeCheck, PackageOpen, CalendarDays, Barcode, Boxes, MapPinned, Truck, FileText,
  ShoppingCart, RefreshCw, MapPin, Package, ArrowRight, CircleCheck,
} from 'lucide-react'
import { marketProducts, productById, similarTo, som } from '../marketData'
import { fetchProductReviews, useMarket } from '../buyerApi'
import { BirgaOlishadi, useTrackView } from '../personal/PersonalBlocks'
import { useCart } from '../cart'
import { SaleBadge, LikeButton, Rating, AddButton } from '../components/market/ProductCard'
import { ToothIcon } from '../components/icons'
import Lightbox from '../components/Lightbox'
import ReviewList from '../components/ReviewList'

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

function productTabs(p) {
  const t = [{ key: 'tavsif', label: 'Tavsif' }]
  if (p.clinicalUse) t.push({ key: 'klinik', label: 'Klinik qo‘llanish', text: p.clinicalUse })
  if (p.techSpecs?.length) t.push({ key: 'texnik', label: 'Xususiyatlari', rows: p.techSpecs })
  if (p.certificate?.length) t.push({ key: 'sertifikat', label: 'Sertifikat', rows: p.certificate })
  const terms = [
    ...(p.minQty > 1 ? [['Minimal buyurtma', `${p.minQty} ${p.uom || 'dona'}`]] : []),
    ...(p.priceTiers || []).map((x) => [`${x.min_qty} ${p.uom || 'dona'} dan`, `${som(x.price)} / ${p.uom || 'dona'}`]),
  ]
  if (p.deliveryInfo || terms.length) t.push({ key: 'yetkazish', label: 'Yetkazib berish', text: p.deliveryInfo, rows: terms })
  if (p.reorder?.enabled) t.push({ key: 'qayta', label: 'Qayta buyurtma', text: `Sotuvchi bu mahsulotni har ${p.reorder.intervalDays} kunda qayta buyurtma qilishni tavsiya qiladi. Buyurtmalarim bo‘limidan bir bosishda qayta buyurtma bering.` })
  return t
}

function ProductTabBody({ t, p }) {
  if (!t) return null
  return (
    <div className="lg:col-span-3">
      {t.text && <p className="whitespace-pre-line text-[13.5px] leading-[1.6] text-ink-2">{t.text}</p>}
      {t.rows?.length > 0 && (
        <dl className={`${t.text ? 'mt-3' : ''} max-w-[640px]`}>
          {t.rows.map(([k, v, url], i) => (
            <div key={`${k}-${i}`} className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-2 border-b border-line/70 py-2 text-[13px] last:border-0">
              <dt className="text-muted">{k}</dt>
              <dd className="text-ink">{url ? <a href={url} target="_blank" rel="noreferrer" className="text-sea hover:underline">{v}</a> : v}</dd>
            </div>
          ))}
        </dl>
      )}
      {t.key === 'qayta' && p.minQty > 1 && <p className="mt-2 text-[9.5px] text-muted">Minimal miqdor: {p.minQty} {p.uom || 'dona'}</p>}
    </div>
  )
}

function ProductBody({ p }) {
  const verified = useDoctorVerified()
  const uid = useSession()?.user?.id || ''
  const block = purchaseBlock(p, { uid, verified })
  const rxBlocked = block?.code === 'rx'
  const id = p.id
  const fromSeller = marketProducts.filter((x) => p.sellerId && x.sellerId === p.sellerId && x.id !== p.id).slice(0, 8)
  const similarProducts = similarTo(p, 8).filter((s) => !fromSeller.some((x) => x.id === s.id))
  useTrackView(p)
  const [reviews, setReviews] = useState([])
  useEffect(() => {
    let alive = true
    fetchProductReviews(p.id).then((rows) => alive && setReviews(rows)).catch(() => {})
    return () => { alive = false }
  }, [p.id])
  const [img, setImg] = useState(0)
  const [zoom, setZoom] = useState(false)
  const minQty = Math.max(1, p.minQty || 1)
  const [tab, setTab] = useState(0)
  const { add } = useCart()
  const navigate = useNavigate()
  const n = p.images.length

  useEffect(() => { setImg(0); setTab(0) }, [id, minQty])

  const facts = [
    { icon: PackageOpen, label: 'Holati', value: 'Yangi (yopiq)' },
    { icon: Boxes, label: 'Miqdor', value: p.stock > 0 ? `Omborda ${p.stock}` : 'Tugagan', ok: p.stock > 0 },
    { icon: MapPinned, label: 'Sotuvchi', value: p.seller || '—' },
    { icon: Truck, label: 'To‘lov', value: 'Naqd, yetkazishda' },
  ]
  const tabs = productTabs(p)
  const activeTab = tabs[tab] || tabs[0]
  const qty = Math.min(Math.max(1, minQty), Math.max(p.stock, 1))

  return (
    <div className="mx-auto w-full max-w-[1720px] pb-8 pt-3">
      <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
        {['Marketplace', p.category || 'Mahsulot'].map((c) => (
          <span key={c} className="flex items-center gap-1.5">
            <Link to="/marketplace" className="hover:text-sea">{c}</Link> <ChevronRight className="size-3" />
          </span>
        ))}
        <span className="font-medium text-ink">{p.name}</span>
      </nav>

      <div className="product-stage mt-3">
        <div className="product-gallery mx-auto w-full max-w-[440px]">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-[#eef3f8]">
            <button type="button" onClick={() => setZoom(true)} aria-label="Rasmni kattalashtirish" className="block size-full cursor-zoom-in">
              <img src={p.images[img]} alt={p.name} className="size-full object-contain p-1" />
            </button>
            {n > 1 && <span className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[11.5px] font-semibold text-white">{img + 1} / {n}</span>}
            {n > 1 && <GalleryArrow side="left" onClick={() => setImg((img - 1 + n) % n)} />}
            {n > 1 && <GalleryArrow side="right" onClick={() => setImg((img + 1) % n)} />}
          </div>
          <div className={`no-scrollbar mt-2.5 grid grid-cols-5 gap-2 ${n > 1 ? '' : 'hidden'}`}>
            {p.images.map((t, i) => (
              <button
                key={`${i}-${t}`}
                type="button"
                aria-label={`Rasm ${i + 1}`}
                onClick={() => setImg(i)}
                className={`aspect-square overflow-hidden rounded-lg bg-white ${i === img ? 'ring-2 ring-sea' : 'ring-1 ring-line hover:ring-sea/50'}`}
              >
                <img src={t} alt={`${p.name} — rasm ${i + 1}`} className="size-full object-contain p-1" />
              </button>
            ))}
          </div>
          {zoom && <Lightbox images={p.images} index={img} onIndex={setImg} onClose={() => setZoom(false)} alt={p.name} />}
        </div>

        <div className="product-info min-w-0">
          <p className="text-[13px] font-semibold text-sea">{p.brand}</p>
          <h1 className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight text-ink">{p.name}</h1>
          {p.type && <p className="mt-1 text-[14px] text-muted">{p.type}</p>}
          {p.short && p.short !== p.description && <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{p.short}</p>}

          <div className="mt-3 grid grid-cols-2 gap-2">
            {facts.map(({ icon: Icon, label, value, ok }) => (
              <div key={label} className="flex gap-2 rounded-xl bg-white px-3 py-2.5 shadow-card">
                <Icon className="mt-0.5 size-4 shrink-0 text-sea" strokeWidth={1.7} />
                <div className="min-w-0 leading-tight">
                  <p className="text-[11px] text-muted">{label}</p>
                  <p className={`mt-0.5 truncate text-[13px] font-semibold ${ok ? 'text-ok' : 'text-ink'}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {(Array.isArray(p.documents) ? p.documents : []).some((d) => d?.url) && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(p.documents || []).filter((d) => d?.url).map((d) => (
                <div key={d.url} className="flex items-center gap-2.5 rounded-xl bg-white p-3 shadow-card">
                  <FileText className="size-5 shrink-0 text-sale" strokeWidth={1.5} />
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-[13px] font-medium text-ink">{d.name || 'Hujjat'}</p>
                    {d.size && <p className="mt-0.5 text-[11px] text-muted">{d.size}</p>}
                  </div>
                  <a href={d.url} target="_blank" rel="noreferrer" className="rounded-md bg-sea-50 px-2 py-1 text-[12px] font-semibold text-sea-600 hover:bg-sea-100">Yuklash</a>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 rounded-2xl bg-white p-4 shadow-card">
            <div className="flex gap-1 overflow-x-auto border-b border-line no-scrollbar">
              {tabs.map((t, i) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(i)}
                  className={`relative shrink-0 px-3 pb-2 pt-1 text-[13px] ${i === tab ? 'font-semibold text-ink after:absolute after:inset-x-2 after:bottom-0 after:h-[2px] after:rounded-full after:bg-sea' : 'text-ink-2 hover:text-sea'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="pt-3">
              {activeTab?.key !== 'tavsif' ? (
                <ProductTabBody t={activeTab} p={p} />
              ) : (
                <div>
                  <p className="text-[13.5px] leading-[1.65] text-ink-2">{p.description}</p>
                  {p.features?.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[13px] text-ink">
                          <CircleCheck className="mt-0.5 size-4 shrink-0 fill-[#3d8fe0] text-white" /> {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  {p.specs?.length > 0 && (
                    <dl className="mt-4">
                      <p className="mb-1 text-[13px] font-bold text-ink">Asosiy xususiyatlar</p>
                      {p.specs.map(([k, v]) => (
                        <div key={k} className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-2 border-b border-line/70 py-2 text-[13px] last:border-0">
                          <dt className="text-muted">{k}</dt>
                          <dd className="font-medium text-ink">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              )}
            </div>
          </div>

          <section id="product-reviews" className="mt-4 rounded-2xl bg-white p-4 shadow-card">
            <h2 className="text-[16px] font-bold text-ink">Sharhlar{reviews.length ? ` (${reviews.length})` : ''}</h2>
            <div className="mt-2">
              <ReviewList
                reviews={reviews}
                emptyTitle="Hozircha sharhlar yo‘q"
                emptyText="Yetkazilgan buyurtmani baholagan xaridorlarning fikrlari shu yerda chiqadi."
                className="!border-0 !shadow-none !px-0"
              />
            </div>
          </section>

          <RelatedGrid title="Shu sotuvchidan" href={p.sellerId ? `/dokon/${p.sellerId}` : '/marketplace'} linkLabel="Do‘kon" items={fromSeller} />
          <RelatedGrid title="O‘xshash mahsulotlar" href="/marketplace" linkLabel="Barchasini ko‘rish" items={similarProducts} />
        </div>

        <aside className="product-aside h-fit rounded-2xl bg-white p-4 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <SaleBadge badge={p.badge} className="-ml-1 rounded-sm" />
              <p className="mt-1 text-[26px] font-extrabold leading-none tracking-tight text-ink">{som(p.price)}{p.uom && p.uom !== 'dona' && <span className="ml-1 text-[13px] font-medium text-muted">/ {p.uom}</span>}</p>
              {(minQty > 1 || p.priceTiers?.length > 0) && (
                <p className="mt-2 text-[12px] leading-snug text-ink-2">
                  {minQty > 1 && <>Minimal buyurtma: <b>{minQty} {p.uom || 'dona'}</b></>}
                  {p.priceTiers?.map((t) => <span key={t.min_qty} className="ml-2 inline-block rounded bg-sea-50 px-1.5 py-0.5 text-sea-600">{t.min_qty}+ — {som(t.price)}</span>)}
                </p>
              )}
              {p.oldPrice > p.price && (
                <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
                  <span className="text-muted line-through">{som(p.oldPrice)}</span>
                  <span className="font-medium text-sea">Tejaysiz: {som(p.oldPrice - p.price)}</span>
                </p>
              )}
            </div>
            <LikeButton productId={p.id} className="size-8 bg-[#f3f6fa]" />
          </div>

          <p className={`mt-3 text-[13px] font-semibold ${p.stock > 0 ? 'text-ok' : 'text-sale'}`}>{p.stock > 0 ? `${p.stock} ${p.uom || 'dona'} mavjud` : 'Tugagan'}</p>

          {rxBlocked ? <RestrictedNotice className="mt-2.5" /> : block?.code === 'own' ? <BlockNotice className="mt-2.5" text={block.text} /> : <>
          <button
            disabled={p.stock < 1} onClick={() => add({ ...p, image: p.thumbs[0] }, qty)}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sea text-[14px] font-semibold text-white transition hover:bg-sea-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart className="size-4" /> {p.stock < 1 ? 'Tugagan' : 'Savatga qo‘shish'}
          </button>
          <button disabled={p.stock < 1} onClick={() => goBuyNow(navigate, { ...p, image: p.thumbs[0] }, qty, 'market')} className="mt-2 h-11 w-full rounded-xl border border-sea-100 bg-sea-50 text-[13.5px] font-semibold text-sea-600 transition hover:bg-sea-100">
            Hozir xarid qilish
          </button>
          </>}

          <Link to={p.sellerId ? `/dokon/${p.sellerId}` : '/marketplace'} className="mt-4 flex gap-3 rounded-xl border border-line p-3 hover:bg-[#f6faf9]">
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-white shadow-card ring-1 ring-line">
              <ToothIcon className="size-5 text-sea" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-[13px] font-bold text-ink">
                {p.seller || 'Sotuvchi'} <BadgeCheck className="size-3.5 fill-[#1a73e8] text-white" />
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[12px] text-ink-2">
                <Package className="size-3.5" /> {marketCount(p.sellerId)} ta mahsulot sotuvda
              </p>
              <p className="mt-1 text-[12.5px] font-semibold text-sea">Do‘konni ko‘rish →</p>
            </div>
          </Link>
        </aside>
      </div>

      <div className="catalog-frame">
        <BirgaOlishadi product={p} desktop />
      </div>
    </div>
  )
}

function RelatedGrid({ title, href, linkLabel, items }) {
  if (!items?.length) return null
  return (
    <section className="mt-6">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-bold text-ink">{title}</h2>
        <Link to={href} className="flex items-center gap-1 text-[13px] font-semibold text-sea hover:underline">{linkLabel} <ArrowRight className="size-3.5" /></Link>
      </div>
      <div className="product-rail">
        {items.map((s) => (
          <div key={s.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-card">
            <Link to={`/product/${s.id}`} className="relative block aspect-square bg-[#eef3f6]">
              {s.badge && <SaleBadge badge={s.badge} className="absolute left-2 top-2 z-10" />}
              <img src={s.image} alt={s.name} className="size-full object-contain p-3" />
            </Link>
            <div className="flex flex-1 flex-col p-2.5">
              <Link to={`/product/${s.id}`} className="line-clamp-2 text-[13px] font-bold leading-snug text-ink">{s.name}</Link>
              <p className="mt-0.5 truncate text-[12px] text-muted">{[s.brand, s.type].filter(Boolean).join(' · ')}</p>
              <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                <div className="min-w-0 leading-tight">
                  {s.oldPrice > s.price && <p className="text-[11px] text-muted line-through">{som(s.oldPrice)}</p>}
                  <p className={`text-[14px] font-extrabold ${s.oldPrice > s.price ? 'text-sale' : 'text-sea-600'}`}>{som(s.price)}</p>
                </div>
                <AddButton product={s} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
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
      className={`absolute top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-md transition hover:bg-white ${side === 'left' ? 'left-2.5' : 'right-2.5'}`}
    >
      <Icon className="size-4" />
    </button>
  )
}
