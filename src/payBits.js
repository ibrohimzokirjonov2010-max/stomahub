import { useEffect, useState } from 'react'

export function useCountdown(start = 300) {
  const [left, setLeft] = useState(start)
  useEffect(() => {
    const id = window.setInterval(() => setLeft((n) => (n > 0 ? n - 1 : 0)), 1000)
    return () => window.clearInterval(id)
  }, [])
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  return { left, text: `${mm}:${ss}` }
}
