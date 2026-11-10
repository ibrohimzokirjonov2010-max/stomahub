import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const BRAND = 'StomaHub'
export const ROUTE_TITLES = [
  ['/marketplace', 'Marketplace'], ['/kategoriyalar', 'Kategoriyalar'], ['/product/', 'Mahsulot'], ['/dokon/', 'Do‘kon'],
  ['/savatcha', 'Savatcha'], ['/buyurtma/kuzatish/', 'Buyurtma kuzatuvi'], ['/buyurtma', 'Buyurtmani rasmiylashtirish'],
  ['/seminarlar', 'Seminarlar'], ['/talim', 'Ta’lim'], ['/kitoblar', 'Kitoblar'], ['/ustalar', 'Ustalar'],
  ['/mutaxassislar', 'Mutaxassislar'], ['/jihozlar', 'Jihozlar'], ['/forma', 'Tibbiy forma'], ['/ishlar', 'Vakansiyalar'],
  ['/elonlar', 'E’lonlar'], ['/ortiqcha', 'Ortiqcha mahsulotlar'], ['/aksiyalar', 'Aksiyalar'], ['/brendlar', 'Brendlar'],
  ['/yangiliklar', 'Yangiliklar'], ['/kanallar', 'Kanallar'], ['/community', 'Hamjamiyat'], ['/hamjamiyat', 'Hamjamiyat'],
  ['/sertifikatlar', 'Sertifikatlar'], ['/kirish', 'Kirish'], ['/royxat', 'Ro‘yxatdan o‘tish'],
  ['/sotuvchi-bolish', 'Sotuvchi bo‘lish'], ['/tashkilotchi-bolish', 'Tashkilotchi bo‘lish'],
  ['/sotuvchi', 'Sotuvchi kabineti'], ['/tashkilotchi', 'Tashkilotchi kabineti'], ['/admin', 'Admin paneli'],
  ['/klinika', 'Klinika kabineti'], ['/profil', 'Profil'], ['/maxfiylik', 'Maxfiylik siyosati'],
  ['/foydalanish-shartlari', 'Foydalanish shartlari'],
]

export function titleFor(pathname) {
  if (pathname === '/' || !pathname) return `${BRAND} — Stomatologik marketplace`
  const hit = ROUTE_TITLES.find(([p]) => (p.endsWith('/') ? pathname.startsWith(p) : pathname === p || pathname.startsWith(`${p}/`)))
  return hit ? `${hit[1]} — ${BRAND}` : `${BRAND} — Stomatologik marketplace`
}

// Har bir sahifa uchun standart sarlavha (sahifa o‘zi aniqroq sarlavha qo‘ysa, u keyin ishlaydi)
export function RouteTitle() {
  const { pathname } = useLocation()
  useEffect(() => { document.title = titleFor(pathname) }, [pathname])
  return null
}
