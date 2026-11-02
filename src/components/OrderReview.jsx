import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { BottomSheet } from './mobile/MobileSeminars'
import { fetchMyReviews, revKey, submitReview } from '../buyerApi'
import { currentUid } from '../recordSync'
import { useProfile } from '../profileStore'

const WORDS = ['', 'Juda yomon', 'Yomon', 'O‘rtacha', 'Yaxshi', 'A’lo']

// Foydalanuvchining o‘z baholari: { "orderDbId:productId": rating }
export function useMyReviews() {
  const [map, setMap] = useState({})
  const uid = currentUid()
  useEffect(() => {
    let alive = true
    if (uid) fetchMyReviews(uid).then((m) => alive && setMap(m)).catch(() => {})
    return () => { alive = false }
  }, [uid])
  const mark = (order, item, rating) => setMap((m) => ({ ...m, [revKey(order.dbId, isUuid(item?.id) ? item.id : null)]: rating }))
  const ratingOf = (order, item) => map[revKey(order.dbId, isUuid(item?.id) ? item.id : null)] || 0
  return { ratingOf, mark }
}
const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''))

export const canReview = (order) => !!(order?.live && order.dbStatus === 'yetkazildi' && order.sellerId)

export function StarsInput({ value, onChange, size = 'size-9' }) {
  return (
    <div className="flex justify-center gap-1.5" role="radiogroup" aria-label="Baho">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} yulduz`} onClick={() => onChange(n)} className="p-0.5 active:scale-95">
          <Star className={`${size} ${n <= value ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-[#cbd5e1]'}`} strokeWidth={1.6} />
        </button>
      ))}
    </div>
  )
}

export function ReviewDialog({ order, item, onClose, onDone }) {
  const profile = useProfile()
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const send = async () => {
    setErr('')
    if (!rating) { setErr('Yulduzcha bilan baho tanlang'); return }
    setBusy(true)
    try {
      const r = await submitReview({ uid: currentUid(), authorName: profile.name, order, item, rating, body })
      onDone?.(r)
    } catch (e) {
      setErr(e.message || 'Yuborib bo‘lmadi')
    } finally {
      setBusy(false)
    }
  }
  return (
    <BottomSheet
      centered
      title="Mahsulotni baholang"
      onClose={onClose}
      footer={<button type="button" disabled={busy} onClick={send} className="h-12 flex-1 rounded-xl bg-[#0F766E] text-[14px] font-semibold text-white disabled:opacity-60">{busy ? 'Yuborilmoqda…' : 'Yuborish'}</button>}
    >
      {item && (
        <div className="flex items-center gap-2.5 rounded-xl bg-[#f3f8f8] p-2.5">
          {item.image && <img src={item.image} alt="" className="size-12 shrink-0 rounded-lg bg-white object-contain p-0.5" />}
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-ink">{item.name}</p>
            <p className="text-[11.5px] text-muted">Buyurtma #{order.id}</p>
          </div>
        </div>
      )}
      <div className="mt-4">
        <StarsInput value={rating} onChange={setRating} />
        <p className="mt-1.5 h-4 text-center text-[12.5px] font-medium text-ink-2">{WORDS[rating]}</p>
      </div>
      <label className="mt-3 block">
        <span className="text-[12.5px] font-medium text-ink-2">Izoh (ixtiyoriy)</span>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} rows={4} placeholder="Mahsulot sifati, yetkazib berish haqida fikringiz…" className="mt-1 w-full resize-none rounded-xl border border-line bg-white p-3 text-[16px] outline-none focus:border-[#0F766E] md:text-[13.5px]" />
      </label>
      {err && <p role="alert" className="mt-2 rounded-lg bg-[#fff4f4] px-3 py-2 text-[12.5px] text-[#b42318]">{err}</p>}
    </BottomSheet>
  )
}

export function RatedBadge({ rating }) {
  return <span className="inline-flex items-center gap-0.5 text-[11.5px] font-semibold text-[#b45309]"><Star className="size-3.5 fill-[#f59e0b] text-[#f59e0b]" /> {rating} · Baholangan</span>
}
