import { useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import { addBemor, useBemorlar } from '../../bemorData'
import PhoneInput, { extractUzLocalDigits, toE164 } from '../PhoneInput'
import { tashkentToday } from '../../tashkentDate'

export const CITY_LIST = ['Toshkent', 'Samarqand', 'Buxoro', 'Namangan', 'Andijon', 'Farg‘ona', 'Navoiy', 'Qashqadaryo', 'Surxondaryo', 'Xorazm', 'Jizzax', 'Sirdaryo', 'Qoraqalpog‘iston']
export const SOURCES = ['Instagram', 'Telegram', 'Do‘st tavsiyasi', 'Reklama', 'Boshqa']
// Stomatologik anamnez — xavfli holatlar
export const ANAMNEZ = [
  ['blood_thinners', 'Qon suyultiruvchi dorilar (varfarin, aspirin)'],
  ['heart', 'Yurak kasalligi'],
  ['hypertension', 'Gipertoniya (yuqori qon bosimi)'],
  ['diabetes', 'Qandli diabet'],
  ['hepatitis_hiv', 'Gepatit / OIV'],
  ['anesthetic_allergy', 'Anesteziyaga allergiya'],
  ['pregnancy', 'Homiladorlik'],
  ['pacemaker', 'Kardiostimulyator'],
  ['bisphosphonates', 'Bisfosfonatlar qabul qiladi'],
]
export const anamnezLabels = (a = {}) => ANAMNEZ.filter(([k]) => a[k]).map(([, l]) => l)

const input = 'h-10 w-full rounded-xl border border-line bg-white px-3 text-[13px] outline-none focus:border-sea'

function ageOf(iso) {
  if (!iso) return ''
  const t = tashkentToday()
  let a = Number(t.slice(0, 4)) - Number(iso.slice(0, 4))
  if (t.slice(5) < iso.slice(5)) a -= 1
  return a >= 0 ? `${a} yosh` : ''
}
const dots = (iso) => (iso ? iso.split('-').reverse().join('.') : '')

/** Yagona "Bemor qo‘shish" formasi (Bosh sahifa, Uchrashuvlar, Qabulga yozish). onSaved(patientRow) */
export default function PatientForm({ initialName = '', onClose, onSaved }) {
  const rows = useBemorlar()
  const [f, setF] = useState({ name: initialName, phone: '', female: false, birth: '', city: 'Toshkent', source: 'Instagram', allergy: '', meds: '', note: '' })
  const [an, setAn] = useState({})
  const [error, setError] = useState('')
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))
  const submit = () => {
    if (!f.name.trim() || f.phone.replace(/\D/g, '').length < 9) return setError('Ism familiya va telefon raqami majburiy.')
    if (f.birth && f.birth > tashkentToday()) return setError('Tug‘ilgan sana kelajakda bo‘lishi mumkin emas.')
    const max = rows.reduce((m, p) => Math.max(m, Number(/^P-(\d+)$/.exec(p.code || '')?.[1] || 0)), 0)
    const flags = anamnezLabels(an)
    const row = {
      id: `bemor-${Date.now()}`, name: f.name.trim(), age: ageOf(f.birth), birth: dots(f.birth), birthIso: f.birth, gender: f.female ? 'Ayol' : 'Erkak',
      phone: f.phone, city: f.city, address: f.city, email: '', source: f.source, status: 'Yangi', last: '', next: '',
      code: `P-${String(max + 1).padStart(4, '0')}`, photo: '', telegram: '',
      allergy: f.allergy.trim() ? f.allergy.split(',').map((s) => s.trim()).filter(Boolean) : [],
      diseases: flags, anamnez: { ...an, other_meds: f.meds.trim() }, meds: f.meds.trim() || 'Yo‘q', habits: 'Yo‘q', note: f.note.trim(),
      total: 0, paid: 0, payments: [],
    }
    addBemor(row)
    onSaved?.(row)
  }
  return (
    <div className="bemor-shade" onClick={onClose}>
      <div role="dialog" aria-label="Yangi bemor qo‘shish" className="bemor-dialog shadow-card" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="bemor-dialog-head flex items-start justify-between px-4 pt-3">
          <div><h2 className="text-[16px] font-bold">Yangi bemor qo‘shish</h2><p className="text-[12px] text-muted">Asosiy ma’lumotlar va anamnez</p></div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center text-muted"><X className="size-4" /></button>
        </div>
        <div className="bemor-dialog-body space-y-3 px-4 pb-3">
          <L t="Ism familiya *"><input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Masalan: Aliyev Vali" className={input} /></L>
          <div className="grid grid-cols-2 gap-2">
            <L t="Telefon *"><PhoneInput className={`${input} flex`} value={f.phone} onChange={(v) => set('phone', toE164(v) || extractUzLocalDigits(v))} valueMode="e164" placeholder="+998 90 123 45 67" /></L>
            <div className="text-[12px] font-medium text-ink-2">Jinsi
              <div className="mt-1 grid grid-cols-2 gap-1 rounded-xl border border-line p-1">
                {[[false, 'Erkak'], [true, 'Ayol']].map(([v, l]) => <button key={l} type="button" aria-pressed={f.female === v} onClick={() => set('female', v)} className={`h-8 rounded-lg text-[12.5px] font-semibold ${f.female === v ? 'bg-sea text-white' : 'text-ink-2'}`}>{l}</button>)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <L t="Tug‘ilgan sana"><input type="date" max={tashkentToday()} value={f.birth} onChange={(e) => set('birth', e.target.value)} className={input} /></L>
            <L t="Shahar"><select value={f.city} onChange={(e) => set('city', e.target.value)} className={input}>{CITY_LIST.map((c) => <option key={c}>{c}</option>)}</select></L>
            <L t="Qayerdan bildi"><select value={f.source} onChange={(e) => set('source', e.target.value)} className={input}>{SOURCES.map((c) => <option key={c}>{c}</option>)}</select></L>
          </div>
          <L t="Allergiyalar (vergul bilan)"><input value={f.allergy} onChange={(e) => set('allergy', e.target.value)} placeholder="Masalan: Penitsillin, lidokain" className={input} /></L>
          <fieldset className="rounded-xl border border-line p-3">
            <legend className="px-1 text-[12px] font-semibold text-ink">Anamnez</legend>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {ANAMNEZ.map(([k, l]) => (
                <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] ${an[k] ? 'bg-[#fff4e5] text-[#9a3412]' : 'hover:bg-[#f4f7fb]'}`}>
                  <input type="checkbox" checked={Boolean(an[k])} onChange={(e) => setAn((s) => ({ ...s, [k]: e.target.checked }))} className="size-4 accent-[#0f9b8e]" /> {l}
                </label>
              ))}
            </div>
            <L t="Boshqa doimiy dorilar" cls="mt-2"><input value={f.meds} onChange={(e) => set('meds', e.target.value)} placeholder="Masalan: metformin 500 mg" className={input} /></L>
            <L t="Qo‘shimcha izoh" cls="mt-2"><textarea value={f.note} onChange={(e) => set('note', e.target.value)} maxLength={500} placeholder="Boshqa kasalliklar, operatsiyalar..." className="h-16 w-full resize-none rounded-xl border border-line px-3 py-2 text-[13px] outline-none focus:border-sea" /></L>
          </fieldset>
          {error && <p className="text-[12px] text-[#e11d48]">{error}</p>}
        </div>
        <div className="bemor-dialog-foot flex items-center justify-end gap-2 border-t border-line px-4 py-3">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-line px-4 text-[12.5px] font-semibold">Bekor qilish</button>
          <button type="button" onClick={submit} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-sea px-5 text-[12.5px] font-semibold text-white"><UserPlus className="size-4" /> Saqlash</button>
        </div>
      </div>
    </div>
  )
}

function L({ t, children, cls = '' }) {
  return <div className={`block text-[12px] font-medium text-ink-2 ${cls}`}><span className="mb-1 block">{t}</span>{children}</div>
}
