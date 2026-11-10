import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('detail hero is a square, near edge-to-edge, object-contain frame', () => {
  const hero = read('src/components/DetailHero.jsx')
  assert.match(hero, /aspect-square w-full/)
  assert.match(hero, /object-contain p-1/)
  assert.match(hero, /safe-overlay-top/)
  assert.match(hero, /Rasmni kattalashtirish/)
  assert.match(hero, /Lightbox/)
  assert.doesNotMatch(hero, /h-\[260px\]|h-\[330px\]|h-\[262px\]|px-4 pb-3|object-cover/)
})

test('mobile product, forma and surplus details share the square hero', () => {
  const files = {
    'src/components/mobile/MobileProduct.jsx': 'product-hero',
    'src/components/mobile/MobileFormaItem.jsx': 'forma-hero',
    'src/components/mobile/MobileSurplusItem.jsx': 'surplus-hero',
  }
  for (const [file, id] of Object.entries(files)) {
    const src = read(file)
    assert.match(src, /DetailHero/, file)
    assert.match(src, new RegExp(`testId="${id}"`), file)
    assert.doesNotMatch(src, /h-\[260px\]|h-\[330px\]|h-\[262px\]|px-4 pb-3|px-3 pb-3/, file)
  }
})

test('desktop product, forma and surplus galleries are square and not cropped', () => {
  const product = read('src/pages/Product.jsx')
  assert.match(product, /aspect-square overflow-hidden rounded-xl bg-\[#eef3f8\]/)
  assert.match(product, /object-contain p-1/)
  assert.doesNotMatch(product, /aspect-\[380\/244\]|object-contain p-4/)

  const forma = read('src/pages/FormaItem.jsx')
  assert.match(forma, /aspect-square overflow-hidden rounded-2xl/)
  assert.match(forma, /object-contain p-1/)
  assert.match(forma, /Lightbox/)
  assert.doesNotMatch(forma, /height: 360|minmax\(200px, 320px\)/)

  const surplus = read('src/pages/SurplusItem.jsx')
  assert.match(surplus, /aspect-square overflow-hidden rounded-xl bg-\[#eef3f8\]/)
  assert.match(surplus, /alt=\{d\.name\} className="size-full object-contain p-1"/)
  assert.match(surplus, /Lightbox/)
  assert.doesNotMatch(surplus, /aspect-\[410\/274\]/)
})

test('listing cards keep their own image frames', () => {
  assert.match(read('src/components/market/ProductCard.jsx'), /h-\[66px\] overflow-hidden/)
  assert.match(read('src/components/mobile/MobileMarketplace.jsx'), /h-\[118px\] overflow-hidden rounded-xl/)
  assert.match(read('src/components/mobile/MobileForma.jsx'), /h-\[150px\] bg-\[#eef3f6\]/)
  assert.match(read('src/components/mobile/MobileSurplus.jsx'), /h-\[112px\] overflow-hidden rounded-xl/)
  assert.match(read('src/pages/Surplus.jsx'), /max-h-\[78px\] max-w-full object-contain/)
})
