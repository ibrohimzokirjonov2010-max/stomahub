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
