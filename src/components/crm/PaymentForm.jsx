import { useState } from 'react'
import { Banknote, Building2, Calendar, Check, ChevronDown, CreditCard, Info, X } from 'lucide-react'
import { METHODS, planFor, som } from '../../tolovData'
import { tashkentToday } from '../../tashkentDate'

function todayDots() {
  return tashkentToday().split('-').reverse().join('.')
}

/**
 * Yagona "Yangi to‘lov qo‘shish" formasi. Natija onSave(payment) orqali clinic_payments ga yoziladi.
 * lockPatient + patient: bemor oldindan tanlangan va o‘zgartirib bo‘lmaydi (profil oynasi).
 */
export default function PaymentForm({ patients, preset, edit, onClose, onSave, lockPatient = false, patient: lockedPatient = null }) {
  const picks = patients.filter((p) => p.photo).slice(0, 12)
  const [pid, setPid] = useState(edit?.patientId || lockedPatient?.id || '')
  const [whoOpen, setWhoOpen] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const patient = patients.find((p) => p.id === pid) || lockedPatient || picks[0]
  const plan = planFor(patient)
  const debt = Math.max(0, plan.plan - plan.paid)
  const [amount, setAmount] = useState(edit ? String(edit.amount) : String(debt || ''))
  const [date, setDate] = useState(edit?.date || todayDots())
  const [method, setMethod] = useState(edit?.method || preset || 'Naqd')
  const [chek, setChek] = useState(edit?.chek ?? true)
  const [note, setNote] = useState(edit?.note || '')
  const [error, setError] = useState('')

  const choose = (id) => {
    if (lockPatient) return
    const next = patients.find((p) => p.id === id)
    setPid(id)
    setWhoOpen(false)
    if (!edit && next) {
      const p = planFor(next)
      setAmount(String(Math.max(0, p.plan - p.paid)))
    }
  }

  const submit = () => {
    const sum = Number(String(amount).replace(/\D/g, ''))
    if (!patient || !sum || !date || !method) {
      setError('Bemor, summa, sana va to‘lov usuli majburiy.')
      return
    }
    onSave({
      id: edit?.id || `tl-${Date.now()}`,
      receipt: edit?.receipt || `TL-${String(330 + (Date.now() % 500)).padStart(5, '0')}`,
      date,
      time: edit?.time || new Date().toTimeString().slice(0, 5),
      name: patient.name,
      patientId: patient.id,
      photo: patient.photo,
      phone: patient.phone,
      service: plan.name,
      amount: sum,
      method,
      status: edit?.status || 'Tolandi',
      chek,
      note,
      detail: edit?.detail,
    })
  }

  return (
    <div className="bemor-shade" onClick={onClose}>
      <div className="bemor-dialog tolov-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="tolov-title">
        <div className="bemor-dialog-head flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 id="tolov-title" className="text-[18px] font-bold">{edit ? 'To‘lovni tahrirlash' : 'Yangi to‘lov qo‘shish'}</h2>
            <p className="mt-0.5 text-[12.5px] text-muted">Bemor to‘lovini kiriting</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-[#f4f7fb]" aria-label="Yopish"><X className="size-4" /></button>
        </div>
        <div className="bemor-dialog-body space-y-4 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Bemor" required>
              <button type="button" disabled={lockPatient} onClick={() => { if (lockPatient) return; setWhoOpen((v) => !v); setPlanOpen(false) }} className="flex h-14 w-full items-center gap-2 rounded-xl border border-line px-3 text-left disabled:cursor-default">
                <Face src={patient?.photo} name={patient?.name || '?'} className="size-9 shrink-0 rounded-full" />
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[13px]">{patient?.name}</b>
                  <span className="block truncate text-[11px] text-muted">{patient?.phone} · {patient?.age}</span>
                </span>
                {!lockPatient && <ChevronDown className="size-4 text-muted" />}
              </button>
              {whoOpen && !lockPatient && (
                <div className="absolute z-10 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-line bg-white p-1 shadow-card">
                  {picks.map((p) => (
                    <button key={p.id} type="button" onClick={() => choose(p.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[#f4f7fb]">
                      <Face src={p.photo} name={p.name} className="size-7 rounded-full" />
                      <span className="min-w-0"><b className="block truncate text-[12.5px]">{p.name}</b><span className="text-[11px] text-muted">{p.phone}</span></span>
                    </button>
                  ))}
                </div>
              )}
            </Field>
            <Field label="Davolash rejasi">
              <button type="button" onClick={() => { setPlanOpen((v) => !v); setWhoOpen(false) }} className="flex h-14 w-full items-center gap-2 rounded-xl border border-line px-3 text-left">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sea-50 text-sea"><Tooth /></span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[13px]">{plan.name}</b>
                  <span className="block truncate text-[11px] text-muted">{plan.date} · {som(plan.plan)}</span>
                </span>
                <ChevronDown className="size-4 text-muted" />
              </button>
              {planOpen && <p className="absolute z-10 mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-[12px] shadow-card">{plan.name} tanlangan</p>}
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Sum label="Reja summasi" value={som(plan.plan)} />
            <Sum label="To‘langan" value={som(plan.paid)} tone="#17803d" />
            <Sum label="Qarz" value={som(debt)} tone="#e11d48" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Summa" required>
              <div className="flex h-11 items-center rounded-xl border border-line px-3">
                <input value={groupDigits(amount)} onChange={(e) => { setAmount(e.target.value.replace(/\D/g, '')); setError('') }} className="w-full bg-transparent text-[14px] font-semibold outline-none" inputMode="numeric" />
                <span className="text-[12px] text-muted">so‘m</span>
              </div>
            </Field>
            <Field label="Sana">
              <div className="flex h-11 items-center gap-2 rounded-xl border border-line px-3">
                <input value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent text-[14px] outline-none" />
                <Calendar className="size-4 text-muted" />
              </div>
            </Field>
          </div>

          <div>
            <p className="mb-2 text-[12.5px] font-semibold">To‘lov usuli <span className="text-[#e11d48]">*</span></p>
            <div className="tolov-methods">
              {METHODS.map((m) => {
                const on = method === m.id
                return (
                  <button key={m.id} type="button" onClick={() => setMethod(m.id)} className="relative flex h-[72px] flex-col items-center justify-center gap-1 rounded-xl border bg-white text-[12px] font-semibold" style={{ borderColor: on ? '#1aa37a' : '#e7ecf3', boxShadow: on ? 'inset 0 0 0 1px #1aa37a' : 'none' }}>
                    {on && <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-[#1aa37a] text-white"><Check className="size-3" /></span>}
                    <MethodIcon id={m.id} />
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-2 rounded-xl bg-[#eef6ff] px-3 py-2.5 text-[12px] text-[#1d4e89]">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>Qarz summa to‘liq yopilsa, davolash rejasi avtomatik ravishda “Yakunlangan” holatiga o‘tadi.</p>
          </div>

          <button type="button" onClick={() => setChek((v) => !v)} className="flex items-center gap-3 text-left">
            <span className="relative h-6 w-11 rounded-full" style={{ background: chek ? '#1aa37a' : '#d5dde8' }}>
              <span className="absolute top-0.5 size-5 rounded-full bg-white shadow" style={{ left: chek ? 22 : 2 }} />
            </span>
            <span>
              <b className="block text-[13px]">Chek chiqarish</b>
              <span className="text-[12px] text-muted">To‘lov bo‘yicha fiskal chek chiqarish</span>
            </span>
          </button>

          <Field label="Izoh">
            <textarea value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="To‘lov haqida qo‘shimcha ma’lumot (ixtiyoriy)..." className="h-20 w-full resize-none rounded-xl border border-line px-3 py-2 text-[13px] outline-none" />
            <span className="mt-1 block text-right text-[11px] text-muted">{note.length}/300</span>
          </Field>
          {error && <p className="text-[12px] font-semibold text-[#e11d48]">{error}</p>}
        </div>
        <div className="bemor-dialog-foot flex justify-end gap-2 border-t border-line px-5 py-3">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-line px-4 text-[13px] font-semibold">Bekor qilish</button>
          <button type="button" onClick={submit} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#149e86] px-4 text-[13px] font-semibold text-white"><Check className="size-4" /> Saqlash</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="relative block text-[12.5px] font-semibold">
      {label} {required && <span className="text-[#e11d48]">*</span>}
      <div className="mt-1.5 font-normal">{children}</div>
    </label>
  )
}

function Sum({ label, value, tone }) {
  return (
    <div className="rounded-xl bg-[#f6f8fb] px-3 py-2.5">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-0.5 text-[13px] font-bold" style={{ color: tone || '#0b1f3a' }}>{value}</p>
    </div>
  )
}

function MethodIcon({ id }) {
  if (id === 'Naqd') return <span className="grid size-7 place-items-center rounded-lg bg-[#e9f9ef] text-[#12a150]"><Banknote className="size-4" /></span>
  if (id === 'Karta') return <span className="grid size-7 place-items-center rounded-lg bg-[#e8f1ff] text-[#2f6fed]"><CreditCard className="size-4" /></span>
  if (id === 'Click') return <span className="grid size-7 place-items-center rounded-full bg-[#e8f1ff] text-[13px] font-bold text-[#2f6fed]">C</span>
  if (id === 'Payme') return <span className="grid size-7 place-items-center rounded-lg bg-[#e7eeff] text-[13px] font-bold text-[#2546b8]">P</span>
  return <span className="grid size-7 place-items-center rounded-lg bg-[#eef2f6] text-[#334155]"><Building2 className="size-4" /></span>
}

function Tooth() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M7.5 3.5c1.4 0 2.2 1 4.5 1s3.1-1 4.5-1C19 3.5 21 5.4 21 8c0 2.4-.7 4.6-1.6 6.6-.8 1.8-1.6 4-2.3 5.2-.5.8-1.6.3-1.8-.7L14.6 16h-1.2l-.7 3.1c-.2 1-1.3 1.5-1.8.7-.7-1.2-1.5-3.4-2.3-5.2C7.7 12.6 7 10.4 7 8c0-2.6 2-4.5 4.5-4.5z" transform="translate(-2 0)" />
    </svg>
  )
}

function Face({ src, name, className }) {
  const letters = String(name || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('')
  if (!src) return <span className={`${className} grid place-items-center bg-sea-50 font-bold text-sea`}>{letters}</span>
  return <img src={src} alt="" className={`${className} object-cover`} />
}

function groupDigits(value) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
