import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from './cart'
import { ShieldAlert } from 'lucide-react'
import { useProfile } from './profileStore'

// Faqat tasdiqlangan shifokorlar sotib oladigan mahsulotlar: sotuvchi belgilagan (rx_only)
// yoki yuqori konsentratsiyali klinik oqartirish (peroksid ≥ 10%). Server: 0038 trigger bilan bir xil qoida.
const RX_NAME = /(oqartir|whiten|peroksid|peroxide)[^%]*?\b([1-9]\d)\s*%/i
export const isRestrictedName = (name) => RX_NAME.test(String(name || ''))
export const isRestricted = (p) => !!(p && (p.rx || p.rxOnly || p.rx_only || isRestrictedName(p.name)))
export const VERIFY_PATH = '/profil/shifokor'

export function useDoctorVerified() {
  const profile = useProfile()
  return !!profile?.verified
}

/** Tasdiqlanmagan foydalanuvchiga savat/xarid tugmasi o‘rniga ko‘rsatiladi. */
export function RestrictedNotice({ className = '', onNavigate }) {
  return (
    <div role="note" className={`rounded-xl border border-[#f5d48a] bg-[#fff8e6] p-3 text-[12.5px] text-[#7a5200] ${className}`}>
      <p className="flex items-center gap-1.5 font-semibold"><ShieldAlert className="size-4 shrink-0" /> Faqat tasdiqlangan shifokorlar uchun</p>
      <p className="mt-1">Bu mahsulotni litsenziyasi tasdiqlangan shifokorlar buyurtma qila oladi.</p>
      <Link to={VERIFY_PATH} onClick={onNavigate} className="mt-2 inline-flex h-9 items-center rounded-lg bg-[#0F766E] px-3 font-semibold text-white">Shifokor sifatida tasdiqlang</Link>
    </div>
  )
}

/** Kartochkadagi tezkor “savatga” tugmasi cheklangan mahsulotni bosganda chiqadigan oyna. */
export function RxPrompt() {
  const { rxPrompt, closeRxPrompt, cartNotice, closeCartNotice } = useCart()
  if (!rxPrompt && cartNotice) return <CartNotice text={cartNotice} onClose={closeCartNotice} />
  if (!rxPrompt) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center" onClick={closeRxPrompt}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-3" onClick={(e) => e.stopPropagation()}>
        <RestrictedNotice onNavigate={closeRxPrompt} />
        <button type="button" onClick={closeRxPrompt} className="mt-2 h-10 w-full rounded-lg border border-slate-200 text-sm font-semibold text-slate-700">Yopish</button>
      </div>
    </div>
  )
}

/** Savat cheklovi xabari (ombor qoldig‘i, o‘z mahsuloti) — bir necha soniyada yopiladi. */
function CartNotice({ text, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [text, onClose])
  return (
    <div role="alert" className="fixed inset-x-0 bottom-[max(5.5rem,env(safe-area-inset-bottom))] z-[100] flex justify-center px-4">
      <div className="flex max-w-sm items-center gap-2 rounded-xl bg-[#3a2a00] px-4 py-3 text-[13px] font-medium text-white shadow-lg">
        <ShieldAlert className="size-4 shrink-0 text-[#f5d48a]" /> <span>{text}</span>
        <button type="button" onClick={onClose} className="ml-2 text-[12px] font-semibold text-[#f5d48a]">Yopish</button>
      </div>
    </div>
  )
}

/** Mahsulot sahifasi va savat uchun cheklov bloki (rx bo‘lmagan holatlar). */
export function BlockNotice({ text, className = '' }) {
  return (
    <div role="note" className={`rounded-xl border border-[#f5d48a] bg-[#fff8e6] p-3 text-[12.5px] font-semibold text-[#7a5200] ${className}`}>
      <p className="flex items-center gap-1.5"><ShieldAlert className="size-4 shrink-0" /> {text}</p>
    </div>
  )
}
