// DEV-only: tish kartasi skrinshotlari uchun soxta bemor va reja (faqat xotirada, bazaga yozilmaydi).
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { __shotSession } from '../sessionStore'
import { addBemor, getBemor } from '../bemorData'
import { getPlan, savePlan } from '../rejaData'

const PID = 'shot-bemor-teeth'
const PLAN = 'shot-reja-teeth'
const TEETH = {
  18: 'missing', 17: 'crown', 16: 'endo', 15: 'filling', 14: 'caries', 13: 'post', 11: 'veneer',
  21: 'zirconia', 24: 'filling', 26: 'implant', 27: 'implant_crown', 28: 'missing',
  48: 'missing', 47: 'bridge', 46: 'endo', 45: 'caries', 43: 'braces', 41: 'braces', 31: 'braces',
  33: 'braces', 35: 'perio', 36: 'denture', 37: 'butterfly', 38: 'mobility', 34: 'fracture',
}

export default function TeethShot() {
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  useEffect(() => {
    __shotSession?.({ id: 'shot-doc', role: 'customer', name: 'Test shifokor', full_name: 'Test shifokor' })
    if (!getBemor(PID)) {
      addBemor({
        id: PID, code: 'BM-TEST', name: 'Test Bemor', birth: '12.04.1990', age: 36, gender: 'Erkak', phone: '+998 90 000 00 00',
        email: '', city: 'Toshkent', status: 'Davolanishda', total: 4200000, paid: 1500000, teeth: TEETH,
        visits: [{ date: '10.11.2026', kind: 'Endodontik davolash', tooth: '46', doctor: 'Test shifokor', done: true }],
      })
    }
    if (!getPlan(PLAN)) {
      savePlan({
        id: PLAN, code: 'DR-TEST', title: 'Kompleks davolash rejasi (test)', status: 'jarayonda', doctor: 'me', start: '2026-11-10', paid: 1500000,
        patient: { id: PID, name: 'Test Bemor', code: 'BM-TEST', phone: '+998 90 000 00 00' },
        stages: [
          { id: 's1', title: 'Kanal davolash', desc: '46-tish endodontiya', teeth: [46], art: 'endo', price: 900000, date: '2026-11-10', status: 'bajarildi' },
          { id: 's2', title: 'Kompozit plomba', desc: '15, 24-tishlar', teeth: [15, 24], art: 'filling', price: 700000, date: '2026-11-14', status: 'jarayonda' },
          { id: 's3', title: 'Implant o‘rnatish', desc: '36-tish o‘rniga implant', teeth: [36], art: 'implant', price: 3500000, date: '', status: 'rejada' },
          { id: 's4', title: 'Sirkon koronka', desc: '21-tish', teeth: [21], art: 'crown', price: 1800000, date: '', status: 'rejada' },
          { id: 's5', title: 'Shtift va metall-keramika krona', desc: '16-tish', teeth: [16], art: 'post', price: 1600000, date: '', status: 'rejada' },
        ],
        teeth: { 46: 'endo', 15: 'filling', 24: 'filling', 36: 'missing' }, surfaces: { 15: ['O', 'M'] }, visits: [], payments: [],
      })
    }
    navigate(sp.get('to') || `/bemorlar/${PID}`, { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
