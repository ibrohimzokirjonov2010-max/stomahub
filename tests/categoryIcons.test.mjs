import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CATEGORY_ICON_MAP, LUCIDE_IDS, GLYPHS, FALLBACK_ICON, categoryIconId } from '../src/icons/categoryIconMap.js'
import { ART, CUSTOM_IDS } from '../src/icons/categoryIconArt.js'
import { MARKET_CATEGORIES, CATEGORY_ALIASES, normCategory } from '../src/config/productCatalog.js'
import { cats as ustaCats } from '../src/ustalarData.js'
import { specs as jobSpecs } from '../src/ishlarData.js'
import { SPECS } from '../src/mutaxassislarData.js'
import { AD_CATS } from '../src/elonlarData.js'

// Ba’zi data fayllar Node da import qilinmaydi (kengaytmasiz importlar) — kalitlarni manbadan o‘qiymiz.
const keysFrom = (file, name) => {
  const src = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8')
  const body = src.match(new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\n\\]`))[1]
  return [...body.matchAll(/(?:\['|key: ')([a-z]+)'/g)].map((m) => m[1]).filter((k) => k !== 'all')
}
const pairs = (arr) => arr.map((x) => (Array.isArray(x) ? x[0] : x.key)).filter((k) => k !== 'all')

const SECTIONS = {
  marketplace: [...MARKET_CATEGORIES, ...Object.keys(CATEGORY_ALIASES).map(normCategory)],
  forma: keysFrom('formaData.js', 'cats'),
  kitoblar: keysFrom('booksData.js', 'cats'),
  talim: keysFrom('educationData.js', 'directions'),
  seminarlar: keysFrom('seminarsData.js', 'seminarChips'),
  ortiqcha: keysFrom('surplusData.js', 'surplusChips'),
  ustalar: pairs(ustaCats),
  jihozlar: keysFrom('jihozData.js', 'catList'),
  ishlar: pairs(jobSpecs),
  mutaxassislar: pairs(SPECS),
  elonlar: pairs(AD_CATS),
}

test('every known category has an explicit icon mapping', () => {
  for (const [sec, keys] of Object.entries(SECTIONS)) {
    assert.ok(keys.length > 0, `${sec}: no categories parsed`)
    for (const k of keys) assert.ok(CATEGORY_ICON_MAP[sec]?.[k], `${sec}/${k} has no explicit icon`)
  }
})

test('every mapped icon id exists in the set', () => {
  const known = new Set([...CUSTOM_IDS, ...Object.keys(LUCIDE_IDS), ...Object.keys(GLYPHS)])
  for (const [sec, m] of Object.entries(CATEGORY_ICON_MAP)) for (const [k, id] of Object.entries(m)) assert.ok(known.has(id), `${sec}/${k} → unknown icon ${id}`)
  assert.ok(known.has(FALLBACK_ICON))
})

test('icons inside one section are distinct (no two chips look the same)', () => {
  for (const [sec, keys] of Object.entries(SECTIONS)) {
    const ids = [...new Set(keys)].map((k) => categoryIconId(sec, k, k))
    assert.equal(new Set(ids).size, ids.length, `${sec}: duplicate icons ${ids}`)
  }
})

test('unknown categories fall back by keyword, then to the tooth', () => {
  assert.equal(categoryIconId('marketplace', 'Implant komponentlari', 'Implant komponentlari'), 'implant')
  assert.equal(categoryIconId('marketplace', 'Endo motorlar'), 'endoFile')
  assert.equal(categoryIconId('marketplace', 'Ishlatilgan buyumlar'), FALLBACK_ICON)
  assert.equal(categoryIconId('nope', 'xyz', 'Qwerty'), FALLBACK_ICON)
})

test('custom art: single style (no hard-coded colours, no own stroke widths except scaled teeth)', () => {
  for (const [id, svg] of Object.entries(ART)) {
    assert.doesNotMatch(svg, /#[0-9a-f]{3,6}|rgb\(/i, `${id}: hard-coded colour`)
    assert.doesNotMatch(svg, /fill="(?!currentColor|none)/, `${id}: non-currentColor fill`)
    for (const m of svg.matchAll(/stroke-width="([\d.]+)"/g)) {
      const scaled = /scale\(/.test(svg)
      assert.ok(Number(m[1]) <= 1 || scaled, `${id}: custom stroke-width ${m[1]}`)
    }
  }
})

test('approved glyph sprite: every glyph exists, uses currentColor (no hard-coded fill)', () => {
  const sprite = readFileSync(new URL('../public/icons/category-sprite.svg', import.meta.url), 'utf8')
  const ids = new Set([...sprite.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]))
  for (const [id, g] of Object.entries(GLYPHS)) assert.ok(ids.has(g), `${id} → missing glyph ${g}`)
  assert.doesNotMatch(sprite, /fill=|#0F7C80/i)
})

test('every chip that has an approved glyph uses it', () => {
  for (const [sec, keys] of Object.entries(SECTIONS)) for (const k of keys) {
    const id = categoryIconId(sec, k, k)
    if (id !== 'tooth') assert.ok(GLYPHS[id], `${sec}/${k} → ${id} has no glyph`)
  }
})
