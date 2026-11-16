// Global (desktop) toast hodisalari: sevimlilar va boshqa qisqa xabarlar. Savat qo‘shilishi cart.jsx (onCartAdd) orqali keladi.
const listeners = new Set()
export function onToast(fn) { listeners.add(fn); return () => listeners.delete(fn) }
/** t: { kind: 'fav' | 'info' | 'warn' | 'error' | 'success', title, text?, image?, href?, actionLabel? } */
export function showToast(t) {
  if (!t || !t.title) return
  listeners.forEach((fn) => { try { fn(t) } catch { /* ignore */ } })
}

/** Desktop toast kartochkasi modeli (sof — test qilinadi). */
export function cartToastModel(last, items = []) {
  if (!last) return null
  const line = items.find((it) => it.id === last.id)
  return { kind: 'cart', id: last.id, title: 'Savatga qo‘shildi', text: last.name || '', image: last.image || '', qty: line?.qty || 0, href: '/savatcha', actionLabel: 'Savatga o‘tish' }
}
export const favToastModel = (added, name = '', image = '') => (added
  ? { kind: 'fav', title: 'Sevimlilarga qo‘shildi', text: name, image, href: '/profil/sevimlilar', actionLabel: 'Ko‘rish' }
  : { kind: 'info', title: 'Sevimlilardan olib tashlandi', text: name, image })
// Savat sahifasida/rasmiylashtirishda "qo‘shildi" toasti keraksiz
export const quietCartPath = (path = '') => /^\/(savatcha|buyurtma)(\/|$)/.test(path)
// Mahsulot sahifalarida o‘ng ustunda narx/xarid bloki turadi — toast pastki o‘ngda chiqadi
export const detailPath = (path = '') => /^\/(product|forma|jihozlar|kitoblar)\/[^/]+\/?$/.test(path)
