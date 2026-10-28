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
  let { data, error } = await supabase.from('profiles').select('id,role,seller_status,org_status,shop_name,name,full_name,phone,telegram_id,email,specialty,avatar_url,city,clinic').eq('id', session.user.id).maybeSingle()
  if (error && /full_name/i.test(error.message || '')) {
    ;({ data, error } = await supabase.from('profiles').select('id,role,seller_status,org_status,shop_name,name,phone,telegram_id,email,specialty,avatar_url,city,clinic').eq('id', session.user.id).maybeSingle())
  }
  const profile = data ? { ...data, full_name: data.full_name || data.name || '' } : null
  commit({
    status: 'authed',
    user: session.user,
    profile,
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
  return role === 'organizer' || role === 'seller' ? role : 'customer'
}

export async function ensureProfile({ role, name, fullName, phone, specialty, email, forceRole = false } = {}) {
  if (!supabase) return { ok: false, error: 'Supabase sozlanmagan' }
  if (!state.user) await refreshSession()
  if (!state.user) return { ok: false, error: 'Avval kiring' }
  const uid = state.user.id
  const meta = state.user.user_metadata || {}
  const chosen = role === 'organizer' || role === 'customer' || role === 'seller' ? role : (meta.role === 'organizer' ? 'organizer' : 'customer')
  const { data: existing, error: readError } = await supabase.from('profiles').select('id,role').eq('id', uid).maybeSingle()
  if (readError) return { ok: false, error: readError.message }
  const displayName = (fullName || name || meta.full_name || meta.name || '').trim()
  const patch = {
    name: displayName || undefined,
    full_name: displayName || undefined,
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
      name: displayName || '',
      full_name: displayName || '',
      email: email || state.user.email || '',
      specialty: specialty || meta.specialty || '',
      phone: phone || meta.phone || null,
      updated_at: new Date().toISOString(),
    }
    let { error } = await supabase.from('profiles').insert(row)
    if (error && /full_name/i.test(error.message || '')) {
      const { full_name: _drop, ...rest } = row
      ;({ error } = await supabase.from('profiles').insert(rest))
    }
    if (error && /duplicate|unique/i.test(error.message || '') && row.phone) {
      row.phone = null
      const retry = { ...row }
      delete retry.full_name
      ;({ error } = await supabase.from('profiles').insert(retry))
    }
    if (error && error.code !== '23505') return { ok: false, error: error.message }
  } else {
    // a seller account is never silently demoted by a customer/organizer login form
    const nextRole = cleanRole(chosen)
    const canChangeRole = forceRole && existing.role !== 'seller'
    const rolePatch = (canChangeRole && existing.role !== nextRole) ? { role: nextRole } : {}
    const body = { ...patch, ...rolePatch }
    if (Object.keys(body).length) {
      let { error } = await supabase.from('profiles').update(body).eq('id', uid)
      // full_name column may be absent until migration 0017 — retry without it
      if (error && /full_name/i.test(error.message || '')) {
        const { full_name: _drop, ...rest } = body
        ;({ error } = await supabase.from('profiles').update(rest).eq('id', uid))
      }
      if (error) return { ok: false, error: error.message }
    }
  }
  await refreshSession()
  return { ok: true, profile: state.profile }
}

// Tashkilotchi bo'lish: /tashkilotchi-bolish (register_organizer) -> tasdiqlash arizasi (0026).

/** Kabinetga kirish huquqi: admin yoki tasdiqlangan sotuvchi / tashkilotchi. */
export function canUseSeller(profile) {
  return profile?.role === 'admin' || (profile?.role === 'seller' && profile?.seller_status === 'approved')
}
/** Ro'yxatdan o'tgan (hali tasdiqlanmagan) sotuvchi ham kabinetga kiradi, lekin faqat Sozlamalar ishlaydi. */
export const SELLER_MEMBER_STATUSES = ['registered', 'pending', 'rejected', 'approved']
export function canEnterSeller(profile) {
  return profile?.role === 'admin' || (profile?.role === 'seller' && SELLER_MEMBER_STATUSES.includes(profile?.seller_status))
}
/** Ro'yxatdan o'tgan tashkilotchi: kabinetga kiradi, lekin faqat Sozlamalar ishlaydi (0026). */
export const ORG_MEMBER_STATUSES = ['registered', 'pending', 'rejected', 'approved']
export function canEnterOrganizer(profile) {
  return profile?.role === 'admin' || (profile?.role === 'organizer' && ORG_MEMBER_STATUSES.includes(profile?.org_status))
}
export function canUseOrganizer(profile) {
  return profile?.role === 'admin' || (profile?.role === 'organizer' && profile?.org_status === 'approved')
}

function boot() {
  if (!supabase) {
    commit({ status: 'anon', user: null, profile: null, error: 'Supabase sozlanmagan' })
    return
  }
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
      setTimeout(refreshSession, 0) // never call auth APIs inside the auth callback (supabase-js lock deadlock)
    }
  })
  refreshSession()
}

boot()
