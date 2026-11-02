import { netOf, commissionOf, payoutOf, isCash, isDelivered, realOrders, doneAt, payLabel } from '../../lib/metrics'
import { ShoppingCart, Percent, ArrowUp, Megaphone } from 'lucide-react'

export const TYPES = {
  tushum: { label: 'Buyurtma tushumi', mLabel: 'Sotuvdan tushum', icon: ShoppingCart },
  komissiya: { label: 'Komissiya 12%', mLabel: 'Komissiya (12%)', icon: Percent },
  reklama: { label: 'Reklama', mLabel: 'Reklama hisobi', icon: Megaphone },
  yechish: { label: 'Pul yechish', mLabel: 'Pul yechish', icon: ArrowUp },
}
const PST = { kutilmoqda: ['Kutilmoqda', 'off'], tolandi: ['Yechilgan', 'on'], rad_etildi: ['Rad etilgan', 'off'] }

// All money movements derived from real rows: delivered orders (income + commission), ad top-ups, payouts.
// Demo buyurtmalar kirmaydi; sana — yetkazilgan vaqt (metrics.doneAt), Analitika bilan bir xil.
export function transactions({ orders, payouts = [], adTopups = [] }) {
  const t = []
  realOrders(orders).filter(isDelivered).forEach((o) => {
    const at = doneAt(o)
    const qty = o.items.reduce((a, i) => a + Number(i.qty), 0)
    const desc = o.items.length ? `${o.items[0].name}${o.items.length > 1 ? ` va yana ${o.items.length - 1} ta` : ''} (${qty} dona)` : 'Buyurtma'
    if (isCash(o)) {
      // Naqd: pul sotuvchida; balansga ta’sir qilmaydi, faqat 12% komissiya qarzi ko‘rsatiladi
      t.push({ id: `o-${o.id}`, type: 'tushum', at, code: o.code, desc: `Naqd: ${desc}`, amount: netOf(o), status: ['Naqd — sizda', 'off'], order: o, offBalance: true })
      t.push({ id: `c-${o.id}`, type: 'komissiya', at, code: o.code, desc: 'Naqd buyurtma: platforma komissiyasi (to‘lanishi kerak)', amount: -commissionOf(o), status: ['Kutilmoqda', 'off'], order: o, offBalance: true })
      return
    }
    t.push({ id: `o-${o.id}`, type: 'tushum', at, code: o.code, desc: `${payLabel(o.payment_method)}: ${desc}`, amount: payoutOf(o) + commissionOf(o), status: ['Yakunlangan', 'on'], order: o })
    t.push({ id: `c-${o.id}`, type: 'komissiya', at, code: o.code, desc: 'Platforma komissiyasi', amount: -commissionOf(o), status: ['Ushlangan', 'on'], order: o })
  })
  adTopups.forEach((r) => t.push({ id: `r-${r.id}`, type: 'reklama', at: r.created_at, code: '', desc: 'Reklama hisobini to‘ldirish', amount: -Number(r.amount), status: ['Yakunlangan', 'on'] }))
  payouts.forEach((p) => t.push({ id: `p-${p.id}`, type: 'yechish', at: p.created_at, code: '', desc: p.note ? `Pul yechish: ${p.note}` : 'Balansdan pul yechish so‘rovi', amount: -Number(p.amount), status: PST[p.status] || PST.kutilmoqda, payout: p }))
  return t.sort((a, b) => String(b.at).localeCompare(String(a.at)))
}
/** Balans = balansga ta’sir qiluvchi operatsiyalar yig‘indisi (computeStats.balance bilan bir xil). */
export const balanceOf = (txs) => Math.max(0, txs.filter((t) => !t.offBalance && !(t.type === 'yechish' && t.status?.[0] === 'Rad etilgan')).reduce((a, t) => a + t.amount, 0))
export { netOf }
