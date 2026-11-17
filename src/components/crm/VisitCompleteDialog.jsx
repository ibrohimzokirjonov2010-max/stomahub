import { useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import { useXizmatlar } from '../../xizmatData'
import { tashkentToday } from '../../tashkentDate'
import { useMobile } from '../../useMobile'
import { usePlans, planForVisit, completeVisitStages, saveDonePlanFromServices, money } from '../../rejaData'
import { setVisits } from '../../uchrashuvData'

function toothLabel(s) {
  const teeth = Array.isArray(s.teeth) ? s.teeth : (s.tooth ? [s.tooth] : [])
  return teeth.length ? teeth.join(', ') : '—'
}

function stageRows(plan, visit) {
  const stages = plan?.stages || []
  const linked = stages.filter((s) => s.visitId === visit.id)
  const linkedIds = new Set(linked.map((s) => s.id))
  const rest = stages.filter((s) => !linkedIds.has(s.id) && s.status !== 'bajarildi')
  return [...linked, ...rest]
}

export default function VisitCompleteDialog({ visit, patient, onClose, onDone }) {
  const mobile = useMobile()
  const allPlans = usePlans()
  const catalog = useXizmatlar().filter((s) => s.status !== 'nofaol' && s.name)
  const plan = useMemo(() => planForVisit(allPlans, visit, patient), [allPlans, visit, patient])
  const rows = plan ? stageRows(plan, visit) : catalog.map((s) => ({ id: s.id, title: s.name, teeth: [], price: s.price, catalog: true }))
  const pre = new Set((plan ? rows.filter((s) => s.visitId === visit.id && s.status !== 'bajarildi') : []).map((s) => s.id))
  const [picked, setPicked] = useState(pre)
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')

  const visible = rows.filter((s) => {
    if (!q.trim()) return true
    const blob = `${s.title || s.name || ''} ${toothLabel(s)}`.toLowerCase()
    return blob.includes(q.trim().toLowerCase())
  })

  const toggle = (id, disabled) => {
    if (disabled) return
    setPicked((set) => {
      const next = new Set(set)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const submit = () => {
    const ids = [...picked]
    if (!ids.length) {
      setErr('Bugun bajarilgan xizmatni belgilang.')
      return
    }
    const today = tashkentToday()
    const teeth = []
    if (plan) {
      completeVisitStages(plan.id, ids, { date: today, visitId: visit.id })
      for (const s of plan.stages || []) {
        if (ids.includes(s.id)) teeth.push(...(s.teeth || []))
      }
    } else {
      const services = catalog.filter((s) => ids.includes(s.id))
      saveDonePlanFromServices(patient, services, { date: today, visitId: visit.id })
    }
    setVisits((list) => list.map((v) => (v.id === visit.id ? { ...v, status: 'yakunlangan', teeth: [...new Set(teeth)] } : v)))
    onDone?.()
  }

  const body = (
    <>
      <h2 id="tugatish-title" className="pr-8 text-[16px] font-bold text-ink">{plan ? 'Qaysi xizmatlar bajarildi?' : 'Bugun qilingan xizmatlarni tanlang'}</h2>
      <p className="mt-1 text-[12.5px] text-muted">
        {plan ? `${plan.title} · ${plan.code || ''}` : 'Bu bemorning davolash rejasi yo‘q. Xizmatlar ro‘yxatidan tanlang — ular yangi reja sifatida saqlanadi.'}
      </p>
      {!plan && (
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Xizmat qidirish..." className="mt-3 h-12 w-full rounded-xl border border-line px-3 text-[13px] outline-none focus:border-sea" />
      )}
      <ul className="mt-3 max-h-[50dvh] space-y-1.5 overflow-y-auto" data-testid="tugatish-list">
        {visible.map((s) => {
          const done = s.status === 'bajarildi'
          const on = picked.has(s.id) || done
          return (
            <li key={s.id}>
              <label className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 ${done ? 'border-line bg-[#f6f8fb] opacity-70' : on ? 'border-sea bg-sea-50' : 'border-line bg-white'}`}>
                <input type="checkbox" checked={on} disabled={done} onChange={() => toggle(s.id, done)} className="size-5 accent-[#0b8a95]" />
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[13px] text-ink">{s.title || s.name}</b>
                  <span className="text-[11.5px] text-muted">{s.catalog ? 'Xizmatlar' : `Tish: ${toothLabel(s)}`}</span>
                </span>
                <span className="shrink-0 text-[12.5px] font-semibold text-ink">{money(s.price || 0)} so‘m</span>
              </label>
            </li>
          )
        })}
        {visible.length === 0 && <li className="py-6 text-center text-[13px] text-muted">Xizmat topilmadi.</li>}
      </ul>
      {err && <p className="mt-2 text-[12px] text-[#e11d48]">{err}</p>}
    </>
  )

  const foot = (
    <div className={`flex gap-2 ${mobile ? 'flex-col-reverse' : 'justify-end'} mt-4`}>
      <button type="button" onClick={onClose} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line px-4 text-[13.5px] font-semibold">Bekor qilish</button>
      <button type="button" data-testid="btn-bajarildi" onClick={submit} className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-sea px-4 text-[13.5px] font-semibold text-white">
        <Check className="size-4" /> Bajarildi
      </button>
    </div>
  )

  if (mobile) {
    return (
      <div className="fixed inset-0 z-[80] flex flex-col justify-end bg-ink/50" onClick={onClose} data-testid="tugatish-dialog">
        <div role="dialog" aria-labelledby="tugatish-title" className="relative max-h-[90dvh] overflow-y-auto rounded-t-3xl bg-white px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3" onClick={(e) => e.stopPropagation()}>
          <span className="mx-auto mb-2 block h-1 w-10 rounded-full bg-line" />
          <button type="button" onClick={onClose} aria-label="Yopish" className="absolute right-3 top-3 grid size-10 place-items-center rounded-full text-ink"><X className="size-4" /></button>
          {body}
          {foot}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/50 p-3" onClick={onClose} data-testid="tugatish-dialog">
      <div role="dialog" aria-labelledby="tugatish-title" className="relative w-full max-w-[520px] rounded-2xl bg-white p-5 shadow-[0_16px_40px_rgb(11_31_58/0.2)]" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="Yopish" className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-muted hover:bg-[#f4f7fb]"><X className="size-4" /></button>
        {body}
        {foot}
      </div>
    </div>
  )
}
