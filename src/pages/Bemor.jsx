import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle, Calendar, Camera, ChevronRight, Mail, MapPin, Phone, Plus, Send, X,
} from 'lucide-react'
import { getBemor, patchBemor, som, statusClass, useBemorlar } from '../bemorData'

const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
const BABY_U = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65]
const BABY_L = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75]
const CYCLE = ['healthy', 'caries', 'filling', 'endo', 'crown', 'implant', 'missing']
const LEGEND = [
  ['healthy', 'Sog‘lom tish'],
  ['caries', 'Karies'],
  ['filling', 'Plomba'],
  ['endo', 'Endodontik davolash'],
  ['crown', 'Shift'],
  ['implant', 'Implant'],
  ['crown', 'Krona'],
  ['missing', 'Yo‘q tish'],
]

export default function Bemor() {
  const { id } = useParams()
  useBemorlar()
  const p = getBemor(id)
  const [tab, setTab] = useState('umumiy')
  const [dent, setDent] = useState('doimiy')
  const [edit, setEdit] = useState(false)
  const [visit, setVisit] = useState(false)
  const [pay, setPay] = useState(false)
  const [form, setForm] = useState(p ? { phone: p.phone, email: p.email, city: p.city, address: p.address || '' } : {})
  const fileRef = useRef(null)

  if (!p) return <p className="pt-6 text-[13px] text-muted">Bemor topilmadi.</p>

  const setTooth = (n) => {
    const cur = p.teeth?.[n] || 'healthy'
    const next = CYCLE[(CYCLE.indexOf(cur) + 1) % CYCLE.length]
    patchBemor(p.id, { teeth: { ...p.teeth, [n]: next } })
  }

  const addVisit = (e) => {
    e.preventDefault()
    const data = new FormData(e.target)
    const row = { date: String(data.get('date')).split('-').reverse().join('.'), kind: data.get('kind'), doctor: data.get('doctor'), done: false }
    patchBemor(p.id, { visits: [row, ...(p.visits || [])], next: row.date })
    setVisit(false)
  }

  const addPay = (e) => {
    e.preventDefault()
    const sum = Number(new FormData(e.target).get('sum')) || 0
    patchBemor(p.id, { paid: p.paid + sum })
    setPay(false)
  }

  const saveInfo = () => {
    patchBemor(p.id, form)
    setEdit(false)
  }

  const addFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      patchBemor(p.id, { docs: [...(p.docs || []), { name: file.name, date: 'Bugun', image: reader.result }] })
    }
    reader.readAsDataURL(file)
  }

  const upper = dent === 'doimiy' ? UPPER : BABY_U
  const lower = dent === 'doimiy' ? LOWER : BABY_L

  return (
    <div className="pb-6 pt-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1 text-[12.5px] text-muted">
          <Link to="/bemorlar" className="hover:text-sea">Bemorlar</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-ink-2">Bemor profili</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setVisit(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sea px-3 text-[12.5px] font-semibold text-white"><Calendar className="size-3.5" /> Qabul qo‘shish</button>
          <button onClick={() => setPay(true)} className="h-9 rounded-lg border border-line bg-white px-3 text-[12.5px] font-semibold">To‘lov</button>
          <button onClick={() => setEdit((v) => !v)} className="h-9 rounded-lg border border-line bg-white px-3 text-[12.5px] font-semibold">Tahrirlash</button>
        </div>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative">
            <Face src={p.photo} name={p.name} />
            <span className="absolute bottom-0 right-0 grid size-6 place-items-center rounded-full bg-white shadow-card"><Camera className="size-3 text-sea" /></span>
          </div>
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
            <div className="min-w-[180px] flex-1 rounded-xl border border-line p-2.5">
              <div className="flex items-center justify-between text-[12px]"><span className="font-bold">Moliyaviy holat</span><button onClick={() => setTab('tolov')} className="font-semibold text-sea">Batafsil</button></div>
              <Row k="Umumiy summa" v={som(p.total)} />
              <Row k="To‘langan" v={som(p.paid)} green />
              <Row k="Qarz" v={som(p.debt)} red />
            </div>
          </div>
        </div>
      </section>

      <div className="mt-3 flex gap-4 overflow-x-auto border-b border-line text-[13px] font-semibold">
        {[
          ['umumiy', 'Umumiy'],
          ['tish', 'Tish kartasi'],
          ['davolash', 'Davolash rejalari'],
          ['tashrif', 'Tashriflar'],
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
                <button onClick={() => setDent('doimiy')} className={`rounded-full px-3 py-1 ${dent === 'doimiy' ? 'bg-sea text-white' : 'text-ink-2'}`}>Doimiy tishlar</button>
                <button onClick={() => setDent('sut')} className={`rounded-full px-3 py-1 ${dent === 'sut' ? 'bg-sea text-white' : 'text-ink-2'}`}>Sut tishlar</button>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="mb-1 flex justify-between text-[10px] text-muted"><span>O‘ng</span><span>Chap</span></p>
                <Arch nums={upper} teeth={p.teeth} flip={false} onPick={setTooth} />
                <div className="my-1 border-t border-dashed border-line" />
                <Arch nums={lower} teeth={p.teeth} flip onPick={setTooth} />
              </div>
              <ul className="hidden w-[132px] shrink-0 space-y-0.5 text-[11px] text-ink-2 sm:block">
                {LEGEND.map(([k, label]) => (
                  <li key={label} className="flex items-center gap-1.5"><ToothIcon state={k} tiny /><span>{label}</span></li>
                ))}
              </ul>
            </div>
          </section>
          <section className="rounded-2xl bg-white p-4 shadow-card">
            <div className="flex items-center justify-between gap-2"><h2 className="min-w-0 truncate text-[14px] font-bold">So‘nggi tashriflar</h2><button onClick={() => setTab('tashrif')} className="shrink-0 whitespace-nowrap text-[12px] font-semibold text-sea">Barchasini ko‘rish</button></div>
            <ul className="mt-3 space-y-3">
              {(p.visits || []).slice(0, 4).map((v, i) => (
                <li key={i} className="flex items-start justify-between gap-2 text-[12.5px]">
                  <span>
                    <span className="block text-[11px] text-muted">{v.date}</span>
                    <span className="font-semibold text-ink">{v.kind}</span>
                    {v.tooth && <span className="ml-1 text-muted">{v.tooth}</span>}
                    <span className="block text-[11px] text-muted">{v.doctor}</span>
                  </span>
                  <span className="rounded-full bg-[#e5f8ee] px-2 py-0.5 text-[10.5px] font-semibold text-[#1c9a52]">{v.done === false ? 'Rejada' : 'Bajarildi'}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {tab === 'tashrif' && (
        <ul className="mt-3 space-y-2 rounded-2xl bg-white p-4 shadow-card">
          {(p.visits || []).map((v, i) => <li key={i} className="flex justify-between border-b border-line py-2 text-[13px]"><span>{v.date} — {v.kind} {v.tooth || ''}</span><span className="text-muted">{v.doctor}</span></li>)}
        </ul>
      )}
      {tab === 'davolash' && <p className="mt-3 rounded-2xl bg-white p-4 text-[13px] text-ink-2 shadow-card">{(p.visits || []).map((v) => `${v.date}: ${v.kind}`).join(' · ') || 'Reja yo‘q.'}</p>}
      {tab === 'tolov' && (
        <div className="mt-3 rounded-2xl bg-white p-4 text-[13px] shadow-card">
          <Row k="Umumiy summa" v={som(p.total)} />
          <Row k="To‘langan" v={som(p.paid)} green />
          <Row k="Qarz" v={som(p.debt)} red />
          <button onClick={() => setPay(true)} className="mt-3 h-9 rounded-lg bg-sea px-3 text-[12.5px] font-semibold text-white">To‘lov qilish</button>
        </div>
      )}
      {(tab === 'umumiy' || tab === 'tibbiy') && (
        <div className="bemor-bot mt-3">
          <Card title="Asosiy ma’lumotlar" action={edit ? 'Saqlash' : 'Tahrirlash'} onAction={edit ? saveInfo : () => setEdit(true)}>
            {edit ? (
              <div className="space-y-2">
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-8 w-full rounded-lg border border-line px-2 text-[12.5px]" />
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-8 w-full rounded-lg border border-line px-2 text-[12.5px]" />
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-8 w-full rounded-lg border border-line px-2 text-[12.5px]" />
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-8 w-full rounded-lg border border-line px-2 text-[12.5px]" />
              </div>
            ) : (
              <dl className="text-[12.5px]">
                <Info k="Ism, familiya" v={p.name} />
                <Info k="Tug‘ilgan sana" v={`${p.birth}${p.age ? ` (${p.age})` : ''}`} />
                <Info k="Jinsi" v={p.gender} />
                <Info k="Telefon" v={p.phone} />
                <Info k="Email" v={p.email || '—'} />
                <Info k="Shahar" v={p.city} />
                <Info k="Manzil" v={p.address || '—'} />
                <Info k="Qayerdan bildi?" v={p.source || '—'} />
              </dl>
            )}
          </Card>
          <Card title="Tibbiy ma’lumotlar">
            <p className="text-[12px] text-muted">Allergiya</p>
            <div className="mt-1 flex flex-wrap gap-1">{(p.allergy || []).map((a) => <span key={a} className="rounded-full bg-[#ffe6ea] px-2 py-0.5 text-[11px] text-[#d4524e]">{a}</span>)}{!p.allergy?.length && <span className="text-[12px]">Yo‘q</span>}</div>
            <p className="mt-2 text-[12px] text-muted">Kasalliklar</p>
            <div className="mt-1 flex flex-wrap gap-1">{(p.diseases || []).map((a) => <span key={a} className="rounded-full bg-[#fff3d6] px-2 py-0.5 text-[11px] text-[#b07d00]">{a}</span>)}{!p.diseases?.length && <span className="text-[12px]">Yo‘q</span>}</div>
            <Info k="Doimiy dori vositalari" v={p.meds || 'Yo‘q'} />
            <Info k="Chekish / spirtli ichimlik" v={p.habits || 'Yo‘q'} />
            {p.note && <p className="mt-2 text-[12px] leading-relaxed text-ink-2">{p.note}</p>}
          </Card>
          <Card title="Hujjatlar / Rentgen" action="Barchasini ko‘rish" onAction={() => setTab('hujjat')}>
            <div className="grid grid-cols-3 gap-2">
              {(p.docs || []).map((d) => (
                <figure key={d.name} className="min-w-0">
                  {d.image ? <img src={d.image} alt="" className="h-14 w-full rounded-lg object-cover" /> : <div className="grid h-14 place-items-center rounded-lg bg-[#f4f7fb] text-[10px] text-muted">PDF</div>}
                  <figcaption className="mt-1 truncate text-[10.5px] font-semibold">{d.name}</figcaption>
                  <p className="text-[10px] text-muted">{d.date}</p>
                </figure>
              ))}
              <button onClick={() => fileRef.current?.click()} className="grid h-14 place-items-center rounded-lg border border-dashed border-line text-[11px] font-semibold text-sea">+ Fayl yuklash</button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={addFile} />
            </div>
          </Card>
        </div>
      )}
      {tab === 'hujjat' && (
        <div className="mt-3 rounded-2xl bg-white p-4 shadow-card">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(p.docs || []).map((d) => (
              <figure key={d.name}>
                {d.image ? <img src={d.image} alt="" className="h-28 w-full rounded-xl object-cover" /> : <div className="grid h-28 place-items-center rounded-xl bg-[#f4f7fb]">PDF</div>}
                <figcaption className="mt-1 text-[12px] font-semibold">{d.name}</figcaption>
                <p className="text-[11px] text-muted">{d.date}</p>
              </figure>
            ))}
          </div>
          {!p.docs?.length && <p className="text-[13px] text-muted">Hujjat yo‘q.</p>}
          <button onClick={() => fileRef.current?.click()} className="mt-3 h-9 rounded-lg bg-sea px-3 text-[12.5px] font-semibold text-white">Fayl yuklash</button>
        </div>
      )}

      {visit && (
        <Modal title="Qabul qo‘shish" onClose={() => setVisit(false)}>
          <form onSubmit={addVisit} className="space-y-2">
            <input name="date" type="date" required className="h-9 w-full rounded-lg border border-line px-2 text-[13px]" />
            <input name="kind" required placeholder="Qabul turi" className="h-9 w-full rounded-lg border border-line px-2 text-[13px]" />
            <input name="doctor" defaultValue="Dr. Ibrohim" className="h-9 w-full rounded-lg border border-line px-2 text-[13px]" />
            <button className="h-9 rounded-lg bg-sea px-4 text-[13px] font-semibold text-white">Saqlash</button>
          </form>
        </Modal>
      )}
      {pay && (
        <Modal title="To‘lov" onClose={() => setPay(false)}>
          <form onSubmit={addPay} className="space-y-2">
            <input name="sum" type="number" min="1" required placeholder="Summa" className="h-9 w-full rounded-lg border border-line px-2 text-[13px]" />
            <p className="text-[12px] text-muted">Hozirgi qarz: {som(p.debt)}</p>
            <button className="h-9 rounded-lg bg-sea px-4 text-[13px] font-semibold text-white">Qabul qilish</button>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Face({ src, name }) {
  const [ok, setOk] = useState(Boolean(src))
  const letters = name.split(' ').slice(0, 2).map((w) => w[0]).join('')
  if (!src || !ok) return <span className="grid size-[72px] place-items-center rounded-full bg-sea-50 text-[18px] font-bold text-sea">{letters}</span>
  return <img src={src} alt="" onError={() => setOk(false)} className="size-[72px] rounded-full object-cover" />
}

function Arch({ nums, teeth, flip, onPick }) {
  const mid = Math.ceil(nums.length / 2)
  return (
    <div className="flex justify-center gap-1">
      {nums.map((n, i) => (
        <button key={n} onClick={() => onPick(n)} className={`flex flex-col items-center ${i === mid ? 'ml-2' : ''}`} title={String(n)}>
          {!flip && <span className="text-[9px] text-muted">{n}</span>}
          <ToothIcon state={teeth?.[n] || 'healthy'} flip={flip} />
          {flip && <span className="text-[9px] text-muted">{n}</span>}
        </button>
      ))}
    </div>
  )
}

function ToothIcon({ state, flip, tiny }) {
  const fill = { healthy: '#fff', caries: '#8d939c', filling: '#8ec6ea', endo: '#f2c14b', crown: '#f3b4c6', implant: '#6aa4ee', missing: 'transparent' }[state] || '#fff'
  return (
    <svg viewBox="0 0 22 30" className={`${tiny ? 'h-4 w-3' : 'h-7 w-4'} ${flip ? 'rotate-180' : ''}`}>
      <path d="M6 3h10c2.4 0 4 1.8 4 4.2v6.2c0 6-2.2 10.5-4.6 13.4-1.2 1.4-3.2 1.6-4.4.2-1.4-3-4.6-7.6-4.6-13.6V7.2C6.4 4.8 8 3 6 3z" fill={fill} stroke={state === 'missing' ? '#e7b4bc' : '#c5d0dc'} strokeDasharray={state === 'missing' ? '2 2' : '0'} />
      {state === 'endo' && <path d="M11 8 v12" stroke="#e25b4a" strokeWidth="1.4" />}
      {state === 'implant' && <rect x="9" y="8" width="4" height="14" rx="1" fill="#3d7ed6" />}
      {state === 'missing' && <path d="M7 8 l8 12 M15 8 l-8 12" stroke="#e25b4a" strokeWidth="1.2" />}
    </svg>
  )
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
  return <div className="mt-1 flex justify-between gap-2 text-[12px]"><span className="text-muted">{k}</span><span className={`font-semibold ${green ? 'text-[#1c9a52]' : ''} ${red ? 'text-[#e15b4c]' : ''}`}>{v}</span></div>
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between"><h3 className="text-[16px] font-bold">{title}</h3><button onClick={onClose} aria-label="Yopish"><X className="size-4 text-muted" /></button></div>
        {children}
      </div>
    </div>
  )
}
