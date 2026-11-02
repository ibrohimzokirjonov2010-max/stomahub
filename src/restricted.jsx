import { Link } from 'react-router-dom'
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
export function RestrictedNotice({ className = '' }) {
  return (
    <div role="note" className={`rounded-xl border border-[#f5d48a] bg-[#fff8e6] p-3 text-[12.5px] text-[#7a5200] ${className}`}>
      <p className="flex items-center gap-1.5 font-semibold"><ShieldAlert className="size-4 shrink-0" /> Faqat tasdiqlangan shifokorlar uchun</p>
      <p className="mt-1">Bu mahsulotni litsenziyasi tasdiqlangan shifokorlar buyurtma qila oladi.</p>
      <Link to={VERIFY_PATH} className="mt-2 inline-flex h-9 items-center rounded-lg bg-[#0F766E] px-3 font-semibold text-white">Shifokor sifatida tasdiqlang</Link>
    </div>
  )
}
