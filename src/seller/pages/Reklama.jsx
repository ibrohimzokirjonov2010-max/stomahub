import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Wallet, Megaphone, Filter, Pencil, BarChart3, Eye, Copy, Pause, Play, Flag, Trash2, CalendarDays, ChevronRight, MousePointerClick, Database, SlidersHorizontal, X } from 'lucide-react'
import { useSellerData, updateRow, deleteRow, COMMISSION_RATE } from '../api'
import { som, num, dmy } from '../format'
import { useMobile } from '../../useMobile'
import { card, PageHead, Btn, Select, SearchInput, Tabs, Chips, Badge, Pager, usePaged, Menu, Fab, Th, Td, toast, Toggle, Input } from '../components/ui'
import Empty from '../components/shell/Empty'
import Modal from '../components/shell/Modal'
import Confirm from '../components/shell/Confirm'
import ProductThumb from '../components/bosh-sahifa/ProductThumb'
import CampaignForm from '../components/reklama/CampaignForm'
import TopupModal from '../components/reklama/TopupModal'
import { CKIND, CKINDS, CSTATUS, cstatusOf, campProducts, campStats, adBalance } from '../components/reklama/constants'

export const CStatusBadge = ({ s }) => <Badge tone={CSTATUS[s][1]} dot>{CSTATUS[s][0]}</Badge>
export const CKindPill = ({ k }) => { const [, l, , I] = CKIND[k] || CKIND.qidiruv; return <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F0FDFA] px-2.5 py-1 text-[12px] text-[#0F766E]"><I className="size-3.5 shrink-0" />{l}</span> }

export function useCampaignActions() {
  const [form, setForm] = useState(null)
  const [del, setDel] = useState(null)
  const [end, setEnd] = useState(null)
  const setStatus = async (c, status, msg) => { const r = await updateRow('seller_campaigns', c.id, { status }); toast(r.ok ? msg : r.error) }
  const toggle = (c) => (c.status === 'toxtatilgan' ? setStatus(c, 'faol', 'Kampaniya qayta yoqildi') : setStatus(c, 'toxtatilgan', 'Kampaniya to‘xtatildi'))
  const modals = (onDeleted) => <>
    <CampaignForm open={!!form} edit={form?.edit} copy={form?.copy} onClose={() => setForm(null)} />
    <Confirm open={!!end} title="Kampaniyani yakunlash" text={`“${end?.title}” yakunlanadi va reklama boshqa ko‘rsatilmaydi.`} okText="Yakunlash" onClose={() => setEnd(null)} onOk={async () => { await setStatus(end, 'yakunlangan', 'Kampaniya yakunlandi'); setEnd(null) }} />
    <Confirm open={!!del} title="Kampaniyani o‘chirish" text={`“${del?.title}” va uning statistikasi o‘chiriladi. Sarflangan mablag‘ qaytarilmaydi.`} okText="O‘chirish" onClose={() => setDel(null)} onOk={async () => { const r = await deleteRow('seller_campaigns', del.id); toast(r.ok ? 'Kampaniya o‘chirildi' : r.error); setDel(null); if (r.ok) onDeleted?.() }} />
  </>
  return { form, setForm, setDel, setEnd, toggle, modals }
}

export default function Reklama() {
  const data = useSellerData()
  const mobile = useMobile()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState(mobile ? 'all' : 'faol')
  const [kind, setKind] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [filters, setFilters] = useState(false)
  const [topup, setTopup] = useState(false)
  const act = useCampaignActions()
  useEffect(() => { if (sp.get('new')) { act.setForm({}); sp.delete('new'); setSp(sp, { replace: true }) } }, [sp, setSp]) // eslint-disable-line react-hooks/exhaustive-deps
  const rows = useMemo(() => data.campaigns.map((c) => ({ ...c, s: cstatusOf(c), st: campStats(c, data.adStats), prods: campProducts(c, data.products) })).sort((a, b) => b.created_at.localeCompare(a.created_at)), [data.campaigns, data.adStats, data.products])
  const grp = (r) => (r.s === 'moderatsiyada' ? 'faol' : r.s)
  const cnt = (k) => rows.filter((r) => grp(r) === k).length
  const tabs = [...(mobile ? [['all', 'Barchasi', rows.length]] : []), ['faol', 'Faol', cnt('faol')], ['toxtatilgan', mobile ? 'Pauza' : 'To‘xtatilgan', cnt('toxtatilgan')], ['tugagan', 'Tugagan', cnt('tugagan')]]
  const list = rows.filter((r) => {
    if (tab !== 'all' && grp(r) !== tab) return false
    if (kind && r.kind !== kind) return false
    if (from && (r.ends_on || '9999') < from) return false
    if (to && r.starts_on > to) return false
    const s = q.trim().toLowerCase()
    return !s || [r.title, r.description, ...r.prods.map((p) => p.name)].some((x) => (x || '').toLowerCase().includes(s))
  })
  const pg = usePaged(list, mobile ? 20 : 10)
  useEffect(() => { pg.setPage(1) }, [q, tab, kind, from, to]) // eslint-disable-line react-hooks/exhaustive-deps
  const balance = adBalance(data.adTopups, data.adStats)
  const tot = rows.reduce((a, r) => ({ views: a.views + r.st.views, clicks: a.clicks + r.st.clicks, spent: a.spent + r.st.spent }), { views: 0, clicks: 0, spent: 0 })
  const open = (r) => navigate(`/sotuvchi/reklama/${r.id}`)
  const items = (r) => [['Ko‘rish', () => open(r), Eye], ['Tahrirlash', () => act.setForm({ edit: r }), Pencil], ['Nusxa olish', () => act.setForm({ copy: r }), Copy], r.s !== 'tugagan' && [r.s === 'toxtatilgan' ? 'Yoqish' : 'To‘xtatish', () => act.toggle(r), r.s === 'toxtatilgan' ? Play : Pause], r.s !== 'tugagan' && ['Yakunlash', () => act.setEnd(r), Flag], ['O‘chirish', () => act.setDel(r), Trash2]]
  const filtered = q || kind || from || to
  const clear = () => { setQ(''); setKind(''); setFrom(''); setTo('') }
  const empty = <Empty icon={Megaphone} title={rows.length ? 'Mos kampaniya topilmadi' : 'Hali reklama kampaniyalari yo‘q'} text={rows.length ? 'Filtrlarni o‘zgartirib ko‘ring.' : 'Mahsulotlaringizni qidiruvda, bosh sahifada yoki kategoriyada yuqoriroq ko‘rsating.'} action={!rows.length && <Btn icon={Plus} onClick={() => act.setForm({})}>Kampaniya yaratish</Btn>} />
  const kindOpts = [['', 'Barchasi'], ...CKINDS.map((k) => [k[0], k[1]])]
  const filterBody = <div className="space-y-3 text-[13px]"><label className="block">Reklama turi<Select value={kind} onChange={setKind} options={kindOpts} /></label><div className="grid grid-cols-2 gap-2"><label>Dan<Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label><label>Gacha<Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label></div></div>
  const modals = <>{act.modals()}<TopupModal open={topup} onClose={() => setTopup(false)} />
    <Modal open={filters} onClose={() => setFilters(false)} title="Filtrlar" width="md:max-w-[440px]" footer={<div className="grid grid-cols-2 gap-3"><Btn variant="outline" onClick={clear}>Tozalash</Btn><Btn onClick={() => setFilters(false)}>Qo‘llash</Btn></div>}>{filterBody}</Modal></>

  if (mobile) return (
    <div className="space-y-3 pb-24">
      <PageHead title="Reklama" subtitle="Mahsulotlaringizni ko‘proq mijozlarga yetkazing." />
      <div className="grid grid-cols-2 gap-2.5">{[[Megaphone, 'Faol kampaniyalar', cnt('faol'), `Jami ${rows.length} ta kampaniya`], [BarChart3, 'Ko‘rishlar', num(tot.views), 'Barcha kampaniyalar'], [MousePointerClick, 'Bosishlar', num(tot.clicks), 'Barcha kampaniyalar'], [Database, 'Xarajat', som(tot.spent), 'Barcha kampaniyalar']].map(([I, l, v, s]) => <div key={l} className={`${card} flex items-center gap-2.5 p-3`}><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]"><I className="size-5" /></span><div className="min-w-0"><div className="truncate text-[12px] text-[#3D4E5F]">{l}</div><div className="truncate text-[17px] font-extrabold">{v}</div><div className="truncate text-[10.5px] text-[#5C6E80]">{s}</div></div></div>)}</div>
      <button type="button" onClick={() => setTopup(true)} className={`${card} flex w-full items-center gap-3 p-3 text-left`}><Wallet className="size-6 text-[#0F766E]" /><div className="flex-1"><div className="text-[12px] text-[#5C6E80]">Reklama balansi</div><div className="text-[16px] font-extrabold">{som(balance)}</div></div><span className="text-[13px] font-semibold text-[#0F766E]">To‘ldirish</span><ChevronRight className="size-4" /></button>
      <div className="flex gap-2"><SearchInput value={q} onChange={setQ} placeholder="Kampaniya nomi yoki mahsulot bo‘yicha qidirish..." className="flex-1" /><button type="button" aria-label="Filtrlar" onClick={() => setFilters(true)} className={`grid size-[42px] shrink-0 place-items-center rounded-xl border ${filtered ? 'border-[#0F766E] bg-[#F0FDFA]' : 'border-[#DCE5E7]'} text-[#0F766E]`}><SlidersHorizontal className="size-5" /></button></div>
      <div className="overflow-x-auto"><Chips tabs={tabs} value={tab} onChange={setTab} /></div>
      {pg.rows.length ? pg.rows.map((r) => (
        <button key={r.id} type="button" onClick={() => open(r)} className={`${card} flex w-full items-center gap-3 p-2.5 text-left`}>
          <ProductThumb src={r.prods[0]?.image_url} className="h-[64px] w-[64px] shrink-0" />
          <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-bold">{r.title}</div><div className="truncate text-[12px] text-[#5C6E80]">{r.prods[0]?.name || '—'}{r.prods.length > 1 && ` +${r.prods.length - 1}`}</div><div className="mt-1 flex items-center gap-1 whitespace-nowrap text-[11.5px] text-[#5C6E80]"><CalendarDays className="size-3.5 text-[#0F766E]" />{dmy(r.starts_on)} – {r.ends_on ? dmy(r.ends_on) : '…'}</div></div>
          <div className="shrink-0 text-right"><CStatusBadge s={r.s} /><div className="mt-1 whitespace-nowrap text-[12.5px] font-extrabold">{som(r.total_budget || r.daily_budget * (r.days || 1))}</div><div className="text-[11px] text-[#5C6E80]">Budjet</div></div><ChevronRight className="size-4 shrink-0" />
        </button>)) : <div className={card}>{empty}</div>}
      {pg.pages > 1 && <Pager {...pg} setPer={null} />}
      <Fab icon={Plus} onClick={() => act.setForm({})}>Kampaniya yaratish</Fab>
      {modals}
    </div>
  )

  return (
    <div className="space-y-4">
      <PageHead title="Reklama" subtitle="Mahsulotlaringizni ko‘proq mijozlarga yetkazing." action={<Btn icon={Plus} size="lg" onClick={() => act.setForm({})}>Reklama kampaniyasi yaratish</Btn>} />
      <div className="grid grid-cols-[1fr_1.35fr] gap-4">
        <div className={`${card} flex items-center gap-4 p-4`}><span className="grid size-14 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]"><Wallet className="size-7" /></span><div className="flex-1"><div className="text-[13px] text-[#3D4E5F]">Reklama balansi</div><div className="whitespace-nowrap text-[24px] font-extrabold">{som(balance)}</div></div><Btn onClick={() => setTopup(true)}>Balansni to‘ldirish</Btn></div>
        <div className="flex items-center gap-4 rounded-2xl bg-[#F0FDFA] p-4"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#0F766E]"><Megaphone className="size-5" /></span><div className="flex-1 text-[12.5px] text-[#3D4E5F]"><b className="text-[13.5px] text-[#10283F]">Reklama haqida</b><p>Reklama orqali mahsulotlaringizni qidiruv natijalarida, bosh sahifa va kategoriyalarda yuqoriroq ko‘rsatishingiz mumkin. Har bir bosish 1 000 so‘m.</p></div><div className="border-l border-[#CCFBF1] pl-4"><div className="text-[12.5px] font-semibold">Komissiya</div><div className="text-[22px] font-extrabold">{COMMISSION_RATE * 100}%</div><div className="text-[11.5px] text-[#5C6E80]">Sotuvdan platforma komissiyasi</div></div></div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3"><Tabs tabs={tabs} value={tab} onChange={setTab} /><div className="flex items-center gap-2"><SearchInput value={q} onChange={setQ} placeholder="Kampaniya yoki mahsulot..." className="w-[240px]" /><div className="flex items-center gap-1.5 rounded-[10px] border border-[#DCE5E7] px-2"><CalendarDays className="size-4 text-[#0F766E]" /><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 w-[120px] text-[13px] outline-none" />–<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10 w-[120px] text-[13px] outline-none" />{(from || to) && <button type="button" aria-label="Tozalash" onClick={() => { setFrom(''); setTo('') }}><X className="size-4" /></button>}</div><Btn variant="outline" icon={Filter} onClick={() => setFilters(true)}>Filtrlar{kind ? ' (1)' : ''}</Btn></div></div>
      <div className={`${card} overflow-hidden`}>
        {pg.rows.length ? <><div className="overflow-x-auto"><table className="w-full min-w-[960px] table-fixed">
          <colgroup><col className="w-[30px]" /><col /><col className="w-[136px]" /><col className="w-[76px]" /><col className="w-[96px]" /><col className="w-[74px]" /><col className="w-[68px]" /><col className="w-[96px]" /><col className="w-[84px]" /><col className="w-[60px]" /><col className="w-[92px]" /></colgroup>
          <thead className="bg-[#F6FAFA]"><tr><Th>#</Th><Th>Kampaniya nomi</Th><Th>Turi</Th><Th className="text-center">Mahsulotlar</Th><Th>Kunlik byudjet</Th><Th>Ko‘rishlar</Th><Th>Bosishlar</Th><Th>Sarflandi</Th><Th>Muddat</Th><Th className="text-center">Holat</Th><Th className="text-center">Amallar</Th></tr></thead>
          <tbody>{pg.rows.map((r, i) => (
            <tr key={r.id} className="cursor-pointer border-t border-[#EEF3F4] hover:bg-[#F8FCFC]" onClick={() => open(r)}>
              <Td className="text-[#5C6E80]">{pg.offset + i + 1}</Td>
              <Td><div className="flex items-center gap-2.5"><ProductThumb src={r.prods[0]?.image_url} className="h-10 w-12 shrink-0" /><div className="min-w-0"><div className="line-clamp-2 font-semibold leading-tight">{r.title}</div><div className="truncate text-[11.5px] text-[#5C6E80]">{r.prods[0]?.category || r.prods[0]?.name || '—'}</div></div></div></Td>
              <Td><CKindPill k={r.kind} /></Td>
              <Td className="text-center">{r.prods.length} ta</Td>
              <Td>{som(r.daily_budget)}</Td>
              <Td>{num(r.st.views)}</Td>
              <Td>{num(r.st.clicks)}</Td>
              <Td>{som(r.st.spent)}</Td>
              <Td className="text-[12px] text-[#5C6E80]">{dmy(r.starts_on)}<br />{r.ends_on ? dmy(r.ends_on) : '—'}</Td>
              <Td className="text-center"><div onClick={(e) => e.stopPropagation()} className="inline-flex">{r.s === 'tugagan' ? <Badge tone="off">Tugagan</Badge> : <Toggle checked={r.s !== 'toxtatilgan'} onChange={() => act.toggle(r)} />}</div></Td>
              <Td><div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}><button type="button" title="Tahrirlash" onClick={() => act.setForm({ edit: r })} className="rounded-lg p-1.5 hover:bg-[#F0FDFA]"><Pencil className="size-4" /></button><button type="button" title="Statistika" onClick={() => open(r)} className="rounded-lg p-1.5 hover:bg-[#F0FDFA]"><BarChart3 className="size-4" /></button><Menu items={items(r)} /></div></Td>
            </tr>))}</tbody></table></div>
          <div className="border-t border-[#EEF3F4]"><Pager {...pg} /></div></> : empty}
      </div>
      {modals}
    </div>
  )
}
