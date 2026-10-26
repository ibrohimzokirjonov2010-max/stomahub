import { createContext, useContext, useState } from 'react'
import { initialCart } from './marketData'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(initialCart)
  const [reviewing, setReviewing] = useState(false)

  const setQty = (id, qty) =>
    setItems((list) => list.map((it) => (it.id === id ? { ...it, qty: Math.max(1, qty) } : it)))

  const add = (product, qty = 1) =>
    setItems((list) => {
      const found = list.find((it) => it.id === product.id)
      if (found) return list.map((it) => (it.id === product.id ? { ...it, qty: it.qty + qty } : it))
      return [...list, { id: product.id, name: product.name, type: product.type, price: product.price, image: product.image, qty, ...(typeof product.seller === 'string' ? { seller: product.seller } : {}) }]
    })

  const remove = (id) => setItems((list) => list.filter((it) => it.id !== id))
  const clear = () => setItems([])

  const count = items.reduce((s, it) => s + it.qty, 0)
  const total = items.reduce((s, it) => s + it.qty * it.price, 0)

  return (
    <CartContext.Provider value={{ items, setItems, add, setQty, remove, clear, count, total, reviewing, openReview: () => setReviewing(true), closeReview: () => setReviewing(false) }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
