import DentalChart, { ToothArt } from './teeth/DentalChart'
import { TOOTH_STATUS_LABELS } from '../teeth/toothArt'

export const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
export const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
export const BABY_UPPER = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65]
export const BABY_LOWER = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75]

// Eski kalitlar tartibi saqlangan (tishni bosib almashtirish shu tartibda); yangilari oxirida.
export const CONDITIONS = [
  ['healthy', TOOTH_STATUS_LABELS.healthy],
  ['caries', TOOTH_STATUS_LABELS.caries],
  ['filling', TOOTH_STATUS_LABELS.filling],
  ['endo', TOOTH_STATUS_LABELS.endo],
  ['post', TOOTH_STATUS_LABELS.post],
  ['crown', TOOTH_STATUS_LABELS.crown],
  ['implant', TOOTH_STATUS_LABELS.implant],
  ['missing', TOOTH_STATUS_LABELS.missing],
  ['perio', TOOTH_STATUS_LABELS.perio],
  ['mobility', TOOTH_STATUS_LABELS.mobility],
  ['bridge', TOOTH_STATUS_LABELS.bridge],
  ['veneer', TOOTH_STATUS_LABELS.veneer],
  ['fracture', TOOTH_STATUS_LABELS.fracture],
  ['zirconia', TOOTH_STATUS_LABELS.zirconia],
  ['implant_crown', TOOTH_STATUS_LABELS.implant_crown],
  ['denture', TOOTH_STATUS_LABELS.denture],
  ['butterfly', TOOTH_STATUS_LABELS.butterfly],
  ['braces', TOOTH_STATUS_LABELS.braces],
]

// Tish yuzalari (FDI): O — okklyuziya/kesuvchi, M — mezial, D — distal, V — vestibulyar, L — lingval/palatinal
export const SURFACES = [['O', 'Okklyuziya'], ['M', 'Mezial'], ['D', 'Distal'], ['V', 'Vestibulyar'], ['L', 'Lingval']]

export function kindOf(n) {
  const d = n % 10
  if (d <= 2) return 'incisor'
  if (d === 3) return 'canine'
  if (n >= 50) return 'molar'
  return d <= 5 ? 'premolar' : 'molar'
}

/** Realistik tish rasmi (avvalgi SVG o'rniga). height — piksel balandlik. */
export function Tooth({ n, state = 'healthy', height = 56, className = '' }) {
  return <ToothArt n={n} state={state || 'healthy'} className={`shrink-0 ${className}`} style={{ height }} />
}

export default function ToothChart({ upper = UPPER, lower = LOWER, stateOf, tintOf, ringOf, selected, onPick, sideLabels = true, surfacesOf, dimOthers, kindOf: kindOfTooth, maxWidth }) {
  const picked = selected ?? (ringOf ? (n) => Boolean(ringOf(n)) : undefined)
  return (
    <DentalChart
      upper={upper}
      lower={lower}
      stateOf={stateOf}
      kindOf={kindOfTooth}
      tintOf={tintOf}
      dimOthers={dimOthers}
      selected={picked}
      onPick={onPick}
      sideLabels={sideLabels}
      surfacesOf={surfacesOf}
      maxWidth={maxWidth}
    />
  )
}
