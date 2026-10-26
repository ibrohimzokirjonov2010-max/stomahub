import { createHash, createHmac } from 'node:crypto'
import assert from 'node:assert/strict'
import { hashOtp, normalizePhone, otpMatches } from '../api/_lib/phone.js'
import { verifyTelegramLogin } from '../api/_lib/telegram.js'

process.env.SUPABASE_SERVICE_ROLE_KEY = 'pepper-for-test'
process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token'

assert.equal(normalizePhone('+998 90 123 45 67'), '+998901234567')
assert.equal(normalizePhone('901234567'), '+998901234567')
assert.equal(normalizePhone('123'), null)

const hash = hashOtp('+998901234567', '123456')
assert.equal(otpMatches('+998901234567', '123456', hash), true)
assert.equal(otpMatches('+998901234567', '000000', hash), false)

const data = { id: 42, first_name: 'Ali', auth_date: Math.floor(Date.now() / 1000) }
const check = Object.keys(data).sort().map((key) => `${key}=${data[key]}`).join('\n')
const secret = createHash('sha256').update(process.env.TELEGRAM_BOT_TOKEN).digest()
const signature = createHmac('sha256', secret).update(check).digest('hex')
assert.equal(verifyTelegramLogin({ ...data, hash: signature }), true)
assert.equal(verifyTelegramLogin({ ...data, hash: 'ab' }), false)
assert.equal(verifyTelegramLogin({ ...data, auth_date: 10, hash: signature }), false)

console.log('auth-lib ok')
