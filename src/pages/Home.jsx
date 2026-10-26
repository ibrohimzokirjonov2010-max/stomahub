import MobileHome from '../components/mobile/MobileHome'
import Responsive from '../components/mobile/Responsive'
import Landing from './Landing'

export default function Home() {
  return (
    <Responsive mobile={<MobileHome />}>
      <Landing />
    </Responsive>
  )
}
