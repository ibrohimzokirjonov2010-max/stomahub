// Forma o‘lchamlari: kiyim (XS–3XL), oyoq kiyim (EU 35–46) yoki bitta (universal) o‘lcham.
// Sof funksiyalar — tests/formaSeller.test.mjs.

export const SIZE_TYPES = [
  ['clothing', 'Kiyim (XS–3XL)'],
  ['shoe', 'Oyoq kiyim (EU 35–46)'],
  ['one', 'Bitta o‘lcham (universal)'],
]
export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']
export const SHOE_SIZES = Array.from({ length: 12 }, (_, i) => String(35 + i))
export const ONE_SIZE = 'Universal'

/** Kiyim o‘lchamlari jadvali (sm): o‘lcham, ko‘krak, bel, bo‘y. */
export const CLOTHING_CHART = [
  ['XS', '80–84', '62–66', '155–160'],
  ['S', '84–88', '66–70', '160–165'],
  ['M', '88–92', '70–74', '165–170'],
  ['L', '92–96', '74–78', '170–175'],
  ['XL', '96–102', '78–84', '175–180'],
  ['XXL', '102–108', '84–90', '180–185'],
  ['3XL', '108–114', '90–96', '185–190'],
]

/** Oyoq kiyim: EU o‘lcham → oyoq uzunligi (sm), standart EU jadvali (taxminiy). */
export const SHOE_CHART = [
  ['35', '22,0–22,5'],
  ['36', '23,0–23,5'],
  ['37', '23,5–24,0'],
  ['38', '24,0–24,5'],
  ['39', '25,0–25,5'],
  ['40', '25,5–26,0'],
  ['41', '26,0–26,5'],
  ['42', '26,5–27,0'],
  ['43', '27,5–28,0'],
  ['44', '28,0–28,5'],
  ['45', '28,5–29,0'],
  ['46', '29,5–30,0'],
]

const SHOE_WORDS = /poyabzal|oyoq\s*kiyim|klog|krossovka|tapochka|tapka|shippak|sabo|туфл|обув|сабо|кроксы/i
const ONE_WORDS = /universal|bitta\s*o.?lcham|one\s*size/i

/**
 * Mahsulotning o‘lcham turi. Aniq maydon (sizeType / size_type / forma.size_type) ustun;
 * bo‘lmasa — toifa va nom bo‘yicha: poyabzal/klog/krossovka/tapochka → 'shoe';
 * bitta o‘lchamli (yoki «Universal») qalpoq/fartuk/aksessuar → 'one'; qolgani — 'clothing'.
 */
export function sizeTypeOf(p) {
  if (!p) return 'clothing'
  const explicit = p.sizeType || p.size_type || p.forma?.size_type
  if (explicit === 'shoe' || explicit === 'clothing' || explicit === 'one') return explicit
  const sizes = Array.isArray(p.sizes) ? p.sizes.map(String) : []
  const text = `${p.title || ''} ${p.name || ''}`
  if (p.cat === 'shoe' || SHOE_WORDS.test(text)) return 'shoe'
  if (sizes.some((s) => ONE_WORDS.test(s))) return 'one'
  if (['cap', 'apron', 'accessory'].includes(p.cat) && sizes.length <= 1) return 'one'
  return 'clothing'
}

/** Tanlash uchun o‘lchamlar: oyoq kiyimda faqat EU raqamlar, bitta o‘lchamda «Universal». */
export function sizesFor(p) {
  if (!p) return []
  const type = sizeTypeOf(p)
  const raw = Array.isArray(p.sizes) ? p.sizes.map(String) : []
  if (type === 'shoe') {
    const nums = raw.filter((x) => SHOE_SIZES.includes(x))
    return nums.length ? nums : SHOE_SIZES
  }
  if (type === 'one') return [ONE_SIZE]
  return raw.filter((x) => !SHOE_SIZES.includes(x) && !ONE_WORDS.test(x))
}

/** Sotuvchi formasida o‘lcham turiga mos variantlar. */
export const sizeOptionsFor = (type) => (type === 'shoe' ? SHOE_SIZES : type === 'one' ? [ONE_SIZE] : CLOTHING_SIZES)

/** Jadval: { title, head, rows } yoki null (bitta o‘lchamda jadval yo‘q). */
export function sizeChartFor(p) {
  const type = sizeTypeOf(p)
  if (type === 'one') return null
  if (type === 'shoe') return { type, title: 'Oyoq kiyim o‘lchami', head: ['EU o‘lcham', 'Oyoq uzunligi (sm)'], rows: SHOE_CHART, note: 'Oyoqni tovondan eng uzun barmoq uchigacha o‘lchang. Ikki o‘lcham orasida bo‘lsangiz, kattasini tanlang.' }
  return { type, title: 'O‘lchamlar jadvali (sm)', head: ['O‘lcham', 'Ko‘krak', 'Bel', 'Bo‘y'], rows: CLOTHING_CHART, note: '' }
}

/** Jadval qatori shu o‘lchamga mosmi (2XL = XXL). */
export const chartKey = (s) => (s === '2XL' ? 'XXL' : String(s))
