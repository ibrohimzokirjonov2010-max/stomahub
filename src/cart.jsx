import { createContext, useContext, useEffect, useState } from 'react'
import { initialCart } from './marketData'
import { isUuid } from './buyerApi'
import { tierPrice } from './config/productCatalog'
import { currentUid, isDemoUser, loadBlob, onAccount, saveBlob } from './recordSync'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [reviewing, setReviewing] = useState(false)
  const [cartReady, setCartReady] = useState(false)

  useEffect(() => onAccount(async (id) => {
    if (!id) {
      setItems(initialCart)
      setCartReady(false)
      return
    }
    const payload = await loadBlob('cart')
    // Eski demo (uuid bo‘lmagan) mahsulotlarni tashlab yuboramiz — ularni buyurtma qilib bo‘lmaydi
    if (Array.isArray(payload?.items)) setItems(payload.items.filter((it) => isUuid(it.productId || it.id)))
    else if (isDemoUser()) setItems(initialCart)
    else setItems([])
    setCartReady(true)
  }), [])

  useEffect(() => {
    if (!cartReady || !currentUid()) return
    saveBlob('cart', { items })
  }, [items, cartReady])

  // min order qty + wholesale tiers (0029): a line keeps basePrice/tiers/minQty, price follows qty
  const priced = (it, qty) => {
    const q = Math.max(it.minQty || 1, qty)
    return it.tiers?.length ? { ...it, qty: q, price: tierPrice(it.basePrice ?? it.price, it.tiers, q) } : { ...it, qty: q }
  }
  const setQty = (id, qty) =>
    setItems((list) => list.map((it) => (it.id === id ? priced(it, qty) : it)))

  const add = (product, qty = 1) =>
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
      }, qty)]
    })

  const remove = (id) => setItems((list) => list.filter((it) => it.id !== id))
  const clear = () => setItems([])

  const count = items.reduce((s, it) => s + it.qty, 0)
  const total = items.reduce((s, it) => s + it.qty * it.price, 0)

  return (
    <CartContext.Provider value={{ items, setItems, add, setQty, remove, clear, count, total, cartReady, reviewing, openReview: () => setReviewing(true), closeReview: () => setReviewing(false) }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
