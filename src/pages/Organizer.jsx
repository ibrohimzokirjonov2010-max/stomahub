import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  House, CalendarDays, Users, Ticket, QrCode, Wallet, Award, Tag, Megaphone, Mic, ChartColumn,
  Store, Wrench, Shirt, BookOpen, Settings, CircleQuestionMark, Search, MapPin, Calendar, Bell,
  Plus, ChevronDown, Ellipsis, X, Menu, GraduationCap, TrendingUp, Share2, Download, Send,
} from 'lucide-react'
import { Logo } from '../components/icons'

const NAV = [
  { id: 'panel', label: 'Boshqaruv paneli', icon: House },
  { id: 'mine', label: 'Mening seminarlarim', icon: CalendarDays },
  { id: 'people', label: 'Ishtirokchilar', icon: Users },
  { id: 'tickets', label: 'Chiptalar', icon: Ticket },
  { id: 'qr', label: 'QR Check-in', icon: QrCode },
  { id: 'pay', label: 'To‘lovlar', icon: Wallet },
  { id: 'certs', label: 'Sertifikatlar', icon: Award },
  { id: 'promo', label: 'Promo-kodlar', icon: Tag },
  { id: 'ads', label: 'Marketing', icon: Megaphone },
  { id: 'speakers', label: 'Ma’ruzachilar', icon: Mic },
  { id: 'reports', label: 'Hisobotlar', icon: ChartColumn },
]

const PLATFORM = [
  { label: 'Marketplace', icon: Store, to: '/marketplace' },
  { label: 'Ustalar', icon: Wrench, to: '/ustalar' },
  { label: 'Forma', icon: Shirt, to: '/forma' },
  { label: 'Ta’lim', icon: BookOpen, to: '/talim' },
]

const BARS = [38, 55, 68, 82, 96, 112, 124, 136, 152, 168, 188, 204]
const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
const LINE = [12, 22, 34, 48, 40, 58, 52, 66, 74, 86, 128, 146]

const TICKETS = [
  { label: 'Standart', pct: 56, n: 694, color: '#14a394' },
  { label: 'VIP', pct: 24, n: 298, color: '#5dcec4' },
  { label: 'Student', pct: 12, n: 149, color: '#a6e4db' },
  { label: 'Bepul', pct: 8, n: 99, color: '#d9f3ef' },
]

const SEMINARS = [
  { title: 'Implantologiya: nazariya va amaliyot', when: '24-noyabr 2026, 10:00', city: 'Toshkent', sold: 150, seats: 200, status: 'open', image: '/images/seminars/teeth.jpg', to: '/seminarlar/implant-toj' },
  { title: 'Endodontiya: kanal davolash asoslari', when: '12-oktabr 2026, 10:00', city: 'Samarqand', sold: 120, seats: 150, status: 'low', image: '/images/seminars/micro.jpg', to: '/seminarlar/mikroskop-endo' },
  { title: 'Oral jarrohlik: amaliy ko‘nikmalar', when: '5-avgust 2026, 10:00', city: 'Toshkent', sold: 180, seats: 180, status: 'full', image: '/images/seminars/surgery.jpg', to: '/seminarlar/sinus-lifting' },
  { title: 'Bolalar stomatologiyasi', when: '15-dekabr 2026, 10:00', city: 'Toshkent', sold: 30, seats: 100, status: 'open', image: '/images/seminars/smile.jpg', to: '/seminarlar' },
]

const STATUS = {
  open: { label: 'Ro‘yxat ochiq', cls: 'bg-[#e7f8ee] text-[#16a34a]' },
  low: { label: 'Joylar kam', cls: 'bg-[#fff4e0] text-[#d0890b]' },
  full: { label: 'To‘liq band', cls: 'bg-[#fde8ee] text-[#e11d48]' },
}

const ACTIVITY = [
  { icon: Users, title: 'Aliyeva Mohira ro‘yxatdan o‘tdi', text: 'Endodontiya: kanal davolash asoslari', time: '10:24' },
  { icon: Wallet, title: 'To‘lov qabul qilindi', text: '450 000 so‘m · VIP chipta', time: '09:17' },
  { icon: CalendarDays, title: 'Yangi seminar yaratildi', text: 'Estetik stomatologiya', time: 'Kecha' },
  { icon: Award, title: 'Sertifikat berildi', text: 'Karimov Shahzod', time: 'Kecha' },
  { icon: QrCode, title: 'QR orqali kirish tasdiqlandi', text: 'Oral jarrohlik seminari', time: '22.10.2026' },
]

const ACTIONS = [
  { icon: Send, label: 'Taklifnoma yuborish' },
  { icon: Download, label: 'QR tushirish' },
  { icon: Share2, label: 'Seminarni ulashish' },
]

export default function Organizer() {
  const [q, setQ] = useState('')
  const [banner, setBanner] = useState(true)
  const [menu, setMenu] = useState(false)
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return SEMINARS
    return SEMINARS.filter((x) => `${x.title} ${x.city}`.toLowerCase().includes(s))
  }, [q])

  return (
    <div className="flex h-[calc(100dvh/var(--z))] min-h-0 flex-col bg-[#f4fbfb] text-[#12324a]">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[#e7f2f0] bg-white px-3 pt-[env(safe-area-inset-top)] sm:px-5">
        <button type="button" onClick={() => setMenu(true)} aria-label="Menyu" className="grid size-10 place-items-center rounded-xl text-[#0c8f86] lg:hidden">
          <Menu className="size-5" />
        </button>
        <Logo />
        <label className="mx-auto hidden h-11 min-w-0 max-w-[560px] flex-1 items-center gap-2 rounded-full border border-[#e5f0ee] bg-[#f7fbfb] px-4 md:flex">
          <Search className="size-4 shrink-0 text-[#8aa4a8]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Seminar, ishtirokchi, ma’ruzachi yoki to‘lovni qidiring..." className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#9aafb4]" />
        </label>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button type="button" className="hidden h-10 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium text-[#1c4a5a] md:flex">
            <MapPin className="size-4 text-[#0c8f86]" /> Toshkent <ChevronDown className="size-3.5 text-[#8aa4a8]" />
          </button>
          <button type="button" aria-label="Kalendar" className="grid size-10 place-items-center rounded-full text-[#0c8f86] hover:bg-[#f3faf8]"><Calendar className="size-[18px]" /></button>
          <button type="button" aria-label="Bildirishnomalar" className="relative grid size-10 place-items-center rounded-full text-[#0c8f86] hover:bg-[#f3faf8]">
            <Bell className="size-[18px]" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-[#ef4444] ring-2 ring-white" />
          </button>
          <div className="ml-1 flex items-center gap-2 pl-1">
            <img src="/images/avatar.jpg" alt="" className="size-9 rounded-full object-cover" />
            <div className="hidden leading-tight sm:block">
              <p className="text-[13px] font-semibold">Ibrohim Karimov</p>
              <p className="text-[11px] text-[#7e9398]">Tashkilotchi</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Side open={menu} onClose={() => setMenu(false)} />
        <main className="min-w-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[22px] font-bold tracking-tight">Boshqaruv paneli</h1>
              <p className="mt-0.5 text-[13px] text-[#6e868c]">Seminarlaringiz umumiy ko‘rinishi va asosiy ko‘rsatkichlar</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="flex h-10 items-center gap-2 rounded-xl border border-[#e3eeec] bg-white px-3 text-[12.5px] font-medium text-[#1c4a5a]">
                <Calendar className="size-4 text-[#0c8f86]" /> 1-yan, 2026 — 31-dek, 2026 <ChevronDown className="size-3.5 text-[#8aa4a8]" />
              </button>
              <button type="button" className="flex h-10 items-center gap-1.5 rounded-xl bg-[#0c8f86] px-3.5 text-[13px] font-semibold text-white shadow-[0_6px_14px_rgb(12_143_134/0.28)]">
                <Plus className="size-4" /> Yangi seminar yaratish
              </button>
            </div>
          </div>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={GraduationCap} label="Jami seminarlar" value="12" delta="+3" text="o‘tgan oyga nisbatan" />
            <Stat icon={Users} label="Jami ishtirokchilar" value="1 240" delta="+18%" text="o‘tgan oyga nisbatan" />
            <Stat icon={Wallet} label="Umumiy tushum" value="98 600 000 so‘m" delta="+28%" text="o‘tgan oyga nisbatan" />
            <Stat icon={Award} label="Berilgan sertifikatlar" value="987" delta="+22%" text="o‘tgan oyga nisbatan" />
          </section>

          <section className="org-charts mt-3">
            <Card title="Ishtirokchilar dinamikasi" extra={<MiniSelect label="Ishtirokchilar soni" />}>
              <BarChart />
            </Card>
            <Card title="Tushumlar" extra={<MiniSelect label="So‘mda" />}>
              <p className="text-[20px] font-bold leading-none">98 600 000 so‘m</p>
              <LineChart />
            </Card>
            <Card title="Chipta turlari bo‘yicha sotuv">
              <Donut />
            </Card>
          </section>

          <section className="org-split mt-3">
            <div className="space-y-3">
              <Card
                title="Yaqinlashayotgan seminarlar"
                extra={<Link to="/seminarlar" className="text-[12.5px] font-semibold text-[#0c8f86]">Barchasini ko‘rish</Link>}
              >
                <ul className="divide-y divide-[#eef4f3]">
                  {list.map((s) => <SeminarRow key={s.title} s={s} />)}
                  {list.length === 0 && <li className="py-6 text-center text-[13px] text-[#7e9398]">Seminar topilmadi</li>}
                </ul>
              </Card>
              {banner && (
                <div className="flex items-center gap-3 rounded-2xl border border-[#d7f0ea] bg-[#eefaf6] px-4 py-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#0c8f86]"><Megaphone className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-bold">Seminarlaringizni kengroq auditoriyaga yetkazing</p>
                    <p className="text-[12px] text-[#5f7c80]">Platforma orqali reklama qiling va ko‘proq ishtirokchilar jalb qiling.</p>
                  </div>
                  <button type="button" className="hidden h-9 shrink-0 items-center gap-1 rounded-xl border border-[#b7e0d8] bg-white px-3 text-[12.5px] font-semibold text-[#0c8f86] sm:flex">
                    Marketing vositalari <span aria-hidden>→</span>
                  </button>
                  <button type="button" onClick={() => setBanner(false)} aria-label="Yopish" className="grid size-8 shrink-0 place-items-center rounded-lg text-[#7e9398]"><X className="size-4" /></button>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <Card title="So‘nggi faoliyatlar" extra={<button type="button" className="text-[12.5px] font-semibold text-[#0c8f86]">Barchasini ko‘rish</button>}>
                <ul className="space-y-3">
                  {ACTIVITY.map((a) => (
                    <li key={a.title} className="flex items-start gap-2.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e7f7f4] text-[#0c8f86]"><a.icon className="size-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-semibold">{a.title}</p>
                        <p className="truncate text-[11.5px] text-[#7e9398]">{a.text}</p>
                      </div>
                      <span className="shrink-0 text-[11px] text-[#8aa4a8]">{a.time}</span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title="Tezkor amallar">
                <div className="grid grid-cols-3 gap-2">
                  {ACTIONS.map(({ icon: Icon, label }) => (
                    <button key={label} type="button" className="flex flex-col items-center gap-2 rounded-xl px-1 py-2 text-center hover:bg-[#f4fbfb]">
                      <span className="grid size-10 place-items-center rounded-xl bg-[#e7f7f4] text-[#0c8f86]"><Icon className="size-[18px]" /></span>
                      <span className="text-[11.5px] font-medium leading-tight text-[#1c4a5a]">{label}</span>
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

function Side({ open, onClose }) {
  const body = (
    <>
      <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-[0.12em] text-[#8aa4a8]">SEMINAR TASHKILOTCHI</p>
      <nav className="space-y-0.5">
        {NAV.map(({ id, label, icon: Icon }) => (
          <span key={id} className={`flex h-9 items-center gap-2.5 rounded-xl px-3 text-[13px] ${id === 'panel' ? 'bg-[#e7f6f3] font-semibold text-[#0c8f86]' : 'text-[#3e5a62]'}`}>
            <Icon className="size-[18px]" strokeWidth={1.8} /> {label}
          </span>
        ))}
      </nav>
      <p className="mb-1.5 mt-5 px-3 text-[10px] font-semibold tracking-[0.12em] text-[#8aa4a8]">PLATFORMA</p>
      <nav className="space-y-0.5">
        {PLATFORM.map(({ label, icon: Icon, to }) => (
          <Link key={to} to={to} onClick={onClose} className="flex h-9 items-center gap-2.5 rounded-xl px-3 text-[13px] text-[#3e5a62] hover:bg-white">
            <Icon className="size-[18px]" strokeWidth={1.8} /> {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto space-y-0.5 pt-4">
        <span className="flex h-9 items-center gap-2.5 rounded-xl px-3 text-[13px] text-[#3e5a62]"><Settings className="size-[18px]" /> Sozlamalar</span>
        <span className="flex h-9 items-center gap-2.5 rounded-xl px-3 text-[13px] text-[#3e5a62]"><CircleQuestionMark className="size-[18px]" /> Yordam</span>
      </div>
    </>
  )
  return (
    <>
      <aside className="hidden w-[232px] shrink-0 flex-col border-r border-[#e7f2f0] bg-[#f7fcfb] px-3 py-4 lg:flex">{body}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Yopish" className="absolute inset-0 bg-[#0e2a3a]/30" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 flex w-[260px] flex-col overflow-y-auto bg-[#f7fcfb] px-3 py-4 shadow-xl">{body}</aside>
        </div>
      )}
    </>
  )
}

function Stat({ icon: Icon, label, value, delta, text }) {
  return (
    <article className="flex items-center gap-3 rounded-2xl border border-[#e7f2f0] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgb(16_40_40/0.03)]">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e7f7f4] text-[#0c8f86]"><Icon className="size-5" /></span>
      <div className="min-w-0">
        <p className="text-[12px] text-[#6e868c]">{label}</p>
        <p className="truncate text-[18px] font-bold leading-tight tracking-tight">{value}</p>
        <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-[#6e868c]">
          <TrendingUp className="size-3 text-[#16a34a]" />
          <span className="font-semibold text-[#16a34a]">{delta}</span> {text}
        </p>
      </div>
    </article>
  )
}

function Card({ title, extra, children }) {
  return (
    <section className="rounded-2xl border border-[#e7f2f0] bg-white p-4 shadow-[0_1px_2px_rgb(16_40_40/0.03)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[14.5px] font-bold">{title}</h2>
        {extra}
      </div>
      {children}
    </section>
  )
}

function MiniSelect({ label }) {
  return (
    <button type="button" className="flex h-8 items-center gap-1 rounded-lg border border-[#e6eeec] bg-white px-2.5 text-[12px] text-[#3e5a62]">
      {label} <ChevronDown className="size-3.5 text-[#8aa4a8]" />
    </button>
  )
}

function BarChart() {
  const max = 210
  return (
    <div className="mt-2">
      <div className="flex h-[168px] gap-2">
        <div className="flex h-full flex-col justify-between pb-5 text-[10px] text-[#9aafb4]">
          {[200, 150, 100, 50, 0].map((n) => <span key={n}>{n}</span>)}
        </div>
        <div className="flex min-w-0 flex-1 items-end gap-1.5 border-b border-[#eef3f2] pb-0">
          {BARS.map((v, i) => (
            <div key={MONTHS[i]} className="flex h-full min-w-0 flex-1 flex-col justify-end">
              <div className="w-full rounded-t-[5px] bg-[linear-gradient(180deg,#5dcec4_0%,#0e8f84_100%)]" style={{ height: `${(v / max) * 100}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="ml-7 mt-1.5 flex gap-1.5">
        {MONTHS.map((m) => <span key={m} className="flex-1 text-center text-[10px] text-[#8aa4a8]">{m}</span>)}
      </div>
    </div>
  )
}

function LineChart() {
  const w = 320
  const h = 120
  const max = 160
  const step = w / (LINE.length - 1)
  const pts = LINE.map((v, i) => [i * step, h - (v / max) * (h - 8) - 4])
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `${d} L${w},${h} L0,${h} Z`
  const dot = pts[10]
  return (
    <div className="relative mt-2">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[132px] w-full">
        {[0, 1, 2, 3].map((i) => <line key={i} x1="0" x2={w} y1={(h / 4) * i} y2={(h / 4) * i} stroke="#eef3f2" />)}
        <path d={area} fill="rgb(20 163 148 / 0.12)" />
        <path d={d} fill="none" stroke="#14a394" strokeWidth="2.4" strokeLinejoin="round" />
        <circle cx={dot[0]} cy={dot[1]} r="4" fill="#fff" stroke="#14a394" strokeWidth="2.4" />
      </svg>
      <div className="absolute rounded-lg bg-[#12324a] px-2 py-1 text-[10.5px] leading-tight text-white" style={{ left: '62%', top: 8 }}>
        Noyabr
        <br />
        18 400 000 so‘m
      </div>
      <div className="mt-1 flex">
        {MONTHS.map((m) => <span key={m} className="flex-1 text-center text-[10px] text-[#8aa4a8]">{m}</span>)}
      </div>
    </div>
  )
}

function Donut() {
  const r = 38
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 100 100" className="size-[112px] shrink-0">
        <g transform="rotate(-90 50 50)">
          {TICKETS.map((t) => {
            const len = (t.pct / 100) * c
            const dash = `${len} ${c - len}`
            const off = -acc
            acc += len
            return <circle key={t.label} cx="50" cy="50" r={r} fill="none" stroke={t.color} strokeWidth="14" strokeDasharray={dash} strokeDashoffset={off} />
          })}
        </g>
        <text x="50" y="48" textAnchor="middle" className="fill-[#12324a]" fontSize="13" fontWeight="700">1 240</text>
        <text x="50" y="62" textAnchor="middle" className="fill-[#7e9398]" fontSize="8">chipta</text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {TICKETS.map((t) => (
          <li key={t.label} className="grid grid-cols-[10px_1fr_auto_auto] items-center gap-1.5 text-[11.5px]">
            <span className="size-2.5 rounded-full" style={{ background: t.color }} />
            <span className="text-[#3e5a62]">{t.label}</span>
            <span className="font-semibold">{t.pct}%</span>
            <span className="w-7 text-right text-[#7e9398]">{t.n}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SeminarRow({ s }) {
  const st = STATUS[s.status]
  const pct = Math.round((s.sold / s.seats) * 100)
  const bar = s.status === 'full' ? 'bg-[#e11d48]' : s.status === 'low' ? 'bg-[#e8a317]' : 'bg-[#14a394]'
  return (
    <li className="flex items-center gap-3 py-3">
      <img src={s.image} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold">{s.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-[#7e9398]">
          <span className="inline-flex items-center gap-1"><Calendar className="size-3.5" /> {s.when}</span>
          <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {s.city}</span>
        </p>
      </div>
      <div className="hidden w-[108px] shrink-0 sm:block">
        <div className="h-1.5 overflow-hidden rounded-full bg-[#e8f1ef]">
          <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-right text-[11px] text-[#6e868c]">{s.sold} / {s.seats}</p>
      </div>
      <span className={`inline-flex h-7 items-center rounded-full px-2.5 text-[11.5px] font-semibold max-md:hidden ${st.cls}`}>{st.label}</span>
      <Link to={s.to} className="inline-flex h-8 items-center rounded-lg border border-[#d7ebe7] px-2.5 text-[12px] font-semibold text-[#0c8f86] max-lg:hidden">Tafsilotlar</Link>
      <button type="button" aria-label="Yana" className="grid size-8 place-items-center rounded-lg text-[#8aa4a8]"><Ellipsis className="size-4" /></button>
    </li>
  )
}
