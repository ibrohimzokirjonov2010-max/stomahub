import { useNavigate } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { useCart } from '../../cart'
import { som } from '../../marketData'
import { receiveStock } from '../../omborData'

export default function IntakeDialog() {
  const { items, total, reviewing, closeReview, clear } = useCart()
  const navigate = useNavigate()
  if (!reviewing) return null

  const confirm = () => {
    receiveStock(items)
    clear()
    closeReview()
    navigate('/ombor')
  }

  return (
    <div className="bemor-shade" onClick={closeReview}>
      <div className="bemor-dialog tolov-dialog" role="dialog" aria-labelledby="intake-title" onClick={(e) => e.stopPropagation()}>
        <div className="bemor-dialog-head flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 id="intake-title" className="text-[18px] font-bold">Xaridni ko‘rib chiqish</h2>
            <p className="mt-0.5 text-[12.5px] text-muted">Omborga qo‘shishdan oldin mahsulotlar ro‘yxatini tekshiring</p>
          </div>
          <button type="button" onClick={closeReview} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-[#f4f7fb]" aria-label="Yopish"><X className="size-4" /></button>
        </div>
        <div className="bemor-dialog-body px-5 py-4">
          {items.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-muted">Savat bo‘sh. Avval marketplace yoki saytdan mahsulot tanlang.</p>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 py-2.5">
                  {it.image ? <img src={it.image} alt="" className="size-12 shrink-0 rounded-lg bg-[#f4f7fb] object-contain" /> : <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-sea-50 text-[12px] font-bold text-sea">{it.name.slice(0, 1)}</span>}
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-[13px]">{it.name}</b>
                    <span className="text-[12px] text-muted">{it.type} · {it.qty} dona</span>
                  </div>
                  <b className="whitespace-nowrap text-[13px]">{som(it.price * it.qty)}</b>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 rounded-xl bg-[#eef6ff] px-3 py-2.5 text-[12.5px] text-[#1d4e89]">
            Tasdiqlangach bu mahsulotlar klinika omboriga zahira sifatida qo‘shiladi. Bir xil mahsulot bo‘lsa, miqdori ustiga yoziladi.
          </div>
        </div>
        <div className="bemor-dialog-foot flex items-center justify-between gap-3 border-t border-line px-5 py-3">
          <b className="text-[14px]">{som(total)}</b>
          <div className="flex gap-2">
            <button type="button" onClick={closeReview} className="h-10 rounded-xl border border-line px-4 text-[13px] font-semibold">Bekor qilish</button>
            <button type="button" onClick={confirm} disabled={!items.length} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-sea px-4 text-[13px] font-semibold text-white disabled:opacity-50"><Check className="size-4" /> Omborga qo‘shish</button>
          </div>
        </div>
      </div>
    </div>
  )
}
