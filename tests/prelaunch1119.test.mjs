import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isTestProduct } from '../src/lib/testSeed.js'
import {
  STOMAHUB_MARKET_SELLER_ID,
  isHiddenMarketProductRow,
  isQaTestName,
} from '../src/testData.js'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

const MARKET = STOMAHUB_MARKET_SELLER_ID
const SEED_ID = '7e57d000-0000-4000-b000-000000000001'
const SEED_SELLER = '7e57d000-0000-4000-a000-000000000001'

test('loadMarketProducts seed/QA mahsulotlarni yashiradi, StomaHub Market ni saqlaydi', () => {
  assert.equal(isHiddenMarketProductRow({ id: SEED_ID, seller_id: SEED_SELLER, name: 'Kompozit A2' }), true)
  assert.equal(isHiddenMarketProductRow({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', seller_id: SEED_SELLER, name: 'Oddiy nom' }), true)
  assert.equal(isHiddenMarketProductRow({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', seller_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', name: 'QA TEST kompozit' }), true)
  assert.equal(isQaTestName('QA TEST seminar'), true)
  assert.equal(isHiddenMarketProductRow({
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    seller_id: MARKET,
    name: 'StomaHub kompozit',
  }), false)
  // Rasmiy do‘kon mahsuloti QA nomli bo‘lsa ham yashirilmaydi
  assert.equal(isHiddenMarketProductRow({
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    seller_id: MARKET,
    name: 'QA TEST something',
  }), false)
  assert.equal(isTestProduct({ id: SEED_ID }), true)
  const buyer = read('src/buyerApi.js')
  assert.match(buyer, /isHiddenMarketProductRow/)
  assert.doesNotMatch(buyer, /isTestProductRow/)
})

test('Landing: ilova belgisi Tez orada, forma havolasi, matn, to‘lov logotiplari', () => {
  const src = read('src/pages/Landing.jsx')
  assert.match(src, /Hamkasblar bilan oson o‘rtoqlashish/)
  assert.doesNotMatch(src, /O‘rtoqlashish oson uchun mos/)
  assert.match(src, /\['Tibbiy forma', '\/forma'\]/)
  assert.equal((src.match(/\['Tibbiy forma', '\/forma'\]/g) || []).length, 2, 'NAV va footer')
  assert.doesNotMatch(src, /apps\.apple\.com/)
  assert.doesNotMatch(src, /play\.google\.com/)
  assert.match(src, /Tez orada/)
  assert.match(src, /function StoreBadge/)
  assert.match(src, /function FooterPayments/)
  assert.match(src, /usePaymentConfig/)
  assert.match(src, /cfg\?\.click\?\.configured/)
  assert.match(src, /cfg\?\.payme\?\.configured/)
})


test('MobileKuzatish operator raqami CONTACT_PHONE', () => {
  const src = read('src/components/mobile/MobileKuzatish.jsx')
  assert.match(src, /CONTACT_PHONE/)
  assert.match(src, /CONTACT_PHONE_TEL/)
  assert.doesNotMatch(src, /\+998 71 200 00 00/)
  assert.doesNotMatch(src, /\+998712000000/)
})

test('useMyCourses mehmon uchun my_courses ni chaqirmaydi', () => {
  const src = read('src/courseApi.js')
  assert.match(src, /useSession/)
  assert.match(src, /session\.status !== 'authed'/)
  assert.match(src, /my_courses|myCourses/)
})

test('ro‘yxatdan o‘tishda Sotuvchi bo‘lish kartasi /sotuvchi-bolish ga olib boradi', () => {
  const src = read('src/pages/Auth.jsx')
  assert.match(src, /seller: 'Sotuvchi bo‘lish'/)
  assert.match(src, /to="\/sotuvchi-bolish"/)
  assert.match(src, /\{t\.seller\}/)
  assert.doesNotMatch(src, /Sotuvchi sifatida ariza bering/)
})

test('footer Instagram havolasi bor, Telegram yashirin, t.me/stomahub yo‘q', () => {
  const contact = read('src/config/contact.js')
  assert.match(contact, /Instagram:\s*'https:\/\/www\.instagram\.com\/stomahub'/)
  assert.match(contact, /Telegram:\s*''/)
  assert.doesNotMatch(contact, /t\.me\/stomahub/)
  for (const file of [
    'src/pages/Landing.jsx',
    'src/pages/Yangiliklar.jsx',
    'src/pages/Seminar.jsx',
    'src/components/mobile/MobileKuzatish.jsx',
    'src/components/mobile/MobileProfil.jsx',
    'src/config/contact.js',
  ]) {
    assert.doesNotMatch(read(file), /t\.me\/stomahub/, file)
  }
  const landing = read('src/pages/Landing.jsx')
  assert.match(landing, /SOCIAL_LINKS\.Instagram/)
})

test('ommaviy (mehmon) matnlarda 12% komissiya yo‘q', () => {
  const publicFiles = [
    'src/organizer/data.js',
    'src/pages/Landing.jsx',
    'src/pages/Auth.jsx',
    'src/pages/Legal.jsx',
    'src/pages/Seminar.jsx',
    'src/pages/Yangiliklar.jsx',
    'src/apply/SellerRegister.jsx',
  ]
  for (const file of publicFiles) {
    const src = read(file)
    // CSS kengligi (w-[12%]) va object-position emas, matndagi komissiya foizi
    const hits = [...src.matchAll(/12%/g)].filter((m) => {
      const around = src.slice(Math.max(0, m.index - 40), m.index + 40)
      return /komissiya|commission|foiz/i.test(around)
    })
    assert.equal(hits.length, 0, file)
  }
  assert.match(read('src/organizer/data.js'), /Platforma komissiyasi shartnoma asosida belgilanadi/)
  // Ichki kabinet / hisob-kitob o‘zgarmagan
  assert.match(read('src/seller/lib/metrics.js'), /COMMISSION_RATE\s*=\s*0\.12/)
  assert.match(read('src/seller/pages/Hamyon.jsx'), /12%/)
  assert.match(read('src/admin/pages/Escrow.jsx'), /Komissiya \(12%\)/)
})
