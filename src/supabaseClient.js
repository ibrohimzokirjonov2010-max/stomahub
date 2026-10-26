import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && anon
  ? createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  : null

export function friendlySupabaseError(error) {
  const msg = error?.message || String(error || '')
  const code = error?.code || ''
  if (code === 'PGRST205' || /schema cache/i.test(msg) || /could not find the table/i.test(msg) || /does not exist/i.test(msg)) {
    return 'Ma’lumotlar bazasi hali tayyor emas. Supabase SQL Editor’da supabase/migrations/0001_init.sql faylini ishga tushiring.'
  }
  if (/JWT|apikey|Invalid API key/i.test(msg)) return 'Supabase kaliti noto‘g‘ri yoki muddati tugagan.'
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return 'Tarmoq xatosi. Ulanishni tekshirib, qayta urinib ko‘ring.'
  return msg || 'Noma’lum xatolik'
}
