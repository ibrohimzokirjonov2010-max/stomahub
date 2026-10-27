const nice = (max) => {
  if (max <= 0) return 4
  const p = 10 ** Math.floor(Math.log10(max)); const n = max / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 4 ? 4 : n <= 5 ? 5 : 10) * p
}
const short = (v) => (v >= 1e6 ? `${Math.round(v / 1e6).toLocaleString('ru-RU').replace(/\u00a0|,/g, ' ')} mln` : v >= 1e4 ? `${Math.round(v / 1e3).toLocaleString('ru-RU').replace(/\u00a0|,/g, ' ')} ming` : Math.round(v).toLocaleString('ru-RU').replace(/\u00a0|,/g, ' '))
const every = (n, max) => Math.max(1, Math.ceil(n / max))

export function BarChart({ labels, values, height = 220, color = '#0F766E', fmt = short, maxTicks = 16, tipDay = null, tipLabel = '' }) {
  const W = 1000, H = 300
  const top = nice(Math.max(4, ...values))
  const n = labels.length || 1
  const x = (i) => ((i + 0.5) / n) * W
  const y = (v) => H - (v / top) * H
  const step = every(n, maxTicks)
  const tipIdx = tipDay != null ? labels.findIndex((l) => Number(l) === Number(tipDay)) : -1
  return (
    <div className="flex gap-2" style={{ height }}>
      <div className="flex w-14 flex-col justify-between pb-5 text-right text-[11px] text-[#5C6E80]">
        {[4, 3, 2, 1, 0].map((k) => <span key={k} className="leading-none">{fmt((top * k) / 4)}</span>)}
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="absolute inset-x-0 top-0 bottom-5">
          {[0, 1, 2, 3, 4].map((k) => <div key={k} className="absolute inset-x-0 border-t border-[#EEF3F4]" style={{ top: `${k * 25}%` }} />)}
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
            {values.map((v, i) => {
              const bw = Math.min(22, (W / n) * 0.55)
              return <rect key={i} x={x(i) - bw / 2} y={y(v)} width={bw} height={Math.max(0, H - y(v))} rx="3" fill={color} opacity={tipIdx === i ? 1 : 0.92}><title>{`${labels[i]}: ${fmt(v)}`}</title></rect>
            })}
          </svg>
          {tipIdx >= 0 && values[tipIdx] > 0 && (
            <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-[#10283F] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg" style={{ left: `${(x(tipIdx) / W) * 100}%`, top: `${(y(values[tipIdx]) / H) * 100}%` }}>
              {tipLabel || `${labels[tipIdx]}: ${fmt(values[tipIdx])}`}
            </div>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-4 text-[11px] text-[#5C6E80]">
          {labels.map((l, i) => i % step === 0 && <span key={i} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${(x(i) / W) * 100}%` }}>{l}</span>)}
        </div>
      </div>
    </div>
  )
}
