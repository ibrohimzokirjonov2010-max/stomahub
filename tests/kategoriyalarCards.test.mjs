import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const page = readFileSync(new URL('../src/pages/Kategoriyalar.jsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

test('desktop category cards use a full-bleed 16:9 cover frame', () => {
  assert.match(page, /aspect-\[16\/9\]/)
  assert.match(page, /object-cover/)
  assert.match(page, /rounded-t-2xl/)
  assert.match(page, /group-hover:scale-\[1\.045\]/)
  assert.doesNotMatch(page, /object-contain/)
  assert.doesNotMatch(page, /h-\[148px\]/)
  assert.match(page, /\{c\.name\}/)
  assert.match(page, /\{c\.about\}/)
  assert.match(page, /ta mahsulot/)
  assert.match(page, /ChevronRight/)
})

test('category grid stays three columns on desktop and two on a narrower desktop pane', () => {
  assert.match(css, /\.kat-grid \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(css, /@media \(min-width: 900px\) \{\s*\.kat-grid \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\); \}/)
})
