/** Known Klinika CRM demo fingerprints — used to scrub persisted user_blobs for real accounts. */
export const DEMO_PATIENT_NAMES = new Set([
  'Aliyeva Malika', 'Karimov Akmal', 'Qodirov Bekzod', 'Saydullayeva Gulnoza', 'Ismoilov Diyor',
  'Tursunova Nilufar', 'Rahmonov Sardor', 'Abdullayeva Sevinch', 'Murodov Jasur', 'Xolmirzayev Aziz',
  'Hamitova Sarvinoz', 'Nazarov Jahongir', 'Yusupova Malika', 'Karimova Dilnoza',
  'Aliyeva Mohira', 'Tursunov Bobur', 'Karimov Aziz', 'Malika Karimova', 'Normatova Dilnoza',
  'Ismoilova Madina', 'Qodirov Temur', 'Karimova Saida', 'Jabborova Sevara',
])

export const DEMO_PROFILE_NAMES = new Set([
  'Dr. Ibrohim', 'Dr. Ibrohim Zokirjonov', 'Ibrohim',
])

export function looksLikeDemoName(name) {
  const n = String(name || '').trim()
  if (!n) return false
  if (DEMO_PATIENT_NAMES.has(n) || DEMO_PROFILE_NAMES.has(n)) return true
  return /Aliyeva Malika|Karimov Akmal|Tursunova Nilufar|Qodirov Bekzod|Dr\. Ibrohim/i.test(n)
}

export function scrubDemoList(list) {
  if (!Array.isArray(list) || !list.length) return []
  const hit = list.filter((row) => looksLikeDemoName(row?.name || row?.patient?.name || row?.who))
  // If ≥3 known demo names (or ≥40% of rows), treat whole payload as seed dump.
  if (hit.length >= 3 || (list.length >= 5 && hit.length / list.length >= 0.4)) return []
  return list.filter((row) => !looksLikeDemoName(row?.name || row?.patient?.name || row?.who))
}

export function scrubClinicBoard(payload) {
  if (!payload || typeof payload !== 'object') return { settings: {}, visits: [], patients: [] }
  const visits = scrubDemoList(payload.visits || [])
  const patients = scrubDemoList(payload.patients || [])
  return { ...payload, visits, patients }
}

export function scrubBlobPayload(kind, payload) {
  if (payload == null) return payload
  if (kind === 'clinic_board') return scrubClinicBoard(payload)
  if (kind === 'plans' && payload && typeof payload === 'object') {
    return { ...payload, plans: scrubDemoList(payload.plans || []) }
  }
  if (kind === 'visits' && Array.isArray(payload)) return scrubDemoList(payload.filter((v) => !/^(m-|u\d)/.test(String(v?.id || ''))))
  if (Array.isArray(payload)) return scrubDemoList(payload)
  return payload
}

export function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}
