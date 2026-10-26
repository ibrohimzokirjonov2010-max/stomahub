import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Filter, Eye, SlidersHorizontal, ChevronRight, Phone, MapPin, ShoppingCart, CalendarDays, Users, Pencil, Ban, Trash2, Download } from 'lucide-react'
import { useSellerData, deleteRow, updateRow, csvDownload } from '../api'
import { num, dmy } from '../format'
import { useMobile } from '../../useMobile'
import { card, PageHead, Btn, Select, SearchInput, Tabs, Chips, Badge, Checkbox, Pager, usePaged, Menu, Fab, Th, Td, toast } from '../components/ui'
import Empty from '../components/shell/Empty'
import Modal from '../components/shell/Modal'
import Confirm from '../components/shell/Confirm'
import CustomerForm from '../components/mijozlar/CustomerForm'
import { KIND, REGIONS, statsOf, tagsOf, initials } from '../components/mijozlar/constants'

export const masked = (p) => (p ? p.replace(/^(\+998)\s?(\d{2}).*$/, '$1 $2 *** ** **') : '—')
export const TagBadge = ({ t }) => <Badge tone={t === 'Yangi' || t === 'Kechiktiradi' ? 'off' : 'on'} className="min-w-[70px]">{t}</Badge>

export default function Mijozlar() {
  const data = useSellerData()
  const mobile = useMobile()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const [q, setQ] = useState(sp.get('q') || '')
  const [city, setCity] = useState('')
  const [kind, setKind] = useState('')
  const [tab, setTab] = useState('all')
  const [sel, setSel] = useState(new Set())
  const [form, setForm] = useState(null)
  const [del, setDel] = useState(null)
  const [filters, setFilters] = useState(false)
  useEffect(() => { setQ(sp.get('q') || '') }, [sp])
  useEffect(() => { if (sp.get('new')) { setForm({}); sp.delete('new'); setSp(sp, { replace: true }) } }, [sp, setSp])

  const rows = useMemo(() => data.customers.map((c) => { const st = statsOf(c, data.orders); return { ...c, st, tagList: tagsOf(c, st) } }), [data.customers, data.orders])
  const cities = [...new Set([...rows.map((c) => c.city).filter(Boolean), ...Object.values(REGIONS).flat()])]
  const cnt = (f) => rows.filter(f).length
  const tabs = mobile
    ? [['all', 'Barchasi', rows.length], ['faol', 'Faol', cnt((c) => !c.blocked && c.st.count > 0)], ['yangi', 'Yangi', cnt((c) => c.st.auto === 'Yangi')]]
    : [['all', 'Barchasi', rows.length], ['klinika', 'Klinikalar', cnt((c) => c.kind === 'klinika')], ['shifokor', 'Shifokorlar', cnt((c) => c.kind === 'shifokor')], ['laboratoriya', 'Laboratoriyalar', cnt((c) => c.kind === 'laboratoriya')]]
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return rows.filter((c) => {
      if (tab === 'faol' && (c.blocked || !c.st.count)) return false
      if (tab === 'yangi' && c.st.auto !== 'Yangi') return false
      if (['klinika', 'shifokor', 'laboratoriya'].includes(tab) && c.kind !== tab) return false
      if (city && c.city !== city) return false
      if (kind && c.kind !== kind) return false
      if (s && ![c.name, c.phone, c.city, c.contact_person, ...c.tagList].some((x) => (x || '').toLowerCase().includes(s))) return false
      return true
    })
  }, [rows, q, tab, city, kind])
  const pg = usePaged(list, mobile ? 20 : 10)
  useEffect(() => { pg.setPage(1) }, [q, tab, city, kind]) // eslint-disable-line react-hooks/exhaustive-deps
  const filtered = q || city || kind
  const allSel = pg.rows.length > 0 && pg.rows.every((c) => sel.has(c.id))
  const open = (c) => navigate(`/sotuvchi/mijozlar/${c.id}`)
  const items = (c) => [['Ko‘rish', () => open(c), Eye], ['Tahrirlash', () => setForm(c), Pencil],
    [c.blocked ? 'Blokdan chiqarish' : 'Bloklash', async () => { const r = await updateRow('seller_customers', c.id, { blocked: !c.blocked }); toast(r.ok ? (c.blocked ? 'Blokdan chiqarildi' : 'Mijoz bloklandi') : r.error) }, Ban],
    ['O‘chirish', () => setDel(c), Trash2]]
  const exportCsv = () => csvDownload('mijozlar.csv', [['Nomi', 'Turi', 'Telefon', 'Shahar', 'Buyurtmalar', 'Jami xarid', 'Oxirgi buyurtma', 'Teglar'], ...list.map((c) => [c.name, KIND[c.kind]?.[1], c.phone, c.city, c.st.count, c.st.sum, c.st.last ? dmy(c.st.last) : '', c.tagList.join(', ')])])
  const empty = <Empty icon={Users} title={rows.length ? 'Mos mijoz topilmadi' : 'Hali mijoz yo‘q'} text={rows.length ? 'Qidiruv yoki filtrni o‘zgartirib ko‘ring.' : 'Mijozlarni qo‘shing — buyurtma yaratishda ularni tez tanlaysiz.'} action={!rows.length && <Btn icon={Plus} className="mt-4" onClick={() => setForm({})}>Mijoz qo‘shish</Btn>} />
  const KI = ({ c, className = '' }) => { const I = KIND[c.kind]?.[3]; return <span className={`grid shrink-0 place-items-center rounded-lg bg-[#F0FDFA] text-[#0F766E] ${className}`}>{I && <I className="size-5" />}</span> }

  return (
    <div>
      <PageHead title="Mijozlar" subtitle={mobile ? 'Barcha mijozlarni ko‘ring va boshqaring.' : 'Sizning mijozlaringiz ro‘yxati va ma’lumotlari.'} action={<Btn icon={Plus} size="lg" className="px-12" onClick={() => setForm({})}>Mijoz qo‘shish</Btn>} />
      <div className="hidden md:block">
        <div className={`${card} flex items-end gap-4 p-3`}>
          <SearchInput value={q} onChange={setQ} placeholder="Mijoz nomi bo‘yicha qidirish..." className="flex-[1.6]" />
          <label className="flex-1 text-[12px] text-[#3D4E5F]">Shahar<Select value={city} onChange={setCity} options={cities} placeholder="Barchasi" /></label>
          <label className="flex-1 text-[12px] text-[#3D4E5F]">Mijoz turi<Select value={kind} onChange={setKind} options={Object.values(KIND).map((k) => [k[0], k[1]])} placeholder="Barchasi" /></label>
          <Btn variant="outline" icon={Filter} className="bg-[#F0FDFA] px-10" onClick={() => { setQ(''); setCity(''); setKind('') }}>{filtered ? 'Tozalash' : 'Filtrlar'}</Btn>
        </div>
        <div className="mt-4 flex items-center justify-between"><Tabs tabs={tabs} value={tab} onChange={setTab} />
          <div className="flex items-center gap-2 text-[13px]">{sel.size > 0 && <span className="text-[#5C6E80]">{sel.size} ta tanlandi</span>}{list.length > 0 && <Btn size="sm" variant="gray" icon={Download} onClick={exportCsv}>Eksport</Btn>}</div></div>
        <div className={`${card} mt-3 overflow-hidden`}>
          <table className="w-full table-fixed">
            <colgroup><col className="w-[40px]" /><col className="w-[34px]" /><col /><col className="w-[104px]" /><col className="w-[96px]" /><col className="w-[96px]" /><col className="w-[110px]" /><col className="w-[104px]" /><col className="w-[86px]" /><col className="w-[76px]" /></colgroup>
            <thead className="bg-[#F6FAFA]"><tr><Th><Checkbox checked={allSel} onChange={(v) => setSel(v ? new Set(pg.rows.map((c) => c.id)) : new Set())} /></Th><Th>#</Th><Th>Mijoz nomi</Th><Th>Turi</Th><Th>Shahar</Th><Th className="text-center">Buyurtmalar</Th><Th className="text-center">Jami xarid (so‘m)</Th><Th className="text-center">Oxirgi buyurtma</Th><Th className="text-center">Teglar</Th><Th className="text-center">Amallar</Th></tr></thead>
            <tbody>{pg.rows.map((c, i) => (
              <tr key={c.id} onClick={() => open(c)} className={`cursor-pointer border-t border-[#EEF3F4] hover:bg-[#F7FCFB] ${c.blocked ? 'opacity-60' : ''}`}>
                <Td><Checkbox checked={sel.has(c.id)} onChange={(v) => setSel((s) => { const n = new Set(s); v ? n.add(c.id) : n.delete(c.id); return n })} /></Td>
                <Td className="text-[#5C6E80]">{pg.offset + i + 1}</Td>
                <Td><div className="flex items-center gap-2.5"><KI c={c} className="size-8" /><div className="min-w-0"><div className="truncate font-medium">{c.name}</div><div className="truncate text-[12px] text-[#5C6E80]">{c.blocked ? 'Bloklangan' : KIND[c.kind]?.[2]}</div></div></div></Td>
                <Td><Badge tone="on" className="min-w-[80px]">{KIND[c.kind]?.[1]}</Badge></Td>
                <Td>{c.city || '—'}</Td>
                <Td className="text-center">{c.st.count}</Td>
                <Td className="text-center">{num(c.st.sum)}</Td>
                <Td className="text-center text-[#3D4E5F]">{c.st.last ? dmy(c.st.last) : '—'}</Td>
                <Td className="text-center"><TagBadge t={c.tagList[0]} /></Td>
                <Td><div className="flex items-center justify-center gap-0.5" onClick={(e) => e.stopPropagation()}><button type="button" aria-label="Ko‘rish" onClick={() => open(c)} className="grid size-8 place-items-center rounded-lg hover:bg-[#F0FDFA]"><Eye className="size-4" /></button><Menu items={items(c)} /></div></Td>
              </tr>))}</tbody>
          </table>
          {!pg.rows.length && empty}
          <Pager {...pg} />
        </div>
      </div>

      <div className="md:hidden">
        <div className="flex gap-2.5">
          <SearchInput value={q} onChange={setQ} placeholder="Mijoz ismi, klinika nomi yoki telefon raqami..." className="flex-1 [&_input]:h-11 [&_input]:bg-[#F6FAFA]" />
          <button type="button" aria-label="Filtrlar" onClick={() => setFilters(true)} className={`grid size-11 place-items-center rounded-[10px] border ${city || kind ? 'border-[#0F766E] bg-[#F0FDFA]' : 'border-[#DCE5E7] bg-white'} text-[#0F766E]`}><SlidersHorizontal className="size-5" /></button>
        </div>
        <div className="mt-3.5"><Chips tabs={tabs} value={tab} onChange={setTab} /></div>
        <div className="mt-3.5 space-y-2.5">
          {pg.rows.map((c) => (
            <button key={c.id} type="button" onClick={() => open(c)} className={`${card} flex w-full items-center gap-3 p-3 text-left ${c.blocked ? 'opacity-60' : ''}`}>
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#E3F4F2] text-[16px] font-semibold text-[#0F766E]">{initials(c.contact_person || c.name)}</span>
              <div className="min-w-0 flex-1 text-[12px] text-[#5C6E80]">
                <div className="truncate text-[14.5px] font-bold text-[#10283F]">{c.contact_person || c.name}</div>
                {c.contact_person && <div className="truncate">{c.name}</div>}
                <div className="flex items-center gap-1.5"><Phone className="size-3.5 text-[#0F766E]" />{masked(c.phone)}</div>
                <div className="flex items-center gap-1.5 truncate"><MapPin className="size-3.5 text-[#0F766E]" />{c.city ? `${c.city} shahri` : '—'}</div>
              </div>
              <div className="w-[106px] shrink-0 space-y-1.5 border-l border-[#EEF3F4] pl-3 text-[11.5px] text-[#5C6E80]">
                <div className="flex items-center gap-1.5"><ShoppingCart className="size-4 text-[#0F766E]" /><span className="whitespace-nowrap">{c.st.count} ta buyurtma</span></div>
                <div className="flex gap-1.5"><CalendarDays className="size-4 shrink-0 text-[#0F766E]" /><div className="whitespace-nowrap">Oxirgi buyurtma<div className="text-[12px] text-[#3D4E5F]">{c.st.last ? dmy(c.st.last) : '—'}</div></div></div>
              </div>
              <ChevronRight className="size-5 shrink-0" />
            </button>))}
          {!pg.rows.length && <div className={card}>{empty}</div>}
        </div>
        {pg.pages > 1 && <Pager {...pg} setPer={null} />}
        <Fab icon={Plus} onClick={() => setForm({})}>Mijoz qo‘shish</Fab>
        <Modal open={filters} onClose={() => setFilters(false)} title="Filtrlar">
          <div className="space-y-3 text-[13px]"><label className="block">Shahar<Select value={city} onChange={setCity} options={cities} placeholder="Barchasi" /></label><label className="block">Mijoz turi<Select value={kind} onChange={setKind} options={Object.values(KIND).map((k) => [k[0], k[1]])} placeholder="Barchasi" /></label></div>
          <div className="mt-5 grid grid-cols-2 gap-3"><Btn variant="outline" onClick={() => { setCity(''); setKind('') }}>Tozalash</Btn><Btn onClick={() => setFilters(false)}>Qo‘llash</Btn></div>
        </Modal>
      </div>
      <CustomerForm open={!!form} edit={form?.id ? form : null} onClose={() => setForm(null)} />
      <Confirm open={!!del} title="Mijozni o‘chirish" text={`${del?.name || ''} o‘chiriladi. Buyurtmalari saqlanib qoladi.`} okText="O‘chirish" onClose={() => setDel(null)} onOk={async () => { const r = await deleteRow('seller_customers', del.id); toast(r.ok ? 'Mijoz o‘chirildi' : r.error); setDel(null) }} />
    </div>
  )
}
