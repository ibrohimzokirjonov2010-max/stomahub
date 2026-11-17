import test from 'node:test'
import assert from 'node:assert/strict'
import { VISIT_STATUS_ORDER, VISIT_TONES, isClosed, isFinal, normStatus, normVisits } from '../src/visitStatus.js'

test('yagona lug‘at: 7 holat, takroriy yorliq yo‘q', () => {
  assert.deepEqual(VISIT_STATUS_ORDER, ['tasdiq', 'kutil', 'keldi', 'qabulda', 'yakun', 'kelmadi', 'bekor'])
  const labels = VISIT_STATUS_ORDER.map((k) => VISIT_TONES[k].label)
  assert.deepEqual(labels, ['Tasdiqlangan', 'Kutilmoqda', 'Keldi', 'Qabulda', 'Yakunlangan', 'Kelmadi', 'Bekor qilingan'])
  assert.equal(new Set(labels).size, labels.length)
  assert.deepEqual(Object.keys(VISIT_TONES).sort(), [...VISIT_STATUS_ORDER].sort())
})

test('eski kalitlar normallashadi', () => {
  assert.equal(normStatus('yakunlangan'), 'yakun')
  assert.equal(normStatus('davol'), 'qabulda')
  assert.equal(normStatus(''), 'tasdiq')
  assert.equal(isFinal('yakunlangan'), true)
  assert.equal(isFinal('keldi'), false)
  assert.equal(isClosed('kelmadi'), true)
  const list = [{ id: 1, status: 'tasdiq' }]
  assert.equal(normVisits(list), list)
  assert.deepEqual(normVisits([{ id: 2, status: 'yakunlangan' }]), [{ id: 2, status: 'yakun' }])
})
