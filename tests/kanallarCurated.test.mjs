import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeCatalogList, CURATED_SOURCE } from '../src/lib/mergeCatalogList.js'
import { channels } from '../src/channelsData.js'

test('bo‘sh catalog_items curated kanallarni o‘chirmaydi', () => {
  const list = [
    { id: 'ustom', source: CURATED_SOURCE, name: 'uStom' },
    { id: 'other', name: 'old seed' },
  ]
  const next = mergeCatalogList(list, [])
  assert.deepEqual(next, [{ id: 'ustom', source: CURATED_SOURCE, name: 'uStom' }])
})

test('DB qatori curated ro‘yxatga qo‘shiladi, id to‘qnashuvi curatedda qoladi', () => {
  const list = [{ id: 'ustom', source: CURATED_SOURCE, name: 'uStom JS' }]
  const next = mergeCatalogList(list, [
    { id: 'ustom', name: 'uStom DB' },
    { id: 'new-db', name: 'Yangi' },
  ])
  assert.deepEqual(next, [
    { id: 'ustom', source: CURATED_SOURCE, name: 'uStom JS' },
    { id: 'new-db', name: 'Yangi' },
  ])
})

test('curated bo‘lmasa avvalgidek faqat DB qatorlari qoladi', () => {
  const list = [{ id: 'seed', name: 'mock' }]
  assert.deepEqual(mergeCatalogList(list, []), [])
  assert.deepEqual(mergeCatalogList(list, [{ id: 'db', name: 'real' }]), [{ id: 'db', name: 'real' }])
})

test('channelsData dagi 28 ta kanal stomahub-curated', () => {
  assert.equal(channels.length, 28)
  assert.ok(channels.every((c) => c.source === CURATED_SOURCE && c.id && c.url))
})
