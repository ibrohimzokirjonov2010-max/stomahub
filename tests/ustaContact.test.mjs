import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  ustaTelegram, ustaPhone, phoneLabel, telegramChatUrl, buildUstaOrderMessage, buildUstaGreeting, dayLabelUz, listingUrl,
} from '../src/ustaContact.js'
import { normalizeTelegram } from '../src/elonValidate.js'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('telegram username normalizatsiyasi (@, t.me/, https://t.me/)', () => {
  for (const raw of ['@sardor_usta', 'sardor_usta', 't.me/sardor_usta', 'https://t.me/sardor_usta', 'https://telegram.me/sardor_usta/', 'www.t.me/@sardor_usta', ' t.me/sardor_usta?start=1 ']) {
    assert.equal(normalizeTelegram(raw), 'sardor_usta', raw)
    assert.equal(ustaTelegram({ telegram: raw }), 'sardor_usta', raw)
  }
  assert.equal(ustaTelegram({ telegram: 'ab' }), '')
  assert.equal(ustaTelegram({ telegram: 'bad name!' }), '')
  assert.equal(ustaTelegram({}), '')
})

test('telefon faqat to‘liq +998 raqam bo‘lsa', () => {
  assert.equal(ustaPhone({ phone: '+998 90 123 45 67' }), '+998901234567')
  assert.equal(ustaPhone({ phone: '90 123 45 67' }), '+998901234567')
  assert.equal(ustaPhone({ phone: '+998 90 12' }), '')
  assert.equal(ustaPhone({}), '')
  assert.equal(phoneLabel('+998901234567'), '+998 90 123 45 67')
})

test('t.me havola matni encodeURIComponent bilan', () => {
  const url = telegramChatUrl('@sardor_usta', 'Salom & 50%\nyangi qator')
  assert.equal(url, `https://t.me/sardor_usta?text=${encodeURIComponent('Salom & 50%\nyangi qator')}`)
  assert.equal(telegramChatUrl('', 'x'), null)
  assert.equal(telegramChatUrl('sardor_usta'), 'https://t.me/sardor_usta')
})

test('buyurtma matni barcha maydonlarni o‘z ichiga oladi', () => {
  const m = { id: 'u1', name: 'Usta' }
  const text = buildUstaOrderMessage({
    m, service: { name: 'Turbina ta’miri', price: 280000 }, model: 'NSK Pana-Max', problem: 'Shovqin qilyapti',
    date: new Date(2026, 10, 12), time: '14:00', address: 'Chilonzor 5', phone: '+998901234567', url: listingUrl('u1', 'https://x.uz'),
  })
  assert.match(text, /StomaHub orqali/)
  assert.match(text, /Xizmat: Turbina ta’miri — 280 000 so‘m/)
  assert.match(text, /Jihoz modeli: NSK Pana-Max/)
  assert.match(text, /Muammo: Shovqin qilyapti/)
  assert.match(text, /Qachon: 12-noyabr \(Payshanba\), 14:00/)
  assert.match(text, /Manzil: Chilonzor 5/)
  assert.match(text, /Telefon: \+998 90 123 45 67/)
  assert.match(text, /E’lon: https:\/\/x\.uz\/ustalar\/u1/)
  assert.equal(dayLabelUz(new Date(2026, 10, 15)), '15-noyabr (Yakshanba)')
  const t2 = buildUstaOrderMessage({ m, service: { name: 'Turbina', price: 280000, priceText: 'dan 280 000 so‘m' }, problem: 'x', date: new Date(2026, 10, 12), time: '', address: 'a', phone: '', url: 'u' })
  assert.match(t2, /Xizmat: Turbina — dan 280 000 so‘m/)
  assert.doesNotMatch(t2, /Jihoz modeli/)
  assert.match(buildUstaGreeting({ m, url: 'https://x.uz/ustalar/u1' }), /StomaHub orqali[\s\S]*ustalar\/u1/)
})

test('ustalarda soxta oqimlar yo‘q', () => {
  const order = read('src/components/usta/UstaOrder.jsx')
  assert.doesNotMatch(order, /yuborildi|qabul qilindi|taken/)
  assert.match(order, /Telegram ochildi — xabarni yuboring/)
  for (const f of ['src/components/mobile/MobileUsta.jsx', 'src/pages/Usta.jsx']) {
    const s = read(f)
    assert.doesNotMatch(s, /yuborildi|qabul qildi|ChatSheet|CallSheet|Onlayn|statusLabel/, f)
  }
  const sec = read('src/components/catalog/sections.jsx')
  assert.doesNotMatch(sec, /Hozir onlayn|m\.status === 'online'/)
  assert.doesNotMatch(read('src/ustalarData.js'), /bir necha daqiqada/)
  assert.doesNotMatch(read('src/pages/Ustalar.jsx'), /Hozir bo‘sh|statusLabel/)
})

test('namuna ustalarda aloqa o‘chiq', () => {
  const s = read('src/components/mobile/MobileUsta.jsx')
  assert.match(s, /const tg = demo \? '' : ustaTelegram\(m\)/)
  assert.match(s, /const tel = demo \? '' : ustaPhone\(m\)/)
  assert.match(s, /sheet\?\.order && !demo/)
  assert.match(read('src/pages/Usta.jsx'), /isDemoItem\(master\) \? <DemoNotice/)
})
