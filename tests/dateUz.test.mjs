import test from 'node:test'
import assert from 'node:assert/strict'
import { MONTHS_UZ, formatDateUz } from '../src/lib/dateUz.js'

test('MONTHS_UZ has 12 Uzbek month names with sentyabr/oktyabr', () => {
  assert.equal(MONTHS_UZ.length, 12)
  assert.equal(MONTHS_UZ[0], 'yanvar')
  assert.equal(MONTHS_UZ[8], 'sentyabr')
  assert.equal(MONTHS_UZ[9], 'oktyabr')
  assert.equal(MONTHS_UZ[10], 'noyabr')
  assert.equal(MONTHS_UZ[11], 'dekabr')
})

test('formatDateUz renders day-month, year without locale data', () => {
  assert.equal(formatDateUz('2026-11-08T10:00:00Z'), '8-noyabr, 2026')
  // local noon avoids TZ day-shift ambiguity across ±14h
  assert.equal(formatDateUz(new Date(2026, 0, 1, 12, 0, 0)), '1-yanvar, 2026')
  assert.equal(formatDateUz(new Date(2026, 9, 15, 12, 0, 0)), '15-oktyabr, 2026')
  assert.equal(formatDateUz(new Date(2026, 8, 3, 12, 0, 0)), '3-sentyabr, 2026')
})

test('formatDateUz empty / invalid', () => {
  assert.equal(formatDateUz(''), '')
  assert.equal(formatDateUz(null), '')
  assert.equal(formatDateUz('not-a-date'), '')
})
