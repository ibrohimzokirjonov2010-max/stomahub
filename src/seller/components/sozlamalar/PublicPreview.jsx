import { useEffect, useRef, useState } from 'react'
import { Monitor, Smartphone } from 'lucide-react'
import SellerProfileView from '../../../seller-public/SellerProfileView'

const W = { desktop: 1120, telefon: 390 }
// Live preview of /dokon/:id using the SAME component as the real page, rendered at the real
// width and scaled to fit. Clicks are swallowed so the seller can't navigate away by accident.
export default function PublicPreview({ info, products, height = 640 }) {
  const [mode, setMode] = useState('desktop')
  const box = useRef(null)
  const [bw, setBw] = useState(0)
  useEffect(() => { const el = box.current; if (!el) return undefined; const ro = new ResizeObserver(([e]) => setBw(e.contentRect.width)); ro.observe(el); return () => ro.disconnect() }, [])
  const w = W[mode]; const scale = bw ? Math.min(1, bw / w) : 1
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold">Xaridor ko‘radigan sahifa</span>
        <div role="tablist" className="flex rounded-xl bg-[#F0F5F6] p-0.5 text-[12.5px] font-semibold">
          {[['desktop', Monitor, 'Desktop'], ['telefon', Smartphone, 'Telefon']].map(([k, I, t]) => <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => setMode(k)} className={`flex items-center gap-1 rounded-lg px-2.5 py-1 ${mode === k ? 'bg-white text-[#0F766E] shadow-sm' : 'text-[#5C6E80]'}`}><I className="size-3.5" />{t}</button>)}
        </div>
      </div>
      <div ref={box} className="overflow-hidden rounded-2xl border border-[#E2ECEE] bg-[#F5F8FA]" style={{ height }}>
        <div className={mode === 'telefon' ? 'mx-auto' : ''} style={{ width: w * scale, height }}>
          <div onClickCapture={(e) => { if (e.target.closest('a')) e.preventDefault() }} className="origin-top-left overflow-y-auto bg-[#F5F8FA] px-3.5 py-3" style={{ width: w, height: height / scale, transform: `scale(${scale})` }}>
            <SellerProfileView info={info} products={products} />
          </div>
        </div>
      </div>
    </div>
  )
}
