import test from 'node:test'
import assert from 'node:assert/strict'
import { ASAP, dayChips, defaultWhen, earliestISO, normalizeWhen, openSlots, parseWhenNote, slotOpen, tashkentNow, whenError, whenLabel, whenNote } from '../src/lib/deliveryWhen.js'

const at = (iso, h, m = 0) => ({ iso, hour: h, minute: m })
const MON = at('2026-11-16', 14, 10) // dushanba, 14:10 Toshkent

test('tashkentNow: UTC vaqtni Toshkentga (UTC+5) o‘giradi', () => {
  assert.deepEqual(tashkentNow(new Date('2026-11-16T20:30:00Z')), { iso: '2026-11-17', hour: 1, minute: 30 })
  assert.deepEqual(tashkentNow(new Date('2026-11-16T08:58:00Z')), { iso: '2026-11-16', hour: 13, minute: 58 })
})

test('kun chiplari: Bugun, Ertaga, keyin hafta kuni bilan 5 kun', () => {
  const d = dayChips('2026-11-16', MON)
  assert.equal(d.length, 7)
  assert.deepEqual(d.slice(0, 3).map((x) => [x.label, x.date]), [['Bugun', '16-noyabr'], ['Ertaga', '17-noyabr'], ['Chor', '18-noyabr']])
  assert.equal(d[6].iso, '2026-11-22')
  assert.ok(d.every((x) => !x.disabled))
})

test('bugungi o‘tgan oraliqlar yopiq; kechqurun «Bugun» o‘chiq', () => {
  assert.deepEqual(openSlots('2026-11-16', MON), ['15:00–18:00', '18:00–21:00'])
  assert.equal(slotOpen('2026-11-16', '12:00–15:00', MON), false) // tugashiga 1 soatdan kam qolgan
  const late = at('2026-11-16', 20, 10)
  assert.deepEqual(openSlots('2026-11-16', late), [])
  assert.equal(dayChips('2026-11-16', late)[0].disabled, true)
  assert.equal(dayChips('2026-11-16', late)[1].disabled, false)
  assert.equal(slotOpen('2026-11-15', '18:00–21:00', MON), false) // o‘tgan kun
})

test('viloyat: eng erta sana +2 kun (yakshanba o‘tkaziladi); chiplar shundan boshlanadi', () => {
  assert.equal(earliestISO('Toshkent', false, MON), '2026-11-16')
  assert.equal(earliestISO('Samarqand', true, MON), '2026-11-16')
  assert.equal(earliestISO('Samarqand', false, MON), '2026-11-18')
  assert.equal(earliestISO('Samarqand', false, at('2026-11-20', 10)), '2026-11-23') // juma +2 = yakshanba → dushanba
  assert.equal(dayChips('2026-11-18', MON)[0].label, 'Chor')
})

test('sukut — «Imkon qadar tezroq»; eskirgan tanlov tuzatiladi', () => {
  assert.deepEqual(defaultWhen(), { date: '', slot: ASAP })
  assert.deepEqual(normalizeWhen({ date: '2026-11-12', slot: '09:00–12:00' }, '2026-11-16', MON), { date: '2026-11-16', slot: '15:00–18:00' })
  assert.deepEqual(normalizeWhen({ date: '2026-11-16', slot: '09:00–12:00' }, '2026-11-16', MON), { date: '2026-11-16', slot: '15:00–18:00' })
  assert.deepEqual(normalizeWhen({ date: '2026-11-17', slot: '12:00–15:00' }, '2026-11-16', MON), { date: '2026-11-17', slot: '12:00–15:00' })
})

test('yuborishdagi tekshiruv: o‘tgan kun / o‘tgan vaqt / eng erta sanadan oldin rad etiladi', () => {
  assert.equal(whenError({ date: '', slot: ASAP }, '2026-11-16', MON), '')
  assert.equal(whenError({ date: '2026-11-17', slot: '09:00–12:00' }, '2026-11-16', MON), '')
  assert.match(whenError({ date: '2026-11-12', slot: '09:00–12:00' }, '2026-11-16', MON), /o‘tib ketgan/)
  assert.match(whenError({ date: '2026-11-16', slot: '09:00–12:00' }, '2026-11-16', MON), /vaqt o‘tib ketgan/)
  assert.match(whenError({ date: '2026-11-17', slot: '09:00–12:00' }, '2026-11-18', MON), /eng erta/)
  assert.match(whenError({ date: '2026-11-17', slot: 'xx' }, '2026-11-16', MON), /oralig‘ini/)
})

test('matnlar: xaridor yorlig‘i, sotuvchiga izoh va uni qayta o‘qish', () => {
  assert.equal(whenLabel({ date: '', slot: ASAP }, MON), 'Imkon qadar tezroq')
  assert.equal(whenLabel({ date: '2026-11-17', slot: '09:00–12:00' }, MON), 'Ertaga, 17-noyabr (seshanba), 09:00–12:00')
  assert.equal(whenNote({ date: '', slot: ASAP }, false), 'Yetkazish vaqti: imkon qadar tezroq')
  assert.equal(whenNote({ date: '', slot: ASAP }, true), 'Olib ketish vaqti: imkon qadar tezroq')
  assert.equal(whenNote({ date: '2026-11-17', slot: '09:00–12:00' }, false), 'Yetkazish sanasi: 17-noyabr 2026, Seshanba, 09:00–12:00')
  const p = parseWhenNote('Yetkazish vaqti: imkon qadar tezroq | Darvozadan qo‘ng‘iroq qiling')
  assert.deepEqual([p.when, p.asap, p.rest], ['Imkon qadar tezroq', true, 'Darvozadan qo‘ng‘iroq qiling'])
  const q = parseWhenNote('Olib ketish sanasi: 17-noyabr 2026, Seshanba, 09:00–12:00')
  assert.deepEqual([q.kind, q.when, q.rest], ['Olib ketish', '17-noyabr 2026, Seshanba, 09:00–12:00', ''])
  assert.deepEqual(parseWhenNote('oddiy izoh'), { when: '', rest: 'oddiy izoh' })
})
