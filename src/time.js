const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']

function parts(input = new Date()) {
  const date = input instanceof Date ? input : new Date(input)
  const bag = {}
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tashkent',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date).forEach((part) => {
    if (part.type !== 'literal') bag[part.type] = part.value
  })
  if (bag.hour === '24') bag.hour = '00'
  return bag
}

function utcClock(input) {
  const bag = {}
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(input)).forEach((part) => {
    if (part.type !== 'literal') bag[part.type] = part.value
  })
  if (bag.hour === '24') bag.hour = '00'
  return `${bag.hour}:${bag.minute}`
}

function utcDate(input) {
  const bag = {}
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(new Date(input)).forEach((part) => {
    if (part.type !== 'literal') bag[part.type] = part.value
  })
  return `${bag.day}.${bag.month}.${bag.year}`
}

export function tashkentClock(input) {
  const bag = parts(input)
  return `${bag.hour}:${bag.minute}`
}

export function tashkentDate(input) {
  const bag = parts(input)
  return `${bag.day}.${bag.month}.${bag.year}`
}

export function tashkentWhen(input) {
  const bag = parts(input)
  return `${Number(bag.day)}-${MONTHS[Number(bag.month) - 1]} ${bag.year}, ${bag.hour}:${bag.minute}`
}

/** Prefer Asia/Tashkent when the stored label was stamped in UTC. */
export function displayWhen(label, createdAt) {
  if (!createdAt) return label || ''
  const clock = (String(label || '').match(/(\d{2}:\d{2})\s*$/) || [])[1]
  if (!label || clock === utcClock(createdAt)) return tashkentWhen(createdAt)
  return label
}

export function displayClock(label, createdAt) {
  if (!createdAt) return label || ''
  const clock = (String(label || '').match(/(\d{2}:\d{2})/) || [])[1]
  if (!label || clock === utcClock(createdAt)) return tashkentClock(createdAt)
  return label
}

export function displayDate(label, createdAt) {
  if (!createdAt) return label || ''
  if (!label || label === utcDate(createdAt)) return tashkentDate(createdAt)
  return label
}
