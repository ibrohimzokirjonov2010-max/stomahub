import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { DEMO_SECTIONS, demoRows } from '../scripts/demo-content/data.mjs'
import { demoCard, isDemoItem, withDemoFlag } from '../src/demoContent.js'

const root = new URL('..', import.meta.url)
const read = (p) => readFileSync(new URL(p, root), 'utf8')

test('namuna: har bo‘limda 6–8 ta yozuv', () => {
  for (const [kind, list] of Object.entries(DEMO_SECTIONS)) {
    assert.ok(list.length >= 6 && list.length <= 8, `${kind}: ${list.length}`)
  }
  assert.equal(demoRows().length, 29)
})

test('namuna: id lar demo- bilan, takrorlanmaydi, payload.isDemo = true', () => {
  const rows = demoRows()
  const keys = new Set(rows.map((r) => `${r.kind}:${r.id}`))
  assert.equal(keys.size, rows.length)
  rows.forEach((r) => {
    assert.match(r.id, /^demo-/)
    assert.equal(r.payload.isDemo, true)
    assert.equal(r.payload.id, r.id)
  })
})

test('namuna: hech qanday telefon, Telegram yoki tel:/t.me havola yo‘q', () => {
  const json = JSON.stringify(demoRows())
  assert.doesNotMatch(json, /"phone"|"telegram"|tel:|t\.me|\+998|\b9\d{8}\b/)
})

test('namuna: barcha rasmlar public/images/demo ichida mavjud (webp)', () => {
  const imgs = new Set()
  demoRows().forEach(({ payload: p }) => {
    ;[p.image, p.photo, ...(p.images || []), ...(p.gallery || []), ...(p.works || [])].filter(Boolean).forEach((x) => imgs.add(x))
  })
  assert.ok(imgs.size >= 25)
  imgs.forEach((src) => {
    assert.match(src, /^\/images\/demo\/(forma|ustalar|ortiqcha|elonlar)\/[a-z0-9]+\.webp$/)
    assert.ok(existsSync(new URL(`public${src}`, root)), src)
  })
})

test('migratsiya 0063 data.mjs bilan mos (generatsiya qilingan)', () => {
  const sql = read('supabase/migrations/0063_demo_content.sql')
  demoRows().forEach((r) => assert.ok(sql.includes(`('${r.kind}', '${r.id}', $demo$${JSON.stringify(r.payload)}$demo$::jsonb, ${r.sort_at})`), r.id))
  assert.match(sql, /add column if not exists is_demo boolean not null default false/)
  assert.match(sql, /disable trigger catalog_items_ad_guard/)
  assert.match(sql, /enable trigger catalog_items_ad_guard/)
  assert.match(sql, /disable trigger catalog_items_surplus_guard/)
  assert.match(sql, /enable trigger catalog_items_surplus_guard/)
  assert.match(sql, /where public\.catalog_items\.is_demo and public\.catalog_items\.owner_id is null/)
  assert.match(sql, /^begin;$/m)
  assert.match(sql, /^commit;$/m)
})

test('migratsiya 0063b faqat is_demo + egasiz qatorlarni o‘chiradi', () => {
  const sql = read('supabase/migrations/0063b_remove_demo_content.sql')
  const stmts = sql.split('\n').filter((l) => !l.startsWith('--')).join('\n')
  assert.match(stmts, /delete from public\.catalog_items\s+where is_demo = true\s+and owner_id is null/)
  assert.doesNotMatch(stmts, /drop|truncate|update/i)
  assert.equal((stmts.match(/delete/gi) || []).length, 1)
})

test('withDemoFlag: is_demo faqat egasiz qatorda ishonchli', () => {
  assert.equal(withDemoFlag({ kind: 'ad', id: 'x', is_demo: true, owner_id: null, payload: { id: 'x' } }).payload.isDemo, true)
  const owned = withDemoFlag({ kind: 'ad', id: 'y', is_demo: true, owner_id: 'u1', payload: { id: 'y', isDemo: true } })
  assert.equal(owned.payload.isDemo, undefined)
  const forged = withDemoFlag({ kind: 'ad', id: 'z', owner_id: 'u2', payload: { id: 'z', isDemo: true } })
  assert.equal(forged.payload.isDemo, undefined)
  const plain = { kind: 'ad', id: 'p', owner_id: 'u3', payload: { id: 'p' } }
  assert.equal(withDemoFlag(plain), plain)
})

test('demoCard: Namuna belgisi, savat va chegirma yo‘q', () => {
  const card = { id: 'a', badge: { text: '-20%', tone: 'sale' }, cart: { line: { id: 'a' } }, oldPrice: 500, rating: { value: 5, count: 3 } }
  const d = demoCard({ isDemo: true }, card)
  assert.deepEqual(d.badge, { text: 'Namuna', tone: 'demo' })
  assert.equal(d.cart, null)
  assert.equal(d.oldPrice, 0)
  assert.equal(d.rating, null)
  assert.equal(demoCard({}, card), card)
  assert.equal(isDemoItem({ isDemo: 'true' }), false)
})

test('detail sahifalar namunada aloqa/savat o‘rniga DemoActionBar ko‘rsatadi', () => {
  const files = {
    'src/components/mobile/MobileFormaItem.jsx': /demo \? \(\s*<DemoActionBar/,
    'src/components/mobile/MobileUsta.jsx': /demo \? \(\s*<div[^>]*><DemoActionBar/,
    'src/components/mobile/MobileElon.jsx': /\{!demo && !isOwner/,
    'src/components/mobile/MobileSurplusItem.jsx': /listing\?\.isDemo\) return <DemoActionBar/,
    'src/pages/SurplusItem.jsx': /d\.isDemo\) return/,
    'src/pages/FormaItem.jsx': /demo \? <><DemoNotice/,
    'src/pages/Usta.jsx': /isDemoItem\(master\) \? <DemoNotice/,
    'src/pages/Elon.jsx': /demo && <DemoNotice/,
  }
  for (const [f, re] of Object.entries(files)) assert.match(read(f), re, f)
  assert.match(read('src/recordSync.js'), /!row\.payload\?\.isDemo/)
  assert.match(read('src/components/catalog/CatalogLayout.jsx'), /demoCard\(it, section\.card\(it\)\)/)
})

test('adPriceShort: ish o‘rni oralig‘i ixcham', async () => {
  const { adPriceShort, adPrice } = await import('../src/elonlarData.js')
  assert.equal(adPriceShort({ deal: 'job', price: 8000000, priceMax: 15000000 }), '8 – 15 mln so‘m')
  assert.equal(adPriceShort({ deal: 'job', price: 3500000, priceMax: 5000000 }), '3,5 – 5 mln so‘m')
  const sale = { deal: 'sale', price: 48000000 }
  assert.equal(adPriceShort(sale), adPrice(sale))
})

test('elonlar desktop detail is full width and keeps the mobile screen', () => {
  const app = read('src/App.jsx')
  const route = app.slice(app.indexOf('path="/elonlar/:id"'), app.indexOf('path="/community"'))
  assert.match(route, /mobile=\{<MobileElon \/>\}/)
  assert.match(route, /<Elon \/>/)
  assert.doesNotMatch(route, /max-w-\[560px\]/)
  const page = read('src/pages/Elon.jsx')
  assert.match(page, /data-testid="elon-desktop"/)
  assert.match(page, /<DemoActionBar/)
  assert.doesNotMatch(page, /HubTopBar|MobileTabBar/)
})

test('MobileSurplusItem: hook’lar erta return’dan oldin (React #310)', () => {
  const src = read('src/components/mobile/MobileSurplusItem.jsx')
  const view = src.slice(src.indexOf('function SurplusView'))
  assert.ok(view.indexOf('useState(0)') < view.indexOf('if (!d) {'))
})
