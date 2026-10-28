import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import jsQR from 'jsqr'
import {
  BarChart3, Calendar, Camera, Check, ChevronDown, ChevronRight, Clock, CreditCard,
  MapPin, Phone, QrCode, Settings, UserRound, X,
} from 'lucide-react'
import { useOrg } from '../Shell'
import { checkInPayload, setQrSound, useHub } from '../../hubStore'
const TABS = [
  { id: 'scan', label: 'QR skaner', icon: QrCode },
  { id: 'manual', label: 'Qo‘lda check-in', icon: UserRound },
  { id: 'history', label: 'Check-in tarixi', icon: Clock },
  { id: 'stats', label: 'Statistika', icon: BarChart3 },
  { id: 'settings', label: 'Sozlamalar', icon: Settings },
]

const TICKET_TONE = {
  'VIP chipta': 'bg-[#d8f5f2] text-[var(--color-org-teal)]',
  VIP: 'bg-[#d8f5f2] text-[var(--color-org-teal)]',
  Standart: 'bg-[#e5f1ff] text-[#3b82f6]',
  Student: 'bg-[#fff3d4] text-[#d3920b]',
  Guruh: 'bg-[#f1e8ff] text-[#8b5cf6]',
}

const FACES = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `/images/qr-face-${i}.png`)

export default function Qr() {
  const { notify } = useOrg()
  const hub = useHub()
  const SEMINARS = hub.seminars
  const [tab, setTab] = useState('scan')
  const [seminar, setSeminar] = useState(hub.seminars[0]?.id || '')
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [sound, setSound] = useState(hub.qrSound !== false)
  const [manualOpen, setManualOpen] = useState(false)
  const [last, setLast] = useState(null)
  const seen = useRef('')
  const pop = useRef(null)
  const sem = SEMINARS.find((s) => s.id === seminar) || SEMINARS[0]
  const list = hub.participants.filter((p) => p.seminarId === sem?.id).map((p, i) => ({
    id: p.id, name: p.name, clinic: p.clinic, time: p.arrived ? 'hozir' : '—', ticket: p.ticket, ok: !!p.arrived, avatar: FACES[i] || p.avatar,
  }))
  const arrived = list.filter((p) => p.ok).length
  const pct = sem?.seats ? Math.round((sem.sold / sem.seats) * 100) : 0

  useEffect(() => {
    if (!seminar && hub.seminars[0]?.id) setSeminar(hub.seminars[0].id)
  }, [hub.seminars, seminar])

  useEffect(() => {
    const fn = (e) => { if (!pop.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const applyCode = (text) => {
    const raw = String(text || '').trim()
    if (!raw || raw === seen.current) return
    seen.current = raw
    window.setTimeout(() => { if (seen.current === raw) seen.current = '' }, 1800)
    const res = checkInPayload(sem?.id, raw)
    if (!res.ok) { notify(res.error); return }
    setLast(res.person)
    notify(res.already ? `${res.person.name} allaqachon kirgan` : (sound ? `${res.person.name} — Keldi` : `${res.person.name} qayd etildi`))
  }

  const manual = () => {
    const name = code.trim()
    setCode('')
    setManualOpen(false)
    applyCode(name)
  }

  if (!sem) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d5ebe6] bg-white px-6 py-14 text-center">
        <QrCode className="mx-auto size-8 text-[var(--color-org-teal)]" />
        <p className="mt-3 text-[16px] font-bold text-[#143044]">Hali seminar yo‘q</p>
        <p className="mt-1 text-[13px] text-[#6e868c]">Check-in uchun avval o‘z seminaringizni yarating.</p>
        <Link to="/tashkilotchi/seminarlar/yangi" className="mt-4 inline-flex h-10 items-center rounded-xl bg-[var(--color-org-teal)] px-4 text-[13px] font-semibold text-white">Seminar yaratish</Link>
      </div>
    )
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
              <Link to="/tashkilotchi" className="hover:text-[var(--color-org-teal)]">Boshqaruv paneli</Link>
              <ChevronRight className="size-3.5" />
              <Link to="/tashkilotchi/seminarlar" className="hover:text-[var(--color-org-teal)]">Mening seminarlarim</Link>
              <ChevronRight className="size-3.5" />
              <span className="text-[#6d848a]">QR Check-in</span>
            </p>
            <div ref={pop} className="relative">
              <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-9 items-center gap-2 rounded-xl bg-[var(--color-org-teal)] px-3.5 text-[13px] font-semibold text-white shadow-[0_6px_14px_rgb(12_143_134/0.22)]">
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
              <span className="inline-flex items-center gap-1"><Calendar className="size-3.5 text-[var(--color-org-teal)]" /> {sem.date}{sem.startTime ? `, ${sem.startTime}` : ''}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="size-3.5 text-[var(--color-org-teal)]" /> {sem.place || sem.city}</span>
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
                <button key={id} type="button" onClick={() => setTab(id)} className={`flex h-9 w-full items-center gap-2 rounded-xl px-2 text-left text-[12.5px] ${on ? 'bg-[#e7f7f4] font-semibold text-[var(--color-org-teal)]' : 'text-[#3e5962] hover:bg-[#f6fbfa]'}`}>
                  <Icon className="size-4 shrink-0" strokeWidth={1.8} />
                  <span className="truncate">{label}</span>
                </button>
              )
            })}
          </nav>

          <div className="min-w-0">
            {tab === 'scan' && (
              <div className="relative h-[434px] overflow-hidden rounded-[20px]">
                <CameraScan onCode={applyCode} onManual={() => setTab('manual')} manualLabel="Qo‘lda check-in" />
              </div>
            )}
            {tab === 'manual' && (
              <Panel title="Qo‘lda check-in">
                <label className="block text-[12.5px] font-semibold text-[#3e5962]">Ism yoki chipta kodi</label>
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Aliyeva Mohira yoki STH-2026-0001" className="mt-1.5 h-10 w-full rounded-xl border border-[#e4eeec] px-3 text-[13px] outline-none focus:border-[var(--color-org-teal)]" />
                <button type="button" onClick={manual} className="mt-3 h-10 rounded-xl bg-[var(--color-org-teal)] px-4 text-[13px] font-semibold text-white">Check-in qilish</button>
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
                <MiniStat label="Jami ishtirokchilar" value={String(list.length)} />
                <MiniStat label="Check-in qilingan" value={String(arrived)} hint={list.length ? `${Math.round((arrived / list.length) * 100)}%` : '0%'} />
                <MiniStat label="Kutilmoqda" value={String(list.length - arrived)} hint={list.length ? `${Math.round(((list.length - arrived) / list.length) * 100)}%` : '0%'} />
                <MiniStat label="QR kodlar" value={String(list.length)} hint="Barchasi faol" />
              </div>
            )}
            {tab === 'settings' && (
              <Panel title="Skaner sozlamalari">
                <label className="flex items-center justify-between text-[13px]">
                  <span>Muvaffaqiyatli ovoz</span>
                  <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
                </label>
                <button type="button" onClick={() => { setQrSound(sound); notify('Sozlamalar saqlandi') }} className="mt-3 h-10 rounded-xl bg-[var(--color-org-teal)] px-4 text-[13px] font-semibold text-white">Saqlash</button>
              </Panel>
            )}
          </div>

          <section className="flex h-[434px] flex-col overflow-hidden rounded-2xl border border-[#e7f2f0] bg-white shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
            <header className="flex items-center justify-between px-3.5 pb-1 pt-3">
              <h2 className="text-[14.5px] font-bold text-[#163044]">So‘nggi check-inlar</h2>
              <button type="button" onClick={() => setTab('history')} className="text-[12.5px] font-semibold text-[var(--color-org-teal)]">Barchasini ko‘rish</button>
            </header>
            <ul className="min-h-0 flex-1">
              {list.slice(0, 8).map((p) => <CheckRow key={p.id} p={p} />)}
            </ul>
          </section>
        </div>

        <section className="grid grid-cols-4 gap-3">
          <Stat icon={UserRound} label="Jami ishtirokchilar" value={String(list.length)} />
          <Stat icon={Check} label="Check-in qilingan" value={String(arrived)} bar={list.length ? Math.round((arrived / list.length) * 100) : 0} barClass="bg-[#14b8a6]" hint={list.length ? `${Math.round((arrived / list.length) * 100)}%` : '0%'} hintClass="text-[var(--color-org-teal)]" />
          <Stat icon={Clock} label="Kutilmoqda" value={String(list.length - arrived)} bar={list.length ? Math.round(((list.length - arrived) / list.length) * 100) : 0} barClass="bg-[#f0b429]" hint="kutilmoqda" hintClass="text-[#e09a12]" iconBg="bg-[#fff4e0] text-[#e09a12]" />
          <Stat icon={QrCode} label="QR kodlar" value={String(list.length)} hint="Barchasi faol" hintClass="text-[#16a34a]" />
        </section>
      </div>

      <div className="text-[#143044] lg:hidden">
        <div className="mb-2 flex justify-end">
          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#e7f6f3] px-2.5 py-1.5 text-[12.5px] font-semibold text-org-teal">
            <UserRound className="size-3.5" />
            Keldi
            <span className="font-bold">{arrived} / {list.length}</span>
          </div>
        </div>

        <section className="flex items-center gap-2.5 rounded-2xl border border-[#e6f1ef] bg-white p-2 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
          <img src={sem?.image || '/images/seminars/teeth.jpg'} alt="" className="size-[52px] shrink-0 rounded-xl object-cover" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[var(--color-org-teal)]">{sem?.topic}</p>
            <p className="truncate text-[14px] font-bold leading-tight text-[#16324a]">{sem?.title}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#6e868c]"><Calendar className="size-3 text-[var(--color-org-teal)]" /> {sem?.date}, {sem?.startTime || '10:00'}</p>
            <p className="flex items-center gap-1 text-[11px] text-[#6e868c]"><MapPin className="size-3 text-[var(--color-org-teal)]" /> {sem?.place || sem?.city}</p>
          </div>
        </section>

        <div className="relative mt-2 h-[420px] overflow-hidden rounded-[26px]">
          <CameraScan onCode={applyCode} onManual={() => setManualOpen(true)} manualLabel="Qo‘lda belgilash" />
        </div>

        <div className="relative z-10 -mt-4 shrink-0 rounded-t-[26px] bg-white px-3.5 pb-2 pt-3 shadow-[0_-8px_24px_rgb(12_40_50/0.06)]">
          {manualOpen ? (
            <div className="pb-2">
              <p className="text-[14px] font-bold">Qo‘lda belgilash</p>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ism yoki chipta kodi" className="mt-2 h-10 w-full rounded-xl border border-[#e4eeec] px-3 text-[13px] outline-none" />
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setManualOpen(false)} className="h-10 flex-1 rounded-xl border border-[#d7ebe6] text-[13px] font-semibold text-[var(--color-org-teal)]">Bekor</button>
                <button type="button" onClick={manual} className="h-10 flex-1 rounded-xl bg-[var(--color-org-teal)] text-[13px] font-semibold text-white">Saqlash</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <img src="/images/qr-face-0.png" alt="" className="size-12 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-bold leading-tight text-[#16324a]">{last?.name || 'Ishtirokchi'}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-[#5e787e]">
                    <Phone className="size-3.5 text-[var(--color-org-teal)]" />
                    {last?.phone || '—'}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-[#5e787e]">
                    <CreditCard className="size-3.5 text-[var(--color-org-teal)]" />
                    {last?.ticket || 'Chipta'}
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
                  <UserRound className="size-4 text-[var(--color-org-teal)]" /> Qo‘lda belgilash
                </button>
                <button type="button" onClick={() => setManualOpen(false)} className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-org-teal)] text-[13px] font-semibold text-white">
                  <QrCode className="size-4" /> Yana skaner qilish
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </>
  )
}

function CameraScan({ onCode, onManual, manualLabel }) {
  const videoRef = useRef(null)
  const onCodeRef = useRef(onCode)
  onCodeRef.current = onCode
  const [phase, setPhase] = useState('loading')

  useEffect(() => {
    let stream
    let raf = 0
    let dead = false
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    let busy = false
    const stopTracks = () => stream?.getTracks().forEach((t) => t.stop())
    const giveUp = window.setTimeout(() => { if (!dead && !stream) setPhase('off') }, 4000)
    const begin = async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setPhase('off'); return }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      } catch {
        if (!dead) setPhase('off')
        return
      }
      if (dead) { stopTracks(); return }
      const video = videoRef.current
      if (!video) { stopTracks(); setPhase('off'); return }
      video.srcObject = stream
      try { await video.play() } catch { /* autoplay bloklansa ham kadr turadi */ }
      if (!dead) setPhase('live')
      const tick = () => {
        if (dead) return
        if (video.readyState >= 2 && !busy && video.videoWidth) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0)
          const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const hit = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' })
          if (hit?.data) {
            busy = true
            onCodeRef.current(hit.data)
            window.setTimeout(() => { busy = false }, 1600)
          }
        }
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    begin()
    return () => {
      dead = true
      window.clearTimeout(giveUp)
      cancelAnimationFrame(raf)
      stopTracks()
    }
  }, [])

  return (
    <div className="relative h-full bg-[#12343c]">
      <video ref={videoRef} className={`size-full object-cover ${phase === 'live' ? '' : 'hidden'}`} playsInline muted autoPlay />
      {phase === 'live' && (
        <>
          <CornerFrame />
          <p className="absolute inset-x-4 top-3 text-center text-[12.5px] font-medium text-white">QR kodni ramka ichiga oling</p>
        </>
      )}
      {phase !== 'live' && (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-white">
          <Camera className="size-8 text-[#7dfff0]" />
          <p className="text-[16px] font-bold">{phase === 'loading' ? 'Kamera so‘ralmoqda' : 'Kamera mavjud emas'}</p>
          <p className="max-w-[300px] text-[13px] leading-snug text-white/85">
            {phase === 'loading'
              ? 'Brauzer kameraga ruxsat so‘ramoqda.'
              : 'Kamerani ochib bo‘lmadi. Ishtirokchini qo‘lda belgilash orqali check-in qiling — ism, telefon yoki chipta kodi.'}
          </p>
          {phase === 'off' && (
            <button type="button" onClick={onManual} className="mt-1 h-10 rounded-xl bg-white px-4 text-[13px] font-semibold text-[#143044]">{manualLabel}</button>
          )}
        </div>
      )}
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

function Stat({ icon: Icon, label, value, bar, barClass, hint, hintClass, iconBg = 'bg-[#e7f7f4] text-[var(--color-org-teal)]' }) {
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
