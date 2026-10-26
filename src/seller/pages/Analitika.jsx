import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, FileText, Database, Percent, ShoppingBag, ChevronRight, BarChart3, CalendarDays } from 'lucide-react'
import { useSellerData } from '../api'
import { som, num } from '../format'
import { useMobile } from '../../useMobile'
import { card, PageHead, Btn, Select, Th, Td } from '../components/ui'
import Empty from '../components/shell/Empty'
import ProductThumb from '../components/bosh-sahifa/ProductThumb'
import { Chart, Donut, TEALS } from '../components/charts'
import ReportModal from '../components/analitika/ReportModal'
import { ymOf, ymTitle, presetRange, liveOrders, summary, daily, productSales, byCategory, byRegion, days } from '../components/analitika/lib'

export const monthOpts = () => { const d = new Date(); return Array.from({ length: 12 }, (_, i) => { const x = ymOf(new Date(d.getFullYear(), d.getMonth() - i, 1)); return [x, ymTitle(x)] }) }
export const MonthSelect = ({ value, onChange, className = 'w-[170px]' }) => <div className={`relative ${className}`}><CalendarDays className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-[#0F766E]" /><Select value={value} onChange={onChange} options={monthOpts()} className="w-full [&_select]:pl-9 [&>button]:pl-9" /></div>

export default function Analitika() {
  const data = useSellerData()
  const mobile = useMobile()
  const navigate = useNavigate()
  const [ym, setYm] = useState(ymOf())
  const [preset, setPreset] = useState('oy')
  const [report, setReport] = useState(false)
  const r = presetRange(mobile ? preset : 'oy', ym)
  const list = useMemo(() => liveOrders(data.orders, r), [data.orders, r.from, r.to]) // eslint-disable-line react-hooks/exhaustive-deps
  const st = summary(list)
  const sales = useMemo(() => productSales(list, data.products), [list, data.products])
  const cats = byCategory(sales)
  const regions = byRegion(list)
  const dm = daily(list, r)
  const dl = days(r)
  const period = mobile && preset !== 'oy' ? (preset === 'bugun' ? 'Bugun' : 'So‘nggi 7 kun') : ymTitle(ym)
  const labels = dl.map((d) => (mobile ? String(Number(d.slice(8))) : `${d.slice(8)}.${d.slice(5, 7)}`))
  const cards = [[ShoppingCart, 'Sotuv summasi', som(st.sum), 'Naqd to‘lovlar'], [FileText, 'Buyurtmalar soni', num(st.count), 'Ta buyurtma'], [Database, 'O‘rtacha chek', som(st.avg), '1 ta buyurtma uchun'], [Percent, 'Komissiya (12%)', som(st.commission), 'Platforma komissiyasi']]
  const openP = (s) => s.product && navigate(`/sotuvchi/analitika/mahsulot/${s.id}?m=${ym}`)
  const empty = <Empty icon={BarChart3} title={data.orders.length ? `${period} davrida sotuv yo‘q` : 'Hali sotuvlar yo‘q'} text={data.orders.length ? 'Boshqa davrni tanlang.' : 'Birinchi buyurtmalar kelgach, statistika shu yerda ko‘rinadi.'} />
  const modal = <ReportModal key={`${r.from}${r.to}`} open={report} onClose={() => setReport(false)} range={r} />
  const statGrid = <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">{cards.map(([I, l, v, s]) => <div key={l} className={`${card} flex items-center gap-3 p-3 md:p-4`}><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E] md:size-14"><I className="size-5 md:size-7" /></span><div className="min-w-0"><div className="truncate text-[12px] text-[#3D4E5F] md:text-[13px]">{l}</div><div className="truncate text-[15px] font-extrabold md:text-[17px] xl:text-[19px]">{v}</div><div className="truncate text-[11px] text-[#5C6E80]">{s}</div></div></div>)}</div>

  if (mobile) return (
    <div className="space-y-3 pb-24">
      <PageHead title="Analitika" subtitle="Do‘koningiz ko‘rsatkichlarini kuzating." />
      <div className="grid grid-cols-3 gap-2">{[['bugun', 'Bugun'], ['hafta', 'Hafta'], ['oy', 'Oy']].map(([k, l]) => <button key={k} type="button" onClick={() => setPreset(k)} className={`h-10 rounded-xl border text-[14px] font-medium ${preset === k ? 'border-[#0F766E] bg-[#0F766E] text-white' : 'border-[#DCE5E7] text-[#0F766E]'}`}>{l}</button>)}</div>
      {preset === 'oy' && <MonthSelect value={ym} onChange={setYm} className="w-full" />}
      {statGrid}
      <div className={`${card} p-3`}><div className="mb-2 flex justify-between"><b className="text-[14px]">Sotuvlar grafigi</b><span className="text-[12px] text-[#0F766E]">{period}</span></div>{list.length ? <Chart kind="bar" labels={labels} series={[{ color: '#14B8A6', values: dl.map((d) => dm[d]) }]} height={170} maxTicks={7} /> : empty}</div>
      <div className={`${card} p-3`}><div className="mb-1 flex justify-between"><b className="text-[14px]">Eng ko‘p sotilgan mahsulotlar</b></div>{sales.length ? sales.slice(0, 5).map((s, i) => <button key={s.id} type="button" onClick={() => openP(s)} className="flex w-full items-center gap-3 border-b border-[#EEF3F4] py-2 text-left last:border-0"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-[13px] font-bold text-[#0F766E]">{i + 1}</span><ProductThumb src={s.image_url} className="size-12 shrink-0" /><div className="min-w-0 flex-1"><div className="truncate text-[13.5px] font-semibold">{s.name}</div><div className="text-[12px] text-[#5C6E80]">Sotuvlar: {num(s.qty)} ta</div></div><b className="whitespace-nowrap text-[13px]">{som(s.sum)}</b><ChevronRight className="size-4 shrink-0" /></button>) : <p className="py-4 text-center text-[12.5px] text-[#5C6E80]">Bu davrda sotilgan mahsulot yo‘q.</p>}</div>
      <Btn icon={FileText} size="lg" className="w-full" onClick={() => setReport(true)}>Hisobot yaratish</Btn>
      {modal}
    </div>
  )

  return (
    <div className="space-y-4">
      <PageHead title="Analitika" subtitle="Sotuvlar, buyurtmalar va mijozlar bo‘yicha statistik ma’lumotlar." action={<div className="flex gap-3"><MonthSelect value={ym} onChange={setYm} /><Btn icon={FileText} size="lg" onClick={() => setReport(true)}>Hisobot yaratish</Btn></div>} />
      {statGrid}
      <div className="grid grid-cols-[1.5fr_1fr] gap-4">
        <div className={`${card} p-4`}><h2 className="text-[15px] font-bold">Kunlik sotuvlar grafigi</h2><p className="mb-3 text-[12px] text-[#5C6E80]">{ymTitle(ym)} oyida amalga oshirilgan sotuvlar summasi (so‘m).</p>{list.length ? <Chart kind="bar" labels={labels} series={[{ color: '#14B8A6', values: dl.map((d) => dm[d]) }]} height={220} /> : empty}</div>
        <div className={`${card} p-4`}><h2 className="text-[15px] font-bold">Kategoriyalar bo‘yicha sotuvlar</h2><p className="mb-3 text-[12px] text-[#5C6E80]">Sotuv summasi bo‘yicha taqsimot ({ymTitle(ym)}).</p>{cats.length ? <div className="flex items-center gap-4"><Donut parts={cats.map((c, i) => ({ value: c.value, color: TEALS[i % TEALS.length] }))} center={num(st.sum)} size={170} /><div className="min-w-0 flex-1 space-y-2 text-[12.5px]">{cats.map((c, i) => <div key={c.label} className="flex items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ background: TEALS[i % TEALS.length] }} /><span className="flex-1 truncate">{c.label}</span><b className="whitespace-nowrap">{num(c.value)}</b></div>)}</div></div> : <p className="py-10 text-center text-[13px] text-[#5C6E80]">Ma’lumot yo‘q.</p>}</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className={`${card} p-4`}><h2 className="text-[15px] font-bold">Top mahsulotlar</h2><p className="mb-2 text-[12px] text-[#5C6E80]">Sotuv summasi bo‘yicha eng ko‘p sotilgan mahsulotlar.</p>{sales.length ? <table className="w-full"><thead className="bg-[#F6FAFA]"><tr><Th>#</Th><Th>Mahsulot</Th><Th className="text-right">Soni</Th><Th className="text-right">Sotuv summasi</Th></tr></thead><tbody>{sales.slice(0, 5).map((s, i) => <tr key={s.id} onClick={() => openP(s)} className={`border-t border-[#EEF3F4] ${s.product ? 'cursor-pointer hover:bg-[#F8FCFC]' : ''}`}><Td className="text-[#5C6E80]">{i + 1}</Td><Td><div className="flex items-center gap-2"><ProductThumb src={s.image_url} className="h-9 w-11 shrink-0" /><div className="min-w-0"><div className="truncate">{s.name}</div><div className="text-[11px] text-[#5C6E80]">{s.unit}</div></div></div></Td><Td className="text-right">{num(s.qty)}</Td><Td className="whitespace-nowrap text-right">{som(s.sum)}</Td></tr>)}</tbody></table> : <p className="py-8 text-center text-[13px] text-[#5C6E80]">Bu oyda sotilgan mahsulot yo‘q.</p>}</div>
        <div className={`${card} p-4`}><h2 className="text-[15px] font-bold">Hududlar bo‘yicha sotuvlar</h2><p className="mb-2 text-[12px] text-[#5C6E80]">Buyurtmalar soni va sotuv summasi bo‘yicha taqsimot ({ymTitle(ym)}).</p>{regions.length ? <table className="w-full"><thead className="bg-[#F6FAFA]"><tr><Th>#</Th><Th>Hudud</Th><Th className="text-center">Buyurtmalar soni</Th><Th className="text-right">Sotuv summasi</Th></tr></thead><tbody>{regions.slice(0, 8).map((g, i) => <tr key={g.region} className="border-t border-[#EEF3F4]"><Td className="text-[#5C6E80]">{i + 1}</Td><Td>{g.region}</Td><Td className="text-center">{g.count}</Td><Td className="whitespace-nowrap text-right">{som(g.sum)}</Td></tr>)}</tbody></table> : <p className="py-8 text-center text-[13px] text-[#5C6E80]">Ma’lumot yo‘q.</p>}</div>
      </div>
      {modal}
    </div>
  )
}
