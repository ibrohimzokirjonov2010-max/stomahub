import { createContext, useContext, useEffect, useState } from 'react'
import { initialCart } from './marketData'
import { isUuid, useMarket } from './buyerApi'
import { useSession } from './sessionStore'
import { purchaseBlock, stockOf, cartProblems } from './lib/purchaseGuard'
import { mergeCarts } from './cartMerge'
import { isRestricted } from './restricted.jsx'
import { useProfile } from './profileStore'
import { tierPrice } from './config/productCatalog'
import { currentUid, isDemoUser, loadBlob, onAccount, saveBlob } from './recordSync'
import { recordInterest } from './personal/interestStore'
// Sotuvchi o‘z mahsulotini sotib ololmaydi — kartochkalarda savat o‘rniga belgi ko‘rsatiladi
export const isOwnProduct = (p) => { const u = currentUid(); return !!u && !!p && (p.sellerId || p.seller_id) === u }
export const OWN_LABEL = 'Sizning mahsulotingiz'

/** Ortiqcha material C2C — savatga tushmasligi kerak (eski lokal qatorlarni ham tozalaymiz). */
export const isSurplusCartLine = (it) => {
  if (!it) return false
  const id = String(it.id || it.productId || '')
  if (id.startsWith('surplus-')) return true
  const typ = String(it.type || '')
  return /Ortiqcha material/i.test(typ)
}

const CartContext = createContext(null)

// Oxirgi qo‘shilgan mahsulot (toastda rasm/nom ko‘rsatish uchun) va "qo‘shildi" hodisasi
let lastAdded = null
const addListeners = new Set()
export const getLastAdded = () => lastAdded
export function onCartAdd(fn) { addListeners.add(fn); return () => addListeners.delete(fn) }
function noteAdded(product) {
  lastAdded = { id: product.id, name: product.name || product.title || '', image: product.image || product.image_url || product.img || product.thumbs?.[0] || '', at: Date.now() }
  addListeners.forEach((fn) => { try { fn(lastAdded) } catch { /* ignore */ } })
}

export const GUEST_CART_KEY = 'stomahub:guest-cart'
export function loadGuestCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]')
    return Array.isArray(raw) ? raw.filter((it) => it && isUuid(it.productId || it.id) && Number(it.qty) > 0 && !isSurplusCartLine(it)) : []
  } catch { return [] }
}
function saveGuestCart(items) {
  try {
    if (items.length) localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
    else localStorage.removeItem(GUEST_CART_KEY)
  } catch { /* ignore */ }
}
function clearGuestCart() { try { localStorage.removeItem(GUEST_CART_KEY) } catch { /* ignore */ } }
// Bir xil mahsulot (id + variant) ikki marta tushmaydi: kattaroq miqdor qoladi
export { mergeCarts }

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [reviewing, setReviewing] = useState(false)
  const [cartReady, setCartReady] = useState(false)
  const [rxPrompt, setRxPrompt] = useState(false)
  const [cartNotice, setCartNotice] = useState('')
  const doctorOk = !!useProfile()?.verified
  const uid = useSession()?.user?.id || ''
  const market = useMarket()
  const liveById = new Map((market.products || []).map((p) => [p.id, p]))
  // Jonli qoldiq: variant bo'lsa variantniki, aks holda mahsulotniki; katalog yuklanmagan bo'lsa saqlangan qiymat
  const liveStock = (it) => {
    const live = liveById.get(it.productId || it.id)
    if (!live) return stockOf(it)
    if (it.variant && Array.isArray(live.variants)) {
      const v = live.variants.find((x) => (x.sku || '') === it.variant)
      if (v) return Math.max(0, Number(v.stock) || 0)
    }
    return stockOf(live)
  }

  useEffect(() => onAccount(async (id) => {
    if (!id) {
      // Mehmon savati brauzerda saqlanadi (sahifa yangilansa ham yo‘qolmaydi)
      setItems(loadGuestCart())
      setCartReady(true)
      return
    }
    setCartReady(false)
    const payload = await loadBlob('cart')
    // Eski demo (uuid bo‘lmagan) mahsulotlarni tashlab yuboramiz — ularni buyurtma qilib bo‘lmaydi
    let list
    if (Array.isArray(payload?.items)) list = payload.items.filter((it) => isUuid(it.productId || it.id) && !isSurplusCartLine(it))
    else if (isDemoUser()) list = initialCart
    else list = []
    // Kirishdan oldin mehmon sifatida qo‘shilganlarni hisob savatiga qo‘shamiz (takrorlarsiz)
    const guest = loadGuestCart()
    if (guest.length) {
      list = mergeCarts(list, guest)
      clearGuestCart()
    }
    setItems(list)
    setCartReady(true)
  }), [])

  useEffect(() => {
    if (!cartReady) return
    if (currentUid()) saveBlob('cart', { items })
    else saveGuestCart(items)
  }, [items, cartReady])

  // min order qty + wholesale tiers (0029): a line keeps basePrice/tiers/minQty, price follows qty.
  // Miqdor hech qachon ombordagi qoldiqdan oshmaydi (stock ma'lum bo'lsa).
  const priced = (it, qty) => {
    const s = stockOf(it)
    let q = Math.max(it.minQty || 1, qty)
    if (s !== null) q = Math.min(q, Math.max(s, 1))
    return it.tiers?.length ? { ...it, qty: q, price: tierPrice(it.basePrice ?? it.price, it.tiers, q) } : { ...it, qty: q }
  }
  const setQty = (id, qty) =>
    setItems((list) => list.map((it) => {
      if (it.id !== id) return it
      const s = liveStock(it)
      if (s !== null) it = { ...it, stock: s }
      if (s !== null && qty > s) setCartNotice(`Omborda faqat ${s} ${it.uom || 'dona'} bor`)
      return priced(it, qty)
    }))

  // Server qoidasi (0038 + buyer_create_order) bilan bir xil: cheklangan mahsulot faqat tasdiqlangan shifokorga,
  // o'z mahsulotini sotuvchi buyurtma qila olmaydi, ombordan ko'p qo'shib bo'lmaydi.
  const add = (product, qty = 1) => {
    if (isSurplusCartLine(product)) {
      setCartNotice('Ortiqcha material savatga qo‘shilmaydi — sotuvchi bilan bog‘laning')
      return false
    }
    const live = liveById.get(product.productId || product.id)
    const probe = { ...product, stock: liveStock(product) ?? product.stock, sellerId: product.sellerId || live?.sellerId, rx: product.rx || live?.rx }
    const block = purchaseBlock(probe, { uid, verified: doctorOk })
    if (block?.code === 'rx') { setRxPrompt(true); return false }
    if (block) { setCartNotice(block.text); return false }
    const s = stockOf(probe)
    const inCart = items.find((it) => it.id === product.id)?.qty || 0
    if (s !== null && inCart + qty > s) {
      setCartNotice(`Omborda faqat ${s} ${product.uom || 'dona'} bor${inCart ? ` — savatda allaqachon ${inCart} ta` : ''}`)
      if (inCart >= s) return false
    }
    addLine(probe, qty)
    noteAdded(product)
    if (isUuid(product.productId || product.id)) recordInterest('cart', { productId: product.productId || product.id, category: live?.rawCategory || live?.category || '' })
    return true
  }
  const addLine = (product, qty) =>
    setItems((list) => {
      const id = product.id
      const found = list.find((it) => it.id === id)
      const s = stockOf(product)
      if (found) return list.map((it) => (it.id === id ? priced(s !== null ? { ...it, stock: s } : it, it.qty + qty) : it))
      const productId = product.productId || (isUuid(id) ? id : undefined)
      const minQty = Math.max(1, Number(product.minQty) || 1)
      const tiers = Array.isArray(product.priceTiers) ? product.priceTiers : []
      return [...list, priced({
        id,
        productId,
        sellerId: product.sellerId || product.seller_id || undefined,
        name: product.name,
        type: product.type || product.variant || '',
        variant: product.variant || '',
        price: product.price,
        image: product.image || product.image_url || product.thumbs?.[0] || '',
        qty,
        ...(s !== null ? { stock: s } : {}),
        ...(minQty > 1 ? { minQty } : {}),
        ...(tiers.length ? { tiers, basePrice: product.price } : {}),
        ...(product.uom && product.uom !== 'dona' ? { uom: product.uom } : {}),
        ...(typeof product.seller === 'string' ? { seller: product.seller } : {}),
        ...(isRestricted(product) ? { rx: true } : {}),
      }, qty)]
    })

  const remove = (id) => setItems((list) => list.filter((it) => it.id !== id))
  const clear = () => setItems([])

  // Savat qatorlarini jonli katalog bilan boyitamiz: joriy qoldiq, sotuvchi va cheklov (eski saqlangan savatlar uchun ham)
  const lines = items.map((it) => {
    const live = liveById.get(it.productId || it.id)
    if (!live) return it
    // Narx ham jonli (sotuvchi chegirmasi yoqilsa/tugasa savat narxi yangilanadi; server baribir o‘zi hisoblaydi)
    const lv = it.variant && Array.isArray(live.variants) ? live.variants.find((x) => (x.sku || '') === it.variant) : null
    const livePrice = it.tiers?.length ? tierPrice(live.price, live.priceTiers?.length ? live.priceTiers : it.tiers, it.qty) : Number(lv ? lv.price : live.price) || it.price
    return { ...it, price: livePrice, ...(live.oldPrice > live.price ? { oldPrice: lv?.oldPrice || live.oldPrice } : {}), stock: liveStock(it), sellerId: it.sellerId || live.sellerId, rx: it.rx || live.rx || undefined }
  })
  const problems = cartProblems(lines, { uid, verified: doctorOk })

  const count = lines.reduce((s, it) => s + it.qty, 0)
  const total = lines.reduce((s, it) => s + it.qty * it.price, 0)

  return (
    <CartContext.Provider value={{ items: lines, problems, cartNotice, closeCartNotice: () => setCartNotice(''), setItems, add, setQty, remove, clear, count, total, cartReady, reviewing, rxPrompt, closeRxPrompt: () => setRxPrompt(false), openReview: () => setReviewing(true), closeReview: () => setReviewing(false) }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
