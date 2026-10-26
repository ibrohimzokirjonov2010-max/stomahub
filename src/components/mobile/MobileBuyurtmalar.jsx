import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, CircleCheck, CircleX, Clock, MapPin, Package, RotateCcw, Truck } from 'lucide-react'
import { useCart } from '../../cart'
import { som } from '../../marketData'
import { allOrders, profileStore, useProfile } from '../../profileStore'
import { MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet } from './MobileSeminars'
import { Logo, METHODS } from './MobileCheckout'
import { SubTopBar } from './MobileManzillar'

const teal = 'text-[#0b6d73]'
const navy = 'text-[#0d2a4a]'
const MON = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek']
const TABS = [['active', 'Faol', Package], ['delivered', 'Yetkazilgan', CircleCheck], ['cancelled', 'Bekor qilingan', CircleX]]
const STEPS = ['Qabul qilindi', 'Tayyorlanmoqda', 'Yo‘lda', 'Yetkazildi']
const STAGE = { processing: 1, shipping: 2, delivered: 3 }
const OFFSETS = [0, 50, 100, 180]
const BADGE = {
  processing: [Clock, 'Tayyorlanmoqda'],
  shipping: [Truck, 'Yo‘lda'],
  delivered: [CircleCheck, 'Yetkazildi'],
  cancelled: [CircleX, 'Bekor qilindi'],
}
const inTab = (o, tab) => (tab === 'active' ? o.status === 'processing' || o.status === 'shipping' : o.status === tab)

function parseAt(at) {
  const m = at.match(/^(\d+) (\S+), (\d{4}) (\d{2}):(\d{2})$/)
  if (!m) return null
  return new Date(Number(m[3]), Math.max(0, MON.indexOf(m[2])), Number(m[1]), Number(m[4]), Number(m[5]))
}
const fmt = (d) => `${d.getDate()} ${MON[d.getMonth()]}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

export function timeline(order) {
  const start = parseAt(order.at)
  const stage = STAGE[order.status] ?? 0
  return STEPS.map((label, i) => ({
    label: order.mode === 'pickup' && i === 2 ? 'Tayyor' : order.mode === 'pickup' && i === 3 ? 'Olib ketildi' : label,
    state: i < stage || (stage === 3 && i === 3) ? 'done' : i === stage ? 'current' : 'todo',
    time: start && i <= stage ? fmt(new Date(start.getTime() + OFFSETS[i] * 60000)) : '',
  }))
}

export default function MobileBuyurtmalar() {
  const navigate = useNavigate()
  const location = useLocation()
  const profile = useProfile()
  const { add } = useCart()
  const orders = allOrders(profile)
  const [tab, setTab] = useState(location.state?.tab || 'active')
  const [detail, setDetail] = useState(null)
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  useEffect(() => { window.scrollTo(0, 0) }, [tab])

  const list = orders.filter((o) => inTab(o, tab))
  const ownIds = profile.orders.map((o) => o.id)
  const open = detail && orders.find((o) => o.id === detail)
  const track = (o) => navigate(`/buyurtma/kuzatish/${o.id}`)

  const repeat = (o) => {
    o.items.forEach((it) => add(it, it.qty))
    navigate('/buyurtma', { state: { from: 'profil' } })
  }
  const cancel = async (o) => {
    try {
      await profileStore.cancelOrder(o.id)
      setDetail(null)
      setToast(`#${o.id} buyurtmasi bekor qilindi`)
    } catch (e) {
      setToast(e.message || 'Bekor qilib bo‘lmadi')
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_28%,#f6faf9_100%)] pb-[86px]">
      <div className="px-3 pt-3">
        <SubTopBar title="Buyurtmalarim" subtitle="Barcha buyurtmalaringiz va ularning holati" />

        <div role="tablist" aria-label="Buyurtma holati" className="mt-4 grid grid-cols-3 rounded-xl border border-[#e2ebee] bg-white">
          {TABS.map(([id, label, Icon], i) => {
            const on = tab === id
            const count = orders.filter((o) => inTab(o, id)).length
            return (
              <button key={id} type="button" role="tab" aria-selected={on} onClick={() => setTab(id)} className={`flex h-11 items-center justify-center gap-1.5 text-[13px] font-medium transition ${i ? 'border-l border-[#e2ebee]' : ''} ${on ? 'rounded-xl border-transparent bg-[#0b6d73] text-white shadow-[0_4px_12px_rgb(11_109_115/0.25)]' : teal}`}>
                <Icon className="size-[18px] shrink-0" strokeWidth={1.8} />
                <span className="truncate">{label}</span>
                {id === 'active' && count > 0 && !on && <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-[#0b6d73] text-[10.5px] font-semibold text-white">{count}</span>}
              </button>
            )
          })}
        </div>

        {profile.ordersStatus === 'loading' && !orders.length ? (
          <p className="mt-6 text-center text-[13px] text-muted">Buyurtmalar yuklanmoqda…</p>
        ) : profile.ordersStatus === 'error' ? (
          <div className="mt-6 rounded-2xl bg-[#fff4f4] p-4 text-center text-[13px] text-[#b42318]">
            {profile.ordersError}
            <button type="button" onClick={() => profileStore.refreshOrders()} className="mt-2 block w-full font-semibold text-sea">Qayta urinish</button>
          </div>
        ) : list.length === 0 ? (
          <div className="mt-14 text-center">
            <span className={`mx-auto grid size-16 place-items-center rounded-full bg-[#e3f4f1] ${teal}`}><Package className="size-8" strokeWidth={1.6} /></span>
            <p className={`mt-3 text-[15px] font-bold ${navy}`}>{tab === 'active' ? 'Faol buyurtma yo‘q' : tab === 'delivered' ? 'Yetkazilgan buyurtma yo‘q' : 'Bekor qilingan buyurtma yo‘q'}</p>
            <p className="mt-1 text-[12.5px] text-muted">Yangi buyurtmalar shu yerda ko‘rinadi</p>
            <Link to="/marketplace" className="mt-4 inline-flex h-11 items-center rounded-xl bg-[#0b6d73] px-5 text-[14px] font-semibold text-white">Xarid qilish</Link>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {list.map((o) => <OrderCard key={o.id} order={o} onTrack={() => track(o)} onRepeat={() => repeat(o)} onDetail={() => setDetail(o.id)} />)}
          </div>
        )}
      </div>

      {open && (
        <DetailSheet
          order={open}
          canCancel={open.dbStatus === 'yangi' && ownIds.includes(open.id)}
          onCancel={() => cancel(open)}
          onTrack={() => track(open)}
          onRepeat={() => repeat(open)}
          onClose={() => setDetail(null)}
        />
      )}
      <MobileToast text={toast} onClose={closeToast} />
      <MobileTabBar />
    </div>
  )
}

function StatusBadge({ status }) {
  const [Icon, label] = BADGE[status]
  const bad = status === 'cancelled'
  return (
    <span className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] font-medium ${bad ? 'bg-[#fdecec] text-sale' : `bg-[#e3f4f1] ${teal}`}`}>
      <Icon className={`size-4 ${status === 'delivered' ? 'fill-[#0b6d73] text-white' : ''}`} strokeWidth={status === 'delivered' ? 2.4 : 2} /> {label}
    </span>
  )
}

function Stepper({ order }) {
  const steps = timeline(order)
  return (
    <ol className="mt-3 grid grid-cols-4">
      {steps.map((s, i) => {
        const lit = s.state !== 'todo'
        return (
          <li key={s.label} className="relative flex flex-col items-center text-center">
            {i > 0 && <span className={`absolute left-[calc(-50%+15px)] right-[calc(50%+15px)] top-[13px] h-[2px] ${lit ? 'bg-[#0b6d73]' : 'bg-[#d5dee2]'}`} />}
            {s.state === 'done' && <span className="grid size-7 place-items-center rounded-full bg-[#0b6d73] text-white"><Check className="size-4" strokeWidth={3} /></span>}
            {s.state === 'current' && (
              <span className="grid size-7 place-items-center rounded-full border-2 border-[#0b6d73] bg-white">
                {order.status === 'shipping'
                  ? <span className="grid size-[18px] place-items-center rounded-full bg-[#0b6d73] text-white"><Truck className="size-2.5" strokeWidth={2.5} /></span>
                  : <span className="size-3.5 rounded-full bg-[#0b6d73]" />}
              </span>
            )}
            {s.state === 'todo' && <span className="size-7 rounded-full border-2 border-[#c9d3d8] bg-white" />}
            <span className={`mt-1 text-[10.5px] leading-tight tracking-[-0.01em] ${lit ? `${teal} font-medium` : 'text-[#8796a5]'}`}>{s.label}</span>
            {s.time && <span className="mt-0.5 text-[10px] text-[#8796a5]">{s.time}</span>}
          </li>
        )
      })}
    </ol>
  )
}

function Thumbs({ items }) {
  const extra = items.length - 3
  return (
    <div className="mt-3 grid grid-cols-4 gap-2">
      {items.slice(0, 3).map((it) => (
        <span key={it.id} className="grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-[#f2f6f7]">
          <img src={it.image} alt={it.name} loading="lazy" className="size-full object-contain p-1" />
        </span>
      ))}
      {extra > 0 && (
        <span className="grid aspect-[4/3] place-items-center rounded-xl bg-[#f2f6f7] text-center">
          <span>
            <span className="block text-[15px] font-semibold text-[#5b6b7d]">+{extra}</span>
            <span className="block text-[10px] text-[#8796a5]">ta mahsulot</span>
          </span>
        </span>
      )}
    </div>
  )
}

function OrderCard({ order, onTrack, onRepeat, onDetail }) {
  const active = order.status === 'processing' || order.status === 'shipping'
  return (
    <article className="rounded-2xl border border-[#e5eef0] bg-white p-3 shadow-[0_1px_6px_rgb(11_31_58/0.04)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-[16px] font-bold ${navy}`}>Buyurtma #{order.id}</p>
          <p className="text-[12px] text-[#7a8a9c]">{order.at.replace(/^(\d+ \S+), (\d{4}) /, '$1 $2, ')}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.status === 'cancelled' ? (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-[#fdf3f3] px-3 py-2.5 text-[12.5px] text-sale"><CircleX className="size-4 shrink-0" /> Buyurtma bekor qilindi, to‘lov qaytarildi</p>
      ) : (
        <Stepper order={order} />
      )}

      <Thumbs items={order.items} />

      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-1 gap-y-2.5">
        <div>
          <p className="text-[12px] text-[#7a8a9c]">Jami summa</p>
          <p className={`whitespace-nowrap text-[17px] font-extrabold tracking-[-0.01em] ${navy}`}>{som(order.total).replace(/ so‘m$/, '')} <span className="text-[13px] font-bold">so‘m</span></p>
        </div>
        <div className="ml-auto flex shrink-0 gap-1">
          {active ? (
            <button type="button" onClick={onTrack} className="flex h-10 items-center gap-1 rounded-xl bg-[#0b6d73] px-3 text-[12.5px] font-semibold text-white active:scale-[0.98]"><Truck className="size-4" /> Kuzatish</button>
          ) : (
            <button type="button" onClick={onRepeat} className={`flex h-10 items-center gap-0.5 rounded-xl border border-[#0b8a7a]/60 bg-white px-2 text-[12px] font-semibold ${teal} active:scale-[0.98]`}><RotateCcw className="size-[15px]" /> Qayta buyurtma</button>
          )}
          <button type="button" onClick={onDetail} className={`flex h-10 items-center gap-0.5 rounded-xl border border-[#0b8a7a]/60 bg-white px-2 text-[12px] font-semibold ${teal} active:scale-[0.98]`}>Batafsil <ArrowRight className="size-[15px]" /></button>
        </div>
      </div>
    </article>
  )
}

export function DetailSheet({ order, canCancel, onCancel, onTrack, onRepeat, onClose }) {
  const active = order.status === 'processing' || order.status === 'shipping'
  const qty = order.items.reduce((s, it) => s + it.qty, 0)
  return (
    <BottomSheet
      title={`Buyurtma #${order.id}`}
      onClose={onClose}
      footer={
        active ? (
          <>
            {canCancel && <button type="button" onClick={onCancel} className="h-12 flex-1 rounded-xl border border-[#f3c9c9] text-[14px] font-semibold text-sale">Bekor qilish</button>}
            <button type="button" onClick={onTrack} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white"><Truck className="size-[18px]" /> Kuzatish</button>
          </>
        ) : (
          <button type="button" onClick={onRepeat} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white"><RotateCcw className="size-[18px]" /> Qayta buyurtma berish</button>
        )
      }
    >
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[12px] text-muted">{order.at} · {qty} dona</span>
        <StatusBadge status={order.status} />
      </div>
      <ul className="mt-2 divide-y divide-[#eef2f4]">
        {order.items.map((it) => (
          <li key={it.id}>
            <Link to={`/product/${it.id}`} className="flex items-center gap-2.5 py-2">
              <img src={it.image} alt="" className="size-12 shrink-0 rounded-lg bg-[#f2f6f7] object-contain p-0.5" />
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-[13px] font-semibold ${navy}`}>{it.name}</span>
                <span className="block text-[11px] text-muted">{it.qty} dona × {som(it.price)}</span>
              </span>
              <span className={`shrink-0 whitespace-nowrap text-[12.5px] font-semibold ${navy}`}>{som(it.price * it.qty)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-2 space-y-2 rounded-xl bg-[#f3f8f8] p-3 text-[12.5px]">
        <p className="flex gap-2 text-ink-2"><MapPin className={`mt-0.5 size-4 shrink-0 ${teal}`} /> {order.address}</p>
        <p className="flex items-center gap-2 text-ink-2"><Logo id={order.method} /> {METHODS[order.method]?.[0]}{order.months ? ` · ${order.months} oy` : ''}</p>
        <div className="space-y-1 border-t border-[#e2ebee] pt-2 text-ink-2">
          <p className="flex justify-between"><span>Mahsulotlar</span><span>{som(order.goods ?? order.total)}</span></p>
          <p className="flex justify-between"><span>Yetkazish</span><span>{order.fee ? som(order.fee) : 'Bepul'}</span></p>
          {order.discount > 0 && <p className="flex justify-between text-[#16a34a]"><span>Chegirma</span><span>− {som(order.discount)}</span></p>}
          <p className={`flex justify-between pt-1 text-[14px] font-bold ${navy}`}><span>Jami</span><span>{som(order.total)}</span></p>
        </div>
      </div>
    </BottomSheet>
  )
}
