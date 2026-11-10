// DEV-only: vakansiyalar (0069) skrinshotlari — mock ma’lumot, bazaga yozilmaydi. Prod build’ga kirmaydi.
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { jobs } from '../ishlarData'
import { useCatalogVersion } from '../recordSync'
import { IshlarCatalog } from '../pages/CatalogRoutes'
import IshItem from '../pages/IshItem'
import MobileIsh from '../components/mobile/MobileIsh'
import ShopLayout from '../components/market/ShopLayout'
import { JobFormSheet } from '../components/vakansiya/JobSheets'

const O = '99999999-9999-9999-9999-999999999999'
const JOBS = [
  { id: 'job-demo-1', title: 'Stomatolog-terapevt', clinic: 'Smile Dent klinikasi', city: 'toshkent', cityLabel: 'Toshkent', address: 'Chilonzor tumani, 9-kvartal', type: 'full', spec: 'terapevt', exp: 'y1', min: 8000000, max: 15000000,
    requirements: ['Kamida 2 yil tajriba', 'Diplom va amaldagi sertifikat', 'Bemorlar bilan muloyim muomala'], about: 'Ish vaqti 09:00–18:00, haftada 6 kun (navbat bilan).\nMaosh: belgilangan qism + bajarilgan ishdan foiz. Rasmiy ishga olinadi.',
    phone: '+998901234567', telegram: 'smile_dent_hr', posted: '10 noyabr 2026', status: 'active', ownerId: O },
  { id: 'job-demo-2', title: 'Stomatolog assistenti', clinic: 'Andijon Dental', city: 'andijon', cityLabel: 'Andijon', address: 'Markaz', type: 'shift', spec: 'assistent', exp: 'none', min: 3500000, max: null,
    requirements: ['Tibbiyot kolleji diplomi'], about: '', phone: '', telegram: 'andijon_dental', posted: '9 noyabr 2026', status: 'active', ownerId: O },
  { id: 'job-demo-3', title: 'Administrator (qabulxona)', clinic: 'Oila Stom', city: 'samarqand', cityLabel: 'Samarqand', address: '', type: 'part', spec: 'admin', exp: '', min: null, max: null,
    requirements: [], about: 'Yarim kunlik ish, 14:00–20:00.', phone: '+998935554433', telegram: '', posted: '8 noyabr 2026', status: 'active', ownerId: O },
]
const FILLED = { title: 'Stomatolog-terapevt', clinic: 'Smile Dent klinikasi', city: 'toshkent', address: 'Chilonzor tumani, 9-kvartal', min: '8000000', max: '15000000', type: 'full', spec: 'terapevt', exp: 'y1',
  requirements: 'Kamida 2 yil tajriba\nDiplom va amaldagi sertifikat\nBemorlar bilan muloyim muomala', about: 'Ish vaqti 09:00–18:00, haftada 6 kun.', phone: '+998901234567', telegram: '@smile_dent_hr' }

export default function VakansiyaShot() {
  const { sec } = useParams()
  const v = useCatalogVersion()
  const [ready, setReady] = useState(false)
  useEffect(() => { setReady(true) }, [sec])
  // loadCatalog (real baza) ro‘yxatni almashtirsa — mock’ni qayta qo‘yamiz (faqat DEV skrinshot)
  if (jobs.length !== JOBS.length || jobs[0]?.id !== JOBS[0].id) jobs.splice(0, jobs.length, ...JOBS)
  if (!ready) return null
  void v
  if (sec === 'form-empty') return <div className="min-h-screen bg-page"><JobFormSheet onClose={() => {}} onDone={() => {}} /></div>
  if (sec === 'form-filled') return <div className="min-h-screen bg-page"><JobFormSheet initial={FILLED} onClose={() => {}} onDone={() => {}} /></div>
  if (sec === 'list') return <IshlarCatalog />
  if (window.innerWidth < 768) return <MobileIsh />
  return <ShopLayout active="ishlar" search="plain"><IshItem /></ShopLayout>
}
