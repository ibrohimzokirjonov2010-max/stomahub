import { Link } from 'react-router-dom'

// Lucide'da tish ikonkasi yo'q, shuning uchun o'zimiz chizamiz
export function ToothIcon({ className = 'size-5', strokeWidth = 1.8 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7.5 3C5 3 3.5 5 3.5 7.6c0 2.2.9 3.6 1.6 5 .7 1.5.9 3.2 1.2 5 .3 1.9.9 3.4 2 3.4 1.3 0 1.6-1.6 1.9-3.3.3-1.6.6-3 1.8-3s1.5 1.4 1.8 3c.3 1.7.6 3.3 1.9 3.3 1.1 0 1.7-1.5 2-3.4.3-1.8.5-3.5 1.2-5 .7-1.4 1.6-2.8 1.6-5C20.5 5 19 3 16.5 3c-1.9 0-2.9 1.1-4.5 1.1S9.4 3 7.5 3Z" />
    </svg>
  )
}

export function Logo() {
  return (
    <Link to="/" aria-label="StomaHub" className="inline-flex items-center">
      <img src="/images/logo.png" alt="" className="h-[30px] w-auto" />
    </Link>
  )
}
