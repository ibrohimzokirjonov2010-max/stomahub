import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Search, Trash2, Info, MapPin, CalendarDays, Plus, X } from 'lucide-react'
import { insertRow, updateRow, useAsync, useSellerData } from '../../api'
import { som } from '../../format'
import { useMobile } from '../../../useMobile'
import { Btn, Input, Textarea, Select, Err, toast, Checkbox } from '../ui'
import Modal from '../shell/Modal'
import ProductThumb from '../bosh-sahifa/ProductThumb'
import { CKINDS, CKIND, REGIONS, daysBetween } from './constants'

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const blank = () => ({ title: '', kind: 'qidiruv', product_ids: [], daily_budget: '', total_budget: '', starts_on: today(), ends_on: '', region: 'Barcha hududlar', description: '' })
const L = ({ children }) => <div className="mb-1.5 text-[13px] font-semibold text-[#10283F]">{children}</div>
const STEPS = [['Turi', 'Reklama turini tanlang'], ['Mahsulotlar', 'Mahsulotlarni tanlang'], ['Byudjet va muddat', 'Byudjet, sana va hudud'], ['Tasdiqlash', 'Ma’lumotlarni tekshiring']]

export default function CampaignForm({ open, onClose, edit, copy, onSaved }) {
  const { products } = useSellerData()
  const mobile = useMobile()
  const [v, setV] = useState(blank())
  const [step, setStep] = useState(0)
  const [q, setQ] = useState('')
  const [pick, setPick] = useState(false)
  const a = useAsync()
  useEffect(() => {
    if (!open) return
    const src = edit || copy
    setV(src ? { ...blank(), ...src, title: copy ? `${src.title} (nusxa)` : src.title, product_ids: src.product_ids?.length ? src.product_ids : src.product_id ? [src.product_id] : [], daily_budget: src.daily_budget || '', total_budget: src.total_budget || '', ends_on: src.ends_on || '', starts_on: copy ? today() : src.starts_on } : blank())
    setStep(0); setQ(''); setPick(false); a.setError('')
  }, [open, edit, copy]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e?.target ? e.target.value : e }))
  const active = products.filter((p) => p.status === 'active')
  const chosen = v.product_ids.map((id) => products.find((p) => p.id === id)).filter(Boolean)
  const found = useMemo(() => { const s = q.trim().toLowerCase(); return active.filter((p) => !s || `${p.name} ${p.category}`.toLowerCase().includes(s)) }, [q, active])
  const toggleP = (id) => setV((x) => ({ ...x, product_ids: x.product_ids.includes(id) ? x.product_ids.filter((y) => y !== id) : [...x.product_ids, id] }))

  function check(upto) {
    if (upto >= 0 && !v.kind) return 'Reklama turini tanlang'
    if (upto >= 1 && !v.product_ids.length) return 'Kamida bitta mahsulot tanlang'
    if (upto >= 2) {
      if (!(Number(v.daily_budget) >= 10000)) return 'Kunlik byudjet kamida 10 000 so‘m bo‘lsin'
      if (v.total_budget && Number(v.total_budget) < Number(v.daily_budget)) return 'Umumiy byudjet kunlik byudjetdan kam bo‘lmasin'
      if (!v.starts_on || !v.ends_on) return 'Boshlanish va tugash sanasini kiriting'
      if (v.ends_on < v.starts_on) return 'Tugash sanasi boshlanishdan oldin bo‘lmasin'
      const d = daysBetween(v.starts_on, v.ends_on); if (d > 90) return 'Kampaniya muddati 90 kundan oshmasin'
    }
    if (upto >= 3 && !v.title.trim()) return 'Kampaniya nomini kiriting'
    return ''
  }
  const next = () => { const e = check(step); if (e) return a.setError(e); a.setError(''); setStep(step + 1) }
  function save() {
    const e = check(3); if (e) return a.setError(e)
    const row = { title: v.title.trim(), kind: v.kind, product_ids: v.product_ids, product_id: v.product_ids[0] || null, daily_budget: Number(v.daily_budget), total_budget: v.total_budget ? Number(v.total_budget) : null,
      starts_on: v.starts_on, ends_on: v.ends_on, days: Math.min(90, daysBetween(v.starts_on, v.ends_on)), region: v.region, description: (v.description || '').trim(), ...(edit ? {} : { status: 'faol' }) }
    a.go(() => (edit ? updateRow('seller_campaigns', edit.id, row) : insertRow('seller_campaigns', row)), (r) => { toast(edit ? 'Kampaniya yangilandi' : 'Kampaniya yaratildi'); onSaved?.(r.data); onClose() })
  }

  const kinds = <div className="grid gap-2 md:grid-cols-3">{CKINDS.map(([k, l, s, I]) => <button key={k} type="button" onClick={() => setV((x) => ({ ...x, kind: k }))} className={`relative rounded-xl border p-3 text-left ${v.kind === k ? 'border-[#0F766E] bg-[#F0FDFA]' : 'border-[#E6EEF0] hover:border-[#99D5CE]'}`}>{v.kind === k && <Check className="absolute right-2 top-2 size-4 text-[#0F766E]" />}<I className="size-6 text-[#0F766E]" /><div className="mt-1.5 text-[13.5px] font-bold">{l}</div><div className="text-[12px] text-[#5C6E80]">{s}</div></button>)}</div>
  const picker = <div>
    <Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mahsulot nomi yoki kategoriya..." />
    <div className="mt-2 max-h-[320px] space-y-1 overflow-y-auto">{found.length ? found.map((p) => <label key={p.id} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-2 ${v.product_ids.includes(p.id) ? 'border-[#0F766E] bg-[#F0FDFA]' : 'border-[#EEF3F4]'}`}><Checkbox checked={v.product_ids.includes(p.id)} onChange={() => toggleP(p.id)} /><ProductThumb src={p.image_url} className="h-10 w-12 shrink-0" /><div className="min-w-0 flex-1"><div className="truncate text-[13px] font-semibold">{p.name}</div><div className="text-[11.5px] text-[#5C6E80]">Mavjud: {p.stock} {p.unit || 'dona'}</div></div><b className="text-[13px]">{som(p.price)}</b></label>) : <p className="py-6 text-center text-[13px] text-[#5C6E80]">{active.length ? 'Mahsulot topilmadi.' : 'Faol mahsulotlar yo‘q. Avval mahsulot qo‘shing va tasdiqlanishini kuting.'}</p>}</div>
  </div>
  const chosenList = <div className="rounded-xl border border-[#E6EEF0]"><div className="flex items-center justify-between gap-2 border-b border-[#EEF3F4] p-2.5"><b className="text-[13.5px]">Tanlangan mahsulotlar ({chosen.length} ta)</b><Btn size="sm" variant="outline" onClick={() => (mobile ? setPick(true) : setStep(1))}>Mahsulotlarni o‘zgartirish</Btn></div>{chosen.map((p) => <div key={p.id} className="flex items-center gap-2.5 border-b border-[#EEF3F4] p-2 last:border-0"><ProductThumb src={p.image_url} className="h-9 w-11 shrink-0" /><div className="min-w-0 flex-1"><div className="truncate text-[12.5px]">{p.name}</div><div className="text-[11px] text-[#5C6E80]">{p.unit || ''}</div></div><b className="text-[12.5px] text-[#0F766E]">{som(p.price)}</b><button type="button" aria-label="Olib tashlash" onClick={() => toggleP(p.id)} className="p-1.5"><Trash2 className="size-4" /></button></div>)}{!chosen.length && <p className="p-3 text-[12.5px] text-[#5C6E80]">Mahsulot tanlanmagan.</p>}</div>
  const budget = <div className="space-y-3">
    <div className="grid gap-3 md:grid-cols-2">
      <div><L>Kunlik byudjet *</L><div className="relative"><Input type="number" min="10000" step="1000" value={v.daily_budget} onChange={set('daily_budget')} placeholder="Masalan: 50 000" className="pr-12" /><span className="absolute inset-y-0 right-3 grid place-items-center text-[12.5px] text-[#5C6E80]">so‘m</span></div><p className="mt-1 text-[11.5px] text-[#5C6E80]">Reklamangiz har kuni shu summagacha sarflanadi.</p></div>
      <div><L>Umumiy byudjet (ixtiyoriy)</L><div className="relative"><Input type="number" min="0" step="1000" value={v.total_budget} onChange={set('total_budget')} placeholder="Masalan: 1 500 000" className="pr-12" /><span className="absolute inset-y-0 right-3 grid place-items-center text-[12.5px] text-[#5C6E80]">so‘m</span></div><p className="mt-1 text-[11.5px] text-[#5C6E80]">Bo‘sh qoldirilsa, muddat oxirigacha sarflanadi.</p></div>
      <div><L>Boshlanish sanasi *</L><Input icon={CalendarDays} type="date" value={v.starts_on} onChange={set('starts_on')} /></div>
      <div><L>Tugash sanasi *</L><Input icon={CalendarDays} type="date" min={v.starts_on} value={v.ends_on} onChange={set('ends_on')} /></div>
    </div>
    <div><L>Ko‘rsatish hududi *</L><span className="relative block"><MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 size-[18px] -translate-y-1/2 text-[#0F766E]" /><Select value={v.region} onChange={set('region')} options={REGIONS} className="[&_select]:pl-10" /></span><p className="mt-1 text-[11.5px] text-[#5C6E80]">Reklamangiz tanlangan hududdagi foydalanuvchilarga ko‘rsatiladi.</p></div>
  </div>
  const note = <div className="flex gap-2.5 rounded-xl bg-[#F0FDFA] p-3 text-[12.5px]"><Info className="size-5 shrink-0 text-[#0F766E]" /><div><b>To‘lov reklama balansidan yechiladi.</b><div className="text-[#5C6E80]">Har bir bosish 1 000 so‘m, kunlik byudjetdan oshmaydi. Balans naqd tushumlar hisobidan to‘ldiriladi.</div></div></div>
  const d = daysBetween(v.starts_on, v.ends_on)
  const summary = <div className="space-y-3">
    <div><L>Kampaniya nomi *</L><Input value={v.title} onChange={set('title')} placeholder="Masalan: Implantlar reklama kampaniyasi" maxLength={80} /></div>
    <div><L>Izoh (ixtiyoriy)</L><Textarea value={v.description} onChange={set('description')} maxLength={300} className="min-h-[60px]" placeholder="Kampaniya maqsadi haqida qisqacha" /></div>
    <div className="rounded-xl border border-[#E6EEF0] text-[13px]">{[['Turi', CKIND[v.kind]?.[1]], ['Mahsulotlar', `${chosen.length} ta`], ['Kunlik byudjet', som(v.daily_budget)], ['Umumiy byudjet', v.total_budget ? som(v.total_budget) : 'Cheklanmagan'], ['Muddat', d ? `${v.starts_on.split('-').reverse().join('.')} – ${v.ends_on.split('-').reverse().join('.')} (${d} kun)` : '—'], ['Hudud', v.region], ['Maksimal xarajat', d ? som(Math.min(Number(v.total_budget) || Infinity, Number(v.daily_budget) * d)) : '—']].map(([l, x]) => <div key={l} className="flex justify-between gap-3 border-b border-[#EEF3F4] px-3 py-2 last:border-0"><span className="text-[#5C6E80]">{l}</span><b className="text-right">{x}</b></div>)}</div>
    {note}
  </div>

  if (mobile) {
    const first = chosen[0]
    return <>
      <Modal open={open && !pick} onClose={onClose} full title={edit ? 'Kampaniyani tahrirlash' : 'Kampaniya yaratish'} subtitle="Mahsulotingizni ko‘proq mijozlarga yetkazing." footer={<div className="grid grid-cols-2 gap-3"><Btn variant="outline" icon={X} onClick={onClose}>Bekor qilish</Btn><Btn icon={edit ? Check : Plus} disabled={a.busy} onClick={save}>{edit ? 'Saqlash' : 'Kampaniyani yaratish'}</Btn></div>}>
        <div className="space-y-4">
          <div><L>Kampaniya nomi</L><Input value={v.title} onChange={set('title')} placeholder="Masalan: Implantlar reklama kampaniyasi" maxLength={80} /></div>
          <div><L>Reklama turi</L><Select value={v.kind} onChange={set('kind')} options={CKINDS.map((k) => [k[0], k[1]])} /></div>
          <div><L>Mahsulot tanlash</L><button type="button" onClick={() => setPick(true)} className="flex w-full items-center gap-3 rounded-xl border border-[#DCE5E7] p-2.5 text-left">{first ? <><ProductThumb src={first.image_url} className="h-[70px] w-[84px] shrink-0" /><div className="min-w-0 flex-1"><div className="truncate text-[14px] font-bold">{first.name}{chosen.length > 1 && <span className="font-normal text-[#5C6E80]"> +{chosen.length - 1}</span>}</div><div className="text-[12px] text-[#5C6E80]">Mavjud: {first.stock} {first.unit || 'dona'}</div><div className="text-[14px] font-bold">{som(first.price)}</div></div></> : <span className="flex-1 py-3 text-[14px] text-[#8A98A5]">Mahsulotni tanlang</span>}<ChevronRight className="size-5" /></button></div>
          <div><L>Joylashuv</L><span className="relative block"><MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 size-[18px] -translate-y-1/2 text-[#0F766E]" /><Select value={v.region} onChange={set('region')} options={REGIONS} className="[&_select]:pl-10" /></span></div>
          <div><L>Kunlik byudjet (so‘m)</L><Input type="number" min="10000" value={v.daily_budget} onChange={set('daily_budget')} placeholder="Masalan: 100 000" /></div>
          <div><L>Umumiy byudjet (ixtiyoriy)</L><Input type="number" min="0" value={v.total_budget} onChange={set('total_budget')} placeholder="Masalan: 1 500 000" /></div>
          <div><L>Boshlanish sanasi</L><Input icon={CalendarDays} type="date" value={v.starts_on} onChange={set('starts_on')} /></div>
          <div><L>Tugash sanasi</L><Input icon={CalendarDays} type="date" min={v.starts_on} value={v.ends_on} onChange={set('ends_on')} /></div>
          {note}
          <Err>{a.error}</Err>
        </div>
      </Modal>
      <Modal open={open && pick} onClose={() => setPick(false)} full title="Mahsulot tanlash" subtitle={`${chosen.length} ta tanlandi`} footer={<Btn className="w-full" onClick={() => setPick(false)}>Tayyor</Btn>}>{picker}</Modal>
    </>
  }
  return (
    <Modal open={open} onClose={onClose} full width="max-w-[680px]" title={edit ? 'Kampaniyani tahrirlash' : 'Reklama kampaniyasi yaratish'} subtitle="Mahsulotingizni ko‘proq mijozlarga yetkazing."
      footer={<div className="flex items-center justify-between gap-3">{step > 0 ? <Btn variant="outline" icon={ChevronLeft} onClick={() => { a.setError(''); setStep(step - 1) }}>Ortga</Btn> : <span />}<div className="flex gap-3"><Btn variant="gray" onClick={onClose}>Bekor qilish</Btn>{step < 3 ? <Btn onClick={next}>Keyingi<ChevronRight className="size-[18px]" /></Btn> : <Btn icon={Check} disabled={a.busy} onClick={save}>{edit ? 'Saqlash' : 'Kampaniyani yaratish'}</Btn>}</div></div>}>
      <div className="mb-4 grid grid-cols-4">{STEPS.map(([t, s], i) => <button key={t} type="button" onClick={() => { if (i <= step || !check(i - 1)) { a.setError(''); setStep(i) } }} className="relative text-center">{i > 0 && <span className={`absolute right-1/2 top-[15px] h-0.5 w-[calc(100%-36px)] -translate-x-[18px] ${i <= step ? 'bg-[#0F766E]' : 'bg-[#CCE3E0]'}`} />}<span className={`relative mx-auto grid size-[30px] place-items-center rounded-full border text-[13px] font-semibold ${i === step ? 'border-[#0F766E] bg-[#0F766E] text-white' : i < step ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]' : 'border-[#CCE3E0] bg-white text-[#5C6E80]'}`}>{i < step ? <Check className="size-4" /> : i + 1}</span><div className="mt-1 text-[12.5px] font-semibold">{t}</div><div className="text-[11px] text-[#5C6E80]">{s}</div></button>)}</div>
      <h3 className="text-[15px] font-bold">{STEPS[step][0]}</h3>
      <p className="mb-3 text-[12.5px] text-[#5C6E80]">{['Reklamangiz qayerda ko‘rsatilishini tanlang.', 'Reklama qilinadigan mahsulotlarni belgilang.', 'Reklamangiz uchun byudjet, muddat va ko‘rsatish hududini belgilang.', 'Kampaniyaga nom bering va ma’lumotlarni tekshiring.'][step]}</p>
      {step === 0 && kinds}
      {step === 1 && picker}
      {step === 2 && <div className="space-y-3">{budget}{chosenList}{note}</div>}
      {step === 3 && summary}
      <div className="mt-3"><Err>{a.error}</Err></div>
    </Modal>
  )
}
