import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const KEY = 'stomahub-flash'

// Sahifa almashganda ham ko‘rinadigan qisqa bildirishnoma
export function flashToast(text) {
  try { sessionStorage.setItem(KEY, text) } catch { /* ignore */ }
  window.dispatchEvent(new Event(KEY))
}

export default function FlashToast() {
  const { pathname } = useLocation()
  const [text, setText] = useState('')
  useEffect(() => {
    const pick = () => {
      let v = ''
      try { v = sessionStorage.getItem(KEY) || ''; sessionStorage.removeItem(KEY) } catch { /* ignore */ }
      if (v) setText(v)
    }
    pick()
    window.addEventListener(KEY, pick)
    return () => window.removeEventListener(KEY, pick)
  }, [pathname])
  useEffect(() => {
    if (!text) return undefined
    const id = setTimeout(() => setText(''), 4000)
    return () => clearTimeout(id)
  }, [text])
  if (!text) return null
  return (
    <div role="status" className="fixed left-1/2 top-4 z-[100] -translate-x-1/2 rounded-xl bg-[#0b8a84] px-4 py-3 text-[14px] font-semibold text-white shadow-lg">
      {text}
    </div>
  )
}
