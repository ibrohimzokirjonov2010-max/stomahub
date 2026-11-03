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
