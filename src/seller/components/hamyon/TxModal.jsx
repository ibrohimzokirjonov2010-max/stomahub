import { useNavigate } from 'react-router-dom'
import { CalendarDays, Banknote, Phone, FileText, Download, Eye, X, Copy, ChevronRight, UserRound, Database, Percent, Wallet, Hash } from 'lucide-react'
import Modal from '../shell/Modal'
import ProductThumb from '../bosh-sahifa/ProductThumb'
import { Btn, Badge, Th, Td, toast } from '../ui'
import { som, num, dmy, hm } from '../../format'
import { netOf, commissionOf } from '../../api'
import { TYPES } from './lib'
import { useMobile } from '../../../useMobile'

const mask = (p) => (p ? `${p.slice(0, 4)} ** *** ** ${p.replace(/\D/g, '').slice(-2)}` : '—')
const sign = (v) => `${v > 0 ? '+ ' : '− '}${som(Math.abs(v))}`
export const txNo = (t) => `TRX-${String(t.at).slice(0, 10).replace(/-/g, '')}-${t.id.slice(2, 6).toUpperCase()}`

function receipt(t) {
  const o = t.order; const w = window.open('', '_blank'); if (!w) return
  w.document.write(`<html><head><title>Chek ${txNo(t)}</title><style>body{font-family:sans-serif;padding:32px;color:#10283F}h1{color:#0F766E}td{padding:4px 8px}</style></head><body><h1>Chek ${txNo(t)}</h1><p>${TYPES[t.type].label}<br>Sana: ${dmy(t.at)} ${hm(t.at)}<br>To‘lov usuli: Naqd</p>${o ? `<table>${o.items.map((i) => `<tr><td>${i.name}</td><td>${i.qty} dona</td><td>${num(i.price * i.qty)} so‘m</td></tr>`).join('')}</table><p>Buyurtma summasi: ${som(netOf(o))}<br>Komissiya (12%): ${som(commissionOf(o))}<br><b>Sof summa: ${som(netOf(o) - commissionOf(o))}</b></p>` : `<p><b>Summa: ${sign(t.amount)}</b></p>`}</body></html>`)
  w.document.close(); w.print()
}

export default function TxModal({ tx: t, onClose }) {
  const mobile = useMobile(); const navigate = useNavigate()
  if (!t) return null
  const T = TYPES[t.type]; const o = t.order
  const goOrder = () => navigate(`/sotuvchi/buyurtmalar/${o.id}`)
  const rows = [[Hash, 'Tranzaksiya raqami', <span className="flex items-center gap-1.5">{txNo(t)}<button type="button" aria-label="Nusxalash" onClick={() => { navigator.clipboard?.writeText(txNo(t)); toast('Nusxa olindi') }}><Copy className="size-4 text-[#5C6E80]" /></button></span>], [CalendarDays, 'Sana va vaqt', `${dmy(t.at)}, ${hm(t.at)}`], [T.icon, 'Tranzaksiya turi', T.mLabel], ...(o ? [[FileText, 'Buyurtma raqami', <button type="button" onClick={goOrder} className="flex items-center gap-1">#{o.code}<ChevronRight className="size-4" /></button>]] : []), [Banknote, 'To‘lov usuli', 'Naqd pul'], ...(o ? [[UserRound, 'Xaridor', mask(o.customer_phone)]] : [])]
  const footer = <div className={mobile ? 'space-y-2' : 'flex gap-3'}>{o && <Btn variant={mobile ? 'primary' : 'outline'} icon={Eye} onClick={goOrder} className={mobile ? 'w-full' : ''}>{mobile ? 'Buyurtmani ko‘rish' : 'Buyurtmani ko‘rish'}</Btn>}<Btn variant="outline" icon={Download} onClick={() => receipt(t)} className={mobile ? 'w-full' : ''}>Chek yuklab olish</Btn><Btn variant={mobile ? 'outline' : 'primary'} icon={mobile ? X : undefined} onClick={onClose} className={mobile ? 'w-full' : 'ml-auto px-8'}>Yopish</Btn></div>
  return (
    <Modal open onClose={onClose} full={mobile} title="Tranzaksiya tafsilotlari" subtitle={mobile ? (o ? 'Buyurtma bo‘yicha ma’lumotlar' : 'Operatsiya bo‘yicha ma’lumotlar') : 'Ushbu operatsiya bo‘yicha to‘liq ma’lumot.'} width="md:max-w-[680px]" footer={footer}>
      {mobile ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-[#E2ECEE] p-5 text-center"><span className="mx-auto grid size-20 place-items-center rounded-full bg-[#E3F4F2] text-[#0F766E]"><T.icon className="size-10" /></span><div className="mt-3 text-[26px] font-extrabold">{sign(t.amount)}</div><Badge tone={t.status[1]} dot className="mt-2 rounded-full px-6">{t.status[0]}</Badge><p className="mt-2 text-[12.5px] text-[#5C6E80]">{t.type === 'tushum' ? 'Sotuvdan tushgan daromad muvaffaqiyatli hisoblangan.' : t.desc}</p></div>
          <div className="rounded-2xl border border-[#E2ECEE] px-3">{rows.map(([I, l, v]) => <div key={l} className="flex items-center gap-3 border-b border-[#EEF3F4] py-2.5 text-[13px] last:border-0"><span className="grid size-8 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]"><I className="size-4" /></span><span className="flex-1 text-[#3D4E5F]">{l}</span><span className="font-medium">{v}</span></div>)}</div>
          {o && <div className="rounded-2xl border border-[#E2ECEE] p-3"><b className="text-[14px]">Buyurtmadagi mahsulot</b>{o.items.map((i) => <div key={i.id} className="mt-2 flex items-center gap-3"><ProductThumb src={i.image_url} className="h-12 w-14" /><div className="flex-1 text-[13px]"><div className="font-medium">{i.name}</div><div className="text-[#5C6E80]">Soni: {i.qty} ta</div></div><span className="text-[13px] font-medium">{som(i.price * i.qty)}</span></div>)}</div>}
          {o && <div className="rounded-2xl border border-[#E2ECEE] px-3">{[[Database, 'Sotuv summasi', som(netOf(o))], [Percent, 'Komissiya (12%)', `− ${som(commissionOf(o))}`], [Wallet, 'Sof daromad', som(netOf(o) - commissionOf(o))]].map(([I, l, v]) => <div key={l} className="flex items-center gap-3 border-b border-[#EEF3F4] py-2.5 text-[13px] last:border-0"><span className="grid size-8 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]"><I className="size-4" /></span><span className="flex-1 text-[#3D4E5F]">{l}</span><span className="font-medium">{v}</span></div>)}</div>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-xl bg-[#F0FDFA] p-4"><span className="grid size-16 place-items-center rounded-full bg-[#CCFBF1] text-[#0F766E]"><T.icon className="size-8" /></span><div className="flex-1"><div className="text-[13px] text-[#3D4E5F]">{T.label}</div><div className="text-[22px] font-extrabold">{o ? `#${o.code}` : sign(t.amount)}</div><div className="text-[12px] text-[#5C6E80]">{dmy(t.at)} {hm(t.at)}</div></div><Badge tone={t.status[1]} dot className="rounded-full">{t.status[0]}</Badge></div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">{[[T.icon, 'Turi', T.label], [CalendarDays, 'Sana va vaqt', `${dmy(t.at)} ${hm(t.at)}`], [Banknote, 'To‘lov usuli', 'Naqd'], [Hash, 'Tranzaksiya raqami', txNo(t)], ...(o ? [[Phone, 'Mijoz telefoni', mask(o.customer_phone)]] : [[FileText, 'Tavsif', t.desc]])].map(([I, l, v]) => <div key={l} className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]"><I className="size-4" /></span><div><div className="text-[12px] text-[#5C6E80]">{l}</div><div className="font-semibold">{v}</div></div></div>)}</div>
          {o && <div className="grid grid-cols-[2fr_1fr] gap-3"><div className="grid grid-cols-2 rounded-xl border border-[#E2ECEE] p-3 text-[12.5px]"><div><div className="text-[#5C6E80]">Buyurtma summasi</div><b className="text-[15px]">{som(netOf(o))}</b></div><div className="border-l border-[#EEF3F4] pl-3"><div className="text-[#5C6E80]">Komissiya (12%)</div><b className="text-[15px]">{som(commissionOf(o))}</b></div></div><div className="rounded-xl bg-[#F0FDFA] p-3 text-[12.5px]"><div className="text-[#0F766E]">Sof summa</div><b className="text-[15px] text-[#0F766E]">{som(netOf(o) - commissionOf(o))}</b></div></div>}
          {o && <div><b className="text-[14px]">Mahsulotlar ro‘yxati ({o.items.reduce((a, i) => a + Number(i.qty), 0)} dona)</b><table className="mt-2 w-full text-[12.5px]"><thead className="bg-[#F6FAFA]"><tr><Th>#</Th><Th>Mahsulot</Th><Th>Soni</Th><Th>Narx</Th><Th className="text-right">Jami</Th></tr></thead><tbody>{o.items.map((i, k) => <tr key={i.id} className="border-t border-[#EEF3F4]"><Td>{k + 1}</Td><Td><span className="flex items-center gap-2"><ProductThumb src={i.image_url} className="h-9 w-11" />{i.name}</span></Td><Td>{i.qty} dona</Td><Td>{som(i.price)}</Td><Td className="text-right">{som(i.price * i.qty)}</Td></tr>)}</tbody></table></div>}
        </div>
      )}
    </Modal>
  )
}
