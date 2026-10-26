import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, SlidersHorizontal, ChevronRight, CalendarDays, TicketPercent, Pencil, Copy, Trash2, Eye, Pause, Play, Download, X } from 'lucide-react'
import { useSellerData, updateRow, deleteRow, csvDownload } from '../api'
import { dmy } from '../format'
import { useMobile } from '../../useMobile'
import { card, PageHead, Btn, Select, SearchInput, Tabs, Chips, Badge, Pager, usePaged, Menu, Fab, Th, Td, toast, Toggle, Input } from '../components/ui'
import Empty from '../components/shell/Empty'
import Modal from '../components/shell/Modal'
import Confirm from '../components/shell/Confirm'
import ProductThumb from '../components/bosh-sahifa/ProductThumb'
import DiscountForm from '../components/chegirmalar/DiscountForm'
import { DKIND, DKINDS, STATUS, statusOf, usesOf, valueOf, productsOf, scopeText } from '../components/chegirmalar/constants'

export const StatusBadge = ({ s }) => <Badge tone={STATUS[s][1]} dot>{STATUS[s][0]}</Badge>
export const KindPill = ({ k }) => { const [, l, , I] = DKIND[k] || DKIND.foiz; return <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F0FDFA] px-2.5 py-1 text-[12px] text-[#0F766E]"><I className="size-3.5" />{l}</span> }

export default function Chegirmalar() {
  const data = useSellerData()
  const mobile = useMobile()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState(mobile ? 'all' : 'faol')
  const [kind, setKind] = useState('')
  const [st, setSt] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [form, setForm] = useState(null)
  const [del, setDel] = useState(null)
  const [filters, setFilters] = useState(false)
  useEffect(() => { if (sp.get('new')) { setForm({}); sp.delete('new'); setSp(sp, { replace: true }) } }, [sp, setSp])
  const rows = useMemo(() => data.discounts.map((d) => ({ ...d, s: statusOf(d, data.orders), used: usesOf(d, data.orders).length, prods: productsOf(d, data.products) })).sort((a, b) => b.created_at.localeCompare(a.created_at)), [data.discounts, data.orders, data.products])
  const grp = (r) => r.s
  const cnt = (k) => rows.filter((r) => grp(r) === k).length
  const tabs = [...(mobile ? [['all', 'Barchasi', rows.length]] : []), ['faol', 'Faol', cnt('faol')], ['reja', 'Rejalashtirilgan', cnt('reja')], ['toxtatilgan', 'To‘xtatilgan', cnt('toxtatilgan')], ['tugagan', 'Tugagan', cnt('tugagan')], ...(mobile ? [] : [['qoralama', 'Qoralama', cnt('qoralama')]])]
  const list = rows.filter((r) => {
    if (tab !== 'all' && grp(r) !== tab) return false
    if (kind && r.kind !== kind) return false
    if (st && r.s !== st) return false
    if (from && (r.ends_on || '9999') < from) return false
    if (to && r.starts_on > to) return false
    const s = q.trim().toLowerCase()
    if (s && ![r.title, r.promo_code, r.description, ...r.prods.map((p) => p.name)].some((x) => (x || '').toLowerCase().includes(s))) return false
    return true
  })
  const pg = usePaged(list, mobile ? 20 : 10)
  useEffect(() => { pg.setPage(1) }, [q, tab, kind, st, from, to]) // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = async (r) => { const res = await updateRow('seller_discounts', r.id, { active: !r.active }); toast(res.ok ? (r.active ? 'Chegirma to‘xtatildi' : 'Chegirma yoqildi') : res.error) }
  const open = (r) => navigate(`/sotuvchi/chegirmalar/${r.id}`)
  const items = (r) => [['Ko‘rish', () => open(r), Eye], ['Tahrirlash', () => setForm({ edit: r }), Pencil], ['Nusxa olish', () => setForm({ copy: r }), Copy], r.s !== 'qoralama' && r.s !== 'tugagan' && [r.active ? 'To‘xtatish' : 'Yoqish', () => toggle(r), r.active ? Pause : Play], ['O‘chirish', () => setDel(r), Trash2]]
  const filtered = q || kind || st || from || to
  const clear = () => { setQ(''); setKind(''); setSt(''); setFrom(''); setTo('') }
  const exportCsv = () => csvDownload('chegirmalar.csv', [['Nomi', 'Turi', 'Qiymati', 'Promokod', 'Boshlanish', 'Tugash', 'Foydalanildi', 'Holat'], ...list.map((r) => [r.title, DKIND[r.kind]?.[1], valueOf(r), r.promo_code, r.starts_on, r.ends_on || '', r.used, STATUS[r.s][0]])])
  const empty = <Empty icon={TicketPercent} title={rows.length ? 'Mos chegirma topilmadi' : 'Hali chegirmalar yo‘q'} text={rows.length ? 'Filtrlarni o‘zgartirib ko‘ring.' : 'Chegirma yoki promokod yaratib, sotuvni oshiring.'} action={!rows.length && <Btn icon={Plus} onClick={() => setForm({})}>Chegirma yaratish</Btn>} />
  const modals = <>
    <DiscountForm open={!!form} edit={form?.edit} copy={form?.copy} onClose={() => setForm(null)} />
    <Confirm open={!!del} title="Chegirmani o‘chirish" text={`“${del?.title}” o‘chiriladi. Bu amalni qaytarib bo‘lmaydi.`} okText="O‘chirish" onClose={() => setDel(null)} onOk={async () => { const r = await deleteRow('seller_discounts', del.id); toast(r.ok ? 'Chegirma o‘chirildi' : r.error); setDel(null) }} />
  </>
  const kindOpts = [['', 'Barchasi'], ...DKINDS.map((k) => [k[0], k[1]])]
  const stOpts = [['', 'Barchasi'], ...Object.entries(STATUS).map(([k, v]) => [k, v[0]])]

  if (mobile) return (
    <div className="space-y-3 pb-24">
      <PageHead title="Chegirmalar" subtitle="Mijozlarni jalb qilish uchun chegirmalar yarating." />
      <div className="flex gap-2"><SearchInput value={q} onChange={setQ} placeholder="Chegirma nomi yoki mahsulot bo‘yicha qidirish..." className="flex-1" /><button type="button" aria-label="Filtrlar" onClick={() => setFilters(true)} className={`grid size-[42px] shrink-0 place-items-center rounded-xl border ${filtered ? 'border-[#0F766E] bg-[#F0FDFA]' : 'border-[#DCE5E7]'} text-[#0F766E]`}><SlidersHorizontal className="size-5" /></button></div>
      <div className="overflow-x-auto"><Chips tabs={tabs} value={tab} onChange={setTab} /></div>
      {pg.rows.length ? pg.rows.map((r) => (
        <button key={r.id} type="button" onClick={() => open(r)} className={`${card} flex w-full items-center gap-3 p-2.5 text-left`}>
          <ProductThumb src={r.prods[0]?.image_url} className="h-[72px] w-[84px] shrink-0" />
          <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-bold">{r.title}</div><div className="truncate text-[12px] text-[#5C6E80]">{r.scope === 'all' ? 'Barcha mahsulotlar' : r.prods[0]?.name || r.category || '—'}</div><div className="mt-1 flex items-center gap-1 text-[11.5px] text-[#5C6E80]"><CalendarDays className="size-3.5 text-[#0F766E]" />{dmy(r.starts_on)} – {r.ends_on ? dmy(r.ends_on) : '…'}</div></div>
          <div className="shrink-0 text-right"><StatusBadge s={r.s} /><div className="mt-1 text-[15px] font-extrabold">{valueOf(r)}</div><div className="text-[11px] text-[#5C6E80]">chegirma</div></div><ChevronRight className="size-4 shrink-0" />
        </button>)) : <div className={card}>{empty}</div>}
      {pg.pages > 1 && <Pager {...pg} setPer={null} />}
      <Fab icon={Plus} onClick={() => setForm({})}>Chegirma yaratish</Fab>
      <Modal open={filters} onClose={() => setFilters(false)} title="Filtrlar" footer={<div className="grid grid-cols-2 gap-3"><Btn variant="outline" onClick={clear}>Tozalash</Btn><Btn onClick={() => setFilters(false)}>Qo‘llash</Btn></div>}>
        <div className="space-y-3 text-[13px]"><label className="block">Chegirma turi<Select value={kind} onChange={setKind} options={kindOpts} /></label><label className="block">Holat<Select value={st} onChange={setSt} options={stOpts} /></label><div className="grid grid-cols-2 gap-2"><label>Dan<Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label><label>Gacha<Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label></div></div>
      </Modal>
      {modals}
    </div>
  )

  return (
    <div className="space-y-4">
      <PageHead title="Chegirmalar" subtitle="Sotuvni oshirish uchun maxsus takliflar yarating." action={<Btn icon={Plus} size="lg" onClick={() => setForm({})}>Chegirma yaratish</Btn>} />
      <div className="flex items-center justify-between gap-3"><Tabs tabs={tabs} value={tab} onChange={setTab} /><Btn size="sm" variant="outline" icon={Download} onClick={exportCsv} disabled={!list.length}>Eksport</Btn></div>
      <div className={`${card} flex flex-wrap items-end gap-3 p-3`}>
        <SearchInput value={q} onChange={setQ} placeholder="Chegirma nomi yoki promokod..." className="min-w-[220px] flex-1" />
        <label className="w-[170px] text-[12.5px] text-[#3D4E5F]">Chegirma turi<Select value={kind} onChange={setKind} options={kindOpts} /></label>
        <label className="w-[160px] text-[12.5px] text-[#3D4E5F]">Holat<Select value={st} onChange={setSt} options={stOpts} /></label>
        <div className="text-[12.5px] text-[#3D4E5F]">Muddat<div className="flex items-center gap-1.5"><Input type="date" className="w-[146px]" value={from} onChange={(e) => setFrom(e.target.value)} />–<Input type="date" className="w-[146px]" value={to} onChange={(e) => setTo(e.target.value)} /></div></div>
        {filtered && <Btn variant="outline" icon={X} onClick={clear}>Tozalash</Btn>}
      </div>
      <div className={`${card} overflow-hidden`}>
        {pg.rows.length ? <><table className="w-full table-fixed">
          <colgroup><col className="w-[38px]" /><col /><col className="w-[138px]" /><col className="w-[110px]" /><col className="w-[84px]" /><col className="w-[96px]" /><col className="w-[90px]" /><col className="w-[110px]" /><col className="w-[104px]" /></colgroup>
          <thead className="bg-[#F6FAFA]"><tr><Th>#</Th><Th>Chegirma nomi</Th><Th>Turi</Th><Th>Qiymati</Th><Th className="text-center">Mahsulot</Th><Th>Muddat</Th><Th className="text-center">Foydalanildi</Th><Th className="text-center">Holat</Th><Th className="text-center">Amallar</Th></tr></thead>
          <tbody>{pg.rows.map((r, i) => (
            <tr key={r.id} className="cursor-pointer border-t border-[#EEF3F4] hover:bg-[#F8FCFC]" onClick={() => open(r)}>
              <Td className="text-[#5C6E80]">{pg.offset + i + 1}</Td>
              <Td><div className="flex items-center gap-2.5"><ProductThumb src={r.prods[0]?.image_url} className="h-9 w-11 shrink-0" /><div className="min-w-0"><div className="truncate font-semibold">{r.title}</div><div className="truncate text-[11.5px] text-[#5C6E80]">{r.min_order ? `Minimal buyurtma ${Number(r.min_order).toLocaleString('ru').replace(/,/g, ' ')} so‘m` : scopeText(r, data.products)}</div></div></div></Td>
              <Td><KindPill k={r.kind} /></Td>
              <Td className="font-bold">{valueOf(r)}</Td>
              <Td className="text-center">{r.prods.length}</Td>
              <Td className="text-[12px] text-[#5C6E80]">{dmy(r.starts_on)}<br />{r.ends_on ? dmy(r.ends_on) : '—'}</Td>
              <Td className="text-center">{r.used}{r.usage_limit ? <span className="text-[#5C6E80]"> / {r.usage_limit}</span> : ''}</Td>
              <Td className="text-center"><div onClick={(e) => e.stopPropagation()} className="inline-flex">{r.s === 'faol' || r.s === 'toxtatilgan' || r.s === 'reja' ? <Toggle checked={r.active} onChange={() => toggle(r)} /> : <StatusBadge s={r.s} />}</div></Td>
              <Td><div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}><button type="button" title="Tahrirlash" onClick={() => setForm({ edit: r })} className="rounded-lg p-1.5 hover:bg-[#F0FDFA]"><Pencil className="size-4" /></button><button type="button" title="Nusxa olish" onClick={() => setForm({ copy: r })} className="rounded-lg p-1.5 hover:bg-[#F0FDFA]"><Copy className="size-4" /></button><Menu items={items(r)} /></div></Td>
            </tr>))}</tbody></table>
          <div className="border-t border-[#EEF3F4] p-3"><Pager {...pg} /></div></> : empty}
      </div>
      {modals}
    </div>
  )
}
