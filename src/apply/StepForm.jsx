import { useMemo, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, FileText, ImagePlus, Loader2, Paperclip, Trash2, Upload } from 'lucide-react'
import MapPicker from '../components/MapPicker'
import PhoneInput, { extractUzLocalDigits, toE164 } from '../components/PhoneInput'
import { uploadMedia } from '../seller/api'

const inputCls = 'h-12 w-full rounded-xl border bg-white px-3.5 text-[15px] text-[#10283F] outline-none placeholder:text-[#8A98A8] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15'
const MAX_DOC = 10 * 1024 * 1024
const DOC_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']

/** Validate one step. Returns { field: message }. */
export function validateStep(step, v, files = {}) {
  const e = {}
  for (const f of step.fields || []) {
    const val = f.type === 'map' ? null : v[f.name]
    const msg = f.validate?.(val ?? '', v) || ''
    if (msg && !(f.optional && !val && f.type !== 'map')) e[f.name] = msg
  }
  for (const d of step.docs || []) {
    if (d.required && !files[d.key]) e[d.key] = `${d.label} yuklang`
  }
  return e
}

/**
 * Config-driven multi-step form (seller now, organizer later).
 * config.steps[]: { id, title, heading, fields?: [...], docs?: [...] }
 * onSubmit(values, files) -> { ok, error }
 */
export default function StepForm({ config, initial, onSubmit, title, subtitle, extraTop }) {
  const steps = config.steps
  const [i, setI] = useState(0)
  const [v, setV] = useState(initial)
  const [files, setFiles] = useState({})
  const [errs, setErrs] = useState({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const top = useRef(null)
  const step = steps[i]
  const last = i === steps.length - 1
  const set = (k, val) => { setV((x) => ({ ...x, [k]: val })); setErrs((x) => ({ ...x, [k]: '' })) }

  const next = async () => {
    const e = validateStep(step, v, files)
    setErrs(e)
    if (Object.keys(e).length) { setErr('Belgilangan maydonlarni to‘ldiring'); return }
    setErr('')
    if (!last) { setI(i + 1); top.current?.scrollIntoView({ block: 'start' }); window.scrollTo(0, 0); return }
    for (const s of steps) { const e2 = validateStep(s, v, files); if (Object.keys(e2).length) { setI(steps.indexOf(s)); setErrs(e2); setErr('Belgilangan maydonlarni to‘ldiring'); return } }
    setBusy(true)
    const r = await onSubmit(v, files)
    setBusy(false)
    if (!r?.ok) setErr(r?.error || 'Yuborilmadi')
  }

  return (
    <div ref={top} data-testid="step-form" className="mx-auto w-full max-w-[760px]">
      <div className="px-1">
        <h1 className="text-[24px] font-extrabold leading-tight tracking-tight text-[#10283F] md:text-[28px]">{title || config.title}</h1>
        {(subtitle || config.subtitle) && <p className="mt-1.5 text-[14px] leading-relaxed text-[#5C6E80]">{subtitle || config.subtitle}</p>}
      </div>
      {extraTop}
      {steps.length > 1 && <Stepper steps={steps} i={i} onPick={(n) => n < i && setI(n)} />}
      <div className="mt-4 rounded-[20px] border border-[#E6EEF0] bg-white p-4 shadow-[0_1px_2px_rgb(16_40_63/0.04)] md:p-6">
        <h2 className="text-[17px] font-bold text-[#10283F]">{step.heading}</h2>
        {steps.length > 1 && <p className="mt-0.5 text-[12.5px] text-[#8A98A8]">{i + 1}-qadam / {steps.length}</p>}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(step.fields || []).map((f) => <FieldView key={f.name} f={f} v={v} set={set} setV={setV} err={errs[f.name]} />)}
          {(step.docs || []).map((d) => <DocInput key={d.key} d={d} file={files[d.key]} err={errs[d.key]} onFile={(file) => { setFiles((x) => ({ ...x, [d.key]: file })); setErrs((x) => ({ ...x, [d.key]: '' })) }} />)}
        </div>
        {step.docs && <p className="mt-3 text-[12.5px] leading-relaxed text-[#5C6E80]">Hujjatlar himoyalangan omborda saqlanadi va faqat siz hamda administrator ko‘ra oladi. JPG, PNG yoki PDF, 10 MB gacha.</p>}
      </div>
      {err && <p data-testid="form-error" className="mt-3 rounded-xl bg-[#FDECEC] px-3.5 py-2.5 text-[13px] font-medium text-[#B42318]">{err}</p>}
      <div className="sticky bottom-0 z-10 -mx-4 mt-4 flex gap-3 border-t border-[#E6EEF0] bg-white/95 px-4 pt-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:pt-0" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        {i > 0 && <button type="button" onClick={() => setI(i - 1)} className="inline-flex h-12 items-center justify-center gap-1 rounded-xl border border-[#DCE5E7] bg-white px-5 text-[15px] font-semibold text-[#10283F]"><ChevronLeft className="size-4" /> Orqaga</button>}
        <button type="button" data-testid="step-next" disabled={busy} onClick={next} className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0F766E] px-5 text-[15px] font-semibold text-white hover:bg-[#115E59] disabled:opacity-60 md:flex-none md:min-w-[220px] md:ml-auto">
          {busy ? <><Loader2 className="size-4 animate-spin" /> Yuborilmoqda…</> : last ? <><Check className="size-4" /> {config.submitLabel || 'Yuborish'}</> : <>Davom etish <ChevronRight className="size-4" /></>}
        </button>
      </div>
    </div>
  )
}

function Stepper({ steps, i, onPick }) {
  return (
    <ol className="mt-5 flex items-center gap-1.5">
      {steps.map((s, n) => (
        <li key={s.id} className="flex flex-1 items-center gap-1.5">
          <button type="button" onClick={() => onPick(n)} className="flex min-w-0 items-center gap-2">
            <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[12.5px] font-bold ${n < i ? 'bg-[#0F766E] text-white' : n === i ? 'bg-[#0F766E] text-white ring-4 ring-[#0F766E]/15' : 'bg-[#EEF2F3] text-[#8A98A8]'}`}>{n < i ? <Check className="size-3.5" /> : n + 1}</span>
            <span className={`hidden truncate text-[13px] font-semibold sm:block ${n <= i ? 'text-[#10283F]' : 'text-[#8A98A8]'}`}>{s.title}</span>
          </button>
          {n < steps.length - 1 && <span className={`h-0.5 flex-1 rounded ${n < i ? 'bg-[#0F766E]' : 'bg-[#E6EEF0]'}`} />}
        </li>
      ))}
    </ol>
  )
}

function Label({ f }) {
  return <span className="mb-1.5 block text-[13.5px] font-semibold text-[#10283F]">{f.label}{f.required && <span className="text-[#D14343]"> *</span>}{f.optional && <span className="font-normal text-[#8A98A8]"> (ixtiyoriy)</span>}</span>
}

function FieldView({ f, v, set, setV, err }) {
  const border = err ? 'border-[#D14343]' : 'border-[#DCE5E7]'
  const wrap = `block ${f.full || f.type === 'textarea' || f.type === 'map' || f.type === 'choice' || f.type === 'logo' ? 'md:col-span-2' : ''}`
  const Tag = ['choice', 'map', 'logo'].includes(f.type) ? 'div' : 'label'
  let control
  if (f.type === 'phone') control = <PhoneInput className={`h-12 rounded-xl ${border}`} value={v[f.name]} invalid={!!err} onChange={(val) => set(f.name, toE164(val) || extractUzLocalDigits(val))} valueMode="e164" />
  else if (f.type === 'select') control = (
    <select data-field={f.name} value={v[f.name]} onChange={(e) => set(f.name, e.target.value)} className={`${inputCls} ${border} appearance-none`}>
      <option value="">Tanlang</option>
      {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>)
  else if (f.type === 'textarea') control = <textarea data-field={f.name} value={v[f.name]} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} rows={4} className={`${inputCls} ${border} h-auto py-3`} />
  else if (f.type === 'choice') control = (
    <div className="grid gap-3 sm:grid-cols-2">
      {f.options.map(([val, l, sub]) => (
        <button key={val} type="button" data-choice={val} onClick={() => set(f.name, val)} className={`flex items-center gap-3 rounded-xl border p-3.5 text-left ${v[f.name] === val ? 'border-[#0F766E] bg-[#E3F4F1] ring-2 ring-[#0F766E]/15' : border + ' bg-white'}`}>
          <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${v[f.name] === val ? 'border-[#0F766E]' : 'border-[#C5D1D4]'}`}>{v[f.name] === val && <span className="size-2.5 rounded-full bg-[#0F766E]" />}</span>
          <span><span className="block text-[15px] font-bold text-[#10283F]">{l}</span><span className="block text-[12.5px] text-[#5C6E80]">{sub}</span></span>
        </button>
      ))}
    </div>)
  else if (f.type === 'map') control = (
    <div className={`overflow-hidden rounded-xl border ${border}`}>
      <MapPicker lat={v.lat} lng={v.lng} height={220} onChange={({ lat, lng, geo }) => { setV((x) => ({ ...x, lat, lng, ...(geo?.street && !x.address ? { address: [geo.city, geo.district && geo.district !== 'Markaz' ? geo.district : '', geo.street].filter(Boolean).join(', ') } : {}) })) }} />
    </div>)
  else if (f.type === 'logo') control = <LogoInput value={v[f.name]} onChange={(url) => set(f.name, url)} />
  else control = <input data-field={f.name} type={f.type === 'email' ? 'email' : 'text'} inputMode={f.inputMode} maxLength={f.maxLength} value={v[f.name]} onChange={(e) => set(f.name, f.clean ? f.clean(e.target.value) : e.target.value)} placeholder={f.placeholder} className={`${inputCls} ${border}`} />
  return (
    <Tag className={wrap} data-wrap={f.name}>
      <Label f={f} />
      {control}
      {err ? <span className="mt-1 block text-[12.5px] font-medium text-[#D14343]">{err}</span> : f.hint ? <span className="mt-1 block text-[12px] text-[#8A98A8]">{f.hint}</span> : null}
    </Tag>
  )
}

function LogoInput({ value, onChange }) {
  const ref = useRef(null)
  const [busy, setBusy] = useState(false)
  const [e, setE] = useState('')
  const pick = async (ev) => {
    const f = ev.target.files?.[0]; ev.target.value = ''
    if (!f) return
    if (!/^image\//.test(f.type)) return setE('Faqat rasm yuklang')
    if (f.size > 2 * 1024 * 1024) return setE('Rasm 2 MB dan oshmasin')
    setBusy(true); setE('')
    const r = await uploadMedia(f, 'logo')
    setBusy(false)
    if (!r.ok) return setE(r.error || 'Yuklanmadi')
    onChange(r.url)
  }
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-dashed border-[#C5D1D4] bg-[#F4FBFA] text-[#0F766E]">
        {value ? <img src={value} alt="Logo" className="size-full object-cover" /> : <ImagePlus className="size-6" />}
      </span>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => ref.current?.click()} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#DCE5E7] bg-white px-3.5 text-[14px] font-semibold text-[#10283F]">{busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} {value ? 'Almashtirish' : 'Logo yuklash'}</button>
        {value && <button type="button" onClick={() => onChange('')} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-[14px] font-semibold text-[#D14343]"><Trash2 className="size-4" /> O‘chirish</button>}
        {e && <span className="w-full text-[12.5px] text-[#D14343]">{e}</span>}
      </div>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" hidden data-field="logo" onChange={pick} />
    </div>
  )
}

function DocInput({ d, file, err, onFile }) {
  const ref = useRef(null)
  const [e, setE] = useState('')
  const preview = useMemo(() => (file && /^image\//.test(file.type) ? URL.createObjectURL(file) : ''), [file])
  const pick = (ev) => {
    const f = ev.target.files?.[0]; ev.target.value = ''
    if (!f) return
    if (!DOC_TYPES.includes(f.type)) return setE('Faqat JPG, PNG, WEBP yoki PDF')
    if (f.size > MAX_DOC) return setE('Fayl 10 MB dan katta')
    setE(''); onFile(f)
  }
  const msg = e || err
  return (
    <div className="md:col-span-1">
      <span className="mb-1.5 block text-[13.5px] font-semibold text-[#10283F]">{d.label}{d.required && <span className="text-[#D14343]"> *</span>}</span>
      <button type="button" data-doc={d.key} onClick={() => ref.current?.click()} className={`flex w-full items-center gap-3 rounded-xl border border-dashed p-3.5 text-left ${msg ? 'border-[#D14343] bg-[#FFF7F7]' : file ? 'border-[#0F766E] bg-[#F4FBFA]' : 'border-[#C5D1D4] bg-white'}`}>
        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#E3F4F1] text-[#0F766E]">
          {preview ? <img src={preview} alt="" className="size-full object-cover" /> : file ? <FileText className="size-5" /> : <Paperclip className="size-5" />}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-semibold text-[#10283F]">{file ? file.name : 'Fayl tanlash'}</span>
          <span className="block text-[12px] text-[#5C6E80]">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · almashtirish uchun bosing` : d.hint}</span>
        </span>
      </button>
      {msg && <span className="mt-1 block text-[12.5px] font-medium text-[#D14343]">{msg}</span>}
      <input ref={ref} type="file" accept={DOC_TYPES.join(',')} hidden data-docinput={d.key} onChange={pick} />
    </div>
  )
}
