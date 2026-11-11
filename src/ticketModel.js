import { buildSeminarPage, seminarCard, seminarPrice } from './seminarsData'
import { dateLine, hasCertificate, paymentDisplay, ticketDisplayCode, ticketQrText, ticketStatus } from './seminarPresent'

function clockPart(time, index, fallback) {
  const parts = String(time || '').split(/\s*[-–]\s*/)
  const bit = (parts[index] || fallback || '').trim().slice(0, 5)
  return /^\d{1,2}:\d{2}$/.test(bit) ? bit.padStart(5, '0') : (index === 0 || index === 1 ? '' : fallback)
}

export function buildTicketView(record, reg = {}, profile = {}) {
  if (!record) return null
  const card = seminarCard(record)
  const page = buildSeminarPage(record)
  const code = String(reg.code || '').trim()
  const order = paymentDisplay(reg)
  const qr = ticketQrText({ code, order, checkin: reg.checkin })
  const display = ticketDisplayCode({ code, order })
  const named = (record.tickets || card.tickets || []).find((t) => t.name && t.name === (reg.ticketName || reg.ticket || reg.plan))
  const price = reg.price != null && reg.price !== '' ? Number(reg.price) : (named ? Number(named.price) : Number(card.price))
  const plan = String(reg.ticketName || reg.plan || reg.ticket || named?.name || '').replace(/\s·\s(Onlayn|Oflayn)$/i, '').trim()
  const attendee = String(reg.name || reg.attendee || profile?.name || '').trim()
  const cert = reg.cert === false ? false : (reg.cert === true || hasCertificate(record) || hasCertificate(card))
  return {
    id: record.id,
    title: card.title || record.title || '',
    direction: page.catName || '',
    image: card.image || '',
    dateLabel: dateLine(card),
    time: [clockPart(record.time, 0, ''), clockPart(record.time, 1, '')].filter(Boolean).join(' - '),
    place: card.online ? 'Onlayn' : (card.placeLabel || ''),
    attendee,
    plan,
    price: Number.isFinite(price) ? price : null,
    priceLabel: Number.isFinite(price) ? seminarPrice(price) : '',
    certificate: !!cert,
    qr,
    code: display,
    status: ticketStatus({ ...reg, price }),
    past: !!record.past,
    online: !!card.online,
    startIso: record.startIso || '',
    endIso: record.endIso || record.startIso || '',
    from: clockPart(record.time, 0, '10:00') || '10:00',
    to: clockPart(record.time, 1, '18:00') || '18:00',
  }
}
