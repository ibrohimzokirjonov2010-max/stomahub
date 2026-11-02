// Mehmon savatini (localStorage) hisob savatiga qo‘shish: bir xil mahsulot+variant takrorlanmaydi, kattaroq miqdor qoladi
const lineKey = (it) => String(it?.id ?? '') + '|' + String(it?.variant || '')

export function mergeCarts(account, guest) {
  const out = (account || []).map((it) => ({ ...it }))
  for (const g of guest || []) {
    const i = out.findIndex((it) => lineKey(it) === lineKey(g))
    if (i === -1) out.push({ ...g })
    else out[i] = { ...out[i], qty: Math.max(Number(out[i].qty) || 0, Number(g.qty) || 0) }
  }
  return out
}
