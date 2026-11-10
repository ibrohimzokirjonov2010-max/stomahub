import test from 'node:test'
import assert from 'node:assert/strict'
import { qtyAfterDec } from '../src/components/cardQtyLogic.js'

test('qtyAfterDec: 1 → 0 (remove from cart)', () => {
  assert.equal(qtyAfterDec(1), 0)
  assert.equal(qtyAfterDec(1, 1), 0)
})

test('qtyAfterDec: above min decreases by 1', () => {
  assert.equal(qtyAfterDec(2), 1)
  assert.equal(qtyAfterDec(5, 1), 4)
})

test('qtyAfterDec: at minQty removes (0)', () => {
  assert.equal(qtyAfterDec(5, 5), 0)
  assert.equal(qtyAfterDec(3, 5), 0)
})

test('qtyAfterDec: guards bad input', () => {
  assert.equal(qtyAfterDec(0), 0)
  assert.equal(qtyAfterDec(null), 0)
  assert.equal(qtyAfterDec(2, 0), 1)
})
