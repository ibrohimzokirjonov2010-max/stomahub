import { Clock3, ExternalLink, Info, Phone, Truck, UserRound } from 'lucide-react'
import { safeTrackingUrl, serviceLabel, telHref } from '../lib/deliveryTracking'

/**
 * Xaridor: buyurtma yo‘lda bo‘lganda yetkazish kartasi (0067).
 * Kuryer ismi/telefoni — sotuvchi kiritgan ma’lumot (Yandex’dan avtomatik olinmaydi).
 * «Kuryerni kuzatish» oddiy <a target="_blank"> — iOS PWA (standalone) da tashqi brauzerda/ilovada ochiladi.
 */
export default function CourierCard({ order, className = '' }) {
  if (!order || order.status !== 'shipping' || order.mode === 'pickup') return null
  const url = safeTrackingUrl(order.trackingUrl)
  const service = order.deliveryService || (url ? 'yandex' : '')
  const tel = telHref(order.courierPhone)
  const yandex = service === 'yandex'
  return (
    <section data-testid="courier-card" className={`rounded-2xl border border-[#cfe9e4] bg-white p-3.5 shadow-[0_1px_6px_rgb(11_31_58/0.05)] ${className}`}>
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#dcf1ed] text-[#0b6d73]"><Truck className="size-[22px]" strokeWidth={2} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-extrabold leading-tight text-[#0d2a4a]">Buyurtmangiz yo‘lda</p>
          <p className="mt-0.5 truncate text-[12.5px] text-[#5f7384]">{serviceLabel(service) || 'Yetkazib berish'}</p>
        </div>
      </div>

      {order.deliveryEta ? (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-[#f3f8f8] px-3 py-2 text-[13px] text-[#0d2a4a]"><Clock3 className="size-4 shrink-0 text-[#0b6d73]" />Taxminiy yetib borish: <b className="font-semibold">{order.deliveryEta}</b></p>
      ) : null}

      {order.courierName || tel ? (
        <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-[#e5eef0] px-3 py-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eef5f6] text-[#0b6d73]"><UserRound className="size-[18px]" /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold text-[#0d2a4a]">{order.courierName || 'Kuryer'}</p>
            {order.courierPhone ? <p className="truncate text-[12px] text-[#5f7384]">{order.courierPhone}</p> : null}
          </div>
          {tel ? <a href={tel} className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#0b8a7a]/60 px-3 text-[13px] font-semibold text-[#0b6d73] active:scale-[0.98]"><Phone className="size-4" />Qo‘ng‘iroq</a> : null}
        </div>
      ) : null}

      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" data-testid="track-courier"
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[15px] font-bold text-white shadow-[0_6px_16px_rgb(11_109_115/0.25)] active:scale-[0.99]">
          <ExternalLink className="size-[18px]" /> Kuryerni kuzatish
        </a>
      ) : (
        <p className="mt-3 rounded-xl bg-[#f3f8f8] px-3 py-2.5 text-[12.5px] text-[#5f7384]">{service === 'ozim' ? 'Sotuvchi buyurtmani o‘zi yetkazib bermoqda. Savollar bo‘lsa, kuryerga yoki sotuvchiga qo‘ng‘iroq qiling.' : 'Sotuvchi hali kuzatuv havolasini qo‘shmagan. Qo‘shilishi bilan shu yerda paydo bo‘ladi.'}</p>
      )}

      <p className="mt-2.5 flex gap-1.5 text-[11px] leading-snug text-[#7a8a9c]"><Info className="mt-px size-3.5 shrink-0" />
        <span>Kuryer ma’lumotlarini sotuvchi kiritgan.{url ? ` Kuryerning jonli joylashuvi ${yandex ? 'Yandex' : 'yetkazib berish xizmati'} sahifasida ochiladi.` : ''}</span>
      </p>
    </section>
  )
}
