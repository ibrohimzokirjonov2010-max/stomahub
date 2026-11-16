// DEV-only: 0075 sinov ma’lumotlarini lokal ko‘rish/skrinshot (bazaga yozilmaydi). Prod build’ga kirmaydi.
// /test-seed-shot?to=/marketplace — ma’lumotni xotiraga yuklab, ko‘rsatilgan sahifaga o‘tadi.
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { __shotMarket, toMarketProduct } from '../buyerApi'
import { __shotCatalog } from '../recordSync'
import { applyPromotion } from '../lib/discounts'
import { tashkentToday } from '../tashkentDate'
import { USERS, PRODUCTS, FORMA, JIHOZ, PROMOS, CATALOG } from '../../scripts/test-seed/data.mjs'

const T = tashkentToday()
const ends = new Date(Date.parse(T) + 45 * 864e5).toISOString().slice(0, 10)
const shop = (id) => USERS.find((u) => u.id === id)?.name || 'Sotuvchi'
const all = [...PRODUCTS, ...FORMA, ...JIHOZ]
const rows = all.map((p, i) => ({
  ...p, shop_name: shop(p.seller_id), rx_only: false, uom: 'dona', min_qty: 1, created_at: new Date(Date.now() - i * 60000).toISOString(),
  stock: p.variants.length ? p.variants.reduce((s, v) => s + v.stock, 0) : p.stock,
}))
const deals = PROMOS.map((r) => {
  const p = all.find((x) => x.id === r.product)
  return {
    kind: 'deal', owner_id: USERS[r.seller - 1].id, id: `sp-${r.id}`,
    payload: { id: `sp-${r.id}`, scope: 'product', title: r.title || null, name: p.name, brand: p.brand, banner: null, off: Math.round((1 - r.price / r.old_price) * 100),
      price: r.price, oldPrice: r.old_price, stock: p.stock, productId: p.id, sellerId: p.seller_id, startsOn: T, endsOn: ends, image: p.image_url, images: p.images,
      about: p.description, seller: { name: shop(p.seller_id), role: 'Sotuvchi' } },
  }
})
const catalog = [...CATALOG.map((r) => ({ kind: r.kind, id: r.id, owner_id: USERS[r.owner - 1].id, payload: r.payload })), ...deals]

export default function TestSeedShot() {
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  useEffect(() => {
    __shotCatalog?.(catalog)
    __shotMarket?.(rows.map(toMarketProduct).map((p) => applyPromotion(p, deals.map((d) => d.payload))))
    navigate(sp.get('to') || '/marketplace', { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
