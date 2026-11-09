import { useSession } from '../sessionStore'
import { useProfile } from '../profileStore'
import { useInterest } from './interestStore'
import { normalizeSpecialty } from './specialtyMap.js'

/** Kirgan shifokor (mijoz) uchun shaxsiylashtirish konteksti. */
export function usePersonal() {
  const session = useSession()
  const profile = useProfile()
  const { signals, serverOk } = useInterest()
  const authed = session.status === 'authed'
  const role = session.profile?.role || ''
  const isDoctor = authed && !['seller', 'organizer', 'admin'].includes(role)
  const specialtyRaw = authed ? String((profile.accountLive ? profile.role : '') || session.profile?.specialty || '').trim() : ''
  return { authed, isDoctor, uid: session.user?.id || '', specialtyRaw, specialty: normalizeSpecialty(specialtyRaw), signals, serverOk }
}
