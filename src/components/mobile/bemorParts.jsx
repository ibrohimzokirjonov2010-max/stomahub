import { useState } from 'react'

export const MSTATUS = {
  Yangi: 'bg-[#e6f8ec] text-[#1c9a52]',
  Faol: 'bg-[#e6f8ec] text-[#1c9a52]',
  Davolanishda: 'bg-[#e6f4f3] text-[#0b6d73]',
  Kuzatuvda: 'bg-[#fff1e6] text-[#e07a2e]',
  Nofaol: 'bg-[#eef1f5] text-[#6b7a90]',
}
export const STATUS_TABS = ['Yangi', 'Davolanishda', 'Kuzatuvda', 'Faol', 'Nofaol']

export const DOCTORS = {
  'Dr. Ibrohim': '/images/yangiliklar/yang-sardor.jpg',
  'Dr. Aziza': '/images/bemorlar/bemor-dilnoza.jpg',
  'Dr. Kamron': '/images/yangiliklar/yang-dilshod.jpg',
  'Dr. Sardor': '/images/jihozlar/engineer.jpg',
  'Dr. Nigora': '/images/bemorlar/bemor-madina.jpg',
}

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
]
export const toothName = Object.fromEntries(TOOTH_STATES)

const kindOf = (n) => {
  const d = n % 10
  const baby = Math.floor(n / 10) >= 5
  if (d <= 2) return 'inc'
  if (d === 3) return 'can'
  if (baby || d >= 6) return 'mol'
  return 'pre'
}
const ROOTS = {
  inc: 'M9.5 3 C8.5 9 8 16 7.5 23 L16.5 23 C16 16 15.5 9 14.5 3 C13 1.8 11 1.8 9.5 3 Z',
  can: 'M10 1 C8.5 8 7.5 16 7 23 L17 23 C16.5 16 15.5 8 14 1 C12.8 0 11.2 0 10 1 Z',
  pre: 'M8.5 4 C7.5 10 6.5 16 6 23 L18 23 C17.5 16 16.5 10 15.5 4 C14 2.5 10 2.5 8.5 4 Z',
  mol: 'M4.5 22 C4.5 15 4 9 5.5 3 C7.5 3.5 8.5 9 9.5 15 L12 13 L14.5 15 C15.5 9 16.5 3.5 18.5 3 C20 9 19.5 15 19.5 22 Z',
}
const CROWNS = {
  inc: 'M6 22 C5.5 29 6 36 8 41 C9.5 43.5 14.5 43.5 16 41 C18 36 18.5 29 18 22 Z',
  can: 'M6 22 C5.5 29 6.5 36 9.5 41.5 C10.8 43.5 13.2 43.5 14.5 41.5 C17.5 36 18.5 29 18 22 Z',
  pre: 'M4.5 22 C3.8 29 4.5 37 7 41 C9 43.8 15 43.8 17 41 C19.5 37 20.2 29 19.5 22 Z',
  mol: 'M2.5 21 C1.8 29 2.5 37 5 41 C7 43.8 17 43.8 19 41 C21.5 37 22.2 29 21.5 21 Z',
}

export function Tooth({ n, state = 'healthy', lower, className = 'h-[38px] w-[21px]' }) {
  const k = kindOf(n)
  const missing = state === 'missing'
  const crownFill = state === 'crown' ? '#cfd6de' : '#fdfdfd'
  const rootFill = state === 'endo' ? '#f7d3d3' : '#f1ece3'
  const stroke = missing ? '#b8c4d0' : state === 'crown' ? '#9aa6b4' : '#cfd8e0'
  return (
    <svg viewBox="0 0 24 45" className={`${className} ${lower ? 'rotate-180' : ''}`} aria-hidden>
      {state === 'implant' ? (
        <g>
          <path d="M9 4 L15 4 L14 22 L10 22 Z" fill="#9fb0bf" />
          {[7, 10, 13, 16, 19].map((y) => <path key={y} d={`M8.6 ${y} L15.4 ${y - 1.2}`} stroke="#6f8193" strokeWidth="1" />)}
          <rect x="10" y="20" width="4" height="4" fill="#0b8a95" />
        </g>
      ) : (
        <path d={ROOTS[k]} fill={missing ? 'none' : rootFill} stroke={stroke} strokeWidth="0.9" strokeDasharray={missing ? '2 1.6' : undefined} />
      )}
      {state === 'endo' && (k === 'mol'
        ? <path d="M7 6 L9 21 M17 6 L15 21" stroke="#e0454f" strokeWidth="1.6" strokeLinecap="round" />
        : <path d="M12 4 L12 21" stroke="#e0454f" strokeWidth="1.6" strokeLinecap="round" />)}
      <path d={CROWNS[k]} fill={missing ? 'none' : state === 'implant' ? '#e9f6f5' : crownFill} stroke={state === 'implant' ? '#0b8a95' : stroke} strokeWidth="0.9" strokeDasharray={missing ? '2 1.6' : undefined} />
      {!missing && state !== 'crown' && <path d={k === 'mol' ? 'M5 26 C9 24 15 24 19 26' : 'M8 26 C10.5 25 13.5 25 16 26'} stroke="#e6ebf0" strokeWidth="1" fill="none" />}
      {state === 'filling' && <ellipse cx="12" cy="34" rx={k === 'mol' ? 6 : 4} ry="4.5" fill="#4f9be8" />}
      {state === 'caries' && <circle cx="13" cy="33" r="3" fill="#6b4f3a" />}
    </svg>
  )
}

const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
const BABY_U = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65]
const BABY_L = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75]

export function TeethChart({ teeth, onPick, big }) {
  const [dent, setDent] = useState('adult')
  const up = dent === 'adult' ? UPPER : BABY_U
  const low = dent === 'adult' ? LOWER : BABY_L
  const cols = { gridTemplateColumns: `repeat(${up.length}, minmax(0, 1fr))` }
  const cell = (n, lower) => (
    <button key={n} type="button" onClick={() => onPick(n)} aria-label={`${n}-tish: ${toothName[teeth?.[n] || 'healthy']}`} className="flex min-w-0 flex-col items-center gap-0.5 rounded-md py-0.5 active:bg-[#e6f4f3]">
      {!lower && <span className="text-[9.5px] text-muted">{n}</span>}
      <Tooth n={n} state={teeth?.[n] || 'healthy'} lower={lower} className={big ? 'h-[44px] w-full max-w-[24px]' : 'h-[38px] w-full max-w-[21px]'} />
      {lower && <span className="text-[9.5px] text-muted">{n}</span>}
    </button>
  )
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-[#0d2a4a]">Tish holati (FDI)</h3>
        <div className="flex rounded-lg bg-[#eef3f5] p-0.5 text-[11.5px] font-semibold">
          {[['adult', 'Katta'], ['baby', 'Bola']].map(([k, l]) => <button key={k} type="button" aria-pressed={dent === k} onClick={() => setDent(k)} className={`rounded-md px-3.5 py-1 ${dent === k ? 'bg-[#0b8a95] text-white' : 'text-ink-2'}`}>{l}</button>)}
        </div>
      </div>
      <div className="mt-2.5 grid gap-y-1" style={cols}>{up.map((n) => cell(n, false))}</div>
      <div className="my-1 border-t border-dashed border-line" />
      <div className="grid" style={cols}>{low.map((n) => cell(n, true))}</div>
      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5 text-[10.5px] text-ink-2">
        {[['healthy', 'bg-white border border-line'], ['filling', 'bg-[#4f9be8]'], ['endo', 'bg-[#e0454f]'], ['crown', 'bg-[#8d99a8]'], ['implant', 'bg-[#0b8a95]'], ['caries', 'bg-[#6b4f3a]'], ['missing', 'border border-dashed border-[#9aa7b4]']].map(([k, c]) => (
          <span key={k} className="flex items-center gap-1"><span className={`size-2.5 rounded-full ${c}`} /> {toothName[k]}</span>
        ))}
      </div>
    </div>
  )
}
