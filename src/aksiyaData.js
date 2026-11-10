import { useEffect, useState } from 'react'
import { isLive, leftSeconds } from './lib/aksiya'
import { tashkentToday } from './tashkentDate'

export const som = (n) => `${Number(n || 0).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m`

export function useCountdown(start) {
  const [sec, setSec] = useState(start)
  useEffect(() => {
    setSec(start)
    const id = setInterval(() => setSec((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [start])
  return sec
}

export function clock(sec) {
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const p = (n) => String(n).padStart(2, '0')
  return `${d} kun ${p(h)}:${p(m)}:${p(s)}`
}

// Real sotuvchi aksiyalari (catalog_items kind='deal', 0047/0068 trigger yozadi). Demo/soxta aksiya yo‘q.
export const deals = []

/** Faqat hozir amaldagi aksiyalar (muddati o‘tganlari avtomatik yashiriladi); qolgan vaqt endsOn dan hisoblanadi. */
export const getCatalog = (today = tashkentToday()) => deals
  .filter((d) => d && d.list !== false && isLive(d, today))
  .map((d) => ({ ...d, left: d.endsOn ? leftSeconds(d.endsOn) : 0 }))
export const getDeal = (id) => getCatalog().find((d) => d.id === id)
export const others = (id) => getCatalog().filter((d) => d.id !== id).slice(0, 4)
