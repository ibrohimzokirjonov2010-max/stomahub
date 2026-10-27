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

const base = []

const extra = []

const extraCovers = ['/images/channels/kids.jpg', '/images/seminars/teeth.jpg', '/images/channels/cbct.jpg', '/images/seminars/micro.jpg', '/images/hero-implant.jpg', '/images/seminar-3.jpg', '/images/seminar-4.jpg', '/images/seminars/aligner.jpg', '/images/seminars/smile.jpg', '/images/seminar-2.jpg', '/images/channels/podcast.jpg', '/images/seminars/teeth.jpg', '/images/seminars/smile.jpg', '/images/channels/office.jpg', '/images/channels/office.jpg', '/images/surplus/hero.jpg']
const extraFaces = [face('u4'), face('u3'), face('u4'), face('u5'), face('u1'), face('u5'), face('u6'), face('u6'), face('u1'), face('u3'), face('seller'), face('u5'), face('u3'), face('seller'), face('u1'), face('u6')]

export const courses = []

export const continuing = []

export const certificates = []

export const why = [
  ['Amaliy va klinik yondashuv', 'Real klinik holatlar asosida'],
  ['Yetakchi mutaxassislardan', 'O‘zbekiston va xalqaro ekspertlar'],
  ['Sertifikat va CME ballari', 'Kasbiy rivojlanish uchun'],
  ['Istalgan vaqtda, istalgan qurilmada', 'Kompyuter, planshet yoki telefon orqali'],
]

export const money = (n) => (n ? som(n) : 'Bepul')
