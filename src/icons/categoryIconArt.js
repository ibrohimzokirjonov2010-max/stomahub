// StomaHub kategoriya ikonkalari — yagona uslub: 24×24 grid, chiziq 1.75, yumaloq uchlar,
// monoxrom (currentColor). Faqat stomatologiyaga xos tushunchalar shu yerda chiziladi;
// umumiy tushunchalar (kitob, kurs, klinika...) lucide-react dan olinadi (categoryIcons.jsx).
// Har bir qiymat — <svg> ichidagi belgilash (statik, ishonchli matn).

// Klassik tish konturi (molyar), 3.5…20.5 oralig‘ida
export const TOOTH_D = 'M7.6 3.5c-2.3 0-4.1 1.8-4.1 4.4 0 2 .8 3.5 1.5 4.9.6 1.3.9 2.9 1.2 4.6.3 1.9.9 3.1 1.9 3.1 1.2 0 1.5-1.6 1.9-3.4.3-1.5.8-2.6 2-2.6s1.7 1.1 2 2.6c.4 1.8.7 3.4 1.9 3.4 1 0 1.6-1.2 1.9-3.1.3-1.7.6-3.3 1.2-4.6.7-1.4 1.5-2.9 1.5-4.9 0-2.6-1.8-4.4-4.1-4.4-1.6 0-2.6.9-4.4.9s-2.8-.9-4.4-.9Z'
// Kichraytirilgan tish: chiziq qalinligi 1/s ga ko‘paytiriladi, shunda ekranda ham 1.75 bo‘lib qoladi.
const tooth = (x = 0, y = 0, s = 1) => (s === 1 ? `<path d="${TOOTH_D}"/>` : `<path transform="translate(${x} ${y}) scale(${s})" stroke-width="${+(1.75 / s).toFixed(3)}" d="${TOOTH_D}"/>`)
const dot = (cx, cy, r = 0.7) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="currentColor" stroke="none"/>`

export const ART = {
  // Tish (umumiy stomatologiya)
  tooth: tooth(),
  // Plomba qo‘yilgan tish — restavratsiya, terapiya, kompozit
  filling: `${tooth()}<path d="M8.6 8.4c1.1.9 2.2 1.3 3.4 1.3s2.3-.4 3.4-1.3l-.6 2.6c-.9.5-1.8.7-2.8.7s-1.9-.2-2.8-.7Z" fill="currentColor"/>`,
  // Oqartirish / estetika — tish + yulduzcha
  whitening: `${tooth(-1.2, 2.2, 0.82)}<path d="M18.5 1.8v4.6M16.2 4.1h4.6"/><path d="M8.2 8.6c.4-1.1 1.2-1.8 2.2-2"/>`,
  // Bolalar stomatologiyasi — tish ichida yulduz
  pediatric: `${tooth()}<path d="m12 7.3.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3Z" fill="currentColor" stroke-width="1"/>`,
  // Implant — toj + abatment + rezbali vint
  implant: '<path d="M7.2 2.8h9.6c.8 0 1.3.7 1.1 1.4l-.7 2.6c-.2.7-.8 1.2-1.5 1.2H8.3c-.7 0-1.3-.5-1.5-1.2l-.7-2.6c-.2-.7.3-1.4 1.1-1.4Z"/><path d="M10.2 8v2.2h3.6V8"/><path d="M8.8 10.2h6.4l-.7 8.3L12 21.2l-2.5-2.7Z"/><path d="M8.4 12.9h7.2M8.7 15.6h6.6M9.2 18.2h5.6"/>',
  // Endodontik fayl (K-fayl) — dasta + spiral ishchi qism
  endoFile: '<rect x="8.5" y="2.2" width="7" height="6" rx="1.6"/><path d="M8.5 5.2h7"/><path d="M10.6 10h2.8"/><path d="M12 8.2v1.8l1.6 1.4-3.2 1.7 3.2 1.7-3.2 1.7 3.2 1.7L12 20v1.8"/>',
  // Qolip qoshig‘i (ottisk) — yuqoridan ko‘rinish
  impressionTray: `<path d="M10.6 6V2.5h2.8V6"/><path d="M4.8 21v-8.2a7.2 7.2 0 0 1 14.4 0V21h-3.6v-8a3.6 3.6 0 0 0-7.2 0v8Z"/>${dot(12, 7.8, 0.65)}${dot(7.6, 9.9, 0.65)}${dot(16.4, 9.9, 0.65)}${dot(6.7, 14.6, 0.65)}${dot(17.3, 14.6, 0.65)}${dot(6.7, 18.6, 0.65)}${dot(17.3, 18.6, 0.65)}`,
  // Ortodontiya — tish + breket + dugа
  bracket: `${tooth()}<rect x="9.2" y="8.3" width="5.6" height="4.4" rx="1.1"/><path d="M1.8 10.5h7.4M14.8 10.5h7.4"/>`,
  // Ortopediya — protez toj + qirqilgan tish (kult)
  crown: '<path d="M5 9.6c0-3.4 2.1-5.9 4.6-5.9 1 0 1.6.4 2.4.4s1.4-.4 2.4-.4c2.5 0 4.6 2.5 4.6 5.9v1.6c0 .9-.7 1.6-1.6 1.6H6.6c-.9 0-1.6-.7-1.6-1.6Z"/><path d="m8 12.8 1.1 7.1c.1.8.6 1.3 1.2 1.3h3.4c.6 0 1.1-.5 1.2-1.3l1.1-7.1"/>',
  // Tish texnigi / laboratoriya — toj + gips model asosi
  lab: '<path d="M3 7c0-1.7 1.3-3 3-3h12c1.7 0 3 1.3 3 3v2.5H3Z"/><path d="M3 9.5v3.6a2.25 2.25 0 0 0 4.5 0V9.5M7.5 9.5v5.1a2.25 2.25 0 0 0 4.5 0V9.5M12 9.5v5.1a2.25 2.25 0 0 0 4.5 0V9.5M16.5 9.5v3.6a2.25 2.25 0 0 0 4.5 0V9.5"/><path d="M5 19.5h14"/>',
  // Parodontologiya — tish + milk chizig‘i
  gum: `${tooth()}<path d="M2 12.6c1.7-1.6 3.3-1.6 5 0s3.3 1.6 5 0 3.3-1.6 5 0 3.3 1.6 5 0"/>`,
  // Jarrohlik — skalpel
  scalpel: '<path d="M2.9 19.4 11 11.3l1.8 1.8-8.1 8.1c-.5.5-1.3.5-1.8 0s-.5-1.3 0-1.8Z"/><path d="M12.4 9.9 19 3.3c.9-.9 2.3-.4 2.2.9-.3 3.6-3.6 7.6-7.7 9.1"/><path d="M6.2 17.8l1.3 1.3"/>',
  // Stomatologik ustanovka (kreslo + lampa)
  dentalChair: '<path d="M3.3 5.4c-.2-1 .5-1.9 1.5-1.9.7 0 1.3.5 1.5 1.2l1.9 7.2H5.3Z"/><path d="M5.3 12h9.3l4.6 3.2c.8.6.4 1.8-.6 1.8H7c-.9 0-1.7-.8-1.7-1.7Z"/><path d="M11 17v3.5M7 20.5h8"/><path d="M13 2.8h5.5v3.4"/><path d="M16 6.2h5l-1 2.1h-3Z"/>',
  // Uchlik / turbina
  handpiece: '<path d="M3.6 21.2 2.8 20.4c-.4-.4-.4-1 0-1.4l7.6-8.7 2.7 2.7-8.1 8.2c-.4.4-1 .4-1.4 0Z"/><path d="m11.6 11.5 4.6-5.3"/><path d="M14.6 5.2a2.6 2.6 0 0 1 3.7-.4l1.4 1.2a2.6 2.6 0 0 1 .2 3.7"/><path d="m19.9 9.7-2.3-2"/><path d="M15.6 9.2l-2.3 2.4"/><path d="M5.3 17.8l1.6 1.6M7.4 15.4l1.6 1.6"/>',
  // Avtoklav / sterilizatsiya
  autoclave: '<rect x="2.5" y="5" width="19" height="13.5" rx="2.2"/><circle cx="9.5" cy="11.75" r="4"/><circle cx="9.5" cy="11.75" r="1.6"/><path d="M16.5 8.8h2.2M16.5 11.8h2.2M16.5 14.8h2.2"/><path d="M5.5 18.5v2M18.5 18.5v2"/><path d="M8 2.2c.4.6.4 1.1 0 1.7M11 2.2c.4.6.4 1.1 0 1.7"/>',
  // Rentgen / CBCT — plyonka ichida tish
  xray: `<rect x="2.5" y="3.5" width="19" height="17" rx="2.2"/>${tooth(5.3, 5.3, 0.56)}<path d="M18.5 6.5v2M5.5 15.5v2"/>`,
  // Intraoral skaner / CAD-CAM — skanerlash ramkasi ichida tish
  scanner: `<path d="M3 7.5V5.2C3 4 4 3 5.2 3h2.3M16.5 3h2.3C20 3 21 4 21 5.2v2.3M21 16.5v2.3c0 1.2-1 2.2-2.2 2.2h-2.3M7.5 21H5.2C4 21 3 20 3 18.8v-2.3"/>${tooth(6.6, 6.6, 0.45)}<path d="M5 12h14"/>`,
  // Digital stomatologiya — monitor + tish
  digital: `<rect x="2.5" y="3.5" width="19" height="13" rx="2"/>${tooth(7.9, 5.1, 0.42)}<path d="M9 20.5h6M12 16.5v4"/>`,
  // Kompressor — ballon + manometr
  compressor: '<rect x="2.5" y="11" width="16" height="7.5" rx="3.75"/><path d="M6 18.5v2.2M15 18.5v2.2"/><path d="M6.5 11V8h5v3"/><circle cx="17.5" cy="6" r="3"/><path d="m17.5 6 1.3-1.2"/><path d="M15.4 8.2 13.6 11"/>',
  // Polimerlash lampasi
  curingLight: '<rect x="2.5" y="4.5" width="12.5" height="5.5" rx="2.2"/><path d="m6 10 1.3 9.2c.1.7.7 1.3 1.4 1.3h1c.8 0 1.4-.7 1.3-1.5L10 10"/><path d="M15 7.2h1.8c1.5 0 2.2 1.2 2.2 2.7v1.6"/><path d="M19 14v2.6M16.9 13.4l-1.3 1.9M21.1 13.4l1.3 1.9"/><path d="M8.4 12.6v1.8"/>',
  // Tish cho‘tkasi — gigiyena, profilaktika
  toothbrush: '<path d="M13 12.8h6.8c1 0 1.7.7 1.7 1.7s-.7 1.7-1.7 1.7H13"/><path d="M13 12.8H4.3a1.8 1.8 0 0 0 0 3.6h4.2c1.3 0 2.5-.4 3.5-1.2l1-.7"/><path d="M14.3 8v4.8M17 7v5.8M19.7 8v4.8"/>',
  // Qo‘lqop — sarflanadigan materiallar
  gloves: '<path d="M8 21.5v-3.2L5 13.4c-.6-1-.3-2.1.6-2.5.8-.4 1.6 0 2 .7l1 1.6V5.4a1.3 1.3 0 0 1 2.6 0v5.4-6.6a1.3 1.3 0 0 1 2.6 0v6.6-5.6a1.3 1.3 0 0 1 2.6 0v6-3.5a1.3 1.3 0 0 1 2.6 0v6.9c0 2.4-1 4.1-2.6 5.4v3.5"/><path d="M8 18.4h8.4"/>',
  // Niqob — himoya vositalari
  mask: '<path d="M5.5 8.2c2.1-1 4.3-1.5 6.5-1.5s4.4.5 6.5 1.5v6.3c-1.8 1.9-4 2.8-6.5 2.8s-4.7-.9-6.5-2.8Z"/><path d="M8.5 10.6h7M8.5 13.4h7"/><path d="M5.5 9.3H4a1.8 1.8 0 0 0 0 3.6h1.6M18.5 9.3H20a1.8 1.8 0 0 1 0 3.6h-1.6"/>',
  // Bond / adgeziv — tomizgichli flakon
  bondBottle: '<path d="M10.8 2.5h2.4l.7 3.3h-3.8Z"/><rect x="9.3" y="5.8" width="5.4" height="2.8" rx=".6"/><path d="M8 10.1c0-.8.7-1.5 1.5-1.5h5c.8 0 1.5.7 1.5 1.5v9.4c0 .8-.7 1.5-1.5 1.5h-5c-.8 0-1.5-.7-1.5-1.5Z"/><path d="M8 13.2h8M8 17.4h8"/><path d="M19.2 3.2c.8 1.1 1.2 1.8 1.2 2.4a1.2 1.2 0 0 1-2.4 0c0-.6.4-1.3 1.2-2.4Z"/>',
  // Sement — aralashtirish plastinkasi + shpatel
  cement: '<rect x="2.5" y="11.5" width="13" height="9" rx="1.6"/><path d="M6.2 16.8c.6-1.3 1.9-2 3.3-1.6 1 .3 1.3 1.2.6 1.8-.9.7-2.6.6-3.9-.2Z" fill="currentColor" stroke-width="1"/><path d="M12.3 13.5 20.4 5.4"/><path d="m19.3 4.3 1.4-1.4c.4-.4 1-.4 1.4 0s.4 1 0 1.4l-1.4 1.4"/>',
  // Kompozit shprits (kompyula)
  compositeSyringe: '<path d="M8.4 13.2 15.7 5.9l2.4 2.4-7.3 7.3Z"/><path d="m13.1 8.5 2.4 2.4"/><path d="m17 4.6 1.3-1.3 2.4 2.4-1.3 1.3"/><path d="m19.5 4.5 1.9-1.9"/><path d="m9.6 14.4-3.2 3.2c-.9.9-1.5 1.9-1.9 3.1"/><path d="M2.6 21.4l1.8-.7"/>',
  // Asboblar — ko‘zgu + zond
  instruments: '<circle cx="7" cy="5.5" r="3.2"/><path d="M7.9 8.6 9.6 21"/><path d="M16.8 2.6c1.6 0 2.4 1.5 1.6 2.9l-.5.9"/><path d="M17.9 6.4 14.6 21"/>',
  // Koferdam (izolyatsiya) — ramka + tish
  rubberDam: `<path d="M3.5 3.5v13.3c0 2 1.6 3.7 3.7 3.7h9.6c2 0 3.7-1.6 3.7-3.7V3.5"/><path d="M3.5 3.5h2.3M18.2 3.5h2.3"/>${tooth(6, 5, 0.5)}`,
  // Tibbiy forma — skrab ko‘ylak (V-yoqa + cho‘ntak)
  scrub: '<path d="M8.4 3.2 4 5.1c-.7.3-1.1 1-1 1.8l.6 3.6c.1.5.6.9 1.1.8l2-.3v8.8c0 .7.5 1.2 1.2 1.2h8.2c.7 0 1.2-.5 1.2-1.2V11l2 .3c.5.1 1-.3 1.1-.8l.6-3.6c.1-.8-.3-1.5-1-1.8l-4.4-1.9"/><path d="M8.4 3.2 12 8.4l3.6-5.2"/><path d="M13.6 12.2h2.6v2.5h-2.6Z"/>',
  // Xalat — uzun oq xalat lapellar bilan
  coat: '<path d="M8.6 2.8 5.2 4.3c-.8.4-1.3 1.2-1.3 2.1L3.5 20c0 .7.5 1.2 1.2 1.2h14.6c.7 0 1.2-.5 1.2-1.2l-.4-13.6c0-.9-.5-1.7-1.3-2.1l-3.4-1.5"/><path d="M8.6 2.8 12 7.5l3.4-4.7"/><path d="m8.6 2.8-.8 5.4 4.2 4.4 4.2-4.4-.8-5.4"/><path d="M12 12.6v8.6"/><path d="M6 14.5h2.8M15.2 14.5H18"/>',
  // Jarrohlik qalpog‘i
  cap: '<path d="M3.5 14.5c0-5.2 3.8-9.3 8.5-9.3s8.5 4.1 8.5 9.3"/><path d="M2.8 14.5h18.4v2.6H2.8Z"/><path d="M19.5 17.1l1.5 3.6M17.6 17.1l.7 3.9"/><path d="M8 9.5c.9-1.1 2.3-1.8 4-1.8"/>',
  // Tibbiy poyabzal — klog
  clog: `<path d="M2.5 14.6c0-2.3 1.6-4.4 3.9-5.2L12 7.5c1-.3 2 0 2.6.8l4 5.2c1.3.4 2.4 1.5 2.4 3v.9c0 .8-.7 1.5-1.5 1.5H4c-.8 0-1.5-.7-1.5-1.5Z"/><path d="M2.6 15.8H21"/>${dot(8, 11.8, 0.75)}${dot(11, 10.8, 0.75)}${dot(13.8, 11.9, 0.75)}`,
  // Fartuk
  apron: '<path d="M9 2.5c0 1.8 1.3 3 3 3s3-1.2 3-3"/><path d="M8 6.2h8l.7 4.3c1.6.5 2.8 2 2.8 3.8v5.3c0 .7-.5 1.2-1.2 1.2H5.7c-.7 0-1.2-.5-1.2-1.2v-5.3c0-1.8 1.2-3.3 2.8-3.8Z"/><path d="M7.3 10.5H3M16.7 10.5H21"/><path d="M9 15h6v3H9Z"/>',
}

export const CUSTOM_IDS = Object.keys(ART)
