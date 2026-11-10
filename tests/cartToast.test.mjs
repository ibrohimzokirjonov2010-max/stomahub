import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { cartBadge, parseToast, toastDuration, toastBottom } from '../src/lib/toastModel.js'

const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8')

test('cartBadge: total units, 99+ cap', () => {
  assert.equal(cartBadge(0), '0')
  assert.equal(cartBadge(2), '2')
  assert.equal(cartBadge(99), '99')
  assert.equal(cartBadge(100), '99+')
  assert.equal(cartBadge(-3), '0')
  assert.equal(cartBadge('7'), '7')
})

test('parseToast recognises add-to-cart messages', () => {
  assert.deepEqual(parseToast('A-silikon qolip materiali (putty + light) savatga qo‘shildi'),
    { kind: 'cart', title: 'Savatga qo‘shildi', name: 'A-silikon qolip materiali (putty + light)', qty: 0 })
  assert.deepEqual(parseToast('2 ta Filtek Z350 savatga qo‘shildi'), { kind: 'cart', title: 'Savatga qo‘shildi', name: 'Filtek Z350', qty: 2 })
  assert.equal(parseToast('Savatga qo‘shildi').kind, 'cart')
  assert.equal(parseToast("Kompozit savatga qo'shildi").kind, 'cart')
})

test('parseToast picks error / warn / success tones', () => {
  assert.equal(parseToast('Saqlab bo‘lmadi').kind, 'error')
  assert.equal(parseToast('Tarmoq xatosi. Buyurtma yuborilmadi').kind, 'error')
  assert.equal(parseToast('Omborda faqat 3 dona bor').kind, 'warn')
  assert.equal(parseToast('Ortiqcha material savatga qo‘shilmaydi — sotuvchi bilan bog‘laning').kind, 'error')
  assert.equal(parseToast('Manzil saqlandi').kind, 'success')
  assert.equal(parseToast('X savatga qo‘shildi', { warn: true }).kind, 'warn')
  assert.equal(parseToast('Har qanday matn', { tone: 'info' }).kind, 'info')
})

test('durations and position above the floating tab bar', () => {
  assert.equal(toastDuration('cart'), 3000)
  assert.ok(toastDuration('error') >= 3000)
  assert.match(toastBottom(76), /var\(--bottom-nav-h, 58px\) \+ var\(--bottom-nav-float, 14px\)/)
  assert.match(toastBottom(76), /safe-area-inset-bottom/)
  assert.match(toastBottom(140), /\+ 74px\)$/)
  assert.match(toastBottom(24), /^calc\(24px \+ max\(env\(safe-area-inset-bottom/)
})

test('all cart badges use the same unit count', () => {
  assert.match(read('components/mobile/MobileTabBar.jsx'), /cartBadge\(count\)/)
  const header = read('components/Header.jsx')
  assert.doesNotMatch(header, /items\.length > 0 && <Badge/)
  assert.match(header, /cartBadge\(count\)/)
  for (const f of ['parts', 'MobileKategoriyalar', 'MobileSeminars', 'MobileCart', 'MobileCheckout', 'MobileProfil', 'MobileManzillar', 'MobileSeminarReg', 'MobileKuzatish']) {
    assert.doesNotMatch(read(`components/mobile/${f}.jsx`), /<CountBadge>\{items\.length\}<\/CountBadge>/, f)
  }
})

test('glass toast: Uzbek copy, one toast at a time, a11y, reduced motion', () => {
  const t = read('components/GlassToast.jsx')
  assert.match(t, /Savatga qo‘shildi/)
  assert.match(t, /Savatga o‘tish/)
  assert.match(t, /aria-live/)
  assert.match(t, /onCartAdd/)
  assert.match(read('components/mobile/parts.jsx'), /<GlassToast /)
  assert.match(read('restricted.jsx'), /<GlassToast /)
  assert.match(read('index.css'), /prefers-reduced-motion: reduce\)[\s\S]*glass-toast/)
})

test('specialty picker: compact, same save/dismiss behaviour', () => {
  const p = read('personal/PersonalBlocks.jsx')
  assert.match(p, /Yo‘nalishingizni tanlang/)
  assert.match(p, /snap-x/)
  assert.match(p, /disabled=\{!pick \|\| saving\}/)
  assert.match(p, /profileStore\.update\(\{ role: pick \}\)/)
  assert.match(p, /dismiss\(me\.uid\)/)
  assert.match(p, /Keyinroq/)
})
