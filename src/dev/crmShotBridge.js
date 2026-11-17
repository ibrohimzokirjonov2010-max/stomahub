import { __shotSession } from '../sessionStore'
import { addBemor, getBemor } from '../bemorData'
import { setVisits } from '../uchrashuvData'
import { setClinicSettings } from '../clinicSettings'
import { saveXizmat } from '../xizmatData'
import { savePlan } from '../rejaData'

if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__shotSession = __shotSession
  window.__addBemor = addBemor
  window.__getBemor = getBemor
  window.__setVisits = setVisits
  window.__setClinicSettings = setClinicSettings
  window.__saveXizmat = saveXizmat
  window.__savePlan = savePlan
}
