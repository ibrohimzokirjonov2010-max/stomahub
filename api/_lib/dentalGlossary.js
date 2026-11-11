/**
 * Stomatologiya atamalari va VoiceLab STT ning takroriy xatolari.
 * Aniq almashtirishlar faqat bir ma’noli xatolar uchun.
 * "ustoz" (o‘qituvchi) va "ustup" (уступ) ni qoidasiz almashtirmaymiz — buni model kontekstda ajratadi.
 */

const APOS = /['’ʼʻ]/g

export const DENTAL_TERMS = [
  ['preparatsiya', 'препаровка', 'tishni tayyorlash'],
  ['ustup', 'уступ', 'preparatsiya chekkasi, shoulder/chamfer'],
  ['bor', 'бор', 'qattiq to‘qimani kesadigan freza, dental bur'],
  ['polirovka', 'полировка', 'silliqlash'],
  ['tsirkon', 'циркон', 'tsirkoniy dioksid koronka'],
  ['kompozit', 'композит', 'plomba materiali'],
  ['adgeziv', 'адгезив', 'yopishtiruvchi tizim'],
  ['polimerizatsiya', 'полимеризация', 'yorug‘lik bilan qotirish'],
  ['pulpa', 'пульпа', 'tish nerv-tomir to‘qimasi'],
  ['kanal', 'канал', 'ildiz kanali'],
  ['endodontiya', 'эндодонтия', 'kanal davolash'],
  ['implant', 'имплант', 'suyak ichidagi tayanch'],
  ['abatment', 'абатмент', 'implant ustidagi tayanch'],
  ['vinir', 'винир', 'old yuz qoplama'],
  ['koronka', 'коронка', 'to‘liq qoplama'],
  ['retsiz', 'резец', 'kesuvchi tish'],
  ['premolyar', 'премоляр', 'kichik jag‘ tishi'],
  ['molyar', 'моляр', 'katta jag‘ tishi'],
  ['okklyuziya', 'окклюзия', 'tish qatorlari tutashuvi'],
  ['gingiva', 'гингива', 'milk'],
  ['karies', 'кариес', 'tish chirishi'],
  ['dentin', 'дентин', 'emal ostidagi qattiq to‘qima'],
  ['emal', 'эмаль', 'tishning tashqi qatlami'],
  ['anesteziya', 'анестезия', 'og‘riqsizlantirish'],
  ['infiltratsion', 'инфильтрационная', 'anesteziya turi'],
  ['o‘tkazuvchan', 'проводниковая', 'anesteziya turi'],
  ['artikain', 'артикаин', 'anestezik'],
  ['koferdam', 'коффердам', 'izolyatsiya lateksi'],
  ['klamer', 'кламмер', 'koferdam ilgagi'],
  ['matritsa', 'матрица', 'kontaktni tiklash tasmasi'],
  ['klin', 'клин', 'matritsa xanji'],
  ['etching', 'протравка', 'kislota bilan ishlov'],
  ['bond', 'бонд', 'adgeziv qatlami'],
  ['primer', 'праймер', 'birinchi adgeziv qatlam'],
  ['fotopolimer', 'фотополимер', 'yorug‘likda qotadigan material'],
  ['siler', 'силер', 'kanal germetigi'],
  ['guttapercha', 'гуттаперча', 'kanal to‘ldiruvchi'],
  ['apeks', 'апекс', 'ildiz uchi'],
  ['apekslokator', 'апекслокатор', 'ishchi uzunlik asbobi'],
  ['irrigatsiya', 'ирригация', 'kanalni yuvish'],
  ['natriy gipoxlorit', 'гипохлорит натрия', 'irrigant'],
  ['EDTA', 'ЭДТА', 'smear qatlamini oladi'],
  ['smear layer', 'смазанный слой', 'preparatsiya qatlami'],
  ['retraksiya', 'ретракция', 'milkni chetlatish'],
  ['gemostatik', 'гемостатик', 'qon to‘xtatish'],
  ['otisk', 'оттиск', 'qolip'],
  ['skaner', 'сканер', 'raqamli qolip'],
  ['artikulyator', 'артикулятор', 'jag‘ harakati modeli'],
  ['okkluzion', 'окклюзионный', 'tutashuv yuzasi'],
  ['distal', 'дистальный', 'orqa tomon'],
  ['mezial', 'мезиальный', 'o‘rta chiziq tomoni'],
  ['bukkal', 'буккальный', 'lunj tomoni'],
  ['lingual', 'лингвальный', 'til tomoni'],
  ['vestibulyar', 'вестибулярный', 'lab/lunj tomoni'],
  ['aproksimal', 'апроксимальный', 'qo‘shni tish yuzasi'],
  ['ekvator', 'экватор', 'tishning eng keng joyi'],
  ['fissura', 'фиссура', 'chaynash yuzasi egati'],
  ['kontakt', 'контактный пункт', 'qo‘shni tish tegish nuqtasi'],
  ['chamfer', 'шамфер', 'qiya ustup'],
  ['shoulder', 'плечо', 'to‘g‘ri ustup'],
  ['kultya', 'культя', 'koronka ostidagi tish qoldig‘i'],
  ['shtift', 'штифт', 'kanal ichidagi tayanch'],
  ['vkladka', 'вкладка', 'inlay'],
  ['nakladka', 'накладка', 'onlay'],
  ['most', 'мост', 'ko‘priksimon protez'],
  ['protez', 'протез', 'sun’iy tish qatori'],
  ['tsement', 'цемент', 'fiksatsiya materiali'],
  ['stekloionomer', 'стеклоиономер', 'plomba/tsement turi'],
  ['osteointegratsiya', 'остеоинтеграция', 'implantning suyakka o‘sishi'],
  ['sinus-lifting', 'синус-лифтинг', 'yuqori jag‘ sinusi'],
  ['membrana', 'мембрана', 'suyak regeneratsiyasi'],
  ['kyuretaj', 'кюретаж', 'paro tozalash'],
  ['parodont', 'пародонт', 'tish atrofi to‘qimalari'],
  ['breket', 'брекет', 'ortodontik qulf'],
  ['retainer', 'ретейнер', 'natijani ushlab turish'],
  ['tork', 'торк', 'ortodontik burchak'],
  ['angulyatsiya', 'ангуляция', 'tish qiyaligi'],
  ['mock-up', 'мок-ап', 'vaqtinchalik tabassum namunasi'],
  ['wax-up', 'ваксап', 'mumdagi model'],
  ['glazur', 'глазурь', 'keramika yaltiroq qatlami'],
  ['opaker', 'опакер', 'rangni yopuvchi qatlam'],
  ['frezerovka', 'фрезеровка', 'CAD/CAM kesish'],
  ['konusnost', 'конусность', 'bor yoki fayl konusi'],
  ['ishchi uzunlik', 'рабочая длина', 'kanalda xavfsiz chuqurlik'],
  ['grubaya tochka', 'грубая точка', 'dag‘al abraziv'],
  ['finir', 'финиш', 'oxirgi silliqlash'],
  ['disk', 'диск', 'polirovka diski'],
  ['nakonechnik', 'наконечник', 'turbina yoki burchakli uchlik'],
  ['turbina', 'турбина', 'yuqori tezlikli nakonechnik'],
  ['karies detektori', 'кариес-детектор', 'qolgan kariesni bo‘yash'],
  ['qatlam', 'слой', 'qalinlik, millimetrda'],
  ['millimetr', 'миллиметр', 'o‘lchov'],
  ['gradus', 'градус', 'konus burchagi'],
]

const PHRASES = [
  [/bir millionta qadrlikda/gi, 'bir millimetr qalinlikda'],
  [/millionta qadrlik(?:da)?/gi, 'millimetr qalinlik'],
  [/gruba(?:ya)? to‘chka/gi, 'grubaya tochka'],
  [/grubaya to‘chka/gi, 'grubaya tochka'],
]

const WORDS = [
  [/\bsirkom(?:iy)?\b/gi, 'tsirkon'],
  [/\btsirkom\b/gi, 'tsirkon'],
  [/\bcirkom\b/gi, 'tsirkon'],
  [/\bplyrovka\b/gi, 'polirovka'],
  [/\bpolirofka\b/gi, 'polirovka'],
  [/\bpalimerizatsiya\b/gi, 'polimerizatsiya'],
  [/\bpolimerizasia\b/gi, 'polimerizatsiya'],
  [/\bkompazit\b/gi, 'kompozit'],
  [/\badgeziv\b/gi, 'adgeziv'],
  [/\brezislar\b/gi, 'retsizlar'],
  [/\brezis\b/gi, 'retsiz'],
  [/\brezets(lar)?\b/gi, 'retsiz$1'],
  [/\bdigitalniy\b/gi, 'distalniy'],
  [/\bdigitalni\b/gi, 'distalniy'],
  [/\bmezilniy\b/gi, 'mezialniy'],
  [/\boklyuziya\b/gi, 'okklyuziya'],
  [/\bokkluziya\b/gi, 'okklyuziya'],
  [/\bpremolyar\b/gi, 'premolyar'],
  [/\bprimolyar(?:lar)?\b/gi, 'premolyar$1'],
  [/\bmalyar(?:lar)?\b/gi, 'molyar$1'],
  [/\babatman\b/gi, 'abatment'],
  [/\babatment\b/gi, 'abatment'],
  [/\bviniri\b/gi, 'vinir'],
  [/\bkoronki\b/gi, 'koronka'],
  [/\bendodontia\b/gi, 'endodontiya'],
  [/\bbo‘r\b/gi, 'bor'],
  [/\bgemostat\b/gi, 'gemostatik'],
  [/\bkofferdam\b/gi, 'koferdam'],
  [/\bguttaperca\b/gi, 'guttapercha'],
  [/\bsiller\b/gi, 'siler'],
  [/\bsholder\b/gi, 'shoulder'],
  [/\bchamfer\b/gi, 'chamfer'],
]

export function normalizeApostrophes(text) {
  return String(text || '').replace(APOS, '‘')
}

export function applyDentalFixes(text) {
  let out = normalizeApostrophes(text)
  for (const [re, to] of PHRASES) out = out.replace(re, to)
  for (const [re, to] of WORDS) out = out.replace(re, to)
  return out
}

export function glossaryForPrompt() {
  const lines = DENTAL_TERMS.map(([uz, ru, note]) => `- ${uz} (${ru}) — ${note}`)
  return [
    'Stomatologik lug‘at. Transkriptdagi buzilgan so‘zni shu yozuvga keltir, yangi fakt qo‘shma:',
    ...lines,
    'Ma’lum STT xatolari: sirkom/tsirkom→tsirkon; plyrovka→polirovka; rezislar→retsizlar; gruba to‘chka→grubaya tochka; bir millionta qadrlikda→bir millimetr qalinlikda; digitalniy→distalniy; bo‘r (asbob)→bor.',
    'ustoz — agar preparatsiya chekkasi (уступ) nazarda tutilsa "ustup" deb yoz. Agar shifokor/o‘qituvchiga murojaat bo‘lsa "ustoz" qolsin.',
  ].join('\n')
}
