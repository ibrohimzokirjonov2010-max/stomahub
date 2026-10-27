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

export const people = {}

export function longDate(d) {
  const [dd, mm, yyyy] = d.split('.')
  return `${Number(dd)}-${months[Number(mm) - 1]} ${yyyy}`
}
export const viewsOf = (n) => Number(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')

const post = (p) => ({ author: 'dilshod', kind: catName[p.cat], ...p })

export const articles = []

export const events = []

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
