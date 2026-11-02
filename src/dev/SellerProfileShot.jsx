// Dev-only screenshot harness (mock data, no DB writes):
//   /seller-profile-shot/sozlamalar  — Sozlamalar with live preview
//   /seller-profile-shot/dokon       — public /dokon body with 'Tavsiya etamiz'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { __shotSellerState } from '../seller/api'
import Sozlamalar from '../seller/pages/Sozlamalar'
import SellerProfileView from '../seller-public/SellerProfileView'
import { toPublicCard } from '../seller-public/lib'

const N = ['Kompozit Filtek Z250 (4 g)', 'Implant tizimi Osstem TS III', 'Endodontik motor X-Smart', 'Nitril qo‘lqop (100 dona)', 'Apeks lokator Woodpex III', 'Adgeziv Single Bond', 'Ultratovushli skaler', 'Fotopolimer lampa', 'Alginat qolip massasi', 'Rentgen sensori']
const products = N.map((name, i) => ({ id: `00000000-0000-4000-8000-00000000000${i}`, name, price: 85000 + i * 145000, category: i % 2 ? 'Asboblar' : 'Materiallar', status: i === 9 ? 'archived' : 'active', image_url: `/images/market/p${(i % 5) + 1}.jpg`, stock: 20 }))
const featured = [products[1].id, products[0].id, products[4].id, products[6].id]
const settings = { seller_id: 's', phone: '+998901234567', address: 'Toshkent, Yunusobod, Amir Temur 108', work_days: 'Dushanba - Shanba', work_hours: '09:00 - 18:00', logo_url: '/images/market/p2.jpg', notify: { yangi_buyurtma: true }, owner_name: '', telegram: '@stomahub', instagram: '', website: '', description: 'Stomatologiya materiallari va asboblarining rasmiy distribyutori. Toshkent bo‘ylab 1 kunda yetkazamiz.', legal: { stir: '309876543', bank: 'Kapitalbank', mfo: '01088', account: '20208000123456789012' }, show_phone: true, show_address: true, cover_url: '/images/market/g-main.jpg', featured_product_ids: featured }
const reviews = [{ id: 'r1', rating: 5, body: 'Tez yetkazishdi, mahsulot original.', reply: 'Rahmat!', created_at: '2026-10-20T10:00:00', author_name: 'Dilshod K.' }, { id: 'r2', rating: 4, body: 'Narxlar yaxshi.', created_at: '2026-10-25T10:00:00', author_name: 'Malika' }]

export default function SellerProfileShot() {
  const { sec } = useParams()
  const [ready, setReady] = useState(false)
  useEffect(() => { __shotSellerState?.({ settings, products, reviews, staff: [], branches: [], activity: [], orders: [], customers: [], discounts: [], payouts: [], campaigns: [], adStats: [], adRequests: [], adTopups: [] }); setReady(true) }, [])
  if (!ready) return null
  if (sec === 'dokon') {
    const active = products.filter((p) => p.status === 'active').map(toPublicCard)
    const info = { id: 's', shop_name: 'StomaHub Market', description: settings.description, avatar_url: settings.logo_url, cover_url: settings.cover_url, work_days: settings.work_days, work_hours: settings.work_hours, phone: settings.phone, address: settings.address, since: '2026-10-26T18:55:21Z', rating: 4.5, reviews_count: 2, reviews: reviews.map((r) => ({ ...r, author: r.author_name.split(' ')[0] })), featured_ids: featured }
    return <div className="mx-auto w-full max-w-[1120px] px-3.5 py-3 lg:px-0"><SellerProfileView info={info} products={active} /></div>
  }
  return <div className="min-h-[100dvh] bg-[#F5F8FA]"><Sozlamalar /></div>
}
