import { useState } from 'react'
import { Check, X } from 'lucide-react'
import PersonAvatar from '../PersonAvatar'
import { METHODS, addClinicPayment, planFor, som } from '../../tolovData'
import { tashkentToday } from '../../tashkentDate'

function todayDots() {
  return tashkentToday().split('-').reverse().join('.')
}

/**
 * To‘lov oynasi. PaymentForm (PR #171) hali main’da yo‘q, shu sabab
 * clinic_payments ga yozadigan yengil nusxa. #171 chiqqach PaymentForm
 * bilan almashtirish mumkin (lockPatient + patient).
 */
export default function VisitPayDialog({ patient, onClose, onSave }) {
  const plan = planFor(patient)
  const debt = Math.max(0, plan.plan - plan.paid)
  const [amount, setAmount] = useState(String(debt || ''))
  const [date, setDate] = useState(todayDots())
  const [method, setMethod] = useState('Naqd')
  const [error, setError] = useState('')

  const submit = () => {
    const sum = Number(String(amount).replace(/\D/g, ''))
    if (!patient || !sum || !date || !method) {
      setError('Bemor, summa, sana va to‘lov usuli majburiy.')
      return
    }
    const payment = {
      id: `tl-${Date.now()}`,
      receipt: `TL-${String(330 + (Date.now() % 500)).padStart(5, '0')}`,
      date,
      time: new Date().toTimeString().slice(0, 5),
      name: patient.name,
      patientId: patient.id,
      photo: patient.photo,
      phone: patient.phone,
      service: plan.name,
      amount: sum,
      method,
      status: 'Tolandi',
    }
    addClinicPayment(payment)
    onSave?.(payment)
    onClose?.()
  }

  return (
    <div className="bemor-shade z-[80]" onClick={onClose}>
      <div className="bemor-dialog tolov-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="tolov-title" data-testid="visit-pay-dialog">
        <div className="bemor-dialog-head flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 id="tolov-title" className="text-[18px] font-bold">Yangi to‘lov qo‘shish</h2>
            <p className="mt-0.5 text-[12.5px] text-muted">Bemor to‘lovini kiriting</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-[#f4f7fb]" aria-label="Yopish"><X className="size-4" /></button>
        </div>
        <div className="bemor-dialog-body space-y-4 px-5 py-4">
          <div>
            <p className="mb-1 text-[12px] font-medium text-ink-2">Bemor <span className="text-[#e11d48]">*</span></p>
            <div className="flex h-14 w-full items-center gap-2 rounded-xl border border-line px-3">
              <PersonAvatar src={patient?.photo} name={patient?.name || '?'} size={36} />
              <span className="min-w-0 flex-1">
                <b className="block truncate text-[13px]">{patient?.name}</b>
                <span className="block truncate text-[11px] text-muted">{[patient?.phone, patient?.age].filter(Boolean).join(' · ')}</span>
              </span>
            </div>
          </div>
          <div>
            <p className="mb-1 text-[12px] font-medium text-ink-2">Davolash rejasi</p>
            <div className="rounded-xl bg-[#f4f7fb] px-3 py-2 text-[12.5px]">
              <b className="block">{plan.name}</b>
              {plan.plan ? <span className="text-muted">Reja {som(plan.plan)} · To‘langan {som(plan.paid)} · Qarz {som(debt)}</span> : <span className="text-muted">Summani kiriting</span>}
            </div>
          </div>
          <label className="block text-[12px] font-medium text-ink-2">
            <span className="mb-1 block">Summa <span className="text-[#e11d48]">*</span></span>
            <span className="relative block">
              <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" className="h-12 w-full rounded-xl border border-line px-3 pr-14 text-[15px] font-semibold outline-none focus:border-sea" />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted">so‘m</span>
            </span>
          </label>
          <label className="block text-[12px] font-medium text-ink-2">
            <span className="mb-1 block">Sana</span>
            <input type="text" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 w-full rounded-xl border border-line px-3 text-[13px] outline-none focus:border-sea" />
          </label>
          <div>
            <p className="mb-1 text-[12px] font-medium text-ink-2">To‘lov usuli <span className="text-[#e11d48]">*</span></p>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.filter((m) => m.id !== 'Otkazma').map((m) => {
                const on = method === m.id
                return (
                  <button key={m.id} type="button" onClick={() => setMethod(m.id)} className={`relative flex min-h-12 items-center justify-center rounded-xl border px-3 py-2 text-[13px] font-semibold ${on ? 'border-sea bg-sea-50 text-sea' : 'border-line bg-white text-ink-2'}`}>
                    {m.label}
                    {on && <Check className="absolute right-2 top-2 size-4 text-sea" />}
                  </button>
                )
              })}
            </div>
          </div>
          {error && <p className="text-[12px] text-[#e11d48]">{error}</p>}
        </div>
        <div className="bemor-dialog-foot flex items-center justify-end gap-2 border-t border-line px-5 py-3">
          <button type="button" onClick={onClose} className="h-10 min-w-12 rounded-xl border border-line px-4 text-[12.5px] font-semibold">Bekor qilish</button>
          <button type="button" onClick={submit} className="inline-flex h-10 min-w-12 items-center gap-1.5 rounded-xl bg-sea px-5 text-[12.5px] font-semibold text-white"><Check className="size-4" /> Saqlash</button>
        </div>
      </div>
    </div>
  )
}
