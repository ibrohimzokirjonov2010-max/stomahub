import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { advanceWatch, gradeQuiz, lessonOpen, parseBunnyMessage, WATCH_UNLOCK_RATIO } from '../src/courseRules.js'
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
