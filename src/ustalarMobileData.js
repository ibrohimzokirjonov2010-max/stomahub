import { getUsta, viewOf } from './ustalarData'
const img = (n) => `/images/${n}.jpg`
const U = (n) => img(`ustalar/${n}`)

export const som = (n) => `${Number(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m`

export const USTA_CATS = [
  ['all', 'Barchasi'],
  ['kreslo', 'Kreslo'],
  ['rentgen', 'Rentgen'],
  ['ornatish', 'O‘rnatish'],
  ['tamir', 'Ta’mirlash'],
  ['konsult', 'Konsultatsiya'],
]
export const USTA_CITIES = ['Toshkent', 'Samarqand', 'Andijon', 'Buxoro']

const SVC = {
  turbina: ['Turbina ta’miri', 'Tozalash, podshipnik almashtirish', U('usta-work-wire'), 'Turbina'],
  qolcha: ['Qo‘lcha ta’miri', 'Tozalash, moylash, detallar almashtirish', U('usta-work-wire'), 'Qo‘lcha'],
  mikromotor: ['Mikromotor ta’miri', 'Cho‘tka, rotor va kabel almashtirish', U('usta-work-hands'), 'Mikromotor'],
  endomotor: ['Endomotor ta’miri', 'Diagnostika va ta’mirlash', img('product-3'), 'Endomotor'],
  apeks: ['Apekslokator ta’miri', 'Kalibrovka, kabel va klips almashtirish', img('offer-endomotor'), 'Apekslokator'],
  ultrazvuk: ['Ultrazvuk skaler ta’miri', 'Generator, uchlik va LED ta’miri', img('product-4'), 'Ultrazvuk'],
  fizio: ['Fiziodispenser ta’miri', 'Diagnostika, plata ta’miri', img('offer-endomotor'), 'Fiziodispenser'],
  kreslo: ['Stomatologik kreslo ta’miri', 'Gidravlika, elektronika, umumiy servis', img('product-6'), 'Kreslo'],
  kresloOrnatish: ['Kreslo o‘rnatish', 'To‘liq montaj, ulash va sozlash', U('usta-work-chair'), 'O‘rnatish'],
  rentgen: ['Rentgen apparati ta’miri', 'Diagnostika, sensor va trubka tekshiruvi', U('usta-work-xray'), 'Rentgen'],
  cbct: ['CBCT kalibrovka', 'Fantom bilan kalibrovka, dasturiy sozlash', img('jihozlar/planmeca'), 'CBCT'],
  avtoklav: ['Avtoklav servisi', 'Tozalash, germetiklik, sensorlar', U('usta-work-auto'), 'Avtoklav'],
  kompressor: ['Kompressor ta’miri', 'Filtr, klapan va dvigatel servisi', img('jihozlar/cattani'), 'Kompressor'],
  konsult: ['Onlayn konsultatsiya', 'Muammoni video orqali aniqlash', U('usta-work-hands'), 'Konsultatsiya'],
}

const WORKS = [U('usta-work-wire'), U('usta-work-hands'), U('usta-work-chair'), U('usta-work-auto'), img('product-3'), img('product-6'), U('usta-work-xray'), img('product-4')]

const REVIEWS = []

const FACES = { [U('usta-sardor')]: '30% 12%', [U('usta-dilshod')]: '23% 15%', [U('usta-azamat')]: '26% 15%', [U('usta-bobur')]: '30% 15%', [U('usta-jasur')]: '30% 15%' }

const make = ({ services, works, reviewsFrom = 0, ...m }) => ({
  online: m.status === 'online',
  face: FACES[m.photo] || '50% 20%',
  clinic: m.role,
  warranty: '1 yil',
  speed: 'Tez',
  hours: 'Dush–Shan, 09:00–19:00',
  area: [['Toshkent shahri', '1–2 soat'], ['Toshkent viloyati', '1 kun'], ['Boshqa viloyatlar', '1–3 kun']],
  ...m,
  services: services.map(([k, price]) => {
    const [name, note, image, tag] = SVC[k]
    return { id: k, name, note, image, tag, price }
  }),
  priceFrom: Math.min(...services.map(([, p]) => p)),
  works,
  reviewsList: [...REVIEWS.slice(reviewsFrom), ...REVIEWS.slice(0, reviewsFrom)],
})

export const USTALAR = []

const priceNum = (v) => {
  if (typeof v === 'number') return v
  const n = Number(String(v || '').replace(/[^\d]/g, ''))
  return n > 0 ? n : String(v || '')
}

// /ustalar ro‘yxati (ustalarData.masters, katalogdan to‘ldiriladi) bilan bir xil id va ma’lumot
export function fromMaster(x) {
  if (!x) return null
  const v = viewOf(x)
  const h = v.hours
  return {
    ...x,
    online: x.status === 'online',
    face: FACES[x.photo] || '50% 20%',
    clinic: x.role,
    verified: x.verified ?? true,
    about: x.about || `${x.role}. ${x.years} yillik tajriba, ${x.jobs}+ bajarilgan ish.`,
    warranty: x.warrantyShort || '6 oy',
    speed: 'Tez',
    hours: typeof h === 'string' ? h : `${h.days}, ${h.time}`,
    area: v.area,
    brands: v.brands || [],
    tags: x.tags || [],
    works: v.works,
    reviewsList: [],
    services: (x.services || []).map((sv, i) => ({ id: `s${i}`, name: sv.name, note: sv.meta || '', image: v.works[i % v.works.length], tag: sv.name, price: priceNum(sv.price), priceText: typeof sv.price === 'string' ? sv.price.trim() : '' })),
  }
}

export const getUstaM = (id) => USTALAR.find((m) => m.id === id) || fromMaster(getUsta(id))
export const USTA_SPECS = [...new Set(USTALAR.flatMap((m) => m.services.map((s) => s.tag)))]
