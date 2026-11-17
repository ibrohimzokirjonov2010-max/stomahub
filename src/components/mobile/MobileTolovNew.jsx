import { useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useBemorlar } from '../../bemorData'
import { usePlans } from '../../rejaData'
import { som } from '../../tolovData'
import PaymentForm from '../crm/PaymentForm'
import { savePatientPayment } from '../crm/syncPatientRecords'

/**
 * Mobil /tolovlar/yangi — CRM dagi yagona PaymentForm (dialog).
 * Bemor va reja: ?patientId= / ?planId= yoki location.state.
 * Saqlash clinic_payments ga yoziladi, keyin /tolovlar ga qaytadi.
 */
export default function MobileTolovNew() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const patients = useBemorlar()
  const plans = usePlans()

  const planId = params.get('planId') || params.get('plan') || location.state?.planId || ''
  const patientId = params.get('patientId') || params.get('patient') || location.state?.patientId || ''
  const fromPlan = plans.find((p) => p.id === planId)

  const preselect = useMemo(() => {
    const id = patientId || fromPlan?.patient?.id
    if (id) {
      const found = patients.find((p) => p.id === id)
      if (found) return found
    }
    if (fromPlan?.patient?.name) {
      return patients.find((p) => p.name === fromPlan.patient.name) || fromPlan.patient
    }
    return null
  }, [patientId, fromPlan, patients])

  const back = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/tolovlar')
  }

  return (
    <PaymentForm
      patients={patients}
      patient={preselect}
      planId={planId}
      onClose={back}
      onSave={(row, opts) => {
        const patient = patients.find((p) => p.id === row.patientId) || preselect
        savePatientPayment(row, { ...opts, patient })
        navigate('/tolovlar', { replace: true, state: { toast: `${som(row.amount)} qabul qilindi · ${row.name}` } })
      }}
    />
  )
}
