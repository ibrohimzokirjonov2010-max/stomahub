import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { canReview, RatedBadge, ReviewDialog, useMyReviews } from '../OrderReview'
import EscrowActions, { PayStatusPill } from '../EscrowActions'
import { som } from '../../marketData'
import { profileStore } from '../../profileStore'
import { Link } from 'react-router-dom'
import { groupOrderItems, orderHref, orderShopSummary } from '../../lib/orderShops'
import { ORDER_PILL, OrderDetailPanel, OrderHoverCard, OrderThumbs, ShopLink } from './OrderVisuals'

const card = 'rounded-2xl border border-[#e6eef2] bg-white p-4 shadow-[0_1px_2px_rgb(15_30_50/0.03)]'

function SectionHead({ title, action, onAction }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-[16px] font-extrabold text-[#12263a]">{title}</h2>
      {action && (
        <button type="button" onClick={onAction} className="text-[13px] font-semibold text-[#0F766E] hover:underline">{action}</button>
      )}
    </div>
  )
}

function Empty({ text }) {
  return <p className="rounded-xl border border-dashed border-[#d5ebe6] px-4 py-8 text-center text-[13px] text-[#6b7c8f]">{text}</p>
}

function useCanHover() {
  const forced = () => typeof window !== 'undefined' && !!window.__STOMAHUB_SHOT_OWNER__
  const [on, setOn] = useState(forced)
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setOn(mq.matches || forced())
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return on
}

function OrderRow({ order, reviews, onRate }) {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(false)
  const canHover = useCanHover()
  const rowRef = useRef(null)
  const timer = useRef(null)
  const tone = ORDER_PILL[order.status] || ORDER_PILL.processing
  const href = orderHref(order)
  const summary = orderShopSummary(order)
  const groups = groupOrderItems(order)
  const singleShop = groups.length === 1 ? groups[0] : null

  useEffect(() => () => clearTimeout(timer.current), [])

  const arm = () => {
    if (!canHover || open) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setHover(true), 160)
  }
  const disarm = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setHover(false), 140)
  }
  const toggle = () => {
    setHover(false)
    setOpen((v) => !v)
  }
  const onRowClick = (e) => {
    if (e.target.closest('a, button, input, textarea, select, label')) return
    toggle()
  }

  const next = canReview(order) ? (order.items || []).find((it) => !reviews.ratingOf(order, it)) : null
  const first = order.items?.[0]

  return (
    <li
      ref={rowRef}
      data-order={order.id}
      onMouseEnter={arm}
      onMouseLeave={disarm}
      onClick={onRowClick}
      className={`relative cursor-pointer py-3 ${open ? 'rounded-xl bg-[#f6fbfa] px-2' : 'hover:bg-[#f8fcfb]'}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <OrderThumbs items={order.items} />
        <div className="min-w-0 flex-1">
          {href
            ? <Link to={href} className="block truncate text-[13.5px] font-bold text-[#12263a] hover:text-[#0F766E]"># {order.id}</Link>
            : <p className="truncate text-[13.5px] font-bold text-[#12263a]"># {order.id}</p>}
          <p className="text-[12px] text-[#6b7c8f]">{order.at}</p>
          <p className="truncate text-[12px] font-semibold text-[#0F766E]">
            {singleShop ? <ShopLink sellerId={singleShop.sellerId} shopName={singleShop.shopName} /> : summary}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[13px] font-bold text-[#12263a]">{som(order.total || order.goods || 0)}</p>
          <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{order.statusLabel || order.status}</span>
          <div className="mt-1"><PayStatusPill order={order} /></div>
        </div>
        {next
          ? <button type="button" onClick={() => onRate({ order, item: next })} className="shrink-0 rounded-lg border border-[#f5c56b] bg-[#fff8eb] px-3 py-1.5 text-[12px] font-semibold text-[#92400e]">★ Baholash</button>
          : first && canReview(order) ? <span className="shrink-0"><RatedBadge rating={reviews.ratingOf(order, first)} /></span> : null}
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? 'Tafsilotni yopish' : 'Tafsilotni ochish'}
          onClick={toggle}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-[#0F766E] hover:bg-[#e7f6f4]"
        >
          <ChevronDown className={`size-4 transition ${open ? 'rotate-180' : ''}`} />
        </button>
        <EscrowActions order={order} compact />
      </div>
      {open && (
        <div className="mt-2">
          <OrderDetailPanel order={order} />
        </div>
      )}
      {canHover && (
        <OrderHoverCard anchorRef={rowRef} open={hover && !open} onEnter={arm} onLeave={disarm}>
          <OrderDetailPanel order={order} className="border-0 bg-white shadow-none" />
        </OrderHoverCard>
      )}
    </li>
  )
}

export default function OrdersBlock({ orders, status, error, full }) {
  const reviews = useMyReviews()
  const [rate, setRate] = useState(null)
  const [thanks, setThanks] = useState('')
  return (
    <section id={full ? 'buyurtmalarim' : undefined} className={card}>
      <SectionHead title={full ? 'Buyurtmalarim' : 'Oxirgi buyurtmalar'} action={full ? null : 'Barchasi'} onAction={() => {}} />
      {status === 'loading' && !orders.length && <p className="py-6 text-center text-[13px] text-[#6b7c8f]">Yuklanmoqda…</p>}
      {status === 'error' && (
        <p role="alert" className="rounded-xl bg-[#fff4f4] px-3 py-2 text-[13px] text-[#b42318]">
          {error} <button type="button" className="ml-2 font-semibold text-[#0F766E]" onClick={() => profileStore.refreshOrders()}>Qayta urinish</button>
        </p>
      )}
      {status !== 'loading' && status !== 'error' && !orders.length && <Empty text="Hali buyurtma yo‘q." />}
      <ul className="divide-y divide-[#eef3f2]">
        {(orders || []).map((o) => <OrderRow key={o.dbId || o.id} order={o} reviews={reviews} onRate={setRate} />)}
      </ul>
      {thanks && <p role="status" className="mt-2 rounded-xl bg-[#e5f6ec] px-3 py-2 text-[12.5px] font-medium text-[#15803d]">{thanks}</p>}
      {rate && <ReviewDialog order={rate.order} item={rate.item} onClose={() => setRate(null)} onDone={(r) => { reviews.mark(rate.order, rate.item, r); setRate(null); setThanks('Rahmat! Bahoingiz yuborildi') }} />}
    </section>
  )
}
