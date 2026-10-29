import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Calendar, ChevronDown, ChevronRight, Clock, Copy, FileText, LayoutGrid, MapPin, Monitor, Percent, Tag, Ticket, Upload, User, Users, Wallet, X,
} from 'lucide-react'
import { ToothIcon } from '../../components/icons'
import { EMPTY_DETAILS, FORMAT_OF, TEAL_MOBILE, TOPICS, placeTypeOf, readImage, uzDate, validateStep } from './wizardBits'
import { getHub, saveSeminar, seminarFormCopy, useHub } from '../../hubStore'
import WizardDetails from './WizardDetails'
import { SpeakerExtraFields, speakerPayload } from './WizardModals'
import MapPicker from '../../components/MapPicker'

const GREEN = TEAL_MOBILE

function StepDots({ step, label, total }) {
  return (
    <div className="shrink-0 text-right">
      <p className="text-[15px] font-bold leading-none text-[#1c2433]">{step + 1}/{total}</p>
      <div className="mt-1.5 flex items-center justify-end gap-[5px]">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i === step ? 'size-[9px] rounded-full' : 'size-[6px] rounded-full'} style={{ background: i === step ? GREEN : i < step ? '#9ed4cf' : '#d5e2e3' }} />
        ))}
      </div>
      <p className="mt-1 text-[11px] text-[#8b97a0]">{label}</p>
    </div>
  )
}

function Lab({ children }) {
  return <span className="mb-1 block text-[13px] font-semibold leading-tight" style={{ color: GREEN }}>{children}</span>
}

function Shell({ icon: Icon, children, chevron, tall }) {
  const Caret = chevron === 'down' ? ChevronDown : ChevronRight
  return (
    <span className={`relative flex gap-2 rounded-2xl bg-[#f3fafa] px-3 ${tall ? 'items-start py-2.5' : 'h-12 items-center'}`}>
      <Icon className="size-[18px] shrink-0" style={{ color: GREEN, marginTop: tall ? 2 : 0 }} strokeWidth={1.8} />
      <span className="flex min-w-0 flex-1 items-center overflow-hidden">{children}</span>
      {chevron && <Caret className="size-3.5 shrink-0 text-[#9aabb0]" />}
    </span>
  )
}

function Field({ label, icon, value, onChange, chevron, type = 'text', suffix }) {
  return (
    <label className="block">
      <Lab>{label}</Lab>
      <Shell icon={icon} chevron={chevron}>
        <input value={value} type={type} onChange={(e) => onChange?.(e.target.value)} className="min-w-0 flex-1 bg-transparent text-[14.5px] text-[#1c2433] outline-none" />
        {suffix && <span className="ml-2 shrink-0 text-[14px] text-[#607078]">{suffix}</span>}
      </Shell>
    </label>
  )
}

function Next({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} className="mt-3 flex h-12 w-full items-center justify-center gap-1 rounded-2xl text-[16px] font-semibold text-white" style={{ background: GREEN }}>
      {children} <ChevronRight className="size-5" />
    </button>
  )
}

function Sheet({ open, onClose, icon: Icon, title, sub, children, onSave }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-[#10222c]/45" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" className="max-h-[92%] w-full overflow-y-auto rounded-t-[28px] bg-white px-4 pb-6 pt-3 shadow-[0_-12px_40px_rgb(10_30_40/0.18)]" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#e1e8ea]" />
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e7f6f4]" style={{ color: GREEN }}>
            <Icon className="size-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-[18px] font-bold leading-tight text-[#1c2433]">{title}</h3>
            <p className="mt-0.5 text-[13px] leading-snug text-[#8b97a0]">{sub}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center text-[#8aa0a4]"><X className="size-5" /></button>
        </div>
        <div className="space-y-3.5">{children}</div>
        <button type="button" onClick={onSave} className="mt-5 flex h-[52px] w-full items-center justify-center rounded-2xl text-[16px] font-semibold text-white" style={{ background: GREEN }}>Saqlash</button>
      </div>
    </div>
  )
}


export default function WizardMobile({ sheet, setSheet, notify }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editing = params.get('tahrir')
  const [step, setStep] = useState(0)
  const [tickets, setTickets] = useState([])
  const [speakers, setSpeakers] = useState([])
  const [promos, setPromos] = useState([])
  const hub = useHub()
  const [base, setBase] = useState(null)
  const [copyOpen, setCopyOpen] = useState(false)
  const [form, setForm] = useState({
    ...EMPTY_DETAILS,
    placeType: 'offline',
    name: '',
    topic: 'Implantologiya',
    date: '',
    start: '09:00',
    end: '18:00',
    place: '',
    hours: '',
    min: '',
    bring: '',
    about: '',
    cover: '',
  })
  const [ticket, setTicket] = useState({ name: '', price: '', seats: '', note: '', earlyPrice: '', earlyUntil: '' })
  const [speaker, setSpeaker] = useState({ name: '', role: '', bio: '', avatar: '', years: '', clinic: '', certs: '', degree: '' })
  const [promo, setPromo] = useState({ code: '', sum: '', uses: '', until: '', note: '' })
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  useEffect(() => {
    if (!editing) return
    const s = getHub().seminars.find((x) => x.id === editing)
    if (!s) return
    load(s.form || null, s)
  }, [editing])

  function load(src, s = {}) {
    setBase(src)
    setForm((f) => ({
      ...f,
      ...EMPTY_DETAILS,
      ...(src ? {
        program: src.program || [], learn: src.learn || '', audience: src.audience || '', includes: src.includes || '',
        cmeHours: src.cmeHours ?? '', cmePoints: src.cmePoints ?? '', practice: src.practice || EMPTY_DETAILS.practice,
        refundPolicy: src.refundPolicy || '', liveSurgery: src.liveSurgery || EMPTY_DETAILS.liveSurgery,
      } : {}),
      placeType: src?.placeType || placeTypeOf(src?.format || s.formatDetail),
      name: src?.name ?? s.title,
      topic: s.topic || f.topic,
      date: src ? (src.start || '') : (s.start || ''),
      start: src?.startTime || s.startTime || f.start,
      end: src?.endTime || s.endTime || f.end,
      place: src ? (src.place || '') : (s.place || ''),
      lat: src ? src.lat ?? null : s.lat ?? null, lng: src ? src.lng ?? null : s.lng ?? null,
      cover: src?.cover || s.cover || s.image || f.cover,
      about: src?.about || s.about || '',
      min: String(src?.min || ''),
      bring: src?.bring || '',
    }))
    setTickets(src?.tickets || s.tickets || [])
    setSpeakers(src?.speakers || s.speakers || [])
    setPromos(src?.promos || [])
  }
  const copyFrom = (id) => {
    const f = seminarFormCopy(id)
    if (!f) return
    load(f)
    setCopyOpen(false)
    notify('Ma’lumotlar nusxalandi — sana va joyni kiriting')
  }
  const fullForm = () => ({
    ...(base || {}),
    name: form.name, about: form.about, min: form.min, bring: form.bring, topic: form.topic,
    placeType: form.placeType, format: FORMAT_OF[form.placeType],
    category: base?.category || 'Tibbiy amaliy seminar', tags: base?.tags?.length ? base.tags : [form.topic],
    cover: form.cover, thumbs: [form.cover].filter(Boolean),
    start: form.date, startTime: form.start, end: base?.end && base.end > form.date ? base.end : form.date, endTime: form.end,
    place: form.place, address: form.place, lat: form.lat ?? null, lng: form.lng ?? null,
    program: (form.program || []).filter((r) => r.time || r.title), learn: form.learn, audience: form.audience, includes: form.includes,
    cmeHours: form.cmeHours, cmePoints: form.cmePoints, practice: form.practice, refundPolicy: form.refundPolicy, liveSurgery: form.liveSurgery,
    tickets, speakers, template: base?.template || 'teal', promos,
  })
  const STEP_IDS = ['info', 'details', 'tickets', 'speakers', 'cert', 'marketing', 'promo', 'review']
  const next = (to) => {
    const f = fullForm()
    const checks = STEP_IDS[step] === 'info' ? ['info', 'when'] : [STEP_IDS[step]]
    for (const c of checks) {
      const err = validateStep(c, f)
      if (err) { notify(err); return }
    }
    setStep(to)
    window.scrollTo(0, 0)
  }

  const publish = (asDraft) => {
    const f = fullForm()
    if (!asDraft) {
      for (const c of ['info', 'when', 'details', 'tickets']) {
        const err = validateStep(c, f)
        if (err) { notify(err); setStep(c === 'details' ? 1 : c === 'tickets' ? 2 : 0); return }
      }
    }
    const res = saveSeminar(f, { publish: !asDraft, id: editing || undefined })
    if (!res.ok) { notify(res.error); return }
    notify(asDraft ? 'Qoralama saqlandi' : 'Seminar e’lon qilindi')
    navigate('/tashkilotchi/seminarlar')
  }

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const v = q.get('varaq')
    if (v === 'chipta' || v === 'ticket') setSheet('ticket')
    else if (v === 'maruzachi' || v === 'speaker') setSheet('speaker')
    else if (v === 'promo') setSheet('promo')
    const s = Number(q.get('qadam'))
    if (s >= 1 && s <= 8) setStep(s - 1)
  }, [setSheet])

  const labels = ['Asosiy ma’lumotlar', 'Dastur va tafsilotlar', 'Chipta turlari', 'Ma’ruzachilar', 'Sertifikat', 'Marketing', 'Promo-kodlar', 'Ko‘rib chiqish']

  return (
    <div className="bg-white pb-2 text-[#1c2433]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-[21px] font-bold leading-tight tracking-tight text-[#1c2433]">{editing ? 'Seminarni tahrirlash' : 'Yangi seminar yaratish'}</h1>
          <p className="mt-0.5 text-[13px] text-[#8b97a0]">Seminar ma’lumotlarini kiriting.</p>
        </div>
        <StepDots step={step} total={labels.length} label={labels[step]} />
      </div>
      {!editing && step === 0 && hub.seminars.length > 0 && (
        <div className="mt-3">
          <button type="button" onClick={() => setCopyOpen((v) => !v)} className="flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl border text-[14px] font-semibold" style={{ borderColor: GREEN, color: GREEN }}>
            <Copy className="size-4" /> Oldingi seminardan nusxa olish
          </button>
          {copyOpen && (
            <ul className="mt-1.5 max-h-64 overflow-auto rounded-2xl border border-[#e3eeec] bg-white p-1">
              {hub.seminars.map((x) => (
                <li key={x.id}>
                  <button type="button" onClick={() => copyFrom(x.id)} className="block w-full rounded-xl px-3 py-2 text-left active:bg-[#f3fafa]">
                    <span className="block truncate text-[14px] font-semibold">{x.title}</span>
                    <span className="block text-[12px] text-[#8b97a0]">{x.date || 'Sanasiz'} · {x.badge || x.status}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {step === 0 && (
        <div className="mt-3 space-y-2.5">
          <Field label="Seminar nomi" icon={ToothIcon} value={form.name} onChange={(v) => set({ name: v })} />
          <label className="block">
            <Lab>Yo‘nalish</Lab>
            <Shell icon={FileText} chevron="down">
              <select value={form.topic} onChange={(e) => set({ topic: e.target.value })} className="w-full appearance-none bg-transparent text-[14.5px] outline-none">
                {TOPICS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Shell>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <Lab>Sana</Lab>
              <Shell icon={Calendar} chevron>
                <span className="whitespace-nowrap text-[13px]">{uzDate(form.date, 'words')}</span>
                <input type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} className="absolute inset-0 opacity-0" />
              </Shell>
            </label>
            <label className="block">
              <Lab>Boshlanish vaqti</Lab>
              <Shell icon={Clock} chevron>
                <input type="time" aria-label="Boshlanish vaqti" value={form.start} onChange={(e) => set({ start: e.target.value })} className="w-full bg-transparent text-[13px] outline-none" />
              </Shell>
            </label>
          </div>
          <label className="block">
            <Lab>Tugash vaqti</Lab>
            <Shell icon={Clock} chevron>
              <input type="time" aria-label="Tugash vaqti" value={form.end} onChange={(e) => set({ end: e.target.value })} className="w-full bg-transparent text-[13px] outline-none" />
            </Shell>
          </label>
          <label className="block">
            <Lab>Seminar haqida (qisqa tavsif)</Lab>
            <Shell icon={FileText} tall>
              <textarea aria-label="Seminar haqida" value={form.about} onChange={(e) => set({ about: e.target.value })} rows={3} placeholder="Kamida 10 belgi" className="w-full resize-none bg-transparent text-[13.5px] leading-snug outline-none" />
            </Shell>
          </label>
          <div>
            <Lab>Format va manzil turi</Lab>
            <div className="grid grid-cols-3 gap-1.5">
              {[['offline', 'Joyida', MapPin], ['online', 'Onlayn', Monitor], ['hybrid', 'Gibrid', LayoutGrid]].map(([id, label, Icon]) => (
                <button key={id} type="button" onClick={() => set({ placeType: id })} className={`flex h-10 items-center justify-center gap-1 rounded-xl text-[13px] font-semibold ${form.placeType === id ? 'text-white' : 'bg-[#f3fafa] text-[#1c2433]'}`} style={form.placeType === id ? { background: GREEN } : undefined}>
                  <Icon className="size-4" /> {label}
                </button>
              ))}
            </div>
          </div>
          <Field label={form.placeType === 'online' ? 'Webinar platformasi yoki havolasi' : 'Zal manzili'} icon={form.placeType === 'online' ? Monitor : MapPin} value={form.place} onChange={(v) => set({ place: v })} />
          {form.placeType !== 'online' && <MapPicker lat={form.lat} lng={form.lng} onChange={({ lat, lng, geo }) => set({ lat, lng, ...(geo?.street ? { place: [geo.city, geo.district && geo.district !== 'Markaz' ? geo.district : '', geo.street].filter(Boolean).join(', ') } : {}) })} />}
          <Field label="Minimal ishtirokchi soni" icon={Users} value={form.min} onChange={(v) => set({ min: v.replace(/\D/g, '') })} />
          <label className="block">
            <Lab>Olib kelish kerak narsalar</Lab>
            <Shell icon={FileText} tall>
              <textarea value={form.bring} onChange={(e) => set({ bring: e.target.value })} rows={3} className="w-full resize-none bg-transparent text-[13.5px] leading-snug outline-none" />
            </Shell>
          </label>
          <div>
            <Lab>Seminar rasmi</Lab>
            <div className="flex gap-3">
              <div className="relative h-[96px] w-[118px] shrink-0 overflow-hidden rounded-2xl bg-[#f3fafa]">
                {form.cover && <img src={form.cover} alt="" className="size-full object-cover" />}
                {form.cover && (
                  <button type="button" aria-label="Rasmni olib tashlash" onClick={() => set({ cover: '' })} className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-white text-[#1c2433] shadow">
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <label className="grid h-[96px] flex-1 cursor-pointer place-items-center rounded-2xl border border-dashed border-[#b7e0db] bg-[#f3fafa] px-2 text-center">
                <span>
                  <Upload className="mx-auto size-5" style={{ color: GREEN }} />
                  <span className="mt-1 block text-[13.5px] font-semibold" style={{ color: GREEN }}>Rasm yuklash</span>
                  <span className="mt-0.5 block text-[11px] text-[#8b97a0]">JPEG yoki PNG</span>
                  <span className="block text-[11px] text-[#8b97a0]">Tavsiya: 1080 x 1350</span>
                </span>
                <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => readImage(e.target.files?.[0], (src) => set({ cover: src }), () => notify('Faqat JPG yoki PNG'))} />
              </label>
            </div>
          </div>
          <Next onClick={() => next(1)}>Keyingi</Next>
        </div>
      )}

      {step === 1 && (
        <div className="mt-4">
          <h2 className="text-[18px] font-bold">Dastur va tafsilotlar</h2>
          <p className="mb-3 mt-0.5 text-[13px] text-[#8b97a0]">Bo‘sh qoldirilgan bo‘limlar seminar sahifasida ko‘rinmaydi.</p>
          <WizardDetails form={form} set={set} compact />
          <Next onClick={() => next(2)}>Keyingi</Next>
          <button type="button" onClick={() => setStep(0)} className="mt-2 h-10 w-full text-[14px] font-semibold" style={{ color: GREEN }}>Ortga</button>
        </div>
      )}

      {step === 2 && (
        <StepList
          title="Chipta turlari"
          sub="Seminar uchun chipta turini yarating."
          action="Chipta turi qo‘shish"
          onAdd={() => setSheet('ticket')}
          onNext={() => next(3)}
          onBack={() => setStep(1)}
          rows={tickets.map((t) => ({ name: t.name, meta: `${Number(t.price).toLocaleString('ru-RU')} so‘m · ${t.seats || t.total} ta` }))}
        />
      )}
      {step === 3 && (
        <StepList
          title="Ma’ruzachilar"
          sub="Seminarga ma’ruzachi ma’lumotlarini kiriting."
          action="Ma’ruzachi qo‘shish"
          onAdd={() => setSheet('speaker')}
          onNext={() => next(4)}
          onBack={() => setStep(2)}
          rows={speakers.map((s) => ({ name: s.name, meta: s.role }))}
        />
      )}
      {step === 4 && (
        <StepList title="Sertifikat" sub="Sertifikat shablonini tanlang." action="" onNext={() => next(5)} onBack={() => setStep(3)} rows={[{ name: 'Klassik (Teal)', meta: [form.cmeHours && `${form.cmeHours} soat`, form.cmePoints && `${form.cmePoints} CME ball`].filter(Boolean).join(' · ') || 'Tayyor shablon' }]} />
      )}
      {step === 5 && (
        <StepList title="Marketing" sub="Seminarga ko‘proq ishtirokchi jalb qiling." action="" onNext={() => next(6)} onBack={() => setStep(4)} rows={[{ name: 'Havolani ulashish', meta: 'Seminar e’lon qilingach Telegram orqali ulashing' }]} />
      )}
      {step === 6 && (
        <StepList
          title="Promo-kodlar"
          sub="Chipta sotuvini rag‘batlantirish uchun promo-kod yarating."
          action="Promo-kod qo‘shish"
          onAdd={() => setSheet('promo')}
          onNext={() => next(7)}
          onBack={() => setStep(5)}
          rows={promos.map((p) => ({ name: p.code, meta: `${Number(String(p.off).replace(/\D/g, '') || p.value || 0).toLocaleString('ru-RU')} so‘m` }))}
        />
      )}
      {step === 7 && (
        <div className="mt-4">
          <p className="text-[15px] font-bold">{form.name}</p>
          <p className="mt-1 text-[13px] text-[#607078]">{uzDate(form.date, 'words')} · {form.start} – {form.end}</p>
          <p className="text-[13px] text-[#607078]">{FORMAT_OF[form.placeType]} · {form.place}</p>
          <p className="text-[13px] text-[#607078]">{tickets.length} chipta · {speakers.length} ma’ruzachi · dastur: {(form.program || []).filter((r) => r.title).length} qator</p>
          <Next onClick={() => publish(false)}>E’lon qilish</Next>
          <button type="button" onClick={() => publish(true)} className="mt-2 h-11 w-full text-[14px] font-semibold" style={{ color: GREEN }}>Qoralama saqlash</button>
          <button type="button" onClick={() => setStep(6)} className="h-10 w-full text-[14px] font-semibold" style={{ color: GREEN }}>Ortga</button>
        </div>
      )}

      <Sheet open={sheet === 'ticket'} onClose={() => setSheet(null)} icon={Ticket} title="Chipta turi qo‘shish" sub="Seminar uchun chipta turini yarating." onSave={() => { if (!ticket.name.trim() || String(ticket.price).trim() === '' || !(Number(ticket.price) >= 0) || !Number(ticket.seats)) { notify('Nom, narx (bepul uchun 0) va joylar kerak'); return } if (!!Number(ticket.earlyPrice) !== !!ticket.earlyUntil) { notify('Early bird narxi va muddati birga kiritilsin'); return } if (Number(ticket.earlyPrice) && Number(ticket.earlyPrice) >= Number(ticket.price)) { notify('Early bird narxi asosiy narxdan past bo‘lsin'); return } setTickets((list) => [...list, { id: `t-${Date.now()}`, name: ticket.name.trim(), price: Number(ticket.price), seats: Number(ticket.seats), perks: [ticket.note].filter(Boolean), active: true, icon: 'gem', note: ticket.note, earlyPrice: Number(ticket.earlyPrice) || 0, earlyUntil: ticket.earlyUntil || '' }]); setTicket({ name: '', price: '', seats: '', note: '', earlyPrice: '', earlyUntil: '' }); setSheet(null); notify('Chipta turi saqlandi') }}>
        <Field label="Chipta turi nomi" icon={Ticket} value={ticket.name} onChange={(v) => setTicket({ ...ticket, name: v })} />
        <Field label="Narxi" icon={Wallet} value={ticket.price === '' ? '' : Number(ticket.price).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} suffix="so‘m" onChange={(v) => setTicket({ ...ticket, price: v.replace(/\D/g, '') })} />
        <Field label="Maksimal soni" icon={Users} value={ticket.seats} onChange={(v) => setTicket({ ...ticket, seats: v.replace(/\D/g, '') })} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Early bird narxi" icon={Wallet} value={ticket.earlyPrice ? Number(ticket.earlyPrice).toLocaleString('ru-RU').replace(/\u00a0/g, ' ') : ''} onChange={(v) => setTicket({ ...ticket, earlyPrice: v.replace(/\D/g, '') })} />
          <label className="block">
            <Lab>Qaysi sanagacha</Lab>
            <Shell icon={Calendar}>
              <span className="text-[13px]">{ticket.earlyUntil ? uzDate(ticket.earlyUntil, 'dot') : '—'}</span>
              <input type="date" aria-label="Early bird muddati" value={ticket.earlyUntil} onChange={(e) => setTicket({ ...ticket, earlyUntil: e.target.value })} className="absolute inset-0 opacity-0" />
            </Shell>
          </label>
        </div>
        <label className="block">
          <Lab>Tavsif (ixtiyoriy)</Lab>
          <Shell icon={FileText} tall>
            <textarea value={ticket.note} onChange={(e) => setTicket({ ...ticket, note: e.target.value })} rows={2} className="w-full resize-none bg-transparent text-[14.5px] leading-relaxed outline-none" />
          </Shell>
        </label>
      </Sheet>

      <Sheet open={sheet === 'speaker'} onClose={() => setSheet(null)} icon={User} title="Ma’ruzachi qo‘shish" sub="Seminarga ma’ruzachi ma’lumotlarini kiriting." onSave={() => { if (speaker.name.trim().length < 3) { notify('Ismni kiriting'); return } if (speaker.years && Number(speaker.years) > 60) { notify('Tajriba 0–60 yil oralig‘ida bo‘lsin'); return } setSpeakers((list) => [...list, speakerPayload({ ...speaker, id: `s-${Date.now()}`, role: speaker.role || 'Mutaxassis' })]); setSpeaker({ name: '', role: '', bio: '', avatar: '', years: '', clinic: '', certs: '', degree: '' }); setSheet(null); notify('Ma’ruzachi saqlandi') }}>
        <div>
          <Lab>Rasm</Lab>
          <div className="flex items-center gap-3">
            <div className="relative">
              {speaker.avatar ? <img src={speaker.avatar} alt="" className="size-[84px] rounded-full object-cover" /> : <span className="grid size-[84px] place-items-center rounded-full bg-[#f3fafa]"><User className="size-7 text-[#9aabb0]" /></span>}
              <button type="button" aria-label="Rasmni olib tashlash" onClick={() => setSpeaker({ ...speaker, avatar: '' })} className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-white text-[#1c2433] shadow"><X className="size-3.5" /></button>
            </div>
            <label className="grid h-[92px] flex-1 cursor-pointer place-items-center rounded-2xl border border-dashed border-[#b7e0db] bg-[#f3fafa] text-center">
              <span>
                <Upload className="mx-auto size-5" style={{ color: GREEN }} />
                <span className="mt-0.5 block text-[13px] font-semibold" style={{ color: GREEN }}>Rasm yuklash</span>
                <span className="block text-[11px] text-[#8b97a0]">JPEG yoki PNG</span>
                <span className="block text-[11px] text-[#8b97a0]">Tavsiya: 500 x 500</span>
              </span>
              <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => readImage(e.target.files?.[0], (src) => setSpeaker({ ...speaker, avatar: src }))} />
            </label>
          </div>
        </div>
        <Field label="Ism va familiya" icon={User} value={speaker.name} onChange={(v) => setSpeaker({ ...speaker, name: v })} />
        <Field label="Mutaxassislik" icon={ToothIcon} value={speaker.role} onChange={(v) => setSpeaker({ ...speaker, role: v })} />
        <SpeakerExtraFields f={speaker} setF={setSpeaker} />
        <label className="block">
          <Lab>Qisqa ma’lumot</Lab>
          <Shell icon={FileText} tall>
            <textarea value={speaker.bio} onChange={(e) => setSpeaker({ ...speaker, bio: e.target.value })} rows={3} className="w-full resize-none bg-transparent text-[14.5px] leading-relaxed outline-none" />
          </Shell>
        </label>
      </Sheet>

      <Sheet open={sheet === 'promo'} onClose={() => setSheet(null)} icon={Percent} title="Promo-kod qo‘shish" sub="Chipta sotuvini rag‘batlantirish uchun promo-kod yarating." onSave={() => { if (promo.code.trim().length < 3 || !Number(promo.sum)) { notify('Kod va chegirma summasini kiriting'); return } setPromos((list) => [...list, { id: `p-${Date.now()}`, code: promo.code.trim().toUpperCase(), off: promo.sum, kind: 'summa', note: promo.note, on: true, limit: Number(promo.uses) || 20, to: promo.until }]); setSheet(null); notify('Promo-kod saqlandi') }}>
        <Field label="Promo-kod" icon={Tag} value={promo.code} onChange={(v) => setPromo({ ...promo, code: v.toUpperCase() })} />
        <Field label="Chegirma summasi" icon={Wallet} suffix="so‘m" value={Number(promo.sum || 0).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} onChange={(v) => setPromo({ ...promo, sum: v.replace(/\D/g, '') })} />
        <Field label="Maksimal ishlatish soni" icon={Users} value={promo.uses} onChange={(v) => setPromo({ ...promo, uses: v.replace(/\D/g, '') })} />
        <label className="block">
          <Lab>Amal qilish muddati</Lab>
          <Shell icon={Calendar}>
            <span className="text-[15px]">{uzDate(promo.until, 'dot')}</span>
            <input type="date" value={promo.until} onChange={(e) => setPromo({ ...promo, until: e.target.value })} className="absolute inset-0 opacity-0" />
          </Shell>
        </label>
        <label className="block">
          <Lab>Tavsif (ixtiyoriy)</Lab>
          <Shell icon={FileText} tall>
            <textarea value={promo.note} onChange={(e) => setPromo({ ...promo, note: e.target.value })} rows={2} className="w-full resize-none bg-transparent text-[14.5px] leading-relaxed outline-none" />
          </Shell>
        </label>
      </Sheet>
    </div>
  )
}

function StepList({ title, sub, action, onAdd, onNext, onBack, rows }) {
  return (
    <div className="mt-4">
      <h2 className="text-[18px] font-bold">{title}</h2>
      <p className="mt-0.5 text-[13px] text-[#8b97a0]">{sub}</p>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li key={r.name} className="rounded-2xl bg-[#f3fafa] px-3.5 py-3">
            <p className="text-[15px] font-semibold">{r.name}</p>
            <p className="text-[13px] text-[#607078]">{r.meta}</p>
          </li>
        ))}
      </ul>
      {action && (
        <button type="button" onClick={onAdd} className="mt-3 h-11 w-full rounded-2xl border border-dashed text-[14px] font-semibold" style={{ borderColor: GREEN, color: GREEN }}>+ {action}</button>
      )}
      <Next onClick={onNext}>Keyingi</Next>
      <button type="button" onClick={onBack} className="mt-2 h-10 w-full text-[14px] font-semibold" style={{ color: GREEN }}>Ortga</button>
    </div>
  )
}
