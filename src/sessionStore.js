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
  const { data, error } = await supabase.from('profiles').select('id,role,name,phone,telegram_id,email,specialty,avatar_url').eq('id', session.user.id).maybeSingle()
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

export async function becomeOrganizer() {
  if (!supabase || !state.user) return { ok: false, error: 'Avval kiring' }
  const { error } = await supabase.from('profiles').update({
    role: 'organizer',
    updated_at: new Date().toISOString(),
  }).eq('id', state.user.id)
  if (error) return { ok: false, error: error.message }
  await refreshSession()
  return { ok: true }
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
