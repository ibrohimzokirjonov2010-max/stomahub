import { useNavigate } from 'react-router-dom'
import { ShoppingBag, ChevronRight } from 'lucide-react'
import { netOf } from '../../api'
import { num, dmy, hm } from '../../format'
import { card, Pager, usePaged } from '../ui'
import Empty from '../shell/Empty'
import ProductThumb from '../bosh-sahifa/ProductThumb'
import { OrderBadge } from '../../pages/Buyurtmalar'

// Mijozning FAQAT shu sotuvchidan qilgan xaridlari (data.orders allaqachon seller_id = siz bo'yicha olingan)
export default function Xaridlar({ orders, per = 5, bare }) {
  const navigate = useNavigate()
  const pg = usePaged(orders, per)
  if (!orders.length) return <Empty icon={ShoppingBag} title="Xaridlar yo‘q" text="Bu mijoz sizdan hali xarid qilmagan." />
  return (
    <div className="space-y-2.5">
      {pg.rows.map((o) => {
        const total = netOf(o) + Number(o.delivery_fee || 0)
        return (
          <div key={o.id} className={`${bare ? 'border border-[#EEF3F4] rounded-xl' : card} p-3`}>
            <button type="button" onClick={() => navigate(`/sotuvchi/buyurtmalar/${o.id}`)} className="flex w-full items-center justify-between gap-2 text-left">
              <div className="min-w-0"><div className="text-[14px] font-bold text-[#10283F]">#{o.code}</div><div className="text-[12px] text-[#5C6E80]">{dmy(o.created_at)} {hm(o.created_at)}{o.city ? ` · ${o.city}` : ''}</div></div>
              <span className="flex shrink-0 items-center gap-1"><OrderBadge order={o} status={o.status} /><ChevronRight className="size-4 text-[#5C6E80]" /></span>
            </button>
            <div className="mt-2 divide-y divide-[#EEF3F4] border-t border-[#EEF3F4]">
              {(o.items || []).map((it) => (
                <div key={it.id || it.name + it.variant} className="flex items-center gap-2.5 py-1.5 text-[12.5px]">
                  <ProductThumb src={it.image_url} className="h-8 w-10 shrink-0" />
                  <div className="min-w-0 flex-1"><div className="truncate">{it.name}</div>{it.variant && <div className="truncate text-[11px] text-[#5C6E80]">{it.variant}</div>}</div>
                  <span className="shrink-0 whitespace-nowrap text-[#5C6E80]">{it.qty} × {num(it.price)}</span>
                  <b className="w-[86px] shrink-0 text-right">{num(Number(it.qty) * Number(it.price))}</b>
                </div>))}
            </div>
            <div className="mt-1.5 flex flex-wrap justify-end gap-x-4 border-t border-[#EEF3F4] pt-1.5 text-[12.5px] text-[#5C6E80]">
              {Number(o.discount_amount) > 0 && <span>Chegirma: −{num(o.discount_amount)}</span>}
              {Number(o.delivery_fee) > 0 && <span>Yetkazish: {num(o.delivery_fee)}</span>}
              <span>Jami: <b className="text-[14px] text-[#10283F]">{num(total)} so‘m</b></span>
            </div>
          </div>)
      })}
      {pg.pages > 1 && <Pager {...pg} setPer={null} />}
    </div>
  )
}
