import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Award, Calendar, Camera, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, Crown,
  GraduationCap, Image as ImageIcon, Info, LayoutGrid, MapPin, Monitor, Pencil, Plus, Save, Star, Ticket, Trash2,
} from 'lucide-react'
import { ORG, num, som } from '../data'
import { useOrg } from '../Shell'
import { useMobile } from '../../useMobile'
import { ABOUT, CATS, COVERS, FORMATS, STEPS, TEAL, TOPICS, box, readImage, uzDate } from './wizardBits'
import { PromoModal, SpeakerModal, TicketModal } from './WizardModals'
import WizardMobile from './WizardMobile'

const TICKET_ICON = { ticket: Ticket, crown: Crown, cap: GraduationCap, star: Star, award: Award }

const INITIAL_TICKETS = [
  { id: 't1', name: 'Standart', price: 450000, seats: 100, perks: ['Seminarga kirish', 'Materiallar', 'Sertifikat'], active: true, basic: true, tone: 'teal', icon: 'ticket' },
  { id: 't2', name: 'VIP', price: 850000, seats: 30, perks: ['Seminarga kirish', 'Maxsus materiallar', 'Oldingi qator o‘rinlar', 'Kofe-breyk', 'Sertifikat', 'Ma’ruzachilar bilan foto'], active: true, tone: 'gold', icon: 'crown' },
  { id: 't3', name: 'Student', price: 250000, seats: 50, perks: ['Seminarga kirish', 'Materiallar', 'Sertifikat'], active: true, tone: 'violet', icon: 'cap' },
]

const INITIAL_SPEAKERS = [
  { id: 's1', name: 'Dr. Alisher Karimov', role: 'Implantolog', city: 'Toshkent', avatar: '/images/ustalar/usta-jasur.jpg' },
  { id: 's2', name: 'Dr. Malika Tursunova', role: 'Jarroh stomatolog', city: 'Samarqand', avatar: '/images/forma/woman-navy.jpg' },
  { id: 's3', name: 'Dr. Javohir Sodiqov', role: 'Protezist', city: 'Toshkent', avatar: '/images/ustalar/usta-dilshod.jpg' },
]

const INITIAL_PROMOS = [
  { id: 'p1', code: 'EARLYBIRD', off: '-20%', note: '1-noy – 15-noy', on: true },
  { id: 'p2', code: 'STUDENT50', off: '-50%', note: 'Talabalar uchun', on: true },
  { id: 'p3', code: 'GROUPS', off: '-15%', note: '5+ kishilik guruh', on: true },
]

const CERTS = [
  { id: 'teal', name: 'Klassik (Teal)' },
  { id: 'gold', name: 'Premium Gold' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'blue', name: 'Modern Blue' },
]

const TONE = {
  teal: { bar: 'var(--color-org-teal)', icon: 'var(--color-org-teal)', badge: 'bg-[#e5f8ef] text-[#15915a]' },
  gold: { bar: '#e0b15a', icon: '#c4922e', badge: '' },
  violet: { bar: '#8b6fd4', icon: '#7c5cbf', badge: '' },
}

function Lab({ children, req }) {
  return (
    <span className="mb-1.5 block text-[12.5px] font-medium text-[#1c4a5a]">
      {children}{req && <span className="ml-0.5 text-[#e11d48]">*</span>}
    </span>
  )
}

function Switch({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label || 'Holat'} onClick={() => onChange(!on)} className="relative h-[22px] w-10 shrink-0 rounded-full transition" style={{ background: on ? TEAL : '#d5e0e2' }}>
      <span className={`absolute top-0.5 size-[18px] rounded-full bg-white shadow transition ${on ? 'left-[20px]' : 'left-0.5'}`} />
    </button>
  )
}

function DateBox({ value, onChange }) {
  return (
    <label className="relative flex h-10 min-w-[148px] flex-1 items-center gap-1.5 rounded-xl border border-[#e3eeec] bg-white px-2.5">
      <Calendar className="size-4 shrink-0" style={{ color: TEAL }} />
      <span className="whitespace-nowrap text-[12.5px] text-[#143044]">{uzDate(value)}</span>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
    </label>
  )
}

function TimeBox({ value, onChange }) {
  return (
    <label className="relative flex h-10 w-[78px] shrink-0 items-center gap-1 rounded-xl border border-[#e3eeec] bg-white px-2">
      <Clock className="size-3.5 shrink-0" style={{ color: TEAL }} />
      <span className="text-[12.5px] text-[#143044]">{value}</span>
      <input type="time" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
    </label>
  )
}

function SelectBox({ value, onChange, options }) {
  return (
    <span className="relative block">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${box} appearance-none pr-8`}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#8aa4a8]" />
    </span>
  )
}

function CertFace({ tone }) {
  const skin = {
    teal: 'bg-[#0e6e72] text-[#f6e7c1]',
    gold: 'bg-[#f8f1dc] text-[#7a5b24]',
    minimal: 'bg-white text-[#143044]',
    blue: 'bg-[#1d4e89] text-[#f6e7c1]',
  }[tone]
  const light = tone === 'minimal' || tone === 'gold'
  return (
    <div className={`relative aspect-[1.42/1] overflow-hidden rounded-lg ${skin} ${light ? 'border border-[#e6d7b0]' : ''}`}>
      <div className={`absolute inset-[7px] flex flex-col rounded border px-1.5 py-1 ${light ? 'border-[#d9c48a]' : 'border-[#f3e6c0]/80'}`}>
        <div className="text-[7px] font-bold tracking-wide">⌂ StomaHub</div>
        <p className="mt-1 text-center text-[8px] font-semibold tracking-[0.16em]">SERTIFIKAT</p>
        <p className="mt-1 text-center font-serif text-[12px] italic leading-none">Aliyeva Mohira</p>
        <div className="mt-auto flex items-end justify-between text-[6px] opacity-80">
          <span>24.11.2026</span>
          <span className={`grid size-4 place-items-center rounded-full border text-[5px] ${light ? 'border-[#d4b15a]' : 'border-[#f3e6c0]'}`}>ST</span>
          <span>Imzo</span>
        </div>
      </div>
    </div>
  )
}

function Head({ n, title, sub, extra }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold leading-tight text-[#143044]">{n}. {title}</h2>
        <p className="mt-0.5 text-[12px] text-[#7e9398]">{sub}</p>
      </div>
      {extra}
    </div>
  )
}

export default function Wizard() {
  const mobile = useMobile()
  const { notify } = useOrg()
  const [params] = useSearchParams()
  const editing = params.get('tahrir')
  const [active, setActive] = useState(0)
  const [modal, setModal] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [tabCert, setTabCert] = useState('ready')
  const [tabMkt, setTabMkt] = useState('promo')
  const [tag, setTag] = useState('')
  const lock = useRef(false)
  const [form, setForm] = useState({
    name: 'Implantologiya: nazariya va amaliyot',
    about: ABOUT,
    topic: 'Implantologiya',
    format: 'Offline (joyida)',
    category: 'Tibbiy amaliy seminar',
    tags: ['Implantologiya', 'Jarrohlik', 'Amaliyot', 'Master-klass'],
    cover: COVERS[0],
    thumbs: COVERS,
    start: '2026-11-24',
    startTime: '10:00',
    end: '2026-11-24',
    endTime: '18:00',
    multi: false,
    placeType: 'offline',
    place: 'Toshkent, Congress Hall',
    address: 'Toshkent shahri, Amir Temur shoh ko‘chasi, 1-uy',
    placeImg: '/images/seminars/hotel.jpg',
    tickets: INITIAL_TICKETS,
    speakers: INITIAL_SPEAKERS,
    template: 'teal',
    promos: INITIAL_PROMOS,
  })
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const go = (index) => {
    const i = Math.max(0, Math.min(STEPS.length - 1, index))
    lock.current = true
    setActive(i)
    document.getElementById(STEPS[i].id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => { lock.current = false }, 700)
  }

  useEffect(() => {
    const root = document.querySelector('main')
    if (!root || mobile) return undefined
    const obs = new IntersectionObserver((entries) => {
      if (lock.current) return
      const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (!hit) return
      const i = STEPS.findIndex((s) => s.id === hit.target.id)
      if (i >= 0) setActive(i)
    }, { root, rootMargin: '-10% 0px -60% 0px', threshold: [0.15, 0.4, 0.7] })
    STEPS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [mobile])

  useEffect(() => {
    const m = params.get('modal')
    if (m === 'ticket' || m === 'chipta') setModal('ticket')
    else if (m === 'speaker' || m === 'maruzachi') setModal('speaker')
    else if (m === 'promo') setModal('promo')
    const bolim = params.get('bolim')
    const i = STEPS.findIndex((s) => s.id === bolim)
    if (i >= 0) {
      window.setTimeout(() => go(i), 60)
    }
  }, [params])

  if (mobile) return <WizardMobile sheet={sheet} setSheet={setSheet} notify={notify} />

  const previewTags = ['Implantologiya', 'Amaliyot', 'Master-klass'].filter((t) => form.tags.includes(t))
  const addTag = () => {
    const t = tag.trim()
    if (t && !form.tags.includes(t)) set({ tags: [...form.tags, t], })
    setTag('')
  }

  return (
    <div className="text-[#143044]">
      <div className="xl:grid xl:grid-cols-[150px_minmax(0,1fr)_292px] xl:items-start xl:gap-x-3 xl:gap-y-3">
        <div className="min-w-0 xl:col-start-2">
          <Link to="/tashkilotchi/seminarlar" className="inline-flex items-center gap-0.5 text-[13px] font-medium text-[#5e787e] hover:text-[var(--color-org-teal)]">
            <ChevronLeft className="size-4" /> Mening seminarlarim
          </Link>
          <h1 className="mt-1 text-[22px] font-bold leading-tight tracking-tight">{editing ? 'Seminarni tahrirlash' : 'Yangi seminar yaratish'}</h1>
          <p className="mt-0.5 text-[13px] text-[#6e868c]">Seminar haqida to‘liq ma’lumotlarni kiriting va e’lon qiling</p>
        </div>

        <nav className="sticky top-0 hidden self-start xl:col-start-1 xl:row-start-2 xl:block" aria-label="Bosqichlar">
          <ol className="relative space-y-0.5">
            <span className="absolute bottom-3 left-[11px] top-3 w-px bg-[#e4eeec]" aria-hidden />
            {STEPS.map((s, i) => {
              const on = i === active
              return (
                <li key={s.id}>
                  <button type="button" onClick={() => go(i)} className={`relative flex w-full items-center gap-2 rounded-xl px-0 py-1.5 text-left text-[12.5px] ${on ? 'font-semibold' : 'text-[#6d8388]'}`} style={on ? { color: TEAL } : undefined}>
                    <span className={`relative z-[1] grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${on ? 'text-white' : 'border border-[#d5e0e2] bg-white text-[#8aa0a4]'}`} style={on ? { background: TEAL } : undefined}>{i + 1}</span>
                    <span className="leading-tight">{s.title}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <div className="mt-3 min-w-0 space-y-3 xl:col-start-2 xl:row-start-2 xl:mt-0">
          <section id="info" className="scroll-mt-3 rounded-2xl border border-[#e6f1ef] bg-white p-3.5 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
            <Head n="1" title="Asosiy ma’lumotlar" sub="Seminar nomi, tavsifi, mavzusi va muqova rasmi" extra={(
              <button type="button" onClick={() => notify('Qoralama saqlandi')} className="inline-flex items-center gap-1 text-[12.5px] font-semibold" style={{ color: TEAL }}>
                <Save className="size-3.5" /> Qoralama saqlash
              </button>
            )} />
            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_196px]">
              <div className="space-y-3">
                <label className="block">
                  <Lab req>Seminar nomi</Lab>
                  <input className={box} value={form.name} onChange={(e) => set({ name: e.target.value })} />
                </label>
                <label className="block">
                  <Lab req>Qisqa tavsif</Lab>
                  <span className="relative block">
                    <textarea maxLength={500} value={form.about} onChange={(e) => set({ about: e.target.value })} className="h-[72px] w-full resize-none rounded-xl border border-[#e3eeec] px-3 py-2 pb-5 text-[13px] leading-snug outline-none focus:border-[var(--color-org-teal)]" />
                    <span className="pointer-events-none absolute bottom-1.5 right-2.5 text-[11px] text-[#9aafb4]">{form.about.length}/500</span>
                  </span>
                </label>
              </div>
              <div>
                <Lab>Seminar muqova rasmi</Lab>
                <div className="flex h-[132px] flex-col rounded-xl border border-dashed border-[#cfe0dc] bg-[#f7fbfb] p-2">
                  <label className="grid flex-1 cursor-pointer place-items-center text-center">
                    <span>
                      <ImageIcon className="mx-auto size-5" style={{ color: TEAL }} />
                      <span className="mt-1 block text-[12.5px] font-semibold text-[#143044]">Rasm yuklash</span>
                      <span className="mt-0.5 block text-[10.5px] leading-tight text-[#8aa0a4]">JPG, PNG (min. 1920×1080)</span>
                    </span>
                    <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => readImage(e.target.files?.[0], (src) => set({ cover: src, thumbs: [src, ...form.thumbs].slice(0, 4) }), () => notify('Faqat JPG yoki PNG'))} />
                  </label>
                  <div className="mt-1.5 flex gap-1">
                    {form.thumbs.slice(0, 4).map((src) => (
                      <button key={src} type="button" onClick={() => set({ cover: src })} className={`h-8 flex-1 overflow-hidden rounded-md ${form.cover === src ? 'ring-2 ring-[var(--color-org-teal)]' : ''}`}>
                        <img src={src} alt="" className="size-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="block"><Lab req>Mavzu / Yo‘nalish</Lab><SelectBox value={form.topic} onChange={(v) => set({ topic: v })} options={TOPICS} /></label>
              <label className="block"><Lab req>Format</Lab><SelectBox value={form.format} onChange={(v) => set({ format: v })} options={FORMATS} /></label>
              <label className="block"><Lab>Bosh toifa</Lab><SelectBox value={form.category} onChange={(v) => set({ category: v })} options={CATS} /></label>
            </div>
            <div className="mt-3">
              <p className="mb-1.5 text-[12.5px] font-medium text-[#1c4a5a]">Teglar</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {form.tags.map((t) => (
                  <button key={t} type="button" onClick={() => set({ tags: form.tags.filter((x) => x !== t) })} className="inline-flex h-7 items-center gap-1 rounded-full bg-[#e7f6f3] px-2.5 text-[12px] font-medium" style={{ color: TEAL }}>
                    {t} <span aria-hidden className="text-[13px] leading-none">×</span>
                  </button>
                ))}
                <input
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  placeholder="+ Teg qo‘shish"
                  className="h-7 w-[118px] rounded-full border border-dashed border-[#cfe0dc] px-2.5 text-[12px] outline-none placeholder:text-[#7e9398] focus:border-[var(--color-org-teal)]"
                />
              </div>
            </div>
          </section>

          <section id="when" className="scroll-mt-3 rounded-2xl border border-[#e6f1ef] bg-white p-4 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
            <Head n="2" title="Sana va joy" sub="Seminar o‘tkazilish sanasi, vaqti va manzilini belgilang" />
            <div className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-2">
              <div className="min-w-0 flex-1 basis-[220px]">
                <Lab req>Boshlanish sanasi va vaqti</Lab>
                <div className="flex gap-1.5"><DateBox value={form.start} onChange={(v) => set({ start: v })} /><TimeBox value={form.startTime} onChange={(v) => set({ startTime: v })} /></div>
              </div>
              <div className="min-w-0 flex-1 basis-[220px]">
                <Lab req>Tugash sanasi va vaqti</Lab>
                <div className="flex gap-1.5"><DateBox value={form.end} onChange={(v) => set({ end: v })} /><TimeBox value={form.endTime} onChange={(v) => set({ endTime: v })} /></div>
              </div>
              <button type="button" onClick={() => set({ multi: !form.multi })} className="mb-2 inline-flex items-center gap-2 whitespace-nowrap text-[12.5px] text-[#3e5a62]">
                <span className={`grid size-4 place-items-center rounded border ${form.multi ? 'border-[var(--color-org-teal)] bg-[var(--color-org-teal)] text-white' : 'border-[#c5d5d2] bg-white'}`}>{form.multi && <Check className="size-3" />}</span>
                Bir necha kunlik seminar
              </button>
            </div>
            <p className="mb-1.5 mt-3 text-[12.5px] font-medium text-[#1c4a5a]">Manzil turi <span className="text-[#e11d48]">*</span></p>
            <div className="flex flex-wrap gap-2">
              {[
                ['offline', 'Joyida (offline)', MapPin],
                ['online', 'Onlayn (webinar)', Monitor],
                ['hybrid', 'Gibrid (onlayn + offline)', LayoutGrid],
              ].map(([id, label, Icon]) => {
                const on = form.placeType === id
                return (
                  <button key={id} type="button" onClick={() => set({ placeType: id })} className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[12.5px] font-semibold ${on ? 'text-white' : 'border border-[#e4eeec] bg-white text-[#1c4a5a]'}`} style={on ? { background: TEAL } : undefined}>
                    <Icon className="size-3.5" /> {label}
                  </button>
                )
              })}
            </div>
            {form.placeType !== 'online' && (
              <div className="mt-3 grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_200px]">
                <div className="space-y-3">
                  <label className="block">
                    <Lab req>Manzil</Lab>
                    <span className="flex gap-2">
                      <span className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#e3eeec] bg-white px-3 focus-within:border-[var(--color-org-teal)]">
                        <MapPin className="size-4 shrink-0" style={{ color: TEAL }} />
                        <input className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" value={form.place} onChange={(e) => set({ place: e.target.value })} />
                      </span>
                      <a className="inline-flex shrink-0 items-center gap-1 self-center text-[12.5px] font-semibold" style={{ color: TEAL }} href={`https://maps.google.com/?q=${encodeURIComponent(form.place || 'Tashkent')}`} target="_blank" rel="noreferrer">Xaritada ko‘rish</a>
                    </span>
                  </label>
                  <label className="block">
                    <Lab>To‘liq manzil</Lab>
                    <span className="flex h-10 items-center gap-2 rounded-xl border border-[#e3eeec] bg-white px-3 focus-within:border-[var(--color-org-teal)]">
                      <MapPin className="size-4 shrink-0 text-[#8aa4a8]" />
                      <input className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" value={form.address} onChange={(e) => set({ address: e.target.value })} />
                    </span>
                  </label>
                </div>
                <label className="relative block h-[108px] cursor-pointer overflow-hidden rounded-xl">
                  <img src={form.placeImg} alt="" className="size-full object-cover" />
                  <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1 rounded-lg bg-white/92 py-1 text-[11px] font-semibold shadow-sm" style={{ color: TEAL }}>
                    <Camera className="size-3.5" /> Manzil rasmini yuklash
                  </span>
                  <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => readImage(e.target.files?.[0], (src) => set({ placeImg: src }))} />
                </label>
              </div>
            )}
          </section>

          <section id="tickets" className="scroll-mt-3 rounded-2xl border border-[#e6f1ef] bg-white p-4 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
            <Head n="3" title="Chipta turlari" sub="Seminar uchun turli chipta turlarini qo‘shing" extra={(
              <button type="button" onClick={() => setModal('ticket')} className="inline-flex items-center gap-1 text-[12.5px] font-semibold" style={{ color: TEAL }}>
                <Plus className="size-4" /> Chipta turi qo‘shish
              </button>
            )} />
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {form.tickets.map((t) => {
                const tone = TONE[t.tone] || TONE.teal
                const Icon = TICKET_ICON[t.icon] || Ticket
                return (
                  <article key={t.id} className="overflow-hidden rounded-2xl border border-[#e7f0ee] bg-white">
                    <div className="h-1" style={{ background: tone.bar }} />
                    <div className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Icon className="size-4" style={{ color: tone.icon }} />
                        <p className="text-[14px] font-bold">{t.name}</p>
                        {t.basic && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tone.badge}`}>Asosiy</span>}
                      </div>
                      <div className="mt-2.5 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[11px] text-[#8aa0a4]">Narx</p>
                          <p className="text-[14px] font-bold leading-tight">{num(t.price)} <span className="text-[11px] font-medium text-[#6e868c]">so‘m</span></p>
                        </div>
                        <div>
                          <p className="text-[11px] text-[#8aa0a4]">Joylar soni</p>
                          <p className="text-[14px] font-bold leading-tight">{t.seats}</p>
                        </div>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {t.perks.map((p) => (
                          <li key={p} className="flex items-start gap-1.5 text-[11.5px] leading-snug text-[#3e5a62]">
                            <Check className="mt-0.5 size-3.5 shrink-0 text-[#16a34a]" /> {p}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2.5 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-[#3e5a62]">
                          <Switch on={t.active} label={`${t.name} faol`} onChange={(v) => set({ tickets: form.tickets.map((x) => x.id === t.id ? { ...x, active: v } : x) })} />
                          Faol
                        </span>
                        <span className="flex gap-1">
                          <button type="button" aria-label="Tahrirlash" onClick={() => setModal('ticket')} className="grid size-7 place-items-center rounded-lg text-[#5e787e] hover:bg-[#f4fbfa]"><Pencil className="size-3.5" /></button>
                          <button type="button" aria-label="O‘chirish" onClick={() => set({ tickets: form.tickets.filter((x) => x.id !== t.id) })} className="grid size-7 place-items-center rounded-lg text-[#e11d48] hover:bg-[#fff5f7]"><Trash2 className="size-3.5" /></button>
                        </span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <section id="speakers" className="scroll-mt-3 rounded-2xl border border-[#e6f1ef] bg-white p-4 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
            <Head n="4" title="Ma’ruzachilar" sub="Seminarda ishtirok etadigan ma’ruzachilarni qo‘shing" extra={(
              <button type="button" onClick={() => setModal('speaker')} className="inline-flex items-center gap-1 text-[12.5px] font-semibold" style={{ color: TEAL }}>
                <Plus className="size-4" /> Ma’ruzachi qo‘shish
              </button>
            )} />
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {form.speakers.map((s) => (
                <article key={s.id} className="flex items-center gap-2 rounded-2xl border border-[#e7f0ee] p-2.5">
                  <img src={s.avatar} alt="" className="size-11 shrink-0 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold leading-tight">{s.name}</p>
                    <p className="text-[12px] leading-tight" style={{ color: TEAL }}>{s.role}</p>
                    <p className="text-[11.5px] text-[#8aa0a4]">{s.city}</p>
                  </div>
                  <div className="flex shrink-0 flex-col">
                    <button type="button" aria-label="Tahrirlash" onClick={() => setModal('speaker')} className="grid size-6 place-items-center rounded-md text-[#5e787e] hover:bg-[#f4fbfa]"><Pencil className="size-3.5" /></button>
                    <button type="button" aria-label="O‘chirish" onClick={() => set({ speakers: form.speakers.filter((x) => x.id !== s.id) })} className="grid size-6 place-items-center rounded-md text-[#e11d48] hover:bg-[#fff5f7]"><Trash2 className="size-3.5" /></button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="cert" className="scroll-mt-3 rounded-2xl border border-[#e6f1ef] bg-white p-4 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
            <Head n="5" title="Sertifikat va dizayn" sub="Sertifikat shablonini tanlang yoki o‘z dizayningizni yuklang" />
            <div className="mt-3 flex flex-wrap gap-1">
              {[
                ['ready', 'Tayyor shablonlar'],
                ['upload', 'O‘z dizaynini yuklash'],
                ['info', 'Sertifikat ma’lumotlari'],
              ].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setTabCert(id)} className={`h-8 rounded-lg px-2.5 text-[12.5px] font-semibold ${tabCert === id ? 'bg-[#e7f6f3]' : 'text-[#5e787e]'}`} style={tabCert === id ? { color: TEAL } : undefined}>{label}</button>
              ))}
            </div>
            {tabCert === 'ready' && (
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                {CERTS.map((t) => (
                  <button key={t.id} type="button" onClick={() => set({ template: t.id })} className={`rounded-xl border p-2 text-left ${form.template === t.id ? 'border-[var(--color-org-teal)] ring-2 ring-[var(--color-org-teal)]/25' : 'border-[#e6f1ef]'}`}>
                    <CertFace tone={t.id} />
                    <p className="mt-1.5 text-center text-[12px] font-semibold">{t.name}</p>
                  </button>
                ))}
              </div>
            )}
            {tabCert === 'upload' && (
              <label className="mt-3 grid h-28 cursor-pointer place-items-center rounded-xl border border-dashed border-[#cfe0dc] bg-[#f7fbfb] text-[13px] text-[#5e787e]">
                O‘z dizaynini yuklash
                <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={() => notify('Dizayn yuklandi')} />
              </label>
            )}
            {tabCert === 'info' && (
              <p className="mt-3 text-[13px] leading-relaxed text-[#5e787e]">Sertifikatda ishtirokchi ismi, seminar nomi va sana avtomatik qo‘yiladi. Shablon: {CERTS.find((t) => t.id === form.template)?.name}.</p>
            )}
          </section>

          <section id="marketing" className="scroll-mt-3 rounded-2xl border border-[#e6f1ef] bg-white p-4 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
            <Head n="6" title="Marketing va promo-kodlar" sub="Seminarga ko‘proq ishtirokchi jalb qiling" extra={(
              <button type="button" onClick={() => setModal('promo')} className="inline-flex items-center gap-1 text-[12.5px] font-semibold" style={{ color: TEAL }}>
                <Plus className="size-4" /> Promo-kod
              </button>
            )} />
            <div className="mt-3 flex flex-wrap gap-1">
              {[
                ['promo', 'Promo-kodlar'],
                ['ads', 'Reklama sozlamalari'],
                ['social', 'Ijtimoiy tarmoqlar'],
                ['mail', 'Email/Telegram'],
              ].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setTabMkt(id)} className={`h-8 rounded-lg px-2.5 text-[12.5px] font-semibold ${tabMkt === id ? 'bg-[#e7f6f3]' : 'text-[#5e787e]'}`} style={tabMkt === id ? { color: TEAL } : undefined}>{label}</button>
              ))}
            </div>
            {tabMkt === 'promo' && (
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {form.promos.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 rounded-xl border border-[#e7f0ee] px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold">{p.code} <span style={{ color: TEAL }}>{p.off}</span></p>
                      <p className="truncate text-[11px] text-[#8aa0a4]">{p.note}</p>
                    </div>
                    <Switch on={p.on} label={p.code} onChange={(v) => set({ promos: form.promos.map((x) => x.id === p.id ? { ...x, on: v } : x) })} />
                  </div>
                ))}
              </div>
            )}
            {tabMkt !== 'promo' && (
              <p className="mt-3 rounded-xl bg-[#f6fbfa] px-3 py-3 text-[13px] text-[#5e787e]">
                {tabMkt === 'ads' && 'Reklama byudjeti va joylashuv keyingi bosqichda sozlanadi.'}
                {tabMkt === 'social' && 'Seminar havolasi Telegram, Instagram va Facebookda ulashiladi.'}
                {tabMkt === 'mail' && 'Ishtirokchilarga email va Telegram eslatmalari yuboriladi.'}
              </p>
            )}
          </section>

          <section id="review" className="scroll-mt-3 rounded-2xl border border-[#e6f1ef] bg-white p-4 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
            <Head n="7" title="Ko‘rib chiqish" sub="E’lon qilishdan oldin ma’lumotlarni tekshiring" />
            <ul className="mt-3 space-y-1 text-[13px] text-[#3e5a62]">
              <li><b>{form.name}</b> · {form.topic} · {form.format}</li>
              <li>{uzDate(form.start)} {form.startTime} — {uzDate(form.end)} {form.endTime}</li>
              <li>{form.place}</li>
              <li>{form.tickets.length} chipta · {form.speakers.length} ma’ruzachi · {CERTS.find((t) => t.id === form.template)?.name}</li>
            </ul>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button type="button" onClick={() => go(active - 1)} disabled={active === 0} className="h-10 rounded-xl border border-[#e4eeec] bg-white px-4 text-[13px] font-semibold text-[#1c4a5a] disabled:opacity-40">Oldingi</button>
            <div className="flex gap-2">
              <button type="button" onClick={() => notify('Qoralama saqlandi')} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#d7ebe6] bg-white px-3.5 text-[13px] font-semibold" style={{ color: TEAL }}>
                <Save className="size-4" /> Qoralama saqlash
              </button>
              <button type="button" onClick={() => (active === STEPS.length - 1 ? notify('Seminar e’lon qilindi') : go(active + 1))} className="inline-flex h-10 items-center gap-1 rounded-xl px-4 text-[13px] font-semibold text-white" style={{ background: TEAL }}>
                {active === STEPS.length - 1 ? 'E’lon qilish' : 'Keyingi'} <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <aside className="mt-3 xl:sticky xl:top-0 xl:col-start-3 xl:row-span-2 xl:row-start-1 xl:mt-0 xl:self-start">
          <div className="rounded-2xl border border-[#e6f1ef] bg-white p-2.5 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[13px] font-bold">Oldindan ko‘rish</p>
              <button type="button" onClick={() => go(0)} className="text-[12px] font-semibold" style={{ color: TEAL }}>Tahrirlash</button>
            </div>
            <img src={form.cover} alt="" className="h-[92px] w-full rounded-lg object-cover" />
            <p className="mt-1.5 text-[13px] font-bold leading-snug">{form.name}</p>
            <p className="mt-1 flex items-center gap-1 text-[11.5px] text-[#5e787e]"><Calendar className="size-3.5 shrink-0" style={{ color: TEAL }} /> {uzDate(form.start)}, {form.startTime} – {form.endTime}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-[#5e787e]"><MapPin className="size-3.5 shrink-0" style={{ color: TEAL }} /> {form.place || 'Manzil kiritilmagan'}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {previewTags.map((t) => <span key={t} className="rounded-full bg-[#e7f6f3] px-1.5 py-0.5 text-[10.5px] font-semibold" style={{ color: TEAL }}>{t}</span>)}
            </div>
            <p className="mt-1.5 text-[11.5px] leading-snug text-[#5e787e]">{form.about}</p>
            <p className="mb-0.5 mt-2 text-[12px] font-bold">Chipta turlari</p>
            <ul className="space-y-0.5">
              {form.tickets.map((t) => {
                const Icon = TICKET_ICON[t.icon] || Ticket
                const tone = TONE[t.tone] || TONE.teal
                return (
                  <li key={t.id} className="grid grid-cols-[16px_minmax(0,1fr)_auto_auto] items-center gap-1 text-[11.5px]">
                    <Icon className="size-3.5" style={{ color: tone.icon }} />
                    <span className="truncate font-medium">{t.name}</span>
                    <span className="whitespace-nowrap text-[#3e5a62]">{som(t.price)}</span>
                    <span className="w-10 whitespace-nowrap text-right text-[#6e868c]">{t.seats} ta</span>
                  </li>
                )
              })}
            </ul>
            <div className="mt-2 space-y-1.5 border-t border-[#f0f5f4] pt-2 text-[11.5px]">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-[#7e9398]"><Monitor className="size-3.5" /> Format</span>
                <span className="font-medium">{form.format}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-[#7e9398]"><LayoutGrid className="size-3.5" /> Toifa</span>
                <span className="text-right font-medium">{form.category}</span>
              </div>
              <div>
                <p className="text-[#7e9398]">Teglar</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {form.tags.map((t) => <span key={t} className="rounded-full bg-[#f3f7f7] px-1.5 py-0.5 text-[10px] font-medium text-[#3e5a62]">{t}</span>)}
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 border-t border-[#f0f5f4] pt-2">
              <img src={ORG.avatar} alt="" className="size-8 rounded-full object-cover" />
              <div className="min-w-0 leading-tight">
                <p className="text-[10.5px] text-[#8aa0a4]">Tashkilotchi</p>
                <p className="truncate text-[12px] font-semibold">{ORG.name}</p>
                <p className="text-[10.5px] text-[#8aa0a4]">{ORG.brand}</p>
              </div>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <Star className="size-3.5 fill-[#f5b400] text-[#f5b400]" />
              <div className="leading-tight">
                <p className="text-[10.5px] text-[#8aa0a4]">Reyting</p>
                <p className="text-[12px] font-medium">Yangi seminar</p>
              </div>
            </div>
            <p className="mt-2 flex gap-1 text-[10.5px] leading-snug text-[#8aa0a4]">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Seminar e’lon qilingandan so‘ng, uni tahrirlash mumkin bo‘ladi.
            </p>
          </div>
          <button type="button" onClick={() => (active === STEPS.length - 1 ? notify('Seminar e’lon qilindi') : go(active + 1))} className="mt-2 flex h-10 w-full items-center justify-center gap-1 rounded-xl text-[13.5px] font-semibold text-white" style={{ background: TEAL }}>
            {active === STEPS.length - 1 ? 'E’lon qilish' : 'Keyingi bosqich'} <ChevronRight className="size-4" />
          </button>
          <button type="button" onClick={() => notify('Qoralama saqlandi')} className="mt-1.5 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-[#d7ebe6] bg-white text-[13px] font-semibold" style={{ color: TEAL }}>
            <Save className="size-4" /> Qoralama saqlash
          </button>
        </aside>
      </div>

      <TicketModal open={modal === 'ticket'} onClose={() => setModal(null)} onSave={(t) => { set({ tickets: [...form.tickets, t] }); setModal(null); notify('Chipta turi qo‘shildi') }} />
      <SpeakerModal open={modal === 'speaker'} onClose={() => setModal(null)} photo={INITIAL_SPEAKERS[0].avatar} onSave={(s) => { set({ speakers: [...form.speakers, s] }); setModal(null); notify('Ma’ruzachi qo‘shildi') }} />
      <PromoModal open={modal === 'promo'} onClose={() => setModal(null)} onSave={(p) => { set({ promos: [...form.promos, p] }); setModal(null); notify('Promo-kod qo‘shildi') }} />
    </div>
  )
}
