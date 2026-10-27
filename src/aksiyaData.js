import { useEffect, useState } from 'react'

const img = (name) => `/images/aksiyalar/${name}.jpg`
const left = (d, h, m, s) => d * 86400 + h * 3600 + m * 60 + s

export const som = (n) => `${n.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m`

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

const sellerOf = (brand) => ({
  name: brand ? `${brand}` : 'Sotuvchi',
  role: 'Sotuvchi',
  products: '0',
  rating: 0,
  reply: '',
  address: '',
})

export const deals = [].map((d) => ({ ...d, seller: d.seller || sellerOf(d.brand), images: d.images || [d.image] }))

export const getCatalog = () => deals.filter((d) => d.list !== false)
export const catalog = getCatalog() // initial; prefer getCatalog() after loadCatalog
export const getDeal = (id) => deals.find((d) => d.id === id)
export const others = (id) => getCatalog().filter((d) => d.id !== id).slice(0, 4)
