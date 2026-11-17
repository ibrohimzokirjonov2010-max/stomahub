import test from 'node:test'
import assert from 'node:assert/strict'
import {
  statusFromService, teethList, reconcile, reconcileList, STAGE_OPTS, PROFILE_VISIT_OPTS, CALENDAR_OPTS, profileVisitKey,
} from '../src/teeth/autoToothStatus.js'

test('statusFromService: xizmat nomi → tish holati', () => {
  const cases = {
    'Kompozit plomba': 'filling', 'Restavratsiya': 'filling', 'Karies davolash': 'filling',
    'Kanal davolash': 'endo', 'Endodontiya': 'endo', 'Shtift o‘rnatish': 'post',
    'Implant o‘rnatish': 'implant', 'Implant ustiga zirkon koronka': 'implant_crown', 'Implant koronka': 'implant_crown',
    'Sirkon koronka': 'zirconia', 'Metall-keramika krona': 'crown', 'Koronka': 'crown', 'Vinir': 'veneer',
    'Ko‘prik (3 birlik)': 'bridge', "Ko'prik": 'bridge', 'Tish sug‘urish': 'missing', 'Tishni olib tashlash': 'missing',
    'Ekstraksiya': 'missing', 'Olinadigan protez': 'denture', 'Breket tizimi': 'braces',
  }
  for (const [name, want] of Object.entries(cases)) assert.equal(statusFromService(name), want, name)
  assert.equal(statusFromService('Konsultatsiya'), null)
  assert.equal(statusFromService('Gigiyena'), null)
  assert.equal(statusFromService(''), null)
})

test('teethList: faqat to‘g‘ri FDI raqamlar', () => {
  assert.deepEqual(teethList('15, 24'), [15, 24])
  assert.deepEqual(teethList([36, '36', 99, 19]), [36])
  assert.deepEqual(teethList('85'), [85])
  assert.deepEqual(teethList(undefined), [])
})

const stage = (status, extra = {}) => ({ id: 's1', title: 'Kompozit plomba', teeth: [15, 24], status, ...extra })

test('bosqich bajarildi → tishlar holati qo‘yiladi va avvalgisi saqlanadi', () => {
  const r = reconcile(stage('jarayonda'), stage('bajarildi'), { 15: 'caries' }, STAGE_OPTS)
  assert.equal(r.changed, true)
  assert.deepEqual(r.teeth, { 15: 'filling', 24: 'filling' })
  assert.deepEqual(r.item.autoTooth, { status: 'filling', prev: { 15: 'caries', 24: 'healthy' } })
})

test('qaytarilsa avvalgi holat tiklanadi (qo‘lda o‘zgartirilgan tish tegilmaydi)', () => {
  const done = reconcile(stage('rejada'), stage('bajarildi'), { 15: 'caries' }, STAGE_OPTS)
  const manual = { ...done.teeth, 24: 'crown' }
  const back = reconcile(done.item, { ...done.item, status: 'rejada' }, manual, STAGE_OPTS)
  assert.deepEqual(back.teeth, { 15: 'caries', 24: 'crown' })
  assert.equal(back.item.autoTooth, undefined)
})

test('o‘tish bo‘lmasa yoki xizmat noma’lum bo‘lsa hech narsa o‘zgarmaydi', () => {
  const teeth = { 15: 'caries' }
  assert.equal(reconcile(stage('bajarildi'), stage('bajarildi', { title: 'Boshqa nom' }), teeth, STAGE_OPTS).changed, false)
  assert.equal(reconcile(stage('rejada'), stage('jarayonda'), teeth, STAGE_OPTS).changed, false)
  const unknown = reconcile(stage('rejada', { title: 'Konsultatsiya' }), stage('bajarildi', { title: 'Konsultatsiya' }), teeth, STAGE_OPTS)
  assert.equal(unknown.changed, false)
  assert.equal(unknown.teeth, teeth)
  // Yangi yaratilgan va darhol bajarilgan bosqich (Tugatish → reja yo‘q) — tish o‘zgaradi
  const fresh = reconcile(undefined, stage('bajarildi'), teeth, STAGE_OPTS)
  assert.equal(fresh.changed, true)
  assert.ok(fresh.item.autoTooth)
  // autoTooth allaqachon bor yangi yozuv (qayta yuklash) — ikkinchi marta qo‘llanmaydi
  assert.equal(reconcile(undefined, fresh.item, fresh.teeth, STAGE_OPTS).changed, false)
})

test('qayta yig‘ilgan bosqich autoTooth ni yo‘qotmaydi', () => {
  const done = reconcile(stage('rejada'), stage('bajarildi'), {}, STAGE_OPTS)
  const rebuilt = reconcile(done.item, stage('bajarildi'), done.teeth, STAGE_OPTS)
  assert.deepEqual(rebuilt.item.autoTooth, done.item.autoTooth)
})

test('profil tashrifi: done false → true', () => {
  const prev = [{ date: '17.11.2026', kind: 'Kanal davolash', tooth: '46', done: false }]
  const next = [{ ...prev[0], done: true }]
  const r = reconcileList(prev, next, {}, profileVisitKey, PROFILE_VISIT_OPTS)
  assert.deepEqual(r.teeth, { 46: 'endo' })
  assert.ok(r.list[0].autoTooth)
})

test('kalendar: faqat yakuniy holat; keldi/qabulda tishga tegmaydi', () => {
  const v = { id: 'n1', service: 'Implant', tooth: '36', status: 'tasdiq', patientId: 'p1' }
  assert.deepEqual(reconcile(v, { ...v, status: 'yakun' }, {}, CALENDAR_OPTS).teeth, { 36: 'implant' })
  assert.equal(reconcile(v, { ...v, status: 'keldi' }, {}, CALENDAR_OPTS).changed, false)
  assert.equal(reconcile(v, { ...v, status: 'qabulda' }, {}, CALENDAR_OPTS).changed, false)
  const noTooth = { ...v, tooth: undefined }
  assert.equal(reconcile(noTooth, { ...noTooth, status: 'yakun' }, {}, CALENDAR_OPTS).changed, false)
})
