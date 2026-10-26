import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, X, Camera, UserRound, Phone, ChevronDown, CalendarDays, Mars, Venus, UsersRound, MapPin, Mail, Megaphone, FileText, Save, Check } from 'lucide-react'
import { CITIES, addBemor, useBemorlar } from '../../bemorData'
import { isoToDots } from './bemorParts'

const CODES = ['+998', '+7', '+992', '+996']
const SOURCES = ['Telegram / Instagram', 'Do‘st tavsiyasi', 'Reklama', 'Klinika', 'Boshqa']
const HEALTH = ['Diabet', 'Gipertoniya', 'Allergiya', 'Homiladorlik']
const GENDERS = [['Erkak', Mars], ['Ayol', Venus], ['Boshqa', UsersRound]]

const fmtPhone = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 9)
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ')
}
const ageOf = (iso) => {
  const b = new Date(iso)
  const n = new Date()
  let a = n.getFullYear() - b.getFullYear()
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a -= 1
  return a
}

export default function MobileBemorNew() {
  const navigate = useNavigate()
  const rows = useBemorlar()
  const fileRef = useRef(null)
  const formRef = useRef(null)
  const [f, setF] = useState({ first: '', last: '', code: '+998', phone: '', birth: '', gender: '', city: 'Toshkent', address: '', email: '', source: 'Telegram / Instagram', note: '', allergyText: '' })
  const [health, setHealth] = useState([])
  const [photo, setPhoto] = useState('')
  const [photoErr, setPhotoErr] = useState('')
  const [tried, setTried] = useState(false)
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const today = new Date().toISOString().slice(0, 10)

  const errs = {
    first: f.first.trim().length < 2,
    last: f.last.trim().length < 2,
    phone: f.phone.replace(/\D/g, '').length !== 9,
    birth: !f.birth || f.birth > today || ageOf(f.birth) > 120,
    gender: !f.gender,
    email: !!f.email && !/^\S+@\S+\.\S+$/.test(f.email),
  }
  const ok = !Object.values(errs).some(Boolean)
  const bad = (k) => tried && errs[k]
  const box = (k) => `flex h-12 items-center gap-2.5 rounded-xl border bg-white px-3 transition focus-within:border-sea ${bad(k) ? 'border-sale' : 'border-line'}`

  const pickPhoto = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setPhotoErr('Rasm 5MB dan katta'); return }
    setPhotoErr('')
    const r = new FileReader()
    r.onload = () => setPhoto(r.result)
    r.readAsDataURL(file)
  }

  const save = () => {
    setTried(true)
    if (!ok) {
      requestAnimationFrame(() => formRef.current?.querySelector('[data-bad="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
      return
    }
    const max = rows.reduce((m, p) => Math.max(m, Number(/^P-(\d+)$/.exec(p.code)?.[1] || 0)), 0)
    const id = `bemor-${Date.now()}`
    const name = `${f.first.trim()} ${f.last.trim()}`
    addBemor({
      id, name, age: `${ageOf(f.birth)} yosh`, birth: isoToDots(f.birth), birthIso: f.birth, gender: f.gender,
      phone: `${f.code} ${f.phone}`, city: f.city, address: f.address.trim() || f.city, email: f.email.trim(),
      source: f.source, status: 'Yangi', last: '', next: '', code: `P-${String(max + 1).padStart(4, '0')}`, photo, telegram: '',
      allergy: health.includes('Allergiya') ? [f.allergyText.trim() || 'Allergiya'] : [],
      diseases: health.filter((h) => h !== 'Allergiya'), meds: 'Yo‘q', habits: 'Yo‘q', note: f.note.trim(), total: 0, paid: 0, payments: [],
    })
    navigate(`/bemorlar/${id}`, { replace: true, state: { toast: `${name} qo‘shildi` } })
  }

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/bemorlar'))

  return (
    <div className="min-h-screen bg-white pb-[92px]">
      <header className="sticky top-0 z-20 grid grid-cols-[40px_1fr_40px] items-center bg-white/95 px-2.5 pb-2 pt-3 backdrop-blur">
        <button type="button" onClick={back} aria-label="Orqaga" className="grid size-10 place-items-center text-sea"><ChevronLeft className="size-6" /></button>
        <div className="text-center">
          <h1 className="text-[18px] font-extrabold leading-tight text-[#0d2a4a]">Yangi bemor qo‘shish</h1>
          <p className="text-[12px] text-muted">Bemor ma’lumotlarini kiriting</p>
        </div>
        <button type="button" onClick={() => navigate('/bemorlar')} aria-label="Yopish" className="grid size-10 place-items-center text-sea"><X className="size-6" /></button>
      </header>

      <div ref={formRef} className="flex flex-col gap-3.5 px-3.5 pt-2">
        <div className="flex gap-3">
          <button type="button" onClick={() => fileRef.current?.click()} className="relative flex h-[150px] w-[132px] shrink-0 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border-2 border-dashed border-[#a9d7d3] bg-[#f3faf9] text-center">
            {photo ? (
              <>
                <img src={photo} alt="Bemor rasmi" className="absolute inset-0 size-full object-cover" />
                <span className="absolute bottom-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-white/95 text-sea shadow"><Camera className="size-4" /></span>
              </>
            ) : (
              <>
                <span className="grid size-14 place-items-center rounded-full bg-[#dff1ef] text-sea"><Camera className="size-7" strokeWidth={1.7} /></span>
                <b className="text-[12.5px] font-semibold text-ink">Rasm qo‘shish</b>
                <span className="text-[9.5px] text-muted">JPG, PNG (maks. 5MB)</span>
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg" onChange={pickPhoto} className="hidden" />
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <Field label="Ism" req bad={bad('first')}>
              <div className={box('first')}><UserRound className="size-5 shrink-0 text-muted" strokeWidth={1.6} /><input value={f.first} onChange={set('first')} placeholder="Ismni kiriting" autoComplete="given-name" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted" /></div>
            </Field>
            <Field label="Familiya" req bad={bad('last')}>
              <div className={box('last')}><UserRound className="size-5 shrink-0 text-muted" strokeWidth={1.6} /><input value={f.last} onChange={set('last')} placeholder="Familiyani kiriting" autoComplete="family-name" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted" /></div>
            </Field>
          </div>
        </div>
        {photoErr && <p className="-mt-2 text-[11.5px] text-sale">{photoErr}</p>}

        <Field label="Telefon" req bad={bad('phone')} hint={bad('phone') && 'Raqamni to‘liq kiriting (9 ta raqam)'}>
          <div className={box('phone')}>
            <Phone className="size-5 shrink-0 text-sea" strokeWidth={1.6} />
            <label className="relative flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[#f1f5f8] px-2 text-[13.5px] font-medium text-ink">
              {f.code}<ChevronDown className="size-3.5 text-muted" />
              <select value={f.code} onChange={set('code')} aria-label="Davlat kodi" className="absolute inset-0 opacity-0">{CODES.map((c) => <option key={c}>{c}</option>)}</select>
            </label>
            <input value={f.phone} onChange={(e) => setF((s) => ({ ...s, phone: fmtPhone(e.target.value) }))} inputMode="tel" placeholder="90 123 45 67" autoComplete="tel-national" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted" />
          </div>
        </Field>

        <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-2.5">
          <Field label="Tug‘ilgan sana" req bad={bad('birth')}>
            <div className={`relative ${box('birth')}`}>
              <CalendarDays className="size-5 shrink-0 text-sea" strokeWidth={1.6} />
              <span className={`min-w-0 flex-1 truncate text-[13.5px] ${f.birth ? 'text-ink' : 'text-muted'}`}>{f.birth ? isoToDots(f.birth) : 'kk.oo.yyyy'}</span>
              <input type="date" value={f.birth} max={today} onChange={set('birth')} onClick={(e) => e.currentTarget.showPicker?.()} aria-label="Tug‘ilgan sana" className="absolute inset-0 size-full cursor-pointer opacity-0" />
            </div>
          </Field>
          <Field label="Jinsi" req bad={bad('gender')}>
            <div className="grid h-12 grid-cols-3 gap-1">
              {GENDERS.map(([g, Icon]) => (
                <button key={g} type="button" aria-pressed={f.gender === g} onClick={() => setF((s) => ({ ...s, gender: g }))} className={`flex flex-col items-center justify-center gap-0.5 rounded-xl border text-[11px] font-medium leading-none transition ${f.gender === g ? 'border-[#0b8a95] bg-[#0b8a95] text-white' : bad('gender') ? 'border-sale text-ink' : 'border-line text-ink'}`}>
                  <Icon className="size-4 shrink-0" strokeWidth={1.7} /> {g}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <Field label="Shahar" req>
          <label className={`relative ${box('city')}`}>
            <MapPin className="size-5 shrink-0 text-sea" strokeWidth={1.6} />
            <span className="flex-1 text-[14px] text-ink">{f.city}</span>
            <ChevronDown className="size-4 text-muted" />
            <select value={f.city} onChange={set('city')} aria-label="Shahar" className="absolute inset-0 opacity-0">{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
        </Field>

        <Field label="Manzil">
          <div className={box('address')}><MapPin className="size-5 shrink-0 text-sea" strokeWidth={1.6} /><input value={f.address} onChange={set('address')} placeholder="Manzilni kiriting (ko‘cha, uy, xonadon)" autoComplete="street-address" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted" /></div>
        </Field>

        <Field label="Email" bad={bad('email')} hint={bad('email') && 'Email noto‘g‘ri'}>
          <div className={box('email')}><Mail className="size-5 shrink-0 text-sea" strokeWidth={1.6} /><input type="email" value={f.email} onChange={set('email')} placeholder="example@mail.com" autoComplete="email" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted" /></div>
        </Field>

        <Field label="Qayerdan bildi?" req>
          <label className={`relative ${box('source')}`}>
            <Megaphone className="size-5 shrink-0 text-sea" strokeWidth={1.6} />
            <span className="flex-1 text-[14px] text-ink">{f.source}</span>
            <ChevronDown className="size-4 text-muted" />
            <select value={f.source} onChange={set('source')} aria-label="Qayerdan bildi" className="absolute inset-0 opacity-0">{SOURCES.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
        </Field>

        <div className="rounded-2xl bg-[#f3f7fa] p-3">
          <p className="text-[13px] font-semibold text-ink">Allergiya va kasalliklar</p>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            {HEALTH.map((h) => {
              const on = health.includes(h)
              return (
                <button key={h} type="button" role="checkbox" aria-checked={on} onClick={() => setHealth((l) => (on ? l.filter((x) => x !== h) : [...l, h]))} className="flex items-center gap-2 text-left text-[13px] text-ink">
                  <span className={`grid size-5 shrink-0 place-items-center rounded-md border-2 ${on ? 'border-[#0b8a95] bg-[#0b8a95] text-white' : 'border-[#9aa7b4] bg-white'}`}>{on && <Check className="size-3.5" strokeWidth={3} />}</span>
                  {h}
                </button>
              )
            })}
          </div>
          {health.includes('Allergiya') && <input value={f.allergyText} onChange={set('allergyText')} placeholder="Nimaga allergiya? (masalan, Penitsillin)" className="mt-2.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-[13.5px] outline-none focus:border-sea" />}
        </div>

        <Field label="Izoh">
          <div className="flex gap-2.5 rounded-xl border border-line bg-white px-3 py-2.5 focus-within:border-sea">
            <FileText className="mt-0.5 size-5 shrink-0 text-muted" strokeWidth={1.6} />
            <textarea value={f.note} onChange={(e) => setF((s) => ({ ...s, note: e.target.value.slice(0, 500) }))} rows={3} placeholder="Bemor haqida qo‘shimcha ma’lumot (ixtiyoriy)..." className="min-w-0 flex-1 resize-none bg-transparent text-[13.5px] outline-none placeholder:text-muted" />
          </div>
          <p className="mt-1 text-right text-[11px] text-muted">{f.note.length}/500</p>
        </Field>
        {tried && !ok && <p className="-mt-2 text-[12px] text-sale">Qizil bilan belgilangan maydonlarni to‘ldiring</p>}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-white/95 px-3.5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <button type="button" onClick={save} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#0b8a95] text-[15px] font-semibold text-white shadow-[0_8px_18px_rgb(11_138_149/0.3)] active:scale-[0.99]">
          <Save className="size-5" /> Saqlash
        </button>
      </div>
    </div>
  )
}

function Field({ label, req, bad, hint, children }) {
  return (
    <div data-bad={bad ? 'true' : undefined}>
      <p className="mb-1.5 text-[13px] font-semibold text-ink">{label} {req && <span className="text-sale">*</span>}</p>
      {children}
      {hint && <p className="mt-1 text-[11.5px] text-sale">{hint}</p>}
    </div>
  )
}
