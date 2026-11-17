import { tashkentToday } from '../../tashkentDate'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, MoreVertical, Camera, Phone, CalendarDays, CreditCard, PencilLine, AlertCircle, ChevronRight, CheckCircle2, Wallet,
  PieChart, PlusCircle, Check, Trash2, Copy, FileText, Clock, Stethoscope,
} from 'lucide-react'
import { CITIES, getBemor, patchBemor, removeBemor, som, useBemorlar } from '../../bemorData'
import { MobileToast } from './parts'
import { BottomSheet } from './MobileSeminars'
import { Face, MSTATUS, STATUS_TABS, TOOTH_STATES, TeethChart, Tooth, toothName } from './bemorParts'
import { chairNames, useClinicSettings } from '../../clinicSettings'
import { DocsPanel, MedicalFields, MedicalView, PlansPanel, SaveErrorToast, medicalForm, saveMedical, useDocUpload, usePatientRecords } from '../crm/PatientTabs'
import { VISIT_STATUS, addCalendarVisit, addClinicPaymentFor, addPatientDoc, isUpcoming, markVisitDone, methodLabel, niceDate, removeCalendarVisit, setPatientPhoto, usePatientPhoto } from '../crm/patientRecords'
import PhoneInput, { extractUzLocalDigits, isCompleteUzPhone, PHONE_INCOMPLETE_MSG, toE164 } from '../PhoneInput'

const TABS = [['umumiy', 'Umumiy'], ['tish', 'Tish kartasi'], ['reja', 'Rejalar'], ['tashrif', 'Tashriflar'], ['tolov', 'To‘lovlar'], ['rentgen', 'Rentgen'], ['tibbiy', 'Tibbiy']]
const KINDS = ['Konsultatsiya', 'Davolash', 'Professional gigiyena', 'Implant', 'Ortodontiya', 'Protezlash', 'Tish olish']
const TIMES = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00']
const METHODS = [['Naqd', 'Naqd'], ['Karta', 'Karta'], ['Click', 'Click'], ['Payme', 'Payme']]
const PLAN_OF = { caries: ['Karies davolash (plomba)', 'Davolash'], missing: ['Implant yoki protez', 'Implant'], endo: ['Endo nazorat rentgeni', 'Konsultatsiya'] }

export default function MobileBemor() {
  const { id } = useParams()
  return <BemorView key={id} id={id} />
}

function BemorView({ id }) {
  useBemorlar()
  const p = getBemor(id)
  const rec = usePatientRecords(p)
  const photo = usePatientPhoto(p)
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState('umumiy')
  const [sheet, setSheet] = useState(() => (location.state?.visit ? { visit: {} } : null))
  const [toast, setToast] = useState(() => location.state?.toast || '')
  const closeToast = useCallback(() => setToast(''), [])
  const photoRef = useRef(null)
  const docs = useDocUpload(p, addPatientDoc, setToast)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (!p) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-6 text-center">
        <div>
          <p className="text-[15px] font-semibold text-ink">Bemor topilmadi</p>
          <Link to="/bemorlar" className="mt-3 inline-block text-[13px] font-semibold text-sea">Bemorlarga qaytish</Link>
        </div>
      </div>
    )
  }

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/bemorlar'))
  const onPhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      await setPatientPhoto(p, file)
      setToast('Rasm yangilandi')
    } catch (err) {
      setToast(err.message || 'Rasmni yuklab bo‘lmadi')
    }
  }
  const medical = [...(p.allergy || []).map((a) => `${a} allergiyasi`), ...(p.diseases || [])]
  const m = rec.money
  const pct = m.total ? Math.min(100, Math.round((m.paid / m.total) * 100)) : 100
  const visits = rec.visits
  const planned = visits.filter(isUpcoming)
  const suggestions = Object.entries(p.teeth || {}).filter(([, s]) => PLAN_OF[s]).map(([n, s]) => ({ n, s, title: PLAN_OF[s][0], kind: PLAN_OF[s][1] }))

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_30%)] pb-[92px]">
      <header className="sticky top-0 z-20 grid grid-cols-[40px_1fr_40px] items-center bg-[#eef8f7]/95 px-2.5 py-2 backdrop-blur">
        <button type="button" onClick={back} aria-label="Orqaga" className="grid size-10 place-items-center text-sea"><ChevronLeft className="size-6" /></button>
        <h1 className="text-center text-[18px] font-extrabold text-[#0d2a4a]">Bemor profili</h1>
        <button type="button" onClick={() => setSheet('menu')} aria-label="Amallar" className="grid size-10 place-items-center text-sea"><MoreVertical className="size-5" /></button>
      </header>

      <div className="flex flex-col gap-2.5 px-3.5 pt-1">
        <section className="rounded-2xl bg-white p-3 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
          <div className="flex gap-3">
            <button type="button" onClick={() => photoRef.current?.click()} aria-label="Rasmni o‘zgartirish" className="relative h-fit shrink-0">
              <Face key={photo || 'none'} p={{ ...p, photo }} className="size-[84px]" text="text-[24px]" />
              <span className="absolute bottom-0 right-0 grid size-7 place-items-center rounded-full bg-[#0b8a95] text-white ring-2 ring-white"><Camera className="size-3.5" /></span>
            </button>
            <input ref={photoRef} type="file" accept="image/*" onChange={onPhoto} className="hidden" />
            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-2 text-[18px] font-extrabold leading-tight text-[#0d2a4a]">{p.name}</h2>
              <div className="mt-1 flex items-center justify-between gap-1.5">
                <p className="truncate text-[12px] text-muted">ID: <b className="font-semibold text-ink">#{p.code}</b></p>
                <span className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-semibold ${MSTATUS[p.status]}`}><CheckCircle2 className="size-3.5" /> {p.status === 'Faol' ? 'Faol bemor' : p.status}</span>
              </div>
              <p className="mt-0.5 text-[12px] text-ink-2">{[p.age, p.birth, p.gender].filter(Boolean).map((x, i) => <span key={i}>{i > 0 && <span className="text-line"> • </span>}{x}</span>)}</p>
              <a href={`tel:${p.phone.replace(/\s/g, '')}`} className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-ink"><Phone className="size-4 text-sea" /> {p.phone}</a>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {[
              [Phone, 'Qo‘ng‘iroq', null, `tel:${p.phone.replace(/\s/g, '')}`],
              [CalendarDays, 'Qabul', () => setSheet({ visit: {} })],
              [CreditCard, 'To‘lov', () => setSheet('pay')],
              [PencilLine, 'Tahrirlash', () => setSheet('edit')],
            ].map(([Icon, l, fn, href]) => {
              const cls = 'flex h-[62px] flex-col items-center justify-center gap-1 rounded-xl border border-line/80 bg-white text-[11.5px] font-semibold text-ink active:bg-[#f2f8f8]'
              const inner = <><Icon className="size-5 text-sea" strokeWidth={1.7} /> {l}</>
              return href ? <a key={l} href={href} className={cls}>{inner}</a> : <button key={l} type="button" onClick={fn} className={cls}>{inner}</button>
            })}
          </div>
          {medical.length > 0 && (
            <button type="button" onClick={() => setSheet('medical')} className="mt-2.5 flex w-full items-center gap-2.5 rounded-xl bg-[#fdecec] px-3 py-2.5 text-left">
              <AlertCircle className="size-6 shrink-0 fill-[#e0454f] text-white" />
              <span className="min-w-0 flex-1">
                <b className="block text-[13px] font-bold text-[#d23b45]">{p.allergy?.length ? 'Allergiya' : 'Kasalliklar'}</b>
                <span className="block text-[11.5px] leading-snug text-[#7a3a3f]">{medical.join(' • ')}</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-[#d23b45]" />
            </button>
          )}
        </section>

        <div className="-mx-3.5 flex gap-1.5 overflow-x-auto px-3.5 no-scrollbar">
          {TABS.map(([k, l]) => <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)} className={`h-9 shrink-0 rounded-xl px-3.5 text-[12.5px] font-medium transition ${tab === k ? 'bg-[#0b8a95] font-semibold text-white' : 'border border-line/70 bg-white text-ink-2'}`}>{l}</button>)}
        </div>

        {(tab === 'umumiy' || tab === 'tish') && (
          <Card>
            <TeethChart teeth={p.teeth} big={tab === 'tish'} onPick={(n) => setSheet({ tooth: n })} />
            {tab === 'tish' && (
              <div className="mt-3 border-t border-line/70 pt-3">
                <p className="text-[13px] font-semibold text-ink">Belgilangan tishlar</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(p.teeth || {}).filter(([, s]) => s !== 'healthy').map(([n, s]) => (
                    <button key={n} type="button" onClick={() => setSheet({ tooth: Number(n) })} className="flex items-center gap-1 rounded-lg bg-[#f3f7fa] py-1 pl-1 pr-2 text-[11.5px] text-ink">
                      <Tooth n={Number(n)} state={s} className="h-[22px] w-[13px]" /> <b>{n}</b> {toothName[s]}
                    </button>
                  ))}
                  {!Object.values(p.teeth || {}).some((s) => s !== 'healthy') && <p className="text-[12px] text-muted">Hali belgilanmagan. Tishni bosib holatini tanlang.</p>}
                </div>
              </div>
            )}
          </Card>
        )}

        {(tab === 'umumiy' || tab === 'tolov') && (
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" onClick={() => setTab('tolov')} className="rounded-2xl bg-white p-3 text-left shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
              <span className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-[#e6f4f3] text-[#0b8a95]"><Wallet className="size-5" /></span><span className="text-[12px] text-muted">Balans</span></span>
              <b className="mt-1.5 block whitespace-nowrap text-[17px] font-extrabold tracking-tight text-[#0b6d73]">{som(m.debt)}</b>
              <span className="mt-1 block text-[10.5px] text-muted">Umumiy: {som(m.total)}</span>
              <span className="block text-[10.5px] text-muted">To‘langan: {som(m.paid)}</span>
            </button>
            <button type="button" onClick={() => setSheet('pay')} className="relative rounded-2xl bg-white p-3 text-left shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
              <span className="flex items-center gap-2"><span className={`grid size-9 place-items-center rounded-xl ${m.debt ? 'bg-[#fdecec] text-[#e0454f]' : 'bg-[#e6f8ec] text-[#1c9a52]'}`}><PieChart className="size-5" /></span><span className="text-[12px] text-muted">To‘lov holati</span></span>
              <b className={`mt-1.5 block text-[17px] font-extrabold ${m.debt ? 'text-[#e0454f]' : 'text-[#1c9a52]'}`}>{m.debt ? 'Qarzdor' : 'To‘langan'}</b>
              <span className="mt-1 block text-[10.5px] text-muted">Qarz: {som(m.debt)}</span>
              <span className="block text-[10.5px] text-muted">To‘langan: {pct}%</span>
              <ChevronRight className="absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted" />
            </button>
          </div>
        )}

        {tab === 'tolov' && (
          <Card title="To‘lovlar tarixi" action={<button type="button" onClick={() => setSheet('pay')} className="text-[12px] font-semibold text-sea">+ To‘lov</button>}>
            <div className="h-2 overflow-hidden rounded-full bg-[#eef1f5]"><span className="block h-full rounded-full bg-[#0b8a95]" style={{ width: `${pct}%` }} /></div>
            <p className="mt-1 text-[11px] text-muted">{pct}% to‘langan</p>
            <div className="mt-2 flex flex-col divide-y divide-line/70" data-testid="m-payments">
              {m.list.map((x) => (
                <p key={x.key} className="flex items-center gap-2.5 py-2.5 text-[12.5px]">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e6f8ec] text-[#1c9a52]"><CreditCard className="size-4" /></span>
                  <span className="min-w-0 flex-1"><b className="block truncate font-semibold text-ink">{x.method ? methodLabel(x.method) : 'To‘lov'}{x.source === 'legacy' ? <span className="font-normal text-muted"> · eski</span> : null}</b><span className="block truncate text-[11px] text-muted">{x.iso ? niceDate(x.iso) : x.dateText || '—'}{x.note ? ` · ${x.note}` : ''}</span></span>
                  <b className="shrink-0 whitespace-nowrap font-bold text-[#1c9a52]">+{som(x.sum)}</b>
                </p>
              ))}
              {!m.list.length && <p className="py-3 text-[12px] text-muted">Hali to‘lov yo‘q</p>}
            </div>
          </Card>
        )}

        {(tab === 'umumiy' || tab === 'tashrif') && (
          <Card title={tab === 'umumiy' ? 'So‘nggi tashriflar' : `Tashriflar (${visits.length})`} action={tab === 'umumiy' && visits.length > 0 && <button type="button" onClick={() => setTab('tashrif')} className="text-[12px] font-semibold text-sea">Barchasini ko‘rish</button>}>
            <Timeline list={tab === 'umumiy' ? visits.slice(0, 4) : visits} onOpen={(v) => setSheet({ visitInfo: v })} />
            {!visits.length && <p className="text-[12px] text-muted">Hali tashrif yo‘q. Pastdagi tugma orqali qabul qo‘shing.</p>}
          </Card>
        )}

        {tab === 'reja' && (
          <>
            <PlansPanel p={p} plans={rec.plans} onToast={setToast} />
            <Card title="Rejalashtirilgan qabullar">
              {planned.length ? <Timeline list={planned} onOpen={(v) => setSheet({ visitInfo: v })} /> : <p className="text-[12px] text-muted">Rejalashtirilgan qabul yo‘q</p>}
            </Card>
            {suggestions.length > 0 && (
              <Card title="Tish kartasi bo‘yicha tavsiyalar">
                <div className="flex flex-col gap-1.5">
                  {suggestions.map((x) => (
                    <div key={x.n} className="flex items-center gap-2.5 rounded-xl border border-line/70 p-2">
                      <Tooth n={Number(x.n)} state={x.s} className="h-[30px] w-[17px]" />
                      <span className="min-w-0 flex-1"><b className="block text-[12.5px] font-semibold text-ink">{x.title}</b><span className="text-[11px] text-muted">{x.n}-tish · {toothName[x.s]}</span></span>
                      <button type="button" onClick={() => setSheet({ visit: { kind: x.kind, tooth: x.n } })} className="h-8 shrink-0 rounded-lg bg-[#e6f4f3] px-2.5 text-[11.5px] font-semibold text-[#0b6d73]">Qabulga</button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {tab === 'rentgen' && <DocsPanel p={p} onUpload={docs.pick} busy={docs.busy} error={docs.error} onToast={setToast} />}

        {tab === 'tibbiy' && (
          <Card title="Tibbiy ma’lumotlar" action={<button type="button" onClick={() => setSheet('medical')} className="text-[12px] font-semibold text-sea">Tahrirlash</button>}>
            <MedicalView p={p} />
          </Card>
        )}
        {docs.input}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-white/95 px-3.5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <button type="button" onClick={() => setSheet({ visit: {} })} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#0b8a95] text-[15px] font-semibold text-white shadow-[0_8px_18px_rgb(11_138_149/0.3)] active:scale-[0.99]">
          <PlusCircle className="size-5" /> Yangi qabul qo‘shish
        </button>
      </div>

      {sheet?.visit && <VisitSheet p={p} preset={sheet.visit} onClose={() => setSheet(null)} onDone={(msg) => { setSheet(null); setToast(msg) }} />}
      {sheet?.visitInfo && <VisitInfo p={p} v={sheet.visitInfo} onClose={() => setSheet(null)} onToast={setToast} />}
      {sheet === 'pay' && <PaySheet p={p} m={m} onClose={() => setSheet(null)} onDone={(msg) => { setSheet(null); setToast(msg) }} />}
      {sheet === 'edit' && <EditSheet p={p} onClose={() => setSheet(null)} onDone={() => { setSheet(null); setToast('Ma’lumotlar saqlandi') }} />}
      {sheet === 'medical' && <MedicalSheet p={p} onClose={() => setSheet(null)} onDone={() => { setSheet(null); setToast('Tibbiy ma’lumot saqlandi') }} />}
      {sheet?.tooth && <ToothSheet p={p} n={sheet.tooth} onClose={() => setSheet(null)} onPlan={(kind) => setSheet({ visit: { kind, tooth: String(sheet.tooth) } })} />}
      {sheet === 'menu' && (
        <MenuSheet
          p={p}
          onClose={() => setSheet(null)}
          onEdit={() => setSheet('edit')}
          onStatus={(s) => { patchBemor(p.id, { status: s }); setSheet(null); setToast(`Holat: ${s}`) }}
          onCopy={() => { navigator.clipboard?.writeText(`${p.name}, #${p.code}, ${p.phone}`).catch(() => {}); setSheet(null); setToast('Bemor ma’lumoti nusxalandi') }}
          onRemove={() => { removeBemor(p.id); navigate('/bemorlar', { replace: true, state: { toast: `${p.name} o‘chirildi` } }) }}
        />
      )}

      <MobileToast text={toast} onClose={closeToast} bottom={84} />
      <SaveErrorToast bottom={84} />
    </div>
  )
}

function Card({ title, action, children }) {
  return (
    <section className="rounded-2xl bg-white p-3 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
      {title && <div className="mb-2.5 flex items-center justify-between gap-2"><h3 className="text-[15px] font-bold text-[#0d2a4a]">{title}</h3>{action}</div>}
      {children}
    </section>
  )
}

function Timeline({ list, onOpen }) {
  return (
    <ol className="flex flex-col">
      {list.map((v, i) => {
        const dot = !v.done ? 'border-[#3b82f6] bg-white' : i === 0 ? 'border-[#0b8a95] bg-[#0b8a95]' : 'border-[#b8c4d0] bg-[#b8c4d0]'
        const st = VISIT_STATUS[v.status]
        return (
          <li key={v.key} className="relative">
            {i < list.length - 1 && <span className="absolute bottom-0 left-[6px] top-5 w-px bg-line" />}
            <button type="button" onClick={() => onOpen(v)} className="flex w-full items-center gap-3 py-2 text-left">
              <span className={`relative z-10 size-[13px] shrink-0 self-start rounded-full border-[3px] ${dot}`} style={{ marginTop: 3 }} />
              <span className="min-w-0 flex-1">
                <span className="block text-[11.5px] text-ink-2">{v.iso ? niceDate(v.iso) : v.dateText}{v.time ? `, ${v.time}` : ''}{!v.done && st && <span className={`ml-1.5 rounded px-1 text-[10px] font-semibold ${st.cls}`}>{v.status === 'bekor' ? 'Bekor' : 'Rejada'}</span>}{v.readOnly && <span className="ml-1.5 text-[10px] text-muted">eski</span>}</span>
                <b className="block truncate text-[13px] font-bold text-ink">{v.kind}</b>
                <span className="block truncate text-[11px] text-muted">{v.note || (v.tooth ? `${v.tooth}-tish` : '—')}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                {v.doctor && <span className="max-w-[90px] truncate text-[11.5px] font-medium text-ink">{v.doctor}</span>}
                <ChevronRight className="size-4 text-muted" />
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

const chip = (on) => `flex h-9 items-center gap-1 rounded-xl border px-3 text-[12.5px] font-medium ${on ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`
const input = (bad) => `h-11 w-full rounded-xl border px-3 text-[14px] outline-none focus:border-sea ${bad ? 'border-sale' : 'border-line'}`

function VisitSheet({ p, preset, onClose, onDone }) {
  const settings = useClinicSettings()
  const today = tashkentToday()
  const [date, setDate] = useState(today)
  const [time, setTime] = useState('')
  const [kind, setKind] = useState(preset.kind || '')
  const [tooth, setTooth] = useState(preset.tooth ? String(preset.tooth) : '')
  const [note, setNote] = useState('')
  const [tried, setTried] = useState(false)
  const toothBad = tooth && !/^[1-8][1-8]$/.test(tooth)
  const ok = date >= today && time && kind && !toothBad
  const save = () => {
    setTried(true)
    if (!ok) return
    // Kalendar (Uchrashuvlar) yagona manba: qabul o‘sha yerda ham ko‘rinadi
    addCalendarVisit(p, { date, start: time, service: kind, tooth, note: note.trim(), room: chairNames(settings)[0] || 'Kreslo 1' })
    onDone(`Qabul belgilandi: ${niceDate(date)}, ${time}`)
  }
  return (
    <BottomSheet title="Yangi qabul" onClose={onClose} footer={<button type="button" onClick={save} className="h-12 flex-1 rounded-xl bg-[#0b8a95] text-[14px] font-semibold text-white">Qabulni saqlash</button>}>
      <p className="mt-1 text-[12px] text-muted">{p.name} · #{p.code}</p>
      <p className="mt-3 text-[13px] font-semibold text-ink">Qabul turi</p>
      <div className="mt-2 flex flex-wrap gap-1.5">{KINDS.map((k) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={chip(kind === k)}>{kind === k && <Check className="size-3.5" />}{k}</button>)}</div>
      {tried && !kind && <p className="mt-1 text-[11.5px] text-sale">Qabul turini tanlang</p>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-[12px] text-muted">Sana<input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} onClick={(e) => e.currentTarget.showPicker?.()} className={`mt-1 ${input(tried && date < today)}`} /></label>
        <label className="text-[12px] text-muted">Tish (FDI, ixtiyoriy)<input value={tooth} onChange={(e) => setTooth(e.target.value.replace(/\D/g, '').slice(0, 2))} inputMode="numeric" placeholder="masalan, 36" className={`mt-1 ${input(tried && toothBad)}`} /></label>
      </div>
      <p className="mt-3 text-[13px] font-semibold text-ink">Vaqt</p>
      <div className="mt-2 grid grid-cols-6 gap-1">{TIMES.map((t) => <button key={t} type="button" aria-pressed={time === t} onClick={() => setTime(t)} className={`h-10 rounded-xl border text-[12px] font-semibold ${time === t ? 'border-[#0b8a95] bg-[#0b8a95] text-white' : 'border-line text-ink'}`}>{t}</button>)}</div>
      {tried && !time && <p className="mt-1 text-[11.5px] text-sale">Vaqtni tanlang</p>}
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Izoh (ixtiyoriy)" className="mb-2 mt-3 w-full resize-none rounded-xl border border-line px-3 py-2.5 text-[13.5px] outline-none focus:border-sea" />
    </BottomSheet>
  )
}

function VisitInfo({ p, v, onClose, onToast }) {
  const [ask, setAsk] = useState(false)
  const st = VISIT_STATUS[v.readOnly ? 'eski' : v.status] || VISIT_STATUS.tasdiq
  const toggle = () => {
    markVisitDone(p, v, !v.done)
    onToast(v.done ? 'Qabul rejaga qaytarildi' : 'Qabul bajarildi deb belgilandi')
    onClose()
  }
  const remove = () => {
    removeCalendarVisit(v.id)
    onToast('Tashrif o‘chirildi')
    onClose()
  }
  return (
    <BottomSheet title={v.kind} onClose={onClose}>
      <div className="mt-2 flex flex-col divide-y divide-line/70 rounded-2xl border border-line/70">
        {[[CalendarDays, 'Sana', `${v.iso ? niceDate(v.iso) : v.dateText}${v.time ? `, ${v.time}` : ''}`], ...(v.doctor ? [[Stethoscope, 'Shifokor', v.doctor]] : []), [Clock, 'Holat', v.readOnly ? `${v.done ? 'Bajarilgan' : 'Rejada'} (eski yozuv)` : st.label], ...(v.tooth ? [[FileText, 'Tish', `${v.tooth}-tish`]] : []), ...(v.note ? [[FileText, 'Izoh', v.note]] : [])].map(([Icon, k, val]) => (
          <p key={k} className="flex items-center gap-2 px-3 py-2.5 text-[13px]"><Icon className="size-4 shrink-0 text-sea" /><span className="text-muted">{k}</span><span className="ml-auto text-right font-semibold text-ink">{val}</span></p>
        ))}
      </div>
      {v.readOnly ? <p className="mb-2 mt-3 text-[12px] text-muted">Bu eski yozuv — faqat ko‘rish uchun. Yangi qabullar Uchrashuvlar kalendarida saqlanadi.</p> : ask ? (
        <div className="mb-2 mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setAsk(false)} className="h-11 rounded-xl border border-line text-[13.5px] font-semibold">Bekor qilish</button>
          <button type="button" onClick={remove} className="h-11 rounded-xl bg-sale text-[13.5px] font-semibold text-white">Ha, o‘chirish</button>
        </div>
      ) : (
        <div className="mb-2 mt-3 grid grid-cols-[1fr_auto] gap-2">
          <button type="button" onClick={toggle} className="h-11 rounded-xl bg-[#0b8a95] text-[13.5px] font-semibold text-white">{v.done ? 'Rejaga qaytarish' : 'Bajarildi deb belgilash'}</button>
          <button type="button" onClick={() => setAsk(true)} aria-label="Tashrifni o‘chirish" className="grid size-11 place-items-center rounded-xl border border-line text-sale"><Trash2 className="size-5" /></button>
        </div>
      )}
    </BottomSheet>
  )
}

function PaySheet({ p, m, onClose, onDone }) {
  const [sum, setSum] = useState(m.debt ? String(m.debt) : '')
  const [method, setMethod] = useState('Naqd')
  const [service, setService] = useState('')
  const [tried, setTried] = useState(false)
  const n = Number(sum.replace(/\D/g, ''))
  const extra = Number(service.replace(/\D/g, ''))
  const ok = n > 0 && n <= m.debt + extra
  const save = () => {
    setTried(true)
    if (!ok) return
    if (extra) patchBemor(p.id, { total: (Number(p.total) || 0) + extra })
    // To‘lovlar bo‘limi bilan yagona manba (clinic_payments)
    addClinicPaymentFor(getBemor(p.id) || p, { sum: n, method })
    onDone(`${som(n)} qabul qilindi`)
  }
  return (
    <BottomSheet title="To‘lov qabul qilish" onClose={onClose} footer={<button type="button" onClick={save} className="h-12 flex-1 rounded-xl bg-[#0b8a95] text-[14px] font-semibold text-white">Qabul qilish{n ? ` · ${som(n)}` : ''}</button>}>
      <div className="mt-2 grid grid-cols-3 gap-2 rounded-2xl bg-[#f3f7fa] p-3 text-center">
        {[['Umumiy', m.total, 'text-ink'], ['To‘langan', m.paid, 'text-[#1c9a52]'], ['Qarz', m.debt, 'text-[#e0454f]']].map(([l, v, c]) => <p key={l}><span className="block text-[11px] text-muted">{l}</span><b className={`text-[12.5px] ${c}`}>{som(v)}</b></p>)}
      </div>
      <label className="mt-3 block text-[12px] text-muted">Yangi xizmat summasi (ixtiyoriy)<input value={service} onChange={(e) => setService(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Masalan, 500000" className={`mt-1 ${input(false)}`} /></label>
      <label className="mt-2 block text-[12px] text-muted">To‘lov summasi<input value={sum} onChange={(e) => setSum(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Summa" className={`mt-1 ${input(tried && !ok)}`} /></label>
      {tried && !ok && <p className="mt-1 text-[11.5px] text-sale">{n ? 'Summa qarzdan oshmasligi kerak' : 'Summani kiriting'}</p>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {[m.debt + extra, 500000, 1000000].filter((x, i, a) => x > 0 && a.indexOf(x) === i).map((x) => <button key={x} type="button" onClick={() => setSum(String(x))} className="h-8 rounded-lg bg-page px-2.5 text-[12px] text-ink-2">{som(x)}</button>)}
      </div>
      <p className="mt-3 text-[13px] font-semibold text-ink">To‘lov usuli</p>
      <div className="mb-2 mt-2 flex flex-wrap gap-1.5">{METHODS.map(([k, l]) => <button key={k} type="button" aria-pressed={method === k} onClick={() => setMethod(k)} className={chip(method === k)}>{method === k && <Check className="size-3.5" />}{l}</button>)}</div>
    </BottomSheet>
  )
}

function EditSheet({ p, onClose, onDone }) {
  const birthIso = p.birthIso || (/^\d{2}\.\d{2}\.\d{4}$/.test(p.birth || '') ? p.birth.split('.').reverse().join('-') : '')
  const [f, setF] = useState({ name: p.name, phone: p.phone, email: p.email || '', city: p.city, address: p.address || '', birth: birthIso, gender: p.gender || 'Erkak' })
  const [tried, setTried] = useState(false)
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const errs = { name: f.name.trim().length < 3, phone: f.phone.replace(/\D/g, '').length < 9 }
  const save = () => {
    setTried(true)
    if (errs.name || errs.phone) return
    const today = tashkentToday()
    const birth = f.birth && f.birth <= today ? f.birth : ''
    let age = p.age
    if (birth) {
      let y = Number(today.slice(0, 4)) - Number(birth.slice(0, 4))
      if (today.slice(5) < birth.slice(5)) y -= 1
      age = `${y} yosh`
    }
    patchBemor(p.id, { ...f, name: f.name.trim(), birthIso: birth, birth: birth ? birth.split('-').reverse().join('.') : p.birth, age })
    onDone()
  }
  return (
    <BottomSheet title="Tahrirlash" onClose={onClose} footer={<button type="button" onClick={save} className="h-12 flex-1 rounded-xl bg-[#0b8a95] text-[14px] font-semibold text-white">Saqlash</button>}>
      <div className="mt-2 flex flex-col gap-2 pb-2">
        <label className="text-[12px] text-muted">Ism, familiya<input value={f.name} onChange={set('name')} className={`mt-1 ${input(tried && errs.name)}`} /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[12px] text-muted">Tug‘ilgan sana<input type="date" max={tashkentToday()} value={f.birth} onChange={set('birth')} className={`mt-1 ${input(false)}`} /></label>
          <label className="text-[12px] text-muted">Jinsi<select value={f.gender} onChange={set('gender')} className={`mt-1 ${input(false)} bg-white`}><option>Erkak</option><option>Ayol</option></select></label>
        </div>
        <label className="text-[12px] text-muted">Telefon
          <PhoneInput className={`mt-1 ${input(tried && errs.phone)}`} value={f.phone} onChange={(v) => setF((s) => ({ ...s, phone: toE164(v) || extractUzLocalDigits(v) }))} valueMode="e164" invalid={tried && errs.phone} />
          {tried && errs.phone && <p className="mt-1 text-[11px] text-sale">{PHONE_INCOMPLETE_MSG}</p>}
        </label>
        <label className="text-[12px] text-muted">Email<input type="email" value={f.email} onChange={set('email')} className={`mt-1 ${input(false)}`} /></label>
        <label className="text-[12px] text-muted">Shahar<select value={f.city} onChange={set('city')} className={`mt-1 ${input(false)} bg-white`}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="text-[12px] text-muted">Manzil<input value={f.address} onChange={set('address')} className={`mt-1 ${input(false)}`} /></label>
      </div>
    </BottomSheet>
  )
}

function MedicalSheet({ p, onClose, onDone }) {
  const [f, setF] = useState(() => medicalForm(p))
  return (
    <BottomSheet title="Tibbiy ma’lumotlar" onClose={onClose} footer={<button type="button" onClick={() => { saveMedical(p, f); onDone() }} className="h-12 flex-1 rounded-xl bg-[#0b8a95] text-[14px] font-semibold text-white">Saqlash</button>}>
      <div className="mt-2 pb-2"><MedicalFields f={f} setF={setF} compact /></div>
    </BottomSheet>
  )
}

function ToothSheet({ p, n, onClose, onPlan }) {
  const cur = p.teeth?.[n] || 'healthy'
  const set = (s) => patchBemor(p.id, { teeth: { ...p.teeth, [n]: s } })
  return (
    <BottomSheet title={`${n}-tish`} onClose={onClose}>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {TOOTH_STATES.map(([k, l]) => (
          <button key={k} type="button" aria-pressed={cur === k} onClick={() => set(k)} className={`flex flex-col items-center gap-1 rounded-xl border py-2 text-[11px] font-medium ${cur === k ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`}>
            <Tooth n={n} state={k} lower={[3, 4, 7, 8].includes(Math.floor(n / 10))} className="h-[34px] w-[19px]" /> {l}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => onPlan(PLAN_OF[cur]?.[1] || 'Davolash')} className="mb-2 mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e6f4f3] text-[13.5px] font-semibold text-[#0b6d73]"><CalendarDays className="size-4" /> Shu tish uchun qabul belgilash</button>
    </BottomSheet>
  )
}

function MenuSheet({ p, onClose, onEdit, onStatus, onCopy, onRemove }) {
  const [confirm, setConfirm] = useState(false)
  const row = 'flex h-12 w-full items-center gap-3 rounded-xl px-2 text-[14px] font-medium text-ink active:bg-page'
  return (
    <BottomSheet title="Amallar" onClose={onClose}>
      <div className="mt-1 flex flex-col pb-2">
        <button type="button" onClick={onEdit} className={row}><PencilLine className="size-5 text-sea" /> Ma’lumotlarni tahrirlash</button>
        <button type="button" onClick={onCopy} className={row}><Copy className="size-5 text-sea" /> Ma’lumotni nusxalash</button>
        <p className="mt-2 px-2 text-[12.5px] font-semibold text-muted">Holat</p>
        <div className="mt-2 flex flex-wrap gap-2 px-2">
          {STATUS_TABS.map((s) => <button key={s} type="button" aria-pressed={p.status === s} onClick={() => onStatus(s)} className={`h-9 rounded-xl px-3 text-[12.5px] font-semibold ${p.status === s ? 'ring-2 ring-sea' : ''} ${MSTATUS[s]}`}>{s}</button>)}
        </div>
        {confirm ? (
          <div className="mt-3 flex gap-2 px-2">
            <button type="button" onClick={() => setConfirm(false)} className="h-11 flex-1 rounded-xl border border-line text-[13.5px] font-semibold text-ink">Bekor qilish</button>
            <button type="button" onClick={onRemove} className="h-11 flex-1 rounded-xl bg-sale text-[13.5px] font-semibold text-white">Ha, o‘chirish</button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirm(true)} className={`${row} mt-2 text-sale`}><Trash2 className="size-5" /> Bemorni o‘chirish</button>
        )}
      </div>
    </BottomSheet>
  )
}
