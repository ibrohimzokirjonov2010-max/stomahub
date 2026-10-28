import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronRight, ShoppingCart, Trash2 } from 'lucide-react'
import { useCart } from '../cart'
import { som } from '../marketData'
import { QtyStepper } from '../components/market/CartPanel'
import ShopLayout from '../components/market/ShopLayout'

/** Desktop cart page (Savatcha). Checkout only via "Rasmiylashtirish" → /buyurtma. */
export default function Savatcha() {
  const { items, setQty, remove, clear, count, total } = useCart()
  const navigate = useNavigate()
  const from = useLocation().state?.from || 'market'
  return (
    <ShopLayout active="market" search="plain" placeholder="Mahsulot, brend yoki kategoriya qidiring...">
    <div data-testid="cart-page" className="pb-8 pt-2.5 lg:pl-1.5">
      <nav className="flex items-center gap-1.5 text-[10px] text-muted">
        <Link to="/marketplace" className="hover:text-sea">Marketplace</Link> <ChevronRight className="size-3" />
        <span className="font-medium text-ink">Savatcha</span>
      </nav>
      <div className="mt-2 flex items-end justify-between">
        <h1 className="text-[22px] font-bold text-ink">Savatcha {count > 0 && <span className="text-[14px] font-medium text-muted">({count} ta)</span>}</h1>
        {items.length > 0 && <button onClick={clear} className="text-[12px] font-medium text-sea hover:underline">Barchasini tozalash</button>}
      </div>

      {items.length === 0 ? (
          <div className="mt-4 grid place-items-center rounded-xl bg-white px-6 py-16 text-center shadow-card">
            <span className="grid size-16 place-items-center rounded-full bg-sea-50 text-sea"><ShoppingCart className="size-8" strokeWidth={1.6} /></span>
            <p className="mt-4 text-[16px] font-bold text-ink">Savatcha bo‘sh</p>
            <p className="mt-1 text-[13px] text-muted">Marketplace’dan kerakli mahsulotlarni qo‘shing</p>
            <Link to="/marketplace" className="mt-5 rounded-lg bg-sea px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-sea-600">Xaridni boshlash</Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <ul className="divide-y divide-line rounded-xl bg-white px-4 shadow-card">
              {items.map((it) => (
                <li key={it.id} data-testid="cart-item" className="flex items-center gap-4 py-4">
                  <img src={it.image} alt="" className="size-[72px] shrink-0 rounded-lg bg-[#f3f6fa] object-contain" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-ink">{it.name}</p>
                    {it.type && <p className="truncate text-[12px] text-muted">{it.type}</p>}
                    <p className="mt-1 text-[12px] text-ink-2">{som(it.price)} / dona</p>
                  </div>
                  <QtyStepper size="lg" value={it.qty} onChange={(q) => setQty(it.id, q)} />
                  <p className="w-[110px] shrink-0 text-right text-[14px] font-bold text-ink">{som(it.price * it.qty)}</p>
                  <button onClick={() => remove(it.id)} data-testid="cart-remove" className="grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-[#fdecec] hover:text-sale" aria-label="O‘chirish">
                    <Trash2 className="size-[17px]" strokeWidth={1.7} />
                  </button>
                </li>
              ))}
            </ul>
            <aside className="h-fit rounded-xl bg-white p-4 shadow-card lg:sticky lg:top-20">
              <h2 className="text-[15px] font-bold text-ink">Buyurtma xulosasi</h2>
              <div className="mt-3 space-y-2 text-[13px]">
                <div className="flex justify-between text-ink-2"><span>Mahsulotlar ({count} ta)</span><span className="font-semibold text-ink">{som(total)}</span></div>
                <div className="flex justify-between text-ink-2"><span>Yetkazib berish</span><span className="font-semibold text-ink">Sotuvchi bilan kelishiladi</span></div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="text-[14px] font-bold text-ink">Jami</span><span className="text-[20px] font-bold text-ink">{som(total)}</span>
              </div>
              <button type="button" data-testid="cart-checkout" onClick={() => navigate('/buyurtma', { state: { from } })} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-sea text-[14px] font-semibold text-white hover:bg-sea-600">
                Rasmiylashtirish <ArrowRight className="size-4" />
              </button>
              <Link to="/marketplace" className="mt-2 grid h-10 place-items-center rounded-lg border border-sea-100 bg-sea-50 text-[13px] font-semibold text-sea">Xaridni davom ettirish</Link>
            </aside>
          </div>
        )}
    </div>
    </ShopLayout>
  )
}
