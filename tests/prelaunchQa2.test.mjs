import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
// reconcile.js kengaytmasiz import qiladi (Vite) — isPast ni manbadan ajratib olamiz
const src = readFileSync(new URL('../src/organizer/reconcile.js', import.meta.url), 'utf8')
const body = src.slice(src.indexOf('export function isPast'), src.indexOf('\n}\n', src.indexOf('export function isPast')) + 2)
const isPast = new Function(`${body.replace('export ', '').replace('= tashkentToday()', '')}; return isPast`)()

test('isPast: o‘tgan seminar, xato tugash sanasi (12-fev → 12-dek) ham yakunlangan', () => {
  assert.equal(isPast({ start: '2026-02-12', end: '2026-12-12' }, '2026-11-02'), true)
  assert.equal(isPast({ start: '2026-11-24', end: '2026-11-24' }, '2026-11-02'), false)
  assert.equal(isPast({ start: '2026-10-30', end: '2026-11-05' }, '2026-11-02'), false)
})

test('0045: admin_content_list COALESCE timestamptz/integer xatosi tuzatilgan, tasdiqlash hisoblari profiles dan', () => {
  const sql = readFileSync(new URL('../supabase/migrations/0045_prelaunch_qa_privacy.sql', import.meta.url), 'utf8')
  const i = sql.lastIndexOf('function public.admin_content_list')
  assert.ok(i > 0)
  assert.doesNotMatch(sql.slice(i, sql.indexOf('$$;', i)), /coalesce\(c\.updated_at,\s*c\.sort_at\)/i)
  assert.match(sql, /function public\.admin_pending_counts/)
})

test('foydalanuvchiga migratsiya matni ko‘rsatilmaydi (sotuvchi kabineti)', () => {
  for (const f of ['src/seller/pages/Sozlamalar.jsx', 'src/seller/components/sozlamalar/Rekvizitlar.jsx', 'src/seller/components/mahsulotlar/ProductForm.jsx']) {
    assert.doesNotMatch(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), /\d{4} migratsiya/)
  }
})
