import test from 'node:test'
import assert from 'node:assert/strict'
import { pickPublic, pickFeatured, featuredError, move } from '../src/seller-public/lib.js'

test('pickPublic never passes requisites through', () => {
  const r = pickPublic({ id: '1', shop_name: 'A', legal: { stir: '123456789' }, stir: '1', bank: 'x', mfo: '1', account: '1', owner_name: 'Ali', notify: {} })
  assert.deepEqual(Object.keys(r).sort(), ['id', 'shop_name'])
})
test('pickFeatured keeps order, drops inactive/unknown, dedupes, caps 8', () => {
  const ps = 'abcdefghij'.split('').map((id) => ({ id }))
  assert.deepEqual(pickFeatured(['c', 'zz', 'a', 'c'], ps).map((p) => p.id), ['c', 'a'])
  assert.equal(pickFeatured('abcdefghij'.split(''), ps).length, 8)
  assert.deepEqual(pickFeatured(null, ps), [])
})
test('featuredError: 0 or 4-8', () => {
  assert.equal(featuredError([]), '')
  assert.ok(featuredError(['a', 'b']))
  assert.equal(featuredError(['a', 'b', 'c', 'd']), '')
  assert.ok(featuredError('abcdefghi'.split('')))
})
test('move swaps within bounds', () => {
  assert.deepEqual(move(['a', 'b', 'c'], 0, 1), ['b', 'a', 'c'])
  assert.deepEqual(move(['a', 'b'], 0, -1), ['a', 'b'])
})

import { ratingOf, salesOf, verifiedOf, workTimeOf, contactOf, categoriesOf, orderProducts } from '../src/seller-public/lib.js'
test('v2: rating only with real reviews', () => {
  assert.equal(ratingOf({ rating: null, reviews_count: 0 }), null)
  assert.equal(ratingOf({ rating: 4.83, reviews_count: 3 }), 4.8)
  assert.equal(ratingOf({ rating: 5, reviews_count: 0 }), null)
})
test('v2: sales hidden unless RPC returns it', () => {
  assert.equal(salesOf({}), null)
  assert.equal(salesOf({ sales_count: 0 }), 0)
  assert.equal(salesOf({ sales_count: '12' }), 12)
})
test('v2: verified', () => {
  assert.equal(verifiedOf(null), false)
  assert.equal(verifiedOf({ id: 'x' }), true)
  assert.equal(verifiedOf({ verified: false }), false)
})
test('v2: contact channels', () => {
  assert.deepEqual(contactOf({}), { telegram: null, tel: '', message: '', messageVia: '' })
  assert.equal(contactOf({ telegram: 'https://t.me/dokon' }).message, 'https://t.me/dokon')
  assert.equal(contactOf({ telegram: '@dokon' }).telegram.handle, '@dokon')
  const c = contactOf({ phone: '+998 90 123 45 67' })
  assert.equal(c.tel, 'tel:+998901234567'); assert.equal(c.messageVia, 'sms')
})
test('v2: work time, categories, featured order', () => {
  assert.equal(workTimeOf({ work_days: 'Du-Sh', work_hours: ' ' }), 'Du-Sh')
  assert.deepEqual(categoriesOf([{ category: 'A' }, { category: 'B' }, { category: 'A' }, {}]), ['A', 'B'])
  const ps = ['a', 'b', 'c'].map((id) => ({ id }))
  assert.deepEqual(orderProducts(ps, ['c']).map((p) => p.id), ['c', 'a', 'b'])
})
