import { useEffect, useRef, useState } from 'react'
import {
  X, ChevronDown, ChevronUp, RefreshCw, Bold, Italic, Underline, List, ListOrdered, Link2, UploadCloud, Box, Tag,
  Syringe, Scissors, Smile, Baby, Sparkles, MoreHorizontal, FileText, Trash2, Save,
} from 'lucide-react'
import ServiceArt from './ServiceArt'
import { ToothIcon } from './icons'
import { CATS, COLORS, nextCode } from '../xizmatData'

const PRESETS = ['terapiya', 'implantologiya', 'endodontiya', 'protezlash', 'ortodontiya', 'jarrohlik', 'estetik', 'profilaktika']

function ImplantIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h10l-1 4H8z" /><path d="M9 7h6l-1 13a2 2 0 0 1-4 0z" /><path d="M9.5 11h5M9.7 14h4.6M10 17h4" />
    </svg>
  )
}

function BracesIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8c0 6 1 10 3 10s2-4 2-6M10 8c0 6 1 10 2 10s2-4 2-6M17 8c0 6 1 10 2 10s2-4 2-6" /><path d="M2 11h20" /><rect x="4" y="9.5" width="3" height="3" rx=".6" /><rect x="10.5" y="9.5" width="3" height="3" rx=".6" /><rect x="17" y="9.5" width="3" height="3" rx=".6" />
    </svg>
  )
}

export const ICONS = [
  ['tooth', ToothIcon], ['implant', ImplantIcon], ['syringe', Syringe], ['scissors', Scissors], ['braces', BracesIcon], ['smile', Smile], ['baby', Baby], ['sparkles', Sparkles],
]

const empty = () => ({
  id: '', code: nextCode(), name: '', cat: '', price: 0, duration: 30, teeth: '', status: 'faol', short: '', body: '',
  materials: '', tags: [], inPlans: true, color: COLORS[0], icon: 'tooth', art: 'terapiya', image: '', docs: [],
})

const field = 'h-10 w-full rounded-xl border border-[#e6ebf2] bg-white px-3 text-[12.5px] outline-none transition placeholder:text-[#9aa6b6] focus:border-sea'

export default function XizmatDialog({ initial, onClose, onSave }) {
  const [form, setForm] = useState(() => (initial ? { icon: 'tooth', docs: [], ...initial } : empty()))
  const [errors, setErrors] = useState({})
  const [tagDraft, setTagDraft] = useState('')
  const [moreIcons, setMoreIcons] = useState(false)
  const [fileError, setFileError] = useState('')
  const editor = useRef(null)
  const imageInput = useRef(null)
  const docInput = useRef(null)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    if (editor.current) editor.current.innerHTML = form.body || ''
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const format = (cmd) => {
    editor.current?.focus()
    if (cmd === 'createLink') {
      const url = window.prompt('Havola manzili (https://...)')
      if (!url) return
      document.execCommand(cmd, false, /^https?:\/\//.test(url) ? url : `https://${url}`)
    } else {
      document.execCommand(cmd)
    }
    set('body', editor.current?.innerHTML || '')
  }

  const addTag = () => {
    const t = tagDraft.trim().replace(/,$/, '')
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t])
    setTagDraft('')
  }

  const pickImage = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/image\/(png|jpe?g)/.test(file.type)) return setFileError('Faqat PNG yoki JPG rasm yuklang.')
    if (file.size > 5 * 1024 * 1024) return setFileError('Rasm hajmi 5MB dan oshmasligi kerak.')
    setFileError('')
    set('image', URL.createObjectURL(file))
  }

  const pickDocs = (e) => {
    const files = [...(e.target.files || [])]
    e.target.value = ''
    const ok = files.filter((f) => /\.(pdf|docx?)$/i.test(f.name) && f.size <= 10 * 1024 * 1024)
    setFileError(ok.length < files.length ? 'Faqat PDF/DOCX, har biri 10MB gacha.' : '')
    set('docs', [...form.docs, ...ok.map((f) => ({ name: f.name, size: f.size, url: URL.createObjectURL(f) }))])
  }

  const submit = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Xizmat nomini kiriting'
    if (!form.cat) next.cat = 'Kategoriyani tanlang'
    if (!(Number(form.price) > 0)) next.price = 'Narx 0 dan katta bo‘lsin'
    if (!(Number(form.duration) > 0)) next.duration = 'Davomiylikni kiriting'
    if (!form.tags.length) next.tags = 'Kamida bitta teg qo‘shing'
    setErrors(next)
    if (Object.keys(next).length) return
    onSave({
      ...form,
      id: form.id || `xzm-${Date.now()}`,
      name: form.name.trim(),
      price: Number(form.price),
      duration: Number(form.duration),
      body: editor.current?.innerHTML || '',
    })
  }

  const visibleIcons = moreIcons ? ICONS : ICONS.slice(0, 6)

  return (
    <div className="bemor-shade" onClick={onClose}>
      <div className="xzm-dialog shadow-card" role="dialog" aria-label={initial ? 'Xizmatni tahrirlash' : 'Yangi xizmat qo‘shish'} onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-start gap-3 px-5 pb-3 pt-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-sea-50 text-sea"><ToothIcon className="size-7" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[19px] font-bold text-ink">{initial ? 'Xizmatni tahrirlash' : 'Yangi xizmat qo‘shish'}</h2>
            <p className="text-[12px] text-muted">Klinikangizda ko‘rsatiladigan yangi tibbiy xizmatni qo‘shing</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center rounded-lg text-muted hover:bg-[#f4f8fb]"><X className="size-5" /></button>
        </div>

        <div className="bemor-dialog-body bg-[#f6f9fc] px-3 py-3">
          <div className="xzm-modal-grid">
            <div className="min-w-0 space-y-3">
              <Card title="Asosiy ma’lumotlar">
                <Label text="Xizmat nomi" required error={errors.name}>
                  <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Masalan: Kompozit plomba" className={field} />
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Label text="Kategoriya" required error={errors.cat}>
                    <Select value={form.cat} onChange={(v) => set('cat', v)}>
                      <option value="">Kategoriya tanlang</option>
                      {CATS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </Select>
                  </Label>
                  <Label text="Kodi (ichki)">
                    <div className="flex">
                      <input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} className={`${field} rounded-r-none`} />
                      <button type="button" onClick={() => set('code', nextCode())} aria-label="Kodni yangilash" title="Keyingi bo‘sh kod" className="grid w-10 shrink-0 place-items-center rounded-r-xl border border-l-0 border-[#e6ebf2] bg-white text-ink-2 hover:text-sea"><RefreshCw className="size-4" /></button>
                    </div>
                  </Label>
                </div>
                <Label text="Qisqa tavsif">
                  <textarea value={form.short} onChange={(e) => set('short', e.target.value.slice(0, 200))} placeholder="Xizmat haqida qisqa ma’lumot..." rows={3} className={`${field} h-auto resize-y py-2`} />
                </Label>
                <Label text="Batafsil tavsif">
                  <div className="overflow-hidden rounded-xl border border-[#e6ebf2] bg-white focus-within:border-sea">
                    <div className="flex gap-0.5 border-b border-[#e6ebf2] bg-[#f8fafc] px-1.5 py-1">
                      {[[Bold, 'bold', 'Qalin'], [Italic, 'italic', 'Kursiv'], [Underline, 'underline', 'Tagiga chizish'], [List, 'insertUnorderedList', 'Ro‘yxat'], [ListOrdered, 'insertOrderedList', 'Raqamli ro‘yxat'], [Link2, 'createLink', 'Havola']].map(([Icon, cmd, t]) => (
                        <button key={cmd} type="button" title={t} aria-label={t} onMouseDown={(e) => { e.preventDefault(); format(cmd) }} className="grid size-7 place-items-center rounded-md text-ink-2 hover:bg-white hover:text-sea"><Icon className="size-4" /></button>
                      ))}
                    </div>
                    <div
                      ref={editor}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => set('body', e.currentTarget.innerHTML)}
                      data-placeholder="Xizmat haqida batafsil ma’lumot..."
                      className="xzm-editor min-h-[72px] px-3 py-2 text-[12.5px] outline-none"
                    />
                  </div>
                </Label>
              </Card>

              <Card title="Rasm / ikonka">
                <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] gap-3">
                  <button type="button" onClick={() => imageInput.current?.click()} className="relative grid min-h-[132px] place-items-center overflow-hidden rounded-xl border border-dashed border-[#bcd3e4] bg-[#f3f8fc] p-2 text-center hover:border-sea">
                    {form.image ? (
                      <>
                        <img src={form.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 bg-black/50 py-1 text-[11px] font-medium text-white">Rasmni almashtirish</span>
                      </>
                    ) : (
                      <span>
                        <UploadCloud className="mx-auto size-7 text-sea" />
                        <b className="mt-1 block text-[12px] text-sea">Rasm yuklash</b>
                        <span className="block text-[10.5px] text-muted">PNG, JPG • Maksimal 5MB</span>
                      </span>
                    )}
                  </button>
                  <input ref={imageInput} type="file" accept="image/png,image/jpeg" hidden onChange={pickImage} />
                  <div className="grid grid-cols-4 gap-2">
                    {PRESETS.map((k) => {
                      const on = !form.image && form.art === k
                      return (
                        <button key={k} type="button" onClick={() => setForm((f) => ({ ...f, art: k, image: '' }))} aria-label={k} className={`grid aspect-square place-items-center rounded-xl border bg-[#f5f8fb] transition ${on ? 'border-sea ring-2 ring-sea/25' : 'border-transparent hover:border-[#cbd5e1]'}`}>
                          <ServiceArt kind={k} className="size-[70%]" />
                        </button>
                      )
                    })}
                  </div>
                </div>
                {fileError && <p className="text-[11.5px] text-[#e11d48]">{fileError}</p>}
              </Card>
            </div>

            <div className="min-w-0 space-y-3">
              <Card title="Narx va vaqt">
                <div className="grid grid-cols-3 gap-3">
                  <Label text="Narx (so‘m)" required error={errors.price}>
                    <Stepper value={form.price} step={10000} onChange={(v) => set('price', v)} />
                  </Label>
                  <Label text="Davomiyligi (daqiqa)" required error={errors.duration}>
                    <Stepper value={form.duration} step={5} onChange={(v) => set('duration', v)} />
                  </Label>
                  <Label text="Tishlar soni (ixtiyoriy)">
                    <input value={form.teeth} onChange={(e) => set('teeth', e.target.value.replace(/[^\d\s,-]/g, ''))} placeholder="Masalan: 1 yoki 2" className={field} />
                  </Label>
                </div>
              </Card>

              <Card title="Qo‘shimcha sozlamalar">
                <div className="grid grid-cols-2 gap-3">
                  <Label text="Status">
                    <div className="relative">
                      <span className={`pointer-events-none absolute left-3 top-1/2 z-10 size-2 -translate-y-1/2 rounded-full ${form.status === 'faol' ? 'bg-[#16a34a]' : 'bg-[#94a3b8]'}`} />
                      <Select value={form.status} onChange={(v) => set('status', v)} className={`pl-7! font-semibold ${form.status === 'faol' ? 'bg-[#e9f8ef]! text-[#15803d]!' : 'bg-[#f1f5f9]! text-ink-2!'}`}>
                        <option value="faol">Faol</option>
                        <option value="nofaol">Nofaol</option>
                      </Select>
                    </div>
                  </Label>
                  <Label text="Davolash rejalarida ko‘rsatish">
                    <button type="button" role="switch" aria-checked={form.inPlans} onClick={() => set('inPlans', !form.inPlans)} className="flex h-10 items-center gap-2 text-[12.5px] font-medium">
                      <span className={`relative h-6 w-11 rounded-full transition ${form.inPlans ? 'bg-sea' : 'bg-[#cbd5e1]'}`}>
                        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${form.inPlans ? 'left-[22px]' : 'left-0.5'}`} />
                      </span>
                      {form.inPlans ? 'Ha, ko‘rsatish' : 'Yo‘q'}
                    </button>
                  </Label>
                </div>
                <Label text="Foydalaniladigan materiallar">
                  <span className="relative block">
                    <Box className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                    <input value={form.materials} onChange={(e) => set('materials', e.target.value)} placeholder="Masalan: Kompozit, Adgeziv, Lokal anestetik..." className={`${field} pl-9`} />
                  </span>
                </Label>
                <Label text="Teglar (kalit so‘zlar)" required error={errors.tags}>
                  <div className={`flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border bg-white px-3 py-1.5 focus-within:border-sea ${errors.tags ? 'border-[#fca5a5]' : 'border-[#e6ebf2]'}`}>
                    <Tag className="size-4 shrink-0 text-muted" />
                    {form.tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 rounded-md bg-sea-50 px-2 py-0.5 text-[11.5px] font-medium text-sea">
                        {t}
                        <button type="button" aria-label={`${t} tegini o‘chirish`} onClick={() => set('tags', form.tags.filter((x) => x !== t))}><X className="size-3" /></button>
                      </span>
                    ))}
                    <input
                      value={tagDraft}
                      onChange={(e) => setTagDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
                        if (e.key === 'Backspace' && !tagDraft && form.tags.length) set('tags', form.tags.slice(0, -1))
                      }}
                      onBlur={addTag}
                      placeholder={form.tags.length ? '' : 'Enter bilan qo‘shing...'}
                      className="min-w-[80px] flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-[#9aa6b6]"
                    />
                  </div>
                </Label>
              </Card>

              <Card title="Rang va ikonka">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1.5 text-[11.5px] font-medium text-ink-2">Rang</p>
                    <div className="flex flex-wrap gap-1.5 pl-0.5 pt-0.5">
                      {COLORS.map((c) => (
                        <button key={c} type="button" aria-label={`Rang ${c}`} onClick={() => set('color', c)} className={`size-6 rounded-full transition ${form.color === c ? 'ring-2 ring-sea ring-offset-2' : ''}`} style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11.5px] font-medium text-ink-2">Ikonka</p>
                    <div className="flex flex-wrap gap-1.5">
                      {visibleIcons.map(([k, Icon]) => (
                        <button key={k} type="button" aria-label={`Ikonka ${k}`} onClick={() => set('icon', k)} className={`grid size-8 place-items-center rounded-lg border transition ${form.icon === k ? 'border-sea bg-sea-50 text-sea' : 'border-[#e6ebf2] text-ink-2 hover:border-[#cbd5e1]'}`}>
                          <Icon className="size-4" />
                        </button>
                      ))}
                      {!moreIcons && <button type="button" aria-label="Boshqa ikonkalar" onClick={() => setMoreIcons(true)} className="grid size-8 place-items-center rounded-lg border border-[#e6ebf2] text-ink-2"><MoreHorizontal className="size-4" /></button>}
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Xizmat hujjatlari (ixtiyoriy)">
                <button type="button" onClick={() => docInput.current?.click()} className="flex w-full items-center justify-center gap-3 rounded-xl border border-dashed border-[#bcd3e4] bg-[#f3f8fc] py-4 hover:border-sea">
                  <UploadCloud className="size-7 text-sea" />
                  <span className="text-left">
                    <b className="block text-[12px] text-ink">Protokol yoki yo‘riqnoma yuklash</b>
                    <span className="block text-[10.5px] text-muted">PDF, DOCX • Maksimal 10MB</span>
                  </span>
                </button>
                <input ref={docInput} type="file" accept=".pdf,.doc,.docx" multiple hidden onChange={pickDocs} />
                {form.docs.length > 0 && (
                  <ul className="space-y-1.5">
                    {form.docs.map((d, i) => (
                      <li key={`${d.name}${i}`} className="flex items-center gap-2 rounded-lg border border-line px-2 py-1.5 text-[12px]">
                        <FileText className="size-4 text-sea" />
                        <a href={d.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate hover:text-sea">{d.name}</a>
                        <span className="text-[11px] text-muted">{(d.size / 1024 / 1024).toFixed(1)} MB</span>
                        <button type="button" aria-label="O‘chirish" onClick={() => set('docs', form.docs.filter((_, j) => j !== i))} className="text-muted hover:text-[#dc2626]"><Trash2 className="size-3.5" /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-line px-5 py-3">
          {Object.keys(errors).length > 0 && <p className="mr-auto text-[12px] text-[#e11d48]">Majburiy maydonlarni to‘ldiring.</p>}
          <button type="button" onClick={onClose} className="h-11 w-40 rounded-xl border border-sea text-[13px] font-semibold text-sea">Bekor</button>
          <button type="button" onClick={submit} className="inline-flex h-11 w-[168px] items-center justify-center gap-2 rounded-xl bg-sea text-[13px] font-semibold text-white hover:bg-sea-600"><Save className="size-4" /> Saqlash</button>
        </div>
      </div>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <section className="space-y-3 rounded-xl bg-white p-3.5 shadow-[0_1px_2px_rgb(15_23_42/0.05)]">
      <h3 className="text-[13px] font-bold text-ink">{title}</h3>
      {children}
    </section>
  )
}

function Label({ text, required, error, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11.5px] font-medium text-ink-2">{text}{required && <span className="text-[#ef4444]"> *</span>}</span>
      {children}
      {error && <span className="mt-1 block text-[11px] text-[#e11d48]">{error}</span>}
    </label>
  )
}

function Select({ value, onChange, children, className = '' }) {
  return (
    <span className="relative block">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${field} appearance-none pr-8 ${className}`}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </span>
  )
}

function Stepper({ value, step, onChange }) {
  const n = Number(value) || 0
  return (
    <span className="relative block">
      <input inputMode="numeric" value={n ? n.toLocaleString('ru-RU').replace(/\u00a0/g, ' ') : '0'} onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)} className={`${field} pr-7`} />
      <span className="absolute inset-y-1 right-1 flex flex-col">
        <button type="button" aria-label="Oshirish" onClick={() => onChange(n + step)} className="grid flex-1 place-items-center px-1 text-muted hover:text-sea"><ChevronUp className="size-3" /></button>
        <button type="button" aria-label="Kamaytirish" onClick={() => onChange(Math.max(0, n - step))} className="grid flex-1 place-items-center px-1 text-muted hover:text-sea"><ChevronDown className="size-3" /></button>
      </span>
    </span>
  )
}
