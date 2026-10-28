// Seller application config. An organizer version = another config object with kind 'organizer'
// and requestRpc 'request_organizer_role'. RoleApplication renders any such config.
import { isCompleteUzPhone, toE164 } from '../lib/phoneUz'

export const UZ_REGIONS = ['Toshkent shahri', 'Toshkent viloyati', 'Andijon viloyati', 'Buxoro viloyati', 'Farg‘ona viloyati', 'Jizzax viloyati', 'Xorazm viloyati', 'Namangan viloyati', 'Navoiy viloyati', 'Qashqadaryo viloyati', 'Qoraqalpog‘iston Respublikasi', 'Samarqand viloyati', 'Sirdaryo viloyati', 'Surxondaryo viloyati']
export const SELLER_CATEGORIES = ['Stomatologik materiallar', 'Asbob-uskunalar', 'Stomatologik jihozlar', 'Implantlar va ortopediya', 'Ortodontiya', 'Gigiyena va sterilizatsiya', 'Bir martalik vositalar', 'Dental laboratoriya', 'Aralash (bir nechta yo‘nalish)']

const req = (m) => (v) => (String(v ?? '').trim() ? '' : m)
const url = (v) => !v || /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(v.trim()) ? '' : 'Havola noto‘g‘ri'
const handle = (v) => !v || /^@?[A-Za-z0-9_.]{3,32}$/.test(v.trim().replace(/^https?:\/\/(www\.)?(instagram\.com|t\.me)\//i, '')) ? '' : 'Foydalanuvchi nomi noto‘g‘ri'

const nameV = (v) => req('Ism-familiyani kiriting')(v) || (v.trim().length < 3 ? 'Ism juda qisqa' : '')
const shopV = (v) => req('Do‘kon nomini kiriting')(v) || (v.trim().length < 2 ? 'Juda qisqa' : v.length > 80 ? '80 belgidan oshmasin' : '')
const phoneV = (v) => (isCompleteUzPhone(v) ? '' : 'Telefon raqam to‘liq emas')

// Stage 1: short registration. Opens the cabinet with Sozlamalar only.
export const SELLER_REGISTER = {
  kind: 'seller',
  title: 'Sotuvchi bo‘lish',
  subtitle: 'Do‘koningizni ro‘yxatdan o‘tkazing. Tasdiqlash hujjatlari keyinroq, mahsulot qo‘shishdan oldin so‘raladi.',
  submitLabel: 'Ro‘yxatdan o‘tish',
  initial: (p = {}, s = {}) => ({
    owner_name: s.owner_name || p.full_name || p.name || '', shop_name: p.shop_name || '',
    address: s.address ? s.address.replace(/\s*\[geo:[^\]]*\]/, '') : '', lat: null, lng: null,
    phone: s.phone || p.phone || '', telegram: s.telegram || '', instagram: s.instagram || '', logo_url: s.logo_url || '',
  }),
  steps: [
    { id: 'register', title: 'Do‘kon', heading: 'Do‘kon ma’lumotlari', fields: [
      { name: 'owner_name', label: 'Egasining to‘liq ismi', required: true, placeholder: 'Aliyev Vali Karimovich', validate: nameV },
      { name: 'shop_name', label: 'Do‘kon nomi', required: true, placeholder: 'Dental Market', validate: shopV },
      { name: 'address', label: 'Do‘kon manzili', required: true, full: true, placeholder: 'Toshkent, Chilonzor, Bunyodkor ko‘chasi 12', validate: req('Manzilni kiriting') },
      { name: 'location', label: 'Xaritada belgilang', type: 'map', full: true, optional: true, hint: 'Ixtiyoriy — xaridorlar sizni oson topishi uchun' },
      { name: 'phone', label: 'Do‘kon ish telefoni', type: 'phone', required: true, validate: phoneV },
      { name: 'telegram', label: 'Telegram', placeholder: '@dentalmarket', optional: true, validate: handle },
      { name: 'instagram', label: 'Instagram', placeholder: '@dentalmarket', optional: true, validate: handle },
      { name: 'logo_url', label: 'Do‘kon logotipi', type: 'logo', optional: true, hint: 'PNG yoki JPG, 2 MB gacha' },
    ] },
  ],
}

// Stage 2: verification (prefilled from stage 1). Creates a seller_applications row.
export const SELLER_APPLICATION = {
  kind: 'seller',
  title: 'Sotuvchi bo‘lish',
  subtitle: 'StomaHub marketplace’da mahsulot sotish uchun ariza',
  requestRpc: 'request_seller_role',
  requestArgs: (v) => ({ p_shop_name: v.shop_name.trim() }),
  cabinetPath: '/sotuvchi',
  successText: 'Arizangiz qabul qilindi. 7 ish kuni ichida ko‘rib chiqib, siz bilan bog‘lanamiz.',
  title2: 'Tasdiqdan o‘ting',
  submitLabel: 'Arizani yuborish',
  initial: (p = {}, s = {}) => {
    const g = s.address ? s.address.match(/\[geo:(-?[\d.]+),(-?[\d.]+)\]/) : null
    return {
      full_name: s.owner_name || p.full_name || p.name || '', phone: s.phone || p.phone || '',
      email: /@telegram\.stomahub\.uz$/.test(p.email || '') ? '' : (p.email || ''),
      shop_name: p.shop_name || '', category: '', description: s.description || '', region: '',
      address: (s.address || '').replace(/\s*\[geo:[^\]]*\]/, ''), lat: g ? +g[1] : null, lng: g ? +g[2] : null,
      instagram: s.instagram || '', telegram: s.telegram || '', website: s.website || '', legal_type: '', stir: '',
    }
  },
  steps: [
    { id: 'contact', title: 'Aloqa', heading: 'Aloqa ma’lumotlari', fields: [
      { name: 'full_name', label: 'Rahbarning to‘liq ismi (F.I.Sh.)', required: true, placeholder: 'Aliyev Vali Karimovich', validate: nameV },
      { name: 'phone', label: 'Telefon raqam', type: 'phone', required: true, validate: phoneV },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'dokon@mail.uz', validate: (v) => req('Email kiriting')(v) || (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim()) ? '' : 'Email noto‘g‘ri') },
    ] },
    { id: 'shop', title: 'Do‘kon', heading: 'Do‘kon haqida', fields: [
      { name: 'shop_name', label: 'Do‘kon nomi', required: true, placeholder: 'Dental Market', validate: shopV },
      { name: 'category', label: 'Faoliyat turi', type: 'select', options: SELLER_CATEGORIES, required: true, validate: req('Faoliyat turini tanlang') },
      { name: 'description', label: 'Do‘kon tavsifi', type: 'textarea', required: true, full: true, placeholder: 'Qanday mahsulotlar sotasiz, qaysi brendlar, yetkazib berish…', validate: (v) => req('Tavsif yozing')(v) || (v.trim().length < 20 ? 'Kamida 20 ta belgi yozing' : v.length > 1000 ? '1000 belgidan oshmasin' : '') },
      { name: 'region', label: 'Hudud', type: 'select', options: UZ_REGIONS, required: true, validate: req('Hududni tanlang') },
      { name: 'address', label: 'Manzil', required: true, placeholder: 'Chilonzor tumani, Bunyodkor ko‘chasi 12', validate: req('Manzilni kiriting') },
      { name: 'location', label: 'Xaritadagi joylashuv', type: 'map', full: true, hint: 'Xaritada do‘kon yoki ombor joyini belgilang', validate: (_, v) => (v.lat != null ? '' : 'Xaritada joyni belgilang') },
      { name: 'instagram', label: 'Instagram', placeholder: '@dentalmarket', optional: true, validate: handle },
      { name: 'telegram', label: 'Telegram', placeholder: '@dentalmarket', optional: true, validate: handle },
      { name: 'website', label: 'Veb-sayt', placeholder: 'dentalmarket.uz', optional: true, full: true, validate: url },
    ] },
    { id: 'legal', title: 'Yuridik', heading: 'Yuridik ma’lumotlar', fields: [
      { name: 'legal_type', label: 'Tashkiliy shakl', type: 'choice', full: true, required: true, options: [['yatt', 'YaTT', 'Yakka tartibdagi tadbirkor'], ['mchj', 'MChJ', 'Mas’uliyati cheklangan jamiyat']], validate: req('Tashkiliy shaklni tanlang') },
      { name: 'stir', label: 'STIR (INN)', required: true, inputMode: 'numeric', maxLength: 9, placeholder: '9 ta raqam', hint: 'Soliq to‘lovchining identifikatsiya raqami', clean: (v) => v.replace(/\D/g, '').slice(0, 9), validate: (v) => (/^\d{9}$/.test(v) ? '' : 'STIR 9 ta raqamdan iborat bo‘lishi kerak') },
    ] },
    { id: 'docs', title: 'Hujjatlar', heading: 'Hujjatlar', docs: [
      { key: 'license', label: 'Guvohnoma / litsenziya', hint: 'YaTT guvohnomasi yoki MChJ ro‘yxatdan o‘tganlik guvohnomasi', required: true },
      { key: 'passport', label: 'Pasport yoki STIR nusxasi', hint: 'Rahbar pasporti (ID-karta) yoki STIR guvohnomasi', required: true },
    ] },
  ],
  toRow: (v) => ({
    full_name: v.full_name.trim(), phone: toE164(v.phone), email: v.email.trim().toLowerCase(),
    shop_name: v.shop_name.trim(), category: v.category, description: v.description.trim(),
    region: v.region, address: v.address.trim(), lat: v.lat, lng: v.lng,
    instagram: v.instagram.trim(), telegram: v.telegram.trim(), website: v.website.trim(),
    legal_type: v.legal_type, stir: v.stir,
  }),
  // values from a rejected application, for resubmission
  fromRow: (r) => ({
    full_name: r.full_name, phone: r.phone, email: r.email, shop_name: r.shop_name, category: r.category,
    description: r.description, region: r.region, address: r.address, lat: r.lat ?? null, lng: r.lng ?? null,
    instagram: r.instagram, telegram: r.telegram, website: r.website, legal_type: r.legal_type, stir: r.stir,
  }),
}
