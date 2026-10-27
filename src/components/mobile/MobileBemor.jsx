import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, MoreVertical, Camera, Phone, CalendarDays, CreditCard, PencilLine, AlertCircle, ChevronRight, CheckCircle2, Wallet,
  PieChart, PlusCircle, Check, Trash2, Copy, ImagePlus, FileText, Clock, Stethoscope,
} from 'lucide-react'
import { CITIES, getBemor, patchBemor, removeBemor, som, useBemorlar } from '../../bemorData'
import { MobileToast } from './parts'
import { BottomSheet } from './MobileSeminars'
import { Lightbox } from './MobileCommunity'
import { DOCTORS, Face, MSTATUS, STATUS_TABS, TOOTH_STATES, TeethChart, Tooth, fmtDate, isoToDots, todayDots, toothName } from './bemorParts'

const TABS = [['umumiy', 'Umumiy'], ['tish', 'Tish kartasi'], ['reja', 'Rejalar'], ['tashrif', 'Tashriflar'], ['tolov', 'To‘lovlar'], ['rentgen', 'Rentgen']]
const KINDS = ['Konsultatsiya', 'Davolash', 'Professional gigiyena', 'Implant', 'Ortodontiya', 'Protezlash', 'Tish olish']
const TIMES = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00']
const METHODS = ['Naqd', 'Karta', 'Click / Payme']
const PLAN_OF = { caries: ['Karies davolash (plomba)', 'Davolash'], missing: ['Implant yoki protez', 'Implant'], endo: ['Endo nazorat rentgeni', 'Konsultatsiya'] }

export default function MobileBemor() {
  const { id } = useParams()
  return <BemorView key={id} id={id} />
}

function BemorView({ id }) {
  useBemorlar()
  const p = getBemor(id)
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState('umumiy')
  const [sheet, setSheet] = useState(() => (location.state?.visit ? { visit: {} } : null))
  const [zoom, setZoom] = useState(null)
  const [toast, setToast] = useState(() => location.state?.toast || '')
  const closeToast = useCallback(() => setToast(''), [])
  const photoRef = useRef(null)
  const docRef = useRef(null)

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
  const read = (file, fn) => {
    const r = new FileReader()
    r.onload = () => fn(r.result)
    r.readAsDataURL(file)
  }
  const onPhoto = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) read(file, (src) => { patchBemor(p.id, { photo: src }); setToast('Rasm yangilandi') })
  }
  const onDoc = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) read(file, (src) => { patchBemor(p.id, { docs: [{ name: file.name.replace(/\.[^.]+$/, ''), date: fmtDate(todayDots()), image: src }, ...(p.docs || [])] }); setToast('Rentgen yuklandi') })
  }
  const medical = [...p.allergy.map((a) => `${a} allergiyasi`), ...p.diseases]
  const payments = p.payments || (p.paid ? [{ date: fmtDate(p.last) || '—', sum: p.paid, method: 'Naqd' }] : [])
  const pct = p.total ? Math.round((p.paid / p.total) * 100) : 100
  const visits = p.visits || []
  const planned = visits.filter((v) => v.done === false)
  const plans = Object.entries(p.teeth || {}).filter(([, s]) => PLAN_OF[s]).map(([n, s]) => ({ n, s, title: PLAN_OF[s][0], kind: PLAN_OF[s][1] }))
  const images = (p.docs || []).filter((d) => d.image)

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
              <Face p={p} className="size-[84px]" text="text-[24px]" />
              <span className="absolute bottom-0 right-0 grid size-7 place-items-center rounded-full bg-[#0b8a95] text-white ring-2 ring-white"><Camera className="size-3.5" /></span>
            </button>
            <input ref={photoRef} type="file" accept="image/*" onChange={onPhoto} className="hidden" />
            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-2 text-[18px] font-extrabold leading-tight text-[#0d2a4a]">{p.name}</h2>
              <div className="mt-1 flex items-center justify-between gap-1.5">
                <p className="truncate text-[12px] text-muted">ID: <b className="font-semibold text-ink">#{p.code}</b></p>
                <span className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-semibold ${MSTATUS[p.status]}`}><CheckCircle2 className="size-3.5" /> {p.status === 'Faol' ? 'Faol bemor' : p.status}</span>
              </div>
              <p className="mt-0.5 text-[12px] text-ink-2">{p.age} <span className="text-line">•</span> {p.birth} <span className="text-line">•</span> {p.gender}</p>
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
                <b className="block text-[13px] font-bold text-[#d23b45]">{p.allergy.length ? 'Allergiya' : 'Kasalliklar'}</b>
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
              <b className="mt-1.5 block whitespace-nowrap text-[17px] font-extrabold tracking-tight text-[#0b6d73]">{som(p.debt)}</b>
              <span className="mt-1 block text-[10.5px] text-muted">Umumiy: {som(p.total)}</span>
              <span className="block text-[10.5px] text-muted">To‘langan: {som(p.paid)}</span>
            </button>
            <button type="button" onClick={() => setSheet('pay')} className="relative rounded-2xl bg-white p-3 text-left shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
              <span className="flex items-center gap-2"><span className={`grid size-9 place-items-center rounded-xl ${p.debt ? 'bg-[#fdecec] text-[#e0454f]' : 'bg-[#e6f8ec] text-[#1c9a52]'}`}><PieChart className="size-5" /></span><span className="text-[12px] text-muted">To‘lov holati</span></span>
              <b className={`mt-1.5 block text-[17px] font-extrabold ${p.debt ? 'text-[#e0454f]' : 'text-[#1c9a52]'}`}>{p.debt ? 'Qarzdor' : 'To‘langan'}</b>
              <span className="mt-1 block text-[10.5px] text-muted">Qarz: {som(p.debt)}</span>
              <span className="block text-[10.5px] text-muted">To‘langan: {pct}%</span>
              <ChevronRight className="absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted" />
            </button>
          </div>
        )}

        {tab === 'tolov' && (
          <Card title="To‘lovlar tarixi" action={<button type="button" onClick={() => setSheet('pay')} className="text-[12px] font-semibold text-sea">+ To‘lov</button>}>
            <div className="h-2 overflow-hidden rounded-full bg-[#eef1f5]"><span className="block h-full rounded-full bg-[#0b8a95]" style={{ width: `${pct}%` }} /></div>
            <p className="mt-1 text-[11px] text-muted">{pct}% to‘langan</p>
            <div className="mt-2 flex flex-col divide-y divide-line/70">
              {payments.map((x, i) => (
                <p key={i} className="flex items-center gap-2.5 py-2.5 text-[12.5px]">
                  <span className="grid size-9 place-items-center rounded-xl bg-[#e6f8ec] text-[#1c9a52]"><CreditCard className="size-4" /></span>
                  <span className="min-w-0 flex-1"><b className="block font-semibold text-ink">{x.method}</b><span className="text-[11px] text-muted">{x.date}</span></span>
                  <b className="font-bold text-[#1c9a52]">+{som(x.sum)}</b>
                </p>
              ))}
              {!payments.length && <p className="py-3 text-[12px] text-muted">Hali to‘lov yo‘q</p>}
            </div>
          </Card>
        )}

        {(tab === 'umumiy' || tab === 'tashrif') && (
          <Card title={tab === 'umumiy' ? 'So‘nggi tashriflar' : `Tashriflar (${visits.length})`} action={tab === 'umumiy' && visits.length > 0 && <button type="button" onClick={() => setTab('tashrif')} className="text-[12px] font-semibold text-sea">Barchasini ko‘rish</button>}>
            <Timeline list={tab === 'umumiy' ? visits.slice(0, 4) : visits} onOpen={(i) => setSheet({ visitInfo: i })} />
            {!visits.length && <p className="text-[12px] text-muted">Hali tashrif yo‘q. Pastdagi tugma orqali qabul qo‘shing.</p>}
          </Card>
        )}

        {tab === 'reja' && (
          <>
            <Card title="Rejalashtirilgan qabullar">
              {planned.length ? <Timeline list={planned} offset={(v) => visits.indexOf(v)} onOpen={(i) => setSheet({ visitInfo: i })} /> : <p className="text-[12px] text-muted">Rejalashtirilgan qabul yo‘q</p>}
            </Card>
            <Card title="Davolash rejasi">
              <div className="flex flex-col gap-1.5">
                {plans.map((x) => (
                  <div key={x.n} className="flex items-center gap-2.5 rounded-xl border border-line/70 p-2">
                    <Tooth n={Number(x.n)} state={x.s} className="h-[30px] w-[17px]" />
                    <span className="min-w-0 flex-1"><b className="block text-[12.5px] font-semibold text-ink">{x.title}</b><span className="text-[11px] text-muted">{x.n}-tish · {toothName[x.s]}</span></span>
                    <button type="button" onClick={() => setSheet({ visit: { kind: x.kind, tooth: x.n } })} className="h-8 shrink-0 rounded-lg bg-[#e6f4f3] px-2.5 text-[11.5px] font-semibold text-[#0b6d73]">Qabulga</button>
                  </div>
                ))}
                {!plans.length && <p className="text-[12px] text-muted">Tish kartasida davolash talab qiladigan tish yo‘q</p>}
              </div>
            </Card>
          </>
        )}

        {tab === 'rentgen' && (
          <Card title={`Rentgen va hujjatlar (${(p.docs || []).length})`} action={<button type="button" onClick={() => docRef.current?.click()} className="text-[12px] font-semibold text-sea">+ Yuklash</button>}>
            <div className="grid grid-cols-2 gap-2">
              {(p.docs || []).map((d, i) => (
                <button key={d.name + i} type="button" onClick={() => d.image && setZoom(images.indexOf(d))} className="text-left">
                  {d.image ? <img src={d.image} alt={d.name} className="h-[100px] w-full rounded-xl object-cover" /> : <span className="grid h-[100px] place-items-center rounded-xl bg-[#f3f7fa] text-muted"><FileText className="size-8" /></span>}
                  <b className="mt-1 block truncate text-[12px] font-semibold text-ink">{d.name}</b>
                  <span className="text-[10.5px] text-muted">{d.date}</span>
                </button>
              ))}
              <button type="button" onClick={() => docRef.current?.click()} className="grid h-[100px] place-items-center rounded-xl border-2 border-dashed border-[#a9d7d3] bg-[#f3faf9] text-sea"><span className="flex flex-col items-center gap-1 text-[12px] font-semibold"><ImagePlus className="size-6" /> Rentgen yuklash</span></button>
            </div>
            <input ref={docRef} type="file" accept="image/*" onChange={onDoc} className="hidden" />
          </Card>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-white/95 px-3.5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <button type="button" onClick={() => setSheet({ visit: {} })} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#0b8a95] text-[15px] font-semibold text-white shadow-[0_8px_18px_rgb(11_138_149/0.3)] active:scale-[0.99]">
          <PlusCircle className="size-5" /> Yangi qabul qo‘shish
        </button>
      </div>

      {sheet?.visit && <VisitSheet p={p} preset={sheet.visit} onClose={() => setSheet(null)} onDone={(msg) => { setSheet(null); setToast(msg) }} />}
      {sheet?.visitInfo !== undefined && <VisitInfo p={p} i={sheet.visitInfo} onClose={() => setSheet(null)} onToast={setToast} />}
      {sheet === 'pay' && <PaySheet p={p} payments={payments} onClose={() => setSheet(null)} onDone={(msg) => { setSheet(null); setToast(msg) }} />}
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
      {zoom !== null && <Lightbox images={images.map((d) => d.image)} index={zoom} onClose={() => setZoom(null)} />}

      <MobileToast text={toast} onClose={closeToast} bottom={84} />
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

function Timeline({ list, onOpen, offset = (_, i) => i }) {
  return (
    <ol className="flex flex-col">
      {list.map((v, i) => {
        const idx = offset(v, i)
        const dot = v.done === false ? 'border-[#3b82f6] bg-white' : i === 0 ? 'border-[#0b8a95] bg-[#0b8a95]' : 'border-[#b8c4d0] bg-[#b8c4d0]'
        return (
          <li key={idx} className="relative">
            {i < list.length - 1 && <span className="absolute bottom-0 left-[6px] top-5 w-px bg-line" />}
            <button type="button" onClick={() => onOpen(idx)} className="flex w-full items-center gap-3 py-2 text-left">
              <span className={`relative z-10 size-[13px] shrink-0 self-start rounded-full border-[3px] ${dot}`} style={{ marginTop: 3 }} />
              <span className="min-w-0 flex-1">
                <span className="block text-[11.5px] text-ink-2">{fmtDate(v.date)}{v.time ? `, ${v.time}` : ''}{v.done === false && <span className="ml-1.5 rounded bg-[#e8f0fe] px-1 text-[10px] font-semibold text-[#3b82f6]">Rejada</span>}</span>
                <b className="block text-[13px] font-bold text-ink">{v.kind}</b>
                <span className="block truncate text-[11px] text-muted">{v.note || (v.tooth ? `${v.tooth}-tish` : '—')}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <img src={DOCTORS[v.doctor] || ''} alt="" className="size-7 rounded-full object-cover object-top" />
                <span className="text-[11.5px] font-medium text-ink">{v.doctor}</span>
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
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10)
  const [date, setDate] = useState(tomorrow)
  const [time, setTime] = useState('')
  const [kind, setKind] = useState(preset.kind || '')
  const [tooth, setTooth] = useState(preset.tooth || '')
  const [doctor, setDoctor] = useState('')
  const [note, setNote] = useState('')
  const [tried, setTried] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const toothBad = tooth && !/^[1-8][1-8]$/.test(tooth)
  const ok = date >= today && time && kind && !toothBad
  const save = () => {
    setTried(true)
    if (!ok) return
    const dots = isoToDots(date)
    patchBemor(p.id, {
      visits: [{ date: dots, time, kind, tooth: tooth || undefined, doctor, note: note.trim(), done: false }, ...(p.visits || [])],
      next: dots,
      status: p.status === 'Yangi' || p.status === 'Nofaol' ? 'Davolanishda' : p.status,
    })
    onDone(`Qabul belgilandi: ${fmtDate(dots)}, ${time}`)
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
      <p className="mt-3 text-[13px] font-semibold text-ink">Shifokor</p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {Object.entries(DOCTORS).map(([d, src]) => (
          <button key={d} type="button" aria-pressed={doctor === d} onClick={() => setDoctor(d)} className={`flex shrink-0 items-center gap-1.5 rounded-xl border py-1 pl-1 pr-2.5 text-[12px] font-medium ${doctor === d ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink'}`}>
            <img src={src} alt="" className="size-7 rounded-full object-cover object-top" /> {d}
          </button>
        ))}
      </div>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Izoh (ixtiyoriy)" className="mb-2 mt-3 w-full resize-none rounded-xl border border-line px-3 py-2.5 text-[13.5px] outline-none focus:border-sea" />
    </BottomSheet>
  )
}

function VisitInfo({ p, i, onClose, onToast }) {
  const v = p.visits[i]
  if (!v) return null
  const toggle = () => {
    patchBemor(p.id, { visits: p.visits.map((x, j) => (j === i ? { ...x, done: x.done === false } : x)), last: v.done === false ? v.date : p.last })
    onToast(v.done === false ? 'Qabul bajarildi deb belgilandi' : 'Qabul rejaga qaytarildi')
    onClose()
  }
  const remove = () => {
    patchBemor(p.id, { visits: p.visits.filter((_, j) => j !== i) })
    onToast('Tashrif o‘chirildi')
    onClose()
  }
  return (
    <BottomSheet title={v.kind} onClose={onClose}>
      <div className="mt-2 flex flex-col divide-y divide-line/70 rounded-2xl border border-line/70">
        {[[CalendarDays, 'Sana', `${fmtDate(v.date)}${v.time ? `, ${v.time}` : ''}`], [Stethoscope, 'Shifokor', v.doctor], [Clock, 'Holat', v.done === false ? 'Rejada' : 'Bajarilgan'], ...(v.tooth ? [[FileText, 'Tish', `${v.tooth}-tish`]] : []), ...(v.note ? [[FileText, 'Izoh', v.note]] : [])].map(([Icon, k, val]) => (
          <p key={k} className="flex items-center gap-2 px-3 py-2.5 text-[13px]"><Icon className="size-4 text-sea" /><span className="text-muted">{k}</span><span className="ml-auto text-right font-semibold text-ink">{val}</span></p>
        ))}
      </div>
      <div className="mb-2 mt-3 grid grid-cols-[1fr_auto] gap-2">
        <button type="button" onClick={toggle} className="h-11 rounded-xl bg-[#0b8a95] text-[13.5px] font-semibold text-white">{v.done === false ? 'Bajarildi deb belgilash' : 'Rejaga qaytarish'}</button>
        <button type="button" onClick={remove} aria-label="Tashrifni o‘chirish" className="grid size-11 place-items-center rounded-xl border border-line text-sale"><Trash2 className="size-5" /></button>
      </div>
    </BottomSheet>
  )
}

function PaySheet({ p, payments, onClose, onDone }) {
  const [sum, setSum] = useState(p.debt ? String(p.debt) : '')
  const [method, setMethod] = useState('Naqd')
  const [service, setService] = useState('')
  const [tried, setTried] = useState(false)
  const n = Number(sum.replace(/\D/g, ''))
  const extra = Number(service.replace(/\D/g, ''))
  const ok = n > 0 && n <= p.debt + extra
  const save = () => {
    setTried(true)
    if (!ok) return
    patchBemor(p.id, { total: p.total + extra, paid: p.paid + n, payments: [{ date: fmtDate(todayDots()), sum: n, method }, ...payments] })
    onDone(`${som(n)} qabul qilindi`)
  }
  return (
    <BottomSheet title="To‘lov qabul qilish" onClose={onClose} footer={<button type="button" onClick={save} className="h-12 flex-1 rounded-xl bg-[#0b8a95] text-[14px] font-semibold text-white">Qabul qilish{n ? ` · ${som(n)}` : ''}</button>}>
      <div className="mt-2 grid grid-cols-3 gap-2 rounded-2xl bg-[#f3f7fa] p-3 text-center">
        {[['Umumiy', p.total, 'text-ink'], ['To‘langan', p.paid, 'text-[#1c9a52]'], ['Qarz', p.debt, 'text-[#e0454f]']].map(([l, v, c]) => <p key={l}><span className="block text-[11px] text-muted">{l}</span><b className={`text-[12.5px] ${c}`}>{som(v)}</b></p>)}
      </div>
      <label className="mt-3 block text-[12px] text-muted">Yangi xizmat summasi (ixtiyoriy)<input value={service} onChange={(e) => setService(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Masalan, 500000" className={`mt-1 ${input(false)}`} /></label>
      <label className="mt-2 block text-[12px] text-muted">To‘lov summasi<input value={sum} onChange={(e) => setSum(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Summa" className={`mt-1 ${input(tried && !ok)}`} /></label>
      {tried && !ok && <p className="mt-1 text-[11.5px] text-sale">{n ? 'Summa qarzdan oshmasligi kerak' : 'Summani kiriting'}</p>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {[p.debt + extra, 500000, 1000000].filter((x, i, a) => x > 0 && a.indexOf(x) === i).map((x) => <button key={x} type="button" onClick={() => setSum(String(x))} className="h-8 rounded-lg bg-page px-2.5 text-[12px] text-ink-2">{som(x)}</button>)}
      </div>
      <p className="mt-3 text-[13px] font-semibold text-ink">To‘lov usuli</p>
      <div className="mb-2 mt-2 flex flex-wrap gap-1.5">{METHODS.map((m) => <button key={m} type="button" aria-pressed={method === m} onClick={() => setMethod(m)} className={chip(method === m)}>{method === m && <Check className="size-3.5" />}{m}</button>)}</div>
    </BottomSheet>
  )
}

function EditSheet({ p, onClose, onDone }) {
  const [f, setF] = useState({ name: p.name, phone: p.phone, email: p.email || '', city: p.city, address: p.address || '' })
  const [tried, setTried] = useState(false)
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const errs = { name: f.name.trim().length < 3, phone: f.phone.replace(/\D/g, '').length < 9 }
  const save = () => {
    setTried(true)
    if (errs.name || errs.phone) return
    patchBemor(p.id, { ...f, name: f.name.trim() })
    onDone()
  }
  return (
    <BottomSheet title="Tahrirlash" onClose={onClose} footer={<button type="button" onClick={save} className="h-12 flex-1 rounded-xl bg-[#0b8a95] text-[14px] font-semibold text-white">Saqlash</button>}>
      <div className="mt-2 flex flex-col gap-2 pb-2">
        <label className="text-[12px] text-muted">Ism, familiya<input value={f.name} onChange={set('name')} className={`mt-1 ${input(tried && errs.name)}`} /></label>
        <label className="text-[12px] text-muted">Telefon<input value={f.phone} onChange={set('phone')} inputMode="tel" className={`mt-1 ${input(tried && errs.phone)}`} /></label>
        <label className="text-[12px] text-muted">Email<input type="email" value={f.email} onChange={set('email')} className={`mt-1 ${input(false)}`} /></label>
        <label className="text-[12px] text-muted">Shahar<select value={f.city} onChange={set('city')} className={`mt-1 ${input(false)} bg-white`}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="text-[12px] text-muted">Manzil<input value={f.address} onChange={set('address')} className={`mt-1 ${input(false)}`} /></label>
      </div>
    </BottomSheet>
  )
}

function MedicalSheet({ p, onClose, onDone }) {
  const [allergy, setAllergy] = useState(p.allergy.join(', '))
  const [diseases, setDiseases] = useState(p.diseases.join(', '))
  const split = (s) => s.split(',').map((x) => x.trim()).filter(Boolean)
  return (
    <BottomSheet title="Tibbiy ma’lumotlar" onClose={onClose} footer={<button type="button" onClick={() => { patchBemor(p.id, { allergy: split(allergy), diseases: split(diseases) }); onDone() }} className="h-12 flex-1 rounded-xl bg-[#0b8a95] text-[14px] font-semibold text-white">Saqlash</button>}>
      <label className="mt-2 block text-[12px] text-muted">Allergiya (vergul bilan)<input value={allergy} onChange={(e) => setAllergy(e.target.value)} className={`mt-1 ${input(false)}`} /></label>
      <label className="mt-2 block text-[12px] text-muted">Kasalliklar (vergul bilan)<input value={diseases} onChange={(e) => setDiseases(e.target.value)} className={`mt-1 ${input(false)}`} /></label>
      <p className="mt-3 text-[12px] text-muted">Doimiy dorilar: <b className="text-ink">{p.meds || 'Yo‘q'}</b></p>
      {p.note && <p className="mb-2 mt-2 rounded-xl bg-[#fff8e8] p-2.5 text-[12px] leading-snug text-[#8a5a00]">{p.note}</p>}
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
