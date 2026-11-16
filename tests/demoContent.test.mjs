import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { DEMO_SECTIONS, demoRows } from '../scripts/demo-content/data.mjs'

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

test('Namuna UI olib tashlandi: demoContent/DemoNotice yo‘q, is_demo qatorlar ko‘rsatilmaydi', () => {
  assert.equal(existsSync(new URL('src/demoContent.js', root)), false)
  assert.equal(existsSync(new URL('src/components/DemoNotice.jsx', root)), false)
  const files = ['src/components/mobile/MobileFormaItem.jsx', 'src/components/mobile/MobileUsta.jsx', 'src/components/mobile/MobileElon.jsx',
    'src/components/mobile/MobileElonlar.jsx', 'src/components/mobile/MobileSurplusItem.jsx', 'src/pages/SurplusItem.jsx', 'src/pages/FormaItem.jsx',
    'src/pages/Usta.jsx', 'src/pages/Ustalar.jsx', 'src/pages/Elon.jsx', 'src/components/catalog/CatalogLayout.jsx', 'src/recordSync.js']
  for (const f of files) assert.doesNotMatch(read(f), /DemoNotice|DemoActionBar|DemoChip|isDemoItem|demoCard|withDemoFlag|'Namuna'|Namuna —|Namuna e’lon|Namuna mahsulot/, f)
  assert.match(read('src/recordSync.js'), /if \(r0\?\.is_demo\) return/)
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
  assert.doesNotMatch(page, /HubTopBar|MobileTabBar/)
})

test('MobileSurplusItem: hook’lar erta return’dan oldin (React #310)', () => {
  const src = read('src/components/mobile/MobileSurplusItem.jsx')
  const view = src.slice(src.indexOf('function SurplusView'))
  assert.ok(view.indexOf('useState(0)') < view.indexOf('if (!d) {'))
})
