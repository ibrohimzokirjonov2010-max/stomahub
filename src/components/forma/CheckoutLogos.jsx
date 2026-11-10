import { CircleAlert } from 'lucide-react'
import LogoUpload from './LogoUpload'
import { logoItems } from '../../lib/formaLogo'

/**
 * Rasmiylashtirish: «Logo tikish» yoqilgan har bir savat qatori uchun logo fayli.
 * logos: { [itemId]: { path, name, size, preview } | null } — shu sahifada yuklangan/almashtirilgan.
 * Mahsulot sahifasida yuklangan logo (it.logo) ko‘rsatiladi va shu yerda almashtirish/o‘chirish mumkin.
 */
export default function CheckoutLogos({ items, logos, onChange, error = false, className = '' }) {
  const list = logoItems(items)
  if (!list.length) return null
  const valueOf = (it) => (Object.prototype.hasOwnProperty.call(logos, it.id) ? logos[it.id] : it.logo ? { path: it.logo, name: it.logoName || '', size: it.logoSize || 0 } : null)
  return (
    <section data-testid="checkout-logos" className={className}>
      <h3 className="text-[15px] font-bold text-[#0d2a4a]">Logo tikish</h3>
      <p className="mt-0.5 text-[12px] text-muted">Har bir mahsulot uchun kiyimga tikiladigan logo faylini yuklang. Fayl buyurtma bilan sotuvchiga yuboriladi.</p>
      <div className="mt-2.5 space-y-3">
        {list.map((it) => {
          const v = valueOf(it)
          return (
            <div key={it.id}>
              <div className="mb-1.5 flex items-center gap-2">
                {it.image ? <img src={it.image} alt="" className="size-9 shrink-0 rounded-lg bg-[#f3f6f8] object-contain" /> : null}
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">{it.name}</span>
              </div>
              <LogoUpload value={v} onChange={(x) => onChange(it.id, x)} />
              {error && !v?.path && <p role="alert" className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-sale"><CircleAlert className="size-3.5" />Logo faylini yuklang</p>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
