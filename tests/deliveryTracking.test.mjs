import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { trackingUrlOk, deliveryErrors, hasErrors, safeTrackingUrl, telHref, deliveryFromOrder, needsDeliveryForm, serviceLabel, URL_MSG } from '../src/lib/deliveryTracking.js'

const ok = [
  ['yandex', 'https://go.yandex/route/abc'], ['yandex', 'https://dostavka.yandex.uz/route?id=1'], ['yandex', 'https://taxi.yandex.ru/x'],
  ['yandex', 'https://ya.cc/t/abc'], ['yandex', 'https://yandex.com/maps'], ['yandex', 'HTTPS://GO.YANDEX/abc'], ['yandex', 'https://delivery.yandex.com/t/1'],
  ['boshqa', 'https://track.example.uz/123'], ['ozim', 'https://t.me/shop'],
]
const bad = [
  ['yandex', 'https://evil.com/?yandex.uz'], ['yandex', 'https://yandex.uz.evil.com/'], ['yandex', 'https://go.yandex@evil.com/'], ['yandex', 'http://go.yandex/x'],
  ['yandex', 'javascript:alert(1)'], ['boshqa', 'javascript:alert(1)'], ['boshqa', 'data:text/html,x'], ['yandex', 'https://fakeyandex.uz/'],
  ['boshqa', 'https://1.2.3.4/x'], ['boshqa', 'https://a.uz/ x'], ['boshqa', 'javascript://a.uz/%0aalert(1)'], ['boshqa', 'https://localhost/x'], ['boshqa', 'https://a.uz/"><script>'],
]

test('kuzatuv linki: https + Yandex allow-list (server bilan bir xil holatlar)', () => {
  for (const [s, u] of ok) assert.equal(trackingUrlOk(s, u), true, `${s} ${u}`)
  for (const [s, u] of bad) assert.equal(trackingUrlOk(s, u), false, `${s} ${u}`)
})

test('forma xatolari: majburiy link, o‘zim yetkazaman — ixtiyoriy, telefon', () => {
  assert.equal(deliveryErrors({ service: 'yandex', url: '' }).url, URL_MSG.required)
  assert.equal(deliveryErrors({ service: 'boshqa', url: '' }).url, URL_MSG.required)
  assert.equal(deliveryErrors({ service: 'ozim', url: '' }).url, '')
  assert.equal(deliveryErrors({ service: 'yandex', url: 'https://evil.com/x' }).url, URL_MSG.yandex)
  assert.equal(deliveryErrors({ service: 'yandex', url: 'go.yandex/x' }).url, URL_MSG.https)
  assert.equal(deliveryErrors({ service: 'boshqa', url: 'javascript:alert(1)' }).url, URL_MSG.https)
  assert.equal(deliveryErrors({ service: '', url: 'https://go.yandex/x' }).service, 'Yetkazib berish xizmatini tanlang')
  assert.equal(deliveryErrors({ service: 'yandex', url: 'https://go.yandex/x', phone: 'abc' }).phone, 'Kuryer telefoni noto‘g‘ri')
  assert.equal(hasErrors(deliveryErrors({ service: 'yandex', url: 'https://go.yandex/x', phone: '+998 90 123 45 67' })), false)
})

test('xaridor tomoni: xavfsiz havola, tel:, xizmat nomi', () => {
  assert.equal(safeTrackingUrl('javascript:alert(1)'), '')
  assert.equal(safeTrackingUrl('http://go.yandex/x'), '')
  assert.equal(safeTrackingUrl(' https://go.yandex/x '), 'https://go.yandex/x')
  assert.equal(telHref('+998 (90) 123-45-67'), 'tel:+998901234567')
  assert.equal(telHref('12'), '')
  assert.equal(serviceLabel('yandex'), 'Yandex Dostavka / Yandex Go')
  assert.deepEqual(deliveryFromOrder({ tracking_url: 'https://go.yandex/x' }).service, 'yandex', 'eski buyurtma: link bor — Yandex')
  assert.equal(needsDeliveryForm({ delivery_method: 'olib_ketish' }), false)
  assert.equal(needsDeliveryForm({ delivery_method: 'kuryer' }), true)
})

test('0067 migratsiya: idempotent, tekshiruvlar va ruxsatlar', () => {
  const sql = fs.readFileSync(new URL('../supabase/migrations/0067_delivery_tracking.sql', import.meta.url), 'utf8')
  for (const c of ['delivery_service', 'courier_name', 'courier_phone', 'delivery_eta']) assert.match(sql, new RegExp(`add column if not exists ${c} text`))
  assert.match(sql, /create or replace function public\.delivery_tracking_url_ok/)
  assert.match(sql, /'\^https:\/\/'/)
  assert.match(sql, /position\('@' in v_auth\)/)
  assert.match(sql, /seller_id = auth\.uid\(\) or public\.is_admin\(\)/)
  assert.match(sql, /drop trigger if exists seller_orders_c_delivery_check/)
  assert.match(sql, /revoke all on function public\.seller_set_delivery\(uuid, text, text, text, text, text\) from public, anon/)
  assert.doesNotMatch(sql, /\bdelete from\b|\bdrop table\b|\btruncate\b/i)
  // yangi ustunlar 0042 guard ruxsat ro‘yxatiga qo‘shilmagan — faqat RPC orqali
  assert.doesNotMatch(sql, /function public\.seller_orders_money_guard/)
})
