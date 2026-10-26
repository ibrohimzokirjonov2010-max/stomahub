const img = (n) => `/images/${n}.jpg`

export const DEALS = [
  ['sale', 'Sotiladi'],
  ['rent', 'Ijaraga'],
  ['job', 'Ish o‘rni'],
]
export const dealName = Object.fromEntries(DEALS)

export const AD_CATS = [
  ['all', 'Barchasi'],
  ['uskuna', 'Uskunalar'],
  ['material', 'Materiallar'],
  ['klinika', 'Klinika'],
  ['ish', 'Ish o‘rni'],
  ['asbob', 'Asboblar'],
]
export const adCatName = Object.fromEntries(AD_CATS)
export const AD_CITIES = ['Toshkent', 'Samarqand', 'Andijon', 'Buxoro', 'Namangan']

export const som = (n) => `${Number(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m`
export const adPrice = (a) => (a.deal === 'job' ? `${som(a.price).replace(' so‘m', '')} – ${som(a.priceMax)}` : a.deal === 'rent' ? `${som(a.price)} / oy` : som(a.price))

export const SELLERS = {
  dentplus: { id: 'dentplus', name: 'Dent Plus', type: 'Tibbiy mahsulotlar do‘koni', phone: '+998 90 111 22 33', rating: 4.8, since: '2019', shop: true },
  medtex: { id: 'medtex', name: 'MedTex Servis', type: 'Uskunalar sotuvchisi', phone: '+998 90 222 33 44', rating: 4.7, since: '2017', shop: true },
  nodira: { id: 'nodira', name: 'Dr. Nodira Karimova', type: 'Shifokor, xususiy shaxs', phone: '+998 91 333 44 55', rating: 4.9, since: '2022', photo: img('surplus/u1') },
  smile: { id: 'smile', name: 'Smile Dental Clinic', type: 'Klinika', phone: '+998 71 200 30 40', rating: 4.8, since: '2015', shop: true },
  azizbek: { id: 'azizbek', name: 'Dr. Azizbek Rahimov', type: 'Shifokor, xususiy shaxs', phone: '+998 93 555 66 77', rating: 4.6, since: '2021', photo: img('surplus/u2') },
}

const ad = (a) => ({ cond: 'Yangi', original: true, views: 120, ...a })

export const ADS = [
  ad({
    id: 'unit-kreslo', deal: 'sale', cat: 'uskuna', title: 'Stomatologik unit (kreslo)', sub: 'Yaxshi holatda, 2022 yil, barcha komplekt bilan.',
    price: 25000000, city: 'Toshkent', date: '12 okt 2024', seller: 'medtex', cond: 'Ishlatilgan', original: true, views: 342,
    images: [img('jihozlar/fengdan'), img('jihozlar/fengdan-arm'), img('jihozlar/fengdan-screen'), img('jihozlar/fengdan-room'), img('product-6')],
    specs: [['brand', 'Brend', 'Fengdan'], ['year', 'Yili', '2022'], ['cond', 'Holati', 'Ishlatilgan']],
    about: 'Fengdan QL2028 stomatologik ustanovka. 2022 yilda olingan, bir klinikada ishlatilgan. Shifokor va assistent bloklari, LED chiroq, monitor va ichki kamera bilan. Yetkazib berish va o‘rnatishda yordam beramiz.',
    features: ['Barcha komplekt bilan', 'LED operatsion chiroq', 'Monitor va kamera', 'Texnik ko‘rikdan o‘tgan', 'O‘rnatishda yordam', 'Hujjatlari bor'],
  }),
  ad({
    id: 'implant-toplam', deal: 'sale', cat: 'material', title: 'Implant to‘plami (yangi)', sub: 'Straumann original, to‘liq to‘plam.',
    price: 12500000, city: 'Toshkent', date: '11 okt 2024', seller: 'dentplus', views: 198,
    images: [img('market/p9'), img('product-2'), img('aksiyalar/aksiya-implant')],
    specs: [['brand', 'Brend', 'Straumann'], ['size', 'Soni', '10 dona'], ['cond', 'Holati', 'Yangi']],
    about: 'Straumann BLT implantlar to‘plami: 10 dona, turli diametr va uzunliklarda. Qadoqlari ochilmagan, yaroqlilik muddati 2028 yilgacha.',
    features: ['Original mahsulot', 'Qadoq ochilmagan', 'Yaroqlilik 2028 gacha', 'Sertifikati bor', 'Turli o‘lchamlar', 'Yetkazib berish bor'],
  }),
  ad({
    id: 'kabinet-ijara', deal: 'rent', cat: 'klinika', title: 'Stomatologik kabinet ijaraga', sub: 'To‘liq jihozlangan, metro yaqinida.',
    price: 3000000, city: 'Toshkent', date: '10 okt 2024', seller: 'smile', cond: 'Jihozlangan', original: false, views: 276,
    images: [img('jihozlar/fengdan-room'), img('ishlar/ish-implant'), img('ishlar/ish-hall')],
    specs: [['area', 'Maydon', '18 m²'], ['place', 'Manzil', 'Chilonzor'], ['cond', 'Holati', 'Jihozlangan']],
    about: 'Faoliyat yuritayotgan klinika ichida alohida kabinet. Ustanovka, avtoklav, rentgen va qabulxona umumiy foydalanishda. Metro Chilonzorga 3 daqiqa.',
    features: ['Ustanovka bilan', 'Avtoklav umumiy', 'Rentgen mavjud', 'Qabulxona va administrator', 'Metro yaqinida', 'Kommunal to‘lovlar ichida'],
  }),
  ad({
    id: 'kompozit-a2', deal: 'sale', cat: 'material', title: 'Kompozit (A2)', sub: 'Universal yorug‘likda qotuvchi kompozit, yuqori estetik va mustahkam, old va yondosh tishlar uchun.', short: 'Turli ranglarda, original, yangi.',
    price: 450000, city: 'Samarqand', date: '9 okt 2024', seller: 'dentplus', views: 154,
    images: [img('market/p3'), img('surplus/main'), img('surplus/t1'), img('surplus/t3'), img('surplus/i1'), img('market/p1')],
    specs: [['brand', 'Brend', 'Premium Composite'], ['size', 'Hajm', '4 g'], ['cond', 'Holati', 'Yangi']],
    about: 'Yuqori sifatli universal kompozit material. A2 rang. Old va yondosh tishlar restoratsiyasi uchun mos. Yorug‘likda qotadi, estetik ko‘rinish va uzoq muddatli mustahkamlikni ta’minlaydi.',
    features: ['Yuqori estetik natija', 'Yorug‘likda qotadi', 'Yaxshi silliqlanadi', 'Uzoq muddatli mustahkamlik', 'Old va yondosh tishlar uchun', 'Original mahsulot'],
  }),
  ad({
    id: 'stomatolog-kerak', deal: 'job', cat: 'ish', title: 'Stomatolog shifokor kerak', sub: 'Zamonaviy klinikaga tajribali shifokor kerak.',
    price: 8000000, priceMax: 15000000, city: 'Toshkent', date: '8 okt 2024', seller: 'smile', cond: 'To‘liq stavka', original: false, views: 410,
    images: [img('ishlar/ish-implant'), img('ishlar/ish-hall'), img('jihozlar/fengdan-room')],
    specs: [['exp', 'Tajriba', '3+ yil'], ['time', 'Grafik', '6/1'], ['cond', 'Bandlik', 'To‘liq stavka']],
    about: 'Smile Dental Clinic terapevt-stomatologni ishga taklif qiladi. Zamonaviy uskunalar, o‘z bemorlar oqimi va rivojlanish uchun seminarlar.',
    features: ['Rasmiy ishga joylash', 'Foiz + oklad', 'Zamonaviy uskunalar', 'Seminarlar klinika hisobidan', 'Qulay grafik', 'Tushlik bepul'],
  }),
  ad({
    id: 'avtoklav', deal: 'sale', cat: 'uskuna', title: 'Avtoklav (sterilizator)', sub: 'Yaxshi holatda, 2021 yil, 23 litr.',
    price: 8500000, city: 'Toshkent', date: '7 okt 2024', seller: 'nodira', cond: 'Ishlatilgan', views: 233,
    images: [img('market/p12'), img('jihozlar/melag'), img('ustalar/usta-work-auto')],
    specs: [['brand', 'Brend', 'Melag'], ['size', 'Hajm', '23 l'], ['cond', 'Holati', 'Ishlatilgan']],
    about: 'B klassli avtoklav, 23 litr. Klinika yopilgani sababli sotiladi. Muntazam servis qilingan, barcha tovoqlari bor.',
    features: ['B klass', '23 litr kamera', 'Servis qilingan', 'Tovoqlar to‘plami', 'Printer ulanadi', 'Ko‘rib olish mumkin'],
  }),
  ad({
    id: 'nsk-turbina', deal: 'sale', cat: 'asbob', title: 'NSK turbina uchligi', sub: 'Pana-Max, ishlatilmagan, kafolat bilan.',
    price: 1900000, city: 'Andijon', date: '6 okt 2024', seller: 'azizbek', views: 87,
    images: [img('market/p5'), img('market/p6')],
    specs: [['brand', 'Brend', 'NSK'], ['size', 'Model', 'Pana-Max'], ['cond', 'Holati', 'Yangi']],
    about: 'NSK Pana-Max turbina uchligi. Sovg‘a qilingan, ishlatilmagan. Rasmiy kafolat taloni bor.',
    features: ['Original NSK', 'Ishlatilmagan', 'Kafolat taloni', 'Push-button', 'Keramik podshipnik', 'Qutisi bilan'],
  }),
  ad({
    id: 'skaler-ijara', deal: 'rent', cat: 'uskuna', title: 'Ultratovush skaler ijaraga', sub: 'Kunlik yoki oylik ijara, uchliklar bilan.',
    price: 600000, city: 'Samarqand', date: '5 okt 2024', seller: 'medtex', cond: 'Yaxshi', original: false, views: 64,
    images: [img('market/p11'), img('product-4')],
    specs: [['brand', 'Brend', 'Woodpecker'], ['size', 'Uchliklar', '6 dona'], ['cond', 'Holati', 'Yaxshi']],
    about: 'Woodpecker UDS-P ultratovush skaleri ijaraga beriladi. Klinikangiz uskunasi ta’mirda bo‘lsa, vaqtincha yechim.',
    features: ['6 ta uchlik', 'Yetkazib berish', 'Kunlik ijara bor', 'Zalog kichik', 'Sterilizatsiyalangan', 'Ko‘rsatma beriladi'],
  }),
  ad({
    id: 'assistent-kerak', deal: 'job', cat: 'ish', title: 'Stomatolog assistenti kerak', sub: 'Tajribasiz ham bo‘ladi, o‘qitamiz.',
    price: 3000000, priceMax: 5000000, city: 'Samarqand', date: '4 okt 2024', seller: 'smile', cond: 'To‘liq stavka', original: false, views: 190,
    images: [img('ishlar/ish-hall'), img('ishlar/ish-implant')],
    specs: [['exp', 'Tajriba', 'Shart emas'], ['time', 'Grafik', '5/2'], ['cond', 'Bandlik', 'To‘liq stavka']],
    about: 'Samarqand filialimizga assistent qidiryapmiz. Ish jarayonida o‘qitamiz, sterilizatsiya va to‘rt qo‘lda ishlash bo‘yicha kurs beramiz.',
    features: ['O‘qitish bepul', 'Rasmiy ishga joylash', 'Bonuslar', 'Do‘stona jamoa', 'Formasi beriladi', 'Transport yaqin'],
  }),
  ad({
    id: 'endomotor', deal: 'sale', cat: 'uskuna', title: 'Endomotor apekslokator bilan', sub: 'Ikki funksiyali, 2023 yil, ideal holatda.',
    price: 4200000, city: 'Toshkent', date: '3 okt 2024', seller: 'azizbek', cond: 'Ishlatilgan', views: 142,
    images: [img('market/p7'), img('product-3'), img('offer-endomotor')],
    specs: [['brand', 'Brend', 'Woodpecker'], ['year', 'Yili', '2023'], ['cond', 'Holati', 'Ishlatilgan']],
    about: 'Endomotor va apekslokator bitta qurilmada. Kam ishlatilgan, barcha aksessuarlari va qutisi bor.',
    features: ['Apekslokator ichida', 'Reciprok rejim', 'Batareya yaxshi', 'Qutisi bilan', 'Kontr-uchlik bor', 'Tekshirib olish mumkin'],
  }),
  ad({
    id: 'bond-set', deal: 'sale', cat: 'material', title: 'Bonding to‘plami', sub: 'Adgeziv + praymer, yaroqlilik 2027.',
    price: 380000, city: 'Buxoro', date: '2 okt 2024', seller: 'nodira', views: 58,
    images: [img('market/p2'), img('surplus/i2')],
    specs: [['brand', 'Brend', 'Kerr'], ['size', 'Hajm', '2×5 ml'], ['cond', 'Holati', 'Yangi']],
    about: 'Ortiqcha qolgan bonding to‘plami. Ochilmagan, sovutgichda saqlangan.',
    features: ['Ochilmagan', 'Sovutgichda saqlangan', 'Yaroqlilik 2027', 'Original', 'Pochta orqali yuboraman', 'Narxi kelishiladi'],
  }),
]
