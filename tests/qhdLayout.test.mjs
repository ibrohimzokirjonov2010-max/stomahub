import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('mutaxassis: kompyuterda alohida 2 ustunli sahifa, mobil o‘zgarmagan', () => {
  const app = read('src/App.jsx')
  assert.match(app, /path="\/mutaxassislar\/:id" element=\{<Responsive mobile=\{<MobileMutaxassis \/>\}>.*<DesktopMutaxassis \/>/)
  assert.doesNotMatch(app, /max-w-\[560px\][^\n]*<MobileMutaxassis/)
  const src = read('src/components/mobile/MobileMutaxassis.jsx')
  assert.match(src, /export function DesktopMutaxassis/)
  assert.match(src, /data-testid="doctor-desktop"/)
})

test('katalog to‘ri: rasm kvadrat eniga to‘liq, 2 / 3–4 / 5–6 ustun', () => {
  const s = read('src/components/catalog/CatalogLayout.jsx')
  assert.equal((s.match(/className="catalog-card-grid"/g) || []).length, 2)
  assert.match(s, /data-testid="catalog-card-img" className=\{`relative aspect-square w-full overflow-hidden/)
  assert.match(s, /object-contain p-1\.5/)
  assert.doesNotMatch(s, /h-\[180px\] min-\[1900px\]:h-\[160px\]/)
  assert.doesNotMatch(s, /grid-cols-7/)
  const css = read('src/index.css')
  assert.match(css, /\.catalog-card-grid/)
  assert.match(css, /min-width: 1280px[\s\S]*repeat\(4/)
  assert.match(css, /min-width: 1600px[\s\S]*repeat\(5/)
  assert.match(css, /min-width: 2200px[\s\S]*repeat\(6/)
  const sec = read('src/components/catalog/sections.jsx')
  assert.match(sec, /href: `\/forma\/\$\{p\.id\}`, image: p\.image, fit: 'contain'/)
  assert.match(sec, /href: `\/jihozlar\/\$\{p\.id\}`, image: p\.image, fit: 'contain'/)
  assert.match(read('src/pages/Education.jsx'), /min-\[1600px\]:grid-cols-5 min-\[2200px\]:grid-cols-6/)
  assert.match(read('src/pages/Education.jsx'), /aspect-\[16\/9\]/)
})

test('yangiliklar: 16:9 rasm va katalog versiyasi memo bog‘liqligida', () => {
  const s = read('src/pages/Yangiliklar.jsx')
  assert.match(s, /data-testid="news-card-img" className="relative aspect-\[16\/9\]/)
  assert.match(s, /data-testid="news-featured-img"[^>]*aspect-\[16\/9\]/)
  assert.match(s, /\[cat, query, hot, catalogVer\]/)
  assert.doesNotMatch(s, /h-\[126px\]/)
})

test('vakansiya: fakt bloklari cheklangan enli to‘rda', () => {
  assert.match(read('src/components/vakansiya/JobDetail.jsx'), /max-w-\[900px\] grid-cols-2 gap-2 xl:grid-cols-3/)
})
