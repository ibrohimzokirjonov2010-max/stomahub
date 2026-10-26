import { Box, FileText, UserRound, Star, Megaphone, Wallet } from 'lucide-react'
export const PERMS = [
  ['mahsulotlar', 'Mahsulotlar', 'Mahsulotlarni qo‘shish, tahrirlash', Box],
  ['buyurtmalar', 'Buyurtmalar', 'Buyurtmalarni ko‘rish va boshqarish', FileText],
  ['mijozlar', 'Mijozlar', 'Mijozlar ma’lumotlarini ko‘rish', UserRound],
  ['sharhlar', 'Sharhlar', 'Sharhlarni ko‘rish va javob berish', Star],
  ['reklama', 'Reklama', 'Reklama kampaniyalarini boshqarish', Megaphone],
  ['hamyon', 'Hamyon', 'To‘lovlar va pul yechish bo‘yicha ko‘rish', Wallet],
]
export const ROLES = ['Admin', 'Manager', 'Omborchi', 'Operator']
export const ROLE_LABEL = { Admin: 'Admin', Manager: 'Menejer', Omborchi: 'Omborchi', Operator: 'Operator' }
export const DEFAULT_PERMS = { Admin: PERMS.map((p) => p[0]), Manager: ['buyurtmalar', 'mijozlar'], Omborchi: ['mahsulotlar'], Operator: ['buyurtmalar', 'mijozlar'] }
export const NOTIFY = [
  ['yangi_buyurtma', 'Yangi buyurtma', 'Yangi buyurtma kelganda xabar berish'],
  ['holat', 'Buyurtma holati o‘zgarganda', 'Buyurtma holati yangilanganda xabar berish'],
  ['sharh', 'Yangi sharh', 'Mahsulotga yangi sharh qoldirilganda xabar berish'],
  ['pul', 'Pul yechish', 'Pul yechish bo‘yicha yangiliklar haqida xabar berish'],
  ['reklama', 'Reklama', 'Reklama kampaniyalari bo‘yicha xabar berish'],
  ['tizim', 'Tizim xabarlari', 'Muhim tizim yangiliklari haqida xabar berish'],
]
export const DEFAULT_NOTIFY = { yangi_buyurtma: true, holat: true, sharh: true, pul: true, reklama: false, tizim: true }
export const maskPhone = (p) => { const d = (p || '').replace(/\D/g, ''); return d ? `+${d.slice(0, 3)} ** *** ** ${d.slice(-2)}` : '—' }
export const initials = (n) => (n || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
