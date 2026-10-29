import { Navigate } from 'react-router-dom'
import MobileHome from '../components/mobile/MobileHome'
import Responsive from '../components/mobile/Responsive'
import { useSession } from '../sessionStore'
import Landing from './Landing'

// Kirishdan keyin qayerga tushsa, bosh sahifa ham o‘sha joy (Auth.jsx dagi destination bilan bir xil).
function appHome(role) {
  if (role === 'organizer') return '/tashkilotchi'
  if (role === 'seller') return '/sotuvchi'
  return '/klinika'
}

export default function Home() {
  // Mehmonlar landingni ko‘radi; kirgan foydalanuvchi telefonda MobileHome, kompyuterda ilova bosh sahifasiga o‘tadi.
  const session = useSession()
  if (session.status !== 'authed') return <Landing />
  return (
    <Responsive mobile={<MobileHome />}>
      <Navigate to={appHome(session.profile?.role)} replace />
    </Responsive>
  )
}
