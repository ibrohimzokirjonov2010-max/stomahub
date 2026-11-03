import { Plus, Trash2 } from 'lucide-react'
import { TEAL, box } from './wizardBits'
import { normalizeProgram, dayCount, addDaysIso, withDayDates, parseDateLoose, programErrorAt } from '../../programDays'

const PRACTICE_KINDS = [['model', 'Model'], ['fantom', 'Fantom'], ['bemor', 'Jonli bemor']]
const MATERIALS = [['tashkilotchi', 'Tashkilotchi beradi'], ['ishtirokchi', 'Ishtirokchi olib keladi'], ['aralash', 'Qisman tashkilotchidan']]

function Lab({ children, hint }) {
  return (
    <span className="mb-1.5 block text-[12.5px] font-medium text-[#1c4a5a]">
      {children}{hint && <span className="ml-1 font-normal text-[#8aa0a4]">{hint}</span>}
    </span>
  )
}

function Chips({ value, options, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([id, label]) => (
        <button key={id} type="button" onClick={() => onChange(id)} className={`h-8 rounded-lg px-3 text-[12.5px] font-semibold ${value === id ? 'text-white' : 'border border-[#e4eeec] bg-white text-[#1c4a5a]'}`} style={value === id ? { background: TEAL } : undefined}>{label}</button>
      ))}
    </div>
  )
}

function Toggle({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={!!on} onClick={() => onChange(!on)} className="inline-flex items-center gap-2 text-[12.5px] font-medium text-[#1c4a5a]">
      <span className="relative h-[22px] w-10 shrink-0 rounded-full transition" style={{ background: on ? TEAL : '#d5e0e2' }}>
        <span className={`absolute top-0.5 size-[18px] rounded-full bg-white shadow transition ${on ? 'left-[20px]' : 'left-0.5'}`} />
      </span>
      {label}
    </button>
  )
}

const area = 'w-full resize-y rounded-xl border border-[#e3eeec] px-3 py-2 text-[13px] leading-snug outline-none placeholder:text-[#9aafb4] focus:border-[var(--color-org-teal)]'

// "Dastur va tafsilotlar" bosqichi — desktop va mobil ustalarda bir xil
export default function WizardDetails({ form, set, compact = false }) {
  const practice = form.practice || { on: false, kind: 'model', perPerson: '', unit: 'implant', materials: 'tashkilotchi' }
  const live = form.liveSurgery || { on: false, text: '' }
  const cols = compact ? '' : 'sm:grid-cols-2'
  return (
    <div className="space-y-4">
      <ProgramEditor form={form} set={set} />

      <div className={`grid gap-3 ${cols}`}>
        <label className="block">
          <Lab hint="(har qatorda bittadan)">Nimalarni o‘rganasiz</Lab>
          <textarea rows={4} value={form.learn || ''} onChange={(e) => set({ learn: e.target.value })} className={area} placeholder={'Masalan: Implant joylashtirish rejasi'} />
        </label>
        <label className="block">
          <Lab hint="(har qatorda bittadan)">Kimlar uchun</Lab>
          <textarea rows={4} value={form.audience || ''} onChange={(e) => set({ audience: e.target.value })} className={area} placeholder={'Masalan: Stomatolog-jarrohlar'} />
        </label>
        <label className="block">
          <Lab hint="(har qatorda bittadan)">Narxga nimalar kiradi</Lab>
          <textarea rows={4} value={form.includes || ''} onChange={(e) => set({ includes: e.target.value })} className={area} placeholder={'Masalan: Kofe-breyk'} />
        </label>
        <label className="block">
          <Lab>Bekor qilish / qaytarish shartlari</Lab>
          <textarea rows={4} value={form.refundPolicy || ''} onChange={(e) => set({ refundPolicy: e.target.value })} className={area} placeholder="Masalan: 72 soat oldin bekor qilinsa, to‘lov to‘liq qaytariladi" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:max-w-[360px]">
        <label className="block"><Lab>CME soatlari</Lab><input type="number" min="0" max="200" inputMode="numeric" value={form.cmeHours ?? ''} onChange={(e) => set({ cmeHours: e.target.value })} className={box} /></label>
        <label className="block"><Lab>CME ballari</Lab><input type="number" min="0" max="100" inputMode="numeric" value={form.cmePoints ?? ''} onChange={(e) => set({ cmePoints: e.target.value })} className={box} /></label>
      </div>
      <p className="-mt-2 text-[11.5px] text-[#8aa0a4]">CME soat va ballari sertifikatda ham chop etiladi.</p>

      <div className="rounded-xl border border-[#e6f1ef] p-3">
        <Toggle on={practice.on} label="Amaliy qism bor" onChange={(on) => set({ practice: { ...practice, on } })} />
        {practice.on && (
          <div className="mt-3 space-y-3">
            <div><Lab>Amaliyot turi</Lab><Chips value={practice.kind} options={PRACTICE_KINDS} onChange={(kind) => set({ practice: { ...practice, kind } })} /></div>
            <label className="block sm:max-w-[240px]"><Lab>Har bir ishtirokchiga implantlar soni</Lab><input type="number" min="0" max="50" inputMode="numeric" value={practice.perPerson ?? ''} onChange={(e) => set({ practice: { ...practice, perPerson: e.target.value } })} className={box} /></label>
            <div><Lab>Materiallarni kim ta’minlaydi</Lab><Chips value={practice.materials} options={MATERIALS} onChange={(materials) => set({ practice: { ...practice, materials } })} /></div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#e6f1ef] p-3">
        <Toggle on={live.on} label="Jonli jarrohlik namoyishi" onChange={(on) => set({ liveSurgery: { ...live, on } })} />
        {live.on && (
          <label className="mt-3 block">
            <Lab>Jonli jarrohlik tavsifi</Lab>
            <textarea rows={3} value={live.text || ''} onChange={(e) => set({ liveSurgery: { ...live, text: e.target.value } })} className={area} placeholder="Masalan: 2 ta bemorda implant o‘rnatish, ekranda translyatsiya" />
          </label>
        )}
      </div>
    </div>
  )
}

const emptyDay = (date = '') => ({ title: '', date, items: [{ time: '', title: '' }] })

// Dastur: kunlarga bo‘lingan bloklar. Bitta kun bo‘lsa — oddiy ro‘yxat ko‘rinishida.
function ProgramEditor({ form, set }) {
  const saved = normalizeProgram(form.program)
  const start = parseDateLoose(form.start)
  const n = dayCount(start, parseDateLoose(form.end))
  const days = withDayDates(saved.length ? saved : Array.from({ length: n }, () => emptyDay()), start)
  const multi = days.length > 1
  const err = programErrorAt(days)
  const bad = (d, i, f) => err && err.day === d && err.row === i && err.missing === f ? ' ring-2 ring-[#e11d48]/50 border-[#e11d48]' : ''
  const put = (next) => set({ program: next })
  const patchDay = (d, patch) => put(days.map((x, i) => (i === d ? { ...x, ...patch } : x)))
  const setRow = (d, r, patch) => patchDay(d, { items: days[d].items.map((x, j) => (j === r ? { ...x, ...patch } : x)) })
  const addRow = (d) => patchDay(d, { items: [...days[d].items, { time: '', title: '' }] })
  const delRow = (d, r) => patchDay(d, { items: days[d].items.filter((_, j) => j !== r) })
  const addDay = () => {
    const last = days[days.length - 1]
    const date = last?.date ? addDaysIso(last.date, 1) : start ? addDaysIso(start, days.length) : ''
    put([...days, emptyDay(date)])
  }
  const delDay = (d) => {
    const filled = days[d].items.some((r) => r.time || r.title)
    if (filled && !window.confirm(`${d + 1}-kun dasturini o‘chirasizmi? Undagi qatorlar ham o‘chadi.`)) return
    put(days.filter((_, i) => i !== d))
  }
  const btn = 'inline-flex items-center gap-1 text-[12.5px] font-semibold'
  return (
    <div>
      <Lab hint="(vaqt va mavzu)">Dastur</Lab>
      <div className="space-y-3" data-shot="program">
        {days.map((day, d) => (
          <div key={d} className={multi ? 'rounded-xl border border-[#e3eeec] bg-[#fbfdfd] p-2.5' : ''}>
            {multi && (
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className="rounded-lg px-2 py-1 text-[12px] font-bold text-white" style={{ background: TEAL }}>{d + 1}-kun</span>
                <input aria-label={`${d + 1}-kun nomi`} placeholder="Kun nomi (masalan: Nazariy qism)" value={day.title} onChange={(e) => patchDay(d, { title: e.target.value })} className={`${box} min-w-[160px] flex-1`} />
                <input type="date" aria-label={`${d + 1}-kun sanasi`} value={day.date} onChange={(e) => patchDay(d, { date: e.target.value })} className={`${box} w-[150px] shrink-0`} />
                <button type="button" aria-label={`${d + 1}-kunni o‘chirish`} onClick={() => delDay(d)} className="grid size-10 shrink-0 place-items-center rounded-xl text-[#e11d48] hover:bg-[#fff5f7]"><Trash2 className="size-4" /></button>
              </div>
            )}
            <div className="space-y-1.5">
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
                {day.items.map((r, i) => (
                  <div key={i} className="relative rounded-xl border border-[#e3eeec] bg-white p-1.5">
                    <div className="flex gap-1">
                      <input aria-label="Vaqt" placeholder="10:00 – 11:30" value={r.time || ''} onChange={(e) => setRow(d, i, { time: e.target.value })} aria-invalid={!!bad(d, i, 'time')} className={`${box} min-w-0 flex-1${bad(d, i, 'time')}`} />
                      <button type="button" aria-label="Qatorni o‘chirish" onClick={() => delRow(d, i)} className="grid size-10 shrink-0 place-items-center rounded-xl text-[#e11d48] hover:bg-[#fff5f7]"><Trash2 className="size-4" /></button>
                    </div>
                    <input aria-label="Mavzu" placeholder="Mavzu" value={r.title || ''} onChange={(e) => setRow(d, i, { title: e.target.value })} aria-invalid={!!bad(d, i, 'title')} className={`${box} mt-1 w-full min-w-0${bad(d, i, 'title')}`} />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <button type="button" onClick={() => addRow(d)} className={btn} style={{ color: TEAL }}><Plus className="size-4" /> Qator qo‘shish</button>
                {d === days.length - 1 && <button type="button" onClick={addDay} className={btn} style={{ color: TEAL }}><Plus className="size-4" /> Dastur qo‘shish <span className="font-normal text-[#7e9398]">(yangi kun)</span></button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
