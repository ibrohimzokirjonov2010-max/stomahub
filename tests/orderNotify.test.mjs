import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  ORDER_STATUS_LABEL, orderStatusTitle, orderStatusLink, statusOfTitle, countUnread, badgeText,
  mergeNotification, freshUnread, markLocalRead, timeAgo, isUnread,
  groupByDay, daysAgo, dayKey, uzDate, splitTitle, clock,
} from '../src/lib/notifyModel.js'

const SQL = readFileSync(new URL('../supabase/migrations/0062_order_status_notify.sql', import.meta.url), 'utf8')

test('status labels cover every seller step and match the migration', () => {
  assert.deepEqual(Object.keys(ORDER_STATUS_LABEL).sort(), ['bekor_qilindi', 'tasdiqlandi', 'tayyorlanmoqda', 'yetkazildi', 'yetkazilmoqda'])
  for (const [status, label] of Object.entries(ORDER_STATUS_LABEL)) {
    assert.match(SQL, new RegExp(`when '${status}' then '${label}'`), `${status} → ${label} SQL da ham bo‘lsin`)
  }
})

test('order title and link', () => {
  assert.equal(orderStatusTitle('STH-00028', 'yetkazilmoqda'), 'Buyurtma #STH-00028: Yo‘lda')
  assert.equal(orderStatusTitle('#STH-00028', 'tasdiqlandi'), 'Buyurtma #STH-00028: Qabul qilindi')
  assert.equal(orderStatusTitle('STH-1', 'yangi'), '')
  assert.equal(orderStatusLink('STH-00028'), '/buyurtma/kuzatish/STH-00028')
})

test('status is recovered from the title (new and legacy texts)', () => {
  assert.equal(statusOfTitle('Buyurtma #STH-00028: Yo‘lda'), 'yetkazilmoqda')
  assert.equal(statusOfTitle('Buyurtma #STH-00028: Bekor qilindi'), 'bekor_qilindi')
  assert.equal(statusOfTitle('Buyurtma #STH-00028: Qabul qilindi'), 'tasdiqlandi')
  assert.equal(statusOfTitle('Buyurtma #STH-00028: Yetkazildi'), 'yetkazildi')
  assert.equal(statusOfTitle('Buyurtma #STH-00028: Tayyorlanmoqda'), 'tayyorlanmoqda')
  assert.equal(statusOfTitle('Savolingizga javob berildi'), '')
})

test('unread count respects read_at and locally-read ids', () => {
  const items = [{ id: 'a' }, { id: 'b', read_at: '2026-11-10T00:00:00Z' }, { id: 'c' }]
  assert.equal(countUnread(items), 2)
  assert.equal(countUnread(items, ['c']), 1)
  assert.equal(isUnread(null), false)
  assert.equal(badgeText(3), '3')
  assert.equal(badgeText(12), '12')
  assert.equal(badgeText(99), '99')
  assert.equal(badgeText(100), '99+')
  assert.equal(badgeText(0), '0')
})

test('merge keeps newest first, dedupes and caps', () => {
  const items = [{ id: 'a', created_at: '2026-11-10T10:00:00Z' }, { id: 'b', created_at: '2026-11-10T09:00:00Z' }]
  const next = mergeNotification(items, { id: 'c', created_at: '2026-11-10T11:00:00Z' })
  assert.deepEqual(next.map((n) => n.id), ['c', 'a', 'b'])
  assert.deepEqual(mergeNotification(next, { id: 'a', created_at: '2026-11-10T10:00:00Z' }).map((n) => n.id), ['c', 'a', 'b'])
  assert.equal(mergeNotification(next, { id: 'd', created_at: '2026-11-10T12:00:00Z' }, 2).length, 2)
  assert.equal(mergeNotification(items, null), items)
})

test('fresh unread after a refetch (focus) only returns new unread rows', () => {
  const prev = [{ id: 'a' }]
  const next = [{ id: 'b' }, { id: 'c', read_at: 'x' }, { id: 'a' }]
  assert.deepEqual(freshUnread(prev, next).map((n) => n.id), ['b'])
})

test('markLocalRead only touches given unread ids', () => {
  const out = markLocalRead([{ id: 'a' }, { id: 'b' }, { id: 'c', read_at: 'old' }], ['a', 'c'], 'now')
  assert.deepEqual(out.map((n) => n.read_at), ['now', undefined, 'old'])
})

test('timeAgo in Uzbek', () => {
  const now = Date.parse('2026-11-10T12:00:00Z')
  assert.equal(timeAgo('2026-11-10T11:59:30Z', now), 'hozirgina')
  assert.equal(timeAgo('2026-11-10T11:55:00Z', now), '5 daqiqa oldin')
  assert.equal(timeAgo('2026-11-10T09:00:00Z', now), '3 soat oldin')
  assert.equal(timeAgo('2026-11-09T10:00:00Z', now), 'kecha, 15:00') // Toshkent vaqti
  assert.equal(timeAgo('2026-11-07T10:00:00Z', now), '3 kun oldin')
  assert.equal(timeAgo('bad', now), '')
})

test('migration is idempotent, secure and non-destructive', () => {
  assert.match(SQL, /create or replace function public\.seller_order_notify_buyer\(\)/)
  assert.match(SQL, /security definer set search_path = public/)
  assert.match(SQL, /drop trigger if exists seller_orders_notify_buyer on public\.seller_orders;/)
  assert.match(SQL, /after update of status on public\.seller_orders/)
  assert.match(SQL, /alter publication supabase_realtime add table public\.customer_notifications/)
  assert.match(SQL, /not exists \(select 1 from pg_publication_tables/)
  assert.match(SQL, /using \(user_id = auth\.uid\(\)\)/)
  assert.match(SQL, /'\/buyurtma\/kuzatish\/' \|\| v_code/)
  assert.match(SQL, /'Buyurtma #' \|\| v_code \|\| ': ' \|\| v_label/)
  // xaridor o‘zi bekor qilsa o‘ziga xabar yo‘q
  assert.match(SQL, /auth\.uid\(\) is not distinct from new\.buyer_id/)
  const code = SQL.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
  assert.doesNotMatch(code, /\bdelete\s+from\b|\btruncate\b|\bdrop\s+table\b/i)
  assert.doesNotMatch(code, /STH-00025/)
})

test('fake bells are gone: top bars use the real NotificationBell', () => {
  const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8')
  for (const p of ['components/mobile/parts.jsx', 'components/mobile/MobileKategoriyalar.jsx', 'components/mobile/MobileSeminars.jsx', 'components/mobile/MobileCart.jsx', 'components/mobile/MobileCheckout.jsx', 'components/Header.jsx']) {
    assert.match(read(p), /<NotificationBell\b/, p)
  }
  assert.doesNotMatch(read('components/mobile/MobileCart.jsx'), /<CountBadge>3<\/CountBadge>/)
  assert.match(read('App.jsx'), /<NotificationToaster \/>/)
  const store = read('notificationsStore.js')
  assert.match(store, /event: 'INSERT', schema: 'public', table: 'customer_notifications', filter: `user_id=eq\.\$\{uid\}`/)
  assert.match(store, /visibilitychange/)
})

test('days and dates follow the Tashkent calendar', () => {
  const now = Date.parse('2026-11-10T12:00:00Z') // 17:00 Toshkent
  assert.equal(dayKey('2026-11-09T19:30:00Z'), '2026-11-10') // 00:30 Toshkent — allaqachon bugun
  assert.equal(daysAgo('2026-11-09T19:30:00Z', now), 0)
  assert.equal(daysAgo('2026-11-09T18:59:00Z', now), 1)
  assert.equal(clock('2026-11-09T18:59:00Z'), '23:59')
  assert.equal(uzDate('2026-09-01T10:00:00Z', now), '1-sentabr')
  assert.equal(uzDate('2025-12-31T10:00:00Z', now), '31-dekabr, 2025')
  assert.equal(timeAgo('2026-10-20T10:00:00Z', now), '20-oktabr')
  assert.equal(timeAgo('2026-11-10T10:30:00Z', now), '1 soat oldin')
  // tun yarmidan keyin ham bugun: 00:30 Toshkent, 16.5 soat oldin
  assert.equal(timeAgo('2026-11-09T19:30:00Z', now), '16 soat oldin')
})

test('groupByDay → Bugun / Kecha / Avvalroq, newest first, empty groups dropped', () => {
  const now = Date.parse('2026-11-10T12:00:00Z')
  const items = [
    { id: 'old', created_at: '2026-11-01T08:00:00Z' },
    { id: 't2', created_at: '2026-11-10T05:00:00Z' },
    { id: 'y1', created_at: '2026-11-09T18:59:00Z' },
    { id: 't1', created_at: '2026-11-10T11:00:00Z' },
    { id: 'midnight', created_at: '2026-11-09T19:01:00Z' },
  ]
  const g = groupByDay(items, now)
  assert.deepEqual(g.map((x) => x.label), ['Bugun', 'Kecha', 'Avvalroq'])
  assert.deepEqual(g[0].items.map((n) => n.id), ['t1', 't2', 'midnight'])
  assert.deepEqual(g[1].items.map((n) => n.id), ['y1'])
  assert.deepEqual(g[2].items.map((n) => n.id), ['old'])
  assert.deepEqual(groupByDay([], now), [])
  assert.deepEqual(groupByDay([{ id: 'a', created_at: '2026-11-10T11:00:00Z' }], now).map((x) => x.key), ['bugun'])
})

test('splitTitle separates order head and status label', () => {
  assert.deepEqual(splitTitle('Buyurtma #STH-00028: Yo‘lda'), { head: 'Buyurtma #STH-00028', status: 'yetkazilmoqda', label: 'Yo‘lda' })
  assert.deepEqual(splitTitle('Buyurtma #STH-00024: Bekor qilindi'), { head: 'Buyurtma #STH-00024', status: 'bekor_qilindi', label: 'Bekor qilindi' })
  assert.deepEqual(splitTitle('Savolingizga javob berildi'), { head: 'Savolingizga javob berildi', status: '', label: '' })
  assert.equal(splitTitle('Diqqat: yangi aksiya').label, '')
  assert.equal(splitTitle(undefined).head, '')
})

test('redesigned UI keeps required Uzbek copy, a11y and reduced motion', () => {
  const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8')
  const bell = read('components/NotificationBell.jsx')
  assert.match(bell, /Hammasini o‘qilgan deb belgilash/)
  assert.match(bell, /Hozircha bildirishnoma yo‘q/)
  assert.match(bell, /aria-modal="true"/)
  assert.match(bell, /env\(safe-area-inset-bottom\)/)
  const toast = read('components/NotificationToaster.jsx')
  assert.match(toast, /const DURATION = 5000/)
  assert.match(toast, /safe-area-inset-top/)
  assert.match(toast, /aria-live="polite"/)
  assert.match(read('index.css'), /prefers-reduced-motion: reduce[\s\S]*notif-pulse/)
})
