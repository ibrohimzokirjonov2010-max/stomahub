import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ChevronRight, Package, Store } from 'lucide-react'
import { som } from '../../marketData'
import { PayStatusPill } from '../EscrowActions'
import {
  deliveryModeLabel, groupOrderItems, orderHref, payMethodLabel, productHref, shopHref, thumbPreview,
} from '../../lib/orderShops'

export const ORDER_PILL = {
  shipping: 'bg-[#e8f1fc] text-[#1f6fd1]',
  processing: 'bg-[#fff4d6] text-[#b45309]',
  delivered: 'bg-[#e5f6ec] text-[#15803d]',
  cancelled: 'bg-[#fde8e8] text-[#b42318]',
}

function Cover({ src, alt = '', icon = 'size-5' }) {
  const [bad, setBad] = useState(!src)
  if (bad) {
    return (
      <span className={`grid size-full place-items-center bg-[#e7f6f4] text-[#0F766E]`}>
        <Package className={icon} strokeWidth={1.7} />
      </span>
    )
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setBad(true)} className="size-full object-cover" />
}

/** 64px rasm: bitta mahsulot to‘liq, bir nechta bo‘lsa ustma-ust va +N. */
export function OrderThumbs({ items }) {
  const { shown, extra, total } = thumbPreview(items, 3)
  if (!total) {
    return (
      <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#e7f6f4] text-[#0F766E] ring-1 ring-[#d7ebe7]">
        <Package className="size-6" strokeWidth={1.7} />
      </span>
    )
  }
  if (shown.length === 1 && extra === 0) {
    return (
      <span className="grid size-16 shrink-0 overflow-hidden rounded-xl bg-[#eef6f5] ring-1 ring-[#d7ebe7]">
        <Cover src={shown[0].image} alt="" />
      </span>
    )
  }
  const step = 40
  const width = 64 + (shown.length - 1) * step
  return (
    <span className="relative block shrink-0" style={{ width, height: 64 }} aria-hidden="true">
      {shown.map((it, i) => (
        <span
          key={it.itemId || `${it.id}-${i}`}
          className="absolute top-0 grid size-16 overflow-hidden rounded-xl bg-[#eef6f5] ring-2 ring-white"
          style={{ left: i * step, zIndex: i + 1 }}
        >
          <Cover src={it.image} alt="" />
        </span>
      ))}
      {extra > 0 && (
        <span
          className="absolute z-10 grid h-5 min-w-5 place-items-center rounded-full bg-[#0F766E] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white"
          style={{ left: (shown.length - 1) * step + 42, top: 44 }}
        >
          +{extra}
        </span>
      )}
    </span>
  )
}

export function ShopLink({ sellerId, shopName, className = '' }) {
  const href = shopHref(sellerId)
  const cls = `font-semibold text-[#0F766E] hover:underline ${className}`
  if (!href) return <span className={cls}>{shopName}</span>
  return <Link to={href} className={cls}>{shopName}</Link>
}

export function OrderDetailPanel({ order, className = '' }) {
  const groups = groupOrderItems(order)
  const tone = ORDER_PILL[order.status] || ORDER_PILL.processing
  const href = orderHref(order)
  const total = order.total || order.goods || 0
  return (
    <div className={`rounded-xl border border-[#d7ebe7] bg-[#f7fbfb] p-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-[#5b6b7d]">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{order.statusLabel || 'Tayyorlanmoqda'}</span>
        <PayStatusPill order={order} />
        <span>Yetkazish: <b className="font-semibold text-[#12263a]">{deliveryModeLabel(order.mode)}</b></span>
        <span>To‘lov: <b className="font-semibold text-[#12263a]">{payMethodLabel(order.method)}</b></span>
        <span>{order.at}</span>
      </div>

      <div className="mt-3 space-y-3">
        {groups.map((g) => (
          <div key={`${g.sellerId}-${g.shopName}`}>
            <p className="flex items-center gap-1.5 text-[12.5px] text-[#5b6b7d]">
              <Store className="size-3.5 shrink-0 text-[#0F766E]" />
              Do‘kon: <ShopLink sellerId={g.sellerId} shopName={g.shopName} />
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {g.items.map((it, i) => {
                const to = productHref(it.id)
                const name = <span className="line-clamp-2 text-[13px] font-semibold text-[#12263a]">{it.name}</span>
                return (
                  <li key={it.itemId || `${it.id}-${i}`} className="flex items-center gap-2.5 rounded-xl bg-white p-1.5 ring-1 ring-[#e7f1ef]">
                    <span className="grid size-14 shrink-0 overflow-hidden rounded-xl bg-[#eef6f5]">
                      <Cover src={it.image} alt={it.name || ''} icon="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      {to ? <Link to={to} className="hover:text-[#0F766E]">{name}</Link> : name}
                      {it.type ? <p className="truncate text-[11.5px] text-[#6b7c8f]">{it.type}</p> : null}
                      <p className="text-[12px] text-[#5b6b7d]">{it.qty || 1} × {som(it.price)}</p>
                    </div>
                    <span className="shrink-0 text-[13px] font-bold text-[#12263a]">{som((it.price || 0) * (it.qty || 1))}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-1 border-t border-[#e3eeec] pt-2 text-[12.5px] text-[#5b6b7d]">
        {order.fee > 0 && <p className="flex justify-between"><span>Yetkazish</span><span>{som(order.fee)}</span></p>}
        {order.discount > 0 && <p className="flex justify-between text-[#15803d]"><span>Chegirma</span><span>− {som(order.discount)}</span></p>}
        <p className="flex justify-between text-[14px] font-extrabold text-[#12263a]"><span>Jami</span><span>{som(total)}</span></p>
      </div>
      {href && (
        <Link to={href} className="mt-2 inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-[#0F766E] hover:underline">
          Buyurtma sahifasi <ChevronRight className="size-3.5" />
        </Link>
      )}
    </div>
  )
}

/** Desktop: qator ustiga kelganda tafsilot kartasi. */
export function OrderHoverCard({ anchorRef, open, onEnter, onLeave, children }) {
  const [box, setBox] = useState(null)
  useEffect(() => {
    if (!open) return undefined
    const place = () => {
      const node = anchorRef.current
      if (!node) return
      const r = node.getBoundingClientRect()
      const width = Math.min(440, window.innerWidth - 24)
      let left = r.left
      if (left + width > window.innerWidth - 12) left = Math.max(12, window.innerWidth - 12 - width)
      const spaceBelow = window.innerHeight - r.bottom
      const openUp = spaceBelow < 260 && r.top > spaceBelow
      setBox(openUp
        ? { left, width, bottom: Math.max(8, window.innerHeight - r.top + 8), top: 'auto' }
        : { left, width, top: r.bottom + 8, bottom: 'auto' })
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, anchorRef])
  if (!open || !box || typeof document === 'undefined') return null
  return createPortal(
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ position: 'fixed', zIndex: 40, left: box.left, width: box.width, top: box.top, bottom: box.bottom }}
      className="max-h-[min(70vh,520px)] overflow-auto rounded-2xl bg-white shadow-[0_16px_40px_rgb(15_30_50/0.16)]"
    >
      {children}
    </div>,
    document.body,
  )
}
