import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Star, Boxes, Droplet, MapPin, Building2, Send, Phone, CircleCheck, Clock, ArrowRight,
  SquareCheck, ShieldCheck, CalendarCheck, MessageSquare, Lock,
} from 'lucide-react'
import { getSurplusDetail, similarFor } from '../surplusData'
import { som } from '../marketData'
import { LikeButton } from '../components/market/ProductCard'
import { ConditionBadge } from './Surplus'

const factIcons = { qty: Boxes, vol: Droplet, city: MapPin, place: MapPin }

const safety = [
  { icon: ShieldCheck, label: 'Tekshirilgan sotuvchilar' },
  { icon: CalendarCheck, label: 'Yaroqlilik muddati ko‘rsatilgan' },
  { icon: MessageSquare, label: 'Muloqot platforma orqali' },
  { icon: Lock, label: 'Shaxsiy ma’lumotlar himoyalangan' },
]

const card = 'rounded-xl bg-white shadow-card'

export default function SurplusItem() {
  const { id } = useParams()
  const d = getSurplusDetail(id)
  const related = similarFor(id)
  const [img, setImg] = useState(0)
  const [showPhone, setShowPhone] = useState(false)
  const n = d?.images?.length || 0
  const s = d?.seller
  const off = d?.oldPrice ? Math.round((1 - d.price / d.oldPrice) * 100) : 0

  useEffect(() => {
    setImg(0)
    setShowPhone(false)
  }, [id])

  if (!d) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-[16px] font-bold text-ink">E’lon topilmadi</p>
      </div>
    )
  }

  return (
    <div className="pb-6 pt-2.5 lg:pl-1">
      <nav className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
        <Link to="/ortiqcha" className="flex items-center gap-1 text-sea hover:underline">
          <ChevronLeft className="size-3" /> Ortiqcha material
        </Link>
        <ChevronRight className="size-3" />
        <Link to={`/ortiqcha?cat=${d.cat}`} className="hover:text-sea">{d.category}</Link>
        <ChevronRight className="size-3" />
        <span className="font-medium text-ink">{d.name}</span>
      </nav>

      {/* 1-qator: galereya · ma'lumot · narx */}
      <div className="mt-2.5 grid gap-4 xl:grid-cols-[minmax(0,410fr)_minmax(0,630fr)] xl:gap-x-[18px]">
      <div className="flex min-w-0 flex-col gap-3">
        <div>
          <div className="relative aspect-[410/274] overflow-hidden rounded-xl bg-[#eef3f8]">
            <img src={d.images[img]} alt={d.name} className="size-full object-cover" />
            {[['left', ChevronLeft, -1], ['right', ChevronRight, 1]].map(([side, Icon, step]) => (
              <button
                key={side}
                onClick={() => setImg((img + step + n) % n)}
                aria-label={side === 'left' ? 'Oldingi' : 'Keyingi'}
                className={`absolute top-1/2 grid size-[24px] -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-md hover:bg-white ${side === 'left' ? 'left-2.5' : 'right-2.5'}`}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {d.thumbs.map((t, i) => (
              <button
                key={t}
                onClick={() => setImg(i)}
                className={`aspect-[76/58] overflow-hidden rounded-lg bg-white ${i === img ? 'ring-2 ring-sea' : 'ring-1 ring-line hover:ring-sea/50'}`}
              >
                <img src={t} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className={`${card} p-3`}>
          <h2 className="text-[12px] font-bold text-ink">Tavsif</h2>
          <p className="mt-1.5 text-[10.5px] leading-[1.6] text-ink-2">{d.description}</p>
        </div>

      </div>

      <div className="flex min-w-0 flex-col gap-3">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,350fr)_minmax(0,262fr)] sm:gap-x-[18px]">
        <div className="min-w-0 pt-1">
          <p className="text-[10px] text-ink-2"><span className="font-semibold text-ink">{d.brand}</span> · {d.category}</p>
          <h1 className="mt-1 text-[23px] font-extrabold leading-tight tracking-tight text-ink">{d.name}</h1>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-[#e5f6ec] px-2.5 py-1 text-[10px] font-medium text-ok">{d.condition}</span>
            <span className="rounded-md bg-[#eef1f5] px-2.5 py-1 text-[10px] font-medium text-ink-2">{d.state}</span>
            <span className="rounded-md bg-[#e8f0fd] px-2.5 py-1 text-[10px] font-semibold text-blue">Yaroqlilik: {d.expiry}</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[9.5px] text-muted">
            <Star className="size-3 fill-star text-star" />
            <span className="font-semibold text-ink">{d.rating}</span> ({d.reviews} ta sharh)
            <span className="mx-1 h-3 w-px bg-line" /> {d.views} marta ko‘rilgan
          </div>
          <p className="mt-2.5 text-[9.5px] leading-[1.65] text-ink-2">{d.short}</p>
          <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {d.facts.map(([k, label, value]) => {
              const Icon = k === 'place' ? MapPin : factIcons[k]
              return (
                <div key={k} className="flex gap-1.5">
                  <Icon className="mt-0.5 size-[15px] shrink-0 text-ink-2" strokeWidth={1.5} />
                  <div className="leading-tight">
                    <p className="text-[8.5px] text-muted">{label}</p>
                    <p className="mt-0.5 whitespace-nowrap text-[9px] font-medium text-ink">{value}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <aside className={`${card} h-fit p-3.5`}>
          {off > 0 && (
            <span className="rounded bg-sale px-1.5 py-[3px] text-[9px] font-semibold text-white">-{off}%</span>
          )}
          <p className={`${off ? 'mt-2' : ''} text-[22px] font-extrabold leading-none tracking-tight text-ink`}>{som(d.price)}</p>
          {d.oldPrice && (
            <>
              <p className="mt-2.5 text-[9.5px] text-muted">Asl narxi: <span className="line-through">{som(d.oldPrice)}</span></p>
              <p className="mt-1.5 text-[9.5px] font-semibold text-ok">Tejaysiz: {som(d.oldPrice - d.price)}</p>
            </>
          )}

          <a
            href={s.telegram}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex h-[39px] items-center justify-center gap-3 rounded-lg bg-sea text-white transition hover:bg-sea-600"
          >
            <Send className="size-[18px]" />
            <span className="leading-tight">
              <span className="block text-[11px] font-semibold">Sotuvchiga yozish</span>
              <span className="block text-[8.5px] text-white/80">Telegram orqali</span>
            </span>
          </a>
          <div className="mt-2 flex gap-2">
            <a
              href={showPhone ? `tel:${s.phone}` : undefined}
              onClick={() => setShowPhone(true)}
              className="flex h-[34px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-sea-50 text-[11px] font-semibold text-sea-600 transition hover:bg-sea-100"
            >
              <Phone className="size-3.5" /> {showPhone ? s.phone : 'Qo‘ng‘iroq qilish'}
            </a>
            <LikeButton className="!size-[34px] rounded-lg border border-line" />
          </div>
        </aside>
      </div>

      {/* 2-qator: xususiyatlar · sotuvchi */}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,320fr)_minmax(0,298fr)]">
        <div className={`${card} p-3`}>
          <h2 className="mb-2 text-[11px] font-bold text-ink">Xususiyatlari</h2>
          <dl>
            {d.specs.map(([k, v], i) => (
              <div key={k} className="grid grid-cols-[1fr_1fr] border-b border-line/70 py-[4px] text-[8.5px] last:border-0">
                <dt className={i === 0 ? 'font-medium text-ink' : 'text-muted'}>{k}</dt>
                <dd className="text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className={`${card} p-3`}>
            <h2 className="text-[11.5px] font-bold text-ink">Sotuvchi</h2>
            <a href="#" className="mt-2.5 flex gap-3">
              <img src={s.avatar} alt="" className="size-[48px] shrink-0 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-[10.5px] font-bold text-ink">{s.name}</p>
                  <span className="flex items-center gap-0.5 rounded-full bg-[#e5f6ec] px-1.5 py-0.5 text-[7.5px] font-medium text-ok">
                    <CircleCheck className="size-2.5 fill-ok text-white" /> Tekshirilgan sotuvchi
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[8.5px] text-muted">
                  <Star className="size-[10px] fill-star text-star" />
                  <span className="font-semibold text-ink">{s.rating}</span> ({s.reviews} ta sharh)
                  <span className="mx-1 h-2.5 w-px bg-line" /> {s.deals} ta bitim
                  <ChevronRight className="ml-auto size-3.5 text-ink-2" />
                </div>
                <div className="mt-1.5 flex gap-4 text-[8.5px] text-ink-2">
                  <span className="flex items-center gap-1"><MapPin className="size-[10px]" />{s.city}</span>
                  <span className="flex items-center gap-1"><Building2 className="size-[10px]" />{s.place}</span>
                </div>
                <p className="mt-1.5 flex items-center gap-1 text-[8.5px] text-ink-2">
                  <Clock className="size-[10px]" /> Javob vaqti: {s.reply}
                </p>
              </div>
            </a>
          </div>

          <div className="rounded-xl bg-[#e6f5f3] p-3">
            <p className="flex items-center gap-2.5 text-[10.5px] font-semibold text-ink">
              <SquareCheck className="size-[15px] text-ok" strokeWidth={1.8} /> Xavfsiz xarid
            </p>
            <ul className="mt-2 space-y-1.5">
              {safety.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5 text-[9.5px] text-ink">
                  <span className="grid size-[15px] place-items-center rounded bg-ok text-white">
                    <Icon className="size-[10px]" strokeWidth={2.2} />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      </div>
      </div>

      {/* O'xshash e'lonlar */}
      <div className="mb-2 mt-4 flex items-center justify-between">
        <h2 className="text-[13px] font-bold text-ink">O‘xshash e’lonlar</h2>
        <Link to="/ortiqcha" className="flex items-center gap-1.5 text-[9.5px] font-medium text-sea-600 hover:underline">
          Barchasini ko‘rish <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {related.map((it) => (
          <Link key={it.id} to={`/ortiqcha/${it.id}`} className={`${card} relative p-2.5 transition hover:shadow-md`}>
            <div className="flex gap-2">
              <div className="relative h-[84px] w-[46%] shrink-0 overflow-hidden rounded-lg bg-[#f7fafc]">
                <img src={it.image} alt={it.name} className="size-full object-contain" />
                <div className="absolute left-1 top-1 flex gap-1">
                  {it.discount && <span className="rounded bg-sale px-1 py-[2px] text-[8px] font-semibold text-white">{it.discount}</span>}
                  <ConditionBadge value={it.condition || 'Yopiq'} className="!px-1 !py-[2px] !text-[8px]" />
                </div>
              </div>
              <div className="min-w-0 flex-1 pt-3.5">
                <LikeButton className="absolute right-1.5 top-1.5" />
                <p className="truncate text-[9px] font-bold text-ink">{it.name}</p>
                <p className="truncate text-[8.5px] text-ink-2">{it.type}</p>
                <p className="text-[8.5px] text-muted">{it.brand}</p>
                <p className="mt-1.5 whitespace-nowrap text-[10.5px] font-bold text-sale">{som(it.price)}</p>
                <p className="text-[8px] text-sale/70 line-through">{som(it.oldPrice)}</p>
              </div>
            </div>
            <p className="mt-1.5 flex items-center gap-1 text-[8.5px] text-muted"><MapPin className="size-[10px]" />{it.city}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
