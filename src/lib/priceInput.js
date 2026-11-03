// QA2-8: barcha narx maydonlari uchun yagona qoida — faqat raqam, ko‘rinishda 3 xonadan bo‘sh joy bilan.
export const priceDigits = (v) => String(v ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 12)
export const priceFmt = (v) => priceDigits(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
