// Sinov (test) ma’lumotlari manbasi — 0075_test_seed.sql shu fayldan yasaladi (build-sql.mjs).
// Sotuvchi/usta/klinika nomlari o‘ylab topilgan; telefonlar +998 90 000 00 NN (ulanmaydi); Telegram bo‘sh.
// Brendlar (3M, GC, Ivoclar, Dentsply...) — haqiqiy, chunki mahsulotlar shu brendlarniki bo‘lishi tabiiy.
import {
  TEST_SEED_BATCH, testUserId, testProductId, testCourseId, testLessonId, testPromoId, testPhone, TEST_ID_PREFIX,
} from '../../src/lib/testSeed.js'

export const BATCH = TEST_SEED_BATCH
export const seminarId = (n) => `${TEST_ID_PREFIX}e000-${String(n).padStart(12, '0')}`
export const ticketId = (n) => `${TEST_ID_PREFIX}e100-${String(n).padStart(12, '0')}`

// ---- Foydalanuvchilar (auth.users + profiles). Parolsiz, .invalid domen — kirib bo‘lmaydi.
export const USERS = [
  { n: 1, name: 'DentaLine Savdo', role: 'seller', seller_type: 'stomatologik', city: 'Toshkent' },
  { n: 2, name: 'Oq Tabassum Market', role: 'seller', seller_type: 'stomatologik', city: 'Samarqand' },
  { n: 3, name: 'MedLibos Atelye', role: 'seller', seller_type: 'forma', city: 'Toshkent' },
  { n: 4, name: 'TexnoDent Uskuna', role: 'seller', seller_type: 'jihozlar', city: 'Toshkent' },
  { n: 5, name: 'Smile Akademiya', role: 'organizer', city: 'Toshkent', specialty: 'O‘quv markazi' },
  { n: 6, name: 'Servis Usta Markazi', role: 'customer', city: 'Toshkent' },
  { n: 7, name: 'Dr. Sanjar Olimov', role: 'customer', city: 'Toshkent', specialty: 'Implantolog' },
  { n: 8, name: 'Nur Dental Klinikasi', role: 'customer', city: 'Toshkent' },
  { n: 9, name: 'Ilm Kitob Do‘koni', role: 'customer', city: 'Toshkent' },
].map((u) => ({ ...u, id: testUserId(u.n), email: `seed-${String(u.n).padStart(2, '0')}@test.stomahub.invalid`, phone: testPhone(u.n) }))
const uid = (n) => testUserId(n)

// ---- Marketplace: stomatologik mahsulotlar (seller_products)
const mp = (n, seller, name, brand, category, price, stock, image, country, unit, description, specs = []) => ({
  id: testProductId(n), seller_id: uid(seller), name, brand, category, price, stock, image_url: image, images: [image],
  country, unit, description, specs, sku: `TS-${String(n).padStart(3, '0')}`, forma: {}, jihoz: {}, variants: [],
})
export const PRODUCTS = [
  mp(1, 1, 'Filtek Z250 kompozit, A2 (4 g)', '3M', 'Restavratsion materiallar', 285000, 40, '/images/market/p1.jpg', 'AQSh', '4 g shprits',
    'Mikrogibrid universal kompozit. Old va orqa tishlar restavratsiyasi uchun, yaxshi pardozlanadi.', [['Rang', 'A2'], ['Hajm', '4 g']]),
  mp(2, 1, 'Single Bond Universal adgeziv (5 ml)', '3M', 'Yordamchi materiallar', 520000, 25, '/images/market/p2.jpg', 'AQSh', '5 ml flakon',
    'Universal adgeziv: total-etch, self-etch va selektiv emal etching usullari bilan ishlaydi.', [['Hajm', '5 ml']]),
  mp(3, 1, 'Fuji IX GP shisha-ionomer sement', 'GC', 'Restavratsion materiallar', 410000, 18, '/images/market/p3.jpg', 'Yaponiya', '15 g + 6.4 ml',
    'Kondensatsiyalanadigan shisha-ionomer: bolalar stomatologiyasi va vaqtinchalik restavratsiyalar uchun.'),
  mp(4, 1, 'Tetric N-Ceram kompozit, A3 (3.5 g)', 'Ivoclar', 'Restavratsion materiallar', 330000, 30, '/images/market/p4.jpg', 'Lixtenshteyn', '3.5 g shprits',
    'Nanogibrid kompozit, past cho‘kish va yuqori yaltiroqlik.', [['Rang', 'A3']]),
  mp(5, 2, 'ProTaper Gold fayllar F1–F3 (25 mm)', 'Dentsply', 'Endodontik asboblar', 390000, 22, '/images/market/p5.jpg', 'Shveytsariya', '3 dona',
    'Mashina endodontiyasi uchun issiqlik bilan ishlangan NiTi fayllar. Egilgan kanallarda ham barqaror.', [['Uzunlik', '25 mm']]),
  mp(6, 2, 'OptiBond Solo Plus (5 ml)', 'Kerr', 'Yordamchi materiallar', 450000, 15, '/images/market/p6.jpg', 'AQSh', '5 ml flakon',
    'Bir komponentli, to‘ldirgichli adgeziv. Total-etch texnikasi uchun.'),
  mp(7, 2, 'Clearfil SE Bond (2 komponentli)', 'Kuraray', 'Yordamchi materiallar', 690000, 12, '/images/market/p7.jpg', 'Yaponiya', 'Primer 6 ml + Bond 5 ml',
    'Self-etch adgeziv tizimi: dentinga mustahkam bog‘lanish va past sezuvchanlik.'),
  mp(8, 2, 'Hydrorise Putty silikon qolip materiali', 'Zhermack', 'Qolip (ottisk) materiallari', 380000, 20, '/images/market/p8.jpg', 'Italiya', '2 × 300 ml',
    'A-silikon, aniq va barqaror ottisk. Ortopediya va implant ishlari uchun.'),
  mp(9, 1, 'Pana-Max turbinali uchlik', 'NSK', 'Instrumentlar', 1850000, 6, '/images/market/p9.jpg', 'Yaponiya', '1 dona',
    'Keramik podshipnikli turbinali uchlik, past shovqin, standart Borden ulagich.'),
  mp(10, 2, 'Gutta-percha shtiftlar ISO 25 (120 dona)', 'Coltene', 'Endodontik asboblar', 95000, 50, '/images/market/p10.jpg', 'Shveytsariya', '120 dona',
    'Ildiz kanallarini plombalash uchun standart gutta-percha shtiftlar.'),
]

// ---- Forma (seller_products, category 'Tibbiy forma', forma jsonb, variantlar)
const sizes = ['S', 'M', 'L', 'XL']
const variantsOf = (n, colors, price, list = sizes) => colors.flatMap((c) => list.map((s) => ({ size: s, color: c, price, stock: 5, sku: `TS-F${n}-${c}-${s}` })))
const fp = (n, name, brand, cat, gender, fabric, colors, price, image, description, list) => ({
  id: testProductId(n), seller_id: uid(3), name, brand, category: 'Tibbiy forma', price, stock: 0, image_url: image, images: [image],
  country: 'O‘zbekiston', unit: '1 dona', description, specs: [], sku: `TS-${n}`, jihoz: {},
  forma: { cat, gender, fabric, size_type: cat === 'shoe' ? 'shoe' : cat === 'cap' ? 'one' : 'clothing', kashta_price: 0 },
  variants: variantsOf(n, colors, price, list),
})
export const FORMA = [
  fp(21, 'Skrab to‘plam Stretch (ayollar)', 'Cherokee', 'scrub', 'female', 'stretch', ['teal', 'navy', 'lilac'], 390000, '/images/forma/woman-navy.jpg',
    'Cho‘ziluvchan mato, 4 ta cho‘ntak, V-yoqa. Uzoq smenalarda qulay, 60°C da yuviladi.'),
  fp(22, 'Skrab to‘plam Classic (erkaklar)', 'Dickies', 'scrub', 'male', 'cotton', ['teal', 'blue', 'black'], 340000, '/images/forma/man-teal.jpg',
    'Paxta-poliester aralashmasi, mustahkam tikuv, keng cho‘ntaklar.'),
  fp(23, 'Tibbiy xalat Premium (uniseks)', 'HNL', 'coat', 'uni', 'premium', ['white'], 450000, '/images/forma/coat.jpg',
    'Uzun xalat, zich premium mato, ichki cho‘ntak. Klinika logosini tikish mumkin.'),
  fp(24, 'Tibbiy qalpoq (paxta)', 'Mediform', 'cap', 'uni', 'cotton', ['teal', 'navy', 'wine'], 65000, '/images/forma/cap.jpg',
    'Bog‘ichli paxta qalpoq, o‘lchamga moslashadi.', ['Universal']),
  fp(25, 'Tibbiy poyabzal (klog)', 'Crocs', 'shoe', 'uni', 'premium', ['white', 'navy'], 280000, '/images/forma/clogs.jpg',
    'Yengil, sirpanmaydigan taglik, oyoq terlamaydi.', ['37', '38', '39', '40', '41', '42']),
  fp(26, 'Himoya fartugi (suv o‘tkazmaydi)', 'Labwear', 'apron', 'uni', 'anti', ['navy', 'black'], 120000, '/images/forma/apron.jpg',
    'Suv o‘tkazmaydigan fartuk, sterilizatsiya va laboratoriya ishlari uchun.', ['Universal']),
]

// ---- Jihozlar (seller_products, category 'Stomatologik jihozlar', jihoz jsonb)
const jp = (n, name, brand, cat, model, year, warranty, price, image, description, install = true) => ({
  id: testProductId(n), seller_id: uid(4), name, brand, category: 'Stomatologik jihozlar', price, stock: 2, image_url: image, images: [image],
  country: '', unit: '1 dona', description, specs: [], sku: `TS-${n}`, forma: {}, variants: [],
  jihoz: { cat, model, year, warranty, city: 'Toshkent', install },
})
export const JIHOZ = [
  jp(41, 'Stomatologik ustanovka Intego', 'Dentsply Sirona', 'unit', 'Intego Ambition', 2025, 24, 168000000, '/images/jihozlar/sirona.jpg',
    'Nemis sifatidagi ustanovka: LED chiroq, assistent bloki, 5 ta asbob joyi. O‘rnatish va trening narxga kiradi.'),
  jp(42, 'Stomatologik ustanovka Estetica E50', 'KaVo', 'unit', 'Estetica E50 Life', 2025, 24, 142000000, '/images/jihozlar/kavo.jpg',
    'Ergonomik ustanovka, integratsiyalangan mikromotor va skaler.'),
  jp(43, 'Intraoral skaner TRIOS 3', '3Shape', 'scan', 'TRIOS 3 Basic', 2024, 12, 118000000, '/images/jihozlar/trios.jpg',
    'Raqamli ottisk: tez skanerlash, rangli tasvir, CAD/CAM bilan ishlaydi.'),
  jp(44, 'Avtoklav Vacuklav 23 B+', 'Melag', 'autoclave', 'Vacuklav 23 B+', 2025, 24, 29500000, '/images/jihozlar/melag.jpg',
    'B-sinf avtoklav, 23 litr, hujjatlashtirish funksiyasi bilan.', false),
  jp(45, 'Kompressor Turbo-Jet', 'Cattani', 'compressor', 'Turbo-Jet 1', 2024, 12, 18500000, '/images/jihozlar/cattani.jpg',
    'Moysiz kompressor va aspirator, 1–2 ustanovka uchun.'),
  jp(46, 'Polimerizatsiya lampasi Bluephase G4', 'Ivoclar', 'lamp', 'Bluephase G4', 2025, 24, 7400000, '/images/jihozlar/ivoclar.jpg',
    'Polywave LED lampa, avtomatik ekspozitsiya nazorati.', false),
]

// ---- Aksiyalar (seller_promotions → catalog 'deal' sinxron triggeri yaratadi)
export const PROMOS = [
  { id: testPromoId(1), seller: 1, product: testProductId(1), old_price: 285000, price: 239000, title: 'Kompozitlar haftaligi' },
  { id: testPromoId(2), seller: 1, product: testProductId(9), old_price: 1850000, price: 1590000, title: 'NSK uchliklariga chegirma' },
  { id: testPromoId(3), seller: 2, product: testProductId(5), old_price: 390000, price: 329000, title: 'Endo to‘plam aksiyasi' },
  { id: testPromoId(4), seller: 2, product: testProductId(8), old_price: 380000, price: 315000, title: '' },
  { id: testPromoId(5), seller: 3, product: testProductId(21), old_price: 390000, price: 330000, title: 'Yangi mavsum formalari' },
  { id: testPromoId(6), seller: 4, product: testProductId(46), old_price: 7400000, price: 6650000, title: 'Lampa + kafolat' },
]

// ---- Seminarlar (seminars + tickets), tashkilotchi 5
const sem = (n, title, speaker, topic, start, city, place, image, about, prices) => ({
  id: seminarId(n), organizer_id: uid(5), title, speaker, topic, start_date: start, end_date: start, start_time: '10:00', end_time: '17:00',
  city, place, address: place, image, cover: image, about, category: 'Tibbiy amaliy seminar', tags: [topic],
  format: 'Oflayn', days: '1 kunlik seminar', seats: 30, status: 'rejalashtirilgan', badge: 'Rejalashtirilgan', template: 'teal',
  contact_phone: testPhone(5).replace(/\D/g, '').slice(3), contact_telegram: '',
  date_label: '', tickets: prices.map(([name, price, seats], i) => ({ id: ticketId(n * 10 + i), name, price, seats })),
})
export const SEMINARS = [
  sem(1, 'Zamonaviy implantologiya: rejalashtirishdan protezgacha', 'Dr. Sanjar Olimov', 'Implantologiya', '2026-12-12', 'Toshkent', 'Smile Akademiya, 2-zal',
    '/images/seminars/surgery.jpg', 'Implant joylashuvini CBCT bo‘yicha rejalashtirish, jarrohlik shabloni va bir bosqichli protokollar. Amaliy qism — modellarda.',
    [['Standart', 1200000, 20], ['VIP (amaliyot bilan)', 2400000, 10]]),
  sem(2, 'Mikroskop ostida endodontiya', 'Dr. Lola Hamidova', 'Endodontiya', '2026-12-19', 'Toshkent', 'Smile Akademiya, 1-zal',
    '/images/seminars/micro.jpg', 'MB2 kanalni topish, qayta davolash va perforatsiyalarni yopish. Har bir ishtirokchiga mikroskop.',
    [['Standart', 950000, 24]]),
  sem(3, 'Estetik restavratsiya: qatlamli usul', 'Dr. Kamron Yusufov', 'Terapiya', '2027-01-16', 'Samarqand', 'Registon Hotel konferens-zali',
    '/images/seminars/smile.jpg', 'Rang tanlash, qatlamlab kompozit qo‘yish va pardozlash. Old tishlar bo‘yicha amaliy mashg‘ulot.',
    [['Standart', 800000, 30], ['Talaba', 400000, 10]]),
  sem(4, 'Aligner terapiyasi asoslari', 'Dr. Nigora Aminova', 'Ortodontiya', '2027-01-23', 'Toshkent', 'Smile Akademiya, 2-zal',
    '/images/seminars/aligner.jpg', 'Aligner bilan davolashga ko‘rsatma, raqamli rejalashtirish va bemorni kuzatish.',
    [['Standart', 1100000, 25]]),
  sem(5, 'Klinika boshqaruvi va bemor servisi', 'Shohrux Tojiyev', 'Menejment', '2027-02-06', 'Toshkent', 'Hyatt Regency, Ipak yo‘li zali',
    '/images/seminars/hotel.jpg', 'Qabulxona standartlari, narx siyosati, bemorni qayta jalb qilish va jamoani boshqarish.',
    [['Standart', 600000, 40]]),
]

// ---- Ta’lim kurslari (courses + course_lessons), muallif 5. Videolar yo‘q — faqat tuzilma.
const course = (n, title, description, direction, level, cover, lessons) => ({
  id: testCourseId(n), author_id: uid(5), title, description, direction, level, format: 'kurs', price: 0, cover_url: cover,
  lessons: lessons.map((t, i) => ({ id: testLessonId(n * 100 + i + 1), position: i + 1, title: t, module_title: i < 2 ? '1-modul' : '2-modul' })),
})
export const COURSES = [
  course(1, 'Endodontiya: kanal anatomiyasidan obturatsiyagacha', 'Kanal anatomiyasi, ishchi uzunlik, mashina asboblari va issiq gutta-percha bilan plombalash.', 'endo', 'orta', '/images/seminars/micro.jpg',
    ['Kanal anatomiyasi va kirish', 'Ishchi uzunlikni aniqlash', 'NiTi fayllar bilan ishlash', 'Obturatsiya usullari']),
  course(2, 'Implantologiyaga kirish', 'Bemor tanlash, CBCT tahlili va oddiy holatlarda implant joylashtirish protokoli.', 'impl', 'bosh', '/images/seminars/surgery.jpg',
    ['Ko‘rsatma va qarshi ko‘rsatmalar', 'CBCT bo‘yicha rejalashtirish', 'Jarrohlik bosqichlari']),
  course(3, 'Kompozit bilan estetik restavratsiya', 'Rang tanlash, izolyatsiya, adgeziv protokol va qatlamli texnika.', 'terapiya', 'bosh', '/images/seminars/smile.jpg',
    ['Rang tanlash', 'Izolyatsiya va adgeziya', 'Qatlamlab qo‘yish', 'Pardozlash']),
  course(4, 'Parodontologiya: amaliy asoslar', 'Parodont kasalliklari tasnifi, skeling va kyuretaj, uyda parvarish bo‘yicha tavsiyalar.', 'paro', 'orta', '/images/seminars/teeth.jpg',
    ['Tasnif va diagnostika', 'Skeling va kyuretaj', 'Qo‘llab-quvvatlovchi terapiya']),
  course(5, 'Raqamli stomatologiya: skanerdan frezagacha', 'Intraoral skaner, CAD dizayn va CAM frezalash ish jarayoni.', 'digital', 'ekspert', '/images/yangiliklar/yang-scanner.jpg',
    ['Intraoral skanerlash', 'CAD dizayn', 'CAM va materiallar']),
]

// ---- catalog_items (egasi sinov foydalanuvchilari — UI egali qatorlarni ko‘rsatadi)
const svc = (name, price, meta) => ({ name, price, meta })
const master = (id, name, role, cats, tags, brands, years, jobs, district, photo, works, services, phoneN, about) => ({
  kind: 'master', id, owner: 6,
  payload: { id, name, role, cats, tags, brands, years, jobs, city: 'Toshkent', district, photo, works, services, about,
    phone: testPhone(phoneN), telegram: '', reply: '~30 daqiqa', status: 'online', rating: 0, reviews: 0 },
})
const W = ['/images/ustalar/usta-work-chair.jpg', '/images/ustalar/usta-work-hands.jpg', '/images/ustalar/usta-work-auto.jpg', '/images/ustalar/usta-work-wire.jpg', '/images/ustalar/usta-work-xray.jpg']
export const MASTERS = [
  master('ts26-usta-ustanovka-servis', 'Ustanovka Servis', 'Stomatologik ustanovkalar ta’miri', ['unit', 'install'], ['Ustanovka', 'Gidravlika', 'Elektronika'], ['Sirona', 'KaVo', 'Fengdan'], 9, 210, 'Chilonzor',
    '/images/ustalar/usta-azamat.jpg', [W[0], W[3]], [svc('Chaqiruv va diagnostika', '150 000 so‘m', 'Toshkent bo‘ylab'), svc('Gidravlika ta’miri', 'dan 400 000 so‘m', 'Ehtiyot qism alohida')], 11,
    'Ustanovkalarni o‘rnatish, gidravlika va plata ta’miri, profilaktik servis.'),
  master('ts26-usta-turbina-pro', 'Turbina Pro', 'Uchlik va turbinalar ta’miri', ['handpiece'], ['Turbina', 'Mikromotor', 'Podshipnik'], ['NSK', 'W&H', 'Bien-Air'], 7, 640, 'Yunusobod',
    '/images/ustalar/usta-bobur.jpg', [W[1]], [svc('Turbina podshipnik almashtirish', 'dan 350 000 so‘m', 'Kafolat: 3 oy'), svc('Diagnostika', 'Bepul', '1 kun ichida')], 12,
    'Turbinali va burchakli uchliklarni ta’mirlash, original podshipniklar bilan.'),
  master('ts26-usta-kompressor-24', 'Kompressor 24', 'Kompressor va aspirator servisi', ['compressor'], ['Kompressor', 'Aspirator', 'Filtrlar'], ['Cattani', 'Durr'], 11, 380, 'Sergeli',
    '/images/ustalar/usta-dilshod.jpg', [W[2]], [svc('Yillik servis', '500 000 so‘m', '1 ta kompressor'), svc('Filtr almashtirish', '180 000 so‘m', 'Material bilan')], 13,
    'Moysiz kompressorlar va aspiratsiya tizimlarini servis qilish.'),
  master('ts26-usta-steril-texnik', 'Steril Texnik', 'Avtoklav va sterilizatorlar', ['autoclave'], ['Avtoklav', 'Validatsiya'], ['Melag', 'W&H', 'Euronda'], 6, 150, 'Mirobod',
    '/images/ustalar/usta-jasur.jpg', [W[3]], [svc('Avtoklav diagnostikasi', '200 000 so‘m', 'Joyida'), svc('Germetik almashtirish', 'dan 250 000 so‘m', 'Kafolat: 6 oy')], 14,
    'B-sinf avtoklavlarni ta’mirlash va sozlash.'),
  master('ts26-usta-rentgen-servis', 'Rentgen Servis', 'Rentgen va CBCT xizmati', ['cbct'], ['Rentgen', 'CBCT', 'Sensor'], ['Planmeca', 'Vatech'], 12, 95, 'Mirzo Ulug‘bek',
    '/images/ustalar/usta-sardor.jpg', [W[4]], [svc('Kalibrlash', '600 000 so‘m', 'Hujjat bilan'), svc('Sensor ta’miri', 'Kelishilgan', 'Diagnostikadan keyin')], 15,
    'Rentgen apparatlari va CBCT tizimlarini o‘rnatish, kalibrlash va servis.'),
  master('ts26-usta-cadcam-lab', 'CAD/CAM Lab Servis', 'Skaner va frezalash uskunalari', ['scan'], ['Skaner', 'Frezer', 'Dasturiy ta’minot'], ['3Shape', 'Medit', 'Roland'], 5, 120, 'Yakkasaroy',
    '/images/ustalar/usta-azamat.jpg', [W[0]], [svc('Skanerni sozlash', '300 000 so‘m', 'Masofadan ham'), svc('Frezer servisi', 'dan 450 000 so‘m', 'Joyida')], 16,
    'Intraoral skaner va frezalash stanoklarini sozlash, dasturiy yordam.'),
]

const doctor = (id, name, role, focus, specs, tags, exp, clinic, district, photo, about, services, phoneN) => ({
  kind: 'doctor', id, owner: 7,
  payload: { id, name, role, focus, specs, tags, exp, clinic, city: 'Toshkent', district, photo, about, services, phone: testPhone(phoneN),
    cert: true, online: true, rating: 0, reviews: 0, patients: '', works: ['/images/bemorlar/bemor-rvg.jpg', '/images/bemorlar/bemor-opg.jpg'], reviewsList: [] },
})
const ds = (name, note, price, img) => ({ name, note, price, img })
export const DOCTORS = [
  doctor('ts26-dr-sanjar-olimov', 'Dr. Sanjar Olimov', 'Implantolog, jarroh', 'Implantologiya', ['implantolog', 'jarroh'], ['Implantatsiya', 'Sinus lift'], 10, 'Nur Dental', 'Chilonzor',
    '/images/bemorlar/bemor-sardor.jpg', 'Murakkab implant holatlari bo‘yicha konsultatsiya va ikkinchi fikr.', [ds('Onlayn konsultatsiya', '30 daqiqa, video', 150000, '/images/kategoriyalar/kat-implant.jpg')], 21),
  doctor('ts26-dr-lola-hamidova', 'Dr. Lola Hamidova', 'Endodontist', 'Endodontiya', ['endodont'], ['Mikroskop', 'Qayta davolash'], 8, 'Endo Plus', 'Yunusobod',
    '/images/bemorlar/bemor-malika.jpg', 'Murakkab kanallar va qayta davolash bo‘yicha maslahat.', [ds('Keys tahlili', 'Rentgen bo‘yicha', 120000, '/images/kategoriyalar/kat-endo.jpg')], 22),
  doctor('ts26-dr-kamron-yusufov', 'Dr. Kamron Yusufov', 'Estetik stomatolog', 'Estetik restavratsiya', ['terapevt'], ['Kompozit', 'Vinir'], 7, 'Smile Studio', 'Mirobod',
    '/images/bemorlar/bemor-bobur.jpg', 'Old tishlar estetikasi va tabassum dizayni bo‘yicha konsultatsiya.', [ds('Tabassum dizayni', 'Foto tahlil bilan', 200000, '/images/kategoriyalar/kat-terapiya.jpg')], 23),
  doctor('ts26-dr-nigora-aminova', 'Dr. Nigora Aminova', 'Ortodont', 'Aligner va breketlar', ['ortodont'], ['Aligner', 'Breket'], 9, 'Orto Line', 'Mirzo Ulug‘bek',
    '/images/bemorlar/bemor-sevara.jpg', 'Ortodontik davolash rejasi va aligner bo‘yicha maslahat.', [ds('Ortodontik konsultatsiya', 'Rejasi bilan', 180000, '/images/kategoriyalar/kat-orto.jpg')], 24),
  doctor('ts26-dr-javlon-rahimov', 'Dr. Javlon Rahimov', 'Ortoped', 'Protezlash', ['ortoped'], ['Zirkoniy', 'Implant ustida protez'], 12, 'Proteks Klinika', 'Sergeli',
    '/images/bemorlar/bemor-davron.jpg', 'Ortopedik reabilitatsiya va protez tanlash bo‘yicha konsultatsiya.', [ds('Protezlash rejasi', 'KT/OPG bo‘yicha', 150000, '/images/kategoriyalar/kat-ortopediya.jpg')], 25),
  doctor('ts26-dr-madina-saidova', 'Dr. Madina Saidova', 'Bolalar stomatologi', 'Bolalar stomatologiyasi', ['bolalar'], ['Profilaktika', 'Germetizatsiya'], 6, 'Kids Dental', 'Yakkasaroy',
    '/images/bemorlar/bemor-madina.jpg', 'Bolalar tishlari parvarishi va profilaktika bo‘yicha maslahat.', [ds('Ota-onalar uchun konsultatsiya', '20 daqiqa', 100000, '/images/kategoriyalar/kat-gigiyena.jpg')], 26),
]

const ad = (id, title, cat, deal, price, cond, sub, about, image, features, phoneN, sellerName, sellerType) => ({
  kind: 'ad', id, owner: 8,
  payload: { id, title, cat, deal, price, cond, sub, about, images: [image], features, city: 'Toshkent', original: true, views: 0, status: 'active',
    date: '16 noy 2026', specs: [['place', 'Shahar', 'Toshkent'], ['cond', 'Holati', cond]], seller: sellerName,
    sellerInfo: { name: sellerName, type: sellerType, since: '2026', avatar: '', rating: null, phone: testPhone(phoneN), telegram: '' } },
})
export const ADS = [
  ad('ts26-elon-ustanovka-2022', 'Stomatologik ustanovka, 2022-yil', 'uskuna', 'sale', 52000000, 'Ishlatilgan', 'Yaxshi holatda, servis hujjatlari bor',
    'Klinika yangi jihozga o‘tgani uchun sotiladi. LED chiroq, assistent bloki, muntazam servis qilingan.', '/images/demo/elonlar/e1.webp', ['LED chiroq', 'Assistent bloki'], 31, 'Nur Dental Klinikasi', 'Klinika'),
  ad('ts26-elon-avtoklav', 'Avtoklav 18 litr, B-sinf', 'uskuna', 'sale', 14500000, 'Ishlatilgan', '2 yil ishlatilgan', 'Ishlashi a’lo, germetik yangi almashtirilgan.',
    '/images/demo/elonlar/e2.webp', ['B-sinf', '18 litr'], 32, 'Nur Dental Klinikasi', 'Klinika'),
  ad('ts26-elon-kabinet-ijara', 'Jihozlangan stomatologik kabinet ijarasi', 'klinika', 'rent', 6000000, 'Yaxshi', 'Oylik, Chilonzor', 'Bitta kreslo, sterilizatsiya xonasi va qabulxona umumiy.',
    '/images/ishlar/ish-chair.jpg', ['1 kreslo', 'Sterilizatsiya xonasi'], 33, 'Nur Dental Klinikasi', 'Klinika'),
  ad('ts26-elon-mikromotor', 'Mikromotor to‘plami (yangi, qutida)', 'asbob', 'sale', 3900000, 'Yangi', 'Ortiqcha buyurtma', 'Ochilmagan qutida, kafolat taloni bilan.',
    '/images/demo/elonlar/e4.webp', ['Yangi', 'Kafolat'], 34, 'Nur Dental Klinikasi', 'Klinika'),
  ad('ts26-elon-rvg-sensor', 'RVG sensor, 1-o‘lcham', 'uskuna', 'sale', 8200000, 'Ishlatilgan', 'Kam ishlatilgan', 'Dasturi bilan, kompyuterga USB orqali ulanadi.',
    '/images/demo/elonlar/e5.webp', ['USB', 'Dastur bilan'], 35, 'Nur Dental Klinikasi', 'Klinika'),
  ad('ts26-elon-kreslo-assistent', 'Assistent kreslosi', 'uskuna', 'sale', 1600000, 'Ishlatilgan', 'Yaxshi holatda', 'Balandligi sozlanadi, g‘ildiraklari butun.',
    '/images/demo/elonlar/e6.webp', ['Sozlanadi'], 36, 'Nur Dental Klinikasi', 'Klinika'),
]

const job = (id, title, spec, type, exp, min, max, address, about, requirements, phoneN, image) => ({
  kind: 'job', id, owner: 8,
  payload: { id, title, clinic: 'Nur Dental Klinikasi', city: 'toshkent', cityLabel: 'Toshkent', address, district: '', type, spec, exp, min, max,
    requirements, about, phone: `+${testPhone(phoneN).replace(/\D/g, '')}`, telegram: '', posted: '', postedAt: '2026-11-16T10:00:00+05:00',
    ownerId: testUserId(8), user: true, image, status: 'active' },
})
export const JOBS = [
  job('ts26-ish-terapevt', 'Stomatolog-terapevt', 'terapevt', 'full', 'y1', 8000000, 14000000, 'Chilonzor tumani', 'Kunlik 8–10 bemor, zamonaviy jihozlar, foiz + oklad.',
    ['Diplom va litsenziya', '1 yildan ortiq tajriba'], 41, '/images/ishlar/ish-hall.jpg'),
  job('ts26-ish-ortoped', 'Stomatolog-ortoped', 'ortoped', 'full', 'y3', 12000000, 20000000, 'Chilonzor tumani', 'Zirkoniy va implant ustida protezlash, o‘z laboratoriyamiz bor.',
    ['3+ yil tajriba', 'Raqamli ottisk bilan ishlay olish'], 42, '/images/ishlar/ish-implant.jpg'),
  job('ts26-ish-assistent', 'Stomatolog assistenti', 'assistent', 'shift', 'none', 4000000, 5500000, 'Chilonzor tumani', 'Smenali ish, o‘qitamiz.',
    ['Mas’uliyat', 'Tibbiy kollej (afzallik)'], 43, '/images/ishlar/ish-assistant.jpg'),
  job('ts26-ish-administrator', 'Qabulxona administratori', 'admin', 'full', 'y1', 4500000, 6000000, 'Chilonzor tumani', 'Bemorlarni yozish, qo‘ng‘iroqlar va CRM bilan ishlash.',
    ['Rus va o‘zbek tillari', 'Kompyuter savodxonligi'], 44, '/images/ishlar/ish-reception.jpg'),
  job('ts26-ish-bolalar', 'Bolalar stomatologi', 'bolalar', 'part', 'y3', 7000000, 11000000, 'Chilonzor tumani', 'Haftada 3 kun, bolalar kabineti alohida.',
    ['Bolalar bilan ishlash tajribasi'], 45, '/images/ishlar/ish-family.jpg'),
  job('ts26-ish-texnik', 'Tish texnigi (CAD/CAM)', 'texnik', 'full', 'y3', 9000000, 15000000, 'Chilonzor tumani', 'Exocad va frezer bilan ishlash, zirkoniy konstruksiyalar.',
    ['Exocad bilimi', '3+ yil tajriba'], 46, '/images/ishlar/ish-dentacare.jpg'),
]

const book = (id, title, author, cats, year, pages, lang, cover, blurb, about, category) => ({
  kind: 'book', id, owner: 9,
  payload: { id, title, author, cats, year, pages, lang, cover, gallery: [cover], blurb, about, category, price: null, stock: 'stock', formats: ['print'],
    rating: 0, reviews: 0, isbn: '', place: 'Toshkent', script: 'Lotin', seller: 'Ilm Kitob Do‘koni', sellerId: testUserId(9), publisher: 'other', publisherName: '' },
})
export const BOOKS = [
  book('ts26-kitob-endo-amaliyot', 'Endodontiya amaliyoti', 'R. Karimov', ['endo'], 2023, 240, 'uz', '/images/books/book-endo.jpg',
    'Kanal anatomiyasi, asboblar va obturatsiya bo‘yicha amaliy qo‘llanma.', 'Amaliyotchi shifokorlar uchun endodontik davolash bosqichlari, klinik misollar bilan.', 'Endodontiya'),
  book('ts26-kitob-kariyes', 'Kariyes va uning profilaktikasi', 'N. Tursunova', ['terapiya'], 2022, 180, 'uz', '/images/books/book-caries.jpg',
    'Kariyes etiologiyasi, tashxisi va oldini olish.', 'Talabalar va yosh shifokorlar uchun o‘quv qo‘llanma.', 'Terapevtik stomatologiya'),
  book('ts26-kitob-parodont', 'Parodontologiya asoslari', 'D. Rasulov', ['paro'], 2021, 210, 'uz', '/images/books/book-perio.jpg',
    'Parodont kasalliklari tasnifi va davolash usullari.', 'Klinik holatlar va davolash rejalari bilan.', 'Parodontologiya'),
  book('ts26-kitob-estetika', 'Estetik stomatologiya', 'S. Alimova', ['terapiya'], 2024, 260, 'uz', '/images/books/book-esthetic.jpg',
    'Rang, shakl va tabassum dizayni.', 'Kompozit va keramik restavratsiyalarda estetika tamoyillari.', 'Estetik stomatologiya'),
  book('ts26-kitob-anatomiya', 'Tish anatomiyasi atlasi', 'B. Qodirov', ['terapiya'], 2020, 150, 'uz', '/images/books/book-anatomy.jpg',
    'Doimiy va sut tishlari anatomiyasi rasmlarda.', 'Har bir tish uchun tavsif va sxemalar.', 'Anatomiya'),
]

const surplus = (id, name, type, brand, cat, price, oldPrice, expiryISO, image, note, qty) => ({
  kind: 'surplus', id, owner: 8,
  payload: { id, name, type, brand, cat, price, oldPrice, expiryISO, expiry: `${expiryISO.slice(5, 7)}/${expiryISO.slice(0, 4)}`, image, images: [image], note, qty,
    city: 'Toshkent', condition: 'Yopiq', rating: 0, reviews: 0, discount: oldPrice ? `-${Math.round((1 - price / oldPrice) * 100)}%` : null,
    seller: { name: 'Nur Dental Klinikasi', avatar: '', phone: testPhone(51), telegram: '' } },
})
export const SURPLUS = [
  surplus('ts26-ortiqcha-filtek', 'Filtek Z550 kompozit, A3', 'Kompozit (4 g)', '3M', 'komp', 240000, 330000, '2027-09', '/images/demo/ortiqcha/s1.webp', 'Ortiqcha buyurtma, 3 ta shprits ochilmagan.', 3),
  surplus('ts26-ortiqcha-bond', 'Adper Single Bond 2', 'Bond (6 ml)', '3M', 'bond', 300000, 420000, '2027-06', '/images/demo/ortiqcha/s2.webp', 'Muzlatkichda saqlangan, ochilmagan.', 2),
  surplus('ts26-ortiqcha-sement', 'RelyX Luting 2 sement', 'Sement', '3M', 'sement', 520000, 690000, '2027-04', '/images/demo/ortiqcha/s3.webp', 'Bitta to‘plam ortiqcha.', 1),
  surplus('ts26-ortiqcha-gc-fuji', 'GC Fuji II LC', 'Shisha-ionomer', 'GC', 'other', 380000, 520000, '2027-08', '/images/demo/ortiqcha/s4.webp', 'Yopiq qutida.', 2),
  surplus('ts26-ortiqcha-endo-fayl', 'ProTaper Next fayllar X1–X3', 'Endo fayllar', 'Dentsply', 'instr', 260000, 360000, '2028-01', '/images/demo/ortiqcha/s5.webp', 'Ikki to‘plam, ochilmagan.', 2),
]

export const CATALOG = [...MASTERS, ...DOCTORS, ...ADS, ...JOBS, ...BOOKS, ...SURPLUS].map((r, i) => ({ ...r, sort_at: 500 + i }))

export const COUNTS = {
  'Marketplace (stomatologik)': PRODUCTS.length, Forma: FORMA.length, Jihozlar: JIHOZ.length, Aksiyalar: PROMOS.length,
  Seminarlar: SEMINARS.length, 'Ta’lim kurslari': COURSES.length, Ustalar: MASTERS.length, Mutaxassislar: DOCTORS.length,
  'E’lonlar': ADS.length, Vakansiyalar: JOBS.length, Kitoblar: BOOKS.length, 'Ortiqcha material': SURPLUS.length, 'Sinov foydalanuvchilari': USERS.length,
}
