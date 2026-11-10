import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  attachOrderShops, deliveryModeLabel, groupOrderItems, orderHref, orderShopSummary, payMethodLabel, productHref, shopHref, thumbPreview,
} from '../src/lib/orderShops.js'

const S1 = '11111111-1111-4111-8111-111111111111'
const S2 = '22222222-2222-4222-8222-222222222222'
const P1 = '33333333-3333-4333-8333-333333333331'

test('do‘kon nomi buyurtma va har bir qatorga yoziladi', () => {
  const shops = new Map([[S1, 'DentPro Market'], [S2, '  Smile Lab  ']])
  const [one, mixed] = attachOrderShops([
    { id: 'STH-00024', sellerId: S1, items: [{ id: P1, sellerId: S1, name: 'Kompozit' }, { id: 'x', name: 'Niqob' }] },
    { id: 'STH-00025', sellerId: S1, items: [{ id: 'a', sellerId: S1, name: 'A' }, { id: 'b', sellerId: S2, name: 'B' }] },
  ], shops)
  assert.equal(one.shopName, 'DentPro Market')
  assert.equal(one.items[1].sellerId, S1)
  assert.equal(one.items[1].shopName, 'DentPro Market')
  assert.equal(mixed.shopName, 'DentPro Market')
  assert.deepEqual(mixed.items.map((it) => it.shopName), ['DentPro Market', 'Smile Lab'])
  assert.equal(orderShopSummary(one), 'DentPro Market')
  assert.equal(orderShopSummary(mixed), '2 ta do‘kon')
  assert.equal(groupOrderItems(mixed).length, 2)
})

test('do‘kon topilmasa Sotuvchi, havolalar faqat uuid', () => {
  const [o] = attachOrderShops([{ id: 'STH-1', sellerId: 'not-uuid', items: [{ id: 'p', name: 'X' }] }], new Map())
  assert.equal(o.shopName, 'Sotuvchi')
  assert.equal(o.items[0].shopName, 'Sotuvchi')
  assert.equal(shopHref(S1), `/dokon/${S1}`)
  assert.equal(shopHref('manual'), '')
  assert.equal(productHref(P1), `/product/${P1}`)
  assert.equal(productHref(''), '')
  assert.equal(orderHref({ id: '#STH-00024' }), '/buyurtma/kuzatish/STH-00024')
  assert.equal(payMethodLabel('click'), 'Click')
  assert.equal(payMethodLabel('payme'), 'Payme')
  assert.equal(payMethodLabel('cash'), 'Naqd')
  assert.equal(deliveryModeLabel('pickup'), 'Olib ketish')
  assert.equal(deliveryModeLabel('courier'), 'Kuryer')
})

test('bir nechta rasm: 3 tasi ko‘rinadi, qolgani +N', () => {
  assert.equal(thumbPreview([{ id: 1 }]).extra, 0)
  assert.equal(thumbPreview([{ id: 1 }]).shown.length, 1)
  const many = thumbPreview([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }])
  assert.equal(many.shown.length, 3)
  assert.equal(many.extra, 2)
  assert.equal(many.total, 5)
  assert.deepEqual(thumbPreview(null), { shown: [], extra: 0, total: 0 })
})

test('0071: faqat o‘z buyurtmasidagi do‘kon, anon yopiq', () => {
  const sql = fs.readFileSync(new URL('../supabase/migrations/0071_buyer_order_shops.sql', import.meta.url), 'utf8')
  assert.match(sql, /create or replace function public\.buyer_order_shops\(\)/)
  assert.match(sql, /security definer/)
  assert.match(sql, /set search_path = public/)
  assert.match(sql, /o\.buyer_id = auth\.uid\(\)/)
  assert.match(sql, /seller_order_items/)
  assert.match(sql, /nullif\(btrim\(p\.shop_name\), ''\)/)
  assert.match(sql, /revoke all on function public\.buyer_order_shops\(\) from public, anon/)
  assert.match(sql, /grant execute on function public\.buyer_order_shops\(\) to authenticated/)
  assert.doesNotMatch(sql, /\bdelete from\b|\bdrop table\b|\btruncate\b/i)
  const body = sql.slice(sql.indexOf('as $$'), sql.indexOf('$$;'))
  assert.doesNotMatch(body, /p\.email|p\.phone|p\.full_name|bank|stir/i)
})

test('buyurtmalar seller_orders va seller_order_items dan, do‘kon RPC orqali', () => {
  const src = fs.readFileSync(new URL('../src/buyerApi.js', import.meta.url), 'utf8')
  assert.match(src, /from\('seller_orders'\)/)
  assert.match(src, /seller_order_items\(id,product_id,seller_id,name,variant,image_url,qty,price\)/)
  assert.match(src, /rpc\('buyer_order_shops'\)/)
  assert.match(src, /attachOrderShops/)
})
