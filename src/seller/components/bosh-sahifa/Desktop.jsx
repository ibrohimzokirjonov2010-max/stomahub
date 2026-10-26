import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, FileText, Wallet, Clock, ArrowRight, Ellipsis, EllipsisVertical, Plus, ChevronDown, Box, Users, ChartLine, Coins, Store, Star, PackageCheck, Tag, Megaphone, House } from 'lucide-react'
import { dmy, maskPhone, som, num, itemsLabel } from '../../format'
import StatusBadge from './StatusBadge'
import ProductThumb from './ProductThumb'
import Empty from '../shell/Empty'

const card = 'rounded-2xl border border-[#E6EEF0] bg-white shadow-[0_1px_3px_rgb(16_40_48/0.04)]'

export function Greeting({ shop, openQuick }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const off = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', off)
    return () => document.removeEventListener('mousedown', off)
  }, [])
  const pick = (k) => { setOpen(false); openQuick(k) }
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-[34px] font-extrabold leading-tight tracking-tight text-[#10283F]">Salom, {shop}!</h1>
        <p className="mt-1 text-[16px] text-[#4A5A6A]">Bugun ham muvaffaqiyatli savdo qilishingizni tilaymiz.</p>
      </div>
      <div ref={ref} className="relative mt-1">
        <div className="flex h-[44px] overflow-hidden rounded-[10px] bg-[#0F766E] text-white shadow-[0_6px_16px_rgb(15_118_110/0.25)]">
          <button type="button" onClick={() => openQuick('menu')} className="flex items-center gap-3 pl-5 pr-3 text-[15px] font-semibold hover:bg-[#115E59]"><Plus className="size-5" />Tezkor amal</button>
          <button type="button" aria-label="Tezkor amallar ro‘yxati" onClick={() => setOpen((v) => !v)} className="px-3 hover:bg-[#115E59]"><ChevronDown className="size-5" /></button>
        </div>
        {open && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-[186px] rounded-xl border border-[#E6EEF0] bg-white py-1.5 shadow-[0_12px_32px_rgb(8_40_45/0.12)]">
            {[['product', House, 'Mahsulot qo‘shish'], ['discount', Tag, 'Chegirma yaratish'], ['campaign', Megaphone, 'Reklama ishga tushirish']].map(([k, Icon, l]) => (
              <button key={k} type="button" onClick={() => pick(k)} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] text-[#10283F] hover:bg-[#F0FDFA]"><Icon className="size-4" />{l}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function StatCards({ stats }) {
  const items = [
    { icon: ShoppingCart, label: 'Bugungi buyurtmalar', value: stats.today, link: '/sotuvchi/buyurtmalar', linkText: 'Barchasini ko‘rish', center: true },
    { icon: FileText, label: 'Yangi buyurtmalar', value: stats.fresh, link: '/sotuvchi/buyurtmalar?holat=yangi', linkText: 'Barchasini ko‘rish', center: true },
    { icon: Wallet, label: 'Hamyon balansi', value: som(stats.balance), sub: 'Mavjud mablag‘', link: '/sotuvchi/hamyon', linkText: 'Hamyonni ochish' },
    { icon: Clock, label: 'Kutilayotgan to‘lov', value: som(stats.pending), sub: 'Komissiya: 12% (naqd savdo)', link: '/sotuvchi/hamyon', linkText: 'Batafsil' },
  ]
  return (
    <div className="grid grid-cols-4 gap-4">
      {items.map((it) => (
        <div key={it.label} className={`${card} flex min-h-[142px] gap-4 p-5`}>
          <span className="grid size-[52px] shrink-0 place-items-center rounded-xl bg-[#E3F4F2] text-[#0F766E]"><it.icon className="size-7" strokeWidth={1.8} /></span>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="text-[14px] text-[#3D4E5F]">{it.label}</div>
            <div className="mt-1 whitespace-nowrap text-[clamp(18px,1.55vw,24px)] font-extrabold tracking-tight text-[#10283F]">{it.value}</div>
            {it.sub && <div className="text-[13px] text-[#5C6E80]">{it.sub}</div>}
            <Link to={it.link} className={`mt-auto inline-flex items-center gap-2 pt-3 text-[14px] font-semibold text-[#0F766E] hover:text-[#115E59] ${it.center ? 'self-center' : ''}`}>{it.linkText}<ArrowRight className="size-4" /></Link>
          </div>
        </div>
      ))}
    </div>
  )
}

function CardHead({ title, to, link = 'Barchasini ko‘rish' }) {
  return (
    <div className="flex items-center justify-between px-5 pb-3 pt-5">
      <h2 className="text-[19px] font-bold tracking-tight text-[#10283F]">{title}</h2>
      {to && <Link to={to} className="inline-flex items-center gap-2 text-[13.5px] font-medium text-[#0F766E] hover:text-[#115E59]">{link}<ArrowRight className="size-4" /></Link>}
    </div>
  )
}

export function RecentOrders({ orders, onOpen }) {
  return (
    <section className={card}>
      <CardHead title="So‘nggi buyurtmalar" to="/sotuvchi/buyurtmalar" />
      <div className="px-5 pb-5">
        <div className="grid grid-cols-[72px_76px_84px_minmax(0,1fr)_104px_108px_28px] gap-x-1.5 whitespace-nowrap items-center rounded-lg bg-[#F4F7F8] px-3 py-2.5 text-[12px] font-medium text-[#3D4E5F]">
          <span>#</span><span>Sana</span><span>Mahsulotlar</span><span>Mijoz</span><span>Summa</span><span className="text-center">Holat</span><span className="text-right">Amallar</span>
        </div>
        {orders.length === 0 ? (
          <Empty icon={FileText} title="Hozircha buyurtmalar yo‘q" text="Mijozlar buyurtma berganda ular shu yerda ko‘rinadi." />
        ) : orders.map((o) => (
          <div key={o.id} role="button" tabIndex={0} onClick={() => onOpen(o.id)} onKeyDown={(e) => e.key === 'Enter' && onOpen(o.id)}
            className="grid cursor-pointer grid-cols-[72px_76px_84px_minmax(0,1fr)_104px_108px_28px] gap-x-1.5 whitespace-nowrap items-center border-b border-[#EEF3F4] px-3 py-[13px] text-[12.5px] text-[#1F2A3C] last:border-0 hover:bg-[#F0FDFA]">
            <span className="font-medium">{o.code}</span>
            <span className="text-[#5C6E80]">{dmy(o.created_at)}</span>
            <span className="text-[#5C6E80]">{itemsLabel(o.items.length)}</span>
            <span className="truncate text-[#5C6E80]">{o.customer_phone ? maskPhone(o.customer_phone) : '—'}</span>
            <span>{som(o.subtotal)}</span>
            <span className="text-center"><StatusBadge status={o.status} className="min-w-[96px]" /></span>
            <span className="flex justify-end"><Ellipsis className="size-5" /></span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function LowStock({ products }) {
  return (
    <section className={card}>
      <CardHead title="Stokdagi kam mahsulotlar" to="/sotuvchi/mahsulotlar?stok=kam" />
      <div className="px-3 pb-4">
        <div className="grid grid-cols-[1fr_70px_90px] rounded-lg bg-[#F4F7F8] px-3 py-2.5 text-[12px] font-medium text-[#3D4E5F]"><span>Mahsulot</span><span>Stok</span><span>Amallar</span></div>
        {products.length === 0 ? (
          <Empty icon={PackageCheck} title="Kam qolgan mahsulot yo‘q" text="Omborda 10 tadan kam qolgan mahsulotlar shu yerda ko‘rinadi." />
        ) : products.map((p) => (
          <div key={p.id} className="grid grid-cols-[1fr_70px_90px] items-center border-b border-[#EEF3F4] px-3 py-1.5 last:border-0">
            <span className="flex min-w-0 items-center gap-4"><ProductThumb src={p.image_url} className="h-[30px] w-[42px] rounded-md" /><span className="truncate text-[12.5px]">{p.name}</span></span>
            <span className="text-[12.5px]">{p.stock} ta</span>
            <Link to={`/sotuvchi/mahsulotlar?tahrir=${p.id}`} className="inline-flex h-[30px] items-center justify-center rounded-md border border-[#0F766E] text-[12.5px] font-medium text-[#0F766E] hover:bg-[#F0FDFA]">Tahrirlash</Link>
          </div>
        ))}
      </div>
    </section>
  )
}

export function Stars({ value, size = 'size-[15px]' }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={size} strokeWidth={1.5} fill={i <= value ? '#0F766E' : '#D5DEE0'} color={i <= value ? '#0F766E' : '#D5DEE0'} />)}
    </span>
  )
}

export function RecentReviews({ reviews, products }) {
  const byId = Object.fromEntries(products.map((p) => [p.id, p]))
  return (
    <section className={card}>
      <CardHead title="So‘nggi sharhlar" to="/sotuvchi/sharhlar" />
      <div className="px-5 pb-4">
        {reviews.length === 0 ? (
          <Empty icon={Star} title="Hozircha sharhlar yo‘q" text="Xaridorlar yetkazilgan buyurtmaga baho qoldirganda bu yerda ko‘rinadi." />
        ) : reviews.map((r) => {
          const p = byId[r.product_id]
          return (
            <div key={r.id} className="flex items-center gap-3 border-b border-[#EEF3F4] py-2 last:border-0">
              <ProductThumb src={p?.image_url} className="size-10" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-medium">{p?.name || 'Mahsulot'}</div>
                <Stars value={r.rating} />
                <div className="truncate text-[11.5px] text-[#5C6E80]">{r.body}</div>
              </div>
              <span className="text-[12px] text-[#5C6E80]">{dmy(r.created_at)}</span>
              <Link to="/sotuvchi/sharhlar" aria-label="Sharh amallari" className="ml-3 p-1"><EllipsisVertical className="size-5" /></Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function SalesActivity({ stats }) {
  const rows = [
    [Box, 'Faol mahsulotlar', `${stats.activeProducts} ta`],
    [Users, 'Jami mijozlar', `${stats.customers} ta`],
    [FileText, 'Jami buyurtmalar', `${stats.totalOrders} ta`],
    [ChartLine, 'Jami daromad', som(stats.revenue)],
  ]
  return (
    <section className={card}>
      <CardHead title="Savdo va faoliyat" />
      <div className="mx-3 mb-4 rounded-xl border border-[#EEF3F4]">
        {rows.map(([Icon, l, v]) => (
          <div key={l} className="flex items-center gap-3 border-b border-[#EEF3F4] px-3 py-[9px] last:border-0">
            <Icon className="size-5 text-[#0F766E]" strokeWidth={1.8} />
            <span className="flex-1 text-[12.5px] text-[#3D4E5F]">{l}</span>
            <span className="text-[13.5px] font-bold">{v}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function InfoCards() {
  return (
    <section className={card}>
      <CardHead title="Ma’lumot" />
      <div className="space-y-3 px-3 pb-4">
        <div className="flex gap-3 rounded-xl border border-[#EEF3F4] p-3">
          <span className="grid size-[52px] shrink-0 place-items-center rounded-xl bg-[#E3F4F2] text-[#0F766E]"><Coins className="size-7" strokeWidth={1.7} /></span>
          <div className="text-[12px] leading-relaxed text-[#3D4E5F]"><div className="text-[13px] font-semibold text-[#0F766E]">Komissiya</div>Naqd / joyida to‘lov bilan amalga oshirilgan har bir buyurtma uchun StomaHub komissiyasi 12% ni tashkil qiladi.</div>
        </div>
        <div className="flex gap-3 rounded-xl border border-[#EEF3F4] p-3">
          <span className="grid size-[52px] shrink-0 place-items-center rounded-xl bg-[#E3F4F2] text-[#0F766E]"><Store className="size-7" strokeWidth={1.7} /></span>
          <div className="text-[12px] leading-relaxed text-[#3D4E5F]"><div className="text-[13px] font-semibold text-[#10283F]">Himoyalangan to‘lov <span className="ml-1 rounded bg-[#EEF2F3] px-1.5 py-0.5 text-[11.5px] font-medium text-[#3D4E5F]">Tez kunda</span></div>Xaridor va sotuvchi uchun xavfsiz bitim xizmati tez orada ishga tushiriladi.</div>
        </div>
      </div>
    </section>
  )
}

export { card, num }
