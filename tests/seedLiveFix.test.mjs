import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isTestProduct } from '../src/lib/testSeed.js'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
// reconcile.js Vite importlari bilan — isTestSeminar ni manbadan ajratib olamiz
const src = read('src/organizer/reconcile.js')
const from = src.indexOf('const TEST_TITLE')
const to = src.indexOf('\n}\n', src.indexOf('export function isTestSeminar')) + 2
const isTestSeminar = new Function(`${src.slice(from, to).replace('export ', '')}; return isTestSeminar`)()

test('isTestSeminar: UUID (sinov seed va oddiy) yashirilmaydi', () => {
  for (let n = 1; n <= 5; n++) assert.equal(isTestSeminar({ id: `7e57d000-0000-4000-e000-${String(n).padStart(12, '0')}`, title: 'Mikroskop ostida endodontiya' }), false)
  assert.equal(isTestSeminar({ id: '0b5c1e2a-1111-4222-8333-123456789012', title: 'Implantologiya kursi' }), false)
  assert.equal(isTestSeminar({ id: '2-kunlik-intensiv-implantologiya-kur-okpe', title: '2 KUNLIK INTENSIV IMPLANTOLOGIYA KURSI' }), false)
})

test('isTestSeminar: avtomatik QA yozuvlari hamon yashiriladi', () => {
  assert.equal(isTestSeminar({ id: 'e2e-seminar-1731234567890', title: 'Seminar' }), true)
  assert.equal(isTestSeminar({ id: 'x', title: 'E2E: checkout' }), true)
  assert.equal(isTestSeminar({ id: 'x', title: '[test] seminar' }), true)
  assert.equal(isTestSeminar({ id: 'x', title: 'Seminar 1731234567890' }), true)
  assert.equal(isTestSeminar({ id: '0b5c1e2a-1111-4222-8333-123456789012', title: 'ok', is_test: true }), true)
})

test('useMarket: har yuklanishda yangi products nusxasi (Brendlar memo yangilanadi)', () => {
  const s = read('src/buyerApi.js')
  const body = s.slice(s.indexOf('export function useMarket'), s.indexOf('\n}\n', s.indexOf('export function useMarket')))
  assert.match(body, /useMemo\(\(\) => marketProducts\.slice\(\), \[s\]\)/)
  assert.doesNotMatch(body, /products: marketProducts\b/)
})

test('sinov mahsuloti: savat qatori ID si (forma-…) ham bloklanadi', () => {
  assert.equal(isTestProduct({ id: 'forma-7e57d000-0000-4000-b000-000000000011-navy-m' }), true)
  assert.equal(isTestProduct({ id: 'forma-0b5c1e2a-1111-4222-8333-123456789012-navy-m' }), false)
})

test('kartochkalar: sinov mahsulotida savat tugmasi o‘rniga «Sotuvda emas»', () => {
  for (const f of ['src/components/CardQtyStepper.jsx', 'src/components/market/ProductCard.jsx', 'src/components/mobile/MobileMarketplace.jsx', 'src/components/mobile/MobileHome.jsx', 'src/components/mobile/MobileSevimlilar.jsx']) {
    assert.match(read(f), /isTestProduct\(/, f)
    assert.match(read(f), /data-testid="card-not-for-sale"/, f)
  }
  const step = read('src/components/CardQtyStepper.jsx')
  assert.ok(step.indexOf('isTestProduct(product)') < step.indexOf('data-testid="card-qty-add"'), 'chip return add tugmasidan oldin')
})
