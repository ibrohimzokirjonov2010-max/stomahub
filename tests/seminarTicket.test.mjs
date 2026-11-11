import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildIcs, featureBits, formatBadge, hasCertificate, paymentDisplay,
  seatsLabel, ticketDisplayCode, ticketQrText, ticketStatus,
} from '../src/seminarPresent.js'
import { jpegToPdf } from '../src/ticketPdf.js'

const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8')

test('format badge and seats come from seminar fields', () => {
  assert.equal(formatBadge({ title: 'Jarrohlik master-klassi', kind: 'Master-klass' }).label, 'Master-klass')
  assert.equal(formatBadge({ title: 'Endodontiya amaliy seminari', practice: { on: false } }).label, 'Amaliy kurs')
  assert.equal(formatBadge({ title: 'Nazariya', practice: { on: true }, text: 'nazariy qism' }).label, 'Nazariy + Amaliy')
  assert.equal(formatBadge({ title: 'Oddiy uchrashuv' }), null)
  assert.equal(seatsLabel({ seats: 20, left: 17 }), '17 ta joy qoldi')
  assert.equal(seatsLabel({ seats: 5, left: 0 }), 'Joy qolmadi')
  assert.equal(seatsLabel({}), '')
  assert.equal(hasCertificate({ cmePoints: 6 }), true)
  assert.equal(hasCertificate({ tickets: [{ perks: ['Kofe-breyk va sertifikat bilan'] }] }), true)
  assert.equal(hasCertificate({ title: 'kurs' }), false)
  assert.deepEqual(featureBits({ title: 'Amaliy kurs', practice: { on: true }, cmePoints: 8 }), ['Amaliyot', 'Sertifikat'])
})

test('QR encodes the real ticket code and payment id for check-in', () => {
  const order = paymentDisplay({ personId: '1793868558611', created_at: '2026-11-11T00:00:00Z' })
  assert.equal(order, 'ST2026-1793868558611')
  assert.equal(paymentDisplay({ order: 'ST2026-99' }), 'ST2026-99')
  const qr = ticketQrText({ code: 'QR-1793868558611', order })
  assert.match(qr, /QR-1793868558611/)
  assert.match(qr, /ST2026-1793868558611/)
  assert.equal(ticketQrText({ checkin: 'STH:QR-1|ST2026-1' }), 'STH:QR-1|ST2026-1')
  assert.equal(ticketDisplayCode({ code: 'QR-1', order: 'ST2026-1' }), 'ST2026-1')
  assert.equal(ticketDisplayCode({ code: 'QR-1', order: '' }), 'QR-1')
})

test('ticket status follows payment, not a hardcoded confirmed pill', () => {
  assert.equal(ticketStatus({ pending: true, price: 1480000, pay: 'wait' }).label, 'Kutilmoqda')
  assert.equal(ticketStatus({ pay: 'paid', price: 1480000 }).label, 'Tasdiqlangan')
  assert.equal(ticketStatus({ price: 0, method: 'free', code: 'QR-1' }).label, 'Tasdiqlangan')
  assert.equal(ticketStatus({ pay: 'cancel' }).label, 'Bekor qilingan')
  assert.equal(ticketStatus(null), null)
})

test('calendar file uses the seminar start and the ticket code', () => {
  const ics = buildIcs({
    id: 'impl', title: 'Implantologiya', place: 'Toshkent, EMU', code: 'QR-1',
    startIso: '2026-11-12', endIso: '2026-11-13', from: '10:00', to: '18:00',
  })
  assert.match(ics, /DTSTART:20261112T100000/)
  assert.match(ics, /DTEND:20261113T180000/)
  assert.match(ics, /SUMMARY:Implantologiya/)
  assert.match(ics, /Chipta: QR-1/)
  assert.equal(buildIcs({ title: 'x' }), '')
})

test('pdf wrapper is a real PDF around the jpeg', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])
  const pdf = jpegToPdf(jpeg, 20, 40)
  const text = Buffer.from(pdf).toString('latin1')
  assert.match(text, /^%PDF-1\.4/)
  assert.match(text, /%%EOF/)
  assert.ok(text.includes('/DCTDecode'))
  assert.ok(pdf.includes(0xff) && pdf.includes(0xd8))
})

test('seminars catalog and ticket route are wired', () => {
  assert.match(read('pages/CatalogRoutes.jsx'), /SeminarsBrowse/)
  assert.match(read('App.jsx'), /seminarlar\/:id\/chipta/)
  assert.match(read('components/ticket/ETicket.jsx'), /LiveQr/)
  assert.match(read('components/ticket/ETicket.jsx'), /Chiptani yuklab olish \(PDF\)/)
  assert.match(read('components/ticket/ETicket.jsx'), /Kalendarga qo‘shish/)
  assert.match(read('components/ticket/ETicket.jsx'), /navigator\.share/)
  assert.match(read('components/seminars/SeminarsBrowse.jsx'), /Yaqin kunlardagi seminarlar/)
  assert.match(read('components/seminars/SeminarsBrowse.jsx'), /Ro‘yxatdan o‘tish/)
})
