import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Search, UserPlus, X } from 'lucide-react'
import { useBemorlar } from '../../bemorData'
import { useXizmatlar } from '../../xizmatData'
import { setVisits, useVisits } from '../../uchrashuvData'
import { chairNames, dayOffReason, freeSlots, useClinicSettings } from '../../clinicSettings'
import { tashkentToday } from '../../tashkentDate'
import PatientForm from './PatientForm'

const input = 'h-10 w-full rounded-xl border border-line bg-white px-3 text-[13px] outline-none focus:border-sea'

/** Shifokorning haqiqiy xizmatlari (faol), nom bo‘yicha takrorlanmasdan. */
export function serviceOptions(list) {
  const seen = new Set()
  return list.filter((s) => s.status !== 'nofaol' && s.name).filter((s) => {
    const k = s.name.trim().toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/**
 * Yagona "Qabulga yozish" formasi. Natija uchrashuvData 'visits' ga yoziladi.
 * initial: { date, start, patient, room, note }. lockPatient: bemorni o‘zgartirib bo‘lmaydi. onSaved(visit)
 */
export default function AppointmentForm({ initial = {}, onClose, onSaved, lockPatient = false }) {
  const patients = useBemorlar()
  const services = serviceOptions(useXizmatlar())
  const settings = useClinicSettings()
  const visits = useVisits()
  const chairs = chairNames(settings)
  const staff = (settings.staff || []).filter((s) => s.name && /shifokor/i.test(s.role || ''))
  const today = tashkentToday()
  const [patient, setPatient] = useState(initial.patient || null)
  const [find, setFind] = useState('')
  const [creating, setCreating] = useState(false)
  // Bir nechta xizmat: tanlanganlari bemorning davolash rejasiga bosqich bo‘lib tushadi (visitPlanSync)
  const [serviceIds, setServiceIds] = useState([])
  const picked = serviceIds.map((id) => services.find((s) => s.id === id)).filter(Boolean)
  const svc = picked[0]
  const [teeth, setTeeth] = useState('')
  const [dur, setDur] = useState(30)
  const [date, setDate] = useState(initial.date && initial.date >= today ? initial.date : today)
  const [room, setRoom] = useState(chairs.includes(initial.room) ? initial.room : chairs[0] || '')
  const [doctor, setDoctor] = useState(staff[0]?.name || 'me')
  const [time, setTime] = useState(initial.start || '')
  const [note, setNote] = useState(initial.note || '')
  const [err, setErr] = useState('')
  const roomNow = chairs.includes(room) ? room : chairs[0] || ''
  const busy = visits.filter((v) => v.date === date && v.room === roomNow && v.status !== 'bekor')
  const slots = useMemo(() => freeSlots(settings, date, { dur, busy }), [settings, date, dur, busy])
  const timeNow = slots.includes(time) ? time : ''
  const found = patients.filter((p) => `${p.name} ${p.phone}`.toLowerCase().includes(find.trim().toLowerCase())).slice(0, 8)

  const save = () => {
    if (!patient) return setErr('Bemorni ro‘yxatdan tanlang yoki yangi bemor qo‘shing.')
    if (!svc) return setErr('Kamida bitta xizmatni tanlang.')
    if (!roomNow) return setErr('Avval kreslo sonini kiriting.')
    if (!timeNow) return setErr('Bo‘sh vaqtni tanlang.')
    const visit = {
      id: `n${Date.now()}`, date, start: timeNow, dur, name: patient.name, photo: patient.photo || '', phone: patient.phone || '', patientId: patient.id || '',
      service: picked.map((s) => s.name).join(', '), serviceId: svc.id, price: picked.reduce((sum, s) => sum + (Number(s.price) || 0), 0),
      services: picked.map((s) => ({ id: s.id, name: s.name, price: Number(s.price) || 0 })), tooth: teeth.trim(),
      status: 'tasdiq', doctor, room: roomNow, note: note.trim(), isNew: patient.status === 'Yangi',
    }
    setVisits((list) => [...list, visit])
    onSaved?.(visit)
  }

  if (creating) return <PatientForm initialName={find.trim()} onClose={() => setCreating(false)} onSaved={(p) => { setPatient(p); setFind(''); setCreating(false) }} />

  return (
    <div className="bemor-shade" onClick={onClose}>
      <div role="dialog" aria-label="Qabulga yozish" className="bemor-dialog shadow-card" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="bemor-dialog-head flex items-start justify-between px-4 pt-3">
          <div><h2 className="text-[16px] font-bold">Qabulga yozish</h2><p className="text-[12px] text-muted">Bemor, xizmat, kreslo va vaqtni tanlang</p></div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center text-muted"><X className="size-4" /></button>
        </div>
        <div className="bemor-dialog-body space-y-3 px-4 pb-3">
          <div className="text-[12px] font-medium text-ink-2"><span className="mb-1 block">Bemor *</span>
            {patient ? (
              <span className="flex items-center gap-2 rounded-xl border border-line px-3 py-2">
                <span className="grid size-8 place-items-center rounded-full bg-sea-50 text-[11px] font-bold text-sea">{patient.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}</span>
                <span className="min-w-0 flex-1"><b className="block truncate text-[13px] text-ink">{patient.name}</b><span className="text-[11px] text-muted">{[patient.phone, patient.age].filter(Boolean).join(' · ')}</span></span>
                {!lockPatient && <button type="button" onClick={() => setPatient(null)} aria-label="Bemorni o‘zgartirish"><X className="size-4 text-muted" /></button>}
              </span>
            ) : (
              <div className="rounded-xl border border-line">
                <span className="flex h-10 items-center gap-2 px-3"><Search className="size-4 text-muted" /><input autoFocus value={find} onChange={(e) => setFind(e.target.value)} placeholder="Ism yoki telefon bo‘yicha qidiring" className="w-full bg-transparent text-[13px] outline-none" /></span>
                <ul className="max-h-44 overflow-y-auto border-t border-line py-1">
                  {found.map((p) => <li key={p.id}><button type="button" onClick={() => setPatient(p)} className="flex w-full justify-between px-3 py-1.5 text-left text-[12.5px] hover:bg-sea-50"><span>{p.name}</span><span className="text-muted">{p.phone}</span></button></li>)}
                  {!found.length && <li className="px-3 py-1.5 text-[12px] text-muted">{patients.length ? 'Bemor topilmadi' : 'Hali bemorlar yo‘q'}</li>}
                </ul>
                <button type="button" onClick={() => setCreating(true)} className="flex w-full items-center gap-1.5 border-t border-line px-3 py-2 text-[12.5px] font-semibold text-sea hover:bg-sea-50"><UserPlus className="size-4" /> Yangi bemor qo‘shish</button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-[12px] font-medium text-ink-2"><span className="mb-1 block">Xizmatlar *</span>
              {services.length ? (
                <select
                  aria-label="Xizmat qo‘shish"
                  value=""
                  onChange={(e) => {
                    const s = services.find((x) => x.id === e.target.value)
                    if (!s) return
                    const next = [...serviceIds, s.id]
                    setServiceIds(next)
                    const total = next.reduce((m, id) => m + (Number(services.find((x) => x.id === id)?.duration) || 0), 0)
                    if (total) setDur(Math.min(240, total))
                    setErr('')
                  }}
                  className={input}
                >
                  <option value="">{picked.length ? '+ Yana xizmat qo‘shish' : 'Xizmatni tanlang'}</option>
                  {services.filter((s) => !serviceIds.includes(s.id)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              ) : <p className="rounded-xl bg-[#fff8e6] px-3 py-2 text-[12px]">Xizmatlar ro‘yxati bo‘sh. <Link to="/xizmatlar" className="font-semibold text-sea underline">Xizmat qo‘shing</Link></p>}
            </div>
            <label className="text-[12px] font-medium text-ink-2"><span className="mb-1 block">Davomiyligi</span>
              <select value={dur} onChange={(e) => setDur(Number(e.target.value))} className={input}>{[...new Set([15, 30, 45, 60, 90, 120, dur])].sort((a, b) => a - b).map((n) => <option key={n} value={n}>{n} daqiqa</option>)}</select>
            </label>
            <label className="text-[12px] font-medium text-ink-2"><span className="mb-1 block">Kreslo *</span>
              {chairs.length
                ? <select value={roomNow} onChange={(e) => setRoom(e.target.value)} className={input}>{chairs.map((c) => <option key={c}>{c}</option>)}</select>
                : <p className="rounded-xl bg-[#fff8e6] px-3 py-2 text-[12px]">Avval kreslo sonini kiriting. <Link to="/klinika" state={{ settings: true }} onClick={onClose} className="font-semibold text-sea underline">Sozlamalarga o‘tish</Link></p>}
            </label>
            <label className="text-[12px] font-medium text-ink-2"><span className="mb-1 block">Shifokor</span>
              <select value={doctor} onChange={(e) => setDoctor(e.target.value)} className={input}>
                {staff.length ? staff.map((s) => <option key={s.name} value={s.name}>{s.name}</option>) : <option value="me">Men</option>}
              </select>
            </label>
            <label className="text-[12px] font-medium text-ink-2"><span className="mb-1 block">Sana *</span>
              <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value && e.target.value >= today ? e.target.value : today)} className={input} />
            </label>
          </div>
          {picked.length > 0 && (
            <div data-testid="appt-services" className="rounded-xl border border-line bg-[#f8fbfc] p-2">
              <ul className="flex flex-wrap gap-1.5">
                {picked.map((s) => (
                  <li key={s.id} className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-[12px] shadow-[0_0_0_1px_rgb(225_230_238)]">
                    <span className="font-semibold text-ink">{s.name}</span>
                    {Number(s.price) > 0 && <span className="text-muted">{Number(s.price).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m</span>}
                    <button type="button" onClick={() => setServiceIds((ids) => ids.filter((x) => x !== s.id))} aria-label={`${s.name} xizmatini olib tashlash`} className="text-muted hover:text-[#e11d48]"><X className="size-3.5" /></button>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 text-[12px] text-ink-2">Tish (FDI)
                  <input value={teeth} onChange={(e) => setTeeth(e.target.value.replace(/[^\d,\s]/g, '').slice(0, 30))} inputMode="numeric" placeholder="masalan, 36, 37" className="h-8 w-[130px] rounded-lg border border-line bg-white px-2 text-[12.5px] outline-none focus:border-sea" />
                </label>
                <span className="text-[11.5px] text-muted">Jami: <b className="text-ink">{picked.reduce((m, s) => m + (Number(s.price) || 0), 0).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m</b> · bemorning davolash rejasiga qo‘shiladi</span>
              </div>
            </div>
          )}
          <div className="text-[12px] font-medium text-ink-2"><span className="mb-1 block">Vaqt * <span className="font-normal text-muted">({slots.length} ta bo‘sh)</span></span>
            {slots.length ? (
              <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-8">
                {slots.map((s) => <button key={s} type="button" aria-pressed={timeNow === s} onClick={() => setTime(s)} className={`h-8 rounded-lg text-[12px] font-semibold ${timeNow === s ? 'bg-sea text-white' : 'bg-[#f4f7fb] text-ink-2 hover:bg-sea-50'}`}>{s}</button>)}
              </div>
            ) : <p className="rounded-xl bg-[#f4f7fb] px-3 py-2 text-[12px] text-muted">{dayOffReason(settings, date) || 'Bu kunga bo‘sh vaqt qolmagan. Boshqa sanani tanlang.'}</p>}
          </div>
          <label className="block text-[12px] font-medium text-ink-2"><span className="mb-1 block">Izoh</span>
            <textarea value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="Qo‘shimcha ma’lumot (ixtiyoriy)" className="h-14 w-full resize-none rounded-xl border border-line px-3 py-2 text-[13px] outline-none focus:border-sea" />
          </label>
          {err && <p className="text-[12px] text-[#e11d48]">{err}</p>}
        </div>
        <div className="bemor-dialog-foot flex items-center justify-end gap-2 border-t border-line px-4 py-3">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-line px-4 text-[12.5px] font-semibold">Bekor qilish</button>
          <button type="button" onClick={save} disabled={!chairs.length} title={chairs.length ? undefined : 'Avval kreslo sonini kiriting'} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-sea px-5 disabled:opacity-50 text-[12.5px] font-semibold text-white"><Calendar className="size-4" /> Yozish</button>
        </div>
      </div>
    </div>
  )
}
