import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { logoFileError, logoType, logoPath, isLogoPathOf, logoFileName, LOGO_MAX, LOGO_BUCKET, logoItems, missingLogos, withLogos } from '../src/lib/formaLogo.js'
import { marketToForma, pickVariant, formaCartLine } from '../src/lib/formaLive.js'

const UID = '3c8d1e22-7a4b-4c55-8e90-1f2a3b4c5d6e'

test('logo fayli: tur va hajm tekshiruvi', () => {
  assert.equal(logoFileError(null), 'Logo faylini yuklang')
  assert.equal(logoFileError({ name: 'a.png', type: 'image/png', size: 1000 }), '')
  assert.equal(logoFileError({ name: 'a.svg', type: '', size: 1000 }), '', 'type bo‘lmasa kengaytmadan')
  assert.equal(logoFileError({ name: 'a.webp', type: 'image/webp', size: 1000 }), '')
  assert.match(logoFileError({ name: 'a.pdf', type: 'application/pdf', size: 1000 }), /PNG, JPG, WEBP yoki SVG/)
  assert.match(logoFileError({ name: 'a.gif', type: 'image/gif', size: 1000 }), /PNG/)
  assert.match(logoFileError({ name: 'a.png', type: 'image/png', size: LOGO_MAX + 1 }), /5 MB/)
  assert.equal(logoFileError({ name: 'a.png', type: 'image/png', size: LOGO_MAX }), '')
  assert.match(logoFileError({ name: 'a.png', type: 'image/png', size: 0 }), /bo‘sh/)
  assert.equal(logoType({ name: 'LOGO.JPEG' }), 'image/jpeg')
})

test('logo yo‘li: faqat o‘z papkasi, server regex bilan bir xil', () => {
  const p = logoPath(UID, { name: 'x.svg', type: 'image/svg+xml' }, 'abc-123')
  assert.equal(p, `${UID}/abc-123.svg`)
  assert.ok(isLogoPathOf(UID, p))
  assert.ok(isLogoPathOf(UID, logoPath(UID, { name: 'x.png', type: 'image/png' })))
  assert.equal(isLogoPathOf('other', p), false)
  assert.equal(isLogoPathOf(UID, `${UID}/../x.png`), false)
  assert.equal(isLogoPathOf(UID, `${UID}/a/b.png`), false)
  assert.equal(isLogoPathOf(UID, `${UID}/a.exe`), false)
  assert.equal(logoFileName(p, 'STH-00031'), 'logo-STH-00031.svg')
  assert.equal(LOGO_BUCKET, 'forma-logos')
})

const row = {
  id: '9b2f6a10-4c3e-4f7a-9d21-6a1e0c5b7f01', sellerId: 's1', seller: 'MedStyle', name: 'Skrab', category: 'Tibbiy forma', price: 320000, stock: 5, image: '/a.jpg',
  variants: [{ size: 'M', color: 'navy', price: 320000, stock: 5, sku: 'V-M' }], forma: { cat: 'scrub', size_type: 'clothing', kashta_price: 25000 },
}

test('savat qatori: logo tikish narxga qo‘shiladi; fayl keyin (rasmiylashtirishda) ham yuklanadi', () => {
  const p = marketToForma(row)
  const v = pickVariant(p, 'M', 'navy')
  const plain = formaCartLine(p, v)
  const on = formaCartLine(p, v, '', true)
  assert.equal(on.logoOn, true)
  assert.equal(on.logo, undefined, 'fayl hali yuklanmagan')
  assert.equal(on.price, 345000)
  assert.notEqual(on.id, plain.id)
  assert.match(on.name, /logo bilan/)
  const withFile = formaCartLine(p, v, '', true, { path: `${UID}/a.png`, name: 'a.png', size: 100 })
  assert.equal(withFile.logo, `${UID}/a.png`)
  assert.equal(withFile.logoName, 'a.png')
  assert.equal(withFile.id, on.id, 'fayl qatorni ajratmaydi — rasmiylashtirishda almashtiriladi')
  const both = formaCartLine(p, v, 'Chap ko‘krak', true)
  assert.equal(both.price, 345000, 'logo + izoh — bitta xizmat narxi')
  assert.equal(both.kashta, 'Chap ko‘krak')
  assert.equal(formaCartLine(p, v, '', false, { path: `${UID}/a.png` }).logo, undefined, 'toggle o‘chiq — logo yo‘q')
  const none = formaCartLine({ ...p, kashtaPrice: 0 }, v, '', true, { path: `${UID}/a.png` })
  assert.equal(none.logoOn, undefined)
  assert.equal(none.price, 320000)
})

test('rasmiylashtirish: logo yuklanmagan qatorlar buyurtmani to‘xtatadi', () => {
  const items = [{ id: 'a', logoOn: true }, { id: 'b', logoOn: true, logo: `${UID}/b.png` }, { id: 'c' }]
  assert.deepEqual(logoItems(items).map((x) => x.id), ['a', 'b'])
  assert.deepEqual(missingLogos(items).map((x) => x.id), ['a'])
  assert.deepEqual(missingLogos(items, { a: { path: `${UID}/a.png` } }), [])
  assert.deepEqual(missingLogos(items, { a: { path: `${UID}/a.png` }, b: null }).map((x) => x.id), ['b'], 'o‘chirilgan logo')
  const out = withLogos(items, { a: { path: `${UID}/a.png` } })
  assert.equal(out[0].logo, `${UID}/a.png`)
  assert.equal(out[1].logo, `${UID}/b.png`)
  assert.equal(out[2].logo, undefined)
})

test('0066: bucket RLS va buyer_create_order logo tekshiruvi', () => {
  const sql = readFileSync(new URL('../supabase/migrations/0066_forma_logo.sql', import.meta.url), 'utf8')
  assert.match(sql, /'forma-logos', 'forma-logos', false, 5242880/)
  assert.match(sql, /image\/svg\+xml/)
  assert.match(sql, /on conflict \(id\) do update/)
  assert.match(sql, /add column if not exists logo_path/)
  assert.match(sql, /forma_logos_insert_own[\s\S]*\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/)
  assert.match(sql, /forma_logos_read[\s\S]*forma_logo_seller_can_read\(name\)/)
  assert.match(sql, /forma_logos_delete_own[\s\S]*not public\.forma_logo_in_use\(name\)/)
  assert.doesNotMatch(sql, /for update to authenticated/i, 'almashtirish (update) yo‘q')
  assert.match(sql, /v_logo !~ \('\^' \|\| v_uid::text/)
  assert.match(sql, /from storage\.objects where bucket_id = 'forma-logos' and name = v_logo/)
  assert.match(sql, /note, logo_path\)/)
  assert.match(sql, /'Logo tikish'/)
  assert.doesNotMatch(sql, /\bdelete\s+from\b|\btruncate\b|\bdrop\s+table\b/i)
  assert.doesNotMatch(sql, /STH-00025/)
})
