// Xariddan keyin nimani tavsiya qilish: mahsulot turi (kind) -> to‘ldiruvchi turlar. Sof modul (tests/personal.test.mjs).
import { productTitleText, normText } from './text.js'

// Tartib muhim: aniqroq tur oldin (abatment "implant" so‘zidan oldin tekshiriladi).
export const KINDS = [
  ['abutment', ['abatment', 'abutment', 'formirovatel', 'gingiva former']],
  ['bone', ['suyak', 'ksenograft', 'bone graft', 'granula', 'augment']],
  ['membrane', ['membran']],
  ['suture', ['chok ip', "shovning ip", 'sutur', 'tikuv ip']],
  ['surgical_kit', ['xirurgik', 'jarrohlik to', 'elevator', 'skalpel', 'fiziodispenser']],
  ['implant', ['implant']],
  ['apex', ['apeks', 'apex']],
  ['endomotor', ['endomotor']],
  ['gutta', ['gutaperch', 'gutta']],
  ['paper_points', ["qog'oz shtift", 'paper point']],
  ['sealer', ['siler', 'sealer']],
  ['irrigant', ['irrigat', 'gipoxlorit', 'edta', 'xlorgeksidin']],
  ['endo_file', ['fayl', 'k-file', 'h-file', 'protaper', 'reciproc']],
  ['rubber_dam', ['kofferdam', 'rubber dam']],
  ['curing_light', ['fotopolimer', 'curing light', 'polimerlovchi']],
  ['bond', ['bond', 'adgeziv', 'adhesive']],
  ['etch', ['travl', 'etch', 'ortofosfor']],
  ['glass_ionomer', ['ionomer']],
  ['composite', ['kompozit', 'composite', 'plomba']],
  ['polishing', ['polir', 'finir', 'disk']],
  ['matrix', ['matrits', 'pona', 'wedge']],
  ['whitening', ['oqartir', 'whiten']],
  ['desensitizer', ['desensit', 'sezuvchanlik']],
  ['gingival_barrier', ['gingival barer', 'liquid dam', 'milk himoya']],
  ['bracket', ['breket', 'bracket']],
  ['arch_wire', ['duga', "dug'", 'arch wire']],
  ['elastic', ['ligatur', 'elastik', 'zanjir']],
  ['impression', ['qolip', 'ottisk', 'silikon', 'alginat']],
  ['tray', ['qoshiq', 'tray']],
  ['scaler', ['skaler', 'scaler', 'ultratovush']],
  ['scaler_tips', ['nasadka', 'uchlik']],
  ['prophy', ['profilakt', 'pasta']],
  ['handpiece', ['nakonechnik', 'turbina', 'mikromotor']],
  ['burs', ['borlar', 'frez', ' bor (', 'bor to']],
  ['xray', ['rentgen', 'rvg', 'vizioograf']],
  ['sensor_cover', ["g'ilof", 'chexol', 'sleeve']],
  ['autoclave', ['avtoklav', 'sterilizator']],
  ['pouch', ['paket', 'pouch', 'kraft']],
  ['gloves', ["qo'lqop", 'glove']],
  ['mask', ['niqob', 'maska']],
  ['saliva', ["so'lak", 'slyuna']],
  ['diagnostic', ['diagnostika', 'zond', 'oyna', 'pinset']],
]

export const COMPLEMENTS = {
  implant: ['abutment', 'bone', 'membrane', 'surgical_kit', 'suture'],
  abutment: ['implant', 'impression'],
  bone: ['membrane', 'suture', 'surgical_kit'],
  membrane: ['bone', 'suture'],
  suture: ['surgical_kit'],
  surgical_kit: ['suture', 'bone', 'implant'],
  endo_file: ['gutta', 'paper_points', 'sealer', 'irrigant', 'apex', 'endomotor', 'rubber_dam'],
  apex: ['endo_file', 'endomotor', 'gutta'],
  endomotor: ['endo_file', 'apex'],
  gutta: ['sealer', 'paper_points', 'endo_file'],
  paper_points: ['gutta', 'sealer'],
  sealer: ['gutta', 'paper_points'],
  irrigant: ['endo_file'],
  rubber_dam: ['endo_file', 'composite'],
  composite: ['bond', 'etch', 'polishing', 'matrix', 'curing_light'],
  glass_ionomer: ['matrix', 'polishing', 'composite'],
  bond: ['composite', 'etch', 'curing_light'],
  etch: ['bond', 'composite'],
  curing_light: ['composite', 'bond'],
  polishing: ['composite'],
  matrix: ['composite'],
  whitening: ['desensitizer', 'gingival_barrier'],
  bracket: ['arch_wire', 'elastic', 'bond'],
  arch_wire: ['bracket', 'elastic'],
  impression: ['tray', 'impression'],
  scaler: ['scaler_tips', 'prophy'],
  scaler_tips: ['scaler'],
  handpiece: ['burs'],
  xray: ['sensor_cover'],
  autoclave: ['pouch'],
  gloves: ['mask', 'saliva'],
  mask: ['gloves'],
  saliva: ['gloves'],
  diagnostic: ['gloves'],
}

/** Sarflanadigan (qayta olinadigan) materiallar: shu muddatdan keyin xarid qilingan mahsulotning o‘zi yana tavsiya qilinadi. */
export const CONSUMABLE_REORDER_DAYS = 45
const CONSUMABLE_CATS = ['Restavratsion materiallar', 'Sarflanadigan materiallar', 'Yordamchi materiallar', 'Himoya vositalari', 'Qolip (ottisk) materiallari', 'Qolip materiallari', 'O‘lchov materiallari', 'Izolyatsiya materiallari', 'Gigiyena vositalari', 'Gigiena vositalari', 'Estetik stomatologiya']
const CONSUMABLE_KINDS = new Set(['gutta', 'paper_points', 'sealer', 'irrigant', 'composite', 'glass_ionomer', 'bond', 'etch', 'polishing', 'matrix', 'whitening', 'impression', 'prophy', 'gloves', 'mask', 'saliva', 'pouch', 'sensor_cover', 'suture', 'bone', 'membrane', 'elastic', 'endo_file', 'burs'])

/** Tur faqat nom/kategoriyadan aniqlanadi (tavsifdagi "fotopolimer lampa bilan ishlatiladi" kabi gaplar turni o‘zgartirmasin). */
export function productKinds(p) {
  const t = productTitleText(p)
  const out = []
  for (const [kind, stems] of KINDS) if (stems.some((s) => t.includes(normText(s)))) out.push(kind)
  return out
}
/** Asosiy tur: nomda eng birinchi uchragan tur ("Implant ... + abatment" -> implant); nomda bo‘lmasa — matndagi birinchisi. */
export function productKind(p) {
  const name = normText(p?.name)
  let best = ''
  let pos = Infinity
  for (const [kind, stems] of KINDS) {
    for (const s of stems) {
      const i = name.indexOf(normText(s))
      if (i >= 0 && i < pos) { pos = i; best = kind }
    }
  }
  return best || productKinds(p)[0] || ''
}

export function isConsumable(p) {
  if (!p) return false
  if (CONSUMABLE_CATS.includes(p.rawCategory || p.category)) return true
  return CONSUMABLE_KINDS.has(productKind(p))
}

/** candidate base mahsulotni to‘ldiradimi (o‘zi emas). */
export function isComplement(base, candidate) {
  if (!base || !candidate || String(base.id) === String(candidate.id)) return false
  const want = new Set(COMPLEMENTS[productKind(base)] || [])
  if (!want.size) return false
  return productKinds(candidate).some((k) => want.has(k))
}

/** "Bu bilan birga olishadi": faqat haqiqiy ro‘yxatdagi to‘ldiruvchilar, COMPLEMENTS tartibida. */
export function complementsFor(base, products, limit = 8) {
  const order = COMPLEMENTS[productKind(base)] || []
  if (!order.length) return []
  const rank = (p) => {
    const ks = productKinds(p)
    const i = Math.min(...ks.map((k) => { const j = order.indexOf(k); return j < 0 ? 99 : j }))
    return i
  }
  return (products || [])
    .filter((p) => isComplement(base, p) && p.stock !== 0)
    .map((p) => [rank(p), p])
    .sort((a, b) => a[0] - b[0])
    .slice(0, limit)
    .map(([, p]) => p)
}
