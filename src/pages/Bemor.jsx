import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { tabFromUrl } from '../components/crm/patientRecords'
import {
  AlertTriangle, Calendar, Camera, ChevronRight, MapPin, Phone, Send,
} from 'lucide-react'
import { getBemor, patchBemor, som, statusClass, useBemorlar } from '../bemorData'
import AppointmentForm from '../components/crm/AppointmentForm'
import PaymentForm from '../components/crm/PaymentForm'
import { savePatientPayment } from '../components/crm/syncPatientRecords'
import DentalChart, { ToothArt } from '../components/teeth/DentalChart'
import { CONDITIONS } from '../components/ToothChart'
import { TOOTH_STATUS_LABELS } from '../teeth/toothArt'
import { tashkentToday } from '../tashkentDate'
import {
  DocThumb, DocsPanel, MedicalCard, PaymentsPanel, PlansPanel, SaveErrorToast, VisitsPanel, useDocUpload, usePatientRecords,
} from '../components/crm/PatientTabs'
import { VISIT_STATUS, addPatientDoc, afterVisitSaved, docDate, niceDate, openPatientFile, isPdf, setPatientPhoto, usePatientPhoto } from '../components/crm/patientRecords'

const DESK_TABS = { reja: 'davolash', plan: 'davolash', davolash: 'davolash', tish: 'tish', tashrif: 'tashrif', tolov: 'tolov', hujjat: 'hujjat', rentgen: 'hujjat', tibbiy: 'tibbiy', umumiy: 'umumiy' }

const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
const BABY_U = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65]
const BABY_L = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75]
const ageOf = (iso) => {
  if (!iso) return ''
  const t = tashkentToday()
  let a = Number(t.slice(0, 4)) - Number(iso.slice(0, 4))
  if (t.slice(5) < iso.slice(5)) a -= 1
  return a >= 0 ? `${a} yosh` : ''
}
const birthIsoOf = (p) => p.birthIso || (/^\d{2}\.\d{2}\.\d{4}$/.test(p.birth || '') ? p.birth.split('.').reverse().join('-') : '')
const inputCls = 'h-8 w-full rounded-lg border border-line px-2 text-[12.5px] outline-none focus:border-sea'

export default function Bemor() {
  const { id } = useParams()
  return <BemorView key={id} id={id} />
}

function BemorView({ id }) {
  const patients = useBemorlar()
  const p = getBemor(id)
  const rec = usePatientRecords(p)
  const photo = usePatientPhoto(p)
  const [params] = useSearchParams()
  const [tab, setTab] = useState(() => tabFromUrl(params.get('tab'), DESK_TABS) || 'umumiy')
  useEffect(() => {
    const next = tabFromUrl(params.get('tab'), DESK_TABS)
    if (next) setTab(next)
  }, [params])
  const focusPlan = params.get('plan') || ''
  const focusVisit = params.get('visit') || ''
  const [dent, setDent] = useState('doimiy')
  const [picked, setPicked] = useState(null)
  const [edit, setEdit] = useState(false)
  const [visit, setVisit] = useState(false)
  const [pay, setPay] = useState(false)
  const [form, setForm] = useState({})
  const [formErr, setFormErr] = useState('')
  const [toast, setToast] = useState('')
  const [photoErr, setPhotoErr] = useState('')
  const toastTimer = useRef(0)
  const photoRef = useRef(null)
  const flash = useCallback((text) => {
    setToast(text)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2600)
  }, [])
  const docs = useDocUpload(p, addPatientDoc, flash)

  if (!p) return <p className="pt-6 text-[13px] text-muted">Bemor topilmadi.</p>

  const m = rec.money
  const visits = rec.visits

  const setTooth = (n, next) => {
    const teeth = { ...(p.teeth || {}) }
    if (next === 'healthy') delete teeth[n]
    else teeth[n] = next
    patchBemor(p.id, { teeth })
  }

  const startEdit = () => {
    setForm({ name: p.name || '', birth: birthIsoOf(p), gender: p.gender || 'Erkak', phone: p.phone || '', email: p.email || '', city: p.city || '', address: p.address || '' })
    setFormErr('')
    setEdit(true)
  }
  const saveInfo = () => {
    if (form.name.trim().length < 3) return setFormErr('Ism kamida 3 harf bo‘lsin.')
    if (form.phone.replace(/\D/g, '').length < 9) return setFormErr('Telefon raqami to‘liq emas.')
    if (form.birth && form.birth > tashkentToday()) return setFormErr('Tug‘ilgan sana kelajakda bo‘lishi mumkin emas.')
    patchBemor(p.id, {
      ...form,
      name: form.name.trim(),
      birthIso: form.birth,
      birth: form.birth ? form.birth.split('-').reverse().join('.') : '',
      age: form.birth ? ageOf(form.birth) : p.age,
    })
    setEdit(false)
    flash('Ma’lumotlar saqlandi')
  }

  const onPhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoErr('')
    try {
      await setPatientPhoto(p, file)
      flash('Rasm yangilandi')
    } catch (err) {
      setPhotoErr(err.message || 'Rasmni yuklab bo‘lmadi')
    }
  }

  const upper = dent === 'doimiy' ? UPPER : BABY_U
  const lower = dent === 'doimiy' ? LOWER : BABY_L

  return (
    <div className="pb-6 pt-3">
      {docs.input}
      <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} data-testid="photo-input" />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1 text-[12.5px] text-muted">
          <Link to="/bemorlar" className="hover:text-sea">Bemorlar</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-ink-2">Bemor profili</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setVisit(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sea px-3 text-[12.5px] font-semibold text-white"><Calendar className="size-3.5" /> Qabul qo‘shish</button>
          <button onClick={() => setPay(true)} className="h-9 rounded-lg border border-line bg-white px-3 text-[12.5px] font-semibold">To‘lov</button>
          <button onClick={() => { setTab('umumiy'); startEdit() }} className="h-9 rounded-lg border border-line bg-white px-3 text-[12.5px] font-semibold">Tahrirlash</button>
        </div>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-start gap-4">
          <button type="button" onClick={() => photoRef.current?.click()} aria-label="Bemor rasmini o‘zgartirish" title="Rasmni o‘zgartirish" className="relative shrink-0">
            <Face key={photo || 'none'} src={photo} name={p.name} />
            <span className="absolute bottom-0 right-0 grid size-6 place-items-center rounded-full bg-white shadow-card"><Camera className="size-3 text-sea" /></span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="text-[20px] font-bold text-ink">{p.name}</h1>
              <span className="text-[12px] text-muted">ID: #{p.code}</span>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-2">
              <span>{p.age}{p.birth ? ` (${p.birth})` : ''}</span>
              <span>{p.gender}</span>
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-2">
              <span className="inline-flex items-center gap-1"><Phone className="size-3.5 text-sea" /> {p.phone}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="size-3.5 text-sea" /> {p.city}</span>
              {p.telegram && <span className="inline-flex items-center gap-1"><Send className="size-3.5 text-sea" /> Telegram: {p.telegram}</span>}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(p.tags || []).map((t) => (
                <span key={t} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${t === 'Faol bemor' ? statusClass.Faol : t === 'VIP' ? 'bg-[#fff3d6] text-[#b07d00]' : 'bg-sea-50 text-sea'}`}>{t}</span>
              ))}
            </div>
            {photoErr && <p role="alert" className="mt-2 text-[12px] text-[#e11d48]">{photoErr}</p>}
          </div>
          <div className="flex min-w-[220px] flex-1 flex-wrap gap-2 lg:max-w-[460px]">
            {p.allergy?.length > 0 && (
              <button onClick={() => setTab('tibbiy')} className="min-w-[160px] flex-1 rounded-xl bg-[#fff1f1] p-2.5 text-left">
                <span className="flex items-center justify-between text-[12px] font-bold text-[#d4524e]"><span className="inline-flex items-center gap-1"><AlertTriangle className="size-3.5" /> Allergiya</span><ChevronRight className="size-3.5" /></span>
                <span className="mt-1 block text-[11.5px] text-[#d4524e]">{p.allergy.join(', ')}</span>
              </button>
            )}
            {p.diseases?.length > 0 && (
              <button onClick={() => setTab('tibbiy')} className="min-w-[160px] flex-1 rounded-xl bg-[#fff8e8] p-2.5 text-left">
                <span className="flex items-center justify-between text-[12px] font-bold text-[#c4841d]"><span className="inline-flex items-center gap-1"><AlertTriangle className="size-3.5" /> Kasalliklar</span><ChevronRight className="size-3.5" /></span>
                <span className="mt-1 block text-[11.5px] text-[#c4841d]">{p.diseases.join(', ')}</span>
              </button>
            )}
            <div className="min-w-[220px] flex-1 rounded-xl border border-line p-2.5">
              <div className="flex items-center justify-between text-[12px]"><span className="font-bold">Moliyaviy holat</span><button onClick={() => setTab('tolov')} className="font-semibold text-sea">Batafsil</button></div>
              <Row k="Umumiy summa" v={som(m.total)} />
              <Row k="To‘langan" v={som(m.paid)} green />
              <Row k="Qarz" v={som(m.debt)} red />
            </div>
          </div>
        </div>
      </section>

      <div className="mt-3 flex gap-4 overflow-x-auto border-b border-line text-[13px] font-semibold">
        {[
          ['umumiy', 'Umumiy'],
          ['tish', 'Tish kartasi'],
          ['davolash', `Davolash rejalari${rec.plans.length ? ` (${rec.plans.length})` : ''}`],
          ['tashrif', `Tashriflar${visits.length ? ` (${visits.length})` : ''}`],
          ['tolov', 'To‘lovlar'],
          ['hujjat', 'Hujjatlar / Rentgen'],
          ['tibbiy', 'Tibbiy'],
        ].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`shrink-0 border-b-2 pb-2 ${tab === k ? 'border-sea text-sea' : 'border-transparent text-muted'}`}>{label}</button>
        ))}
      </div>


      {(tab === 'umumiy' || tab === 'tish') && (
        <div className="bemor-mid mt-3">
          <section className="rounded-2xl bg-white p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[14px] font-bold">Tish kartasi (FDI)</h2>
              <div className="flex rounded-full bg-[#f3f6fb] p-0.5 text-[12px] font-semibold">
                <button onClick={() => { setDent('doimiy'); setPicked(null) }} className={`rounded-full px-3 py-1 ${dent === 'doimiy' ? 'bg-sea text-white' : 'text-ink-2'}`}>Doimiy tishlar</button>
                <button onClick={() => { setDent('sut'); setPicked(null) }} className={`rounded-full px-3 py-1 ${dent === 'sut' ? 'bg-sea text-white' : 'text-ink-2'}`}>Sut tishlar</button>
              </div>
            </div>
            <DentalChart
              className="mt-3"
              upper={upper}
              lower={lower}
              stateOf={(n) => p.teeth?.[n]}
              selected={picked}
              onPick={(n) => setPicked(picked === n ? null : n)}
            />
            <ToothPanel n={picked} state={picked ? p.teeth?.[picked] || 'healthy' : null} teeth={p.teeth} onSet={(k) => setTooth(picked, k)} onClose={() => setPicked(null)} />
          </section>
          <section className="rounded-2xl bg-white p-4 shadow-card">
            <div className="flex items-center justify-between gap-2"><h2 className="min-w-0 truncate text-[14px] font-bold">So‘nggi tashriflar</h2><button onClick={() => setTab('tashrif')} className="shrink-0 whitespace-nowrap text-[12px] font-semibold text-sea">Barchasini ko‘rish</button></div>
            <ul className="mt-3 space-y-3">
              {visits.slice(0, 4).map((v) => (
                <li key={v.key} className="flex items-start justify-between gap-2 text-[12.5px]">
                  <span className="min-w-0">
                    <span className="block text-[11px] text-muted">{v.iso ? niceDate(v.iso) : v.dateText}{v.time ? `, ${v.time}` : ''}</span>
                    <span className="font-semibold text-ink">{v.kind}</span>
                    {v.tooth && <span className="ml-1 text-muted">{v.tooth}</span>}
                    {v.doctor && <span className="block text-[11px] text-muted">{v.doctor}</span>}
                  </span>
                  <span className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold" style={{ background: (VISIT_STATUS[v.status] || VISIT_STATUS.tasdiq).bg, color: (VISIT_STATUS[v.status] || VISIT_STATUS.tasdiq).color }}>{(VISIT_STATUS[v.status] || VISIT_STATUS.tasdiq).label}</span>
                </li>
              ))}
            </ul>
            {!visits.length && <p className="mt-3 text-[12.5px] text-muted">Hali tashrif yo‘q. <button type="button" onClick={() => setVisit(true)} className="font-semibold text-sea">Qabul qo‘shish</button></p>}
          </section>
        </div>
      )}

      {tab === 'davolash' && <div className="mt-3"><PlansPanel p={p} plans={rec.plans} onToast={flash} highlightId={focusPlan} visitId={focusVisit} /></div>}
      {tab === 'tashrif' && <div className="mt-3"><VisitsPanel p={p} visits={visits} onAdd={() => setVisit(true)} onToast={flash} /></div>}
      {tab === 'tolov' && <div className="mt-3"><PaymentsPanel m={m} onAdd={() => setPay(true)} /></div>}
      {tab === 'hujjat' && <div className="mt-3"><DocsPanel p={p} onUpload={docs.pick} busy={docs.busy} error={docs.error} onToast={flash} /></div>}
      {tab === 'tibbiy' && <div className="mt-3 max-w-[760px]"><MedicalCard p={p} onToast={flash} /></div>}

      {tab === 'umumiy' && (
        <div className="bemor-bot mt-3">
          <Card title="Asosiy ma’lumotlar" action={edit ? 'Saqlash' : 'Tahrirlash'} onAction={edit ? saveInfo : startEdit}>
            {edit ? (
              <div className="space-y-2" data-testid="info-form">
                <Field t="Ism, familiya"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field t="Tug‘ilgan sana"><input type="date" max={tashkentToday()} value={form.birth} onChange={(e) => setForm({ ...form, birth: e.target.value })} className={inputCls} /></Field>
                  <Field t="Jinsi"><select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={`${inputCls} bg-white`}><option>Erkak</option><option>Ayol</option></select></Field>
                </div>
                <Field t="Telefon"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} /></Field>
                <Field t="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></Field>
                <Field t="Shahar"><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} /></Field>
                <Field t="Manzil"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} /></Field>
                {formErr && <p className="text-[12px] text-[#e11d48]">{formErr}</p>}
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setEdit(false)} className="h-8 rounded-lg border border-line px-3 text-[12px] font-semibold">Bekor qilish</button>
                  <button type="button" onClick={saveInfo} className="h-8 rounded-lg bg-sea px-3 text-[12px] font-semibold text-white">Saqlash</button>
                </div>
              </div>
            ) : (
              <dl className="text-[12.5px]">
                <Info k="Ism, familiya" v={p.name} />
                <Info k="Tug‘ilgan sana" v={p.birth ? `${p.birth}${p.age ? ` (${p.age})` : ''}` : '—'} />
                <Info k="Jinsi" v={p.gender || '—'} />
                <Info k="Telefon" v={p.phone} />
                <Info k="Email" v={p.email || '—'} />
                <Info k="Shahar" v={p.city || '—'} />
                <Info k="Manzil" v={p.address || '—'} />
                <Info k="Qayerdan bildi?" v={p.source || '—'} />
              </dl>
            )}
          </Card>
          <MedicalCard p={p} onToast={flash} />
          <Card title="Hujjatlar / Rentgen" action="Barchasini ko‘rish" onAction={() => setTab('hujjat')}>
            <div className="grid grid-cols-3 gap-2">
              {(p.docs || []).slice(0, 5).map((d, i) => (
                <figure key={d.id || `${d.name}-${i}`} className="min-w-0">
                  <DocThumb d={d} className="h-14" onOpen={() => (isPdf(d) ? openPatientFile(d).catch(() => {}) : setTab('hujjat'))} />
                  <figcaption className="mt-1 truncate text-[10.5px] font-semibold">{d.name}</figcaption>
                  <p className="text-[10px] text-muted">{docDate(d)}</p>
                </figure>
              ))}
              <button onClick={docs.pick} disabled={docs.busy} className="grid h-14 place-items-center rounded-lg border border-dashed border-line text-[11px] font-semibold text-sea">{docs.busy ? 'Yuklanmoqda…' : '+ Fayl yuklash'}</button>
            </div>
            {docs.error && <p role="alert" className="mt-2 text-[11.5px] text-[#e11d48]">{docs.error}</p>}
          </Card>
        </div>
      )}

      {visit && (
        <AppointmentForm
          initial={{ patient: p }}
          lockPatient
          onClose={() => setVisit(false)}
          onSaved={(row) => { afterVisitSaved(p, row); setVisit(false); flash('Qabul kalendarga yozildi') }}
        />
      )}
      {pay && (
        <PaymentForm
          patients={patients}
          patient={p}
          lockPatient
          onClose={() => setPay(false)}
          onSave={(row, opts) => { savePatientPayment(row, { ...opts, patient: p }); setPay(false); flash('To‘lov saqlandi') }}
        />
      )}

      {toast && <p role="status" className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-xl bg-ink px-4 py-2.5 text-[12.5px] font-semibold text-white shadow-card">{toast}</p>}
      <SaveErrorToast />
    </div>
  )
}

function Field({ t, children }) {
  return <label className="block text-[11.5px] text-muted"><span className="mb-0.5 block">{t}</span>{children}</label>
}

function Face({ src, name }) {
  const [ok, setOk] = useState(Boolean(src))
  const letters = name.split(' ').slice(0, 2).map((w) => w[0]).join('')
  if (!src || !ok) return <span className="grid size-[72px] place-items-center rounded-full bg-sea-50 text-[18px] font-bold text-sea">{letters}</span>
  return <img src={src} alt="" onError={() => setOk(false)} className="size-[72px] rounded-full object-cover" />
}

function Card({ title, action, onAction, children }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[14px] font-bold">{title}</h2>
        {action && <button onClick={onAction} className="text-[12px] font-semibold text-sea">{action}</button>}
      </div>
      {children}
    </section>
  )
}

function Info({ k, v }) {
  return <div className="flex justify-between gap-3 border-b border-line/70 py-1.5"><dt className="text-muted">{k}</dt><dd className="text-right font-medium text-ink">{v}</dd></div>
}

function Row({ k, v, green, red }) {
  return <div className="mt-1 flex justify-between gap-2 text-[12px]"><span className="text-muted">{k}</span><span className={`whitespace-nowrap font-semibold ${green ? 'text-[#1c9a52]' : ''} ${red ? 'text-[#e15b4c]' : ''}`}>{v}</span></div>
}

/** Tanlangan tish: katta rasm, joriy holat va holatni tanlash tugmalari. */
function ToothPanel({ n, state, teeth, onSet, onClose }) {
  if (!n) {
    const used = [...new Set(Object.values(teeth || {}).filter((k) => k && k !== 'healthy'))]
    return (
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl bg-[#f6f9fc] px-3 py-2 text-[11px] text-ink-2">
        <span className="font-semibold text-ink">Tishni bosing — tanlanadi va holatini belgilaysiz.</span>
        {['healthy', ...used].map((k) => (
          <span key={k} className="inline-flex items-center gap-1"><ToothArt n={11} state={k} style={{ height: 20 }} /> {TOOTH_STATUS_LABELS[k] || k}</span>
        ))}
      </div>
    )
  }
  return (
    <div className="mt-3 rounded-xl border border-sea/30 bg-sea-50/60 p-3" data-testid="tooth-panel">
      <div className="flex items-center gap-3">
        <span className="grid h-[64px] w-[44px] place-items-center rounded-lg bg-white ring-1 ring-sea/30"><ToothArt n={n} state={state} style={{ height: 56 }} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-ink"><span className="mr-1.5 inline-grid h-[20px] min-w-[26px] place-items-center rounded-full bg-sea px-1.5 text-[11px] text-white">{n}</span>tish tanlandi</p>
          <p className="text-[12px] text-ink-2">Holati: <b className="text-ink">{TOOTH_STATUS_LABELS[state] || state}</b></p>
        </div>
        <button type="button" onClick={onClose} className="h-8 shrink-0 rounded-lg border border-line bg-white px-3 text-[12px] font-semibold text-ink-2">Bekor qilish</button>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {CONDITIONS.map(([k, label]) => (
          <button key={k} type="button" aria-pressed={state === k} onClick={() => onSet(k)} className={`inline-flex h-8 items-center gap-1.5 rounded-lg border pl-1 pr-2.5 text-[11.5px] font-medium transition ${state === k ? 'border-sea bg-sea text-white' : 'border-line bg-white text-ink hover:border-sea/50'}`}>
            <ToothArt n={n} state={k} style={{ height: 24 }} /> {label}
          </button>
        ))}
      </div>
    </div>
  )
}
