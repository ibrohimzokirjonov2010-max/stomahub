// Kirish talab qilinadigan amal (sevimli, post, e’lon…) mehmon tomonidan bosilganda chaqiriladi.
// React’dan tashqaridagi store’lar ham ishlata olishi uchun hodisa orqali: <LoginRedirector/> /kirish?next=… ga yuboradi.
import { currentUid, isDemoUser } from './recordSync'

export const NEED_LOGIN_EVENT = 'stomahub-need-login'

export function askLogin(next) {
  try { window.dispatchEvent(new CustomEvent(NEED_LOGIN_EVENT, { detail: { next } })) } catch { /* SSR */ }
}

/** true — foydalanuvchi kirgan; aks holda kirish sahifasiga yuboradi va false qaytaradi. */
export function ensureLogin(next) {
  if (currentUid() || isDemoUser()) return true
  askLogin(next)
  return false
}
