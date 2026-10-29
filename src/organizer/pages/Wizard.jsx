import { useEffect, useRef, useState } from 'react'
import MapPicker from '../../components/MapPicker'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Award, Calendar, Camera, Copy, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, Crown,
  GraduationCap, Image as ImageIcon, Info, LayoutGrid, MapPin, Monitor, Pencil, Plus, Save, Star, Ticket, Trash2,
} from 'lucide-react'
import { num, som } from '../data'
import { useOrg } from '../Shell'
import { getHub, saveSeminar, seminarFormCopy, useHub } from '../../hubStore'
import { useMobile } from '../../useMobile'
import { CATS, EMPTY_DETAILS, FORMAT_OF, STEPS, TEAL, TOPICS, box, placeTypeOf, uploadImage, uzDate, validateStep } from './wizardBits'
import WizardDetails from './WizardDetails'
import { PromoModal, SpeakerModal, TicketModal } from './WizardModals'
import WizardMobile from './WizardMobile'
import { CertUpload, ContactField, FaqField, GalleryField, PosterField, VenueNotesField, cmeText, useCertBackground } from './WizardExtras'
import { CertFrame } from './certArt'

const TICKET_ICON = { ticket: Ticket, crown: Crown, cap: GraduationCap, star: Star, award: Award }

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

function CertFace({ tone, org = '' }) {
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
        <div className="truncate text-[7px] font-bold tracking-wide">{org || 'Tashkilotchi'}</div>
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
  const navigate = useNavigate()
  const { notify } = useOrg()
  const [params] = useSearchParams()
  const editing = params.get('tahrir')
  const [formError, setFormError] = useState('')
  const [active, setActive] = useState(0)
  const [modal, setModal] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [tabCert, setTabCert] = useState('ready')
  const [tabMkt, setTabMkt] = useState('promo')
  const [tag, setTag] = useState('')
  const lock = useRef(false)
  const hub = useHub()
  const orgName = hub.settings?.orgName || ''
  const [copyOpen, setCopyOpen] = useState(false)
  const [form, setForm] = useState({
    ...EMPTY_DETAILS,
    name: '',
    about: '',
    topic: 'Implantologiya',
    format: 'Offline (joyida)',
    category: 'Tibbiy amaliy seminar',
    tags: [],
    cover: '',
    thumbs: [],
    start: '',
    startTime: '10:00',
    end: '',
    endTime: '18:00',
    multi: false,
    placeType: 'offline',
    place: '',
    address: '',
    placeImg: '',
    tickets: [],
    speakers: [],
    template: 'teal',
    promos: [],
  })
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  useEffect(() => {
    if (!editing) return
    const s = getHub().seminars.find((x) => x.id === editing)
    if (!s) return
    if (s.form) {
      setForm({ ...EMPTY_DETAILS, ...s.form, placeType: s.form.placeType || placeTypeOf(s.form.format) })
      return
    }
    setForm((f) => ({
      ...f,
      name: s.title,
      about: s.about || f.about,
      topic: s.topic || f.topic,
      format: s.formatDetail || f.format,
      tags: s.tags || f.tags,
      cover: s.cover || s.image,
      start: s.start || f.start,
      startTime: s.startTime || f.startTime,
      end: s.end || s.start || f.end,
      endTime: s.endTime || f.endTime,
      place: s.place || f.place,
      address: s.address || f.address,
      tickets: s.tickets?.length ? s.tickets : f.tickets,
      speakers: s.speakers?.length ? s.speakers : f.speakers,
      template: s.template || f.template,
      promos: s.wizardPromos || f.promos,
    }))
  }, [editing])

  const persist = (publish) => {
    if (publish) {
      for (const st of STEPS) {
        const err = validateStep(st.id, form)
        if (err) { setFormError(err); notify(err); go(STEPS.indexOf(st), true); return }
      }
    }
    const res = saveSeminar({ ...form, orgName, gallery: (form.gallery || []).filter(Boolean), faq: (form.faq || []).filter((r) => String(r.q || '').trim() && String(r.a || '').trim()), format: FORMAT_OF[form.placeType] || form.format, program: (form.program || []).filter((r) => r.time || r.title) }, { publish, id: editing || undefined })
    if (!res.ok) {
      setFormError(res.error)
      notify(res.error)
      return
    }
    setFormError('')
    notify(publish ? 'Seminar e’lon qilindi' : 'Qoralama saqlandi')
    navigate('/tashkilotchi/seminarlar')
  }

    const copyFrom = (id) => {
    const f = seminarFormCopy(id)
    if (!f) return
    setForm({ ...EMPTY_DETAILS, ...f, placeType: f.placeType || placeTypeOf(f.format) })
    setCopyOpen(false)
    notify('Ma’lumotlar nusxalandi — sana va joyni kiriting')
    window.setTimeout(() => go(1, true), 60)
  }
  // Oldinga o‘tishda oraliqdagi barcha bosqichlar tekshiriladi
  const go = (index, force = false) => {
    if (!force && index > active) {
      for (let k = active; k < Math.min(index, STEPS.length); k += 1) {
        const err = validateStep(STEPS[k].id, form)
        if (err) {
          setFormError(err)
          notify(err)
          lock.current = true
          setActive(k)
          document.getElementById(STEPS[k].id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          window.setTimeout(() => { lock.current = false }, 700)
          return
        }
      }
      setFormError('')
    }
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
  const previous = hub.seminars.filter((x) => x.id !== editing)
  const num0 = (id) => STEPS.findIndex((x) => x.id === id) + 1

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
          <div className="mt-0.5 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] text-[#6e868c]">Seminar haqida to‘liq ma’lumotlarni kiriting va e’lon qiling</p>
            {!editing && previous.length > 0 && (
              <span className="relative">
                <button type="button" onClick={() => setCopyOpen((v) => !v)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#d7ebe6] bg-white px-3 text-[12.5px] font-semibold" style={{ color: TEAL }}>
                  <Copy className="size-4" /> Oldingi seminardan nusxa olish
                </button>
                {copyOpen && (
                  <span className="absolute right-0 z-30 mt-1 block max-h-72 w-[300px] overflow-auto rounded-xl border border-[#e6f1ef] bg-white p-1 shadow-lg">
                    {previous.map((x) => (
                      <button key={x.id} type="button" onClick={() => copyFrom(x.id)} className="block w-full rounded-lg px-2.5 py-2 text-left hover:bg-[#f4fbfa]">
                        <span className="block truncate text-[12.5px] font-semibold text-[#143044]">{x.title}</span>
                        <span className="block text-[11px] text-[#8aa0a4]">{x.date || 'Sanasiz'} · {x.badge || x.status}</span>
                      </button>
                    ))}
                  </span>
                )}
              </span>
            )}
          </div>
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
            <Head n={num0('info')} title="Asosiy ma’lumotlar" sub="Seminar nomi, tavsifi, poster va galereya" extra={(
              <button type="button" onClick={() => persist(false)} className="inline-flex items-center gap-1 text-[12.5px] font-semibold" style={{ color: TEAL }}>
                <Save className="size-3.5" /> Qoralama saqlash
              </button>
            )} />
            <div className="mt-3">
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
            </div>
            <div className="mt-3"><PosterField form={form} set={set} notify={notify} /></div>
            <div className="mt-3"><GalleryField form={form} set={set} notify={notify} /></div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block"><Lab req>Mavzu / Yo‘nalish</Lab><SelectBox value={form.topic} onChange={(v) => set({ topic: v })} options={TOPICS} /></label>
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
            <Head n={num0('when')} title="Sana va joy" sub="Seminar o‘tkazilish sanasi, vaqti va manzilini belgilang" />
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
            <p className="mb-1.5 mt-3 text-[12.5px] font-medium text-[#1c4a5a]">Format va manzil turi <span className="text-[#e11d48]">*</span></p>
            <div className="flex flex-wrap gap-2">
              {[
                ['offline', 'Joyida (offline)', MapPin],
                ['online', 'Onlayn (webinar)', Monitor],
                ['hybrid', 'Gibrid (onlayn + offline)', LayoutGrid],
              ].map(([id, label, Icon]) => {
                const on = form.placeType === id
                return (
                  <button key={id} type="button" onClick={() => set({ placeType: id, format: FORMAT_OF[id] })} className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[12.5px] font-semibold ${on ? 'text-white' : 'border border-[#e4eeec] bg-white text-[#1c4a5a]'}`} style={on ? { background: TEAL } : undefined}>
                    <Icon className="size-3.5" /> {label}
                  </button>
                )
              })}
            </div>
            {form.placeType === 'online' && (
              <label className="mt-3 block">
                <Lab req>Webinar platformasi yoki havolasi</Lab>
                <input className={box} placeholder="Masalan: Zoom" value={form.place} onChange={(e) => set({ place: e.target.value })} />
              </label>
            )}
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
                  <VenueNotesField form={form} set={set} />
                    <MapPicker lat={form.lat} lng={form.lng} height={220} onChange={({ lat, lng, geo }) => set({ lat, lng, ...(geo?.street ? { address: geo.street, ...(geo.city ? { city: geo.city } : {}) } : {}) })} />
                </div>
                <label className="relative block h-[108px] cursor-pointer overflow-hidden rounded-xl bg-[#f4fbfa]">
                  {form.placeImg ? <img src={form.placeImg} alt="" className="size-full object-cover" /> : <span className="grid size-full place-items-center text-[12px] text-[#8aa0a4]">Manzil rasmi yo‘q</span>}
                  <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1 rounded-lg bg-white/92 py-1 text-[11px] font-semibold shadow-sm" style={{ color: TEAL }}>
                    <Camera className="size-3.5" /> Manzil rasmini yuklash
                  </span>
                  <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0], 'seminars').then((src) => set({ placeImg: src }), (err) => notify(err?.message || 'Yuklab bo‘lmadi'))} />
                </label>
              </div>
            )}
          </section>

          <section id="details" className="scroll-mt-3 rounded-2xl border border-[#e6f1ef] bg-white p-4 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
            <Head n={num0('details')} title="Dastur va tafsilotlar" sub="Dastur, CME, amaliy qism va shartlar — bo‘sh qoldirilgan bo‘limlar sahifada ko‘rinmaydi" />
            <div className="mt-3"><WizardDetails form={form} set={set} /></div>
            <div className="mt-4 border-t border-[#f0f5f4] pt-3"><FaqField form={form} set={set} /></div>
            <div className="mt-4 border-t border-[#f0f5f4] pt-3"><ContactField form={form} set={set} /></div>
          </section>

          <section id="tickets" className="scroll-mt-3 rounded-2xl border border-[#e6f1ef] bg-white p-4 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
            <Head n={num0('tickets')} title="Chipta turlari" sub="Seminar uchun turli chipta turlarini qo‘shing" extra={(
              <button type="button" onClick={() => setModal('ticket')} className="inline-flex items-center gap-1 text-[12.5px] font-semibold" style={{ color: TEAL }}>
                <Plus className="size-4" /> Chipta turi qo‘shish
              </button>
            )} />
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {form.tickets.length === 0 && <p className="text-[13px] text-[#7e9398] md:col-span-3">Hali chipta turi yo‘q. O‘zingiz qo‘shing.</p>}
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
            <Head n={num0('speakers')} title="Ma’ruzachilar" sub="Seminarda ishtirok etadigan ma’ruzachilarni qo‘shing" extra={(
              <button type="button" onClick={() => setModal('speaker')} className="inline-flex items-center gap-1 text-[12.5px] font-semibold" style={{ color: TEAL }}>
                <Plus className="size-4" /> Ma’ruzachi qo‘shish
              </button>
            )} />
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {form.speakers.map((s) => (
                <article key={s.id} className="flex items-center gap-2 rounded-2xl border border-[#e7f0ee] p-2.5">
                  <img src={s.avatar || s.photo} alt="" className="size-11 shrink-0 rounded-full object-cover" />
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
            <Head n={num0('cert')} title="Sertifikat va dizayn" sub="Sertifikat shablonini tanlang yoki o‘z dizayningizni yuklang" />
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
                    <CertFace tone={t.id} org={orgName} />
                    <p className="mt-1.5 text-center text-[12px] font-semibold">{t.name}</p>
                  </button>
                ))}
              </div>
            )}
            {tabCert === 'upload' && (
              <CertUpload form={form} set={set} notify={notify} orgName={orgName} dateText={uzDate(form.start)} />
            )}
            {tabCert === 'info' && (
              <p className="mt-3 text-[13px] leading-relaxed text-[#5e787e]">Sertifikatda ishtirokchi ismi, seminar nomi va sana avtomatik qo‘yiladi. {form.certDesign ? `Dizayn: o‘zingiz yuklagan fayl (${form.certDesign.name || 'fayl'}).` : `Shablon: ${CERTS.find((t) => t.id === form.template)?.name}.`}</p>
            )}
          </section>

          <section id="marketing" className="scroll-mt-3 rounded-2xl border border-[#e6f1ef] bg-white p-4 shadow-[0_1px_2px_rgb(16_40_40/0.04)]">
            <Head n={num0('marketing')} title="Marketing va promo-kodlar" sub="Seminarga ko‘proq ishtirokchi jalb qiling" extra={(
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
            <Head n={num0('review')} title="Ko‘rib chiqish" sub="E’lon qilishdan oldin ma’lumotlarni tekshiring" />
            <ul className="mt-3 space-y-1 text-[13px] text-[#3e5a62]">
              <li><b>{form.name}</b> · {form.topic} · {FORMAT_OF[form.placeType]}</li>
              <li>{uzDate(form.start)} {form.startTime} — {uzDate(form.end)} {form.endTime}</li>
              <li>{form.place}</li>
              <li>{form.tickets.length} chipta · {form.speakers.length} ma’ruzachi · {form.certDesign ? 'O‘z dizayni' : CERTS.find((t) => t.id === form.template)?.name}</li>
              {(form.cmeHours || form.cmePoints) && <li>CME: {[form.cmeHours && `${form.cmeHours} soat`, form.cmePoints && `${form.cmePoints} ball`].filter(Boolean).join(' · ')}</li>}
              <li>Dastur: {(form.program || []).filter((r) => r.title).length} qator{form.practice?.on ? ' · amaliy qism bor' : ''}{form.liveSurgery?.on ? ' · jonli jarrohlik' : ''}</li>
            </ul>
          </section>

          {formError && <p className="text-[12.5px] font-semibold text-[#e11d48]">{formError}</p>}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button type="button" onClick={() => go(active - 1)} disabled={active === 0} className="h-10 rounded-xl border border-[#e4eeec] bg-white px-4 text-[13px] font-semibold text-[#1c4a5a] disabled:opacity-40">Oldingi</button>
            <div className="flex gap-2">
              <button type="button" onClick={() => persist(false)} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#d7ebe6] bg-white px-3.5 text-[13px] font-semibold" style={{ color: TEAL }}>
                <Save className="size-4" /> Qoralama saqlash
              </button>
              <button type="button" onClick={() => (active === STEPS.length - 1 ? persist(true) : go(active + 1))} className="inline-flex h-10 items-center gap-1 rounded-xl px-4 text-[13px] font-semibold text-white" style={{ background: TEAL }}>
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
            <PreviewExtras form={form} orgName={orgName} />
            <p className="mt-1.5 text-[13px] font-bold leading-snug">{form.name || 'Seminar nomi kiritilmagan'}</p>
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
                <span className="font-medium">{FORMAT_OF[form.placeType]}</span>
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
              {hub.settings?.avatar ? <img src={hub.settings.avatar} alt="" className="size-8 rounded-full object-cover" /> : <span className="grid size-8 place-items-center rounded-full bg-[#e7f6f3] text-[12px] font-bold" style={{ color: TEAL }}>{(orgName || 'T').slice(0, 1).toUpperCase()}</span>}
              <div className="min-w-0 leading-tight">
                <p className="text-[10.5px] text-[#8aa0a4]">Tashkilotchi</p>
                <p className="truncate text-[12px] font-semibold">{orgName || 'Tashkilot nomi kiritilmagan'}</p>
              </div>
            </div>
            <p className="mt-2 flex gap-1 text-[10.5px] leading-snug text-[#8aa0a4]">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Seminar e’lon qilingandan so‘ng, uni tahrirlash mumkin bo‘ladi.
            </p>
          </div>
          <button type="button" onClick={() => (active === STEPS.length - 1 ? persist(true) : go(active + 1))} className="mt-2 flex h-10 w-full items-center justify-center gap-1 rounded-xl text-[13.5px] font-semibold text-white" style={{ background: TEAL }}>
            {active === STEPS.length - 1 ? 'E’lon qilish' : 'Keyingi bosqich'} <ChevronRight className="size-4" />
          </button>
          <button type="button" onClick={() => persist(false)} className="mt-1.5 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-[#d7ebe6] bg-white text-[13px] font-semibold" style={{ color: TEAL }}>
            <Save className="size-4" /> Qoralama saqlash
          </button>
        </aside>
      </div>

      <TicketModal open={modal === 'ticket'} onClose={() => setModal(null)} onSave={(t) => { set({ tickets: [...form.tickets, t] }); setModal(null); notify('Chipta turi qo‘shildi') }} />
      <SpeakerModal open={modal === 'speaker'} onClose={() => setModal(null)} photo="" onSave={(s) => { set({ speakers: [...form.speakers, s] }); setModal(null); notify('Ma’ruzachi qo‘shildi') }} />
      <PromoModal open={modal === 'promo'} onClose={() => setModal(null)} onSave={(p) => { set({ promos: [...form.promos, p] }); setModal(null); notify('Promo-kod qo‘shildi') }} />
    </div>
  )
}

// O‘ng tomondagi “Oldindan ko‘rish”: sahifada chiqadigan barcha bloklar
function PreviewExtras({ form, orgName }) {
  const bg = useCertBackground(form.certDesign)
  const faq = (form.faq || []).filter((r) => r.q && r.a)
  const notes = String(form.venueNotes || '').split('\n').map((x) => x.trim()).filter(Boolean)
  return (
    <div data-shot="preview">
      {form.cover
        ? <img src={form.cover} alt="Poster" className="aspect-video w-full rounded-lg object-cover" />
        : <div className="grid aspect-video place-items-center rounded-lg border border-dashed border-[#cfe0dc] bg-[#f4fbfa] text-center text-[12px] text-[#8aa0a4]">Poster yuklanmagan<br /><span className="text-[10.5px]">16:9 · 1920×1080</span></div>}
      {(form.gallery || []).length > 0 && (
        <div className="mt-1 grid grid-cols-4 gap-1">
          {form.gallery.slice(0, 4).map((src) => <img key={src} src={src} alt="" className="h-9 w-full rounded object-cover" />)}
        </div>
      )}
      <ul className="mt-1.5 space-y-0.5 text-[10.5px] text-[#5e787e]">
        {(form.speakers || []).length > 0 && (
          <li className="flex items-center gap-1">
            <span className="flex -space-x-1.5">{form.speakers.slice(0, 4).map((s) => (s.avatar || s.photo) ? <img key={s.id} src={s.avatar || s.photo} alt="" className="size-5 rounded-full border border-white object-cover" /> : <span key={s.id} className="grid size-5 place-items-center rounded-full border border-white bg-[#e7f6f3] text-[9px] font-bold" style={{ color: TEAL }}>{(s.name || '?').slice(0, 1)}</span>)}</span>
            {form.speakers.length} ma’ruzachi
          </li>
        )}
        {cmeText(form) && <li>CME: {cmeText(form)}</li>}
        {form.practice?.on && <li>Amaliy mashg‘ulot bor</li>}
        {form.placeImg && <li className="flex items-center gap-1"><img src={form.placeImg} alt="" className="h-5 w-8 rounded object-cover" /> Manzil rasmi</li>}
        {notes.length > 0 && <li>Manzil izohlari: {notes.length} ta</li>}
        {faq.length > 0 && <li>Savol-javob: {faq.length} ta</li>}
        {(form.contactPhone || form.contactTelegram) && <li>Aloqa: {[form.contactPhone, form.contactTelegram].filter(Boolean).join(' · ')}</li>}
      </ul>
      {form.certDesign && bg && (
        <div className="mt-1.5 flex items-center gap-2">
          <CertFrame width={44} design={bg} name="Aliyeva" course={form.name || 'Seminar'} date="" org={orgName} />
          <span className="text-[10.5px] text-[#5e787e]">Sertifikat: o‘z dizayni</span>
        </div>
      )}
    </div>
  )
}
