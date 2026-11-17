import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Activity, UserRound, Calendar, CalendarClock, CheckCircle2, ClipboardList, Search, Plus, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Pencil, Trash2, Wallet, X, Check,
} from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import PersonAvatar from '../components/PersonAvatar'
import RejaDialog from '../components/RejaDialog'
import { shiftIso } from '../klinikaData'
import {
  DOCTORS, PLAN_STATUS, STAGE_STATUS, TODAY, usePlans, savePlan, removePlan, saveTemplate, doctorOf, money, dmy, totalOf, debtOf,
} from '../rejaData'
import { clockRange, useVisits } from '../uchrashuvData'
import { isClosed } from '../visitStatus'
import { useMobile } from '../useMobile'

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
  const [hover, setHover] = useState(null)
  const [expanded, setExpanded] = useState('')
  const timer = useRef(0)
  const hoverTimer = useRef(0)
  const mobile = useMobile()
  const visits = useVisits()

  // Qatorga sichqoncha olib borilsa — to‘liq ma’lumot oynasi (kichik kechikish bilan, oyna ustida ham ochiq turadi)
  const hoverIn = (plan, el) => {
    window.clearTimeout(hoverTimer.current)
    hoverTimer.current = window.setTimeout(() => setHover({ plan, el }), 220)
  }
  const keepHover = () => window.clearTimeout(hoverTimer.current)
  const hoverOut = () => {
    window.clearTimeout(hoverTimer.current)
    hoverTimer.current = window.setTimeout(() => setHover(null), 160)
  }
  useEffect(() => () => window.clearTimeout(hoverTimer.current), [])

  const stats = useMemo(() => {
    const done = plans.filter((p) => p.status === 'yakunlangan').length
    const debts = plans.map(debtOf)
    return { total: plans.length, done, active: plans.length - done, debt: debts.reduce((a, b) => a + b, 0), debtors: new Set(plans.filter((p) => debtOf(p) > 0).map((p) => p.patient?.id)).size }
  }, [plans])

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

        <div className="rj-stats" data-testid="rj-stats">
          <StatCard icon={Activity} tone="#0b8a95" bg="#e3f4f5" label="Faol rejalar" value={stats.active} hint={`${stats.total} ta rejadan`} />
          <StatCard icon={CheckCircle2} tone="#15803d" bg="#e6f7ec" label="Yakunlangan rejalar" value={stats.done} hint={stats.total ? `${Math.round((stats.done / stats.total) * 100)}% bajarilgan` : 'Hali yo‘q'} />
          <StatCard icon={Wallet} tone="#e11d48" bg="#ffecee" label="Umumiy qarz" value={`${money(stats.debt)} so‘m`} hint={stats.debtors ? `${stats.debtors} ta bemorda qarz bor` : 'Qarz yo‘q'} />
        </div>

        {!plans.length ? (
          <section className="rounded-2xl bg-white shadow-card" data-testid="rj-empty">
            <div className="mx-auto flex max-w-[460px] flex-col items-center px-6 py-16 text-center">
              <span className="grid size-16 place-items-center rounded-2xl bg-sea-50 text-sea"><ClipboardList className="size-8" /></span>
              <h2 className="mt-4 text-[18px] font-bold text-ink">Davolash rejalari bo‘sh</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">Bemorga reja tuzing yoki Uchrashuvlarda qabulga xizmat tanlang — reja avtomatik shakllanadi.</p>
              <button type="button" onClick={() => setDialog({})} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-sea px-5 text-[13px] font-semibold text-white hover:bg-sea-600"><Plus className="size-4" /> Yangi reja</button>
            </div>
          </section>
        ) : mobile ? (
          <section className="space-y-2.5" data-testid="rj-cards">
            {slice.map((p) => <PlanCardMobile key={p.id} p={p} next={nextVisitOf(p, visits)} open={expanded === p.id} focus={focusId === p.id} onToggle={() => setExpanded(expanded === p.id ? '' : p.id)} onOpen={() => navigate(`/davolash-rejalari/${p.id}`)} />)}
            {!slice.length && <p className="rounded-2xl bg-white py-10 text-center text-[13px] text-muted shadow-card">Reja topilmadi. Filtrlarni o‘zgartirib ko‘ring.</p>}
            <Pager list={list} pages={pages} current={current} setPage={setPage} />
          </section>
        ) : (
          <section className="overflow-hidden rounded-2xl bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="rj-table w-full text-left" data-testid="rj-table">
                <thead>
                  <tr className="border-b border-line bg-[#f8fafc] text-[11.5px] uppercase tracking-wide text-muted">
                    <th className="py-3 pl-5 font-semibold">Bemor</th>
                    <th className="font-semibold">Reja / shifokor</th>
                    <th className="font-semibold">Boshlanish</th>
                    <th className="font-semibold">Bosqichlar</th>
                    <th className="font-semibold">Holat</th>
                    <th className="whitespace-nowrap text-right font-semibold">Jami, so‘m</th>
                    <th className="text-right font-semibold">To‘langan</th>
                    <th className="text-right font-semibold">Qarz</th>
                    <th className="w-12" />
                  </tr>
                </thead>
                <tbody>
                  {slice.map((p) => {
                    const pr = stagesDone(p)
                    const st = PLAN_STATUS[p.status] || PLAN_STATUS.reja
                    const open = () => navigate(`/davolash-rejalari/${p.id}`)
                    const debt = debtOf(p)
                    return (
                      <tr
                        key={p.id}
                        data-testid={`rj-row-${p.id}`}
                        onClick={open}
                        onMouseEnter={(e) => hoverIn(p, e.currentTarget)}
                        onMouseLeave={hoverOut}
                        className={`rj-row cursor-pointer border-b border-line/70 transition-colors last:border-0 ${focusId === p.id ? 'bg-[#e9f8f6]' : 'hover:bg-[#f4fafb]'}`}
                      >
                        <td className="py-3 pl-5">
                          <span className="flex items-center gap-3">
                            <PersonAvatar src={p.patient?.photo} name={p.patient?.name} size={36} />
                            <span className="rj-patient min-w-0">
                              <b className="block text-[13.5px] font-semibold leading-snug text-ink">{p.patient?.name}</b>
                              <span className="block text-[11.5px] leading-snug text-muted">{p.patient?.phone || '—'}{p.patient?.code ? ` · #${p.patient.code}` : ''}</span>
                            </span>
                          </span>
                        </td>
                        <td className="rj-title text-[13px] font-medium leading-snug text-ink"><span className="block">{p.title}</span><span className="block text-[11.5px] font-normal text-muted">{p.code} · {doctorName(p.doctor)}</span></td>
                        <td className="whitespace-nowrap text-[13px] font-medium text-ink">{dmy(p.start)}</td>
                        <td>
                          <span className="block text-[12px] font-semibold text-ink">{pr.n} / {pr.of} <span className="font-normal text-muted">bosqich</span></span>
                          <span className="mt-1.5 block h-1.5 w-[84px] overflow-hidden rounded-full bg-[#e3eef0]"><span className="block h-full rounded-full bg-sea" style={{ width: `${pr.pct}%` }} /></span>
                        </td>
                        <td><span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold" style={{ background: st.bg, color: st.color }}><i className="size-1.5 rounded-full" style={{ background: st.dot }} />{st.label}</span></td>
                        <td className="whitespace-nowrap text-right text-[13px] font-semibold text-ink">{money(totalOf(p))}</td>
                        <td className={`whitespace-nowrap text-right text-[13px] font-medium ${p.paid > 0 ? 'text-[#15803d]' : 'text-muted'}`}>{money(p.paid)}</td>
                        <td className={`whitespace-nowrap text-right text-[13px] font-bold ${debt > 0 ? 'text-[#e11d48]' : 'text-muted'}`}>{money(debt)}</td>
                        <td className="pr-3">
                          <div className="relative flex justify-end" onClick={(e) => e.stopPropagation()} onMouseEnter={hoverOut}>
                            <button type="button" aria-label="Amallar" onClick={() => setMenu(menu === p.id ? null : p.id)} className="grid size-8 place-items-center rounded-lg text-ink-2 hover:bg-[#eef4f7]"><MoreHorizontal className="size-4" /></button>
                            {menu === p.id && (
                              <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-line bg-white p-1 shadow-lg">
                                <MenuBtn onClick={open}><Eye className="size-3.5" /> Ko‘rish</MenuBtn>
                                <MenuBtn onClick={() => { setDialog(p); setMenu(null) }}><Pencil className="size-3.5" /> Tahrirlash</MenuBtn>
                                <MenuBtn danger onClick={() => { if (window.confirm(`${p.patient?.name} rejasi o‘chirilsinmi?`)) { removePlan(p.id); flash('Reja o‘chirildi') } setMenu(null) }}><Trash2 className="size-3.5" /> O‘chirish</MenuBtn>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {!slice.length && <tr><td colSpan={9} className="py-12 text-center text-[13px] text-muted">Reja topilmadi. Filtrlarni o‘zgartirib ko‘ring.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line px-5 py-3"><Pager list={list} pages={pages} current={current} setPage={setPage} /></div>
          </section>
        )}
      </div>

      {hover && !mobile && <PlanPopover p={hover.plan} next={nextVisitOf(hover.plan, visits)} anchor={hover.el} onEnter={keepHover} onLeave={hoverOut} />}
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

const doctorName = (id) => {
  const d = doctorOf(id)
  if (d.name !== 'Shifokor' || !id || id === 'me') return d.name
  return id
}

/** Bajarilgan bosqichlar (bekor qilinganlar hisobga olinmaydi). */
function stagesDone(p) {
  const live = (p.stages || []).filter((s) => s.status !== 'bekor')
  const n = live.filter((s) => s.status === 'bajarildi').length
  return { n, of: live.length, pct: live.length ? Math.round((n / live.length) * 100) : 0 }
}

/** Bemorning eng yaqin (bugundan keyingi, yopilmagan) qabuli. */
function nextVisitOf(p, visits) {
  const pid = p.patient?.id
  return visits
    .filter((v) => (pid ? v.patientId === pid : v.name === p.patient?.name) && v.date >= TODAY && !isClosed(v.status))
    .sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`))[0] || null
}

function StatCard({ icon: Icon, tone, bg, label, value, hint }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-card">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: bg, color: tone }}><Icon className="size-5" /></span>
      <span className="min-w-0">
        <span className="block text-[12px] font-medium text-muted">{label}</span>
        <b className="block truncate text-[20px] leading-tight text-ink" style={label === 'Umumiy qarz' ? { color: tone } : undefined}>{value}</b>
        <span className="block truncate text-[11.5px] text-muted">{hint}</span>
      </span>
    </div>
  )
}

function Pager({ list, pages, current, setPage }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-[12.5px] font-medium text-ink">Jami: {list.length} ta reja</p>
      {pages > 1 && (
        <div className="flex items-center gap-1.5">
          <PageBtn label="Oldingi sahifa" disabled={current === 1} onClick={() => setPage(current - 1)}><ChevronLeft className="size-4" /></PageBtn>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => <PageBtn key={n} active={n === current} onClick={() => setPage(n)}>{n}</PageBtn>)}
          <PageBtn label="Keyingi sahifa" disabled={current === pages} onClick={() => setPage(current + 1)}><ChevronRight className="size-4" /></PageBtn>
        </div>
      )}
    </div>
  )
}

/** Reja to‘liq ma’lumoti: bemor, shifokor, sanalar, bosqichlar, summalar, keyingi qabul. */
function PlanDetails({ p, next }) {
  const st = PLAN_STATUS[p.status] || PLAN_STATUS.reja
  const pr = stagesDone(p)
  const debt = debtOf(p)
  const last = (p.stages || []).map((s) => s.date).filter(Boolean).sort().pop()
  return (
    <>
      <div className="flex items-start gap-3">
        <PersonAvatar src={p.patient?.photo} name={p.patient?.name} size={42} />
        <div className="min-w-0 flex-1">
          <b className="block text-[14.5px] text-ink">{p.patient?.name}</b>
          <span className="block text-[12px] text-muted">{[p.patient?.phone, p.patient?.code && `#${p.patient.code}`].filter(Boolean).join(' · ')}</span>
        </div>
        <span className="shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold" style={{ background: st.bg, color: st.color }}>{st.label}</span>
      </div>
      <div className="mt-3 rounded-xl bg-[#f6f9fb] px-3 py-2.5">
        <b className="block text-[13.5px] text-ink">{p.title}</b>
        <span className="mt-0.5 block text-[12px] text-ink-2">{p.code} · {doctorName(p.doctor)}</span>
        <span className="mt-0.5 block text-[12px] text-muted">Boshlangan: {dmy(p.start)}{last && last !== p.start ? ` · oxirgi bosqich: ${dmy(last)}` : ''}</span>
      </div>
      <p className="mt-3 flex items-center justify-between text-[12px] font-semibold text-ink-2"><span>Bosqichlar</span><span>{pr.n} / {pr.of} bajarildi</span></p>
      <ol className="mt-1.5 max-h-[220px] space-y-1 overflow-y-auto pr-1">
        {(p.stages || []).map((s, i) => {
          const ss = STAGE_STATUS[s.status] || STAGE_STATUS.rejada
          return (
            <li key={s.id || i} className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-[12.5px] ${s.status === 'bekor' ? 'opacity-55' : ''}`}>
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10.5px] font-bold text-white" style={{ background: ss.tint }}>{i + 1}</span>
              <span className="min-w-0 flex-1">
                <b className={`block font-semibold text-ink ${s.status === 'bekor' ? 'line-through' : ''}`}>{s.title}</b>
                <span className="text-[11.5px] text-muted">{s.teeth?.length ? `Tish: ${s.teeth.join(', ')}` : 'Tish ko‘rsatilmagan'}{s.date ? ` · ${dmy(s.date)}` : ''}</span>
              </span>
              <span className="shrink-0 text-right">
                <b className="block whitespace-nowrap text-[12.5px] text-ink">{money(s.price)} so‘m</b>
                <span className="rounded px-1.5 text-[10.5px] font-semibold" style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
              </span>
            </li>
          )
        })}
        {!(p.stages || []).length && <li className="px-2 py-1.5 text-[12px] text-muted">Bosqichlar yo‘q</li>}
      </ol>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-[12px]">
        <p><span className="block text-muted">Jami</span><b className="text-ink">{money(totalOf(p))} so‘m</b></p>
        <p><span className="block text-muted">To‘langan</span><b className="text-[#15803d]">{money(p.paid)} so‘m</b></p>
        <p><span className="block text-muted">Qarz</span><b className={debt > 0 ? 'text-[#e11d48]' : 'text-muted'}>{money(debt)} so‘m</b></p>
      </div>
      <p className="mt-3 flex items-center gap-2 rounded-xl bg-sea-50 px-3 py-2 text-[12.5px] text-[#0b6d73]">
        <CalendarClock className="size-4 shrink-0" />
        {next ? <span>Keyingi qabul: <b>{dmy(next.date)}, {clockRange(next.start, next.dur)}</b>{next.service ? ` · ${next.service}` : ''}</span> : <span>Keyingi qabul belgilanmagan</span>}
      </p>
    </>
  )
}

function PlanPopover({ p, next, anchor, onEnter, onLeave }) {
  const box = useRef(null)
  const [pos, setPos] = useState(null)
  // Oyna qatorni hech qachon yopmaydi: pastda joy bo‘lsa pastda, bo‘lmasa tepada, sig‘masa — ichida aylantiriladi.
  useLayoutEffect(() => {
    if (!anchor?.getBoundingClientRect) return
    const r = anchor.getBoundingClientRect()
    const z = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--z')) || 1
    const vw = window.innerWidth / z
    const vh = window.innerHeight / z
    const width = 400
    const left = Math.max(12, Math.min(vw - width - 16, r.left / z + 220))
    const h = box.current ? box.current.scrollHeight : 460
    const below = vh - r.bottom / z - 18
    const above = r.top / z - 18
    if (h <= below || below >= above) setPos({ left, width, top: r.bottom / z + 6, maxHeight: Math.max(160, below) })
    else setPos({ left, width, top: Math.max(12, r.top / z - 6 - Math.min(h, above)), maxHeight: above })
  }, [anchor, p])
  return (
    <div ref={box} role="tooltip" data-testid="rj-popover" onMouseEnter={onEnter} onMouseLeave={onLeave} className="fixed z-[60] overflow-y-auto rounded-2xl border border-line bg-white p-4 shadow-[0_18px_44px_rgb(11_31_58/0.2)]" style={pos || { left: -9999, top: 0, width: 400, visibility: 'hidden' }}>
      <PlanDetails p={p} next={next} />
    </div>
  )
}

function PlanCardMobile({ p, next, open, focus, onToggle, onOpen }) {
  const st = PLAN_STATUS[p.status] || PLAN_STATUS.reja
  const pr = stagesDone(p)
  const debt = debtOf(p)
  return (
    <article data-testid={`rj-card-${p.id}`} className={`rounded-2xl bg-white p-3.5 shadow-card ${focus ? 'ring-2 ring-sea' : ''}`}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="block w-full text-left">
        <span className="flex items-start gap-3">
          <PersonAvatar src={p.patient?.photo} name={p.patient?.name} size={40} />
          <span className="min-w-0 flex-1">
            <b className="block text-[14px] text-ink">{p.patient?.name}</b>
            <span className="block text-[12.5px] text-ink-2">{p.title}</span>
            <span className="block text-[11.5px] text-muted">{p.code} · {dmy(p.start)}</span>
          </span>
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: st.bg, color: st.color }}>{st.label}</span>
        </span>
        <span className="mt-3 flex items-center gap-2">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e3eef0]"><span className="block h-full rounded-full bg-sea" style={{ width: `${pr.pct}%` }} /></span>
          <span className="shrink-0 text-[12px] font-semibold text-ink">{pr.n}/{pr.of} bosqich</span>
        </span>
        <span className="mt-2.5 grid grid-cols-3 gap-2 text-[12px]">
          <span><span className="block text-muted">Jami</span><b className="text-ink">{money(totalOf(p))}</b></span>
          <span><span className="block text-muted">To‘langan</span><b className="text-[#15803d]">{money(p.paid)}</b></span>
          <span><span className="block text-muted">Qarz</span><b className={debt > 0 ? 'text-[#e11d48]' : 'text-muted'}>{money(debt)}</b></span>
        </span>
        <span className="mt-2 flex items-center justify-center gap-1 text-[12px] font-semibold text-sea">{open ? 'Yig‘ish' : 'Batafsil ma’lumot'} <ChevronDown className={`size-4 transition ${open ? 'rotate-180' : ''}`} /></span>
      </button>
      {open && (
        <div className="mt-2 border-t border-line pt-3" data-testid="rj-card-details">
          <PlanDetails p={p} next={next} />
          <button type="button" onClick={onOpen} className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl bg-sea text-[13px] font-semibold text-white">Rejani ochish</button>
        </div>
      )}
    </article>
  )
}
