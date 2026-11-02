import { createContext, useContext, useEffect, useState } from 'react'
import { initialCart } from './marketData'
import { isUuid } from './buyerApi'
import { mergeCarts } from './cartMerge'
import { isRestricted } from './restricted.jsx'
import { useProfile } from './profileStore'
import { tierPrice } from './config/productCatalog'
import { currentUid, isDemoUser, loadBlob, onAccount, saveBlob } from './recordSync'

const CartContext = createContext(null)

export const GUEST_CART_KEY = 'stomahub:guest-cart'
export function loadGuestCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]')
    return Array.isArray(raw) ? raw.filter((it) => it && isUuid(it.productId || it.id) && Number(it.qty) > 0) : []
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
  const doctorOk = !!useProfile()?.verified

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
    if (Array.isArray(payload?.items)) list = payload.items.filter((it) => isUuid(it.productId || it.id))
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

  // min order qty + wholesale tiers (0029): a line keeps basePrice/tiers/minQty, price follows qty
  const priced = (it, qty) => {
    const q = Math.max(it.minQty || 1, qty)
    return it.tiers?.length ? { ...it, qty: q, price: tierPrice(it.basePrice ?? it.price, it.tiers, q) } : { ...it, qty: q }
  }
  const setQty = (id, qty) =>
    setItems((list) => list.map((it) => (it.id === id ? priced(it, qty) : it)))

  // Server qoidasi (0038) bilan bir xil: cheklangan mahsulot faqat tasdiqlangan shifokor savatiga tushadi
  const add = (product, qty = 1) => {
    if (isRestricted(product) && !doctorOk) { setRxPrompt(true); return false }
    addLine(product, qty)
    return true
  }
  const addLine = (product, qty) =>
    setItems((list) => {
      const id = product.id
      const found = list.find((it) => it.id === id)
      if (found) return list.map((it) => (it.id === id ? priced(it, it.qty + qty) : it))
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
        ...(minQty > 1 ? { minQty } : {}),
        ...(tiers.length ? { tiers, basePrice: product.price } : {}),
        ...(product.uom && product.uom !== 'dona' ? { uom: product.uom } : {}),
        ...(typeof product.seller === 'string' ? { seller: product.seller } : {}),
        ...(isRestricted(product) ? { rx: true } : {}),
      }, qty)]
    })

  const remove = (id) => setItems((list) => list.filter((it) => it.id !== id))
  const clear = () => setItems([])

  const count = items.reduce((s, it) => s + it.qty, 0)
  const total = items.reduce((s, it) => s + it.qty * it.price, 0)

  return (
    <CartContext.Provider value={{ items, setItems, add, setQty, remove, clear, count, total, cartReady, reviewing, rxPrompt, closeRxPrompt: () => setRxPrompt(false), openReview: () => setReviewing(true), closeReview: () => setReviewing(false) }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
