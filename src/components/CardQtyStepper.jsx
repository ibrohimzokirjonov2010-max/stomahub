import { Minus, Plus, ShoppingCart } from 'lucide-react'
import { useCart } from '../cart'
import { qtyAfterDec } from './cardQtyLogic'

/** Kartochka layouti uchun: savatdagi miqdor (0 = steyper yo‘q). */
export function useCardQty(lineId) {
  const { items } = useCart()
  if (!lineId) return 0
  return items.find((it) => it.id === lineId)?.qty || 0
}

/**
 * Kartochkadagi savat tugmasi ↔ miqdor steyperi (savat store bilan sinxron).
 * variant="icon" — kichik teal savat; qty>0 da to‘liq enli [− n +] pill.
 * variant="bar"  — to‘liq "Savatga" tugmasi → steyper.
 */
export default function CardQtyStepper({
  product,
  lineId,
  disabled = false,
  disabledTitle = '',
  variant = 'icon',
  className = '',
  onAdded,
  onBeforeAdd,
  label = 'Savatga qo‘shish',
}) {
  const { items, add, setQty, remove } = useCart()
  const id = lineId || product?.id
  const line = items.find((it) => it.id === id)
  const qty = line?.qty || 0
  const minQty = Math.max(1, Number(line?.minQty || product?.minQty) || 1)

  const stop = (e) => { e.preventDefault(); e.stopPropagation() }

  const inc = (e) => {
    stop(e)
    if (disabled || !product || !id) return
    if (onBeforeAdd && onBeforeAdd() === false) return
    if (qty < 1) {
      const ok = add(product, minQty)
      if (ok) onAdded?.(product)
      return
    }
    add(product, 1)
  }

  const dec = (e) => {
    stop(e)
    if (!id || qty < 1) return
    const next = qtyAfterDec(qty, minQty)
    if (next < 1) remove(id)
    else setQty(id, next)
  }

  if (disabled) {
    if (variant === 'bar') {
      return (
        <button type="button" disabled title={disabledTitle || label} aria-label={disabledTitle || label}
          className={`flex h-9 w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-xl bg-[#c9d6d8] text-[13px] font-semibold text-white ${className}`}>
          <ShoppingCart className="size-4" /> {label}
        </button>
      )
    }
    return (
      <button type="button" disabled title={disabledTitle || label} aria-label={disabledTitle || label}
        className={`grid size-9 shrink-0 place-items-center rounded-xl bg-[#c9d6d8] text-white ${className}`}>
        <ShoppingCart className="size-[17px]" strokeWidth={2} />
      </button>
    )
  }

  if (qty > 0) {
    // To‘liq en: − chapda, raqam markazda, + o‘ngda. Tap ≥36px.
    return (
      <div
        data-testid="card-qty-stepper"
        role="group"
        aria-label="Miqdor"
        className={`flex h-10 w-full items-center rounded-xl bg-[#f0f1f5] p-0.5 ${className}`}
        onClick={stop}
      >
        <button type="button" onClick={dec} aria-label="Kamaytirish"
          className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-white text-ink shadow-[0_1px_2px_rgb(11_31_58/0.08)] active:scale-95">
          <Minus className="size-4" strokeWidth={2.2} />
        </button>
        <span className="min-w-0 flex-1 px-0.5 text-center text-[13px] font-bold tabular-nums text-ink">{qty}</span>
        <button type="button" onClick={inc} aria-label="Ko‘paytirish"
          className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-white text-ink shadow-[0_1px_2px_rgb(11_31_58/0.08)] active:scale-95">
          <Plus className="size-4" strokeWidth={2.2} />
        </button>
      </div>
    )
  }

  if (variant === 'bar') {
    return (
      <button type="button" onClick={inc} aria-label={label} title={label}
        className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-sea text-[13px] font-semibold text-white active:scale-[0.98] ${className}`}>
        <ShoppingCart className="size-4" /> {label}
      </button>
    )
  }

  return (
    <button type="button" onClick={inc} aria-label={label} title={label} data-testid="card-qty-add"
      className={`grid size-9 shrink-0 place-items-center rounded-xl bg-[#0b6d73] text-white transition active:scale-95 ${className}`}>
      <ShoppingCart className="size-[17px]" strokeWidth={2} />
    </button>
  )
}
