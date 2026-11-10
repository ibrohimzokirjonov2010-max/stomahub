import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { findSpeakerDoctorHref, seminarsBySpeaker, normSpeakerName, speakerLinkedId } from '../src/seminarSpeaker.js'

const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8')

test('normSpeakerName strips apostrophes and case', () => {
  assert.equal(normSpeakerName("G'aybullayev Shahobidin"), 'gaybullayev shahobidin')
  assert.equal(normSpeakerName('G’aybullayev  Shahobidin'), 'gaybullayev shahobidin')
})

test('speakerLinkedId reads user/doctor/profile ids', () => {
  assert.equal(speakerLinkedId({ userId: 'u1' }), 'u1')
  assert.equal(speakerLinkedId({ doctor_id: 'd2' }), 'd2')
  assert.equal(speakerLinkedId({ name: 'A' }), '')
})

test('findSpeakerDoctorHref: no catalog match returns empty (sheet fallback)', () => {
  assert.equal(findSpeakerDoctorHref({ name: "G'aybullayev Shahobidin" }), '')
  assert.equal(findSpeakerDoctorHref({ name: 'X', userId: 'missing-id' }, []), '')
})

test('findSpeakerDoctorHref: linked or name-matched doctor goes to mutaxassis profile', () => {
  const doctors = [{ id: 'doc-1', name: "G'aybullayev Shahobidin" }]
  assert.equal(findSpeakerDoctorHref({ name: 'X', userId: 'doc-1' }, doctors), '/mutaxassislar/doc-1')
  assert.equal(findSpeakerDoctorHref({ name: 'G’aybullayev Shahobidin' }, doctors), '/mutaxassislar/doc-1')
})

test('seminarsBySpeaker matches by name and skips current id', () => {
  const list = [
    { id: 'a', title: 'One', speaker: { name: "G'aybullayev Shahobidin" } },
    { id: 'b', title: 'Two', speaker: { name: 'G’aybullayev Shahobidin' } },
    { id: 'c', title: 'Other', speaker: { name: 'Ali' } },
  ]
  const hits = seminarsBySpeaker(list, "G'aybullayev Shahobidin", 'a')
  assert.deepEqual(hits.map((x) => x.id), ['b'])
})

test('registration card uses object-contain, not a cropped cover column', () => {
  const src = read('components/mobile/MobileSeminarReg.jsx')
  const fn = src.slice(src.indexOf('function SeminarCard'))
  assert.match(fn, /object-contain/)
  assert.doesNotMatch(fn.slice(0, fn.indexOf('\n}')) || fn, /self-stretch[\s\S]*object-cover/)
  assert.match(src, /SeminarPosterFrame/)
})

test('desktop registration aside uses contain poster frame', () => {
  const src = read('pages/SeminarReg.jsx')
  assert.match(src, /SeminarPosterFrame/)
  assert.doesNotMatch(src, /h-\[148px\][\s\S]*object-cover opacity-80/)
})

test('mobile seminar speaker card is tappable and gallery uses shared Lightbox', () => {
  const src = read('components/mobile/MobileSeminarV2.jsx')
  assert.match(src, /findSpeakerDoctorHref/)
  assert.match(src, /SpeakerProfileSheet/)
  assert.match(src, /ChevronRight/)
  assert.match(src, /from ['"]\.\.\/Lightbox['"]/)
  assert.match(src, /setShot\(/)
})

test('desktop seminar speaker is tappable and gallery uses shared Lightbox', () => {
  const src = read('pages/Seminar.jsx')
  assert.match(src, /findSpeakerDoctorHref/)
  assert.match(src, /SpeakerProfileSheet/)
  assert.match(src, /from ['"]\.\.\/components\/Lightbox['"]/)
})
