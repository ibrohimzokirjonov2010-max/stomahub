import { useEffect, useRef, useState } from 'react'
import { Camera, Star, X } from 'lucide-react'
import { BottomSheet } from './mobile/MobileSeminars'
import { fetchMyReviews, revKey, submitReview, uploadReviewPhoto } from '../buyerApi'
import { currentUid } from '../recordSync'
import { useProfile } from '../profileStore'
import { REVIEW_PHOTO_MAX } from '../lib/reviewPhotos'

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
  const camRef = useRef(null)
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [photos, setPhotos] = useState([]) // { url, preview }
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => () => {
    photos.forEach((p) => { if (p.preview?.startsWith('blob:')) URL.revokeObjectURL(p.preview) })
  }, [photos])

  const takePhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setErr('')
    if (photos.length >= REVIEW_PHOTO_MAX) { setErr(`Ko‘pi bilan ${REVIEW_PHOTO_MAX} ta rasm`); return }
    if (!String(file.type || '').startsWith('image/')) { setErr('Faqat rasm yuklash mumkin'); return }
    const preview = URL.createObjectURL(file)
    setBusy(true)
    try {
      const url = await uploadReviewPhoto(file, currentUid())
      setPhotos((list) => [...list, { url, preview }].slice(0, REVIEW_PHOTO_MAX))
    } catch (ex) {
      URL.revokeObjectURL(preview)
      setErr(ex.message || 'Rasm yuklanmadi')
    } finally {
      setBusy(false)
    }
  }

  const removePhoto = (i) => {
    setPhotos((list) => {
      const next = list.slice()
      const [gone] = next.splice(i, 1)
      if (gone?.preview?.startsWith('blob:')) URL.revokeObjectURL(gone.preview)
      return next
    })
  }

  const send = async () => {
    setErr('')
    if (!rating) { setErr('Yulduzcha bilan baho tanlang'); return }
    setBusy(true)
    try {
      const r = await submitReview({
        uid: currentUid(),
        authorName: profile.name,
        order,
        item,
        rating,
        body,
        images: photos.map((p) => p.url),
      })
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

      <div className="mt-3">
        <p className="text-[12.5px] font-medium text-ink-2">Rasmlar (ixtiyoriy, ko‘pi bilan {REVIEW_PHOTO_MAX} ta)</p>
        <p className="mt-0.5 text-[11.5px] text-muted">Faqat telefon kamerasi orqali. Galereyadan tanlab bo‘lmaydi.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {photos.map((p, i) => (
            <div key={p.url} className="relative size-[72px] overflow-hidden rounded-xl bg-[#eef3f4] ring-1 ring-line">
              <img src={p.preview || p.url} alt="" className="size-full object-cover" />
              <button type="button" aria-label="Rasmni olib tashlash" onClick={() => removePhoto(i)} className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white">
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          {photos.length < REVIEW_PHOTO_MAX && (
            <button
              type="button"
              disabled={busy}
              onClick={() => camRef.current?.click()}
              className="flex size-[72px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#0F766E]/50 bg-[#F0FDFA] text-[#0F766E] disabled:opacity-50"
            >
              <Camera className="size-5" />
              <span className="px-1 text-center text-[10.5px] font-semibold leading-tight">Rasmga olish</span>
            </button>
          )}
        </div>
        {/* capture=environment — iOS/Android’da kamerani ochadi; desktop brauzer e’tiborsiz qoldirishi mumkin */}
        <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={takePhoto} />
      </div>

      {err && <p role="alert" className="mt-2 rounded-lg bg-[#fff4f4] px-3 py-2 text-[12.5px] text-[#b42318]">{err}</p>}
    </BottomSheet>
  )
}

export function RatedBadge({ rating }) {
  return <span className="inline-flex items-center gap-0.5 text-[11.5px] font-semibold text-[#b45309]"><Star className="size-3.5 fill-[#f59e0b] text-[#f59e0b]" /> {rating} · Baholangan</span>
}
