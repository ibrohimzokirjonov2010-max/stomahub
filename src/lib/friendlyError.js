// Foydalanuvchiga hech qachon xom SQL/PostgREST xatosi ko‘rsatilmaydi.
const RAW = /query|function|relation|column|syntax|violates|constraint|permission denied|PGRST|JWT|null value|duplicate key|schema cache|operator|does not exist|plpgsql|destination|failed to fetch|networkerror|unexpected|undefined|TypeError/i

// Ma’lum DB cheklovlari → tushunarli o‘zbekcha matn (xom SQL hech qachon ko‘rsatilmaydi)
const KNOWN = [
  [/zaxirada yetarli/i, 'Omborda yetarli mahsulot qolmagan — miqdorni kamaytiring'],
  [/stock_check|stock.*(>=|non.?negative)/i, 'Qoldiq manfiy bo‘lishi mumkin emas'],
  [/surplus_price.*asl/i, 'Narx asl narxdan past bo‘lishi kerak'],
  [/surplus_price/i, 'Narxni kiriting'],
  [/surplus_expiry/i, 'Yaroqlilik muddati o‘tgan mahsulotni joylab bo‘lmaydi'],
  [/surplus_image/i, 'Kamida bitta rasm yuklang'],
  [/price_check|price.*(>|positive)/i, 'Narx 0 dan katta bo‘lishi kerak'],
  [/min_qty_check|min_qty/i, 'Minimal buyurtma miqdori noto‘g‘ri'],
  [/qty_check|quantity/i, 'Miqdor noto‘g‘ri'],
  [/duplicate key.*sku|sku.*unique/i, 'Bu SKU allaqachon mavjud — boshqa SKU kiriting'],
  [/duplicate key/i, 'Bunday yozuv allaqachon mavjud'],
  [/null value in column "?(\w+)/i, 'Majburiy maydon to‘ldirilmagan'],
  [/value too long/i, 'Matn juda uzun'],
  [/invalid input syntax for type (numeric|integer|bigint)/i, 'Raqam kiritilishi kerak bo‘lgan maydonda noto‘g‘ri qiymat'],
  [/invalid input syntax for type date|date\/time field value out of range/i, 'Sana noto‘g‘ri kiritilgan'],
  [/row-level security|permission denied/i, 'Bu amalni bajarishga ruxsatingiz yo‘q'],
  [/check constraint/i, 'Kiritilgan qiymatlardan biri noto‘g‘ri. Maydonlarni tekshiring'],
]
export function knownDbError(msg) {
  const m = String(msg || '')
  for (const [re, text] of KNOWN) if (re.test(m)) return text
  return ''
}

export function friendlyError(e, fallback = 'Xatolik yuz berdi. Birozdan so‘ng qayta urinib ko‘ring.') {
  const msg = (e && (e.message || e.error_description || e.hint)) || (typeof e === 'string' ? e : '')
  if (msg) console.warn('[xato]', msg)
  const known = knownDbError(msg)
  if (known && RAW.test(msg)) return known
  if (!msg || RAW.test(msg) || /[а-яё]/i.test(msg)) {
    if (/failed to fetch|networkerror/i.test(msg)) return 'Internet aloqasi yo‘q. Ulanishni tekshirib, qayta urinib ko‘ring.'
    return fallback
  }
  return msg
}
