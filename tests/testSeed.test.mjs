import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import * as D from '../scripts/test-seed/data.mjs'
import { isTestProduct, isTestEvent, isTestSeedId, TEST_SEED_BATCH, testUserId } from '../src/lib/testSeed.js'

const root = new URL('..', import.meta.url)
const read = (p) => readFileSync(new URL(p, root), 'utf8')
const seed = read('supabase/migrations/0075_test_seed.sql')
const clean = read('supabase/migrations/0076_test_seed_cleanup.sql')
const sqlOnly = (s) => s.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')

test('sinov: har bo‘limda 5–10 ta yozuv', () => {
  for (const [k, list] of Object.entries({ PRODUCTS: D.PRODUCTS, FORMA: D.FORMA, JIHOZ: D.JIHOZ, PROMOS: D.PROMOS, SEMINARS: D.SEMINARS, COURSES: D.COURSES,
    MASTERS: D.MASTERS, DOCTORS: D.DOCTORS, ADS: D.ADS, JOBS: D.JOBS, BOOKS: D.BOOKS, SURPLUS: D.SURPLUS })) {
    assert.ok(list.length >= 5 && list.length <= 10, `${k}: ${list.length}`)
  }
})

test('sinov: barcha ID lar sinov prefiksi bilan, takrorlanmaydi', () => {
  const ids = [...D.USERS, ...D.PRODUCTS, ...D.FORMA, ...D.JIHOZ, ...D.PROMOS, ...D.SEMINARS, ...D.COURSES].map((x) => x.id)
  assert.equal(new Set(ids).size, ids.length)
  ids.forEach((id) => assert.ok(isTestSeedId(id), id))
  const cat = D.CATALOG.map((r) => `${r.kind}:${r.id}`)
  assert.equal(new Set(cat).size, cat.length)
  D.CATALOG.forEach((r) => { assert.match(r.id, /^ts26-/); assert.equal(r.payload.id, r.id) })
})

test('sinov: telefonlar faqat +998 90 000 00 NN, Telegram bo‘sh, haqiqiy havola yo‘q', () => {
  const json = JSON.stringify({ c: D.CATALOG, s: D.SEMINARS, u: D.USERS })
  const phones = json.match(/\+?998[\d ]{9,14}/g) || []
  assert.ok(phones.length > 10)
  phones.forEach((p) => assert.match(p.replace(/\D/g, ''), /^99890000\d{4}$/, p))
  assert.doesNotMatch(json, /"telegram":"[^"]|t\.me\//)
  D.USERS.forEach((u) => assert.match(u.email, /@test\.stomahub\.invalid$/))
})

test('sinov: rasmlar saytning o‘z public/images fayllari', () => {
  const imgs = new Set()
  ;[...D.PRODUCTS, ...D.FORMA, ...D.JIHOZ].forEach((p) => p.images.forEach((x) => imgs.add(x)))
  D.SEMINARS.forEach((s) => imgs.add(s.image)); D.COURSES.forEach((c) => imgs.add(c.cover_url))
  D.CATALOG.forEach(({ payload: p }) => [p.image, p.photo, p.cover, ...(p.images || []), ...(p.works || [])].filter(Boolean).forEach((x) => imgs.add(x)))
  imgs.forEach((src) => { assert.match(src, /^\/images\//); assert.ok(existsSync(new URL(`public${src}`, root)), src) })
})

test('sinov: mahsulot va seminarlar UI da buyurtma qilinmaydi', () => {
  assert.equal(isTestProduct({ sellerId: testUserId(1) }), true)
  assert.equal(isTestProduct({ id: D.PRODUCTS[0].id }), true)
  assert.equal(isTestProduct({ productId: D.FORMA[0].id, id: `${D.FORMA[0].id}:M` }), true)
  assert.equal(isTestProduct({ id: '22222222-2222-4222-8222-222222222222', sellerId: '11111111-1111-4111-8111-111111111111' }), false)
  assert.equal(isTestEvent({ id: D.SEMINARS[0].id }), true)
  assert.equal(isTestEvent({ id: 'qa-test-endodontiya', organizerId: '142df471-3f96-42b1-b635-908e94c6b6c4' }), false)
  assert.match(read('src/lib/purchaseGuard.js'), /isTestProduct\(p\)\) return \{ code: 'test'/)
  assert.match(read('src/components/CardQtyStepper.jsx'), /isTestProduct\(product\)/)
})

test('0075: generatsiya qilingan, idempotent, seed_batch bilan, tranzaksiyada', () => {
  assert.match(seed, /^begin;$/m)
  assert.match(seed, /^commit;$/m)
  for (const t of ['profiles', 'seller_products', 'seller_promotions', 'seminars', 'tickets', 'courses', 'course_lessons', 'catalog_items']) {
    assert.match(seed, new RegExp(`alter table public\\.${t} add column if not exists seed_batch text`), t)
  }
  // har bir upsert faqat shu partiyani yangilaydi
  const conflicts = sqlOnly(seed).match(/on conflict \([^)]*\) do update[\s\S]*?;/g) || []
  assert.equal(conflicts.length, 7)
  conflicts.forEach((c) => assert.match(c, new RegExp(`where public\\.\\w+\\.seed_batch = \\$ts\\$${TEST_SEED_BATCH}\\$ts\\$;$`)))
  assert.match(seed, /on conflict \(id\) do nothing;/)
  // vaqtincha o‘chirilgan triggerlar qayta yoqiladi
  for (const tg of ['catalog_items_ad_guard', 'catalog_items_surplus_guard', 'catalog_items_job_guard', 'seller_promotions_a_guard']) {
    assert.match(seed, new RegExp(`disable trigger ${tg};`)); assert.match(seed, new RegExp(`enable trigger ${tg};`))
  }
  // server himoyasi
  assert.match(seed, /create trigger seller_order_items_test_seed_gate before insert or update of product_id on public\.seller_order_items/)
  assert.match(seed, /create trigger registrations_test_seed_gate before insert on public\.registrations/)
  assert.match(seed, /create trigger course_enrollments_test_seed_gate before insert on public\.course_enrollments/)
  assert.match(seed, /seed_batch_guard\(\) returns trigger\nlanguage plpgsql security invoker/)
  assert.doesNotMatch(sqlOnly(seed), /\bdelete\b|\btruncate\b|\bdrop table\b/i)
  assert.doesNotMatch(sqlOnly(seed), /rzzamekrdxumjbkfhiqj|STH-000/)
})

test('0076: faqat seed_batch qatorlar va sinov hisoblarini o‘chiradi', () => {
  const s = sqlOnly(clean)
  const deletes = s.match(/delete from [\s\S]*?;/g) || []
  assert.ok(deletes.length >= 9)
  deletes.forEach((d) => assert.match(d, /seed_batch = \$ts\$test-2026-11\$ts\$|like 'sp-7e57d000-0000-4000-d000-%'|7e57d000-0000-4000-a000-/, d))
  assert.doesNotMatch(s, /\bupdate\b|\btruncate\b|\bdrop\b/i)
  assert.match(s, /not exists \(select 1 from public\.seller_order_items oi where oi\.product_id = sp\.id\)/)
})
