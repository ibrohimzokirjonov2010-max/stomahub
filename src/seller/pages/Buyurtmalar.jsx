import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Filter, Eye, CalendarDays, SlidersHorizontal, ChevronRight, UserRound, Phone, ShoppingCart, ClipboardList, Truck, Box, FileText, CircleCheck, CircleX, Download } from 'lucide-react'
import { useSellerData, setOrderStatus, netOf, csvDownload } from '../api'
import { num, som, dmy, hm } from '../format'
import { useMobile } from '../../useMobile'
import { card, PageHead, Btn, Select, SearchInput, Tabs, Chips, Badge, Checkbox, Pager, usePaged, Menu, Fab, Th, Td, toast, inputCls } from '../components/ui'
import Empty from '../components/shell/Empty'
import Modal from '../components/shell/Modal'
import ProductThumb from '../components/bosh-sahifa/ProductThumb'
import OrderForm from '../components/buyurtmalar/OrderForm'
import { O_LABEL, O_NEXT, O_TONE, phoneOf } from '../components/buyurtmalar/constants'

export const OrderBadge = ({ status, className = '', icon }) => {
  const I = { yangi: FileText, tasdiqlandi: CircleCheck, tayyorlanmoqda: Box, yetkazilmoqda: Truck, yetkazildi: CircleCheck, bekor_qilindi: CircleX }[status]
  return <Badge tone={O_TONE[status]} className={`min-w-[86px] ${className}`}>{icon && I && <I className="size-3.5" />}{O_LABEL[status] || status}</Badge>
}
const total = (o) => netOf(o) + Number(o.delivery_fee || 0)
const city = (o) => o.city || o.region || (o.address || '').split(',')[0] || ''

export default function Buyurtmalar() {
  const data = useSellerData()
  const mobile = useMobile()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const [q, setQ] = useState(sp.get('q') || '')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState('')
  const [buyer, setBuyer] = useState('')
  const [tab, setTab] = useState(mobile ? 'all' : 'yangi')
  const [sel, setSel] = useState(new Set())
  const [adding, setAdding] = useState(false)
  const [filters, setFilters] = useState(false)
  const product = sp.get('product')
  useEffect(() => { setQ(sp.get('q') || '') }, [sp])
  useEffect(() => { if (sp.get('new')) { setAdding(true); sp.delete('new'); setSp(sp, { replace: true }) } }, [sp, setSp])
  useEffect(() => { setTab(mobile ? 'all' : (q || product ? 'all' : 'yangi')) }, [mobile]) // eslint-disable-line react-hooks/exhaustive-deps

  const orders = data.orders
  const c = (f) => orders.filter(f).length
  const tabs = [['all', 'Barchasi', orders.length], ...Object.entries(O_LABEL).map(([k, l]) => [k, l, c((o) => o.status === k)])]
  const mtabs = [['all', 'Barchasi', orders.length], ['yangi', 'Yangi', c((o) => o.status === 'yangi')], ['tayyorlanmoqda', 'Yig‘ilmoqda', c((o) => o.status === 'tayyorlanmoqda')], ['yetkazilmoqda', 'Yetkazilmoqda', c((o) => o.status === 'yetkazilmoqda')], ['yetkazildi', 'Yakunlangan', c((o) => o.status === 'yetkazildi')]]
  const buyers = [...new Set(orders.map((o) => o.customer_name).filter(Boolean))].sort()

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return orders.filter((o) => {
      if (tab !== 'all' && o.status !== tab) return false
      if (status && o.status !== status) return false
      if (buyer && o.customer_name !== buyer) return false
      if (product && !o.items.some((i) => i.product_id === product)) return false
      const d = o.created_at.slice(0, 10)
      if (from && d < from) return false
      if (to && d > to) return false
      if (s && ![o.code, o.customer_name, o.customer_phone, ...o.items.map((i) => i.name)].some((x) => (x || '').toLowerCase().includes(s))) return false
      return true
    })
  }, [orders, q, tab, status, buyer, from, to, product])
  const pg = usePaged(list, mobile ? 20 : 10)
  useEffect(() => { pg.setPage(1) }, [q, tab, status, buyer, from, to]) // eslint-disable-line react-hooks/exhaustive-deps
  const filtered = q || from || to || status || buyer || product
  const allSel = pg.rows.length > 0 && pg.rows.every((o) => sel.has(o.id))

  async function bulkNext() {
    let ok = 0; const ids = [...sel]
    for (const id of ids) { const o = orders.find((x) => x.id === id); if (o && O_NEXT[o.status]) { const r = await setOrderStatus(id, O_NEXT[o.status][0]); if (r.ok) ok++ } }
    toast(`${ok} ta buyurtma keyingi bosqichga o‘tkazildi`); setSel(new Set())
  }
  const exportCsv = () => csvDownload('buyurtmalar.csv', [['Raqam', 'Sana', 'Xaridor', 'Telefon', 'Mahsulotlar', 'Summa', 'Komissiya', 'Sizga', 'Holat'],
    ...list.map((o) => [o.code, `${dmy(o.created_at)} ${hm(o.created_at)}`, o.customer_name, phoneOf(o), o.items.reduce((s, i) => s + i.qty, 0), total(o), o.commission, o.payout, O_LABEL[o.status]])])
  const items = (o) => [
    ['Ko‘rish', () => navigate(`/sotuvchi/buyurtmalar/${o.id}`), Eye],
    O_NEXT[o.status] && [O_NEXT[o.status][1], async () => { const r = await setOrderStatus(o.id, O_NEXT[o.status][0]); toast(r.ok ? `Holat: ${O_LABEL[O_NEXT[o.status][0]]}` : r.error) }, ChevronRight],
    o.status !== 'bekor_qilindi' && o.status !== 'yetkazildi' && ['Bekor qilish', () => navigate(`/sotuvchi/buyurtmalar/${o.id}?cancel=1`), CircleX],
  ]

  const empty = <Empty icon={ClipboardList} title={orders.length ? 'Mos buyurtma topilmadi' : 'Hali buyurtma yo‘q'}
    text={orders.length ? 'Boshqa bo‘lim yoki filtrni tanlab ko‘ring.' : 'Xaridorlar buyurtma berganda yoki siz qo‘lda qo‘shganingizda shu yerda ko‘rinadi.'}
    action={!orders.length && <Btn icon={Plus} className="mt-4" onClick={() => setAdding(true)}>Buyurtma qo‘shish</Btn>} />

  return (
    <div>
      <PageHead title="Buyurtmalar" subtitle={mobile ? 'Barcha buyurtmalarni ko‘ring va boshqaring.' : 'Barcha buyurtmalarni boshqaring va holatini kuzatib boring.'}
        action={<Btn icon={Plus} size="lg" onClick={() => setAdding(true)} className="px-8">Buyurtma qo‘lda qo‘shish</Btn>} />
      <div className="hidden md:block">
        <div className={`${card} flex items-center gap-3 p-3`}>
          <SearchInput value={q} onChange={setQ} placeholder="Buyurtma raqami yoki xaridor nomi..." className="flex-[1.5]" />
          <div className="flex h-[42px] flex-[1.1] items-center gap-1.5 rounded-[10px] border border-[#DCE5E7] px-2.5 text-[13px]">
            <CalendarDays className="size-4 shrink-0 text-[#0F766E]" />
            <input type="date" aria-label="Boshlanish sanasi" value={from} onChange={(e) => setFrom(e.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" />–
            <input type="date" aria-label="Tugash sanasi" value={to} onChange={(e) => setTo(e.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" />
          </div>
          <Select value={status} onChange={setStatus} options={Object.entries(O_LABEL)} placeholder="Barcha holatlar" className="flex-1" />
          <Select value={buyer} onChange={setBuyer} options={buyers} placeholder="Barcha xaridorlar" className="flex-1" />
          <Btn variant="outline" icon={filtered ? undefined : Filter} className="bg-[#F0FDFA] px-5" onClick={() => { setQ(''); setFrom(''); setTo(''); setStatus(''); setBuyer(''); if (product) { sp.delete('product'); setSp(sp) } }}>{filtered ? 'Tozalash' : 'Filtrlar'}</Btn>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <Tabs tabs={tabs} value={tab} onChange={setTab} />
          <div className="flex items-center gap-2 text-[13px]">
            {sel.size > 0 && <><span className="text-[#5C6E80]">{sel.size} ta tanlandi</span><Btn size="sm" variant="outline" onClick={bulkNext}>Keyingi bosqich</Btn></>}
            {list.length > 0 && <Btn size="sm" variant="gray" icon={Download} onClick={exportCsv}>Eksport</Btn>}
          </div>
        </div>
        <div className={`${card} mt-3 overflow-hidden`}>
          <table className="w-full table-fixed">
            <colgroup><col className="w-[42px]" /><col className="w-[40px]" /><col className="w-[104px]" /><col className="w-[96px]" /><col /><col className="w-[96px]" /><col className="w-[80px]" /><col className="w-[110px]" /><col className="w-[64px]" /><col className="w-[124px]" /><col className="w-[84px]" /></colgroup>
            <thead className="bg-[#F6FAFA]"><tr><Th><Checkbox checked={allSel} onChange={(v) => setSel(v ? new Set(pg.rows.map((o) => o.id)) : new Set())} /></Th><Th>#</Th><Th>Buyurtma raqami</Th><Th>Sana ↓</Th><Th>Xaridor</Th><Th /><Th>Mahsulotlar</Th><Th>Summa (so‘m)</Th><Th>To‘lov</Th><Th className="text-center">Holat</Th><Th className="text-center">Amallar</Th></tr></thead>
            <tbody>{pg.rows.map((o, i) => (
              <tr key={o.id} onClick={() => navigate(`/sotuvchi/buyurtmalar/${o.id}`)} className="cursor-pointer border-t border-[#EEF3F4] hover:bg-[#F7FCFB]">
                <Td><Checkbox checked={sel.has(o.id)} onChange={(v) => setSel((s) => { const n = new Set(s); v ? n.add(o.id) : n.delete(o.id); return n })} /></Td>
                <Td className="text-[#5C6E80]">{pg.offset + i + 1}</Td>
                <Td className="font-semibold">{o.code}</Td>
                <Td className="text-[12px] leading-tight text-[#3D4E5F]">{dmy(o.created_at)}<br />{hm(o.created_at)}</Td>
                <Td><div className="truncate font-semibold">{o.customer_name || '—'}</div><div className="truncate text-[12px] text-[#5C6E80]">{city(o)}</div></Td>
                <Td><div className="flex gap-1">{o.items.slice(0, 3).map((it) => <ProductThumb key={it.id} src={it.image_url} className="size-7" />)}</div></Td>
                <Td>{o.items.reduce((s, it) => s + it.qty, 0)} ta</Td>
                <Td>{num(total(o))}</Td>
                <Td>Naqd</Td>
                <Td className="text-center"><OrderBadge status={o.status} /></Td>
                <Td><div className="flex items-center justify-center gap-0.5" onClick={(e) => e.stopPropagation()}><button type="button" aria-label="Ko‘rish" onClick={() => navigate(`/sotuvchi/buyurtmalar/${o.id}`)} className="grid size-8 place-items-center rounded-lg hover:bg-[#F0FDFA]"><Eye className="size-4" /></button><Menu items={items(o)} /></div></Td>
              </tr>))}</tbody>
          </table>
          {!pg.rows.length && empty}
          {pg.total > 0 && <div className="flex items-center"><div className="flex-1"><Pager {...pg} /></div></div>}
          {pg.total > 0 && <div className="-mt-12 mb-4 ml-[190px] text-[12.5px] text-[#5C6E80] pointer-events-none">Jami {pg.total} ta buyurtma</div>}
        </div>
      </div>

      <div className="md:hidden">
        <div className="flex gap-2.5">
          <SearchInput value={q} onChange={setQ} placeholder="Buyurtma raqami, mijoz yoki mahsulot bo‘yicha qidirish..." className="flex-1 [&_input]:h-11 [&_input]:bg-[#F6FAFA]" />
          <button type="button" aria-label="Filtrlar" onClick={() => setFilters(true)} className={`grid size-11 place-items-center rounded-[10px] border ${from || to || buyer ? 'border-[#0F766E] bg-[#F0FDFA]' : 'border-[#DCE5E7] bg-white'} text-[#0F766E]`}><SlidersHorizontal className="size-5" /></button>
        </div>
        <div className="mt-3.5 [&>div]:flex-wrap"><Chips tabs={mtabs} value={tab} onChange={setTab} /></div>
        <div className="mt-3.5 space-y-2.5">
          {pg.rows.map((o) => (
            <button key={o.id} type="button" onClick={() => navigate(`/sotuvchi/buyurtmalar/${o.id}`)} className={`${card} flex w-full items-center gap-3 p-2.5 text-left`}>
              <ProductThumb src={o.items[0]?.image_url} className="h-[72px] w-[68px] shrink-0" />
              <div className="min-w-0 flex-1 text-[12px] text-[#5C6E80]">
                <div className="flex items-center justify-between gap-2"><span className="truncate text-[14.5px] font-bold text-[#10283F]">#{o.code}</span><OrderBadge status={o.status} icon className="shrink-0 rounded-full !min-w-0" /></div>
                <div>{dmy(o.created_at)} {hm(o.created_at)}</div>
                <div className="flex items-center gap-1.5 truncate"><UserRound className="size-3.5 shrink-0" /><span className="truncate">{o.customer_name || '—'}</span></div>
                <div className="flex items-center gap-1.5"><Phone className="size-3.5 shrink-0" />{phoneOf(o)}</div>
                <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5"><ShoppingCart className="size-3.5" />{o.items.length} ta mahsulot</span><span className="whitespace-nowrap text-[14.5px] font-extrabold text-[#10283F]">{som(total(o))}</span></div>
              </div>
              <ChevronRight className="size-5 shrink-0 text-[#10283F]" />
            </button>
          ))}
          {!pg.rows.length && <div className={card}>{empty}</div>}
        </div>
        {pg.pages > 1 && <Pager {...pg} setPer={null} />}
        <Fab icon={Plus} onClick={() => setAdding(true)}>Buyurtma qo‘shish</Fab>
        <Modal open={filters} onClose={() => setFilters(false)} title="Filtrlar">
          <div className="space-y-3 text-[13px]">
            <div className="grid grid-cols-2 gap-2"><label>Dan<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} /></label><label>Gacha<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} /></label></div>
            <label className="block">Holat<Select value={status} onChange={setStatus} options={Object.entries(O_LABEL)} placeholder="Barcha holatlar" /></label>
            <label className="block">Xaridor<Select value={buyer} onChange={setBuyer} options={buyers} placeholder="Barcha xaridorlar" /></label>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3"><Btn variant="outline" onClick={() => { setFrom(''); setTo(''); setStatus(''); setBuyer('') }}>Tozalash</Btn><Btn onClick={() => setFilters(false)}>Qo‘llash</Btn></div>
        </Modal>
      </div>
      <OrderForm open={adding} onClose={() => setAdding(false)} onCreated={(o) => o?.id && navigate(`/sotuvchi/buyurtmalar/${o.id}`)} />
    </div>
  )
}
