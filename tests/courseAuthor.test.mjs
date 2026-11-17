import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { blankCourse, blankLesson, blankModule, checklist, corePayload, extrasPayload, flatLessons, fromServer, parseVideoRef } from '../src/author/wizard/model.js'

const root = path.resolve(import.meta.dirname, '..')
const sql = fs.readFileSync(path.join(root, 'supabase/migrations/0078_course_author_cabinet.sql'), 'utf8')

const has = (re, msg) => assert.ok(re.test(sql), msg || String(re))
const hasNot = (re, msg) => assert.ok(!re.test(sql), msg || String(re))
const within = (text) => (re) => assert.ok(re.test(text), String(re))

const lesson = (title, extra = {}) => ({ ...blankLesson(), title, ...extra })
const mods = () => [
  { ...blankModule(1), title: 'Asoslar', lessons: [lesson('Birinchi', { id: 'l1', bunnyVideoId: 'v1', encodingStatus: 'finished' }), lesson('Ikkinchi', { id: 'l2' })] },
  { ...blankModule(2), title: 'Amaliyot', lessons: [lesson('Uchinchi', { bunnyVideoId: 'v3', encodingStatus: 'failed' })] },
]

test('modullar tartibi moduleTitle bilan tekis ro‘yxatga aylanadi', () => {
  const flat = flatLessons(mods())
  assert.deepEqual(flat.map((l) => [l.title, l.moduleTitle]), [['Birinchi', 'Asoslar'], ['Ikkinchi', 'Asoslar'], ['Uchinchi', 'Amaliyot']])
})

test('fromServer darslarni moduleTitle bo‘yicha guruhlaydi va qo‘shimchalarni qo‘shadi', () => {
  const editor = { course: { id: 'c1', title: 'Kurs', price: 0, status: 'draft' }, lessons: [
    { id: 'a', title: 'A', moduleTitle: 'M1', questions: [] },
    { id: 'b', title: 'B', moduleTitle: 'M1', questions: [] },
    { id: 'c', title: 'C', moduleTitle: 'M2', questions: [] },
  ] }
  const extras = { course: {}, lessons: [{ id: 'b', takeaways: ['bir', 'ikki'], materials: [{ title: 'PDF', url: 'https://x.uz/a.pdf' }] }] }
  const state = fromServer(editor, extras)
  assert.deepEqual(state.modules.map((m) => [m.title, m.lessons.map((l) => l.id)]), [['M1', ['a', 'b']], ['M2', ['c']]])
  assert.deepEqual(state.modules[0].lessons[1].takeaways, ['bir', 'ikki'])
})

test('corePayload: bepul kurs narxi 0, bo‘sh variantlar tashlanadi, to‘g‘ri javob indeksi siljiydi', () => {
  const course = { ...blankCourse(), title: 'Kurs', paid: false, price: 500000 }
  const m = mods()
  m[0].lessons[0].questions = [{ prompt: ' Savol? ', options: ['', 'Ha', 'Yo‘q'], correctIndex: 2 }, { prompt: '  ', options: ['a', 'b'], correctIndex: 0 }]
  const body = corePayload(course, m, 'draft')
  assert.equal(body.price, 0)
  assert.equal(body.status, 'draft')
  assert.equal(body.lessons.length, 3)
  assert.deepEqual(body.lessons[0].questions, [{ prompt: 'Savol?', options: ['Ha', 'Yo‘q'], correctIndex: 1 }])
})

test('extrasPayload: chegirma faqat yoqilganda, muddat Toshkent kun oxiri, faqat https materiallar', () => {
  const course = { ...blankCourse(), paid: true, price: 400000, discountOn: true, discountPrice: '300000', discountUntil: '2026-11-30', learnPoints: [' a ', '', 'b'] }
  const m = mods()
  m[0].lessons[0].materials = [{ title: 'ok', url: 'https://x.uz/a.pdf' }, { title: 'yomon', url: 'http://x.uz/b.pdf' }, { title: 'js', url: 'javascript:alert(1)' }]
  const x = extrasPayload(course, m, ['n1', 'n2', 'n3'])
  assert.equal(x.discountPrice, 300000)
  assert.equal(x.discountUntil, '2026-11-30T23:59:59+05:00')
  assert.deepEqual(x.learnPoints, ['a', 'b'])
  assert.deepEqual(x.lessons.map((l) => l.id), ['n1', 'n2', 'n3'])
  assert.deepEqual(x.lessons[0].materials, [{ title: 'ok', url: 'https://x.uz/a.pdf' }])
  const off = extrasPayload({ ...course, discountOn: false }, m, [])
  assert.equal(off.discountPrice, null)
  assert.equal(off.discountUntil, null)
})

test('checklist: video majburiy, xato video hisoblanmaydi, chegirma narxdan kam bo‘lishi shart', () => {
  const course = { ...blankCourse(), title: 'Kurs nomi', paid: true, price: 100000, discountOn: true, discountPrice: 150000 }
  const items = Object.fromEntries(checklist(course, mods()).map((i) => [i.key, i]))
  assert.equal(items.title.ok, true)
  assert.equal(items.video.ok, false)
  assert.match(items.video.label, /1\/3/)
  assert.equal(items.video.required, true)
  assert.equal(items.disc.ok, false)
  assert.equal(checklist({ ...course, discountPrice: 90000 }, mods()).find((i) => i.key === 'disc').ok, true)
  assert.equal(checklist({ ...course, price: 500 }, mods()).find((i) => i.key === 'price').ok, false)
})

test('0078: muallif faqat o‘z kursini ko‘radi (RLS + RPC filtr)', () => {
  assert.ok(/create policy course_enrollments_read[^;]+user_id = \(select auth\.uid\(\)\) or public\.course_authored_by\(course_id/i.test(sql), 'enrollments RLS')
  for (const fn of ['course_author_courses', 'course_author_dashboard', 'course_author_students', 'course_author_payments']) {
    has(new RegExp(`function public\\.${fn}\\(`), fn)
    has(new RegExp(`revoke all on function public\\.${fn}\\([^)]*\\) from public, anon;`), `${fn} anonimga yopiq`)
  }
  assert.ok((sql.match(/author_id = (auth\.uid\(\)|uid)/g) || []).length >= 6)
})

test('0078: qo‘lda to‘lov — faqat o‘z kursi, faqat unpaid, sinov kursi emas, jurnalga yoziladi', () => {
  const fn = sql.slice(sql.indexOf('function public.course_author_mark_paid'), sql.indexOf('$$;', sql.indexOf('function public.course_author_mark_paid')))
  within(fn)(/author_id <> uid|author_id is distinct from uid/)
  within(fn)(/seed_batch is not null/)
  within(fn)(/payment_status <> 'unpaid'|payment_status is distinct from 'unpaid'/)
  within(fn)(/insert into public\.course_payment_events/)
  hasNot(/grant insert[^;]*course_payment_events/i)
})

test('0078: moderatsiya serverda — muallif o‘zi published qila olmaydi', () => {
  has(/create trigger courses_moderation_gate/)
  has(/new\.status := 'review'/)
  has(/function public\.course_moderate\(/)
  has(/function public\.course_review_queue\(/)
})

test('0078 tranzaksiyada va yangi api/ fayl qo‘shilmagan', () => {
  assert.match(sql.trim(), /^(--[^\n]*\n|\s)*begin;/i)
  assert.match(sql.trim(), /commit;$/i)
  const apiFiles = fs.readdirSync(path.join(root, 'api')).filter((f) => /\.(js|mjs|ts)$/.test(f))
  assert.ok(apiFiles.length <= 12, `api funksiyalar: ${apiFiles.length}`)
})

test('parseVideoRef: ID va Bunny havolasini ajratadi, yomon matnni rad etadi', () => {
  assert.equal(parseVideoRef('abc_123-XYZ'), 'abc_123-XYZ')
  assert.equal(parseVideoRef('https://iframe.mediadelivery.net/embed/805789/v-lesson-1?autoplay=false'), 'v-lesson-1')
  assert.equal(parseVideoRef('  '), '')
  assert.equal(parseVideoRef('javascript:alert(1)'), '')
  assert.equal(parseVideoRef('http://evil.example/x'), '')
})

test('0078: video havolasi faqat o‘z darsiga, format tekshiriladi', () => {
  const fn = sql.slice(sql.indexOf('function public.course_author_attach_video'), sql.indexOf('$$;', sql.indexOf('function public.course_author_attach_video')))
  assert.ok(/author_id = uid/.test(fn))
  assert.ok(/bunny_video_id = v_id/.test(fn))
  assert.ok(/encoding_status = 'finished'/.test(fn))
  assert.ok(/\[A-Za-z0-9_\-\]/.test(fn) || /A-Za-z0-9_-/.test(fn))
})
