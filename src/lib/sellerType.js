// Sotuvchi turi (0065: profiles.seller_type): har bir do‘kon bitta yo‘nalishda ishlaydi.
// Sof funksiyalar — tests/sellerType.test.mjs. Server ham shu qoidani tekshiradi (seller_products_type_gate).
import { MARKET_CATEGORIES, FORMA_CATEGORY, JIHOZ_CATEGORY, normCategory } from '../config/productCatalog.js'

export const SELLER_TYPES = [
  {
    key: 'stomatologik', label: 'Stomatologik mahsulotlar', text: 'Materiallar, asboblar, sarf buyumlari',
    section: 'Marketplace', href: '/marketplace',
  },
  {
    key: 'forma', label: 'Tibbiy forma', text: 'Skrab, xalat, qalpoq, tibbiy poyabzal',
    section: 'Forma', href: '/forma',
  },
  {
    key: 'jihozlar', label: 'Jihozlar', text: 'Ustanovka, rentgen, skaner, avtoklav',
    section: 'Jihozlar', href: '/jihozlar',
  },
]
export const SELLER_TYPE_KEYS = SELLER_TYPES.map((t) => t.key)
export const DEFAULT_SELLER_TYPE = 'stomatologik'

/** Profil turi; ustun yo‘q yoki bo‘sh bo‘lsa — stomatologik (eski sotuvchilar shunday ishlaydi). */
export const sellerTypeOf = (profile) => (SELLER_TYPE_KEYS.includes(profile?.seller_type) ? profile.seller_type : DEFAULT_SELLER_TYPE)
export const sellerTypeInfo = (type) => SELLER_TYPES.find((t) => t.key === type) || SELLER_TYPES[0]

/** Tur tanlash oynasi: 0065 qo‘llangan (ustun bor), sotuvchi tasdiqlangan va turi hali tanlanmagan. */
export const needsSellerTypePick = (profile) =>
  !!profile && Object.prototype.hasOwnProperty.call(profile, 'seller_type') && !profile.seller_type
  && (profile.seller_status === 'approved' || profile.role === 'admin')

const FORMA_ONLY = [FORMA_CATEGORY]
const JIHOZ_ONLY = [JIHOZ_CATEGORY]
const STOMA = MARKET_CATEGORIES.filter((c) => c !== FORMA_CATEGORY && c !== JIHOZ_CATEGORY)

/** Shu turdagi do‘kon tanlay oladigan kategoriyalar. */
export function categoriesFor(type) {
  if (type === 'forma') return FORMA_ONLY
  if (type === 'jihozlar') return JIHOZ_ONLY
  return STOMA
}

/** Kategoriya qaysi turga tegishli. */
export function typeOfCategory(c) {
  const n = normCategory(c)
  if (n === FORMA_CATEGORY) return 'forma'
  if (n === JIHOZ_CATEGORY) return 'jihozlar'
  return 'stomatologik'
}

export const categoryAllowed = (type, c) => typeOfCategory(c) === (SELLER_TYPE_KEYS.includes(type) ? type : DEFAULT_SELLER_TYPE)

/** Turni almashtirish: boshqa turdagi (arxivlanmagan) mahsulotlar bo‘lsa — mumkin emas. */
export function typeChangeBlock(products, nextType) {
  const other = (products || []).filter((p) => p.status !== 'archived' && typeOfCategory(p.category) !== nextType)
  return other.length ? `Avval boshqa yo‘nalishdagi ${other.length} ta mahsulotni arxivlang yoki o‘chiring` : ''
}
