import { useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ArrowRight, Truck, ShieldCheck, CreditCard, Clock, MessageCircleMore } from 'lucide-react'
import { useCart } from '../../cart'
import { som } from '../../marketData'

export function QtyStepper({ value, onChange, size = 'sm' }) {
  const big = size === 'lg'
  return (
    <div className={`flex items-center rounded-md border border-line bg-white ${big ? 'h-[30px] bg-[#f3f6fa] border-transparent' : 'h-[20px]'}`}>
      <button onClick={() => onChange(value - 1)} className={`grid h-full place-items-center text-ink-2 hover:text-sea ${big ? 'w-[30px]' : 'w-[18px]'}`} aria-label="Kamaytirish">
        <Minus className={big ? 'size-3.5' : 'size-[10px]'} />
      </button>
      <span className={`text-center font-medium text-ink ${big ? 'h-full w-[38px] bg-white text-[11px] leading-[30px]' : 'w-[14px] text-[9.5px]'}`}>{value}</span>
      <button onClick={() => onChange(value + 1)} className={`grid h-full place-items-center text-ink-2 hover:text-sea ${big ? 'w-[30px]' : 'w-[18px]'}`} aria-label="Ko‘paytirish">
        <Plus className={big ? 'size-3.5' : 'size-[10px]'} />
      </button>
    </div>
  )
}

const perks = [
  { icon: Truck, title: 'Bepul yetkazib berish', text: '500 000 so‘m dan yuqori buyurtmalarda' },
  { icon: ShieldCheck, title: 'Rasmiy distribyutor mahsulotlari', text: '100% original mahsulotlar' },
  { icon: CreditCard, title: 'Xavfsiz to‘lov', text: 'Click, Payme, Uzum, Paynet' },
  { icon: Clock, title: '7 kun ichida qaytarish', text: 'Sifat kafolati' },
]

export default function CartPanel() {
  const { items, setQty, remove, clear, count, total } = useCart()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl bg-white p-3 shadow-card">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[12.5px] font-bold text-ink">Savatim ({items.length})</h2>
          {items.length > 0 && (
            <button onClick={clear} className="text-[9px] font-medium text-sea hover:underline">Barchasini tozalash</button>
          )}
        </div>

        {items.length === 0 ? (
          <p className="py-8 text-center text-[10px] text-muted">Savat bo‘sh</p>
        ) : (
          <ul>
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-1.5 border-b border-line py-2 first:pt-0">
                <img src={it.image} alt="" className="size-[42px] shrink-0 rounded-md object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[9px] font-semibold text-ink">{it.name}</p>
                  <p className="truncate text-[8.5px] text-muted">{it.type}</p>
                  <p className="mt-0.5 whitespace-nowrap text-[10px] font-bold text-sea-600">{som(it.price)}</p>
                </div>
                <QtyStepper value={it.qty} onChange={(q) => setQty(it.id, q)} />
                <button onClick={() => remove(it.id)} className="text-ink-2 hover:text-sale" aria-label="O‘chirish">
                  <Trash2 className="size-[13px]" strokeWidth={1.7} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-2 space-y-1.5 text-[9.5px]">
          <div className="flex justify-between text-ink-2"><span>Mahsulotlar ({count} ta)</span><span className="font-semibold text-ink">{som(total)}</span></div>
          <div className="flex justify-between text-ink-2"><span>Yetkazib berish</span><span className="font-semibold text-ink">0 so‘m</span></div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] font-bold text-ink">Jami summa</span>
          <span className="text-[14px] font-bold text-ink">{som(total)}</span>
        </div>
        <button type="button" onClick={() => navigate('/buyurtma', { state: { from: 'market' } })} className="mt-2.5 flex h-[32px] w-full items-center justify-center gap-2 rounded-lg bg-sea text-[11px] font-semibold text-white transition hover:bg-sea-600 disabled:opacity-50" disabled={!items.length}>
          Rasmiylashtirish <ArrowRight className="size-4" />
        </button>
      </div>

      <ul className="space-y-3 px-3">
        {perks.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-center gap-3">
            <Icon className="size-[17px] shrink-0 text-sea" strokeWidth={1.7} />
            <div className="leading-tight">
              <p className="text-[9.5px] font-semibold text-ink">{title}</p>
              <p className="text-[8.5px] text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-white to-[#e8f3f8] p-3 pr-0 shadow-card">
        <div className="relative z-10 w-[64%]">
          <p className="text-[11.5px] font-bold text-ink">Savolingiz bormi?</p>
          <p className="mt-0.5 text-[9px] text-ink-2">Biz yordam berishga tayyormiz!</p>
          <button className="mt-2.5 flex h-[28px] items-center gap-2 rounded-lg bg-sea px-3 text-[10px] font-semibold text-white transition hover:bg-sea-600">
            <MessageCircleMore className="size-4" /> Onlayn chat
          </button>
        </div>
        <img src="/images/market/support.jpg" alt="" className="absolute bottom-0 right-0 h-full w-[34%] object-cover object-right" />
      </div>
    </div>
  )
}
