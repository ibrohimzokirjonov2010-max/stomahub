import MobileHome from '../components/mobile/MobileHome'
import Responsive from '../components/mobile/Responsive'
import { useSession } from '../sessionStore'
import Landing from './Landing'

export default function Home() {
  // Mehmonlar telefonda ham dizayndagi landingni ko‘radi; kirgan foydalanuvchiga ilova bosh sahifasi.
  const session = useSession()
  if (session.status !== 'authed') return <Landing />
  return (
    <Responsive mobile={<MobileHome />}>
      <Landing />
    </Responsive>
  )
}
