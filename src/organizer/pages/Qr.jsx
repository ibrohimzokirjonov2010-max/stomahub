import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,   Calendar, CalendarDays, Camera, Check, ChevronDown, ChevronRight, Clock, CreditCard,
  House, MapPin, MoreHorizontal, Phone, QrCode, Settings, UserRound, Wallet, X, Zap,
} from 'lucide-react'
import { ToothIcon } from '../../components/icons'
import { CHECKINS, SEMINARS } from '../data'
import { useOrg } from '../Shell'
import { QrMark } from '../ui'

const TABS = [
  { id: 'scan', label: 'QR skaner', icon: QrCode },
  { id: 'manual', label: 'Manuel check-in', icon: UserRound },
  { id: 'history', label: 'Check-in tarixi', icon: Clock },
  { id: 'stats', label: 'Statistika', icon: BarChart3 },
  { id: 'settings', label: 'Sozlamalar', icon: Settings },
]

const TICKET_TONE = {
  'VIP chipta': 'bg-[#d8f5f2] text-[#0c8f86]',
  VIP: 'bg-[#d8f5f2] text-[#0c8f86]',
  Standart: 'bg-[#e5f1ff] text-[#3b82f6]',
  Student: 'bg-[#fff3d4] text-[#d3920b]',
  Guruh: 'bg-[#f1e8ff] text-[#8b5cf6]',
}

const FACES = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `/images/qr-face-${i}.png`)

export default function Qr() {
  const { notify } = useOrg()
  const [tab, setTab] = useState('scan')
  const [seminar, setSeminar] = useState('implant-nov')
  const [open, setOpen] = useState(false)
  const [list, setList] = useState(() => CHECKINS.map((row, i) => ({ ...row, avatar: FACES[i] || row.avatar })))
  const [scanning, setScanning] = useState(false)
  const [code, setCode] = useState('')
  const [sound, setSound] = useState(true)
  const [manualOpen, setManualOpen] = useState(false)
  const [mobileScan, setMobileScan] = useState(false)
  const pop = useRef(null)
  const sem = SEMINARS.find((s) => s.id === seminar) || SEMINARS[0]
  const pct = Math.round((sem.sold / sem.seats) * 100)

  useEffect(() => {
    const fn = (e) => { if (!pop.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const scan = () => {
    if (scanning) return
    setScanning(true)
    window.setTimeout(() => {
      setScanning(false)
      const hit = list.find((x) => !x.ok)
      if (hit) {
        setList((rows) => rows.map((r) => (r.id === hit.id ? { ...r, ok: true, time: 'hozir' } : r)))
        notify(sound ? `${hit.name} kirish qildi` : `${hit.name} qayd etildi`)
      } else notify('Yangi kod topilmadi')
    }, 700)
  }

  const manual = () => {
    const name = code.trim()
    if (name.length < 3) { notify('Ism yoki kod kiriting'); return }
    setList((rows) => [{ id: Date.now(), name, clinic: 'Mehmon', time: 'hozir', ticket: 'Standart', ok: true, avatar: FACES[0] }, ...rows])
    setCode('')
    setManualOpen(false)
    notify('Manuel check-in saqlandi')
  }

  const rescan = () => {
    setMobileScan(true)
    window.setTimeout(() => setMobileScan(false), 900)
  }

  return (
    <>
      <div className="-mt-3 hidden text-[#143044] lg:block">
        <div className="mb-[18px] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold leading-none tracking-tight text-[#163044]">QR Check-in</h1>
            <p className="mt-[7px] text-[13px] leading-none text-[#7e9499]">Seminar ishtirokchilarini QR kod orqali tekshiring</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <p className="flex items-center gap-1 text-[12px] text-[#8aa0a4]">
              <Link to="/tashkilotchi" className="hover:text-[#0c8f86]">Boshqaruv paneli</Link>
              <ChevronRight className="size-3.5" />
              <Link to="/tashkilotchi/seminarlar" className="hover:text-[#0c8f86]">Mening seminarlarim</Link>
              <ChevronRight className="size-3.5" />
              <span className="text-[#6d848a]">QR Check-in</span>
            </p>
            <div ref={pop} className="relative">
              <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-9 items-center gap-2 rounded-xl bg-[#0c8f86] px-3.5 text-[13px] font-semibold text-white shadow-[0_6px_14px_rgb(12_143_134/0.22)]">
                <Calendar className="size-4" /> Seminarni tanlash <ChevronDown className="size-4 opacity-90" />
              </button>
              {open && (
                <ul className="absolute right-0 z-20 mt-1 w-72 overflow-hidden rounded-xl border border-[#e6eeec] bg-white py-1 shadow-lg">
                  {SEMINARS.map((s) => (
                    <li key={s.id}>
                      <button type="button" className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-[#f4fbfa]" onClick={() => { setSeminar(s.id); setOpen(false) }}>{s.title}</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <section className="mb-5 flex h-[72px] items-center gap-3 rounded-2xl border border-[#e6f1ef] bg-white px-3 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
          <img src={sem.image} alt="" className="h-[52px] w-[84px] shrink-0 rounded-xl object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold leading-tight text-[#163044]">{sem.title}</p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#6e868c]">
              <span className="inline-flex items-center gap-1"><Calendar className="size-3.5 text-[#0c8f86]" /> {sem.date}, 10:00</span>
              <span className="inline-flex items-center gap-1"><MapPin className="size-3.5 text-[#0c8f86]" /> {sem.city}, Congress Hall</span>
              <span className="inline-flex h-[22px] items-center gap-1 rounded-full bg-[#e7f8ee] px-2 text-[11.5px] font-semibold text-[#16a34a]">
                <span className="size-1.5 rounded-full bg-[#16a34a]" /> Faol
              </span>
            </p>
          </div>
          <div className="w-[148px] shrink-0">
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="font-bold text-[#163044]">{sem.sold} / {sem.seats}</span>
              <span className="font-semibold text-[#5e787e]">{pct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e6f3f1]">
              <div className="h-full rounded-full bg-[#14b8a6]" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </section>

        <div className="mb-[22px] grid grid-cols-[137px_minmax(0,1.05fr)_minmax(0,1fr)] items-start gap-4">
          <nav className="rounded-2xl border border-[#e7f2f0] bg-white p-1.5 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
            {TABS.map(({ id, label, icon: Icon }) => {
              const on = tab === id
              return (
                <button key={id} type="button" onClick={() => setTab(id)} className={`flex h-9 w-full items-center gap-2 rounded-xl px-2 text-left text-[12.5px] ${on ? 'bg-[#e7f7f4] font-semibold text-[#0c8f86]' : 'text-[#3e5962] hover:bg-[#f6fbfa]'}`}>
                  <Icon className="size-4 shrink-0" strokeWidth={1.8} />
                  <span className="truncate">{label}</span>
                </button>
              )
            })}
          </nav>

          <div className="min-w-0">
            {tab === 'scan' && (
              <div className="relative h-[434px] overflow-hidden rounded-[20px] bg-[#1a2428]">
                <img src="/images/qr-scanner-desk.png" alt="" className="size-full object-cover object-center" />
                {scanning && <div className="pointer-events-none absolute inset-x-[18%] top-[46%] h-0.5 animate-pulse bg-[#5dcec4] shadow-[0_0_16px_#5dcec4]" />}
                <button type="button" onClick={scan} className="absolute bottom-[18px] left-1/2 h-11 w-[196px] -translate-x-1/2 rounded-xl text-[13px] font-semibold text-transparent">
                  {scanning ? 'Tekshirilmoqda' : 'QR kodni skanerlang'}
                </button>
              </div>
            )}
            {tab === 'manual' && (
              <Panel title="Manuel check-in">
                <label className="block text-[12.5px] font-semibold text-[#3e5962]">Ism yoki chipta kodi</label>
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Aliyeva Mohira yoki STH-2026-0001" className="mt-1.5 h-10 w-full rounded-xl border border-[#e4eeec] px-3 text-[13px] outline-none focus:border-[#0c8f86]" />
                <button type="button" onClick={manual} className="mt-3 h-10 rounded-xl bg-[#0c8f86] px-4 text-[13px] font-semibold text-white">Check-in qilish</button>
              </Panel>
            )}
            {tab === 'history' && (
              <Panel title="Check-in tarixi" pad={false}>
                <ul className="max-h-[390px] divide-y divide-[#f0f5f4] overflow-y-auto">
                  {list.map((p) => <CheckRow key={p.id} p={p} />)}
                </ul>
              </Panel>
            )}
            {tab === 'stats' && (
              <div className="grid h-[434px] content-start gap-3 sm:grid-cols-2">
                <MiniStat label="Jami ishtirokchilar" value="200" />
                <MiniStat label="Check-in qilingan" value={String(list.filter((x) => x.ok).length + 142)} hint="75%" />
                <MiniStat label="Kutilmoqda" value="50" hint="25%" />
                <MiniStat label="QR kodlar" value="200" hint="Barchasi faol" />
              </div>
            )}
            {tab === 'settings' && (
              <Panel title="Skaner sozlamalari">
                <label className="flex items-center justify-between text-[13px]">
                  <span>Muvaffaqiyatli ovoz</span>
                  <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
                </label>
                <button type="button" onClick={() => notify('Sozlamalar saqlandi')} className="mt-3 h-10 rounded-xl bg-[#0c8f86] px-4 text-[13px] font-semibold text-white">Saqlash</button>
              </Panel>
            )}
          </div>

          <section className="flex h-[434px] flex-col overflow-hidden rounded-2xl border border-[#e7f2f0] bg-white shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
            <header className="flex items-center justify-between px-3.5 pb-1 pt-3">
              <h2 className="text-[14.5px] font-bold text-[#163044]">So‘nggi check-inlar</h2>
              <button type="button" onClick={() => setTab('history')} className="text-[12.5px] font-semibold text-[#0c8f86]">Barchasini ko‘rish</button>
            </header>
            <ul className="min-h-0 flex-1">
              {list.slice(0, 8).map((p) => <CheckRow key={p.id} p={p} />)}
            </ul>
          </section>
        </div>

        <section className="grid grid-cols-4 gap-3">
          <Stat icon={UserRound} label="Jami ishtirokchilar" value="200" />
          <Stat icon={Check} label="Check-in qilingan" value="150" bar={75} barClass="bg-[#14b8a6]" hint="75%" hintClass="text-[#0c8f86]" />
          <Stat icon={Clock} label="Kutilmoqda" value="50" bar={25} barClass="bg-[#f0b429]" hint="25%" hintClass="text-[#e09a12]" iconBg="bg-[#fff4e0] text-[#e09a12]" />
          <Stat icon={QrCode} label="QR kodlar" value="200" hint="Barchasi faol" hintClass="text-[#16a34a]" />
        </section>
      </div>

      <div className="fixed inset-0 z-[70] flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#f4fbfa] text-[#143044] lg:hidden">
        <StatusBar />
        <header className="flex shrink-0 items-center justify-between gap-2 px-3.5 pb-1.5 pt-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <ToothIcon className="size-8 shrink-0 text-[#12a394]" strokeWidth={1.7} />
            <div className="min-w-0 leading-tight">
              <p className="text-[16px] font-extrabold leading-none tracking-tight text-[#123246]">StomaHub</p>
              <p className="mt-0.5 text-[11px] text-[#7e9499]">Seminar tashkilotchisi</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#e7f6f3] px-2.5 py-1.5 text-[12.5px] font-semibold text-[#0c8f86]">
            <UserRound className="size-3.5" />
            Keldi
            <span className="font-bold">28 / 42</span>
          </div>
        </header>

        <section className="mx-3 flex shrink-0 items-center gap-2.5 rounded-2xl border border-[#e6f1ef] bg-white p-2 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
          <img src="/images/seminars/teeth.jpg" alt="" className="size-[52px] shrink-0 rounded-xl object-cover" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[#0c8f86]">Implantologiya</p>
            <p className="truncate text-[14px] font-bold leading-tight text-[#16324a]">Implantologiya: amaliy kurs</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#6e868c]"><Calendar className="size-3 text-[#0c8f86]" /> 21 oktabr 2026, 09:00 – 18:00</p>
            <p className="flex items-center gap-1 text-[11px] text-[#6e868c]"><MapPin className="size-3 text-[#0c8f86]" /> Toshkent City Kongress Markazi</p>
          </div>
        </section>

        <div className="relative mx-3 mt-2 min-h-0 flex-1 overflow-hidden rounded-[26px] bg-[#0e242c]">
          <img src="/images/ishlar/ish-reception.jpg" alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-[#062028]/45" />
          <img src="/images/qr-hand.png" alt="" className="absolute inset-0 size-full object-cover object-[center_42%]" style={{ maskImage: 'radial-gradient(ellipse 78% 72% at 50% 48%, #000 42%, transparent 74%)', WebkitMaskImage: 'radial-gradient(ellipse 78% 72% at 50% 48%, #000 42%, transparent 74%)' }} />
          <button type="button" aria-label="Chaqmoq" className="absolute left-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-black/40 text-white">
            <Zap className="size-4" />
          </button>
          <button type="button" aria-label="Kamera" className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-black/40 text-white">
            <Camera className="size-4" />
          </button>
          <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/50 px-3 py-1.5 text-[12px] font-medium text-white">
            QR kodni skaner qiling
          </div>
          <CornerFrame />
          <div className="absolute left-1/2 top-[54px] z-[2] w-[150px] -translate-x-1/2 rounded-[20px] border-[5px] border-[#141414] bg-white px-2 pb-2 pt-1.5 text-center shadow-2xl">
            <p className="text-[10px] font-extrabold text-[#0c8f86]">StomaHub</p>
            <p className="text-[8px] leading-tight text-[#5c7278]">Implantologiya: amaliy kurs</p>
            <div className="mx-auto my-1 w-fit"><QrMark size={78} seed={9} /></div>
            <p className="text-[11px] font-bold leading-tight text-[#163044]">Aliyeva Mohira</p>
            <span className="mt-0.5 inline-flex rounded-full bg-[#e8eef2] px-2 py-px text-[9px] font-semibold text-[#5e787e]">Standart</span>
            <p className="mt-1 text-[8px] leading-tight text-[#8aa0a4]">21 oktabr 2026</p>
            <p className="text-[8px] leading-tight text-[#8aa0a4]">Toshkent City Kongress Markazi</p>
          </div>
          {mobileScan && <div className="pointer-events-none absolute inset-x-[18%] top-1/2 z-[3] h-0.5 bg-[#5eecc8] shadow-[0_0_12px_#5eecc8]" />}
        </div>

        <div className="relative z-10 -mt-4 shrink-0 rounded-t-[26px] bg-white px-3.5 pb-2 pt-3 shadow-[0_-8px_24px_rgb(12_40_50/0.06)]">
          {manualOpen ? (
            <div className="pb-2">
              <p className="text-[14px] font-bold">Qo‘lda belgilash</p>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ism yoki chipta kodi" className="mt-2 h-10 w-full rounded-xl border border-[#e4eeec] px-3 text-[13px] outline-none" />
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setManualOpen(false)} className="h-10 flex-1 rounded-xl border border-[#d7ebe6] text-[13px] font-semibold text-[#0c8f86]">Bekor</button>
                <button type="button" onClick={manual} className="h-10 flex-1 rounded-xl bg-[#0c8f86] text-[13px] font-semibold text-white">Saqlash</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <img src="/images/qr-face-0.png" alt="" className="size-12 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-bold leading-tight text-[#16324a]">Aliyeva Mohira</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-[#5e787e]">
                    <Phone className="size-3.5 text-[#0c8f86]" />
                    +998 90 123 45 67
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-[#5e787e]">
                    <CreditCard className="size-3.5 text-[#0c8f86]" />
                    Standart chipta
                  </p>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e7f8f1] text-[#16a34a]">
                  <Check className="size-6" strokeWidth={2.4} />
                </span>
              </div>
              <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-[#e7f8f3] px-3 py-2.5">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#14b8a6] text-white">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <div>
                  <p className="text-[14px] font-bold text-[#143044]">Kirish tasdiqlandi</p>
                  <p className="text-[12px] leading-snug text-[#5e787e]">Ishtirokchi muvaffaqiyatli ro‘yxatdan o‘tkazildi.</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setManualOpen(true)} className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[#d5ebe6] bg-white text-[13px] font-semibold text-[#143044]">
                  <UserRound className="size-4 text-[#0c8f86]" /> Qo‘lda belgilash
                </button>
                <button type="button" onClick={rescan} className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#0c8f86] text-[13px] font-semibold text-white">
                  <QrCode className="size-4" /> Yana skaner qilish
                </button>
              </div>
            </>
          )}
        </div>

        <nav className="mt-auto shrink-0 border-t border-[#eef3f2] bg-white">
          <ul className="grid h-[54px] grid-cols-5 items-end">
            <TabLink to="/tashkilotchi" icon={House} label="Panel" />
            <TabLink to="/tashkilotchi/seminarlar" icon={CalendarDays} label="Seminarlar" />
            <li className="flex flex-col items-center">
              <span className="-mt-4 grid size-12 place-items-center rounded-full bg-[#0c8f86] text-white shadow-[0_8px_16px_rgb(12_143_134/0.35)]">
                <QrCode className="size-5" />
              </span>
              <span className="mt-0.5 text-[10px] font-semibold text-[#0c8f86]">Check-in</span>
            </li>
            <TabLink to="/tashkilotchi/hamyon" icon={Wallet} label="Hamyon" />
            <TabLink to="/tashkilotchi/sozlamalar" icon={MoreHorizontal} label="Yana" />
          </ul>
          <div className="mx-auto mb-1 h-1 w-28 rounded-full bg-[#111]" />
        </nav>
      </div>
    </>
  )
}

function TabLink({ to, icon: Icon, label }) {
  return (
    <li>
      <Link to={to} className="flex h-full flex-col items-center justify-center gap-0.5 text-[10px] text-[#8aa0a4]">
        <Icon className="size-[18px]" strokeWidth={1.8} />
        {label}
      </Link>
    </li>
  )
}

function StatusBar() {
  return (
    <div className="flex h-11 items-end justify-between px-5 pb-1.5 text-[14px] font-semibold text-[#111]">
      <span>9:41</span>
      <span className="flex items-center gap-1.5">
        <svg width="17" height="12" viewBox="0 0 17 12" aria-hidden><rect x="0" y="7" width="3" height="5" rx="0.5" fill="#111" /><rect x="4.5" y="5" width="3" height="7" rx="0.5" fill="#111" /><rect x="9" y="2.5" width="3" height="9.5" rx="0.5" fill="#111" /><rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="#111" /></svg>
        <svg width="15" height="12" viewBox="0 0 15 12" aria-hidden><path d="M7.5 2.2c2.2 0 4.2.9 5.7 2.3l-1.2 1.2A6.2 6.2 0 0 0 7.5 4 6.2 6.2 0 0 0 3 5.7L1.8 4.5A8 8 0 0 1 7.5 2.2Z" fill="#111" /><path d="M7.5 5.6c1.2 0 2.3.5 3.1 1.3L9.4 8.1A2.7 2.7 0 0 0 7.5 7.2 2.7 2.7 0 0 0 5.6 8.1L4.4 6.9A4.4 4.4 0 0 1 7.5 5.6Z" fill="#111" /><circle cx="7.5" cy="10.2" r="1.3" fill="#111" /></svg>
        <svg width="25" height="12" viewBox="0 0 25 12" aria-hidden><rect x="0.5" y="0.5" width="21" height="11" rx="2.5" stroke="#111" fill="none" /><rect x="2" y="2" width="16" height="8" rx="1" fill="#111" /><rect x="22.5" y="3.5" width="1.5" height="5" rx="0.5" fill="#111" /></svg>
      </span>
    </div>
  )
}

function CornerFrame() {
  const base = 'pointer-events-none absolute size-9 border-[#3ee0c8]'
  return (
    <>
      <span className={`${base} left-[14%] top-[20%] rounded-tl-md border-l-[3px] border-t-[3px]`} />
      <span className={`${base} right-[14%] top-[20%] rounded-tr-md border-r-[3px] border-t-[3px]`} />
      <span className={`${base} bottom-[18%] left-[14%] rounded-bl-md border-b-[3px] border-l-[3px]`} />
      <span className={`${base} bottom-[18%] right-[14%] rounded-br-md border-b-[3px] border-r-[3px]`} />
    </>
  )
}

function CheckRow({ p }) {
  const tone = TICKET_TONE[p.ticket] || TICKET_TONE.Standart
  return (
    <li className="grid grid-cols-[36px_minmax(0,1fr)_34px_auto] items-center gap-x-2 px-3 py-[7px]">
      <img src={p.avatar} alt="" className="size-9 rounded-full object-cover" />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold leading-tight text-[#163044]">{p.name}</p>
        <p className="truncate text-[11px] leading-tight text-[#8aa0a4]">{p.clinic}</p>
      </div>
      <span className="text-center text-[11px] text-[#8aa0a4]">{p.time}</span>
      <span className="flex items-center justify-end gap-1.5">
        <span className={`inline-flex h-5 items-center whitespace-nowrap rounded-full px-2 text-[10.5px] font-semibold ${tone}`}>{p.ticket}</span>
        <span className={`inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-semibold ${p.ok ? 'text-[#1aaa5b]' : 'text-[#ef4d6a]'}`}>
          {p.ok ? <Check className="size-3.5" strokeWidth={2.6} /> : <X className="size-3.5" strokeWidth={2.6} />}
          {p.ok ? 'Kirish qildi' : 'Bekor qilingan'}
        </span>
      </span>
    </li>
  )
}

function Stat({ icon: Icon, label, value, bar, barClass, hint, hintClass, iconBg = 'bg-[#e7f7f4] text-[#0c8f86]' }) {
  return (
    <article className="flex min-h-[76px] items-center gap-3 rounded-2xl border border-[#e7f2f0] bg-white px-3.5 py-2.5 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
      <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${iconBg}`}><Icon className="size-5" strokeWidth={1.8} /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] leading-tight text-[#7e9499]">{label}</p>
        <p className="text-[22px] font-bold leading-none tracking-tight text-[#163044]">{value}</p>
        {bar != null && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#e7f0ee]">
              <div className={`h-full rounded-full ${barClass}`} style={{ width: `${bar}%` }} />
            </div>
            <span className={`text-[11px] font-semibold ${hintClass}`}>{hint}</span>
          </div>
        )}
        {bar == null && hint && <p className={`mt-0.5 text-[12px] font-semibold ${hintClass}`}>{hint}</p>}
      </div>
    </article>
  )
}

function MiniStat({ label, value, hint }) {
  return (
    <article className="rounded-2xl border border-[#e7f2f0] bg-white px-4 py-3">
      <p className="text-[12px] text-[#7e9499]">{label}</p>
      <p className="text-[22px] font-bold leading-tight">{value}</p>
      {hint && <p className="text-[12px] font-semibold text-[#16a34a]">{hint}</p>}
    </article>
  )
}

function Panel({ title, children, pad = true }) {
  return (
    <section className="h-[434px] overflow-hidden rounded-2xl border border-[#e7f2f0] bg-white shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
      <h2 className="px-4 pt-3.5 text-[14.5px] font-bold">{title}</h2>
      <div className={pad ? 'p-4 pt-3' : 'pt-2'}>{children}</div>
    </section>
  )
}
