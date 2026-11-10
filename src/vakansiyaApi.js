// Vakansiyalar: catalog_items (kind='job'), egasi — joylagan foydalanuvchi. Server tekshiruvi: 0069 job_guard.
import { supabase } from './supabaseClient'
import { currentUid, loadCatalog, useCatalogVersion } from './recordSync'
import { jobs } from './ishlarData'
import { jobError, toPayload, validateJob } from './lib/vakansiya'

const need = () => {
  const uid = currentUid()
  if (!supabase) throw new Error('Supabase sozlanmagan')
  if (!uid) throw new Error('Vakansiya joylash uchun hisobingizga kiring')
  return uid
}
const check = (f) => {
  const e = validateJob(f)
  const first = Object.values(e)[0]
  if (first) throw new Error(first)
}

export async function postJob(f) {
  const uid = need()
  check(f)
  const id = `job-${uid.slice(0, 8)}-${Date.now().toString(36)}`
  const { error } = await supabase.from('catalog_items').insert({ kind: 'job', id, payload: toPayload(f, id), sort_at: -Date.now(), owner_id: uid, status: 'active' })
  if (error) throw new Error(jobError(error))
  await loadCatalog()
  return id
}

export async function updateJob(job, f) {
  const uid = need()
  check(f)
  const { error } = await supabase.from('catalog_items').update({ payload: toPayload(f, job.id, job), updated_at: new Date().toISOString() })
    .eq('kind', 'job').eq('id', job.id).eq('owner_id', uid)
  if (error) throw new Error(jobError(error))
  await loadCatalog()
}

export async function setJobStatus(id, status) {
  const uid = need()
  const { error } = await supabase.from('catalog_items').update({ status, updated_at: new Date().toISOString() })
    .eq('kind', 'job').eq('id', id).eq('owner_id', uid)
  if (error) throw new Error(jobError(error))
  await loadCatalog()
}

export async function deleteJob(id) {
  const uid = need()
  const { error } = await supabase.from('catalog_items').delete().eq('kind', 'job').eq('id', id).eq('owner_id', uid)
  if (error) throw new Error(jobError(error))
  await loadCatalog()
}

/** Joriy foydalanuvchining vakansiyalari (faol + yopilgan). */
export function useMyJobs() {
  useCatalogVersion()
  const uid = currentUid()
  return uid ? jobs.filter((j) => j.ownerId === uid) : []
}
export const isMine = (j) => !!j && !!currentUid() && j.ownerId === currentUid()
