import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { DEMO_ORGANIZER_ID } from './hubSeed'
import { scrubBlobPayload } from './demoPurge'

const blobs = new Map()
const accountListeners = new Set()
const catalogListeners = new Set()
let uid = null
let pendingUid = undefined
let ready = false
let applying = false
let blobTimer = null
const dirty = new Set()
let catalogVersion = 0
let syncError = ''

export function currentUid() {
  return uid
}

export function accountReady() {
  return ready
}

export function getSyncError() {
  return syncError
}

export function onAccount(listener) {
  accountListeners.add(listener)
  if (pendingUid !== undefined) listener(pendingUid)
  return () => accountListeners.delete(listener)
}

export function useCatalogVersion() {
  return useSyncExternalStore((listener) => {
    catalogListeners.add(listener)
    return () => catalogListeners.delete(listener)
  }, () => catalogVersion)
}

export function bindBlob(kind, api) {
  let seed = null
  if (api.seed !== undefined) {
    try {
      seed = structuredClone(typeof api.seed === 'function' ? api.seed() : api.seed)
    } catch {
      seed = typeof api.seed === 'function' ? api.seed() : api.seed
    }
  } else {
    try {
      seed = structuredClone(api.get())
    } catch {
      seed = api.get()
    }
  }
  blobs.set(kind, { ...api, seed })
}

export function touchBlob(kind) {
  if (applying || !ready || !uid || !blobs.has(kind)) return
  dirty.add(kind)
  clearTimeout(blobTimer)
  blobTimer = setTimeout(() => { flushBlobs().catch((error) => { syncError = error.message }) }, 400)
}

export async function saveBlob(kind, payload) {
  if (!supabase || !uid) return { ok: false }
  const { error } = await supabase.from('user_blobs').upsert({
    user_id: uid,
    kind,
    payload,
    updated_at: new Date().toISOString(),
  })
  if (error) {
    syncError = error.message
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function loadBlob(kind) {
  if (!supabase || !uid) return null
  const { data, error } = await supabase.from('user_blobs').select('payload').eq('user_id', uid).eq('kind', kind).maybeSingle()
  if (error) return null
  return data?.payload ?? null
}

async function flushBlobs() {
  if (!supabase || !uid) return
  const kinds = [...dirty]
  dirty.clear()
  await Promise.all(kinds.map(async (kind) => {
    const api = blobs.get(kind)
    if (!api) return
    const { error } = await supabase.from('user_blobs').upsert({
      user_id: uid,
      kind,
      payload: api.get(),
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
  }))
}

function resetBlobs() {
  applying = true
  blobs.forEach((api) => {
    if (typeof api.empty === 'function') api.set(api.empty())
    else if (Array.isArray(api.seed)) api.set([])
    else if (api.seed != null) {
      try { api.set(structuredClone(api.seed)) } catch { api.set(api.seed) }
    }
  })
  applying = false
}

async function pullBlobs() {
  if (!supabase || !uid) return
  const { data, error } = await supabase.from('user_blobs').select('kind,payload').eq('user_id', uid)
  if (error) {
    syncError = error.message
    return
  }
  const found = new Map((data || []).map((row) => [row.kind, row.payload]))
  const demo = isDemoUser()
  applying = true
  const scrubbedKinds = []
  for (const [kind, api] of blobs) {
    if (found.has(kind)) {
      let payload = found.get(kind)
      if (!demo) {
        const cleaned = scrubBlobPayload(kind, payload)
        if (JSON.stringify(cleaned) !== JSON.stringify(payload)) {
          payload = cleaned
          scrubbedKinds.push(kind)
        }
      }
      api.set(payload)
    } else if (demo && api.seed != null) {
      try { api.set(structuredClone(api.seed)) } catch { api.set(api.seed) }
    } else if (!demo && typeof api.empty === 'function') api.set(api.empty())
  }
  applying = false
  if (!demo && scrubbedKinds.length) {
    scrubbedKinds.forEach((kind) => dirty.add(kind))
    await flushBlobs().catch((error) => { syncError = error.message })
  }
  const missing = [...blobs.keys()].filter((kind) => !found.has(kind))
  if (demo && missing.length) {
    dirty.clear()
    await Promise.all(missing.map(async (kind) => {
      const api = blobs.get(kind)
      const { error: upsertError } = await supabase.from('user_blobs').upsert({
        user_id: uid,
        kind,
        payload: api.get(),
        updated_at: new Date().toISOString(),
      })
      if (upsertError) syncError = upsertError.message
    }))
  }
}

function setUid(next) {
  uid = next
  pendingUid = next
  ready = false
  accountListeners.forEach((listener) => listener(uid))
}

async function bootAccount(nextUid) {
  syncError = ''
  if (!nextUid) {
    ready = false
    setUid(null)
    resetBlobs()
    return
  }
  setUid(nextUid)
  await pullBlobs()
  ready = true
}

const targets = []

export function registerCatalog(kind, list) {
  targets.push({ kind, list })
}

const SEED_KINDS = new Set(['course', 'certificate'])

export async function loadCatalog() {
  if (!supabase) return
  const { data, error } = await supabase.from('catalog_items').select('kind,id,payload,sort_at,owner_id').limit(5000)
  // Real-data: successful fetch (even empty) replaces seed arrays so UI shows empty, not mocks.
  if (error) {
    syncError = error.message
    return
  }
  const grouped = new Map()
  ;(data || []).forEach((row) => {
    // Ownerless seed rows (demo courses/certificates) are not real content.
    if (!row.owner_id && SEED_KINDS.has(row.kind)) return
    if (!grouped.has(row.kind)) grouped.set(row.kind, [])
    grouped.get(row.kind).push(row)
  })
  let changed = false
  targets.forEach(({ kind, list }) => {
    if (!Array.isArray(list)) return
    const rows = grouped.get(kind) || []
    rows.sort((a, b) => (a.sort_at || 0) - (b.sort_at || 0))
    const next = rows.map((row) => row.payload)
    const same = list.length === next.length && list.every((item, i) => item?.id === next[i]?.id)
    if (same && list.length === next.length) return
    list.splice(0, list.length, ...next)
    changed = true
  })
  if (changed) {
    catalogVersion += 1
    catalogListeners.forEach((listener) => listener())
  }
}

export function isDemoUser() {
  return uid === DEMO_ORGANIZER_ID
}

function boot() {
  loadCatalog()
  if (!supabase) return
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
      bootAccount(session?.user?.id || null)
    }
  })
}

boot()

export async function uploadAvatar(dataUrl) {
  if (!supabase || !uid || !String(dataUrl).startsWith('data:')) return dataUrl
  const [meta, b64] = String(dataUrl).split(',')
  const mime = /data:(.*?);/.exec(meta)?.[1] || 'image/jpeg'
  const binary = atob(b64 || '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  const ext = mime.includes('png') ? 'png' : 'jpg'
  const path = `${uid}/avatar.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, bytes, { contentType: mime, upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}
