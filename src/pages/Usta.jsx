import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Star, Phone, Calendar, MessageCircle, MapPin, BadgeCheck, Clock, ShieldCheck, ChevronRight, X } from 'lucide-react'
import { getUsta, viewOf, statusLabel } from '../ustalarData'

const brandColor = {
  SIRONA: '#e4572e', KaVo: '#1b1f24', Fengdan: '#1d4e89', 'W&H': '#1f8f4e', NSK: '#2457c5',
  Planmeca: '#10243f', Carestream: '#e0a100', Vatech: '#d1263a',
}

export default function Usta() {
  const { id } = useParams()
  const master = getUsta(id)
  const [call, setCall] = useState(false)
  const [order, setOrder] = useState(false)
  const [chat, setChat] = useState(false)
  const [moreWorks, setMoreWorks] = useState(false)
  const [moreReviews, setMoreReviews] = useState(false)

  if (!master) {
    return <div className="py-16 text-center text-[14px] text-muted">Usta topilmadi. <Link to="/ustalar" className="text-sea">Ustalarga qaytish</Link></div>
  }

  const view = viewOf(master)
  const reviews = moreReviews ? view.reviewList : view.reviewList.slice(0, 4)
  const photos = moreWorks ? view.works : view.works.slice(0, 4)

  return (
    <div className="pb-8 pt-3">
      <p className="mb-3 flex flex-wrap items-center gap-1 text-[11px] text-muted">
        <Link to="/ustalar" className="hover:text-sea">Xizmatlar</Link><ChevronRight className="size-3" />
        <Link to="/ustalar" className="hover:text-sea">Ustalar</Link><ChevronRight className="size-3" />
        <span className="text-ink">{master.name}</span>
      </p>

      <div className="usta-top">
        <div className="min-w-0">
          <div className="rounded-2xl bg-white p-3 shadow-card">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
              <img src={master.photo} alt="" className="w-full shrink-0 rounded-xl object-cover object-top sm:w-[210px]" style={{ height: 220 }} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[22px] font-extrabold text-ink">{master.name}</h1>
                  {master.verified ? <span className="inline-flex items-center gap-1 rounded-full bg-sea-50 px-2 py-0.5 text-[11px] font-semibold text-sea"><BadgeCheck className="size-3.5" /> Tasdiqlangan</span> : null}
                </div>
                <p className="text-[13px] text-muted">{master.role}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-2">
                  <span className="inline-flex items-center gap-1"><MapPin className="size-3.5 text-sea" /> {master.city}</span>
                  <span>{master.years} yil tajriba</span>
                  <span>{master.jobs} bajarilgan ish</span>
                  <span>Javob vaqti: {master.reply}</span>
                </p>
                <p className="mt-1 flex items-center gap-1 text-[13px]"><Star className="size-4 fill-star text-star" /> <b>{master.rating}</b> <span className="text-muted">({master.reviews} sharh)</span> <span className="ml-2 rounded-md bg-[#f3f6fa] px-1.5 py-0.5 text-[10px]">{statusLabel[master.status]}</span></p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => setCall(true)} className="flex h-9 items-center gap-1.5 rounded-lg bg-sea px-3 text-[12px] font-semibold text-white"><Phone className="size-3.5" /> Qo‘ng‘iroq qilish</button>
                  <button onClick={() => setOrder(true)} className="flex h-9 items-center gap-1.5 rounded-lg bg-sea px-3 text-[12px] font-semibold text-white"><Calendar className="size-3.5" /> Buyurtma berish</button>
                  <button onClick={() => setChat(true)} className="flex h-9 items-center gap-1.5 rounded-lg border border-sea px-3 text-[12px] font-semibold text-sea"><MessageCircle className="size-3.5" /> Xabar yozish</button>
                </div>
                <p className="mb-1 mt-3 text-[12px] font-bold">Mutaxassislik va ko‘nikmalar</p>
                <div className="flex flex-wrap gap-1">{view.skills.map((s) => <span key={s} className="rounded-md bg-[#f3f6fa] px-2 py-0.5 text-[11px] text-ink-2">{s}</span>)}</div>
                <p className="mb-1 mt-3 text-[12px] font-bold">Brendlar bo‘yicha tajriba</p>
                <div className="flex flex-wrap gap-1.5">{view.brands.map((b) => <span key={b} className="text-[11px] font-extrabold" style={{ color: brandColor[b] || '#0b1f3a' }}>{b}</span>)}</div>
              </div>
            </div>
          </div>

          <div className="usta-mid mt-3">
            <div className="rounded-xl bg-white p-3 shadow-card">
              <h2 className="text-[14px] font-bold">Xizmatlar va narxlar</h2>
              <div className="mt-2 grid grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1fr)] gap-x-2 border-b border-line pb-1 text-[10px] text-muted">
                <span>Xizmat turi</span><span>Narx (so‘m)</span><span>Izoh</span>
              </div>
              {view.table.map(([name, price, note]) => (
                <div key={name} className="grid grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1fr)] gap-x-2 border-b border-line py-1.5 text-[11px]">
                  <span className="font-medium">{name}</span>
                  <span className="font-bold">{price}</span>
                  <span className="text-muted">{note}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-white p-3 shadow-card">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[14px] font-bold">Bajarilgan ishlar</h2>
                <button onClick={() => setMoreWorks((v) => !v)} className="text-[11px] font-semibold text-sea">{moreWorks ? 'Yig‘ish' : 'Barchasini ko‘rish'}</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {photos.map((src) => <img key={src} src={src} alt="" className="h-[92px] w-full rounded-lg object-cover" />)}
              </div>
            </div>
          </div>

          <div className="usta-mid mt-3">
            <div className="rounded-xl bg-white p-3 shadow-card">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[14px] font-bold">Sharhlar ({master.reviews})</h2>
                {view.reviewList.length > 4 ? <button onClick={() => setMoreReviews((v) => !v)} className="text-[11px] font-semibold text-sea">Barchasini ko‘rish</button> : null}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {reviews.map(([name, clinic, date, stars, text]) => (
                  <div key={name + date} className="rounded-xl bg-[#f7fafd] p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-bold">{name}</p>
                      <span className="text-[10px] text-muted">{date}</span>
                    </div>
                    <p className="text-[10px] text-muted">{clinic}</p>
                    <p className="mt-1 flex gap-0.5">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-3 ${i < stars ? 'fill-star text-star' : 'text-[#d5dde6]'}`} />)}</p>
                    <p className="mt-1 text-[11px] leading-snug text-ink-2">{text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-card">
              <h2 className="text-[14px] font-bold">Reyting taqsimoti</h2>
              <p className="mt-1 text-[22px] font-extrabold text-ink">{master.rating}/5</p>
              <p className="text-[11px] text-muted">{master.reviews} sharh asosida</p>
              <div className="mt-2 flex flex-col gap-1">
                {view.bars.map((pct, i) => (
                  <div key={i} className="grid items-center gap-2 text-[11px]" style={{ gridTemplateColumns: '52px minmax(0,1fr) 32px' }}>
                    <span className="inline-flex items-center gap-0.5">{5 - i} <Star className="size-3 fill-star text-star" /></span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-[#e8eef5]"><span className="block h-full rounded-full bg-[#2f9e4f]" style={{ width: `${pct}%` }} /></span>
                    <span className="text-muted">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-3">
          <div className="rounded-xl bg-white p-3 shadow-card">
            <h3 className="flex items-center gap-1 text-[13px] font-bold"><Clock className="size-3.5 text-sea" /> Ish vaqti</h3>
            <div className="mt-2 flex justify-between text-[12px]"><span>{view.hours.days}</span><span className="font-semibold">{view.hours.time}</span></div>
            <div className="mt-1 flex justify-between text-[12px]"><span>Yakshanba</span><span className="text-muted">{view.hours.sun}</span></div>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-card">
            <h3 className="flex items-center gap-1 text-[13px] font-bold"><MapPin className="size-3.5 text-sea" /> Xizmat hududi</h3>
            {view.area.map(([place, time]) => (
              <div key={place} className="mt-1.5 flex items-center justify-between text-[12px]"><span>{place}</span><span className="rounded-md bg-[#e7f7ef] px-1.5 py-0.5 text-[10px] font-semibold text-[#1f8f4e]">{time}</span></div>
            ))}
          </div>
          <div className="rounded-xl bg-white p-3 shadow-card">
            <h3 className="flex items-center gap-1 text-[13px] font-bold"><ShieldCheck className="size-3.5 text-sea" /> Kafolat</h3>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{view.warranty}</p>
          </div>
        </aside>
      </div>

      {call && <Note title="Qo‘ng‘iroq qilish" done={`${master.name}: ${master.phone}`} onClose={() => setCall(false)} />}
      {chat && <Note title="Xabar yozish" ask done="Xabaringiz ustaga yuborildi." onClose={() => setChat(false)} />}
      {order && <Note title="Buyurtma berish" ask done={`${master.name} buyurtmani qabul qildi. Usta sana bo‘yicha bog‘lanadi.`} onClose={() => setOrder(false)} />}
    </div>
  )
}

function Note({ title, done, onClose, ask }) {
  const [sent, setSent] = useState(!ask)
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[400px] rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between"><h3 className="text-[16px] font-bold">{title}</h3><button onClick={onClose} aria-label="Yopish"><X className="size-4 text-muted" /></button></div>
        {sent ? <p className="py-4 text-[13px] leading-relaxed text-ink-2">{done}</p> : (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true) }} className="flex flex-col gap-2">
            <input required placeholder="Ism" className="h-10 rounded-lg bg-page px-3 text-[13px] outline-none" />
            <input required placeholder="Telefon" className="h-10 rounded-lg bg-page px-3 text-[13px] outline-none" />
            <textarea required placeholder="Xabar" className="h-20 rounded-lg bg-page p-3 text-[13px] outline-none" />
            <button className="h-10 rounded-lg bg-sea text-[13px] font-semibold text-white">Yuborish</button>
          </form>
        )}
      </div>
    </div>
  )
}
