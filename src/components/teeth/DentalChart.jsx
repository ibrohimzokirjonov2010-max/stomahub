import { TOOTH_H, TOOTH_STATUS_LABELS, TOOTH_W, artFdi, artOfStatus, isLowerTooth, toothSrc } from '../../teeth/toothArt'

const asPicked = (selected) => {
  if (typeof selected === 'function') return selected
  if (selected == null || selected === false) return () => false
  if (selected instanceof Set) return (n) => selected.has(n) || selected.has(String(n))
  if (Array.isArray(selected)) return (n) => selected.some((x) => Number(x) === Number(n))
  return (n) => Number(selected) === Number(n)
}

/** Bitta realistik tish rasmi. state — saqlangan holat kaliti (filling, endo...), kind — to'g'ridan-to'g'ri rasm turi. */
export function ToothArt({ n, state = 'healthy', kind, className = '', style, glow = false }) {
  const art = kind ? { kind } : artOfStatus(state)
  const fdi = artFdi(n) || 11
  const src = toothSrc(n, art.kind)
  const lower = isLowerTooth(n)
  return (
    <span className={`relative inline-flex justify-center ${className}`} style={style}>
      <img
        src={src}
        alt=""
        width={TOOTH_W[fdi]}
        height={TOOTH_H}
        draggable={false}
        decoding="async"
        className="pointer-events-none block h-full w-auto max-w-full select-none object-contain transition-[filter] duration-150"
        style={{
          ...(art.kind === 'missing' ? { opacity: 0.55 } : null),
          ...(glow ? { filter: 'drop-shadow(0 0 4px rgb(11 138 149 / 0.75)) drop-shadow(0 4px 8px rgb(11 138 149 / 0.35))' } : null),
        }}
      />
      {art.mark && (
        <span
          className={`absolute right-0 grid size-[13px] place-items-center rounded-full text-[8px] font-extrabold leading-none text-white shadow ring-1 ring-white ${lower ? 'top-[6%]' : 'bottom-[6%]'}`}
          style={{ background: art.mark[1] }}
        >
          {art.mark[0]}
        </span>
      )}
    </span>
  )
}

/**
 * Professional FDI tish kartasi: yuqori va pastki jag', tabiiy nisbatdagi realistik tishlar.
 * Tishni bosish → onPick(n). selected: raqam | massiv | Set | (n) => bool.
 * tintOf(n) — reja bosqichi rangi (pastdagi chiziq); dimOthers — rangsiz tishlarni xiralashtiradi.
 */
export default function DentalChart({
  upper, lower, stateOf, kindOf, selected, onPick, tintOf, dimOthers = false, surfacesOf, labelOf,
  sideLabels = true, maxWidth = 920, className = '',
}) {
  const isPicked = asPicked(selected)
  const cell = (n, isLower) => {
    const fdi = artFdi(n) || 11
    const w = TOOTH_W[fdi]
    const state = stateOf?.(n) || 'healthy'
    const kind = kindOf?.(n) || undefined
    const sel = isPicked(n)
    const tint = tintOf?.(n)
    const dim = dimOthers && !tint && !sel
    const surf = surfacesOf ? (surfacesOf(n) || []).join('') : ''
    const label = labelOf?.(n) || TOOTH_STATUS_LABELS[state] || ''
    const num = (
      <span className={`grid h-[17px] min-w-[19px] place-items-center rounded-full px-[3px] text-[9.5px] font-semibold leading-none tabular-nums transition ${sel ? 'bg-sea text-white shadow-[0_2px_6px_rgb(11_138_149/0.45)]' : tint ? 'font-bold text-ink' : 'text-muted'}`}>
        {n}
      </span>
    )
    const bar = <span className="h-[3px] w-[70%] rounded-full" style={{ background: tint || 'transparent' }} />
    return (
      <button
        key={n}
        type="button"
        data-tooth={n}
        aria-pressed={onPick ? sel : undefined}
        aria-label={`${n}-tish${label ? `: ${label}` : ''}`}
        title={`${n}-tish${label ? ` — ${label}` : ''}`}
        onClick={onPick ? () => onPick(n) : undefined}
        style={{ flex: `${w} 1 0%` }}
        className={`group relative flex min-w-0 flex-col items-center gap-[3px] rounded-[10px] px-[1px] py-1 outline-none transition duration-150 focus-visible:ring-2 focus-visible:ring-sea/60 ${isLower ? 'flex-col-reverse' : ''} ${sel ? 'z-10 bg-sea-50 ring-2 ring-sea shadow-[0_8px_18px_-8px_rgb(11_138_149/0.7)]' : onPick ? 'hover:bg-[#eef6f8]' : 'cursor-default'} ${sel ? (isLower ? 'translate-y-[2px]' : '-translate-y-[2px]') : ''}`}
      >
        {num}
        {tintOf && bar}
        <ToothArt
          n={n}
          state={state}
          kind={kind}
          glow={sel}
          className={`w-full transition duration-150 ${onPick && !sel ? 'group-hover:scale-[1.04]' : ''} ${sel ? 'scale-[1.06]' : ''} ${dim ? 'opacity-45 grayscale-[0.5]' : ''}`}
          style={{ aspectRatio: `${w} / ${TOOTH_H}` }}
        />
        {surfacesOf && <span className="h-3 text-[8.5px] font-bold leading-3 text-[#b45309]">{surf}</span>}
      </button>
    )
  }
  const row = (nums, isLower) => {
    const mid = nums.length / 2
    return (
      <div className={`flex justify-center ${isLower ? 'items-start' : 'items-end'}`}>
        {nums.map((n, i) => (
          <div key={n} className="contents">
            {i === mid && <span className="mx-[2px] w-px shrink-0 self-stretch bg-gradient-to-b from-transparent via-[#c9d4df] to-transparent" />}
            {cell(n, isLower)}
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className={`dental-chart min-w-0 ${className}`}>
      <div className="mx-auto rounded-2xl bg-[linear-gradient(180deg,#f7fafc_0%,#ffffff_50%,#f7fafc_100%)] px-1 py-1.5 ring-1 ring-[#e8eef4]" style={{ maxWidth }}>
        <p className="px-1 text-[9.5px] font-semibold uppercase tracking-wide text-muted/80">Yuqori jag‘</p>
        {row(upper, false)}
        <div className="my-1 flex items-center gap-2 px-1 text-[10px] font-medium text-muted">
          {sideLabels && <span>O‘ng</span>}
          <span className="h-px flex-1 bg-[#dbe2ea]" />
          {sideLabels && <span>Chap</span>}
        </div>
        {row(lower, true)}
        <p className="px-1 text-right text-[9.5px] font-semibold uppercase tracking-wide text-muted/80">Pastki jag‘</p>
      </div>
    </div>
  )
}
