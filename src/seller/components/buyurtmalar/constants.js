export const O_LABEL = { yangi: 'Yangi', tasdiqlandi: 'Tasdiqlangan', tayyorlanmoqda: 'Yig‘ilmoqda', yetkazilmoqda: 'Yetkazilmoqda', yetkazildi: 'Yetkazildi', bekor_qilindi: 'Bekor qilingan' }
export const O_NEXT = { yangi: ['tasdiqlandi', 'Tasdiqlash'], tasdiqlandi: ['tayyorlanmoqda', 'Yig‘ishni boshlash'], tayyorlanmoqda: ['yetkazilmoqda', 'Yetkazishga topshirish'], yetkazilmoqda: ['yetkazildi', 'Yetkazildi deb belgilash'] }
export const O_FLOW = ['yangi', 'tasdiqlandi', 'tayyorlanmoqda', 'yetkazilmoqda', 'yetkazildi']
export const DELIVERY = [['kuryer', 'Kuryer orqali yetkazish'], ['olib_ketish', 'Do‘kondan olib ketish'], ['pochta', 'Pochta orqali']]
export const O_TONE = { yangi: 'on', tasdiqlandi: 'on', tayyorlanmoqda: 'mid', yetkazilmoqda: 'mid', yetkazildi: 'on', bekor_qilindi: 'off' }
export const showPhone = (o) => o.source === 'manual' || !['yangi', 'bekor_qilindi'].includes(o.status)
export const phoneOf = (o) => (showPhone(o) ? o.customer_phone || '—' : '+998 ** *** ** **')
