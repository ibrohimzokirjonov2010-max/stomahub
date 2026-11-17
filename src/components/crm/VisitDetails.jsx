import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus, Wallet, X } from 'lucide-react'
import VisitCompleteDialog from './VisitCompleteDialog'
import { usePlans, planForVisit } from '../../rejaData'
import PersonAvatar from '../PersonAvatar'
import { clockRange, longDate, setVisits, tones } from '../../uchrashuvData'
import { normStatus } from '../../visitStatus'
import { useBemorlar } from '../../bemorData'
import { tashkentToday } from '../../tashkentDate'
import { useMobile } from '../../useMobile'

export const STATUS_ACTIONS = [
  { id: 'keldi', label: 'Keldi', cls: 'bg-[#e7f8ee] text-[#15803d] ring-[#3dbe74]' },
  { id: 'kelmadi', label: 'Kelmadi', cls: 'bg-[#ffecee] text-[#b91c1c] ring-[#ef6b7b]' },
  { id: 'qabulda', label: 'Qabulda', cls: 'bg-[#e3f4f5] text-[#0b6d73] ring-[#0b8a95]' },
]

export function patientOfVisit(visit, patients) {
  if (!visit) return null
  return (visit.patientId && patients.find((p) => p.id === visit.patientId))
    || patients.find((p) => p.name === visit.name)
    || { id: visit.patientId || '', name: visit.name, photo: visit.photo, phone: visit.phone }
}

function nextBookableDate() {
  const today = tashkentToday()
  const clock = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())
  const [h, m] = clock.split(':').map(Number)
  if (h * 60 + (m || 0) >= 18 * 60) {
    const [y, mo, d] = today.split('-').map(Number)
    const dt = new Date(y, mo - 1, d + 1)
    const pad = (n) => String(n).padStart(2, '0')
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
  }
  return today
}

/**
 * Yangi qabul qoralamasi:
 *  - reschedule (Kelmadi → boshqa kun): shu qabulning bajarilmagan reja bosqichlari ko‘chadi;
 *  - keyingi uchrashuv: rejaning qolgan (bajarilmagan) bosqichlari taklif qilinadi.
 * Bosqichlar stageId bilan o‘tadi — visitPlanSync yangi bosqich yaratmaydi, o‘sha bosqichni yangi qabulga bog‘laydi.
 */
export function bookDraftFromVisit(visit, patient, { reschedule = false, plan = null } = {}) {
  const open = (s) => s.status !== 'bajarildi' && s.status !== 'bekor'
  const stages = (plan?.stages || []).filter((s) => open(s) && (reschedule ? s.visitId === visit.id : true))
  const fromStages = stages.map((s) => ({ id: `stage-${s.id}`, stageId: s.id, name: s.title, price: Number(s.price) || 0, tooth: (s.teeth || []).join(', ') }))
  const fromVisit = Array.isArray(visit.services) && visit.services.length
    ? visit.services
    : visit.service ? [{ id: visit.serviceId || '', name: visit.service, price: visit.price }] : []
  const services = fromStages.length ? fromStages : reschedule ? fromVisit : []
  const left = plan && !reschedule && !fromStages.length ? 'Rejadagi barcha bosqichlar bajarilgan — nazorat qabuli.' : ''
  return {
    date: nextBookableDate(),
    start: '',
    patient,
    lockPatient: true,
    services,
    tooth: fromStages.length ? '' : visit.tooth || '',
    dur: reschedule ? visit.dur : undefined,
    room: visit.room,
    note: reschedule ? [visit.note, 'Kelmagan qabuldan ko‘chirildi'].filter(Boolean).join(' · ') : left,
    rescheduledFrom: reschedule ? visit.id : undefined,
  }
}

function setStatus(id, status) {
  setVisits((list) => list.map((v) => (v.id === id ? { ...v, status } : v)))
}

function popoverStyle(anchor) {
  if (!anchor?.getBoundingClientRect) return { top: '12vh', left: '50%', transform: 'translateX(-50%)' }
  const r = anchor.getBoundingClientRect()
  const z = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--z')) || 1
  const width = 340
  const left = Math.min((window.innerWidth / z) - width - 12, Math.max(12, r.right / z + 8))
  let top = r.top / z
  if (top + 420 > window.innerHeight / z) top = Math.max(12, window.innerHeight / z - 430)
  return { top, left, width }
}

export default function VisitDetails({ visit, anchor, onClose, onPay, onBook }) {
  const mobile = useMobile()
  const navigate = useNavigate()
  const patients = useBemorlar()
  const patient = useMemo(() => patientOfVisit(visit, patients), [visit, patients])
  const [confirmMove, setConfirmMove] = useState(false)
  const [finish, setFinish] = useState(false)
  const plans = usePlans()

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (finish) setFinish(false)
      else if (confirmMove) setConfirmMove(false)
      else onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmMove, finish, onClose])

  if (!visit) return null
  const status = normStatus(visit.status)
  const tone = tones[status] || tones.tasdiq
  const plan = planForVisit(plans, visit, patient)

  const done = status === 'yakun'
  const inChair = status === 'qabulda'

  const choose = (id) => {
    if (id === 'tugatish') {
      setFinish(true)
      return
    }
    setStatus(visit.id, id)
    if (id === 'kelmadi') {
      setConfirmMove(true)
      return
    }
    if (id === 'qabulda') {
      const pid = patient?.id
      if (pid) {
        const q = new URLSearchParams({ tab: 'reja' })
        if (plan) q.set('plan', plan.id)
        q.set('visit', visit.id)
        navigate(`/bemorlar/${pid}?${q.toString()}`)
      } else onClose?.()
    }
  }

  const actions = STATUS_ACTIONS.map((s) => {
    if (s.id !== 'qabulda') return s
    if (inChair) return { id: 'tugatish', label: 'Tugatish', cls: 'bg-sea text-white ring-[#0b6d73]' }
    if (done) return { id: 'yakun', label: 'Yakunlangan', cls: 'bg-[#f2f4f7] text-[#475569] ring-transparent' }
    return s
  })

  const body = (
    <>
      <div className="flex items-start gap-3">
        <PersonAvatar src={patient?.photo || visit.photo} name={visit.name} size={48} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[16px] font-bold text-ink">{visit.name}</h2>
          <p className="text-[12.5px] text-muted">{longDate(visit.date)} · {clockRange(visit.start, visit.dur)}</p>
          <p className="truncate text-[12.5px] text-ink-2">{visit.service}{visit.room ? ` · ${visit.room}` : ''}</p>
          <span className="mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: tone.bg, color: tone.text }}>{tone.label}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {actions.map((s) => {
          const on = status === s.id || (s.id === 'tugatish' && inChair)
          const locked = s.id === 'yakun' || (done && s.id !== 'tugatish')
          return (
            <button
              key={s.id}
              type="button"
              data-testid={`btn-${s.id}`}
              aria-pressed={on}
              disabled={locked}
              onClick={() => choose(s.id)}
              className={`flex min-h-12 items-center justify-center rounded-xl px-2 text-[13px] font-semibold ring-1 ring-inset ${s.cls} ${on ? 'ring-2' : 'ring-transparent'} disabled:cursor-default`}
            >
              {s.label}
            </button>
          )
        })}
      </div>

      {done && (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button type="button" data-testid="btn-tolov" onClick={() => onPay?.(visit, patient, plan)} className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-sea px-3 text-[13px] font-semibold text-white">
            <Wallet className="size-4" /> To‘lov
          </button>
          <button type="button" data-testid="btn-keyingi" onClick={() => onBook?.(visit, patient, { reschedule: false, plan })} className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-sea px-3 text-[13px] font-semibold text-sea">
            <CalendarPlus className="size-4" /> Keyingi uchrashuvga yozish
          </button>
        </div>
      )}
    </>
  )

  const confirm = confirmMove && (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/50 p-3" onClick={() => setConfirmMove(false)} data-testid="kelmadi-confirm">
      <div className="w-full max-w-[420px] rounded-2xl bg-white p-5 shadow-[0_16px_40px_rgb(11_31_58/0.2)]" role="dialog" aria-labelledby="kelmadi-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="kelmadi-title" className="text-[16px] font-bold text-ink">Bu bemor qabulga kelmadi. Boshqa kunga yozilsinmi?</h2>
        <p className="mt-2 text-[13px] text-muted">{visit.name} · {visit.service}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" data-testid="btn-kelmadi-yoq" onClick={() => { setConfirmMove(false); onClose?.() }} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line px-4 text-[13.5px] font-semibold">Yo‘q</button>
          <button type="button" data-testid="btn-kelmadi-ha" onClick={() => onBook?.(visit, patient, { reschedule: true, plan })} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-sea px-4 text-[13.5px] font-semibold text-white">Ha, boshqa kunga yozish</button>
        </div>
      </div>
    </div>
  )

  if (confirmMove) return confirm
  if (finish) {
    return (
      <VisitCompleteDialog
        visit={visit}
        patient={patient}
        onClose={() => setFinish(false)}
        onDone={() => setFinish(false)}
      />
    )
  }

  if (mobile) {
    return (
      <>
        <div className="fixed inset-0 z-[70] flex flex-col justify-end bg-ink/45" onClick={onClose} data-testid="visit-details-shade">
          <div role="dialog" aria-modal="true" aria-label="Uchrashuv" data-testid="visit-details" onClick={(e) => e.stopPropagation()} className="relative flex max-h-[90dvh] flex-col rounded-t-3xl bg-white px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="mx-auto h-1 w-10 rounded-full bg-line" />
              <button type="button" onClick={onClose} aria-label="Yopish" className="absolute right-3 top-3 grid size-10 place-items-center rounded-full text-ink"><X className="size-4" /></button>
            </div>
            {body}
          </div>
        </div>
        {confirm}
      </>
    )
  }

  return (
    <>
      <div className="bemor-shade z-[70]" onClick={onClose} data-testid="visit-details-shade">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Uchrashuv"
          data-testid="visit-details"
          className="absolute rounded-2xl bg-white p-4 shadow-[0_16px_40px_rgb(11_31_58/0.18)]"
          style={popoverStyle(anchor)}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" onClick={onClose} aria-label="Yopish" className="absolute right-2 top-2 grid size-8 place-items-center rounded-lg text-muted hover:bg-[#f4f7fb]"><X className="size-4" /></button>
          {body}
        </div>
      </div>
      {confirm}
    </>
  )
}
