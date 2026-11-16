import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { cartToastModel, favToastModel, quietCartPath, onToast, showToast } from '../src/lib/toastBus.js'

const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('cartToastModel: nomi, rasmi, soni va «Savatga o‘tish»', () => {
  const m = cartToastModel({ id: 'p1', name: 'Kompozit A2', image: '/a.jpg' }, [{ id: 'p1', qty: 3 }])
  assert.equal(m.title, 'Savatga qo‘shildi')
  assert.equal(m.text, 'Kompozit A2')
  assert.equal(m.image, '/a.jpg')
  assert.equal(m.qty, 3)
  assert.equal(m.href, '/savatcha')
  assert.equal(m.actionLabel, 'Savatga o‘tish')
  assert.equal(cartToastModel(null), null)
})

test('favToastModel: qo‘shildi / olib tashlandi', () => {
  assert.equal(favToastModel(true, 'X').title, 'Sevimlilarga qo‘shildi')
  assert.equal(favToastModel(false, 'X').title, 'Sevimlilardan olib tashlandi')
  assert.equal(favToastModel(false).href, undefined)
})

test('quietCartPath: savat va checkoutda toast chiqmaydi', () => {
  assert.ok(quietCartPath('/savatcha'))
  assert.ok(quietCartPath('/buyurtma'))
  assert.ok(quietCartPath('/buyurtma/rasmiylashtirish'))
  assert.ok(!quietCartPath('/product/1'))
  assert.ok(!quietCartPath('/marketplace'))
})

test('toastBus: title bo‘lmasa yuborilmaydi, obunadan chiqish ishlaydi', () => {
  const got = []
  const off = onToast((t) => got.push(t))
  showToast({ title: 'A' }); showToast({}); showToast(null)
  off(); showToast({ title: 'B' })
  assert.deepEqual(got.map((t) => t.title), ['A'])
})

test('App DesktopToaster’ni ulaydi, RxPrompt desktopda cheklov toastini ko‘rsatmaydi', () => {
  const app = src('src/App.jsx')
  assert.match(app, /import DesktopToaster from '\.\/components\/DesktopToaster'/)
  assert.match(app, /<DesktopToaster \/>/)
  assert.match(src('src/restricted.jsx'), /cartNotice && mobile/)
  assert.match(src('src/components/DesktopToaster.jsx'), /if \(mobile \|\| !toast\) return null/)
})

test('Checkout: soxta chizilgan xarita (CityMap) olib tashlangan, haqiqiy MapPicker qoladi', () => {
  const c = src('src/pages/Checkout.jsx')
  assert.doesNotMatch(c, /CityMap/)
  assert.match(c, /<MapPicker /)
})
