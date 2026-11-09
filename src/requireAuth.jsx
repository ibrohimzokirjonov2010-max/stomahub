import { useCallback, useEffect } from 'react'
import { NEED_LOGIN_EVENT } from './loginPrompt'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useSession } from './sessionStore'

/** Joriy sahifaga qaytish manzili bilan kirish sahifasi havolasi. */
export function loginHref(next) {
  const target = next || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/')
  return `/kirish?next=${encodeURIComponent(target)}`
}

/** Himoyalangan sahifa: mehmonni /kirish?next=… ga yuboradi, kirgandan keyin shu sahifaga qaytadi. */
export function RequireAuth({ children }) {
  const session = useSession()
  const location = useLocation()
  // Playwright skrinshotlari uchun (window.__STOMAHUB_SHOT_OWNER__)
  if (typeof window !== 'undefined' && window.__STOMAHUB_SHOT_OWNER__) return children
  if (session.status === 'loading') {
    return <div className="grid min-h-[40vh] place-items-center text-[13px] text-ink-2" role="status">Yuklanmoqda…</div>
  }
  if (session.status !== 'authed') {
    return <Navigate replace to={loginHref(location.pathname + location.search)} />
  }
  return children
}

/**
 * Amal uchun kirishni talab qiladi: mehmon bo‘lsa kirish sahifasiga yuboradi va false qaytaradi.
 * Foydalanish: `const requireLogin = useRequireLogin(); if (!requireLogin()) return`
 */
export function useRequireLogin() {
  const session = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  return useCallback((next) => {
    if (session.status === 'authed') return true
    navigate(loginHref(next || location.pathname + location.search))
    return false
  }, [session.status, navigate, location.pathname, location.search])
}

/** Global: store’lardan kelgan “kirish kerak” hodisasini kirish sahifasiga yo‘naltiradi. */
export function LoginRedirector() {
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    const onNeed = (e) => navigate(loginHref(e.detail?.next || location.pathname + location.search))
    window.addEventListener(NEED_LOGIN_EVENT, onNeed)
    return () => window.removeEventListener(NEED_LOGIN_EVENT, onNeed)
  }, [navigate, location.pathname, location.search])
  return null
}
