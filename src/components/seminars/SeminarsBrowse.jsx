import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Award, CalendarDays, Check, ChevronRight, GraduationCap, Heart, MapPin, SlidersHorizontal, UserRound, Users, X,
} from 'lucide-react'
import { useSeminarsSection } from '../catalog/sections'
import { CategoryTile, iconById, iconFor } from '../../icons/categoryIcons'
import { seminarChips, seminarPrice } from '../../seminarsData'
import { useHub } from '../../hubStore'
import HubNotice from '../HubNotice'
import { useMobile } from '../../useMobile'
import { MobileTopBar, MobileToast } from '../mobile/parts'
import MobileTabBar from '../mobile/MobileTabBar'
import { BottomSheet } from '../mobile/MobileSeminars'
import ShopLayout from '../market/ShopLayout'
import { toggleSaved, useSeminarStore } from '../mobile/seminarStore'
import { sectionPoster } from '../../posters/sectionPosters'
import { dateLine, durationBadge, featureBits, formatBadge, hasCertificate, seatsLabel } from '../../seminarPresent'

const CAT_ORDER = ['impl', 'endo', 'surg', 'orto', 'estet', 'paro', 'other']

function norm(s) {
  return String(s || '').toLowerCase()
}

export default function SeminarsBrowse() {
  const mobile = useMobile()
  const section = useSeminarsSection()
  const [q, setQ] = useState('')
  const body = <BrowseBody section={section} desktop={!mobile} externalQ={q} />
  if (!mobile) {
    return (
      <ShopLayout active="seminars" search="plain" placeholder={section.placeholder} onQuery={setQ}>
        <div data-testid="catalog-seminarlar" className="pt-4">{body}</div>
      </ShopLayout>
    )
  }
  return body
}

function BrowseBody({ section, desktop, externalQ }) {
  const hub = useHub()
  const store = useSeminarStore()
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [values, setValues] = useState({})
  const [showPast, setShowPast] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [toast, setToast] = useState('')
  const searchRef = useRef(null)
  const query = desktop ? externalQ : q

  const filters = useMemo(() => (section.filters || []).map((f) => ({
    ...f,
    options: f.options.filter(([v]) => section.items.some((it) => f.match(it, v))),
  })).filter((f) => f.options.length > 0), [section])

  const items = useMemo(() => {
    const fn = section.sorts?.[0]?.[2]
    const s = norm(query).trim()
    const out = section.items.filter((it) =>
      (cat === 'all' || [].concat(section.catOf(it) || []).includes(cat)) &&
      (!s || norm(section.text(it)).includes(s)) &&
      filters.every((f) => !values[f.key] || f.match(it, values[f.key])))
    return fn ? [...out].sort(fn) : out
  }, [section, cat, query, values, filters])

  const upcoming = items.filter((s) => !s.past && !s.cancelled)
  const shown = showPast || !upcoming.length ? items : upcoming
  const heroItems = (upcoming.length ? upcoming : items).slice(0, 6)
  const activeFilters = Object.values(values).filter(Boolean).length
  const cats = [...seminarChips.filter((c) => c.key !== 'all')].sort((a, b) => CAT_ORDER.indexOf(a.key) - CAT_ORDER.indexOf(b.key))

  const reset = () => { setCat('all'); setQ(''); setValues({}); setShowPast(false) }
  const seeAll = () => { setCat('all'); setQ(''); setValues({}); setShowPast(true) }

  const page = (
    <>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 data-testid="catalog-title" className={`${desktop ? 'text-[30px]' : 'text-[26px]'} font-extrabold leading-tight tracking-tight text-[#12263a]`}>Seminarlar</h1>
          <p className={`${desktop ? 'text-[14px]' : 'mt-0.5 text-[13px]'} text-[#6b7686]`}>{section.subtitle}</p>
        </div>
      </div>
      <HubNotice hub={hub} />
      {!desktop && searchOpen && (
        <label className="mt-3 flex h-11 items-center gap-2 rounded-2xl border border-[#e3eaef] bg-white px-3.5">
          <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder={section.placeholder} className="min-w-0 flex-1 bg-transparent text-[13px] text-[#12263a] outline-none placeholder:text-[#8aa0a8]" />
          {q && <button type="button" aria-label="Tozalash" onClick={() => setQ('')} className="text-[#8aa0a8]"><X className="size-4" /></button>}
          <button type="button" aria-label="Filtrlar" onClick={() => setFiltersOpen(true)} className="relative text-[#0c8f86]">
            <SlidersHorizontal className="size-[18px]" />
            {activeFilters > 0 && <span className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-[#0c8f86] text-[9px] font-bold text-white">{activeFilters}</span>}
          </button>
        </label>
      )}
      {hub.loading && !section.items.length ? (
        <div className="mt-3 h-[176px] animate-pulse rounded-[22px] bg-white" />
      ) : (
        <SeminarHero items={heroItems} desktop={desktop} empty={!section.items.length} />
      )}
      <div data-testid="catalog-chips" className={`mt-3.5 flex gap-3 overflow-x-auto pb-1 no-scrollbar ${desktop ? '' : '-mx-3.5 px-3.5'}`}>
        <CatTile label="Barchasi" icon={iconById('all')} active={cat === 'all'} desktop={desktop} onClick={() => setCat('all')} />
        {cats.map(({ key, label }) => (
          <CatTile key={key} label={label} icon={iconFor('seminarlar', key, label)} active={cat === key} desktop={desktop} onClick={() => setCat(cat === key ? 'all' : key)} />
        ))}
        <Link to="/talim" className={`flex shrink-0 flex-col items-center gap-1.5 ${desktop ? 'w-[96px]' : 'w-[74px]'}`} title="Ta’lim">
          <CategoryTile icon={GraduationCap} active={false} size={desktop ? 'lg' : 'md'} />
          <span className={`line-clamp-2 w-full text-center leading-[1.15] text-[#5c6d7c] ${desktop ? 'text-[12px]' : 'text-[10px]'}`}>Ta’lim</span>
        </Link>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <h2 className={`${desktop ? 'text-[18px]' : 'text-[16px]'} font-extrabold tracking-tight text-[#12263a]`}>
          {showPast ? 'Barcha seminarlar' : 'Yaqin kunlardagi seminarlar'}
        </h2>
        <button type="button" onClick={showPast ? () => setShowPast(false) : seeAll} className="inline-flex shrink-0 items-center gap-0.5 text-[12.5px] font-semibold text-[#0c8f86]">
          {showPast ? 'Yaqinlarini ko‘rish' : 'Barchasini ko‘rish'} <ChevronRight className="size-4" />
        </button>
      </div>
      {desktop && filters.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {filters.map((f) => {
            const v = values[f.key] || ''
            const label = v ? f.options.find(([k]) => k === v)?.[1] || v : f.label
            return (
              <label key={f.key} className={`relative flex h-9 items-center rounded-xl border bg-white px-3 text-[12.5px] font-medium ${v ? 'border-[#0c8f86] text-[#0c8f86]' : 'border-[#e3eaef] text-[#12263a]'}`}>
                {label}
                <select aria-label={f.label} value={v} onChange={(e) => setValues((x) => ({ ...x, [f.key]: e.target.value }))} className="absolute inset-0 cursor-pointer opacity-0">
                  <option value="">Barchasi</option>
                  {f.options.map(([val, l]) => <option key={val} value={val}>{l}</option>)}
                </select>
              </label>
            )
          })}
          {activeFilters > 0 && <button type="button" onClick={() => setValues({})} className="h-9 px-2 text-[12.5px] font-semibold text-[#0c8f86]">Tozalash</button>}
        </div>
      )}
      <div className={`mt-3 ${desktop ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-2.5'}`}>
        {shown.map((s) => (
          <SeminarRow
            key={s.id}
            s={s}
            desktop={desktop}
            saved={store.saved.includes(s.id)}
            onSave={() => setToast(toggleSaved(s.id) ? 'Seminar saqlandi' : 'Saqlanganlardan olib tashlandi')}
          />
        ))}
      </div>
      {!shown.length && !hub.loading && (
        <div data-testid="catalog-empty" className="mt-3 grid place-items-center rounded-2xl bg-white px-6 py-10 text-center">
          <p className="text-[14px] font-semibold text-[#12263a]">{section.items.length ? 'Seminarlar topilmadi' : 'Hozircha seminarlar yo‘q'}</p>
          {section.items.length > 0 && (
            <button type="button" onClick={reset} className="mt-3 h-9 rounded-xl bg-[#e7f5f4] px-4 text-[12.5px] font-semibold text-[#0c8f86]">Filtrlarni tozalash</button>
          )}
        </div>
      )}
      {filtersOpen && (
        <BottomSheet
          title="Filtrlar"
          onClose={() => setFiltersOpen(false)}
          footer={(
            <>
              <button type="button" onClick={() => setValues({})} className="h-12 rounded-xl border border-[#e3eaef] px-4 text-[13.5px] font-semibold">Tozalash</button>
              <button type="button" onClick={() => setFiltersOpen(false)} className="h-12 flex-1 rounded-xl bg-[#0c8f86] text-[14px] font-semibold text-white">Ko‘rsatish</button>
            </>
          )}
        >
          {filters.map((f) => (
            <div key={f.key}>
              <p className="mt-4 text-[13px] font-semibold">{f.label}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {f.options.map(([val, l]) => {
                  const on = values[f.key] === val
                  return (
                    <button key={val} type="button" aria-pressed={on} onClick={() => setValues((x) => ({ ...x, [f.key]: on ? '' : val }))} className={`flex h-9 items-center gap-1 rounded-xl border px-3 text-[12.5px] font-medium ${on ? 'border-[#0c8f86] bg-[#e7f5f4] text-[#0c8f86]' : 'border-[#e3eaef]'}`}>
                      {on && <Check className="size-3.5" />} {l}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {!filters.length && <p className="mt-3 text-[13px] text-[#6b7686]">Qo‘shimcha filtr yo‘q.</p>}
        </BottomSheet>
      )}
      <MobileToast text={toast} onClose={() => setToast('')} bottom={desktop ? 24 : 76} />
    </>
  )

  if (desktop) return page
  return (
    <div data-testid="catalog-seminarlar" className="min-h-screen bg-[#f4f7f8] pb-[calc(var(--bottom-nav-h,58px)+var(--bottom-nav-float,14px)+max(env(safe-area-inset-bottom,0px),var(--safe-bottom-sim,0px))+24px)]">
      <div className="px-3.5 pt-3">
        <MobileTopBar onSearch={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 40) }} onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />
        {page}
      </div>
      <MobileTabBar />
    </div>
  )
}

function CatTile({ label, icon: Icon, active, onClick, desktop }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`flex shrink-0 flex-col items-center gap-1.5 ${desktop ? 'w-[96px]' : 'w-[74px]'}`}>
      <CategoryTile icon={Icon} active={active} size={desktop ? 'lg' : 'md'} />
      <span className={`line-clamp-2 w-full text-center leading-[1.15] ${desktop ? 'text-[12px]' : 'text-[10px]'} ${active ? 'font-semibold text-[#0c8f86]' : 'text-[#5c6d7c]'}`}>{label}</span>
    </button>
  )
}

function SeminarHero({ items, desktop, empty }) {
  const [i, setI] = useState(0)
  const touch = useRef(null)
  const n = items.length
  const index = n ? i % n : 0
  if (!n) {
    const poster = sectionPoster('seminarlar', 0)
    return (
      <div data-testid="catalog-hero" className={`relative mt-3 overflow-hidden rounded-[22px] bg-gradient-to-br from-[#0c8f86] to-[#064e4a] text-white ${desktop ? 'h-[240px]' : 'h-[176px]'}`}>
        <div className={`flex h-full max-w-[80%] flex-col justify-center ${desktop ? 'px-8' : 'px-4'}`}>
          <p className={`font-extrabold leading-tight ${desktop ? 'text-[32px]' : 'text-[22px]'}`}>{empty ? poster.title : 'Yaqin seminar yo‘q'}</p>
          <p className={`mt-1 text-white/85 ${desktop ? 'text-[15px]' : 'text-[12.5px]'}`}>{poster.text}</p>
          {empty && <Link to="/tashkilotchi-bolish" className="mt-3 inline-flex h-9 w-fit items-center gap-1 rounded-full bg-white px-4 text-[13px] font-semibold text-[#0d3b44]">{poster.cta} <ArrowRight className="size-4" /></Link>}
        </div>
      </div>
    )
  }
  return (
    <div
      data-testid="catalog-hero"
      className={`relative mt-3 overflow-hidden rounded-[22px] bg-[#08383c] ${desktop ? 'h-[250px]' : 'h-[184px]'}`}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (touch.current == null || n < 2) return
        const dx = e.changedTouches[0].clientX - touch.current
        if (Math.abs(dx) > 40) setI((x) => (x + (dx < 0 ? 1 : n - 1)) % n)
        touch.current = null
      }}
    >
      <div className="flex h-full transition-transform duration-500" style={{ transform: `translateX(-${index * 100}%)` }}>
        {items.map((s) => <HeroSlide key={s.id} s={s} desktop={desktop} />)}
      </div>
      {n > 1 && (
        <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5" data-testid="catalog-hero-dots">
          {items.map((s, k) => (
            <button key={s.id} type="button" aria-label={`${k + 1}-slayd`} onClick={() => setI(k)} className={`h-1.5 rounded-full transition-all ${k === index ? 'w-4 bg-white' : 'w-1.5 bg-white/55'}`} />
          ))}
        </div>
      )}
    </div>
  )
}

function HeroSlide({ s, desktop }) {
  const bits = featureBits(s)
  const closed = s.past || s.cancelled || s.regClosed
  const href = closed ? `/seminarlar/${s.id}` : `/seminarlar/${s.id}/royxat`
  const headline = s.catName || seminarChips.find((c) => c.key === s.cat)?.label || s.title
  return (
    <div className="relative flex h-full w-full shrink-0 bg-gradient-to-br from-[#08383c] via-[#0a5552] to-[#0c8f86]">
      <div className={`relative z-[1] flex h-full flex-col justify-center text-white ${desktop ? 'w-[56%] px-8' : 'w-[58%] px-4'}`}>
        <span className="w-fit rounded-full bg-[#149e96] px-2.5 py-1 text-[11px] font-semibold">{durationBadge(s)}</span>
        <p className={`mt-2 font-extrabold leading-[1.05] tracking-tight ${desktop ? 'text-[40px]' : 'line-clamp-2 text-[26px]'}`}>{headline}</p>
        {bits.length > 0 && (
          <p className={`mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-white/90 ${desktop ? 'text-[14px]' : 'text-[11.5px]'}`}>
            {bits.map((b) => <span key={b} className="inline-flex items-center gap-1"><Check className="size-3.5" strokeWidth={2.6} /> {b}</span>)}
          </p>
        )}
        <Link to={href} className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-white font-semibold text-[#102a30] ${desktop ? 'h-11 px-5 text-[14px]' : 'h-9 px-3.5 text-[12.5px]'}`}>
          {closed ? 'Batafsil' : 'Ro‘yxatdan o‘tish'} <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className={`flex h-full min-w-0 flex-1 items-center justify-center ${desktop ? 'p-4 pr-6' : 'py-3 pr-2.5'}`}>
        {s.image && <img src={s.image} alt="" className="max-h-full max-w-full rounded-xl object-contain shadow-[0_8px_24px_-12px_rgb(0_0_0/0.45)]" />}
      </div>
    </div>
  )
}

function SeminarRow({ s, saved, onSave, desktop }) {
  const badge = formatBadge(s)
  const seats = seatsLabel(s)
  const cert = hasCertificate(s)
  const free = !(Number(s.price) > 0)
  const closed = s.past || s.cancelled
  return (
    <article data-testid="seminar-card" className="relative flex gap-3 rounded-[20px] bg-white p-2.5 shadow-[0_8px_24px_-18px_rgb(16_42_58/0.45)]">
      <Link to={`/seminarlar/${s.id}`} className={`relative grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#e7f3f4] ${desktop ? 'h-[168px] w-[156px]' : 'h-[148px] w-[118px]'}`}>
        {s.image ? <img src={s.image} alt="" className="max-h-full max-w-full object-contain" /> : null}
        {badge && <span className={`absolute left-1.5 top-1.5 max-w-[calc(100%-12px)] truncate rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold text-white ${badge.className}`}>{badge.label}</span>}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col py-0.5 pr-1">
        <button type="button" onClick={onSave} aria-label="Saqlash" aria-pressed={saved} className="absolute right-2.5 top-2.5 grid size-7 place-items-center text-[#8aa0a8]">
          <Heart className={`size-[18px] ${saved ? 'fill-[#e5323d] text-[#e5323d]' : ''}`} strokeWidth={1.8} />
        </button>
        <Link to={`/seminarlar/${s.id}`} className={`line-clamp-2 pr-6 font-extrabold uppercase leading-[1.2] tracking-[-0.02em] text-[#143044] ${desktop ? 'text-[14.5px]' : 'text-[12.5px]'}`}>{s.title}</Link>
        {s.speaker?.name && <Meta icon={UserRound} text={s.speaker.name} />}
        {s.dateLabel && <Meta icon={CalendarDays} text={dateLine(s)} />}
        {s.placeLabel && <Meta icon={MapPin} text={s.placeLabel} />}
        {(seats || cert) && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {seats && <span className="inline-flex items-center gap-1 rounded-lg bg-[#f3f6f8] px-1.5 py-1 text-[10.5px] font-medium text-[#3d5566]"><Users className="size-3 text-[#0c8f86]" /> {seats}</span>}
            {cert && <span className="inline-flex items-center gap-1 rounded-lg bg-[#f3f6f8] px-1.5 py-1 text-[10.5px] font-medium text-[#3d5566]"><Award className="size-3 text-[#0c8f86]" /> Sertifikat</span>}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className={`text-[15px] font-extrabold tracking-tight ${free ? 'text-[#0c8f86]' : 'text-[#143044]'}`}>{seminarPrice(s.price)}</span>
          {closed ? (
            <span className="rounded-xl bg-[#eef2f4] px-2.5 py-1.5 text-[11px] font-semibold text-[#7b8b98]">{s.cancelled ? 'Bekor qilingan' : 'Yakunlangan'}</span>
          ) : (
            <Link to={`/seminarlar/${s.id}`} className="inline-flex h-9 items-center gap-1 rounded-xl bg-[#0c8f86] px-3 text-[12.5px] font-semibold text-white active:scale-[0.98]">
              Batafsil <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}

function Meta({ icon: Icon, text }) {
  return (
    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#5c6e7c]">
      <Icon className="size-3.5 shrink-0 text-[#0c8f86]" strokeWidth={1.8} />
      <span className="truncate">{text}</span>
    </p>
  )
}
