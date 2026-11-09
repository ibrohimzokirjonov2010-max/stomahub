import test from 'node:test'
import assert from 'node:assert/strict'
import { pickPublic, pickFeatured, featuredError, move } from '../src/seller-public/lib.js'

test('pickPublic never passes requisites through', () => {
  const r = pickPublic({ id: '1', shop_name: 'A', legal: { stir: '123456789' }, stir: '1', bank: 'x', mfo: '1', account: '1', owner_name: 'Ali', notify: {} })
  assert.deepEqual(Object.keys(r).sort(), ['id', 'shop_name'])
})
test('pickFeatured keeps order, drops inactive/unknown, dedupes, caps 8', () => {
  const ps = 'abcdefghij'.split('').map((id) => ({ id }))
  assert.deepEqual(pickFeatured(['c', 'zz', 'a', 'c'], ps).map((p) => p.id), ['c', 'a'])
  assert.equal(pickFeatured('abcdefghij'.split(''), ps).length, 8)
  assert.deepEqual(pickFeatured(null, ps), [])
})
test('featuredError: 0 or 4-8', () => {
  assert.equal(featuredError([]), '')
  assert.ok(featuredError(['a', 'b']))
  assert.equal(featuredError(['a', 'b', 'c', 'd']), '')
  assert.ok(featuredError('abcdefghi'.split('')))
})
test('move swaps within bounds', () => {
  assert.deepEqual(move(['a', 'b', 'c'], 0, 1), ['b', 'a', 'c'])
  assert.deepEqual(move(['a', 'b'], 0, -1), ['a', 'b'])
})

import { ratingOf, salesOf, verifiedOf, workTimeOf, contactOf, categoriesOf, orderProducts } from '../src/seller-public/lib.js'
test('v2: rating only with real reviews', () => {
  assert.equal(ratingOf({ rating: null, reviews_count: 0 }), null)
  assert.equal(ratingOf({ rating: 4.83, reviews_count: 3 }), 4.8)
  assert.equal(ratingOf({ rating: 5, reviews_count: 0 }), null)
})
test('v2: sales hidden unless RPC returns it', () => {
  assert.equal(salesOf({}), null)
  assert.equal(salesOf({ sales_count: 0 }), 0)
  assert.equal(salesOf({ sales_count: '12' }), 12)
})
test('v2: verified', () => {
  assert.equal(verifiedOf(null), false)
  assert.equal(verifiedOf({ id: 'x' }), true)
  assert.equal(verifiedOf({ verified: false }), false)
})
test('v2: contact channels', () => {
  assert.deepEqual(contactOf({}), { telegram: null, tel: '', message: '', messageVia: '' })
  assert.equal(contactOf({ telegram: 'https://t.me/dokon' }).message, 'https://t.me/dokon')
  assert.equal(contactOf({ telegram: '@dokon' }).telegram.handle, '@dokon')
  const c = contactOf({ phone: '+998 90 123 45 67' })
  assert.equal(c.tel, 'tel:+998901234567'); assert.equal(c.messageVia, 'sms')
})
test('v2: work time, categories, featured order', () => {
  assert.equal(workTimeOf({ work_days: 'Du-Sh', work_hours: ' ' }), 'Du-Sh')
  assert.deepEqual(categoriesOf([{ category: 'A' }, { category: 'B' }, { category: 'A' }, {}]), ['A', 'B'])
  const ps = ['a', 'b', 'c'].map((id) => ({ id }))
  assert.deepEqual(orderProducts(ps, ['c']).map((p) => p.id), ['c', 'a', 'b'])
})

import { demoEntityToInfo, demoItemsToCards, demoProductsLabel } from '../src/seller-public/lib.js'
test('demo: labels by kind', () => {
  assert.equal(demoProductsLabel('shop'), 'Mahsulotlar')
  assert.equal(demoProductsLabel('organizer'), 'Seminarlar')
  assert.equal(demoProductsLabel('bookseller'), 'Kitoblar')
})
test('demo: entity → info never invents rating/sales/verified', () => {
  const info = demoEntityToInfo({
    kind: 'shop', name: 'Dentashop', description: 'D', city: 'Toshkent',
    phone: '+998 90 000 00 00', telegram: 'https://t.me/x', logo_url: 'https://x/l.png', address: 'A',
  })
  assert.equal(info.shop_name, 'Dentashop')
  assert.equal(info.avatar_url, 'https://x/l.png')
  assert.equal(info.verified, false)
  assert.equal(info.shop_type, 'Do‘kon')
  assert.ok(!('rating' in info))
  assert.ok(!('sales_count' in info))
  assert.ok(!('reviews_count' in info))
  assert.deepEqual(info.reviews, [])
  assert.equal(demoEntityToInfo(null), null)
})
test('demo: items → cards keep null price and seminar meta', () => {
  const cards = demoItemsToCards([
    { id: '1', kind: 'product', name: 'A', price: 1000, price_text: '1 000', image_url: '/a.jpg', source_url: 'https://s' },
    { id: '2', kind: 'seminar', name: 'Kurs', price: null, price_text: null, image_url: '', source_url: 'https://s2',
      extra: { date_text: '2026-yil 28–29-noyabr', location: 'DK Study', speaker: 'Ali' } },
    { id: '3', kind: 'book', name: 'Kitob', price: '', price_text: 'so‘ralganda', image_url: '', source_url: 'https://s3', extra: { author: 'BB' } },
  ], 'Shop')
  assert.equal(cards[0].price, 1000)
  assert.equal(cards[0].image, '/a.jpg')
  assert.equal(cards[1].price, null)
  assert.match(cards[1].meta, /2026-yil/)
  assert.match(cards[1].meta, /Ma’ruzachi: Ali/)
  assert.equal(cards[2].price, null)
  assert.equal(cards[2].priceText, 'so‘ralganda')
  assert.equal(cards[2].meta, 'BB')
  assert.equal(cards[2].kind, 'book')
})
