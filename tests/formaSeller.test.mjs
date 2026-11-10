import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { sizeTypeOf, sizesFor, sizeChartFor, SHOE_CHART } from '../src/lib/formaSizes.js'
import { marketToForma, pickVariant, formaCartLine, formaQuestionText, isFormaMarketProduct, cleanKashta } from '../src/lib/formaLive.js'
import { variantLabel } from '../src/config/productCatalog.js'

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')

test('o‘lcham turi: aniq maydon ustun, bo‘lmasa toifa/nom bo‘yicha', () => {
  assert.equal(sizeTypeOf({ sizeType: 'shoe', cat: 'scrub' }), 'shoe')
  assert.equal(sizeTypeOf({ forma: { size_type: 'one' } }), 'one')
  assert.equal(sizeTypeOf({ cat: 'shoe', sizes: ['36'] }), 'shoe')
  assert.equal(sizeTypeOf({ cat: 'scrub', title: 'Tibbiy poyabzal (klog) EVA' }), 'shoe')
  assert.equal(sizeTypeOf({ title: 'Krossovka Med' }), 'shoe')
  assert.equal(sizeTypeOf({ title: 'Uy tapochkasi' }), 'shoe')
  assert.equal(sizeTypeOf({ cat: 'cap', sizes: ['M'] }), 'one')
  assert.equal(sizeTypeOf({ cat: 'apron', sizes: ['Universal'] }), 'one')
  assert.equal(sizeTypeOf({ cat: 'scrub', sizes: ['S', 'M'] }), 'clothing')
})

test('oyoq kiyim: EU raqamlar va oyoq uzunligi jadvali', () => {
  const klog = { id: 'demo-forma-klog-eva', cat: 'shoe', sizeType: 'shoe', sizes: ['36', '37', '44'] }
  assert.deepEqual(sizesFor(klog), ['36', '37', '44'])
  const chart = sizeChartFor(klog)
  assert.equal(chart.title, 'Oyoq kiyim o‘lchami')
  assert.deepEqual(chart.head, ['EU o‘lcham', 'Oyoq uzunligi (sm)'])
  assert.equal(chart.rows[0][0], '35')
  assert.equal(SHOE_CHART.find((r) => r[0] === '36')[1], '23,0–23,5')
  assert.ok(!chart.rows.some((r) => /XS|XXL/.test(r[0])))
  // kiyim harflari poyabzalda ko‘rsatilmaydi
  assert.deepEqual(sizesFor({ cat: 'shoe', sizes: ['M', 'L'] }).slice(0, 2), ['35', '36'])
})

test('bitta o‘lcham: jadval yo‘q, «Universal»', () => {
  const cap = { cat: 'cap', sizeType: 'one', sizes: ['Universal'] }
  assert.equal(sizeChartFor(cap), null)
  assert.deepEqual(sizesFor(cap), ['Universal'])
  assert.equal(sizeChartFor({ cat: 'scrub', sizes: ['M'] }).head[1], 'Ko‘krak')
})

const row = {
  id: '11111111-2222-4333-8444-555555555555', sellerId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', seller: 'Oq Libos', name: 'Skrab to‘plam', brand: '',
  category: 'Tibbiy forma', rawCategory: 'Tibbiy forma', price: 300000, image: '/x.jpg', images: ['/x.jpg'], description: 'Yengil mato. Ikkinchi gap.',
  forma: { cat: 'scrub', gender: 'female', fabric: 'stretch', size_type: 'clothing', kashta_price: 35000 },
  variants: [
    { type: 'forma', size: 'M', color: 'navy', price: 320000, stock: 4, sku: 'V-MNavy' },
    { type: 'forma', size: 'S', color: 'navy', price: 300000, stock: 0, sku: 'V-SNavy' },
    { type: 'forma', size: 'M', color: 'white', price: 320000, stock: 2, sku: 'V-MWhite' },
  ],
}

test('sotuvchi mahsuloti → Forma shakli', () => {
  assert.ok(isFormaMarketProduct(row))
  assert.ok(!isFormaMarketProduct({ ...row, rawCategory: 'Implantlar', category: 'Implantlar' }))
  const p = marketToForma(row)
  assert.equal(p.live, true)
  assert.deepEqual(p.sizes, ['S', 'M'])
  assert.deepEqual(p.colors, ['navy', 'white'])
  assert.equal(p.price, 300000)
  assert.equal(p.kashtaPrice, 35000)
  assert.equal(p.brand, 'Oq Libos')
  assert.equal(p.about, 'Yengil mato.')
  assert.equal(pickVariant(p, 'M', 'white').sku, 'V-MWhite')
  assert.equal(pickVariant(p, 'S', 'white'), null)
})

test('savat qatori: variant SKU, kashta narxi va matni', () => {
  const p = marketToForma(row)
  const v = pickVariant(p, 'M', 'navy')
  const plain = formaCartLine(p, v)
  assert.equal(plain.productId, row.id)
  assert.equal(plain.variant, 'V-MNavy')
  assert.equal(plain.price, 320000)
  assert.equal(plain.kashta, undefined)
  assert.match(plain.name, /\(M, To‘q ko‘k\)/)
  const k = formaCartLine(p, v, '  Dr.  Aliyeva M. ')
  assert.equal(k.price, 355000)
  assert.equal(k.kashta, 'Dr. Aliyeva M.')
  assert.notEqual(k.id, plain.id)
  // kashta xizmati yo‘q mahsulotda matn e’tiborga olinmaydi
  const noK = formaCartLine({ ...p, kashtaPrice: 0 }, v, 'Ism')
  assert.equal(noK.price, 320000)
  assert.equal(noK.kashta, undefined)
  assert.equal(cleanKashta('x'.repeat(100)).length, 60)
  // namuna yoki variantsiz — savat qatori yo‘q
  assert.equal(formaCartLine({ ...p, live: false }, v), null)
  assert.equal(formaCartLine(p, null), null)
})

test('savol matni va variant nomi', () => {
  const p = marketToForma(row)
  const t = formaQuestionText({ p, size: 'M', color: 'navy', url: 'https://stomahub.uz/forma/1' })
  assert.match(t, /Skrab to‘plam \(o‘lcham: M, rang: To‘q ko‘k\)/)
  assert.match(t, /https:\/\/stomahub\.uz\/forma\/1$/)
  assert.equal(variantLabel({ size: 'L', color: 'wine' }, 'forma'), 'L · Bordo')
})

test('soxta «yuborildi» oqimlari olib tashlangan, server kashtani hisoblaydi', () => {
  assert.doesNotMatch(read('src/pages/FormaItem.jsx'), /Savolingiz yuborildi/)
  assert.doesNotMatch(read('src/pages/FormaItem.jsx'), /setAsk/)
  const sql = read('supabase/migrations/0064_forma_seller.sql')
  assert.match(sql, /add column if not exists forma jsonb/)
  assert.match(sql, /seller_order_items add column if not exists note/)
  assert.match(sql, /v_kashta_fee := coalesce\(nullif\(v_p\.forma->>'kashta_price'/)
  assert.match(sql, /'Kashta: ' \|\| v_kashta/)
  assert.match(sql, /is_demo and owner_id is null and id = 'demo-forma-klog-eva'/)
  assert.match(read('src/buyerApi.js'), /kashta: it\.kashta/)
  assert.match(read('src/cart.jsx'), /kashta: String\(product\.kashta\)/)
  assert.match(read('api/notify/new-order.js'), /i\.note/)
})
