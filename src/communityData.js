const face = (name) => `/images/bemorlar/${name}.jpg`
const shot = (name) => `/images/bemorlar/${name}.jpg`
const sem = (name) => `/images/seminars/${name}.jpg`

export const ME = {
  name: 'Shifokor',
  role: 'Stomatolog',
  place: 'Toshkent',
  avatar: '',
}

export const TOPICS = [
  { id: 'all', label: 'Barchasi' },
  { id: 'endo', label: 'Endodontiya' },
  { id: 'impl', label: 'Implantologiya' },
  { id: 'orto', label: 'Ortodontiya' },
  { id: 'estet', label: 'Estetika' },
  { id: 'surg', label: 'Jarrohlik' },
  { id: 'paro', label: 'Parodontologiya' },
  { id: 'case', label: 'Klinik holatlar' },
]

export const CATS = ['Endodontiya', 'Implantologiya', 'Ortodontiya', 'Estetika', 'Jarrohlik', 'Parodontologiya', 'Pediatriya']

export const catTopic = {
  Endodontiya: 'endo',
  Implantologiya: 'impl',
  Ortodontiya: 'orto',
  Estetika: 'estet',
  Jarrohlik: 'surg',
  Parodontologiya: 'paro',
  Pediatriya: 'case',
}

export const TRENDS = []

export const LEADERS = []

export const KINDS = [
  { id: 'keys', title: 'Klinik keys', text: 'Haqiqiy klinik holatlarni ulashing', bg: '#e7f8f4', color: '#0f8f86' },
  { id: 'savol', title: 'Savol', text: 'Hamkasblardan yordam oling', bg: '#e8f1ff', color: '#3b6fd8' },
  { id: 'muhokama', title: 'Muhokama', text: 'Dolzarb mavzularni muhokama qiling', bg: '#f3e8ff', color: '#8b3fd6' },
  { id: 'maqola', title: 'Ilmiy maqola', text: 'Tadqiqotlar va maqolalar', bg: '#e7f3ff', color: '#2b7bb9' },
]

export const KIND_LABEL = { keys: 'Klinik keys', savol: 'Savol', muhokama: 'Muhokama', maqola: 'Ilmiy maqola' }

export const SAMPLE_SHOTS = []

export const seedPosts = []

export const seedSaved = []

export const PROMO = sem('micro')
