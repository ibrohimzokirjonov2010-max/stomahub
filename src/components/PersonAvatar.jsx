import { useState } from 'react'

const TONES = [
  ['#0b8a95', '#ffffff'],
  ['#cdeaf6', '#0b6f8a'],
  ['#e9e3ff', '#6d4fd6'],
  ['#ffe8d6', '#c2410c'],
  ['#dff5e8', '#15803d'],
]

export default function PersonAvatar({ src, name = '', size = 32, className = '' }) {
  const [broken, setBroken] = useState(false)
  const letters = name.replace(/^Dr\.\s*/, '').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  const [bg, fg] = TONES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % TONES.length]
  const style = { width: size, height: size }
  if (!src || broken) {
    return <span style={{ ...style, background: bg, color: fg, fontSize: size * 0.36 }} className={`grid shrink-0 place-items-center rounded-full font-bold ${className}`}>{letters}</span>
  }
  return <img src={src} alt="" style={style} onError={() => setBroken(true)} className={`shrink-0 rounded-full object-cover ${className}`} />
}
