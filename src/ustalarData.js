const photo = (name) => `/images/ustalar/${name.replace(/\.jpg$/, '')}.jpg`

export function money(n) {
  return `${Number(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m`
}

export const cats = [
  ['all', 'Barchasi'],
  ['unit', 'Ustanovka ta’miri'],
  ['handpiece', 'Uchlik/turbina ta’miri'],
  ['compressor', 'Kompressor'],
  ['autoclave', 'Avtoklav'],
  ['cbct', 'Rentgen va CBCT'],
  ['scan', 'Skaner va CAD/CAM'],
  ['install', 'O‘rnatish va montaj'],
]
export const catName = Object.fromEntries(cats)

export const cities = ['Toshkent', 'Samarqand', 'Andijon', 'Buxoro']
export const districts = ['Chilonzor', 'Yunusobod', 'Mirzo Ulug‘bek', 'Shayxontohur', 'Yakkasaroy', 'Sergeli', 'Uchtepa', 'Mirobod']
export const sorts = {
  popular: 'Eng mashhur',
  rating: 'Reyting',
  years: 'Tajriba',
  jobs: 'Bajarilgan ish',
}

const works = ['usta-work-chair.jpg', 'usta-work-hands.jpg', 'usta-work-auto.jpg', 'usta-work-wire.jpg', 'usta-work-xray.jpg'].map(photo)

const row = (name, price, meta) => ({ name, price, meta })

export const masters = []

const extras = [
  ['otabek-yusupov', 'Otabek Yusupov', 'Kompressor va havo tizimlari', 'Sergeli', 8, 190, 4.6, 54, 'online', ['compressor'], ['Kompressor', 'Cattani'], photo('usta-sardor.jpg'), 'Kompressor diagnostikasi', '180 000 so‘m'],
  ['sherzod-aliyev', 'Sherzod Aliyev', 'Intraoral skaner mutaxassisi', 'Mirobod', 5, 140, 4.8, 61, 'offline', ['scan'], ['Skaner', '3shape'], photo('usta-dilshod.jpg'), 'Skaner kalibrovka', '700 000 so‘m'],
  ['bekzod-tursunov', 'Bekzod Tursunov', 'O‘rnatish va montaj brigadasi', 'Uchtepa', 11, 510, 4.9, 143, 'soon', ['install', 'unit'], ['O‘rnatish', 'Ustanovka'], photo('usta-bobur.jpg'), 'Ustanovka montaji', '1 200 000 so‘m'],
  ['farrux-nazarov', 'Farrux Nazarov', 'Stomatologik kreslo ustasi', 'Yakkasaroy', 4, 98, 4.5, 33, 'online', ['unit'], ['Ustanovka', 'Fengdan'], photo('usta-sardor.jpg'), 'Kreslo ta’miri', '400 000 so‘m'],
  ['islom-qodirov', 'Islom Qodirov', 'Sterilizatsiya xonasi bo‘yicha usta', 'Chilonzor', 9, 260, 4.7, 77, 'offline', ['autoclave'], ['Avtoklav', 'Melag'], photo('usta-azamat.jpg'), 'Avtoklav profilaktikasi', '280 000 so‘m'],
  ['sanjar-ergashev', 'Sanjar Ergashev', 'Turbina va uchliklar ustasi', 'Yunusobod', 6, 175, 4.8, 69, 'online', ['handpiece'], ['Uchlik/turbina', 'NSK', 'W&H'], photo('usta-bobur.jpg'), 'Turbina ta’miri', '250 000 so‘m'],
  ['nodir-karimov', 'Nodir Karimov', 'Rentgen apparatlari muhandisi', 'Sergeli', 12, 330, 4.9, 118, 'soon', ['cbct'], ['Rentgen', 'CBCT', 'Planmeca'], photo('usta-dilshod.jpg'), 'Rentgen diagnostikasi', '220 000 so‘m'],
]

extras.forEach(([id, name, role, district, years, jobs, rating, reviews, status, cats, tags, image, service, price], i) => {
  masters.push({
    id, name, role, city: 'Toshkent', district, years, jobs, rating, reviews, status, cats, tags,
    brands: tags.slice(1),
    photo: image,
    phone: `+998 93 100 20 ${String(i + 10)}`,
    telegram: id.replace('-', '_'),
    reply: '~30 daqiqa',
    services: [
      row('Chaqiruv (Toshkent)', '120 000 so‘m', 'Kafolat: 3 oy'),
      row(service, price, 'Javob vaqti: ~30 daqiqa'),
      row('Diagnostika', i % 2 ? 'Bepul' : '100 000 so‘m', 'Ish vaqti: 09:00–18:00'),
    ],
  })
})

export const why = [
  ['Tekshirilgan mutaxassislar', 'Hujjat va portfolio ko‘rib chiqiladi'],
  ['Kafolatli xizmat', 'Bajarilgan ish yozma kafolat bilan'],
  ['Tezkor javob', 'Onlayn ustalar bir necha daqiqada javob beradi'],
  ['Shaffof narxlar', 'Chaqiruv va ish narxi oldindan ko‘rinadi'],
]

export function getUsta(id) {
  return masters.find((m) => m.id === id) || null
}

export function viewOf(m) {
  return {
    skills: m.tags,
    brands: m.brands,
    hours: m.hours || { days: 'Dushanba – Shanba', time: '09:00 – 18:00', sun: 'Oldindan kelishuv bilan' },
    area: m.area || [['Toshkent shahri', '1–2 soat'], ['Toshkent viloyati', '1 kun'], ['Boshqa viloyatlar', '1–3 kun']],
    warranty: m.warranty || 'Bajarilgan ishlar uchun 6 oy kafolat. Agar muammo takrorlansa, bepul qayta ko‘riladi.',
    table: m.table || m.services.map((s) => [s.name, s.price, s.meta]),
    works: m.works || works.slice(0, 4),
    reviewList: m.reviewList || [
      ['Dr. Aziza Karimova', 'Nur Clinic', '04.10.2026', 5, `${m.name} ishni o‘z vaqtida va sifatli bajardi.`],
      ['Dr. Jasur Toshpo‘latov', 'City Dental', '18.09.2026', 5, 'Narx oldindan aytilgan, qo‘shimcha to‘lov chiqmadi.'],
      ['Dr. Malika Saidova', 'Smile', '02.08.2026', 4, 'Javob tez, keyingi safar ham shu ustani chaqiramiz.'],
    ],
    bars: m.bars || [82, 11, 5, 2, 0],
  }
}

export const statusLabel = { online: 'Onlayn', soon: '5 daqiqada kelaman', offline: 'Offlayn' }
