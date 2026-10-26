import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'

const ROLE_KEY = 'stomahub-auth-role'

let state = { status: 'loading', user: null, profile: null, error: '' }
const listeners = new Set()

function commit(next) {
  state = next
  listeners.forEach((listener) => listener())
}

export function getSession() {
  return state
}

export function useSession() {
  return useSyncExternalStore((listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }, getSession)
}

export function intendedRole() {
  try {
    return localStorage.getItem(ROLE_KEY) === 'organizer' ? 'organizer' : 'customer'
  } catch {
    return 'customer'
  }
}

export function setIntendedRole(role) {
  try {
    localStorage.setItem(ROLE_KEY, role === 'organizer' ? 'organizer' : 'customer')
  } catch {
    /* ignore private mode */
  }
}

export async function refreshSession() {
  if (!supabase) {
    commit({ status: 'anon', user: null, profile: null, error: 'Supabase sozlanmagan' })
    return state
  }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    commit({ status: 'anon', user: null, profile: null, error: '' })
    return state
  }
  const { data, error } = await supabase.from('profiles').select('id,role,name,phone,telegram_id,email,specialty,avatar_url,city,clinic').eq('id', session.user.id).maybeSingle()
  commit({
    status: 'authed',
    user: session.user,
    profile: data || null,
    error: error ? error.message : '',
  })
  return state
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
  commit({ status: 'anon', user: null, profile: null, error: '' })
}

function cleanRole(role) {
  return role === 'organizer' ? 'organizer' : 'customer'
}

export async function ensureProfile({ role, name, phone, specialty, email, forceRole = false } = {}) {
  if (!supabase) return { ok: false, error: 'Supabase sozlanmagan' }
  if (!state.user) await refreshSession()
  if (!state.user) return { ok: false, error: 'Avval kiring' }
  const uid = state.user.id
  const meta = state.user.user_metadata || {}
  const chosen = role === 'organizer' || role === 'customer' ? role : (meta.role === 'organizer' ? 'organizer' : 'customer')
  const { data: existing, error: readError } = await supabase.from('profiles').select('id,role').eq('id', uid).maybeSingle()
  if (readError) return { ok: false, error: readError.message }
  const patch = {
    name: name || meta.name || undefined,
    email: email || state.user.email || undefined,
    specialty: specialty || meta.specialty || undefined,
    updated_at: new Date().toISOString(),
  }
  if (phone) patch.phone = phone
  Object.keys(patch).forEach((key) => { if (patch[key] == null || patch[key] === '') delete patch[key] })
  if (!existing) {
    const row = {
      id: uid,
      role: cleanRole(chosen),
      name: name || meta.name || '',
      email: email || state.user.email || '',
      specialty: specialty || meta.specialty || '',
      phone: phone || meta.phone || null,
      updated_at: new Date().toISOString(),
    }
    let { error } = await supabase.from('profiles').insert(row)
    if (error && /duplicate|unique/i.test(error.message || '') && row.phone) {
      row.phone = null
      ;({ error } = await supabase.from('profiles').insert(row))
    }
    if (error && error.code !== '23505') return { ok: false, error: error.message }
  } else if (forceRole || !existing.role) {
    const nextRole = cleanRole(chosen)
    if (existing.role !== nextRole) {
      const { error } = await supabase.from('profiles').update({ role: nextRole, ...patch }).eq('id', uid)
      if (error) return { ok: false, error: error.message }
    } else if (Object.keys(patch).length) {
      await supabase.from('profiles').update(patch).eq('id', uid)
    }
  }
  await refreshSession()
  return { ok: true, profile: state.profile }
}

export async function becomeOrganizer() {
  return ensureProfile({ role: 'organizer', forceRole: true })
}

function boot() {
  if (!supabase) {
    commit({ status: 'anon', user: null, profile: null, error: 'Supabase sozlanmagan' })
    return
  }
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
      refreshSession()
    }
  })
  refreshSession()
}

boot()
