const img = (name) => `/images/yangiliklar/${name}.jpg`

const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']

export const cats = [
  ['all', 'Barchasi'],
  ['soha', 'Soha yangiliklari'],
  ['tadbir', 'Tadbirlar'],
  ['tech', 'Texnologiyalar'],
  ['qonun', 'Qonunchilik'],
  ['kompaniya', 'Kompaniyalar'],
  ['intervyu', 'Intervyular'],
]
export const catName = Object.fromEntries(cats.filter(([k]) => k !== 'all'))

export const people = {
  dilshod: { name: 'Dilshod Karimov', role: 'Bosh muharrir', photo: img('yang-dilshod') },
  sardor: {
    name: 'Dr. Sardor Karimov', role: 'Stomatolog-implantolog', photo: img('yang-sardor'),
    years: '8+ yil tajriba', focus: 'Implantologiya – asosiy yo‘nalish', clinic: 'Dent Smile Clinic', city: 'Toshkent, Yakkasaroy', verified: true,
  },
  shavkat: { name: 'Dr. Shavkat Mirzayev', role: 'Raqamli stomatologiya', photo: img('yang-interview') },
}

export function longDate(d) {
  const [dd, mm, yyyy] = d.split('.')
  return `${Number(dd)}-${months[Number(mm) - 1]} ${yyyy}`
}
export const viewsOf = (n) => Number(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')

const post = (p) => ({ author: 'dilshod', kind: catName[p.cat], ...p })

export const articles = [
  post({
    id: 'dental-expo-2026', featured: true, rank: 0, cat: 'tadbir',
    title: 'Toshkentda Dental Expo 2026 ko‘rgazmasi o‘tkazildi',
    excerpt: '2026-yil 15–17-aprel kunlari Toshkentda Markaziy Osiyodagi eng yirik stomatologik ko‘rgazma — Dental Expo 2026 bo‘lib o‘tadi. Tadbirda dunyoning yetakchi brendlari, zamonaviy texnologiyalar va mahorat darslari taqdim etiladi.',
    date: '12.12.2024', views: 2450, minutes: 5, image: img('yang-expo'),
    sections: [
      { id: 'haqida', title: 'Ko‘rgazma haqida', body: ['2026-yil 15–17-aprel kunlari Toshkentda Markaziy Osiyodagi eng yirik stomatologik ko‘rgazma — Dental Expo 2026 bo‘lib o‘tadi. Tadbirda dunyoning yetakchi brendlari, zamonaviy texnologiyalar va mahorat darslari taqdim etiladi.'] },
      { id: 'qayerda', title: 'Qachon va qayerda', body: ['Ko‘rgazma Toshkentdagi CAEx maydonida o‘tadi. Uch kun davomida klinika rahbarlari, shifokorlar va distribyutorlar bir joyda uchrashadi.'] },
      { id: 'nima', title: 'Nimalar taqdim etiladi', body: ['Jihozlar, materiallar, raqamli skanerlar va implant tizimlari. Alohida zallarda qisqa mahorat darslari bo‘ladi.'] },
      { id: 'xulosa', title: 'Xulosa', body: ['Ishtirokchi bo‘lish uchun oldindan ro‘yxatdan o‘tish qulay. Chipta narxi 450 000 so‘m.'] },
    ],
  }),
  post({
    id: 'raqamli-implantologiya', rank: 1, cat: 'tech',
    title: 'Raqamli implantologiya: yangi protokollar va imkoniyatlar',
    excerpt: 'Raqamli rejalashtirish implant o‘rnini aniqroq belgilashga yordam beradi. Klinikalar yangi protokollarni bosqichma-bosqich joriy qilmoqda.',
    date: '10.12.2024', views: 1320, minutes: 4, image: img('yang-digital'),
  }),
  post({
    id: 'litsenziya-talablari', rank: 2, cat: 'qonun',
    title: 'Stomatologiya klinikalari uchun yangi litsenziya talablari ma’lum qilindi',
    excerpt: 'Litsenziya uchun xona, jihoz va mutaxassis tarkibiga oid yangilangan talablar e’lon qilindi. Klinika rahbarlari hujjatlarni qayta ko‘rib chiqishi kerak.',
    date: '08.12.2024', views: 980, minutes: 3, image: img('yang-license'),
  }),
  post({
    id: 'intraoral-skaner', rank: 3, cat: 'soha',
    title: 'Intraoral skanerlar narxi pasaymoqda: bozor tahlili',
    excerpt: 'So‘nggi oylarda intraoral skanerlarning kirish narxi pasaydi. Kichik klinikalar ham raqamli qolipga o‘tishni ko‘rib chiqmoqda.',
    date: '06.12.2024', views: 1760, minutes: 4, image: img('yang-scanner'),
  }),
  post({
    id: 'intervyu-shavkat', rank: 4, cat: 'intervyu', author: 'shavkat',
    title: '“Zamonaviy klinikada raqamli oqim” — Dr. Shavkat Mirzayev bilan intervyu',
    excerpt: 'Dr. Shavkat Mirzayev raqamli oqim klinikada qanday joriy qilingani, jamoa o‘qishi va bemor vaqti haqida gapirdi.',
    date: '05.12.2024', views: 1120, minutes: 6, image: img('yang-interview'),
  }),
  post({
    id: 'dentsply-markaz', rank: 5, cat: 'kompaniya',
    title: 'Dentsply Sirona O‘zbekistonda yangi o‘quv markazini ochdi',
    excerpt: 'Kompaniya shifokorlar uchun yangi o‘quv markazini ishga tushirdi. Dastlabki kurslar raqamli diagnostika va restavratsiyaga bag‘ishlangan.',
    date: '03.12.2024', views: 950, minutes: 3, image: img('yang-training'),
  }),
  post({
    id: 'turbina-parvarish', rank: 6, cat: 'soha',
    title: 'Turbina va uchliklar parvarishi: foydali tavsiyalar',
    excerpt: 'To‘g‘ri tozalash va moylash turbinaning umrini uzaytiradi. Kunlik oddiy tartib nosozlikni kamaytiradi.',
    date: '01.12.2024', views: 2340, minutes: 5, image: img('yang-turbine'),
  }),
  post({
    id: 'xalqaro-seminar', rank: 7, cat: 'tadbir',
    title: 'Stomatologlar uchun xalqaro seminar o‘tkazildi',
    excerpt: 'Seminarda xorijiy ma’ruzachilar klinik holatlarni tahlil qildi. Ishtirokchilar qisqa amaliy mashg‘ulotda qatnashdi.',
    date: '28.11.2024', views: 870, minutes: 3, image: img('yang-seminar'),
  }),
  post({
    id: 'aligner-holatlar', rank: 8, cat: 'tech',
    title: 'Shaffof tish qatorlari (alignerlar): klinik holatlar va natijalar',
    excerpt: 'Alignerlar yengil va o‘rta holatlarda yaxshi natija beradi. Reja va nazorat tashriflari muvaffaqiyatni belgilaydi.',
    date: '25.11.2024', views: 1140, minutes: 4, image: img('yang-aligner'),
  }),
  post({
    id: 'yangi-tarmoq', rank: 9, cat: 'kompaniya',
    title: 'O‘zbekistonda yangi stomatologiya klinikasi tarmog‘i ish boshladi',
    excerpt: 'Yangi tarmoq birinchi filialini ochdi. E’lon qilingan rejada diagnostika va oilaviy qabul bor.',
    date: '20.11.2024', views: 1210, minutes: 3, image: img('yang-clinic'),
  }),
  post({
    id: 'dental-implantlar', rank: 10, cat: 'tech', badge: 'Implantologiya', author: 'sardor', kind: 'Tibbiy maqola',
    title: 'Dental implantlar: afzalliklari va kimlarga tavsiya etiladi?',
    excerpt: 'Dental implantlar — yo‘qolgan tishlarni tiklashning zamonaviy va eng ishonchli usullaridan biri. Ushbu maqolada implantlarning asosiy afzalliklari, jarayon bosqichlari va kimlarga tavsiya etilishi haqida batafsil ma’lumot beramiz.',
    date: '20.10.2026', dateLong: '20-oktabr 2026', views: 1860, minutes: 5, image: img('yang-hero'),
    figure: img('yang-models'),
    related: ['all-on-4', 'implant-koprik'],
    sections: [
      { id: 'nima', title: 'Dental implant nima?', body: ['Dental implant — bu jag‘ suyagi ichiga o‘rnatiladigan sun‘iy tish ildizi bo‘lib, uning ustiga doimiy koronka o‘rnatiladi. U tabiiy tishga eng yaqin funksional va estetik yechim hisoblanadi.', 'Implant odatda titan yoki titan qotishmasidan yasaladi. Suyak bilan qo‘shilgach, ustiga tayanch va keramik koronka o‘rnatiladi.'] },
      { id: 'afzal', title: 'Asosiy afzalliklari', body: ['Qo‘shni sog‘lom tishlarni yedirish shart emas. Implant mustaqil tayanch bo‘ladi va suyak hajmining pasayishini sekinlashtiradi.', 'To‘g‘ri parvarishda uzoq yil xizmat qiladi, chaynash qulaylashadi va tabassum tabiiy ko‘rinishda qoladi.'] },
      { id: 'kimga', title: 'Kimlarga tavsiya etiladi?', body: ['Bir yoki bir nechta tishi yo‘q, milk to‘qimasi tinch va umumiy salomatligi barqaror bemorlarga ko‘rib chiqiladi.', 'Nazoratsiz surunkali kasallik yoki yetarli suyak bo‘lmaganda shifokor avval tayyorgarlik rejasini tuzadi. Qaror har bir bemor uchun alohida qabul qilinadi.'] },
      { id: 'jarayon', title: 'Jarayon bosqichlari', body: ['Avval ko‘rik, tasviriy tekshiruv va reja. Keyin implant o‘rnatiladi va suyak bilan qo‘shilishi kutiladi. So‘ngra koronka tayyorlanadi.', 'Muddat suyak holati va tanlangan usulga qarab farq qiladi. Shifokor har bir bosqichni oldindan tushuntiradi.'] },
      { id: 'xavf', title: 'Ehtimoliy xavflar', body: ['Shish, noqulaylik yoki yallig‘lanish bo‘lishi mumkin. Gigiyena va nazorat tashriflari bu xavfni kamaytiradi.', 'Chekish va o‘z vaqtida kelmaslik natijani yomonlashtirishi mumkin. Shubha bo‘lsa, klinikaga murojaat qiling.'] },
      { id: 'xulosa', title: 'Xulosa', body: ['Dental implant yo‘qolgan tishni tiklashning ishonchli yo‘llaridan biri. Afzallik va moslik shifokor ko‘rigidan keyin aniq bo‘ladi.', 'Qaror qabul qilishdan oldin tajribali implantolog bilan reja, muddat va parvarishni kelishib oling.'] },
    ],
  }),
  post({ id: 'implant-narx', rank: 11, cat: 'soha', popular: 1, title: 'Implant narxlari 2025-yilda qanday o‘zgaradi?', excerpt: 'Implant narxiga tizim, suyak holati va koronka turi ta’sir qiladi. 2025-yil uchun bozor oralig‘i kengaymoqda.', date: '02.12.2024', views: 5230, minutes: 4, image: img('yang-models') }),
  post({ id: 'bolalar-milk', rank: 12, cat: 'soha', popular: 2, title: 'Bolalarda milk kasalliklari: oldini olish usullari', excerpt: 'Bolada milk yallig‘lanishining oldini olish uy gigiyenasi va muntazam ko‘rikdan boshlanadi.', date: '29.11.2024', views: 4120, minutes: 4, image: img('yang-kids') }),
  post({ id: 'aligner-kimga', rank: 13, cat: 'tech', popular: 3, title: 'Alignerlar: kimlarga mos va qancha vaqt kerak?', excerpt: 'Aligner yengil siqilish va tishlar orasidagi bo‘shliqda ko‘rib chiqiladi. Muddat reja murakkabligiga bog‘liq.', date: '27.11.2024', views: 3980, minutes: 5, image: img('yang-aligner') }),
  post({ id: 'lampalar', rank: 14, cat: 'tech', popular: 4, title: 'Stomatologik lampalar: qaysi model yaxshiroq?', excerpt: 'Yorug‘lik harorati, soya va qo‘l harakati lampani tanlashda asosiy mezon. Klinikadagi ish turiga qarab farq qiladi.', date: '21.11.2024', views: 3760, minutes: 4, image: img('yang-lamp') }),
  post({ id: 'klinika-ochish', rank: 15, cat: 'qonun', popular: 5, title: 'Klinika ochish: bosqichma-bosqich qo‘llanma', excerpt: 'Joy, litsenziya, jihoz va jamoa. Klinika ochish shu to‘rt qadam atrofida rejalashtiriladi.', date: '18.11.2024', views: 3410, minutes: 6, image: img('yang-clinic') }),
  post({
    id: 'all-on-4', rank: 16, cat: 'tech', badge: 'Implantologiya', author: 'sardor',
    title: 'All-on-4 texnologiyasi haqida to‘liq ma’lumot',
    excerpt: 'All-on-4 to‘liq tish qatorini kamroq tayanchda tiklash usuli. Moslik suyak hajmi va umumiy holatga qarab hal qilinadi.',
    date: '15.10.2026', views: 1640, minutes: 6, image: img('yang-models'),
  }),
  post({
    id: 'implant-koprik', rank: 17, cat: 'soha', badge: 'Tibbiy maslahat', author: 'sardor', kind: 'Tibbiy maslahat',
    title: 'Implant va ko‘prik: qaysi biri yaxshiroq?',
    excerpt: 'Ko‘prik qo‘shni tishlarga tayanadi, implant esa alohida tayanch bo‘ladi. Tanlov nuqson, suyak va bemor kutilmasiga bog‘liq.',
    date: '02.10.2026', views: 2090, minutes: 5, image: img('yang-hero'),
  }),
]

export const events = [
  { id: 'expo', day: '15', month: 'APR', title: 'Dental Expo 2026', place: 'Toshkent, CAEx', price: '450 000 so‘m', article: 'dental-expo-2026' },
  { id: 'raqamli', day: '22', month: 'YAN', title: 'Raqamli implantologiya seminari', place: 'Toshkent', price: '250 000 so‘m', article: 'raqamli-implantologiya' },
  { id: 'bolalar', day: '10', month: 'FEV', title: 'Bolalar stomatologiyasi mahorat darsi', place: 'Samarqand', price: '200 000 so‘m', article: 'bolalar-milk' },
]

export function getArticle(id) {
  return articles.find((a) => a.id === id) || null
}

export function sectionsOf(a) {
  if (a.sections) return a.sections
  return [
    { id: 'mazmun', title: 'Asosiy mazmun', body: [a.excerpt, `${a.title} mavzusi bo‘yicha StomaHub tahririyati shifokorlar va klinika rahbarlari fikrini jamlagan.`] },
    { id: 'tafsilot', title: 'Muhim tafsilotlar', body: [`Material ${a.date} holatiga ko‘ra tayyorlangan. Raqamlar va talablar o‘zgarishi mumkin, shu bois rasmiy manbani ham tekshiring.`] },
    { id: 'kimga', title: 'Kimlar uchun foydali', body: ['Klinika rahbarlari, shifokorlar va o‘quv markazlari uchun qisqa yo‘l xaritasi.'] },
    { id: 'xulosa', title: 'Xulosa', body: ['Yangilikni jamoangiz bilan ko‘rib chiqing va keyingi qadamni klinikangiz holatiga qarab belgilang.'] },
  ]
}

export function relatedOf(a) {
  const ids = a.related || articles.filter((x) => x.id !== a.id && x.cat === a.cat).slice(0, 2).map((x) => x.id)
  return ids.map(getArticle).filter(Boolean)
}

export const popular = articles.filter((a) => a.popular).sort((a, b) => a.popular - b.popular)
