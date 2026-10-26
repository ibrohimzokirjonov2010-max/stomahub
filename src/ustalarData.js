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

export const masters = [
  {
    id: 'sardor-rahimov',
    name: 'Sardor Rahimov',
    role: 'Stomatologik uskunalar bo‘yicha muhandis',
    city: 'Toshkent',
    district: 'Chilonzor',
    years: 9,
    jobs: 350,
    rating: 4.9,
    reviews: 125,
    status: 'online',
    cats: ['unit', 'handpiece', 'compressor', 'autoclave'],
    tags: ['Ustanovka', 'Uchlik/turbina', 'Kompressor', 'Avtoklav'],
    brands: ['Sirona', 'KaVo', 'Melag'],
    photo: photo('usta-sardor.jpg'),
    phone: '+998 90 123 45 67',
    telegram: 'sardor_usta',
    reply: '~20 daqiqa',
    services: [
      row('Chaqiruv (Toshkent)', '150 000 so‘m', 'Kafolat: 3 oy'),
      row('Turbina podshipnik almashtirish', 'dan 350 000 so‘m', 'Javob vaqti: ~20 daqiqa'),
      row('Ustanovka diagnostikasi', 'Bepul', 'Ish vaqti: 09:00–20:00'),
    ],
  },
  {
    id: 'dilshod-mavlonov',
    name: 'Dilshod Mavlonov',
    role: 'Rentgen va CBCT mutaxassisi',
    city: 'Toshkent',
    district: 'Yunusobod',
    years: 7,
    jobs: 280,
    rating: 4.8,
    reviews: 96,
    status: 'soon',
    cats: ['cbct', 'scan', 'install'],
    tags: ['Rentgen', 'CBCT', 'Skaner', 'O‘rnatish'],
    brands: ['Planmeca', 'Carestream', 'Vatech'],
    photo: photo('usta-dilshod.jpg'),
    phone: '+998 90 234 56 78',
    telegram: 'dilshod_cbct',
    reply: '~30 daqiqa',
    services: [
      row('Rentgen diagnostikasi', '200 000 so‘m', 'Kafolat: 6 oy'),
      row('CBCT kalibrovka', 'dan 500 000 so‘m', 'Javob vaqti: ~30 daqiqa'),
      row('Skaner o‘rnatish', '900 000 so‘m', 'Ish vaqti: 09:00–19:00'),
    ],
  },
  {
    id: 'azamat-iskandarov',
    name: 'Azamat Iskandarov',
    role: 'Avtoklav va sterilizatsiya uskunalari',
    city: 'Toshkent',
    district: 'Mirzo Ulug‘bek',
    years: 6,
    jobs: 210,
    rating: 4.7,
    reviews: 80,
    status: 'offline',
    cats: ['autoclave'],
    tags: ['Avtoklav', 'Melag', 'W&H', 'Sterilizatsiya'],
    brands: ['Melag', 'W&H'],
    photo: photo('usta-azamat.jpg'),
    phone: '+998 90 345 67 89',
    telegram: 'azamat_avtoklav',
    reply: '1 soat',
    services: [
      row('Avtoklav diagnostikasi', '150 000 so‘m', 'Kafolat: 6 oy'),
      row('Ta’mirlash', 'dan 400 000 so‘m', 'Javob vaqti: 1 soat'),
      row('Profilaktik servis', '300 000 so‘m', 'Ish vaqti: 09:00–21:00'),
    ],
  },
  {
    id: 'bobur-qodirov',
    name: 'Bobur Qodirov',
    role: 'Mikroskop va uchliklar bo‘yicha mutaxassis',
    city: 'Toshkent',
    district: 'Shayxontohur',
    years: 10,
    jobs: 420,
    rating: 4.9,
    reviews: 182,
    status: 'online',
    cats: ['handpiece', 'unit'],
    tags: ['Mikroskop', 'Uchlik/turbina', 'KaVo', 'NSK'],
    brands: ['KaVo', 'NSK', 'Carl Zeiss'],
    photo: photo('usta-bobur.jpg'),
    phone: '+998 90 456 78 90',
    telegram: 'bobur_micro',
    reply: '~20 daqiqa',
    services: [
      row('Mikroskop diagnostikasi', '300 000 so‘m', 'Kafolat: 3 oy'),
      row('Uchlik ta’miri', 'dan 250 000 so‘m', 'Javob vaqti: ~20 daqiqa'),
      row('Profilaktika', '150 000 so‘m', 'Ish vaqti: 09:00–18:00'),
    ],
  },
  {
    id: 'jasur-rahimov',
    name: 'Jasur Rahimov',
    role: 'Dental jihozlar ustasi',
    city: 'Toshkent',
    district: 'Yakkasaroy',
    years: 9,
    jobs: 366,
    rating: 4.9,
    reviews: 214,
    status: 'online',
    verified: true,
    cats: ['unit', 'compressor', 'autoclave', 'cbct', 'handpiece', 'install'],
    tags: ['Kreslo o‘rnatish', 'Kompressor ta’miri', 'Avtoklav servisi', 'Rentgen apparati', 'Turbinka ta’miri', 'Uchliklar', 'Profilaktik servis'],
    brands: ['SIRONA', 'KaVo', 'Fengdan', 'W&H', 'NSK', 'Planmeca', 'Carestream', 'Vatech'],
    photo: photo('usta-jasur.jpg'),
    phone: '+998 90 700 15 15',
    telegram: 'jasur_rahimov',
    reply: '~15 daqiqa',
    services: [
      row('Kreslo o‘rnatish', '1 500 000 so‘m', 'Kafolat: 6 oy'),
      row('Kompressor ta’miri', 'dan 450 000 so‘m', 'Javob vaqti: ~15 daqiqa'),
      row('Chaqiruv (Toshkent)', '100 000 so‘m', 'Ish vaqti: 09:00–18:00'),
    ],
    hours: { days: 'Dushanba – Shanba', time: '09:00 – 18:00', sun: 'Oldindan kelishuv bilan' },
    area: [['Toshkent shahri', '1–2 soat'], ['Toshkent viloyati', '1 kun'], ['Boshqa viloyatlar', '1–3 kun']],
    warranty: 'Bajarilgan ishlar uchun 6 oy kafolat. Agar muammo takrorlansa, bepul qayta ko‘riladi.',
    table: [
      ['Kreslo o‘rnatish', '1 500 000 so‘m', 'To‘liq o‘rnatish va sozlash'],
      ['Kompressor ta’miri', '450 000 so‘m dan', 'Diagnostika bepul'],
      ['Turbinka ta’miri', '250 000 so‘m', 'Podshipnik almashtirish'],
      ['Avtoklav profilaktikasi', '350 000 so‘m', 'Tozalash, tekshirish, sozlash'],
      ['Rentgen apparati ta’miri', '400 000 so‘m dan', 'Modelga qarab'],
      ['Chaqiruv (Toshkent)', '100 000 so‘m', 'Toshkent shahri bo‘yicha'],
    ],
    works,
    reviewList: [
      ['Dr. Sardor Ismoilov', 'Smile Dental Clinic', '12.12.2024', 5, 'Juda professional usta. Kreslomizni tez va sifatli o‘rnatib berdi. Tavsiya qilaman!'],
      ['Dr. Dilnoza Karimova', 'DentCare', '28.11.2024', 5, 'Kompressor ta’mirini qilgan, hozirgacha muammo yo‘q. Ishiga mas’uliyatli.'],
      ['Dr. Bekzod Numatov', 'Dental Plus', '15.11.2024', 5, 'Rentgen apparati diagnostikasini qilib berdi, muammoni aniq topdi va bartaraf etdi.'],
      ['Dr. Malika Saidova', 'City Dental', '02.11.2024', 4, 'Javob berishi tez, narxlari ham adolatli. Avtoklav profilaktikasini qildik, hammasi zo‘r.'],
    ],
    bars: [88, 8, 3, 1, 0],
  },
]

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
