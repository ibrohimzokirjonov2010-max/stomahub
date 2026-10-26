export const som = (n) => `${Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/\u00a0|,/g, ' ')} so‘m`
export const num = (n) => Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/\u00a0|,/g, ' ')
const pad = (n) => String(n).padStart(2, '0')
export const dmy = (d) => { const x = new Date(d); return `${pad(x.getDate())}.${pad(x.getMonth() + 1)}.${x.getFullYear()}` }
export const hm = (d) => { const x = new Date(d); return `${pad(x.getHours())}:${pad(x.getMinutes())}` }
export const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
export const longDate = (d) => { const x = new Date(d); return `${x.getDate()}-${MONTHS[x.getMonth()]} ${x.getFullYear()}, ${hm(x)}` }
export const monthTitle = (d) => { const m = MONTHS[d.getMonth()]; return `${m[0].toUpperCase()}${m.slice(1)} ${d.getFullYear()}` }
export const maskPhone = (p) => (p ? '+998 ** *** ** **' : '—')
export const itemsLabel = (n) => `${n} ta mahsulot`
