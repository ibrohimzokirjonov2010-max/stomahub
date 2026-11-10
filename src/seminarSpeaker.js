/** Nomni solishtirish uchun: apostroflar va ortiqcha bo‘shliqlar olib tashlanadi. */
export function normSpeakerName(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[''`‘’ʻʼ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function speakerLinkedId(speaker) {
  if (!speaker || typeof speaker !== 'object') return ''
  return String(
    speaker.userId || speaker.doctorId || speaker.profileId || speaker.mutaxassisId
    || speaker.user_id || speaker.doctor_id || speaker.profile_id || '',
  ).trim()
}

/**
 * Agar ma’ruzachi mutaxassis katalogida bo‘lsa, uning profiliga havola.
 * `doctors` — mutaxassislar ro‘yxati (id, name).
 */
export function findSpeakerDoctorHref(speaker, doctors = []) {
  const list = Array.isArray(doctors) ? doctors : []
  const id = speakerLinkedId(speaker)
  if (id && list.some((d) => d && String(d.id) === id)) return `/mutaxassislar/${id}`
  const n = normSpeakerName(speaker?.name)
  if (!n) return ''
  const d = list.find((x) => normSpeakerName(x?.name) === n)
  return d ? `/mutaxassislar/${d.id}` : ''
}

export function speakerNameOf(rec) {
  if (!rec) return ''
  if (typeof rec.speaker === 'string') return rec.speaker
  return rec.speaker?.name || rec.speakers?.[0]?.name || rec.doctor || ''
}

export function seminarsBySpeaker(list, speakerName, exceptId) {
  const n = normSpeakerName(speakerName)
  if (!n) return []
  return (list || []).filter((s) => s && s.id !== exceptId && normSpeakerName(speakerNameOf(s)) === n)
}
