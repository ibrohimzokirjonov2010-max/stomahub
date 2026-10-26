import { useId } from 'react'

export const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
export const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
export const BABY_UPPER = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65]
export const BABY_LOWER = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75]

export const CONDITIONS = [
  ['healthy', 'Sog‘lom tish'],
  ['caries', 'Karies'],
  ['filling', 'Plomba'],
  ['endo', 'Endodontik davolash'],
  ['post', 'Shtift'],
  ['crown', 'Krona'],
  ['implant', 'Implant'],
  ['missing', 'Yo‘q tish'],
]

const SHAPES = {
  incisor: {
    w: 22,
    root: 'M6.2 36 C6.6 24 8.6 12 10.2 4.6 Q11 2.8 11.8 4.6 C13.4 12 15.4 24 15.8 36 Z',
    crown: 'M5 35 C4 44 4.6 54 6.6 60.4 Q11 62.6 15.4 60.4 C17.4 54 18 44 17 35 Q11 33 5 35 Z',
    canals: ['M11 8 L11 41'],
    detail: 'M8 57.5 Q11 59 14 57.5',
    spot: [11, 50],
  },
  canine: {
    w: 22,
    root: 'M6 36 C6 22 8.4 9 10.4 2.6 Q11 1.4 11.6 2.6 C13.6 9 16 22 16 36 Z',
    crown: 'M4.6 35 C3.6 44 5 53 9 59.6 Q11 62.6 13 59.6 C17 53 18.4 44 17.4 35 Q11 33 4.6 35 Z',
    canals: ['M11 6 L11 42'],
    detail: 'M9 55 Q11 57.5 13 55',
    spot: [11, 48],
  },
  premolar: {
    w: 22,
    root: 'M6.6 36 C6.6 24 8 13 10 5 Q11 3 12 5 C14 13 15.4 24 15.4 36 Z',
    crown: 'M3.8 35 C2.6 43 3.6 52 6.6 58.6 Q11 62 15.4 58.6 C18.4 52 19.4 43 18.2 35 Q11 32.6 3.8 35 Z',
    canals: ['M11 8 L11 42'],
    detail: 'M7 55.5 Q11 52.5 15 55.5',
    spot: [11, 48],
  },
  molar: {
    w: 30,
    root: 'M6 36 C5.6 26 6.6 15 8.6 6 Q9.6 3.6 10.8 6 C12 14 13 22 15 29 C17 22 18 14 19.2 6 Q20.4 3.6 21.4 6 C23.4 15 24.4 26 24 36 Z',
    crown: 'M3.6 35 C2 43 3 52 5.6 58 Q9 61.6 12.6 59.6 Q15 61.6 17.4 59.6 Q21 61.6 24.4 58 C27 52 28 43 26.4 35 Q15 32.6 3.6 35 Z',
    canals: ['M9.8 9 L12.4 40', 'M20.2 9 L17.6 40'],
    detail: 'M8.6 54.5 Q11.8 51.5 15 54.5 Q18.2 51.5 21.4 54.5',
    spot: [15, 47],
  },
}

export function kindOf(n) {
  const d = n % 10
  if (d <= 2) return 'incisor'
  if (d === 3) return 'canine'
  if (n >= 50) return 'molar'
  return d <= 5 ? 'premolar' : 'molar'
}

export function Tooth({ n, state = 'healthy', tint, lower = false, height = 56, ring }) {
  const uid = useId().replace(/:/g, '')
  const s = SHAPES[kindOf(n)]
  const cx = s.w / 2
  const missing = state === 'missing'
  const implant = state === 'implant'
  const crownFill = tint || (state === 'crown' ? '#cfe8f7' : `url(#c${uid})`)
  const crownStroke = state === 'crown' && !tint ? '#6db3dc' : tint ? 'rgb(0 0 0 / 0.12)' : '#c3ccd8'
  const rootFill = tint ? tint : `url(#r${uid})`

  return (
    <svg viewBox={`0 0 ${s.w} 64`} preserveAspectRatio="none" style={{ height, width: (height * s.w * 1.35) / 64 }} className="block shrink-0 overflow-visible">
      <defs>
        <linearGradient id={`c${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9eef4" />
        </linearGradient>
        <linearGradient id={`r${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f6f1e8" />
          <stop offset="1" stopColor="#e7dfd2" />
        </linearGradient>
        <linearGradient id={`i${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c7ced8" />
          <stop offset=".5" stopColor="#f2f5f8" />
          <stop offset="1" stopColor="#98a3b3" />
        </linearGradient>
      </defs>
      <g transform={lower ? 'translate(0 64) scale(1 -1)' : undefined} opacity={missing ? 0.55 : 1}>
        {ring && <path d={s.crown} fill="none" stroke={ring} strokeWidth="3.2" strokeLinejoin="round" />}
        {implant ? (
          <g>
            <rect x={cx - 3.4} y="8" width="6.8" height="28" rx="2.6" fill={`url(#i${uid})`} stroke="#8793a4" strokeWidth=".7" />
            {[13, 17, 21, 25, 29].map((y) => <path key={y} d={`M${cx - 3.4} ${y} L${cx + 3.4} ${y - 1.6}`} stroke="#8793a4" strokeWidth=".7" />)}
            <rect x={cx - 2.2} y="34" width="4.4" height="3" fill="#aeb7c4" />
          </g>
        ) : (
          <path d={s.root} fill={missing ? 'none' : rootFill} fillOpacity={tint ? 0.45 : 1} stroke={missing ? '#b8c2cf' : '#cbbfae'} strokeWidth=".8" strokeDasharray={missing ? '2 1.6' : undefined} />
        )}
        {state === 'endo' && s.canals.map((d) => <path key={d} d={d} stroke="#e5484d" strokeWidth="1.7" strokeLinecap="round" />)}
        {state === 'post' && <rect x={cx - 1.3} y="14" width="2.6" height="27" rx="1.2" fill="#f2b33d" stroke="#c98a12" strokeWidth=".5" />}
        <path d={s.crown} fill={missing ? 'none' : crownFill} stroke={missing ? '#b8c2cf' : crownStroke} strokeWidth=".9" strokeDasharray={missing ? '2 1.6' : undefined} />
        {!missing && <path d={s.detail} fill="none" stroke={tint ? 'rgb(255 255 255 / 0.6)' : '#d3dae3'} strokeWidth=".8" strokeLinecap="round" />}
        {state === 'filling' && <ellipse cx={s.spot[0]} cy={s.spot[1] + 3} rx={s.w * 0.2} ry="4.2" fill="#7cc4ef" stroke="#4aa3d8" strokeWidth=".6" />}
        {state === 'caries' && <ellipse cx={s.spot[0] + 1.5} cy={s.spot[1] + 2} rx="2.8" ry="2.4" fill="#d9475f" opacity=".85" />}
        {state === 'endo' && <ellipse cx={s.spot[0]} cy={s.spot[1] + 3} rx={s.w * 0.16} ry="3.4" fill="#f6a6ae" />}
        {missing && <path d={`M${cx - 4} 42 L${cx + 4} 54 M${cx + 4} 42 L${cx - 4} 54`} stroke="#e5484d" strokeWidth="1.1" strokeLinecap="round" />}
      </g>
    </svg>
  )
}

export default function ToothChart({ upper = UPPER, lower = LOWER, height = 56, stateOf, tintOf, ringOf, numberClass, onPick, sideLabels = true }) {
  const row = (nums, isLower) => {
    const mid = nums.length / 2
    return (
      <div className="flex items-stretch justify-between">
        {nums.map((n, i) => (
          <div key={n} className="contents">
            {i === mid && <span className="mx-1 w-px shrink-0 self-stretch bg-[#cfd8e3]" />}
            <button
              type="button"
              title={`${n}-tish`}
              onClick={onPick ? () => onPick(n) : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-md py-0.5 transition ${onPick ? 'hover:bg-[#eef6f8]' : 'cursor-default'} ${isLower ? 'flex-col-reverse' : ''}`}
            >
              <span className={`text-[9.5px] leading-none ${numberClass?.(n) || 'text-muted'}`}>{n}</span>
              <Tooth n={n} lower={isLower} height={height} state={stateOf?.(n)} tint={tintOf?.(n)} ring={ringOf?.(n)} />
            </button>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="min-w-0">
      {row(upper, false)}
      <div className="my-1 flex items-center gap-2 text-[10.5px] text-muted">
        {sideLabels && <span>O‘ng</span>}
        <span className="h-px flex-1 bg-[#dbe2ea]" />
        {sideLabels && <span>Chap</span>}
      </div>
      {row(lower, true)}
    </div>
  )
}
