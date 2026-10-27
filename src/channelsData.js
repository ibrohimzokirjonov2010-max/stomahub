export const platforms = [
  { key: 'all', label: 'Barchasi' },
  { key: 'tg', label: 'Telegram' },
  { key: 'yt', label: 'YouTube' },
  { key: 'ig', label: 'Instagram' },
  { key: 'pod', label: 'Podkast' },
]

export const topics = [
  ['all', 'Barchasi'],
  ['impl', 'Implantologiya'],
  ['endo', 'Endodontiya'],
  ['orto', 'Ortodontiya'],
  ['estet', 'Estetika'],
  ['market', 'Klinika marketingi'],
  ['jobs', 'Vakansiyalar'],
  ['sales', 'Material sotuvi'],
]

export const languages = [
  ['all', 'Barchasi'],
  ['uz', 'O‘zbek'],
  ['ru', 'Rus'],
  ['en', 'Ingliz'],
]

const langName = { uz: 'O‘zbek', ru: 'Rus', en: 'Ingliz' }

export const channels = []

export const official = []

export const langLabel = (k) => langName[k] || k

export function subsFull(n) {
  return `${n.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} obunachi`
}

export function subsShort(n) {
  if (n >= 1000) {
    const v = n / 1000
    return `${Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1)}K obunachi`
  }
  return `${n} obunachi`
}
