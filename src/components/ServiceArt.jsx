import { useId } from 'react'

const TOOTH = 'M20 9c-7 0-11 5.5-11 13 0 6 2.3 10 3.3 15.5C13.5 44 14.6 56 20 56c4.5 0 4.6-10.5 9-14.6.9-.8 2-1.1 3-1.1s2.1.3 3 1.1C39.4 45.5 39.5 56 44 56c5.4 0 6.5-12 7.7-18.5C52.7 32 55 28 55 22c0-7.5-4-13-11-13-4.6 0-6.8 2.2-12 2.2S24.6 9 20 9z'

function Defs({ id }) {
  return (
    <defs>
      <linearGradient id={`${id}-t`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="#dbe4ee" />
      </linearGradient>
      <linearGradient id={`${id}-m`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8a97a8" />
        <stop offset=".5" stopColor="#e9eef4" />
        <stop offset="1" stopColor="#7b889a" />
      </linearGradient>
      <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff7e6" />
        <stop offset="1" stopColor="#e8d3ac" />
      </linearGradient>
    </defs>
  )
}

function Tooth({ id, transform }) {
  return (
    <g transform={transform}>
      <path d={TOOTH} fill={`url(#${id}-t)`} stroke="#c9d4e0" strokeWidth="1.2" />
      <path d="M18 15c-3 1.5-4.5 4.5-4.5 8" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".9" />
    </g>
  )
}

const ART = {
  profilaktika: (id) => (
    <>
      <Tooth id={id} transform="translate(-4 2) scale(.9)" />
      <g transform="rotate(38 46 30)">
        <rect x="44" y="4" width="5" height="44" rx="2.5" fill="#22a7b3" />
        <rect x="42.5" y="4" width="8" height="12" rx="2" fill="#e6f7f8" stroke="#22a7b3" strokeWidth="1" />
        {[0, 1, 2, 3].map((i) => <line key={i} x1={43.5 + i * 2} y1="5" x2={43.5 + i * 2} y2="15" stroke="#7dd3da" strokeWidth="1" />)}
      </g>
    </>
  ),
  terapiya: (id) => (
    <>
      <Tooth id={id} />
      <path d="M27 20c2-2 8-2 10 0 1.5 1.6.5 5-5 5s-6.5-3.4-5-5z" fill="#93c5fd" stroke="#60a5fa" strokeWidth="1" />
    </>
  ),
  endodontiya: (id) => (
    <>
      <Tooth id={id} />
      <path d="M24 20c0-3 4-4 8-4s8 1 8 4c0 3-2 5-3 9-1 5-1 15-3 15s-1.5-10-2-14c-.5 4 0 14-2 14s-2-10-3-15c-1-4-3-6-3-9z" fill="#ef4444" opacity=".85" />
      <path d="M26 20c1-1.5 3-2 6-2" stroke="#fecaca" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
  jarrohlik: (id) => (
    <>
      <Tooth id={id} transform="translate(26 30) scale(.45)" />
      <path d="M14 58 30 22c1.5-3.5 5-5 8-3" fill="none" stroke={`url(#${id}-m)`} strokeWidth="5" strokeLinecap="round" />
      <path d="M26 58 34 24c1-3.5 4-5.5 7-4" fill="none" stroke={`url(#${id}-m)`} strokeWidth="5" strokeLinecap="round" />
      <circle cx="31" cy="34" r="2.6" fill="#64748b" />
      <path d="M38 19c4-2 9 0 10 5" fill="none" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" />
    </>
  ),
  implantologiya: (id) => (
    <>
      <path d="M18 10c-5 0-8 4-8 9 0 4 2 6 4 8h36c2-2 4-4 4-8 0-5-3-9-8-9-3.5 0-5 1.6-9 1.6S21.5 10 18 10z" fill={`url(#${id}-t)`} stroke="#c9d4e0" strokeWidth="1.2" />
      <rect x="27" y="27" width="10" height="5" rx="1" fill="#cbd5e1" />
      <path d="M25 32h14l-1.5 22c-.3 3-2.5 4-5.5 4s-5.2-1-5.5-4z" fill={`url(#${id}-m)`} />
      {[36, 40, 44, 48, 52].map((y) => <path key={y} d={`M25.5 ${y}h13`} stroke="#64748b" strokeWidth="1.2" />)}
    </>
  ),
  ortodontiya: (id) => (
    <>
      {[4, 22, 40].map((x) => <path key={x} transform={`translate(${x} 14) scale(.32 .55)`} d={TOOTH} fill={`url(#${id}-t)`} stroke="#c9d4e0" strokeWidth="2" />)}
      <path d="M6 30c10 3 42 3 52 0" stroke="#94a3b8" strokeWidth="1.6" fill="none" />
      {[13, 31, 49].map((x) => <rect key={x} x={x - 3.5} y="27" width="7" height="6" rx="1.2" fill={`url(#${id}-m)`} stroke="#64748b" strokeWidth=".6" />)}
    </>
  ),
  estetik: () => (
    <>
      <path d="M4 32c8-10 16-14 22-11 3 1.5 4 1.5 6 1.5s3 0 6-1.5c6-3 14 1 22 11-8 12-18 18-28 18S12 44 4 32z" fill="#f87171" />
      <path d="M8 32c8 4 16 6 24 6s16-2 24-6c-5-4-14-6-24-6S13 28 8 32z" fill="#fff" />
      {[16, 23, 30, 37, 44].map((x) => <line key={x} x1={x + 1} y1="27.5" x2={x + 1} y2="37" stroke="#e5e7eb" strokeWidth="1" />)}
      <path d="M14 22c5-2 9-1 12 1" stroke="#fecaca" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  protezlash: (id) => (
    <>
      <path transform="translate(-2 22) scale(.4)" d={TOOTH} fill={`url(#${id}-g)`} stroke="#d6bf94" strokeWidth="2.5" />
      <path transform="translate(38 22) scale(.4)" d={TOOTH} fill={`url(#${id}-g)`} stroke="#d6bf94" strokeWidth="2.5" />
      <path transform="translate(15 10) scale(.55)" d={TOOTH} fill={`url(#${id}-t)`} stroke="#c9d4e0" strokeWidth="2" />
    </>
  ),
  bolalar: (id) => (
    <>
      <Tooth id={id} />
      <circle cx="25" cy="25" r="2" fill="#334155" />
      <circle cx="39" cy="25" r="2" fill="#334155" />
      <path d="M26 31c3 3.5 9 3.5 12 0" stroke="#334155" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="21" cy="30" r="2.2" fill="#fda4af" opacity=".7" />
      <circle cx="43" cy="30" r="2.2" fill="#fda4af" opacity=".7" />
      <path d="M53 8l1.2 3 3 1.2-3 1.2L53 16.4l-1.2-3-3-1.2 3-1.2z" fill="#facc15" />
    </>
  ),
}

export default function ServiceArt({ kind = 'terapiya', className = 'size-10' }) {
  const id = `sa${useId().replace(/:/g, '')}`
  const draw = ART[kind] || ART.terapiya
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <Defs id={id} />
      {draw(id)}
    </svg>
  )
}

export const ART_KINDS = Object.keys(ART)
