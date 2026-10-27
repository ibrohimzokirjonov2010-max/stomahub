import { Link } from 'react-router-dom'

const UPDATED = '28-oktabr 2026'

const PRIVACY = [
  ['1. Umumiy qoidalar', 'Ushbu Maxfiylik siyosati StomaHub platformasi (stomahub-three.vercel.app, veb-sayt va ilova — keyingi o‘rinlarda “Platforma”) foydalanuvchilarining shaxsiy ma’lumotlari qanday yig‘ilishi, ishlatilishi va himoya qilinishini tushuntiradi. Platformadan foydalanish orqali siz ushbu siyosatga rozilik bildirasiz.'],
  ['2. Qanday ma’lumotlarni yig‘amiz', 'Ro‘yxatdan o‘tishda: ism-familiya, telefon raqam, email, mutaxassislik va hisob turi (mijoz, sotuvchi yoki tashkilotchi). Google orqali kirganda: Google hisobingizdagi ism, email va profil rasmi (Google bizga parolingizni bermaydi). Foydalanish jarayonida: buyurtmalar, seminarlarga ro‘yxatdan o‘tish, siz joylagan mahsulotlar, seminarlar va boshqa kontent, shuningdek texnik ma’lumotlar (qurilma turi, brauzer, kirish vaqti).'],
  ['3. Ma’lumotlardan foydalanish maqsadi', 'Hisobingizni yaratish va kirishni ta’minlash; buyurtma, to‘lov va seminar ro‘yxatini rasmiylashtirish; sotuvchi va tashkilotchilarga buyurtma yoki ishtirokchi haqidagi zarur ma’lumotni berish; xizmat haqida bildirishnomalar yuborish; Platforma xavfsizligi va sifatini yaxshilash.'],
  ['4. Ma’lumotlarni uchinchi shaxslarga berish', 'Biz shaxsiy ma’lumotlaringizni sotmaymiz. Ma’lumotlar faqat xizmatni ko‘rsatish uchun zarur bo‘lgan hollarda beriladi: siz buyurtma bergan sotuvchiga yoki siz ro‘yxatdan o‘tgan seminar tashkilotchisiga, to‘lov tizimlariga, hamda texnik xizmat ko‘rsatuvchi provayderlarga (masalan, ma’lumotlarni saqlash va hosting). Qonunda nazarda tutilgan hollarda vakolatli organlarga berilishi mumkin.'],
  ['5. Saqlash va himoya', 'Ma’lumotlar himoyalangan serverlarda saqlanadi, ulanish shifrlangan (HTTPS). Har bir foydalanuvchi faqat o‘ziga ruxsat etilgan ma’lumotlarni ko‘radi. Ma’lumotlar hisobingiz faol bo‘lgan davrda va qonun talab qilgan muddatda saqlanadi.'],
  ['6. Sizning huquqlaringiz', 'Siz o‘z ma’lumotlaringizni Profil bo‘limida ko‘rishingiz va tahrirlashingiz, hisobingizni o‘chirishni so‘rashingiz, bildirishnomalardan voz kechishingiz mumkin. Google orqali berilgan ruxsatni Google hisobingiz sozlamalarida istalgan vaqtda bekor qilish mumkin.'],
  ['7. Cookie va mahalliy xotira', 'Platforma tizimga kirgan holatingizni saqlash va sozlamalarni eslab qolish uchun brauzerning mahalliy xotirasi va cookie fayllaridan foydalanadi.'],
  ['8. O‘zgarishlar', 'Siyosat yangilanishi mumkin. Muhim o‘zgarishlar haqida Platformada xabar beramiz. Yangilangan sana sahifa boshida ko‘rsatiladi.'],
  ['9. Aloqa', 'Maxfiylik bo‘yicha savollar uchun Platformadagi aloqa ma’lumotlari orqali biz bilan bog‘laning.'],
]

const TERMS = [
  ['1. Umumiy qoidalar', 'Ushbu Foydalanish shartlari StomaHub platformasi (keyingi o‘rinlarda “Platforma”) va uning foydalanuvchilari o‘rtasidagi munosabatlarni tartibga soladi. Ro‘yxatdan o‘tish yoki Platformadan foydalanish orqali siz ushbu shartlarni qabul qilasiz.'],
  ['2. Platforma xizmatlari', 'Platforma stomatologlar uchun stomatologik mahsulotlar marketpleysi, seminarlar va ta’lim materiallari, klinika uchun vositalar va professional hamjamiyatni taqdim etadi. Mahsulotlarni sotuvchilar, seminarlarni esa tashkilotchilar joylashtiradi.'],
  ['3. Hisob', 'Ro‘yxatdan o‘tishda to‘g‘ri va dolzarb ma’lumot kiriting. Hisobingiz xavfsizligi (parol, kirish kodi) uchun o‘zingiz javobgarsiz. Bir telefon raqam yoki email bilan faqat bitta hisob ochish mumkin.'],
  ['4. Foydalanuvchi majburiyatlari', 'Qonunga zid, yolg‘on yoki boshqalarning huquqlarini buzadigan kontent joylashtirmaslik; Platforma ishiga xalaqit bermaslik; boshqa foydalanuvchilar ma’lumotlaridan ruxsatsiz foydalanmaslik.'],
  ['5. Sotuvchi va tashkilotchilar', 'Sotuvchilar mahsulot ma’lumotlari, narx, sifat va yetkazib berish uchun javobgar. Tashkilotchilar seminar ma’lumotlari va o‘tkazilishi uchun javobgar. Mahsulotlar e’lon qilinishidan oldin moderatsiyadan o‘tadi; Platforma qoidalarga zid kontentni rad etish yoki olib tashlash huquqiga ega.'],
  ['6. Buyurtma va to‘lovlar', 'Buyurtma va seminar to‘lovlari Platformada ko‘rsatilgan usullar orqali amalga oshiriladi. Seminarni bekor qilish va qaytarish shartlari har bir seminar sahifasida ko‘rsatiladi. Mahsulotni qaytarish masalalari sotuvchi bilan hal qilinadi, Platforma bunda yordam beradi.'],
  ['7. Intellektual mulk', 'Platforma dizayni, logotipi va dasturiy ta’minoti Platformaga tegishli. Siz joylagan kontent sizniki bo‘lib qoladi, lekin uni Platformada ko‘rsatish uchun bizga ruxsat berasiz.'],
  ['8. Javobgarlikni cheklash', 'Platforma xizmatlarni “boricha” taqdim etadi va uzluksiz ishlashni kafolatlashga harakat qiladi. Foydalanuvchilar o‘rtasidagi bitimlar (sotuvchi va xaridor, tashkilotchi va ishtirokchi) uchun Platforma bevosita tomon hisoblanmaydi. Tibbiy qarorlar uchun mutaxassis o‘zi javobgar.'],
  ['9. Hisobni to‘xtatish', 'Shartlar buzilganda Platforma hisobni ogohlantirib yoki ogohlantirmasdan cheklashi yoki to‘xtatishi mumkin. Siz istalgan vaqtda hisobingizni o‘chirishni so‘rashingiz mumkin.'],
  ['10. O‘zgarishlar va aloqa', 'Shartlar yangilanishi mumkin; yangilangan sana sahifa boshida ko‘rsatiladi. Savollar uchun Platformadagi aloqa ma’lumotlari orqali biz bilan bog‘laning. Shaxsiy ma’lumotlar bilan ishlash tartibi Maxfiylik siyosatida bayon etilgan.'],
]

function LegalPage({ title, items, other }) {
  return (
    <div className="min-h-screen bg-[#f5f9f9]">
      <header className="border-b border-[#e3eeec] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link to="/" className="text-[18px] font-extrabold text-[#0F766E]">StomaHub</Link>
          <Link to="/" className="text-[13px] font-semibold text-[#0F766E]">Bosh sahifa</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8">
        <h1 className="text-[26px] font-extrabold text-[#0f2438] md:text-[32px]">{title}</h1>
        <p className="mt-1 text-[13px] text-[#5c6e80]">Oxirgi yangilanish: {UPDATED}</p>
        <div className="mt-6 space-y-5 rounded-2xl border border-[#e3eeec] bg-white p-5 md:p-8">
          {items.map(([h, p]) => (
            <section key={h}>
              <h2 className="text-[16px] font-bold text-[#0f2438]">{h}</h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-[#3d5168]">{p}</p>
            </section>
          ))}
        </div>
        <p className="mt-6 text-[13px] text-[#5c6e80]">Shuningdek qarang: <Link to={other[1]} className="font-semibold text-[#0F766E] underline">{other[0]}</Link></p>
      </main>
    </div>
  )
}

export function Privacy() {
  return <LegalPage title="Maxfiylik siyosati" items={PRIVACY} other={['Foydalanish shartlari', '/foydalanish-shartlari']} />
}

export function Terms() {
  return <LegalPage title="Foydalanish shartlari" items={TERMS} other={['Maxfiylik siyosati', '/maxfiylik']} />
}
