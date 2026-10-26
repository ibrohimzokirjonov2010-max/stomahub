import { useEffect, useMemo, useRef, useState } from 'react'
import {
  X, ChevronDown, Calendar, Plus, Trash2, GripVertical, MoreVertical, Info, Save, Clock, Search, Check, Baby, Eraser, Maximize2,
  Minimize2, LayoutTemplate, ArrowUp, Pencil,
} from 'lucide-react'
import { ToothIcon } from './icons'
import PersonAvatar from './PersonAvatar'
import ToothChart, { Tooth, UPPER, LOWER, BABY_UPPER, BABY_LOWER, CONDITIONS } from './ToothChart'
import { useBemorlar } from '../bemorData'
import { useXizmatlar } from '../xizmatData'
import { DOCTORS, PLAN_STATUS, TODAY, money, nextPlanCode, useTemplates, doctorOf } from '../rejaData'

const DISCOUNTS = [0, 5, 10, 15, 20]
const DURATIONS = ['1 kun', '1 hafta', '1-2 hafta', '2-3 hafta', '1 oy', '2-3 oy']
const STAGE_TONES = ['#3b82f6', '#16a34a', '#f59e0b', '#8b5cf6', '#0b8a95', '#e11d48']
const field = 'h-10 w-full rounded-xl border border-[#e6ebf2] bg-white px-3 text-[12.5px] outline-none transition placeholder:text-[#9aa6b6] focus:border-sea'
let uid = 0
const newId = (p) => `${p}-${Date.now().toString(36)}-${(uid += 1)}`

const parseTeeth = (s) => [...new Set(String(s || '').split(/[\s,;]+/).map(Number).filter((n) => n >= 11 && n <= 85 && n % 10 >= 1 && n % 10 <= 8))]

function artOf(name = '') {
  if (/implant/i.test(name)) return 'implant'
  if (/endo|kanal/i.test(name)) return 'endo'
  if (/shtift/i.test(name)) return 'post'
  if (/koronka|krona|toj|protez|vinir/i.test(name)) return 'crown'
  if (/plomba|kompozit|restavr/i.test(name)) return 'filling'
  if (/sug‘urish|sugurish|olib tashlash/i.test(name)) return 'missing'
  return null
}

function fromPlan(p) {
  if (p.items) return { ...p, items: p.items.map((r) => ({ ...r })), groups: (p.groups || []).map((g) => ({ ...g })) }
  const items = p.stages.map((s) => ({ id: `row-${s.id}`, service: s.title, tooth: s.teeth.join(', '), qty: 1, price: s.price }))
  const groups = p.stages.map((s) => ({ id: s.id, title: s.title, rowIds: [`row-${s.id}`], duration: s.duration || '' }))
  return { ...p, items, groups }
}

const blank = () => ({
  id: '', code: nextPlanCode(), patient: null, doctor: 'ibrohim', title: '', status: 'reja', start: TODAY, chair: 'Kreslo 1',
  teeth: {}, items: [], groups: [], discount: 0, payMode: 'full', note: '', paid: 0, payments: [], visits: [], stages: [],
})

export default function RejaDialog({ initial, onClose, onSave }) {
  const bemorlar = useBemorlar()
  const xizmatlar = useXizmatlar()
  const templates = useTemplates()
  const [form, setForm] = useState(() => (initial ? fromPlan(initial) : blank()))
  const [errors, setErrors] = useState({})
  const [dent, setDent] = useState('doimiy')
  const [tool, setTool] = useState('')
  const [big, setBig] = useState(false)
  const [asTemplate, setAsTemplate] = useState(false)
  const [stageForm, setStageForm] = useState(null)
  const [stageMenu, setStageMenu] = useState(null)
  const dragFrom = useRef(-1)
  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => (e[k] ? { ...e, [k]: '' } : e))
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (big) setBig(false)
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [big, onClose])

  const services = useMemo(() => xizmatlar.filter((x) => x.status === 'faol' && x.inPlans), [xizmatlar])
  const priceOf = (name) => services.find((x) => x.name === name)?.price || 0

  const sum = form.items.reduce((s, r) => s + (Number(r.qty) || 0) * (Number(r.price) || 0), 0)
  const off = Math.round((sum * form.discount) / 100)
  const final = sum - off
  const factor = 1 - form.discount / 100
  const rowSum = (ids) => form.items.filter((r) => ids.includes(r.id)).reduce((s, r) => s + r.qty * r.price, 0) * factor
  const taken = new Set(form.groups.flatMap((g) => g.rowIds))

  const pickPatient = (b) => {
    setForm((f) => ({
      ...f,
      patient: { id: b.id, name: b.name, phone: b.phone, age: b.age, gender: b.gender, city: b.city, photo: b.photo, code: b.code },
      teeth: Object.keys(f.teeth).length ? f.teeth : { ...(b.teeth || {}) },
    }))
    setErrors((e) => ({ ...e, patient: '' }))
  }

  const tapTooth = (n) => {
    const cur = form.teeth[n] || 'healthy'
    const order = CONDITIONS.map(([k]) => k)
    const next = tool ? (cur === tool ? 'healthy' : tool) : order[(order.indexOf(cur) + 1) % order.length]
    const teeth = { ...form.teeth }
    if (next === 'healthy') delete teeth[n]
    else teeth[n] = next
    set('teeth', teeth)
  }

  const setRow = (id, patch) => set('items', form.items.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const addRow = () => {
    set('items', [...form.items, { id: newId('row'), service: '', tooth: '', qty: 1, price: 0 }])
    setErrors((e) => ({ ...e, items: '' }))
  }
  const removeRow = (id) => setForm((f) => ({
    ...f,
    items: f.items.filter((r) => r.id !== id),
    groups: f.groups.map((g) => ({ ...g, rowIds: g.rowIds.filter((x) => x !== id) })).filter((g) => g.rowIds.length),
  }))
  const dropRow = (to) => {
    const from = dragFrom.current
    dragFrom.current = -1
    if (from < 0 || from === to) return
    const items = [...form.items]
    const [moved] = items.splice(from, 1)
    items.splice(to, 0, moved)
    set('items', items)
  }

  const saveStage = () => {
    if (!stageForm.title.trim() || !stageForm.rowIds.length) return setStageForm({ ...stageForm, error: 'Nom kiriting va kamida bitta xizmatni belgilang' })
    const g = { id: stageForm.id || newId('st'), title: stageForm.title.trim(), rowIds: stageForm.rowIds, duration: stageForm.duration }
    set('groups', stageForm.id ? form.groups.map((x) => (x.id === g.id ? g : x)) : [...form.groups, g])
    setStageForm(null)
  }

  const moveStage = (i) => {
    if (i === 0) return
    const groups = [...form.groups]
    ;[groups[i - 1], groups[i]] = [groups[i], groups[i - 1]]
    set('groups', groups)
  }

  const loadTemplate = (id) => {
    const t = templates.find((x) => x.id === id)
    if (!t) return
    const map = {}
    const items = t.items.map((r) => {
      const nid = newId('row')
      map[r.id] = nid
      return { ...r, id: nid }
    })
    setForm((f) => ({ ...f, title: f.title || t.title, items, discount: t.discount, payMode: t.payMode, groups: t.groups.map((g) => ({ ...g, id: newId('st'), rowIds: g.rowIds.map((x) => map[x]) })) }))
  }

  const submit = () => {
    const next = {}
    if (!form.patient) next.patient = 'Bemorni tanlang'
    if (!form.title.trim()) next.title = 'Reja nomini kiriting'
    if (!form.start) next.start = 'Sanani tanlang'
    if (!form.items.length) next.items = 'Kamida bitta xizmat qo‘shing'
    else if (form.items.some((r) => !r.service || !(Number(r.price) > 0) || !(Number(r.qty) > 0))) next.items = 'Har bir qatorda xizmat, soni va narxni to‘ldiring'
    setErrors(next)
    if (Object.keys(next).length) return

    const items = form.items.map((r) => ({ ...r, qty: Number(r.qty), price: Number(r.price) }))
    const assigned = new Set(form.groups.flatMap((g) => g.rowIds))
    const groups = [...form.groups, ...items.filter((r) => !assigned.has(r.id)).map((r) => ({ id: `st-${r.id}`, title: r.service, rowIds: [r.id], duration: '' }))]
    const old = initial?.stages || []
    const stages = groups.map((g, i) => {
      const rows = items.filter((r) => g.rowIds.includes(r.id))
      const prev = old.find((s) => s.id === g.id)
      return {
        id: g.id,
        title: g.title,
        desc: rows.map((r) => `${r.service}${r.tooth ? ` (${r.tooth})` : ''}`).join(', '),
        teeth: [...new Set(rows.flatMap((r) => parseTeeth(r.tooth)))],
        art: artOf(rows.map((r) => r.service).join(' ')) || prev?.art || null,
        price: Math.round(rows.reduce((s, r) => s + r.qty * r.price, 0) * factor),
        date: prev?.date ?? (i === 0 ? form.start : ''),
        status: prev?.status || 'rejada',
        duration: g.duration,
      }
    })
    const id = form.id || `dr-${Date.now().toString(36)}`
    const visits = initial ? form.visits : stages.slice(0, 1).map((s) => ({ id: `${id}-v1`, date: form.start, time: '10:00', title: s.teeth.length ? `${s.title} (${s.teeth.join(', ')})` : s.title, status: 'rejada' }))
    const plan = {
      ...form,
      id,
      title: form.title.trim(),
      subtitle: form.subtitle || items.slice(0, 2).map((r) => r.service).join(' + '),
      items,
      groups,
      stages,
      visits,
    }
    onSave(plan, asTemplate)
  }

  const upper = dent === 'doimiy' ? UPPER : BABY_UPPER
  const lower = dent === 'doimiy' ? LOWER : BABY_LOWER
  const chart = (height) => (
    <ToothChart upper={upper} lower={lower} height={height} stateOf={(n) => form.teeth[n]} onPick={tapTooth} />
  )
  const legend = (
    <ul className="space-y-0.5 rounded-xl bg-[#f6f9fc] p-2">
      {CONDITIONS.map(([k, label]) => (
        <li key={k}>
          <button type="button" onClick={() => setTool(tool === k ? '' : k)} className={`flex w-full items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left text-[10.5px] transition ${tool === k ? 'bg-sea text-white' : 'text-ink-2 hover:bg-white'}`}>
            <span className="grid w-4 shrink-0 place-items-center"><Tooth n={11} state={k} height={17} /></span>
            <span className="leading-tight">{label}</span>
          </button>
        </li>
      ))}
      <li className="px-1.5 pt-1 text-[9.5px] leading-snug text-muted">{tool ? 'Tishni bosing — holat qo‘yiladi' : 'Holatni tanlang yoki tishni bosib almashtiring'}</li>
    </ul>
  )

  return (
    <div className="bemor-shade" onClick={onClose}>
      <div className="rj-dialog shadow-card" role="dialog" aria-label={initial ? 'Davolash rejasini tahrirlash' : 'Yangi davolash rejasi'} onClick={(e) => { e.stopPropagation(); setStageMenu(null) }}>
        <div className="flex shrink-0 items-start gap-3 px-5 pb-2 pt-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[19px] font-bold text-ink">{initial ? 'Davolash rejasini tahrirlash' : 'Yangi davolash rejasi'}</h2>
            <p className="text-[12px] text-muted">Bemorga davolash rejasi tuzing va xizmatlarni qo‘shing</p>
          </div>
          {templates.length > 0 && !initial && (
            <label className="relative flex h-9 items-center gap-1.5 rounded-xl border border-line bg-white pl-2.5 text-[12px]">
              <LayoutTemplate className="size-4 text-sea" />
              <select defaultValue="" onChange={(e) => loadTemplate(e.target.value)} className="h-full appearance-none bg-transparent pr-7 outline-none">
                <option value="" disabled>Shablondan to‘ldirish</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 size-4 text-muted" />
            </label>
          )}
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center rounded-lg text-muted hover:bg-[#f4f8fb]"><X className="size-5" /></button>
        </div>

        <div className="bemor-dialog-body space-y-3 px-5 pb-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <Label text="Bemor" required error={errors.patient}>
              <PatientPicker value={form.patient} list={bemorlar} onPick={pickPatient} invalid={!!errors.patient} />
            </Label>
            <Label text="Shifokor" required>
              <DoctorPicker value={form.doctor} onPick={(id) => set('doctor', id)} />
            </Label>
          </div>
          <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3">
            <Label text="Reja nomi" required error={errors.title}>
              <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Masalan: Implant va protez davolash rejasi" className={`${field} ${errors.title ? 'border-[#f2a7a7]' : ''}`} />
            </Label>
            <Label text="Holati">
              <span className="relative block">
                <span className="pointer-events-none absolute left-3 top-1/2 z-10 size-2 -translate-y-1/2 rounded-full" style={{ background: PLAN_STATUS[form.status].dot }} />
                <select value={form.status} onChange={(e) => set('status', e.target.value)} className={`${field} appearance-none pl-7! pr-8`}>
                  {Object.entries(PLAN_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
              </span>
            </Label>
            <Label text="Sanasi" error={errors.start}>
              <span className="relative block">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input type="date" value={form.start} onChange={(e) => set('start', e.target.value)} className={`${field} pl-9!`} />
              </span>
            </Label>
          </div>

          <div className="rj-modal-grid">
            <div className="min-w-0 space-y-3">
              <section className="rounded-2xl border border-line p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-[14px] font-bold text-ink">Tishlar (FDI)</h3>
                  <div className="flex gap-1">
                    <ToolBtn label="Doimiy tishlar" active={dent === 'doimiy'} onClick={() => setDent('doimiy')}><ToothIcon className="size-4" /></ToolBtn>
                    <ToolBtn label="Sut tishlar" active={dent === 'sut'} onClick={() => setDent('sut')}><Baby className="size-4" /></ToolBtn>
                    <ToolBtn label="Kartani tozalash" onClick={() => { if (Object.keys(form.teeth).length && window.confirm('Barcha belgilar tozalansinmi?')) set('teeth', {}) }}><Eraser className="size-4" /></ToolBtn>
                    <ToolBtn label="Kattalashtirish" onClick={() => setBig(true)}><Maximize2 className="size-4" /></ToolBtn>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="min-w-0 flex-1">{chart(50)}</div>
                  <div className="w-[134px] shrink-0">{legend}</div>
                </div>
              </section>

              <section className="rounded-2xl border border-line p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-[14px] font-bold text-ink">Xizmatlar ro‘yxati</h3>
                  <button type="button" onClick={addRow} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-sea px-3 text-[12px] font-semibold text-white hover:bg-sea-600"><Plus className="size-4" /> Xizmat qo‘shish</button>
                </div>
                <div className="overflow-hidden rounded-xl border border-line">
                  <table className="w-full text-left text-[11.5px]">
                    <thead className="bg-[#f8fafc] text-[10.5px] text-muted">
                      <tr>
                        <th className="w-6" />
                        <th className="w-6 py-2 font-medium">#</th>
                        <th className="font-medium">Xizmat</th>
                        <th className="w-[60px] font-medium">Tish</th>
                        <th className="w-[50px] font-medium">Soni</th>
                        <th className="w-[92px] font-medium">Narx (so‘m)</th>
                        <th className="w-[92px] font-medium">Jami (so‘m)</th>
                        <th className="w-10 pr-2 text-center font-medium">Amal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((r, i) => {
                        const options = services.some((x) => x.name === r.service) || !r.service ? services : [{ id: 'cur', name: r.service }, ...services]
                        return (
                          <tr key={r.id} className="border-t border-line" onDragOver={(e) => e.preventDefault()} onDrop={() => dropRow(i)}>
                            <td className="pl-1.5"><span draggable onDragStart={() => { dragFrom.current = i }} title="Sudrab tartibni o‘zgartiring" className="grid cursor-grab place-items-center text-[#a6b1c0]"><GripVertical className="size-4" /></span></td>
                            <td className="text-ink-2">{i + 1}</td>
                            <td className="py-1.5 pr-1.5">
                              <span className="relative block">
                                <select value={r.service} onChange={(e) => setRow(r.id, { service: e.target.value, price: priceOf(e.target.value) || r.price })} className={`h-8 w-full appearance-none rounded-lg border bg-white pl-2 pr-6 text-[11.5px] outline-none focus:border-sea ${errors.items && !r.service ? 'border-[#f2a7a7]' : 'border-[#e6ebf2]'}`}>
                                  <option value="" disabled>Xizmatni tanlang</option>
                                  {options.map((x) => <option key={x.id} value={x.name}>{x.name}</option>)}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
                              </span>
                            </td>
                            <td className="pr-1.5"><input value={r.tooth} onChange={(e) => setRow(r.id, { tooth: e.target.value.replace(/[^\d,\s]/g, '') })} placeholder="—" className="h-8 w-full rounded-lg border border-[#e6ebf2] px-1.5 text-center text-[11.5px] outline-none focus:border-sea" /></td>
                            <td className="pr-1.5"><input value={r.qty} onChange={(e) => setRow(r.id, { qty: e.target.value.replace(/\D/g, '') })} className="h-8 w-full rounded-lg border border-[#e6ebf2] px-1.5 text-center text-[11.5px] outline-none focus:border-sea" /></td>
                            <td className="pr-1.5"><input value={r.price ? money(r.price) : ''} onChange={(e) => setRow(r.id, { price: Number(e.target.value.replace(/\D/g, '')) || 0 })} placeholder="0" className="h-8 w-full rounded-lg border border-[#e6ebf2] px-2 text-[11.5px] outline-none focus:border-sea" /></td>
                            <td className="pr-1.5"><span className="flex h-8 items-center rounded-lg bg-[#f1f4f8] px-2 text-[11.5px] text-ink-2">{money((Number(r.qty) || 0) * (Number(r.price) || 0))}</span></td>
                            <td className="pr-2 text-center"><button type="button" aria-label="Qatorni o‘chirish" onClick={() => removeRow(r.id)} className="grid size-7 place-items-center rounded-lg text-[#e5484d] hover:bg-[#fdf0f0]"><Trash2 className="size-4" /></button></td>
                          </tr>
                        )
                      })}
                      {!form.items.length && (
                        <tr><td colSpan={8} className="py-6 text-center text-[12px] text-muted">Hali xizmat qo‘shilmagan. “Xizmat qo‘shish” tugmasini bosing.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {errors.items && <p className="mt-1.5 text-[11px] text-[#e5484d]">{errors.items}</p>}
              </section>
            </div>

            <div className="min-w-0 space-y-3">
              <section className="rounded-2xl border border-line p-3">
                <h3 className="text-[13.5px] font-bold text-ink">Moliyaviy hisob</h3>
                <div className="mt-2.5 space-y-2 text-[12px]">
                  <p className="flex justify-between gap-2"><span className="text-muted">Xizmatlar jami</span><b className="text-ink">{money(sum)} so‘m</b></p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted">Chegirma</span>
                    <span className="relative">
                      <select value={form.discount} onChange={(e) => set('discount', Number(e.target.value))} className="h-7 appearance-none rounded-lg border border-line bg-white pl-2 pr-6 text-[11.5px] outline-none focus:border-sea">
                        {DISCOUNTS.map((d) => <option key={d} value={d}>{d}%</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
                    </span>
                    <b className="text-[#16a34a]">{off ? `- ${money(off)}` : '0'} so‘m</b>
                  </div>
                  <p className="flex items-center justify-between gap-2 border-t border-line pt-2"><span className="font-semibold text-ink">Yakuniy summa</span><b className="text-[14px] text-sea">{money(final)} so‘m</b></p>
                </div>
              </section>

              <section className="rounded-2xl border border-line p-3">
                <h3 className="text-[13.5px] font-bold text-ink">To‘lov rejasi</h3>
                <div className="mt-2 grid grid-cols-2 rounded-xl border border-line p-0.5 text-[11.5px] font-semibold">
                  {[['full', 'To‘liq to‘lov'], ['stages', 'Bosqichlarga bo‘lish']].map(([k, t]) => (
                    <button key={k} type="button" onClick={() => set('payMode', k)} className={`h-8 whitespace-nowrap rounded-lg px-1 text-[11px] transition ${form.payMode === k ? 'bg-sea text-white' : 'text-ink-2 hover:bg-[#f4f8fb]'}`}>{t}</button>
                  ))}
                </div>
                <div className="mt-2 flex gap-1.5 rounded-lg bg-[#eef4ff] px-2.5 py-2 text-[11px] leading-snug text-[#3b5b9a]">
                  <Info className="mt-px size-3.5 shrink-0 text-[#3b82f6]" />
                  {form.payMode === 'full' ? (
                    <span>To‘liq summa bir martada to‘lanadi.</span>
                  ) : form.groups.length ? (
                    <span>Har bir bosqich boshlanishida o‘z summasi to‘lanadi ({form.groups.length} ta to‘lov).</span>
                  ) : (
                    <span>Har bir xizmat alohida bosqich sifatida to‘lanadi. Bosqichlarni pastda guruhlang.</span>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="whitespace-nowrap text-[13px] font-bold leading-tight text-ink">Reja bosqichlari <span className="block text-[10.5px] font-normal text-muted">(ixtiyoriy)</span></h3>
                  <button type="button" disabled={!form.items.length} onClick={() => setStageForm({ title: '', duration: '1-2 hafta', rowIds: form.items.filter((r) => !taken.has(r.id)).map((r) => r.id) })} className="inline-flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-sea px-2 text-[10.5px] font-semibold text-white disabled:opacity-40"><Plus className="size-3.5" /> Bosqich qo‘shish</button>
                </div>
                {!form.items.length && <p className="mt-2 text-[11px] text-muted">Avval xizmat qo‘shing, so‘ng ularni bosqichlarga guruhlang.</p>}
                <ul className="mt-2 space-y-2">
                  {form.groups.map((g, i) => {
                    const rows = form.items.filter((r) => g.rowIds.includes(r.id))
                    const teeth = [...new Set(rows.flatMap((r) => parseTeeth(r.tooth)))]
                    return (
                      <li key={g.id} className="relative rounded-xl border border-line p-2.5">
                        <div className="flex items-start gap-2">
                          <span className="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: STAGE_TONES[i % STAGE_TONES.length] }}>{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center justify-between gap-1 text-[11.5px]"><b className="text-ink">Bosqich</b><b className="text-sea">{money(rowSum(g.rowIds))} so‘m</b></p>
                            <p className="truncate text-[11.5px] text-ink-2">{g.title}</p>
                            <p className="mt-1 flex flex-wrap gap-x-3 text-[10.5px] text-muted">
                              <span className="inline-flex items-center gap-1"><ToothIcon className="size-3" /> Tishlar: {teeth.join(', ') || '—'}</span>
                              {g.duration && <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {g.duration}</span>}
                            </p>
                          </div>
                          <button type="button" aria-label="Bosqich amallari" onClick={(e) => { e.stopPropagation(); setStageMenu(stageMenu === g.id ? null : g.id) }} className="grid size-6 shrink-0 place-items-center rounded-md text-muted hover:bg-[#f1f5f9]"><MoreVertical className="size-4" /></button>
                        </div>
                        {stageMenu === g.id && (
                          <div className="absolute right-2 top-8 z-20 w-40 rounded-xl border border-line bg-white p-1 shadow-lg" onClick={(e) => e.stopPropagation()}>
                            <MenuBtn onClick={() => { setStageForm({ ...g }); setStageMenu(null) }}><Pencil className="size-3.5" /> Tahrirlash</MenuBtn>
                            {i > 0 && <MenuBtn onClick={() => { moveStage(i); setStageMenu(null) }}><ArrowUp className="size-3.5" /> Yuqoriga</MenuBtn>}
                            <MenuBtn danger onClick={() => { set('groups', form.groups.filter((x) => x.id !== g.id)); setStageMenu(null) }}><Trash2 className="size-3.5" /> O‘chirish</MenuBtn>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
                {stageForm && (
                  <div className="mt-2 space-y-2 rounded-xl border border-sea/40 bg-[#f4fbfb] p-2.5">
                    <input autoFocus value={stageForm.title} onChange={(e) => setStageForm({ ...stageForm, title: e.target.value, error: '' })} placeholder="Bosqich nomi (masalan: Endo davolash)" className="h-8 w-full rounded-lg border border-[#e6ebf2] bg-white px-2 text-[11.5px] outline-none focus:border-sea" />
                    <span className="relative block">
                      <select value={stageForm.duration} onChange={(e) => setStageForm({ ...stageForm, duration: e.target.value })} className="h-8 w-full appearance-none rounded-lg border border-[#e6ebf2] bg-white pl-2 pr-6 text-[11.5px] outline-none focus:border-sea">
                        {DURATIONS.map((d) => <option key={d}>{d}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
                    </span>
                    <div className="max-h-28 space-y-1 overflow-y-auto">
                      {form.items.filter((r) => !taken.has(r.id) || stageForm.rowIds.includes(r.id)).map((r) => (
                        <label key={r.id} className="flex items-center gap-1.5 text-[11px] text-ink-2">
                          <input type="checkbox" checked={stageForm.rowIds.includes(r.id)} onChange={(e) => setStageForm({ ...stageForm, error: '', rowIds: e.target.checked ? [...stageForm.rowIds, r.id] : stageForm.rowIds.filter((x) => x !== r.id) })} className="accent-[#0b8a95]" />
                          <span className="truncate">{r.service || 'Tanlanmagan xizmat'}{r.tooth ? ` (${r.tooth})` : ''}</span>
                        </label>
                      ))}
                    </div>
                    {stageForm.error && <p className="text-[10.5px] text-[#e5484d]">{stageForm.error}</p>}
                    <div className="flex gap-1.5">
                      <button type="button" onClick={saveStage} className="inline-flex h-7 items-center gap-1 rounded-lg bg-sea px-2.5 text-[11px] font-semibold text-white"><Check className="size-3.5" /> Saqlash</button>
                      <button type="button" onClick={() => setStageForm(null)} className="h-7 rounded-lg border border-line bg-white px-2.5 text-[11px]">Bekor</button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-start justify-between gap-3 border-t border-line px-5 py-3">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-line bg-white px-6 text-[12.5px] font-semibold text-ink hover:bg-[#f6f9fc]">Bekor qilish</button>
          <div className="flex flex-col items-end gap-1.5">
            <button type="button" onClick={submit} className="inline-flex h-10 min-w-[150px] items-center justify-center gap-2 rounded-xl bg-sea px-6 text-[12.5px] font-semibold text-white hover:bg-sea-600"><Save className="size-4" /> Saqlash</button>
            <label className="flex items-center gap-1.5 text-[11px] text-ink-2"><input type="checkbox" checked={asTemplate} onChange={(e) => setAsTemplate(e.target.checked)} className="accent-[#0b8a95]" /> Shablon sifatida saqlash</label>
          </div>
        </div>
      </div>

      {big && (
        <div className="bemor-shade z-[70]!" onClick={(e) => { e.stopPropagation(); setBig(false) }}>
          <div className="w-[min(980px,100%)] rounded-2xl bg-white p-4 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-ink">Tishlar (FDI) — {form.patient?.name || 'bemor tanlanmagan'}</h3>
              <button type="button" onClick={() => setBig(false)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[12px]"><Minimize2 className="size-4" /> Kichraytirish</button>
            </div>
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">{chart(84)}</div>
              <div className="w-[140px] shrink-0">{legend}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Label({ text, required, error, children }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[11.5px] font-semibold text-ink">{text} {required && <span className="text-[#e5484d]">*</span>}</p>
      {children}
      {error && <p className="mt-1 text-[11px] text-[#e5484d]">{error}</p>}
    </div>
  )
}

function ToolBtn({ label, active, onClick, children }) {
  return <button type="button" title={label} aria-label={label} onClick={onClick} className={`grid size-8 place-items-center rounded-lg border transition ${active ? 'border-sea bg-sea-50 text-sea' : 'border-line text-ink-2 hover:border-sea hover:text-sea'}`}>{children}</button>
}

function MenuBtn({ danger, onClick, children }) {
  return <button type="button" onClick={onClick} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] ${danger ? 'text-[#dc2626] hover:bg-[#fdf0f0]' : 'hover:bg-[#f4f8fb]'}`}>{children}</button>
}

function usePopover() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const off = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', off)
    return () => document.removeEventListener('mousedown', off)
  }, [open])
  return [open, setOpen, ref]
}

function PatientPicker({ value, list, onPick, invalid }) {
  const [open, setOpen, ref] = usePopover()
  const [q, setQ] = useState('')
  const found = useMemo(() => {
    const s = q.trim().toLowerCase()
    return list.filter((b) => !s || `${b.name} ${b.phone} ${b.code}`.toLowerCase().includes(s)).slice(0, 40)
  }, [list, q])
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className={`flex h-12 w-full items-center gap-2.5 rounded-xl border bg-white px-2.5 text-left transition ${invalid ? 'border-[#f2a7a7]' : open ? 'border-sea' : 'border-[#e6ebf2]'}`}>
        {value ? (
          <>
            <PersonAvatar src={value.photo} name={value.name} size={32} />
            <span className="min-w-0 flex-1">
              <b className="block truncate text-[12.5px] text-ink">{value.name}</b>
              <span className="block truncate text-[11px] text-muted">{value.phone} • {value.age}</span>
            </span>
          </>
        ) : (
          <span className="flex-1 text-[12.5px] text-[#9aa6b6]">Bemorni tanlang</span>
        )}
        <ChevronDown className="size-4 shrink-0 text-muted" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border border-line bg-white p-1.5 shadow-lg">
          <label className="mb-1 flex h-9 items-center gap-2 rounded-lg bg-[#f4f7fb] px-2.5">
            <Search className="size-4 text-muted" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ism, telefon yoki ID..." className="min-w-0 flex-1 bg-transparent text-[12px] outline-none" />
          </label>
          <ul className="max-h-56 overflow-y-auto">
            {found.map((b) => (
              <li key={b.id}>
                <button type="button" onClick={() => { onPick(b); setOpen(false); setQ('') }} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[#f4f8fb] ${value?.id === b.id ? 'bg-sea-50' : ''}`}>
                  <PersonAvatar src={b.photo} name={b.name} size={28} />
                  <span className="min-w-0 flex-1"><b className="block truncate text-[12px] text-ink">{b.name}</b><span className="text-[10.5px] text-muted">{b.phone} • {b.age}</span></span>
                  {value?.id === b.id && <Check className="size-4 text-sea" />}
                </button>
              </li>
            ))}
            {!found.length && <li className="px-2 py-3 text-center text-[12px] text-muted">Bemor topilmadi</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

function DoctorPicker({ value, onPick }) {
  const [open, setOpen, ref] = usePopover()
  const d = doctorOf(value)
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className={`flex h-12 w-full items-center gap-2.5 rounded-xl border bg-white px-2.5 text-left transition ${open ? 'border-sea' : 'border-[#e6ebf2]'}`}>
        <span className="relative">
          <PersonAvatar src={d.photo} name={d.name} size={32} />
          <span className="absolute -bottom-0.5 -right-0.5 grid size-3.5 place-items-center rounded-full border-2 border-white bg-[#16a34a]"><Check className="size-2 text-white" strokeWidth={4} /></span>
        </span>
        <span className="min-w-0 flex-1"><b className="block truncate text-[12.5px] text-ink">{d.name}</b><span className="text-[11px] text-muted">{d.role}</span></span>
        <ChevronDown className="size-4 shrink-0 text-muted" />
      </button>
      {open && (
        <ul className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border border-line bg-white p-1.5 shadow-lg">
          {DOCTORS.map((x) => (
            <li key={x.id}>
              <button type="button" onClick={() => { onPick(x.id); setOpen(false) }} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[#f4f8fb] ${x.id === value ? 'bg-sea-50' : ''}`}>
                <PersonAvatar src={x.photo} name={x.name} size={28} />
                <span className="min-w-0 flex-1"><b className="block text-[12px] text-ink">{x.name}</b><span className="text-[10.5px] text-muted">{x.role}</span></span>
                {x.id === value && <Check className="size-4 text-sea" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
