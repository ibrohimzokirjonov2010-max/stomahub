import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('mobil /tolovlar/yangi yagona PaymentForm ni ishlatadi, eski forma yo‘q', () => {
  const src = read('src/components/mobile/MobileTolovNew.jsx')
  assert.match(src, /import PaymentForm from '\.\.\/crm\/PaymentForm'/)
  assert.match(src, /import \{ savePatientPayment \} from '\.\.\/crm\/syncPatientRecords'/)
  assert.match(src, /<PaymentForm/)
  assert.match(src, /savePatientPayment\(/)
  assert.match(src, /params\.get\('patientId'\)/)
  assert.match(src, /params\.get\('planId'\)/)
  assert.match(src, /location\.state\?\.patientId/)
  assert.match(src, /location\.state\?\.planId/)
  assert.match(src, /navigate\('\/tolovlar', \{ replace: true/)
  assert.doesNotMatch(src, /addTolov/)
  assert.doesNotMatch(src, /function MethodIcon/)
  assert.doesNotMatch(src, /function PatientSheet/)
})

test('kechikkan to‘lov patientId va planId ni query orqali uzatadi', () => {
  const src = read('src/components/mobile/MobileTolovlar.jsx')
  assert.match(src, /\/tolovlar\/yangi\?patientId=\$\{encodeURIComponent/)
  assert.match(src, /planId=\$\{encodeURIComponent\(d\.plan\.id\)/)
})

test('muallif kabinetida kurs nomi 2 qatorga o‘raladi va title beriladi', () => {
  const ui = read('src/author/ui.jsx')
  assert.match(ui, /export function CourseTitle/)
  assert.match(ui, /title=\{text\}/)
  assert.match(ui, /line-clamp-2/)
  for (const file of [
    'src/author/pages/Courses.jsx',
    'src/author/pages/Dashboard.jsx',
    'src/author/pages/Students.jsx',
    'src/author/pages/Payments.jsx',
  ]) {
    const src = read(file)
    assert.match(src, /import \{[\s\S]*CourseTitle[\s\S]*\} from '\.\./, file)
    assert.match(src, /CourseTitle/, file)
    assert.doesNotMatch(src, /<p className="truncate text-\[[0-9.]+px\] text-\[#6B7F8D\]">\{r\.courseTitle\}<\/p>/, file)
  }
})

test('mobil kabinet: pastki menyu oqimda, FAB uchun pastki bo‘shliq bor', () => {
  const src = read('src/author/AuthorShell.jsx')
  assert.match(src, /'--author-tab-h': '64px'/)
  assert.match(src, /'--author-fab-out': '18px'/)
  assert.match(src, /mb-\[calc\(var\(--author-fab-out\)\+16px\)\]/)
  assert.match(src, /pb-\[max\(env\(safe-area-inset-bottom\),var\(--safe-bottom-sim,0px\)\)\]/)
  assert.match(src, /h-\[var\(--author-tab-h\)\]/)
  assert.match(src, /-translate-y-\[var\(--author-fab-out\)\]/)
  assert.doesNotMatch(src, /nav className="fixed inset-x-0 bottom-0/)
  assert.doesNotMatch(src, /header className=\{cx\('sticky top-0/)
})
