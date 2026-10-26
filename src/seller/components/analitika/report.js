import { netOf, commissionOf, STATUS, csvDownload } from '../../api'
import { dmy, som } from '../../format'
import { COLS, liveOrders, summary, productSales, RTYPES, inRange } from './lib'

const LBL = Object.fromEntries(COLS)
// har bir tur uchun qatorlar; ustunlar keyin tanlanadi
export function buildReport(type, r, cols, data) {
  const all = data.orders.filter((o) => inRange(o.created_at, r))
  const live = liveOrders(data.orders, r)
  const st = summary(live)
  let headers, rows
  if (type === 'mahsulotlar') {
    const ps = productSales(live, data.products)
    const views = (id) => data.adStats.filter((s) => s.product_id === id && s.day >= r.from && s.day <= r.to).reduce((a, s) => a + s.impressions, 0)
    headers = ['Mahsulot', 'Kategoriya', 'Narx', 'Sotilgan dona', 'Buyurtmalar', 'Sotuv summasi', 'Komissiya (12%)', 'Ko‘rishlar', 'Stok']
    rows = data.products.map((p) => { const s = ps.find((x) => x.id === p.id) || { qty: 0, sum: 0, orders: 0 }; return [p.name, p.category || '', p.price, s.qty, s.orders, s.sum, Math.round(s.sum * 0.12), views(p.id), p.stock] }).sort((a, b) => b[5] - a[5])
  } else if (type === 'mijozlar') {
    const m = new Map()
    live.forEach((o) => { const k = o.customer_id || o.customer_phone || o.customer_name; const x = m.get(k) || [o.customer_name, o.customer_phone, o.region || '', 0, 0, o.created_at]; x[3] += 1; x[4] += netOf(o); if (o.created_at > x[5]) x[5] = o.created_at; m.set(k, x) })
    headers = ['Mijoz', 'Telefon', 'Hudud', 'Buyurtmalar', 'Jami summa', 'Oxirgi buyurtma']
    rows = [...m.values()].sort((a, b) => b[4] - a[4]).map((x) => [...x.slice(0, 5), dmy(x[5])])
  } else if (type === 'komissiya') {
    headers = ['Sana', 'Buyurtma raqami', 'Holat', 'Sotuv summasi', 'Komissiya (12%)', 'Sizga to‘lanadi', 'To‘lov turi']
    rows = live.map((o) => [dmy(o.created_at), o.code, STATUS[o.status]?.label, netOf(o), commissionOf(o), netOf(o) - commissionOf(o), 'Naqd'])
    data.payouts.filter((p) => inRange(p.created_at, r)).forEach((p) => rows.push([dmy(p.created_at), 'Pul yechish', p.status === 'tolandi' ? 'To‘landi' : p.status === 'rad_etildi' ? 'Rad etildi' : 'Kutilmoqda', '', '', -Number(p.amount), 'Naqd']))
  } else {
    const src = type === 'buyurtmalar' ? all : live
    const use = COLS.map((c) => c[0]).filter((c) => cols.includes(c))
    headers = use.map((c) => LBL[c])
    rows = []
    src.forEach((o) => { const k = netOf(o) / (Number(o.subtotal) || 1); (type === 'buyurtmalar' ? [null] : o.items).forEach((it) => {
      const v = { sana: dmy(o.created_at), raqam: o.code, mijoz: o.customer_name, telefon: o.customer_phone, hudud: o.region || '', holat: STATUS[o.status]?.label, tolov: 'Naqd', chegirma: Number(o.discount_amount || 0),
        mahsulot: it ? it.name : o.items.map((i) => i.name).join(', '), soni: it ? Number(it.qty) : o.items.reduce((s, i) => s + Number(i.qty), 0), narx: it ? Number(it.price) : Number(o.subtotal),
        summa: it ? Math.round(Number(it.total ?? it.qty * it.price) * k) : netOf(o), komissiya: it ? Math.round(Number(it.total ?? it.qty * it.price) * k * 0.12) : commissionOf(o),
        kategoriya: it ? (data.products.find((p) => p.id === it.product_id)?.category || '') : '' }
      rows.push(use.map((c) => v[c]))
    }) })
  }
  return { headers, rows, stats: st, title: RTYPES.find((t) => t[0] === type)?.[1] || 'Hisobot' }
}

export function exportReport(rep, fmt, r) {
  const name = `${rep.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}_${r.from}_${r.to}`
  if (fmt === 'csv') return csvDownload(`${name}.csv`, [rep.headers, ...rep.rows])
  const esc = (t) => String(t ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
  const cell = (v) => (typeof v === 'number' ? Math.round(v).toLocaleString('ru-RU') : esc(v))
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(name)}</title><style>body{font:12px system-ui;color:#10283F;margin:24px}h1{font-size:18px;color:#0F766E;margin:0}p{color:#5C6E80}table{width:100%;border-collapse:collapse}th{background:#F0FDFA;text-align:left}th,td{padding:5px 6px;border-bottom:1px solid #DCE5E7}</style></head><body><h1>${esc(rep.title)} hisoboti</h1><p>${dmy(r.from)} – ${dmy(r.to)} · Sotuv summasi: ${som(rep.stats.sum)} · Buyurtmalar: ${rep.stats.count} · Komissiya (12%): ${som(rep.stats.commission)}</p><table><thead><tr>${rep.headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rep.rows.map((row) => `<tr>${row.map((v) => `<td>${cell(v)}</td>`).join('')}</tr>`).join('')}</tbody></table><script>onload=()=>print()</script></body></html>`)
  w.document.close()
}
