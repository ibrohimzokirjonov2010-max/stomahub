/** Mobile Ishtirokchilar tab — values copied from the 390px artboard. */

export const MOBILE_SEMINAR = {
  topic: 'Implantologiya',
  title: 'Implantologiya: amaliy kurs',
  when: '21 oktabr 2026, 09:00 – 18:00',
  place: 'Toshkent City Kongress Markazi',
  image: '/images/seminars/smile.jpg',
  going: 42,
  seats: 50,
}

const TINTS = [
  ['#e5f6f3', '#0d8a84'],
  ['#f1e9ff', '#7c3aed'],
  ['#e7f0ff', '#2563eb'],
  ['#fff3e0', '#e08a00'],
  ['#eef1f4', '#64748b'],
  ['#e5f6f3', '#0d8a84'],
  ['#e7f0ff', '#3b82f6'],
  ['#f3e8ff', '#7c3aed'],
  ['#e7f8ef', '#16a34a'],
  ['#fff4e5', '#d0890b'],
  ['#f3e8ff', '#7c3aed'],
  ['#e5f6f3', '#0d8a84'],
]

/** First 12 rows are the artboard. The rest fill 42 / 40 / 2 / 0. */
const SHOWN = [
  ['AM', 'Aliyeva Mohira', '+998 90 123 45 67', 'Standart', 'paid'],
  ['KB', 'Karimov Bekzod', '+998 91 234 56 78', 'VIP', 'paid'],
  ['TD', 'Toirov Dilshod', '+998 93 345 67 89', 'Standart', 'paid'],
  ['SM', 'Saydova Malika', '+998 90 456 78 90', 'Standart', 'paid'],
  ['UJ', 'Usmonov Javohir', '+998 91 567 89 01', 'VIP', 'wait'],
  ['RS', 'Raximova Sevara', '+998 93 678 90 12', 'Standart', 'paid'],
  ['JA', 'Jalilov Akmal', '+998 90 789 01 23', 'Standart', 'paid'],
  ['ED', 'Eshmatova Dildora', '+998 91 890 12 34', 'VIP', 'paid'],
  ['NS', 'Normatov Sardor', '+998 93 901 23 45', 'Standart', 'wait'],
  ['QN', 'Qodirova Nilufar', '+998 90 012 34 56', 'Standart', 'paid'],
  ['SM', 'Sultonov Mirzo', '+998 91 123 45 67', 'VIP', 'paid'],
  ['YZ', 'Yusupova Zilola', '+998 93 234 56 78', 'Standart', 'paid'],
]

const EXTRA_GIVEN = ['Shahzod', 'Madina', 'Otabek', 'Kamola', 'Aziza', 'Bobur', 'Jasur', 'Nilufar', 'Bekzod', 'Dilshod']
const EXTRA_FAMILY = ['Ergashev', 'Nazarova', 'Soliyev', 'Abdullayeva', 'Hamidov', 'Karimova', 'Yuldasheva', 'Rahimova', 'Qodirov', 'Saidov']

export const MOBILE_PEOPLE = (() => {
  const rows = SHOWN.map((p, i) => ({
    id: i + 1,
    initials: p[0],
    name: p[1],
    phone: p[2],
    ticket: p[3],
    pay: p[4],
    tint: TINTS[i % TINTS.length],
  }))
  for (let i = 0; i < 30; i++) {
    const g = EXTRA_GIVEN[i % EXTRA_GIVEN.length]
    const f = EXTRA_FAMILY[i % EXTRA_FAMILY.length]
    const name = `${f} ${g}`
    rows.push({
      id: rows.length + 1,
      initials: `${f[0]}${g[0]}`,
      name,
      phone: `+998 9${i % 10} ${String(200 + i).padStart(3, '0')} ${String(10 + (i % 80)).padStart(2, '0')} ${String(10 + (i % 70)).padStart(2, '0')}`,
      ticket: i % 4 === 0 ? 'VIP' : 'Standart',
      pay: 'paid',
      tint: TINTS[(i + 3) % TINTS.length],
    })
  }
  return rows
})()

export const FACE = {
  1: '/images/seller-2.jpg',
  2: '/images/bemorlar/bemor-sardor.jpg',
  3: '/images/bemorlar/bemor-malika.jpg',
  4: '/images/seller-1.jpg',
  5: '/images/bemorlar/bemor-sevara.jpg',
  6: '/images/forma/man-teal.jpg',
  7: '/images/bemorlar/bemor-madina.jpg',
  8: '/images/seller-3.jpg',
}
