import { useState } from 'react'
import DentalChart, { ToothArt } from '../teeth/DentalChart'
import { TOOTH_STATUS_LABELS } from '../../teeth/toothArt'

export const MSTATUS = {
  Yangi: 'bg-[#e6f8ec] text-[#1c9a52]',
  Faol: 'bg-[#e6f8ec] text-[#1c9a52]',
  Davolanishda: 'bg-[#e6f4f3] text-[#0b6d73]',
  Kuzatuvda: 'bg-[#fff1e6] text-[#e07a2e]',
  Nofaol: 'bg-[#eef1f5] text-[#6b7a90]',
}
export const STATUS_TABS = ['Yangi', 'Davolanishda', 'Kuzatuvda', 'Faol', 'Nofaol']

export const DOCTORS = {}

const MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek']
export function fmtDate(s) {
  if (!s) return ''
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s)
  return m ? `${Number(m[1])} ${MONTHS[Number(m[2]) - 1]} ${m[3]}` : s
}
export const isoToDots = (iso) => iso.split('-').reverse().join('.')
export const todayDots = () => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

export function Face({ p, className = 'size-14', text = 'text-[16px]' }) {
  const [ok, setOk] = useState(true)
  const letters = p.name.split(' ').slice(0, 2).map((w) => w[0]).join('')
  if (!p.photo || !ok) return <span className={`grid shrink-0 place-items-center rounded-full bg-[#e6f4f3] font-bold text-[#0b6d73] ${className} ${text}`}>{letters}</span>
  return <img src={p.photo} alt="" onError={() => setOk(false)} className={`shrink-0 rounded-full object-cover ${className}`} />
}

export const TOOTH_STATES = [
  ['healthy', 'Sog‘lom'],
  ['filling', 'Plomba'],
  ['endo', 'Endo'],
  ['crown', 'Krona'],
  ['implant', 'Implant'],
  ['caries', 'Karies'],
  ['missing', 'Olib tashlangan'],
  ['post', 'Shtift'],
  ['zirconia', 'Sirkon'],
  ['bridge', 'Ko‘prik'],
  ['implant_crown', 'Implant + protez'],
  ['denture', 'Protez'],
  ['butterfly', 'Babochka'],
  ['braces', 'Breket'],
]
// Boshqa kartalarda qo‘yilgan holatlar (perio, vinir...) ham nomi bilan chiqsin.
export const toothName = { ...TOOTH_STATUS_LABELS, ...Object.fromEntries(TOOTH_STATES) }

/** Realistik tish rasmi. className balandlikni beradi (masalan h-[34px]). */
export function Tooth({ n, state = 'healthy', className = 'h-[38px]' }) {
  return <ToothArt n={n} state={state || 'healthy'} className={`shrink-0 ${className.replace(/\bw-\[[^\]]+\]/g, '')}`} />
}

const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
const BABY_U = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65]
const BABY_L = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75]

export function TeethChart({ teeth, onPick, selected }) {
  const [dent, setDent] = useState('adult')
  const up = dent === 'adult' ? UPPER : BABY_U
  const low = dent === 'adult' ? LOWER : BABY_L
  const used = [...new Set(Object.values(teeth || {}).filter((s) => s && s !== 'healthy'))]
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-[#0d2a4a]">Tish holati (FDI)</h3>
        <div className="flex rounded-lg bg-[#eef3f5] p-0.5 text-[11.5px] font-semibold">
          {[['adult', 'Katta'], ['baby', 'Bola']].map(([k, l]) => <button key={k} type="button" aria-pressed={dent === k} onClick={() => setDent(k)} className={`rounded-md px-3.5 py-1 ${dent === k ? 'bg-[#0b8a95] text-white' : 'text-ink-2'}`}>{l}</button>)}
        </div>
      </div>
      <DentalChart
        className="mt-2.5"
        upper={up}
        lower={low}
        stateOf={(n) => teeth?.[n]}
        labelOf={(n) => toothName[teeth?.[n] || 'healthy']}
        selected={selected}
        onPick={onPick}
      />
      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5 text-[10.5px] text-ink-2">
        {(used.length ? ['healthy', ...used] : ['healthy', 'caries', 'filling', 'endo', 'crown', 'implant', 'missing']).map((k) => (
          <span key={k} className="flex items-center gap-1"><Tooth n={11} state={k} className="h-[18px]" /> {toothName[k] || k}</span>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-muted">Tishni bosing — tanlangan tish ajralib turadi va holatini o‘zgartirasiz.</p>
    </div>
  )
}
