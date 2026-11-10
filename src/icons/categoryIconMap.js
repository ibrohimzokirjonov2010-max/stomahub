// Kategoriya → ikonka xaritasi (sof JS, testlanadi). Ikonka id lari categoryIcons.jsx da chiziladi.
// Qoida: avval bo‘lim + kalit (yoki nom) bo‘yicha aniq moslik, keyin nom bo‘yicha kalit so‘zlar,
// oxirida FALLBACK (tish).

export const FALLBACK_ICON = 'tooth'

// Lucide dan olinadigan umumiy ikonkalar (id → lucide nomi)
export const LUCIDE_IDS = {
  all: 'LayoutGrid', book: 'BookOpen', atlas: 'BookOpenText', anatomy: 'Skull', course: 'GraduationCap',
  seminar: 'Presentation', webinar: 'MonitorPlay', clinic: 'Hospital', job: 'Briefcase', team: 'Users',
  admin: 'ClipboardList', other: 'Package', install: 'Drill', microscope: 'Microscope', anesthetic: 'Syringe',
  glasses: 'Glasses',
}

// Yangi professional glif to‘plami (Ibrohim tasdiqlagan, 2026-11-10): public/icons/category-sprite.svg.
// id → sprite dagi <symbol id>. Glifi bo‘lmagan id lar avvalgi chiziqli ikonkada qoladi.
export const GLYPHS = {
  filling: 'tooth-filling', whitening: 'tooth-whitening', pediatric: 'kids-tooth', implant: 'implant', endoFile: 'endo-file',
  impressionTray: 'impression-tray', bracket: 'braces', crown: 'crown', lab: 'denture', gum: 'gum-tooth', scalpel: 'scalpel',
  dentalChair: 'dental-chair', handpiece: 'handpiece', autoclave: 'autoclave', xray: 'xray', scanner: 'scanner',
  digital: 'digital-monitor', compressor: 'compressor', curingLight: 'curing-light', toothbrush: 'toothbrush', gloves: 'glove',
  mask: 'mask', bondBottle: 'bond-bottle', cement: 'cement-pad', compositeSyringe: 'composite-syringe', instruments: 'mirror-probe',
  instrumentsSet: 'instruments-set', rubberDam: 'rubber-dam', scrub: 'scrub', coat: 'lab-coat', cap: 'surgical-cap', clog: 'clog',
  apron: 'apron', glasses: 'loupes', all: 'grid-all', atlas: 'atlas-book', anatomy: 'skull', course: 'graduation-cap',
  seminar: 'presentation-board', webinar: 'webinar', clinic: 'clinic', job: 'briefcase', team: 'people', admin: 'clipboard',
  other: 'box', install: 'drill', anesthetic: 'anesthesia-syringe', microscope: 'microscope',
}

export const CATEGORY_ICON_MAP = {
  // Marketplace (seller_products.category, normCategory dan keyin)
  marketplace: {
    'Restavratsion materiallar': 'filling', 'Estetik stomatologiya': 'whitening', Implantlar: 'implant',
    'Endodontik asboblar': 'endoFile', 'Qolip (ottisk) materiallari': 'impressionTray', Sterilizatsiya: 'autoclave',
    'Izolyatsiya materiallari': 'rubberDam', 'Yordamchi materiallar': 'bondBottle', 'Sarflanadigan materiallar': 'gloves',
    Instrumentlar: 'instruments', Uskunalar: 'dentalChair', 'Himoya vositalari': 'mask', Ortodontiya: 'bracket',
    'Gigiyena vositalari': 'toothbrush', 'Gigiena vositalari': 'toothbrush', Laboratoriya: 'lab', Boshqa: 'other',
  },
  seminarlar: { impl: 'implant', endo: 'endoFile', orto: 'bracket', estet: 'whitening', paro: 'gum', surg: 'scalpel', other: 'seminar' },
  kitoblar: { terapiya: 'filling', endo: 'endoFile', impl: 'implant', ortoped: 'crown', orto: 'bracket', surgery: 'scalpel', anatomy: 'anatomy', atlas: 'atlas' },
  talim: { terapiya: 'filling', endo: 'endoFile', impl: 'implant', ortoped: 'crown', orto: 'bracket', paro: 'gum', digital: 'digital', klinika: 'clinic' },
  forma: { scrub: 'scrub', coat: 'coat', cap: 'cap', shoe: 'clog', apron: 'apron', accessory: 'glasses' },
  jihozlar: { unit: 'dentalChair', cbct: 'xray', scan: 'scanner', autoclave: 'autoclave', micro: 'microscope', compressor: 'compressor', handpiece: 'handpiece', lamp: 'curingLight' },
  ustalar: { unit: 'dentalChair', handpiece: 'handpiece', compressor: 'compressor', autoclave: 'autoclave', cbct: 'xray', scan: 'scanner', install: 'install' },
  ortiqcha: { komp: 'filling', bond: 'bondBottle', sement: 'cement', impl: 'implant', instr: 'instruments', anes: 'anesthetic', other: 'other' },
  elonlar: { uskuna: 'dentalChair', material: 'compositeSyringe', klinika: 'clinic', ish: 'job', asbob: 'instrumentsSet' },
  mutaxassislar: { stomatolog: 'tooth', implantolog: 'implant', ortodont: 'bracket', endodont: 'endoFile', jarroh: 'scalpel', estetik: 'whitening', pediatr: 'pediatric' },
  ishlar: { terapevt: 'filling', ortoped: 'crown', ortodont: 'bracket', jarroh: 'scalpel', bolalar: 'pediatric', gigiyenist: 'toothbrush', texnik: 'lab', assistent: 'team', admin: 'admin' },
}

// Nom bo‘yicha zaxira moslik (yangi yoki sotuvchi yozgan kategoriyalar uchun). Tartib muhim.
const KEYWORDS = [
  [/implant/i, 'implant'], [/endo|kanal|fayl/i, 'endoFile'], [/qolip|ottisk|o.lchov|alginat|silikon/i, 'impressionTray'],
  [/orto(?!ped)|breket|elayner/i, 'bracket'], [/ortoped|protez|toj|kron/i, 'crown'], [/restavr|plomba|kompozit|terap/i, 'filling'],
  [/estet|oqart/i, 'whitening'], [/steril|avtoklav|dezinf/i, 'autoclave'], [/izolyats|koferdam/i, 'rubberDam'],
  [/gigi|profilak|cho.tka/i, 'toothbrush'], [/himoya|niqob/i, 'mask'], [/sarf|qo.lqop|bir martalik/i, 'gloves'],
  [/bond|adgez|yordamchi/i, 'bondBottle'], [/sement/i, 'cement'], [/anest/i, 'anesthetic'], [/rentgen|cbct|x-?ray/i, 'xray'],
  [/skaner|cad/i, 'scanner'], [/uchlik|turbina|nakonech/i, 'handpiece'], [/kompressor|aspirat/i, 'compressor'], [/lampa/i, 'curingLight'],
  [/mikroskop/i, 'microscope'], [/uskuna|ustanovka|kreslo|jihoz/i, 'dentalChair'], [/instrument|asbob/i, 'instruments'],
  [/jarroh|xirurg/i, 'scalpel'], [/parodon|milk/i, 'gum'], [/bola|pediatr/i, 'pediatric'], [/laborator|texnik/i, 'lab'],
  [/digital/i, 'digital'], [/forma|skrab|kiyim/i, 'scrub'], [/xalat/i, 'coat'], [/poyabzal|klog/i, 'clog'], [/kitob|adabiyot/i, 'book'],
  [/kurs|ta.lim/i, 'course'], [/seminar/i, 'seminar'], [/klinika/i, 'clinic'], [/ish o.rni|vakans/i, 'job'], [/boshqa/i, 'other'],
]

export function categoryIconId(section, key, label) {
  const m = CATEGORY_ICON_MAP[section] || {}
  if (key != null && m[key]) return m[key]
  if (label != null && m[label]) return m[label]
  const text = `${label || ''} ${key || ''}`
  for (const [re, id] of KEYWORDS) if (re.test(text)) return id
  return FALLBACK_ICON
}
