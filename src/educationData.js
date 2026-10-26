import { som } from './marketData'

const face = (n) => `/images/surplus/${n}.jpg`

export const directions = [
  ['all', 'Barchasi'],
  ['terapiya', 'Terapiya'],
  ['endo', 'Endodontiya'],
  ['impl', 'Implantologiya'],
  ['ortoped', 'Ortopediya'],
  ['orto', 'Ortodontiya'],
  ['paro', 'Parodontologiya'],
  ['digital', 'Digital stomatologiya'],
  ['klinika', 'Klinika boshqaruvi'],
]

export const levels = [
  ['all', 'Barchasi'],
  ['bosh', 'Boshlang‘ich'],
  ['orta', 'O‘rta'],
  ['ekspert', 'Ekspert'],
]

export const formats = [
  ['all', 'Barchasi'],
  ['video', 'Video dars'],
  ['kurs', 'Kurs'],
  ['vebinar', 'Vebinar'],
]

export const prices = [
  ['all', 'Barchasi'],
  ['free', 'Bepul'],
  ['paid', 'Pullik'],
]

export const sorts = {
  popular: 'Eng ommabop',
  fresh: 'Eng yangi',
  cheap: 'Arzonroq',
  rich: 'Qimmatroq',
}

const base = [
  { id: 'kompozit', title: 'Kompozit restavratsiya: qatlamli usul', about: 'Oldingi va orqa tishlarda estetik restavratsiya protokollari.', direction: 'terapiya', level: 'orta', format: 'kurs', price: 0, lessons: 12, hours: 6, rating: 4.9, reviews: 124, doctor: 'Dr. Kamola Abdulayeva', role: 'Estetik stomatolog', avatar: face('u3'), cover: '/images/seminars/smile.jpg', duration: '16:42', progress: { seen: 7, total: 12, pct: 62 } },
  { id: 'implant', title: 'Implantologiya: implantdan tojgacha', about: 'Diagnostika, implant joylashtirish va protezik bosqichlar.', direction: 'impl', level: 'ekspert', format: 'kurs', price: 450000, oldPrice: 600000, off: 25, lessons: 18, hours: 10, rating: 4.8, reviews: 86, doctor: 'Dr. Sardor Raximov', role: 'Implantolog, PhD', avatar: face('u1'), cover: '/images/seminars/surgery.jpg', duration: '22:15' },
  { id: 'endo', title: 'Mikroskop yordamida endodontiya', about: 'Mikroskopda ishlash va murakkab kanallar davolashi.', direction: 'endo', level: 'ekspert', format: 'kurs', price: 750000, lessons: 14, hours: 8, rating: 4.8, reviews: 72, doctor: 'Dr. Malika Karimova', role: 'Endodontist', avatar: face('u4'), cover: '/images/seminars/micro.jpg', duration: '18:05', progress: { seen: 5, total: 14, pct: 36 } },
  { id: 'dsd', title: 'Digital Smile Design: foto va wax-up', about: 'Raqamli rejalashtirish va bemor bilan muloqot.', direction: 'digital', level: 'orta', format: 'video', price: 550000, fresh: true, lessons: 18, hours: 5, rating: 4.7, reviews: 58, doctor: 'Dr. Javohir Ahmedov', role: 'Estetik stomatolog', avatar: face('u5'), cover: '/images/seminars/teeth.jpg', duration: '26:30' },
  { id: 'orto', title: 'Ortodontiyada zamonaviy protokollar', about: 'Tashxis, reja va aligner/breket davolash.', direction: 'orto', level: 'orta', format: 'kurs', price: 650000, lessons: 10, hours: 7, rating: 4.8, reviews: 64, doctor: 'Dr. Dilshod Tursunov', role: 'Ortodont', avatar: face('u6'), cover: '/images/seminars/aligner.jpg', duration: '16:12' },
  { id: 'sinus', title: 'Suyak augmentatsiyasi va sinus lifting', about: 'Amaliy video darslar va klinik holatlar.', direction: 'impl', level: 'ekspert', format: 'video', price: 890000, fresh: true, lessons: 9, hours: 6, rating: 4.9, reviews: 41, doctor: 'Dr. Aziza Mirzayeva', role: 'Jarroh', avatar: face('u3'), cover: '/images/hero-implant.jpg', duration: '24:18' },
  { id: 'paro', title: 'Parodontologiya: klinik yondashuv', about: 'Zamonaviy diagnostika va davolash protokollari.', direction: 'paro', level: 'orta', format: 'kurs', price: 480000, lessons: 11, hours: 6, rating: 4.6, reviews: 39, doctor: 'Dr. Farukh Khaydarov', role: 'Parodontolog', avatar: face('u1'), cover: '/images/seminar-2.jpg', duration: '15:36' },
  { id: 'klinika', title: 'Klinika boshqaruvi va marketing', about: 'Stomatologik klinikani samarali boshqarish.', direction: 'klinika', level: 'bosh', format: 'vebinar', price: 320000, lessons: 8, hours: 4, rating: 4.5, reviews: 52, doctor: 'Dr. Nodirbek Ismoilov', role: 'Klinika rahbari', avatar: face('seller'), cover: '/images/channels/office.jpg', duration: '20:40' },
]

const extra = [
  ['Bolalar stomatologiyasida birinchi qabul', 'terapiya', 'bosh', 'video', 0, 'Dr. Sevara Ahmedova', 'Pediatr stomatolog'],
  ['Bonding protokollari: qadam-baqadam', 'terapiya', 'orta', 'kurs', 280000, 'Dr. Kamola Abdulayeva', 'Estetik stomatolog'],
  ['Kanal topish va ishchi uzunlik', 'endo', 'bosh', 'video', 0, 'Dr. Malika Karimova', 'Endodontist'],
  ['Qayta davolash: murakkab kanallar', 'endo', 'ekspert', 'kurs', 920000, 'Dr. Malika Karimova', 'Endodontist'],
  ['CBCT asosida implant rejalash', 'impl', 'orta', 'video', 610000, 'Dr. Sardor Raximov', 'Implantolog, PhD'],
  ['Protez: vaqtinchalik tojdan doimiygacha', 'ortoped', 'orta', 'kurs', 540000, 'Dr. Javohir Ahmedov', 'Ortoped'],
  ['Raqamli skaner va dizayn', 'ortoped', 'bosh', 'vebinar', 260000, 'Dr. Sevara Ahmedova', 'Ortoped'],
  ['Aligner: case selection', 'orto', 'bosh', 'video', 0, 'Dr. Dilshod Tursunov', 'Ortodont'],
  ['Breketdan keyingi retensiya', 'orto', 'orta', 'kurs', 390000, 'Dr. Dilshod Tursunov', 'Ortodont'],
  ['Peri-implantit: profilaktika', 'paro', 'ekspert', 'kurs', 710000, 'Dr. Farukh Khaydarov', 'Parodontolog'],
  ['Gigiyena protokoli va motivatsiya', 'paro', 'bosh', 'video', 0, 'Dr. Aziza Mirzayeva', 'Gigiyenist'],
  ['Foto protokollar: klinik surat', 'digital', 'bosh', 'video', 180000, 'Dr. Javohir Ahmedov', 'Estetik stomatolog'],
  ['Wax-up va mock-up amaliyoti', 'digital', 'ekspert', 'kurs', 640000, 'Dr. Kamola Abdulayeva', 'Estetik stomatolog'],
  ['Bemorni qabul qilish skripti', 'klinika', 'bosh', 'vebinar', 0, 'Dr. Nodirbek Ismoilov', 'Klinika rahbari'],
  ['Narx siyosati va xizmat paketlari', 'klinika', 'orta', 'kurs', 350000, 'Dr. Nodirbek Ismoilov', 'Klinika rahbari'],
  ['Jamoa va assistentlar bilan ishlash', 'klinika', 'orta', 'vebinar', 290000, 'Dr. Sardor Raximov', 'Klinika rahbari'],
]

const extraCovers = ['/images/channels/kids.jpg', '/images/seminars/teeth.jpg', '/images/channels/cbct.jpg', '/images/seminars/micro.jpg', '/images/hero-implant.jpg', '/images/seminar-3.jpg', '/images/seminar-4.jpg', '/images/seminars/aligner.jpg', '/images/seminars/smile.jpg', '/images/seminar-2.jpg', '/images/channels/podcast.jpg', '/images/seminars/teeth.jpg', '/images/seminars/smile.jpg', '/images/channels/office.jpg', '/images/channels/office.jpg', '/images/surplus/hero.jpg']
const extraFaces = [face('u4'), face('u3'), face('u4'), face('u5'), face('u1'), face('u5'), face('u6'), face('u6'), face('u1'), face('u3'), face('seller'), face('u5'), face('u3'), face('seller'), face('u1'), face('u6')]

export const courses = [
  ...base.map((c, i) => ({ ...c, rank: i })),
  ...extra.map(([title, direction, level, format, price, doctor, role], i) => ({
    id: `c${i}`,
    title,
    about: 'Klinik holatlar, protokollar va amaliy mashqlar.',
    direction, level, format, price,
    lessons: 6 + (i % 8),
    hours: 3 + (i % 6),
    rating: [4.6, 4.7, 4.8, 4.9, 4.5][i % 5],
    reviews: 18 + i * 3,
    doctor, role,
    avatar: extraFaces[i],
    cover: extraCovers[i],
    duration: `${12 + (i % 15)}:${String(10 + (i % 40)).padStart(2, '0')}`,
    fresh: i % 7 === 0,
    rank: base.length + i,
  })),
]

export const continuing = [
  courses.find((c) => c.id === 'kompozit'),
  { id: 'implant-steps', title: 'Implant joylashtirish: bosqichma-bosqich', cover: '/images/seminars/surgery.jpg', duration: '22:15', progress: { seen: 9, total: 18, pct: 50 }, courseId: 'implant' },
  courses.find((c) => c.id === 'endo'),
]

export const certificates = [
  { title: 'Implantologiya: asosiy kurs', score: 'EMC 6 ball', date: '12.09.2024' },
  { title: 'Endodontiya master-klass', score: 'EMC 6 ball', date: '18.05.2024' },
  { title: 'Digital Smile Design', score: 'EMC 5 ball', date: '10.03.2024' },
]

export const why = [
  ['Amaliy va klinik yondashuv', 'Real klinik holatlar asosida'],
  ['Yetakchi mutaxassislardan', 'O‘zbekiston va xalqaro ekspertlar'],
  ['Sertifikat va CME ballari', 'Kasbiy rivojlanish uchun'],
  ['Istalgan vaqtda, istalgan qurilmada', 'Kompyuter, planshet yoki telefon orqali'],
]

export const money = (n) => (n ? som(n) : 'Bepul')
