// Avtomatik test (E2E) yozuvlari: ommaviy ro‘yxatlarda, bannerda va to‘g‘ridan-to‘g‘ri havolada ko‘rinmaydi.
// O‘chirilmaydi — faqat yashiriladi. Faqat aniq test nomlari: "E2E ...", "Live New ...", "Img Check ...", "[test]".
const TEST_NAME = /(^|\s)e2e[\s_:-]|\[(test|e2e)\]|^\s*live new\b|^\s*img check\b|^\s*test (do‘kon|do'kon|shop|seminar|mahsulot)\b/i
export const isTestName = (v) => TEST_NAME.test(String(v || ''))
export const isTestProductRow = (r) => r?.is_test === true || isTestName(r?.name) || isTestName(r?.shop_name)
export const isTestShop = (info) => info?.is_test === true || isTestName(info?.shop_name)
