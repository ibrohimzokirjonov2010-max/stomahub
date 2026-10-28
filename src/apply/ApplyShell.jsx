import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

/** Plain page frame for the application screens (mobile 390 / desktop, iOS safe-area aware). */
export default function ApplyShell({ back = '/', backLabel = 'Orqaga', children }) {
  return (
    <div className="min-h-screen bg-[#F4FBFA]">
      <header className="sticky top-0 z-20 border-b border-[#E6EEF0] bg-white/95 backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex h-14 max-w-[1100px] items-center gap-3 px-4">
          <Link to={back} className="inline-flex items-center gap-1 text-[14px] font-semibold text-[#10283F]"><ChevronLeft className="size-5" /> {backLabel}</Link>
          <Link to="/" className="ml-auto text-[17px] font-extrabold tracking-tight text-[#0F766E]">StomaHub</Link>
        </div>
      </header>
      <main className="mx-auto max-w-[1100px] px-4 py-6 md:py-10" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>{children}</main>
    </div>
  )
}
