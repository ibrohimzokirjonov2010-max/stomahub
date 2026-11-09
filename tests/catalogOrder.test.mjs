import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('CatalogLayout: poster → kategoriya chipslari → Siz uchun (section.top)', () => {
  const src = readFileSync(new URL('../src/components/catalog/CatalogLayout.jsx', import.meta.url), 'utf8')
  const body = src.slice(src.indexOf('const body = ('))
  const hero = body.indexOf('<HeroSlider')
  const chips = body.indexOf('<CategoryChips')
  const top = body.indexOf('section.top &&')
  assert.ok(hero > 0 && chips > hero, 'CategoryChips poster (HeroSlider) dan keyin')
  assert.ok(top > chips, 'Siz uchun (section.top) chipslardan keyin')
})
