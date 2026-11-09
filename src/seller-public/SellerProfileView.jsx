import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BadgeCheck, BookOpen, CalendarDays, Clock, Globe, GraduationCap, Info, MapPin, MessageCircle, MessageSquareText, Package, Phone, Send, ShoppingCart, Star, Store, Tag } from 'lucide-react'
import { MapPreview, parseGeo } from '../components/MapPicker'
import { ReviewCard } from '../components/ReviewList'
import { som } from '../marketData'
import { useCart, isOwnProduct } from '../cart'
import { offPercent } from '../lib/discounts'
import { categoriesOf, contactOf, orderProducts, ratingOf, salesOf, verifiedOf, workTimeOf } from './lib'

const TEAL = '#0b6d73'
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
const since = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-yil ${d.getDate()}-${MONTHS[d.getMonth()]}` }
const initials = (name) => String(name || 'S').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'S'

function Stars({ value, size = 'size-3.5' }) {
  return (
    <span className="inline-flex" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`${size} ${i <= Math.round(value) ? 'fill-[#f5a524] text-[#f5a524]' : 'text-[#d5dde2]'}`} />)}
    </span>
  )
}

const shadow = 'shadow-[0_2px_10px_rgb(11_60_70/0.06)]'

function Stat({ icon: Icon, label, value, muted }) {
  return (
    <div className={`@container/stat min-w-0 rounded-2xl border border-[#e3eef0] bg-white ${shadow}`}>
      <div className="flex min-w-0 items-center gap-1.5 px-2 py-3 @[120px]/stat:gap-2.5 @[120px]/stat:px-3">
        <Icon className="size-[19px] shrink-0 text-[#0b6d73] @[120px]/stat:size-[22px]" strokeWidth={1.7} />
        <div className="min-w-0">
          <p className="whitespace-nowrap text-[11px] leading-tight tracking-[-0.01em] text-ink-2 @[120px]/stat:text-[12px]">{label}</p>
          <p className={`mt-0.5 truncate text-[18px] font-bold leading-tight @[120px]/stat:text-[19px] ${muted ? 'text-muted' : 'text-ink'}`}>{value}</p>
        </div>
      </div>
    </div>
  )
}

function Thumb({ p }) {
  const [broken, setBroken] = useState(false)
  const show = p.image && !broken
  const isSeminar = p.kind === 'seminar'
  const Icon = isSeminar ? GraduationCap : p.kind === 'book' ? BookOpen : Package
  // Marketplace CatalogCard uslubi: oq fon + object-contain (mahsulot/kitob), posterlar — object-cover.
  // absolute inset-0: aspect-square ichida rasm barqaror to‘ldi (grid+%-height ba’zan poster balandligini ushlamaydi).
  return (
    <span className={`relative block aspect-square overflow-hidden rounded-[14px] ${isSeminar ? 'bg-[#eef3f6]' : 'bg-white'}`}>
      {show ? (
        <img
          src={p.image}
          alt=""
          loading="lazy"
          onError={() => setBroken(true)}
          className={`absolute inset-0 size-full ${isSeminar ? 'object-cover' : 'object-contain p-[7px]'}`}
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
          <span className="grid size-14 place-items-center rounded-2xl bg-[#0b6d73]/12 text-[#0b6d73]">
            <Icon className="size-7" strokeWidth={1.6} />
          </span>
        </span>
      )}
    </span>
  )
}

function ProductCard({ p, onAdded, demo = false }) {
  const { add } = useCart()
  const navigate = useNavigate()
  const own = !demo && isOwnProduct(p)
  const hasVariants = Array.isArray(p.variants) && p.variants.length > 0
  const out = !hasVariants && p.stock != null && Number(p.stock) < 1
  const off = demo ? 0 : offPercent(p)
  const noPrice = p.price == null || p.price === ''
  const isSeminar = p.kind === 'seminar'
  const onCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (demo || isSeminar) return
    // Variantli mahsulotda variantni mahsulot sahifasida tanlaydi (savatga noto‘g‘ri variant tushmasin).
    if (hasVariants) { navigate(`/product/${p.id}`); return }
    const ok = add({ id: p.id, productId: p.id, sellerId: p.sellerId, name: p.name, type: p.type, price: p.price, image: p.image, minQty: p.minQty, priceTiers: p.priceTiers, uom: p.uom, stock: p.stock, rx: p.rx }, Math.max(1, Number(p.minQty) || 1))
    if (ok) onAdded?.(`${p.name} savatga qo‘shildi`)
  }
  const cartDisabled = demo || out
  const cartLabel = demo ? 'Savatchaga qo‘shib bo‘lmaydi' : (out ? 'Tugagan' : 'Savatga qo‘shish')
  const priceBlock = noPrice ? (
    <span className="block text-[12.5px] font-semibold leading-tight text-muted">{p.priceText || 'Narx ko‘rsatilmagan'}</span>
  ) : (
    <span className="min-w-0 leading-tight">
      {p.oldPrice > p.price && <span className="block truncate text-[11px] text-muted line-through">{som(p.oldPrice)}</span>}
      <span className={`flex flex-wrap items-baseline gap-x-1 font-bold leading-tight tracking-[-0.01em] ${p.oldPrice > p.price ? 'text-sale' : 'text-[#0b4f54]'}`}>
        <span className="whitespace-nowrap text-[14.5px] @[176px]/card:text-[15px]">{som(p.price).replace(/\s*so‘m$/, '')}</span><span className="text-[13px]">so‘m</span>
      </span>
    </span>
  )
  const action = own ? (
    <span className="shrink-0 rounded-lg bg-[#eef4f4] px-1.5 py-1 text-[9.5px] font-semibold leading-tight text-[#0b6d73]">Sizniki</span>
  ) : isSeminar ? (
    demo ? (
      <span className="mt-1.5 block w-full cursor-not-allowed rounded-lg bg-[#E2E8F0] py-2 text-center text-[11.5px] font-semibold text-[#94A3B8]">Ro‘yxatdan o‘tish o‘chirilgan</span>
    ) : null
  ) : (
    <button type="button" onClick={onCart} disabled={cartDisabled} aria-label={cartLabel} title={cartLabel}
      className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-[#0b6d73] text-white transition active:scale-95 disabled:bg-[#c9d6d8]">
      <ShoppingCart className="size-[18px]" strokeWidth={2} />
    </button>
  )
  const body = (
    <>
      {off > 0 && <span className="absolute left-2 top-2 z-10 rounded-md bg-sale px-1.5 py-0.5 text-[10.5px] font-bold text-white">-{off}%</span>}
      {demo && <span className="absolute left-2 top-2 z-10 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10.5px] font-semibold text-[#92400E]">Namuna</span>}
      <Thumb p={p} />
      <span className="flex flex-1 flex-col px-1.5 pb-1 pt-1.5">
        <span className="line-clamp-2 min-h-[2.6em] text-[13px] font-medium leading-[1.3] text-ink">{p.name}</span>
        {p.meta ? <span className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted">{p.meta}</span> : null}
        {isSeminar && demo ? (
          <>
            <span className="mt-auto pt-1.5">{priceBlock}</span>
            {action}
          </>
        ) : (
          <span className="mt-auto flex items-end justify-between gap-1 pt-1.5">
            {priceBlock}
            {action}
          </span>
        )}
        {demo && p.sourceUrl ? (
          <a href={p.sourceUrl} target="_blank" rel="noreferrer nofollow" onClick={(e) => e.stopPropagation()}
            className="mt-1.5 text-[11px] text-muted underline">Manba</a>
        ) : null}
      </span>
    </>
  )
  const cls = `@container/card relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#e3eef0] bg-white p-1 transition hover:shadow-md ${shadow}`
  if (demo) return <div className={cls}>{body}</div>
  return <Link to={`/product/${p.id}`} className={cls}>{body}</Link>
}

function InfoRow({ icon: Icon, label, children, href }) {
  const val = href ? <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="break-words font-semibold text-[#0b6d73]">{children}</a> : <span className="break-words text-ink">{children}</span>
  return (
    <li className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 size-[18px] shrink-0 text-[#0b6d73]" strokeWidth={1.8} />
      <div className="min-w-0 flex-1 text-[13.5px]">
        <p className="text-[12px] text-muted">{label}</p>
        <p className="mt-0.5">{val}</p>
      </div>
    </li>
  )
}

// The buyer-facing seller profile body (v2 design). Used by /dokon/:id AND the Sozlamalar live preview,
// so preview == real page. Responsive via container queries, so it also renders inside a narrow preview frame.
// Hamma ko‘rsatkich bazadan: yo‘q maydon — yashiriladi, hech narsa to‘qib chiqarilmaydi.
export default function SellerProfileView({ info, products, loading = false, infoLoading = false, onToast, demo = false, productsLabel = 'Mahsulotlar', initialTab }) {
  const sk = (w) => <span aria-hidden="true" className={`inline-block h-[1em] ${w} animate-pulse rounded bg-[#e8eef2] align-middle`} />
  const [tab, setTab] = useState(initialTab || 'products')
  const [cat, setCat] = useState('')
  const tabsDef = [['products', productsLabel], ['reviews', 'Sharhlar'], ['info', 'Ma’lumot']]
  const ordered = useMemo(() => orderProducts(products, info?.featured_ids), [products, info?.featured_ids])
  const cats = useMemo(() => categoriesOf(products), [products])
  const list = useMemo(() => ordered.filter((p) => !cat || p.category === cat), [ordered, cat])
  const name = info?.shop_name || products[0]?.seller || 'Sotuvchi'
  const reviews = Array.isArray(info?.reviews) ? info.reviews : []
  const rating = ratingOf(info)
  const sales = salesOf(info)
  const verified = verifiedOf(info)
  const work = workTimeOf(info)
  const contact = contactOf(info)
  const geo = parseGeo(info?.address || '')
  const place = String(info?.city || '').trim() || geo.text
  const about = String(info?.description || '').trim() || String(info?.shop_type || '').trim()
  const shopCats = Array.isArray(info?.categories) ? info.categories.filter(Boolean) : []
  const productName = (id) => products.find((p) => p.id === id)?.name || ''
  const infoRows = [work && ['work', Clock, 'Ish vaqti:', work]].filter(Boolean)

  const header = (
    <section className={`relative overflow-hidden rounded-[22px] border border-[#e3eef0] bg-white p-4 ${shadow}`}>
      <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-gradient-to-br from-[#e3f4f1] to-transparent opacity-80" />
      <div className="relative flex items-center gap-3.5">
        <span className="grid size-[76px] shrink-0 place-items-center overflow-hidden rounded-[18px] bg-[#0b6d73] text-[26px] font-extrabold text-white @4xl:size-[84px]">
          {info?.avatar_url ? <img src={info.avatar_url} alt="" className="size-full object-cover" /> : initials(name)}
        </span>
        <span aria-hidden="true" className="h-14 w-px shrink-0 bg-[#e3eef0]" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="min-w-0 max-w-full truncate text-[21px] font-bold leading-tight text-ink">{infoLoading && !products.length ? sk('w-36') : name}</h1>
            {verified && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e2f5ec] px-2 py-[3px] text-[11.5px] font-semibold text-[#17804f]">
                <BadgeCheck className="size-[15px] fill-[#1f9d62] text-white" /> Tasdiqlangan
              </span>
            )}
          </div>
          {place && <p className="mt-1 flex items-center gap-1 text-[13px] text-ink-2"><MapPin className="size-[15px] shrink-0 text-[#0b6d73]" /><span className="truncate">{place}</span></p>}
          {about && <p className="mt-1 truncate text-[13px] text-ink-2">{about}</p>}
        </div>
      </div>
    </section>
  )

  const stats = (
    <div className={`mt-3 grid gap-2 ${sales === null ? 'grid-cols-2' : 'grid-cols-3'}`}>
      <Stat icon={Star} label="Reyting" value={rating === null ? 'Yangi' : rating.toFixed(1)} muted={rating === null} />
      <Stat icon={Package} label={productsLabel} value={loading ? sk('w-8') : products.length} />
      {sales !== null && <Stat icon={ShoppingCart} label="Sotuvlar" value={sales} />}
    </div>
  )

  const actions = (contact.message || contact.tel) ? (
    <div className={`mt-3 grid gap-2.5 ${contact.message && contact.tel ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {contact.message && (
        <a href={contact.message} target={contact.messageVia === 'telegram' ? '_blank' : undefined} rel="noreferrer"
          className="flex h-[50px] items-center justify-center gap-2 rounded-2xl bg-[#0b6d73] px-2 text-[15px] font-semibold text-white shadow-[0_6px_16px_rgb(11_109_115/0.25)] active:scale-[0.98]">
          <MessageCircle className="size-5 shrink-0" /> <span className="truncate">Xabar yozish</span>
        </a>
      )}
      {contact.tel && (
        <a href={contact.tel} className="flex h-[50px] items-center justify-center gap-2 rounded-2xl border-[1.5px] border-[#0b6d73] bg-white px-2 text-[15px] font-semibold text-[#0b6d73] active:scale-[0.98]">
          <Phone className="size-5 shrink-0" /> <span className="truncate">Qo‘ng‘iroq qilish</span>
        </a>
      )}
    </div>
  ) : null

  const infoBox = infoRows.length > 0 && (
    <ul className={`mt-3 divide-y divide-[#eef3f4] rounded-2xl border border-[#e3eef0] bg-white px-4 py-1 ${shadow}`}>
      {infoRows.map(([k, Icon, label, val]) => (
        <li key={k} className="flex items-center gap-3 py-2.5 text-[13.5px]">
          <Icon className="size-5 shrink-0 text-[#0b6d73]" strokeWidth={1.8} />
          <span className="w-[118px] shrink-0 font-semibold text-ink">{label}</span>
          <span className="min-w-0 flex-1 break-words text-ink-2">{val}</span>
        </li>
      ))}
    </ul>
  )

  const tabs = (
    <div role="tablist" aria-label="Sotuvchi bo‘limlari" className="grid grid-cols-3 gap-2">
      {tabsDef.map(([k, l]) => (
        <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
          className={`h-11 min-w-0 truncate rounded-full px-2 text-[14px] font-semibold transition ${tab === k ? 'bg-[#0b6d73] text-white shadow-[0_4px_12px_rgb(11_109_115/0.25)]' : `border border-[#e3eef0] bg-white text-ink ${shadow}`}`}>
          {l}{k === 'reviews' && reviews.length > 0 ? ` (${info?.reviews_count || reviews.length})` : ''}
        </button>
      ))}
    </div>
  )

  const productsTab = (
    <div>
      {cats.length > 0 && (
        <div className="no-scrollbar -mx-3.5 mt-3 flex gap-2 overflow-x-auto px-3.5 @4xl:mx-0 @4xl:flex-wrap @4xl:px-0">
          {[['', 'Hammasi'], ...cats.map((c) => [c, c])].map(([k, l]) => (
            <button key={k || 'all'} type="button" aria-pressed={cat === k} onClick={() => setCat(k)}
              className={`h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-[13px] font-medium transition ${cat === k ? 'bg-[#0b6d73] text-white' : 'border border-[#cfe5e5] bg-white text-ink-2'}`}>{l}</button>
          ))}
        </div>
      )}
      {loading && <div className="mt-3 grid grid-cols-2 gap-2.5 @2xl:grid-cols-3 @4xl:grid-cols-3 @6xl:grid-cols-4" aria-label="Yuklanmoqda">{Array.from({ length: 4 }, (_, i) => <div key={i} className="aspect-[5/6] animate-pulse rounded-2xl bg-[#e9f0f2]" />)}</div>}
      {!loading && !list.length && (
        <div className="mt-3 rounded-2xl border border-[#e3eef0] bg-white px-5 py-10 text-center">
          <Store className="mx-auto size-9 text-[#0b6d73]/50" strokeWidth={1.5} />
          <p className="mt-2 text-[14px] font-semibold text-ink">{productsLabel === 'Seminarlar' ? 'Hozircha seminar yo‘q' : productsLabel === 'Kitoblar' ? 'Hozircha kitob yo‘q' : 'Hozircha sotuvda mahsulot yo‘q'}</p>
          <p className="mt-1 text-[12.5px] text-muted">{demo ? `${productsLabel} qo‘shilganda shu yerda ko‘rinadi.` : 'Sotuvchi mahsulot qo‘shganda shu yerda ko‘rinadi.'}</p>
        </div>
      )}
      {!loading && list.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2.5 @2xl:grid-cols-3 @4xl:grid-cols-3 @4xl:gap-2.5 @6xl:grid-cols-4">
          {list.map((p) => <ProductCard key={p.id} p={p} onAdded={onToast} demo={demo} />)}
        </div>
      )}
    </div>
  )

  const reviewsTab = (
    <div className="mt-3">
      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-[#e3eef0] bg-white px-5 py-10 text-center">
          <MessageSquareText className="mx-auto size-9 text-[#0b6d73]/50" strokeWidth={1.5} />
          <p className="mt-2 text-[14px] font-semibold text-ink">Hozircha sharhlar yo‘q</p>
          <p className="mt-1 text-[12.5px] text-muted">{demo ? (info?.demo_kind === 'organizer' ? 'Namuna sahifada ishtirokchi sharhlari ko‘rsatilmaydi.' : 'Namuna sahifada sharhlar ko‘rsatilmaydi.') : 'Xaridorlar buyurtmani olgandan keyin baho va sharh qoldira oladi.'}</p>
        </div>
      ) : (
        <div className={`rounded-2xl border border-[#e3eef0] bg-white p-4 ${shadow}`}>
          {rating !== null && <div className="flex items-center gap-2 border-b border-[#eef3f4] pb-3"><span className="text-[26px] font-bold text-ink">{rating.toFixed(1)}</span><div><Stars value={rating} size="size-4" /><p className="text-[12px] text-muted">{info?.reviews_count} ta baho</p></div></div>}
          <ul className="divide-y divide-[#eef3f4]">
            {reviews.map((r, i) => (
              <ReviewCard
                key={r.id || `${r.created_at}-${i}`}
                review={r}
                productName={r.product_id ? productName(r.product_id) : ''}
                productLink={r.product_id ? `/product/${r.product_id}` : undefined}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  const site = String(info?.website || '').trim()
  const insta = String(info?.instagram || '').trim().replace(/^@+/, '').replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//i, '').replace(/\/.*$/, '')
  const demoKind = info?.demo_kind
  const aboutLabel = demoKind === 'organizer' ? 'Markaz haqida' : 'Do‘kon haqida'
  const infoEmpty = demoKind === 'organizer' ? 'Tashkilotchi hali ma’lumot qo‘shmagan.' : 'Sotuvchi hali ma’lumot qo‘shmagan.'
  const cityOnly = String(info?.city || '').trim()
  const infoItems = [
    info?.description && ['about', Info, aboutLabel, <span className="whitespace-pre-line">{info.description}</span>],
    info?.shop_type && ['type', Store, 'Faoliyat turi', info.shop_type],
    shopCats.length > 0 && ['cats', Tag, 'Yo‘nalishlar', shopCats.join(', ')],
    work && ['work', Clock, 'Ish vaqti', work],
    geo.text && ['addr', MapPin, 'Manzil', geo.text],
    !geo.text && cityOnly && ['city', MapPin, 'Shahar', cityOnly],
    info?.phone && ['phone', Phone, 'Telefon', info.phone, contact.tel],
    contact.telegram && ['tg', Send, 'Telegram', contact.telegram.handle, contact.telegram.url],
    insta && ['ig', Globe, 'Instagram', `@${insta}`, `https://instagram.com/${insta}`],
    site && ['web', Globe, 'Veb-sayt', site.replace(/^https?:\/\//, ''), /^https?:/i.test(site) ? site : `https://${site}`],
    info?.since && since(info.since) && ['since', CalendarDays, 'StomaHub’da', `${since(info.since)}dan beri`],
  ].filter(Boolean)
  const infoTab = (
    <div className="mt-3">
      {infoItems.length === 0 ? (
        <p className="rounded-2xl border border-[#e3eef0] bg-white px-5 py-10 text-center text-[13px] text-muted">{infoEmpty}</p>
      ) : (
        <div className={`rounded-2xl border border-[#e3eef0] bg-white px-4 py-1 ${shadow}`}>
          <ul className="divide-y divide-[#eef3f4]">{infoItems.map(([k, Icon, label, val, href]) => <InfoRow key={k} icon={Icon} label={label} href={href}>{val}</InfoRow>)}</ul>
          {geo.lat != null && <div className="pb-3"><MapPreview lat={geo.lat} lng={geo.lng} /></div>}
        </div>
      )}
    </div>
  )

  return (
    <div className="@container">
      <div className="@4xl:grid @4xl:grid-cols-[360px_minmax(0,1fr)] @4xl:items-start @4xl:gap-6">
        <div className="min-w-0 @4xl:sticky @4xl:top-4">
          {header}
          {stats}
          {actions}
          {infoBox}
        </div>
        <div className="mt-4 min-w-0 @4xl:mt-0">
          {tabs}
          {tab === 'products' && productsTab}
          {tab === 'reviews' && reviewsTab}
          {tab === 'info' && infoTab}
        </div>
      </div>
    </div>
  )
}
