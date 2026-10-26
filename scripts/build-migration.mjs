import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEMO_ORGANIZER_ID, buildSeed } from '../src/hubSeed.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const schema = readFileSync(join(root, 'scripts/schema.sql'), 'utf8')
const org = DEMO_ORGANIZER_ID
const seed = buildSeed()

function dollar(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  let tag = 'j'
  while (text.includes(`$${tag}$`)) tag += 'x'
  return `$${tag}$${text}$${tag}$`
}

function lit(value) {
  if (value === null || value === undefined) return 'null'
  if (value === '') return "''"
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === 'string')) {
      if (!value.length) return `'{}'::text[]`
      return `array[${value.map((item) => `'${String(item).replace(/'/g, "''")}'`).join(',')}]::text[]`
    }
    return `${dollar(value)}::jsonb`
  }
  if (typeof value === 'object') return `${dollar(value)}::jsonb`
  return `'${String(value).replace(/'/g, "''")}'`
}

function insert(table, rows) {
  if (!rows.length) return ''
  const cols = Object.keys(rows[0])
  const chunks = []
  for (let i = 0; i < rows.length; i += 40) {
    const slice = rows.slice(i, i + 40)
    const values = slice.map((row) => `(${cols.map((col) => lit(row[col])).join(', ')})`).join(',\n')
    chunks.push(`insert into public.${table} (${cols.join(', ')})
select ${cols.join(', ')} from (values
${values}
) as v(${cols.join(', ')})
where exists (select 1 from public.profiles where id = '${org}'::uuid)
on conflict (id) do nothing;`)
  }
  return chunks.join('\n\n')
}

const seminars = seed.seminars.map((s, index) => ({
  id: s.id,
  organizer_id: `${org}::uuid`,
  title: s.title,
  speaker: s.speaker,
  date_label: s.date,
  city: s.city,
  format: s.format,
  days: s.days,
  sold: s.sold,
  seats: s.seats,
  revenue: s.revenue,
  status: s.status,
  badge: s.badge,
  image: s.image,
  topic: s.topic,
  published: s.published,
  held: s.held,
  about: s.about,
  category: s.category,
  tags: s.tags,
  cover: s.cover || s.image,
  start_date: s.start,
  start_time: s.startTime,
  end_date: s.end,
  end_time: s.endTime,
  place: s.place,
  address: s.address,
  place_img: s.placeImg,
  template: s.template,
  checked: s.checked || 0,
  cancel_reason: '',
  form: raw('null::jsonb'),
  speakers: s.speakers,
  sort_at: index,
}))

const tickets = seed.seminars.flatMap((s) => (s.tickets || []).map((t, index) => ({
  id: String(t.id),
  seminar_id: s.id,
  organizer_id: `${org}::uuid`,
  name: t.name,
  price: Number(t.price) || 0,
  seats: Number(t.seats || t.total) || 0,
  sold: Number(t.sold) || 0,
  active: t.active !== false,
  perks: t.perks || [],
  icon: t.icon || 'gem',
  note: t.note || '',
  sort_at: index,
})))

const promos = seed.promos.map((p, index) => ({
  id: String(p.id),
  organizer_id: `${org}::uuid`,
  seminar_id: !p.seminar || p.seminar === 'all' ? 'all' : p.seminar,
  code: p.code,
  name: p.name || p.code,
  kind: p.kind === 'summa' ? 'summa' : 'foiz',
  value: Number(p.value) || 0,
  used: Number(p.used) || 0,
  limit_n: Number(p.limit) || 0,
  status: p.status || 'faol',
  from_label: p.from || '',
  to_label: p.to || '',
  sort_at: index,
}))

const registrations = seed.participants.map((p, index) => ({
  id: String(p.id),
  seminar_id: p.seminarId,
  organizer_id: `${org}::uuid`,
  customer_id: raw('null::uuid'),
  name: p.name,
  clinic: p.clinic || '',
  phone: p.phone || '',
  email: p.email || '',
  ticket: p.ticket || 'Standart',
  ticket_id: raw('null::text'),
  pay: p.pay || 'paid',
  registered: p.registered || '',
  city: p.city || '',
  role: p.role || '',
  avatar: p.avatar || '',
  code: p.code || '',
  arrived: !!p.arrived,
  sort_at: index,
}))

const payments = seed.payments.map((p, index) => ({
  id: String(p.id),
  registration_id: p.participantId != null ? String(p.participantId) : raw('null::text'),
  seminar_id: p.seminarId,
  organizer_id: `${org}::uuid`,
  customer_id: raw('null::uuid'),
  who: p.who,
  clinic: p.clinic || '',
  seminar_title: p.seminar || '',
  sum: Number(p.sum) || 0,
  gross: Number(p.sum) || 0,
  discount: 0,
  promo: '',
  method: p.method || '',
  state: p.state || 'ok',
  phone: p.phone || '',
  email: p.email || '',
  ticket: p.ticket || '',
  when_label: p.when || '',
  avatar: p.avatar || '',
  face: Number(p.face) || 0,
  sort_at: index,
}))

const certs = seed.certs.map((c, index) => ({
  id: String(c.id),
  organizer_id: `${org}::uuid`,
  seminar_id: c.seminarId || 'implant-nov',
  name: c.name,
  clinic: c.clinic || '',
  seminar_title: c.seminar || '',
  state: c.state || 'none',
  code: c.code || '',
  date_label: c.date || '',
  avatar: c.avatar || '',
  sort_at: index,
}))

const activity = seed.activity.map((a, index) => ({
  id: `act-seed-${index}`,
  organizer_id: `${org}::uuid`,
  icon: a.icon || 'cal',
  title: a.title || '',
  text: a.text || '',
  time_label: a.time || '',
  sort_at: index,
}))

const reviews = seed.reviews.map((r, index) => ({
  id: `rev-${index + 1}`,
  organizer_id: `${org}::uuid`,
  name: r.name,
  clinic: r.clinic || '',
  stars: Number(r.stars) || 5,
  text: r.text || '',
  date_label: r.date || '',
  avatar: r.avatar || '',
  sort_at: index,
}))

const speakers = seed.speakers.map((s, index) => ({
  id: String(s.id),
  organizer_id: `${org}::uuid`,
  name: s.name,
  role: s.role || '',
  city: s.city || '',
  avatar: s.avatar || '',
  bio: s.bio || '',
  links: raw(`${dollar(s.links || [])}::jsonb`),
  sort_at: index,
}))

const requisites = seed.requisites.map((r) => ({
  id: `${org}:${r.id}`,
  organizer_id: `${org}::uuid`,
  label: r.label,
  detail: r.detail || '',
}))

function raw(value) {
  return { __raw: value }
}

// organizer_id is written as a cast, not a quoted string.
function litAware(value) {
  if (value && typeof value === 'object' && value.__raw) return value.__raw
  return lit(value)
}

function insertAware(table, rows) {
  if (!rows.length) return ''
  const cols = Object.keys(rows[0])
  const chunks = []
  for (let i = 0; i < rows.length; i += 40) {
    const slice = rows.slice(i, i + 40)
    const values = slice.map((row) => `(${cols.map((col) => litAware(row[col])).join(', ')})`).join(',\n')
    chunks.push(`insert into public.${table} (${cols.join(', ')})
select ${cols.join(', ')} from (values
${values}
) as v(${cols.join(', ')})
where exists (select 1 from public.profiles where id = '${org}'::uuid)
on conflict (id) do nothing;`)
  }
  return chunks.join('\n\n')
}

function withOrg(rows) {
  return rows.map((row) => ({
    ...row,
    organizer_id: raw(`'${org}'::uuid`),
  }))
}

const settingsSql = `insert into public.organizer_settings (organizer_id, name, email, notes, city, qr_sound, marketing)
select '${org}'::uuid, ${lit(seed.settings.name)}, ${lit(seed.settings.email)}, ${seed.settings.notes ? 'true' : 'false'}, ${lit(seed.settings.city)}, ${seed.qrSound ? 'true' : 'false'}, ${lit(seed.marketing)}::jsonb
where exists (select 1 from public.profiles where id = '${org}'::uuid)
on conflict (organizer_id) do nothing;`

const body = `-- Generated by scripts/build-migration.mjs. Re-run that script after editing scripts/schema.sql or src/hubSeed.js.
-- Apply this whole file in the Supabase SQL editor (Dashboard → SQL → New query). DDL cannot be run through the REST API.

${schema.trim()}

-- ---------------------------------------------------------------------------
-- demo cabinet owned by organizer@stomahub.uz
-- ---------------------------------------------------------------------------

${insertAware('seminars', withOrg(seminars))}

${insertAware('tickets', withOrg(tickets))}

${insertAware('promo_codes', withOrg(promos))}

${insertAware('registrations', withOrg(registrations))}

${insertAware('payments', withOrg(payments))}

${insertAware('certificates', withOrg(certs))}

${insertAware('activity_log', withOrg(activity))}

${insertAware('seminar_reviews', withOrg(reviews))}

${insertAware('organizer_speakers', withOrg(speakers))}

${insertAware('requisites', withOrg(requisites))}

${settingsSql}
`

// The helper above double-wraps organizer_id because withOrg replaces it
// and insertAware already expects __raw. seminars built earlier still used
// the string form "uuid::uuid" which lit() would quote. withOrg fixes that.
mkdirSync(join(root, 'supabase/migrations'), { recursive: true })
writeFileSync(join(root, 'supabase/migrations/0001_init.sql'), `${body}\n`)
console.log('wrote supabase/migrations/0001_init.sql', body.length, 'chars')
console.log({
  seminars: seminars.length,
  tickets: tickets.length,
  promos: promos.length,
  registrations: registrations.length,
  payments: payments.length,
  certs: certs.length,
})
