import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { isLive, leftSeconds, promoPrice, promoFor, validateAksiya, toRow, statusOf, cleanTitle, isHttpsUrl, aksiyaError } from '../src/lib/aksiya.js'
import { applyPromotion, applyDiscount } from '../src/lib/discounts.js'

const T = '2026-11-10'
const S = 'seller-1'
const P = { id: 'p1', sellerId: S, price: 200000, oldPrice: 0, variants: [{ id: 'v1', price: 100000 }], priceTiers: [{ min: 10, price: 190000 }] }

test('muddat: boshlanmagan va tugagan aksiya ko‘rinmaydi', () => {
  assert.equal(isLive({ startsOn: '2026-11-01', endsOn: '2026-11-10' }, T), true)
  assert.equal(isLive({ startsOn: '2026-11-11', endsOn: '2026-11-20' }, T), false)
  assert.equal(isLive({ startsOn: '2026-11-01', endsOn: '2026-11-09' }, T), false)
  // qolgan vaqt endsOn (Toshkent 23:59:59) dan — eskirgan "left" emas
  assert.equal(leftSeconds('2026-11-10', Date.parse('2026-11-10T23:59:00+05:00')), 59)
  assert.equal(leftSeconds('2026-11-09', Date.parse('2026-11-10T00:00:00+05:00')), 0)
})

test('aksiya narxi: foiz, mahsulot narxi nisbati, barcha mahsulotlar', () => {
  assert.equal(promoPrice({ scope: 'all', percent: 10 }, 200000), 180000)
  assert.equal(promoPrice({ scope: 'product', price: 160000, oldPrice: 200000 }, 100000), 80000)
  assert.equal(promoPrice({ scope: 'all', percent: 95 }, 1000), 1000)
  const all = { id: 'sp-a', scope: 'all', percent: 10, off: 10, sellerId: S, startsOn: '2026-11-01', endsOn: '2026-11-30', title: 'Kuz' }
  const one = { id: 'sp-b', scope: 'product', productId: 'p1', price: 160000, oldPrice: 200000, sellerId: S, startsOn: '2026-11-01', endsOn: '2026-11-30' }
  const other = { ...all, id: 'sp-c', sellerId: 'boshqa', percent: 50 }
  assert.equal(promoFor(P, [all, one, other], T).id, 'sp-b')
  const r = applyPromotion(P, [all, other], T)
  assert.equal(r.price, 180000); assert.equal(r.oldPrice, 200000); assert.equal(r.promotionTitle, 'Kuz')
  assert.equal(r.variants[0].price, 90000); assert.equal(r.variants[0].oldPrice, 100000)
  assert.equal(r.priceTiers[0].price, 171000)
  // tugagan aksiya qo‘llanmaydi
  assert.equal(applyPromotion(P, [{ ...all, endsOn: '2026-11-09' }], T).price, 200000)
  // chegirma bilan qo‘shilmaydi: asl narxdan, eng arzoni
  const disc = [{ seller_id: S, active: true, kind: 'foiz', value: 30, percent: 30, amount: 30 }]
  const d = applyDiscount(P, disc, T)
  const both = applyPromotion(d, [all], T)
  assert.ok(both.price <= d.price)
})

test('forma tekshiruvi', () => {
  const ok = { scope: 'product', mode: 'percent', percent: '20', starts_on: T, ends_on: '2026-11-30', title: '' }
  assert.deepEqual(validateAksiya(ok, { price: 200000 }, T), {})
  assert.ok(validateAksiya({ ...ok, percent: '0' }, { price: 1 }, T).percent)
  assert.ok(validateAksiya({ ...ok, percent: '91' }, { price: 1 }, T).percent)
  assert.ok(validateAksiya({ ...ok, mode: 'price', price: '200000' }, { price: 200000 }, T).price)
  assert.deepEqual(validateAksiya({ ...ok, mode: 'price', price: '150 000' }, { price: 200000 }, T), {})
  assert.ok(validateAksiya(ok, null, T).product_id)
  assert.ok(validateAksiya({ ...ok, scope: 'all', title: '' }, null, T).title)
  assert.deepEqual(validateAksiya({ ...ok, scope: 'all', title: 'Kuzgi aksiya' }, null, T), {})
  assert.ok(validateAksiya({ ...ok, ends_on: '' }, { price: 9 }, T).ends_on)
  assert.ok(validateAksiya({ ...ok, ends_on: '2026-11-09', starts_on: '2026-11-01' }, { price: 9 }, T).ends_on)
  assert.ok(validateAksiya({ ...ok, ends_on: '2027-12-01' }, { price: 9 }, T).ends_on)
  assert.ok(validateAksiya({ ...ok, banner_url: 'javascript:alert(1)' }, { price: 9 }, T).banner)
  assert.ok(validateAksiya({ ...ok, banner_url: 'http://a.uz/x.jpg' }, { price: 9 }, T).banner)
  assert.ok(validateAksiya({ ...ok, file: { type: 'image/svg+xml', size: 10 } }, { price: 9 }, T).banner)
  assert.ok(validateAksiya({ ...ok, file: { type: 'image/png', size: 6 * 1024 * 1024 } }, { price: 9 }, T).banner)
  assert.equal(isHttpsUrl('https://x.supabase.co/storage/v1/object/public/avatars/u/aksiya/1.jpg'), true)
  assert.equal(isHttpsUrl('https://a.uz/"><script>'), false)
  assert.equal(cleanTitle('<b>Kuz</b>\n  aksiya'), 'b Kuz /b aksiya')
})

test('qatorga aylantirish va holat', () => {
  const p = { id: 'p1', price: 200000 }
  assert.deepEqual(toRow({ scope: 'product', mode: 'percent', percent: '20', starts_on: T, ends_on: T, title: ' A ' }, p),
    { scope: 'product', title: 'A', banner_url: '', starts_on: T, ends_on: T, product_id: 'p1', percent: 20, old_price: 200000, price: 160000 })
  const all = toRow({ scope: 'all', percent: '15', starts_on: T, ends_on: T, title: 'Kuz' }, null)
  assert.equal(all.product_id, null); assert.equal(all.percent, 15); assert.equal(all.price, null)
  assert.equal(toRow({ scope: 'product', mode: 'price', price: '150000', starts_on: T, ends_on: T }, p).percent, null)
  assert.equal(statusOf({ active: false, ends_on: T, starts_on: T }, T)[0], 'To‘xtatilgan')
  assert.equal(statusOf({ active: true, ends_on: '2026-11-09', starts_on: T }, T)[0], 'Tugagan')
  assert.equal(statusOf({ active: true, ends_on: '2026-11-20', starts_on: '2026-11-11' }, T)[0], 'Rejalashtirilgan')
  assert.equal(statusOf({ active: true, ends_on: T, starts_on: T }, T)[0], 'Faol')
  assert.match(aksiyaError({ code: '23505', message: 'duplicate key seller_promotions_one_active' }), /allaqachon faol/)
})

const sql = fs.readFileSync(new URL('../supabase/migrations/0068_seller_aksiya.sql', import.meta.url), 'utf8')
test('0068: server qoidalari (egasi, eski narx, https banner, RLS, narx funksiyasi)', () => {
  assert.match(sql, /new\.seller_id := auth\.uid\(\)/)
  assert.match(sql, /new\.seller_id := old\.seller_id/)
  assert.match(sql, /new\.old_price := p\.price/)
  assert.match(sql, /\^https:\/\//)
  assert.match(sql, /grant select, insert, update, delete on public\.seller_promotions to authenticated/)
  assert.match(sql, /using \(seller_id = auth\.uid\(\)\)/)
  assert.match(sql, /create or replace function public\.seller_discount_price/)
  assert.match(sql, /1%% dan 90%%/)
  assert.doesNotMatch(sql, /\bdelete from public\.seller_promotions\b/)
  assert.doesNotMatch(sql, /drop table/i)
})

test('soxta oqimlar olib tashlandi (aksiya sahifasi)', () => {
  const page = fs.readFileSync(new URL('../src/pages/Aksiya.jsx', import.meta.url), 'utf8')
  const data = fs.readFileSync(new URL('../src/aksiyaData.js', import.meta.url), 'utf8')
  for (const s of ['Buyurtma qabul qilindi', 'Yakkasaroy', 'Ekspress yetkazib berish', 'Javob berish vaqti', 'setBought']) assert.ok(!page.includes(s), s)
  assert.ok(!data.includes('sellerOf'))
})
