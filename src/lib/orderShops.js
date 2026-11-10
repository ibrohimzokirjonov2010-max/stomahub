// Buyurtma qatoridagi do‘kon va ko‘rinish yordamchilari.
// Do‘kon nomi profildan keladi (buyer_order_shops); mahsulotlar seller_order_items’dan.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isUuid = (v) => UUID.test(String(v || ''))

export function shopLabel(name) {
  const s = String(name || '').replace(/\s+/g, ' ').trim()
  return s || 'Sotuvchi'
}

function shopOf(shops, id) {
  if (!id || !shops) return ''
  if (typeof shops.get === 'function') return shops.get(id) || shops.get(String(id)) || ''
  return shops[id] || shops[String(id)] || ''
}

/** RPC / profil xaritasidagi do‘kon nomlarini buyurtma va har bir qatorga yozadi. */
export function attachOrderShops(orders, shops) {
  return (orders || []).map((order) => {
    const orderSeller = order?.sellerId || null
    const items = (order?.items || []).map((it) => {
      const sellerId = it?.sellerId || orderSeller || null
      const named = shopOf(shops, sellerId) || it?.shopName || (sellerId && sellerId === orderSeller ? order?.shopName : '') || order?.shopName
      return { ...it, sellerId, shopName: shopLabel(named) }
    })
    const sellerId = orderSeller || items.find((it) => it.sellerId)?.sellerId || null
    const names = [...new Set(items.map((it) => it.shopName).filter(Boolean))]
    const shopName = names.length === 1 ? names[0] : shopLabel(shopOf(shops, sellerId) || order?.shopName || names[0])
    return { ...order, sellerId, shopName, items }
  })
}

/** Bitta buyurtmadagi mahsulotlarni sotuvchi bo‘yicha guruhlaydi (bir nechta do‘kon bo‘lishi mumkin). */
export function groupOrderItems(order) {
  const items = Array.isArray(order?.items) ? order.items : []
  const groups = []
  const index = new Map()
  items.forEach((it) => {
    const sellerId = it?.sellerId || order?.sellerId || ''
    const shopName = shopLabel(it?.shopName || (sellerId && sellerId === order?.sellerId ? order?.shopName : '') || order?.shopName)
    const key = `${sellerId}::${shopName}`
    let group = index.get(key)
    if (!group) {
      group = { sellerId, shopName, items: [] }
      index.set(key, group)
      groups.push(group)
    }
    group.items.push(it)
  })
  if (!groups.length) groups.push({ sellerId: order?.sellerId || '', shopName: shopLabel(order?.shopName), items: [] })
  return groups
}

export function orderShopSummary(order) {
  const names = [...new Set(groupOrderItems(order).map((g) => g.shopName).filter(Boolean))]
  if (names.length <= 1) return names[0] || 'Sotuvchi'
  return `${names.length} ta do‘kon`
}

/** Qatordagi ko‘rinadigan rasmlar va yashiringanlar uchun +N. */
export function thumbPreview(items, limit = 3) {
  const list = Array.isArray(items) ? items.filter(Boolean) : []
  const cap = Math.max(1, Number(limit) || 3)
  const shown = list.slice(0, cap)
  return { shown, extra: Math.max(0, list.length - shown.length), total: list.length }
}

const PAY = { cash: 'Naqd', naqd: 'Naqd', click: 'Click', payme: 'Payme', uzcard: 'UZCARD', humo: 'HUMO' }

export function payMethodLabel(method) {
  return PAY[String(method || '').toLowerCase()] || 'Naqd'
}

export function deliveryModeLabel(mode) {
  return mode === 'pickup' ? 'Olib ketish' : 'Kuryer'
}

export function shopHref(sellerId) {
  return isUuid(sellerId) ? `/dokon/${sellerId}` : ''
}

export function productHref(productId) {
  return isUuid(productId) ? `/product/${productId}` : ''
}

export function orderHref(order) {
  const code = order?.id
  if (!code) return ''
  return `/buyurtma/kuzatish/${encodeURIComponent(String(code).replace(/^#/, ''))}`
}
