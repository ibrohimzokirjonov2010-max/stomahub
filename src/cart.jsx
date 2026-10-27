import { createContext, useContext, useEffect, useState } from 'react'
import { initialCart } from './marketData'
import { isUuid } from './buyerApi'
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

  const setQty = (id, qty) =>
    setItems((list) => list.map((it) => (it.id === id ? { ...it, qty: Math.max(1, qty) } : it)))

  const add = (product, qty = 1) =>
    setItems((list) => {
      const id = product.id
      const found = list.find((it) => it.id === id)
      if (found) return list.map((it) => (it.id === id ? { ...it, qty: it.qty + qty } : it))
      const productId = product.productId || (isUuid(id) ? id : undefined)
      return [...list, {
        id,
        productId,
        sellerId: product.sellerId || product.seller_id || undefined,
        name: product.name,
        type: product.type || product.variant || '',
        variant: product.variant || '',
        price: product.price,
        image: product.image || product.image_url || product.thumbs?.[0] || '',
        qty,
        ...(typeof product.seller === 'string' ? { seller: product.seller } : {}),
      }]
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
