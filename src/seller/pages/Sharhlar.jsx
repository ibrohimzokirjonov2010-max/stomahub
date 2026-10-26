import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MessageSquare, Flag, Check, Star, Filter, X, Store, FileText, EyeOff, Eye, User, Building2, Phone, CalendarDays, ChevronRight, CornerDownRight, Send } from 'lucide-react'
import { useSellerData, updateRow } from '../api'
import { dmy, hm, som } from '../format'
import { useMobile } from '../../useMobile'
import { card, PageHead, Btn, Select, Tabs, Chips, Badge, Checkbox, Pager, usePaged, Menu, Th, Td, toast, Textarea, Input } from '../components/ui'
import Empty from '../components/shell/Empty'
import Modal from '../components/shell/Modal'
import ProductThumb from '../components/bosh-sahifa/ProductThumb'
import { Stars } from '../components/bosh-sahifa/Desktop'
import { initials } from '../components/mijozlar/constants'
import { masked } from './Mijozlar'

const TEMPLATES = [
  ['Rahmat', 'Ijobiy fikr uchun minnatdorchilik', 'Fikringiz uchun katta rahmat! Doim sifatli mahsulotlar bilan xizmat qilishga harakat qilamiz.'],
  ['Muammoni hal qilamiz', 'Muammo bo‘yicha yordam taklif qilish', 'Noqulaylik uchun uzr so‘raymiz. Muammoni tezda hal qilamiz — siz bilan bog‘lanamiz.'],
  ['Bog‘lanamiz', 'Batafsil tushuntirish va bog‘lanish taklifi', 'Fikringiz uchun rahmat! Batafsil ma’lumot berish uchun siz bilan tez orada bog‘lanamiz.'],
]
const REASONS = ['Haqoratli so‘zlar', 'Spam yoki reklama', 'Mahsulotga aloqasi yo‘q', 'Yolg‘on ma’lumot', 'Boshqa']

function ReplyModal({ r, onClose }) {
  const [text, setText] = useState(r?.reply || '')
  const [pub, setPub] = useState(r?.reply_public ?? true)
  const [busy, setBusy] = useState(false)
  useEffect(() => { setText(r?.reply || ''); setPub(r?.reply_public ?? true) }, [r])
  if (!r) return null
  const save = async () => {
    if (!text.trim()) return toast('Javob matnini kiriting')
    setBusy(true)
    const res = await updateRow('seller_reviews', r.id, { reply: text.trim(), reply_public: pub, replied_at: new Date().toISOString() })
    setBusy(false)
    if (!res.ok) return toast(res.error)
    toast('Javob yuborildi'); onClose()
  }
  return (
    <Modal open onClose={onClose} title="Sharhga javob yozish" subtitle="Mijoz sharhiga javob bering. Javob barcha foydalanuvchilar uchun ko‘rinadi." width="md:max-w-[560px]"
      footer={<div className="grid grid-cols-2 gap-3"><Btn variant="outline" onClick={onClose}>Bekor qilish</Btn><Btn icon={Send} disabled={busy} onClick={save}>Javobni yuborish</Btn></div>}>
      <div className="rounded-xl bg-[#F0FDFA] p-3">
        <div className="text-[12.5px] font-semibold text-[#0F766E]">Mijoz sharhi</div>
        <div className="mt-2 flex gap-3"><ProductThumb src={r.p?.image_url} className="h-11 w-14 shrink-0" /><div className="min-w-0 flex-1 text-[13px]"><div className="flex justify-between gap-2"><b className="truncate">{r.p?.name || 'Mahsulot'}</b><span className="shrink-0 text-[12px] text-[#5C6E80]">{dmy(r.created_at)} {hm(r.created_at)}</span></div><div className="mt-1 flex items-center justify-between"><span className="text-[12.5px]">{r.who}</span><Stars value={r.rating} /></div></div></div>
        <p className="mt-2 whitespace-pre-line text-[13px] text-[#3D4E5F]">{r.body || '—'}</p>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[14px] font-bold"><Store className="size-4 text-[#0F766E]" />Tayyor javob shablonlari</div>
      <div className="mt-2 grid grid-cols-3 gap-2">{TEMPLATES.map(([t, s, body]) => <button key={t} type="button" onClick={() => setText(body)} className="rounded-xl border border-[#CCFBF1] bg-[#F0FDFA] p-2 text-center hover:border-[#0F766E]"><div className="text-[12.5px] font-bold text-[#0F766E]">{t}</div><div className="mt-0.5 text-[11px] text-[#5C6E80]">{s}</div></button>)}</div>
      <div className="mt-4 flex items-center gap-2 text-[14px] font-bold"><MessageSquare className="size-4 text-[#0F766E]" />Javobingiz</div>
      <Textarea className="mt-2" maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="Javobingizni kiriting..." />
      <div className="text-right text-[11.5px] text-[#5C6E80]">{text.length}/500</div>
      <label className="mt-1 flex items-start gap-2.5"><Checkbox checked={pub} onChange={setPub} /><span><span className="text-[13px] font-semibold text-[#0F766E]">Javob ochiq ko‘rinsin</span><span className="block text-[11.5px] text-[#5C6E80]">Javobingiz barcha foydalanuvchilar uchun ko‘rinadi.</span></span></label>
    </Modal>
  )
}

function ReportModal({ r, onClose }) {
  const [reason, setReason] = useState(REASONS[0])
  const [note, setNote] = useState('')
  if (!r) return null
  const save = async () => {
    const res = await updateRow('seller_reviews', r.id, { reported: true, report_reason: reason + (note.trim() ? `: ${note.trim()}` : '') })
    if (!res.ok) return toast(res.error)
    toast('Shikoyat yuborildi. Moderator ko‘rib chiqadi.'); onClose()
  }
  return (
    <Modal open onClose={onClose} title="Shikoyat qilish" subtitle="Sharh moderatorga yuboriladi." width="md:max-w-[460px]"
      footer={<div className="grid grid-cols-2 gap-3"><Btn variant="outline" onClick={onClose}>Bekor qilish</Btn><Btn icon={Flag} onClick={save}>Yuborish</Btn></div>}>
      <div className="space-y-2">{REASONS.map((x) => <label key={x} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[13.5px] ${reason === x ? 'border-[#0F766E] bg-[#F0FDFA]' : 'border-[#E6EEF0]'}`}><input type="radio" className="accent-[#0F766E]" checked={reason === x} onChange={() => setReason(x)} />{x}</label>)}</div>
      <Textarea className="mt-3" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Qo‘shimcha izoh (ixtiyoriy)" />
    </Modal>
  )
}

const status = (r) => r.hidden ? ['Yashirilgan', 'off'] : r.reply ? ['Javob berilgan', 'on'] : ['Javobsiz', 'mid']

export default function Sharhlar() {
  const data = useSellerData()
  const mobile = useMobile()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const [tab, setTab] = useState('all')
  const [prod, setProd] = useState('')
  const [rating, setRating] = useState(0)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [reply, setReply] = useState(null)
  const [report, setReport] = useState(null)
  const [detailId, setDetailId] = useState(sp.get('id'))
  const [filters, setFilters] = useState(false)

  const rows = useMemo(() => data.reviews.map((r) => {
    const p = data.products.find((x) => x.id === r.product_id)
    const o = data.orders.find((x) => x.id === r.order_id)
    const c = o && data.customers.find((x) => x.id === o.customer_id)
    return { ...r, p, o, c, who: c?.name || r.author_name || o?.customer_name || 'Xaridor', city: c?.city || '', phone: c?.phone || o?.customer_phone || '' }
  }).sort((a, b) => b.created_at.localeCompare(a.created_at)), [data.reviews, data.products, data.orders, data.customers])
  const cnt = (f) => rows.filter(f).length
  const tabs = [['all', 'Barchasi', rows.length], ['javobsiz', 'Javobsiz', cnt((r) => !r.reply && !r.hidden)], ['javob', 'Javob berilgan', cnt((r) => r.reply && !r.hidden)], ['hidden', 'Yashirilgan', cnt((r) => r.hidden)]]
  const list = rows.filter((r) => {
    if (tab === 'javobsiz' && (r.reply || r.hidden)) return false
    if (tab === 'javob' && (!r.reply || r.hidden)) return false
    if (tab === 'hidden' && !r.hidden) return false
    if (prod && r.product_id !== prod) return false
    if (rating && r.rating !== rating) return false
    if (from && r.created_at.slice(0, 10) < from) return false
    if (to && r.created_at.slice(0, 10) > to) return false
    return true
  })
  const pg = usePaged(list, mobile ? 20 : 10)
  useEffect(() => { pg.setPage(1) }, [tab, prod, rating, from, to]) // eslint-disable-line react-hooks/exhaustive-deps
  const detail = rows.find((r) => r.id === detailId)
  const openDetail = (r) => { setDetailId(r?.id || null); if (r) sp.set('id', r.id); else sp.delete('id'); setSp(sp, { replace: true }) }
  const toggleHide = async (r) => { const res = await updateRow('seller_reviews', r.id, { hidden: !r.hidden }); toast(res.ok ? (r.hidden ? 'Sharh ko‘rsatildi' : 'Sharh yashirildi') : res.error) }
  const filtered = prod || rating || from || to
  const items = (r) => [['Batafsil', () => openDetail(r), Eye], ['Javob yozish', () => setReply(r), MessageSquare], [r.hidden ? 'Ko‘rsatish' : 'Yashirish', () => toggleHide(r), EyeOff], ['Shikoyat qilish', () => setReport(r), Flag], r.o && ['Buyurtmaga o‘tish', () => navigate(`/sotuvchi/buyurtmalar/${r.o.id}`), FileText]]
  const prodOpts = [['', 'Barcha mahsulotlar'], ...data.products.map((p) => [p.id, p.name])]
  const empty = <Empty icon={Star} title={rows.length ? 'Mos sharh topilmadi' : 'Hali sharhlar yo‘q'} text={rows.length ? 'Filtrlarni o‘zgartirib ko‘ring.' : 'Mijozlar buyurtmani olgach qoldirgan sharhlar shu yerda ko‘rinadi.'} />

  const Detail = ({ r }) => (
    <div className="space-y-3">
      {!mobile && <div className="flex items-center gap-3 rounded-xl border border-[#E6EEF0] p-2.5"><ProductThumb src={r.p?.image_url} className="h-11 w-16 shrink-0" /><div className="min-w-0 flex-1"><div className="truncate text-[13.5px] font-bold">{r.p?.name || 'Mahsulot o‘chirilgan'}</div><div className="text-[12px] text-[#5C6E80]">{r.p?.unit || ''}</div></div>{r.p && <Btn size="sm" variant="outline" onClick={() => navigate(`/sotuvchi/mahsulotlar/${r.p.id}`)}>Mahsulotga o‘tish</Btn>}</div>}
      <div className="rounded-xl border border-[#E6EEF0] p-3">
        <div className="flex gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-[15px] font-bold text-[#0F766E]">{initials(r.who)}</span><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><b className="truncate text-[14px]">{r.who}</b><span className="shrink-0 text-[12px] text-[#5C6E80]">{dmy(r.created_at)} {hm(r.created_at)}</span></div><div className="text-[12px] text-[#5C6E80]">{r.city}{r.o ? ` · ${r.o.code}` : ''}</div><Stars value={r.rating} size="size-[17px]" /></div></div>
        <p className="mt-2 whitespace-pre-line text-[13.5px] text-[#3D4E5F]">{r.body || '—'}</p>
        {mobile && r.p && <button type="button" onClick={() => navigate(`/sotuvchi/mahsulotlar/${r.p.id}`)} className="mt-3 flex w-full items-center gap-3 rounded-xl border border-[#E6EEF0] p-2 text-left"><ProductThumb src={r.p.image_url} className="h-12 w-16" /><div className="min-w-0 flex-1 text-[13px]"><b className="block truncate">{r.p.name}</b>{som(r.p.price)}</div><ChevronRight className="size-4" /></button>}
      </div>
      {r.reply && <div className="rounded-xl border border-[#E6EEF0] p-3"><div className="flex justify-between text-[13px] font-bold"><span className="flex items-center gap-2"><Store className="size-4 text-[#0F766E]" />Sizning javobingiz</span><span className="text-[12px] font-normal text-[#5C6E80]">{r.replied_at ? `${dmy(r.replied_at)} ${hm(r.replied_at)}` : ''}</span></div><p className="mt-2 rounded-lg bg-[#F0FDFA] p-2.5 text-[13px] text-[#3D4E5F]">{r.reply}</p>{!r.reply_public && <div className="mt-1 text-[11.5px] text-[#5C6E80]">Faqat mijozga ko‘rinadi</div>}</div>}
      <div className="rounded-xl border border-[#E6EEF0] p-3 text-[13px]">
        <div className="mb-1 font-bold">Sharh ma’lumotlari</div>
        {[[MessageSquare, 'Holati', <Badge key="b" tone={status(r)[1]}>{status(r)[0]}</Badge>], [User, 'Mijoz', r.who], [Building2, 'Shahar', r.city || '—'], [Phone, 'Telefon', masked(r.phone)], [CalendarDays, 'Sana', `${dmy(r.created_at)} ${hm(r.created_at)}`], r.reported && [Flag, 'Shikoyat', r.report_reason || 'Yuborilgan']].filter(Boolean).map(([I, l, v]) => <div key={l} className="flex items-center justify-between gap-2 border-b border-[#EEF3F4] py-2 last:border-0"><span className="flex items-center gap-2 text-[#5C6E80]"><I className="size-4 text-[#0F766E]" />{l}</span><span className="text-right">{v}</span></div>)}
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <Btn icon={MessageSquare} onClick={() => setReply(r)} className="md:order-2">{r.reply ? 'Javobni tahrirlash' : 'Javob yozish'}</Btn>
        {r.o && <Btn variant="outline" icon={FileText} onClick={() => navigate(`/sotuvchi/buyurtmalar/${r.o.id}`)}>Buyurtmaga o‘tish</Btn>}
        <Btn variant="outline" icon={r.hidden ? Eye : EyeOff} onClick={() => toggleHide(r)} className="md:order-3">{r.hidden ? 'Ko‘rsatish' : 'Yashirish'}</Btn>
        <Btn variant="outline" icon={Flag} disabled={r.reported} onClick={() => setReport(r)} className="md:order-4">{r.reported ? 'Shikoyat yuborilgan' : 'Shikoyat qilish'}</Btn>
      </div>
    </div>
  )

  const modals = <><ReplyModal r={reply && rows.find((x) => x.id === reply.id)} onClose={() => setReply(null)} /><ReportModal r={report} onClose={() => setReport(null)} /></>

  if (mobile) return (
    <div className="space-y-3 pb-24">
      <PageHead title="Sharhlar" subtitle="Mijozlarning fikr-mulohazalarini ko‘ring va javob bering." />
      <div className="flex items-center gap-2"><div className="min-w-0 flex-1 overflow-x-auto"><Chips tabs={tabs} value={tab} onChange={setTab} /></div><button type="button" aria-label="Filtrlar" onClick={() => setFilters(true)} className={`grid size-10 shrink-0 place-items-center rounded-xl border ${filtered ? 'border-[#0F766E] bg-[#F0FDFA]' : 'border-[#DCE5E7]'} text-[#0F766E]`}><Filter className="size-5" /></button></div>
      {pg.rows.length ? pg.rows.map((r) => (
        <div key={r.id} className={`${card} p-3 ${r.hidden ? 'opacity-60' : ''}`}>
          <div className="flex gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-[15px] font-bold text-[#0F766E]">{initials(r.who)}</span>
            <button type="button" onClick={() => openDetail(r)} className="min-w-0 flex-1 text-left"><div className="truncate text-[15px] font-bold">{r.who}</div><div className="text-[12.5px] text-[#0F766E]">{r.city || r.o?.code || ''}</div><div className="flex items-center justify-between"><Stars value={r.rating} size="size-[16px]" /><span className="text-[12px] text-[#5C6E80]">{dmy(r.created_at)}</span></div><p className="mt-1 line-clamp-3 text-[13.5px] text-[#3D4E5F]">{r.body}</p></button>
            <Menu items={items(r)} /></div>
          {r.reply && <div className="ml-14 mt-2 rounded-lg bg-[#F0FDFA] p-2 text-[12.5px] text-[#3D4E5F]"><CornerDownRight className="mr-1 inline size-3.5 text-[#0F766E]" />{r.reply}</div>}
          <div className="mt-2 flex items-center gap-3 border-t border-[#EEF3F4] pt-2"><ProductThumb src={r.p?.image_url} className="h-11 w-16 shrink-0" /><div className="min-w-0 flex-1 text-[13px]"><div className="truncate">{r.p?.name || '—'}</div><div className="text-[#5C6E80]">{r.p ? som(r.p.price) : ''}</div></div>{r.reply ? <span className="flex items-center gap-1 text-[12.5px] text-[#0F766E]"><Check className="size-4" />Javob berilgan</span> : <Btn size="sm" variant="outline" icon={MessageSquare} onClick={() => setReply(r)}>Javob yozish</Btn>}</div>
        </div>)) : <div className={card}>{empty}</div>}
      {pg.pages > 1 && <Pager {...pg} setPer={null} />}
      <Modal open={filters} onClose={() => setFilters(false)} title="Filtrlar" footer={<div className="grid grid-cols-2 gap-3"><Btn variant="outline" onClick={() => { setProd(''); setRating(0); setFrom(''); setTo('') }}>Tozalash</Btn><Btn onClick={() => setFilters(false)}>Qo‘llash</Btn></div>}>
        <div className="space-y-3 text-[13px]"><div>Mahsulot<Select value={prod} onChange={setProd} options={prodOpts} /></div><div>Baho<div className="mt-1 flex gap-2">{[5, 4, 3, 2, 1].map((n) => <button key={n} type="button" onClick={() => setRating(rating === n ? 0 : n)} className={`flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border ${rating === n ? 'border-[#0F766E] bg-[#F0FDFA]' : 'border-[#DCE5E7]'}`}>{n}<Star className="size-4 text-[#0F766E]" /></button>)}</div></div><div className="grid grid-cols-2 gap-2"><label>Dan<Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label><label>Gacha<Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label></div></div>
      </Modal>
      <Modal full open={!!detail} onClose={() => openDetail(null)} title="Sharh tafsiloti">{detail && <Detail r={detail} />}</Modal>
      {modals}
    </div>
  )

  return (
    <div className="space-y-4">
      <PageHead title="Sharhlar" subtitle="Mijozlar tomonidan qoldirilgan fikrlar va baholar." />
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      <div className={`${card} flex flex-wrap items-end gap-3 p-3`}>
        <label className="w-[240px] text-[12.5px] text-[#3D4E5F]">Mahsulot<Select value={prod} onChange={setProd} options={prodOpts} /></label>
        <div className="text-[12.5px] text-[#3D4E5F]">Baho<div className="mt-1 flex gap-1.5">{[5, 4, 3, 2, 1].map((n) => <button key={n} type="button" title={`${n} yulduz`} onClick={() => setRating(rating === n ? 0 : n)} className={`flex h-[42px] w-[50px] items-center justify-center gap-0.5 rounded-[10px] border text-[13px] ${rating === n ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]' : 'border-[#DCE5E7]'}`}>{n}<Star className="size-4 text-[#0F766E]" /></button>)}</div></div>
        <div className="text-[12.5px] text-[#3D4E5F]">Sana oralig‘i<div className="mt-1 flex items-center gap-1.5"><Input type="date" className="w-[150px]" value={from} onChange={(e) => setFrom(e.target.value)} />–<Input type="date" className="w-[150px]" value={to} onChange={(e) => setTo(e.target.value)} /></div></div>
        {filtered && <Btn variant="outline" icon={X} onClick={() => { setProd(''); setRating(0); setFrom(''); setTo('') }} className="ml-auto">Tozalash</Btn>}
      </div>
      <div className={`${card} overflow-hidden`}>
        {pg.rows.length ? <><table className="w-full table-fixed">
          <colgroup><col className="w-[170px]" /><col className="w-[130px]" /><col className="w-[92px]" /><col /><col className="w-[92px]" /><col className="w-[300px]" /></colgroup>
          <thead className="bg-[#F6FAFA]"><tr><Th>Mahsulot</Th><Th>Xaridor</Th><Th>Baho</Th><Th>Sharh</Th><Th>Sana</Th><Th /></tr></thead>
          <tbody>{pg.rows.map((r) => (
            <tr key={r.id} className={`cursor-pointer border-t border-[#EEF3F4] align-top hover:bg-[#F8FCFC] ${detailId === r.id ? 'bg-[#F0FDFA]' : ''} ${r.hidden ? 'opacity-60' : ''}`} onClick={() => openDetail(r)}>
              <Td><div className="flex items-center gap-2"><ProductThumb src={r.p?.image_url} className="h-9 w-12 shrink-0" /><div className="min-w-0"><div className="truncate text-[12.5px] font-semibold">{r.p?.name || '—'}</div><div className="text-[11.5px] text-[#5C6E80]">{r.p?.unit || ''}</div></div></div></Td>
              <Td><div className="truncate text-[12.5px] font-semibold">{r.who}</div><div className="text-[11.5px] text-[#5C6E80]">{r.city}</div></Td>
              <Td><Stars value={r.rating} size="size-[14px]" /></Td>
              <Td><p className="line-clamp-2 text-[12.5px] text-[#3D4E5F]">{r.body || '—'}</p>{r.reply && <div className="mt-1.5 rounded-lg bg-[#F0FDFA] p-2 text-[11.5px]"><div className="flex items-center gap-1 font-semibold text-[#0F766E]"><CornerDownRight className="size-3.5" />Sizning javobingiz</div><p className="line-clamp-2 text-[#3D4E5F]">{r.reply}</p></div>}</Td>
              <Td className="text-[12px] text-[#5C6E80]">{dmy(r.created_at)}<br />{hm(r.created_at)}</Td>
              <Td><div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                {r.reply ? <span className="flex h-8 items-center gap-1 rounded-lg bg-[#F0FDFA] px-2.5 text-[12px] text-[#0F766E]"><Check className="size-4" />Javob berilgan</span> : <Btn size="sm" variant={r === pg.rows.find((x) => !x.reply) ? 'primary' : 'outline'} icon={MessageSquare} onClick={() => setReply(r)}>Javob yozish</Btn>}
                <Btn size="sm" variant="outline" icon={Flag} disabled={r.reported} onClick={() => setReport(r)}>{r.reported ? 'Yuborilgan' : 'Shikoyat'}</Btn>
                <Menu items={items(r)} /></div></Td>
            </tr>))}</tbody></table>
          <div className="border-t border-[#EEF3F4] p-3"><Pager {...pg} /></div></> : empty}
      </div>
      {detail && <div className="fixed inset-0 z-40 bg-[#0B2A2E]/35" onMouseDown={(e) => e.target === e.currentTarget && openDetail(null)}>
        <aside className="absolute inset-y-0 right-0 flex w-[420px] flex-col bg-white shadow-[-16px_0_40px_rgb(8_40_45/0.18)]">
          <div className="flex items-start justify-between p-5 pb-3"><div><h2 className="text-[22px] font-extrabold">Sharh tafsiloti</h2><p className="text-[13.5px] text-[#5C6E80]">Sharh va javoblarni batafsil ko‘rish.</p></div><button type="button" aria-label="Yopish" onClick={() => openDetail(null)} className="rounded-lg p-1 hover:bg-[#F0FDFA]"><X className="size-6" /></button></div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5"><Detail r={detail} /></div>
        </aside></div>}
      {modals}
    </div>
  )
}
