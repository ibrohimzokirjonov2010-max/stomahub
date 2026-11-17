// Avtomatik test (E2E) yozuvlari: ommaviy ro‘yxatlarda, bannerda va to‘g‘ridan-to‘g‘ri havolada ko‘rinmaydi.
// O‘chirilmaydi — faqat yashiriladi. Faqat aniq test nomlari: "E2E ...", "Live New ...", "Img Check ...", "[test]".
import { isTestSeedId } from './lib/testSeed.js'

const TEST_NAME = /(^|\s)e2e[\s_:-]|\[(test|e2e)\]|^\s*live new\b|^\s*img check\b|^\s*test (do‘kon|do'kon|shop|seminar|mahsulot)\b/i
const QA_TEST_NAME = /\bqa[\s_-]*test\b/i

/** StomaHub Market (Ibrohim aka rasmiy do‘koni) — ommaviy ro‘yxatdan hech qachon yashirilmaydi. */
export const STOMAHUB_MARKET_SELLER_ID = '142df471-3f96-42b1-b635-908e94c6b6c4'

export const isTestName = (v) => TEST_NAME.test(String(v || ''))
export const isQaTestName = (v) => QA_TEST_NAME.test(String(v || ''))
export const isTestProductRow = (r) => r?.is_test === true || isTestName(r?.name) || isTestName(r?.shop_name)
export const isTestShop = (info) => info?.is_test === true || isTestName(info?.shop_name)

function sellerIdOf(r) {
  return String(r?.seller_id || r?.sellerId || '').toLowerCase()
}

/** Marketplace vitrinasi / "N ta mahsulot sotuvda" banneri: seed/QA yashiriladi, StomaHub Market mahsulotlari qoladi. */
export function isHiddenMarketProductRow(r) {
  if (!r) return false
  if (sellerIdOf(r) === STOMAHUB_MARKET_SELLER_ID) return false
  return isTestProductRow(r)
    || isTestSeedId(r.id)
    || isTestSeedId(r.productId)
    || isTestSeedId(r.seller_id)
    || isTestSeedId(r.sellerId)
    || isQaTestName(r.name)
    || isQaTestName(r.shop_name)
}
