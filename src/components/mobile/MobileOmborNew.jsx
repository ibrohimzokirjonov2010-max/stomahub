import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, CalendarDays, Camera, ChevronDown, ImagePlus, MapPin, Save, UserRound, X } from 'lucide-react'
import { CATEGORIES, PLACES, SUPPLIERS, UNITS, addOmbor, patchOmbor, useOmbor } from '../../omborData'
import { todayIso } from '../../uchrashuvData'
import MobileTabBar from './MobileTabBar'
import { HubTopBar } from './MobileKategoriyalar'
import { fmt } from './MobileOmbor'

const PREFIX = {
  'Restavratsion material': 'CMP', Anesteziya: 'AN', Implantlar: 'IMP', Endodontiya: 'END', Asboblar: 'INS', 'Sarf materiallar': 'DISP', Dezinfeksiya: 'DIS', Profilaktika: 'PRF', Bondlar: 'BND', Uskunalar: 'EQP',
}
const toIso = (dmy) => (dmy ? dmy.split('.').reverse().join('-') : '')
const toDmy = (iso) => (iso ? iso.split('-').reverse().join('.') : '')
const digits = (v, max = 9) => v.replace(/\D/g, '').slice(0, max)

export default function MobileOmborNew() {
  const navigate = useNavigate()
  const location = useLocation()
  const rows = useOmbor()
  const fileRef = useRef(null)
  const formRef = useRef(null)
  const [edit] = useState(() => rows.find((r) => r.id === location.state?.edit) || null)
  const [f, setF] = useState(() => ({
    name: edit?.name || '', category: edit?.category || '', desc: edit?.desc || '', qty: edit ? String(edit.qty) : '', unit: edit?.unit || '',
    min: edit ? String(edit.min) : '', alert: edit?.alert ?? true, price: edit?.price ? String(edit.price) : '', supplier: edit?.supplier || '',
    expiry: toIso(edit?.expiry || ''), batch: edit?.batch || '', place: edit?.place || '', note: edit?.note || '',
  }))
  const [image, setImage] = useState(edit?.image || '')
  const [imgErr, setImgErr] = useState('')
  const [tried, setTried] = useState(false)
  const set = (k, fn = (v) => v) => (e) => setF((s) => ({ ...s, [k]: fn(e.target.value) }))

  const errs = {
    name: f.name.trim().length < 2,
    category: !f.category,
    qty: f.qty === '',
    unit: !f.unit,
    min: f.min === '',
    price: !Number(f.price),
    supplier: !f.supplier,
  }
  const bad = (k) => tried && errs[k]
  const box = (k) => `relative flex h-11 items-center gap-2.5 rounded-xl border bg-white px-3 transition focus-within:border-sea ${bad(k) ? 'border-sale' : 'border-line'}`
  const input = 'min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted'

  const pick = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setImgErr('Rasm 5MB dan katta'); return }
    setImgErr('')
    const r = new FileReader()
    r.onload = () => setImage(r.result)
    r.readAsDataURL(file)
  }

  const save = () => {
    setTried(true)
    if (Object.values(errs).some(Boolean)) {
      requestAnimationFrame(() => formRef.current?.querySelector('[data-bad="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
      return
    }
    const data = {
      name: f.name.trim(), category: f.category, desc: f.desc.trim(), qty: Number(f.qty), unit: f.unit, min: Number(f.min), alert: f.alert,
      price: Number(f.price), supplier: f.supplier, expiry: toDmy(f.expiry), batch: f.batch.trim(), place: f.place || 'Asosiy ombor', note: f.note.trim(), image,
    }
    if (edit) {
      patchOmbor(edit.id, data)
    } else {
      const pre = PREFIX[f.category] || 'OM'
      const n = rows.reduce((m, r) => (r.sku.startsWith(`${pre}-`) ? Math.max(m, Number(r.sku.split('-')[1]) || 0) : m), 0) + 1
      addOmbor({ ...data, id: `new-${Date.now()}`, sku: `${pre}-${String(n).padStart(3, '0')}`, pack: f.desc.trim().split('\n')[0].slice(0, 40) || `1 ${f.unit}` })
    }
    navigate('/ombor', { replace: true, state: { toast: `${data.name} ${edit ? 'yangilandi' : 'omborga qo‘shildi'}` } })
  }
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/ombor'))

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_30%,#f6faf9_100%)] pb-[150px]">
      <div className="px-3.5 pt-3">
        <HubTopBar onBack={back} />
        <h1 className="mt-3 text-[24px] font-extrabold leading-tight tracking-tight text-[#0d2a4a]">{edit ? 'Mahsulotni tahrirlash' : 'Omborga mahsulot qo‘shish'}</h1>
        <p className="text-[12.5px] text-[#7d8fa9]">{edit ? `SKU: ${edit.sku}` : 'Klinika omboriga yangi mahsulot qo‘shing'}</p>
      </div>

      <div ref={formRef} className="mx-3.5 mt-3 flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-[0_1px_4px_rgb(11_31_58/0.06)]">
        <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-2.5">
          <div>
            <p className="mb-1.5 text-[12.5px] font-semibold text-ink">Mahsulot rasmi</p>
            <button type="button" onClick={() => fileRef.current?.click()} className="relative flex h-[118px] w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border-2 border-dashed border-[#a9d7d3] bg-[#f3faf9] text-center">
              {image ? (
                <>
                  <img src={image} alt="Mahsulot rasmi" className="absolute inset-0 size-full object-cover" />
                  <span className="absolute bottom-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-white/95 text-sea shadow"><Camera className="size-4" /></span>
                </>
              ) : (
                <>
                  <span className="relative text-[#8a9bb0]"><ImagePlus className="size-9" strokeWidth={1.4} /></span>
                  <b className="text-[12px] font-semibold text-[#0b6d73]">Rasm yuklang</b>
                  <span className="text-[9.5px] text-muted">JPG, PNG (maks. 5 MB)</span>
                </>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg" onChange={pick} className="hidden" />
            {imgErr && <p className="mt-1 text-[11px] text-sale">{imgErr}</p>}
          </div>
          <div className="flex min-w-0 flex-col gap-2.5">
            <Field label="Mahsulot nomi" req bad={bad('name')}>
              <div className={box('name')}><input value={f.name} onChange={set('name')} placeholder="Mahsulot nomini kiriting" className={input} /></div>
            </Field>
            <Field label="Kategoriya" req bad={bad('category')}>
              <Select value={f.category} onChange={(v) => setF((s) => ({ ...s, category: v }))} options={CATEGORIES} placeholder="Kategoriyani tanlang" className={box('category')} />
            </Field>
          </div>
        </div>

        <Field label="Tavsif">
          <textarea value={f.desc} maxLength={500} onChange={set('desc')} rows={3} placeholder="Mahsulot haqida qo‘shimcha ma’lumot yozing..." className="w-full resize-none rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] text-ink outline-none placeholder:text-muted focus:border-sea" />
          <p className="text-right text-[10.5px] text-muted">{f.desc.length}/500</p>
        </Field>

        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Miqdori" req bad={bad('qty')}>
            <div className={box('qty')}><input value={f.qty ? fmt(f.qty) : ''} onChange={set('qty', (v) => digits(v, 7))} inputMode="numeric" placeholder="Miqdor kiriting" className={input} /></div>
          </Field>
          <Field label="O‘lchov birligi" req bad={bad('unit')}>
            <Select value={f.unit} onChange={(v) => setF((s) => ({ ...s, unit: v }))} options={UNITS} placeholder="Birlikni tanlang" className={box('unit')} />
          </Field>
        </div>

        <div className="grid grid-cols-2 items-end gap-2.5">
          <Field label="Minimal zaxira" req bad={bad('min')}>
            <div className={box('min')}><input value={f.min ? fmt(f.min) : ''} onChange={set('min', (v) => digits(v, 6))} inputMode="numeric" placeholder="Minimal miqdor" className={input} /></div>
          </Field>
          <button type="button" role="switch" aria-checked={f.alert} onClick={() => setF((s) => ({ ...s, alert: !s.alert }))} className="flex items-start gap-2 rounded-xl bg-[#e9f6f4] p-2.5 text-left">
            <Bell className="mt-0.5 size-4 shrink-0 text-sea" strokeWidth={1.8} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <b className="min-w-0 flex-1 text-[11.5px] font-semibold leading-tight text-ink">Zaxira haqida ogohlantirish</b>
                <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${f.alert ? 'bg-[#0b8a95]' : 'bg-line'}`}><span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${f.alert ? 'left-[18px]' : 'left-0.5'}`} /></span>
              </span>
              <span className="mt-0.5 block text-[9.5px] leading-snug text-muted">Miqdor minimal zaxiradan kam bo‘lsa, bildirishnoma yuboriladi.</span>
            </span>
          </button>
        </div>
        {f.qty !== '' && f.min !== '' && Number(f.qty) < Number(f.min) && <p className="-mt-1.5 text-[11px] font-medium text-[#e07a2e]">Miqdor minimal zaxiradan kam — mahsulot “Kam qoldi” deb belgilanadi</p>}

        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Narxi (so‘m)" req bad={bad('price')}>
            <div className={box('price')}><input value={f.price ? fmt(f.price) : ''} onChange={set('price', (v) => digits(v, 10))} inputMode="numeric" placeholder="Narx kiriting" className={input} /></div>
          </Field>
          <Field label="Yetkazib beruvchi" req bad={bad('supplier')}>
            <Select value={f.supplier} onChange={(v) => setF((s) => ({ ...s, supplier: v }))} options={SUPPLIERS} placeholder="Tanlang" lead={<UserRound className="size-4 shrink-0 text-sea" />} className={box('supplier')} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Yaroqlilik muddati">
            <label className={box('expiry')}>
              <CalendarDays className="size-4 shrink-0 text-sea" strokeWidth={1.8} />
              <span className={`min-w-0 flex-1 truncate text-[13px] ${f.expiry ? 'text-ink' : 'text-muted'}`}>{f.expiry ? toDmy(f.expiry) : 'Sana tanlang'}</span>
              {f.expiry && <button type="button" onClick={(e) => { e.preventDefault(); setF((s) => ({ ...s, expiry: '' })) }} aria-label="Sanani tozalash" className="relative z-10 text-muted"><X className="size-3.5" /></button>}
              <input type="date" value={f.expiry} min={todayIso()} onChange={set('expiry')} onClick={(e) => e.currentTarget.showPicker?.()} aria-label="Yaroqlilik muddati" className="absolute inset-0 size-full cursor-pointer opacity-0" />
            </label>
          </Field>
          <Field label="Partiya raqami" opt>
            <div className={box('batch')}><input value={f.batch} onChange={set('batch')} maxLength={24} placeholder="Partiya raqami" className={input} /></div>
          </Field>
        </div>

        <Field label="Saqlash joyi" opt>
          <Select value={f.place} onChange={(v) => setF((s) => ({ ...s, place: v }))} options={PLACES} placeholder="Saqlash joyini tanlang" lead={<MapPin className="size-4 shrink-0 text-sea" />} className={box('place')} />
        </Field>

        <Field label="Eslatma" opt>
          <textarea value={f.note} maxLength={300} onChange={set('note')} rows={2} placeholder="Qo‘shimcha eslatmalar..." className="w-full resize-none rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] text-ink outline-none placeholder:text-muted focus:border-sea" />
          <p className="text-right text-[10.5px] text-muted">{f.note.length}/300</p>
        </Field>
      </div>

      <div className="fixed inset-x-0 bottom-[62px] z-30 grid grid-cols-2 gap-2.5 border-t border-line/60 bg-white/95 px-3.5 py-2.5 backdrop-blur">
        <button type="button" onClick={back} className="h-12 rounded-xl border border-[#0b8a95] text-[14px] font-semibold text-[#0b6d73]">Bekor qilish</button>
        <button type="button" onClick={save} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0b8a95] text-[14px] font-semibold text-white shadow-[0_6px_14px_rgb(11_138_149/0.3)] active:scale-[0.99]"><Save className="size-5" /> Saqlash</button>
      </div>
      <MobileTabBar />
    </div>
  )
}

function Field({ label, req, opt, bad, children }) {
  return (
    <div data-bad={bad ? 'true' : undefined} className="min-w-0">
      <p className="mb-1.5 truncate text-[12.5px] font-semibold text-ink">{label} {req && <span className="text-sale">*</span>}{opt && <span className="font-normal text-[#8fa3b8]">(ixtiyoriy)</span>}</p>
      {children}
    </div>
  )
}

function Select({ value, onChange, options, placeholder, lead, className }) {
  return (
    <label className={className}>
      {lead}
      <span className={`min-w-0 flex-1 truncate text-[13px] ${value ? 'text-ink' : 'text-muted'}`}>{value || placeholder}</span>
      <ChevronDown className="size-4 shrink-0 text-ink-2" />
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={placeholder} className="absolute inset-0 size-full cursor-pointer opacity-0">
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}
