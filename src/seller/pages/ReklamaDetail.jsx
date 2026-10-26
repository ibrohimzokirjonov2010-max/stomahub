import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CircleDot, Pencil, Pause, Play, Copy, Flag, Trash2, ArrowLeft, CalendarDays, Wallet, Database, CreditCard, Eye, MousePointerClick, Users, ShoppingBag, FileText, Package, MapPin, PieChart, StickyNote, ChevronRight, Plus, Coins, X, BarChart3 } from 'lucide-react'
import { useSellerData, updateRow } from '../api'
import { dmy, hm, som, num } from '../format'
import { useMobile } from '../../useMobile'
import { card, Btn, Crumbs, Pager, usePaged, Th, Td, toast, SearchInput, Input, Select, Menu } from '../components/ui'
import Empty from '../components/shell/Empty'
import Modal from '../components/shell/Modal'
import ProductThumb from '../components/bosh-sahifa/ProductThumb'
import { Chart } from '../components/charts'
import { CKIND, cstatusOf, campProducts, campOrders, daysBetween } from '../components/reklama/constants'
import { CStatusBadge, useCampaignActions } from './Reklama'
import { initials } from '../components/mijozlar/constants'
import { masked } from './Mijozlar'

const iso = (d) => d.toISOString().slice(0, 10)
function dayRange(a, b) { const out = []; const d = new Date(`${a}T00:00:00Z`); const e = new Date(`${b}T00:00:00Z`); while (d <= e && out.length < 400) { out.push(iso(d)); d.setUTCDate(d.getUTCDate() + 1) } return out }

export default function ReklamaDetail() {
  const { id } = useParams()
  const data = useSellerData()
  const mobile = useMobile()
  const navigate = useNavigate()
  const act = useCampaignActions()
  const [budget, setBudget] = useState(false)
  const [nb, setNb] = useState('')
  const [pq, setPq] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [gran, setGran] = useState('kun')
  const [addP, setAddP] = useState(false)
  const c = data.campaigns.find((x) => x.id === id)
  const prods = useMemo(() => (c ? campProducts(c, data.products) : []), [c, data.products])
  const stats = useMemo(() => data.adStats.filter((s) => s.campaign_id === id), [data.adStats, id])
  const orders = useMemo(() => (c ? campOrders(c, data.orders).sort((a, b) => b.created_at.localeCompare(a.created_at)) : []), [c, data.orders])
  const pf = prods.filter((p) => !pq || p.name.toLowerCase().includes(pq.toLowerCase()))
  const ppg = usePaged(pf, 5)
  if (data.loading) return null
  if (!c) return <div className={card}><Empty icon={BarChart3} title="Kampaniya topilmadi" text="U o‘chirilgan bo‘lishi mumkin." action={<Btn onClick={() => navigate('/sotuvchi/reklama')}>Reklamaga qaytish</Btn>} /></div>
  const s = cstatusOf(c)
  const [, kl, ks, KI] = CKIND[c.kind] || CKIND.qidiruv
  const tot = stats.reduce((a, r) => ({ views: a.views + r.impressions, clicks: a.clicks + r.clicks, spent: a.spent + Number(r.spent) }), { views: 0, clicks: 0, spent: 0 })
  const per = (pid) => stats.filter((r) => r.product_id === pid).reduce((a, r) => ({ views: a.views + r.impressions, clicks: a.clicks + r.clicks }), { views: 0, clicks: 0 })
  const ordersOf = (pid) => orders.filter((o) => o.items.some((i) => i.product_id === pid)).length
  const buyers = new Set(orders.map((o) => o.customer_id || o.customer_phone || o.customer_name)).size
  const d = daysBetween(c.starts_on, c.ends_on)
  const total = c.total_budget || (d ? c.daily_budget * d : null)
  // grafik
  const a0 = from || c.starts_on; const b0 = to || c.ends_on || iso(new Date())
  let days = dayRange(a0, b0 < a0 ? a0 : b0)
  const byDay = Object.fromEntries(days.map((x) => [x, { v: 0, k: 0 }])); stats.forEach((r) => { if (byDay[r.day]) { byDay[r.day].v += r.impressions; byDay[r.day].k += r.clicks } })
  let labels = days.map((x) => `${x.slice(8)}.${x.slice(5, 7)}`); let views = days.map((x) => byDay[x].v); let clicks = days.map((x) => byDay[x].k)
  if (gran === 'hafta') { const L = [], V = [], K = []; for (let i = 0; i < days.length; i += 7) { L.push(labels[i]); V.push(views.slice(i, i + 7).reduce((x, y) => x + y, 0)); K.push(clicks.slice(i, i + 7).reduce((x, y) => x + y, 0)) } labels = L; views = V; clicks = K }
  const toggle = () => act.toggle(c)
  const raise = async () => { const n = Number(nb); if (!(n >= 10000)) return toast('Kamida 10 000 so‘m kiriting'); const r = await updateRow('seller_campaigns', c.id, { daily_budget: n }); toast(r.ok ? 'Kunlik byudjet yangilandi' : r.error); if (r.ok) setBudget(false) }
  const addable = data.products.filter((p) => p.status === 'active' && !prods.some((x) => x.id === p.id))
  const addProduct = async (pid) => { const r = await updateRow('seller_campaigns', c.id, { product_ids: [...prods.map((p) => p.id), pid] }); toast(r.ok ? 'Mahsulot qo‘shildi' : r.error) }
  const removeProduct = async (pid) => { if (prods.length <= 1) return toast('Kampaniyada kamida bitta mahsulot bo‘lishi kerak'); const ids = prods.map((p) => p.id).filter((x) => x !== pid); const r = await updateRow('seller_campaigns', c.id, { product_ids: ids, product_id: ids[0] }); toast(r.ok ? 'Mahsulot olib tashlandi' : r.error) }
  const info = [[FileText, 'Kampaniya nomi', c.title], [Package, 'Mahsulot', prods.length === 1 ? prods[0].name : `${prods.length} ta mahsulot`], [CircleDot, 'Holat', <CStatusBadge key="s" s={s} />], [KI, 'Turi', kl], [CalendarDays, 'Boshlanish sanasi', dmy(c.starts_on)], [CalendarDays, 'Tugash sanasi', c.ends_on ? dmy(c.ends_on) : '—'], [Database, 'Kunlik byudjet', som(c.daily_budget)], [Coins, 'Umumiy byudjet', c.total_budget ? som(c.total_budget) : 'Cheklanmagan'], [PieChart, 'Sarflangan', som(tot.spent)], [MapPin, 'Ko‘rsatish hududi', c.region], [CalendarDays, 'Yaratilgan sana', `${dmy(c.created_at)} ${hm(c.created_at)}`], c.description && [StickyNote, 'Izoh', c.description]].filter(Boolean)
  const live = s !== 'tugagan'
  const modals = <>{act.modals(() => navigate('/sotuvchi/reklama'))}
    <Modal open={budget} onClose={() => setBudget(false)} title="Byudjetni oshirish" subtitle={`Hozirgi kunlik byudjet: ${som(c.daily_budget)}`} width="md:max-w-[420px]" footer={<div className="grid grid-cols-2 gap-3"><Btn variant="outline" onClick={() => setBudget(false)}>Bekor qilish</Btn><Btn onClick={raise}>Saqlash</Btn></div>}><div className="relative"><Input type="number" min="10000" step="1000" value={nb} onChange={(e) => setNb(e.target.value)} placeholder="Yangi kunlik byudjet" className="pr-12" /><span className="absolute inset-y-0 right-3 grid place-items-center text-[12.5px] text-[#5C6E80]">so‘m</span></div></Modal>
    <Modal open={addP} onClose={() => setAddP(false)} title="Mahsulot qo‘shish" width="md:max-w-[480px]">{addable.length ? <div className="space-y-1">{addable.map((p) => <button key={p.id} type="button" onClick={() => { addProduct(p.id); setAddP(false) }} className="flex w-full items-center gap-2.5 rounded-xl border border-[#EEF3F4] p-2 text-left hover:border-[#0F766E]"><ProductThumb src={p.image_url} className="h-9 w-11 shrink-0" /><span className="flex-1 truncate text-[13px]">{p.name}</span><b className="text-[12.5px]">{som(p.price)}</b><Plus className="size-4 text-[#0F766E]" /></button>)}</div> : <p className="py-6 text-center text-[13px] text-[#5C6E80]">Qo‘shish uchun boshqa faol mahsulot yo‘q.</p>}</Modal>
  </>
  const recent = orders.slice(0, 5)

  if (mobile) return (
    <div className="space-y-3 pb-24">
      <div className="relative flex items-center justify-center py-1"><button type="button" aria-label="Orqaga" onClick={() => navigate('/sotuvchi/reklama')} className="absolute left-0 text-[#0F766E]"><ArrowLeft className="size-6" /></button><h1 className="text-[19px] font-extrabold">Kampaniya tafsiloti</h1></div>
      <div className={`${card} flex gap-3 p-3`}><ProductThumb src={prods[0]?.image_url} className="h-[120px] w-[130px] shrink-0" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-1"><div className="text-[14.5px] font-bold">{c.title}</div><CStatusBadge s={s} /></div><div className="truncate text-[12px] text-[#0F766E]">{prods[0]?.name}{prods.length > 1 && ` +${prods.length - 1}`}</div><div className="mt-1.5 flex items-center gap-1 whitespace-nowrap text-[12px]"><CalendarDays className="size-3.5 text-[#0F766E]" />{dmy(c.starts_on)} – {c.ends_on ? dmy(c.ends_on) : '…'}</div><div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#EEF3F4] pt-2"><div><div className="text-[11px] text-[#5C6E80]">Kunlik byudjet</div><div className="whitespace-nowrap text-[13px] font-extrabold">{som(c.daily_budget)}</div></div><div><div className="text-[11px] text-[#5C6E80]">Sarflangan</div><div className="whitespace-nowrap text-[13px] font-extrabold">{som(tot.spent)}</div></div></div></div></div>
      <div className="grid grid-cols-4 gap-2">{[[Eye, 'Ko‘rishlar', num(tot.views), 'Jami'], [MousePointerClick, 'Bosishlar', num(tot.clicks), 'Jami'], [Users, 'Mijozlar', buyers, 'Buyurtma'], [ShoppingBag, 'Sotuvlar', orders.length, 'Buyurtma']].map(([I, l, v, sub]) => <div key={l} className="rounded-xl bg-[#F0FDFA] p-2.5"><span className="grid size-7 place-items-center rounded-full bg-white text-[#0F766E]"><I className="size-4" /></span><div className="mt-1.5 text-[11.5px] text-[#3D4E5F]">{l}</div><div className="text-[17px] font-extrabold">{v}</div><div className="text-[10.5px] text-[#5C6E80]">{sub}</div></div>)}</div>
      <div className={`${card} p-3 text-[12.5px]`}><div className="mb-1 flex items-center gap-2 text-[14px] font-bold"><FileText className="size-5 text-[#0F766E]" />Kampaniya ma’lumotlari</div>{info.map(([I, l, v]) => <div key={l} className="flex items-center gap-2 border-b border-[#EEF3F4] py-1.5 last:border-0"><I className="size-4 shrink-0 text-[#0F766E]" /><span className="shrink-0 text-[#5C6E80]">{l}</span><span className="ml-auto text-right">{v}</span></div>)}</div>
      <div className={`${card} p-3`}><div className="mb-2 text-[14px] font-bold">Statistika (kunlar kesimida)</div>{tot.views + tot.clicks ? <Chart labels={labels} series={[{ color: '#0F766E', values: views }, { color: '#5CCBBE', values: clicks }]} height={150} maxTicks={5} /> : <p className="py-4 text-center text-[12.5px] text-[#5C6E80]">Hali ko‘rishlar yo‘q. Kampaniya faol bo‘lganda statistika shu yerda paydo bo‘ladi.</p>}</div>
      <div className={`${card} p-3`}><div className="mb-1 text-[14px] font-bold">Oxirgi mijozlar</div>{recent.length ? recent.map((o) => <button key={o.id} type="button" onClick={() => navigate(`/sotuvchi/buyurtmalar/${o.id}`)} className="flex w-full items-center gap-3 border-b border-[#EEF3F4] py-2 text-left last:border-0"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-[13px] font-bold text-[#0F766E]">{initials(o.customer_name)}</span><div className="min-w-0 flex-1"><div className="truncate text-[13px] font-semibold">{o.customer_name}</div><div className="whitespace-nowrap text-[11.5px] text-[#5C6E80]">{masked(o.customer_phone)}</div></div><span className="text-[11.5px] text-[#5C6E80]">{dmy(o.created_at)}</span><b className="whitespace-nowrap text-[12.5px]">{som(o.subtotal)}</b><ChevronRight className="size-4" /></button>) : <p className="py-3 text-center text-[12.5px] text-[#5C6E80]">Kampaniya davrida bu mahsulotlarga buyurtma bo‘lmagan.</p>}</div>
      <div className="space-y-2">
        <Btn className="w-full" icon={Pencil} onClick={() => act.setForm({ edit: c })}>Tahrirlash</Btn>
        {live && <Btn className="w-full" variant="outline" icon={s === 'toxtatilgan' ? Play : Pause} onClick={toggle}>{s === 'toxtatilgan' ? 'Davom ettirish' : 'Pauza qilish'}</Btn>}
        {live && <Btn className="w-full" variant="outline" icon={BarChart3} onClick={() => { setNb(String(c.daily_budget)); setBudget(true) }}>Byudjetni oshirish</Btn>}
        <Btn className="w-full" variant="outline" icon={Copy} onClick={() => act.setForm({ copy: c })}>Nusxa olish</Btn>
        {live && <Btn className="w-full" variant="outline" icon={Flag} onClick={() => act.setEnd(c)}>To‘xtatish (yakunlash)</Btn>}
        <Btn className="w-full" variant="gray" icon={Trash2} onClick={() => act.setDel(c)}>O‘chirish</Btn>
      </div>
      {modals}
    </div>
  )

  return (
    <div className="space-y-4">
      <Crumbs items={[['Reklama', '/sotuvchi/reklama'], ['Kampaniya tafsiloti']]} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><div className="flex items-center gap-3"><h1 className="truncate text-[28px] font-extrabold tracking-tight">{c.title}</h1><CStatusBadge s={s} /></div><p className="text-[14px] text-[#5C6E80]">{c.description || `${kl}: ${ks.toLowerCase()}.`}</p></div>
        <div className="flex flex-wrap gap-2">
          <Btn size="sm" variant="outline" icon={Pencil} onClick={() => act.setForm({ edit: c })}>Tahrirlash</Btn>
          {live && <Btn size="sm" variant="outline" icon={s === 'toxtatilgan' ? Play : Pause} onClick={toggle}>{s === 'toxtatilgan' ? 'Davom ettirish' : 'To‘xtatish'}</Btn>}
          {live && <Btn size="sm" variant="outline" icon={Database} onClick={() => { setNb(String(c.daily_budget)); setBudget(true) }}>Byudjetni oshirish</Btn>}
          <Btn size="sm" variant="outline" icon={Copy} onClick={() => act.setForm({ copy: c })}>Nusxa olish</Btn>
          {live ? <Btn size="sm" variant="outline" icon={Flag} onClick={() => act.setEnd(c)}>Yakunlash</Btn> : <Btn size="sm" variant="gray" icon={Trash2} onClick={() => act.setDel(c)}>O‘chirish</Btn>}
        </div>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {[[KI, 'Kampaniya turi', kl, ks], [CalendarDays, 'Muddat', `${dmy(c.starts_on)} – ${c.ends_on ? dmy(c.ends_on) : '…'}`, d ? `${d} kun` : ''], [Wallet, 'Kunlik byudjet', som(c.daily_budget)], [Database, 'Umumiy byudjet', total ? som(total) : 'Cheklanmagan', c.total_budget ? '' : 'Kunlik × kunlar'], [CreditCard, 'Sarflandi', som(tot.spent), 'Reklama balansidan']].map(([I, l, v, sub]) => (
          <div key={l} className={`${card} flex items-center gap-3 p-3`}><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]"><I className="size-5" /></span><div className="min-w-0"><div className="text-[11.5px] text-[#5C6E80]">{l}</div><div className="truncate text-[13.5px] font-bold" title={typeof v === 'string' ? v : undefined}>{v}</div>{sub && <div className="truncate text-[11px] text-[#5C6E80]">{sub}</div>}</div></div>))}
      </div>
      <div className="grid grid-cols-[1fr_300px] gap-4">
        <div className="min-w-0 space-y-4">
          <div className={`${card} p-4`}>
            <div className="mb-2 flex items-start justify-between gap-3"><div><h2 className="text-[15px] font-bold">Ko‘rsatkichlar grafigi</h2><p className="text-[12px] text-[#5C6E80]">Kampaniya davomida ko‘rishlar va bosishlar soni bo‘yicha.</p></div><div className="flex items-center gap-2"><div className="flex items-center gap-1.5 rounded-[10px] border border-[#DCE5E7] px-2 text-[12.5px]"><CalendarDays className="size-4 text-[#0F766E]" /><input type="date" value={from || c.starts_on} onChange={(e) => setFrom(e.target.value)} className="h-9 w-[118px] outline-none" />–<input type="date" value={to || c.ends_on || ''} onChange={(e) => setTo(e.target.value)} className="h-9 w-[118px] outline-none" />{(from || to) && <button type="button" aria-label="Tozalash" onClick={() => { setFrom(''); setTo('') }}><X className="size-4" /></button>}</div><Select value={gran} onChange={setGran} options={[['kun', 'Kunlik'], ['hafta', 'Haftalik']]} className="w-[110px]" /></div></div>
            <div className="mb-2 flex justify-center gap-5 text-[12.5px]"><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#0F766E]" />Ko‘rishlar</span><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#5CCBBE]" />Bosishlar</span></div>
            {tot.views + tot.clicks ? <Chart labels={labels} series={[{ color: '#0F766E', values: views }, { color: '#5CCBBE', values: clicks }]} height={210} /> : <div className="grid h-[210px] place-items-center rounded-xl bg-[#F8FCFC] text-center text-[13px] text-[#5C6E80]">Hali ko‘rishlar yo‘q.<br />Kampaniya faol bo‘lganda xaridorlar ko‘rgan va bosgan har bir holat shu yerda ko‘rinadi.</div>}
          </div>
          <div className={`${card} p-4`}>
            <div className="mb-3 flex items-center gap-3"><h2 className="text-[15px] font-bold">Kampaniya mahsulotlari ({prods.length})</h2><SearchInput value={pq} onChange={setPq} placeholder="Mahsulot nomi bo‘yicha qidirish..." className="max-w-[300px] flex-1" /><Btn size="sm" variant="outline" icon={Plus} onClick={() => setAddP(true)} className="ml-auto">Mahsulot qo‘shish</Btn></div>
            {ppg.rows.length ? <><div className="overflow-x-auto"><table className="w-full min-w-[780px] table-fixed"><colgroup><col className="w-[34px]" /><col /><col className="w-[150px]" /><col className="w-[110px]" /><col className="w-[84px]" /><col className="w-[78px]" /><col className="w-[92px]" /><col className="w-[56px]" /></colgroup>
              <thead className="bg-[#F6FAFA]"><tr><Th>#</Th><Th>Mahsulot</Th><Th>Kategoriya</Th><Th>Narx</Th><Th>Ko‘rishlar</Th><Th>Bosishlar</Th><Th>Buyurtmalar</Th><Th className="text-center">Amallar</Th></tr></thead>
              <tbody>{ppg.rows.map((p, i) => { const x = per(p.id); return <tr key={p.id} className="border-t border-[#EEF3F4]"><Td className="text-[#5C6E80]">{ppg.offset + i + 1}</Td><Td><div className="flex items-center gap-2"><ProductThumb src={p.image_url} className="h-9 w-11 shrink-0" /><div className="min-w-0"><div className="truncate">{p.name}</div><div className="text-[11px] text-[#5C6E80]">{p.unit}</div></div></div></Td><Td className="truncate text-[#5C6E80]">{p.category || '—'}</Td><Td className="font-semibold">{som(p.price)}</Td><Td>{num(x.views)}</Td><Td>{num(x.clicks)}</Td><Td>{ordersOf(p.id)}</Td><Td className="text-center"><Menu items={[['Mahsulotni ko‘rish', () => navigate(`/sotuvchi/mahsulotlar/${p.id}`), Eye], ['Kampaniyadan olib tashlash', () => removeProduct(p.id), Trash2]]} /></Td></tr> })}</tbody></table></div>
              {ppg.pages > 1 && <Pager {...ppg} />}</> : <p className="py-6 text-center text-[13px] text-[#5C6E80]">Mahsulot topilmadi.</p>}
          </div>
        </div>
        <div className="space-y-4">
          <div className={`${card} p-4 text-[12.5px]`}><h2 className="mb-2 text-[15px] font-bold">Kampaniya ma’lumotlari</h2>{info.map(([, l, v]) => <div key={l} className="grid grid-cols-[112px_1fr] gap-2 border-b border-[#EEF3F4] py-1.5 last:border-0"><span className="text-[#5C6E80]">{l}</span><span>{v}</span></div>)}</div>
          <div className={`${card} p-4`}><div className="mb-2 flex items-center justify-between"><h2 className="text-[15px] font-bold">So‘nggi buyurtmalar</h2>{orders.length > 5 && <button type="button" onClick={() => navigate('/sotuvchi/buyurtmalar')} className="text-[12px] font-semibold text-[#0F766E]">Barchasini ko‘rish →</button>}</div>
            {recent.length ? recent.map((o) => <button key={o.id} type="button" onClick={() => navigate(`/sotuvchi/buyurtmalar/${o.id}`)} className="flex w-full items-center gap-2.5 border-b border-[#EEF3F4] py-2 text-left last:border-0"><ProductThumb src={o.items[0]?.image_url} className="h-9 w-11 shrink-0" /><div className="min-w-0 flex-1"><div className="text-[12.5px] font-semibold">{o.code}</div><div className="text-[11px] text-[#5C6E80]">{dmy(o.created_at)} · {o.items.length} ta mahsulot</div></div><b className="whitespace-nowrap text-[12.5px] text-[#0F766E]">{som(o.subtotal)}</b></button>) : <p className="py-4 text-center text-[12.5px] text-[#5C6E80]">Kampaniya davrida bu mahsulotlarga buyurtma bo‘lmagan.</p>}
          </div>
        </div>
      </div>
      {modals}
    </div>
  )
}
