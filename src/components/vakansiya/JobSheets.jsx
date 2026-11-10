// Vakansiya qo‘shish / tahrirlash formasi va «Mening vakansiyalarim» (0069). Soxta «yuborildi» oqimlari yo‘q —
// vakansiya catalog_items ga yoziladi, aloqa faqat telefon (tel:) va Telegram (t.me) orqali.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Trash2, Lock, RotateCcw } from 'lucide-react'
import { BottomSheet } from '../mobile/MobileSeminars'
import PhoneInput, { extractUzLocalDigits, toE164 } from '../PhoneInput'
import { ensureLogin } from '../../loginPrompt'
import { specs as jobSpecs, exps as jobExps } from '../../ishlarData'
import { deleteJob, postJob, setJobStatus, updateJob, useMyJobs } from '../../vakansiyaApi'
import { emptyForm, fmtNum, JOB_CITIES, JOB_TYPES, jobError, MAX, salaryText, toForm, validateJob, digits } from '../../lib/vakansiya'

function L({ text, required, error, hint, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[12.5px] font-semibold text-ink-2">{text}{required && <span className="text-sale"> *</span>}</span>
      {children}
      {hint && !error && <span className="mt-0.5 block text-[11px] text-muted">{hint}</span>}
      {error && <span role="alert" className="mt-0.5 block text-[11.5px] text-sale">{error}</span>}
    </label>
  )
}
const money = (v) => { const d = digits(v).slice(0, 11); return d ? fmtNum(Number(d)) : '' }

export function JobFormSheet({ job = null, onClose, onDone, initial }) {
  const [f, setF] = useState(() => initial || (job ? toForm(job) : emptyForm()))
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const errs = validateJob(f)
  const E = (k) => (tried ? errs[k] : '')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? e.target.value : e }))
  const field = (bad) => `h-11 w-full rounded-xl border bg-white px-3 text-[16px] outline-none focus:border-sea md:text-[14px] ${bad ? 'border-sale' : 'border-line'}`
  const submit = async () => {
    setTried(true); setErr('')
    if (Object.keys(errs).length || busy) return
    if (!ensureLogin()) return
    setBusy(true)
    try {
      if (job) await updateJob(job, f)
      else await postJob(f)
      onDone?.(job ? 'Vakansiya yangilandi' : 'Vakansiya e’lon qilindi')
    } catch (e) { setErr(jobError(e)) } finally { setBusy(false) }
  }
  return (
    <BottomSheet centered title={job ? 'Vakansiyani tahrirlash' : 'Vakansiya qo‘shish'} onClose={onClose}
      footer={<>
        <button type="button" onClick={onClose} className="h-12 rounded-xl border border-line px-4 text-[14px] font-semibold text-ink">Bekor qilish</button>
        <button type="button" data-testid="job-submit" disabled={busy} onClick={submit} className="h-12 flex-1 rounded-xl bg-[#0b6d73] text-[14px] font-semibold text-white disabled:opacity-60">{busy ? 'Saqlanmoqda…' : job ? 'Saqlash' : 'E’lon qilish'}</button>
      </>}>
      <p className="mt-1 text-[12px] text-muted">Vakansiya darhol «Vakansiyalar» bo‘limida ko‘rinadi. Nomzodlar siz bilan telefon yoki Telegram orqali bog‘lanadi.</p>
      <div data-testid="job-form" className="mt-3 grid gap-3 pb-2">
        <L text="Lavozim" required error={E('title')} hint={`${f.title.length}/${MAX.title}`}>
          <input value={f.title} maxLength={MAX.title} onChange={set('title')} placeholder="Masalan: Stomatolog-terapevt" className={field(E('title'))} />
        </L>
        <L text="Klinika yoki ish beruvchi" required error={E('clinic')}>
          <input value={f.clinic} maxLength={MAX.clinic} onChange={set('clinic')} placeholder="Masalan: Smile Dent klinikasi" className={field(E('clinic'))} />
        </L>
        <div className="grid gap-3 sm:grid-cols-2">
          <L text="Shahar / viloyat" required error={E('city')}>
            <select value={f.city} onChange={set('city')} className={field(E('city'))}>{JOB_CITIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </L>
          <L text="Manzil (ixtiyoriy)" error={E('address')}>
            <input value={f.address} maxLength={MAX.address} onChange={set('address')} placeholder="Tuman, ko‘cha, mo‘ljal" className={field(E('address'))} />
          </L>
        </div>
        <div>
          <span className="mb-1 block text-[12.5px] font-semibold text-ink-2">Ish turi <span className="text-sale">*</span></span>
          <div role="radiogroup" aria-label="Ish turi" className="flex flex-wrap gap-1.5">
            {JOB_TYPES.map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={f.type === k} onClick={() => setF((s) => ({ ...s, type: k }))}
                className={`h-10 rounded-xl px-3 text-[13px] font-semibold ${f.type === k ? 'bg-[#0b8a95] text-white' : 'border border-line text-ink'}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <L text="Yo‘nalish (ixtiyoriy)">
            <select value={f.spec} onChange={set('spec')} className={field(false)}><option value="">Tanlanmagan</option>{jobSpecs.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </L>
          <L text="Tajriba (ixtiyoriy)">
            <select value={f.exp} onChange={set('exp')} className={field(false)}><option value="">Tanlanmagan</option>{jobExps.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </L>
        </div>
        <div>
          <span className="mb-1 block text-[12.5px] font-semibold text-ink-2">Maosh, so‘m (ixtiyoriy)</span>
          <div className="grid grid-cols-2 gap-2">
            <input aria-label="Maosh (dan)" inputMode="numeric" value={money(f.min)} onChange={(e) => setF((s) => ({ ...s, min: digits(e.target.value).slice(0, 11) }))} placeholder="dan" className={field(E('salary'))} />
            <input aria-label="Maosh (gacha)" inputMode="numeric" value={money(f.max)} onChange={(e) => setF((s) => ({ ...s, max: digits(e.target.value).slice(0, 11) }))} placeholder="gacha" className={field(E('salary'))} />
          </div>
          {E('salary') ? <span role="alert" className="mt-0.5 block text-[11.5px] text-sale">{E('salary')}</span>
            : <span className="mt-0.5 block text-[11px] text-muted">Bo‘sh qoldirilsa — «{salaryText(f.min, f.max)}»</span>}
        </div>
        <L text="Talablar (ixtiyoriy)" error={E('requirements')} hint="Har bir talabni yangi qatordan yozing">
          <textarea value={f.requirements} maxLength={MAX.requirements} onChange={set('requirements')} rows={4} placeholder={'Masalan:\nKamida 2 yil tajriba\nDiplom va sertifikat'}
            className="w-full resize-y rounded-xl border border-line px-3 py-2.5 text-[16px] outline-none focus:border-sea md:text-[14px]" />
        </L>
        <L text="Qo‘shimcha ma’lumot (ixtiyoriy)" error={E('about')}>
          <textarea value={f.about} maxLength={MAX.about} onChange={set('about')} rows={3} placeholder="Ish vaqti, sharoitlar, imtiyozlar…"
            className="w-full resize-y rounded-xl border border-line px-3 py-2.5 text-[16px] outline-none focus:border-sea md:text-[14px]" />
        </L>
        <div className="rounded-2xl bg-page p-3">
          <p className="text-[13px] font-bold text-ink">Aloqa <span className="text-sale">*</span></p>
          <p className="text-[11.5px] text-muted">Telefon va/yoki Telegram — kamida bittasi</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <L text="Telefon" error={E('phone')}>
              <PhoneInput value={f.phone} onChange={(v) => setF((s) => ({ ...s, phone: toE164(v) || `+998 ${extractUzLocalDigits(v)}` }))} valueMode="e164" className={field(E('phone'))} invalid={!!E('phone')} placeholder="+998 90 123 45 67" />
            </L>
            <L text="Telegram username" error={E('telegram')}>
              <input value={f.telegram} onChange={set('telegram')} placeholder="@username" autoCapitalize="off" autoCorrect="off" spellCheck={false} className={field(E('telegram'))} />
            </L>
          </div>
          {E('contact') && <p role="alert" className="mt-1 text-[11.5px] text-sale">{E('contact')}</p>}
        </div>
        {tried && Object.keys(errs).length > 0 && <p className="text-[12px] text-sale">Qizil maydonlarni tekshiring</p>}
        {err && <p role="alert" className="text-[12.5px] text-sale">{err}</p>}
      </div>
    </BottomSheet>
  )
}

export function MyJobsSheet({ onClose }) {
  const list = useMyJobs()
  const [edit, setEdit] = useState(null)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [confirm, setConfirm] = useState('')
  const act = async (key, fn, ok) => {
    setBusy(key); setErr(''); setMsg('')
    try { await fn(); setMsg(ok) } catch (e) { setErr(jobError(e)) } finally { setBusy(''); setConfirm('') }
  }
  if (edit) return <JobFormSheet job={edit} onClose={() => setEdit(null)} onDone={(m) => { setEdit(null); setMsg(m) }} />
  return (
    <BottomSheet centered title="Mening vakansiyalarim" onClose={onClose}>
      <p className="mt-1 text-[12px] text-muted">Faol va yopilgan vakansiyalaringiz</p>
      {err && <p role="alert" className="mt-2 text-[12px] text-sale">{err}</p>}
      <div className="mt-3 flex flex-col gap-2 pb-3">
        {!list.length && <p className="rounded-xl bg-page px-3 py-6 text-center text-[13px] text-muted">Hozircha vakansiyangiz yo‘q</p>}
        {list.map((j) => {
          const closed = j.status === 'closed'
          return (
            <div key={j.id} className="rounded-2xl border border-line/70 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link to={`/ishlar/${j.id}`} onClick={onClose} className="block truncate text-[14px] font-bold text-ink">{j.title}</Link>
                  <p className="truncate text-[12px] text-muted">{j.clinic} · {j.cityLabel}</p>
                  <p className="text-[12px] font-semibold text-[#0b6d73]">{salaryText(j.min, j.max)}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${j._pending ? 'bg-[#fff8e6] text-[#7a5200]' : closed ? 'bg-[#f1f5f9] text-muted' : 'bg-[#e3f8ec] text-[#16a05a]'}`}>
                  {j._pending ? 'Yashirilgan' : closed ? 'Yopilgan' : 'Faol'}
                </span>
              </div>
              {confirm === j.id ? (
                <div className="mt-2 rounded-xl bg-[#fef3f2] p-2.5">
                  <p className="text-[12.5px] text-ink">Vakansiya butunlay o‘chiriladi. Davom etasizmi?</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setConfirm('')} className="h-9 rounded-xl border border-line bg-white text-[12.5px] font-semibold text-ink">Yo‘q</button>
                    <button type="button" disabled={!!busy} onClick={() => act(j.id + 'd', () => deleteJob(j.id), 'Vakansiya o‘chirildi')} className="h-9 rounded-xl bg-[#b42318] text-[12.5px] font-semibold text-white disabled:opacity-50">Ha, o‘chirish</button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setEdit(j)} className="flex h-9 items-center justify-center gap-1 rounded-xl border border-line text-[12px] font-semibold text-ink"><Pencil className="size-3.5" /> Tahrirlash</button>
                  <button type="button" disabled={!!busy} onClick={() => act(j.id + 's', () => setJobStatus(j.id, closed ? 'active' : 'closed'), closed ? 'Vakansiya qayta ochildi' : 'Vakansiya yopildi')}
                    className="flex h-9 items-center justify-center gap-1 rounded-xl border border-line text-[12px] font-semibold text-ink disabled:opacity-50">
                    {closed ? <><RotateCcw className="size-3.5" /> Ochish</> : <><Lock className="size-3.5" /> Yopish</>}
                  </button>
                  <button type="button" onClick={() => setConfirm(j.id)} className="flex h-9 items-center justify-center gap-1 rounded-xl border border-[#f3c4bf] text-[12px] font-semibold text-[#b42318]"><Trash2 className="size-3.5" /> O‘chirish</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {msg && <p role="status" className="pb-2 text-center text-[12.5px] text-sea">{msg}</p>}
    </BottomSheet>
  )
}
