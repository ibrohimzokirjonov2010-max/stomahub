import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('Lenta post rasmi ixcham: max 260/320, object-contain, ochiq fon, lightbox bor', () => {
  const src = read('src/components/mobile/MobileCommunity.jsx')
  assert.match(src, /export function PostImages/)
  assert.match(src, /max-h-\[260px\].*md:max-h-\[320px\]/)
  assert.match(src, /object-contain/)
  assert.match(src, /bg-\[#f4f7fa\]/)
  assert.doesNotMatch(src, /aspect-\[4\/3\] w-full/)
  assert.match(src, /export function Lightbox/)
  const desk = read('src/pages/Community.jsx')
  assert.match(desk, /<PostImages /)
  assert.match(desk, /<Lightbox /)
  const mob = read('src/components/mobile/MobileCommunity.jsx')
  assert.match(mob, /<PostImages /)
})
