import { Hospital, Stethoscope, FlaskConical } from 'lucide-react'
export const KINDS = [['klinika', 'Klinika', 'Stomatologiya klinikasi', Hospital], ['shifokor', 'Shifokor', 'Mustaqil shifokor', Stethoscope], ['laboratoriya', 'Laboratoriya', 'Dental laboratoriya', FlaskConical]]
export const KIND = Object.fromEntries(KINDS.map((k) => [k[0], k]))
export const REGIONS = {
  'Toshkent shahri': ['Toshkent'], 'Toshkent viloyati': ['Nurafshon', 'Chirchiq', 'Olmaliq', 'Angren', 'Bekobod'],
  'Samarqand viloyati': ['Samarqand', 'Kattaqo‘rg‘on'], 'Buxoro viloyati': ['Buxoro', 'Kogon'], 'Andijon viloyati': ['Andijon', 'Asaka'],
  'Farg‘ona viloyati': ['Farg‘ona', 'Qo‘qon', 'Marg‘ilon'], 'Namangan viloyati': ['Namangan'], 'Qashqadaryo viloyati': ['Qarshi', 'Shahrisabz'],
  'Surxondaryo viloyati': ['Termiz', 'Denov'], 'Jizzax viloyati': ['Jizzax'], 'Sirdaryo viloyati': ['Guliston', 'Yangiyer'],
  'Navoiy viloyati': ['Navoiy', 'Zarafshon'], 'Xorazm viloyati': ['Urganch', 'Xiva'], 'Qoraqalpog‘iston Respublikasi': ['Nukus'],
}
export const TAGS = ['Doimiy', 'Yangi', 'VIP', 'Ulgurji', 'Kechiktiradi']
export const initials = (n = '') => n.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'
// mijozga tegishli buyurtmalar: customer_id bo'yicha, eski buyurtmalar uchun telefon/ism bo'yicha
export const ordersOf = (c, orders) => orders.filter((o) => o.customer_id === c.id || (!o.customer_id && ((c.phone && o.customer_phone === c.phone) || (!c.phone && o.customer_name === c.name))))
export function statsOf(c, orders) {
  const list = ordersOf(c, orders)
  const valid = list.filter((o) => o.status !== 'bekor_qilindi')
  const sum = valid.reduce((s, o) => s + Math.max(0, Number(o.subtotal) - Number(o.discount_amount || 0)), 0)
  return { list, count: valid.length, sum, last: list[0]?.created_at || null, auto: valid.length >= 3 ? 'Doimiy' : 'Yangi' }
}
export const tagsOf = (c, st) => [...new Set([st.auto, ...(c.tags || [])])]
