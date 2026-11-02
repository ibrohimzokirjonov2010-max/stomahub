import { ArrowRight } from 'lucide-react'

// Bitta banner ko‘rinishi — xaridor sahifasi va sotuvchi oldindan ko‘rishi uchun umumiy.
// Kompyuter: 3:1 (1200×400), telefon: 2:1 — rasm markazdan kesiladi (object-cover).
export const BANNER = { w: 1200, h: 400, ratio: 3, maxMB: 2 }
const fmt = (n) => `${Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/\u00a0|,/g, ' ')} so‘m`

export function BannerView({ image, headline, text, cta, shop, mobile, className = '' }) {
  return (
    <div data-testid="ad-banner-view" className={`relative w-full overflow-hidden rounded-2xl bg-[#0F766E] ${mobile ? 'aspect-[2/1]' : 'aspect-[3/1]'} ${className}`}>
      {image && <img src={image} alt="" className="absolute inset-0 size-full object-cover object-center" />}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/0" />
      <div className={`relative z-[1] flex h-full max-w-[70%] flex-col justify-center text-white ${mobile ? 'gap-1 px-3.5' : 'gap-1.5 px-[4%]'}`}>
        <span className="w-fit max-w-full truncate rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold tracking-wide backdrop-blur-sm">Reklama{shop ? ` · ${shop}` : ''}</span>
        <p className={`line-clamp-2 break-words font-extrabold leading-tight drop-shadow ${mobile ? 'text-[16px]' : 'text-[clamp(16px,2vw,26px)]'}`}>{headline || 'Sarlavha'}</p>
        {text && <p className={`line-clamp-2 break-words text-white/90 drop-shadow ${mobile ? 'text-[11.5px]' : 'text-[13px]'}`}>{text}</p>}
        <span className={`mt-1 inline-flex w-fit max-w-full items-center gap-1 rounded-lg bg-white font-bold text-[#0F766E] ${mobile ? 'px-2.5 py-1 text-[11.5px]' : 'px-3 py-1.5 text-[13px]'}`}><span className="truncate">{cta || 'Ko‘rish'}</span><ArrowRight className="size-3.5 shrink-0" /></span>
      </div>
    </div>
  )
}

export function SponsoredCardView({ product, shop }) {
  return (
    <div className="w-[180px] overflow-hidden rounded-2xl border border-[#E6EEF0] bg-white">
      <div className="relative aspect-[4/3] bg-[#F5F8FA]">
        {product?.image_url && <img src={product.image_url} alt="" className="size-full object-contain p-2" />}
        <span className="absolute left-2 top-2 rounded-full bg-[#0F766E] px-2 py-0.5 text-[10px] font-semibold text-white">Reklama</span>
      </div>
      <div className="p-2.5">
        <div className="truncate text-[10.5px] text-[#5C6E80]">{shop || 'Do‘koningiz'}</div>
        <div className="line-clamp-2 text-[12.5px] font-bold leading-snug text-[#10283F]">{product?.name || 'Mahsulot'}</div>
        <div className="mt-1 text-[13px] font-extrabold text-[#10283F]">{fmt(product?.price)}</div>
      </div>
    </div>
  )
}
