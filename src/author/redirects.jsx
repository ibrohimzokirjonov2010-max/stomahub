import { Navigate, useParams } from 'react-router-dom'

/** Eski /tashkilotchi/kurslar/:id → yangi konstruktor. */
export function LegacyCourseRedirect() {
  const { id } = useParams()
  return <Navigate to={`/kurs-muallifi/kurslar/${encodeURIComponent(id || '')}/tahrir`} replace />
}
