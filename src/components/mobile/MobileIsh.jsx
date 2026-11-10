import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useCatalogVersion } from '../../recordSync'
import { getJob } from '../../ishlarData'
import JobDetail from '../vakansiya/JobDetail'

// Mobil vakansiya sahifasi — desktop bilan bir xil real ma’lumot; pastda «Qo‘ng‘iroq / Telegram» paneli (safe-area).
export default function MobileIsh() {
  useCatalogVersion()
  const { id } = useParams()
  useEffect(() => { window.scrollTo(0, 0) }, [id])
  return <div className="min-h-screen bg-white"><JobDetail job={getJob(id)} mobile /></div>
}
