import { som } from './marketData'


export const cats = [
  ['all', 'Barchasi'],
  ['terapiya', 'Terapiya'],
  ['endo', 'Endodontiya'],
  ['impl', 'Implantologiya'],
  ['ortoped', 'Ortopediya'],
  ['orto', 'Ortodontiya'],
  ['surgery', 'Jarrohlik'],
  ['anatomy', 'Anatomiya'],
  ['atlas', 'Atlaslar'],
]

export const formatOptions = [
  ['print', 'Bosma kitob'],
  ['pdf', 'Elektron (PDF)'],
  ['both', 'Ikkalasi'],
]

export const langOptions = [
  ['uz', 'O‘zbek'],
  ['ru', 'Rus'],
  ['en', 'Ingliz'],
]

export const stockOptions = [
  ['all', 'Barchasi'],
  ['stock', 'Omborda'],
  ['preorder', 'Oldindan buyurtma'],
]

export const publisherOptions = [
  ['quintessence', 'Quintessence'],
  ['elsevier', 'Elsevier'],
  ['springer', 'Springer'],
  ['stomamedia', 'StomaMedia'],
  ['other', 'Boshqalar'],
]

export const langName = { uz: 'O‘zbek', ru: 'Rus', en: 'Ingliz' }

export const sorts = {
  popular: 'Eng ommabop',
  rating: 'Reyting',
  cheap: 'Arzonroq',
  rich: 'Qimmatroq',
  fresh: 'Yangi',
}

export const books = []

export const library = []

export const perks = ['Yuqori sifatli rasmlar', 'Klinik holatlar', 'Bosqichma-bosqich protokol']

export const priceless = (b) => b == null || b.price == null || b.price === ''
export const money = (n) => (n == null || n === '' ? 'Narxi kelishiladi' : som(n))

export const featured = books.find((b) => b.featured)

export const pubName = { quintessence: 'Quintessence', elsevier: 'Elsevier', springer: 'Springer', stomamedia: 'StomaMedia', other: 'Boshqa' }
export const langLong = { uz: 'O‘zbekcha', ru: 'Ruscha', en: 'Inglizcha' }

export const shelf = []

export function getBook(id) {
  return books.find((b) => b.id === id) || shelf.find((b) => b.id === id) || null
}

// Book page facts. Only real data from the book record: no invented chapters, gallery or text.
// Mundarija = chapter rows of the book's own contents page (book.contents, PDF page numbers);
// older records without it fall back to their stored toc titles (no page numbers).
export function bookToc(book) {
  const rows = Array.isArray(book.contents) ? book.contents.filter((r) => r && r.title && r.page) : []
  if (rows.length) {
    const top = rows.filter((r) => !r.level)
    return (top.length >= 3 ? top : rows).map((r) => ({ title: r.title, page: Number(r.page) }))
  }
  return (Array.isArray(book.toc) ? book.toc : []).filter(Boolean).map((t) => ({ title: String(t), page: undefined }))
}

export function productOf(book) {
  const pdf = priceless(book) || !book.formats?.includes('pdf') ? null : Math.max(90000, Math.round(book.price * 0.66))
  return {
    category: book.category || 'Stomatologiya',
    pdf,
    binding: book.formats.includes('print') ? 'Qattiq muqova' : 'Elektron',
    gallery: Array.isArray(book.gallery) && book.gallery.length ? book.gallery : [book.cover].filter(Boolean),
    about: book.about || book.blurb || '',
    more: '',
    toc: bookToc(book),
    reviews: [],
    similar: books.filter((b) => b.id !== book.id).slice(0, 5),
  }
}

export function countBy(list, pick) {
  const map = {}
  list.forEach((b) => {
    const keys = pick(b)
    ;(Array.isArray(keys) ? keys : [keys]).forEach((k) => { map[k] = (map[k] || 0) + 1 })
  })
  return map
}
