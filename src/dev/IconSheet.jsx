// Dev-only: kategoriya ikonkalari kontakt varag‘i (/icon-sheet). Har bir bo‘lim — kalit, nom va ikonka.
import { CATEGORY_ICON_MAP } from '../icons/categoryIconMap'
import { ART } from '../icons/categoryIconArt'
import { LUCIDE_IDS } from '../icons/categoryIconMap'
import { iconById, iconFor, CategoryTile } from '../icons/categoryIcons'
import { CategoryChips } from '../components/catalog/CatalogLayout'
import { MARKET_CATEGORIES } from '../config/productCatalog'
import { cats as formaCats } from '../formaData'
import { cats as bookCats } from '../booksData'
import { directions } from '../educationData'
import { cats as ustaCats } from '../ustalarData'
import { catList as jihozCats } from '../jihozData'
import { specs as jobSpecs } from '../ishlarData'
import { surplusChips } from '../surplusData'
import { SPECS } from '../mutaxassislarData'
import { AD_CATS } from '../elonlarData'
import { seminarChips } from '../seminarsData'

const asPairs = (l) => l.map((x) => (Array.isArray(x) ? x : [x.key, x.label])).filter(([k]) => k !== 'all')
const ROWS = [
  ['Marketplace', 'marketplace', MARKET_CATEGORIES.map((c) => [c, c])], ['Seminarlar', 'seminarlar', asPairs(seminarChips)],
  ['Ta’lim', 'talim', asPairs(directions)], ['Kitoblar', 'kitoblar', asPairs(bookCats)], ['Forma', 'forma', asPairs(formaCats)],
  ['Jihozlar', 'jihozlar', asPairs(jihozCats)], ['Ustalar', 'ustalar', asPairs(ustaCats)], ['Ortiqcha', 'ortiqcha', asPairs(surplusChips)],
  ['E’lonlar', 'elonlar', asPairs(AD_CATS)], ['Mutaxassislar', 'mutaxassislar', asPairs(SPECS)], ['Ish o‘rinlari', 'ishlar', asPairs(jobSpecs)],
]

const LABELS = {
  tooth: 'Tish', filling: 'Plomba / restavratsiya', whitening: 'Oqartirish / estetika', pediatric: 'Bolalar', implant: 'Implant',
  endoFile: 'Endo fayl', impressionTray: 'Qolip qoshig‘i', bracket: 'Breket', crown: 'Toj (ortopediya)', lab: 'Laboratoriya',
  gum: 'Parodont (milk)', scalpel: 'Skalpel (jarrohlik)', dentalChair: 'Ustanovka', handpiece: 'Uchlik / turbina', autoclave: 'Avtoklav',
  xray: 'Rentgen / CBCT', scanner: 'Intraoral skaner', digital: 'Digital / CAD', compressor: 'Kompressor', curingLight: 'Polimer lampa',
  toothbrush: 'Gigiyena', gloves: 'Qo‘lqop (sarf)', mask: 'Niqob (himoya)', bondBottle: 'Bond / yordamchi', cement: 'Sement',
  compositeSyringe: 'Kompozit shprits', instruments: 'Ko‘zgu + zond', rubberDam: 'Koferdam', scrub: 'Skrab', coat: 'Xalat', cap: 'Qalpoq',
  clog: 'Poyabzal (klog)', apron: 'Fartuk', all: 'Barchasi', book: 'Kitob', atlas: 'Atlas', anatomy: 'Anatomiya', course: 'Kurs',
  seminar: 'Seminar', webinar: 'Vebinar', clinic: 'Klinika', job: 'Ish o‘rni', team: 'Assistent', admin: 'Administrator', other: 'Boshqa',
  install: 'Montaj', microscope: 'Mikroskop', anesthetic: 'Anesteziya', glasses: 'Aksessuar (lupa)',
}

export default function IconSheet() {
  const ids = [...Object.keys(ART), ...Object.keys(LUCIDE_IDS)]
  const mode = new URLSearchParams(location.search).get('m')
  if (mode === 'rows') {
    const only = new URLSearchParams(location.search).get('s')
    return (
      <div className="min-h-screen bg-page px-3.5 py-3">
        {ROWS.filter(([, sec]) => !only || only === sec).map(([title, sec, pairs]) => (
          <section key={sec} data-row={sec} className="mb-3">
            <p className="text-[15px] font-extrabold text-ink">{title}</p>
            <CategoryChips cats={pairs.map(([key, label]) => ({ key, label, icon: iconFor(sec, key, label) }))} value={pairs[1]?.[0]} onChange={() => {}} desktop={false} />
          </section>
        ))}
      </div>
    )
  }
  if (mode === 'big') {
    return (
      <div className="grid grid-cols-8 gap-4 bg-white p-4 text-sea-600">
        {ids.map((id) => { const I = iconById(id); return <div key={id} className="flex flex-col items-center"><I className="size-[96px]" /><span className="text-[13px] text-ink">{id}</span></div> })}
      </div>
    )
  }
  if (mode === 'map') {
    return (
      <div className="min-h-screen bg-white p-6 font-sans">
        <h1 className="text-[20px] font-extrabold text-ink">Kategoriya → ikonka</h1>
        <div className="mt-4 columns-3 gap-6">
          {Object.entries(CATEGORY_ICON_MAP).map(([sec, m]) => (
            <div key={sec} className="mb-5 break-inside-avoid">
              <p className="mb-1.5 text-[13px] font-bold uppercase tracking-wide text-sea-600">{sec}</p>
              {Object.entries(m).map(([k, id]) => { const I = iconById(id); return <div key={k} className="flex items-center gap-2 py-0.5 text-[12px] text-ink-2"><CategoryTile icon={I} size="sm" /> <span className="truncate">{k}</span></div> })}
            </div>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-white p-6 font-sans" data-testid="icon-sheet">
      <h1 className="text-[20px] font-extrabold text-ink">StomaHub kategoriya ikonkalari</h1>
      <p className="text-[12px] text-muted">24×24, chiziq 1.75, yumaloq uchlar, brend teal. Pastki qator — tanlangan holat.</p>
      <div className="mt-4 grid grid-cols-8 gap-x-3 gap-y-4" style={{ zoom: Number(new URLSearchParams(location.search).get("z")) || 1 }}>
        {ids.map((id) => { const I = iconById(id); return (
          <div key={id} className="flex flex-col items-center gap-1.5">
            <div className="flex gap-1.5"><CategoryTile icon={I} size="lg" /><CategoryTile icon={I} size="sm" active /></div>
            <span className="text-center text-[11px] font-semibold leading-tight text-ink">{LABELS[id] || id}</span>
            <span className="text-[9.5px] text-muted">{id}{ART[id] ? '' : ' · lucide'}</span>
          </div>
        ) })}
      </div>
    </div>
  )
}
