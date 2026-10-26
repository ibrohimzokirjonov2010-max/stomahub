import { useCallback, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu, ShoppingCart, Bell, Search, X, ChevronRight, Syringe, Armchair, FlaskConical, Shirt, GraduationCap, Settings,
  BriefcaseBusiness, LayoutGrid, Store, Tag, BadgePercent, Package, CalendarDays, BookOpen, Wrench, Users, Newspaper, Briefcase, Award, ArrowLeft, Stethoscope, Megaphone, UserRound, CalendarClock, Wallet, Warehouse,
} from 'lucide-react'
import { useCart } from '../../cart'
import { BrandLogo, CountBadge, MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet, ToothIcon } from './MobileSeminars'

const kat = (n) => `/images/kategoriyalar/${n}.jpg`
const FADE = 'radial-gradient(ellipse 62% 58% at 58% 52%, #000 62%, transparent 100%)'

const CATS = [
  { id: 'material', name: 'Stomatologik materiallar', count: '1 245 mahsulot', to: '/marketplace?cat=komp', icon: Syringe, tone: 'bg-[#e3f5f3] text-sea', image: kat('kat-terapiya'), pos: '58% 64%', keys: 'kompozit bond sement adgeziv plomba' },
  { id: 'implant', name: 'Implantlar', count: '856 mahsulot', to: '/marketplace?cat=impl', icon: ImplantIcon, tone: 'bg-[#e4f6ec] text-[#22a06b]', image: kat('kat-implant'), pos: '78% 60%', keys: 'implant abutment' },
  { id: 'instrument', name: 'Instrumentlar', count: '1 032 mahsulot', to: '/marketplace?cat=asb', icon: ProbeIcon, tone: 'bg-[#efe9fc] text-[#7c4ddb]', image: kat('kat-asbob'), pos: '92% 55%', keys: 'asbob ko‘zgu zond pinset' },
  { id: 'uskuna', name: 'Uskunalar', count: '412 mahsulot', to: '/jihozlar', icon: Armchair, tone: 'bg-[#fdeee3] text-[#e8772e]', image: kat('kat-uskuna'), pos: '50% 50%', keys: 'jihoz kreslo unit rentgen avtoklav' },
  { id: 'endo', name: 'Endodontiya', count: '623 mahsulot', to: '/marketplace?cat=endo', icon: ToothIcon, tone: 'bg-[#fde8ef] text-[#e04f7d]', image: kat('kat-endo'), pos: '25% 60%', keys: 'kanal fayl apekslokator endomotor' },
  { id: 'orto', name: 'Ortodontiya', count: '498 mahsulot', to: '/marketplace', icon: BracesIcon, tone: 'bg-[#efe9fc] text-[#7c4ddb]', image: kat('kat-orto'), pos: '72% 55%', keys: 'breket elayner kappa' },
  { id: 'lab', name: 'Laboratoriya materiallari', count: '534 mahsulot', to: '/marketplace', icon: FlaskConical, tone: 'bg-[#e4f6ec] text-[#22a06b]', image: '/images/seminars/teeth.jpg', pos: '50% 50%', photo: true, keys: 'laboratoriya gips mum keramika protez' },
  { id: 'forma', name: 'Stomatologik forma', count: '765 mahsulot', to: '/forma', icon: Shirt, tone: 'bg-[#e6f0fc] text-[#1f6fd1]', image: '/images/forma/folded.jpg', pos: '50% 45%', photo: true, keys: 'forma kiyim xalat scrubs' },
  { id: 'seminar', name: 'Seminarlar', count: '248 tadbir', to: '/seminarlar', icon: GraduationCap, tone: 'bg-[#fdf3dc] text-[#d99a00]', art: SeminarArt, keys: 'seminar kurs master-klass ta’lim' },
  { id: 'qism', name: 'Ehtiyot qismlar', count: '312 mahsulot', to: '/marketplace?cat=uch', icon: Settings, tone: 'bg-[#fde8ef] text-[#e04f7d]', image: '/images/market/p5.jpg', pos: '50% 50%', contain: true, keys: 'uchlik turbina ehtiyot qism' },
  { id: 'xizmat', name: 'Xizmatlar', count: '186 xizmat', to: '/ustalar', icon: BriefcaseBusiness, tone: 'bg-[#e3f5f3] text-sea', art: ServiceArt, keys: 'usta servis ta’mir o‘rnatish' },
  { id: 'boshqa', name: 'Boshqa kategoriyalar', count: '320 mahsulot', icon: LayoutGrid, tone: 'bg-[#eef2f6] text-[#4a5b72]', art: MoreArt, more: true, keys: 'gigiyena jarrohlik ortopediya ortiqcha kitob' },
]

const OTHERS = [
  { name: 'Gigiyena', note: 'Cho‘tka, pasta, ip', to: '/marketplace?cat=gig', image: kat('kat-gigiyena') },
  { name: 'Jarrohlik', note: 'Jarrohlik asboblari', to: '/marketplace?cat=asb', image: kat('kat-jarrohlik') },
  { name: 'Ortopediya', note: 'Kronalar, protezlar', to: '/marketplace', image: kat('kat-ortopediya') },
  { name: 'Ortiqcha materiallar', note: 'Arzon e’lonlar', to: '/ortiqcha', icon: Package },
  { name: 'Kitoblar', note: 'Stomatologik adabiyot', to: '/kitoblar', icon: BookOpen },
  { name: 'Brendlar', note: 'Barcha ishlab chiqaruvchilar', to: '/brendlar', icon: Tag },
  { name: 'Aksiyalar', note: 'Chegirmalar va takliflar', to: '/aksiyalar', icon: BadgePercent },
]

const MENU = [
  ['Do‘kon', [['Marketplace', '/marketplace', Store], ['Kategoriyalar', '/kategoriyalar', LayoutGrid], ['Brendlar', '/brendlar', Tag], ['Aksiyalar', '/aksiyalar', BadgePercent], ['Forma', '/forma', Shirt], ['Jihozlar', '/jihozlar', Armchair], ['Ortiqcha materiallar', '/ortiqcha', Package]]],
  ['Ta’lim', [['Seminarlar', '/seminarlar', CalendarDays], ['Kitoblar', '/kitoblar', BookOpen], ['Sertifikatlar', '/sertifikatlar', Award]]],
  ['Hamjamiyat va ish', [['Hamjamiyat', '/community', Users], ['Mutaxassislar', '/mutaxassislar', Stethoscope], ['Ish o‘rinlari', '/ishlar', Briefcase], ['Ustalar', '/ustalar', Wrench], ['E’lonlar', '/elonlar', Megaphone], ['Yangiliklar', '/yangiliklar', Newspaper]]],
  ['Klinika', [['Mening klinikam', '/klinika', Store], ['Bemorlar', '/bemorlar', UserRound], ['Uchrashuvlar', '/uchrashuvlar', CalendarClock], ['To‘lovlar', '/tolovlar', Wallet], ['Ombor', '/ombor', Warehouse]]],
]

export default function MobileKategoriyalar() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [sheet, setSheet] = useState(null)
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return CATS
    return CATS.filter((c) => `${c.name} ${c.keys}`.toLowerCase().includes(s))
  }, [q])

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_40%,#f6faf9_100%)] pb-[86px]">
      <div className="px-3.5 pt-3">
        <HubTopBar onBell={() => setToast('Yangi bildirishnomalar yo‘q')} />

        <h1 className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">Kategoriyalar</h1>
        <p className="mt-0.5 text-[13px] text-[#7d8fa9]">Sizga kerakli stomatologik mahsulot va xizmatlar</p>

        <label className="mt-3 flex h-12 items-center gap-2.5 rounded-2xl border border-[#d8ece9] bg-white px-3.5 shadow-[0_1px_3px_rgb(11_31_58/0.04)]">
          <Search className="size-[18px] shrink-0 text-sea" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mahsulot, brend yoki kategoriya qidirish..." className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-muted" />
          {q && <button type="button" onClick={() => setQ('')} aria-label="Tozalash" className="text-muted"><X className="size-4" /></button>}
        </label>
      </div>

      {list.length ? (
        <div className="mt-3 grid grid-cols-2 gap-2.5 px-3.5">
          {list.map((c) => <CatTile key={c.id} c={c} onMore={() => setSheet('more')} />)}
        </div>
      ) : (
        <div className="mx-3.5 mt-3 rounded-2xl bg-white px-6 py-8 text-center">
          <p className="text-[14px] font-semibold text-ink">“{q}” bo‘yicha kategoriya topilmadi</p>
          <p className="mt-1 text-[12px] text-muted">Mahsulotlar orasida qidirib ko‘ring</p>
          <button type="button" onClick={() => navigate(`/marketplace?q=${encodeURIComponent(q.trim())}`)} className="mt-3 h-10 rounded-xl bg-sea px-4 text-[13px] font-semibold text-white">Mahsulotlardan qidirish</button>
        </div>
      )}

      {sheet === 'more' && (
        <BottomSheet title="Boshqa kategoriyalar" onClose={() => setSheet(null)}>
          <div className="mt-2 flex flex-col">
            {OTHERS.map((o) => {
              const Icon = o.icon
              return (
                <Link key={o.name} to={o.to} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
                  <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f3f7fb] text-sea">
                    {o.image ? <img src={o.image} alt="" className="size-full object-cover mix-blend-multiply" /> : <Icon className="size-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold text-ink">{o.name}</span>
                    <span className="block text-[11.5px] text-muted">{o.note}</span>
                  </span>
                  <ChevronRight className="size-4 text-muted" />
                </Link>
              )
            })}
          </div>
        </BottomSheet>
      )}
      <MobileToast text={toast} onClose={closeToast} />
      <MobileTabBar />
    </div>
  )
}

function CatTile({ c, onMore }) {
  const Icon = c.icon
  const Art = c.art
  const inner = (
    <>
      <span className={`grid size-10 place-items-center rounded-xl ${c.tone}`}><Icon className="size-[21px]" strokeWidth={1.7} /></span>
      <span className="relative z-10 mt-2 block max-w-[90px] text-[12.5px] font-bold leading-[1.2] text-[#0d2a4a]">{c.name}</span>
      <span className="relative z-10 mt-auto flex items-center gap-1.5 pt-1.5">
        <span className="whitespace-nowrap text-[11px] text-muted">{c.count}</span>
        <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-[#e6f4f3] text-sea"><ChevronRight className="size-3.5" strokeWidth={2.4} /></span>
      </span>
      <span className="pointer-events-none absolute bottom-1.5 right-0 top-1.5 w-[45%]">
        {Art ? (
          <Art className="absolute bottom-1 right-1.5 h-[72px] w-[72px]" />
        ) : (
          <img
            src={c.image}
            alt=""
            loading="lazy"
            className={`size-full ${c.contain ? 'object-contain' : 'object-cover'} ${c.photo ? '' : 'mix-blend-multiply'}`}
            style={{ objectPosition: c.pos, maskImage: FADE, WebkitMaskImage: FADE }}
          />
        )}
      </span>
    </>
  )
  const cls = 'relative flex h-[118px] flex-col items-start overflow-hidden rounded-2xl border border-[#e6f0ef] bg-white p-3 text-left shadow-[0_1px_4px_rgb(11_31_58/0.05)] active:scale-[0.98] transition'
  return c.more
    ? <button type="button" onClick={onMore} className={cls}>{inner}</button>
    : <Link to={c.to} className={cls}>{inner}</Link>
}

export function HubTopBar({ onBell, onBack }) {
  const navigate = useNavigate()
  const { items } = useCart()
  const [menu, setMenu] = useState(false)
  const iconBtn = 'relative grid size-10 place-items-center rounded-full text-sea'
  return (
    <>
      <header className="grid grid-cols-[1fr_auto_1fr] items-center">
        {onBack ? (
          <button type="button" onClick={onBack} aria-label="Orqaga" className="grid size-10 place-items-center rounded-full text-sea">
            <ArrowLeft className="size-6" strokeWidth={1.9} />
          </button>
        ) : (
          <button type="button" onClick={() => setMenu(true)} aria-label="Menyu" className="grid size-10 place-items-center rounded-full text-sea">
            <Menu className="size-6" strokeWidth={1.9} />
          </button>
        )}
        <BrandLogo />
        <div className="flex justify-end">
          <button type="button" onClick={() => navigate('/buyurtma', { state: { from: 'market' } })} aria-label="Savat" className={iconBtn}>
            <ShoppingCart className="size-[22px]" />
            {items.length > 0 && <CountBadge>{items.length}</CountBadge>}
          </button>
          <button type="button" onClick={onBell} aria-label="Bildirishnomalar" className={iconBtn}>
            <Bell className="size-[22px]" />
          </button>
        </div>
      </header>
      {menu && <MenuDrawer onClose={() => setMenu(false)} />}
    </>
  )
}

export function MenuDrawer({ onClose }) {
  const { pathname } = useLocation()
  return (
    <div className="fixed inset-0 z-[60] bg-ink/45" onClick={onClose}>
      <nav aria-label="Asosiy menyu" onClick={(e) => e.stopPropagation()} className="flex h-full w-[82%] max-w-[320px] flex-col overflow-y-auto bg-white px-4 pb-6 pt-4">
        <div className="flex items-center justify-between">
          <BrandLogo to={null} className="h-7" />
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-9 place-items-center rounded-full bg-page text-ink"><X className="size-4" /></button>
        </div>
        {MENU.map(([title, links]) => (
          <div key={title} className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</p>
            <div className="mt-1.5 flex flex-col">
              {links.map(([label, to, Icon]) => (
                <Link key={to} to={to} onClick={onClose} className={`flex h-11 items-center gap-3 rounded-xl px-2 text-[14px] font-medium ${to === pathname ? 'bg-sea-50 text-sea' : 'text-ink'}`}>
                  <Icon className="size-[19px] text-sea" strokeWidth={1.8} /> {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  )
}

function ImplantIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 3.5h10l-1 3H8z" />
      <path d="M9 8.5h6M9.3 11.5h5.4M9.6 14.5h4.8M10 17.5h4M12 21l-2-3.5h4z" />
    </svg>
  )
}

function ProbeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="7" cy="5" r="2.5" />
      <path d="M7 7.5V21" />
      <path d="M17 21V8c0-2 0-4 2-4.5" />
      <path d="M15.5 12h3M15.5 15h3" />
    </svg>
  )
}

function BracesIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 9c2.5-2 15.5-2 18 0" />
      <path d="M4 10.5c0 4 1.5 6 3 6s1.5-3 2.5-3 1 3 2.5 3 1.5-3 2.5-3 1 3 2.5 3 3-2 3-6" />
      <path d="M3 12.5h18" />
    </svg>
  )
}

function SeminarArt(props) {
  return (
    <svg viewBox="0 0 80 80" {...props}>
      <defs>
        <linearGradient id="sa-tooth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#dfe8ee" /></linearGradient>
      </defs>
      <ellipse cx="40" cy="75" rx="20" ry="3" fill="#0b1f3a" opacity=".08" />
      <path d="M26 34c4-2 8 0 14 0s10-2 14 0c5 3 5 10 3 17-2 8-4 21-8 21-3 0-3-10-9-10s-6 10-9 10c-4 0-6-13-8-21-2-7-2-14 3-17z" fill="url(#sa-tooth)" stroke="#c9d6df" strokeWidth="1" />
      <path d="M22 26l18-9 18 9-18 9z" fill="#14294a" />
      <path d="M29 30v7c3 3 19 3 22 0v-7l-11 5z" fill="#1d3760" />
      <path d="M58 26v12" stroke="#d99a00" strokeWidth="1.6" />
      <circle cx="58" cy="39.5" r="2" fill="#f2b400" />
    </svg>
  )
}

function ServiceArt(props) {
  return (
    <svg viewBox="0 0 80 80" {...props}>
      <defs>
        <linearGradient id="sv-tooth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#dfe8ee" /></linearGradient>
      </defs>
      <ellipse cx="38" cy="75" rx="20" ry="3" fill="#0b1f3a" opacity=".08" />
      <path d="M22 28c4-3 9 0 16 0s12-3 16 0c5 3 5 11 3 19-2 9-5 25-9 25-3 0-4-12-10-12s-7 12-10 12c-4 0-7-16-9-25-2-8-2-16 3-19z" fill="url(#sv-tooth)" stroke="#c9d6df" strokeWidth="1" />
      <path d="M62 8l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#0b8a95" />
      <path d="M70 24l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z" fill="#3fb8c0" />
    </svg>
  )
}

function MoreArt(props) {
  return (
    <svg viewBox="0 0 80 80" fill="none" {...props}>
      <rect x="38" y="30" width="16" height="16" rx="4" stroke="#b8c4d2" strokeWidth="1.6" strokeDasharray="3 3" />
      <rect x="58" y="30" width="16" height="16" rx="4" stroke="#b8c4d2" strokeWidth="1.6" />
      <circle cx="66" cy="38" r="1.6" fill="#b8c4d2" />
    </svg>
  )
}
