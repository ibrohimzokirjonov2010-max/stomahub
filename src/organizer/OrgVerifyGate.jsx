import { canUseOrganizer, useSession } from '../sessionStore'
import { VerifyPanel } from '../seller/VerifyGate'
import { ORGANIZER_APPLICATION } from '../apply/organizerConfig'

/** Stage 2 gate for organizers: approved organizers/admins see the section, others see "Tasdiqdan o‘ting". */
export default function OrgVerifyGate({ children, section }) {
  const session = useSession()
  if (canUseOrganizer(session.profile)) return children
  return <VerifyPanel section={section} config={ORGANIZER_APPLICATION} />
}

export function OrgVerifyPage() {
  return <VerifyPanel config={ORGANIZER_APPLICATION} />
}
