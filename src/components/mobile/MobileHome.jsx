import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, ShoppingCart, SlidersHorizontal, CalendarDays, Package, Shirt, GraduationCap, BookOpen, Wrench,
  FlaskConical, ArrowRight, ChevronRight, MapPin, Clock, FileText, Heart, Star, MoreVertical, X,
} from 'lucide-react'
import { useCart } from '../../cart'
import { profileStore, useProfile } from '../../profileStore'
import { marketProducts, som } from '../../marketData'
import { useMarket } from '../../buyerApi'
import { useFeed } from '../../communityFeed'
import { useCatalogVersion } from '../../recordSync'
import { publicRecords, useHub } from '../../hubStore'
import { seminarCard } from '../../seminarsData'
import MobileTabBar from './MobileTabBar'
import { MobileTopBar, MobileToast } from './parts'
import { initialsOf, looksLikeDemoName } from '../../demoPurge'
import { useSession } from '../../sessionStore'
import { SectionIcons, MenuIcons } from '../tealIcons'

const QUICK = [
  { to: '/seminarlar', label: 'Seminarlar', icon: SectionIcons.seminarlar, color: '#14a39a', bg: '#e3f6f3' },
  { to: '/marketplace', label: 'Marketplace', icon: SectionIcons.marketplace, color: '#2f6fe4', bg: '#e8f0fd' },
  { to: '/ortiqcha', label: 'Ortiqcha material', icon: SectionIcons.ortiqcha, color: '#f08a24', bg: '#fdf0e3' },
  { to: '/forma', label: 'Forma', icon: Shirt, color: '#7c4ddb', bg: '#efe8fc' },
  { to: '/talim', label: 'Ta’lim', icon: MenuIcons.talim, color: '#e5486e', bg: '#fde8ee' },
  { to: '/kitoblar', label: 'Kitoblar', icon: SectionIcons.kitoblar, color: '#2f6fe4', bg: '#e8f0fd' },
  { to: '/ustalar', label: 'Ustalar', icon: WrenchIcon, color: '#14a39a', bg: '#e3f6f3' },
  { to: '/jihozlar', label: 'Laboratoriya', icon: SectionIcons.jihozlar, color: '#7c4ddb', bg: '#efe8fc' },
]

const SECTIONS = [
  ...QUICK.map((q) => ({ to: q.to, title: q.label, kind: 'Bo‘lim' })),
  { to: '/klinika', title: 'Mening klinikam', kind: 'Bo‘lim' },
  { to: '/community', title: 'Hamjamiyat', kind: 'Bo‘lim' },
  { to: '/ishlar', title: 'Vakansiyalar', kind: 'Bo‘lim' },
]

export default function MobileHome() {
  useCatalogVersion()
  const market = useMarket()
  const deals = market.products.slice(0, 2)
  const { add } = useCart()
  const profile = useProfile()
  const session = useSession()
  const feed = useFeed()
  const rawHello = profile.accountLive ? (profile.name || session.profile?.full_name || session.profile?.name || '') : (session.profile?.full_name || session.profile?.name || '')
  // Uzbek convention: «Familiya Ism» → greet with Ism (2nd word); single token stays as-is
  const helloName = (() => {
    const parts = String(rawHello || '').trim().split(/\s+/).filter(Boolean)
    if (!parts.length) return ''
    return parts.length >= 2 ? parts[1] : parts[0]
  })()
  const hello = !profile.accountLive ? 'mehmon' : (looksLikeDemoName(rawHello) ? 'shifokor' : (helloName || 'shifokor'))
  const hub = useHub()
  const todaySeminars = publicRecords(hub).slice(0, 2).map((raw) => {
    const s = seminarCard(raw)
    return {
      id: s.id,
      date: s.dateLabel || s.date || '',
      title: s.title,
      image: s.image || s.cover || '/images/hero-implant.jpg',
      speaker: s.speaker?.name || 'Spiker',
      avatar: s.speaker?.avatar || '/images/avatar.jpg',
      city: s.city || 'Toshkent',
      hours: s.hours || s.duration || '',
      price: s.price || 0,
    }
  })
  const communityPosts = (feed.posts || []).slice(0, 2).map((p) => ({
    id: p.id,
    author: p.author || p.name,
    role: p.role || 'Stomatolog',
    time: p.time || '',
    avatar: p.avatar || '/images/avatar.jpg',
    text: p.body || p.text || p.title || '',
    image: (p.images && p.images[0]) || '/images/yangiliklar/yang-scanner.jpg',
  }))
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const liked = Object.fromEntries((profile.favProducts || []).map((id) => [id, true]))
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const inputRef = useRef(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const prods = marketProducts
      .filter((p) => `${p.name} ${p.brand} ${p.type}`.toLowerCase().includes(q))
      .map((p) => ({ to: `/product/${p.id}`, title: p.name, kind: p.brand }))
    const sems = publicRecords(hub)
      .filter((s) => s.title.toLowerCase().includes(q))
      .map((s) => ({ to: `/seminarlar/${s.id}`, title: s.title, kind: 'Seminar' }))
    const secs = SECTIONS.filter((s) => s.title.toLowerCase().includes(q))
    return [...secs, ...sems, ...prods].slice(0, 7)
  }, [query, hub])

  const addToCart = (p) => {
    add({ id: p.id, name: p.name, type: p.type, price: p.price, image: p.image })
    setToast(`${p.name} savatga qo‘shildi`)
  }

  const openSearch = () => {
    inputRef.current?.focus()
    inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef7f8] via-page to-page pb-[86px] md:hidden">
      <div className="px-3.5 pt-3">
        {/* Yuqori panel */}
        <MobileTopBar onSearch={openSearch} onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />

        {/* Salomlashish */}
        <div className="mt-3 flex items-center gap-3">
          {profile.avatar ? (
            <img src={profile.avatar} alt="" className="size-12 rounded-full object-cover ring-2 ring-white" />
          ) : (
            <span className="grid size-12 place-items-center rounded-full bg-sea-50 text-[14px] font-bold text-sea ring-2 ring-white">{initialsOf(profile.name || hello)}</span>
          )}
          <div className="min-w-0">
            <p className="text-[18px] font-bold leading-tight text-ink">Salom, {hello}!</p>
            <p className="mt-0.5 text-[12.5px] text-muted">Stomatologlar uchun barcha narsa bir joyda</p>
          </div>
        </div>

        {/* Qidiruv */}
        <div className="relative mt-3 flex gap-2">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl bg-white px-3.5 shadow-[0_1px_4px_rgb(11_31_58/0.07)]">
            <Search className="size-[18px] shrink-0 text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) navigate(results[0].to) }}
              placeholder="Stomatologga nima kerak?"
              className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-muted"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Tozalash" className="grid size-5 place-items-center rounded-full bg-page text-muted">
                <X className="size-3" />
              </button>
            )}
          </label>
          <Link to="/kategoriyalar" aria-label="Filtrlar" className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-ink shadow-[0_1px_4px_rgb(11_31_58/0.07)]">
            <SlidersHorizontal className="size-[18px]" />
          </Link>
          {focused && query.trim() && (
            <div className="absolute inset-x-0 top-[50px] z-30 overflow-hidden rounded-xl bg-white shadow-[0_12px_32px_rgb(11_31_58/0.16)]">
              {results.length ? results.map((r) => (
                <Link key={r.to + r.title} to={r.to} className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-2.5 last:border-0 active:bg-page">
                  <span className="truncate text-[13.5px] font-medium text-ink">{r.title}</span>
                  <span className="shrink-0 text-[11px] text-muted">{r.kind}</span>
                </Link>
              )) : <p className="px-3.5 py-4 text-center text-[13px] text-muted">“{query}” bo‘yicha hech narsa topilmadi</p>}
            </div>
          )}
        </div>

        {/* Tezkor bo'limlar */}
        <nav className="mt-3 grid grid-cols-4 gap-y-3 rounded-2xl bg-white px-1.5 py-3.5 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
          {QUICK.map(({ to, label, icon: Icon, color, bg }) => (
            <Link key={label} to={to} className="flex flex-col items-center gap-1.5 px-0.5 text-center active:scale-95">
              <span className="grid size-[50px] place-items-center rounded-2xl" style={{ background: Icon.raster ? '#e6f4f1' : bg }}>
                {Icon.raster ? <Icon className="size-[38px]" /> : <Icon className="size-[26px]" fill={color} stroke="#fff" strokeWidth={1.6} />}
              </span>
              <span className="text-[12px] font-medium leading-[1.2] text-ink-2">{label}</span>
            </Link>
          ))}
        </nav>


        {/* Bugungi seminarlar */}
        <SectionHead title="Bugungi seminarlar" to="/seminarlar" />
        <div className="space-y-2.5">
          {!todaySeminars.length && <p className="py-6 text-center text-[12px] text-muted">Bugun seminar yo‘q</p>}
          {todaySeminars.map((s) => (
            <article key={s.id} className="flex gap-1.5 rounded-2xl bg-white p-2 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
              <Link to={`/seminarlar/${s.id}`} className="relative mr-0.5 h-[76px] w-[84px] shrink-0 overflow-hidden rounded-xl bg-page">
                <img src={s.image} alt="" className="size-full object-cover object-top" />
                <span className="absolute left-1 top-1 rounded-md bg-sea/85 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">{s.date}</span>
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <Link to={`/seminarlar/${s.id}`} className="line-clamp-2 text-[12.5px] font-semibold leading-[1.3] text-ink">{s.title}</Link>
                <div className="mt-1.5 space-y-1 text-[8.5px] text-muted">
                  <p className="flex items-center gap-1 whitespace-nowrap">
                    <span className="flex min-w-0 items-center gap-0.5">
                      <img src={s.avatar} alt="" className="size-3.5 shrink-0 rounded-full object-cover" />
                      <span className="truncate">{s.speaker}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-px"><MapPin className="size-2.5" /> {s.city}</span>
                  </p>
                  <p className="flex items-center gap-3 whitespace-nowrap">
                    <span className="flex items-center gap-1"><Clock className="size-3" /> {s.hours}</span>
                    <span className="flex items-center gap-1"><FileText className="size-3" /> Sertifikat</span>
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end justify-center gap-2">
                <p className="whitespace-nowrap text-[11.5px] font-bold text-sea">{som(s.price)}</p>
                <Link to={`/seminarlar/${s.id}/royxat`} className="whitespace-nowrap rounded-lg border border-sea/60 px-1.5 py-1.5 text-[9px] font-semibold text-sea active:bg-sea-50">
                  Ro‘yxatdan o‘tish
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Chegirmadagi mahsulotlar */}
        <SectionHead title="Yangi mahsulotlar" to="/marketplace" />
        <div className="grid grid-cols-2 gap-2.5">
          {market.status === 'loading' && !deals.length && <p className="col-span-2 py-6 text-center text-[12px] text-muted">Yuklanmoqda…</p>}
          {market.status !== 'loading' && !deals.length && <p className="col-span-2 py-6 text-center text-[12px] text-muted">Hozircha mahsulot yo‘q</p>}
          {deals.map((p) => (
            <article key={p.id} className="relative flex flex-col rounded-2xl bg-white p-2.5 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
              {p.badge && <span className="absolute left-2.5 top-2.5 z-10 rounded-md bg-[#fde7ea] px-1.5 py-0.5 text-[11px] font-bold text-sale">{p.badge}</span>}
              <button
                type="button"
                onClick={() => profileStore.toggleFav('favProducts', p.id)}
                aria-label="Sevimlilarga qo‘shish"
                aria-pressed={!!liked[p.id]}
                className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-white text-ink-2"
              >
                <Heart className={`size-[18px] ${liked[p.id] ? 'fill-sale text-sale' : ''}`} />
              </button>
              <Link to={`/product/${p.id}`} className="block">
                <div className="mt-6 h-[100px] overflow-hidden rounded-lg">
                  <img src={p.image} alt={p.name} className="size-full object-contain" />
                </div>
                <p className="mt-2 text-[11px] text-muted">{p.brand}</p>
                <p className="truncate text-[14px] font-bold text-ink">{p.name}</p>
                <p className="text-[11px] text-muted">{p.type}</p>
              </Link>
              <div className="mt-1 flex items-end justify-between gap-1">
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-[11px] text-muted">
                    <Star className="size-3.5 fill-star text-star" /> <b className="font-semibold text-ink">{p.rating}</b> ({p.reviews} ta baho)
                  </p>
                  <p className="mt-1 whitespace-nowrap text-[15px] font-extrabold text-ink">{som(p.price)}</p>
                  {p.oldPrice ? <p className="text-[11px] text-muted line-through">{som(p.oldPrice)}</p> : null}
                </div>
                <button type="button" onClick={() => addToCart(p)} aria-label="Savatga qo‘shish" className="grid size-10 shrink-0 place-items-center rounded-xl bg-sea text-white active:scale-95">
                  <ShoppingCart className="size-[18px]" />
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Hamjamiyat */}
        <SectionHead title="Hamjamiyat" to="/community" />
        <div className="space-y-2.5">
          {!communityPosts.length && <p className="py-6 text-center text-[12px] text-muted">Hamjamiyatda hali post yo‘q</p>}
          {communityPosts.map((p) => (
            <Link key={p.id} to="/community" className="flex gap-3 rounded-2xl bg-white p-3 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
              <img src={p.avatar} alt="" className="size-10 shrink-0 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-ink">{p.author}</p>
                <p className="text-[11px] text-muted">{p.role} · {p.time}</p>
                <p className="mt-1 line-clamp-3 text-[12px] leading-[1.45] text-ink-2">{p.text}</p>
              </div>
              <img src={p.image} alt="" className="h-[68px] w-[84px] shrink-0 self-center rounded-lg object-cover" />
              <MoreVertical className="-mr-1 size-4 shrink-0 text-muted" />
            </Link>
          ))}
        </div>
      </div>

      <MobileToast text={toast} onClose={closeToast} />

      <MobileTabBar />
    </div>
  )
}

function SectionHead({ title, to }) {
  return (
    <div className="mb-2 mt-5 flex items-center justify-between">
      <h2 className="text-[17px] font-bold text-ink">{title}</h2>
      <Link to={to} className="flex items-center text-[12.5px] font-medium text-hub">
        Barchasi <ChevronRight className="size-3.5" />
      </Link>
    </div>
  )
}

function BagIcon({ className, fill }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8" fill="none" stroke={fill} strokeWidth="2" strokeLinecap="round" />
      <path d="M5.2 8h13.6a1 1 0 0 1 1 .92l.9 11a2 2 0 0 1-2 2.08H5.3a2 2 0 0 1-2-2.08l.9-11A1 1 0 0 1 5.2 8Z" fill={fill} />
      <path d="M9 11.5a3 3 0 0 0 6 0" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function WrenchIcon({ className, fill }) {
  return (
    <Wrench className={className} stroke={fill} strokeWidth={2.6} />
  )
}
