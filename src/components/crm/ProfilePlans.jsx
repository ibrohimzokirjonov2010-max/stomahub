import { Link } from 'react-router-dom'
import { usePlans, plansForPatient, PLAN_STATUS, money, progressOf, debtOf, totalOf } from '../../rejaData'

export default function ProfilePlans({ patient, highlightId, visitId }) {
  const all = usePlans()
  const list = plansForPatient(all, patient).slice().sort((a, b) => {
    if (a.id === highlightId) return -1
    if (b.id === highlightId) return 1
    return 0
  })

  if (!list.length) {
    return <p className="mt-3 rounded-2xl bg-white p-4 text-[13px] text-muted shadow-card" data-testid="profile-plans">Bu bemorning davolash rejasi yo‘q.</p>
  }

  return (
    <div className="mt-3 space-y-3" data-testid="profile-plans">
      {list.map((p) => {
        const prog = progressOf(p)
        const on = p.id === highlightId || (visitId && (p.visitId === visitId || (p.stages || []).some((s) => s.visitId === visitId)))
        const st = PLAN_STATUS[p.status] || PLAN_STATUS.reja
        return (
          <Link
            key={p.id}
            to={`/davolash-rejalari/${p.id}`}
            className={`block rounded-2xl bg-white p-4 shadow-card ${on ? 'ring-2 ring-sea' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] text-muted">{p.code}</p>
                <h3 className="truncate text-[15px] font-bold text-ink">{p.title}</h3>
              </div>
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: st.bg, color: st.color }}>{st.label}</span>
            </div>
            <ul className="mt-2 space-y-1">
              {(p.stages || []).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 text-[12.5px]">
                  <span className="min-w-0 truncate">{s.title}{s.teeth?.length ? ` (${s.teeth.join(', ')})` : ''}</span>
                  <span className="shrink-0 text-muted">{s.status === 'bajarildi' ? 'Bajarildi' : money(s.price)} so‘m</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px]">
              <span className="text-muted">Jami {money(totalOf(p))} so‘m · Qarz {money(debtOf(p))} so‘m</span>
              <span className="font-semibold text-sea">{prog.n}/{prog.of} bosqich</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
