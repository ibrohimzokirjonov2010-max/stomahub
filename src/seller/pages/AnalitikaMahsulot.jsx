import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Download, Pencil, Tag, Megaphone, Scale, Box, Database, Eye, FileText, ShoppingCart, UserRound, Building2, BarChart3 } from 'lucide-react'
import { useSellerData, netOf, csvDownload } from '../api'
import { som, num } from '../format'
import { useMobile } from '../../useMobile'
import { card, Btn, Crumbs, Th, Td, Select } from '../components/ui'
import Empty from '../components/shell/Empty'
import Modal from '../components/shell/Modal'
import ProductThumb from '../components/bosh-sahifa/ProductThumb'
import ProductForm from '../components/mahsulotlar/ProductForm'
import { Chart } from '../components/charts'
import { ymOf, ymTitle, monthRange, liveOrders, days, dayOf } from '../components/analitika/lib'
import { MonthSelect } from './Analitika'

export default function AnalitikaMahsulot() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const data = useSellerData()
  const mobile = useMobile()
  const navigate = useNavigate()
  const [ym, setYm] = useState(sp.get('m') || ymOf())
  const [edit, setEdit] = useState(false)
  const [cmp, setCmp] = useState(false)
  const [other, setOther] = useState('')
  const p = data.products.find((x) => x.id === id)
  const r = monthRange(ym)
  const calc = (pid) => {
    const list = liveOrders(data.orders, r).filter((o) => o.items.some((i) => i.product_id === pid))
    const line = (o) => { const k = netOf(o) / (Number(o.subtotal) || 1); return o.items.filter((i) => i.product_id === pid).reduce((a, i) => ({ qty: a.qty + Number(i.qty), sum: a.sum + Math.round(Number(i.total ?? i.qty * i.price) * k) }), { qty: 0, sum: 0 }) }
    const rows = list.map((o) => ({ o, ...line(o) }))
    const views = data.adStats.filter((s) => s.product_id === pid && s.day >= r.from && s.day <= r.to).reduce((a, s) => a + s.impressions, 0)
    return { rows, qty: rows.reduce((a, x) => a + x.qty, 0), sum: rows.reduce((a, x) => a + x.sum, 0), orders: rows.length, views }
  }
  const m = useMemo(() => (p ? calc(p.id) : null), [p, data, ym]) // eslint-disable-line react-hooks/exhaustive-deps
  if (data.loading) return null
  if (!p) return <div className={card}><Empty icon={BarChart3} title="Mahsulot topilmadi" action={<Btn onClick={() => navigate('/sotuvchi/analitika')}>Analitikaga qaytish</Btn>} /></div>
  const dl = days(r); const byDay = Object.fromEntries(dl.map((d) => [d, 0])); m.rows.forEach((x) => { byDay[dayOf(x.o.created_at)] += x.qty })
  const reg = new Map(); m.rows.forEach((x) => { const k = x.o.region || 'Ko‘rsatilmagan'; const v = reg.get(k) || { qty: 0, sum: 0 }; v.qty += x.qty; v.sum += x.sum; reg.set(k, v) })
  const regions = [...reg.entries()].sort((a, b) => b[1].sum - a[1].sum)
  const cus = new Map(); m.rows.forEach((x) => { const k = x.o.customer_id || x.o.customer_phone || x.o.customer_name; const c = data.customers.find((y) => y.id === x.o.customer_id); const v = cus.get(k) || { name: x.o.customer_name, clinic: c?.kind === 'klinika', id: x.o.customer_id, n: 0, qty: 0, sum: 0 }; v.n += 1; v.qty += x.qty; v.sum += x.sum; cus.set(k, v) })
  const top = [...cus.values()].sort((a, b) => b.sum - a.sum).slice(0, 5)
  const exportCsv = () => csvDownload(`${p.name}_${ym}.csv`, [['Sana', 'Buyurtma', 'Mijoz', 'Hudud', 'Soni', 'Summa'], ...m.rows.map((x) => [dayOf(x.o.created_at), x.o.code, x.o.customer_name, x.o.region, x.qty, x.sum])])
  const o2 = other && data.products.find((x) => x.id === other); const m2 = o2 && calc(o2.id)
  const stats = [[Box, 'Sotilgan dona', `${num(m.qty)} dona`], [Database, 'Sotuv summasi', som(m.sum)], [Eye, 'Ko‘rishlar', num(m.views)], [FileText, 'Buyurtmalar', `${m.orders} ta`]]
  const btns = [[Download, 'Hisobotni yuklab olish', exportCsv], [Pencil, 'Mahsulotni tahrirlash', () => setEdit(true)], [Tag, 'Chegirma qo‘yish', () => navigate('/sotuvchi/chegirmalar?new=1')], [Megaphone, 'Reklama qilish', () => navigate('/sotuvchi/reklama?new=1')], [Scale, 'Taqqoslash', () => setCmp(true)]]
  const sec = (t, s, body) => <div className={`${card} p-4`}><h2 className="text-[15px] font-bold">{t}</h2><p className="mb-2 text-[12px] text-[#5C6E80]">{s}</p>{body}</div>
  const none = <p className="py-6 text-center text-[13px] text-[#5C6E80]">Bu davrda sotuv yo‘q.</p>
  return (
    <div className="space-y-3 pb-24 md:space-y-4 md:pb-0">
      {mobile ? <div className="relative flex items-center justify-center py-1"><button type="button" aria-label="Orqaga" onClick={() => navigate('/sotuvchi/analitika')} className="absolute left-0 text-[#0F766E]"><ArrowLeft className="size-6" /></button><h1 className="text-[19px] font-extrabold">Mahsulot analitikasi</h1></div> : <>
        <Crumbs items={[['Analitika', '/sotuvchi/analitika'], ['Mahsulot analitikasi tafsiloti']]} />
        <div className="flex items-start justify-between gap-3"><div><h1 className="text-[28px] font-extrabold tracking-tight">Mahsulot analitikasi tafsiloti</h1><p className="text-[14px] text-[#5C6E80]">Tanlangan mahsulot bo‘yicha batafsil savdo va faollik ma’lumotlari.</p></div><div className="flex flex-wrap justify-end gap-2">{btns.map(([I, l, f]) => <Btn key={l} size="sm" variant="outline" icon={I} onClick={f}>{l}</Btn>)}</div></div></>}
      <div className={`${card} flex flex-wrap items-center gap-4 p-4`}>
        <ProductThumb src={p.image_url} className="h-[64px] w-[80px] shrink-0 md:h-[80px] md:w-[110px]" />
        <div className="min-w-[150px] flex-1"><div className="text-[16px] font-extrabold md:text-[18px]">{p.name}</div><div className="text-[13px] text-[#5C6E80]">SKU: {p.sku || '—'}</div>{p.category && <span className="mt-1.5 inline-block rounded-lg bg-[#F0FDFA] px-2.5 py-1 text-[12px] text-[#0F766E]">{p.category}</span>}</div>
        <div className="flex items-center gap-3 md:border-l md:border-[#EEF3F4] md:px-6"><span className="grid size-11 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]"><Box className="size-5" /></span><div><div className="text-[12px] text-[#5C6E80]">Stok qoldig‘i</div><div className="text-[18px] font-extrabold">{num(p.stock)} dona</div></div></div>
        <div className="w-full md:w-auto"><div className="mb-1 text-[12px] text-[#5C6E80]">Davr</div><MonthSelect value={ym} onChange={setYm} className="w-full md:w-[180px]" /></div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">{stats.map(([I, l, v]) => <div key={l} className={`${card} flex items-center gap-3 p-3 md:p-4`}><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]"><I className="size-5" /></span><div className="min-w-0"><div className="text-[12px] text-[#3D4E5F]">{l}</div><div className="truncate text-[15px] font-extrabold md:text-[19px]">{v}</div></div></div>)}</div>
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr] md:gap-4 [&>*]:min-w-0">
        {sec('Kunlik sotuvlar grafigi', `${ymTitle(ym)} davomidagi sotilgan dona soni.`, m.qty ? <Chart labels={dl.map((d) => `${d.slice(8)}.${d.slice(5, 7)}`)} series={[{ color: '#14958A', values: dl.map((d) => byDay[d]) }]} height={mobile ? 150 : 190} maxTicks={mobile ? 6 : 16} fmt={num} /> : none)}
        {sec('Hududlar bo‘yicha sotuvlar', 'Mahsulot ushbu davrda qaysi hududlarda ko‘proq sotilgan.', regions.length ? <table className="w-full text-[12.5px]"><thead className="bg-[#F6FAFA]"><tr><Th>#</Th><Th>Hudud</Th><Th className="text-center">Sotilgan dona</Th><Th className="text-right">Sotuv summasi</Th></tr></thead><tbody>{regions.map(([k, v], i) => <tr key={k} className="border-t border-[#EEF3F4]"><Td>{i + 1}</Td><Td>{k}</Td><Td className="text-center">{v.qty}</Td><Td className="whitespace-nowrap text-right">{som(v.sum)}</Td></tr>)}</tbody></table> : none)}
      </div>
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr] md:gap-4 [&>*]:min-w-0">
        {sec('Eng ko‘p sotib olgan mijozlar', 'Ushbu mahsulotni eng ko‘p xarid qilgan mijozlar.', top.length ? <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-[12.5px]"><thead className="bg-[#F6FAFA]"><tr><Th>#</Th><Th>Mijoz</Th><Th className="text-center">Xaridlar soni</Th><Th className="text-center">Sotib olingan dona</Th><Th className="text-right">Jami summa</Th></tr></thead><tbody>{top.map((c, i) => { const I = c.clinic ? Building2 : UserRound; return <tr key={i} onClick={() => c.id && navigate(`/sotuvchi/mijozlar/${c.id}`)} className={`border-t border-[#EEF3F4] ${c.id ? 'cursor-pointer hover:bg-[#F8FCFC]' : ''}`}><Td>{i + 1}</Td><Td><span className="flex items-center gap-2"><I className="size-4 text-[#0F766E]" />{c.name}</span></Td><Td className="text-center">{c.n} ta</Td><Td className="text-center">{c.qty} dona</Td><Td className="whitespace-nowrap text-right">{som(c.sum)}</Td></tr> })}</tbody></table></div> : none)}
        {sec('Stok va sotuv holati', 'Joriy qoldiq va savdo bo‘yicha ma’lumotlar.', <div className="grid grid-cols-2 rounded-xl bg-[#F0FDFA] p-4">{[[Box, 'Joriy stok qoldig‘i', p.stock], [ShoppingCart, `${ymTitle(ym).split(' ')[0]}da sotilgan`, m.qty]].map(([I, l, v], i) => <div key={l} className={`flex items-center gap-3 ${i ? 'border-l border-[#CCFBF1] pl-4' : ''}`}><span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#0F766E]"><I className="size-5" /></span><div><div className="text-[12px] text-[#3D4E5F]">{l}</div><div className="text-[18px] font-extrabold">{num(v)} dona</div></div></div>)}{p.stock <= 5 && <p className="col-span-2 mt-3 text-[12px] text-[#115E59]">Stok kam qoldi — to‘ldirishni rejalashtiring.</p>}</div>)}
      </div>
      {mobile && <div className="space-y-2">{btns.map(([I, l, f], i) => <Btn key={l} className="w-full" variant={i ? 'outline' : 'primary'} icon={I} onClick={f}>{l}</Btn>)}</div>}
      {edit && <ProductForm open product={p} onClose={() => setEdit(false)} />}
      <Modal open={cmp} onClose={() => setCmp(false)} title="Mahsulotlarni taqqoslash" subtitle={ymTitle(ym)} width="md:max-w-[560px]">
        <Select value={other} onChange={setOther} placeholder="Taqqoslash uchun mahsulot tanlang" options={data.products.filter((x) => x.id !== p.id).map((x) => [x.id, x.name])} />
        {m2 && <table className="mt-3 w-full text-[13px]"><thead className="bg-[#F6FAFA]"><tr><Th>Ko‘rsatkich</Th><Th className="text-right">{p.name}</Th><Th className="text-right">{o2.name}</Th></tr></thead><tbody>{[['Sotilgan dona', m.qty, m2.qty, num], ['Sotuv summasi', m.sum, m2.sum, som], ['Buyurtmalar', m.orders, m2.orders, num], ['Ko‘rishlar', m.views, m2.views, num], ['Stok', p.stock, o2.stock, num]].map(([l, a, b, f]) => <tr key={l} className="border-t border-[#EEF3F4]"><Td>{l}</Td><Td className={`text-right ${a > b ? 'font-bold text-[#0F766E]' : ''}`}>{f(a)}</Td><Td className={`text-right ${b > a ? 'font-bold text-[#0F766E]' : ''}`}>{f(b)}</Td></tr>)}</tbody></table>}
      </Modal>
    </div>
  )
}
