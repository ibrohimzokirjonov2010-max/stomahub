// Yagona manba: O‘zbekiston hududlari (14 ta) va Toshkent shahri tumanlari (12 ta).
// Buyurtma, Ortiqcha materiallar va seminar formalari shu ro‘yxatdan foydalanadi. Standart shahar yo‘q.
export const UZ_REGIONS = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Andijon viloyati',
  'Buxoro viloyati',
  'Farg‘ona viloyati',
  'Jizzax viloyati',
  'Xorazm viloyati',
  'Namangan viloyati',
  'Navoiy viloyati',
  'Qashqadaryo viloyati',
  'Samarqand viloyati',
  'Sirdaryo viloyati',
  'Surxondaryo viloyati',
  'Qoraqalpog‘iston Respublikasi',
]

// Qisqa nom (ro‘yxat/filtrlar uchun): "Samarqand viloyati" → "Samarqand"
export const UZ_CITIES = [
  'Toshkent',
  'Toshkent viloyati',
  'Andijon',
  'Buxoro',
  'Farg‘ona',
  'Jizzax',
  'Urganch',
  'Namangan',
  'Navoiy',
  'Qarshi',
  'Samarqand',
  'Guliston',
  'Termiz',
  'Nukus',
]

export const TASHKENT_DISTRICTS = [
  'Bektemir tumani',
  'Chilonzor tumani',
  'Mirobod tumani',
  'Mirzo Ulug‘bek tumani',
  'Olmazor tumani',
  'Sergeli tumani',
  'Shayxontohur tumani',
  'Uchtepa tumani',
  'Yakkasaroy tumani',
  'Yangihayot tumani',
  'Yashnobod tumani',
  'Yunusobod tumani',
]

/** "Shayxontohur shahri" kabi noto‘g‘ri yozuvlarni "Shayxontohur tumani" ga keltiradi. */
export function normalizeDistrict(name = '') {
  const s = String(name || '').trim()
  if (!s) return ''
  const base = s.replace(/\s+(shahri|tumani|t\.|sh\.)$/i, '').toLowerCase()
  return TASHKENT_DISTRICTS.find((d) => d.toLowerCase().startsWith(base)) || s
}

export const isTashkentCity = (c = '') => /^toshkent( shahri)?$/i.test(String(c).trim())

// Buyurtma formasi uchun: shahar → tumanlar. Toshkent uchun 12 tuman, qolganlar uchun "Markaz" (aniq manzil matnda).
export const CHECKOUT_CITIES = Object.fromEntries(UZ_CITIES.map((c) => [c, c === 'Toshkent' ? TASHKENT_DISTRICTS : ['Markaz']]))
// Mobil ko‘rinish uchun qisqa tuman nomlari ("Chilonzor tumani" → "Chilonzor")
export const CHECKOUT_CITIES_SHORT = Object.fromEntries(Object.entries(CHECKOUT_CITIES).map(([c, l]) => [c, l.map((d) => d.replace(/ tumani$/, ''))]))
