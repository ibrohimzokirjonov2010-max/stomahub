import test from 'node:test'
import assert from 'node:assert/strict'
import { parseDateLoose, withDayDates, dateRangeLabel } from '../src/programDays.js'

const day = (date) => ({ title: '', date, items: [] })

test('parseDateLoose formats', () => {
  assert.equal(parseDateLoose('2026-11-12'), '2026-11-12')
  assert.equal(parseDateLoose('12-noyabr 2026'), '2026-11-12')
  assert.equal(parseDateLoose('12 noyabr', 2026), '2026-11-12')
  assert.equal(parseDateLoose('1-sentyabr 2026'), '2026-09-01')
  assert.equal(parseDateLoose('13.11.2026'), '2026-11-13')
  assert.equal(parseDateLoose('12 noyabr'), '')
  assert.equal(parseDateLoose('2026-02-30'), '')
  assert.equal(parseDateLoose('12.мм.гггг'), '')
  assert.equal(parseDateLoose(''), '')
})
test('fills empty/invalid day dates from start', () => {
  const r = withDayDates([day('12 noyabr'), day('2026-11-13'), day('')], '2026-11-12')
  assert.deepEqual(r.map((d) => d.date), ['2026-11-12', '2026-11-13', '2026-11-14'])
  assert.deepEqual(withDayDates([day('xx')], '12-noyabr 2026').map((d) => d.date), ['2026-11-12'])
})
test('start change shifts auto dates, keeps manual', () => {
  const r = withDayDates([day('2026-11-12'), day('2026-11-20')], '2026-11-15', '2026-11-12')
  assert.deepEqual(r.map((d) => d.date), ['2026-11-15', '2026-11-20'])
})
test('no start keeps valid dates', () => {
  assert.deepEqual(withDayDates([day('2026-01-02'), day('bad')], '').map((d) => d.date), ['2026-01-02', ''])
})
test('dateRangeLabel', () => {
  assert.equal(dateRangeLabel('2026-11-12', '2026-11-13'), '12–13-noyabr 2026')
  assert.equal(dateRangeLabel('2026-11-12', '2026-11-12'), '12-noyabr 2026')
  assert.equal(dateRangeLabel('2026-11-30', '2026-12-02'), '30-noyabr – 2-dekabr 2026')
  assert.equal(dateRangeLabel('2026-12-31', '2027-01-01'), '31-dekabr 2026 – 1-yanvar 2027')
})
