/** − bosilganda qancha qoladi: minQty yoki 1 dan past — 0 (savatdan olib tashlash). */
export function qtyAfterDec(qty, minQty = 1) {
  const q = Math.max(0, Number(qty) || 0)
  const min = Math.max(1, Number(minQty) || 1)
  return q <= min ? 0 : q - 1
}
