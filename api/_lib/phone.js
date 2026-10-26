import { createHash, timingSafeEqual } from 'node:crypto'

export function normalizePhone(input) {
  let digits = String(input || '').replace(/\D/g, '')
  if (digits.startsWith('998') && digits.length === 12) return `+${digits}`
  if (digits.length === 9) return `+998${digits}`
  return null
}

export function phoneEmail(phone) {
  return `p${String(phone).replace(/\D/g, '')}@phone.stomahub.uz`
}

export function hashOtp(phone, code) {
  const pepper = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createHash('sha256').update(`${pepper}:${phone}:${code}`).digest('hex')
}

export function otpMatches(phone, code, expectedHash) {
  const actual = hashOtp(phone, code)
  const a = Buffer.from(actual)
  const b = Buffer.from(String(expectedHash || ''))
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
