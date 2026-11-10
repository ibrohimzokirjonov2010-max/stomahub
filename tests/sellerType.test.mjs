import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  SELLER_TYPES, sellerTypeOf, needsSellerTypePick, categoriesFor, typeOfCategory, categoryAllowed, typeChangeBlock,
} from '../src/lib/sellerType.js'
import { isJihozMarketProduct, marketToJihoz, jihozCartLine, jihozQuestionText } from '../src/lib/jihozLive.js'
import { FORMA_CATEGORY, JIHOZ_CATEGORY, MARKET_CATEGORIES } from '../src/config/productCatalog.js'

test('three seller types, default stomatologik', () => {
  assert.deepEqual(SELLER_TYPES.map((t) => t.key), ['stomatologik', 'forma', 'jihozlar'])
  assert.equal(sellerTypeOf(null), 'stomatologik')
  assert.equal(sellerTypeOf({ seller_type: null }), 'stomatologik')
  assert.equal(sellerTypeOf({ seller_type: 'forma' }), 'forma')
  assert.equal(sellerTypeOf({ seller_type: 'xyz' }), 'stomatologik')
})

test('picker shows only for approved sellers with null type when column exists', () => {
  assert.equal(needsSellerTypePick({ seller_status: 'approved', seller_type: null }), true)
  assert.equal(needsSellerTypePick({ seller_status: 'approved', seller_type: 'forma' }), false)
  assert.equal(needsSellerTypePick({ seller_status: 'pending', seller_type: null }), false)
  assert.equal(needsSellerTypePick({ seller_status: 'approved' }), false, 'migration 0065 not applied → no picker')
})

test('categories per type', () => {
  assert.deepEqual(categoriesFor('forma'), [FORMA_CATEGORY])
  assert.deepEqual(categoriesFor('jihozlar'), [JIHOZ_CATEGORY])
  const st = categoriesFor('stomatologik')
  assert.ok(!st.includes(FORMA_CATEGORY) && !st.includes(JIHOZ_CATEGORY))
  assert.ok(st.includes('Uskunalar') && st.length === MARKET_CATEGORIES.length)
  assert.equal(typeOfCategory('Tibbiy forma'), 'forma')
  assert.equal(typeOfCategory('Stomatologik jihozlar'), 'jihozlar')
  assert.equal(typeOfCategory('Plomba materiallari'), 'stomatologik')
  assert.equal(categoryAllowed('forma', 'Plomba materiallari'), false)
  assert.equal(categoryAllowed(null, 'Plomba materiallari'), true)
  assert.equal(categoryAllowed('jihozlar', JIHOZ_CATEGORY), true)
})

test('type change blocked by active products of another type', () => {
  const ps = [{ category: 'Plomba materiallari', status: 'active' }, { category: 'Plomba materiallari', status: 'archived' }]
  assert.match(typeChangeBlock(ps, 'forma'), /1 ta/)
  assert.equal(typeChangeBlock(ps, 'stomatologik'), '')
  assert.equal(typeChangeBlock([], 'jihozlar'), '')
})

const live = {
  id: '11111111-1111-1111-1111-111111111111', sellerId: 's1', seller: 'Dental Tech', name: 'Sirona Intego Pro', category: JIHOZ_CATEGORY,
  brand: 'Sirona', price: 250000000, stock: 2, image: '/a.jpg', images: ['/a.jpg', '/b.jpg'], description: 'Yangi ustanovka.',
  specs: [['Quvvat', '1.2 kVt'], ['Kafolat', '99 oy']], jihoz: { cat: 'unit', model: 'Intego Pro', year: 2025, warranty: 24, city: 'Toshkent', install: true },
}

test('marketToJihoz maps seller product; always new', () => {
  assert.equal(isJihozMarketProduct(live), true)
  assert.equal(isJihozMarketProduct({ category: 'Uskunalar' }), false)
  const j = marketToJihoz(live)
  assert.equal(j.status, 'new')
  assert.equal(j.live, true)
  assert.equal(j.cat, 'unit')
  assert.equal(j.warranty, 24)
  assert.deepEqual(j.gallery, ['/a.jpg', '/b.jpg'])
  assert.ok(j.specs.some(([k, v]) => k === 'Holati' && v === 'Yangi'))
  assert.ok(j.specs.some(([k, v]) => k === 'Kafolat' && v === '2 yil'))
  assert.ok(!j.specs.some(([, v]) => v === '99 oy'), 'seller spec duplicating a base key is dropped')
  assert.ok(j.specs.some(([k]) => k === 'Quvvat'))
  assert.equal(marketToJihoz({ ...live, jihoz: { cat: 'bogus' } }).cat, 'unit')
})

test('jihoz cart line uses real product uuid; demo not purchasable', () => {
  const line = jihozCartLine(marketToJihoz(live))
  assert.equal(line.productId, live.id)
  assert.equal(line.sellerId, 's1')
  assert.equal(line.price, 250000000)
  assert.equal(jihozCartLine({ id: 'demo', live: false }), null)
  const t = jihozQuestionText({ p: marketToJihoz(live), topic: 'Kafolat qanday?', url: 'https://x/jihozlar/1' })
  assert.match(t, /Sirona Intego Pro \(Intego Pro\)/)
  assert.match(t, /Kafolat qanday\?/)
  assert.equal('lizing' in marketToJihoz(live), false, 'bo‘lib to‘lash olib tashlangan')
})

test('migration 0065 is safe and enforces type server-side', () => {
  const sql = readFileSync(new URL('../supabase/migrations/0065_seller_type.sql', import.meta.url), 'utf8')
  assert.match(sql, /add column if not exists seller_type/)
  assert.match(sql, /seller_products_type_gate/)
  assert.match(sql, /create or replace function public\.seller_set_type/)
  assert.match(sql, /profiles_seller_type_guard/)
  assert.match(sql, /add column if not exists jihoz jsonb/)
  assert.match(sql, /coalesce\(p\.jihoz, '\{\}'::jsonb\)/)
  assert.match(sql, /'Tibbiy forma' then 'forma'/)
  assert.match(sql, /'Stomatologik jihozlar' then 'jihozlar'/)
  assert.doesNotMatch(sql, /\bdelete\s+from\b/i)
  assert.doesNotMatch(sql, /\btruncate\b|\bdrop\s+table\b/i)
  assert.doesNotMatch(sql, /STH-00025/)
  assert.doesNotMatch(sql, /status:\s*new\|used/, 'no condition field — Jihozlar sells only new equipment')
  const src = readFileSync(new URL('../src/seller/components/mahsulotlar/ProductForm.jsx', import.meta.url), 'utf8')
  assert.doesNotMatch(src, /Ishlatilgan|b\.u\b/, 'jihoz form has no condition field')
})
