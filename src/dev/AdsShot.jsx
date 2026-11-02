// Dev-only screenshot harness: /ads-shot/seller (mock data, no DB writes)
import { useEffect, useState } from 'react'
import { __shotSellerState } from '../seller/api'
import Reklama from '../seller/pages/Reklama'

const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10) }
const P = (id, name, price, img) => ({ id, name, price, stock: 40, unit: 'dona', status: 'active', image_url: `/images/market/${img}.jpg` })
const products = [P('p1', 'Kompozit Filtek Z250 (4 g)', 285000, 'p1'), P('p2', 'Implant tizimi Osstem TS III', 1450000, 'p2'), P('p3', 'Endodontik motor X-Smart', 3200000, 'p3'), P('p4', 'Nitril qo‘lqop (100 dona)', 95000, 'p4'), P('p5', 'Apeks lokator Woodpex III', 2460000, 'p5')]
const C = (id, title, kind, status, extra = {}) => ({ id, title, kind, status, product_ids: ['p1'], product_id: 'p1', daily_budget: 20000, total_budget: 300000, starts_on: d(-6), ends_on: d(24), region: 'Barcha hududlar', created_at: d(-7) + 'T10:00:00', approved_at: status === 'moderatsiyada' || status === 'rad_etilgan' ? null : d(-6) + 'T12:00:00', ...extra })
const campaigns = [
  C('c1', 'Kompozitlar — kuzgi aksiya', 'qidiruv', 'faol', { product_ids: ['p1', 'p4'] }),
  C('c2', 'Osstem implantlari banneri', 'banner', 'faol', { product_ids: ['p2'], product_id: 'p2', daily_budget: 50000, total_budget: 1000000 }),
  C('c3', 'Endodontiya tavsiyasi', 'kategoriya', 'moderatsiyada', { product_ids: ['p3'], product_id: 'p3', starts_on: d(1) }),
  C('c4', 'Apeks lokator chegirma', 'qidiruv', 'toxtatilgan', { product_ids: ['p5'], product_id: 'p5', pause_reason: 'Balans tugadi' }),
  C('c5', 'Arzon qo‘lqoplar!!!', 'banner', 'rad_etilgan', { product_ids: ['p4'], product_id: 'p4', reject_reason: 'Banner matnida tasdiqlanmagan da’vo bor (“eng arzon”). Matnni o‘zgartirib qayta yuboring.' }),
]
const st = (cid, day, imp, cl) => ({ campaign_id: cid, day: d(-day), impressions: imp, clicks: cl, spent: cl * 1000 })
const adStats = [st('c1', 1, 1840, 46), st('c1', 2, 1610, 38), st('c2', 1, 5200, 61), st('c2', 2, 4800, 55), st('c4', 3, 900, 20)]
const adRequests = [
  { id: 'r1', amount: 500000, method: 'naqd', status: 'tasdiqlandi', created_at: d(-8) + 'T09:30:00', reviewed_at: d(-7) + 'T11:00:00' },
  { id: 'r2', amount: 300000, method: 'bank', status: 'kutilmoqda', note: 'P/T № 000187', receipt_url: '/images/market/s1.jpg', created_at: d(0) + 'T10:15:00' },
  { id: 'r3', amount: 100000, method: 'naqd', status: 'rad_etildi', reject_reason: 'Chek o‘qib bo‘lmaydi', created_at: d(-3) + 'T16:20:00' },
]

export default function AdsShot() {
  const [ready, setReady] = useState(false)
  useEffect(() => { __shotSellerState?.({ products, campaigns, adStats, adRequests, adTopups: [], orders: [], reviews: [], payouts: [], customers: [], discounts: [], staff: [], branches: [], activity: [] }); setReady(true) }, [])
  return ready ? <div className="min-h-[100dvh] bg-[#F5F8FA] p-3 md:p-6"><Reklama /></div> : null
}
