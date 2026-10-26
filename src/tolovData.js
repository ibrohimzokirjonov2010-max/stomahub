const photo = (name) => `/images/bemorlar/${name}.jpg`

export const som = (n) => `${Number(n || 0).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m`

export const METHODS = [
  { id: 'Naqd', label: 'Naqd', bg: '#fff4cc', color: '#92600a', dot: '#f0b429', soft: '#fff8e6' },
  { id: 'Karta', label: 'Karta', bg: '#e5f7f1', color: '#0f766e', dot: '#2fbf9b', soft: '#eefbf6' },
  { id: 'Click', label: 'Click', bg: '#f1e8ff', color: '#6b3fa0', dot: '#7b68b8', soft: '#f7f1ff' },
  { id: 'Payme', label: 'Payme', bg: '#e7eeff', color: '#2546b8', dot: '#3d74d6', soft: '#f3f6ff' },
  { id: 'Otkazma', label: 'O‘tkazma', bg: '#eef2f6', color: '#334155', dot: '#64748b', soft: '#f4f7fa' },
]

export const methodOf = (id) => METHODS.find((m) => m.id === id) || METHODS[0]

export const STATUSES = {
  Tolandi: { label: 'To‘landi', bg: '#e5f7ea', color: '#17803d' },
  Qisman: { label: 'Qisman', bg: '#fff1df', color: '#c2410c' },
  Qaytarilgan: { label: 'Qaytarilgan', bg: '#fde8e8', color: '#dc2626' },
}

const PEOPLE = [
  ['Aliyeva Mohira', 'aliyeva-mohira', 'bemor-mohira', '+998 90 123 45 67'],
  ['Karimov Aziz', 'karimov-aziz', 'bemor-aziz', '+998 93 234 56 78'],
  ['Normatova Dilnoza', 'normatova-dilnoza', 'bemor-dilnoza', '+998 90 345 67 89'],
  ['Tursunov Bobur', 'tursunov-bobur', 'bemor-bobur', '+998 91 456 78 90'],
  ['Xudoyberdiyev Anvar', 'xudoyberdiyev-anvar', 'bemor-anvar', '+998 91 890 12 34'],
  ['Qodirova Aziza', 'qodirova-aziza', 'bemor-aziza', '+998 90 901 23 45'],
  ['Usmonov Davron', 'usmonov-davron', 'bemor-davron', '+998 93 012 34 56'],
  ['Ismoilova Madina', 'ismoilova-madina', 'bemor-madina', '+998 93 789 01 23'],
  ['Jabborova Sevara', 'jabborova-sevara', 'bemor-sevara', '+998 93 567 89 01'],
  ['Raximov Sardor', 'raximov-sardor', 'bemor-sardor', '+998 90 678 90 12'],
]

const row = (partial) => ({
  time: '10:00',
  chek: true,
  note: '',
  ...partial,
})

const designed = [
  row({
    id: 'tl-1', receipt: 'TL-00321', date: '20.10.2026', time: '09:40',
    name: 'Aliyeva Mohira', patientId: 'aliyeva-mohira', photo: photo('bemor-mohira'), phone: '+998 90 123 45 67',
    service: 'Konsultatsiya', amount: 200000, method: 'Naqd', status: 'Tolandi',
  }),
  row({
    id: 'tl-318', receipt: 'TL-00318', date: '20.10.2026', time: '14:32',
    name: 'Karimov Aziz', patientId: 'karimov-aziz', photo: photo('bemor-aziz'), phone: '+998 90 123 45 67',
    service: 'Plomba (36)', amount: 800000, method: 'Click', status: 'Tolandi',
    detail: {
      total: 850000,
      doctor: 'Dr. Malika Karimova',
      doctorRole: 'Stomatolog',
      doctorPhoto: photo('bemor-malika'),
      chair: 'Kreslo 2',
      lines: [
        { name: 'Kompozit plomba', tooth: '36', price: 600000, sum: 600000 },
        { name: 'Tish tozalash (professional)', tooth: '—', price: 250000, sum: 250000 },
      ],
      discount: 0,
      debt: 0,
      planId: 'DR-1042',
      planName: 'Karies davolash rejasi',
      note: 'Bemor full to‘lov qildi. Keyingi qabul — 2 haftadan so‘ng',
      history: [
        { title: 'To‘lov yaratildi', meta: '20.10.2026, 14:30', by: 'Admin: Nodirbek Isoqov' },
        { title: 'To‘lov muvaffaqiyatli qabul qilindi', meta: '20.10.2026, 14:32', by: 'Click orqali' },
      ],
    },
  }),
  row({
    id: 'tl-3', receipt: 'TL-00302', date: '19.10.2026', time: '11:15',
    name: 'Normatova Dilnoza', patientId: 'normatova-dilnoza', photo: photo('bemor-dilnoza'), phone: '+998 90 345 67 89',
    service: 'Endodontik davolash', amount: 1500000, method: 'Karta', status: 'Tolandi',
  }),
  row({
    id: 'tl-4', receipt: 'TL-00288', date: '18.10.2026', time: '16:05',
    name: 'Tursunov Bobur', patientId: 'tursunov-bobur', photo: photo('bemor-bobur'), phone: '+998 91 456 78 90',
    service: 'Implant (31)', amount: 4500000, method: 'Payme', status: 'Tolandi',
  }),
  row({
    id: 'tl-5', receipt: 'TL-00281', date: '18.10.2026', time: '13:20',
    name: 'Xudoyberdiyev Anvar', patientId: 'xudoyberdiyev-anvar', photo: photo('bemor-anvar'), phone: '+998 91 890 12 34',
    service: 'Koronka (14)', amount: 2800000, method: 'Karta', status: 'Qisman',
  }),
  row({
    id: 'tl-6', receipt: 'TL-00270', date: '17.10.2026', time: '10:45',
    name: 'Qodirova Aziza', patientId: 'qodirova-aziza', photo: photo('bemor-aziza'), phone: '+998 90 901 23 45',
    service: 'Professional tozalash', amount: 500000, method: 'Naqd', status: 'Tolandi',
  }),
  row({
    id: 'tl-7', receipt: 'TL-00255', date: '16.10.2026', time: '15:10',
    name: 'Usmonov Davron', patientId: 'usmonov-davron', photo: photo('bemor-davron'), phone: '+998 93 012 34 56',
    service: 'Nazorat', amount: 300000, method: 'Click', status: 'Tolandi',
  }),
  row({
    id: 'tl-8', receipt: 'TL-00240', date: '15.10.2026', time: '12:25',
    name: 'Ismoilova Madina', patientId: 'ismoilova-madina', photo: photo('bemor-madina'), phone: '+998 93 789 01 23',
    service: 'Ortodontik maslahat', amount: 400000, method: 'Payme', status: 'Tolandi',
  }),
  row({
    id: 'tl-9', receipt: 'TL-00228', date: '14.10.2026', time: '09:15',
    name: 'Jabborova Sevara', patientId: 'jabborova-sevara', photo: photo('bemor-sevara'), phone: '+998 93 567 89 01',
    service: 'Konsultatsiya', amount: 250000, method: 'Naqd', status: 'Tolandi',
  }),
  row({
    id: 'tl-10', receipt: 'TL-00214', date: '13.10.2026', time: '17:05',
    name: 'Raximov Sardor', patientId: 'raximov-sardor', photo: photo('bemor-sardor'), phone: '+998 90 678 90 12',
    service: 'Jarrohlik', amount: 1200000, method: 'Karta', status: 'Tolandi',
  }),
]

const SERVICES = ['Konsultatsiya', 'Plomba (16)', 'Gigiyena', 'Nazorat', 'Koronka (24)', 'Implant (36)', 'Professional tozalash', 'Ortodontik maslahat', 'Endodontik davolash', 'Rentgen']
const AMOUNTS = [150000, 250000, 350000, 450000, 600000, 750000, 900000, 1200000, 1800000, 2200000]
const METHOD_IDS = ['Naqd', 'Click', 'Karta', 'Payme']

function filler(i) {
  const p = PEOPLE[i % PEOPLE.length]
  const day = String((i % 28) + 1).padStart(2, '0')
  return row({
    id: `tl-f${i}`,
    receipt: `TL-${String(1000 + i).padStart(5, '0')}`,
    date: `${day}.10.2026`,
    time: `${String(8 + (i % 10)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`,
    name: p[0],
    patientId: p[1],
    photo: photo(p[2]),
    phone: p[3],
    service: SERVICES[i % SERVICES.length],
    amount: AMOUNTS[i % AMOUNTS.length],
    method: METHOD_IDS[i % METHOD_IDS.length],
    status: i % 13 === 0 ? 'Qisman' : 'Tolandi',
  })
}

export const seedPayments = [...designed, ...Array.from({ length: 238 }, (_, i) => filler(i))]

export const DAILY = [1.8, 2.6, 3.4, 4.8, 3.2, 5.4, 4.6, 6.8, 7.6, 5.2, 4.4, 6.2, 5.6, 3.6, 4.2, 6.4, 7.2, 5.8, 4.0, 3.1, 4.7, 5.5, 6.6, 4.3, 3.8, 5.1, 6.9, 7.4, 5.9, 6.5, 7.8]
export const WEEKLY = [22, 38, 31, 46, 42]
export const MONTHLY = [18, 24, 21, 28, 33, 30, 36, 34, 41, 38, 44, 40]

export function planFor(patient) {
  if (!patient) return { name: 'Davolash rejasi', date: '14.10.2024', plan: 0, paid: 0 }
  if (patient.id === 'malika-karimova') {
    return { name: 'Implant va protez rejasi', date: '14.10.2024', plan: 9050000, paid: 8000000 }
  }
  const plan = patient.total || 2500000
  const paid = Math.min(patient.paid || 0, plan)
  return { name: 'Davolash rejasi', date: patient.last || '01.10.2026', plan, paid }
}

export function detailOf(row) {
  if (row.detail) return { ...row.detail, total: row.detail.total }
  const debt = row.status === 'Qisman' ? Math.round(row.amount * 0.35) : 0
  return {
    total: row.amount,
    doctor: 'Dr. Ibrohim',
    doctorRole: 'Stomatolog',
    doctorPhoto: '',
    chair: 'Kreslo 1',
    lines: [{ name: row.service, tooth: '—', price: row.amount, sum: row.amount }],
    discount: 0,
    debt,
    planId: 'DR-1108',
    planName: row.service,
    note: row.note || '',
    history: [
      { title: 'To‘lov yaratildi', meta: `${row.date}, ${row.time}`, by: 'Admin: Dr. Ibrohim' },
      ...(row.status === 'Tolandi'
        ? [{ title: 'To‘lov muvaffaqiyatli qabul qilindi', meta: `${row.date}, ${row.time}`, by: `${methodOf(row.method).label} orqali` }]
        : []),
    ],
  }
}
