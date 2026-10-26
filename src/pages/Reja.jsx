import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronRight, Download, CalendarPlus, Plus, MoreVertical, Phone, MapPin, ArrowRight, ClipboardList, Armchair, Check, CalendarDays,
  Wallet, Pencil, Trash2, X, StickyNote, ChevronDown, Activity, CircleDot,
} from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import PersonAvatar from '../components/PersonAvatar'
import RejaDialog from '../components/RejaDialog'
import ToothChart from '../components/ToothChart'
import { getBemor } from '../bemorData'
import {
  PLAN_STATUS, STAGE_STATUS, TIMES, PAY_METHODS, TODAY, usePlans, getPlan, patchPlan, savePlan, removePlan, addPayment, saveTemplate,
  doctorOf, money, dmy, totalOf, debtOf, progressOf,
} from '../rejaData'

const ART_RANK = ['implant', 'missing', 'post', 'endo', 'crown', 'filling']
const LEGEND = [
  ['Reja tishlari', '#0b8a95'],
  ['Bajarilgan', STAGE_STATUS.bajarildi.tint],
  ['Jarayonda', STAGE_STATUS.jarayonda.tint],
  ['Rejalashtirilgan', STAGE_STATUS.rejada.tint],
  ['Boshqa tishlar', '#d5dce5'],
]

export default function Reja() {
  const { id } = useParams()
  const navigate = useNavigate()
  usePlans()
  const plan = getPlan(id)
  const [menu, setMenu] = useState('')
  const [tooth, setTooth] = useState(null)
  const [dialog, setDialog] = useState('')
  const [editNote, setEditNote] = useState(false)
  const [note, setNote] = useState('')
  const [history, setHistory] = useState(false)
  const [toast, setToast] = useState('')
  const timer = useRef(0)

  useEffect(() => { setNote(plan?.note || '') }, [plan?.note])

  if (!plan) {
    return (
      <ShopLayout active="rejalar" search="plain" placeholder="Bemor, telefon, ID yoki xizmat nomi bo‘yicha qidiring...">
        <div className="pt-10 text-center">
          <p className="text-[14px] text-muted">Davolash rejasi topilmadi.</p>
          <Link to="/davolash-rejalari" className="mt-3 inline-flex h-9 items-center rounded-lg bg-sea px-4 text-[12.5px] font-semibold text-white">Rejalar ro‘yxatiga qaytish</Link>
        </div>
      </ShopLayout>
    )
  }

  const flash = (text) => {
    setToast(text)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(''), 2600)
  }

  const doc = doctorOf(plan.doctor)
  const pr = progressOf(plan)
  const total = totalOf(plan)
  const debt = debtOf(plan)
  const st = PLAN_STATUS[plan.status]
  const hasProfile = plan.patient.id && getBemor(plan.patient.id)

  const stagesOf = (n) => plan.stages.filter((s) => s.teeth.includes(n))
  const planTeeth = new Set(plan.stages.flatMap((s) => s.teeth))
  const tintOf = (n) => {
    const list = stagesOf(n)
    if (!list.length) return undefined
    if (list.some((s) => s.status === 'jarayonda')) return STAGE_STATUS.jarayonda.tint
    if (list.some((s) => s.status === 'rejada')) return STAGE_STATUS.rejada.tint
    return STAGE_STATUS.bajarildi.tint
  }
  const artOfTooth = (n) => {
    const arts = stagesOf(n).map((s) => s.art).filter(Boolean)
    return ART_RANK.find((a) => arts.includes(a))
  }

  const setStage = (sid, status) => {
    patchPlan(plan.id, (p) => ({
      stages: p.stages.map((s) => (s.id === sid ? { ...s, status, date: s.date || (status !== 'rejada' ? TODAY : '') } : s)),
    }))
    setMenu('')
    flash(`Bosqich: ${STAGE_STATUS[status].label}`)
  }

  const setVisit = (vid, status) => {
    patchPlan(plan.id, (p) => ({ visits: p.visits.map((v) => (v.id === vid ? { ...v, status } : v)) }))
    setMenu('')
  }

  const exportPdf = () => {
    const rows = plan.stages.map((s, i) => `<tr><td>${i + 1}</td><td><b>${s.title}</b><br><small>${s.desc}</small></td><td>${s.teeth.join(', ') || '—'}</td><td>${dmy(s.date)}</td><td style="text-align:right">${money(s.price)} so‘m</td><td>${STAGE_STATUS[s.status].label}</td></tr>`).join('')
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${plan.code} — ${plan.patient.name}</title><style>
      body{font-family:Inter,Arial,sans-serif;color:#0b1f3a;padding:28px;font-size:12px}h1{font-size:20px;margin:0}p{margin:2px 0;color:#475569}
      table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border-bottom:1px solid #e2e8f0;padding:8px 6px;text-align:left;vertical-align:top}
      th{background:#f1f5f9;font-size:11px}.sum{margin-top:16px;width:280px;margin-left:auto}.sum div{display:flex;justify-content:space-between;padding:4px 0}
      .brand{color:#0b8a95;font-weight:800;font-size:16px;margin-bottom:14px}</style></head><body>
      <div class="brand">StomaHub</div><h1>Davolash rejasi: ${plan.title}</h1><p>${plan.subtitle || ''}</p>
      <p>Bemor: <b>${plan.patient.name}</b> (${plan.patient.code}) · ${plan.patient.phone}</p>
      <p>Shifokor: <b>${doc.name}</b> · ${plan.chair} · Boshlanish: ${dmy(plan.start)} · Holat: ${st.label}</p>
      <table><thead><tr><th>#</th><th>Bosqich</th><th>Tish(lar)</th><th>Sana</th><th style="text-align:right">Narx</th><th>Holat</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="sum"><div><span>Umumiy narx</span><b>${money(total)} so‘m</b></div><div><span>To‘langan</span><b>${money(plan.paid)} so‘m</b></div><div><span>Qolgan qarz</span><b>${money(debt)} so‘m</b></div></div>
      ${plan.note ? `<p style="margin-top:16px"><b>Izoh:</b> ${plan.note}</p>` : ''}</body></html>`
    const frame = document.createElement('iframe')
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
    document.body.appendChild(frame)
    frame.contentDocument.open()
    frame.contentDocument.write(html)
    frame.contentDocument.close()
    window.setTimeout(() => {
      frame.contentWindow.focus()
      frame.contentWindow.print()
      window.setTimeout(() => frame.remove(), 1500)
    }, 200)
    flash('PDF tayyor — chop etish oynasida “PDF sifatida saqlash”ni tanlang')
  }

  return (
    <ShopLayout active="rejalar" search="plain" placeholder="Bemor, telefon, ID yoki xizmat nomi bo‘yicha qidiring...">
      <div className="space-y-3 pb-8 pt-3" onClick={() => setMenu('')}>
        <p className="flex items-center gap-1 text-[11.5px] text-muted">
          <Link to="/klinika" className="hover:text-sea">Klinika</Link>
          <ChevronRight className="size-3.5" />
          <Link to="/davolash-rejalari" className="hover:text-sea">Davolash rejalari</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-ink-2">Reja tafsiloti</span>
        </p>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-ink">Davolash rejasi tafsiloti</h1>
            <p className="text-[12.5px] text-muted">Bemorning davolash rejasi va bosqichlari</p>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <OutlineBtn onClick={exportPdf}><Download className="size-4" /> PDF yuklab olish</OutlineBtn>
            <OutlineBtn onClick={() => setDialog('visit')}><CalendarPlus className="size-4" /> Uchrashuv belgilash</OutlineBtn>
            <button type="button" onClick={() => setDialog('pay')} disabled={!debt} className="inline-flex h-10 items-center gap-2 rounded-xl bg-sea px-5 text-[12.5px] font-semibold text-white hover:bg-sea-600 disabled:opacity-50"><Plus className="size-4" /> To‘lov qo‘shish</button>
            <div className="relative">
              <button type="button" aria-label="Boshqa amallar" onClick={() => setMenu(menu === 'head' ? '' : 'head')} className="grid size-10 place-items-center rounded-xl border border-line bg-white text-ink-2 hover:border-sea"><MoreVertical className="size-4" /></button>
              {menu === 'head' && (
                <div className="absolute right-0 top-full z-30 mt-1 w-56 rounded-xl border border-line bg-white p-1 shadow-lg">
                  <MenuBtn onClick={() => { setDialog('edit'); setMenu('') }}><Pencil className="size-3.5" /> Rejani tahrirlash</MenuBtn>
                  <p className="px-2 pb-0.5 pt-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted">Holatni o‘zgartirish</p>
                  {Object.entries(PLAN_STATUS).map(([k, s]) => (
                    <MenuBtn key={k} onClick={() => { patchPlan(plan.id, { status: k }); setMenu(''); flash(`Holat: ${s.label}`) }}>
                      <span className="size-2 rounded-full" style={{ background: s.dot }} /> {s.label} {plan.status === k && <Check className="ml-auto size-3.5 text-sea" />}
                    </MenuBtn>
                  ))}
                  <div className="my-1 border-t border-line" />
                  <MenuBtn onClick={() => { saveTemplate({ name: plan.title, title: plan.title, items: plan.items || plan.stages.map((s) => ({ id: `row-${s.id}`, service: s.title, tooth: s.teeth.join(', '), qty: 1, price: s.price })), groups: plan.groups || [], discount: plan.discount || 0, payMode: plan.payMode }); setMenu(''); flash('Shablon sifatida saqlandi') }}><ClipboardList className="size-3.5" /> Shablon sifatida saqlash</MenuBtn>
                  <MenuBtn danger onClick={() => { if (window.confirm('Davolash rejasi o‘chirilsinmi?')) { removePlan(plan.id); navigate('/davolash-rejalari') } }}><Trash2 className="size-3.5" /> O‘chirish</MenuBtn>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rj-top">
          <section className="rj-info rounded-2xl bg-white p-4 shadow-card">
            <div className="flex min-w-0 gap-3">
              <PersonAvatar src={plan.patient.photo} name={plan.patient.name} size={64} />
              <div className="min-w-0">
                <h2 className="truncate text-[15px] font-bold text-ink">{plan.patient.name}</h2>
                <p className="text-[11.5px] text-muted">#{plan.patient.code}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-sea-50 px-2 py-0.5 text-[10.5px] font-semibold text-sea">{plan.patient.age}</span>
                  <span className="rounded-md bg-sea-50 px-2 py-0.5 text-[10.5px] font-semibold text-sea">{plan.patient.gender}</span>
                </div>
              </div>
            </div>
            <div className="flex min-w-0 gap-2.5 border-line pl-4 [border-left-width:1px]">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sea-50 text-sea"><ClipboardList className="size-[18px]" /></span>
              <div className="min-w-0">
                <p className="text-[11px] text-muted">Davolash rejasi</p>
                <p className="line-clamp-2 text-[14px] font-bold leading-tight text-ink">{plan.title}</p>
                <p className="line-clamp-2 text-[11px] leading-snug text-muted">{plan.subtitle}</p>
              </div>
            </div>
            <div className="flex min-w-0 gap-2.5 border-line pl-4 [border-left-width:1px]">
              <PersonAvatar src={doc.photo} name={doc.name} size={40} />
              <div className="min-w-0">
                <p className="text-[11px] text-muted">Shifokor</p>
                <p className="truncate text-[13px] font-bold text-ink">{doc.name}</p>
                <p className="text-[11px] text-muted">{doc.role}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-ink-2">
              <span className="inline-flex items-center gap-1.5"><Phone className="size-3.5 text-sea" /> {plan.patient.phone}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-sea" /> {plan.patient.city}</span>
              {hasProfile ? (
                <Link to={`/bemorlar/${plan.patient.id}`} className="inline-flex items-center gap-1 font-semibold text-sea hover:underline">Bemor profili <ArrowRight className="size-3.5" /></Link>
              ) : (
                <span title="Bemorlar bazasida profil yo‘q" className="inline-flex items-center gap-1 font-semibold text-muted">Bemor profili <ArrowRight className="size-3.5" /></span>
              )}
            </div>
            <div className="flex items-center gap-2 border-line pl-4 text-[11.5px] text-ink-2 [border-left-width:1px]">
              <CalendarDays className="size-4 text-sea" /> Boshlanish sanasi <b className="text-ink">{dmy(plan.start)}</b>
            </div>
            <div className="flex items-center gap-2 border-line pl-4 text-[12px] font-medium text-ink [border-left-width:1px]">
              <Armchair className="size-[18px] text-sea" /> {plan.chair}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-card">
            <div className="flex items-start gap-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sea-50 text-sea"><Activity className="size-[18px]" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] text-muted">Umumiy progress</p>
                <div className="flex items-baseline justify-between gap-2">
                  <b className="text-[15px] text-ink">{pr.n} / {pr.of} bosqich</b>
                  <b className="text-[17px] text-sea">{pr.pct}%</b>
                </div>
              </div>
            </div>
            <span className="mt-3 block h-2.5 overflow-hidden rounded-full bg-[#e3eef0]"><span className="block h-full rounded-full bg-sea transition-all" style={{ width: `${pr.pct}%` }} /></span>
            <div className="mt-3 flex items-center justify-between text-[11.5px]">
              <span className="text-muted">Holat</span>
              <span className="rounded-md px-2 py-0.5 font-semibold" style={{ background: st.bg, color: st.color }}>{st.label}</span>
            </div>
          </section>
        </div>

        <div className="rj-main">
          <div className="min-w-0 space-y-3">
            <section className="rounded-2xl bg-white p-4 shadow-card">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[14px] font-bold text-ink">Tish kartasi (davolash rejasi)</h2>
                <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] text-ink-2">
                  {LEGEND.map(([t, c]) => <li key={t} className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: c }} />{t}</li>)}
                </ul>
              </div>
              <ToothChart
                height={60}
                sideLabels={false}
                tintOf={tintOf}
                stateOf={artOfTooth}
                ringOf={(n) => (n === tooth ? '#0b8a95' : undefined)}
                numberClass={(n) => (planTeeth.has(n) ? 'font-bold text-ink text-[10.5px]' : 'text-muted')}
                onPick={(n) => setTooth(tooth === n ? null : n)}
              />
              <p className="mt-2 min-h-[18px] text-[11.5px] text-ink-2">
                {tooth ? (
                  <>
                    <b className="text-ink">{tooth}-tish:</b>{' '}
                    {stagesOf(tooth).length ? stagesOf(tooth).map((s) => `${s.title} (${STAGE_STATUS[s.status].label.toLowerCase()})`).join(', ') : 'bu rejada ish yo‘q'}
                    <button type="button" onClick={() => setTooth(null)} className="ml-2 text-sea">Tozalash</button>
                  </>
                ) : (
                  <span className="text-muted">Tishni bosing — unga tegishli bosqichlar ajratib ko‘rsatiladi.</span>
                )}
              </p>
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-card">
              <h2 className="mb-2 text-[14px] font-bold text-ink">Davolash bosqichlari</h2>
              <ol className="relative space-y-2">
                {plan.stages.map((s, i) => {
                  const ss = STAGE_STATUS[s.status]
                  const hit = tooth && s.teeth.includes(tooth)
                  return (
                    <li key={s.id} className="relative flex items-stretch gap-3">
                      <div className="relative flex w-7 shrink-0 flex-col items-center">
                        {i > 0 && <span className="absolute -top-2 h-[calc(50%+8px)] w-0.5 bg-[#cfe8ea]" />}
                        {i < plan.stages.length - 1 && <span className="absolute bottom-[-8px] top-1/2 w-0.5 bg-[#cfe8ea]" />}
                        <span className={`relative z-10 my-auto grid size-7 place-items-center rounded-full text-[12px] font-bold ${s.status === 'bajarildi' ? 'bg-[#dff3f3] text-sea' : s.status === 'jarayonda' ? 'bg-sea text-white' : 'border border-line bg-white text-ink-2'}`}>{i + 1}</span>
                      </div>
                      <div className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl border px-3 py-2.5 transition ${hit ? 'border-sea bg-[#f2fbfb]' : 'border-line'}`}>
                        <span className="grid w-4 shrink-0 place-items-center">{s.status === 'bajarildi' && <span className="grid size-4 place-items-center rounded-full bg-[#16a34a]"><Check className="size-2.5 text-white" strokeWidth={4} /></span>}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-bold text-ink">{s.title}</p>
                          <p className="line-clamp-2 text-[11px] leading-snug text-muted">{s.desc}</p>
                        </div>
                        <Cell label="Tish(lar)" w="w-[64px]">{s.teeth.join(', ') || '-'}</Cell>
                        <Cell label="Sana" w="w-[76px]">{s.date ? dmy(s.date) : '-'}</Cell>
                        <Cell label="Narx" w="w-[96px]">{money(s.price)} so‘m</Cell>
                        <div className="w-[104px] shrink-0">
                          <p className="text-[10px] text-muted">Holat</p>
                          <span className="mt-0.5 inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-[10.5px] font-semibold" style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
                        </div>
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button type="button" aria-label="Bosqich amallari" onClick={() => setMenu(menu === s.id ? '' : s.id)} className="grid size-7 place-items-center rounded-lg text-ink-2 hover:bg-[#f1f5f9]"><MoreVertical className="size-4" /></button>
                          {menu === s.id && (
                            <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-line bg-white p-1 shadow-lg">
                              {Object.entries(STAGE_STATUS).map(([k, x]) => (
                                <MenuBtn key={k} onClick={() => setStage(s.id, k)}><CircleDot className="size-3.5" style={{ color: x.color }} /> {x.label} {s.status === k && <Check className="ml-auto size-3.5 text-sea" />}</MenuBtn>
                              ))}
                              <div className="my-1 border-t border-line" />
                              <MenuBtn danger onClick={() => { if (window.confirm(`“${s.title}” bosqichi o‘chirilsinmi?`)) { patchPlan(plan.id, (p) => ({ stages: p.stages.filter((x) => x.id !== s.id) })); flash('Bosqich o‘chirildi') } setMenu('') }}><Trash2 className="size-3.5" /> O‘chirish</MenuBtn>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
                {!plan.stages.length && <li className="py-6 text-center text-[12.5px] text-muted">Bosqichlar yo‘q. “Rejani tahrirlash” orqali qo‘shing.</li>}
              </ol>
            </section>
          </div>

          <div className="min-w-0 space-y-3">
            <section className="rounded-2xl bg-white p-4 shadow-card">
              <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink"><Wallet className="size-4 text-sea" /> To‘lovlar xulosasi</h2>
              <div className="mt-3 space-y-2 text-[12px]">
                <p className="flex justify-between gap-2"><span className="text-ink-2">Umumiy narx</span><b className="text-ink">{money(total)} so‘m</b></p>
                <p className="flex justify-between gap-2"><span className="text-ink-2">To‘langan</span><b className="text-[#16a34a]">{money(plan.paid)} so‘m</b></p>
                <p className="flex justify-between gap-2"><span className="text-ink-2">Qolgan qarz</span><b className={debt ? 'text-[#e5484d]' : 'text-ink'}>{money(debt)} so‘m</b></p>
              </div>
              <button type="button" disabled={!debt} onClick={() => setDialog('pay')} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-sea text-[12.5px] font-semibold text-white hover:bg-sea-600 disabled:bg-[#9fd3d7]">
                {debt ? <><Plus className="size-4" /> To‘lov qo‘shish</> : <><Check className="size-4" /> To‘liq to‘langan</>}
              </button>
              {plan.payments?.length > 0 && (
                <>
                  <button type="button" onClick={() => setHistory(!history)} className="mt-2 flex w-full items-center justify-between text-[11.5px] font-medium text-sea">
                    To‘lovlar tarixi ({plan.payments.length}) <ChevronDown className={`size-4 transition ${history ? 'rotate-180' : ''}`} />
                  </button>
                  {history && (
                    <ul className="mt-1.5 space-y-1 text-[11.5px]">
                      {plan.payments.map((x, i) => (
                        <li key={i} className="flex justify-between gap-2 rounded-lg bg-[#f6f9fc] px-2 py-1.5"><span className="text-ink-2">{dmy(x.date)} · {x.method}</span><b className="text-ink">{money(x.sum)}</b></li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink"><CalendarDays className="size-4 text-sea" /> Uchrashuvlar</h2>
                <button type="button" onClick={() => setDialog('visit')} className="inline-flex h-7 items-center gap-1 rounded-lg bg-sea-50 px-2.5 text-[11px] font-semibold text-sea hover:bg-sea-100"><Plus className="size-3.5" /> Yangi uchrashuv</button>
              </div>
              <ul className="mt-2 divide-y divide-line/70">
                {plan.visits.map((v) => {
                  const vs = STAGE_STATUS[v.status] || STAGE_STATUS.rejada
                  return (
                    <li key={v.id} className="flex items-center gap-2 py-2">
                      <CalendarDays className="size-4 shrink-0 text-ink-2" />
                      <div className="min-w-0 flex-1">
                        <p className="whitespace-nowrap text-[11px] font-semibold text-ink">{v.date ? `${dmy(v.date)}, ${v.time}` : '-'}</p>
                        <p className="truncate text-[10.5px] text-muted">{v.title}</p>
                      </div>
                      <span className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: vs.bg, color: vs.color }}>{vs.label}</span>
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button type="button" aria-label="Uchrashuv amallari" onClick={() => setMenu(menu === v.id ? '' : v.id)} className="grid size-6 place-items-center rounded-md text-ink-2 hover:bg-[#f1f5f9]"><MoreVertical className="size-3.5" /></button>
                        {menu === v.id && (
                          <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-line bg-white p-1 shadow-lg">
                            {Object.entries(STAGE_STATUS).map(([k, x]) => <MenuBtn key={k} onClick={() => setVisit(v.id, k)}><CircleDot className="size-3.5" style={{ color: x.color }} /> {x.label}</MenuBtn>)}
                            <div className="my-1 border-t border-line" />
                            <MenuBtn danger onClick={() => { patchPlan(plan.id, (p) => ({ visits: p.visits.filter((x) => x.id !== v.id) })); setMenu(''); flash('Uchrashuv o‘chirildi') }}><Trash2 className="size-3.5" /> O‘chirish</MenuBtn>
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
                {!plan.visits.length && <li className="py-4 text-center text-[12px] text-muted">Uchrashuvlar yo‘q</li>}
              </ul>
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-[13.5px] font-bold text-ink"><StickyNote className="size-4 text-sea" /> Admin izohi</h2>
                {!editNote && <button type="button" onClick={() => setEditNote(true)} className="inline-flex h-7 items-center gap-1 rounded-lg border border-sea px-2.5 text-[11px] font-semibold text-sea"><Pencil className="size-3" /> Tahrirlash</button>}
              </div>
              {editNote ? (
                <div className="mt-2">
                  <textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Izoh yozing..." className="w-full resize-none rounded-xl border border-line p-2.5 text-[12px] outline-none focus:border-sea" />
                  <div className="mt-1.5 flex gap-1.5">
                    <button type="button" onClick={() => { patchPlan(plan.id, { note: note.trim() }); setEditNote(false); flash('Izoh saqlandi') }} className="h-8 rounded-lg bg-sea px-3 text-[11.5px] font-semibold text-white">Saqlash</button>
                    <button type="button" onClick={() => { setNote(plan.note); setEditNote(false) }} className="h-8 rounded-lg border border-line px-3 text-[11.5px]">Bekor</button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-[11.5px] leading-relaxed text-ink-2">{plan.note || <span className="text-muted">Izoh yo‘q.</span>}</p>
              )}
            </section>
          </div>
        </div>
      </div>

      {dialog === 'pay' && (
        <PayDialog debt={debt} onClose={() => setDialog('')} onSave={(sum, method) => { addPayment(plan.id, sum, method); setDialog(''); flash(`${money(sum)} so‘m to‘lov qabul qilindi`) }} />
      )}
      {dialog === 'visit' && (
        <VisitDialog
          stages={plan.stages}
          onClose={() => setDialog('')}
          onSave={(v) => {
            patchPlan(plan.id, (p) => ({ visits: [...p.visits, { ...v, id: `${p.id}-v${Date.now()}` }].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || a.time.localeCompare(b.time)) }))
            setDialog('')
            flash(`Uchrashuv belgilandi: ${dmy(v.date)}, ${v.time}`)
          }}
        />
      )}
      {dialog === 'edit' && <RejaDialog initial={plan} onClose={() => setDialog('')} onSave={(p, asTemplate) => { savePlan(p); if (asTemplate) saveTemplate({ name: p.title, title: p.title, items: p.items, groups: p.groups, discount: p.discount, payMode: p.payMode }); setDialog(''); flash('Reja yangilandi') }} />}
      {toast && <div className="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-xl bg-ink px-4 py-2.5 text-[12.5px] font-medium text-white shadow-lg"><Check className="mr-1.5 inline size-4" />{toast}</div>}
    </ShopLayout>
  )
}

function Cell({ label, w, children }) {
  return (
    <div className={`${w} shrink-0`}>
      <p className="text-[10px] text-muted">{label}</p>
      <p className="truncate text-[11.5px] font-medium text-ink">{children}</p>
    </div>
  )
}

function OutlineBtn({ onClick, children }) {
  return <button type="button" onClick={onClick} className="inline-flex h-10 items-center gap-2 rounded-xl border border-sea bg-white px-4 text-[12.5px] font-semibold text-sea hover:bg-[#f2fbfb]">{children}</button>
}

function MenuBtn({ danger, onClick, children }) {
  return <button type="button" onClick={onClick} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] ${danger ? 'text-[#dc2626] hover:bg-[#fdf0f0]' : 'hover:bg-[#f4f8fb]'}`}>{children}</button>
}

function SmallDialog({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="bemor-shade" onClick={onClose}>
      <div role="dialog" aria-label={title} className="w-[min(400px,100%)] rounded-2xl bg-white p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-ink">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center rounded-lg text-muted hover:bg-[#f4f8fb]"><X className="size-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

const input = 'h-10 w-full rounded-xl border border-[#e6ebf2] bg-white px-3 text-[12.5px] outline-none focus:border-sea'

function PayDialog({ debt, onClose, onSave }) {
  const [sum, setSum] = useState(debt)
  const [method, setMethod] = useState(PAY_METHODS[0])
  const [error, setError] = useState('')
  const submit = (e) => {
    e.preventDefault()
    if (!(sum > 0)) return setError('Summani kiriting')
    if (sum > debt) return setError(`Qarzdan oshmasin (${money(debt)} so‘m)`)
    onSave(sum, method)
  }
  return (
    <SmallDialog title="To‘lov qo‘shish" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <p className="mb-1 text-[11.5px] font-semibold text-ink">Summa (so‘m)</p>
          <input autoFocus value={sum ? money(sum) : ''} onChange={(e) => { setSum(Number(e.target.value.replace(/\D/g, '')) || 0); setError('') }} className={input} />
          <div className="mt-1.5 flex gap-1.5">
            {[0.25, 0.5, 1].map((k) => <button key={k} type="button" onClick={() => setSum(Math.round(debt * k))} className="h-7 rounded-lg border border-line px-2 text-[11px] hover:border-sea">{k === 1 ? 'To‘liq' : `${k * 100}%`}</button>)}
          </div>
        </div>
        <div>
          <p className="mb-1 text-[11.5px] font-semibold text-ink">To‘lov usuli</p>
          <div className="flex flex-wrap gap-1.5">
            {PAY_METHODS.map((m) => <button key={m} type="button" onClick={() => setMethod(m)} className={`h-8 rounded-lg border px-2.5 text-[11.5px] ${method === m ? 'border-sea bg-sea-50 font-semibold text-sea' : 'border-line'}`}>{m}</button>)}
          </div>
        </div>
        <p className="text-[11.5px] text-muted">Qolgan qarz: <b className="text-ink">{money(debt)} so‘m</b></p>
        {error && <p className="text-[11.5px] text-[#e5484d]">{error}</p>}
        <button type="submit" className="h-10 w-full rounded-xl bg-sea text-[12.5px] font-semibold text-white hover:bg-sea-600">To‘lovni qabul qilish</button>
      </form>
    </SmallDialog>
  )
}

function VisitDialog({ stages, onClose, onSave }) {
  const next = stages.find((s) => s.status !== 'bajarildi')
  const [date, setDate] = useState(TODAY)
  const [time, setTime] = useState(TIMES[1])
  const [stage, setStage] = useState(next?.id || '')
  const [error, setError] = useState('')
  const submit = (e) => {
    e.preventDefault()
    if (!date) return setError('Sanani tanlang')
    if (date < TODAY) return setError('O‘tgan sanaga uchrashuv belgilab bo‘lmaydi')
    const s = stages.find((x) => x.id === stage)
    onSave({ date, time, title: s ? (s.teeth.length ? `${s.title} (${s.teeth.join(', ')})` : s.title) : 'Nazorat ko‘rigi', status: 'rejada' })
  }
  return (
    <SmallDialog title="Uchrashuv belgilash" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="mb-1 text-[11.5px] font-semibold text-ink">Sana</p>
            <input type="date" value={date} min={TODAY} onChange={(e) => { setDate(e.target.value); setError('') }} className={input} />
          </div>
          <div>
            <p className="mb-1 text-[11.5px] font-semibold text-ink">Vaqt</p>
            <select value={time} onChange={(e) => setTime(e.target.value)} className={input}>{TIMES.map((t) => <option key={t}>{t}</option>)}</select>
          </div>
        </div>
        <div>
          <p className="mb-1 text-[11.5px] font-semibold text-ink">Bosqich</p>
          <select value={stage} onChange={(e) => setStage(e.target.value)} className={input}>
            {stages.map((s, i) => <option key={s.id} value={s.id}>{i + 1}. {s.title}{s.teeth.length ? ` (${s.teeth.join(', ')})` : ''}</option>)}
            <option value="">Nazorat ko‘rigi</option>
          </select>
        </div>
        {error && <p className="text-[11.5px] text-[#e5484d]">{error}</p>}
        <button type="submit" className="h-10 w-full rounded-xl bg-sea text-[12.5px] font-semibold text-white hover:bg-sea-600">Belgilash</button>
      </form>
    </SmallDialog>
  )
}
