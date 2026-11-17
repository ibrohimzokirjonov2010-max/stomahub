// Bemor profili bo‘limlari (kompyuter + telefon uchun umumiy panellar).
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, CalendarPlus, Check, ClipboardList, CreditCard, FileText, Pencil, Plus, RotateCcw, Trash2, Upload, Wallet, X,
} from 'lucide-react'
import { patchBemor, som } from '../../bemorData'
import { useVisits } from '../../uchrashuvData'
import { useClinicPayments } from '../../tolovData'
import { PLAN_STATUS, STAGE_STATUS, money, dmy, totalOf, progressOf, savePlan, saveTemplate, usePlans } from '../../rejaData'
import { useBlobSaveError } from '../../recordSync'
import { VISIT_STATUS_ORDER } from '../../visitStatus'
import { friendlySupabaseError } from '../../supabaseClient'
import RejaDialog from '../RejaDialog'
import { ANAMNEZ, anamnezLabels } from './PatientForm'
import {
  PAY_METHODS, VISIT_STATUS, addClinicPaymentFor, docDate, isPdf, markVisitDone, methodLabel, niceDate, openPatientFile,
  patientPayments, patientVisits, plansOf, removeCalendarVisit, removePatientDoc, todayIso, updateCalendarVisit, useFileUrl,
} from './patientRecords'

const btn = 'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold'
const field = 'h-10 w-full rounded-xl border border-line bg-white px-3 text-[13px] outline-none focus:border-sea'

/** Ma’lumotlar: bitta joyda hisoblanadi, ikkala (desktop/mobil) ko‘rinish ishlatadi. */
export function usePatientRecords(p) {
  const calendar = useVisits()
  const payments = useClinicPayments()
  const allPlans = usePlans()
  return useMemo(() => {
    const plans = plansOf(p, allPlans)
    return {
      plans,
      visits: patientVisits(p, calendar),
      money: patientPayments(p, payments, plans),
    }
  }, [p, calendar, payments, allPlans])
}

export function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-sea-50 text-sea"><Icon className="size-6" /></span>
      <b className="text-[14px] text-ink">{title}</b>
      {text && <p className="max-w-[340px] text-[12.5px] text-muted">{text}</p>}
      {action}
    </div>
  )
}

/* ================= Davolash rejalari ================= */

export function PlansPanel({ p, plans, onToast, highlightId = '', visitId = '' }) {
  const [dialog, setDialog] = useState(null)
  // Kalendardagi "Qabulda" havolasi (?tab=reja&plan=…&visit=…): shu reja birinchi va ajratilgan, shu qabul bosqichlari belgilangan.
  const focusId = highlightId || (visitId && plans.find((x) => x.visitId === visitId || (x.stages || []).some((s) => s.visitId === visitId))?.id) || ''
  const ordered = focusId ? [...plans].sort((a, b) => (b.id === focusId) - (a.id === focusId)) : plans
  const focusRef = useRef(null)
  useEffect(() => {
    if (focusId && focusRef.current) focusRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [focusId])
  const save = (plan, asTemplate) => {
    const isNew = !plans.some((x) => x.id === plan.id)
    savePlan(plan)
    if (asTemplate) saveTemplate({ name: plan.title, title: plan.title, items: plan.items, groups: plan.groups, discount: plan.discount, payMode: plan.payMode })
    setDialog(null)
    onToast?.(isNew ? 'Davolash rejasi yaratildi' : 'Reja saqlandi')
  }
  return (
    <div data-testid="tab-plans">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold text-ink">Davolash rejalari {plans.length > 0 && <span className="text-muted">({plans.length})</span>}</h2>
        {plans.length > 0 && <button type="button" onClick={() => setDialog({})} className={`${btn} bg-sea text-white`}><Plus className="size-4" /> Reja qo‘shish</button>}
      </div>
      {plans.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {ordered.map((plan) => <PlanCard key={plan.id} plan={plan} onEdit={() => setDialog(plan)} focus={plan.id === focusId} visitId={visitId} cardRef={plan.id === focusId ? focusRef : undefined} />)}
        </div>
      ) : (
        <section className="rounded-2xl bg-white shadow-card">
          <Empty
            icon={ClipboardList}
            title="Reja yo‘q"
            text="Bu bemor uchun hali davolash rejasi tuzilmagan. Qabulga xizmat tanlansa, reja avtomatik shakllanadi."
            action={<button type="button" onClick={() => setDialog({})} className={`${btn} mt-1 bg-sea text-white`}><Plus className="size-4" /> Reja qo‘shish</button>}
          />
        </section>
      )}
      {dialog && <RejaDialog initial={dialog.id ? dialog : null} patient={dialog.id ? null : p} onClose={() => setDialog(null)} onSave={save} />}
    </div>
  )
}

function PlanCard({ plan, onEdit, focus = false, visitId = '', cardRef }) {
  const st = PLAN_STATUS[plan.status] || PLAN_STATUS.reja
  const total = totalOf(plan)
  const paid = Number(plan.paid) || 0
  const pr = progressOf(plan)
  return (
    <section ref={cardRef} className={`min-w-0 scroll-mt-24 rounded-2xl bg-white p-4 shadow-card ${focus ? 'ring-2 ring-sea' : ''}`} data-testid="plan-card" data-focus={focus ? 'true' : undefined}>
      {focus && <p className="mb-2 inline-flex items-center gap-1 rounded-full bg-sea-50 px-2 py-0.5 text-[11px] font-semibold text-sea">Hozirgi qabul rejasi</p>}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11.5px] text-muted">{plan.code} · {dmy(plan.start)}</p>
          <h3 className="truncate text-[15px] font-bold text-ink">{plan.title}</h3>
        </div>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: st.bg, color: st.color }}>{st.label}</span>
      </div>
      <ol className="mt-3 flex flex-col divide-y divide-line/70 rounded-xl border border-line/70">
        {plan.stages.map((s, i) => {
          const ss = STAGE_STATUS[s.status] || STAGE_STATUS.rejada
          return (
            <li key={s.id} data-visit-stage={visitId && s.visitId === visitId ? 'true' : undefined} className={`flex items-center gap-2.5 px-3 py-2 text-[12.5px] ${s.status === 'bekor' ? 'opacity-60' : ''} ${visitId && s.visitId === visitId ? 'bg-sea-50/70' : ''}`}>
              <span className="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: ss.tint }}>{i + 1}</span>
              <span className="min-w-0 flex-1">
                <b className={`block truncate font-semibold text-ink ${s.status === 'bekor' ? 'line-through' : ''}`}>{s.title}</b>
                <span className="text-[11px] text-muted">{s.teeth?.length ? `Tish: ${s.teeth.join(', ')}` : 'Tish ko‘rsatilmagan'}{s.date ? ` · ${dmy(s.date)}` : ''}</span>
              </span>
              <span className="shrink-0 text-right">
                <b className="block whitespace-nowrap text-[12.5px] text-ink">{money(s.price)} so‘m</b>
                <span className="rounded px-1.5 text-[10.5px] font-semibold" style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
              </span>
            </li>
          )
        })}
        {!plan.stages.length && <li className="px-3 py-2 text-[12px] text-muted">Bosqichlar yo‘q</li>}
      </ol>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eef1f5]"><span className="block h-full rounded-full bg-sea" style={{ width: `${pr.pct}%` }} /></div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-[11.5px]">
        <p><span className="block text-muted">Jami</span><b className="text-ink">{money(total)} so‘m</b></p>
        <p><span className="block text-muted">To‘langan</span><b className="text-[#1c9a52]">{money(paid)} so‘m</b></p>
        <p><span className="block text-muted">Qarz</span><b className="text-[#e15b4c]">{money(Math.max(0, total - paid))} so‘m</b></p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onEdit} className={`${btn} border border-line bg-white text-ink`}><Pencil className="size-3.5" /> Tahrirlash</button>
        <Link to={`/davolash-rejalari/${plan.id}`} className={`${btn} bg-sea-50 text-sea`}>Batafsil</Link>
        <span className="ml-auto self-center text-[11px] text-muted">{pr.n}/{pr.of} bosqich</span>
      </div>
    </section>
  )
}

/* ================= Tashriflar ================= */

export function VisitsPanel({ visits, p, onAdd, onToast }) {
  const [edit, setEdit] = useState(null)
  const [ask, setAsk] = useState('')
  return (
    <section className="rounded-2xl bg-white p-4 shadow-card" data-testid="tab-visits">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold text-ink">Tashriflar {visits.length > 0 && <span className="text-muted">({visits.length})</span>}</h2>
        {visits.length > 0 && <button type="button" onClick={onAdd} className={`${btn} bg-sea text-white`}><CalendarPlus className="size-4" /> Qabul qo‘shish</button>}
      </div>
      {visits.length ? (
        <ul className="flex flex-col divide-y divide-line/70">
          {visits.map((v) => {
            const st = VISIT_STATUS[v.readOnly ? 'eski' : v.status] || VISIT_STATUS.tasdiq
            return (
              <li key={v.key} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-[12.5px]">
                <span className="w-[150px] shrink-0 text-ink-2">{v.iso ? niceDate(v.iso) : v.dateText || '—'}{v.time ? `, ${v.time}` : ''}</span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate font-semibold text-ink">{v.kind}{v.tooth ? <span className="font-normal text-muted"> · {v.tooth}-tish</span> : null}</b>
                  <span className="block truncate text-[11px] text-muted">{[v.doctor, v.room, v.note].filter(Boolean).join(' · ') || '—'}</span>
                </span>
                <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: st.bg, color: st.color }}>{v.readOnly ? `${v.done ? 'Bajarilgan' : 'Rejada'} · eski` : st.label}</span>
                {!v.readOnly && (
                  <span className="flex shrink-0 items-center gap-1">
                    <IconBtn label={v.done ? 'Rejaga qaytarish' : 'Bajarildi deb belgilash'} onClick={() => { markVisitDone(p, v, !v.done); onToast?.(v.done ? 'Qabul rejaga qaytarildi' : 'Qabul bajarildi') }}>{v.done ? <RotateCcw className="size-4" /> : <Check className="size-4" />}</IconBtn>
                    <IconBtn label="Tahrirlash" onClick={() => setEdit(v)}><Pencil className="size-4" /></IconBtn>
                    {ask === v.key ? (
                      <>
                        <button type="button" onClick={() => { removeCalendarVisit(v.id); setAsk(''); onToast?.('Tashrif o‘chirildi') }} className="h-8 rounded-lg bg-[#e15b4c] px-2.5 text-[11.5px] font-semibold text-white">O‘chirish</button>
                        <button type="button" onClick={() => setAsk('')} className="h-8 rounded-lg border border-line px-2.5 text-[11.5px] font-semibold">Yo‘q</button>
                      </>
                    ) : <IconBtn label="O‘chirish" danger onClick={() => setAsk(v.key)}><Trash2 className="size-4" /></IconBtn>}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <Empty icon={CalendarPlus} title="Hali tashrif yo‘q" text="Qabul qo‘shilsa, u Uchrashuvlar kalendarida ham ko‘rinadi." action={<button type="button" onClick={onAdd} className={`${btn} mt-1 bg-sea text-white`}><CalendarPlus className="size-4" /> Qabul qo‘shish</button>} />
      )}
      {edit && <VisitEditDialog p={p} v={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); onToast?.('Tashrif saqlandi') }} />}
    </section>
  )
}

function IconBtn({ label, onClick, children, danger }) {
  return <button type="button" title={label} aria-label={label} onClick={onClick} className={`grid size-8 place-items-center rounded-lg border border-line ${danger ? 'text-[#e15b4c]' : 'text-sea'} hover:bg-sea-50`}>{children}</button>
}

export function Dialog({ title, onClose, children, foot, wide }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="bemor-shade" onClick={onClose}>
      <div role="dialog" aria-label={title} className="bemor-dialog shadow-card" style={{ maxWidth: wide ? 640 : 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="bemor-dialog-head flex items-center justify-between px-4 pt-3"><h2 className="text-[16px] font-bold">{title}</h2><button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center text-muted"><X className="size-4" /></button></div>
        <div className="bemor-dialog-body space-y-3 px-4 pb-3 pt-2">{children}</div>
        {foot && <div className="bemor-dialog-foot flex items-center justify-end gap-2 border-t border-line px-4 py-3">{foot}</div>}
      </div>
    </div>
  )
}

const L = ({ t, children }) => <label className="block text-[12px] font-medium text-ink-2"><span className="mb-1 block">{t}</span>{children}</label>

function VisitEditDialog({ p, v, onClose, onSaved }) {
  const [f, setF] = useState({ date: v.iso, start: v.time, service: v.kind, doctor: v.doctor, note: v.note, status: v.status })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const save = () => {
    if (!f.date || !f.start || !f.service.trim()) return setErr('Sana, vaqt va xizmat majburiy.')
    const raw = v.raw || {}
    const renamed = f.service.trim() !== raw.service
    const finishing = f.status === 'yakun' && v.status !== 'yakun'
    const reopening = f.status !== 'yakun' && v.status === 'yakun'
    updateCalendarVisit(v.id, { date: f.date, start: f.start, service: f.service.trim(), doctor: f.doctor || raw.doctor || 'me', note: f.note.trim(), ...(finishing || reopening ? {} : { status: f.status }), ...(renamed && !raw.services ? { serviceId: '' } : {}) })
    // Yakunlash / qaytarish — "Tugatish" bilan bir xil yo‘l (bosqichlar patchPlan orqali, tish kartasi shu yerda)
    if (finishing) markVisitDone(p, { ...v, iso: f.date }, true)
    if (reopening) { markVisitDone(p, v, false); if (f.status !== 'tasdiq') updateCalendarVisit(v.id, { status: f.status }) }
    onSaved()
  }
  return (
    <Dialog title="Tashrifni tahrirlash" onClose={onClose} foot={<><button type="button" onClick={onClose} className={`${btn} border border-line`}>Bekor qilish</button><button type="button" onClick={save} className={`${btn} bg-sea text-white`}>Saqlash</button></>}>
      <div className="grid grid-cols-2 gap-2">
        <L t="Sana *"><input type="date" value={f.date} onChange={set('date')} className={field} /></L>
        <L t="Vaqt *"><input type="time" value={f.start} onChange={set('start')} className={field} /></L>
      </div>
      <L t="Xizmat *"><input value={f.service} onChange={set('service')} className={field} /></L>
      <div className="grid grid-cols-2 gap-2">
        <L t="Shifokor"><input value={f.doctor} onChange={set('doctor')} placeholder="Men" className={field} /></L>
        <L t="Holat"><select value={f.status} onChange={set('status')} className={field}>{VISIT_STATUS_ORDER.map((k) => <option key={k} value={k}>{VISIT_STATUS[k].label}</option>)}</select></L>
      </div>
      <L t="Izoh"><textarea value={f.note} onChange={set('note')} className="h-16 w-full resize-none rounded-xl border border-line px-3 py-2 text-[13px] outline-none focus:border-sea" /></L>
      {err && <p className="text-[12px] text-[#e11d48]">{err}</p>}
    </Dialog>
  )
}

/* ================= To‘lovlar ================= */

export function MoneyTiles({ m }) {
  const pct = m.total ? Math.min(100, Math.round((m.paid / m.total) * 100)) : m.paid ? 100 : 0
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {[['Umumiy summa', m.total, 'text-ink'], ['To‘langan', m.paid, 'text-[#1c9a52]'], ['Qarz', m.debt, 'text-[#e15b4c]']].map(([k, v, c]) => (
          <p key={k} className="min-w-0 rounded-xl bg-[#f6f9fc] p-2.5"><span className="block text-[11px] text-muted">{k}</span><b className={`block truncate text-[14px] ${c}`}>{som(v)}</b></p>
        ))}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef1f5]"><span className="block h-full rounded-full bg-sea" style={{ width: `${pct}%` }} /></div>
      <p className="mt-1 text-[11px] text-muted">{pct}% to‘langan</p>
    </div>
  )
}

export function PaymentsPanel({ m, onAdd }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-card" data-testid="tab-payments">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold text-ink">To‘lovlar</h2>
        <button type="button" onClick={onAdd} className={`${btn} bg-sea text-white`}><Plus className="size-4" /> To‘lov qo‘shish</button>
      </div>
      <MoneyTiles m={m} />
      <h3 className="mt-4 text-[13px] font-bold text-ink">To‘lovlar tarixi</h3>
      {m.list.length ? (
        <ul className="mt-1 flex flex-col divide-y divide-line/70">
          {m.list.map((x) => (
            <li key={x.key} className="flex items-center gap-3 py-2.5 text-[12.5px]">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e6f8ec] text-[#1c9a52]"><CreditCard className="size-4" /></span>
              <span className="min-w-0 flex-1">
                <b className="block truncate font-semibold text-ink">{x.method ? methodLabel(x.method) : 'To‘lov'}{x.receipt ? <span className="font-normal text-muted"> · {x.receipt}</span> : null}{x.source === 'legacy' ? <span className="font-normal text-muted"> · eski yozuv</span> : null}</b>
                <span className="block truncate text-[11px] text-muted">{x.iso ? niceDate(x.iso) : x.dateText || '—'}{x.time ? `, ${x.time}` : ''}{x.note ? ` · ${x.note}` : ''}</span>
              </span>
              <b className={`shrink-0 whitespace-nowrap ${x.status === 'Qaytarilgan' ? 'text-[#e15b4c] line-through' : 'text-[#1c9a52]'}`}>+{som(x.sum)}</b>
            </li>
          ))}
        </ul>
      ) : <Empty icon={Wallet} title="Hali to‘lov yo‘q" text="Qo‘shilgan to‘lov “To‘lovlar” bo‘limida ham ko‘rinadi." />}
    </section>
  )
}

export function PaymentDialog({ p, m, plans, onClose, onSaved }) {
  const [sum, setSum] = useState(m.debt ? String(m.debt) : '')
  const [date, setDate] = useState(todayIso())
  const [method, setMethod] = useState('Naqd')
  const [planId, setPlanId] = useState('')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const n = Number(String(sum).replace(/\D/g, ''))
  const save = () => {
    if (!n) return setErr('Summani kiriting.')
    if (!date || date > todayIso()) return setErr('Sana bugundan keyin bo‘lishi mumkin emas.')
    const plan = plans.find((x) => x.id === planId)
    addClinicPaymentFor(p, { sum: n, method, date, note: note.trim(), planId, service: plan?.title || '' })
    onSaved(`${som(n)} qabul qilindi`)
  }
  return (
    <Dialog title="To‘lov qabul qilish" onClose={onClose} foot={<><button type="button" onClick={onClose} className={`${btn} border border-line`}>Bekor qilish</button><button type="button" onClick={save} className={`${btn} bg-sea text-white`}>Qabul qilish{n ? ` · ${som(n)}` : ''}</button></>}>
      <p className="text-[12.5px] text-muted">{p.name} · #{p.code} · Qarz: <b className="text-[#e15b4c]">{som(m.debt)}</b></p>
      <div className="grid grid-cols-2 gap-2">
        <L t="Summa *"><input value={sum} onChange={(e) => { setSum(e.target.value.replace(/\D/g, '')); setErr('') }} inputMode="numeric" placeholder="Summa" className={field} /></L>
        <L t="Sana *"><input type="date" max={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} className={field} /></L>
      </div>
      <div><span className="mb-1 block text-[12px] font-medium text-ink-2">To‘lov usuli</span>
        <div className="flex flex-wrap gap-1.5">{PAY_METHODS.map(([k, l]) => <button key={k} type="button" aria-pressed={method === k} onClick={() => setMethod(k)} className={`h-9 rounded-xl border px-3 text-[12.5px] font-medium ${method === k ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`}>{l}</button>)}</div>
      </div>
      {plans.length > 0 && (
        <L t="Davolash rejasi (ixtiyoriy)"><select value={planId} onChange={(e) => setPlanId(e.target.value)} className={field}><option value="">Rejaga bog‘lamaslik</option>{plans.map((x) => <option key={x.id} value={x.id}>{x.code} · {x.title}</option>)}</select></L>
      )}
      <L t="Izoh"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ixtiyoriy" className={field} /></L>
      {err && <p className="text-[12px] text-[#e11d48]">{err}</p>}
    </Dialog>
  )
}

/* ================= Hujjatlar / Rentgen ================= */

export function DocThumb({ d, className = 'h-28', onOpen }) {
  const url = useFileUrl(d)
  const pdf = isPdf(d)
  return (
    <button type="button" onClick={onOpen} className={`relative block w-full overflow-hidden rounded-xl bg-[#f4f7fb] ${className}`} aria-label={`${d.name} — ochish`}>
      {!pdf && url ? <img src={url} alt={d.name} className="size-full object-cover" /> : (
        <span className="grid size-full place-items-center text-muted"><span className="flex flex-col items-center gap-1 text-[11px] font-semibold"><FileText className="size-7" />{pdf ? 'PDF' : 'Yuklanmoqda…'}</span></span>
      )}
    </button>
  )
}

export function DocsPanel({ p, onUpload, busy, error, onToast }) {
  const [ask, setAsk] = useState('')
  const [preview, setPreview] = useState(null)
  const docs = p.docs || []
  const open = (d) => {
    if (isPdf(d)) openPatientFile(d).catch((e) => onToast?.(e.message))
    else setPreview(d)
  }
  return (
    <section className="rounded-2xl bg-white p-4 shadow-card" data-testid="tab-docs">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold text-ink">Hujjatlar / Rentgen {docs.length > 0 && <span className="text-muted">({docs.length})</span>}</h2>
        <button type="button" onClick={onUpload} disabled={busy} className={`${btn} bg-sea text-white disabled:opacity-60`}><Upload className="size-4" /> {busy ? 'Yuklanmoqda…' : 'Fayl yuklash'}</button>
      </div>
      {error && <p role="alert" className="mb-3 flex items-start gap-2 rounded-xl bg-[#fdecee] px-3 py-2 text-[12.5px] text-[#c62f3a]"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{error}</p>}
      {docs.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {docs.map((d, i) => {
            const k = d.id || `${d.name}-${i}`
            return (
              <figure key={k} className="min-w-0">
                <DocThumb d={d} onOpen={() => open(d)} />
                <figcaption className="mt-1 flex items-start gap-1">
                  <span className="min-w-0 flex-1"><b className="block truncate text-[12px] font-semibold text-ink">{d.name}</b><span className="text-[11px] text-muted">{docDate(d)}</span></span>
                  {ask === k ? (
                    <span className="flex shrink-0 gap-1">
                      <button type="button" onClick={() => { removePatientDoc(p, d); setAsk(''); onToast?.('Fayl o‘chirildi') }} className="h-7 rounded-md bg-[#e15b4c] px-2 text-[11px] font-semibold text-white">O‘chirish</button>
                      <button type="button" onClick={() => setAsk('')} className="h-7 rounded-md border border-line px-2 text-[11px]">Yo‘q</button>
                    </span>
                  ) : <button type="button" onClick={() => setAsk(k)} aria-label={`${d.name} faylini o‘chirish`} className="grid size-7 shrink-0 place-items-center rounded-md text-[#e15b4c] hover:bg-[#fdecee]"><Trash2 className="size-4" /></button>}
                </figcaption>
              </figure>
            )
          })}
        </div>
      ) : <Empty icon={FileText} title="Hujjat yo‘q" text="Rentgen rasmi (JPG, PNG) yoki PDF hujjat yuklang. Fayllar faqat sizga ko‘rinadi." />}
      {preview && <ImagePreview d={preview} onClose={() => setPreview(null)} />}
    </section>
  )
}

function ImagePreview({ d, onClose }) {
  const url = useFileUrl(d)
  return (
    <div className="bemor-shade" onClick={onClose}>
      <div className="relative max-h-full max-w-[min(1100px,100%)]" onClick={(e) => e.stopPropagation()}>
        {url ? <img src={url} alt={d.name} className="max-h-[80vh] rounded-xl object-contain" /> : <p className="rounded-xl bg-white p-6 text-[13px]">Yuklanmoqda…</p>}
        <p className="mt-2 text-center text-[12.5px] font-semibold text-white">{d.name} · {docDate(d)}</p>
        <button type="button" onClick={onClose} aria-label="Yopish" className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-white/90 text-ink"><X className="size-5" /></button>
      </div>
    </div>
  )
}

/* ================= Fayl tanlash (har doim sahifada) ================= */

export function useDocUpload(p, addDoc, onToast) {
  const ref = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const onChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError('')
    try {
      await addDoc(p, file)
      onToast?.('Fayl yuklandi')
    } catch (err) {
      setError(err.message || 'Faylni yuklab bo‘lmadi')
    } finally {
      setBusy(false)
    }
  }
  const input = <input ref={ref} type="file" accept="image/*,application/pdf,.pdf" className="hidden" onChange={onChange} data-testid="doc-input" />
  return { input, pick: () => ref.current?.click(), busy, error, setError }
}

/* ================= Tibbiy ================= */

const splitList = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean)

export function medicalForm(p) {
  const flags = p.anamnez || {}
  const labels = anamnezLabels(flags)
  return {
    allergy: (p.allergy || []).join(', '),
    flags: Object.fromEntries(ANAMNEZ.map(([k]) => [k, Boolean(flags[k])])),
    diseases: (p.diseases || []).filter((d) => !labels.includes(d)).join(', '),
    meds: p.meds && p.meds !== 'Yo‘q' ? p.meds : '',
    habits: p.habits && p.habits !== 'Yo‘q' ? p.habits : '',
    note: p.note || '',
  }
}

export function saveMedical(p, f) {
  const anamnez = { ...(p.anamnez || {}), ...f.flags, other_meds: f.meds.trim() }
  const diseases = [...anamnezLabels(anamnez), ...splitList(f.diseases)]
  patchBemor(p.id, {
    allergy: splitList(f.allergy),
    diseases: [...new Set(diseases)],
    anamnez,
    meds: f.meds.trim() || 'Yo‘q',
    habits: f.habits.trim() || 'Yo‘q',
    note: f.note.trim(),
  })
}

export function MedicalFields({ f, setF, compact }) {
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const inp = compact ? 'h-11 w-full rounded-xl border border-line px-3 text-[14px] outline-none focus:border-sea' : field
  return (
    <div className="space-y-2.5" data-testid="medical-form">
      <L t="Allergiya (vergul bilan)"><input value={f.allergy} onChange={set('allergy')} placeholder="masalan, Penitsillin, Lidokain" className={inp} /></L>
      <div><span className="mb-1 block text-[12px] font-medium text-ink-2">Anamnez (xavfli holatlar)</span>
        <div className="grid gap-1 sm:grid-cols-2">
          {ANAMNEZ.map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 rounded-lg px-1 py-1 text-[12.5px] text-ink">
              <input type="checkbox" checked={f.flags[k]} onChange={(e) => setF((s) => ({ ...s, flags: { ...s.flags, [k]: e.target.checked } }))} className="size-4 accent-[#0b8a95]" /> {l}
            </label>
          ))}
        </div>
      </div>
      <L t="Boshqa kasalliklar (vergul bilan)"><input value={f.diseases} onChange={set('diseases')} placeholder="masalan, Astma" className={inp} /></L>
      <L t="Doimiy dori vositalari"><input value={f.meds} onChange={set('meds')} placeholder="Yo‘q" className={inp} /></L>
      <L t="Chekish / spirtli ichimlik"><input value={f.habits} onChange={set('habits')} placeholder="Yo‘q" className={inp} /></L>
      <L t="Anamnez izohi"><textarea value={f.note} onChange={set('note')} rows={3} className="w-full resize-none rounded-xl border border-line px-3 py-2 text-[13px] outline-none focus:border-sea" /></L>
    </div>
  )
}

export function MedicalView({ p }) {
  return (
    <dl className="space-y-2 text-[12.5px]">
      <div><dt className="text-[12px] text-muted">Allergiya</dt><dd className="mt-1 flex flex-wrap gap-1">{(p.allergy || []).map((a) => <span key={a} className="rounded-full bg-[#ffe6ea] px-2 py-0.5 text-[11px] text-[#d4524e]">{a}</span>)}{!p.allergy?.length && 'Yo‘q'}</dd></div>
      <div><dt className="text-[12px] text-muted">Kasalliklar / anamnez</dt><dd className="mt-1 flex flex-wrap gap-1">{(p.diseases || []).map((a) => <span key={a} className="rounded-full bg-[#fff3d6] px-2 py-0.5 text-[11px] text-[#b07d00]">{a}</span>)}{!p.diseases?.length && 'Yo‘q'}</dd></div>
      <div className="flex justify-between gap-3 border-t border-line/70 pt-2"><dt className="text-muted">Doimiy dori vositalari</dt><dd className="text-right font-medium text-ink">{p.meds || 'Yo‘q'}</dd></div>
      <div className="flex justify-between gap-3 border-t border-line/70 pt-2"><dt className="text-muted">Chekish / spirtli ichimlik</dt><dd className="text-right font-medium text-ink">{p.habits || 'Yo‘q'}</dd></div>
      {p.note && <div className="border-t border-line/70 pt-2"><dt className="text-muted">Anamnez izohi</dt><dd className="mt-1 leading-relaxed text-ink-2">{p.note}</dd></div>}
    </dl>
  )
}

export function MedicalCard({ p, onToast, title = 'Tibbiy ma’lumotlar' }) {
  const [f, setF] = useState(null)
  return (
    <section className="rounded-2xl bg-white p-4 shadow-card" data-testid="medical-card">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[14px] font-bold">{title}</h2>
        {f ? (
          <span className="flex gap-2">
            <button type="button" onClick={() => setF(null)} className="text-[12px] font-semibold text-muted">Bekor qilish</button>
            <button type="button" onClick={() => { saveMedical(p, f); setF(null); onToast?.('Tibbiy ma’lumot saqlandi') }} className="text-[12px] font-semibold text-sea">Saqlash</button>
          </span>
        ) : <button type="button" onClick={() => setF(medicalForm(p))} className="text-[12px] font-semibold text-sea">Tahrirlash</button>}
      </div>
      {f ? (
        <>
          <MedicalFields f={f} setF={setF} />
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setF(null)} className={`${btn} border border-line`}>Bekor qilish</button>
            <button type="button" onClick={() => { saveMedical(p, f); setF(null); onToast?.('Tibbiy ma’lumot saqlandi') }} className={`${btn} bg-sea text-white`}>Saqlash</button>
          </div>
        </>
      ) : <MedicalView p={p} />}
    </section>
  )
}

/* ================= Saqlash xatosi toasti ================= */

export function SaveErrorToast({ bottom = 24 }) {
  const err = useBlobSaveError()
  const [shown, setShown] = useState(0)
  const [since] = useState(() => Date.now())
  useEffect(() => {
    if (!err.msg || err.at < since) return undefined
    setShown(err.at)
    const t = window.setTimeout(() => setShown(0), 6000)
    return () => window.clearTimeout(t)
  }, [err.at, err.msg, since])
  if (!err.msg || shown !== err.at) return null
  return (
    <div role="alert" data-testid="save-error" className="fixed left-1/2 z-[70] flex w-[min(420px,calc(100%-24px))] -translate-x-1/2 items-start gap-2 rounded-xl bg-white px-3 py-2.5 text-[12.5px] shadow-[0_10px_30px_rgb(11_31_58/0.18)] ring-1 ring-[#f9d3d7]" style={{ bottom: `calc(${bottom}px + env(safe-area-inset-bottom))` }}>
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#fdecee] text-[#e5323d]"><AlertTriangle className="size-4" /></span>
      <span className="min-w-0 flex-1"><b className="block text-ink">O‘zgarish saqlanmadi</b><span className="text-muted">{friendlySupabaseError({ message: err.msg })}</span></span>
      <button type="button" onClick={() => setShown(0)} aria-label="Yopish" className="text-muted"><X className="size-4" /></button>
    </div>
  )
}

