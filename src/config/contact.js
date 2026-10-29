// StomaHub aloqa ma'lumotlari — faqat shu faylda saqlanadi.
// Haqiqiy raqam va havolalarni Ibrohim beradi. Bo'sh qiymat saytda ko'rsatilmaydi.
export const CONTACT_PHONE = '+998 99 188 73 30' // masalan: '+998 71 200 00 00'
export const CONTACT_PHONE_IS_PLACEHOLDER = !CONTACT_PHONE
export const CONTACT_PHONE_TEL = CONTACT_PHONE ? `tel:${CONTACT_PHONE.replace(/[^\d+]/g, '')}` : ''
export const CONTACT_EMAIL = 'info@stomahub.uz'
export const SOCIAL_LINKS = {
  Telegram: '', // masalan: 'https://t.me/stomahub'
  Instagram: '',
  YouTube: '',
  LinkedIn: '',
}
