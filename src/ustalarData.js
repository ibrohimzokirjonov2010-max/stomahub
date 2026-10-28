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

const extras = []

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
    reviewList: m.reviewList || [],
    bars: m.bars || [0, 0, 0, 0, 0],
  }
}

export const statusLabel = { online: 'Onlayn', soon: '5 daqiqada kelaman', offline: 'Offlayn' }
