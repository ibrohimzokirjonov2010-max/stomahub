import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

const NONE = [
  /^\/kirish$/,
  /^\/royxat$/,
  /^\/klinika$/,
  /^\/yangiliklar(\/.*)?$/,
  /^\/aksiyalar(\/.*)?$/,
  /^\/xizmatlar$/,
  /^\/davolash-rejalari(\/.*)?$/,
  /^\/tashkilotchi$/,
]

const BAR = [
  /^\/product\/[^/]+$/,
  /^\/forma\/[^/]+$/,
  /^\/jihozlar\/[^/]+$/,
  /^\/ortiqcha\/[^/]+$/,
  /^\/buyurtma$/,
  /^\/buyurtma\/rasmiylashtirish$/,
  /^\/seminarlar\/[^/]+\/royxat$/,
  /^\/kitoblar\/[^/]+\/oqish$/,
  /^\/bemorlar\/[^/]+$/,
  /^\/uchrashuvlar\/yangi$/,
  /^\/tolovlar\/yangi$/,
]

const BLEED = [
  /^\/product\/[^/]+$/,
  /^\/forma\/[^/]+$/,
  /^\/jihozlar\/[^/]+$/,
  /^\/ortiqcha\/[^/]+$/,
  /^\/seminarlar\/[^/]+$/,
]

const hit = (list, path) => list.some((re) => re.test(path))

export default function MobileChrome() {
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.chrome = hit(NONE, pathname) ? 'none' : hit(BAR, pathname) ? 'bar' : 'app'
    root.dataset.bleed = hit(BLEED, pathname) ? '1' : '0'
  }, [pathname])
  return null
}
