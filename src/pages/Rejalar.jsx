import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Activity, UserRound, Calendar, Search, Plus, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Pencil, Trash2, X, Check,
} from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import EmptyCatalog from '../components/EmptyCatalog'
import PersonAvatar from '../components/PersonAvatar'
import RejaDialog from '../components/RejaDialog'
import { shiftIso } from '../klinikaData'
import {
  DOCTORS, PLAN_STATUS, TODAY, usePlans, savePlan, removePlan, saveTemplate, doctorOf, money, dmy, totalOf, debtOf, progressOf,
} from '../rejaData'

const PER = 8
const DATES = [
  ['all', 'Barchasi'],
  ['today', 'Bugun'],
  ['week', 'Oxirgi 7 kun'],
  ['month', 'Shu oy'],
  ['prev', 'O‘tgan oy'],
]

function inRange(iso, key) {
  if (key === 'all') return true
  if (key === 'today') return iso === TODAY
  if (key === 'week') return iso > shiftIso(TODAY, -7) && iso <= TODAY
  const month = TODAY.slice(0, 7)
  if (key === 'month') return iso.startsWith(month)
  const d = new Date(`${month}-01T00:00:00`)
  d.setMonth(d.getMonth() - 1)
  return iso.startsWith(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
}

export default function Rejalar() {
  const plans = usePlans()
  const navigate = useNavigate()
  const [status, setStatus] = useState('all')
  const [doctor, setDoctor] = useState('all')
  const [date, setDate] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [menu, setMenu] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [focusId, setFocusId] = useState('')
  const [toast, setToast] = useState('')
  const timer = useRef(0)

  const flash = (text) => {
    setToast(text)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(''), 2600)
  }

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return plans.filter((p) => (status === 'all' || p.status === status)
      && (doctor === 'all' || p.doctor === doctor)
      && inRange(p.start, date)
      && (!s || `${p.patient.name} ${p.patient.phone} ${p.patient.code} ${p.code} ${p.title} ${p.stages.map((x) => x.title).join(' ')}`.toLowerCase().includes(s)))
  }, [plans, status, doctor, date, q])

  const pages = Math.max(1, Math.ceil(list.length / PER))
  const current = Math.min(page, pages)
  const slice = list.slice((current - 1) * PER, current * PER)
  const reset = (fn) => (v) => { fn(v); setPage(1) }

  useEffect(() => {
    if (!focusId) return
    const i = list.findIndex((p) => p.id === focusId)
    if (i >= 0) setPage(Math.floor(i / PER) + 1)
    const t = window.setTimeout(() => setFocusId(''), 2400)
    return () => window.clearTimeout(t)
  }, [focusId, list])

  const save = (plan, asTemplate) => {
    const isNew = !plans.some((p) => p.id === plan.id)
    savePlan(plan)
    if (asTemplate) saveTemplate({ name: plan.title, title: plan.title, items: plan.items, groups: plan.groups, discount: plan.discount, payMode: plan.payMode })
    setDialog(null)
    if (isNew) { setStatus('all'); setDoctor('all'); setDate('all'); setQ('') }
    setFocusId(plan.id)
    flash(isNew ? `${plan.patient.name} uchun reja yaratildi${asTemplate ? ' (shablon saqlandi)' : ''}` : 'O‘zgarishlar saqlandi')
  }

  return (
    <ShopLayout active="rejalar" search="plain" placeholder="Bemor, telefon, ID yoki xizmat nomi bo‘yicha qidiring..." onQuery={reset(setQ)}>
      <div className="space-y-3 pb-8 pt-3" onClick={() => setMenu(null)}>
        <div className="flex items-start gap-3">
          <button type="button" aria-label="Orqaga" onClick={() => navigate(-1)} className="mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-ink hover:bg-white"><ArrowLeft className="size-5" /></button>
          <div>
            <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink">Davolash rejalari — bemorlar ro‘yxati</h1>
            <p className="text-[12.5px] text-muted">Bemorlarning davolash rejalari va bajarilish holati</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <IconSelect icon={Activity} prefix="Holat" value={status} onChange={reset(setStatus)} options={[['all', 'Barchasi'], ...Object.entries(PLAN_STATUS).map(([k, s]) => [k, s.label])]} />
          <IconSelect icon={UserRound} prefix="Shifokor" value={doctor} onChange={reset(setDoctor)} options={[['all', 'Barchasi'], ...DOCTORS.map((d) => [d.id, d.name])]} />
          <IconSelect icon={Calendar} prefix="Sana" value={date} onChange={reset(setDate)} options={DATES} />
          <label className="flex h-10 min-w-[220px] flex-[1.4] items-center gap-2 rounded-xl border border-line bg-white px-3">
            <Search className="size-4 text-muted" />
            <input value={q} onChange={(e) => reset(setQ)(e.target.value)} placeholder="Bemorni qidirish..." className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none" />
            {q && <button type="button" aria-label="Tozalash" onClick={() => setQ('')} className="text-muted"><X className="size-4" /></button>}
          </label>
          <button type="button" onClick={() => setDialog({})} className="inline-flex h-10 items-center gap-2 rounded-xl bg-sea px-5 text-[12.5px] font-semibold text-white hover:bg-sea-600"><Plus className="size-4" /> Yangi reja</button>
        </div>

        <section className="overflow-hidden rounded-2xl bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="rj-table w-full text-left text-[11.5px]">
              <thead className="text-[11px] text-ink-2">
                <tr className="border-b border-line">
                  <th className="py-3 pl-4 font-semibold">Bemor</th>
                  <th className="font-semibold">Telefon</th>
                  <th className="font-semibold">Reja nomi</th>
                  <th className="font-semibold">Shifokor</th>
                  <th className="font-semibold leading-tight">Boshlanish<br />sanasi</th>
                  <th className="font-semibold">Progress</th>
                  <th className="font-semibold">Holat</th>
                  <th className="text-right font-semibold">Umumiy narx</th>
                  <th className="text-right font-semibold">To‘langan</th>
                  <th className="text-right font-semibold">Qolgan</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {!plans.length ? <EmptyCatalog title="Davolash rejalari bo‘sh" text="Hali reja yo‘q. Yangi reja qo‘shing." /> : null}
      {slice.map((p) => {
                  const pr = progressOf(p)
                  const st = PLAN_STATUS[p.status]
                  const open = () => navigate(`/davolash-rejalari/${p.id}`)
                  return (
                    <tr key={p.id} onClick={open} className={`cursor-pointer border-b border-line/70 transition-colors last:border-0 ${focusId === p.id ? 'bg-[#e9f8f6]' : 'hover:bg-[#f7fbfc]'}`}>
                      <td className="py-2.5 pl-4">
                        <span className="flex items-center gap-2.5">
                          <PersonAvatar src={p.patient.photo} name={p.patient.name} size={30} />
                          <b className="font-semibold text-ink">{p.patient.name}</b>
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-ink-2">{p.patient.phone}</td>
                      <td className="max-w-[120px] font-medium leading-snug text-ink">{p.title}</td>
                      <td className="whitespace-nowrap text-ink-2">{doctorOf(p.doctor).name}</td>
                      <td className="whitespace-nowrap font-medium text-ink">{dmy(p.start)}</td>
                      <td>
                        <span className="block text-[11px] font-semibold text-ink">{pr.n} / {pr.of}</span>
                        <span className="mt-1 block h-1.5 w-[72px] overflow-hidden rounded-full bg-[#e3eef0]"><span className="block h-full rounded-full bg-sea" style={{ width: `${pr.pct}%` }} /></span>
                      </td>
                      <td><span className="inline-block whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                      <td className="whitespace-nowrap text-right font-medium text-ink">{money(totalOf(p))}</td>
                      <td className="whitespace-nowrap text-right font-medium text-ink">{money(p.paid)}</td>
                      <td className="whitespace-nowrap text-right font-medium text-ink">{money(debtOf(p))}</td>
                      <td className="pr-3">
                        <div className="relative flex justify-end" onClick={(e) => e.stopPropagation()}>
                          <button type="button" aria-label="Amallar" onClick={() => setMenu(menu === p.id ? null : p.id)} className="grid size-7 place-items-center rounded-lg text-ink-2 hover:bg-[#eef4f7]"><MoreHorizontal className="size-4" /></button>
                          {menu === p.id && (
                            <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-line bg-white p-1 shadow-lg">
                              <MenuBtn onClick={open}><Eye className="size-3.5" /> Ko‘rish</MenuBtn>
                              <MenuBtn onClick={() => { setDialog(p); setMenu(null) }}><Pencil className="size-3.5" /> Tahrirlash</MenuBtn>
                              <MenuBtn danger onClick={() => { if (window.confirm(`${p.patient.name} rejasi o‘chirilsinmi?`)) { removePlan(p.id); flash('Reja o‘chirildi') } setMenu(null) }}><Trash2 className="size-3.5" /> O‘chirish</MenuBtn>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!slice.length && <tr><td colSpan={11} className="py-12 text-center text-[13px] text-muted">Reja topilmadi. Filtrlarni o‘zgartirib ko‘ring.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-line px-4 py-3">
            <p className="text-[12px] font-medium text-ink">Jami: {list.length} ta bemor</p>
            <div className="flex items-center gap-1.5">
              <PageBtn label="Oldingi sahifa" disabled={current === 1} onClick={() => setPage(current - 1)}><ChevronLeft className="size-4" /></PageBtn>
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => <PageBtn key={n} active={n === current} onClick={() => setPage(n)}>{n}</PageBtn>)}
              <PageBtn label="Keyingi sahifa" disabled={current === pages} onClick={() => setPage(current + 1)}><ChevronRight className="size-4" /></PageBtn>
            </div>
          </div>
        </section>
      </div>

      {dialog && <RejaDialog initial={dialog.id ? dialog : null} onClose={() => setDialog(null)} onSave={save} />}
      {toast && <div className="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-xl bg-ink px-4 py-2.5 text-[12.5px] font-medium text-white shadow-lg"><Check className="mr-1.5 inline size-4" />{toast}</div>}
    </ShopLayout>
  )
}

function IconSelect({ icon: Icon, prefix, value, onChange, options }) {
  return (
    <label className="relative flex h-10 min-w-[150px] flex-1 items-center rounded-xl border border-line bg-white pl-3">
      <Icon className="size-4 shrink-0 text-ink-2" />
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-full w-full appearance-none bg-transparent pl-2 pr-8 text-[12.5px] outline-none">
        {options.map(([k, t]) => <option key={k} value={k}>{`${prefix}: ${t}`}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 size-4 text-muted" />
    </label>
  )
}

function MenuBtn({ danger, onClick, children }) {
  return <button type="button" onClick={onClick} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] ${danger ? 'text-[#dc2626] hover:bg-[#fdf0f0]' : 'hover:bg-[#f4f8fb]'}`}>{children}</button>
}

function PageBtn({ active, disabled, onClick, label, children }) {
  return <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className={`grid size-8 place-items-center rounded-lg border text-[12.5px] font-medium transition disabled:opacity-40 ${active ? 'border-sea bg-sea text-white' : 'border-line bg-white text-ink-2 hover:border-sea'}`}>{children}</button>
}
