import { useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Banknote, CalendarDays, Check, ChevronDown, ChevronLeft, ClipboardList, Coins, CreditCard, FileText, Landmark, ReceiptText, Save, Search, X } from 'lucide-react'
import { patchBemor, useBemorlar } from '../../bemorData'
import { METHODS, methodOf } from '../../tolovData'
import { addPayment, debtOf, totalOf, usePlans } from '../../rejaData'
import { BottomSheet } from './MobileSeminars'
import { Face, fmtDate, isoToDots } from './bemorParts'
import { TODAY, addTolov, fmt, nextReceipt, sum } from './MobileTolovlar'

const REJA_METHOD = { Naqd: 'Naqd', Karta: 'Plastik karta', Click: 'Click', Payme: 'Payme', Otkazma: 'Bank o‘tkazmasi' }

function MethodIcon({ id }) {
  if (id === 'Naqd') return <Banknote className="size-7 text-[#0b6d73]" strokeWidth={1.5} />
  if (id === 'Karta') return <CreditCard className="size-7 text-[#0b6d73]" strokeWidth={1.5} />
  if (id === 'Otkazma') return <Landmark className="size-7 text-[#0b6d73]" strokeWidth={1.5} />
  if (id === 'Click') {
    return (
      <span className="flex flex-col items-center">
        <span className="relative grid size-6 place-items-center rounded-[7px] bg-[#1e7cf2]">
          <span className="size-3 rounded-full border-[2.5px] border-white" />
          <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-[#ff3b47] ring-2 ring-white" />
        </span>
        <span className="mt-0.5 text-[7px] font-black leading-none tracking-wide text-[#1e7cf2]">CLICK</span>
      </span>
    )
  }
  return <span className="flex items-center text-[14px] font-black leading-none text-[#1b3a57]">Pay<span className="ml-px rounded-[4px] bg-[#33cccc] px-[3px] py-[2px] text-[11px] text-white">me</span></span>
}

export default function MobileTolovNew() {
  const navigate = useNavigate()
  const location = useLocation()
  const patients = useBemorlar()
  const plans = usePlans()
  const formRef = useRef(null)
  const start = plans.find((p) => p.id === location.state?.planId)

  const [patient, setPatient] = useState(() => {
    if (start) return patients.find((p) => p.id === start.patient.id) || start.patient
    return patients.find((p) => p.id === location.state?.patientId) || null
  })
  const bemor = patient?.id ? patients.find((p) => p.id === patient.id) : null
  const options = useMemo(() => {
    if (!patient) return []
    const own = plans.filter((pl) => (pl.patient.id ? pl.patient.id === patient.id : pl.patient.name === patient.name))
    const list = own.map((pl) => ({
      key: pl.id, plan: pl, title: pl.title, meta: `ID: #${pl.code} • ${pl.stages.length} ta xizmat • ${new Set(pl.stages.flatMap((s) => s.teeth)).size} ta tish`,
      total: totalOf(pl), paid: pl.paid, debt: debtOf(pl),
    }))
    if (bemor) list.push({ key: 'acc', title: 'Umumiy hisob', meta: `ID: #${bemor.code} • ${(bemor.visits || []).length} ta tashrif`, total: bemor.total, paid: bemor.paid, debt: bemor.debt })
    return list
  }, [patient, plans, bemor])
  const [accKey, setAccKey] = useState(() => start?.id || '')
  const acc = options.find((o) => o.key === accKey) || options.find((o) => o.debt > 0) || options[0] || null

  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('Naqd')
  const [date, setDate] = useState(TODAY)
  const [chek, setChek] = useState(true)
  const [note, setNote] = useState('')
  const [tried, setTried] = useState(false)
  const [sheet, setSheet] = useState(null)

  const n = Number(amount) || 0
  const errs = { patient: !patient, acc: !!patient && !acc, amount: n <= 0 || (acc && acc.debt > 0 && n > acc.debt) }
  const bad = (k) => tried && errs[k]
  const amountHint = n <= 0 ? 'Summani kiriting' : `Summa qarzdan (${sum(acc?.debt)}) oshmasligi kerak`

  const pickPatient = (p) => { setPatient(p); setAccKey(''); setAmount(''); setSheet(null) }
  const save = () => {
    setTried(true)
    if (Object.values(errs).some(Boolean)) {
      requestAnimationFrame(() => formRef.current?.querySelector('[data-bad="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
      return
    }
    const now = new Date()
    addTolov({
      id: `tl-m${Date.now()}`, receipt: nextReceipt(), date: isoToDots(date), time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      name: patient.name, patientId: bemor?.id || '', photo: patient.photo || '', phone: patient.phone || '',
      service: acc.title, amount: n, method, status: acc.debt > 0 && n < acc.debt ? 'Qisman' : 'Tolandi', chek, note: note.trim(), planId: acc.plan?.id || '',
    })
    if (acc.plan) addPayment(acc.plan.id, n, REJA_METHOD[method], date)
    if (bemor) {
      const history = bemor.payments || (bemor.paid ? [{ date: fmtDate(bemor.last) || '—', sum: bemor.paid, method: 'Naqd' }] : [])
      patchBemor(bemor.id, { paid: bemor.paid + n, payments: [{ date: fmtDate(isoToDots(date)), sum: n, method: methodOf(method).label }, ...history] })
    }
    navigate('/tolovlar', { replace: true, state: { toast: `${sum(n)} qabul qilindi · ${patient.name}` } })
  }
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/tolovlar'))
  const box = (k) => `flex items-center gap-3 rounded-xl border bg-white px-3 text-left transition ${bad(k) ? 'border-sale' : 'border-line'}`

  return (
    <div className="min-h-screen bg-white pb-[92px]">
      <header className="sticky top-0 z-20 grid grid-cols-[40px_1fr_40px] items-center bg-white/95 px-2.5 pb-2 pt-3 backdrop-blur">
        <button type="button" onClick={back} aria-label="Orqaga" className="grid size-10 place-items-center text-sea"><ChevronLeft className="size-6" /></button>
        <div className="text-center">
          <h1 className="text-[18px] font-extrabold leading-tight text-[#0d2a4a]">Yangi to‘lov qo‘shish</h1>
          <p className="text-[12px] text-muted">To‘lov ma’lumotlarini kiriting</p>
        </div>
        <button type="button" onClick={() => navigate('/tolovlar')} aria-label="Yopish" className="grid size-10 place-items-center text-sea"><X className="size-6" /></button>
      </header>

      <div ref={formRef} className="flex flex-col gap-3.5 px-3.5 pt-2">
        <Field label="Bemor" req bad={bad('patient')} hint={bad('patient') && 'Bemorni tanlang'}>
          <button type="button" onClick={() => setSheet('patient')} className={`${box('patient')} h-[60px] w-full`}>
            {patient ? (
              <>
                <Face p={patient} className="size-11" text="text-[13px]" />
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[14px] font-bold text-[#0d2a4a]">{patient.name}</b>
                  <span className="block truncate text-[11.5px] text-muted">ID: #{patient.code}{patient.phone && <><span className="mx-1.5">•</span>{patient.phone}</>}</span>
                </span>
              </>
            ) : (
              <>
                <span className="grid size-11 place-items-center rounded-full bg-[#f1f5f8] text-muted"><Search className="size-5" /></span>
                <span className="flex-1 text-[13.5px] text-muted">Bemorni tanlang</span>
              </>
            )}
            <ChevronDown className="size-4 shrink-0 text-ink-2" />
          </button>
        </Field>

        <Field label="Davolash rejasi" req bad={bad('acc')} hint={bad('acc') && 'Bu bemorda to‘lov uchun hisob yo‘q'}>
          <button type="button" disabled={!patient} onClick={() => setSheet('acc')} className={`${box('acc')} h-[60px] w-full disabled:bg-[#f6f8fa]`}>
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#e6f4f3] text-[#0b6d73]"><ClipboardList className="size-5" strokeWidth={1.7} /></span>
            <span className="min-w-0 flex-1">
              <b className={`block truncate text-[14px] font-semibold ${acc ? 'text-[#0d2a4a]' : 'text-muted'}`}>{acc ? acc.title : patient ? 'Hisob topilmadi' : 'Avval bemorni tanlang'}</b>
              {acc && <span className="block truncate text-[11px] text-muted">{acc.meta}</span>}
            </span>
            {options.length > 1 && <ChevronDown className="size-4 shrink-0 text-ink-2" />}
          </button>
        </Field>

        {acc && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-[#f3f7fa] p-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#dff1ef] text-[#0b6d73]"><Coins className="size-[22px]" strokeWidth={1.6} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-ink-2">Qarz</p>
              <b className={`block whitespace-nowrap ${acc.debt >= 1e7 ? 'text-[14px]' : 'text-[16px]'} font-extrabold leading-tight tracking-tight ${acc.debt > 0 ? 'text-[#e0263c]' : 'text-[#1c9a52]'}`}>{acc.debt > 0 ? sum(acc.debt) : 'Qarz yo‘q'}</b>
            </div>
            <div className="shrink-0 border-l border-line pl-2.5 text-[10.5px] leading-[18px]">
              <p className="flex justify-between gap-2"><span className="text-muted">Umumiy:</span> <span className="font-medium text-ink">{sum(acc.total)}</span></p>
              <p className="flex justify-between gap-2"><span className="text-muted">To‘langan:</span> <span className="font-medium text-ink">{sum(acc.paid)}</span></p>
            </div>
          </div>
        )}

        <Field label="Summa" req bad={bad('amount')} hint={bad('amount') && amountHint}>
          <label className={`${box('amount')} h-14 focus-within:border-sea`}>
            <Coins className="size-5 shrink-0 text-sea" strokeWidth={1.6} />
            <span className="h-6 w-px bg-line" />
            <input value={amount ? fmt(amount) : ''} onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 11))} inputMode="numeric" placeholder="0" aria-label="Summa" className="min-w-0 flex-1 bg-transparent text-[22px] font-bold text-[#0d2a4a] outline-none placeholder:text-[#c5ced9]" />
            <span className="text-[13px] text-muted">so‘m</span>
          </label>
          {acc?.debt > 0 && (
            <div className="mt-2 flex gap-1.5">
              {[['To‘liq qarz', acc.debt], ['50%', Math.round(acc.debt / 2 / 1000) * 1000], ['1 000 000', 1000000]].filter(([, v]) => v > 0 && v <= acc.debt).map(([l, v]) => (
                <button key={l} type="button" aria-pressed={n === v} onClick={() => setAmount(String(v))} className={`h-8 rounded-lg border px-3 text-[12px] font-medium ${n === v ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink-2'}`}>{l}</button>
              ))}
            </div>
          )}
        </Field>

        <Field label="To‘lov usuli" req>
          <div className="grid grid-cols-5 gap-1.5">
            {METHODS.map((m) => {
              const on = method === m.id
              return (
                <button key={m.id} type="button" aria-pressed={on} onClick={() => setMethod(m.id)} className={`relative flex h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl border transition ${on ? 'border-[#0b8a95] bg-[#f0f9f8] ring-1 ring-[#0b8a95]' : 'border-line'}`}>
                  {on && <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-[#0b8a95] text-white"><Check className="size-2.5" strokeWidth={3} /></span>}
                  <span className="grid h-7 place-items-center"><MethodIcon id={m.id} /></span>
                  <span className="text-[11px] font-medium text-ink">{m.label}</span>
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Sana" req>
          <label className="relative flex h-12 items-center gap-3 rounded-xl border border-line bg-white px-3">
            <CalendarDays className="size-5 shrink-0 text-sea" strokeWidth={1.6} />
            <span className="h-6 w-px bg-line" />
            <span className="flex-1 text-[14px] text-ink">{isoToDots(date)}</span>
            <ChevronDown className="size-4 shrink-0 text-ink-2" />
            <input type="date" value={date} max={TODAY} onChange={(e) => e.target.value && setDate(e.target.value)} onClick={(e) => e.currentTarget.showPicker?.()} aria-label="Sana" className="absolute inset-0 size-full cursor-pointer opacity-0" />
          </label>
        </Field>

        <button type="button" role="switch" aria-checked={chek} onClick={() => setChek((v) => !v)} className="flex items-center gap-3 rounded-2xl bg-[#f3f7fa] px-3 py-3 text-left">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#dff1ef] text-[#0b6d73]"><ReceiptText className="size-5" strokeWidth={1.7} /></span>
          <span className="min-w-0 flex-1">
            <b className="block text-[13.5px] font-semibold text-ink">Chek chiqarish</b>
            <span className="block text-[11.5px] text-muted">To‘lov uchun fiskal chek chiqarish</span>
          </span>
          <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${chek ? 'bg-[#0b8a95]' : 'bg-line'}`}><span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all ${chek ? 'left-[22px]' : 'left-0.5'}`} /></span>
        </button>

        <Field label="Izoh">
          <div className="flex gap-2.5 rounded-xl border border-line bg-white px-3 py-2.5 focus-within:border-sea">
            <FileText className="mt-0.5 size-5 shrink-0 text-muted" strokeWidth={1.6} />
            <textarea value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="To‘lov haqida izoh (ixtiyoriy)..." className="min-w-0 flex-1 resize-none bg-transparent text-[13.5px] outline-none placeholder:text-muted" />
          </div>
          <p className="mt-1 text-right text-[11px] text-muted">{note.length}/500</p>
        </Field>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-white/95 px-3.5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <button type="button" onClick={save} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#0b8a95] text-[15px] font-semibold text-white shadow-[0_8px_18px_rgb(11_138_149/0.3)] active:scale-[0.99]">
          <Save className="size-5" /> Saqlash
        </button>
      </div>

      {sheet === 'patient' && <PatientSheet patients={patients} plans={plans} onClose={() => setSheet(null)} onPick={pickPatient} />}
      {sheet === 'acc' && (
        <BottomSheet title="Davolash rejasi" onClose={() => setSheet(null)}>
          <div className="mt-2 flex flex-col gap-2 pb-2">
            {options.map((o) => (
              <button key={o.key} type="button" aria-pressed={acc?.key === o.key} onClick={() => { setAccKey(o.key); setAmount(''); setSheet(null) }} className={`flex items-center gap-3 rounded-xl border p-3 text-left ${acc?.key === o.key ? 'border-sea bg-sea-50' : 'border-line'}`}>
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#e6f4f3] text-[#0b6d73]"><ClipboardList className="size-5" strokeWidth={1.7} /></span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[13.5px] font-semibold text-ink">{o.title}</b>
                  <span className="block truncate text-[11px] text-muted">{o.meta}</span>
                </span>
                <b className={`shrink-0 text-[12.5px] font-bold ${o.debt > 0 ? 'text-[#e0263c]' : 'text-[#1c9a52]'}`}>{o.debt > 0 ? sum(o.debt) : 'To‘langan'}</b>
              </button>
            ))}
          </div>
        </BottomSheet>
      )}
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

function PatientSheet({ patients, plans, onClose, onPick }) {
  const [q, setQ] = useState('')
  const [n, setN] = useState(30)
  const list = useMemo(() => {
    const extra = plans.filter((pl) => !pl.patient.id && !patients.some((p) => p.name === pl.patient.name)).map((pl) => pl.patient)
    const debtors = patients.filter((p) => p.debt > 0 && p.photo)
    const rest = patients.filter((p) => !(p.debt > 0 && p.photo))
    return [...debtors, ...extra, ...rest]
  }, [patients, plans])
  const s = q.trim().toLowerCase()
  const digits = s.replace(/\D/g, '')
  const rows = list.filter((p) => !s || p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s.replace('#', '')) || (digits.length >= 3 && p.phone.replace(/\D/g, '').includes(digits)))
  return (
    <BottomSheet title="Bemorni tanlang" onClose={onClose}>
      <label className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-line px-3">
        <Search className="size-4 text-muted" />
        <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setN(30) }} placeholder="Ism, telefon yoki ID" className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none" />
      </label>
      <div className="mt-2 pb-2">
        {rows.slice(0, n).map((p) => (
          <button key={p.id || p.name} type="button" onClick={() => onPick(p)} className="flex w-full items-center gap-2.5 border-b border-line/60 py-2 text-left last:border-0 active:bg-page">
            <Face p={p} className="size-10" text="text-[12px]" />
            <span className="min-w-0 flex-1">
              <b className="block truncate text-[13px] font-semibold text-ink">{p.name}</b>
              <span className="block truncate text-[11px] text-muted">#{p.code} · {p.phone}</span>
            </span>
            {p.debt > 0 && <span className="shrink-0 text-[11.5px] font-semibold text-[#e0263c]">{sum(p.debt)}</span>}
          </button>
        ))}
        {rows.length > n && <button type="button" onClick={() => setN((x) => x + 30)} className="mt-2 h-10 w-full rounded-xl bg-page text-[12.5px] font-semibold text-sea">Yana ko‘rsatish ({rows.length - n})</button>}
        {!rows.length && <p className="py-6 text-center text-[12.5px] text-muted">Bemor topilmadi</p>}
      </div>
    </BottomSheet>
  )
}
