import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, FileText, Package, UserRound, Percent, Download, Eye, CalendarDays, Check, FileSpreadsheet, FileType } from 'lucide-react'
import { useSellerData } from '../../api'
import { useMobile } from '../../../useMobile'
import Modal from '../shell/Modal'
import { Btn, Checkbox, Input, toast } from '../ui'
import { RTYPES, COLS, DEFAULT_COLS } from './lib'
import { buildReport, exportReport } from './report'

const ICON = { sotuvlar: ShoppingCart, buyurtmalar: FileText, mahsulotlar: Package, mijozlar: UserRound, komissiya: Percent }
const H = ({ n, children, right }) => <div className="mb-2 mt-4 flex items-center justify-between first:mt-0"><h3 className="text-[14px] font-bold">{n}. {children}</h3>{right}</div>

export default function ReportModal({ open, onClose, range }) {
  const data = useSellerData()
  const mobile = useMobile()
  const navigate = useNavigate()
  const [type, setType] = useState('sotuvlar')
  const [from, setFrom] = useState(range.from)
  const [to, setTo] = useState(range.to)
  const [cols, setCols] = useState(DEFAULT_COLS)
  const [fmt, setFmt] = useState('csv')
  const colTypes = type === 'sotuvlar' || type === 'buyurtmalar'
  const all = cols.length === COLS.length
  const r = { from, to }
  const valid = from && to && from <= to && (!colTypes || cols.length)
  const go = (preview) => {
    if (!valid) return toast(from > to ? 'Boshlanish sanasi tugash sanasidan keyin bo‘lmasin' : 'Kamida bitta ustun tanlang')
    if (preview) { onClose(); return navigate(`/sotuvchi/analitika/hisobot?t=${type}&from=${from}&to=${to}&c=${cols.join(',')}&f=${fmt}`) }
    const rep = buildReport(type, r, cols, data)
    if (!rep.rows.length) return toast('Tanlangan davrda ma’lumot yo‘q')
    exportReport(rep, fmt, r); toast('Hisobot tayyorlandi'); onClose()
  }
  return (
    <Modal open={open} onClose={onClose} full title="Hisobot yaratish / eksport" subtitle="Kerakli ma’lumotlarni tanlab, hisobotni yuklab oling." width="md:max-w-[640px]"
      footer={<div className="grid grid-cols-2 gap-2 md:flex md:gap-3"><Btn variant="outline" onClick={onClose} className="md:w-[140px]">Bekor qilish</Btn><Btn variant="soft" icon={Eye} onClick={() => go(true)} className="md:flex-none">Ko‘rish</Btn><Btn icon={Download} onClick={() => go(false)} className="col-span-2 md:ml-auto">Yuklab olish</Btn></div>}>
      <H n={1}>Hisobot turi</H>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">{RTYPES.map(([k, l, t]) => { const I = ICON[k]; const on = type === k; return (
        <button key={k} type="button" onClick={() => setType(k)} className={`relative rounded-xl border p-2.5 text-left ${on ? 'border-[#0F766E] bg-[#F0FDFA]' : 'border-[#DCE5E7]'}`}>{on && <Check className="absolute right-2 top-2 size-4 rounded-full bg-[#0F766E] p-0.5 text-white" />}<div className="flex items-center gap-2 text-[13px] font-semibold"><I className="size-5 text-[#0F766E]" />{l}</div><div className="mt-1 text-[11.5px] leading-snug text-[#5C6E80]">{t}</div></button>) })}</div>
      <H n={2}>Davrni tanlang</H>
      <div className="grid grid-cols-2 gap-3 text-[12.5px]"><label>Boshlanish sanasi<Input type="date" icon={CalendarDays} value={from} onChange={(e) => setFrom(e.target.value)} /></label><label>Tugash sanasi<Input type="date" icon={CalendarDays} value={to} onChange={(e) => setTo(e.target.value)} /></label></div>
      {colTypes && <><H n={3} right={<label className="flex items-center gap-2 text-[12.5px]"><Checkbox checked={all} onChange={() => setCols(all ? [] : COLS.map((c) => c[0]))} />Barchasini tanlash</label>}>Ustunlarni tanlang</H>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-3">{COLS.map(([k, l]) => <label key={k} className="flex items-center gap-2 text-[12.5px]"><Checkbox checked={cols.includes(k)} onChange={() => setCols((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]))} />{l}</label>)}</div></>}
      <H n={colTypes ? 4 : 3}>Formatni tanlang</H>
      <div className="grid grid-cols-2 gap-2">{[['csv', 'CSV (Excel’da ochiladi)', FileSpreadsheet], ['pdf', 'PDF (chop etish)', FileType]].map(([k, l, I]) => <button key={k} type="button" onClick={() => setFmt(k)} className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-[13px] font-semibold ${fmt === k ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]' : 'border-[#DCE5E7]'}`}><I className="size-5" />{l}</button>)}</div>
      {mobile && <p className="mt-3 text-[11.5px] text-[#5C6E80]">“Ko‘rish” hisobotning dastlabki qatorlarini ochadi.</p>}
    </Modal>
  )
}
