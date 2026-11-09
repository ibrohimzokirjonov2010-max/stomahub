import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeTelegram, isValidTelegram, telegramUrl, validateAd, isAdPublic, isAdExpired,
} from '../src/elonValidate.js'

test('telegram normalize strips @ and t.me', () => {
  assert.equal(normalizeTelegram('@Doctor_Ali'), 'Doctor_Ali')
  assert.equal(normalizeTelegram('https://t.me/Doctor_Ali'), 'Doctor_Ali')
  assert.equal(normalizeTelegram(''), '')
})

test('telegram validation', () => {
  assert.equal(isValidTelegram(''), true)
  assert.equal(isValidTelegram('@abc'), false) // too short
  assert.equal(isValidTelegram('doctor_ali'), true)
  assert.equal(isValidTelegram('1bad'), false)
  assert.equal(telegramUrl('@doctor_ali'), 'https://t.me/doctor_ali')
  assert.equal(telegramUrl('bad'), null)
})

test('validateAd requires title phone price', () => {
  const e = validateAd({ title: 'ab', price: '', phone: '99890' })
  assert.ok(e.title)
  assert.ok(e.price)
  assert.ok(e.phone)
  const ok = validateAd({ title: 'Endomotor', price: '4200000', phone: '+998901234567', deal: 'sale' })
  assert.deepEqual(ok, {})
})

test('validateAd telegram optional but checked', () => {
  const e = validateAd({ title: 'Endomotor', price: '1', phone: '+998901234567', telegram: 'x' })
  assert.ok(e.telegram)
})

test('isAdPublic filters pending sold closed expired', () => {
  assert.equal(isAdPublic({ status: 'active' }), true)
  assert.equal(isAdPublic({ status: 'active', _pending: true }), false)
  assert.equal(isAdPublic({ status: 'sold' }), false)
  assert.equal(isAdPublic({ status: 'closed' }), false)
  assert.equal(isAdPublic({ status: 'active', expires: '2000-01-01' }), false)
  assert.equal(isAdExpired({ expires: '2000-01-01' }), true)
})
