import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Armchair, Bell, ChevronDown, ChevronLeft, ChevronRight, Clock, FileText, Save, ScanLine, Search, UserPlus, X } from 'lucide-react'
import { patchBemor, useBemorlar } from '../../bemorData'
import { doctors, minutes, parts, rooms, services, setVisits, shift, todayIso, useVisits } from '../../uchrashuvData'
import { BottomSheet, ToothIcon } from './MobileSeminars'
import { DOCTORS, Face, isoToDots } from './bemorParts'
import { DAY_SHORT, MON_SHORT, dow, nowMinutes, patientOf, shortDate } from './MobileUchrashuvlar'

const SLOTS = Array.from({ length: 18 }, (_, i) => {
  const m = 9 * 60 + i * 30
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${m % 60 ? '30' : '00'}`
})
const DURS = [30, 45, 60, 90]
const CLOSE = 19 * 60

export default function MobileUchrashuvNew() {
  const navigate = useNavigate()
  const location = useLocation()
  const patients = useBemorlar()
  const visits = useVisits()
  const formRef = useRef(null)
  const today = todayIso()
  const [edit] = useState(() => visits.find((v) => v.id === location.state?.edit) || null)
  const [patient, setPatient] = useState(() => {
    if (edit) return patientOf(edit, patients) || { id: '', name: edit.name, photo: edit.photo, phone: edit.phone || '' }
    return patients.find((p) => p.id === location.state?.patientId) || null
  })
  const [find, setFind] = useState('')
  const [doctor, setDoctor] = useState(edit?.doctor || 'ibrohim')
  const [room, setRoom] = useState(edit?.room || 'Kreslo 1')
  const [service, setService] = useState(edit?.service || 'Konsultatsiya')
  const [date, setDate] = useState(() => {
    const d = edit?.date || location.state?.date || today
    return d < today ? today : d
  })
  const [week, setWeek] = useState(() => (date <= shift(today, 6) ? today : date))
  const [time, setTime] = useState(edit?.start || '')
  const [dur, setDur] = useState(DURS.includes(edit?.dur) ? edit.dur : 30)
  const [sms, setSms] = useState(edit?.sms ?? true)
  const [note, setNote] = useState(edit?.note || '')
  const [tried, setTried] = useState(false)
  const [picker, setPicker] = useState(false)

  const now = nowMinutes()
  const taken = (s) => {
    const a = minutes(s)
    const b = a + dur
    if (date === today && a <= now) return true
    if (b > CLOSE) return true
    return visits.some((o) => o.id !== edit?.id && o.date === date && o.status !== 'bekor' && (o.doctor === doctor || o.room === room) && minutes(o.start) < b && a < minutes(o.start) + o.dur)
  }
  const chosen = time && !taken(time) ? time : ''
  const free = SLOTS.filter((s) => !taken(s)).length

  const q = find.trim().toLowerCase()
  const digits = q.replace(/\D/g, '')
  const found = q
    ? patients.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q.replace('#', '')) || (digits.length >= 3 && p.phone.replace(/\D/g, '').includes(digits))).slice(0, 5)
    : []

  const errs = { patient: !patient, time: !chosen }
  const bad = (k) => tried && errs[k]
  const box = (k) => `flex h-12 items-center gap-2.5 rounded-xl border bg-white px-3 transition focus-within:border-sea ${bad(k) ? 'border-sale' : 'border-line'}`

  const choose = (p) => { setPatient(p); setFind(''); setPicker(false) }
  const save = () => {
    setTried(true)
    if (errs.patient || errs.time) {
      requestAnimationFrame(() => formRef.current?.querySelector('[data-bad="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
      return
    }
    const row = {
      date, start: chosen, dur, name: patient.name, photo: patient.photo || '', phone: patient.phone || '', patientId: patient.id || '',
      service, doctor, room, note: note.trim(), sms,
    }
    if (edit) {
      const stale = service !== edit.service ? { detail: '', info: '' } : {}
      setVisits((list) => list.map((v) => (v.id === edit.id ? { ...v, ...row, ...stale } : v)))
    } else {
      setVisits((list) => [...list, { ...row, id: `n${Date.now()}`, status: 'tasdiq' }])
    }
    if (patient.id) patchBemor(patient.id, { next: isoToDots(date) })
    navigate('/uchrashuvlar', { replace: true, state: { date, toast: `${edit ? 'Uchrashuv o‘zgartirildi' : 'Uchrashuv saqlandi'}: ${shortDate(date)}, ${chosen}` } })
  }
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/uchrashuvlar'))
  const days = Array.from({ length: 7 }, (_, i) => shift(week, i))

  return (
    <div className="min-h-screen bg-white pb-[92px]">
      <header className="sticky top-0 z-20 grid grid-cols-[40px_1fr_40px] items-center bg-white/95 px-2.5 pb-2 pt-3 backdrop-blur">
        <button type="button" onClick={back} aria-label="Orqaga" className="grid size-10 place-items-center text-sea"><ChevronLeft className="size-6" /></button>
        <div className="text-center">
          <h1 className="text-[18px] font-extrabold leading-tight text-[#0d2a4a]">{edit ? 'Uchrashuvni o‘zgartirish' : 'Yangi uchrashuv'}</h1>
          <p className="text-[12px] text-muted">Qabul ma’lumotlarini kiriting</p>
        </div>
        <button type="button" onClick={() => navigate('/uchrashuvlar')} aria-label="Yopish" className="grid size-10 place-items-center text-sea"><X className="size-6" /></button>
      </header>

      <div ref={formRef} className="flex flex-col gap-3.5 px-3.5 pt-2">
        <Field label="Bemor" req bad={bad('patient')} hint={bad('patient') && 'Bemorni tanlang'}>
          <div className={box('patient')}>
            <Search className="size-5 shrink-0 text-muted" strokeWidth={1.7} />
            <input type="search" value={find} onChange={(e) => setFind(e.target.value)} placeholder="Bemorni qidiring (ism, telefon yoki ID)" className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-muted" />
            <span className="h-6 w-px bg-line" />
            <button type="button" onClick={() => setPicker(true)} aria-label="Bemorlar ro‘yxatidan tanlash" className="-mr-1 grid size-9 shrink-0 place-items-center rounded-lg text-sea"><ScanLine className="size-5" /></button>
          </div>
          {q && (
            <div className="mt-1.5 overflow-hidden rounded-xl border border-line bg-white shadow-[0_8px_20px_rgb(11_31_58/0.08)]">
              {found.map((p) => <PatientRow key={p.id} p={p} onClick={() => choose(p)} />)}
              {!found.length && (
                <div className="flex items-center justify-between gap-2 px-3 py-3">
                  <span className="text-[12.5px] text-muted">Bemor topilmadi</span>
                  <Link to="/bemorlar/yangi" className="flex items-center gap-1 text-[12.5px] font-semibold text-sea"><UserPlus className="size-4" /> Yangi bemor</Link>
                </div>
              )}
            </div>
          )}
          {patient && (
            <div className="mt-2 flex items-center gap-3 rounded-xl bg-[#f3f7fa] p-2.5">
              <Face p={patient} className="size-12" text="text-[14px]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-[#0d2a4a]">{patient.name}</p>
                <p className="truncate text-[11.5px] text-muted">{patient.code ? `ID: #${patient.code}` : 'Bemor'}{patient.phone && <><span className="mx-1.5">•</span>{patient.phone}</>}</p>
              </div>
              <button type="button" onClick={() => setPatient(null)} aria-label="Bemorni olib tashlash" className="grid size-8 shrink-0 place-items-center text-muted"><X className="size-4" /></button>
            </div>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Shifokor" req>
            <SelectBox value={doctor} onChange={setDoctor} options={doctors.map((d) => [d.id, d.name])} label="Shifokor" lead={<DocPic name={doctors.find((d) => d.id === doctor)?.name || ''} />} />
          </Field>
          <Field label="Kreslo" req>
            <SelectBox value={room} onChange={setRoom} options={rooms.map((r) => [r, r])} label="Kreslo" lead={<Armchair className="size-5 shrink-0 text-sea" strokeWidth={1.6} />} />
          </Field>
        </div>

        <Field label="Xizmat" req>
          <SelectBox value={service} onChange={setService} options={services.map((s) => [s, s])} label="Xizmat" lead={<ToothIcon className="size-5 shrink-0 text-sea" strokeWidth={1.6} />} />
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-ink">Sana <span className="text-sale">*</span></p>
            <div className="flex items-center gap-1">
              <button type="button" disabled={week <= today} onClick={() => setWeek(week <= shift(today, 7) ? today : shift(week, -7))} aria-label="Oldingi hafta" className="grid size-7 place-items-center rounded-lg text-sea disabled:text-line"><ChevronLeft className="size-4" /></button>
              <span className="text-[11.5px] font-medium text-muted">{shortDate(days[0])} – {shortDate(days[6])}</span>
              <button type="button" onClick={() => setWeek(shift(week, 7))} aria-label="Keyingi hafta" className="grid size-7 place-items-center rounded-lg text-sea"><ChevronRight className="size-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((iso) => {
              const on = iso === date
              const past = iso < today
              const { d, m } = parts(iso)
              return (
                <button key={iso} type="button" disabled={past} aria-pressed={on} onClick={() => setDate(iso)} className={`flex h-[66px] flex-col items-center justify-center rounded-xl border transition ${on ? 'border-[#0b8a95] bg-[#0b8a95] text-white' : past ? 'border-line/60 bg-[#f6f8fa] text-[#b9c3cf]' : 'border-line text-ink'}`}>
                  <span className={`text-[10.5px] ${on ? 'text-white/85' : past ? '' : 'text-ink-2'}`}>{DAY_SHORT[dow(iso)]}</span>
                  <b className="text-[16px] font-bold leading-tight">{d}</b>
                  <span className={`text-[10.5px] ${on ? 'text-white/85' : past ? '' : 'text-ink-2'}`}>{MON_SHORT[m - 1]}</span>
                </button>
              )
            })}
          </div>
        </div>

        <Field label="Vaqt" req bad={bad('time')} hint={bad('time') && (free ? 'Bo‘sh vaqtni tanlang' : 'Bu kunda bo‘sh vaqt yo‘q, boshqa kunni tanlang')}>
          <div className="grid grid-cols-6 gap-1.5">
            {SLOTS.map((s) => {
              const off = taken(s)
              const on = chosen === s
              return (
                <button key={s} type="button" disabled={off} aria-pressed={on} onClick={() => setTime(s)} className={`h-10 rounded-lg border text-[12.5px] font-medium transition ${on ? 'border-[#0b8a95] bg-[#e6f4f3] font-semibold text-[#0b6d73] ring-1 ring-[#0b8a95]' : off ? 'border-transparent bg-[#eef1f5] text-[#b9c3cf]' : 'border-line text-ink'}`}>{s}</button>
              )
            })}
          </div>
        </Field>

        <Field label="Davomiyligi" req>
          <div className="grid grid-cols-4 gap-1.5">
            {DURS.map((n) => (
              <button key={n} type="button" aria-pressed={dur === n} onClick={() => setDur(n)} className={`flex h-10 items-center justify-center gap-1 rounded-lg border text-[12px] font-medium transition ${dur === n ? 'border-[#0b8a95] bg-[#0b8a95] text-white' : 'border-line text-ink-2'}`}>
                <Clock className="size-3.5 shrink-0" /> {n} daqiqa
              </button>
            ))}
          </div>
        </Field>

        <button type="button" role="switch" aria-checked={sms} onClick={() => setSms((v) => !v)} className="flex items-center gap-3 rounded-2xl bg-[#f3f7fa] px-3 py-3 text-left">
          <Bell className="size-5 shrink-0 text-sea" strokeWidth={1.7} />
          <span className="min-w-0 flex-1">
            <b className="block text-[13.5px] font-semibold text-ink">SMS eslatma yuborish</b>
            <span className="block text-[11.5px] text-muted">Bemorga uchrashuvdan oldin eslatma yuboriladi</span>
          </span>
          <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${sms ? 'bg-[#0b8a95]' : 'bg-line'}`}><span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all ${sms ? 'left-[22px]' : 'left-0.5'}`} /></span>
        </button>

        <Field label="Izoh">
          <div className="flex gap-2.5 rounded-xl border border-line bg-white px-3 py-2.5 focus-within:border-sea">
            <FileText className="mt-0.5 size-5 shrink-0 text-muted" strokeWidth={1.6} />
            <textarea value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Uchrashuv haqida qo‘shimcha ma’lumot..." className="min-w-0 flex-1 resize-none bg-transparent text-[13.5px] outline-none placeholder:text-muted" />
          </div>
          <p className="mt-1 text-right text-[11px] text-muted">{note.length}/500</p>
        </Field>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-white/95 px-3.5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <button type="button" onClick={save} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#0b8a95] text-[15px] font-semibold text-white shadow-[0_8px_18px_rgb(11_138_149/0.3)] active:scale-[0.99]">
          <Save className="size-5" /> Saqlash
        </button>
      </div>

      {picker && <PickerSheet patients={patients} onClose={() => setPicker(false)} onPick={choose} />}
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

function SelectBox({ value, onChange, options, label, lead }) {
  const text = options.find(([v]) => v === value)?.[1] || ''
  return (
    <label className="relative flex h-12 items-center gap-2.5 rounded-xl border border-line bg-white px-3 focus-within:border-sea">
      {lead}
      <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{text}</span>
      <ChevronDown className="size-4 shrink-0 text-ink-2" />
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="absolute inset-0 size-full cursor-pointer opacity-0">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  )
}

function DocPic({ name }) {
  const src = DOCTORS[name]
  if (src) return <img src={src} alt="" className="size-7 shrink-0 rounded-full object-cover object-top" />
  return <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e6f4f3] text-[11px] font-bold text-[#0b6d73]">{name.replace('Dr. ', '')[0]}</span>
}

function PatientRow({ p, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2.5 border-b border-line/60 px-3 py-2 text-left last:border-0 active:bg-page">
      <Face p={p} className="size-9" text="text-[12px]" />
      <span className="min-w-0 flex-1">
        <b className="block truncate text-[13px] font-semibold text-ink">{p.name}</b>
        <span className="block truncate text-[11px] text-muted">#{p.code} · {p.phone}</span>
      </span>
    </button>
  )
}

function PickerSheet({ patients, onClose, onPick }) {
  const [q, setQ] = useState('')
  const [n, setN] = useState(30)
  const s = q.trim().toLowerCase()
  const list = patients.filter((p) => !s || p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s))
  return (
    <BottomSheet title="Bemorni tanlash" onClose={onClose}>
      <label className="sticky top-0 z-10 mt-2 flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-3">
        <Search className="size-4 text-muted" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setN(30) }} placeholder="Ism yoki ID" className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none" />
      </label>
      <div className="mt-2 pb-2">
        {list.slice(0, n).map((p) => <PatientRow key={p.id} p={p} onClick={() => onPick(p)} />)}
        {list.length > n && <button type="button" onClick={() => setN((x) => x + 30)} className="mt-2 h-10 w-full rounded-xl bg-page text-[12.5px] font-semibold text-sea">Yana ko‘rsatish ({list.length - n})</button>}
        {!list.length && <p className="py-6 text-center text-[12.5px] text-muted">Bemor topilmadi</p>}
      </div>
    </BottomSheet>
  )
}
