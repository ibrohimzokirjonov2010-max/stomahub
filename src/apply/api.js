// Role applications (seller now, organizer later). Table: seller_applications, bucket: role-docs (private).
import { supabase, friendlySupabaseError } from '../supabaseClient'
import { getSession, refreshSession } from '../sessionStore'

export const DOCS_BUCKET = 'role-docs'
const uid = () => getSession().user?.id
const fail = (e) => {
  if (!e) return ''
  const m = friendlySupabaseError(e)
  return /seller_applications|role-docs|Bucket not found|admin_review_application/i.test(m + (e.message || ''))
    ? 'Ariza tizimi hali yoqilmagan (0025 migratsiyasi qo‘llanmagan).' : m
}

/** The user's latest application of this kind (or null). */
export async function myApplication(kind = 'seller') {
  if (!supabase || !uid()) return { ok: false, error: 'Avval kiring' }
  const { data, error } = await supabase.from('seller_applications').select('*')
    .eq('user_id', uid()).eq('kind', kind).order('created_at', { ascending: false }).limit(1)
  if (error) return { ok: false, error: fail(error) }
  return { ok: true, data: data?.[0] || null }
}

/** Upload one document to {uid}/{batch}/{key}-{ts}.{ext}. Returns doc meta stored in the application. */
export async function uploadDoc(file, key, label, batch) {
  if (!supabase || !uid()) return { ok: false, error: 'Avval kiring' }
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${uid()}/${batch}/${key}-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(DOCS_BUCKET).upload(path, file, { contentType: file.type, upsert: false })
  if (error) return { ok: false, error: fail(error) }
  return { ok: true, doc: { key, label, path, name: file.name, type: file.type, size: file.size } }
}

export async function removeDocs(paths) {
  if (supabase && paths.length) await supabase.storage.from(DOCS_BUCKET).remove(paths)
}

/** Signed URLs for a docs array (owner or admin, via storage RLS). */
export async function signDocs(docs = []) {
  if (!supabase || !docs.length) return docs
  const { data } = await supabase.storage.from(DOCS_BUCKET).createSignedUrls(docs.map((d) => d.path), 60 * 30)
  return docs.map((d, i) => ({ ...d, url: data?.[i]?.signedUrl || '' }))
}

/** Insert application (pending) and flip profile status via request_*_role. */
export async function submitApplication(config, values, docs) {
  if (!supabase || !uid()) return { ok: false, error: 'Avval kiring' }
  const row = { user_id: uid(), kind: config.kind, ...config.toRow(values), docs }
  const { data, error } = await supabase.from('seller_applications').insert(row).select('*').single()
  if (error) return { ok: false, error: /one_pending|duplicate/i.test(error.message) ? 'Sizda ko‘rib chiqilayotgan ariza bor' : fail(error) }
  const r = await supabase.rpc(config.requestRpc, config.requestArgs(values))
  if (r.error) return { ok: false, error: fail(r.error), data }
  await refreshSession()
  return { ok: true, data }
}

// ---- admin ----
export async function adminListApplications(kind = 'seller', status = '') {
  let q = supabase.from('seller_applications').select('*').eq('kind', kind).order('created_at', { ascending: false }).limit(200)
  if (status) q = q.eq('status', status)
  const { data, error } = await q
  return error ? { ok: false, error: fail(error), data: [] } : { ok: true, data: data || [] }
}

export async function adminReviewApplication(id, approve, reason = '') {
  const { data, error } = await supabase.rpc('admin_review_application', { p_id: id, p_approve: approve, p_reason: reason })
  if (error) return { ok: false, error: fail(error) }
  // best-effort Telegram notice (only if the applicant logged in via Telegram and the bot token is set)
  try {
    const token = (await supabase.auth.getSession()).data.session?.access_token
    if (token) await fetch('/api/notify/role-review', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ id }) })
  } catch { /* ignore */ }
  return { ok: true, data }
}

/** Stage 1: short registration -> seller_status 'registered' (cabinet: Sozlamalar only). */
export async function registerSeller(v, addressWithGeo) {
  if (!supabase || !uid()) return { ok: false, error: 'Avval kiring' }
  const { data, error } = await supabase.rpc('register_seller', {
    p_owner_name: v.owner_name.trim(), p_shop_name: v.shop_name.trim(), p_address: addressWithGeo,
    p_phone: v.phone, p_telegram: v.telegram.trim(), p_instagram: v.instagram.trim(), p_logo_url: v.logo_url || '',
  })
  if (error) return { ok: false, error: /register_seller/.test(error.message || '') ? 'Ro‘yxatdan o‘tish hali yoqilmagan (0025 migratsiyasi qo‘llanmagan).' : fail(error) }
  await refreshSession()
  return { ok: true, data }
}

/** Own profile + seller_settings, used to prefill both stages. */
export async function loadPrefill() {
  if (!supabase || !uid()) return { profile: {}, settings: {} }
  const [p, s] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', uid()).maybeSingle(),
    supabase.from('seller_settings').select('*').eq('seller_id', uid()).maybeSingle(),
  ])
  return { profile: p.data || {}, settings: s.data || {} }
}
