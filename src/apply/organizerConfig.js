// Organizer (tashkilotchi) two-stage configs. Same StepForm/VerifyPanel as sellers, kind 'organizer'.
import { toE164 } from '../lib/phoneUz'
import { SELLER_APPLICATION, SELLER_REGISTER, UZ_REGIONS } from './sellerConfig'
import { canUseOrganizer } from '../sessionStore'
import { loadOrgPrefill } from './api'

export const ORG_DIRECTIONS = ['Terapevtik stomatologiya', 'Endodontiya', 'Jarrohlik va implantologiya', 'Ortopediya', 'Ortodontiya', 'Parodontologiya', 'Bolalar stomatologiyasi', 'Estetik stomatologiya', 'Dental laboratoriya', 'Klinika boshqaruvi', 'Aralash (bir nechta yo‘nalish)']

const req = (m) => (v) => (String(v ?? '').trim() ? '' : m)
const orgV = (v) => req('Tashkilot yoki brend nomini kiriting')(v) || (v.trim().length < 2 ? 'Juda qisqa' : v.length > 80 ? '80 belgidan oshmasin' : '')
const sf = (cfg, step, name) => cfg.steps.find((s) => s.id === step).fields.find((f) => f.name === name)

// Stage 1: short registration. Cabinet opens with Sozlamalar only.
const reg = SELLER_REGISTER.steps[0].fields
export const ORGANIZER_REGISTER = {
  kind: 'organizer',
  title: 'Tashkilotchi bo‘lish',
  subtitle: 'Seminar tashkilotchisi sifatida ro‘yxatdan o‘ting. Tasdiqlash hujjatlari keyinroq, seminar qo‘shishdan oldin so‘raladi.',
  submitLabel: 'Ro‘yxatdan o‘tish',
  initial: (p = {}, s = {}) => ({
    owner_name: s.owner_name || p.full_name || p.name || '', org_name: s.org_name || '',
    address: s.address ? s.address.replace(/\s*\[geo:[^\]]*\]/, '') : '', lat: null, lng: null,
    phone: s.phone || p.phone || '', telegram: s.telegram || '', instagram: s.instagram || '', logo_url: s.logo_url || '',
  }),
  steps: [
    { id: 'register', title: 'Tashkilot', heading: 'Tashkilotchi ma’lumotlari', fields: [
      { ...reg.find((f) => f.name === 'owner_name'), label: 'To‘liq ismingiz (F.I.Sh.)' },
      { name: 'org_name', label: 'Tashkilot yoki brend nomi', required: true, placeholder: 'Dental Academy', validate: orgV },
      { ...reg.find((f) => f.name === 'address'), label: 'Manzil', placeholder: 'Toshkent, Yunusobod, Amir Temur ko‘chasi 108' },
      { ...reg.find((f) => f.name === 'location'), hint: 'Ixtiyoriy — o‘quv markazi yoki ofis joyi' },
      { ...reg.find((f) => f.name === 'phone'), label: 'Ish telefoni' },
      { ...reg.find((f) => f.name === 'telegram'), placeholder: '@dentalacademy' },
      { ...reg.find((f) => f.name === 'instagram'), placeholder: '@dentalacademy' },
      { ...reg.find((f) => f.name === 'logo_url'), label: 'Logotip' },
    ] },
  ],
}

// Stage 2: verification (prefilled from stage 1 + organizer_settings).
const S = SELLER_APPLICATION
export const ORGANIZER_APPLICATION = {
  ...S,
  kind: 'organizer',
  title: 'Tashkilotchi bo‘lish',
  subtitle: 'StomaHub’da seminar o‘tkazish uchun ariza',
  requestRpc: 'request_organizer_role',
  requestArgs: () => ({}),
  cabinetPath: '/tashkilotchi',
  ui: {
    canUse: canUseOrganizer,
    status: (p) => p?.org_status,
    rejectReason: () => '',
    prefill: loadOrgPrefill,
    cabinetPath: '/tashkilotchi',
    settingsPath: '/tashkilotchi/sozlamalar',
    settingsLabel: 'Tashkilotchi sozlamalari',
    who: 'tasdiqlangan tashkilotchilar',
    why: 'Seminar qo‘shish va chipta sotishni boshlash uchun yuridik ma’lumotlar va hujjatlarni yuboring.',
    formSubtitle: 'Seminar qo‘shish uchun tashkilotingizni tasdiqlang. Ma’lumotlar ro‘yxatdan o‘tishdan olindi.',
    checklist: ['Tashkiliy shakl (YaTT yoki MChJ) va STIR', 'Guvohnoma (YaTT/MChJ ro‘yxatdan o‘tganlik)', 'Rahbar pasporti (ID-karta)'],
    nameLabel: 'Tashkilot',
  },
  initial: (p = {}, s = {}) => {
    const g = s.address ? s.address.match(/\[geo:(-?[\d.]+),(-?[\d.]+)\]/) : null
    return {
      full_name: s.owner_name || p.full_name || p.name || '', phone: s.phone || p.phone || '',
      email: /@telegram\.stomahub\.uz$/.test(p.email || '') ? '' : (s.email || p.email || ''),
      shop_name: s.org_name || '', category: '', description: s.description || '', region: '',
      address: (s.address || '').replace(/\s*\[geo:[^\]]*\]/, ''), lat: g ? +g[1] : null, lng: g ? +g[2] : null,
      instagram: s.instagram || '', telegram: s.telegram || '', website: s.website || '', legal_type: '', stir: '',
    }
  },
  steps: [
    { ...S.steps[0], fields: S.steps[0].fields.map((f) => (f.name === 'email' ? { ...f, placeholder: 'info@academy.uz' } : f)) },
    { id: 'org', title: 'Tashkilot', heading: 'Tashkilot haqida', fields: [
      { ...sf(S, 'shop', 'shop_name'), label: 'Tashkilot yoki brend nomi', placeholder: 'Dental Academy', validate: orgV },
      { ...sf(S, 'shop', 'category'), label: 'Asosiy yo‘nalish', options: ORG_DIRECTIONS, validate: req('Yo‘nalishni tanlang') },
      { ...sf(S, 'shop', 'description'), label: 'Tashkilot haqida', placeholder: 'Qanday seminarlar o‘tkazasiz, ma’ruzachilar, tajriba…' },
      { ...sf(S, 'shop', 'region'), options: UZ_REGIONS },
      { ...sf(S, 'shop', 'address'), placeholder: 'Yunusobod tumani, Amir Temur ko‘chasi 108' },
      { ...sf(S, 'shop', 'location'), hint: 'Xaritada o‘quv markazi yoki ofis joyini belgilang' },
      { ...sf(S, 'shop', 'instagram'), placeholder: '@dentalacademy' },
      { ...sf(S, 'shop', 'telegram'), placeholder: '@dentalacademy' },
      { ...sf(S, 'shop', 'website'), placeholder: 'dentalacademy.uz' },
    ] },
    S.steps[2],
    { id: 'docs', title: 'Hujjatlar', heading: 'Hujjatlar', docs: [
      { key: 'certificate', label: 'Guvohnoma', hint: 'YaTT guvohnomasi yoki MChJ ro‘yxatdan o‘tganlik guvohnomasi', required: true },
      { key: 'passport', label: 'Rahbar pasporti (ID-karta)', hint: 'Old va orqa tomoni ko‘rinadigan nusxa', required: true },
    ] },
  ],
  toRow: (v) => ({ ...S.toRow(v), phone: toE164(v.phone) }),
}
