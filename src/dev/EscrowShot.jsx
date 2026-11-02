// Dev-only screenshot harness: /escrow-shot/buyer | /escrow-shot/seller (mock data, no DB writes)
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import EscrowActions, { PayStatusPill } from '../components/EscrowActions'
import { __shotSellerState } from '../seller/api'
import Hamyon from '../seller/pages/Hamyon'

const som = (n) => `${Math.round(n).toLocaleString('ru-RU').replace(/\u00a0|,/g, ' ')} so‘m`
const BUYER = [
  { id: 'STQ-00130', dbId: 'b1', live: true, method: 'payme', paymentStatus: 'held', paymentLabel: 'Escrowda', dbStatus: 'yetkazildi', statusLabel: 'Yetkazildi', total: 2450000, date: '01.11.2026', items: 'Implant set Pro × 2', autoReleaseAt: '2026-11-04T15:00:00' },
  { id: 'STQ-00131', dbId: 'b2', live: true, method: 'click', paymentStatus: 'held', paymentLabel: 'Escrowda', dbStatus: 'yetkazildi', statusLabel: 'Yetkazildi', total: 1750000, date: '31.10.2026', items: 'Kompozit plomba to‘plami', dispute: 'open' },
  { id: 'STQ-00125', dbId: 'b3', live: true, method: 'click', paymentStatus: 'released', paymentLabel: 'Sotuvchiga o‘tkazildi', dbStatus: 'yetkazildi', statusLabel: 'Yetkazildi', total: 3200000, date: '27.10.2026', items: 'Endodontik motor' },
  { id: 'STQ-00122', dbId: 'b4', live: true, method: 'cash', paymentStatus: 'pending', paymentLabel: 'Kutilmoqda', dbStatus: 'yetkazilmoqda', statusLabel: 'Yo‘lda', total: 640000, date: '26.10.2026', items: 'Qo‘lqoplar (100 dona) × 4' },
]
const iso = (d) => `2026-${d}`
const SELLER = {
  orders: [
    { id: 'o1', code: 'STQ-00130', status: 'yetkazildi', payment_method: 'payme', payment_status: 'held', dispute_status: 'none', subtotal: 2450000, items: [{ name: 'Implant set Pro', qty: 2 }], created_at: iso('11-01T12:05:00'), updated_at: iso('11-01T15:00:00') },
    { id: 'o2', code: 'STQ-00131', status: 'yetkazildi', payment_method: 'click', payment_status: 'held', dispute_status: 'open', subtotal: 1750000, items: [{ name: 'Kompozit plomba', qty: 1 }], created_at: iso('10-30T10:12:00'), updated_at: iso('11-01T09:40:00') },
    { id: 'o3', code: 'STQ-00125', status: 'yetkazildi', payment_method: 'click', payment_status: 'released', subtotal: 3200000, items: [{ name: 'Endodontik motor', qty: 1 }], created_at: iso('10-27T18:42:00'), delivered_at: iso('10-28T16:00:00') },
    { id: 'o4', code: 'STQ-00118', status: 'yetkazildi', payment_method: 'payme', payment_status: 'released', subtotal: 2460000, items: [{ name: 'Apeks lokator', qty: 1 }], created_at: iso('10-24T10:00:00'), delivered_at: iso('10-26T10:00:00') },
    { id: 'o5', code: 'STQ-00122', status: 'yetkazildi', payment_method: 'cash', payment_status: 'paid', subtotal: 640000, items: [{ name: 'Qo‘lqoplar', qty: 4 }], created_at: iso('10-26T09:00:00'), delivered_at: iso('10-27T12:00:00') },
  ],
  ledger: [
    { id: 'l1', order_id: 'o3', gross: 3200000, commission: 384000, amount: 2816000, paid_amount: 0, status: 'kutilmoqda', released_at: iso('10-29T10:00:00') },
    { id: 'l2', order_id: 'o4', gross: 2460000, commission: 295200, amount: 2164800, paid_amount: 2164800, status: 'tolandi', released_at: iso('10-28T09:00:00'), paid_at: iso('10-30T14:00:00'), bank_ref: 'P/T № 000123' },
  ],
  wallet: { earned: 4980800, held: 3696000, pending: 3696000, paid_out: 2164800, available: 2816000, requested: 0, commission_owed: 76800, disputes: 1, withdrawn: 2164800 },
  products: [], payouts: [], customers: [], adTopups: [], reviews: [],
}

function Buyer() {
  return (
    <div className="mx-auto max-w-[760px] p-6 font-sans">
      <h1 className="text-[22px] font-extrabold text-[#12263a]">Buyurtmalarim</h1>
      <ul className="mt-4 space-y-3">
        {BUYER.map((o) => (
          <li key={o.id} className="flex flex-wrap items-start justify-between gap-2 rounded-2xl border border-[#e3ebf2] bg-white p-4">
            <div>
              <div className="font-bold text-[#12263a]">#{o.id} <span className="ml-2 text-[12px] font-medium text-[#6b7c8f]">{o.date}</span></div>
              <div className="text-[13px] text-[#475569]">{o.items}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px]"><span className="rounded-full bg-[#e6f4f1] px-2 py-0.5 font-semibold text-[#0F766E]">{o.statusLabel}</span><PayStatusPill order={o} /><span className="text-[#6b7c8f]">{o.method === 'cash' ? 'Naqd' : o.method === 'click' ? 'Click' : 'Payme'}</span></div>
            </div>
            <div className="text-right font-extrabold text-[#12263a]">{som(o.total)}</div>
            <EscrowActions order={o} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function Seller() {
  const [ready, setReady] = useState(false)
  useEffect(() => { __shotSellerState?.(SELLER); setReady(true) }, [])
  return ready ? <div className="bg-[#F5F8FA] p-6"><Hamyon /></div> : null
}

export default function EscrowShot() {
  const { who } = useParams()
  return who === 'seller' ? <Seller /> : <Buyer />
}
