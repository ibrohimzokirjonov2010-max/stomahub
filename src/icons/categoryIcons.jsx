// Yagona kategoriya ikonkalari to‘plami: barcha bo‘limlarda bir xil uslub va brend rangi.
// - ART (categoryIconArt.js): stomatologiyaga xos maxsus SVG lar
// - LUCIDE_IDS: umumiy tushunchalar uchun lucide-react (bir xil 24 grid, chiziq 1.75)
// Foydalanish: <CategoryIcon id="implant" /> yoki iconFor('marketplace', key, label) → komponent;
// plitka: <CategoryTile icon={Icon} active />.
import {
  LayoutGrid, BookOpen, BookOpenText, Skull, GraduationCap, Presentation, MonitorPlay, Hospital, Briefcase, Users,
  ClipboardList, Package, Drill, Microscope, Syringe, Glasses,
} from 'lucide-react'
import { ART } from './categoryIconArt'
import { LUCIDE_IDS, GLYPHS, categoryIconId, FALLBACK_ICON } from './categoryIconMap'

// Glif to‘plamining ingichka chizig‘iga moslab (zaxira ikonkalar uchun)
export const ICON_STROKE = 1.35

const Lucide = {
  LayoutGrid, BookOpen, BookOpenText, Skull, GraduationCap, Presentation, MonitorPlay, Hospital, Briefcase, Users,
  ClipboardList, Package, Drill, Microscope, Syringe, Glasses,
}

function CustomSvg({ id, className = '', strokeWidth = ICON_STROKE, ...rest }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"
      className={className} data-icon={id} {...rest}
      dangerouslySetInnerHTML={{ __html: ART[id] }}
    />
  )
}

// Glif sprite: JS bundle ga kirmaydi, brauzer bir marta yuklab keshlaydi. fill=currentColor —
// tanlangan chipda oq, oddiy holatda teal (CSS rang klassi orqali).
export const SPRITE_URL = '/icons/category-sprite.svg?v=1'
function GlyphSvg({ id, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className={className} data-icon={id}>
      <use href={`${SPRITE_URL}#${GLYPHS[id]}`} />
    </svg>
  )
}

const cache = new Map()
/** id → React komponent (className, strokeWidth qabul qiladi). Noma’lum id → FALLBACK. */
export function iconById(id) {
  const key = GLYPHS[id] || ART[id] || LUCIDE_IDS[id] ? id : FALLBACK_ICON
  if (cache.has(key)) return cache.get(key)
  let C
  if (GLYPHS[key]) {
    C = function CatIcon({ className }) { return <GlyphSvg id={key} className={className} /> }
  } else if (ART[key]) {
    C = function CatIcon({ className, strokeWidth }) { return <CustomSvg id={key} className={className} strokeWidth={strokeWidth ?? ICON_STROKE} /> }
  } else {
    const L = Lucide[LUCIDE_IDS[key]]
    C = function CatIcon({ className, strokeWidth }) { return <L className={className} strokeWidth={strokeWidth ?? ICON_STROKE} aria-hidden="true" data-icon={key} /> }
  }
  C.displayName = `CategoryIcon(${key})`
  C.iconId = key
  cache.set(key, C)
  return C
}

/** Bo‘lim + kategoriya kaliti/nomi bo‘yicha ikonka komponenti. */
export const iconFor = (section, key, label) => iconById(categoryIconId(section, key, label))

export function CategoryIcon({ id, section, cat, label, className = 'size-6', strokeWidth }) {
  const C = id ? iconById(id) : iconFor(section, cat, label)
  return <C className={className} strokeWidth={strokeWidth} />
}

/** Yagona plitka: och teal fon + teal ikonka; tanlanganda to‘liq teal fon + oq ikonka. */
export function CategoryTile({ icon: Icon, active = false, size = 'md', className = '' }) {
  const box = { sm: 'size-9 rounded-xl', md: 'size-[54px] rounded-2xl', lg: 'size-[64px] rounded-2xl', xl: 'size-[50px] rounded-2xl' }[size] || size
  const ico = { sm: 'size-[20px]', md: 'size-[30px]', lg: 'size-[34px]', xl: 'size-[27px]' }[size] || 'size-7'
  return (
    <span className={`grid shrink-0 place-items-center transition ${box} ${active ? 'bg-sea text-white shadow-[0_6px_14px_-6px_rgb(11_138_149/0.7)]' : 'bg-sea-50 text-sea-600 ring-1 ring-inset ring-sea-100'} ${className}`}>
      <Icon className={ico} />
    </span>
  )
}
