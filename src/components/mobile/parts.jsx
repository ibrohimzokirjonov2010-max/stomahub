import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, Bell, Check, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useCart } from '../../cart'

export function BrandLogo({ className = 'h-8', to = '/' }) {
  const img = <img src="/images/logo.png" alt="" className={`block w-auto object-contain ${className}`} />
  if (to == null) return <span className="inline-flex shrink-0">{img}</span>
  return (
    <Link to={to} aria-label="StomaHub" className="inline-flex shrink-0">
      {img}
    </Link>
  )
}

export function MobileTopBar({ onSearch, onBell, search = true }) {
  const { items } = useCart()
  const navigate = useNavigate()
  return (
    <header className="flex items-center justify-between">
      <BrandLogo />
      <div className="flex items-center gap-1">
        {search && (
          <button type="button" onClick={onSearch} aria-label="Qidirish" className="grid size-10 place-items-center rounded-full bg-white/80 text-ink shadow-[0_1px_3px_rgb(11_31_58/0.08)]">
            <Search className="size-[19px]" />
          </button>
        )}
        <button type="button" onClick={() => navigate('/buyurtma', { state: { from: 'market' } })} aria-label="Savat" className="relative grid size-10 place-items-center rounded-full text-ink">
          <ShoppingCart className="size-[21px]" />
          {items.length > 0 && <CountBadge>{items.length}</CountBadge>}
        </button>
        <button type="button" onClick={onBell} aria-label="Bildirishnomalar" className="relative grid size-10 place-items-center rounded-full text-ink">
          <Bell className="size-[21px]" />
          <CountBadge>2</CountBadge>
        </button>
      </div>
    </header>
  )
}

export function QtyStepper({ value, onDec, onInc, className = '', big = false }) {
  const icon = big ? 'size-5' : 'size-4'
  return (
    <div className={`flex items-center justify-between gap-1 rounded-xl bg-[#f0f1f5] p-1 ${className}`}>
      <button type="button" onClick={onDec} aria-label="Kamaytirish" className="grid aspect-square h-full place-items-center rounded-[10px] bg-white text-ink shadow-[0_1px_2px_rgb(11_31_58/0.06)] active:scale-95">
        <Minus className={icon} strokeWidth={2.2} />
      </button>
      <span className={`min-w-5 text-center font-semibold tabular-nums text-ink ${big ? 'text-[15px]' : 'text-[13px]'}`}>{value}</span>
      <button type="button" onClick={onInc} aria-label="Ko‘paytirish" className="grid aspect-square h-full place-items-center rounded-[10px] bg-white text-ink shadow-[0_1px_2px_rgb(11_31_58/0.06)] active:scale-95">
        <Plus className={icon} strokeWidth={2.2} />
      </button>
    </div>
  )
}

export function GoCartButton({ className = '', big = false }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate('/buyurtma', { state: { from: 'market' } })}
      className={`flex items-center justify-center gap-1.5 rounded-xl bg-[#e9e4fd] font-semibold text-[#7c4ddb] active:scale-[0.98] ${big ? 'text-[15px]' : 'text-[12.5px]'} ${className}`}
    >
      <ShoppingBag className={big ? 'size-5' : 'size-4'} strokeWidth={1.9} /> O‘tish
    </button>
  )
}

export function CountBadge({ children }) {
  return (
    <span className="absolute right-0.5 top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-sale px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[#eef7f8]">
      {children}
    </span>
  )
}

export function MobileToast({ text, onClose, action, bottom = 76 }) {
  useEffect(() => {
    if (!text) return
    const t = setTimeout(onClose, 2200)
    return () => clearTimeout(t)
  }, [text, onClose])
  if (!text) return null
  return (
    <div role="status" style={{ bottom }} className="fixed inset-x-4 z-50 flex items-center gap-2 rounded-xl bg-ink px-3.5 py-2.5 text-[13px] font-medium text-white shadow-lg">
      <Check className="size-4 shrink-0 text-[#5fe0c8]" /> <span className="min-w-0 flex-1 truncate">{text}</span>
      {action}
    </div>
  )
}

export function GiftArt({ className }) {
  return (
    <svg viewBox="0 0 92 74" className={className} aria-hidden="true">
      <g opacity="0.95">
        <rect x="8" y="10" width="5" height="3" rx="1" fill="#f6b73c" transform="rotate(-25 10 11)" />
        <rect x="74" y="8" width="5" height="3" rx="1" fill="#ef5c8a" transform="rotate(30 76 9)" />
        <rect x="82" y="30" width="4" height="3" rx="1" fill="#3fb6e8" transform="rotate(-15 84 31)" />
        <rect x="3" y="36" width="4" height="3" rx="1" fill="#ef5c8a" transform="rotate(20 5 37)" />
        <circle cx="22" cy="5" r="1.8" fill="#3fb6e8" />
        <circle cx="66" cy="3" r="1.6" fill="#f6b73c" />
        <circle cx="85" cy="18" r="1.4" fill="#7c4ddb" />
        <path d="M14 22 l2 -4 l2 4" fill="none" stroke="#7c4ddb" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      <ellipse cx="46" cy="69" rx="30" ry="3.5" fill="#0b8a95" opacity="0.15" />
      <path d="M18 36 h56 v29 a4 4 0 0 1 -4 4 h-48 a4 4 0 0 1 -4 -4 z" fill="#14b3a6" />
      <path d="M18 36 h56 v8 h-56 z" fill="#0f968b" opacity="0.5" />
      <rect x="14" y="26" width="64" height="12" rx="3" fill="#2cc7b8" />
      <rect x="41" y="26" width="10" height="43" fill="#f25c8b" />
      <rect x="41" y="26" width="10" height="12" fill="#ff77a0" />
      <path d="M46 26 C 36 12, 22 14, 27 22 C 30 27, 40 27, 46 26 Z" fill="#f25c8b" />
      <path d="M46 26 C 56 12, 70 14, 65 22 C 62 27, 52 27, 46 26 Z" fill="#f25c8b" />
      <path d="M46 26 C 39 17, 30 17, 31 21 C 32 24, 40 25, 46 26 Z" fill="#c93b6a" opacity="0.45" />
      <path d="M46 26 C 53 17, 62 17, 61 21 C 60 24, 52 25, 46 26 Z" fill="#c93b6a" opacity="0.45" />
      <circle cx="46" cy="26" r="4" fill="#ff77a0" />
      <path d="M22 44 v20" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
