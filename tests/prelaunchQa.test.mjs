import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mergeCarts } from '../src/cartMerge.js'

test('mergeCarts: dublikatsiz, katta miqdor qoladi, variantlar alohida', () => {
  const acc = [{ id: 'a', qty: 2 }, { id: 'b', variant: 'A2', qty: 1 }]
  const guest = [{ id: 'a', qty: 1 }, { id: 'b', variant: 'A3', qty: 4 }, { id: 'c', qty: 3 }]
  const out = mergeCarts(acc, guest)
  assert.equal(out.length, 4)
  assert.equal(out.find((x) => x.id === 'a').qty, 2)
  assert.equal(out.filter((x) => x.id === 'b').length, 2)
  assert.deepEqual(mergeCarts(out, guest), out)
  assert.deepEqual(mergeCarts([], []), [])
})

test('0045 migratsiya: promo ommaviy o‘qilmaydi, seminarlar maxfiy ustunlarsiz', () => {
  const sql = readFileSync(new URL('../supabase/migrations/0045_prelaunch_qa_privacy.sql', import.meta.url), 'utf8')
  assert.match(sql, /drop policy if exists promo_public_read/i)
  assert.match(sql, /function public\.check_promo/i)
  assert.match(sql, /create or replace view public\.seminars_public/i)
  const view = sql.slice(sql.search(/create or replace view public\.seminars_public/i)).split(/;\s*\n/)[0].replace('greatest(s.seats - s.sold, 0) as seats_left', '')
  for (const col of ['s.revenue', 's.sold', 's.contact_phone', 's.cancel_reason']) assert.ok(!view.includes(col), col)
  assert.match(sql, /is_test/)
})

test('seller/routes: buyurtmalar/:id bir marta', () => {
  const src = readFileSync(new URL('../src/seller/routes.jsx', import.meta.url), 'utf8')
  assert.equal(src.split('path="buyurtmalar/:id"').length - 1, 1)
})

test('SEO fayllari mavjud', () => {
  for (const f of ['robots.txt', 'sitemap.xml', 'favicon.ico']) readFileSync(new URL(`../public/${f}`, import.meta.url))
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  assert.match(html, /name="description"/)
  assert.match(html, /property="og:title"/)
})
