// node --test tests/  — Click/Payme imzo tekshiruvi (vektorlar Python hashlib bilan mustaqil hisoblangan)
import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import {
  clickSignString, verifyClickSign, paymeAuthOk, clickMerchantAuth, paymePayUrl, clickPayUrl, paymeState, amountsEqual,
} from '../api/_lib/paymentsCore.js'
import { readJson } from '../api/_lib/http.js'

const SECRET = 'TestSecretKey123'
const prepare = {
  click_trans_id: '2213876', service_id: '12345', click_paydoc_id: '9988', merchant_trans_id: 'SH-26-0042',
  amount: '150000.00', action: '0', error: '0', error_note: 'Success', sign_time: '2026-11-02 10:15:30',
  sign_string: '45ab150965122220115a5de37ef7a1b6',
}
const complete = { ...prepare, action: '1', merchant_prepare_id: '77', sign_time: '2026-11-02 10:16:05', sign_string: '0c6d0514cd4841e55fe49857e05df503' }

test('Click Prepare imzosi (action=0)', () => {
  assert.equal(clickSignString(prepare, SECRET), prepare.sign_string)
  assert.ok(verifyClickSign(prepare, SECRET))
  assert.ok(verifyClickSign({ ...prepare, sign_string: prepare.sign_string.toUpperCase() }, SECRET))
})

test('Click Complete imzosi merchant_prepare_id ni o‘z ichiga oladi (action=1)', () => {
  assert.equal(clickSignString(complete, SECRET), complete.sign_string)
  assert.ok(verifyClickSign(complete, SECRET))
  assert.ok(!verifyClickSign({ ...complete, merchant_prepare_id: '78' }, SECRET))
})

test('Click imzo: summa satri aynan ishlatiladi, soxta maydon / kalit rad etiladi', () => {
  assert.ok(!verifyClickSign({ ...prepare, amount: '150000' }, SECRET), '"150000" ≠ "150000.00"')
  assert.ok(!verifyClickSign({ ...prepare, amount: '1.00' }, SECRET))
  assert.ok(!verifyClickSign(prepare, 'wrong'))
  assert.ok(!verifyClickSign(prepare, ''))
  assert.ok(!verifyClickSign({ ...prepare, sign_string: '' }, SECRET))
})

test('Payme Basic auth: login Paycom + kalit', () => {
  const h = (s) => 'Basic ' + Buffer.from(s).toString('base64')
  assert.ok(paymeAuthOk(h('Paycom:k3y:with:colons'), 'k3y:with:colons'))
  assert.ok(!paymeAuthOk(h('Paycom:wrong'), 'k3y'))
  assert.ok(!paymeAuthOk(h('Other:k3y'), 'k3y'))
  assert.ok(!paymeAuthOk('Bearer abc', 'k3y'))
  assert.ok(!paymeAuthOk(h('Paycom:'), ''))
  assert.ok(!paymeAuthOk(undefined, 'k3y'))
})

test('Click Merchant API Auth sarlavhasi (reversal)', () => {
  assert.equal(clickMerchantAuth('555', SECRET, 1700000000), '555:e5430dcc172af8b3307a94f7694c2c32ae6d718c:1700000000')
})

test('To‘lov havolalari', () => {
  assert.equal(
    paymePayUrl({ merchantId: '5e730e8e0b852a417aa49ceb', amountSom: 150000, orderCode: 'SH-26-0042', returnUrl: 'https://stomahub.uz/profil/buyurtmalar' }),
    'https://checkout.paycom.uz/bT01ZTczMGU4ZTBiODUyYTQxN2FhNDljZWI7YWMub3JkZXJfaWQ9U0gtMjYtMDA0MjthPTE1MDAwMDAwO2M9aHR0cHM6Ly9zdG9tYWh1Yi51ei9wcm9maWwvYnV5dXJ0bWFsYXI=',
  )
  assert.ok(paymePayUrl({ merchantId: 'x', amountSom: 1, orderCode: 'A', test: true }).startsWith('https://checkout.test.paycom.uz/'))
  const u = new URL(clickPayUrl({ serviceId: 12345, merchantId: 678, amount: 150000, orderCode: 'SH-26-0042', returnUrl: 'https://stomahub.uz/x' }))
  assert.equal(u.host, 'my.click.uz')
  assert.equal(u.searchParams.get('transaction_param'), 'SH-26-0042')
  assert.equal(u.searchParams.get('amount'), '150000')
})

test('Payme holatlari', () => {
  assert.equal(paymeState({ state: 'pending' }), 1)
  assert.equal(paymeState({ state: 'paid' }), 2)
  assert.equal(paymeState({ state: 'cancelled' }), -1)
  assert.equal(paymeState({ state: 'cancelled', perform_time: '2026-01-01' }), -2)
  assert.equal(paymeState({ state: 'refunded' }), -2)
  assert.ok(amountsEqual('150000.00', 150000))
  assert.ok(!amountsEqual('149999.99', 150000))
})

test('readJson: Click form-urlencoded va JSON', async () => {
  const form = new URLSearchParams(prepare).toString()
  const req = Object.assign(Readable.from([Buffer.from(form)]), { headers: { 'content-type': 'application/x-www-form-urlencoded' } })
  assert.deepEqual(await readJson(req), prepare)
  assert.deepEqual(await readJson({ headers: {}, body: form }), prepare)
  assert.deepEqual(await readJson({ headers: { 'content-type': 'application/json' }, body: '{"a":1}' }), { a: 1 })
  assert.deepEqual(await readJson({ headers: {}, body: { a: 2 } }), { a: 2 })
})
