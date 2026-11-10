/**
 * Vaqtinchalik NAMUNA kontent (Forma, Ustalar, Ortiqcha material, E’lonlar).
 * Ibrohim «ko‘rinishini ko‘rish uchun» so‘ragan. Hammasi o‘ylab topilgan:
 * - haqiqiy odam ismi, telefoni yoki Telegram’i YO‘Q (aloqa tugmalari namunada o‘chiriladi);
 * - har bir qator catalog_items.is_demo = true va payload.isDemo = true bilan belgilanadi;
 * - rasmlar AI yordamida yaratilgan (odam yuzi va brend logotipi yo‘q), public/images/demo/ da.
 * Bu fayldan supabase/migrations/0063_demo_content.sql generatsiya qilinadi:
 *   node scripts/demo-content/build-sql.mjs
 */
const I = (sec, n) => `/images/demo/${sec}/${n}.webp`

const forma = [
  {
    id: 'demo-forma-stretch-lilac', title: 'Ayollar skrab to‘plami Stretch', brand: 'DentaStyle', cat: 'scrub', gender: 'female', fabric: 'stretch',
    sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: ['lilac', 'navy', 'teal'], price: 420000,
    about: 'Cho‘ziluvchan mato, V-yoqa, 5 ta cho‘ntak',
    story: 'Kun bo‘yi qabul qiladigan stomatologlar uchun yengil va cho‘ziluvchan skrab to‘plami. Ko‘ylak V-yoqali, shim belida rezinka va bog‘ichli, pastki qismi manjetli. 60 °C da yuvishga chidamli, rangini yo‘qotmaydi.',
    perks: [['Cho‘ziluvchan stretch mato', '5 ta amaliy cho‘ntak'], ['Manjetli jogger shim', '60 °C da yuvish mumkin']],
    image: I('forma', 'f1'),
  },
  {
    id: 'demo-forma-classic-navy', title: 'Erkaklar skrab to‘plami Classic', brand: 'MedFit', cat: 'scrub', gender: 'male', fabric: 'cotton',
    sizes: ['S', 'M', 'L', 'XL', '2XL'], colors: ['navy', 'teal', 'black'], price: 360000,
    about: 'Paxta-poliester, dumaloq yoqa, ko‘krak cho‘ntagi',
    story: 'Klassik bichimdagi erkaklar skrab to‘plami: dumaloq yoqali ko‘ylak va to‘g‘ri bichimli shim. 65% paxta, 35% poliester — nafas oladi va tez quriydi.',
    perks: [['65% paxta, 35% poliester', 'Ko‘krak cho‘ntagi'], ['To‘g‘ri bichimli shim', 'Dazmollash oson']],
    image: I('forma', 'f2'),
  },
  {
    id: 'demo-forma-xalat-oq', title: 'Uzun oq xalat (shifokor uchun)', brand: 'Oq Libos', cat: 'coat', gender: 'uni', fabric: 'premium',
    sizes: ['S', 'M', 'L', 'XL', '2XL'], colors: ['white'], price: 340000,
    about: 'Premium mato, 3 ta cho‘ntak, tugmali',
    story: 'Qabul, konsultatsiya va laboratoriya uchun uzun oq xalat. Zich premium mato g‘ijimlanmaydi, 3 ta cho‘ntak va yashirin tugmalar bilan.',
    perks: [['G‘ijimlanmaydigan mato', '3 ta cho‘ntak'], ['Erkak va ayollar uchun', 'Logo tikish mumkin']],
    image: I('forma', 'f3'),
  },
  {
    id: 'demo-forma-qalpoq-3', title: 'Tibbiy qalpoq — 3 dona to‘plam', brand: 'DentaStyle', cat: 'cap', gender: 'uni', fabric: 'cotton',
    sizes: ['M', 'L'], colors: ['teal', 'navy', 'white'], price: 95000,
    about: 'Paxta, rezinkali, bog‘ichli; tishcha naqshli',
    story: 'Uch xil rangdagi paxta qalpoqlar to‘plami: yashil, to‘q ko‘k va tishcha naqshli oq. Orqa qismi rezinkali va bog‘ichli — sochni to‘liq yopadi.',
    image: I('forma', 'f4'),
  },
  {
    id: 'demo-forma-klog-eva', title: 'Tibbiy poyabzal (klog) EVA', brand: 'StepMed', cat: 'shoe', gender: 'uni', fabric: 'premium',
    sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44'], colors: ['white', 'navy', 'black'], price: 240000,
    about: 'Yengil EVA, sirpanmaydigan taglik, orqa tasmali',
    story: 'Uzoq smenalar uchun yengil EVA klog. Taglik sirpanmaydi, havo teshiklari oyoqni terlatmaydi, orqa tasma oyoqni mahkam ushlab turadi. Avtoklavda emas, iliq suvda yuviladi.',
    image: I('forma', 'f5'),
  },
  {
    id: 'demo-forma-fartuk', title: 'Suv o‘tkazmaydigan fartuk', brand: 'MedFit', cat: 'apron', gender: 'uni', fabric: 'anti',
    sizes: ['M', 'L'], colors: ['teal', 'black'], price: 120000,
    about: 'Suv va dog‘ o‘tkazmaydi, bo‘yin va bel bog‘ichli',
    story: 'Gigiyenist, assistent va texniklar uchun suv o‘tkazmaydigan fartuk. Dog‘ va dezinfeksiya vositalariga chidamli, oson artiladi.',
    image: I('forma', 'f6'),
  },
  {
    id: 'demo-forma-himoya-kozoynak', title: 'Himoya ko‘zoynagi va yuz ekrani', brand: 'SafeView', cat: 'accessory', gender: 'uni', fabric: 'anti',
    sizes: ['M'], colors: ['blue'], price: 145000,
    about: 'Shaffof ekran + ko‘zoynak, tumanlanmaydi',
    story: 'Aerozol hosil qiluvchi muolajalar uchun to‘plam: tumanlanmaydigan shaffof yuz ekrani (sozlanadigan bosh tasmasi bilan) va yon himoyali ko‘zoynak.',
    image: I('forma', 'f7'),
  },
  {
    id: 'demo-forma-antibakterial-bordo', title: 'Antibakterial skrab to‘plami', brand: 'Oq Libos', cat: 'scrub', gender: 'uni', fabric: 'anti',
    sizes: ['S', 'M', 'L', 'XL'], colors: ['wine', 'green', 'navy'], price: 480000,
    about: 'Antibakterial ishlov, tez quriydi, 4 ta cho‘ntak',
    story: 'Antibakterial ishlov berilgan matodan tikilgan uniseks skrab to‘plami. Jarrohlik va implantologiya kabinetlari uchun qulay, ko‘p marta yuvishga chidamli.',
    perks: [['Antibakterial ishlov', 'Tez quriydi'], ['Uniseks bichim', '4 ta cho‘ntak']],
    image: I('forma', 'f8'),
  },
].map((p, i) => ({ ...p, rank: i, rating: 0, reviews: 0, fresh: false, gallery: [p.image] }))

const svc = (name, price, meta) => ({ name, price, meta })
const ustalar = [
  {
    id: 'demo-usta-texnodent', name: 'TexnoDent Servis', role: 'Ustanovka ta’miri va servis xizmati', city: 'Toshkent', district: 'Chilonzor',
    years: 8, jobs: 0, status: 'online', cats: ['unit', 'install'], tags: ['Ustanovka', 'Gidravlika', 'Elektronika'], brands: ['Fengdan', 'Anya', 'Siger'],
    photo: I('ustalar', 'u1'), works: [I('ustalar', 'u1'), I('ustalar', 'u6'), I('ustalar', 'u3'), I('ustalar', 'u2')],
    about: 'Stomatologik ustanovkalarni diagnostika, ta’mirlash va profilaktik servis. Gidravlika, plata va pedal ta’miri, shlanglar almashtirish.',
    services: [svc('Chaqiruv va diagnostika (Toshkent)', '150 000 so‘m', 'Kafolat: 3 oy'), svc('Gidravlika ta’miri', 'dan 400 000 so‘m', 'Ehtiyot qism alohida'), svc('Yillik profilaktik servis', '600 000 so‘m', '1 ta ustanovka')],
  },
  {
    id: 'demo-usta-turbofix', name: 'TurboFix ustaxonasi', role: 'Uchlik, turbina va mikromotor ta’miri', city: 'Toshkent', district: 'Yunusobod',
    years: 6, jobs: 0, status: 'online', cats: ['handpiece'], tags: ['Turbina', 'Uchlik', 'Mikromotor'], brands: ['NSK', 'W&H', 'KaVo'],
    photo: I('ustalar', 'u2'), works: [I('ustalar', 'u2'), I('ustalar', 'u1'), I('ustalar', 'u5'), I('ustalar', 'u3')],
    about: 'Turbina va burchakli uchliklar ta’miri: podshipnik, rotor, tugmali qopqoq almashtirish. Ta’mirdan keyin aylanish tezligi va shovqin tekshiriladi.',
    services: [svc('Turbina podshipnik almashtirish', 'dan 280 000 so‘m', '1–2 kun'), svc('Burchakli uchlik ta’miri', 'dan 350 000 so‘m', 'Kafolat: 3 oy'), svc('Diagnostika', 'Bepul', 'Ustaxonada')],
  },
  {
    id: 'demo-usta-samarqand-servis', name: 'Samarqand Dental Servis', role: 'Kompressor va avtoklav servisi', city: 'Samarqand', district: 'Markaz',
    years: 10, jobs: 0, status: 'soon', cats: ['compressor', 'autoclave'], tags: ['Kompressor', 'Avtoklav', 'Sterilizatsiya'], brands: ['Cattani', 'Melag', 'Runyes'],
    photo: I('ustalar', 'u3'), works: [I('ustalar', 'u3'), I('ustalar', 'u1'), I('ustalar', 'u6'), I('ustalar', 'u4')],
    about: 'Kompressorlarda filtr, klapan va dvigatel servisi; avtoklavlarda germetiklik, sensor va nasos ta’miri. Samarqand viloyati bo‘ylab chiqib ishlaymiz.',
    services: [svc('Kompressor servis (filtr + moy)', '350 000 so‘m', 'Kafolat: 6 oy'), svc('Avtoklav germetiklik tekshiruvi', '250 000 so‘m', 'Vakuum testi bilan'), svc('Chaqiruv (Samarqand)', '100 000 so‘m', 'Shahar ichida')],
  },
  {
    id: 'demo-usta-rentgentex', name: 'RentgenTex markazi', role: 'Rentgen va CBCT servis muhandislari', city: 'Toshkent', district: 'Mirzo Ulug‘bek',
    years: 12, jobs: 0, status: 'offline', cats: ['cbct'], tags: ['CBCT', 'Panoramik rentgen', 'Kalibrovka'], brands: ['Vatech', 'Planmeca', 'Carestream'],
    photo: I('ustalar', 'u4'), works: [I('ustalar', 'u4'), I('ustalar', 'u5'), I('ustalar', 'u6'), I('ustalar', 'u1')],
    about: 'Panoramik va CBCT apparatlarni o‘rnatish, fantom bilan kalibrovka, sensor va dasturiy ta’minot sozlash. Radiatsiya xavfsizligi hujjatlariga yordam.',
    services: [svc('CBCT kalibrovka', 'dan 1 200 000 so‘m', 'Fantom bilan'), svc('Rentgen sensor diagnostikasi', '300 000 so‘m', '1 kun'), svc('Dasturiy ta’minot sozlash', '400 000 so‘m', 'Masofadan ham')],
  },
  {
    id: 'demo-usta-digitallab', name: 'DigitalLab CAD/CAM', role: 'Skaner va frezer servis, raqamli laboratoriya', city: 'Toshkent', district: 'Yakkasaroy',
    years: 5, jobs: 0, status: 'online', cats: ['scan'], tags: ['Intraoral skaner', 'Frezer', 'CAD/CAM'], brands: ['Shining 3D', 'Medit', 'Roland'],
    photo: I('ustalar', 'u5'), works: [I('ustalar', 'u5'), I('ustalar', 'u4'), I('ustalar', 'u2'), I('ustalar', 'u3')],
    about: 'Intraoral skanerlarni kalibrovka va dasturiy yangilash, frezerlash stanoklarida shpindel servisi. Klinikalar uchun raqamli ish jarayonini sozlab beramiz.',
    services: [svc('Skaner kalibrovkasi', '350 000 so‘m', '1–2 soat'), svc('Frezer shpindel servisi', 'dan 900 000 so‘m', 'Kafolat: 6 oy'), svc('Raqamli ish jarayoni sozlash', 'Kelishiladi', 'Klinikaga chiqib')],
  },
  {
    id: 'demo-usta-andijon-montaj', name: 'Andijon Med Montaj', role: 'Uskuna o‘rnatish va kabinet montaji', city: 'Andijon', district: 'Markaz',
    years: 7, jobs: 0, status: 'online', cats: ['install', 'unit'], tags: ['O‘rnatish', 'Montaj', 'Suv-havo ulash'], brands: ['Fengdan', 'Siger', 'Woson'],
    photo: I('ustalar', 'u6'), works: [I('ustalar', 'u6'), I('ustalar', 'u1'), I('ustalar', 'u3'), I('ustalar', 'u4')],
    about: 'Yangi kabinet ochishda ustanovka, kompressor, aspirator va avtoklavni o‘rnatish, suv-havo va elektr ulash. Farg‘ona vodiysi bo‘ylab.',
    services: [svc('Ustanovka o‘rnatish', '700 000 so‘m', 'Ulash va sozlash bilan'), svc('Kabinet montaji (to‘liq)', 'dan 2 500 000 so‘m', '2–3 kun'), svc('Chaqiruv (Andijon)', '100 000 so‘m', 'Shahar ichida')],
  },
].map((m) => ({ ...m, rating: 0, reviews: 0, reply: '~1 soat' }))

const ortiqcha = [
  { id: 'demo-ortiqcha-kompozit-a2', name: 'Nanogibrid kompozit, A2 rang', type: 'Kompozit (shprits, 4 g)', brand: '3M', cat: 'komp', qty: 2, condition: 'Yopiq', expiry: '08/2027', expiryISO: '2027-08', city: 'Toshkent', price: 290000, image: I('ortiqcha', 's1'), note: 'Klinikaga ortiqcha buyurtma qilingan, 2 ta shprits ochilmagan. Xona haroratida, quyoshsiz joyda saqlangan.' },
  { id: 'demo-ortiqcha-bond-6ml', name: 'Universal adgeziv (bond), 6 ml', type: 'Adgeziv (flakon, 6 ml)', brand: 'Kuraray', cat: 'bond', qty: 1, condition: 'Ochilgan', expiry: '03/2027', expiryISO: '2027-03', city: 'Samarqand', price: 180000, image: I('ortiqcha', 's2'), note: 'Taxminan 80% qolgan. Muzlatgichda saqlangan, 20 ta mikroapplikator sovg‘a.' },
  { id: 'demo-ortiqcha-sib-sement', name: 'Shisha-ionomer sement (kukun + suyuqlik)', type: 'Sement (15 g + 10 ml)', brand: 'GC', cat: 'sement', qty: 1, condition: 'Yopiq', expiry: '11/2027', expiryISO: '2027-11', city: 'Andijon', price: 420000, image: I('ortiqcha', 's3'), note: 'Yangi, qadog‘i ochilmagan. Restavratsiya va fissura germetizatsiyasi uchun.' },
  { id: 'demo-ortiqcha-implant-41', name: 'Dental implant 4.1 × 10 mm', type: 'Implant (steril qadoq)', brand: 'Osstem', cat: 'impl', qty: 2, condition: 'Yopiq', expiry: '06/2029', expiryISO: '2029-06', city: 'Toshkent', price: 1600000, image: I('ortiqcha', 's4'), note: 'Bemor rejasi o‘zgargani uchun ishlatilmay qoldi. Steril qadoq butun, narx 1 dona uchun.' },
  { id: 'demo-ortiqcha-nitifayl', name: 'Mashina NiTi fayllar, F1–F3', type: 'Endo fayllar (blister, 6 dona)', brand: 'Dentsply', cat: 'instr', qty: 3, condition: 'Yopiq', expiry: '05/2028', expiryISO: '2028-05', city: 'Namangan', price: 260000, image: I('ortiqcha', 's5'), note: '3 ta blister ochilmagan. Endodontiya uchun, 25 mm.' },
  { id: 'demo-ortiqcha-artikain', name: 'Artikain 4% 1:100 000 karpula', type: 'Anestetik (50 karpula)', brand: 'Septodont', cat: 'anes', qty: 1, condition: 'Yopiq', expiry: '02/2027', expiryISO: '2027-02', city: 'Buxoro', price: 520000, image: I('ortiqcha', 's6'), note: 'Quti yopiq, saqlash sharoitiga rioya qilingan. Faqat litsenziyali klinikaga.' },
  { id: 'demo-ortiqcha-alginat', name: 'Alginat qolip massasi, 453 g', type: 'Qolip massasi (453 g)', brand: 'Zhermack', cat: 'other', qty: 2, condition: 'Ochilgan', expiry: '09/2027', expiryISO: '2027-09', city: 'Farg‘ona', price: 85000, image: I('ortiqcha', 's7'), note: '1 ta paket ochilgan (yarmi qolgan), 1 tasi yopiq. O‘lchov qoshig‘i bilan.' },
].map((s) => ({ ...s, images: [s.image], rating: 0, reviews: 0, oldPrice: null, discount: null, seller: { name: 'Namuna sotuvchi', avatar: '' } }))

const spec = (k, l, v) => [k, l, v]
const ad = (a) => ({
  original: false, views: 0, status: 'active', features: [], seller: '',
  sellerInfo: { name: a.deal === 'job' ? 'Namuna klinika' : 'Namuna sotuvchi', type: a.sellerType || 'Xususiy shaxs', rating: null, since: '2026', avatar: '' },
  ...a,
})
const elonlar = [
  ad({ id: 'demo-elon-ustanovka-2021', deal: 'sale', cat: 'uskuna', title: 'Stomatologik ustanovka, 2021-yil', sub: 'Yaxshi holatda, kompressor bilan birga', price: 48000000, city: 'Toshkent', date: '8 noy 2026', cond: 'Ishlatilgan', images: [I('elonlar', 'e1')],
    specs: [spec('year', 'Yili', '2021'), spec('place', 'Shahar', 'Toshkent'), spec('cond', 'Holati', 'Ishlatilgan')],
    about: 'Klinika kengaygani uchun sotiladi. Ustanovka 4 yil ishlatilgan, muntazam servis qilingan. Yuqori va past tezlikdagi uchlik shlanglari, LED chiroq, assistent bloki bor. Kompressor sovg‘a.',
    features: ['LED operatsion chiroq', 'Assistent bloki', 'Kompressor bilan', 'Servis hujjatlari bor'] }),
  ad({ id: 'demo-elon-avtoklav-18', deal: 'sale', cat: 'uskuna', title: 'Avtoklav 18 L, B-klass', sub: 'Vakuum testi joyida, 2 yil ishlatilgan', price: 14500000, city: 'Samarqand', date: '7 noy 2026', cond: 'Ishlatilgan', images: [I('elonlar', 'e2')],
    specs: [spec('size', 'Hajmi', '18 L'), spec('place', 'Shahar', 'Samarqand'), spec('cond', 'Holati', 'Ishlatilgan')],
    about: 'B-klass avtoklav, 18 litr. Vakuum va Bowie-Dick testlari muvaffaqiyatli. 3 ta patnis va printer kabeli bilan beriladi.',
    features: ['B-klass, vakuumli', '3 ta patnis', 'Testlar joyida'] }),
  ad({ id: 'demo-elon-kabinet-ijara', deal: 'rent', cat: 'klinika', title: 'Stomatologiya kabineti ijaraga — 2 kreslo', sub: 'Yunusobod, 65 m², ta’mirlangan, jihozlari bilan', price: 9000000, city: 'Toshkent', date: '9 noy 2026', cond: 'Jihozlangan', sellerType: 'Mulk egasi', images: [I('elonlar', 'e3')],
    specs: [spec('area', 'Maydoni', '65 m²'), spec('place', 'Shahar', 'Toshkent'), spec('cond', 'Holati', 'Jihozlangan')],
    about: 'Birinchi qavatda, alohida kirish yo‘li bilan. 2 ta davolash xonasi, qabulxona, sterilizatsiya xonasi va sanuzel. Kreslolar, kompressor va avtoklav ijaraga kiradi. Kamida 1 yilga.',
    features: ['2 ta davolash xonasi', 'Sterilizatsiya xonasi', 'Alohida kirish', 'Avtoturargoh bor'] }),
  ad({ id: 'demo-elon-terapevt-kerak', deal: 'job', cat: 'ish', title: 'Stomatolog-terapevt kerak', sub: 'To‘liq stavka, tajriba 2 yildan', price: 8000000, priceMax: 15000000, city: 'Toshkent', date: '9 noy 2026', cond: 'To‘liq stavka', sellerType: 'Xususiy klinika', images: [I('elonlar', 'e4')],
    specs: [spec('exp', 'Tajriba', '2 yildan'), spec('place', 'Shahar', 'Toshkent'), spec('time', 'Bandlik', 'To‘liq stavka')],
    about: 'Chilonzordagi klinikaga terapevt-stomatolog kerak. Ish vaqti 09:00–18:00, haftada 6 kun (navbat bilan). Maosh: belgilangan qism + bajarilgan ishdan foiz. Rasmiy ishga olinadi.',
    features: ['Rasmiy ishga olish', 'Foiz + belgilangan maosh', 'Zamonaviy jihozlar', 'Malaka oshirish'] }),
  ad({ id: 'demo-elon-assistent-kerak', deal: 'job', cat: 'ish', title: 'Stomatolog assistenti kerak', sub: 'Smenali ish, o‘qitib olamiz', price: 3500000, priceMax: 5000000, city: 'Andijon', date: '6 noy 2026', cond: 'Smenali', sellerType: 'Xususiy klinika', images: [I('elonlar', 'e5')],
    specs: [spec('exp', 'Tajriba', 'Shart emas'), spec('place', 'Shahar', 'Andijon'), spec('time', 'Bandlik', 'Smenali')],
    about: 'Tibbiyot kolleji bitiruvchilari ham qabul qilinadi — ish joyida o‘qitamiz. Vazifalar: instrumentlarni tayyorlash, sterilizatsiya, shifokorga yordam.',
    features: ['O‘qitib olamiz', 'Smenali grafik', 'Tushlik bepul'] }),
  ad({ id: 'demo-elon-endomotor', deal: 'sale', cat: 'asbob', title: 'Endomotor + apekslokator to‘plami', sub: 'Simsiz, 1 yil ishlatilgan, qutisi bor', price: 6200000, city: 'Namangan', date: '5 noy 2026', cond: 'Ishlatilgan', images: [I('elonlar', 'e6')],
    specs: [spec('brand', 'Turi', 'Endomotor'), spec('place', 'Shahar', 'Namangan'), spec('cond', 'Holati', 'Ishlatilgan')],
    about: 'Simsiz endomotor (reciproc va rotatsion rejimlar) va alohida apekslokator. Akkumulyator yaxshi ushlaydi, barcha kabel va kliplar bor.',
    features: ['Reciproc rejimi', 'Apekslokator bilan', 'Qutisi va zaryadlagichi bor'] }),
  ad({ id: 'demo-elon-intraoral-skaner', deal: 'sale', cat: 'uskuna', title: 'Intraoral skaner, 2023-yil', sub: 'Noutbuk va 6 ta uchlik bilan', price: 95000000, city: 'Toshkent', date: '4 noy 2026', cond: 'Ishlatilgan', images: [I('elonlar', 'e7')],
    specs: [spec('year', 'Yili', '2023'), spec('place', 'Shahar', 'Toshkent'), spec('cond', 'Holati', 'Ishlatilgan')],
    about: 'Raqamli ishga to‘liq o‘tdik, ikkinchi skaner ortiqcha bo‘ldi. Litsenziya faol, noutbuk, zaryadlash stansiyasi va 6 ta avtoklavlanadigan uchlik bilan.',
    features: ['Litsenziya faol', 'Noutbuk bilan', '6 ta uchlik', 'Ko‘rib, sinab olish mumkin'] }),
  ad({ id: 'demo-elon-jarrohlik-toplam', deal: 'sale', cat: 'asbob', title: 'Jarrohlik asboblari to‘plami (12 dona)', sub: 'Yangi, kassetada, zanglamaydigan po‘lat', price: 3800000, city: 'Buxoro', date: '3 noy 2026', cond: 'Yangi', images: [I('elonlar', 'e8')],
    specs: [spec('size', 'Soni', '12 dona'), spec('place', 'Shahar', 'Buxoro'), spec('cond', 'Holati', 'Yangi')],
    about: 'Tish olish qisqichlari, elevatorlar, skalpel dastasi, igna ushlagich va qaychilar. Sterilizatsiya kassetasi bilan. Ishlatilmagan.',
    features: ['Zanglamaydigan po‘lat', 'Sterilizatsiya kassetasi', 'Ishlatilmagan'] }),
]

export const DEMO_SECTIONS = { uniform: forma, master: ustalar, surplus: ortiqcha, ad: elonlar }

/** catalog_items qatorlari: payload.isDemo = true, aloqa (phone/telegram) umuman yo‘q. */
export function demoRows() {
  const rows = []
  Object.entries(DEMO_SECTIONS).forEach(([kind, list]) => {
    list.forEach((item, i) => rows.push({ kind, id: item.id, sort_at: 1000 + i, payload: { ...item, isDemo: true } }))
  })
  return rows
}
