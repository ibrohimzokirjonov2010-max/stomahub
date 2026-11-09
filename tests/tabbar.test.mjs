import test from 'node:test'
import assert from 'node:assert/strict'
import { TAB_MATCH, isTabActive } from '../src/components/mobile/tabbarMatch.js'

test('tab active: marketplace routes', () => {
  assert.equal(isTabActive('/marketplace', TAB_MATCH.marketplace), true)
  assert.equal(isTabActive('/product/abc', TAB_MATCH.marketplace), true)
  assert.equal(isTabActive('/dokon/x', TAB_MATCH.marketplace), true)
  assert.equal(isTabActive('/jihozlar', TAB_MATCH.marketplace), true)
})

test('tab active: /ortiqcha does NOT highlight Marketplace (or any tab)', () => {
  assert.equal(isTabActive('/ortiqcha', TAB_MATCH.marketplace), false)
  assert.equal(isTabActive('/ortiqcha/xyz', TAB_MATCH.marketplace), false)
  for (const match of Object.values(TAB_MATCH)) {
    assert.equal(isTabActive('/ortiqcha', match), false, match.join(','))
  }
})

test('tab active: home is exact; forma prefix', () => {
  assert.equal(isTabActive('/', TAB_MATCH.home), true)
  assert.equal(isTabActive('/marketplace', TAB_MATCH.home), false)
  assert.equal(isTabActive('/forma', TAB_MATCH.forma), true)
  assert.equal(isTabActive('/forma/1', TAB_MATCH.forma), true)
})
