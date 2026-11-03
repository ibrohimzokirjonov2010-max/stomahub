import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeProgram, cleanProgram, programError, dayCount, programRows } from '../src/programDays.js'

test('flat rows load as day 1', () => {
  assert.deepEqual(normalizeProgram([{ time: '10:00', title: 'A' }]), [{ title: '', date: '', items: [{ time: '10:00', title: 'A' }] }])
})
test('strings and tuples parse', () => {
  const d = normalizeProgram(['10:00–10:30 — Ishtirokchilarni kutib olish', ['11:00', 'B', 'sub']])
  assert.equal(d.length, 1)
  assert.deepEqual(d[0].items[0], { time: '10:00–10:30', title: 'Ishtirokchilarni kutib olish' })
  assert.deepEqual(d[0].items[1], { time: '11:00', title: 'B', sub: 'sub' })
})
test('day shape kept, empty input', () => {
  const days = [{ title: 'Nazariy qism', date: '2026-12-01', items: [{ time: '10:00', title: 'A' }] }, { title: 'Amaliy qism', date: '', items: [] }]
  assert.deepEqual(normalizeProgram(days), days)
  assert.deepEqual(normalizeProgram(null), [])
  assert.deepEqual(normalizeProgram('x'), [])
})
test('clean drops empty rows/days, validation', () => {
  assert.deepEqual(cleanProgram([{ title: '', items: [{ time: '', title: '' }] }, { title: 'X', items: [] }]), [{ title: 'X', date: '', items: [] }])
  assert.ok(programError([{ items: [{ time: '10:00', title: '' }] }]))
  assert.equal(programError([{ items: [{ time: '10:00', title: 'A' }] }]), '')
  assert.equal(programRows([{ items: [{ time: 'a', title: 'b' }] }, { items: [{ time: 'c', title: 'd' }] }]).length, 2)
})
test('dayCount', () => {
  assert.equal(dayCount('2026-12-01', '2026-12-02'), 2)
  assert.equal(dayCount('2026-12-01', ''), 1)
  assert.equal(dayCount('2026-12-02', '2026-12-01'), 1)
})
