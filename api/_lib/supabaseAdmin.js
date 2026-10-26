import { createClient } from '@supabase/supabase-js'

function url() {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
}

export function adminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url() || !key) {
    const error = new Error('SUPABASE_SERVICE_ROLE_KEY yoki Supabase URL sozlanmagan')
    error.status = 503
    throw error
  }
  return createClient(url(), key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export function anonClient() {
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
  if (!url() || !key) {
    const error = new Error('Supabase anon kaliti sozlanmagan')
    error.status = 503
    throw error
  }
  return createClient(url(), key, { auth: { autoRefreshToken: false, persistSession: false } })
}
