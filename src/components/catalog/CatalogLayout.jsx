import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, SlidersHorizontal, ArrowRight, ChevronDown, ArrowUpDown, Heart, Star, Check, X, Tag } from 'lucide-react'
import CardQtyStepper, { useCardQty } from '../CardQtyStepper'
import { useMobile } from '../../useMobile'
import { ensureLogin } from '../../loginPrompt'
import { BottomSheet } from '../mobile/MobileSeminars'
import { MobileTopBar, MobileToast } from '../mobile/parts'
import MobileTabBar from '../mobile/MobileTabBar'
import ShopLayout from '../market/ShopLayout'
import { som } from '../../marketData'
import { useAdPlacements, trackAd, joinAds } from '../../adsApi'
import { recordInterest } from '../../personal/interestStore'
import { ImageSearchButton, ImageSearchDialog, ImageSearchBanner, rankByTerms, termsFrom } from './ImageSearch'
import { demoCard } from '../../demoContent'
import { CategoryTile, iconById } from '../../icons/categoryIcons'
import { FALLBACK_ICON } from '../../icons/categoryIconMap'

/* ---------- building blocks ---------- */

export function CatalogHeader({ title, subtitle, desktop, action, onAction, secondary, onSecondary }) {
  return (
    <div className="flex items-end justify-between gap-3">
     <div className="min-w-0">
      <h1 data-testid="catalog-title" className={`${desktop ? 'text-[30px]' : 'mt-2.5 text-[24px]'} font-extrabold leading-tight tracking-tight text-[#0d2a4a]`}>{title}</h1>
      {subtitle && <p className={`${desktop ? 'text-[14px]' : 'text-[12px]'} text-ink-2`}>{subtitle}</p>}
     </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
        {secondary && (
          <button type="button" onClick={() => { if (ensureLogin()) onSecondary?.() }} className={`rounded-xl border border-sea/40 bg-white font-semibold text-sea active:scale-[0.97] ${desktop ? 'h-11 px-3 text-[13px]' : 'h-9 px-2.5 text-[11.5px]'}`}>
            {secondary}
          </button>
        )}
        {action && (
          <button type="button" onClick={() => { if (ensureLogin()) onAction?.() }} className={`flex items-center gap-1 rounded-xl bg-sea font-semibold text-white active:scale-[0.97] ${desktop ? 'h-11 px-4 text-[14px]' : 'h-9 px-3 text-[12px]'}`}>
            <Plus className="size-4" strokeWidth={2.4} /> {action}
          </button>
        )}
      </div>
    </div>
  )
}

export function CatalogSearch({ value, onChange, placeholder, onFilter, active, inputRef, desktop, onImage }) {
  const h = desktop ? 'h-12' : 'h-11'
  return (
    <div className="mt-3 flex gap-2">
      <label className={`flex ${h} min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-line/70 bg-white px-3.5`}>
        <Search className="size-[18px] shrink-0 text-ink-2" />
        <input ref={inputRef} type="search" data-testid="catalog-search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted" />
        {value && <button type="button" onClick={() => onChange('')} aria-label="Tozalash" className="text-muted"><X className="size-4" /></button>}
      </label>
      {onImage && <ImageSearchButton onClick={onImage} desktop={desktop} />}
      <button type="button" onClick={onFilter} aria-label="Filtrlar" data-testid="catalog-filter-btn" className={`relative grid ${desktop ? 'size-12' : 'size-11'} shrink-0 place-items-center rounded-2xl border border-line/70 bg-white text-ink`}>
        <SlidersHorizontal className="size-[19px]" />
        {active > 0 && <span className="absolute -right-1 -top-1 grid size-[18px] place-items-center rounded-full bg-sea text-[10px] font-bold text-white ring-2 ring-[#f6f9fb]">{active}</span>}
      </button>
    </div>
  )
}

/** slides: [{ id, title, accent, text, images: [src], cta, href | onClick }]. Carousel when >1. */
export function HeroSlider({ slides, desktop }) {
  const [i, setI] = useState(0)
  const n = slides.length
  const touch = useRef(null)
  useEffect(() => {
    if (n < 2) return undefined
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000)
    return () => clearInterval(t)
  }, [n, i])
  useEffect(() => { if (i >= n) setI(0) }, [i, n])
  const curAd = slides[i]?.ad && slides[i]
  useEffect(() => { if (curAd) trackAd('view', curAd.ad.campaign_id, curAd.item.id) }, [curAd])
  if (!n) return null
  return (
    <div
      data-testid="catalog-hero"
      className={`relative mt-3 overflow-hidden rounded-2xl ${desktop ? 'h-[230px]' : 'h-[164px]'}`}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (touch.current == null || n < 2) return
        const dx = e.changedTouches[0].clientX - touch.current
        if (Math.abs(dx) > 40) setI((x) => (x + (dx < 0 ? 1 : n - 1)) % n)
        touch.current = null
      }}
    >
      <div className="flex h-full transition-transform duration-500" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s) => (s.ad ? <AdSlide key={s.id} s={s} desktop={desktop} /> : <Slide key={s.id} s={s} desktop={desktop} />))}
      </div>
      {n > 1 && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5" data-testid="catalog-hero-dots">
          {slides.map((s, k) => (
            <button key={s.id} type="button" aria-label={`${k + 1}-slayd`} onClick={() => setI(k)} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-4 bg-sea' : 'w-1.5 bg-[#0d2a4a]/25'}`} />
          ))}
        </div>
      )}
    </div>
  )
}

// Reklama posteri: mavjud slayd o‘lchamida, rasm + gradient + 'Reklama' belgisi.
function AdSlide({ s, desktop }) {
  const { ad, item } = s
  const img = ad.image_url || item.image
  return (
    <Link to={`/product/${item.id}`} data-testid="hero-ad-slide" onClick={() => trackAd('click', ad.campaign_id, item.id)} className="relative block h-full w-full shrink-0 overflow-hidden bg-[#0F766E]">
      {img && <img src={img} alt="" className="absolute inset-0 size-full object-cover object-center" />}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/0" />
      <div className={`relative flex h-full flex-col justify-center text-white ${desktop ? 'max-w-[58%] gap-1.5 pl-8' : 'max-w-[72%] gap-1 pl-3.5'}`}>
        <span className="w-fit max-w-full truncate rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold tracking-wide backdrop-blur-sm">Reklama · {ad.shop_name}</span>
        <p className={`line-clamp-2 font-extrabold leading-tight drop-shadow ${desktop ? 'text-[28px]' : 'text-[16px]'}`}>{ad.headline || ad.title}</p>
        {(ad.body_text || ad.description) && <p className={`line-clamp-2 text-white/90 drop-shadow ${desktop ? 'text-[14px]' : 'text-[11.5px]'}`}>{ad.body_text || ad.description}</p>}
        <span className={`mt-1 inline-flex w-fit items-center gap-1 rounded-lg bg-white font-bold text-[#0F766E] ${desktop ? 'px-3.5 py-2 text-[13px]' : 'px-2.5 py-1 text-[11.5px]'}`}>{ad.cta_text || 'Ko‘rish'} <ArrowRight className="size-3.5" /></span>
      </div>
    </Link>
  )
}

function Slide({ s, desktop }) {
  // Matn chap ustunda, rasm o‘ng ustunda — bir-birining ustiga chiqmaydi. Rasm yo‘q bo‘lsa (bo‘sh bo‘lim) bo‘lim belgisi.
  const img = (s.images || []).filter(Boolean)[0]
  const Icon = s.icon
  const Btn = s.href ? Link : 'button'
  return (
    <div data-testid="hero-slide" className={`relative flex h-full w-full shrink-0 items-stretch bg-gradient-to-r from-[#e6f4f5] via-[#eaf5f7] to-[#d7ecf0] ${desktop ? 'gap-6 pl-8 pr-3' : 'gap-2 pl-3.5 pr-2'}`}>
      <div data-testid="hero-slide-text" className={`flex min-w-0 flex-col justify-center ${desktop ? 'w-[56%] py-4' : 'w-[58%] py-2.5'}`}>
        {s.badge && <span className={`mb-1 w-fit max-w-full truncate rounded-full bg-white/80 font-semibold text-[#0F766E] ring-1 ring-[#0F766E]/15 ${desktop ? 'px-2.5 py-0.5 text-[12px]' : 'px-2 py-px text-[10px]'}`}>{s.badge}</span>}
        <p className={`${desktop ? (s.item ? 'text-[24px]' : 'text-[28px]') : s.item ? 'line-clamp-3 text-[14.5px]' : 'line-clamp-2 text-[16px]'} ${desktop ? 'line-clamp-2' : ''} font-extrabold leading-[1.15] text-[#0d2a4a]`}>{s.title}</p>
        {s.text && <p className={`mt-1 ${s.item ? 'line-clamp-1' : 'line-clamp-2'} ${desktop ? 'max-w-[420px] text-[14px]' : 'text-[11px]'} leading-snug text-ink-2`}>{s.text}</p>}
        {s.cta && (
          <Btn {...(s.href ? { to: s.href } : { type: 'button', onClick: s.onClick })} data-testid="hero-cta" className={`mt-2 flex w-fit max-w-full items-center gap-1.5 rounded-xl bg-[#0F766E] font-semibold text-white active:scale-[0.97] ${desktop ? 'h-11 px-5 text-[14px]' : 'h-8 px-3 text-[11.5px]'}`}>
            <span className="truncate">{s.cta}</span> <ArrowRight className="size-3.5 shrink-0" />
          </Btn>
        )}
      </div>
      <div className={`flex min-w-0 flex-1 items-center justify-center ${desktop ? 'py-3 pb-7' : 'py-2 pb-5'}`}>
        {img ? (
          <div className="relative h-full w-full overflow-hidden rounded-xl bg-white/85 ring-1 ring-white/70">
            <img src={img} alt="" className="size-full object-contain p-2" />
          </div>
        ) : Icon ? (
          <span className={`grid place-items-center rounded-full bg-white/80 text-[#0F766E] ring-1 ring-[#0F766E]/10 ${desktop ? 'size-[120px]' : 'size-[76px]'}`}><Icon className={desktop ? 'size-14' : 'size-9'} strokeWidth={1.6} /></span>
        ) : null}
      </div>
    </div>
  )
}

/** cats: [{ key, label, icon }] — 'all' (Barchasi) is always prepended. */
export function CategoryChips({ cats, value, onChange, desktop }) {
  const all = [{ key: 'all', label: 'Barchasi', icon: iconById('all') }, ...cats]
  return (
    <div data-testid="catalog-chips" className={`mt-3 flex gap-2.5 overflow-x-auto pb-1 no-scrollbar ${desktop ? '' : '-mx-3.5 px-3.5'}`}>
      {all.map(({ key, label, icon }) => {
        const on = value === key
        // Yagona uslub: barcha bo‘limlarda bir xil teal plitka (src/icons/categoryIcons.jsx)
        const Icon = icon && !icon.raster ? icon : iconById(FALLBACK_ICON)
        return (
          <button key={key} type="button" aria-pressed={on} title={label} onClick={() => onChange(on && key !== 'all' ? 'all' : key)} className={`flex shrink-0 flex-col items-center gap-1 ${desktop ? 'w-[92px]' : 'w-[64px]'}`}>
            <CategoryTile icon={Icon} active={on} size={desktop ? 'lg' : 'md'} />
            <span className={`w-full truncate text-center ${desktop ? 'text-[12px]' : 'text-[10.5px]'} ${on ? 'font-semibold text-sea' : 'text-ink-2'}`}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}

/** filters: [{ key, label, options: [[value,label]] }]; values: {key: value}; sorts: [[key,label]] */
export function FilterBar({ filters, values, onChange, sorts, sort, onSort, desktop }) {
  const [open, setOpen] = useState(null)
  const ref = useRef(null)
  useEffect(() => {
    if (!open || !desktop) return undefined
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(null) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open, desktop])
  const sortLabel = sort && sort !== sorts[0]?.[0] ? sorts.find(([k]) => k === sort)?.[1] : 'Saralash'
  const menu = (key, options, value, pick) =>
    desktop ? (
      <div className="absolute left-0 top-[calc(100%+6px)] z-30 max-h-[320px] min-w-[200px] overflow-y-auto rounded-xl border border-line bg-white p-1 shadow-[0_12px_30px_-12px_rgb(11_31_58/0.35)]">
        {options.map(([v, l]) => (
          <button key={v || 'all'} type="button" onClick={() => { pick(v); setOpen(null) }} className="flex h-9 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-[13px] text-ink hover:bg-sea-50">
            {l} {value === v && <Check className="size-4 text-sea" />}
          </button>
        ))}
      </div>
    ) : null
  const sheet = open && !desktop && (() => {
    const f = open === '__sort' ? { label: 'Saralash', options: sorts } : filters.find((x) => x.key === open)
    const value = open === '__sort' ? sort : values[open] || ''
    const pick = open === '__sort' ? onSort : (v) => onChange({ ...values, [open]: v })
    const opts = open === '__sort' ? f.options : [['', 'Barchasi'], ...f.options]
    return (
      <BottomSheet title={f.label} onClose={() => setOpen(null)}>
        <div className="mt-2 flex flex-col">
          {opts.map(([v, l]) => (
            <button key={v || 'all'} type="button" onClick={() => { pick(v); setOpen(null) }} className="flex h-12 items-center justify-between border-b border-line text-[14px] text-ink last:border-0">
              {l} {value === v && <Check className="size-5 text-sea" />}
            </button>
          ))}
        </div>
      </BottomSheet>
    )
  })()
  const pillCls = (on) => `flex shrink-0 items-center gap-0.5 rounded-xl border font-medium ${desktop ? 'h-10 px-3 text-[13px]' : 'h-9 px-2 text-[11.5px]'} ${on ? 'border-sea bg-sea-50 text-sea' : 'border-line bg-white text-ink'}`
  return (
    <div ref={ref} data-testid="catalog-filterbar" className={`mt-2 flex gap-1.5 pb-1 ${desktop ? 'flex-wrap' : '-mx-3.5 overflow-x-auto px-3.5 no-scrollbar'}`}>
      {filters.map((f) => {
        const v = values[f.key] || ''
        const label = v ? f.options.find(([k]) => k === v)?.[1] || v : f.label
        return (
          <div key={f.key} className="relative">
            <button type="button" onClick={() => setOpen(open === f.key ? null : f.key)} className={pillCls(!!v)}>
              <span className="max-w-[140px] truncate">{label}</span> <ChevronDown className="size-3.5" />
            </button>
            {open === f.key && menu(f.key, [['', 'Barchasi'], ...f.options], v, (nv) => onChange({ ...values, [f.key]: nv }))}
          </div>
        )
      })}
      {sorts.length > 0 && (
        <div className="relative ml-auto">
          <button type="button" onClick={() => setOpen(open === '__sort' ? null : '__sort')} className={pillCls(false)}>
            <ArrowUpDown className="mr-0.5 size-3.5" /> {sortLabel}
          </button>
          {open === '__sort' && desktop && <div className="[&>div]:left-auto [&>div]:right-0">{menu('__sort', sorts, sort, onSort)}</div>}
        </div>
      )}
      {sheet}
    </div>
  )
}

/**
 * card: { id, href, image, kicker, title, meta: [string], extra: node, price: number|null, priceText,
 *         badge: {text, tone:'new'|'sale'|'info'}|null, rating: {value,count}|null, cart: {item}|null }
 */
/** Raqam guruhlari orasidagi bo‘shliqni bo‘linmas qiladi: "18 000 000 so‘m" -> faqat "so‘m" oldidan qator buzilishi mumkin. */
export const keepDigits = (t) => String(t ?? '').replace(/(\d)[ \u00a0\u202f](?=\d)/g, '$1\u00a0')

export function CatalogCard({ card, liked, onLike, onAdd, desktop }) {
  const badgeCls = { new: 'bg-[#22b573]', sale: 'bg-sale', info: 'bg-sea', demo: 'bg-[#f59e0b]' }
  const lineId = card.cart?.line?.id
  const qty = useCardQty(lineId)
  const priceText = keepDigits(card.priceText ?? (card.price == null ? '' : card.price === 0 ? 'Bepul' : som(card.price)))
  const priceBlock = (
    <div data-testid="catalog-price" className="max-w-full leading-tight">
      <p className={`whitespace-nowrap font-extrabold text-[#0d2a4a] ${desktop ? 'text-[14px]' : 'text-[12.5px]'}`}>{priceText}</p>
      {card.oldPrice ? <s className="block whitespace-nowrap text-[10.5px] font-medium text-muted">{keepDigits(som(card.oldPrice))}</s> : null}
    </div>
  )
  const cartCtrl = card.cart ? (
    <CardQtyStepper product={card.cart.line} lineId={lineId} onAdded={() => onAdd?.()} />
  ) : (
    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sea-50 text-sea"><ArrowRight className="size-[17px]" /></span>
  )
  return (
    <Link to={card.href} data-testid="catalog-card" className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_4px_rgb(11_31_58/0.07)] active:scale-[0.99]">
      <div className={`relative ${card.fit === 'contain' ? 'bg-white' : 'bg-[#eef3f6]'} ${desktop ? 'h-[190px]' : 'h-[150px]'}`}>
        {card.image ? <img src={card.image} alt={card.title} loading="lazy" className={`size-full ${card.fit === 'contain' ? 'object-contain p-3' : 'object-cover object-[50%_18%]'}`} /> : card.tile ? <div aria-hidden="true" className="grid size-full place-items-center bg-[linear-gradient(135deg,#0b8a95,#0b5b66)] text-[30px] font-extrabold tracking-wide text-white">{card.tile}</div> : <div className="grid size-full place-items-center text-muted"><Tag className="size-8" /></div>}
        {card.badge && <span data-testid="catalog-badge" className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${badgeCls[card.badge.tone] || badgeCls.info}`}>{card.badge.text}</span>}
        {onLike && (
          <button type="button" onClick={(e) => { e.preventDefault(); onLike() }} aria-label="Sevimlilarga" aria-pressed={liked} className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/95 shadow-[0_1px_4px_rgb(11_31_58/0.15)]">
            <Heart className={`size-[15px] ${liked ? 'fill-sale text-sale' : 'text-ink'}`} strokeWidth={2} />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col p-2">
        {card.kicker && <p className="truncate text-[10.5px] text-muted">{card.kicker}</p>}
        <h3 className={`line-clamp-2 font-bold leading-snug text-[#0d2a4a] ${desktop ? 'text-[14px]' : 'text-[12.5px]'}`}>{card.title}</h3>
        {card.rating && (
          <p data-testid="catalog-rating" className="mt-0.5 flex items-center gap-1 text-[10.5px] text-ink-2">
            {Number(card.rating.count) > 0 ? <><Star className="size-3 fill-star text-star" /> <b className="font-semibold text-ink">{card.rating.value}</b> ({card.rating.count} ta baho)</> : 'Hali baho yo‘q'}
          </p>
        )}
        {(card.meta || []).filter(Boolean).slice(0, 2).map((m) => <p key={m} className="mt-0.5 truncate text-[10.5px] text-ink-2">{m}</p>)}
        {card.extra}
        {/* qty>0: narx alohida qator (nowrap), steyper pastda to‘liq en — narx siqilmaydi */}
        {qty > 0 && card.cart ? (
          <div className="mt-auto flex flex-col gap-1.5 pt-1.5">
            {priceBlock}
            {cartCtrl}
          </div>
        ) : (
          <div className="mt-auto flex flex-wrap items-end gap-x-1.5 gap-y-1 pt-1.5">
            {priceBlock}
            <span className="ml-auto shrink-0">{cartCtrl}</span>
          </div>
        )}
      </div>
    </Link>
  )
}

/* ---------- full page ---------- */

const norm = (s) => String(s || '').toLowerCase()

// ---- Reklama (0043) -----------------------------------------------------------------
function AdCard({ ad, item, section, desktop, setToast }) {
  useEffect(() => { trackAd('view', ad.campaign_id, item.id) }, [ad.campaign_id, item.id])
  const card = { ...section.card(item), badge: { text: 'Reklama', tone: 'info' } }
  return (
    <div data-testid="ad-card" className="flex flex-col [&>a]:flex-1" onClickCapture={() => trackAd('click', ad.campaign_id, item.id)}>
      <CatalogCard card={card} desktop={desktop}
        onAdd={() => setToast(`${card.title} savatga qo‘shildi`)} />
    </div>
  )
}


/**
 * section: {
 *   key, title, subtitle, placeholder, shopActive, items, loading, emptyText,
 *   cats: [{key,label,icon}], catOf(item) -> key | key[],
 *   filters: [{key,label,options,match(item,value)}], sorts: [[key,label,fn]],
 *   text(item) -> searchable string, card(item) -> card, slides(list) -> slides,
 *   cartOf?(item) -> cart line, inCart?(items,item)
 * }
 */
export function CatalogPage({ section }) {
  const mobile = useMobile()
  const desktop = !mobile
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [values, setValues] = useState({})
  const [sort, setSort] = useState(section.sorts[0]?.[0] || '')
  const [liked, setLiked] = useState(() => new Set())
  const [toast, setToast] = useState('')
  const [allSheet, setAllSheet] = useState(false)
  const [posting, setPosting] = useState(false)
  const [mineOpen, setMineOpen] = useState(false)
  // /elonlar?joylash=1 kabi havola (bo‘sh bo‘lim posterlaridan) — shu bo‘limning e’lon oynasini ochadi.
  useEffect(() => {
    if (!section.action || !new URLSearchParams(window.location.search).get('joylash')) return
    if (ensureLogin()) setPosting(true)
  }, [section.key]) // eslint-disable-line react-hooks/exhaustive-deps
  const [limit, setLimit] = useState(24)
  const [imgOpen, setImgOpen] = useState(false)
  const [vis, setVis] = useState(null) // image-search result { name, brand, category, terms, thumb }
  useEffect(() => setLimit(24), [cat, q, values, sort, vis])
  const searchRef = useRef(null)
  const adOn = !!section.ads
  const adSearch = useAdPlacements('qidiruv', adOn)
  const adBanner = useAdPlacements('banner', adOn)
  const adCat = useAdPlacements('kategoriya', adOn)
  const gridRef = useRef(null)

  const cats = useMemo(() => {
    const present = new Set(section.items.flatMap((it) => [].concat(section.catOf(it) || [])))
    return section.cats.filter((c) => present.has(c.key))
  }, [section])
  const filters = useMemo(() => section.filters.map((f) => ({ ...f, options: f.options.filter(([v]) => section.items.some((it) => f.match(it, v))) })).filter((f) => f.options.length > 1), [section])

  const list = useMemo(() => {
    const s = norm(q.trim())
    const fn = section.sorts.find(([k]) => k === sort)?.[2]
    const out = section.items.filter((it) =>
      (cat === 'all' || [].concat(section.catOf(it) || []).includes(cat)) &&
      (!s || norm(section.text(it)).includes(s)) &&
      filters.every((f) => !values[f.key] || f.match(it, values[f.key])))
    // Image search: rank by detected keywords (same text() as the normal search); keep relevance order unless user picked a sort.
    if (vis) {
      const ranked = rankByTerms(out, section.text, vis.terms, vis.brand)
      return fn && sort !== section.sorts[0]?.[0] ? [...ranked].sort(fn) : ranked
    }
    return fn ? [...out].sort(fn) : out
  }, [section, cat, q, values, sort, filters, vis])
  // Qiziqish signallari (faqat Marketplace): kategoriya tanlash va qidiruv (1,2 s to‘xtagandan keyin; natija soni bilan).
  useEffect(() => { if (section.track && cat !== 'all') recordInterest('view', { category: cat }) }, [section.track, cat])
  const listLen = list.length
  useEffect(() => {
    const t = q.trim()
    if (!section.track || t.length < 2 || vis) return undefined
    const h = setTimeout(() => recordInterest('search', { query: t, results: listLen }), 1200)
    return () => clearTimeout(h)
  }, [section.track, q, vis]) // eslint-disable-line react-hooks/exhaustive-deps
  const inCat = (it) => cat === 'all' || [].concat(section.catOf(it) || []).includes(cat)
  // Qidiruvda: so‘rovga mos ko‘pi bilan 2 ta homiy mahsulot tepada
  const sponsored = useMemo(() => (adOn && q.trim() && !vis ? joinAds(adSearch, section.items, (it) => inCat(it) && norm(section.text(it)).includes(norm(q.trim())), 2) : []), [adOn, adSearch, section, q, cat, vis]) // eslint-disable-line react-hooks/exhaustive-deps
  const catRow = useMemo(() => (adOn && cat !== 'all' && !q.trim() && !vis ? joinAds(adCat, section.items, inCat, 8) : []), [adOn, adCat, section, cat, q, vis]) // eslint-disable-line react-hooks/exhaustive-deps
  const sponsoredIds = new Set(sponsored.map((x) => x.item.id))
  const adProps = { section, desktop, setToast }
  const active = Object.values(values).filter(Boolean).length
  // Poster: bo‘lim (yoki Marketplace turkumi) bo‘yicha; CTA ro‘yxatga tushadi yoki shu bo‘limda e’lon ochadi.
  const catLabel = section.catPosters && cat !== 'all' ? cats.find((c) => c.key === cat)?.label || '' : ''
  const baseSlides = useMemo(() => section.slides(catLabel ? section.items.filter(inCat) : section.items, {
    catLabel,
    scroll: () => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    post: () => { if (section.action && ensureLogin()) setPosting(true) },
  }), [section, catLabel]) // eslint-disable-line react-hooks/exhaustive-deps
  // Tasdiqlangan banner kampaniyalari — mavjud poster slayderining BOSHIGA (ko‘pi bilan 2 ta), keyin odatiy posterlar.
  const slides = useMemo(() => {
    const ads = adOn ? joinAds(adBanner, section.items, () => true, 2) : []
    return ads.length ? [...ads.map(({ ad, item }) => ({ id: `ad-${ad.campaign_id}`, ad, item })), ...baseSlides] : baseSlides
  }, [adOn, adBanner, section.items, baseSlides])

  const body = (
    <>
      <CatalogHeader title={section.title} subtitle={section.subtitle} desktop={desktop} action={section.action?.label} onAction={() => { if (ensureLogin()) setPosting(true) }} secondary={section.secondaryAction?.label} onSecondary={() => { if (ensureLogin()) setMineOpen(true) }} />
      <CatalogSearch value={q} onChange={setQ} placeholder={section.placeholder} onFilter={() => setAllSheet(true)} active={active} inputRef={searchRef} desktop={desktop} onImage={section.imageSearch ? () => setImgOpen(true) : undefined} />
      {vis ? (
        <ImageSearchBanner vis={vis} desktop={desktop} count={list.length} setTerms={(terms) => setVis((v) => ({ ...v, terms }))} onClear={() => setVis(null)} />
      ) : <HeroSlider slides={slides} desktop={desktop} />}
      {/* Tartib: poster → kategoriyalar → Siz uchun → mahsulotlar (barcha bo‘limlar, mobil+desktop). */}
      {cats.length > 0 && <CategoryChips cats={cats} value={cat} onChange={setCat} desktop={desktop} />}
      {section.top && !q.trim() && !vis ? section.top : null}
      {catRow.length > 0 && (
        <section data-testid="ad-cat-row" className="mt-3">
          <div className="mb-2 flex items-center gap-2"><h2 className={`font-extrabold text-[#0d2a4a] ${desktop ? 'text-[17px]' : 'text-[15px]'}`}>Tavsiya etiladi</h2><span className="rounded-full bg-sea-50 px-2 py-0.5 text-[10px] font-semibold text-sea">Reklama</span></div>
          <div className={`flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] ${desktop ? 'gap-4' : '-mx-4 px-4'}`}>
            {catRow.map(({ ad, item }) => <div key={ad.campaign_id + item.id} className={`shrink-0 ${desktop ? 'w-[220px]' : 'w-[46%]'} [&>div]:h-full`}><AdCard ad={ad} item={item} {...adProps} /></div>)}
          </div>
        </section>
      )}
      <div ref={gridRef} className="scroll-mt-2">
        <FilterBar filters={filters} values={values} onChange={setValues} sorts={section.sorts} sort={sort} onSort={setSort} desktop={desktop} />
      </div>
      <div className="mt-2.5">
        {section.loading && !section.items.length ? (
          <div className={`grid gap-2.5 ${desktop ? 'grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' : 'grid-cols-2'}`}>
            {[0, 1, 2, 3].map((k) => <div key={k} className="h-[250px] animate-pulse rounded-2xl bg-white" />)}
          </div>
        ) : list.length || sponsored.length ? (
          <div data-testid="catalog-grid" className={`grid gap-2.5 ${desktop ? 'grid-cols-3 gap-4 xl:grid-cols-4 2xl:grid-cols-5' : 'grid-cols-2'}`}>
            {sponsored.map(({ ad, item }) => <AdCard key={`ad-${ad.campaign_id}`} ad={ad} item={item} {...adProps} />)}
            {list.filter((it) => !sponsoredIds.has(it.id)).slice(0, limit).map((it) => {
              const card = demoCard(it, section.card(it))
              return (
                <CatalogCard
                  key={card.id}
                  card={card}
                  desktop={desktop}
                  liked={liked.has(card.id)}
                  onLike={() => setLiked((s) => { const n = new Set(s); if (n.has(card.id)) n.delete(card.id); else { n.add(card.id); setToast('Sevimlilarga qo‘shildi') } return n })}
                  onAdd={() => setToast(`${card.title} savatga qo‘shildi`)}
                />
              )
            })}
            {list.length > limit && (
              <button type="button" data-testid="catalog-more" onClick={() => setLimit((n) => n + 24)} className="col-span-full mx-auto mt-1 h-10 rounded-xl border border-line bg-white px-5 text-[13px] font-semibold text-sea">
                Yana ko‘rsatish ({list.length - limit})
              </button>
            )}
          </div>
) : vis ? (
          <div data-testid="image-search-empty" className="grid place-items-center rounded-2xl bg-white px-6 py-10 text-center">
            <p className="text-[15px] font-semibold text-ink">O‘xshash mahsulot topilmadi</p>
            {vis.name && <p className="mt-1 text-[12.5px] text-ink-2">Aniqlangan mahsulot: <b className="font-semibold text-[#0d2a4a]">{vis.name}</b></p>}
            <p className="mt-1 text-[12px] text-muted">So‘zlarni tahrirlang yoki boshqa rasm bilan urinib ko‘ring</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => setImgOpen(true)} className="h-9 rounded-xl bg-[#0F766E] px-4 text-[12.5px] font-semibold text-white">Boshqa rasm</button>
              {vis.name && <button type="button" onClick={() => { setQ(''); setCat('all'); setValues({}); setVis(null); setQ(vis.name) }} className="h-9 rounded-xl bg-sea-50 px-4 text-[12.5px] font-semibold text-sea">Nom bo‘yicha qidirish</button>}
            </div>
          </div>
        ) : (
          <div data-testid="catalog-empty" className="grid place-items-center rounded-2xl bg-white px-6 py-10 text-center">
            <p className="text-[14px] font-semibold text-ink">{section.items.length ? 'Hech narsa topilmadi' : section.emptyText || 'Hozircha e’lonlar yo‘q'}</p>
            {section.items.length > 0 && (
              <>
                <p className="mt-1 text-[12px] text-muted">Qidiruv yoki filtrlarni o‘zgartirib ko‘ring</p>
                <button type="button" onClick={() => { setQ(''); setCat('all'); setValues({}) }} className="mt-3 h-9 rounded-xl bg-sea-50 px-4 text-[12.5px] font-semibold text-sea">Filtrlarni tozalash</button>
              </>
            )}
          </div>
        )}
      </div>
      {allSheet && (
        <AllFilters filters={filters} values={values} desktop={desktop} count={(v) => section.items.filter((it) => (cat === 'all' || [].concat(section.catOf(it) || []).includes(cat)) && filters.every((f) => !v[f.key] || f.match(it, v[f.key]))).length} onClose={() => setAllSheet(false)} onApply={(v) => { setValues(v); setAllSheet(false) }} />
      )}
      {posting && section.action.render({ close: () => setPosting(false), done: (msg) => { setPosting(false); setQ(''); setCat('all'); setValues({}); setToast(msg || 'E’loningiz moderatsiyaga yuborildi'); window.scrollTo({ top: 0, behavior: 'smooth' }) } })}
      {mineOpen && section.secondaryAction?.render?.({ close: () => setMineOpen(false) })}
      {imgOpen && <ImageSearchDialog desktop={desktop} onClose={() => setImgOpen(false)} onResult={(r) => { setImgOpen(false); setQ(''); setCat('all'); setValues({}); setVis({ name: r.found ? r.name : '', brand: r.brand, category: r.category, terms: r.found ? termsFrom(r) : [], thumb: r.thumb }); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />}
      <MobileToast text={toast} onClose={() => setToast('')} bottom={desktop ? 24 : 76} />
    </>
  )

  if (desktop) {
    return (
      <ShopLayout active={section.shopActive} search="plain" placeholder={section.placeholder}>
        <div data-testid={`catalog-${section.key}`} className="pt-4">{body}</div>
      </ShopLayout>
    )
  }
  return (
    <div data-testid={`catalog-${section.key}`} className="min-h-screen bg-[#f6f9fb] pb-[calc(var(--bottom-nav-h,58px)+var(--bottom-nav-float,14px)+max(env(safe-area-inset-bottom,0px),var(--safe-bottom-sim,0px))+24px)]">
      <div className="px-3.5 pt-3">
        <MobileTopBar onSearch={() => searchRef.current?.focus()} onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />
        {body}
      </div>
      <MobileTabBar />
    </div>
  )
}

function AllFilters({ filters, values, count, onClose, onApply, desktop }) {
  const [v, setV] = useState(values)
  const content = (
    <>
      {filters.length === 0 && <p className="mt-3 text-[13px] text-muted">Bu bo‘limda qo‘shimcha filtrlar yo‘q.</p>}
      {filters.map((f) => (
        <div key={f.key}>
          <p className="mt-4 text-[13px] font-semibold text-ink">{f.label}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {f.options.map(([val, l]) => {
              const on = v[f.key] === val
              return (
                <button key={val} type="button" aria-pressed={on} onClick={() => setV((x) => ({ ...x, [f.key]: on ? '' : val }))} className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[12.5px] font-medium ${on ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`}>
                  {on && <Check className="size-3.5" />} {l}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
  const footer = (
    <>
      <button type="button" onClick={() => setV({})} className="h-12 rounded-xl border border-line px-4 text-[13.5px] font-semibold text-ink">Tozalash</button>
      <button type="button" onClick={() => onApply(v)} className="h-12 flex-1 rounded-xl bg-sea text-[14px] font-semibold text-white">{count(v)} ta natijani ko‘rsatish</button>
    </>
  )
  if (!desktop) return <BottomSheet title="Filtrlar" onClose={onClose} footer={footer}>{content}</BottomSheet>
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b1f3a]/40 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="max-h-[80vh] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-white p-5">
        <div className="flex items-center justify-between"><p className="text-[18px] font-bold text-ink">Filtrlar</p><button type="button" onClick={onClose} aria-label="Yopish"><X className="size-5" /></button></div>
        {content}
        <div className="mt-5 flex gap-2">{footer}</div>
      </div>
    </div>
  )
}
