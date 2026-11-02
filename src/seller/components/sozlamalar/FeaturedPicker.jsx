import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Search, X } from 'lucide-react'
import { FEATURED_MAX, FEATURED_MIN, featuredError, move } from '../../../seller-public/lib'
import { som } from '../../../marketData'

// 'Tavsiya etilgan mahsulotlar': pick 4–8 of the seller's own active products, reorder.
export default function FeaturedPicker({ value, products, onChange }) {
  const [q, setQ] = useState('')
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const sel = value.filter((id) => byId.has(id))
  const rest = useMemo(() => { const t = q.trim().toLowerCase(); return products.filter((p) => !sel.includes(p.id) && (!t || p.name.toLowerCase().includes(t))).slice(0, 30) }, [products, sel, q])
  const err = featuredError(sel)
  const full = sel.length >= FEATURED_MAX
  return (
    <div>
      <div className="mb-1 flex items-center justify-between"><span className="text-[13px] font-semibold">Tavsiya etilgan mahsulotlar</span><span className="text-[12px] text-[#5C6E80]">{sel.length}/{FEATURED_MAX}</span></div>
      <p className="mb-2 text-[12px] text-[#5C6E80]">Do‘kon sahifasi tepasida «Tavsiya etamiz» bo‘limida chiqadi. {FEATURED_MIN}–{FEATURED_MAX} ta faol mahsulot tanlang.</p>
      {sel.length > 0 && <ol className="mb-2 divide-y divide-[#EEF3F4] rounded-xl border border-[#E2ECEE]">{sel.map((id, i) => { const p = byId.get(id); return (
        <li key={id} className="flex items-center gap-2 px-2 py-1.5">
          <span className="w-4 text-center text-[12px] font-bold text-[#5C6E80]">{i + 1}</span>
          <img src={p.image} alt="" className="size-9 rounded-lg object-cover" />
          <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold">{p.name}</span><span className="block text-[11.5px] text-[#5C6E80]">{som(p.price)}</span></span>
          <button type="button" aria-label="Yuqoriga" disabled={i === 0} onClick={() => onChange(move(sel, i, -1))} className="rounded-lg p-1 hover:bg-[#F0FDFA] disabled:opacity-30"><ArrowUp className="size-4" /></button>
          <button type="button" aria-label="Pastga" disabled={i === sel.length - 1} onClick={() => onChange(move(sel, i, 1))} className="rounded-lg p-1 hover:bg-[#F0FDFA] disabled:opacity-30"><ArrowDown className="size-4" /></button>
          <button type="button" aria-label="Olib tashlash" onClick={() => onChange(sel.filter((x) => x !== id))} className="rounded-lg p-1 hover:bg-[#FEF2F2]"><X className="size-4" /></button>
        </li>) })}</ol>}
      {err && <p className="mb-2 text-[12px] font-medium text-[#B45309]">{err}</p>}
      {!products.length ? <p className="rounded-lg bg-[#F6FAFA] px-3 py-2 text-[12.5px] text-[#5C6E80]">Faol mahsulotlaringiz yo‘q.</p> : <>
        <label className="flex h-10 items-center gap-2 rounded-xl border border-[#E2ECEE] px-3"><Search className="size-4 text-[#5C6E80]" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mahsulot qidirish" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" /></label>
        <ul className="mt-1 max-h-48 overflow-y-auto">{rest.map((p) => (
          <li key={p.id}><button type="button" disabled={full} onClick={() => onChange([...sel, p.id])} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[#F0FDFA] disabled:opacity-40">
            <img src={p.image} alt="" className="size-8 rounded-lg object-cover" /><span className="min-w-0 flex-1 truncate text-[13px]">{p.name}</span><Plus className="size-4 text-[#0F766E]" />
          </button></li>))}</ul>
      </>}
    </div>
  )
}
