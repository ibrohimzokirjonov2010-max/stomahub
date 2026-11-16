// Sinov (test) ma’lumotlari — 0075_test_seed.sql. Hammaga ko‘rinadi, lekin buyurtma/ro‘yxatdan o‘tish yopiq.
// Barcha sinov ID’lari (foydalanuvchi, mahsulot, kurs, aksiya) shu prefiks bilan boshlanadi; server ham
// seed_batch ustuni orqali bloklaydi (0075). O‘chirish: 0076_test_seed_cleanup.sql.
export const TEST_SEED_BATCH = 'test-2026-11'
export const TEST_ID_PREFIX = '7e57d000-0000-4000-'
export const TEST_ORDER_TEXT = 'Hozircha buyurtma qabul qilinmaydi'
export const TEST_CHIP_TEXT = 'Sotuvda emas'

// Savat qatori ID si ham bo‘lishi mumkin: "forma-<mahsulot id>-<rang>-<o‘lcham>"
export const isTestSeedId = (id) => typeof id === 'string' && id.toLowerCase().replace(/^forma-/, '').startsWith(TEST_ID_PREFIX)

/** Mahsulot (yoki savat qatori) sinov sotuvchisiga tegishlimi. */
export function isTestProduct(p) {
  if (!p) return false
  return isTestSeedId(p.sellerId) || isTestSeedId(p.seller_id) || isTestSeedId(p.productId) || isTestSeedId(p.id)
}

/** Seminar / kurs sinov tashkilotchisiga tegishlimi. */
export const isTestEvent = (s) => !!s && (isTestSeedId(s.organizerId) || isTestSeedId(s.organizer_id) || isTestSeedId(s.authorId) || isTestSeedId(s.id))

const pad = (n) => String(n).padStart(12, '0')
export const testUserId = (n) => `${TEST_ID_PREFIX}a000-${pad(n)}`
export const testProductId = (n) => `${TEST_ID_PREFIX}b000-${pad(n)}`
export const testCourseId = (n) => `${TEST_ID_PREFIX}c000-${pad(n)}`
export const testLessonId = (n) => `${TEST_ID_PREFIX}c100-${pad(n)}`
export const testPromoId = (n) => `${TEST_ID_PREFIX}d000-${pad(n)}`
/** Ulanib bo‘lmaydigan sinov raqami: +998 90 000 00 NN */
export const testPhone = (n) => `+998 90 000 00 ${String(n).padStart(2, '0')}`
