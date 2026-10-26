import { num } from '../../format'

const nice = (max) => {
  if (max <= 0) return 4
  const p = 10 ** Math.floor(Math.log10(max)); const n = max / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 4 ? 4 : n <= 5 ? 5 : 10) * p
}
const short = (v) => (v >= 1e6 ? `${num(v / 1e6)} mln` : v >= 1e4 ? `${num(v / 1e3)} ming` : num(v))
const every = (n, max) => Math.max(1, Math.ceil(n / max))

// O'qlar bilan grafik: kind = 'line' (maydonli) yoki 'bar'
export function Chart({ labels, series, kind = 'line', height = 200, fmt = short, maxTicks = 16 }) {
  const W = 1000, H = 300
  const top = nice(Math.max(1, ...series.flatMap((s) => s.values)))
  const n = labels.length
  const x = (i) => (kind === 'bar' ? ((i + 0.5) / n) * W : n > 1 ? (i / (n - 1)) * W : W / 2)
  const y = (v) => H - (v / top) * H
  const step = every(n, maxTicks)
  return (
    <div className="flex gap-2" style={{ height }}>
      <div className="flex flex-col justify-between pb-5 text-right text-[11px] text-[#5C6E80]">{[4, 3, 2, 1, 0].map((k) => <span key={k} className="leading-none">{fmt((top * k) / 4)}</span>)}</div>
      <div className="relative min-w-0 flex-1">
        <div className="absolute inset-x-0 top-0 bottom-5">
          {[0, 1, 2, 3, 4].map((k) => <div key={k} className="absolute inset-x-0 border-t border-[#EEF3F4]" style={{ top: `${k * 25}%` }} />)}
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
            {kind === 'bar' ? series[0].values.map((v, i) => { const bw = Math.min(28, (W / n) * 0.6); return <rect key={i} x={x(i) - bw / 2} y={y(v)} width={bw} height={H - y(v)} rx="3" fill={series[0].color || '#0F766E'}><title>{`${labels[i]}: ${fmt(v)}`}</title></rect> })
              : series.map((s, si) => { const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' '); return <g key={si}>{si === 0 && n > 1 && <polygon points={`0,${H} ${pts} ${W},${H}`} fill={s.color} opacity="0.12" />}<polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" /></g> })}
          </svg>
          {kind === 'line' && series.map((s, si) => s.values.map((v, i) => <span key={`${si}-${i}`} title={`${labels[i]}: ${fmt(v)}`} className="absolute size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white" style={{ left: `${(x(i) / W) * 100}%`, top: `${(y(v) / H) * 100}%`, borderColor: s.color }} />))}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-4 text-[11px] text-[#5C6E80]">{labels.map((l, i) => i % step === 0 && <span key={i} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${(x(i) / W) * 100}%` }}>{l}</span>)}</div>
      </div>
    </div>
  )
}

export const TEALS = ['#0F766E', '#14958A', '#2BB3A6', '#5CCBBE', '#99E0D6', '#CCF1EC']
export function Donut({ parts, center, sub = 'so‘m', size = 180 }) {
  const total = parts.reduce((s, p) => s + p.value, 0)
  let acc = 0
  const r = 15.9155
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 42 42" className="size-full -rotate-90">
        <circle cx="21" cy="21" r={r} fill="none" stroke="#EEF3F4" strokeWidth="7" />
        {total > 0 && parts.map((p, i) => { const pct = (p.value / total) * 100; const el = <circle key={i} cx="21" cy="21" r={r} fill="none" stroke={TEALS[i % TEALS.length]} strokeWidth="7" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-acc} />; acc += pct; return el })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center"><div><div className="text-[15px] font-extrabold leading-tight">{center}</div><div className="text-[11px] text-[#5C6E80]">{sub}</div></div></div>
    </div>
  )
}
