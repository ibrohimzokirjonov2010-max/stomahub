// Faqat ko‘rinish uchun: “TOshkent” kabi tasodifiy Caps xatolarini “Toshkent” ga keltiradi. Bazadagi qiymat o‘zgarmaydi.
export const fixCaps = (s) => (typeof s === 'string'
  ? s.replace(/\b([A-ZÀ-Ý])([A-Z])([a-z‘ʻ'’][\w‘ʻ'’]*)/g, (_, a, b, rest) => a + b.toLowerCase() + rest)
  : s)
