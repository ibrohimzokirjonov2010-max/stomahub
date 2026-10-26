import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Pencil, Pause, Play, CalendarPlus, Copy, Trash2, ArrowLeft, Search, Package, ShoppingBag, Users, Coins, Tag, CalendarDays, Circle, StickyNote, ShoppingCart, ChevronRight, TicketPercent, Eye } from 'lucide-react'
import { useSellerData, updateRow, deleteRow } from '../api'
import { dmy, hm, som, num } from '../format'
import { useMobile } from '../../useMobile'
import { card, Btn, Crumbs, Pager, usePaged, Th, Td, toast, SearchInput, Input, Menu } from '../components/ui'
import Empty from '../components/shell/Empty'
import Modal from '../components/shell/Modal'
import Confirm from '../components/shell/Confirm'
import ProductThumb from '../components/bosh-sahifa/ProductThumb'
import DiscountForm from '../components/chegirmalar/DiscountForm'
import { DKIND, statusOf, usesOf, valueOf, productsOf, scopeText, newPrice, days } from '../components/chegirmalar/constants'
import { StatusBadge } from './Chegirmalar'
import { initials } from '../components/mijozlar/constants'
import { masked } from './Mijozlar'

export default function ChegirmaDetail() {
  const { id } = useParams()
  const data = useSellerData()
  const mobile = useMobile()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [del, setDel] = useState(false)
  const [extend, setExtend] = useState(false)
  const [newEnd, setNewEnd] = useState('')
  const [pq, setPq] = useState('')
  const [uq, setUq] = useState('')
  const d = data.discounts.find((x) => x.id === id)
  const prods = useMemo(() => (d ? productsOf(d, data.products) : []), [d, data.products])
  const uses = useMemo(() => (d ? usesOf(d, data.orders).sort((a, b) => b.created_at.localeCompare(a.created_at)) : []), [d, data.orders])
  const pf = prods.filter((p) => !pq || p.name.toLowerCase().includes(pq.toLowerCase()))
  const uf = uses.filter((o) => !uq || [o.code, o.customer_name].some((x) => (x || '').toLowerCase().includes(uq.toLowerCase())))
  const ppg = usePaged(pf, 5)
  const upg = usePaged(uf, mobile ? 5 : 5)
  if (data.loading) return null
  if (!d) return <div className={card}><Empty icon={TicketPercent} title="Chegirma topilmadi" text="U o‘chirilgan bo‘lishi mumkin." action={<Btn onClick={() => navigate('/sotuvchi/chegirmalar')}>Chegirmalarga qaytish</Btn>} /></div>
  const s = statusOf(d, data.orders)
  const [, kl, ks, KI] = DKIND[d.kind] || DKIND.foiz
  const saved = uses.reduce((a, o) => a + Number(o.discount_amount || 0), 0)
  const uniq = new Set(uses.map((o) => o.customer_id || o.customer_phone || o.customer_name)).size
  const toggle = async () => { const r = await updateRow('seller_discounts', d.id, { active: !d.active }); toast(r.ok ? (d.active ? 'Chegirma to‘xtatildi' : 'Chegirma yoqildi') : r.error) }
  const publish = async () => { const r = await updateRow('seller_discounts', d.id, { is_draft: false }); toast(r.ok ? 'Chegirma e’lon qilindi' : r.error) }
  const doExtend = async () => { if (!newEnd || newEnd < d.starts_on) return toast('Yangi tugash sanasini tanlang'); const r = await updateRow('seller_discounts', d.id, { ends_on: newEnd }); toast(r.ok ? 'Muddat uzaytirildi' : r.error); if (r.ok) setExtend(false) }
  const copyCode = () => { navigator.clipboard?.writeText(d.promo_code); toast('Promokod nusxalandi') }
  const info = [['Chegirma nomi', d.title], ['Holat', <StatusBadge key="s" s={s} />], ['Turi', kl], ['Qiymati', valueOf(d)], ['Promokod', d.promo_code || '—'], ['Minimal buyurtma', d.min_order ? som(d.min_order) : 'Mavjud emas'], ['Foydalanish limiti', d.usage_limit ? `${uses.length} / ${d.usage_limit}` : 'Cheklanmagan'], ['Boshlanish sanasi', dmy(d.starts_on)], ['Tugash sanasi', d.ends_on ? dmy(d.ends_on) : '—'], ['Qo‘llanish sohasi', scopeText(d, data.products)], ['Yaratilgan sana', `${dmy(d.created_at)} ${hm(d.created_at)}`], d.description && ['Izoh', d.description]].filter(Boolean)
  const canToggle = !['qoralama', 'tugagan'].includes(s)
  const modals = <>
    <DiscountForm open={!!form} edit={form?.edit} copy={form?.copy} onClose={() => setForm(null)} />
    <Confirm open={del} title="Chegirmani o‘chirish" text={`“${d.title}” o‘chiriladi. Bu amalni qaytarib bo‘lmaydi.`} okText="O‘chirish" onClose={() => setDel(false)} onOk={async () => { const r = await deleteRow('seller_discounts', d.id); toast(r.ok ? 'Chegirma o‘chirildi' : r.error); if (r.ok) navigate('/sotuvchi/chegirmalar') }} />
    <Modal open={extend} onClose={() => setExtend(false)} title="Muddatni uzaytirish" subtitle={`Hozirgi tugash sanasi: ${d.ends_on ? dmy(d.ends_on) : '—'}`} width="md:max-w-[420px]" footer={<div className="grid grid-cols-2 gap-3"><Btn variant="outline" onClick={() => setExtend(false)}>Bekor qilish</Btn><Btn onClick={doExtend}>Saqlash</Btn></div>}><Input type="date" value={newEnd} min={d.starts_on} onChange={(e) => setNewEnd(e.target.value)} /></Modal>
  </>

  if (mobile) return (
    <div className="space-y-3 pb-24">
      <div className="relative flex items-center justify-center py-1"><button type="button" aria-label="Orqaga" onClick={() => navigate('/sotuvchi/chegirmalar')} className="absolute left-0 text-[#0F766E]"><ArrowLeft className="size-6" /></button><h1 className="text-[19px] font-extrabold">Chegirma tafsiloti</h1></div>
      <div className={`${card} flex gap-3 p-3`}><ProductThumb src={prods[0]?.image_url} className="h-[110px] w-[120px] shrink-0" /><div className="min-w-0 flex-1"><div className="flex justify-end"><StatusBadge s={s} /></div><div className="text-[15px] font-bold">{d.title}</div><div className="truncate text-[12.5px] text-[#5C6E80]">{d.scope === 'all' ? 'Barcha mahsulotlar' : prods[0]?.name || d.category}</div><div className="text-[22px] font-extrabold text-[#0F766E]">{valueOf(d)}</div><div className="text-[12px] text-[#5C6E80]">chegirma</div><div className="mt-1 flex items-center gap-1 text-[12px]"><CalendarDays className="size-3.5 text-[#0F766E]" />{dmy(d.starts_on)} – {d.ends_on ? dmy(d.ends_on) : '…'}</div></div></div>
      <div className="grid grid-cols-3 gap-2">{[[ShoppingBag, uses.length, 'Sotuvlar soni'], [Users, uniq, 'Noyob mijozlar'], [Coins, som(saved), 'Umumiy chegirma']].map(([I, v, l]) => <div key={l} className="rounded-xl bg-[#F0FDFA] p-2.5"><div className="flex items-center gap-1.5 text-[13px] font-bold"><I className="size-4 shrink-0 text-[#0F766E]" /><span className="truncate">{v}</span></div><div className="mt-0.5 text-[11px] text-[#5C6E80]">{l}</div></div>)}</div>
      <div className={`${card} p-3 text-[13px]`}><div className="mb-1 font-bold">Chegirma ma’lumotlari</div>{info.map(([l, v]) => <div key={l} className="flex justify-between gap-3 border-b border-[#EEF3F4] py-2 last:border-0"><span className="shrink-0 text-[#5C6E80]">{l}</span><span className="text-right">{v}</span></div>)}</div>
      <div className={`${card} p-3`}><div className="mb-1 flex items-center gap-2 text-[14px] font-bold"><ShoppingCart className="size-4 text-[#0F766E]" />Sotuvlar tarixi</div>
        {uses.length ? upg.rows.map((o) => <button key={o.id} type="button" onClick={() => navigate(`/sotuvchi/buyurtmalar/${o.id}`)} className="flex w-full items-center gap-3 border-b border-[#EEF3F4] py-2 text-left last:border-0"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-[13px] font-bold text-[#0F766E]">{initials(o.customer_name)}</span><div className="min-w-0 flex-1 text-[13px]"><div className="truncate font-semibold">{o.customer_name}</div><div className="text-[11.5px] text-[#5C6E80]">{masked(o.customer_phone)}</div></div><span className="text-[11.5px] text-[#5C6E80]">{dmy(o.created_at)}</span><b className="text-[13px]">{som(o.subtotal)}</b><ChevronRight className="size-4" /></button>) : <p className="py-4 text-center text-[12.5px] text-[#5C6E80]">Hali bu chegirma bilan buyurtma bo‘lmagan.</p>}
        {upg.pages > 1 && <Pager {...upg} setPer={null} />}</div>
      <div className="space-y-2">
        <Btn className="w-full" icon={Pencil} onClick={() => setForm({ edit: d })}>Tahrirlash</Btn>
        {s === 'qoralama' && <Btn className="w-full" variant="outline" icon={Play} onClick={publish}>E’lon qilish</Btn>}
        {canToggle && <Btn className="w-full" variant="outline" icon={d.active ? Pause : Play} onClick={toggle}>{d.active ? 'To‘xtatish' : 'Yoqish'}</Btn>}
        <Btn className="w-full" variant="outline" icon={CalendarPlus} onClick={() => { setNewEnd(d.ends_on || ''); setExtend(true) }}>Muddatini uzaytirish</Btn>
        <Btn className="w-full" variant="outline" icon={Copy} onClick={() => setForm({ copy: d })}>Nusxalash</Btn>
        <Btn className="w-full" variant="outline" icon={Trash2} onClick={() => setDel(true)}>O‘chirish</Btn>
      </div>
      {modals}
    </div>
  )

  return (
    <div className="space-y-4">
      <Crumbs items={[['Chegirmalar', '/sotuvchi/chegirmalar'], ['Chegirma tafsiloti']]} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="flex items-center gap-3"><h1 className="text-[28px] font-extrabold tracking-tight">{d.title}</h1><StatusBadge s={s} /></div><p className="text-[14px] text-[#5C6E80]">{d.description || scopeText(d, data.products)}</p></div>
        <div className="flex flex-wrap gap-2">
          <Btn size="sm" variant="outline" icon={Pencil} onClick={() => setForm({ edit: d })}>Tahrirlash</Btn>
          {s === 'qoralama' && <Btn size="sm" icon={Play} onClick={publish}>E’lon qilish</Btn>}
          {canToggle && <Btn size="sm" variant="outline" icon={d.active ? Pause : Play} onClick={toggle}>{d.active ? 'To‘xtatish' : 'Yoqish'}</Btn>}
          <Btn size="sm" variant="outline" icon={CalendarPlus} onClick={() => { setNewEnd(d.ends_on || ''); setExtend(true) }}>Muddatini uzaytirish</Btn>
          <Btn size="sm" variant="outline" icon={Copy} onClick={() => setForm({ copy: d })}>Nusxa olish</Btn>
          <Btn size="sm" variant="gray" icon={Trash2} onClick={() => setDel(true)}>O‘chirish</Btn>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {[[KI, 'Chegirma turi', kl, ks], [Tag, 'Chegirma qiymati', valueOf(d)], [TicketPercent, 'Promokod', d.promo_code ? <button key="c" type="button" onClick={copyCode} className="flex items-center gap-1.5 rounded-lg border border-[#E6EEF0] px-2 py-0.5 text-[13px]">{d.promo_code}<Copy className="size-3.5" /></button> : '—'], [CalendarDays, 'Muddat', `${dmy(d.starts_on)} – ${d.ends_on ? dmy(d.ends_on) : '…'}`, d.ends_on ? `${days(d.starts_on, d.ends_on)} kun` : ''], [Package, 'Qo‘llanish sohasi', d.scope === 'all' ? 'Barcha mahsulotlar' : d.scope === 'category' ? d.category : 'Tanlangan mahsulotlar', `${prods.length} ta mahsulot`]].map(([I, l, v, sub]) => (
          <div key={l} className={`${card} flex items-center gap-3 p-3`}><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]"><I className="size-5" /></span><div className="min-w-0"><div className="text-[11.5px] text-[#5C6E80]">{l}</div><div className="truncate text-[14px] font-bold">{v}</div>{sub && <div className="truncate text-[11px] text-[#5C6E80]">{sub}</div>}</div></div>))}
      </div>
      <div className="grid grid-cols-[1fr_290px] gap-4">
        <div className={`${card} p-4`}>
          <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-[15px] font-bold">Qamrab olingan mahsulotlar ({prods.length})</h2><Btn size="sm" variant="outline" icon={Pencil} onClick={() => setForm({ edit: d })}>Mahsulotlarni o‘zgartirish</Btn></div>
          <SearchInput value={pq} onChange={setPq} placeholder="Mahsulot nomi bo‘yicha qidirish..." className="mb-2 max-w-[320px]" />
          {ppg.rows.length ? <><table className="w-full table-fixed"><colgroup><col className="w-[36px]" /><col /><col className="w-[150px]" /><col className="w-[110px]" /><col className="w-[120px]" /><col className="w-[56px]" /></colgroup>
            <thead className="bg-[#F6FAFA]"><tr><Th>#</Th><Th>Mahsulot</Th><Th>Kategoriya</Th><Th>Eski narx</Th><Th>Yangi narx</Th><Th /></tr></thead>
            <tbody>{ppg.rows.map((p, i) => <tr key={p.id} className="border-t border-[#EEF3F4]"><Td className="text-[#5C6E80]">{ppg.offset + i + 1}</Td><Td><div className="flex items-center gap-2"><ProductThumb src={p.image_url} className="h-8 w-10 shrink-0" /><span className="truncate">{p.name}</span></div></Td><Td className="truncate text-[#5C6E80]">{p.category || '—'}</Td><Td className="text-[#8A98A5] line-through">{som(p.price)}</Td><Td className="font-bold text-[#0F766E]">{d.kind === 'bir_bepul' ? '2+1' : som(newPrice(d, p.price))}</Td><Td><Menu items={[['Mahsulotni ko‘rish', () => navigate(`/sotuvchi/mahsulotlar/${p.id}`), Eye]]} /></Td></tr>)}</tbody></table>
            <div className="mt-2"><Pager {...ppg} /></div></> : <p className="py-6 text-center text-[13px] text-[#5C6E80]">Mahsulot topilmadi.</p>}
        </div>
        <div className={`${card} p-4 text-[12.5px]`}><h2 className="mb-2 text-[15px] font-bold">Chegirma ma’lumotlari</h2>{info.map(([l, v]) => <div key={l} className="grid grid-cols-[120px_1fr] gap-2 border-b border-[#EEF3F4] py-1.5 last:border-0"><span className="text-[#5C6E80]">{l}</span><span>{v}</span></div>)}</div>
      </div>
      <div className={`${card} p-4`}>
        <div className="mb-3 flex items-center gap-3"><h2 className="text-[15px] font-bold">Foydalanish tarixi ({uses.length})</h2><SearchInput value={uq} onChange={setUq} placeholder="Buyurtma raqami yoki mijoz nomi bo‘yicha qidirish..." className="max-w-[340px] flex-1" /></div>
        {upg.rows.length ? <><table className="w-full table-fixed"><colgroup><col className="w-[40px]" /><col className="w-[140px]" /><col /><col className="w-[150px]" /><col className="w-[110px]" /><col className="w-[150px]" /><col className="w-[150px]" /><col className="w-[56px]" /></colgroup>
          <thead className="bg-[#F6FAFA]"><tr><Th>#</Th><Th>Buyurtma raqami</Th><Th>Mijoz</Th><Th>Sana</Th><Th className="text-center">Mahsulotlar</Th><Th>Chegirma summasi</Th><Th>Buyurtma summasi</Th><Th /></tr></thead>
          <tbody>{upg.rows.map((o, i) => <tr key={o.id} className="cursor-pointer border-t border-[#EEF3F4] hover:bg-[#F8FCFC]" onClick={() => navigate(`/sotuvchi/buyurtmalar/${o.id}`)}><Td className="text-[#5C6E80]">{upg.offset + i + 1}</Td><Td className="font-semibold">{o.code}</Td><Td className="truncate">{o.customer_name}</Td><Td className="text-[#5C6E80]">{dmy(o.created_at)} {hm(o.created_at)}</Td><Td className="text-center">{o.items.length}</Td><Td className="font-semibold text-[#0F766E]">{som(o.discount_amount || 0)}</Td><Td>{som(o.subtotal)}</Td><Td><ChevronRight className="size-4" /></Td></tr>)}</tbody></table>
          <div className="mt-2"><Pager {...upg} /></div></> : <p className="py-6 text-center text-[13px] text-[#5C6E80]">Hali bu chegirma bilan buyurtma bo‘lmagan. Buyurtma yaratishda chegirmani tanlasangiz, shu yerda ko‘rinadi.</p>}
      </div>
      {modals}
    </div>
  )
}
