const face = (name) => `/images/bemorlar/${name}.jpg`
const shot = (name) => `/images/bemorlar/${name}.jpg`
const sem = (name) => `/images/seminars/${name}.jpg`

export const ME = {
  name: 'Ibrohim Zakirjonov',
  role: 'Stomatolog',
  place: 'Toshkent',
  avatar: '/images/market/avatar2.jpg',
}

export const TOPICS = [
  { id: 'all', label: 'Barchasi' },
  { id: 'endo', label: 'Endodontiya', count: '1.2K' },
  { id: 'impl', label: 'Implantologiya', count: '980' },
  { id: 'orto', label: 'Ortodontiya', count: '760' },
  { id: 'estet', label: 'Estetika', count: '640' },
  { id: 'surg', label: 'Jarrohlik', count: '520' },
  { id: 'paro', label: 'Parodontologiya', count: '480' },
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

export const TRENDS = [
  ['#Endodontiya', '248 post', 'endo'],
  ['#Implantologiya', '196 post', 'impl'],
  ['#Mikroskop', '172 post', 'endo'],
  ['#Estetika', '140 post', 'estet'],
  ['#KlinikHolatlar', '138 post', 'case'],
]

export const LEADERS = [
  { name: 'Dr. Aziz Karimov', role: 'Implantolog', score: '1.2K', avatar: face('bemor-aziz') },
  { name: 'Dr. Malika Yusupova', role: 'Endodontist', score: '980', avatar: face('bemor-malika') },
  { name: 'Dr. Nilufar Tursunova', role: 'Ortodont', score: '840', avatar: face('bemor-dilnoza') },
  { name: 'Dr. Jasur Murodov', role: 'Jarroh', score: '760', avatar: face('bemor-bobur') },
  { name: 'Dr. Bekzod Qodirov', role: 'Parodontolog', score: '690', avatar: face('bemor-anvar') },
]

export const KINDS = [
  { id: 'keys', title: 'Klinik keys', text: 'Haqiqiy klinik holatlarni ulashing', bg: '#e7f8f4', color: '#0f8f86' },
  { id: 'savol', title: 'Savol', text: 'Hamkasblardan yordam oling', bg: '#e8f1ff', color: '#3b6fd8' },
  { id: 'muhokama', title: 'Muhokama', text: 'Dolzarb mavzularni muhokama qiling', bg: '#f3e8ff', color: '#8b3fd6' },
  { id: 'maqola', title: 'Ilmiy maqola', text: 'Tadqiqotlar va maqolalar', bg: '#e7f3ff', color: '#2b7bb9' },
]

export const KIND_LABEL = { keys: 'Klinik keys', savol: 'Savol', muhokama: 'Muhokama', maqola: 'Ilmiy maqola' }

export const SAMPLE_SHOTS = [shot('bemor-rvg'), shot('bemor-opg'), shot('bemor-kt')]

export const seedPosts = [
  {
    id: 'aziz-36',
    rank: 1,
    kind: 'keys',
    topic: 'endo',
    author: 'Dr. Aziz Karimov',
    role: 'Implantolog',
    place: 'Toshkent',
    time: '3 soat oldin',
    avatar: face('bemor-aziz'),
    title: '36-tish: surunkali apikal periodontit, qayta endodontik davolash',
    body: 'Bemor 36-tishda og‘riq bilan murojaat qildi. Avvalgi davolash sifatsiz bo‘lgan. Mikroskop ostida qayta endodontik davolash o‘tkazildi.',
    tags: [
      { t: 'Klinik keys', tone: 'keys' },
      { t: 'Endodontiya' },
      { t: 'Mikroskop' },
      { t: 'Qayta davolash' },
      { t: '#Case', tone: 'hash' },
    ],
    images: [shot('bemor-rvg'), shot('bemor-opg'), shot('bemor-kt'), shot('bemor-intra'), sem('teeth'), sem('smile')],
    likes: 128,
    comments: 24,
    shares: 12,
    thread: [
      { name: 'Dr. Jasur Murodov', text: 'Mikroskop ostida ishlash to‘g‘ri qaror. MB2 kanal topildimi?' },
      { name: 'Dr. Malika Yusupova', text: 'Qayta davolashdan keyin 6 oylik nazorat rentgenini ham ulashing.' },
    ],
  },
  {
    id: 'malika-mta',
    rank: 2,
    kind: 'keys',
    topic: 'case',
    author: 'Dr. Malika Yusupova',
    role: 'Endodontist',
    place: 'Samarqand',
    time: '5 soat oldin',
    avatar: face('bemor-malika'),
    title: 'MTA bilan apexifikatsiya: 11 yoshli bemor holati',
    body: '11 yoshli bemorda 21 tish travma sababli nekroz bo‘lgan. Apex ochiq. MTA bilan apexifikatsiya bajarildi. 6 oylik nazorat rentgenida ijobiy dinamika.',
    tags: [
      { t: 'Klinik keys', tone: 'keys' },
      { t: 'Pediatriya' },
      { t: 'MTA' },
      { t: 'Apexifikatsiya' },
      { t: '#Case', tone: 'hash' },
    ],
    images: [shot('bemor-intra'), sem('teeth'), shot('bemor-opg'), shot('bemor-rvg'), sem('smile'), shot('bemor-kt'), sem('surgery')],
    likes: 96,
    comments: 18,
    shares: 9,
    thread: [{ name: 'Dr. Nilufar Tursunova', text: 'Ochiq apeksda MTA qalinligi qancha qilindi?' }],
  },
  {
    id: 'nilufar-savol',
    rank: 3,
    kind: 'savol',
    topic: 'orto',
    author: 'Dr. Nilufar Tursunova',
    role: 'Ortodont',
    place: 'Toshkent',
    time: '1 kun oldin',
    avatar: face('bemor-dilnoza'),
    title: 'Mini-vint qayerga qo‘yilsa, intruziyada barqarorroq bo‘ladi?',
    body: 'Yuqori jag‘ old guruhini intruziya qilishda mini-vint joylashuvi bo‘yicha tajribangiz qanday? Ikkala tomonda ham suyak hajmi cheklangan.',
    tags: [{ t: 'Savol', tone: 'savol' }, { t: 'Ortodontiya' }, { t: '#MiniVint', tone: 'hash' }],
    images: [sem('smile'), sem('teeth')],
    likes: 54,
    comments: 11,
    shares: 3,
    thread: [],
  },
  {
    id: 'jasur-talk',
    rank: 4,
    kind: 'muhokama',
    topic: 'impl',
    author: 'Dr. Jasur Murodov',
    role: 'Jarroh',
    place: 'Andijon',
    time: '2 kun oldin',
    avatar: face('bemor-bobur'),
    title: 'Peri-implantitda birinchi chora: konservativmi yoki jarrohlikmi?',
    body: 'Chuqur cho‘ntak va suyak yo‘qolishi boshlangan implantda qanday protokolni birinchi tanlaysiz? Antibiotik, lazer yoki ochiq tozalash?',
    tags: [{ t: 'Muhokama', tone: 'talk' }, { t: 'Implantologiya' }, { t: '#PeriImplantit', tone: 'hash' }],
    images: [sem('surgery'), shot('bemor-kt'), shot('bemor-opg')],
    likes: 73,
    comments: 16,
    shares: 6,
    thread: [],
  },
  {
    id: 'bekzod-paper',
    rank: 5,
    kind: 'maqola',
    topic: 'paro',
    author: 'Dr. Bekzod Qodirov',
    role: 'Parodontolog',
    place: 'Buxoro',
    time: '4 kun oldin',
    avatar: face('bemor-anvar'),
    title: 'Parodontal cho‘ntakni yopishda emdogain va membrana: qisqa sharh',
    body: 'So‘nggi kuzatuvlarda regenerativ material tanlovi natijani 12 oyda sezilarli o‘zgartirdi. Protokol va cheklovlarni muhokama qilamiz.',
    tags: [{ t: 'Ilmiy maqola', tone: 'paper' }, { t: 'Parodontologiya' }, { t: '#Regeneratsiya', tone: 'hash' }],
    images: [shot('bemor-opg'), sem('micro')],
    likes: 41,
    comments: 7,
    shares: 4,
    thread: [],
  },
]

export const seedSaved = [
  { id: 's1', title: 'Peri-implantit davolash usullari', meta: 'Dr. Jasur Murodov · 2 kun oldin', image: sem('surgery') },
  { id: 's2', title: 'Kompozit restavratsiya protokoli', meta: 'Dr. Malika Yusupova · 5 kun oldin', image: shot('bemor-intra') },
  { id: 's3', title: 'Ortodontik mini-vintlar qo‘llanilishi', meta: 'Dr. Nilufar Tursunova · 1 hafta oldin', image: sem('smile') },
]

export const PROMO = sem('micro')
