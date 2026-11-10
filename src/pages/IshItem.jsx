import { useParams } from 'react-router-dom'
import { useCatalogVersion } from '../recordSync'
import { getJob } from '../ishlarData'
import JobDetail from '../components/vakansiya/JobDetail'

export default function IshItem() {
  useCatalogVersion()
  const { id } = useParams()
  return <JobDetail job={getJob(id)} />
}
