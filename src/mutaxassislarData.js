const face = (n) => `/images/bemorlar/${n}.jpg`
const kat = (n) => `/images/kategoriyalar/${n}.jpg`
const sem = (n) => `/images/seminars/${n}.jpg`

export const SPECS = [
  ['all', 'Barchasi'],
  ['stomatolog', 'Stomatolog'],
  ['implantolog', 'Implantolog'],
  ['ortodont', 'Ortodont'],
  ['endodont', 'Endodont'],
  ['jarroh', 'Jarroh'],
  ['estetik', 'Estetik'],
  ['pediatr', 'Bolalar'],
]

export const CITIES = ['Toshkent', 'Samarqand', 'Buxoro', 'Andijon']

const S = {
  implant: { name: 'Implant qo‘yish', note: 'Zamonaviy implant tizimlari bilan', price: 4500000, img: kat('kat-implant') },
  zirkon: { name: 'Zirkoniy koronka', note: 'Yuqori estetik va mustahkam', price: 2200000, img: kat('kat-ortopediya') },
  plomba: { name: 'Plomba (kompozit)', note: 'Estetik tiklash', price: 350000, img: '/images/market/tooth.jpg' },
  clean: { name: 'Professional tozalash', note: 'Tish toshlarini olib tashlash', price: 400000, img: face('bemor-intra') },
  breket: { name: 'Breket tizimi', note: 'Metall yoki keramik breketlar', price: 9000000, img: sem('smile') },
  aligner: { name: 'Elaynerlar', note: 'Ko‘rinmas tekislash', price: 14000000, img: sem('aligner') },
  kanal: { name: 'Kanal davolash', note: 'Mikroskop ostida, 1 kanal', price: 600000, img: sem('micro') },
  sinus: { name: 'Sinus lifting', note: 'Suyak hajmini oshirish', price: 3800000, img: sem('surgery') },
  venir: { name: 'Vinirlar', note: 'Keramik, 1 tish', price: 3000000, img: face('bemor-intra') },
  oq: { name: 'Tish oqartirish', note: 'Klinikada, 1 seans', price: 1200000, img: sem('teeth') },
  bola: { name: 'Bolalar plombasi', note: 'Og‘riqsiz, rangli plomba', price: 250000, img: '/images/channels/kids.jpg' },
  kons: { name: 'Konsultatsiya', note: 'Ko‘rik va davolash rejasi', price: 100000, img: '/images/market/tooth.jpg' },
}

const WORKS = []

const R = []

export const DOCTORS = []

export const getDoctor = (id) => DOCTORS.find((d) => d.id === id)
export const sum = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so‘m`
