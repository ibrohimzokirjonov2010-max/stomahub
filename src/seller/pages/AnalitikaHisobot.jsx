import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, FileText, CalendarDays, Rows3, Database, Users, Percent, Download, Share2, RefreshCw, X } from 'lucide-react'
import { useSellerData } from '../api'
import { som, dmy, hm } from '../format'
import { useMobile } from '../../useMobile'
import { card, Btn, Crumbs, Pager, usePaged, Th, Td, toast } from '../components/ui'
import Empty from '../components/shell/Empty'
import ReportModal from '../components/analitika/ReportModal'
import { DEFAULT_COLS, monthRange, ymOf } from '../components/analitika/lib'
import { buildReport, exportReport } from '../components/analitika/report'

export default function AnalitikaHisobot() {
  const data = useSellerData()
  const mobile = useMobile()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const [regen, setRegen] = useState(false)
  const def = monthRange(ymOf())
  const type = sp.get('t') || 'sotuvlar'
  const r = { from: sp.get('from') || def.from, to: sp.get('to') || def.to }
  const cols = (sp.get('c') || DEFAULT_COLS.join(',')).split(',')
  const fmt = sp.get('f') === 'pdf' ? 'pdf' : 'csv'
  const rep = useMemo(() => buildReport(type, r, cols, data), [data, type, r.from, r.to, sp]) // eslint-disable-line react-hooks/exhaustive-deps
  const pg = usePaged(rep.rows, mobile ? 8 : 15)
  const [made] = useState(() => new Date())
  if (data.loading) return null
  const share = async () => { const url = window.location.href; try { if (navigator.share) await navigator.share({ title: rep.title, url }); else { await navigator.clipboard.writeText(url); toast('Havola nusxalandi') } } catch { /* bekor qilindi */ } }
  const head = `${rep.title} hisoboti`
  const stats = [[Database, 'Sotuv summasi', som(rep.stats.sum), 'Jami sotuvlar'], [FileText, 'Buyurtmalar soni', rep.stats.count, 'Jami buyurtmalar'], [Users, 'Mijozlar soni', rep.stats.buyers, 'Noyob mijozlar'], [Percent, 'Komissiya (12%)', som(rep.stats.commission), 'Platforma komissiyasi']]
  const table = rep.rows.length ? <><div className="overflow-x-auto"><table className="w-full min-w-[640px]"><thead className="bg-[#F6FAFA]"><tr><Th>#</Th>{rep.headers.map((h) => <Th key={h}>{h}</Th>)}</tr></thead><tbody>{pg.rows.map((row, i) => <tr key={i} className="border-t border-[#EEF3F4]"><Td className="text-[#5C6E80]">{pg.offset + i + 1}</Td>{row.map((v, j) => <Td key={j} className="whitespace-nowrap text-[12.5px]">{typeof v === 'number' ? (/summa|Narx|Komissiya|to‘lanadi/i.test(rep.headers[j]) ? som(v) : v) : v}</Td>)}</tr>)}</tbody></table></div>{pg.pages > 1 && <Pager {...pg} setPer={null} />}</> : <Empty icon={FileText} title="Bu davrda ma’lumot yo‘q" text="Boshqa davr yoki hisobot turini tanlang." />
  const actions = <><Btn icon={Download} onClick={() => (rep.rows.length ? exportReport(rep, fmt, r) : toast('Ma’lumot yo‘q'))} className="w-full md:w-auto">Yuklab olish</Btn><Btn variant="outline" icon={Share2} onClick={share} className="w-full md:w-auto">Ulashish</Btn><Btn variant="outline" icon={RefreshCw} onClick={() => setRegen(true)} className="w-full md:w-auto">Qayta yaratish</Btn><Btn variant="gray" icon={X} onClick={() => navigate('/sotuvchi/analitika')} className="w-full md:w-auto">Yopish</Btn></>
  return (
    <div className="space-y-3 pb-24 md:space-y-4 md:pb-0">
      {mobile ? <div className="relative flex items-center justify-center py-1"><button type="button" aria-label="Orqaga" onClick={() => navigate('/sotuvchi/analitika')} className="absolute left-0 text-[#0F766E]"><ArrowLeft className="size-6" /></button><h1 className="text-[19px] font-extrabold">Hisobot tafsiloti</h1></div> : <Crumbs items={[['Analitika', '/sotuvchi/analitika'], ['Hisobot tafsiloti']]} />}
      <div className={`${card} p-4`}>
        <div className="flex items-start gap-3"><span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]"><FileText className="size-7" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h2 className="text-[17px] font-extrabold md:text-[22px]">{head}</h2><span className="shrink-0 rounded-full bg-[#F0FDFA] px-2.5 py-1 text-[12px] text-[#0F766E]">● Tayyor</span></div><p className="text-[12.5px] text-[#5C6E80]">{dmy(r.from)} – {dmy(r.to)} davridagi ma’lumotlar.</p></div>{!mobile && <div className="flex gap-2">{actions}</div>}</div>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#EEF3F4] pt-3 text-[12px]">{[[CalendarDays, 'Yaratilgan sana', `${dmy(made)}, ${hm(made)}`], [FileText, 'Format', fmt === 'pdf' ? 'PDF' : 'CSV'], [Rows3, 'Qatorlar soni', `${rep.rows.length} ta`]].map(([I, l, v]) => <div key={l} className="flex items-start gap-2"><I className="size-5 shrink-0 text-[#0F766E]" /><div><div className="text-[#5C6E80]">{l}</div><b className="text-[13px]">{v}</b></div></div>)}</div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">{stats.map(([I, l, v, s]) => <div key={l} className={`${card} flex items-center gap-2.5 p-3`}><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]"><I className="size-5" /></span><div className="min-w-0"><div className="truncate text-[12px] text-[#3D4E5F]">{l}</div><div className="truncate text-[15px] font-extrabold md:text-[18px]">{v}</div><div className="truncate text-[11px] text-[#5C6E80]">{s}</div></div></div>)}</div>
      <div className={`${card} overflow-hidden`}><div className="p-3 text-[14px] font-bold">Hisobot ma’lumotlari</div>{table}</div>
      {mobile && <div className="space-y-2">{actions}</div>}
      <ReportModal open={regen} onClose={() => setRegen(false)} range={r} />
    </div>
  )
}
