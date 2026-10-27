/** DEV/shot fixtures for /admin-shot screenshots when RPCs are missing. */
const mask = '+998 ** *** ** **'
const img = (n, bg = 'CCFBF1') =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23${bg}' width='80' height='80'/%3E%3Ctext x='40' y='48' text-anchor='middle' fill='%230F766E' font-size='16' font-family='sans-serif' font-weight='700'%3E${n}%3C/text%3E%3C/svg%3E`

export const SHOT_USERS = {
  total: 24581,
  counts: { all: 24581, shifokor: 8932, talaba: 15649 },
  rows: [
    { id: 'u1', name: 'Alimov Sardor', user_type: 'shifokor', city: 'Toshkent shahri', created_at: '2026-10-28T14:27:00', phone: '+998901112233', blocked: false, avatar: null },
    { id: 'u2', name: 'Karimova Dilnoza', user_type: 'talaba', city: 'Samarqand', created_at: '2026-10-27T11:05:00', phone: '+998901112244', blocked: false, avatar: null },
    { id: 'u3', name: 'Tursunov Bekzod', user_type: 'shifokor', city: 'Farg‘ona', created_at: '2026-10-26T09:40:00', phone: '+998901112255', blocked: true, avatar: null },
    { id: 'u4', name: 'Rahimova Madina', user_type: 'talaba', city: 'Andijon', created_at: '2026-10-25T16:12:00', phone: '+998901112266', blocked: false, avatar: null },
    { id: 'u5', name: 'Usmonov Javlon', user_type: 'shifokor', city: 'Buxoro', created_at: '2026-10-24T10:00:00', phone: '+998901112277', blocked: false, avatar: null },
    { id: 'u6', name: 'Nazarova Sevara', user_type: 'talaba', city: 'Namangan', created_at: '2026-10-23T13:22:00', phone: '+998901112288', blocked: false, avatar: null },
    { id: 'u7', name: 'Qodirov Aziz', user_type: 'shifokor', city: 'Xorazm', created_at: '2026-10-22T08:15:00', phone: '+998901112299', blocked: false, avatar: null },
    { id: 'u8', name: 'Ismoilova Nilufar', user_type: 'talaba', city: 'Qashqadaryo', created_at: '2026-10-21T17:48:00', phone: '+998901112200', blocked: true, avatar: null },
    { id: 'u9', name: 'Ergashev Jasur', user_type: 'shifokor', city: 'Surxondaryo', created_at: '2026-10-20T12:30:00', phone: '+998901112211', blocked: false, avatar: null },
    { id: 'u10', name: 'Abdullayeva Mohira', user_type: 'talaba', city: 'Toshkent viloyati', created_at: '2026-10-19T15:05:00', phone: '+998901112222', blocked: false, avatar: null },
  ],
}

export const SHOT_USER_DETAIL = {
  id: 'u1', name: 'Alimov Sardor', user_type: 'shifokor', city: 'Toshkent shahri',
  phone: mask, email: '********@mail.uz', blocked: false, created_at: '2026-10-28T14:27:00',
  orders_count: 12, seminars_count: 3, address: 'Yunusobod tumani',
}

export const SHOT_SELLERS = {
  total: 214, counts: { all: 214, pending: 12, approved: 186, blocked: 16 },
  rows: [
    { id: 's1', name: 'Karimov Behzod', shop_name: 'MedStom', city: 'Toshkent', phone: mask, seller_status: 'pending', created_at: '2026-10-28T14:27:00', products_count: 48, rating: 4.8, avatar: null },
    { id: 's2', name: 'DentPro LLC', shop_name: 'DentPro', city: 'Samarqand', phone: mask, seller_status: 'approved', created_at: '2026-09-12T10:00:00', products_count: 120, rating: 4.6, avatar: null },
    { id: 's3', name: 'SmileLab', shop_name: 'SmileLab', city: 'Farg‘ona', phone: mask, seller_status: 'approved', created_at: '2026-08-01T09:00:00', products_count: 64, rating: 4.9, avatar: null },
    { id: 's4', name: 'OralTech', shop_name: 'OralTech', city: 'Andijon', phone: mask, seller_status: 'blocked', created_at: '2026-07-15T11:00:00', products_count: 22, rating: 3.2, avatar: null },
    { id: 's5', name: 'BioDent', shop_name: 'BioDent', city: 'Buxoro', phone: mask, seller_status: 'pending', created_at: '2026-10-30T08:00:00', products_count: 0, rating: null, avatar: null },
  ],
}

export const SHOT_ORGS = {
  total: 86, counts: { all: 86, pending: 5, approved: 74, blocked: 7 },
  rows: [
    { id: 'o1', name: 'Dental Academy', city: 'Toshkent', phone: mask, org_status: 'pending', created_at: '2026-10-29T12:00:00', seminars: 4, avatar: null },
    { id: 'o2', name: 'Implant School', city: 'Samarqand', phone: mask, org_status: 'approved', created_at: '2026-08-10T10:00:00', seminars: 12, avatar: null },
    { id: 'o3', name: 'Ortho Club', city: 'Namangan', phone: mask, org_status: 'approved', created_at: '2026-06-01T09:00:00', seminars: 8, avatar: null },
    { id: 'o4', name: 'ProDent Edu', city: 'Buxoro', phone: mask, org_status: 'blocked', created_at: '2026-05-20T14:00:00', seminars: 2, avatar: null },
  ],
}

export const SHOT_CAMPAIGNS = {
  total: 128, counts: { all: 128, moderatsiyada: 18, faol: 86, pauza: 14, rad: 10 },
  rows: [
    { id: 'c1', title: 'Chegirma kampaniyasi', shop_name: 'MedStom', status: 'moderatsiyada', budget: 2500000, created_at: '2026-10-30T11:00:00', image_url: img(1), phone: mask },
    { id: 'c2', title: 'Yangi implantlar', shop_name: 'DentPro', status: 'faol', budget: 5000000, created_at: '2026-10-20T09:00:00', image_url: img(2, '99F6E4'), phone: mask },
    { id: 'c3', title: 'Kuz aksiyasi', shop_name: 'SmileLab', status: 'pauza', budget: 1800000, created_at: '2026-10-10T15:00:00', image_url: img(3, '5EEAD4'), phone: mask },
    { id: 'c4', title: 'Seminar reklama', shop_name: 'OralTech', status: 'rad', budget: 900000, created_at: '2026-09-28T12:00:00', image_url: img(4, 'F0FDFA'), phone: mask },
  ],
}

export const SHOT_ORDERS = {
  total: 1245, counts: { all: 1245, yangi: 42, tayyorlanmoqda: 68, yetkazilmoqda: 95, yetkazildi: 980, bekor_qilindi: 60 },
  rows: [
    { id: '1', code: 'STQ-00128', created_at: '2026-10-31T16:24:00', customer_phone: mask, shop_name: 'MedStom', subtotal: 2450000, status: 'yetkazildi', payment_method: 'uzcard', image_url: img(1) },
    { id: '2', code: 'STQ-00127', created_at: '2026-10-31T14:18:00', customer_phone: mask, shop_name: 'DentPro', subtotal: 1750000, status: 'yetkazilmoqda', payment_method: 'humo', image_url: img(2, '99F6E4') },
    { id: '3', code: 'STQ-00126', created_at: '2026-10-31T11:03:00', customer_phone: mask, shop_name: 'SmileLab', subtotal: 980000, status: 'tayyorlanmoqda', payment_method: 'click', image_url: img(3, '5EEAD4') },
    { id: '4', code: 'STQ-00125', created_at: '2026-10-30T18:42:00', customer_phone: mask, shop_name: 'OralTech', subtotal: 3200000, status: 'yetkazildi', payment_method: 'payme', image_url: img(4, 'F0FDFA') },
    { id: '5', code: 'STQ-00124', created_at: '2026-10-30T15:11:00', customer_phone: mask, shop_name: 'DentPro', subtotal: 670000, status: 'bekor_qilindi', payment_method: 'uzcard', image_url: img(5, 'A7F3D0') },
  ],
}

export const SHOT_ESCROW = {
  summary: { held: 68430000, released: 412500000, commission: 57918000, orders_held: 205 },
  total: 205,
  rows: SHOT_ORDERS.rows.filter((r) => ['yangi', 'tasdiqlandi', 'tayyorlanmoqda', 'yetkazilmoqda'].includes(r.status) || r.status === 'yetkazilmoqda' || r.status === 'tayyorlanmoqda').map((r) => ({
    ...r, commission: Math.round(r.subtotal * 0.12), payout: Math.round(r.subtotal * 0.88),
  })),
}

export const SHOT_APPROVALS = {
  total: 69,
  counts: { sellers: 12, organizers: 5, ads: 18, products_count: 34, seminars: 0 },
  rows: [
    { id: 's1', kind: 'seller', title: 'MedStom', subtitle: 'Sotuvchi arizasi', sender: 'Karimov Behzod', phone: mask, city: 'Toshkent', sent_at: '2026-10-28T14:27:00', docs: 4, thumb: null },
    { id: 'o1', kind: 'organizer', title: 'Dental Academy', subtitle: 'Tashkilotchi arizasi', sender: 'Dental Academy', phone: mask, city: 'Toshkent', sent_at: '2026-10-29T12:00:00', docs: 0, thumb: null },
    { id: 'c1', kind: 'ad', title: 'Chegirma kampaniyasi', subtitle: 'E’lon moderatsiyasi', sender: 'MedStom', phone: mask, city: 'Toshkent', sent_at: '2026-10-30T11:00:00', docs: 0, thumb: img(1) },
    { id: 'p1', kind: 'product', title: 'Implant set Pro', subtitle: 'Mahsulot moderatsiyasi', sender: 'DentPro', phone: mask, city: 'Samarqand', sent_at: '2026-10-31T09:00:00', docs: 2, thumb: img(2, '99F6E4') },
  ],
}

export const SHOT_FINANCE = {
  turnover: 482650000, commission: 57918000, payout: 424732000, commission_rate: 0.12,
  payouts_pending: 18450000, payouts_paid: 312000000,
  by_method: [
    { method: 'uzcard', sum: 182400000, count: 420 },
    { method: 'humo', sum: 156200000, count: 380 },
    { method: 'click', sum: 86400000, count: 265 },
    { method: 'payme', sum: 57650000, count: 180 },
  ],
}

export const SHOT_PAYOUTS = {
  total: 48, counts: { all: 48, kutilmoqda: 12, tolandi: 30, rad_etildi: 6 },
  rows: [
    { id: 'po1', amount: 4500000, method: 'uzcard', status: 'kutilmoqda', note: 'Oktabr hisobi', created_at: '2026-10-31T10:00:00', shop_name: 'MedStom', phone: mask },
    { id: 'po2', amount: 8200000, method: 'humo', status: 'tolandi', note: '', created_at: '2026-10-28T12:00:00', shop_name: 'DentPro', phone: mask },
    { id: 'po3', amount: 2100000, method: 'click', status: 'rad_etildi', note: 'Rekvizit xato', created_at: '2026-10-25T09:00:00', shop_name: 'SmileLab', phone: mask },
    { id: 'po4', amount: 5600000, method: 'payme', status: 'kutilmoqda', note: '', created_at: '2026-10-30T16:00:00', shop_name: 'OralTech', phone: mask },
  ],
}

export const SHOT_COMPLAINTS = {
  total: 36, counts: { all: 36, yangi: 8, jarayonda: 11, yopildi: 17 },
  rows: [
    { id: 'c1', code: 'SHK-00012', subject: 'Noto‘g‘ri mahsulot yetkazildi', status: 'yangi', created_at: '2026-10-30T10:00:00', reporter_name: 'Alimov S.', reporter_phone: mask, body: 'Buyurtmada boshqa brend keldi.' },
    { id: 'c2', code: 'SHK-00011', subject: 'Kechikkan yetkazib berish', status: 'jarayonda', created_at: '2026-10-29T12:00:00', reporter_name: 'Karimova D.', reporter_phone: mask, body: '3 kundan beri kelmayapti.' },
    { id: 'c3', code: 'SHK-00010', subject: 'Sifat shikoyati', status: 'yopildi', created_at: '2026-10-28T09:00:00', reporter_name: 'Tursunov B.', reporter_phone: mask, body: 'Qadoq shikastlangan.', resolution: 'Qaytarib berildi.' },
  ],
}

export const SHOT_REPORTS = {
  turnover: 482650000, commission: 57918000, orders: 1245, users_new: 1248,
  daily: Array.from({ length: 31 }, (_, i) => ({ day: i + 1, sum: Math.round(8e6 + Math.abs(Math.sin(i * 0.7)) * 28e6 + (i % 5) * 2e6) })),
  top_sellers: [
    { shop: 'MedStom', orders: 186, sum: 98400000 },
    { shop: 'DentPro', orders: 152, sum: 81200000 },
    { shop: 'SmileLab', orders: 128, sum: 64500000 },
  ],
  categories: [
    { name: 'Materiallar', orders: 382, sum: 298400000 },
    { name: 'Implantlar', orders: 286, sum: 198400000 },
    { name: 'Uskunalar', orders: 214, sum: 162300000 },
  ],
}

export const SHOT_SETTINGS = {
  platform_name: 'StomaHub',
  tagline: 'Stomatologlar uchun yagona platforma',
  description: 'Stomatologiya materiallari, uskunalar va seminarlar marketplace.',
  site_url: 'https://stomahub.uz',
  contact_phone: '+998901112233',
  contact_email: 'info@stomahub.uz',
  primary_color: '#0F766E',
  commission_pct: 12,
  payment_methods: ['uzcard', 'humo', 'click', 'payme'],
  notify_orders: true, notify_sellers: true, notify_organizers: true, notify_complaints: true,
  twofa_required: true, ip_restrict: false,
}

export function shotRpc(name) {
  switch (name) {
    case 'admin_users_list': return SHOT_USERS
    case 'admin_user_detail': return SHOT_USER_DETAIL
    case 'admin_user_block': return { ok: true }
    case 'admin_sellers_list': return SHOT_SELLERS
    case 'admin_seller_application': return {
      id: 's1', name: 'Karimov Behzod Anvarovich', shop_name: 'MedStom', phone: mask, email: '********@mail.uz',
      city: 'Toshkent', address: 'Yunusobod', seller_status: 'pending', seller_docs: [],
      org_type: 'MChJ', stir: '309876543', categories: ['Materiallar', 'Asboblar'], created_at: '2026-10-28T14:27:00',
    }
    case 'admin_review_seller': return { ok: true }
    case 'admin_organizers_list': return SHOT_ORGS
    case 'admin_organizer_detail': return { ...SHOT_ORGS.rows[0], email: '********@mail.uz', address: 'Chilonzor', docs: [] }
    case 'admin_review_organizer': return { ok: true }
    case 'admin_campaigns_list': return SHOT_CAMPAIGNS
    case 'admin_campaign_detail': return { ...SHOT_CAMPAIGNS.rows[0], body: 'Chegirma tafsilotlari', start_at: '2026-11-01', end_at: '2026-11-30' }
    case 'admin_review_campaign': return { ok: true }
    case 'admin_orders_list': return SHOT_ORDERS
    case 'admin_order_detail': return { ...SHOT_ORDERS.rows[0], items: [{ name: 'Implant set', qty: 2, price: 1225000, image_url: img(1) }], commission: 294000, payout: 2156000 }
    case 'admin_escrow': return SHOT_ESCROW
    case 'admin_approvals_list': return SHOT_APPROVALS
    case 'admin_review_product': return { ok: true }
    case 'admin_finance': return SHOT_FINANCE
    case 'admin_payouts_list': return SHOT_PAYOUTS
    case 'admin_review_payout': return { ok: true }
    case 'admin_complaints_list': return SHOT_COMPLAINTS
    case 'admin_complaint_update': return { ok: true }
    case 'admin_reports': return SHOT_REPORTS
    case 'admin_settings_get': return SHOT_SETTINGS
    case 'admin_settings_set': return SHOT_SETTINGS
    default: return null
  }
}
