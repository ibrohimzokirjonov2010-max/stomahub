import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, X, ChevronRight, Filter, Check } from 'lucide-react'
import { brands as marketBrands } from '../../marketData'
import { useMarket } from '../../buyerApi'
import { MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet } from './MobileSeminars'
import { HubTopBar } from './MobileKategoriyalar'

const COUNTRIES = {
  us: 'AQSH', de: 'Germaniya', ch: 'Shveytsariya', li: 'Lixtenshteyn', jp: 'Yaponiya', kr: 'Janubiy Koreya', au: 'Avstraliya', at: 'Avstriya', fi: 'Finlandiya', cn: 'Xitoy', br: 'Braziliya',
}

const BRANDS = [
  { name: '3M', count: 0, country: 'us', rank: 1, logo: Logo3M, side: true },
  { name: 'Straumann', count: 0, country: 'ch', rank: 2, logo: LogoStraumann },
  { name: 'Dentsply Sirona', count: 0, country: 'de', rank: 3, logo: LogoDentsply, market: 'Dentsply' },
  { name: 'Nobel Biocare', count: 0, country: 'ch', rank: 4, logo: LogoNobel },
  { name: 'Ivoclar', count: 0, country: 'li', rank: 5, logo: LogoIvoclar },
  { name: 'VOCO', count: 0, country: 'de', rank: 6, logo: LogoVoco },
  { name: 'GC', count: 0, country: 'jp', rank: 7, logo: LogoGC },
  { name: 'Coltene', count: 0, country: 'ch', rank: 8, logo: LogoColtene },
  { name: 'Kerr', count: 0, country: 'us', rank: 9, logo: LogoKerr },
  { name: 'Osstem Implant', count: 0, country: 'kr', rank: 10, logo: LogoOsstem },
  { name: 'Megagen', count: 0, country: 'kr', rank: 11, logo: LogoMegagen },
  { name: 'Neobiotech', count: 0, country: 'kr', rank: 12, logo: LogoNeo },
  { name: 'SDI', count: 0, country: 'au', rank: 13, logo: LogoSDI, side: true },
  { name: 'VITA', count: 0, country: 'de', rank: 14, logo: LogoVita, side: true },
  { name: 'NSK', count: 0, country: 'jp', rank: 15, logo: () => <Word color="#163a7a" className="text-[26px] tracking-[0.06em]">NSK</Word> },
  { name: 'W&H', count: 0, country: 'at', rank: 16, logo: () => <Word color="#4b5563" className="text-[24px]">W&amp;H</Word> },
  { name: 'Tokuyama', count: 0, country: 'jp', rank: 17, logo: () => <Word color="#1a4f8b" className="text-[20px] italic">Tokuyama</Word> },
  { name: 'Kuraray', count: 0, country: 'jp', rank: 18, logo: () => <Word color="#0057a8" className="text-[22px] font-bold lowercase">kuraray</Word> },
  { name: 'Ultradent', count: 0, country: 'us', rank: 19, logo: () => <Word color="#f26b1f" className="text-[18px] tracking-wide">ULTRADENT</Word> },
  { name: 'Planmeca', count: 0, country: 'fi', rank: 20, logo: () => <Word color="#163a7a" className="text-[18px] tracking-[0.12em]">PLANMECA</Word>, to: '/jihozlar?brand=Planmeca' },
  { name: 'Woodpecker', count: 0, country: 'cn', rank: 21, logo: () => <Word color="#1f8a4c" className="text-[18px] font-bold">Woodpecker</Word> },
  { name: 'Angelus', count: 0, country: 'br', rank: 23, logo: () => <Word color="#111" className="text-[22px] font-bold lowercase italic">angelus</Word> },
  { name: 'Bien-Air', count: 0, country: 'ch', rank: 24, logo: () => <Word color="#c8102e" className="text-[20px] tracking-tight">Bien-Air</Word> },
  { name: 'EMS', count: 0, country: 'ch', rank: 25, logo: () => <Word color="#0072bc" className="text-[26px] italic tracking-[0.04em]">EMS</Word> },
  { name: 'Hu-Friedy', count: 0, country: 'us', rank: 26, logo: () => <Word color="#00205b" className="text-[21px] tracking-tight">HU-FRIEDY</Word> },
  { name: 'Zimmer Biomet', count: 0, country: 'us', rank: 22, logo: () => <Word color="#1d4e89" className="text-[15px] leading-[1.05] tracking-wide">ZIMMER<br />BIOMET</Word> },
]

const GROUPS = [['all', 'Barchasi'], ['AB', 'A-B'], ['CD', 'C-D'], ['EF', 'E-F'], ['GH', 'G-H'], ['IJ', 'I-J'], ['KL', 'K-L'], ['MN', 'M-N'], ['OP', 'O-P'], ['QRS', 'Q-S'], ['TUV', 'T-V'], ['WXYZ', 'W-Z'], ['0', '0-9']]
const SORTS = [['rank', 'Mashhur'], ['az', 'A–Z'], ['count', 'Mahsulot soni']]
const inGroup = (name, g) => {
  if (g === 'all') return true
  const ch = name[0].toUpperCase()
  return g === '0' ? /\d/.test(ch) : g.includes(ch)
}
const linkOf = (b) => {
  if (b.to) return b.to
  const key = b.market || b.name
  return marketBrands.some(([m]) => m === key) ? { pathname: '/marketplace', search: `?brand=${encodeURIComponent(key)}` } : '/marketplace'
}

export default function MobileBrendlar() {
  const market = useMarket()
  const [q, setQ] = useState('')
  const [group, setGroup] = useState('all')
  const [country, setCountry] = useState('')
  const [sort, setSort] = useState('rank')
  const [sheet, setSheet] = useState(false)
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])

  const brandsLive = useMemo(() => BRANDS.map((b) => {
    const key = String(b.market || b.name).split(/\s/)[0].toLowerCase()
    const count = (market.products || []).filter((p) => String(p.brand || '').toLowerCase().includes(key)).length
    return { ...b, count }
  }), [market.products])

  const filter = useCallback((c, s = q, g = group) => {
    const text = s.trim().toLowerCase()
    return brandsLive.filter((b) => inGroup(b.name, g) && (!c || b.country === c) && (!text || b.name.toLowerCase().includes(text)))
  }, [q, group, brandsLive])

  const list = useMemo(() => {
    const out = filter(country)
    if (sort === 'az') return out.sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'count') return out.sort((a, b) => b.count - a.count)
    return out.sort((a, b) => a.rank - b.rank)
  }, [filter, country, sort])
  const extra = (country ? 1 : 0) + (sort !== 'rank' ? 1 : 0)

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_40%,#f6faf9_100%)] pb-[86px]">
      <div className="px-3.5 pt-3">
        <HubTopBar onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />
        <h1 className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">Brendlar</h1>
        <p className="mt-0.5 text-[13px] text-[#7d8fa9]">Mashhur stomatologik brendlar va ishlab chiqaruvchilar</p>

        <label className="mt-3 flex h-12 items-center gap-2.5 rounded-2xl border border-[#d8ece9] bg-white px-3.5 shadow-[0_1px_3px_rgb(11_31_58/0.04)]">
          <Search className="size-[18px] shrink-0 text-sea" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Brend nomi bo‘yicha qidirish..." className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-muted" />
          {q && <button type="button" onClick={() => setQ('')} aria-label="Tozalash" className="text-muted"><X className="size-4" /></button>}
        </label>
      </div>

      <div className="mt-3 flex items-center gap-2 pl-3.5">
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pr-1 no-scrollbar">
          {GROUPS.map(([k, l]) => {
            const on = group === k
            const empty = k !== 'all' && !BRANDS.some((b) => inGroup(b.name, k))
            return (
              <button key={k} type="button" aria-pressed={on} disabled={empty} onClick={() => setGroup(k)} className={`h-9 shrink-0 rounded-xl px-3 text-[12px] font-semibold transition disabled:opacity-40 ${on ? 'bg-sea text-white' : 'border border-[#e2ecef] bg-white text-ink-2'}`}>{l}</button>
            )
          })}
        </div>
        <button type="button" onClick={() => setSheet(true)} aria-label="Filtr" className="relative mr-3.5 grid size-9 shrink-0 place-items-center rounded-xl border border-[#e2ecef] bg-white text-sea">
          <Filter className="size-[17px]" />
          {extra > 0 && <span className="absolute -right-1.5 -top-1.5 grid size-[17px] place-items-center rounded-full bg-sea text-[10px] font-bold text-white ring-2 ring-[#f3faf9]">{extra}</span>}
        </button>
      </div>

      {list.length ? (
        <div className="mt-3 grid grid-cols-2 gap-2.5 px-3.5">
          {list.map((b) => <BrandTile key={b.name} b={b} />)}
        </div>
      ) : (
        <div className="mx-3.5 mt-3 rounded-2xl bg-white px-6 py-8 text-center">
          <p className="text-[14px] font-semibold text-ink">Brend topilmadi</p>
          <p className="mt-1 text-[12px] text-muted">Qidiruv yoki filtrni o‘zgartirib ko‘ring</p>
          <button type="button" onClick={() => { setQ(''); setGroup('all'); setCountry('') }} className="mt-3 h-9 rounded-xl bg-sea-50 px-4 text-[12.5px] font-semibold text-sea">Filtrlarni tozalash</button>
        </div>
      )}

      {sheet && (
        <FilterSheet
          country={country}
          sort={sort}
          count={(c) => filter(c).length}
          onClose={() => setSheet(false)}
          onApply={(c, s) => { setCountry(c); setSort(s); setSheet(false) }}
        />
      )}

      <MobileToast text={toast} onClose={closeToast} />
      <MobileTabBar />
    </div>
  )
}

function BrandTile({ b }) {
  const Logo = b.logo
  const meta = (
    <span className="min-w-0">
      <span className="block truncate text-[12.5px] font-bold text-[#0d2a4a]">{b.name}</span>
      <span className="block text-[11px] text-muted">{b.count} mahsulot</span>
    </span>
  )
  return (
    <Link to={linkOf(b)} className="relative flex h-[96px] flex-col justify-between rounded-2xl border border-[#e6f0ef] bg-white p-3 shadow-[0_1px_4px_rgb(11_31_58/0.05)] transition active:scale-[0.98]">
      {b.side ? (
        <span className="flex items-center gap-2.5">
          <span className="flex h-[44px] shrink-0 items-center"><Logo /></span>
          {meta}
        </span>
      ) : (
        <>
          <span className="flex h-[40px] items-center overflow-hidden"><Logo /></span>
          <span className="pr-8">{meta}</span>
        </>
      )}
      <span className="absolute bottom-3 right-3 grid size-7 place-items-center rounded-full bg-[#e6f4f3] text-[#0d2a4a]"><ChevronRight className="size-4" strokeWidth={2.3} /></span>
    </Link>
  )
}

function FilterSheet({ country: c0, sort: s0, count, onClose, onApply }) {
  const [country, setCountry] = useState(c0)
  const [sort, setSort] = useState(s0)
  const chip = (on) => `flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[12.5px] font-medium ${on ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`
  const used = [...new Set(BRANDS.map((b) => b.country))]
  return (
    <BottomSheet
      title="Filtr"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={() => { setCountry(''); setSort('rank') }} className="h-12 rounded-xl border border-line px-4 text-[13.5px] font-semibold text-ink">Tozalash</button>
          <button type="button" onClick={() => onApply(country, sort)} className="h-12 flex-1 rounded-xl bg-sea text-[14px] font-semibold text-white">{count(country)} ta brendni ko‘rsatish</button>
        </>
      }
    >
      <p className="mt-3 text-[13px] font-semibold text-ink">Saralash</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {SORTS.map(([k, l]) => (
          <button key={k} type="button" aria-pressed={sort === k} onClick={() => setSort(k)} className={chip(sort === k)}>{sort === k && <Check className="size-3.5" />} {l}</button>
        ))}
      </div>
      <p className="mt-4 text-[13px] font-semibold text-ink">Davlat</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {used.map((k) => (
          <button key={k} type="button" aria-pressed={country === k} onClick={() => setCountry(country === k ? '' : k)} className={chip(country === k)}>{country === k && <Check className="size-3.5" />} {COUNTRIES[k]}</button>
        ))}
      </div>
    </BottomSheet>
  )
}

function Word({ color, className = '', children }) {
  return <span className={`whitespace-nowrap font-black leading-none ${className}`} style={{ color }}>{children}</span>
}

function Logo3M() {
  return <Word color="#e10600" className="text-[34px] tracking-[-0.06em]">3M</Word>
}

function LogoStraumann() {
  return (
    <span className="flex items-center gap-1">
      <svg viewBox="0 0 20 24" className="h-[24px] w-[18px]"><path d="M14 2C6 4 4 9 9 12s3 8-5 10" fill="none" stroke="#2fa84f" strokeWidth="4" strokeLinecap="round" /></svg>
      <Word color="#111" className="text-[20px] font-extrabold tracking-[-0.02em]">straumann</Word>
    </span>
  )
}

function LogoDentsply() {
  return (
    <span className="flex items-center gap-1.5">
      <svg viewBox="0 0 24 28" className="h-[28px] w-[22px]"><path d="M20 4C12 2 4 5 6 11c2 5 14 4 12 11-1 4-8 5-14 3" fill="none" stroke="#3a3a3a" strokeWidth="5" strokeLinecap="round" /></svg>
      <span className="text-[16px] font-normal leading-[1.02] tracking-tight text-[#2b2b2b]">Dentsply<br />Sirona</span>
    </span>
  )
}

function LogoNobel() {
  return (
    <span className="flex items-center gap-1.5">
      <svg viewBox="0 0 28 28" className="size-[30px]"><rect width="28" height="28" fill="#d0121a" /><path d="M7 22V6l14 16V6" fill="none" stroke="#fff" strokeWidth="2.6" /></svg>
      <span className="text-[15px] font-medium leading-[1.02] text-[#222]">Nobel<br /><span className="font-normal">Biocare</span></span>
    </span>
  )
}

function LogoIvoclar() {
  return (
    <span className="relative">
      <span className="absolute -top-0.5 left-[1px] size-[5px] rounded-full bg-[#22b14c]" />
      <Word color="#1b3a6b" className="text-[27px] font-bold tracking-[-0.02em]">ivoclar<span className="text-[#22b14c]">.</span></Word>
    </span>
  )
}

function LogoVoco() {
  return <Word color="#1b4fa0" className="text-[28px] tracking-[0.02em]">VOCO</Word>
}

function LogoGC() {
  return <Word color="#0f9d58" className="skew-x-[-14deg] text-[27px] italic tracking-[0.08em]">,&apos;GC&apos;,</Word>
}

function LogoColtene() {
  return (
    <span className="flex items-center gap-1">
      <svg viewBox="0 0 20 20" className="size-[20px]">
        {[0, 5, 10, 15].map((y) => <path key={y} d={`M${2 + y / 3} ${y + 1}h14l-2 3H${y / 3}z`} fill="#1a8fd8" />)}
      </svg>
      <Word color="#141e33" className="text-[19px] font-extrabold tracking-[0.04em]">COLTENE</Word>
    </span>
  )
}

function LogoKerr() {
  return <Word color="#1b2f5e" className="text-[30px] tracking-[-0.03em]">Kerr</Word>
}

function LogoOsstem() {
  return (
    <span className="flex flex-col leading-none">
      <Word color="#f26b1f" className="text-[23px] italic tracking-[-0.02em]">OSSTEM<sup className="text-[10px]">°</sup></Word>
      <span className="mt-0.5 pl-3 text-[10px] font-bold italic tracking-[0.2em] text-[#555]">IMPLANT</span>
    </span>
  )
}

function LogoMegagen() {
  return (
    <span className="flex items-center gap-1">
      <svg viewBox="0 0 22 22" className="size-[24px]">
        <rect x="0" y="4" width="10" height="10" fill="#e8336d" /><rect x="8" y="0" width="8" height="8" fill="#f4b400" />
        <rect x="9" y="9" width="12" height="12" fill="#1e88e5" /><rect x="3" y="13" width="7" height="7" fill="#43a047" />
      </svg>
      <span className="text-[17px] font-normal tracking-[0.04em] text-[#222]">MEGA<b className="font-extrabold">GEN</b></span>
    </span>
  )
}

function LogoNeo() {
  return (
    <span className="flex flex-col leading-[0.9]">
      <Word color="#e8336d" className="text-[20px] italic">Neo</Word>
      <Word color="#6b6b6b" className="text-[19px] italic">Biotech</Word>
    </span>
  )
}

function LogoSDI() {
  return <span className="grid h-[40px] w-[44px] place-items-center bg-black text-[18px] font-black italic tracking-tight text-white">SDI</span>
}

function LogoVita() {
  return <span className="font-serif text-[26px] font-bold tracking-[0.04em] text-[#c8102e]">VITA</span>
}
