import { useEffect, useMemo, useState } from 'react'
import { Check, FileText, Search, X, Plus, CircleCheck, Circle } from 'lucide-react'
import { insertRow, updateRow, useAsync, useSellerData } from '../../api'
import { Btn, Input, Textarea, Select, Err, toast } from '../ui'
import Modal from '../shell/Modal'
import ProductThumb from '../bosh-sahifa/ProductThumb'
import { DKINDS, SCOPES, today } from './constants'

const blank = () => ({ title: '', kind: 'foiz', value: '', promo_code: '', scope: 'all', product_ids: [], category: '', min_order: '', usage_limit: '', starts_on: today(), ends_on: '', description: '' })
const L = ({ children }) => <div className="mb-1.5 text-[13px] font-semibold text-[#10283F]">{children}</div>

export default function DiscountForm({ open, onClose, edit, copy, onSaved }) {
  const { products } = useSellerData()
  const [v, setV] = useState(blank())
  const [q, setQ] = useState('')
  const a = useAsync()
  useEffect(() => {
    if (!open) return
    const src = edit || copy
    setV(src ? { ...blank(), ...src, title: copy ? `${src.title} (nusxa)` : src.title, value: src.value || src.percent || '', min_order: src.min_order || '', usage_limit: src.usage_limit || '', ends_on: src.ends_on || '', product_ids: src.product_ids?.length ? src.product_ids : src.product_id ? [src.product_id] : [] } : blank())
    a.setError(''); setQ('')
  }, [open, edit, copy]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e?.target ? e.target.value : e }))
  const cats = [...new Set(products.map((p) => p.category).filter(Boolean))]
  const found = useMemo(() => { const s = q.trim().toLowerCase(); return s ? products.filter((p) => !v.product_ids.includes(p.id) && p.name.toLowerCase().includes(s)).slice(0, 6) : [] }, [q, products, v.product_ids])
  function save(draft) {
    if (!v.title.trim()) return a.setError('Chegirma nomini kiriting')
    const val = Number(v.value || 0)
    if (!draft) {
      if (v.kind !== 'bir_bepul' && (['foiz', 'promokod'].includes(v.kind) ? !(val >= 1 && val <= 90) : !(val > 0))) return a.setError(v.kind === 'summa' ? 'Chegirma summasini kiriting' : 'Foiz 1 dan 90 gacha bo‘lsin')
      if (v.kind === 'promokod' && !v.promo_code.trim()) return a.setError('Promokodni kiriting')
      if (v.scope === 'products' && !v.product_ids.length) return a.setError('Kamida bitta mahsulot tanlang')
      if (v.scope === 'category' && !v.category) return a.setError('Kategoriyani tanlang')
      if (!v.ends_on) return a.setError('Tugash sanasini kiriting')
      if (v.ends_on < v.starts_on) return a.setError('Tugash sanasi boshlanishdan oldin bo‘lmasin')
    }
    const row = { title: v.title.trim(), kind: v.kind, value: v.kind === 'bir_bepul' ? 0 : val, percent: ['foiz', 'promokod'].includes(v.kind) && val >= 1 && val <= 90 ? val : null,
      promo_code: v.promo_code.trim().toUpperCase(), scope: v.scope, product_ids: v.scope === 'products' ? v.product_ids : [], product_id: null, category: v.scope === 'category' ? v.category : '',
      min_order: Number(v.min_order || 0), usage_limit: v.usage_limit ? Number(v.usage_limit) : null, starts_on: v.starts_on || today(), ends_on: v.ends_on || null, description: (v.description || '').trim(), is_draft: !!draft, active: true }
    a.go(() => (edit ? updateRow('seller_discounts', edit.id, row) : insertRow('seller_discounts', row)), (r) => { toast(draft ? 'Qoralama saqlandi' : edit ? 'Chegirma yangilandi' : 'Chegirma yaratildi'); onSaved?.(r.data); onClose() })
  }
  const unit = v.kind === 'summa' ? 'so‘m' : '%'
  const footer = <div className="grid grid-cols-2 gap-3 md:grid-cols-[1fr_1fr_1.3fr]"><Btn variant="outline" icon={FileText} disabled={a.busy} onClick={() => save(true)} className="col-span-2 md:col-span-1">Qoralama saqlash</Btn><Btn variant="gray" onClick={onClose}>Bekor qilish</Btn><Btn icon={Check} disabled={a.busy} onClick={() => save(false)}>{edit ? 'Saqlash' : 'Chegirmani yaratish'}</Btn></div>
  return (
    <Modal open={open} onClose={onClose} full width="max-w-[620px]" title={edit ? 'Chegirmani tahrirlash' : 'Chegirma yaratish'} subtitle="Sotuvni oshirish uchun yangi chegirma yarating." footer={footer}>
      <div className="space-y-4">
        <div><L>Chegirma nomi *</L><Input value={v.title} onChange={set('title')} placeholder="Masalan: Oktabr aksiyasi" maxLength={80} /></div>
        <div><L>Chegirma turi *</L><div className="grid grid-cols-2 gap-2 md:grid-cols-4">{DKINDS.map(([k, l, s, I]) => <button key={k} type="button" onClick={() => setV((x) => ({ ...x, kind: k }))} className={`rounded-xl border p-2.5 text-center ${v.kind === k ? 'border-[#0F766E] bg-[#F0FDFA]' : 'border-[#E6EEF0] hover:border-[#99D5CE]'}`}><I className="mx-auto size-6 text-[#0F766E]" /><div className="mt-1 text-[13px] font-semibold">{l}</div><div className="text-[11px] text-[#5C6E80]">{s}</div></button>)}</div></div>
        <div className="grid gap-3 md:grid-cols-2">
          {v.kind !== 'bir_bepul' && <div><L>Chegirma qiymati *</L><div className="relative"><Input type="number" min="1" value={v.value} onChange={set('value')} placeholder={v.kind === 'summa' ? 'Masalan: 50 000' : 'Masalan: 20'} className="pr-12" /><span className="absolute inset-y-0 right-0 grid w-11 place-items-center border-l border-[#DCE5E7] text-[13px] text-[#5C6E80]">{unit}</span></div></div>}
          <div><L>Promokod {v.kind === 'promokod' ? '*' : '(ixtiyoriy)'}</L><Input value={v.promo_code} onChange={(e) => set('promo_code')(e.target.value.toUpperCase().replace(/\s/g, ''))} placeholder="Masalan: OKTABR10" maxLength={20} /></div>
        </div>
        <div><L>Qo‘llanish sohasi *</L><div className="grid gap-2 md:grid-cols-3">{SCOPES.map(([k, l, s]) => { const on = v.scope === k; const I = on ? CircleCheck : Circle; return <button key={k} type="button" onClick={() => setV((x) => ({ ...x, scope: k }))} className={`flex items-start gap-2 rounded-xl border p-2.5 text-left ${on ? 'border-[#0F766E] bg-[#F0FDFA]' : 'border-[#E6EEF0]'}`}><I className={`mt-0.5 size-4 shrink-0 ${on ? 'text-[#0F766E]' : 'text-[#8A98A5]'}`} /><span><span className="block text-[13px] font-semibold">{l}</span><span className="text-[11.5px] text-[#5C6E80]">{s}</span></span></button> })}</div></div>
        {v.scope === 'products' && <div><L>Mahsulotlar *</L>
          <div className="relative"><Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mahsulot qidirish..." />
            {found.length > 0 && <div className="absolute inset-x-0 top-full z-10 mt-1 rounded-xl border border-[#E6EEF0] bg-white p-1 shadow-lg">{found.map((p) => <button key={p.id} type="button" onClick={() => { setV((x) => ({ ...x, product_ids: [...x.product_ids, p.id] })); setQ('') }} className="flex w-full items-center gap-2 rounded-lg p-1.5 text-left text-[13px] hover:bg-[#F0FDFA]"><ProductThumb src={p.image_url} className="h-7 w-9" /><span className="flex-1 truncate">{p.name}</span><Plus className="size-4 text-[#0F766E]" /></button>)}</div>}</div>
          <div className="mt-2 flex flex-wrap gap-2">{v.product_ids.map((id) => { const p = products.find((x) => x.id === id); return <span key={id} className="flex items-center gap-1.5 rounded-lg border border-[#E6EEF0] p-1 pr-2 text-[12px]"><ProductThumb src={p?.image_url} className="h-6 w-8" /><span className="max-w-[140px] truncate">{p?.name || 'O‘chirilgan'}</span><button type="button" aria-label="Olib tashlash" onClick={() => setV((x) => ({ ...x, product_ids: x.product_ids.filter((y) => y !== id) }))}><X className="size-3.5" /></button></span> })}{!v.product_ids.length && <span className="text-[12px] text-[#5C6E80]">Hali mahsulot tanlanmagan — yuqoridan qidiring.</span>}</div></div>}
        {v.scope === 'category' && <div><L>Kategoriya *</L><Select value={v.category} onChange={set('category')} placeholder="Kategoriyani tanlang" options={cats.map((c) => [c, c])} /></div>}
        <div className="grid grid-cols-2 gap-3">
          <div><L>Minimal buyurtma summasi</L><div className="relative"><Input type="number" min="0" value={v.min_order} onChange={set('min_order')} placeholder="Masalan: 500 000" className="pr-12" /><span className="absolute inset-y-0 right-3 grid place-items-center text-[12.5px] text-[#5C6E80]">so‘m</span></div></div>
          <div><L>Foydalanish limiti</L><div className="relative"><Input type="number" min="1" value={v.usage_limit} onChange={set('usage_limit')} placeholder="Masalan: 100" className="pr-14" /><span className="absolute inset-y-0 right-3 grid place-items-center text-[12.5px] text-[#5C6E80]">marta</span></div></div>
          <div><L>Boshlanish sanasi *</L><Input type="date" value={v.starts_on} onChange={set('starts_on')} /></div>
          <div><L>Tugash sanasi *</L><Input type="date" value={v.ends_on} min={v.starts_on} onChange={set('ends_on')} /></div>
        </div>
        <div><L>Tavsif (ixtiyoriy)</L><Textarea value={v.description} onChange={set('description')} maxLength={300} placeholder="Chegirma haqida qisqacha" className="min-h-[60px]" /></div>
        <Err>{a.error}</Err>
      </div>
    </Modal>
  )
}
