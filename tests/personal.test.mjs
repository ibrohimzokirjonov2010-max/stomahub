import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeSpecialty, specialtyScore, matchesSpecialty, seminarMatches, sortSeminarsForSpecialty, SPECIALTIES, PICKER_SPECIALTIES, specialtyOptions } from '../src/personal/specialtyMap.js'
import { productKind, isComplement, complementsFor, isConsumable, CONSUMABLE_REORDER_DAYS } from '../src/personal/complements.js'
import { decay, aggregateEvents, fromServer, mergeSignals, hasSignals, recommend, orderForMarketplace, recentlyPurchased } from '../src/personal/rank.js'

const DAY = 864e5
const NOW = Date.parse('2026-11-09T12:00:00Z')
const P = (id, name, category, extra = {}) => ({ id, name, category, rawCategory: category, price: 100000, stock: 5, ...extra })
const CATALOG = [
  P('impl', 'Implant tizimi to‘plami (5 dona implant + abatment)', 'Implantologiya'),
  P('abut', 'Formirovatel va abatment to‘plami', 'Implantologiya'),
  P('bone', 'Suyak materiali (ksenograft granula, 0.5 g)', 'Yordamchi materiallar'),
  P('memb', 'Kollagen membrana 20×30 mm', 'Yordamchi materiallar'),
  P('kfile', 'Endodontik K-fayllar №15–40 (6 dona, steril)', 'Endodontik asboblar'),
  P('apex', 'Apeks lokator (rangli ekran)', 'Uskunalar'),
  P('gutta', 'Gutapercha shtiftlar 04 konus', 'Endodontik asboblar'),
  P('dam', 'Kofferdam to‘plami (ramka, qisqichlar, plastinalar)', 'Endodontik asboblar'),
  P('komp', 'Kompozit plomba to‘plami (A1, A2, A3)', 'Restavratsion materiallar'),
  P('lamp', 'Simsiz fotopolimer lampa (LED)', 'Uskunalar'),
  P('brek', 'Ortodontik breket tizimi (metall, 20 dona)', 'Ortodontiya'),
  P('glove', 'Nitril qo‘lqoplar (100 dona)', 'Himoya vositalari'),
]

test('normalizeSpecialty handles Uzbek, Russian, case, apostrophes and variants', () => {
  assert.equal(normalizeSpecialty('Implantolog'), 'implant')
  assert.equal(normalizeSpecialty('ИМПЛАНТОЛОГ'), 'implant')
  assert.equal(normalizeSpecialty('Jarroh-implantolog'), 'implant')
  assert.equal(normalizeSpecialty('endodontist'), 'endo')
  assert.equal(normalizeSpecialty('Эндодонтист'), 'endo')
  assert.equal(normalizeSpecialty('Ortoped stomatolog'), 'ortoped')
  assert.equal(normalizeSpecialty('Стоматолог-ортопед'), 'ortoped')
  assert.equal(normalizeSpecialty('Ortodont'), 'orto')
  assert.equal(normalizeSpecialty('Bolalar stomatologi'), 'bolalar')
  assert.equal(normalizeSpecialty('Детский стоматолог'), 'bolalar')
  assert.equal(normalizeSpecialty('Parodontolog'), 'paro')
  assert.equal(normalizeSpecialty('Jarroh'), 'jarroh')
  assert.equal(normalizeSpecialty('Хирург'), 'jarroh')
  assert.equal(normalizeSpecialty('Terapevt'), 'terapevt')
  assert.equal(normalizeSpecialty('Estetik stomatolog'), 'estetik')
  assert.equal(normalizeSpecialty('Talaba'), 'talaba')
  assert.equal(normalizeSpecialty('Stomatolog'), 'stomatolog')
  assert.equal(normalizeSpecialty(''), '')
  assert.equal(normalizeSpecialty('Sotuvchi'), '')
})

test('every picker/registration specialty maps to a profile', () => {
  for (const s of SPECIALTIES) assert.ok(normalizeSpecialty(s), s)
  for (const s of PICKER_SPECIALTIES) assert.ok(SPECIALTIES.includes(s), s)
  assert.deepEqual(specialtyOptions('Ortoped stomatolog')[0], 'Ortoped stomatolog')
  assert.equal(specialtyOptions('Implantolog'), SPECIALTIES)
})

test('specialty keyword scoring matches the right products', () => {
  const by = (id) => CATALOG.find((p) => p.id === id)
  assert.ok(matchesSpecialty(by('impl'), 'implant'))
  assert.ok(matchesSpecialty(by('bone'), 'implant'))
  assert.ok(matchesSpecialty(by('kfile'), 'endo'))
  assert.ok(matchesSpecialty(by('apex'), 'endo'))
  assert.ok(!matchesSpecialty(by('kfile'), 'implant'))
  assert.ok(!matchesSpecialty(by('impl'), 'endo'))
  assert.ok(matchesSpecialty(by('brek'), 'orto'))
  assert.ok(matchesSpecialty(by('komp'), 'terapevt'))
  assert.equal(specialtyScore(by('impl'), 'nope'), 0)
})

test('seminar matching and ordering keep other seminars unchanged', () => {
  const sems = [{ id: 1, cat: 'orto', title: 'Breket' }, { id: 2, cat: 'impl', title: 'Implant' }, { id: 3, cat: 'other', title: 'Sinus lifting va augmentatsiya' }, { id: 4, cat: 'impl', title: 'Eski', past: true }]
  assert.ok(seminarMatches(sems[1], 'implant'))
  assert.ok(seminarMatches(sems[2], 'implant'))
  assert.ok(!seminarMatches(sems[0], 'implant'))
  assert.deepEqual(sortSeminarsForSpecialty(sems, 'implant').map((s) => s.id), [2, 3, 1, 4])
  assert.deepEqual(sortSeminarsForSpecialty(sems, '').map((s) => s.id), [1, 2, 3, 4])
})

test('product kinds and complements', () => {
  const by = (id) => CATALOG.find((p) => p.id === id)
  assert.equal(productKind(by('impl')), 'implant')
  assert.equal(productKind(by('abut')), 'abutment')
  assert.equal(productKind(by('kfile')), 'endo_file')
  assert.ok(isComplement(by('impl'), by('bone')))
  assert.ok(isComplement(by('kfile'), by('gutta')))
  assert.ok(!isComplement(by('impl'), by('impl')))
  assert.ok(!isComplement(by('kfile'), by('brek')))
  assert.deepEqual(complementsFor(by('impl'), CATALOG).map((p) => p.id), ['abut', 'bone', 'memb'])
  assert.deepEqual(complementsFor(by('kfile'), CATALOG).map((p) => p.id), ['gutta', 'apex', 'dam'])
  assert.deepEqual(complementsFor(by('glove'), CATALOG), [])
  assert.ok(isConsumable(by('komp')))
  assert.ok(!isConsumable(by('apex')))
  assert.ok(CONSUMABLE_REORDER_DAYS >= 30 && CONSUMABLE_REORDER_DAYS <= 60)
})

test('decay: full for 7 days, ~half at 14, gone after 28', () => {
  assert.equal(decay(NOW - 3 * DAY, NOW), 1)
  assert.ok(Math.abs(decay(NOW - 14 * DAY, NOW) - 0.5) < 1e-9)
  assert.equal(decay(NOW - 29 * DAY, NOW), 0)
  assert.equal(decay(undefined, NOW), 0)
})

test('viewed-but-not-bought product and its similars are on top; purchased disappears', () => {
  const events = [
    { kind: 'view', productId: 'apex', at: NOW - DAY }, { kind: 'view', productId: 'apex', at: NOW - DAY / 2 }, { kind: 'view', productId: 'apex', at: NOW - 3600e3 },
  ]
  const sig = aggregateEvents(events)
  const r = recommend(CATALOG, { signals: sig, specialty: '', now: NOW })
  assert.equal(r.mode, 'behavior')
  assert.equal(r.items[0].product.id, 'apex')
  assert.equal(r.items[0].reason, 'viewed')
  const bought = aggregateEvents(events, [{ productId: 'apex', at: NOW - 3600e3 }])
  const r2 = recommend(CATALOG, { signals: bought, specialty: '', now: NOW })
  assert.ok(!r2.items.some((x) => x.product.id === 'apex'))
  // apeks lokator xarid qilingan -> to‘ldiruvchilar (fayllar, gutapercha)
  assert.ok(r2.items.slice(0, 3).some((x) => x.product.id === 'kfile' && x.reason === 'complement'))
})

test('purchase complements outrank specialty; consumables come back after the interval', () => {
  const sig = aggregateEvents([], [{ productId: 'impl', at: NOW - 2 * DAY }])
  const r = recommend(CATALOG, { signals: sig, specialty: 'endo', now: NOW })
  assert.deepEqual(r.items.slice(0, 3).map((x) => x.product.id).sort(), ['abut', 'bone', 'memb'])
  assert.ok(!r.items.some((x) => x.product.id === 'impl'))
  const komp = CATALOG.find((p) => p.id === 'komp')
  assert.ok(recentlyPurchased(komp, aggregateEvents([], [{ productId: 'komp', at: NOW - 10 * DAY }]), NOW))
  assert.ok(!recentlyPurchased(komp, aggregateEvents([], [{ productId: 'komp', at: NOW - (CONSUMABLE_REORDER_DAYS + 1) * DAY }]), NOW))
})

test('search signal boosts matching products; old signals decay away', () => {
  const sig = aggregateEvents([{ kind: 'search', query: 'gutapercha', at: NOW - DAY }])
  assert.equal(recommend(CATALOG, { signals: sig, now: NOW }).items[0].product.id, 'gutta')
  const old = aggregateEvents([{ kind: 'search', query: 'gutapercha', at: NOW - 40 * DAY }])
  assert.equal(hasSignals(old, NOW), false)
})

test('discounted boosted product is flagged and preferred', () => {
  const cat = CATALOG.map((p) => (p.id === 'lamp' ? { ...p, price: 80000, oldPrice: 100000 } : p))
  const sig = aggregateEvents([{ kind: 'view', productId: 'lamp', at: NOW - DAY }, { kind: 'view', productId: 'komp', at: NOW - DAY }])
  const r = recommend(cat, { signals: sig, now: NOW })
  assert.equal(r.items[0].product.id, 'lamp')
  assert.equal(r.items[0].sale, true)
})

test('cold start: specialty, else popular, else hidden; never fewer than 2 items', () => {
  const r = recommend(CATALOG, { signals: undefined, specialty: 'implant', now: NOW })
  assert.equal(r.mode, 'specialty')
  assert.ok(r.items.every((x) => ['impl', 'abut', 'bone', 'memb'].includes(x.product.id)))
  const pop = recommend(CATALOG, { signals: { products: {}, categories: {}, queries: [], popular: ['glove', 'lamp'] }, specialty: '', now: NOW })
  assert.equal(pop.mode, 'popular')
  assert.deepEqual(pop.items.map((x) => x.product.id), ['glove', 'lamp'])
  assert.deepEqual(recommend(CATALOG, { specialty: '', now: NOW }).items, [])
  assert.deepEqual(recommend(CATALOG.slice(0, 1), { specialty: 'implant', now: NOW }).items, [])
})

test('marketplace ordering is stable and only boosts', () => {
  assert.equal(orderForMarketplace(CATALOG, { specialty: '', now: NOW }), CATALOG)
  const out = orderForMarketplace(CATALOG, { specialty: 'endo', now: NOW }).map((p) => p.id)
  assert.equal(out.length, CATALOG.length)
  assert.ok(out.indexOf('kfile') < out.indexOf('impl'))
  assert.ok(out.indexOf('gutta') < out.indexOf('glove'))
})

test('server profile parsing and merging', () => {
  const srv = fromServer({ products: [{ product_id: 'apex', views: 2, view_at: new Date(NOW - DAY).toISOString(), carts: 0, purchases: 0 }], queries: [{ query: 'Fayl', n: 2, at: new Date(NOW).toISOString() }], popular: ['x'] })
  const loc = aggregateEvents([{ kind: 'view', productId: 'apex', at: NOW }])
  const m = mergeSignals(srv, loc)
  assert.equal(m.products.apex.views, 3)
  assert.equal(m.queries[0].q, 'fayl')
  assert.deepEqual(m.popular, ['x'])
  assert.equal(fromServer(null).queries.length, 0)
})
