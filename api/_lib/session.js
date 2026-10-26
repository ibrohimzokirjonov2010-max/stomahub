import { randomBytes } from 'node:crypto'
import { adminClient, anonClient } from './supabaseAdmin.js'

function roleOf(value, fallback = 'customer') {
  return value === 'organizer' ? 'organizer' : fallback
}

export async function issueSession({ email, name, phone, telegramId, role }) {
  const admin = adminClient()
  const metadata = {
    name: name || '',
    phone: phone || '',
    role: roleOf(role),
  }
  if (telegramId) metadata.telegram_id = String(telegramId)
  const created = await admin.auth.admin.createUser({
    email,
    password: randomBytes(24).toString('base64url'),
    email_confirm: true,
    user_metadata: metadata,
  })
  if (created.error && !/already|registered|exists/i.test(created.error.message || '')) throw created.error

  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (link.error) throw link.error
  const tokenHash = link.data?.properties?.hashed_token
  const emailOtp = link.data?.properties?.email_otp
  const client = anonClient()
  let verified = tokenHash
    ? await client.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' })
    : { error: new Error('Sessiya tokeni kelmadi') }
  if (verified.error && emailOtp) {
    verified = await client.auth.verifyOtp({ email, token: emailOtp, type: 'email' })
  }
  if (verified.error || !verified.data?.session) throw verified.error || new Error('Sessiya ochilmadi')

  const userId = verified.data.session.user.id
  const { data: existing } = await admin.from('profiles').select('role,name,phone,telegram_id').eq('id', userId).maybeSingle()
  const nextRole = existing?.role === 'organizer' ? 'organizer' : roleOf(role, existing?.role || 'customer')
  const { error: profileError } = await admin.from('profiles').upsert({
    id: userId,
    role: nextRole,
    name: name || existing?.name || '',
    phone: phone || existing?.phone || null,
    telegram_id: telegramId || existing?.telegram_id || null,
    email,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })
  if (profileError && !/schema cache|does not exist|PGRST205/i.test(profileError.message || '')) throw profileError

  return {
    access_token: verified.data.session.access_token,
    refresh_token: verified.data.session.refresh_token,
    user: { id: userId, email, role: nextRole },
  }
}
