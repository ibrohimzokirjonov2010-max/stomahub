import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { salaryShort, validateJob, toPayload, toForm, emptyForm, salaryText, telHref, tgHref, reqList, clean1, isPublicJob, jobError } from '../src/lib/vakansiya.js'

const ok = { ...emptyForm(), title: 'Stomatolog-terapevt', clinic: 'Smile Dent', city: 'toshkent', type: 'full', phone: '+998901234567' }

test('forma: majburiy maydonlar va aloqa', () => {
  assert.deepEqual(validateJob(ok), {})
  const e = validateJob(emptyForm())
  assert.ok(e.title && e.clinic && e.contact)
  assert.ok(validateJob({ ...ok, city: 'xyz' }).city)
  assert.ok(validateJob({ ...ok, type: 'freelance' }).type)
  // faqat Telegram — yetarli
  assert.deepEqual(validateJob({ ...ok, phone: '+998 ', telegram: '@smile_dent' }), {})
  assert.deepEqual(validateJob({ ...ok, phone: '', telegram: 'https://t.me/Smile_HR' }), {})
  assert.ok(validateJob({ ...ok, phone: '+998 ', telegram: '' }).contact)
  assert.ok(validateJob({ ...ok, phone: '+998 90 12' }).phone)
  for (const bad of ['ab', '1abcde', 'abc-def', 'a'.repeat(40), 'javascript:alert(1)']) assert.ok(validateJob({ ...ok, telegram: bad }).telegram, bad)
})

test('maosh: ixtiyoriy oraliq', () => {
  assert.deepEqual(validateJob({ ...ok, min: '8000000', max: '' }), {})
  assert.ok(validateJob({ ...ok, min: '9000000', max: '5000000' }).salary)
  assert.equal(salaryText(8e6, 15e6), '8 000 000 – 15 000 000 so‘m')
  assert.equal(salaryText(8e6, null), '8 000 000 so‘mdan')
  assert.equal(salaryText(null, 5e6), '5 000 000 so‘mgacha')
  assert.equal(salaryText(null, null), 'Kelishiladi')
  assert.equal(salaryShort(8e6, 15e6), '8–15 mln so‘m')
  assert.equal(salaryShort(3.5e6, null), '3,5 mln so‘mdan')
  assert.equal(salaryShort(800000, 1.2e6), '800 ming – 1,2 mln so‘m')
})

test('XSS: matn tozalanadi, havolalar faqat tel: va https://t.me', () => {
  assert.equal(clean1('<img src=x onerror=alert(1)>Terapevt', 80), 'img src=x onerror=alert(1) Terapevt')
  assert.deepEqual(reqList('- 2 yil tajriba\n\n• <b>Diplom</b>\n'), ['2 yil tajriba', 'b Diplom /b'])
  assert.equal(telHref('+998 90 123 45 67'), 'tel:+998901234567')
  assert.equal(telHref('javascript:alert(1)'), null)
  assert.equal(telHref('+1 202 555 0100'), null)
  assert.equal(tgHref('@Smile_Dent'), 'https://t.me/Smile_Dent')
  assert.equal(tgHref('javascript:alert(1)'), null)
  const p = toPayload({ ...ok, title: '<script>x</script>Ortoped', telegram: '@smile_dent', requirements: 'a\nb', min: '8 000 000' }, 'job-1')
  assert.equal(p.title, 'script x /script Ortoped')
  assert.equal(p.phone, '+998901234567'); assert.equal(p.telegram, 'smile_dent'); assert.equal(p.min, 8000000); assert.equal(p.max, null)
  assert.deepEqual(p.requirements, ['a', 'b']); assert.equal(p.status, 'active'); assert.equal(p.cityLabel, 'Toshkent')
  assert.ok(!('sourceUrl' in p) && !('image' in p))
  assert.equal(toForm(p).requirements, 'a\nb')
})

test('ommaviy ro‘yxat: faqat faol, yashirilmagan', () => {
  assert.equal(isPublicJob({ status: 'active' }), true)
  assert.equal(isPublicJob({ status: 'closed' }), false)
  assert.equal(isPublicJob({ status: 'active', _pending: true }), false)
  assert.equal(jobError({ message: 'job_phone: Telefon raqamini to‘liq kiriting' }), 'Telefon raqamini to‘liq kiriting')
})

const sql = fs.readFileSync(new URL('../supabase/migrations/0069_vakansiyalar.sql', import.meta.url), 'utf8')
test('0069: job_guard — egasi, payload qayta quriladi, aloqa va Telegram formati', () => {
  assert.match(sql, /if new\.kind <> 'job' then return new; end if;/)
  assert.match(sql, /new\.owner_id := auth\.uid\(\)/)
  assert.match(sql, /new\.owner_id := old\.owner_id/)
  assert.match(sql, /new\.hidden := old\.hidden/)
  assert.match(sql, /new\.payload := jsonb_build_object\(/)
  assert.match(sql, /\^\[A-Za-z\]\[A-Za-z0-9_\]\{4,31\}\$/)
  assert.match(sql, /\^998\[0-9\]\{9\}\$/)
  assert.match(sql, /job_contact:/)
  assert.doesNotMatch(sql, /\bdelete\s+from\b/i)
  assert.doesNotMatch(sql, /drop table/i)
})

test('soxta oqimlar olib tashlandi', () => {
  const src = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8')
  assert.ok(!fs.existsSync(new URL('../src/pages/Ishlar.jsx', import.meta.url)))
  assert.ok(!fs.existsSync(new URL('../src/components/mobile/MobileIshlar.jsx', import.meta.url)))
  for (const f of ['../src/pages/IshItem.jsx', '../src/components/mobile/MobileIsh.jsx', '../src/components/vakansiya/JobDetail.jsx', '../src/components/vakansiya/JobSheets.jsx']) {
    const s = src(f).replace(/^\/\/.*$/gm, '')
    for (const bad of ['Arizangiz yuborildi', 'setSent', 'ChatSheet', 'moderatorga yuborildi', 'DUTIES']) assert.ok(!s.includes(bad), `${f}: ${bad}`)
  }
  assert.match(src('../src/components/catalog/sections.jsx'), /Vakansiya qo‘shish/)
})

test('vakansiyalar sahifasi: bo‘sh matn, e’lon tugmasi yo‘q, /vakansiyalar → /ishlar', () => {
  const src = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8')
  const sections = src('../src/components/catalog/sections.jsx')
  const ish = sections.slice(sections.indexOf('export function useIshlarSection'), sections.indexOf('export function useSurplusSection'))
  const elon = sections.slice(sections.indexOf('export function useElonlarSection'))
  assert.match(ish, /emptyText: 'Hozircha vakansiyalar yo‘q'/)
  assert.match(ish, /label: 'Vakansiya qo‘shish'/)
  assert.doesNotMatch(ish, /E’lon joylash/)
  assert.match(elon, /label: 'E’lon joylash'/)
  assert.match(src('../src/components/catalog/CatalogLayout.jsx'), /Hozircha e’lonlar yo‘q/)
  assert.match(src('../src/App.jsx'), /path="\/vakansiyalar" element=\{<Navigate to="\/ishlar" replace/)
  const posters = src('../src/posters/sectionPosters.js')
  const ishPoster = posters.slice(posters.indexOf('ishlar:'), posters.indexOf('mutaxassislar:'))
  assert.doesNotMatch(ishPoster, /E’lon joylash/)
  assert.doesNotMatch(ishPoster, /\/elonlar/)
  assert.match(posters.slice(posters.indexOf('elonlar:')), /E’lon joylash/)
})
