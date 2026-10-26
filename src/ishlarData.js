const img = (name) => `/images/ishlar/${name}.jpg`

const fmt = (n) => Number(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')
export const som = (n) => `${fmt(n)} so‘m`
export const pay = (a, b) => `${fmt(a)} – ${fmt(b)} so‘m`

export const cities = [
  ['toshkent', 'Toshkent'],
  ['samarqand', 'Samarqand'],
  ['buxoro', 'Buxoro'],
  ['andijon', 'Andijon'],
  ['fargona', 'Farg‘ona'],
  ['namangan', 'Namangan'],
  ['boshqa', 'Boshqa'],
]
export const cityName = Object.fromEntries(cities)

export const specs = [
  ['terapevt', 'Terapevt'],
  ['ortoped', 'Ortoped'],
  ['ortodont', 'Ortodont'],
  ['jarroh', 'Jarroh'],
  ['bolalar', 'Bolalar stomatologi'],
  ['gigiyenist', 'Gigiyenist'],
  ['texnik', 'Tish texnigi'],
  ['assistent', 'Assistent'],
  ['admin', 'Administrator'],
]
export const specName = Object.fromEntries(specs)

export const exps = [
  ['none', 'Tajriba talab qilinmaydi'],
  ['y1', '1–3 yil'],
  ['y3', '3–5 yil'],
  ['y5', '5+ yil'],
]
export const expName = Object.fromEntries(exps)

export const types = [
  ['full', 'To‘liq stavka'],
  ['part', 'Yarim stavka'],
  ['shift', 'Smenali'],
  ['remote', 'Masofaviy'],
]
export const typeName = Object.fromEntries(types)

export const sorts = { fresh: 'Eng yangi', pay: 'Maosh', exp: 'Tajriba' }
export const tips = [
  ['Rezyume qanday yoziladi?', 'Lavozim, klinika tajribasi va natijalarni qisqa yozing. Rasm va diplomni qo‘shing.'],
  ['Suhbatga tayyorgarlik', 'Klinika jihozlari va yo‘nalishi haqida oldindan o‘qing. Savollaringizni yozib boring.'],
  ['Maosh haqida maslahatlar', 'Shahar va tajriba oralig‘ini solishtiring. Stavka, smena va bonusni alohida so‘rang.'],
  ['Stomatologlar uchun karera imkoniyatlari', 'Terapiya, ortodontiya va implantologiya hozir eng ko‘p e’lon berayotgan yo‘nalishlar.'],
  ['Eng talabgir mutaxassisliklar', 'Terapevt, ortoped, jarroh-implantolog va bolalar stomatologi.'],
]
export const popularOrder = ['Smile Dental Clinic', 'DentaCare', 'Family Dental', 'Implant Plus', 'City Dental']
export const resumePhoto = img('ish-resume')

const gallery = [img('ish-reception'), img('ish-waiting'), img('ish-chair'), img('ish-hall')]

const job = (p) => ({
  type: 'full',
  exp: 'y1',
  top: false,
  phone: '+998 71 200 00 00',
  source: 'StomaHub',
  ...p,
  cityLabel: cityName[p.city],
})

export const jobs = [
  job({
    id: 'ortodont-smile', rank: 0, title: 'Ortodont stomatolog', clinic: 'Smile Dental Clinic', logo: 'SD',
    city: 'toshkent', district: 'Yunusobod', type: 'full', exp: 'y3', expLabel: '3+ yil',
    min: 12000000, max: 18000000, posted: '2 kun oldin', spec: 'ortodont', top: true, image: img('ish-smile'),
    about: 'Zamonaviy klinikada ortoped stomatolog kerak. Implant va protez yo‘nalishida tajribali shifokor.',
  }),
  job({
    id: 'terapevt-dentacare', rank: 1, title: 'Terapevt stomatolog', clinic: 'DentaCare', logo: 'DC',
    city: 'toshkent', district: 'Chilonzor', type: 'full', exp: 'y1', expLabel: '1–3 yil',
    min: 8000000, max: 12000000, posted: '1 kun oldin', spec: 'terapevt', image: img('ish-dentacare'),
    about: 'Klinikamizga terapevt stomatolog kerak. Zamonaviy jihozlar, doimiy bemorlar oqimi.',
  }),
  job({
    id: 'bolalar-family', rank: 2, title: 'Bolalar stomatologi', clinic: 'Family Dental', logo: 'FD',
    city: 'toshkent', district: 'Mirzo Ulug‘bek', type: 'full', exp: 'y3', expLabel: '3+ yil',
    min: 10000000, max: 15000000, posted: '3 kun oldin', spec: 'bolalar', image: img('ish-family'),
    about: 'Bolalar bilan ishlash tajribasiga ega, mehribon va mas’uliyatli shifokor izlaymiz.',
  }),
  job({
    id: 'jarroh-implant', rank: 3, title: 'Jarroh-implantolog', clinic: 'Implant Plus', logo: 'IP',
    city: 'toshkent', district: 'Shayxontohur', type: 'full', exp: 'y5', expLabel: '5+ yil',
    min: 18000000, max: 25000000, posted: '4 kun oldin', spec: 'jarroh', image: img('ish-implant'),
    about: 'Tajribali jarroh kerak. Straumann/Nobel tizimlari bilan ishlash tajribasi afzal.',
  }),
  job({
    id: 'assistent-city', rank: 4, title: 'Stomatolog assistent', clinic: 'City Dental', logo: 'CD',
    city: 'toshkent', district: 'Olmazor', type: 'shift', exp: 'none', expLabel: 'Tajriba talab qilinmaydi',
    min: 4000000, max: 6000000, posted: '1 hafta oldin', spec: 'assistent', image: img('ish-assistant'),
    about: 'Stomatolog assistenti lavozimiga qizlar tanlov. O‘qitish mavjud.',
  }),
  job({
    id: 'ortodont-newsmile', rank: 5, title: 'Ortodont', clinic: 'NewSmile', logo: 'NS',
    city: 'toshkent', district: 'Yakkasaroy', type: 'full', exp: 'y3', expLabel: '3–5 yil',
    min: 15000000, max: 22000000, posted: '1 hafta oldin', spec: 'ortodont', image: img('ish-newsmile'),
    about: 'Estetik ortodontiya yo‘nalishida tajribali shifokor izlaymiz.',
  }),
  job({
    id: 'admin-andijon', rank: 20, title: 'Stomatologiya klinikasi administratori kerak', clinic: 'Stomatologiya klinikasi', clinicLine: 'Stomatologiya klinikasi (OLX e‘loni)', logo: 'SK', verified: true, postedFact: 'Bugun',
    city: 'andijon', district: 'Semashko', type: 'full', exp: 'none', expLabel: 'Tajriba talab etilmaydi',
    min: 3000000, max: 3500000, posted: 'Bugun joylashtirildi', spec: 'admin', image: img('ish-reception'),
    about: 'Andijon shahridagi ish beruvchi stomatologiya klinikasi administrator lavozimiga xodim qidirmoqda. Ish turi: to‘liq stavka. Maosh: 3 000 000 – 3 500 000 UZS.',
    original: 'Andijon shahar semashko kochasi. Kompyuter da yaxshi ishlay olishi kerak.',
    source: 'OLX',
    sourceUrl: 'https://www.olx.uz/obyavlenie/rabota/stomatologiyaga-administrator-kerak-ID4w5Hn.html',
    phone: '+998 74 223 45 67',
    address: 'Andijon shahar, Semashko ko‘chasi',
    gallery,
    requirements: ['Kompyuterda ishlay olish', 'Muloqot madaniyati', 'Tajriba talab etilmaydi'],
    benefits: ['To‘liq ish kuni', 'Barqaror grafik', 'Klinika ichida o‘qitish'],
  }),
]

const named = [
  ...Array(11).fill('Smile Dental Clinic'),
  ...Array(5).fill('DentaCare'),
  ...Array(3).fill('Family Dental'),
  ...Array(4).fill('Implant Plus'),
  ...Array(4).fill('City Dental'),
]
const otherClinics = ['Nur Dental', 'Hayot Clinic', 'Sog‘lom Tabassum', 'Orzu Stom', 'Mega Dent', 'Asia Smile']
const cityPlan = [
  ...Array(122).fill('toshkent'),
  ...Array(24).fill('samarqand'),
  ...Array(18).fill('buxoro'),
  ...Array(15).fill('andijon'),
  ...Array(22).fill('fargona'),
  ...Array(14).fill('namangan'),
  ...Array(26).fill('boshqa'),
]
const districts = ['Yunusobod', 'Chilonzor', 'Mirzo Ulug‘bek', 'Shayxontohur', 'Yakkasaroy', 'Sergeli', 'Olmazor', 'Uchtepa']
const titles = {
  terapevt: 'Terapevt stomatolog',
  ortoped: 'Ortoped stomatolog',
  ortodont: 'Ortodont',
  jarroh: 'Jarroh-implantolog',
  bolalar: 'Bolalar stomatologi',
  gigiyenist: 'Gigiyenist',
  texnik: 'Tish texnigi',
  assistent: 'Stomatolog assistent',
  admin: 'Klinika administratori',
}
const photos = ['ish-smile', 'ish-dentacare', 'ish-family', 'ish-implant', 'ish-assistant', 'ish-newsmile']
const specKeys = specs.map(([k]) => k)
const expKeys = ['y1', 'y3', 'y5', 'none', 'y1', 'y3']
const typeKeys = ['full', 'full', 'full', 'part', 'shift', 'full', 'remote']
const posted = ['3 kun oldin', '5 kun oldin', '1 hafta oldin', '2 hafta oldin', 'Kecha']

cityPlan.forEach((city, i) => {
  const spec = specKeys[i % specKeys.length]
  const min = 4000000 + (i % 8) * 1500000
  const clinic = named[i] || otherClinics[i % otherClinics.length]
  jobs.push(job({
    id: `vakansiya-${i + 1}`,
    rank: 30 + i,
    title: titles[spec],
    clinic,
    logo: clinic.slice(0, 2).toUpperCase(),
    city,
    district: city === 'toshkent' ? districts[i % districts.length] : 'Markaz',
    type: typeKeys[i % typeKeys.length],
    exp: expKeys[i % expKeys.length],
    min,
    max: min + 3000000 + (i % 4) * 1000000,
    posted: posted[i % posted.length],
    spec,
    image: img(photos[i % photos.length]),
    about: `${cityName[city]}dagi klinikaga ${titles[spec].toLowerCase()} kerak. Zamonaviy jihozlar va rasmiy rasmiylashtirish.`,
  }))
})

export const resumes = [
  ['Madina Karimova', 'Terapevt stomatolog', 'Toshkent', '3 yil', '10 000 000 so‘m'],
  ['Jasur Toshpo‘latov', 'Jarroh-implantolog', 'Toshkent', '6 yil', '20 000 000 so‘m'],
  ['Dilnoza Aliyeva', 'Ortodont', 'Samarqand', '4 yil', '14 000 000 so‘m'],
  ['Aziza Rahimova', 'Bolalar stomatologi', 'Andijon', '2 yil', '9 000 000 so‘m'],
  ['Bekzod Nurmatov', 'Ortoped', 'Toshkent', '5 yil', '16 000 000 so‘m'],
  ['Malika Saidova', 'Gigiyenist', 'Farg‘ona', '1 yil', '6 000 000 so‘m'],
].map(([name, role, city, exp, salary], i) => ({ id: `cv-${i}`, name, role, city, exp, salary }))

export function getJob(id) {
  return jobs.find((j) => j.id === id) || null
}

export function viewOf(j) {
  return {
    original: j.original || '',
    sourceUrl: j.sourceUrl || '',
    address: j.address || `${j.cityLabel}${j.district ? `, ${j.district}` : ''}`,
    gallery: j.gallery || [j.image, ...gallery.slice(1, 3)],
    requirements: j.requirements || [
      j.exp === 'none' ? 'Tajriba talab qilinmaydi' : `${j.expLabel || expName[j.exp]} tajriba`,
      `${specName[j.spec]} yo‘nalishi`,
      'Jamoa bilan ishlash',
    ],
    benefits: j.benefits || ['Rasmiy ish', 'Zamonaviy jihozlar', 'Barqaror bemorlar oqimi'],
    aboutClinic: `${j.clinic} — ${j.cityLabel}dagi stomatologiya klinikasi. Hozir ochiq vakansiyalar mavjud.`,
  }
}

export function clinicCount(name) {
  return jobs.filter((j) => j.clinic === name).length
}
