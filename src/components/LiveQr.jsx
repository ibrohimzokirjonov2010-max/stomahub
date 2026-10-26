import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function LiveQr({ text, className = 'size-32' }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let on = true
    QRCode.toDataURL(text || 'STH', { margin: 1, width: 280, errorCorrectionLevel: 'M' })
      .then((url) => { if (on) setSrc(url) })
      .catch(() => {})
    return () => { on = false }
  }, [text])
  if (!src) return <span className={`inline-block rounded bg-white ${className}`} />
  return <img src={src} alt="" className={`rounded bg-white ${className}`} />
}
