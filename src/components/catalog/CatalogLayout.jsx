import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../cart'
import { Plus, Search, SlidersHorizontal, ArrowRight, ChevronDown, ArrowUpDown, Heart, Star, ShoppingCart, Check, X, LayoutGrid, Tag } from 'lucide-react'
import { useMobile } from '../../useMobile'
import { BottomSheet } from '../mobile/MobileSeminars'
import { MobileTopBar, MobileToast } from '../mobile/parts'
import MobileTabBar from '../mobile/MobileTabBar'
import ShopLayout from '../market/ShopLayout'
import { som } from '../../marketData'

/* ---------- building blocks ---------- */

export function CatalogHeader({ title, subtitle, desktop, action, onAction }) {
  return (
    <div className="flex items-end justify-between gap-3">
     <div className="min-w-0">
      <h1 data-testid="catalog-title" className={`${desktop ? 'text-[30px]' : 'mt-2.5 text-[24px]'} font-extrabold leading-tight tracking-tight text-[#0d2a4a]`}>{title}</h1>
      {subtitle && <p className={`${desktop ? 'text-[14px]' : 'text-[12px]'} text-ink-2`}>{subtitle}</p>}
     </div>
      {action && (
        <button type="button" onClick={onAction} className={`flex shrink-0 items-center gap-1 rounded-xl bg-sea font-semibold text-white active:scale-[0.97] ${desktop ? 'h-11 px-4 text-[14px]' : 'h-9 px-3 text-[12px]'}`}>
          <Plus className="size-4" strokeWidth={2.4} /> {action}
        </button>
      )}
    </div>
  )
}

export function CatalogSearch({ value, onChange, placeholder, onFilter, active, inputRef, desktop }) {
  const h = desktop ? 'h-12' : 'h-11'
  return (
    <div className="mt-3 flex gap-2">
      <label className={`flex ${h} min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-line/70 bg-white px-3.5`}>
        <Search className="size-[18px] shrink-0 text-ink-2" />
        <input ref={inputRef} type="search" data-testid="catalog-search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted" />
        {value && <button type="button" onClick={() => onChange('')} aria-label="Tozalash" className="text-muted"><X className="size-4" /></button>}
      </label>
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
  if (!n) return null
  return (
    <div
      data-testid="catalog-hero"
      className={`relative mt-3 overflow-hidden rounded-2xl ${desktop ? 'h-[230px]' : 'h-[150px]'}`}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (touch.current == null || n < 2) return
        const dx = e.changedTouches[0].clientX - touch.current
        if (Math.abs(dx) > 40) setI((x) => (x + (dx < 0 ? 1 : n - 1)) % n)
        touch.current = null
      }}
    >
      <div className="flex h-full transition-transform duration-500" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s) => <Slide key={s.id} s={s} desktop={desktop} />)}
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

function Slide({ s, desktop }) {
  const imgs = (s.images || []).filter(Boolean).slice(0, 2)
  const Btn = s.href ? Link : 'button'
  return (
    <div className="relative h-full w-full shrink-0 bg-gradient-to-r from-[#e3f3f4] via-[#eaf5f7] to-[#d7ecf0]">
      {imgs.length > 0 && (
        <div className={`absolute inset-y-0 right-0 flex ${desktop ? 'w-[46%]' : 'w-[50%]'}`}>
          {imgs.map((src) => <img key={src} src={src} alt="" className={`h-full ${imgs.length > 1 ? 'w-1/2' : 'w-full'} object-cover object-[50%_15%]`} />)}
        </div>
      )}
      <div className="absolute inset-y-0 left-0 w-[64%] bg-gradient-to-r from-[#e6f4f5] via-[#e6f4f5]/95 to-transparent" />
      <div className={`relative flex h-full flex-col justify-center ${desktop ? 'max-w-[54%] pl-8' : 'max-w-[64%] pl-3.5'}`}>
        <p className={`${desktop ? 'text-[28px]' : 'text-[17px]'} line-clamp-2 font-extrabold leading-[1.15] text-[#0d2a4a]`}>
          {s.title} {s.accent && <span className="block text-sea">{s.accent}</span>}
        </p>
        {s.text && <p className={`mt-1 line-clamp-2 ${desktop ? 'max-w-[380px] text-[14px]' : 'max-w-[170px] text-[10.5px]'} leading-snug text-ink-2`}>{s.text}</p>}
        {s.cta && (
          <Btn {...(s.href ? { to: s.href } : { type: 'button', onClick: s.onClick })} className={`mt-2.5 flex w-fit items-center gap-1.5 rounded-xl bg-sea font-semibold text-white active:scale-[0.97] ${desktop ? 'h-11 px-5 text-[14px]' : 'h-9 px-3.5 text-[12px]'}`}>
            {s.cta} <ArrowRight className="size-3.5" />
          </Btn>
        )}
      </div>
    </div>
  )
}

/** cats: [{ key, label, icon }] — 'all' (Barchasi) is always prepended. */
export function CategoryChips({ cats, value, onChange, desktop }) {
  const all = [{ key: 'all', label: 'Barchasi', icon: LayoutGrid }, ...cats]
  return (
    <div data-testid="catalog-chips" className={`mt-3 flex gap-2.5 overflow-x-auto pb-1 no-scrollbar ${desktop ? '' : '-mx-3.5 px-3.5'}`}>
      {all.map(({ key, label, icon: Icon = Tag }) => {
        const on = value === key
        return (
          <button key={key} type="button" aria-pressed={on} onClick={() => onChange(on && key !== 'all' ? 'all' : key)} className={`flex shrink-0 flex-col items-center gap-1 ${desktop ? 'w-[92px]' : 'w-[64px]'}`}>
            <span className={`grid place-items-center rounded-2xl transition ${desktop ? 'size-[64px]' : 'size-[54px]'} ${on ? 'bg-sea text-white shadow-[0_6px_14px_-6px_rgb(11_138_149/0.7)]' : 'border border-line/70 bg-white text-[#1f5fa8]'}`}>
              <Icon className={desktop ? 'size-[28px]' : 'size-[26px]'} strokeWidth={1.5} />
            </span>
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
export function CatalogCard({ card, liked, onLike, added, onAdd, desktop }) {
  const badgeCls = { new: 'bg-[#22b573]', sale: 'bg-sale', info: 'bg-sea' }
  return (
    <Link to={card.href} data-testid="catalog-card" className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_4px_rgb(11_31_58/0.07)] active:scale-[0.99]">
      <div className={`relative bg-[#eef3f6] ${desktop ? 'h-[190px]' : 'h-[150px]'}`}>
        {card.image ? <img src={card.image} alt={card.title} loading="lazy" className={`size-full ${card.fit === 'contain' ? 'object-contain p-2' : 'object-cover object-[50%_18%]'}`} /> : <div className="grid size-full place-items-center text-muted"><Tag className="size-8" /></div>}
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
            <Star className="size-3 fill-star text-star" /> <b className="font-semibold text-ink">{card.rating.value}</b> ({card.rating.count} ta baho)
          </p>
        )}
        {(card.meta || []).filter(Boolean).slice(0, 2).map((m) => <p key={m} className="mt-0.5 truncate text-[10.5px] text-ink-2">{m}</p>)}
        {card.extra}
        <div className="mt-auto flex items-center justify-between gap-1 pt-1.5">
          <span className="min-w-0 truncate whitespace-nowrap text-[14px] font-extrabold text-[#0d2a4a]">
            {card.priceText ?? (card.price == null ? '' : card.price === 0 ? 'Bepul' : som(card.price))}
            {card.oldPrice ? <s className="ml-1 text-[10.5px] font-medium text-muted">{som(card.oldPrice)}</s> : null}
          </span>
          {card.cart ? (
            <button type="button" onClick={(e) => { e.preventDefault(); onAdd() }} aria-label={added ? 'Savatda' : 'Savatga qo‘shish'} className={`grid size-9 shrink-0 place-items-center rounded-xl active:scale-95 ${added ? 'bg-sea-50 text-sea ring-1 ring-sea/40' : 'bg-sea text-white'}`}>
              {added ? <Check className="size-[18px]" strokeWidth={2.4} /> : <ShoppingCart className="size-[17px]" />}
            </button>
          ) : (
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sea-50 text-sea"><ArrowRight className="size-[17px]" /></span>
          )}
        </div>
      </div>
    </Link>
  )
}

/* ---------- full page ---------- */

const norm = (s) => String(s || '').toLowerCase()

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
  const navigate = useNavigate()
  const { items: cartItems, add } = useCart()
  const desktop = !mobile
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [values, setValues] = useState({})
  const [sort, setSort] = useState(section.sorts[0]?.[0] || '')
  const [liked, setLiked] = useState(() => new Set())
  const [toast, setToast] = useState('')
  const [allSheet, setAllSheet] = useState(false)
  const [posting, setPosting] = useState(false)
  const [limit, setLimit] = useState(24)
  useEffect(() => setLimit(24), [cat, q, values, sort])
  const searchRef = useRef(null)
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
    return fn ? [...out].sort(fn) : out
  }, [section, cat, q, values, sort, filters])
  const active = Object.values(values).filter(Boolean).length
  const slides = useMemo(() => section.slides(section.items, () => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })), [section])

  const body = (
    <>
      <CatalogHeader title={section.title} subtitle={section.subtitle} desktop={desktop} action={section.action?.label} onAction={() => setPosting(true)} />
      <CatalogSearch value={q} onChange={setQ} placeholder={section.placeholder} onFilter={() => setAllSheet(true)} active={active} inputRef={searchRef} desktop={desktop} />
      <HeroSlider slides={slides} desktop={desktop} />
      {cats.length > 0 && <CategoryChips cats={cats} value={cat} onChange={setCat} desktop={desktop} />}
      <div ref={gridRef} className="scroll-mt-2">
        <FilterBar filters={filters} values={values} onChange={setValues} sorts={section.sorts} sort={sort} onSort={setSort} desktop={desktop} />
      </div>
      <div className="mt-2.5">
        {section.loading && !section.items.length ? (
          <div className={`grid gap-2.5 ${desktop ? 'grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' : 'grid-cols-2'}`}>
            {[0, 1, 2, 3].map((k) => <div key={k} className="h-[250px] animate-pulse rounded-2xl bg-white" />)}
          </div>
        ) : list.length ? (
          <div data-testid="catalog-grid" className={`grid gap-2.5 ${desktop ? 'grid-cols-3 gap-4 xl:grid-cols-4 2xl:grid-cols-5' : 'grid-cols-2'}`}>
            {list.slice(0, limit).map((it) => {
              const card = section.card(it)
              const added = card.cart ? cartItems.some((x) => String(x.id).startsWith(card.cart.prefix)) : false
              return (
                <CatalogCard
                  key={card.id}
                  card={card}
                  desktop={desktop}
                  liked={liked.has(card.id)}
                  onLike={() => setLiked((s) => { const n = new Set(s); if (n.has(card.id)) n.delete(card.id); else { n.add(card.id); setToast('Sevimlilarga qo‘shildi') } return n })}
                  added={added}
                  onAdd={() => { if (added) navigate('/savatcha', { state: { from: section.key } }); else { add(card.cart.line); setToast(`${card.title} savatga qo‘shildi`) } }}
                />
              )
            })}
            {list.length > limit && (
              <button type="button" data-testid="catalog-more" onClick={() => setLimit((n) => n + 24)} className="col-span-full mx-auto mt-1 h-10 rounded-xl border border-line bg-white px-5 text-[13px] font-semibold text-sea">
                Yana ko‘rsatish ({list.length - limit})
              </button>
            )}
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
      {posting && section.action.render({ close: () => setPosting(false), done: (msg) => { setPosting(false); setQ(''); setCat('all'); setValues({}); setToast(msg || 'E’loningiz joylandi'); window.scrollTo({ top: 0, behavior: 'smooth' }) } })}
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
    <div data-testid={`catalog-${section.key}`} className="min-h-screen bg-[#f6f9fb] pb-[calc(var(--bottom-nav-h,64px)+env(safe-area-inset-bottom,0px)+24px)]">
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
