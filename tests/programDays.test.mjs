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
  assert.equal(programError([{ items: [{ time: '10:00–11:00', title: 'A' }] }]), '')
  assert.equal(programRows([{ items: [{ time: 'a', title: 'b' }] }, { items: [{ time: 'c', title: 'd' }] }]).length, 2)
})
test('dayCount', () => {
  assert.equal(dayCount('2026-12-01', '2026-12-02'), 2)
  assert.equal(dayCount('2026-12-01', ''), 1)
  assert.equal(dayCount('2026-12-02', '2026-12-01'), 1)
})

test('legacy single-field rows split into time + title', () => {
  const d = normalizeProgram([
    { time: '', title: '10:00–10:30 — Ishtirokchilarni kutib olish' },
    { time: '10:30 - 12:00 — Nazariy qism', title: '' },
    { time: '12:00–13:00 — Tushlik', title: 'Tushlik' },
    { text: '13:00 Amaliyot' },
    ['14:00–15:00 — Savol-javob'],
  ])
  assert.deepEqual(d[0].items.map((r) => [r.time, r.title]), [
    ['10:00–10:30', 'Ishtirokchilarni kutib olish'],
    ['10:30 - 12:00', 'Nazariy qism'],
    ['12:00–13:00', 'Tushlik'],
    ['13:00', 'Amaliyot'],
    ['14:00–15:00', 'Savol-javob'],
  ])
  assert.equal(programError(d.map((x) => ({ ...x, items: x.items.filter((r) => r.time.includes('–')) }))), '')
})
test('empty rows and empty extra days are ignored by validation', () => {
  const p = [{ title: '', date: '', items: [{ time: '10:00–10:30', title: 'A' }, { time: '', title: '' }] }, { title: '', date: '', items: [{ time: ' ', title: '' }] }]
  assert.equal(programError(p), '')
})
test('half-filled row is reported with its position', async () => {
  const { programErrorAt } = await import('../src/programDays.js')
  const p = [{ title: '', date: '', items: [{ time: '10:00–10:30', title: 'A' }] }, { title: '', date: '', items: [{ time: '', title: 'A' }, { time: '11:00', title: '' }] }]
  assert.deepEqual(programErrorAt(p), { day: 1, row: 0, missing: 'time' })
  assert.match(programError(p), /2-kun, 1-qatorda boshlanish vaqti/)
})

test('legacy rows keep full time range; range split/join', async () => {
  const { splitRange, joinRange } = await import('../src/programDays.js')
  const d = normalizeProgram([{ time: '10:00–10:30 — Ishtirokchilarni kutib olish va kursga kirish', title: '' }])
  assert.deepEqual(d[0].items[0], { time: '10:00–10:30', title: 'Ishtirokchilarni kutib olish va kursga kirish' })
  assert.deepEqual(splitRange('10:00–10:30'), ['10:00', '10:30'])
  assert.deepEqual(splitRange('9.00 - 11:30'), ['09:00', '11:30'])
  assert.deepEqual(splitRange('10:00'), ['10:00', ''])
  assert.equal(joinRange('10:00', '10:30'), '10:00–10:30')
  assert.equal(joinRange('10:00', ''), '10:00')
})

test('both times required and end after start', async () => {
  const { programErrorAt } = await import('../src/programDays.js')
  assert.equal(programErrorAt([{ items: [{ time: '11:00', title: '3D rentgen' }] }]).missing, 'end')
  assert.equal(programErrorAt([{ items: [{ time: '11:30–11:00', title: '3D rentgen' }] }]).missing, 'order')
  assert.equal(programErrorAt([{ items: [{ time: '11:00–11:00', title: 'X' }] }]).missing, 'order')
  assert.match(programError([{ items: [{ time: '11:30–11:00', title: 'X' }] }]), /tugash vaqti boshlanishdan keyin/)
  assert.equal(programErrorAt([{ items: [{ time: '11:00–11:30', title: '3D rentgen' }] }]), null)
})

test('regression: an already-split range is not cut to the start time', () => {
  const d = normalizeProgram([{ time: '10:00–10:30', title: 'A' }, { time: '10:00 - 10:30', title: 'B' }, ['11:00–11:30', 'C']])
  assert.deepEqual(d[0].items.map((r) => r.time), ['10:00–10:30', '10:00 - 10:30', '11:00–11:30'])
  assert.deepEqual(cleanProgram(d)[0].items.map((r) => r.time), ['10:00–10:30', '10:00 - 10:30', '11:00–11:30'])
})
