import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { advanceWatch, formatRetry, gradeQuiz, gradeQuizSubmission, lessonOpen, mistakeRule, parseBunnyMessage, quizRetryGate, shouldReportProgress, subscribeBunnyPlayer, sumCoursePoints, BUNNY_PLAYER_EVENTS, BUNNY_PLAYER_ORIGIN, PROGRESS_REPORT_MS, WATCH_UNLOCK_RATIO } from '../src/courseRules.js'
import { certFromRow, hoursLine, isCourseCertificate, pointsBadge } from '../src/sertifikatData.js'
import { bunnySignature, mapBunnyStatus } from '../api/_lib/bunny.js'

const root = path.resolve(import.meta.dirname, '..')

test('bir so‘rov bilan 90% ochilmaydi, haqiqiy vaqt yetganda ochiladi', () => {
  const duration = 3600
  const jump = advanceWatch({ watched: 0, reported: duration, elapsed: 0, duration, hasPriorReport: false })
  assert.equal(jump.watched, 20)
  assert.equal(jump.unlocked, false)

  let watched = 20
  let unlocked = false
  for (let second = 20; second <= duration; second += 10) {
    const step = advanceWatch({ watched, reported: second, elapsed: 10, duration, hasPriorReport: true })
    assert.ok(step.watched <= watched + 10)
    watched = step.watched
    unlocked = step.unlocked
  }
  assert.ok(watched / duration >= WATCH_UNLOCK_RATIO)
  assert.equal(unlocked, true)

  const burst = advanceWatch({ watched: 100, reported: 1000, elapsed: 0, duration, hasPriorReport: true })
  assert.equal(burst.watched, 100)
})

test('test bahosi to‘g‘ri javobni qaytarmaydi', () => {
  const questions = [
    { id: 'a', correctIndex: 1 },
    { id: 'b', correctIndex: 0 },
    { id: 'c', correctIndex: 2 },
  ]
  const graded = gradeQuiz(questions, [{ id: 'a', choice: 1 }, { id: 'b', choice: 2 }, { id: 'c', choice: 2 }], 70)
  assert.equal(graded.score, 67)
  assert.equal(graded.passed, false)
  assert.deepEqual(graded.wrongIds, ['b'])
  assert.equal('correctIndex' in graded, false)
  const passed = gradeQuiz(questions, [{ id: 'a', choice: 1 }, { id: 'b', choice: 0 }, { id: 'c', choice: 2 }], 70)
  assert.equal(passed.passed, true)
  assert.deepEqual(passed.wrongIds, [])
})

test('oldingi dars yakunlanmasa keyingisi yopiq', () => {
  const lessons = [{ complete: true }, { complete: false }, { complete: false }]
  assert.equal(lessonOpen(lessons, 0, { access: true }), true)
  assert.equal(lessonOpen(lessons, 1, { access: true }), true)
  assert.equal(lessonOpen(lessons, 2, { access: true }), false)
  assert.equal(lessonOpen(lessons, 2, { access: false }), false)
  assert.equal(lessonOpen(lessons, 2, { preview: true }), true)
})

test('Bunny imzosi va holat xaritasi', () => {
  const signature = bunnySignature({ libraryId: '805789', apiKey: 'secret', videoId: 'vid-1', expire: 1700000000 })
  assert.match(signature, /^[a-f0-9]{64}$/)
  assert.notEqual(signature, bunnySignature({ libraryId: '805789', apiKey: 'secret', videoId: 'vid-2', expire: 1700000000 }))
  assert.equal(mapBunnyStatus({ status: 4, length: 120.2, encodeProgress: 100 }).encoding, 'finished')
  assert.equal(mapBunnyStatus({ status: 4, length: 120.2 }).ready, true)
  assert.equal(mapBunnyStatus({ status: 3, length: 10, encodeProgress: 40 }).encoding, 'processing')
  assert.equal(mapBunnyStatus({ status: 1 }).encoding, 'processing')
  assert.equal(mapBunnyStatus({ status: 6 }).encoding, 'failed')
})

test('pleer xabari vaqti ajratadi', () => {
  assert.deepEqual(parseBunnyMessage(JSON.stringify({ event: 'timeupdate', currentTime: 12.5, duration: 80 })), {
    event: 'timeupdate', current: 12.5, duration: 80,
  })
  assert.equal(parseBunnyMessage('not-json'), null)
  assert.equal(parseBunnyMessage({ event: 'play' }).current, null)
})

test('talaba pleerida to‘g‘ri javob yo‘q va funksiyalar 12 tadan oshmaydi', () => {
  const sql = fs.readFileSync(path.join(root, 'supabase/migrations/0072_courses.sql'), 'utf8')
  const player = sql.split('-- fn:course_player')[1].split('-- endfn:course_player')[0]
  assert.ok(player.includes('course_player'))
  assert.equal(player.includes('correct_index'), false)
  assert.equal(player.includes('correctIndex'), false)
  assert.match(sql, /revoke all on function public\.course_submit_quiz/)
  assert.match(sql, /revoke insert, update, delete on public\.customer_certificates/)
  assert.match(sql, /quiz_unlocked/)

  const apiDir = path.join(root, 'api')
  const files = []
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      if (name.startsWith('_')) continue
      const full = path.join(dir, name)
      if (fs.statSync(full).isDirectory()) walk(full)
      else if (name.endsWith('.js')) files.push(full)
    }
  }
  walk(apiDir)
  assert.equal(files.length, 12)
  assert.equal(files.some((file) => file.endsWith(`${path.sep}talim.js`) || file.includes(`${path.sep}courses.js`)), false)
  const vercel = fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')
  assert.match(vercel, /\/api\/talim/)
  const search = fs.readFileSync(path.join(root, 'api/image-search.js'), 'utf8')
  const handler = search.slice(search.indexOf('export default'))
  assert.ok(handler.includes('handleTalim'))
  assert.ok(handler.indexOf('handleTalim') < handler.indexOf('requirePost'))
})

function fiveQuestions() {
  return [0, 1, 2, 3, 4].map((i) => ({ id: `q${i}`, correctIndex: 0 }))
}

function withMistakes(mistakes) {
  const questions = fiveQuestions()
  return questions.map((q, i) => ({ id: q.id, choice: i < questions.length - mistakes ? 0 : 1 }))
}

test('0, 2 va 3 ta xato: 3/5 to‘g‘ri o‘tadi', () => {
  const questions = fiveQuestions()
  const none = gradeQuizSubmission(questions, withMistakes(0))
  assert.equal(none.ok, true)
  assert.equal(none.mistakes, 0)
  assert.equal(none.passed, true)
  assert.equal('wrongIds' in none, false)

  const two = gradeQuizSubmission(questions, withMistakes(2))
  assert.equal(two.correct, 3)
  assert.equal(two.total, 5)
  assert.equal(two.score, 60)
  assert.equal(two.mistakes, 2)
  assert.equal(two.passed, true)
  assert.equal(two.maxMistakes, 2)

  const three = gradeQuizSubmission(questions, withMistakes(3))
  assert.equal(three.correct, 2)
  assert.equal(three.mistakes, 3)
  assert.equal(three.passed, false)

  const unanswered = gradeQuizSubmission(questions, withMistakes(0).slice(0, 3))
  assert.equal(unanswered.mistakes, 2)
  assert.equal(unanswered.passed, true)
  const moreBlank = gradeQuizSubmission(questions, withMistakes(0).slice(0, 2))
  assert.equal(moreBlank.mistakes, 3)
  assert.equal(moreBlank.passed, false)
  assert.equal(mistakeRule(2), 'Ko‘pi bilan 2 ta xatoga ruxsat')
})

test('barcha variant yoki dublikat testni yutmaydi', () => {
  const one = [{ id: 'a', correctIndex: 1 }]
  const flood = gradeQuizSubmission(one, [0, 1, 2, 3].map((choice) => ({ id: 'a', choice })))
  assert.equal(flood.ok, false)
  const questions = fiveQuestions()
  const dup = gradeQuizSubmission(questions, [...withMistakes(0), { id: 'q0', choice: 0 }])
  assert.equal(dup.ok, false)
  const unknown = gradeQuizSubmission(questions, [{ id: 'boshqa', choice: 0 }])
  assert.equal(unknown.ok, false)
  const capped = gradeQuizSubmission(questions, withMistakes(0))
  assert.ok(capped.correct <= capped.total)
  assert.ok(capped.score <= 100)
})

test('urinishlar oralig‘i 60 soniya, kuniga 5 ta', () => {
  const now = 1_700_000_000_000
  assert.equal(quizRetryGate({ now, attempts: [] }).ok, true)
  const soon = quizRetryGate({ now, attempts: [now - 10_000] })
  assert.equal(soon.ok, false)
  assert.equal(soon.code, 'cooldown')
  assert.equal(soon.retryAfter, 50)
  assert.match(soon.error, /kuting/)
  assert.equal(quizRetryGate({ now, attempts: [now - 61_000] }).ok, true)
  const day = Array.from({ length: 5 }, (_, i) => now - 120_000 - i * 1000)
  const limited = quizRetryGate({ now, attempts: day })
  assert.equal(limited.ok, false)
  assert.equal(limited.code, 'daily')
  assert.match(limited.error, /5 ta urinish/)
  assert.equal(quizRetryGate({ now, attempts: [now - 86_400_000 - 5] }).ok, true)
  assert.equal(formatRetry(47), '0:47')
  assert.equal(formatRetry(60), '1:00')
})

test('player.js hodisalariga obuna qilinadi', () => {
  const sent = []
  const target = { postMessage: (data, origin) => sent.push({ data, origin }) }
  assert.equal(subscribeBunnyPlayer(target), true)
  assert.equal(sent.length, BUNNY_PLAYER_EVENTS.length)
  for (const eventName of BUNNY_PLAYER_EVENTS) {
    const row = sent.find((item) => JSON.parse(item.data).value === eventName)
    const body = JSON.parse(row.data)
    assert.equal(typeof row.data, 'string')
    assert.equal(body.context, 'player.js')
    assert.equal(body.version, '0.0.11')
    assert.equal(body.method, 'addEventListener')
    assert.equal(body.listener, eventName)
    assert.equal(row.origin, BUNNY_PLAYER_ORIGIN)
  }
  assert.equal(subscribeBunnyPlayer(null), false)
  assert.equal(shouldReportProgress({ lastSent: 0, now: PROGRESS_REPORT_MS - 1, event: 'timeupdate' }), false)
  assert.equal(shouldReportProgress({ lastSent: 0, now: PROGRESS_REPORT_MS, event: 'timeupdate' }), true)
  assert.equal(shouldReportProgress({ lastSent: 10_000, now: 10_100, event: 'ended' }), true)
  const player = fs.readFileSync(path.join(root, 'src/pages/CoursePlayer.jsx'), 'utf8')
  const lesson = fs.readFileSync(path.join(root, 'src/components/course/LessonPlayer.jsx'), 'utf8')
  assert.match(player, /subscribeBunnyPlayer/)
  assert.match(lesson, /onPlayerFrame\?\.\(event\.currentTarget\)/)
  assert.match(lesson, /data-testid="quiz-retry"/)
  assert.match(lesson, /min-h-11 w-full shrink-0/)
})

test('0074 baholash, tanaffus va max_mistakes', () => {
  const sql = fs.readFileSync(path.join(root, 'supabase/migrations/0074_course_fixes.sql'), 'utf8')
  const quizFn = sql.split('create or replace function public.course_submit_quiz')[1].split('comment on function public.course_submit_quiz')[0]
  assert.match(quizFn, /v_mistakes <= les\.max_mistakes/)
  assert.equal(/v_score >= les\.pass_threshold/.test(quizFn), false)
  assert.equal(/jsonb_agg\(\s*q\.id\s*\)/.test(quizFn), false)
  assert.match(quizFn, /least\(coalesce\(v_correct, 0\), v_total\)/)
  assert.match(quizFn, /interval '60 seconds'/)
  assert.match(quizFn, /v_day_count >= 5/)
  assert.match(quizFn, /'wrongIds', '\[\]'::jsonb/)
  assert.match(sql, /add column if not exists max_mistakes integer not null default 2/)
  const player = sql.split('create or replace function public.course_player')[1].split('create or replace function public.course_editor')[0]
  assert.match(player, /maxMistakes/)
  assert.equal(player.includes('correct_index'), false)
  assert.equal(player.includes('correctIndex'), false)
  assert.match(sql, /max_mistakes = \(v_row->>'maxMistakes'\)::int/)
})

test('kurs sertifikati ball, seminar CME', () => {
  const course = certFromRow({ id: '1', code: 'SH-KURS-DDFE4003', course_id: 'course:abc', kind: 'online', cme: 10, hours: 1 })
  const seminar = certFromRow({ id: '2', course_id: 'seminar:abc', kind: 'seminar', cme: 10, hours: 6 })
  assert.equal(isCourseCertificate(course), true)
  assert.equal(isCourseCertificate(seminar), false)
  assert.equal(pointsBadge(course), '10 ball')
  assert.equal(pointsBadge(seminar), '10 CME')
  assert.equal(hoursLine(course), '1 soat · 10 ball')
  assert.equal(hoursLine(seminar), '6 soat · 10 CME')
  assert.equal(sumCoursePoints([{ points: 10 }, { points: 4 }, { points: 0 }]), 14)
})
