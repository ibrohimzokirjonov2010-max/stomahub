import { supabase, friendlySupabaseError } from './supabaseClient'
import { loadCatalog, currentUid } from './recordSync'

/** Upsert one catalog row owned by the current user. */
export async function upsertCatalogItem(kind, item, sortAt = 0) {
  const uid = currentUid()
  if (!supabase) throw new Error('Supabase sozlanmagan')
  if (!uid) throw new Error('Hisobga kiring')
  if (!kind || !item?.id) throw new Error('kind va id majburiy')
  const { error } = await supabase.from('catalog_items').upsert({
    kind,
    id: String(item.id),
    payload: item,
    sort_at: sortAt,
    owner_id: uid,
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(friendlySupabaseError(error))
  await loadCatalog()
  return { ok: true }
}

export async function removeCatalogItem(kind, id) {
  const uid = currentUid()
  if (!supabase) throw new Error('Supabase sozlanmagan')
  if (!uid) throw new Error('Hisobga kiring')
  const { error } = await supabase.from('catalog_items').delete().eq('kind', kind).eq('id', String(id)).eq('owner_id', uid)
  if (error) throw new Error(friendlySupabaseError(error))
  await loadCatalog()
  return { ok: true }
}

export async function listMyCatalog(kind) {
  const uid = currentUid()
  if (!supabase || !uid) return []
  const q = supabase.from('catalog_items').select('kind,id,payload,sort_at').eq('owner_id', uid).order('sort_at')
  const { data, error } = kind ? await q.eq('kind', kind) : await q
  if (error) throw new Error(friendlySupabaseError(error))
  return data || []
}
