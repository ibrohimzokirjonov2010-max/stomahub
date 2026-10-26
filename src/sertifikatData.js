export const OWNER = 'Ibrohim Karimov'

export const TYPES = [
  { id: 'all', label: 'Barchasi' },
  { id: 'seminar', label: 'Seminarlar' },
  { id: 'online', label: 'Onlayn darslar' },
  { id: 'webinar', label: 'Vebinarlar' },
  { id: 'training', label: 'Amaliy treninglar' },
  { id: 'cme', label: 'CME ballari' },
]

export const TYPE_LABEL = { seminar: 'Seminar', online: 'Onlayn kurs', webinar: 'Vebinar', training: 'Amaliy trening' }
export const TYPE_LINE = { seminar: 'mavzusidagi seminarni muvaffaqiyatli yakunlagan', online: 'onlayn kursini muvaffaqiyatli yakunlagan', webinar: 'mavzusidagi vebinarni muvaffaqiyatli yakunlagan', training: 'amaliy treningini muvaffaqiyatli yakunlagan' }

export const certs = [
  { id: 'SH-CERT-2026-00418', order: 1, title: 'Zamonaviy implantologiya', type: 'seminar', speaker: 'Dr. Sardor Karimov', date: '24-noyabr 2026', iso: '2026-11-24', place: 'Toshkent', cme: 16, hours: 24, theme: 'teal' },
  { id: 'SH-CERT-2026-00391', order: 2, title: 'Endodontiya: kanal davolash asoslari', type: 'online', speaker: 'Dr. Nigora Aliyeva', date: '12-oktabr 2026', iso: '2026-10-12', place: 'Onlayn', cme: 12, hours: 18, theme: 'mint' },
  { id: 'SH-CERT-2026-00342', order: 3, title: 'Ortodontiya: zamonaviy yondashuvlar', type: 'seminar', speaker: 'Dr. Azizbek Mirzayev', date: '5-avgust 2026', iso: '2026-08-05', place: 'Samarqand', cme: 10, hours: 16, theme: 'gold' },
  { id: 'SH-CERT-2026-00287', order: 4, title: 'Raqamli stomatologiya: skanerlash va CAD/CAM', type: 'webinar', speaker: 'Dr. Bobur Tursunov', date: '20-iyun 2026', iso: '2026-06-20', place: 'Onlayn', cme: 8, hours: 8, theme: 'dark' },
  { id: 'SH-CERT-2026-00231', order: 5, title: 'Klinik parodontologiya', type: 'training', speaker: 'Dr. Malika Yo‘ldosheva', date: '15-may 2026', iso: '2026-05-15', place: 'Toshkent', cme: 10, hours: 16, theme: 'mint' },
  { id: 'SH-CERT-2026-00198', order: 6, title: 'Bolalar stomatologiyasi', type: 'online', speaker: 'Dr. Dilnoza Saidova', date: '10-aprel 2026', iso: '2026-04-10', place: 'Onlayn', cme: 6, hours: 10, theme: 'teal' },
  { id: 'SH-CERT-2026-00154', order: 7, title: 'Estetik restavratsiya: kompozit qatlamlash', type: 'training', speaker: 'Dr. Jamshid Ergashev', date: '22-mart 2026', iso: '2026-03-22', place: 'Toshkent', cme: 12, hours: 16, theme: 'gold' },
  { id: 'SH-CERT-2026-00121', order: 8, title: 'Og‘riqsizlantirish va anesteziya', type: 'webinar', speaker: 'Dr. Laylo Hamidova', date: '28-fevral 2026', iso: '2026-02-28', place: 'Onlayn', cme: 4, hours: 4, theme: 'dark' },
  { id: 'SH-CERT-2026-00087', order: 9, title: 'Protezlash: bir bosqichli yechimlar', type: 'seminar', speaker: 'Dr. Rustam Qosimov', date: '14-fevral 2026', iso: '2026-02-14', place: 'Buxoro', cme: 14, hours: 20, theme: 'teal' },
  { id: 'SH-CERT-2026-00052', order: 10, title: 'Mikroskop bilan endodontiya', type: 'training', speaker: 'Dr. Nigora Aliyeva', date: '25-yanvar 2026', iso: '2026-01-25', place: 'Toshkent', cme: 16, hours: 24, theme: 'mint' },
  { id: 'SH-CERT-2025-00911', order: 11, title: 'Stomatologiyada infeksiya nazorati', type: 'online', speaker: 'Dr. Aziza Rahimova', date: '12-dekabr 2025', iso: '2025-12-12', place: 'Onlayn', cme: 6, hours: 8, theme: 'gold' },
  { id: 'SH-CERT-2025-00864', order: 12, title: 'Klinika boshqaruvi va bemor servisi', type: 'webinar', speaker: 'Dr. Sherzod Nazarov', date: '20-noyabr 2025', iso: '2025-11-20', place: 'Onlayn', cme: 4, hours: 6, theme: 'dark' },
]

export const STATS = { count: 12, cme: 320, done: 4 }
