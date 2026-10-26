import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Wallet, Clock, Database, HandCoins, Info, CalendarDays, X, Download, ChevronRight, ArrowLeft, Percent, Banknote, Coins, MoreHorizontal } from 'lucide-react'
import { useSellerData, computeStats, csvDownload } from '../api'
import { som, dmy, hm } from '../format'
import { useMobile } from '../../useMobile'
import { card, Btn, Select, Badge, Dot, Pager, usePaged, Th, Td } from '../components/ui'
import Empty from '../components/shell/Empty'
import { transactions, TYPES } from '../components/hamyon/lib'
import PayoutModal from '../components/hamyon/PayoutModal'
import TxModal from '../components/hamyon/TxModal'
import { MonthSelect } from './Analitika'
import { ymOf, monthRange } from '../components/analitika/lib'

const sign = (v) => `${v > 0 ? '+ ' : '− '}${som(Math.abs(v))}`
const day = (s) => { const d = new Date(s); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

export default function Hamyon() {
  const data = useSellerData()
  const mobile = useMobile()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const [pay, setPay] = useState(false)
  const [type, setType] = useState('')
  const r0 = monthRange(ymOf())
  const [from, setFrom] = useState(r0.from)
  const [to, setTo] = useState(r0.to)
  const [ym, setYm] = useState(ymOf())
  useEffect(() => { if (sp.get('new')) { setPay(true); sp.delete('new'); setSp(sp, { replace: true }) } }, [sp, setSp])
  const st = computeStats(data)
  const all = useMemo(() => transactions(data), [data])
  const list = useMemo(() => {
    const r = mobile ? monthRange(ym) : { from, to }
    return all.filter((t) => (!type || t.type === type) && (!r.from || day(t.at) >= r.from) && (!r.to || day(t.at) <= r.to))
  }, [all, type, from, to, ym, mobile])
  const pg = usePaged(list, mobile ? 20 : 10)
  const txId = sp.get('tx'); const tx = txId && all.find((t) => t.id === txId)
  const openTx = (t) => { sp.set('tx', t.id); setSp(sp) }
  const closeTx = () => { sp.delete('tx'); setSp(sp) }
  const commission = all.filter((t) => t.type === 'komissiya').reduce((a, t) => a - t.amount, 0)
  const exportCsv = () => csvDownload(`hamyon_${from || ''}_${to || ''}.csv`, [['Sana', 'Turi', 'Buyurtma', 'Tavsif', 'Summa', 'Holat'], ...list.map((t) => [`${dmy(t.at)} ${hm(t.at)}`, TYPES[t.type].label, t.code, t.desc, t.amount, t.status[0]])])
  if (data.loading) return null
  const empty = <Empty icon={Wallet} title="Hali operatsiyalar yo‘q" text="Buyurtmalar yetkazilgach, tushum va komissiya shu yerda ko‘rinadi." />
  const modals = <><PayoutModal open={pay} onClose={() => setPay(false)} balance={st.balance} /><TxModal tx={tx} onClose={closeTx} /></>

  if (mobile) return (
    <div className="space-y-3 pb-24">
      <div className="relative py-1 text-center"><button type="button" aria-label="Orqaga" onClick={() => navigate('/sotuvchi')} className="absolute left-0 top-2 text-[#0F766E]"><ArrowLeft className="size-6" /></button><h1 className="text-[19px] font-extrabold">Hamyon va to‘lovlar</h1><p className="text-[12.5px] text-[#5C6E80]">Sizning daromadlaringiz va to‘lovlar tarixi.</p></div>
      <div className={`${card} flex items-center gap-3 p-3`}><span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#E3F4F2] text-[#0F766E]"><Wallet className="size-7" /></span><div className="min-w-0 flex-1"><div className="text-[12px] text-[#3D4E5F]">Joriy balans</div><div className="text-[19px] font-extrabold">{som(st.balance)}</div><div className="text-[11px] leading-tight text-[#5C6E80]">Sotuvlardan olingan daromad (komissiya 12% hisobga olingan)</div></div><Btn size="sm" icon={Banknote} onClick={() => setPay(true)} disabled={!st.balance}>Pul yechish</Btn></div>
      <div className="grid grid-cols-3 gap-2">{[[Clock, 'Kutilayotgan', st.pending, 'Yetkazilmagan buyurtmalar'], [Database, 'Yechilgan', st.withdrawnPayouts, 'Jami yechilgan mablag‘'], [Percent, 'Komissiya (12%)', commission, 'Platforma komissiyasi']].map(([I, l, v, s]) => <div key={l} className={`${card} p-2.5`}><span className="grid size-8 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]"><I className="size-4" /></span><div className="mt-1.5 text-[11.5px] text-[#3D4E5F]">{l}</div><div className="text-[13px] font-extrabold">{som(v)}</div><div className="text-[10.5px] leading-tight text-[#5C6E80]">{s}</div></div>)}</div>
      <div className="flex items-center gap-3 rounded-2xl bg-[#E3F4F2] p-3"><span className="grid size-12 place-items-center rounded-full bg-[#CCFBF1] text-[#0F766E]"><Coins className="size-6" /></span><div><div className="text-[12px] text-[#3D4E5F]">To‘lov usuli</div><div className="text-[16px] font-extrabold">Naqd pul</div><div className="text-[11.5px] text-[#3D4E5F]">Barcha to‘lovlar faqat naqd pul orqali amalga oshiriladi.</div></div></div>
      <div className="flex items-center justify-between"><b className="text-[16px]">Operatsiyalar tarixi</b><MonthSelect value={ym} onChange={setYm} className="w-[165px]" /></div>
      <Select value={type} onChange={setType} options={[['', 'Barcha turlar'], ...Object.entries(TYPES).map(([k, v]) => [k, v.label])]} />
      <div className={card}>{pg.rows.length ? pg.rows.map((t) => { const T = TYPES[t.type]; return <button key={t.id} type="button" onClick={() => openTx(t)} className="flex w-full items-center gap-2.5 border-b border-[#EEF3F4] px-3 py-2.5 text-left last:border-0"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]"><T.icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium">{T.mLabel}</span><span className="whitespace-nowrap text-[11.5px] text-[#5C6E80]">{dmy(t.at)}, {hm(t.at)}</span></span><span className="flex flex-col items-end gap-1"><span className="whitespace-nowrap text-[13px] font-semibold">{sign(t.amount)}</span><Badge tone={t.status[1]} className="rounded-full px-2 py-0.5 text-[10.5px]">{t.status[0]}</Badge></span><ChevronRight className="size-4 shrink-0" /></button> }) : empty}</div>
      {pg.pages > 1 && <Pager {...pg} setPer={null} />}
      {modals}
    </div>
  )
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between"><div><h1 className="text-[28px] font-extrabold tracking-tight">Hamyon va to‘lovlar</h1><p className="text-[14px] text-[#5C6E80]">Balansingiz, to‘lovlar va tranzaksiyalar tarixi.</p></div><Btn icon={Plus} onClick={() => setPay(true)} className="px-8">Pul yechish so‘rovi</Btn></div>
      <div className="grid grid-cols-3 gap-4">{[[Wallet, 'Mavjud balans', st.balance, 'Pul yechish uchun mavjud'], [Clock, 'Kutilayotgan summa', st.pending, 'Yetkazilmagan buyurtmalar'], [Database, 'Jami yechilgan', st.withdrawnPayouts, 'Barcha davrlar uchun']].map(([I, l, v, s]) => <div key={l} className={`${card} flex items-center gap-4 p-4`}><span className="grid size-14 place-items-center rounded-full bg-[#E3F4F2] text-[#0F766E]"><I className="size-7" /></span><div><div className="text-[13px] text-[#3D4E5F]">{l}</div><div className="text-[22px] font-extrabold">{som(v)}</div><div className="text-[12px] text-[#5C6E80]">{s}</div></div></div>)}</div>
      <div className={`${card} flex items-center gap-4 p-4`}><span className="grid size-14 place-items-center rounded-full bg-[#E3F4F2] text-[#0F766E]"><HandCoins className="size-7" /></span><div className="flex-1"><div className="text-[16px] font-bold">Xaridorlar naqd to‘laydi; komissiya 12% hisobdan ushlanadi.</div><div className="max-w-[520px] text-[12.5px] text-[#3D4E5F]">Buyurtma yakunlangandan so‘ng, platforma komissiyasi (12%) avtomatik hisoblanadi va qolgan summa balansingizga tushadi.</div></div><div className="w-[300px] rounded-xl bg-[#F0FDFA] p-3"><div className="flex items-center gap-2 text-[13px] font-bold"><Info className="size-4 text-[#0F766E]" />Muhim ma’lumot</div><div className="mt-1 text-[12px] text-[#3D4E5F]">Pul yechish so‘rovlari ko‘rib chiqilgandan so‘ng, mablag‘ sizga naqd shaklda topshiriladi.</div></div></div>
      <div className={`${card} p-4`}>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-[20px] font-extrabold">Tranzaksiyalar tarixi</h2><p className="text-[12.5px] text-[#5C6E80]">Barcha tushumlar, komissiyalar, to‘lovlar va boshqa operatsiyalar.</p></div>
          <div className="flex items-center gap-2"><Select value={type} onChange={setType} options={[['', 'Barcha turlar'], ...Object.entries(TYPES).map(([k, v]) => [k, v.label])]} className="w-[170px]" />
            <div className="flex h-10 items-center gap-1.5 rounded-lg border border-[#D5DEE0] px-2.5 text-[13px]"><CalendarDays className="size-4 text-[#0F766E]" /><input type="date" aria-label="Boshlanish sanasi" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[118px] bg-transparent outline-none" />–<input type="date" aria-label="Tugash sanasi" value={to} onChange={(e) => setTo(e.target.value)} className="w-[118px] bg-transparent outline-none" /><button type="button" aria-label="Tozalash" onClick={() => { setFrom(''); setTo('') }}><X className="size-4 text-[#5C6E80]" /></button></div>
            <Btn variant="outline" icon={Download} onClick={exportCsv} disabled={!list.length}>Eksport qilish</Btn></div></div>
        {pg.rows.length ? <><table className="w-full text-[13px]"><thead className="bg-[#F6FAFA]"><tr><Th>#</Th><Th>Sana</Th><Th>Turi</Th><Th>Buyurtma raqami</Th><Th>Tavsif</Th><Th>Summa</Th><Th>Holat</Th><Th /></tr></thead>
          <tbody>{pg.rows.map((t, i) => { const T = TYPES[t.type]; return <tr key={t.id} onClick={() => openTx(t)} className="cursor-pointer border-t border-[#EEF3F4] hover:bg-[#F8FCFC]"><Td>{pg.offset + i + 1}</Td><Td className="whitespace-nowrap">{dmy(t.at)} {hm(t.at)}</Td><Td><span className="flex items-center gap-2 whitespace-nowrap"><span className="grid size-7 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]"><T.icon className="size-3.5" /></span>{T.label}</span></Td><Td>{t.code ? `#${t.code}` : '—'}</Td><Td className="max-w-[260px] truncate text-[#0F766E]">{t.desc}</Td><Td className={`whitespace-nowrap font-bold ${t.amount > 0 ? 'text-[#0F766E]' : ''}`}>{sign(t.amount)}</Td><Td><Dot on={t.status[1] === 'on'}>{t.status[0]}</Dot></Td><Td><MoreHorizontal className="size-4" /></Td></tr> })}</tbody></table><Pager {...pg} /></> : empty}
      </div>
      {modals}
    </div>
  )
}
