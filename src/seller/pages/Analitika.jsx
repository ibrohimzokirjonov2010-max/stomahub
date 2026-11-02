import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, FileText, Database, Percent, ChevronRight, BarChart3, CalendarDays, Clock, HandCoins, TrendingUp, TrendingDown } from 'lucide-react'
import { useSellerData } from '../api'
import { som, num } from '../format'
import { useMobile } from '../../useMobile'
import { card, PageHead, Btn, Select, Th, Td } from '../components/ui'
import Empty from '../components/shell/Empty'
import ProductThumb from '../components/bosh-sahifa/ProductThumb'
import { Chart, Donut, TEALS } from '../components/charts'
import ReportModal from '../components/analitika/ReportModal'
import { ymOf, ymTitle, presetRange, liveOrders, daily, productSales, byCategory, byRegion, days } from '../components/analitika/lib'
import { ymShift, compare, commissionDebt, rangeLabel, ALL, tkToday, doneDay } from '../lib/metrics'

export const monthOpts = (all = false) => { const cur = ymOf(); const ms = Array.from({ length: 12 }, (_, i) => { const x = ymShift(cur, -i); return [x, ymTitle(x)] }); return all ? [['all', 'Barcha vaqt'], ...ms] : ms }
export const MonthSelect = ({ value, onChange, className = 'w-[170px]', all = false }) => <div className={`relative ${className}`}><CalendarDays className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-[#0F766E]" /><Select value={value} onChange={onChange} options={monthOpts(all)} className="w-full [&_select]:pl-9 [&>button]:pl-9" /></div>

export default function Analitika() {
  const data = useSellerData()
  const mobile = useMobile()
  const navigate = useNavigate()
  const [ym, setYm] = useState(ymOf())
  const [preset, setPreset] = useState('oy')
  const [report, setReport] = useState(false)
  const isAllTime = ym === 'all' && !(mobile && preset !== 'oy')
  const r = isAllTime ? ALL : presetRange(mobile ? preset : 'oy', ym)
  const list = useMemo(() => liveOrders(data.orders, r), [data.orders, r.from, r.to]) // eslint-disable-line react-hooks/exhaustive-deps
  const cmp = useMemo(() => compare(data.orders, r), [data.orders, r.from, r.to]) // eslint-disable-line react-hooks/exhaustive-deps
  const st = { sum: cmp.cur.revenue, count: cmp.cur.count, avg: cmp.cur.avg, commission: cmp.cur.commission }
  const debt = useMemo(() => commissionDebt(data.orders), [data.orders])
  // grafik oralig‘i: "Barcha vaqt" — birinchi yetkazilgan kundan bugungacha
  const cr = isAllTime ? (list.length ? { from: list.map(doneDay).sort()[0], to: tkToday() } : { from: tkToday(), to: tkToday() }) : r
  const sales = useMemo(() => productSales(list, data.products), [list, data.products])
  const cats = byCategory(sales)
  const regions = byRegion(list)
  const dm = daily(list, cr)
  const dl = days(cr)
  const period = mobile && preset !== 'oy' ? (preset === 'bugun' ? 'Bugun' : 'So‘nggi 7 kun') : rangeLabel(r)
  const prevLbl = cmp.prevRange ? (mobile && preset !== 'oy' ? 'oldingi davrga nisbatan' : `${rangeLabel(cmp.prevRange)} ga nisbatan`) : ''
  const labels = dl.map((d) => (mobile ? String(Number(d.slice(8))) : `${d.slice(8)}.${d.slice(5, 7)}`))
  const cards = [
    [ShoppingCart, 'Sotuv summasi', som(st.sum), `${period} · yetkazilgan`, cmp.delta.revenue],
    [FileText, 'Yetkazilgan buyurtmalar', `${num(st.count)} ta`, period, cmp.delta.count],
    [Database, 'O‘rtacha chek', som(st.avg), period, cmp.delta.avg],
    [Percent, 'Komissiya (12%)', som(st.commission), `${period} · yetkazilgan`, cmp.delta.commission],
    [Clock, 'Kutilayotgan', som(cmp.cur.openSum), `${num(cmp.cur.openCount)} ta ochiq buyurtma · ${period}`, null],
    [HandCoins, 'Jami komissiya qarzi', som(debt), 'Jami · naqd yetkazilganlar', null, '/sotuvchi/hamyon'],
  ]
  const Delta = ({ v }) => (v == null ? null : <span title={prevLbl} className={`inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-semibold ${v >= 0 ? 'text-[#0F766E]' : 'text-[#B42318]'}`}>{v >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}{v > 0 ? '+' : ''}{String(v).replace('.', ',')}%</span>)
  const openP = (s) => s.product && navigate(`/sotuvchi/analitika/mahsulot/${s.id}?m=${ym === 'all' ? ymOf() : ym}`)
  const empty = <Empty icon={BarChart3} title={data.orders.length ? `${period}: yetkazilgan sotuv yo‘q` : 'Hali sotuvlar yo‘q'} text={data.orders.length ? 'Boshqa davrni tanlang.' : 'Birinchi buyurtmalar kelgach, statistika shu yerda ko‘rinadi.'} />
  const modal = <ReportModal key={`${r.from}${r.to}`} open={report} onClose={() => setReport(false)} range={isAllTime ? cr : r} />
  const statGrid = <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4 2xl:grid-cols-6">{cards.map(([I, l, v, s, d, to]) => <div key={l} role={to ? 'link' : undefined} tabIndex={to ? 0 : undefined} onClick={to ? () => navigate(to) : undefined} className={`${card} flex min-w-0 items-center gap-3 p-3 md:p-4 ${to ? 'cursor-pointer hover:bg-[#F8FCFC]' : ''}`}><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E] md:size-14"><I className="size-5 md:size-7" /></span><div className="min-w-0"><div className="truncate text-[12px] text-[#3D4E5F] md:text-[13px]">{l}</div><div className="truncate text-[15px] font-extrabold md:text-[17px] xl:text-[19px]">{v}</div><div className="truncate text-[11px] text-[#5C6E80]">{s}</div>{d != null && <div className="flex items-center gap-1"><Delta v={d} /><span className="truncate text-[10.5px] text-[#5C6E80]">{prevLbl}</span></div>}</div></div>)}</div>

  if (mobile) return (
    <div className="space-y-3 pb-24">
      <PageHead title="Analitika" subtitle="Do‘koningiz ko‘rsatkichlarini kuzating." />
      <div className="grid grid-cols-3 gap-2">{[['bugun', 'Bugun'], ['hafta', 'Hafta'], ['oy', 'Oy']].map(([k, l]) => <button key={k} type="button" onClick={() => setPreset(k)} className={`h-10 rounded-xl border text-[14px] font-medium ${preset === k ? 'border-[#0F766E] bg-[#0F766E] text-white' : 'border-[#DCE5E7] text-[#0F766E]'}`}>{l}</button>)}</div>
      {preset === 'oy' && <MonthSelect all value={ym} onChange={setYm} className="w-full" />}
      {statGrid}
      <div className={`${card} p-3`}><div className="mb-2 flex justify-between"><b className="text-[14px]">Sotuvlar grafigi</b><span className="text-[12px] text-[#0F766E]">{period}</span></div>{list.length ? <Chart kind="bar" labels={labels} series={[{ color: '#14B8A6', values: dl.map((d) => dm[d]) }]} height={170} maxTicks={7} /> : empty}</div>
      <div className={`${card} p-3`}><div className="mb-1 flex justify-between"><b className="text-[14px]">Eng ko‘p sotilgan mahsulotlar</b></div>{sales.length ? sales.slice(0, 5).map((s, i) => <button key={s.id} type="button" onClick={() => openP(s)} className="flex w-full items-center gap-3 border-b border-[#EEF3F4] py-2 text-left last:border-0"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-[13px] font-bold text-[#0F766E]">{i + 1}</span><ProductThumb src={s.image_url} className="size-12 shrink-0" /><div className="min-w-0 flex-1"><div className="truncate text-[13.5px] font-semibold">{s.name}</div><div className="text-[12px] text-[#5C6E80]">Sotuvlar: {num(s.qty)} ta</div></div><b className="whitespace-nowrap text-[13px]">{som(s.sum)}</b><ChevronRight className="size-4 shrink-0" /></button>) : <p className="py-4 text-center text-[12.5px] text-[#5C6E80]">Bu davrda sotilgan mahsulot yo‘q.</p>}</div>
      <Btn icon={FileText} size="lg" className="w-full" onClick={() => setReport(true)}>Hisobot yaratish</Btn>
      {modal}
    </div>
  )

  return (
    <div className="space-y-4">
      <PageHead title="Analitika" subtitle="Yetkazilgan buyurtmalar bo‘yicha statistika. Demo buyurtmalar hisobga olinmaydi." action={<div className="flex gap-3"><MonthSelect all value={ym} onChange={setYm} /><Btn icon={FileText} size="lg" onClick={() => setReport(true)}>Hisobot yaratish</Btn></div>} />
      {statGrid}
      <div className="grid grid-cols-[1.5fr_1fr] gap-4">
        <div className={`${card} p-4`}><h2 className="text-[15px] font-bold">Kunlik sotuvlar grafigi</h2><p className="mb-3 text-[12px] text-[#5C6E80]">{period} — yetkazilgan buyurtmalar summasi (so‘m), Toshkent vaqti bo‘yicha.</p>{list.length ? <Chart kind="bar" labels={labels} series={[{ color: '#14B8A6', values: dl.map((d) => dm[d]) }]} height={220} /> : empty}</div>
        <div className={`${card} p-4`}><h2 className="text-[15px] font-bold">Kategoriyalar bo‘yicha sotuvlar</h2><p className="mb-3 text-[12px] text-[#5C6E80]">Sotuv summasi bo‘yicha taqsimot ({period}).</p>{cats.length ? <div className="flex items-center gap-4"><Donut parts={cats.map((c, i) => ({ value: c.value, color: TEALS[i % TEALS.length] }))} center={num(st.sum)} size={170} /><div className="min-w-0 flex-1 space-y-2 text-[12.5px]">{cats.map((c, i) => <div key={c.label} className="flex items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ background: TEALS[i % TEALS.length] }} /><span className="flex-1 truncate">{c.label}</span><b className="whitespace-nowrap">{num(c.value)}</b></div>)}</div></div> : <p className="py-10 text-center text-[13px] text-[#5C6E80]">Ma’lumot yo‘q.</p>}</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className={`${card} p-4`}><h2 className="text-[15px] font-bold">Top mahsulotlar</h2><p className="mb-2 text-[12px] text-[#5C6E80]">Sotuv summasi bo‘yicha eng ko‘p sotilgan mahsulotlar.</p>{sales.length ? <table className="w-full"><thead className="bg-[#F6FAFA]"><tr><Th>#</Th><Th>Mahsulot</Th><Th className="text-right">Soni</Th><Th className="text-right">Sotuv summasi</Th></tr></thead><tbody>{sales.slice(0, 5).map((s, i) => <tr key={s.id} onClick={() => openP(s)} className={`border-t border-[#EEF3F4] ${s.product ? 'cursor-pointer hover:bg-[#F8FCFC]' : ''}`}><Td className="text-[#5C6E80]">{i + 1}</Td><Td><div className="flex items-center gap-2"><ProductThumb src={s.image_url} className="h-9 w-11 shrink-0" /><div className="min-w-0"><div className="truncate">{s.name}</div><div className="text-[11px] text-[#5C6E80]">{s.unit}</div></div></div></Td><Td className="text-right">{num(s.qty)}</Td><Td className="whitespace-nowrap text-right">{som(s.sum)}</Td></tr>)}</tbody></table> : <p className="py-8 text-center text-[13px] text-[#5C6E80]">Bu davrda sotilgan mahsulot yo‘q.</p>}</div>
        <div className={`${card} p-4`}><h2 className="text-[15px] font-bold">Hududlar bo‘yicha sotuvlar</h2><p className="mb-2 text-[12px] text-[#5C6E80]">Yetkazilgan buyurtmalar soni va summasi ({period}).</p>{regions.length ? <table className="w-full"><thead className="bg-[#F6FAFA]"><tr><Th>#</Th><Th>Hudud</Th><Th className="text-center">Buyurtmalar soni</Th><Th className="text-right">Sotuv summasi</Th></tr></thead><tbody>{regions.slice(0, 8).map((g, i) => <tr key={g.region} className="border-t border-[#EEF3F4]"><Td className="text-[#5C6E80]">{i + 1}</Td><Td>{g.region}</Td><Td className="text-center">{g.count}</Td><Td className="whitespace-nowrap text-right">{som(g.sum)}</Td></tr>)}</tbody></table> : <p className="py-8 text-center text-[13px] text-[#5C6E80]">Ma’lumot yo‘q.</p>}</div>
      </div>
      {modal}
    </div>
  )
}
