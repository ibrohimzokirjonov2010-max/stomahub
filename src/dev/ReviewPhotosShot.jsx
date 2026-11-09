// Dev-only: /review-photos-shot/rate | product | viewer
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Camera, Star, X } from 'lucide-react'
import { BottomSheet } from '../components/mobile/MobileSeminars'
import ReviewList from '../components/ReviewList'
import Lightbox from '../components/Lightbox'
import SellerProfileView from '../seller-public/SellerProfileView'
import { toPublicCard } from '../seller-public/lib'

const MOCK_PHOTOS = ['/images/market/p1.jpg', '/images/market/p2.jpg', '/images/market/p3.jpg']
const MOCK_REVIEWS = [
  {
    id: 'r1', rating: 5, author: 'Dilshod', body: 'Original mahsulot, qadoq yaxshi. Kameradan olgan rasmlarim.',
    created_at: '2026-11-08T10:00:00Z', images: MOCK_PHOTOS.slice(0, 2), reply: 'Rahmat!', product_id: '00000000-0000-4000-8000-000000000001',
  },
  {
    id: 'r2', rating: 4, author: 'Malika', body: 'Yetkazish tez bo‘ldi.',
    created_at: '2026-11-05T10:00:00Z', images: [],
  },
]

function RateShot() {
  const [photos] = useState(MOCK_PHOTOS.slice(0, 2).map((url) => ({ url, preview: url })))
  return (
    <div className="min-h-[100dvh] bg-[#0b1f3a]/35">
      <BottomSheet
        centered
        title="Mahsulotni baholang"
        onClose={() => {}}
        footer={<button type="button" className="h-12 flex-1 rounded-xl bg-[#0F766E] text-[14px] font-semibold text-white">Yuborish</button>}
      >
        <div className="flex items-center gap-2.5 rounded-xl bg-[#f3f8f8] p-2.5">
          <img src="/images/market/p1.jpg" alt="" className="size-12 shrink-0 rounded-lg bg-white object-contain p-0.5" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-ink">Kompozit Filtek Z350 XT A2</p>
            <p className="text-[11.5px] text-muted">Buyurtma #STH-00099</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => <Star key={n} className="size-9 fill-[#f59e0b] text-[#f59e0b]" strokeWidth={1.6} />)}
          </div>
          <p className="mt-1.5 h-4 text-center text-[12.5px] font-medium text-ink-2">A’lo</p>
        </div>
        <label className="mt-3 block">
          <span className="text-[12.5px] font-medium text-ink-2">Izoh (ixtiyoriy)</span>
          <textarea readOnly value="Qadoq yaxshi, rangi mos." rows={3} className="mt-1 w-full resize-none rounded-xl border border-line bg-white p-3 text-[13.5px]" />
        </label>
        <div className="mt-3">
          <p className="text-[12.5px] font-medium text-ink-2">Rasmlar (ixtiyoriy, ko‘pi bilan 3 ta)</p>
          <p className="mt-0.5 text-[11.5px] text-muted">Faqat telefon kamerasi orqali. Galereyadan tanlab bo‘lmaydi.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {photos.map((p) => (
              <div key={p.url} className="relative size-[72px] overflow-hidden rounded-xl bg-[#eef3f4] ring-1 ring-line">
                <img src={p.preview} alt="" className="size-full object-cover" />
                <span className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white"><X className="size-3.5" /></span>
              </div>
            ))}
            <div className="flex size-[72px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#0F766E]/50 bg-[#F0FDFA] text-[#0F766E]">
              <Camera className="size-5" />
              <span className="px-1 text-center text-[10.5px] font-semibold leading-tight">Rasmga olish</span>
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}

function ProductShot() {
  return (
    <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-white px-3.5 py-4">
      <h1 className="text-[18px] font-bold text-ink">Kompozit Filtek Z350 XT A2</h1>
      <p className="mt-1 text-[12.5px] text-muted">3M · Restavratsion materiallar</p>
      <h2 className="mt-5 text-[16px] font-bold text-ink">Sharhlar ({MOCK_REVIEWS.length})</h2>
      <div className="mt-2 rounded-2xl border border-line bg-white px-3.5">
        <ReviewList reviews={MOCK_REVIEWS} className="!border-0 !px-0 !py-1" />
      </div>
    </div>
  )
}

function ViewerShot() {
  const [idx, setIdx] = useState(0)
  return (
    <div className="min-h-[100dvh] bg-[#0b1220]">
      <Lightbox images={MOCK_PHOTOS} index={idx} onIndex={setIdx} onClose={() => {}} alt="Sharh rasmi" />
    </div>
  )
}

function SellerShot() {
  const products = useMemo(() => [
    { id: '00000000-0000-4000-8000-000000000001', name: 'Kompozit Filtek Z350 XT A2', price: 850000, category: 'Materiallar', image: '/images/market/p1.jpg' },
  ].map(toPublicCard), [])
  const info = {
    id: 's', shop_name: 'StomaHub Market', description: 'Rasmiy distribyutor',
    avatar_url: '/images/market/p2.jpg', cover_url: '/images/market/g-main.jpg',
    rating: 4.5, reviews_count: 2, reviews: MOCK_REVIEWS, featured_ids: [],
  }
  return (
    <div className="mx-auto w-full max-w-[430px] bg-[#F5F8FA] px-3 py-3">
      <SellerProfileView info={info} products={products} initialTab="reviews" />
    </div>
  )
}

export default function ReviewPhotosShot() {
  const { sec } = useParams()
  if (sec === 'product') return <ProductShot />
  if (sec === 'viewer') return <ViewerShot />
  if (sec === 'seller') return <SellerShot />
  return <RateShot />
}
