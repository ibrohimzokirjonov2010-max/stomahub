import test from 'node:test'
import assert from 'node:assert/strict'
import { SECTION_POSTERS, PROMO_POSTERS, MARKET_CATEGORY_TEXT, sectionPoster, categoryPoster } from '../src/posters/sectionPosters.js'

const texts = () => [
  ...Object.values(SECTION_POSTERS).flatMap((p) => [p.full, p.empty].flatMap((x) => [x.title, x.text, x.cta])),
  ...Object.values(PROMO_POSTERS).flatMap((x) => [x.title, x.text, x.cta]),
  ...Object.values(MARKET_CATEGORY_TEXT),
]

test('poster copy: correct Uzbek apostrophes, no banned claims', () => {
  for (const t of texts()) {
    assert.ok(t && t.length <= 80, `too long/empty: ${t}`)
    assert.doesNotMatch(t, /[oOgG]['`ʻ’]/, `use o‘ / g‘ (U+2018): ${t}`)
    assert.doesNotMatch(t, /bepul|birinchi bo‘lib|muddatsiz/i, `banned: ${t}`)
  }
})

test('every catalog section has full + empty poster with an action', () => {
  for (const k of ['marketplace', 'forma', 'kitoblar', 'ortiqcha', 'jihozlar', 'seminarlar', 'talim', 'ustalar', 'ishlar', 'mutaxassislar', 'elonlar']) {
    const p = SECTION_POSTERS[k]
    assert.ok(p?.full?.action && p?.empty?.action, k)
  }
})

test('count badge only for real non-zero counts', () => {
  assert.equal(sectionPoster('marketplace', 19).badge, '19 ta mahsulot sotuvda')
  assert.equal(sectionPoster('marketplace', 19).title, 'Kerakli material, bir joyda')
  assert.equal(sectionPoster('ishlar', 0).badge, '')
  assert.equal(sectionPoster('ishlar', 0).title, 'Vakansiyangizni joylang')
  assert.equal(categoryPoster('Implantlar').title, 'Implantlar')
})

test('vacancies empty poster posts a vacancy; classifieds keep E’lon joylash', () => {
  const jobs = sectionPoster('ishlar', 0)
  assert.equal(jobs.cta, 'Vakansiya qo‘shish')
  assert.equal(jobs.action, 'post')
  assert.equal(sectionPoster('ishlar', 3).cta, 'Vakansiyalarni ko‘rish')
  assert.equal(sectionPoster('ishlar', 3).action, 'scroll')
  const ads = sectionPoster('elonlar', 0)
  assert.equal(ads.cta, 'E’lon joylash')
  assert.equal(ads.action, 'post')
  assert.equal(sectionPoster('ustalar', 0).action, '/elonlar?joylash=1')
})
