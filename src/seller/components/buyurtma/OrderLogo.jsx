import { useEffect, useState } from 'react'
import { Download, ImageOff } from 'lucide-react'
import { supabase } from '../../../supabaseClient'
import { LOGO_BUCKET, logoFileName } from '../../../lib/formaLogo'

// Buyurtma qatoriga biriktirilgan logo (0066). Bucket yopiq — vaqtinchalik imzolangan havola;
// RLS faqat shu qator sotuvchisiga (va xaridorga) o‘qishga ruxsat beradi.
const cache = new Map()

export default function OrderLogo({ path, code = '', compact = false }) {
  const devAsset = import.meta.env.DEV && String(path || '').startsWith('/')
  const [urls, setUrls] = useState(() => (devAsset ? { view: path, download: path } : cache.get(path) || null))
  const [fail, setFail] = useState(false)
  useEffect(() => {
    if (!path || devAsset || cache.has(path) || !supabase) return
    let off = false
    const b = supabase.storage.from(LOGO_BUCKET)
    Promise.all([b.createSignedUrl(path, 3600), b.createSignedUrl(path, 3600, { download: logoFileName(path, code) })]).then(([v, d]) => {
      if (off) return
      if (v.error || !v.data?.signedUrl) { setFail(true); return }
      const u = { view: v.data.signedUrl, download: d.data?.signedUrl || v.data.signedUrl }
      cache.set(path, u); setUrls(u)
    }, () => !off && setFail(true))
    return () => { off = true }
  }, [path, code, devAsset])
  if (!path) return null
  return (
    <div data-testid="order-logo" className={`mt-1.5 flex items-center gap-2.5 rounded-lg border border-[#F5D9A8] bg-[#FFFBF2] p-1.5 ${compact ? '' : 'max-w-[320px]'}`}>
      <a href={urls?.view || undefined} target="_blank" rel="noreferrer" className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-md border border-[#EEE3CF] bg-white p-0.5" aria-label="Logoni ochish">
        {urls ? <img src={urls.view} alt="Buyurtmachi logosi" className="max-h-full max-w-full object-contain" /> : <ImageOff className="size-5 text-[#B45309]/60" />}
      </a>
      <div className="min-w-0 flex-1 text-[12px] leading-tight">
        <div className="font-semibold text-[#10283F]">Buyurtmachi logosi</div>
        <div className="text-[#5C6E80]">{fail ? 'Faylni ochib bo‘lmadi' : 'Tikish uchun fayl'}</div>
      </div>
      {urls && <a href={urls.download} download={logoFileName(path, code)} className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[#0F766E] px-2.5 text-[12px] font-semibold text-white"><Download className="size-3.5" />Yuklab olish</a>}
    </div>
  )
}
