import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Store, FileText, CalendarDays, Truck, UserRound, Phone, Lock, MapPin, Check, ChevronRight, ArrowLeft, Wallet, Coins, StickyNote, Building2 } from 'lucide-react'
import { COMMISSION_RATE, OPEN_STATUSES, STATUS, setOrderStatus, useAsync, useSellerData } from '../../api'
import { dmy, hm, longDate, som, num } from '../../format'
import StatusBadge from './StatusBadge'
import ProductThumb from './ProductThumb'

const FLOW = ['yangi', 'tasdiqlandi', 'tayyorlanmoqda', 'yetkazilmoqda', 'yetkazildi']
const FLOW_LABEL = { yangi: 'Buyurtma qabul qilindi', tasdiqlandi: 'Tasdiqlandi', tayyorlanmoqda: 'Tayyorlanmoqda', yetkazilmoqda: 'Yetkazilmoqda', yetkazildi: 'Yakunlanadi' }

export default function OrderDrawer({ orderId, onClose }) {
  const { orders } = useSellerData()
  const order = orders.find((o) => o.id === orderId)
  const navigate = useNavigate()
  const { busy, error, setError, go } = useAsync()
  const [cancelling, setCancelling] = useState(false)
  const [reason, setReason] = useState('')
  useEffect(() => { setCancelling(false); setReason(''); setError('') }, [orderId, setError])
  useEffect(() => {
    if (!orderId) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [orderId, onClose])
  if (!orderId || !order) return null

  const sub = Number(order.subtotal || 0)
  const commission = Number(order.commission ?? Math.round(sub * COMMISSION_RATE))
  const payout = sub - commission
  const step = STATUS[order.status] || {}
  const open = OPEN_STATUSES.includes(order.status)
  const phoneVisible = order.status !== 'yangi' && order.status !== 'bekor_qilindi'
  const history = Object.fromEntries((order.status_history || []).map((h) => [h.status, h.at]))
  const mapUrl = `https://www.google.com/maps/search/${encodeURIComponent(order.address || '')}`
  const advance = () => go(() => setOrderStatus(order.id, step.next))
  const cancel = () => go(async () => { const r = await setOrderStatus(order.id, 'bekor_qilindi', reason); if (r.ok) setCancelling(false); return r })

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#0B2A2E]/45" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside role="dialog" aria-modal="true" aria-label="Buyurtma tafsiloti" className="flex h-full w-full flex-col overflow-y-auto bg-white md:max-w-[480px] md:shadow-[-20px_0_60px_rgb(8_40_45/0.18)]">
        {/* desktop head */}
        <div className="hidden items-center justify-between px-6 pb-3 pt-5 md:flex">
          <h2 className="text-[22px] font-extrabold tracking-tight">Buyurtma tafsiloti</h2>
          <button type="button" onClick={onClose} aria-label="Yopish" className="rounded-lg p-1 hover:bg-[#F0FDFA]"><X className="size-6" /></button>
        </div>
        {/* mobile head */}
        <div className="flex items-center gap-3 px-4 pb-3 pt-4 md:hidden">
          <button type="button" onClick={onClose} aria-label="Orqaga" className="p-1"><ArrowLeft className="size-6" /></button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[20px] font-extrabold">Buyurtma #{order.code}</div>
            <div className="text-[13px] text-[#6B7A88]">{dmy(order.created_at)} {hm(order.created_at)} da berilgan</div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E3F4F2] px-3 py-1.5 text-[12.5px] font-medium text-[#0F766E]"><Truck className="size-4" />{step.label}</span>
        </div>

        <div className="flex-1 space-y-3 px-4 pb-4 md:space-y-0 md:px-6">
          {/* number + status (desktop) */}
          <div className="hidden items-center gap-3 rounded-xl border border-[#E6EEF0] p-3 md:flex">
            <span className="grid size-11 place-items-center rounded-xl bg-[#E3F4F2] text-[#0F766E]"><Store className="size-6" strokeWidth={1.8} /></span>
            <div className="flex-1"><div className="text-[12px] text-[#5C6E80]">Buyurtma raqami</div><div className="text-[19px] font-extrabold">{order.code}</div></div>
            <span className="inline-flex items-center gap-2 rounded-lg bg-[#CCFBF1] px-5 py-2 text-[13.5px] font-medium text-[#115E59]"><FileText className="size-4" />{step.label}</span>
          </div>
          <div className="hidden grid-cols-2 border-b border-[#E6EEF0] py-4 md:grid">
            <Meta icon={CalendarDays} label="Buyurtma sanasi" value={longDate(order.created_at)} />
            <Meta icon={Truck} label="To‘lov usuli" value="Naqd / joyida" border />
          </div>

          {/* buyer */}
          <section className="rounded-2xl border border-[#E6EEF0] p-4 md:rounded-none md:border-0 md:border-b md:px-0">
            <H icon={UserRound}>{'Xaridor ma’lumotlari'}</H>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div><div className="text-[12px] text-[#6B7A88]">Ism familiya</div><div className="mt-1 text-[14.5px] font-semibold">{order.customer_name || '—'}</div></div>
              <div>
                <div className="flex items-center gap-1.5 text-[12px] text-[#6B7A88]"><Phone className="size-3.5" />Telefon raqami</div>
                {phoneVisible && order.customer_phone ? (
                  <a href={`tel:${order.customer_phone}`} className="mt-1 block text-[14.5px] font-semibold text-[#0F766E]">{order.customer_phone}</a>
                ) : (
                  <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E6EEF0] bg-[#F7FAFA] px-3 py-1.5 text-[11.5px] leading-snug text-[#5C6E80]"><Lock className="size-4 shrink-0" />Telefon tasdiqlangandan so‘ng ko‘rinadi</div>
                )}
              </div>
            </div>
            {order.address && <div className="mt-3 flex items-start gap-2 text-[13.5px] text-[#3D4E5F] md:hidden"><MapPin className="mt-0.5 size-4 shrink-0" />{order.address}</div>}
          </section>

          {/* items */}
          <section className="rounded-2xl border border-[#E6EEF0] p-4 md:rounded-none md:border-0 md:px-0">
            <H icon={Building2}>Mahsulotlar ({order.items.length} ta)</H>
            <div className="mt-3 overflow-hidden rounded-xl md:border md:border-[#E6EEF0]">
              <div className="hidden grid-cols-[1fr_52px_80px_80px] bg-[#F4F7F8] px-3 py-2 text-[11.5px] font-medium text-[#3D4E5F] md:grid">
                <span>Mahsulot</span><span>Soni</span><span className="text-right">Narx (so‘m)</span><span className="text-right">Jami (so‘m)</span>
              </div>
              {order.items.length === 0 && <div className="px-3 py-4 text-[13px] text-[#6B7A88]">Mahsulotlar yo‘q</div>}
              {order.items.map((it) => (
                <div key={it.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 border-t border-[#EEF3F4] py-3 first:border-t-0 md:grid-cols-[1fr_52px_80px_80px] md:px-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <ProductThumb src={it.image_url} className="size-14 md:size-10" />
                    <div className="min-w-0"><div className="truncate text-[13.5px] font-semibold">{it.name}</div>{it.variant && <div className="text-[11.5px] text-[#6B7A88]">{it.variant}</div>}
                      <div className="text-[13px] font-semibold md:hidden">{som(it.price)} <span className="ml-3 font-normal text-[#6B7A88]">{it.qty} dona</span></div></div>
                  </div>
                  <span className="hidden text-[12.5px] md:block">{it.qty} ta</span>
                  <span className="hidden text-right text-[12.5px] md:block">{num(it.price)}</span>
                  <span className="text-right text-[13px] font-semibold md:text-[12.5px]">{num(Number(it.qty) * Number(it.price))}<span className="md:hidden"> so‘m</span></span>
                </div>
              ))}
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-[#E6EEF0]">
              <Row label="Mahsulotlar summasi" value={som(sub)} />
              <Row label="StomaHub komissiyasi (12%)" value={som(commission)} />
              <div className="flex items-center justify-between bg-[#F0FDFA] px-3.5 py-3 text-[#115E59]"><span className="text-[14px] font-semibold">Sizga tushadi</span><span className="text-[20px] font-extrabold">{som(payout)}</span></div>
            </div>
            <div className="mt-3 flex items-center gap-3 md:hidden">
              <span className="grid size-10 place-items-center rounded-full bg-[#E3F4F2] text-[#0F766E]"><Coins className="size-5" /></span>
              <div className="flex-1"><div className="text-[12.5px] text-[#6B7A88]">To‘lov usuli</div><div className="text-[14.5px] font-semibold">Naqd pul</div></div>
              <span className="rounded-full bg-[#E3F4F2] px-3 py-1 text-[12px] text-[#0F766E]">Xaridor naqd to‘laydi</span>
            </div>
          </section>

          {/* address (desktop) */}
          <div className="hidden items-start gap-3 border-t border-[#E6EEF0] py-4 md:flex">
            <MapPin className="mt-0.5 size-5 text-[#0F766E]" />
            <div className="flex-1"><div className="text-[14px] font-bold text-[#0F766E]">Yetkazib berish manzili</div><div className="mt-1 text-[13px] leading-relaxed text-[#3D4E5F]">{order.address || 'Manzil ko‘rsatilmagan'}</div></div>
            {order.address && <a href={mapUrl} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 rounded-lg border border-[#E6EEF0] px-3 py-2 text-[11px] font-medium text-[#0F766E] hover:bg-[#F0FDFA]"><MapPin className="size-4" />Xaritada ko‘rish</a>}
          </div>

          {/* timeline (mobile) */}
          <section className="rounded-2xl border border-[#E6EEF0] p-4 md:hidden">
            <H icon={Truck}>Buyurtma holati</H>
            <ol className="mt-3 space-y-1">
              {(order.status === 'bekor_qilindi' ? ['yangi', 'bekor_qilindi'] : FLOW).map((s) => {
                const reached = !!history[s] || s === order.status
                const current = s === order.status
                return (
                  <li key={s} className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-[13.5px] ${current ? 'bg-[#F0FDFA] font-semibold text-[#0F766E]' : ''}`}>
                    <span className={`grid size-5 place-items-center rounded-full ${reached ? 'bg-[#0F766E] text-white' : 'border-2 border-[#3D4E5F]'}`}>{reached && <Check className="size-3" strokeWidth={3} />}</span>
                    <span className="flex-1">{s === 'bekor_qilindi' ? 'Bekor qilindi' : FLOW_LABEL[s]}</span>
                    {history[s] && <span className="text-[12px] font-normal text-[#6B7A88]">{dmy(history[s])} {hm(history[s])}</span>}
                  </li>
                )
              })}
            </ol>
          </section>

          {/* note */}
          <div className="flex gap-3 rounded-xl border border-[#E6EEF0] p-3.5 md:mt-1">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#E3F4F2] text-[#0F766E]"><StickyNote className="size-5" /></span>
            <div className="text-[12px] leading-relaxed text-[#3D4E5F]">
              <div className="text-[13px] font-semibold text-[#10283F]">Eslatma</div>
              {order.note ? <div className="mb-1">{order.note}</div> : null}
              Xaridor buyurtmani olganda naqd to‘lov qiladi. Buyurtmani tasdiqlagandan so‘ng xaridorga telefon raqami ko‘rinadi.
            </div>
          </div>
          {order.status === 'bekor_qilindi' && order.cancel_reason && <div className="mt-2 text-[13px] text-[#5C6E80]">Bekor qilish sababi: {order.cancel_reason}</div>}
        </div>

        {/* actions */}
        <div className="sticky bottom-0 space-y-2.5 border-t border-[#E6EEF0] bg-white px-4 py-3 md:border-0 md:px-6 md:pb-5">
          {error && <p className="rounded-lg bg-[#F0FDFA] px-3 py-2 text-[13px] font-medium text-[#115E59]">{error}</p>}
          {cancelling ? (
            <div className="space-y-2.5">
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Bekor qilish sababi" className="h-11 w-full rounded-xl border border-[#DCE5E7] px-3 text-[14px] outline-none focus:border-[#0F766E]" />
              <div className="grid grid-cols-2 gap-2.5">
                <button type="button" onClick={() => setCancelling(false)} className="h-11 rounded-xl border border-[#C9D6DA] text-[14px] font-medium">Orqaga</button>
                <button type="button" disabled={busy || !reason.trim()} onClick={cancel} className="h-11 rounded-xl bg-[#0F766E] text-[14px] font-semibold text-white hover:bg-[#115E59] disabled:opacity-50">Bekor qilishni tasdiqlash</button>
              </div>
            </div>
          ) : (
            <>
              {step.next && (
                <button type="button" disabled={busy} onClick={advance} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] text-[15px] font-semibold text-white hover:bg-[#115E59] disabled:opacity-60">
                  <Check className="size-5" />{busy ? 'Saqlanmoqda…' : step.action}
                </button>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                <button type="button" disabled={!open} onClick={() => setCancelling(true)} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#C9D6DA] text-[14px] font-medium hover:bg-[#F0FDFA] disabled:opacity-40"><X className="size-4" />Bekor qilish</button>
                <button type="button" onClick={() => { onClose(); navigate('/sotuvchi/buyurtmalar') }} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#0F766E] text-[14px] font-medium text-[#0F766E] hover:bg-[#F0FDFA]"><ChevronRight className="size-4" />Buyurtmalarga o‘tish</button>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}

function Meta({ icon: Icon, label, value, border }) {
  return (
    <div className={`flex items-start gap-3 ${border ? 'border-l border-[#E6EEF0] pl-4' : ''}`}>
      <Icon className="mt-0.5 size-6 text-[#0F766E]" strokeWidth={1.7} />
      <div><div className="text-[12px] text-[#5C6E80]">{label}</div><div className="text-[14px] font-semibold">{value}</div></div>
    </div>
  )
}
function H({ icon: Icon, children }) {
  return <h3 className="flex items-center gap-2.5 text-[16px] font-bold text-[#10283F] md:text-[15px] md:text-[#0F766E]"><span className="grid size-9 place-items-center rounded-full bg-[#E3F4F2] text-[#0F766E] md:size-auto md:bg-transparent"><Icon className="size-5" /></span>{children}</h3>
}
function Row({ label, value }) {
  return <div className="flex items-center justify-between border-b border-[#EEF3F4] px-3.5 py-2.5 text-[13px]"><span className="text-[#3D4E5F]">{label}</span><span className="font-semibold">{value}</span></div>
}
