export const platforms = [
  { key: 'all', label: 'Barchasi' },
  { key: 'tg', label: 'Telegram' },
  { key: 'yt', label: 'YouTube' },
  { key: 'ig', label: 'Instagram' },
  { key: 'pod', label: 'Podkast' },
]

export const topics = [
  ['all', 'Barchasi'],
  ['impl', 'Implantologiya'],
  ['endo', 'Endodontiya'],
  ['orto', 'Ortodontiya'],
  ['estet', 'Estetika'],
  ['market', 'Klinika marketingi'],
  ['jobs', 'Vakansiyalar'],
  ['sales', 'Material sotuvi'],
]

export const languages = [
  ['all', 'Barchasi'],
  ['uz', 'O‘zbek'],
  ['ru', 'Rus'],
  ['en', 'Ingliz'],
]

const langName = { uz: 'O‘zbek', ru: 'Rus', en: 'Ingliz' }

export const channels = [
  { id: 'stom-uz', name: 'Stomatologlar UZ', handle: '@stomatologlar_uz', platform: 'tg', subs: 24500, lang: 'uz', topic: 'jobs', tags: ['Umumiy', 'Klinik holatlar'], about: 'Klinik holatlar, protokollar, yangiliklar va hamkasblar tajribasi.', rating: 4.8, reviews: 310, verified: true, letter: 'UZ', color: '#1a73e8', cover: '/images/seminars/teeth.jpg', editor: true },
  { id: 'implant-club', name: 'Implant Club Tashkent', handle: '@implant_club_tashkent', platform: 'ig', subs: 18200, lang: 'uz', topic: 'impl', tags: ['Implantologiya', 'Jarrohlik'], about: 'Implantologiya bo‘yicha amaliy holatlar, jarrohlik videolari.', rating: 4.7, reviews: 210, verified: true, letter: 'IC', color: '#0b8a95', cover: '/images/seminars/surgery.jpg', saved: true },
  { id: 'endo-masters', name: 'Endo Masters', handle: '@endomasters', platform: 'tg', subs: 32100, lang: 'ru', topic: 'endo', tags: ['Endodontiya', 'Mikroskop'], about: 'Endodontiya: mikroskop, protokollar va klinik holatlar.', rating: 4.9, reviews: 176, verified: true, letter: 'EM', color: '#1565c0', cover: '/images/seminars/micro.jpg', editor: true, saved: true },
  { id: 'aesthetics', name: 'Dental Aesthetics', handle: '@dental.aesthetics.uz', platform: 'ig', subs: 41300, lang: 'uz', topic: 'estet', tags: ['Estetika', 'Smile design'], about: 'Estetik stomatologiya, smile design, kompozit va keramik restavratsiyalar.', rating: 4.6, reviews: 198, verified: false, letter: 'DA', color: '#e85d8c', cover: '/images/seminars/smile.jpg', editor: true, saved: true },
  { id: 'kamola', name: 'Dr. Kamola Dental', handle: '@dr.kamola_dental', platform: 'yt', subs: 96000, lang: 'uz', topic: 'jobs', tags: ['Umumiy', 'Davolash jarayoni'], about: 'Amaliy klinik videolar, davolash jarayoni bosqichma-bosqich.', rating: 4.8, reviews: 510, verified: false, avatar: '/images/surplus/u3.jpg', cover: '/images/seminar-4.jpg' },
  { id: 'talk', name: 'Dental Talk Podcast', handle: '@dental_talk', platform: 'pod', subs: 12500, lang: 'uz', topic: 'jobs', tags: ['Podkast', 'Xalqaro tajriba'], about: 'Stomatologlar uchun podkast: mutaxassislar bilan suhbatlar.', rating: 4.5, reviews: 98, verified: false, letter: 'DT', color: '#6d4ad6', cover: '/images/channels/podcast.jpg', editor: true },
  { id: 'marketing', name: 'Klinika Marketing', handle: '@clinic_marketing', platform: 'ig', subs: 27800, lang: 'uz', topic: 'market', tags: ['Marketing', 'Klinika boshqaruvi'], about: 'Klinika boshqaruvi, marketing va bemorlarni jalb qilish.', rating: 4.4, reviews: 71, verified: false, letter: 'KM', color: '#ef6c00', cover: '/images/channels/office.jpg', editor: true },
  { id: 'materials', name: 'Dental Materials UZ', handle: '@dental_materials_uz', platform: 'tg', subs: 15600, lang: 'uz', topic: 'sales', tags: ['Material sotuvi', 'Yangiliklar'], about: 'Stomatologik materiallar, yangiliklar va amaliy tavsiyalar.', rating: 4.5, reviews: 143, verified: false, letter: 'DM', color: '#1a73e8', cover: '/images/surplus/hero.jpg' },
  { id: 'orto', name: 'Ortodontiya UZ', handle: '@ortodontiya_uz', platform: 'ig', subs: 22400, lang: 'uz', topic: 'orto', tags: ['Ortodontiya', 'Aligner'], about: 'Aligner, breket va ortodontik davolash bo‘yicha amaliy holatlar.', rating: 4.7, reviews: 164, verified: false, letter: 'OU', color: '#00897b', cover: '/images/seminars/aligner.jpg' },
  { id: 'pedia', name: 'Pediatric Dentistry', handle: '@pedia_dentistry', platform: 'yt', subs: 17900, lang: 'en', topic: 'jobs', tags: ['Bolalar', 'Profilaktika'], about: 'Bolalar stomatologiyasi: davolash, profilaktika va ota-onalar bilan ishlash.', rating: 4.6, reviews: 88, verified: false, letter: 'PD', color: '#f9a825', cover: '/images/channels/kids.jpg' },
  { id: 'cbct', name: 'Radiology & CBCT', handle: '@radiology_cbct', platform: 'tg', subs: 14400, lang: 'ru', topic: 'endo', tags: ['Radiologiya', 'CBCT'], about: 'KT, CBCT va rentgen tahlili. Klinik holatlar va xatolar.', rating: 4.8, reviews: 121, verified: true, letter: 'RC', color: '#3949ab', cover: '/images/channels/cbct.jpg' },
  { id: 'surgery', name: 'Oral Surgery', handle: '@oral_surgery_uz', platform: 'yt', subs: 38100, lang: 'uz', topic: 'impl', tags: ['Jarrohlik', 'Implant'], about: 'Og‘iz bo‘shlig‘i jarrohligi va implant amaliyotlari, jonli holatlar.', rating: 4.7, reviews: 240, verified: false, letter: 'OS', color: '#c62828', cover: '/images/hero-implant.jpg' },
]

export const official = [
  { id: 'hub-news', name: 'StomaHub yangiliklari', handle: '@stomahub_news', subs: 12100, platform: 'tg', letter: 'S', color: '#0b8a95' },
  { id: 'hub-community', name: 'StomaHub Community', handle: '@stomahub_community', subs: 8400, platform: 'tg', letter: 'C', color: '#1a73e8' },
]

export const langLabel = (k) => langName[k] || k

export function subsFull(n) {
  return `${n.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} obunachi`
}

export function subsShort(n) {
  if (n >= 1000) {
    const v = n / 1000
    return `${Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1)}K obunachi`
  }
  return `${n} obunachi`
}
