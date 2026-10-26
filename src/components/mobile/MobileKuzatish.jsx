import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Bell, CalendarDays, Check, ChevronRight, CircleX, Headset, House, Menu, MessageCircleMore, MessagesSquare, Phone, ReceiptText,
  SendHorizontal, ShoppingBag, ShoppingCart, Star, Store, Truck, UserRound,
} from 'lucide-react'
import { useCart } from '../../cart'
import { som } from '../../marketData'
import { allOrders, profileStore, useProfile } from '../../profileStore'
import { BrandLogo, CountBadge, MobileToast } from './parts'
import MobileTabBar from './MobileTabBar'
import { BottomSheet } from './MobileSeminars'
import { MenuDrawer } from './MobileKategoriyalar'
import { DetailSheet, timeline } from './MobileBuyurtmalar'

const teal = 'text-[#0b6d73]'
const navy = 'text-[#0d2a4a]'
const card = 'rounded-2xl border border-[#e5eef0] bg-white shadow-[0_1px_6px_rgb(11_31_58/0.04)]'
const OPERATOR_TEL = '+998712000000'
const COURIER = { name: 'Azizbek Nurmatov', sub: 'StomaHub kuryeri', photo: '/images/ustalar/usta-jasur.jpg', tel: '+998901234455', rating: 4.9, votes: 320 }
const OPERATOR = { name: 'StomaHub operatori', sub: 'Har kuni 09:00–21:00', icon: Headset, tel: OPERATOR_TEL }
const SHOP = { name: 'StomaHub do‘koni', sub: 'Chilonzor, Bunyodkor shoh ko‘chasi 12', icon: Store, tel: OPERATOR_TEL }
const NOTES = [
  'Buyurtmangiz qabul qilindi.',
  'Sotuvchi mahsulotlarni tayyorlamoqda.',
  'Kuryer buyurtmangizni manzilga olib ketmoqda.',
  'Buyurtma manzilingizga yetkazildi.',
]
const PICKUP_NOTES = ['Buyurtma do‘konda sizni kutmoqda.', 'Buyurtma do‘kondan olib ketildi.']
const ROUTE = 'M84 140 C 104 150, 122 124, 146 116 S 196 112, 214 100 S 262 76, 292 78 S 322 72, 332 64'
const START_P = 0.5
const ETA_MIN = 35

function hero(order) {
  const pickup = order.mode === 'pickup'
  if (order.status === 'cancelled') return ['bekor qilindi', 'Buyurtma bekor qilindi. To‘lov 1–3 ish kunida qaytariladi.']
  if (order.status === 'delivered') return pickup ? ['olib ketildi', 'Buyurtma do‘kondan olib ketildi. Xaridingiz uchun rahmat!'] : ['yetkazildi', 'Buyurtmangiz manzilga yetkazildi. Xaridingiz uchun rahmat!']
  if (order.status === 'shipping') return pickup ? ['tayyor', 'Buyurtmangiz do‘konda tayyor. Istalgan vaqtda olib ketishingiz mumkin.'] : ['yo‘lda', 'Kuryer buyurtmangizni olib ketmoqda. Tez orada yetib boradi.']
  return ['qabul qilindi', 'Buyurtmangiz muvaffaqiyatli qabul qilindi. Tez orada sizga yetkazib beriladi.']
}

function steps(order) {
  const base = timeline(order)
  if (order.status === 'cancelled') {
    return [
      { ...base[0], state: 'done', note: NOTES[0] },
      { label: 'Bekor qilindi', state: 'cancel', time: base[0].time, note: 'Buyurtma bekor qilindi, to‘lov qaytariladi.' },
    ]
  }
  return base.map((s, i) => ({ ...s, note: order.mode === 'pickup' && i >= 2 ? PICKUP_NOTES[i - 2] : NOTES[i] }))
}

export default function MobileKuzatish() {
  const { id } = useParams()
  const navigate = useNavigate()
  const profile = useProfile()
  const { items, add } = useCart()
  const order = allOrders(profile).find((o) => o.id === id)
  const [menu, setMenu] = useState(false)
  const [sheet, setSheet] = useState(null)
  const [chat, setChat] = useState(null)
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const [p, setP] = useState(START_P)

  const live = order?.status === 'shipping' && order.mode !== 'pickup'
  useEffect(() => { window.scrollTo(0, 0) }, [id])
  useEffect(() => {
    if (!live) return undefined
    const t = setInterval(() => setP((v) => Math.min(0.96, v + 0.006)), 5000)
    return () => clearInterval(t)
  }, [live])

  const header = (
    <header className="flex items-center gap-1 px-3 pt-3">
      <button type="button" onClick={() => setMenu(true)} aria-label="Menyu" className={`grid size-10 place-items-center rounded-full ${navy}`}><Menu className="size-6" strokeWidth={1.9} /></button>
      <BrandLogo />
      <div className="ml-auto flex items-center">
        <button type="button" onClick={() => navigate('/buyurtma', { state: { from: 'market' } })} aria-label="Savat" className={`relative grid size-10 place-items-center rounded-full ${navy}`}>
          <ShoppingCart className="size-[22px]" />
          {items.length > 0 && <CountBadge>{items.length}</CountBadge>}
        </button>
        <button type="button" onClick={() => navigate('/profil', { state: { sheet: 'inbox' } })} aria-label="Bildirishnomalar" className={`relative grid size-10 place-items-center rounded-full ${navy}`}>
          <Bell className="size-[22px]" />
          <CountBadge>3</CountBadge>
        </button>
      </div>
    </header>
  )

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f6faf9] pb-[86px]">
        {header}
        <div className="px-6 pt-20 text-center">
          <span className={`mx-auto grid size-16 place-items-center rounded-full bg-[#e3f4f1] ${teal}`}><ReceiptText className="size-8" strokeWidth={1.6} /></span>
          <p className={`mt-3 text-[16px] font-bold ${navy}`}>Buyurtma topilmadi</p>
          <p className="mt-1 text-[12.5px] text-muted">#{id} raqamli buyurtma mavjud emas yoki o‘chirilgan</p>
          <Link to="/profil/buyurtmalar" className="mt-4 inline-flex h-11 items-center rounded-xl bg-[#0b6d73] px-5 text-[14px] font-semibold text-white">Buyurtmalarim</Link>
        </div>
        {menu && <MenuDrawer onClose={() => setMenu(false)} />}
        <MobileTabBar />
      </div>
    )
  }

  const pickup = order.mode === 'pickup'
  const [state, text] = hero(order)
  const bad = order.status === 'cancelled'
  const list = steps(order)
  const minutes = Math.max(2, Math.round((ETA_MIN * (1 - p)) / (1 - START_P)))
  const date = order.at.slice(0, order.at.lastIndexOf(' '))
  const time = order.at.split(' ').pop()
  const own = profile.orders.some((o) => o.id === order.id)
  const canCancel = own && order.status === 'processing'
  const contact = pickup ? SHOP : order.status === 'shipping' || order.status === 'delivered' ? COURIER : OPERATOR
  const extra = order.items.length - 5

  const cancel = () => {
    profileStore.cancelOrder(order.id)
    setSheet(null)
    setToast(`#${order.id} buyurtmasi bekor qilindi`)
  }
  const repeat = () => {
    order.items.forEach((it) => add(it, it.qty))
    navigate('/buyurtma', { state: { from: 'market' } })
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eaf7f5_0%,#f6faf9_26%,#f6faf9_100%)] pb-[86px]">
      {header}

      <div className="px-3">
        <h1 className={`mt-2 text-[26px] font-extrabold leading-tight tracking-tight ${navy}`}>Buyurtmani kuzatish</h1>
        <p className="text-[13px] text-[#7a8a9c]">Buyurtma holatini real vaqtda kuzating.</p>

        <section className={`${card} mt-3 flex items-center gap-2 p-3`}>
          <span className={`grid size-[58px] shrink-0 place-items-center rounded-full ${bad ? 'bg-[#fdecec]' : 'bg-[#dcf1ed]'}`}>
            <span className={`grid size-11 place-items-center rounded-full text-white ${bad ? 'bg-sale' : 'bg-[#0b6d73]'}`}>
              {bad ? <CircleX className="size-6" strokeWidth={2.4} /> : <Check className="size-6" strokeWidth={3} />}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className={`whitespace-nowrap text-[15px] font-bold leading-tight tracking-[-0.01em] ${navy}`}>Buyurtma #{order.id}</p>
            <p className={`text-[15px] font-bold leading-tight ${bad ? 'text-sale' : 'text-[#0b8a7a]'}`}>{state}</p>
            <p className="mt-1 text-[11.5px] leading-snug text-[#7a8a9c]">{text}</p>
          </div>
          <div className="w-[96px] shrink-0 rounded-xl bg-[#e6f5f2] px-1 py-2.5 text-center">
            <CalendarDays className={`mx-auto size-5 ${teal}`} strokeWidth={1.8} />
            <p className="mt-1 whitespace-nowrap text-[10px] text-[#6b7f8e]">Buyurtma sanasi</p>
            <p className={`whitespace-nowrap text-[12.5px] font-semibold ${navy}`}>{date}</p>
            <p className="text-[11.5px] text-[#6b7f8e]">{time}</p>
          </div>
        </section>

        <section className={`${card} mt-2.5 px-3 pb-1 pt-3.5`}>
          <ol>
            {list.map((s, i) => {
              const last = i === list.length - 1
              const nextLit = !last && list[i + 1].state !== 'todo'
              const lit = s.state !== 'todo'
              return (
                <li key={s.label} className="relative grid grid-cols-[30px_minmax(0,1fr)_minmax(0,1.15fr)] gap-x-3 pb-3.5">
                  {!last && <span className={`absolute left-[14px] top-[30px] bottom-[2px] w-[2px] rounded-full ${nextLit ? 'bg-[#0b6d73]' : 'bg-[#d5dee2]'}`} />}
                  <span className="flex justify-center">
                    {s.state === 'done' && <span className="grid size-[26px] place-items-center rounded-full bg-[#0b6d73] text-white"><Check className="size-4" strokeWidth={3} /></span>}
                    {s.state === 'current' && (
                      <span className="grid size-[30px] place-items-center rounded-full border-2 border-[#0b6d73] bg-white ring-4 ring-[#dcf1ed]">
                        <span className="grid size-[20px] place-items-center rounded-full bg-[#0b6d73] text-white">
                          {i === 2 && !pickup ? <Truck className="size-3" strokeWidth={2.4} /> : <span className="size-1.5 animate-pulse rounded-full bg-white" />}
                        </span>
                      </span>
                    )}
                    {s.state === 'cancel' && <span className="grid size-[26px] place-items-center rounded-full bg-sale text-white"><CircleX className="size-4" strokeWidth={2.4} /></span>}
                    {s.state === 'todo' && <span className="size-[26px] rounded-full border-2 border-[#c9d3d8] bg-white" />}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-[14px] font-bold leading-tight ${s.state === 'current' ? 'text-[#0b8a7a]' : s.state === 'cancel' ? 'text-sale' : lit ? navy : 'text-[#8796a5] font-semibold'}`}>{s.label}</span>
                    <span className={`mt-0.5 block text-[12px] ${s.state === 'current' ? 'text-[#0b8a7a]' : 'text-[#7a8a9c]'}`}>{lit ? s.time : 'Kutilmoqda'}</span>
                  </span>
                  <span className="pt-0.5 text-[11.5px] leading-snug text-[#7a8a9c]">{s.note}</span>
                </li>
              )
            })}
          </ol>
        </section>

        <MapCard order={order} p={order.status === 'delivered' ? 1 : p} minutes={minutes} live={live} />

        <section className={`${card} mt-2.5 flex items-center gap-2.5 p-3`}>
          {contact.photo
            ? <img src={contact.photo} alt={contact.name} className="size-[52px] shrink-0 rounded-full object-cover object-[38%_12%]" />
            : <span className={`grid size-[52px] shrink-0 place-items-center rounded-full bg-[#e3f4f1] ${teal}`}><contact.icon className="size-6" strokeWidth={1.7} /></span>}
          <div className="min-w-0 flex-1">
            <p className={`text-[14.5px] font-bold leading-tight ${navy}`}>{contact.name}</p>
            <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-tight text-[#7a8a9c]">{contact.sub}</p>
            {contact.rating && (
              <p className="mt-0.5 flex items-center gap-1 whitespace-nowrap text-[11.5px]">
                <Star className="size-3.5 shrink-0 fill-[#f5b301] text-[#f5b301]" />
                <span className={`font-semibold ${navy}`}>{contact.rating}</span>
                <span className="text-[#7a8a9c]">({contact.votes})</span>
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-1.5">
            <a href={`tel:${contact.tel}`} className={`flex h-10 items-center gap-1 rounded-xl border border-[#0b8a7a]/60 bg-white px-2 text-[12px] font-semibold ${teal} active:scale-[0.98]`}><Phone className="size-[15px]" /> Qo‘ng‘iroq</a>
            <button type="button" onClick={() => setChat(contact)} className={`flex h-10 items-center gap-1 rounded-xl border border-[#0b8a7a]/60 bg-white px-2 text-[12px] font-semibold ${teal} active:scale-[0.98]`}><MessageCircleMore className="size-[15px]" /> Chat</button>
          </div>
        </section>

        <section className={`${card} mt-2.5 p-3`}>
          <div className="flex items-center gap-2">
            <ShoppingBag className={`size-5 ${teal}`} strokeWidth={1.8} />
            <h2 className={`flex-1 text-[14.5px] font-bold ${navy}`}>Mahsulotlar ({order.items.length} ta)</h2>
            <button type="button" onClick={() => setSheet('detail')} className={`flex items-center text-[12.5px] font-semibold ${teal}`}>Batafsil <ChevronRight className="size-4" /></button>
          </div>
          <div className="mt-2.5 grid grid-cols-6 gap-1.5">
            {order.items.slice(0, extra > 0 ? 5 : 6).map((it) => (
              <Link key={it.id} to={`/product/${it.id}`} aria-label={it.name} className="grid aspect-[5/6] place-items-center overflow-hidden rounded-lg bg-[#f2f6f7]">
                <img src={it.image} alt="" loading="lazy" className="size-full object-contain p-0.5" />
              </Link>
            ))}
            {extra > 0 && <button type="button" onClick={() => setSheet('detail')} className="grid aspect-[5/6] place-items-center rounded-lg bg-[#f2f6f7] text-[15px] font-medium text-[#6b7f8e]">+{extra}</button>}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#eef2f4] pt-2.5">
            <span className="text-[13px] text-[#7a8a9c]">Jami summa</span>
            <span className={`whitespace-nowrap text-[16px] font-extrabold ${navy}`}>{som(order.total)}</span>
          </div>
        </section>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <button type="button" onClick={() => setSheet('help')} className={`flex h-12 items-center justify-center gap-2 rounded-xl border border-[#0b8a7a]/60 bg-white text-[14px] font-semibold ${teal} active:scale-[0.98]`}><Headset className="size-5" strokeWidth={1.8} /> Yordam</button>
          <button type="button" onClick={() => navigate('/profil/buyurtmalar')} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white shadow-[0_6px_16px_rgb(11_109_115/0.25)] active:scale-[0.98]"><ReceiptText className="size-5" strokeWidth={1.8} /> Buyurtmalarim</button>
        </div>
      </div>

      {sheet === 'detail' && (
        <DetailSheet order={order} canCancel={canCancel} onCancel={cancel} onTrack={() => setSheet(null)} onRepeat={repeat} onClose={() => setSheet(null)} />
      )}
      {sheet === 'help' && (
        <HelpSheet
          canCancel={canCancel}
          onChat={() => { setSheet(null); setChat(OPERATOR) }}
          onCancel={() => setSheet('cancel')}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'cancel' && (
        <BottomSheet
          title="Buyurtmani bekor qilasizmi?"
          onClose={() => setSheet(null)}
          footer={
            <>
              <button type="button" onClick={() => setSheet(null)} className={`h-12 flex-1 rounded-xl border border-[#e2ebee] text-[14px] font-semibold ${navy}`}>Yo‘q</button>
              <button type="button" onClick={cancel} className="h-12 flex-1 rounded-xl bg-sale text-[14px] font-semibold text-white">Ha, bekor qilish</button>
            </>
          }
        >
          <p className="mt-1 text-[13px] text-ink-2">#{order.id} buyurtmasi bekor qilinadi. To‘langan summa 1–3 ish kunida qaytariladi.</p>
        </BottomSheet>
      )}
      {chat && <ChatSheet contact={chat} minutes={live ? minutes : null} onClose={() => setChat(null)} />}
      {menu && <MenuDrawer onClose={() => setMenu(false)} />}

      <MobileToast text={toast} onClose={closeToast} />
      <MobileTabBar />
    </div>
  )
}

function MapCard({ order, p, minutes, live }) {
  const pathRef = useRef(null)
  const [pt, setPt] = useState({ x: 214, y: 100 })
  const pickup = order.mode === 'pickup'
  const status = order.status
  const moving = !pickup && (status === 'shipping' || status === 'delivered')

  useLayoutEffect(() => {
    const path = pathRef.current
    if (!path) return
    const pos = path.getPointAtLength(path.getTotalLength() * p)
    setPt({ x: pos.x, y: pos.y })
  }, [p])

  const chip = pickup
    ? [Store, status === 'delivered' ? 'Olib ketildi' : status === 'shipping' ? 'Olib ketishga tayyor' : 'Tayyorlanmoqda', 'Olib ketish joyi', 'Chilonzor filiali']
    : status === 'shipping' ? [Truck, 'Kuryer yo‘lda', 'Taxminiy vaqt', `${minutes} daqiqa`]
      : status === 'delivered' ? [House, 'Yetkazildi', 'Yetkazilgan vaqt', timeline(order)[3].time.split(', ').pop()]
        : status === 'cancelled' ? [CircleX, 'Bekor qilindi', 'Yetkazish', 'To‘xtatildi']
          : [Store, 'Tayyorlanmoqda', 'Kuryerga topshirish', '~1 soat']
  const [ChipIcon, chipTitle, chipSub, chipValue] = chip

  return (
    <section className={`${card} relative mt-2.5 h-[178px] overflow-hidden`} aria-label="Yetkazish xaritasi">
      <svg viewBox="0 0 360 178" preserveAspectRatio="xMidYMid slice" className={`absolute inset-0 size-full ${status === 'cancelled' ? 'grayscale' : ''}`} aria-hidden="true">
        <rect width="360" height="178" fill="#eaf0ef" />
        <path d="M150 -5 L205 -5 L190 60 L140 64 Z" fill="#e2eae8" />
        <path d="M250 110 L330 102 L350 178 L262 178 Z" fill="#e2eae8" />
        <path d="M10 20 C 40 10, 70 30, 60 60 C 40 70, 15 55, 10 20 Z" fill="#d7ecdc" />
        <path d="M268 8 C 300 2, 330 14, 322 34 C 300 44, 272 34, 268 8 Z" fill="#d7ecdc" />
        <g fill="none" stroke="#ffffff" strokeLinecap="round">
          <path d="M-10 42 C 70 30, 160 58, 370 26" strokeWidth="9" />
          <path d="M-10 102 C 90 96, 170 88, 370 92" strokeWidth="5" />
          <path d="M126 -10 C 116 60, 96 120, 70 190" strokeWidth="6" />
          <path d="M226 -10 C 222 60, 232 120, 246 190" strokeWidth="8" />
          <path d="M296 -10 C 300 60, 312 120, 340 190" strokeWidth="5" />
          <path d="M40 190 L 360 112" strokeWidth="11" />
          <path d="M-10 150 C 40 140, 90 160, 130 176" strokeWidth="4" />
          <path d="M170 -10 L 182 190" strokeWidth="3" />
          <path d="M-10 74 L 120 70" strokeWidth="3" />
          <path d="M240 60 L 370 54" strokeWidth="3" />
        </g>
        <text x="206" y="48" fontSize="10" fill="#8a9aa4">Yunusobod</text>
        <text x="314" y="150" fontSize="10" fill="#8a9aa4">Minor</text>
        <text x="150" y="168" fontSize="8.5" fill="#8a9aa4" transform="rotate(-13.7 150 168)">Amir Temur ko‘chasi</text>

        {!pickup && (
          <>
            <path d={ROUTE} fill="none" stroke="#0b6d73" strokeOpacity={moving ? 0.25 : 0.5} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={moving ? undefined : '6 6'} />
            {moving && <path ref={pathRef} d={ROUTE} fill="none" stroke="#0b6d73" strokeWidth="3.5" strokeLinecap="round" pathLength="1" strokeDasharray={`${p} 1`} />}
            {!moving && <path ref={pathRef} d={ROUTE} fill="none" stroke="none" />}
          </>
        )}

        <circle cx={pickup ? 180 : 84} cy={pickup ? 118 : 140} r="5" fill="#0b6d73" stroke="#fff" strokeWidth="2" />
        <circle cx={pickup ? 180 : 84} cy={pickup ? 92 : 116} r="14" fill="#fff" stroke="#cfe3e0" strokeWidth="1.5" />
        <Store x={(pickup ? 180 : 84) - 8} y={(pickup ? 92 : 116) - 8} width="16" height="16" color="#0b6d73" strokeWidth={2} />

        {!pickup && (
          <>
            <circle cx="332" cy="64" r="5" fill="#0b6d73" stroke="#fff" strokeWidth="2" />
            <circle cx="332" cy="38" r="15" fill="#fff" stroke="#0b6d73" strokeWidth="2" />
            <House x="324" y="30" width="16" height="16" color="#0b6d73" strokeWidth={2} />
          </>
        )}

        {moving && status !== 'delivered' && (
          <g style={{ transition: 'transform 1.2s ease' }} transform={`translate(${pt.x} ${pt.y})`}>
            {live && <circle r="18" fill="#0b6d73" opacity="0.15"><animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite" /></circle>}
            <rect x="-14" y="-14" width="28" height="28" rx="8" fill="#0b6d73" stroke="#fff" strokeWidth="2" />
            <Truck x="-8" y="-8" width="16" height="16" color="#fff" strokeWidth={2.2} />
          </g>
        )}
      </svg>

      <div className="absolute left-2.5 top-2.5 flex max-w-[62%] items-center gap-2.5 rounded-xl bg-white/95 px-3 py-2 shadow-[0_4px_14px_rgb(11_31_58/0.1)]">
        <ChipIcon className={`size-8 shrink-0 ${status === 'cancelled' ? 'text-sale' : teal}`} strokeWidth={1.6} />
        <div className="min-w-0">
          <p className={`truncate text-[12px] font-semibold ${status === 'cancelled' ? 'text-sale' : 'text-[#0b8a7a]'}`}>{chipTitle}</p>
          <p className="truncate text-[11px] text-[#7a8a9c]">{chipSub}</p>
          <p className={`truncate text-[19px] font-extrabold leading-tight ${status === 'cancelled' ? 'text-sale' : teal}`} aria-live={live ? 'polite' : undefined}>{chipValue}</p>
        </div>
      </div>
    </section>
  )
}

function HelpSheet({ canCancel, onChat, onCancel, onClose }) {
  const row = `flex w-full items-center gap-3 rounded-xl px-1 py-3 text-left active:bg-[#f3f8f8]`
  const ico = `grid size-10 shrink-0 place-items-center rounded-full bg-[#e3f4f1] ${teal}`
  return (
    <BottomSheet title="Yordam" onClose={onClose}>
      <div className="mt-1 divide-y divide-[#eef2f4]">
        <a href={`tel:${OPERATOR_TEL}`} className={row}>
          <span className={ico}><Phone className="size-[18px]" /></span>
          <span className="min-w-0 flex-1"><span className={`block text-[14px] font-semibold ${navy}`}>Operatorga qo‘ng‘iroq</span><span className="block text-[11.5px] text-muted">+998 71 200 00 00 · 09:00–21:00</span></span>
        </a>
        <button type="button" onClick={onChat} className={row}>
          <span className={ico}><MessagesSquare className="size-[18px]" /></span>
          <span className="min-w-0 flex-1"><span className={`block text-[14px] font-semibold ${navy}`}>Operator bilan chat</span><span className="block text-[11.5px] text-muted">Odatda 2 daqiqada javob beramiz</span></span>
        </button>
        <a href="https://t.me/stomahub" target="_blank" rel="noreferrer" className={row}>
          <span className={ico}><SendHorizontal className="size-[18px]" /></span>
          <span className="min-w-0 flex-1"><span className={`block text-[14px] font-semibold ${navy}`}>Telegram orqali yozish</span><span className="block text-[11.5px] text-muted">@stomahub</span></span>
        </a>
        {canCancel && (
          <button type="button" onClick={onCancel} className={row}>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#fdecec] text-sale"><CircleX className="size-[18px]" /></span>
            <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-sale">Buyurtmani bekor qilish</span><span className="block text-[11.5px] text-muted">Faqat tayyorlanayotgan buyurtmalar uchun</span></span>
          </button>
        )}
      </div>
    </BottomSheet>
  )
}

const QUICK = ['Yaxshi, kutaman', 'Eshik oldida qoldiring', 'Qachon yetib kelasiz?']
const QUICK_OPERATOR = ['Buyurtma qachon keladi?', 'Manzilni o‘zgartirmoqchiman', 'To‘lov bo‘yicha savol']

function ChatSheet({ contact, minutes, onClose }) {
  const courier = contact === COURIER
  const first = courier
    ? `Assalomu alaykum! Men ${contact.name.split(' ')[0]}, buyurtmangizni olib kelyapman.${minutes ? ` Taxminan ${minutes} daqiqada yetib boraman.` : ''}`
    : `Assalomu alaykum! ${contact.name}. Sizga qanday yordam bera olaman?`
  const [msgs, setMsgs] = useState([{ me: false, text: first }])
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef(null)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [msgs, typing])

  const send = (value) => {
    const v = value.trim()
    if (!v) return
    setMsgs((m) => [...m, { me: true, text: v }])
    setText('')
    setTyping(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const reply = /qachon|qancha|vaqt/i.test(v) && minutes
        ? courier ? `Taxminan ${minutes} daqiqada yetib boraman.` : `Kuryer taxminan ${minutes} daqiqada yetib boradi.`
        : courier ? 'Tushunarli, rahmat! Yetib borganimda qo‘ng‘iroq qilaman.' : 'Rahmat, so‘rovingiz qabul qilindi. Tez orada aniqlab beramiz.'
      setMsgs((m) => [...m, { me: false, text: reply }])
      setTyping(false)
    }, 1300)
  }

  return (
    <BottomSheet
      title={contact.name}
      onClose={onClose}
      footer={
        <form onSubmit={(e) => { e.preventDefault(); send(text) }} className="flex flex-1 items-center gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Xabar yozing…" aria-label="Xabar" className="h-12 min-w-0 flex-1 rounded-xl border border-[#e2ebee] bg-[#f6faf9] px-3.5 text-[14px] outline-none focus:border-[#0b6d73]" />
          <button type="submit" disabled={!text.trim()} aria-label="Yuborish" className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#0b6d73] text-white disabled:opacity-40"><SendHorizontal className="size-5" /></button>
        </form>
      }
    >
      <div className="mt-1 flex items-center gap-2.5">
        {contact.photo
          ? <img src={contact.photo} alt="" className="size-9 rounded-full object-cover object-[38%_12%]" />
          : <span className={`grid size-9 place-items-center rounded-full bg-[#e3f4f1] ${teal}`}>{contact.icon ? <contact.icon className="size-[18px]" /> : <UserRound className="size-[18px]" />}</span>}
        <span className="text-[12px] text-[#16a34a]">● Onlayn</span>
      </div>
      <div className="mt-3 flex min-h-[180px] flex-col gap-2">
        {msgs.map((m, i) => (
          <p key={i} className={`max-w-[80%] rounded-2xl px-3 py-2 text-[13.5px] leading-snug ${m.me ? 'self-end rounded-br-md bg-[#0b6d73] text-white' : `self-start rounded-bl-md bg-[#eef4f4] ${navy}`}`}>{m.text}</p>
        ))}
        {typing && <p className="self-start rounded-2xl rounded-bl-md bg-[#eef4f4] px-3 py-2 text-[13px] text-muted">yozmoqda…</p>}
        <span ref={endRef} />
      </div>
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
        {(courier ? QUICK : QUICK_OPERATOR).map((q) => (
          <button key={q} type="button" onClick={() => send(q)} className={`h-8 shrink-0 rounded-full border border-[#cfe3e0] bg-white px-3 text-[12.5px] font-medium ${teal}`}>{q}</button>
        ))}
      </div>
    </BottomSheet>
  )
}
