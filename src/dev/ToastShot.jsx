// DEV-only: toast skrinshotlari uchun (prod build’ga kirmaydi).
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import MobileMarketplace from '../components/mobile/MobileMarketplace'
import MobileHome from '../components/mobile/MobileHome'
import { SpecialtyPicker } from '../personal/PersonalBlocks'
import { MobileToast } from '../components/mobile/parts'

const TEXT = {
  error: 'Tarmoq xatosi. Buyurtma yuborilmadi, qayta urinib ko‘ring',
  warn: 'Omborda faqat 3 dona bor — savatda allaqachon 3 ta',
  info: 'Manzil saqlandi',
}

export default function ToastShot() {
  const { mode } = useParams()
  const [n, setN] = useState(0)
  // Skrinshot skripti `window.dispatchEvent(new Event('show-toast'))` bilan ko‘rsatadi
  useEffect(() => { const f = () => setN((x) => x + 1); window.addEventListener('show-toast', f); return () => window.removeEventListener('show-toast', f) }, [])
  // ?specpick bilan: "Yo‘nalishingizni tanlang" kartochkasi (mobil bosh sahifa / desktop kenglik)
  if (mode === 'home') return <MobileHome />
  if (mode === 'spec-desktop') return <div className="min-h-screen bg-page p-8"><div className="mx-auto max-w-[980px]"><SpecialtyPicker desktop /></div></div>
  return (
    <>
      <MobileMarketplace />
      {n > 0 && <MobileToast key={n} text={TEXT[mode] || TEXT.info} warn={mode === 'warn'} onClose={() => {}} />}
    </>
  )
}
