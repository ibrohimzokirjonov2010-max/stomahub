import { Package } from 'lucide-react'

export default function ProductThumb({ src, className = 'size-10' }) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-lg bg-[#F1F5F6] ${className}`}>
      {src ? <img src={src} alt="" className="size-full object-cover" /> : <Package className="size-1/2 text-[#9AAAB5]" strokeWidth={1.6} />}
    </span>
  )
}
