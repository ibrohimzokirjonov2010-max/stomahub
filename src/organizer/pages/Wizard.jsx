import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Calendar, Check, ChevronLeft, Image as ImageIcon, MapPin, Plus, Trash2 } from 'lucide-react'
import { CERT_TEMPLATES, IMG, ORG, WIZARD_PROMOS, WIZARD_SPEAKERS, WIZARD_TICKETS, som } from '../data'
import { useOrg } from '../Shell'
import { Badge, Btn, CertificateCard, Field, Modal, Toggle, inputCls } from '../ui'

const STEPS = [
  { id: 'info', title: 'Asosiy ma’lumotlar' },
  { id: 'when', title: 'Sana va joy' },
  { id: 'tickets', title: 'Chipta turlari' },
  { id: 'speakers', title: 'Ma’ruzachilar' },
  { id: 'cert', title: 'Sertifikat va dizayn' },
  { id: 'marketing', title: 'Marketing' },
  { id: 'review', title: 'Ko‘rib chiqish' },
]

const TOPICS = ['Implantologiya', 'Endodontiya', 'Ortodontiya', 'Jarrohlik', 'Estetika', 'Bolalar']
const FORMATS = ['Offline (joyida)', 'Onlayn (webinar)', 'Gibrid (onlayn + offline)']
const CATS = ['Tibbiy amaliy seminar', 'Master-klass', 'Konferensiya', 'Vebinar']

export default function Wizard() {
  const { notify } = useOrg()
  const [params] = useSearchParams()
  const editing = params.get('tahrir')
  const [step, setStep] = useState(0)
  const [modal, setModal] = useState(null)
  const [draftSaved, setDraft] = useState(false)
  const [published, setPublished] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    name: 'Implantologiya: nazariya va amaliyot',
    about: 'Implantologiya sohasidagi zamonaviy yondashuvlar, jarrohlik amaliyoti va klinik holatlar tahlili.',
    topic: 'Implantologiya',
    format: 'Offline (joyida)',
    category: 'Tibbiy amaliy seminar',
    tags: ['Implantologiya', 'Jarrohlik', 'Amaliyot', 'Master-klass'],
    tag: '',
    cover: IMG.teeth,
    start: '2026-11-24',
    startTime: '10:00',
    end: '2026-11-24',
    endTime: '18:00',
    multi: false,
    placeType: 'offline',
    place: 'Toshkent, Congress Hall',
    address: 'Toshkent shahri, Amir Temur shoh ko‘chasi, 1-uy',
    placeImg: IMG.hall2,
    tickets: WIZARD_TICKETS,
    speakers: WIZARD_SPEAKERS,
    template: 'teal',
    promos: WIZARD_PROMOS,
    ads: true,
    social: true,
    emailing: false,
  })
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const validate = (index) => {
    const e = {}
    if (index === 0) {
      if (form.name.trim().length < 5) e.name = 'Seminar nomi kamida 5 ta belgi'
      if (form.about.trim().length < 20) e.about = 'Tavsif kamida 20 ta belgi'
    }
    if (index === 1) {
      if (!form.start || !form.end) e.date = 'Sanalarni kiriting'
      if (form.start && form.end && form.start > form.end) e.date = 'Tugash sanasi boshlanishidan keyin'
      if (form.placeType !== 'online' && form.place.trim().length < 3) e.place = 'Manzilni kiriting'
    }
    if (index === 2 && form.tickets.length === 0) e.tickets = 'Kamida bitta chipta turi qo‘shing'
    if (index === 3 && form.speakers.length === 0) e.speakers = 'Kamida bitta ma’ruzachi qo‘shing'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const go = (next) => {
    if (next > step && !validate(step)) {
      document.getElementById(STEPS[step].id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    const i = Math.max(0, Math.min(STEPS.length - 1, next))
    setStep(i)
    document.getElementById(STEPS[i].id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const publish = () => {
    for (let i = 0; i < 4; i++) if (!validate(i)) { setStep(i); document.getElementById(STEPS[i].id)?.scrollIntoView({ behavior: 'smooth' }); return }
    setPublished(true)
    notify('Seminar e’lon qilindi')
  }

  const onCover = (file) => {
    if (!file) return
    if (!/^image\/(png|jpeg)$/.test(file.type)) { notify('Faqat JPG yoki PNG'); return }
    set({ cover: URL.createObjectURL(file) })
  }

  const previewTags = form.tags.slice(0, 3)

  return (
    <div>
      <Link to="/tashkilotchi/seminarlar" className="mb-2 inline-flex items-center gap-1 text-[13px] font-medium text-[#5e787e] hover:text-[#0c8f86]"><ChevronLeft className="size-4" /> Mening seminarlarim</Link>
      <h1 className="text-[22px] font-bold">{editing ? 'Seminarni tahrirlash' : 'Yangi seminar yaratish'}</h1>
      <p className="mt-0.5 text-[13px] text-[#6e868c]">Seminar haqida to‘liq ma’lumotlarni kiriting va e’lon qiling</p>
      {draftSaved && <p className="mt-2 text-[12.5px] font-medium text-[#0c8f86]">Qoralama saqlandi</p>}
      {published && <p className="mt-2 rounded-xl bg-[#e7f8ee] px-3 py-2 text-[13px] text-[#15803d]">Seminar e’lon qilindi. U “Mening seminarlarim” ro‘yxatida ko‘rinadi.</p>}

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[180px_minmax(0,1fr)_300px]">
        <ol className="sticky top-0 hidden space-y-1 xl:block">
          {STEPS.map((s, i) => (
            <li key={s.id}>
              <button type="button" onClick={() => go(i)} className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[12.5px] ${i === step ? 'font-semibold text-[#0c8f86]' : 'text-[#5e787e]'}`}>
                <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${i === step ? 'bg-[#0c8f86] text-white' : i < step ? 'bg-[#d8f3ee] text-[#0c8f86]' : 'bg-[#e7eef0] text-[#6e868c]'}`}>{i < step ? <Check className="size-3.5" /> : i + 1}</span>
                {s.title}
              </button>
            </li>
          ))}
        </ol>

        <div className="min-w-0 space-y-4">
          <section id="info" className="rounded-2xl border border-[#e6f1ef] bg-white p-4">
            <Head n="1" title="Asosiy ma’lumotlar" sub="Seminar nomi, tavsifi, mavzusi va muqova rasmi" extra={<button type="button" className="text-[12.5px] font-semibold text-[#0c8f86]" onClick={() => { setDraft(true); notify('Qoralama saqlandi') }}>Qoralama saqlash</button>} />
            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
              <Field label="Seminar nomi" req error={errors.name}><input className={inputCls(errors.name)} value={form.name} onChange={(e) => set({ name: e.target.value })} /></Field>
              <Field label="Seminar muqova rasmi">
                <label className="grid h-[92px] cursor-pointer place-items-center rounded-xl border border-dashed border-[#d5e4e1] bg-[#f7fbfb] text-center text-[11.5px] text-[#7e9398]">
                  <span><ImageIcon className="mx-auto size-5 text-[#0c8f86]" /> Rasm yuklash<br />JPG, PNG (min. 1920×1080)</span>
                  <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => onCover(e.target.files?.[0])} />
                </label>
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Qisqa tavsif" req error={errors.about}>
                <textarea maxLength={500} className={`${inputCls(errors.about)} h-20 py-2`} value={form.about} onChange={(e) => set({ about: e.target.value })} />
                <span className="mt-1 block text-right text-[11px] text-[#9aafb4]">{form.about.length}/500</span>
              </Field>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="Mavzu / Yo‘nalish" req><select className={inputCls()} value={form.topic} onChange={(e) => set({ topic: e.target.value })}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Format" req><select className={inputCls()} value={form.format} onChange={(e) => set({ format: e.target.value })}>{FORMATS.map((t) => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Bosh toifa"><select className={inputCls()} value={form.category} onChange={(e) => set({ category: e.target.value })}>{CATS.map((t) => <option key={t}>{t}</option>)}</select></Field>
            </div>
            <div className="mt-3">
              <p className="mb-1.5 text-[12.5px] font-medium">Teglar</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {form.tags.map((t) => <button key={t} type="button" onClick={() => set({ tags: form.tags.filter((x) => x !== t) })} className="rounded-full bg-[#e7f6f3] px-2 py-1 text-[12px] text-[#0c8f86]">{t} ×</button>)}
                <input value={form.tag} onChange={(e) => set({ tag: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const t = form.tag.trim(); if (t && !form.tags.includes(t)) set({ tags: [...form.tags, t], tag: '' }) } }} placeholder="+ Teg qo‘shish" className="h-8 w-28 rounded-full border border-[#e3eeec] px-2 text-[12px] outline-none" />
              </div>
            </div>
          </section>

          <section id="when" className="rounded-2xl border border-[#e6f1ef] bg-white p-4">
            <Head n="2" title="Sana va joy" sub="Seminar o‘tkazilish sanasi, vaqti va manzilini belgilang" />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Boshlanish sanasi va vaqti" req error={errors.date}>
                <div className="grid grid-cols-2 gap-2"><input type="date" className={inputCls()} value={form.start} onChange={(e) => set({ start: e.target.value })} /><input type="time" className={inputCls()} value={form.startTime} onChange={(e) => set({ startTime: e.target.value })} /></div>
              </Field>
              <Field label="Tugash sanasi va vaqti" req>
                <div className="grid grid-cols-2 gap-2"><input type="date" className={inputCls()} value={form.end} onChange={(e) => set({ end: e.target.value })} /><input type="time" className={inputCls()} value={form.endTime} onChange={(e) => set({ endTime: e.target.value })} /></div>
              </Field>
            </div>
            <label className="mt-3 inline-flex items-center gap-2 text-[13px]"><input type="checkbox" checked={form.multi} onChange={(e) => set({ multi: e.target.checked })} /> Bir necha kunlik seminar</label>
            <p className="mb-1.5 mt-3 text-[12.5px] font-medium">Manzil turi <span className="text-[#e11d48]">*</span></p>
            <div className="flex flex-wrap gap-2">
              {[['offline', 'Joyida (offline)'], ['online', 'Onlayn (webinar)'], ['hybrid', 'Gibrid (onlayn + offline)']].map(([id, label]) => (
                <button key={id} type="button" onClick={() => set({ placeType: id })} className={`h-9 rounded-xl px-3 text-[12.5px] font-semibold ${form.placeType === id ? 'bg-[#0c8f86] text-white' : 'border border-[#e4eeec] bg-white'}`}>{label}</button>
              ))}
            </div>
            {form.placeType !== 'online' && (
              <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="space-y-3">
                  <Field label="Manzil" req error={errors.place}>
                    <div className="flex gap-2"><input className={inputCls(errors.place)} value={form.place} onChange={(e) => set({ place: e.target.value })} /><a className="grid shrink-0 place-items-center rounded-xl border border-[#d5ebe6] px-3 text-[12px] font-semibold text-[#0c8f86]" href="https://maps.google.com/?q=Tashkent+Congress+Hall" target="_blank" rel="noreferrer">Xaritada ko‘rish</a></div>
                  </Field>
                  <Field label="To‘liq manzil"><input className={inputCls()} value={form.address} onChange={(e) => set({ address: e.target.value })} /></Field>
                </div>
                <label className="grid h-[92px] cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-[#d5e4e1] text-[11.5px] text-[#7e9398]">
                  {form.placeImg ? <img src={form.placeImg} alt="" className="size-full object-cover" /> : 'Manzil rasmini yuklash'}
                  <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) set({ placeImg: URL.createObjectURL(f) }) }} />
                </label>
              </div>
            )}
          </section>

          <section id="tickets" className="rounded-2xl border border-[#e6f1ef] bg-white p-4">
            <Head n="3" title="Chipta turlari" sub="Seminar uchun turli chipta turlarini qo‘shing" extra={<button type="button" onClick={() => setModal('ticket')} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#0c8f86]"><Plus className="size-4" /> Chipta turi qo‘shish</button>} />
            {errors.tickets && <p className="mt-2 text-[12px] text-[#e11d48]">{errors.tickets}</p>}
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {form.tickets.map((t) => (
                <article key={t.id} className="rounded-2xl border border-[#e6f1ef] p-3">
                  <div className="flex items-center justify-between"><p className="font-bold">{t.name} {t.basic && <Badge tone="teal">Asosiy</Badge>}</p><Badge tone="green" dot>Faol</Badge></div>
                  <p className="mt-2 text-[12.5px]">Narx <b>{som(t.price)}</b></p>
                  <p className="text-[12.5px]">Joylar soni <b>{t.seats}</b></p>
                  <ul className="mt-2 space-y-1 text-[12px] text-[#3e5a62]">{t.perks.map((p) => <li key={p} className="flex gap-1"><Check className="size-3.5 shrink-0 text-[#16a34a]" /> {p}</li>)}</ul>
                  <div className="mt-2 flex justify-end gap-1">
                    <button type="button" className="text-[12px] font-semibold text-[#0c8f86]" onClick={() => setModal('ticket')}>Tahrirlash</button>
                    <button type="button" aria-label="O‘chirish" onClick={() => set({ tickets: form.tickets.filter((x) => x.id !== t.id) })} className="text-[#e11d48]"><Trash2 className="size-4" /></button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="speakers" className="rounded-2xl border border-[#e6f1ef] bg-white p-4">
            <Head n="4" title="Ma’ruzachilar" sub="Seminarda ishtirok etadigan ma’ruzachilarni qo‘shing" extra={<button type="button" onClick={() => setModal('speaker')} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#0c8f86]"><Plus className="size-4" /> Ma’ruzachi qo‘shish</button>} />
            {errors.speakers && <p className="mt-2 text-[12px] text-[#e11d48]">{errors.speakers}</p>}
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {form.speakers.map((s) => (
                <article key={s.id} className="rounded-2xl border border-[#e6f1ef] p-3 text-center">
                  <img src={s.avatar} alt="" className="mx-auto size-16 rounded-full object-cover" />
                  <p className="mt-2 text-[13px] font-bold">{s.name}</p>
                  <p className="text-[12px] text-[#6e868c]">{s.role}</p>
                  <p className="text-[11.5px] text-[#8aa0a4]">{s.city}</p>
                  <button type="button" className="mt-2 text-[12px] text-[#e11d48]" onClick={() => set({ speakers: form.speakers.filter((x) => x.id !== s.id) })}>Olib tashlash</button>
                </article>
              ))}
            </div>
          </section>

          <section id="cert" className="rounded-2xl border border-[#e6f1ef] bg-white p-4">
            <Head n="5" title="Sertifikat va dizayn" sub="Sertifikat shablonini tanlang yoki o‘z dizayningizni yuklang" />
            <div className="mt-3 flex flex-wrap gap-2 text-[12.5px] font-semibold text-[#0c8f86]">
              <span className="rounded-lg bg-[#e7f6f3] px-2 py-1">Tayyor shablonlar</span>
              <label className="cursor-pointer rounded-lg px-2 py-1">O‘z dizaynim yuklash<input type="file" accept="image/png,image/jpeg" className="hidden" onChange={() => notify('Dizayn yuklandi')} /></label>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              {CERT_TEMPLATES.map((t) => (
                <button key={t.id} type="button" onClick={() => set({ template: t.id })} className={`rounded-xl border p-2 ${form.template === t.id ? 'border-[#0c8f86] ring-2 ring-[#0c8f86]/20' : 'border-[#e6f1ef]'}`}>
                  <CertificateCard name="Aliyeva Mohira" course={form.name} template={t.id} />
                  <p className="mt-1 text-center text-[11.5px] font-semibold">{t.name}</p>
                </button>
              ))}
            </div>
          </section>

          <section id="marketing" className="rounded-2xl border border-[#e6f1ef] bg-white p-4">
            <Head n="6" title="Marketing va promo-kodlar" sub="Seminarga ko‘proq ishtirokchi jalb qiling" extra={<button type="button" onClick={() => setModal('promo')} className="text-[12.5px] font-semibold text-[#0c8f86]">+ Promo-kod</button>} />
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {form.promos.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-[#e6f1ef] px-3 py-2">
                  <div><p className="text-[13px] font-bold">{p.code} <span className="text-[#0c8f86]">{p.off}</span></p><p className="text-[11px] text-[#8aa0a4]">{p.note}</p></div>
                  <Toggle on={p.on} onChange={(v) => set({ promos: form.promos.map((x) => x.id === p.id ? { ...x, on: v } : x) })} label={p.code} />
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3 text-[13px]">
              <label className="flex items-center justify-between rounded-xl bg-[#f6fbfa] px-3 py-2">Reklama sozlamalari <Toggle on={form.ads} onChange={(v) => set({ ads: v })} label="Reklama" /></label>
              <label className="flex items-center justify-between rounded-xl bg-[#f6fbfa] px-3 py-2">Ijtimoiy tarmoqlar <Toggle on={form.social} onChange={(v) => set({ social: v })} label="Ijtimoiy" /></label>
              <label className="flex items-center justify-between rounded-xl bg-[#f6fbfa] px-3 py-2">Email/Telegram <Toggle on={form.emailing} onChange={(v) => set({ emailing: v })} label="Email" /></label>
            </div>
          </section>

          <section id="review" className="rounded-2xl border border-[#e6f1ef] bg-white p-4">
            <Head n="7" title="Ko‘rib chiqish" sub="E’lon qilishdan oldin ma’lumotlarni tekshiring" />
            <ul className="mt-3 space-y-1 text-[13px] text-[#3e5a62]">
              <li><b>{form.name}</b> · {form.topic} · {form.format}</li>
              <li>{form.start} {form.startTime} — {form.end} {form.endTime}</li>
              <li>{form.place}</li>
              <li>{form.tickets.length} chipta · {form.speakers.length} ma’ruzachi · shablon {form.template}</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Btn kind="soft" onClick={() => go(step - 1)} disabled={step === 0}>Oldingi</Btn>
              <Btn kind="ghost" onClick={() => { setDraft(true); notify('Qoralama saqlandi') }}>Qoralama saqlash</Btn>
              <Btn onClick={publish}>E’lon qilish</Btn>
            </div>
          </section>
        </div>

        <aside className="sticky top-0 space-y-3">
          <div className="rounded-2xl border border-[#e6f1ef] bg-white p-3">
            <div className="mb-2 flex items-center justify-between"><p className="text-[13px] font-bold">Oldindan ko‘rish</p><button type="button" className="text-[12px] text-[#0c8f86]" onClick={() => document.getElementById('info')?.scrollIntoView({ behavior: 'smooth' })}>Tahrirlash</button></div>
            <img src={form.cover} alt="" className="h-28 w-full rounded-xl object-cover" />
            <p className="mt-2 text-[14px] font-bold leading-snug">{form.name}</p>
            <p className="mt-1 flex items-center gap-1 text-[12px] text-[#6e868c]"><Calendar className="size-3.5" /> {form.start} , {form.startTime} – {form.endTime}</p>
            <p className="flex items-center gap-1 text-[12px] text-[#6e868c]"><MapPin className="size-3.5" /> {form.place || 'Manzil kiritilmagan'}</p>
            <div className="mt-2 flex flex-wrap gap-1">{previewTags.map((t) => <Badge key={t} tone="teal">{t}</Badge>)}</div>
            <p className="mt-2 text-[12px] leading-snug text-[#5e787e]">{form.about}</p>
            <p className="mt-3 text-[12.5px] font-bold">Chipta turlari</p>
            <ul className="mt-1 space-y-1 text-[12.5px]">{form.tickets.map((t) => <li key={t.id} className="flex justify-between"><span>{t.name}</span><span>{som(t.price)} · {t.seats} ta</span></li>)}</ul>
            <dl className="mt-3 space-y-1 text-[12px] text-[#5e787e]">
              <div className="flex justify-between"><dt>Format</dt><dd>{form.format}</dd></div>
              <div className="flex justify-between"><dt>Toifa</dt><dd className="text-right">{form.category}</dd></div>
            </dl>
            <div className="mt-3 flex items-center gap-2">
              <img src={ORG.avatar} alt="" className="size-8 rounded-full object-cover" />
              <div><p className="text-[12.5px] font-semibold">{ORG.name}</p><p className="text-[11px] text-[#8aa0a4]">{ORG.brand}</p></div>
            </div>
            <p className="mt-2 text-[12px] text-[#8aa0a4]">Reyting · Yangi seminar</p>
            <p className="mt-2 text-[11px] text-[#8aa0a4]">Seminar e’lon qilingandan so‘ng, uni tahrirlash mumkin bo‘ladi.</p>
          </div>
          <Btn className="w-full" onClick={() => (step === STEPS.length - 1 ? publish() : go(step + 1))}>{step === STEPS.length - 1 ? 'E’lon qilish' : 'Keyingi bosqich →'}</Btn>
          {step > 0 && <Btn kind="soft" className="w-full" onClick={() => go(step - 1)}>Oldingi</Btn>}
          <Btn kind="ghost" className="w-full" onClick={() => { setDraft(true); notify('Qoralama saqlandi') }}>Qoralama saqlash</Btn>
        </aside>
      </div>

      <TicketModal open={modal === 'ticket'} onClose={() => setModal(null)} onSave={(t) => { set({ tickets: [...form.tickets, t] }); setModal(null) }} />
      <SpeakerModal open={modal === 'speaker'} onClose={() => setModal(null)} onSave={(s) => { set({ speakers: [...form.speakers, s] }); setModal(null) }} />
      <PromoModal open={modal === 'promo'} onClose={() => setModal(null)} onSave={(p) => { set({ promos: [...form.promos, p] }); setModal(null); notify('Promo-kod qo‘shildi') }} />
    </div>
  )
}

function Head({ n, title, sub, extra }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h2 className="text-[15px] font-bold">{n}. {title}</h2><p className="text-[12px] text-[#7e9398]">{sub}</p></div>
      {extra}
    </div>
  )
}

function TicketModal({ open, onClose, onSave }) {
  const [f, setF] = useState({ name: 'VIP', price: '850000', seats: '30', note: 'Seminarga kirish, maxsus materiallar, oldingi qator o‘rinlar, kofe-breyk, sertifikat', active: true, color: '#0c8f86' })
  const [err, setErr] = useState({})
  const save = () => {
    const e = {}
    if (!f.name.trim()) e.name = 'Nomni kiriting'
    if (!Number(f.price)) e.price = 'Narxni kiriting'
    if (!Number(f.seats)) e.seats = 'Joylar sonini kiriting'
    setErr(e)
    if (Object.keys(e).length) return
    onSave({ id: `t${Date.now()}`, name: f.name, price: Number(f.price), seats: Number(f.seats), perks: f.note.split(',').map((x) => x.trim()).filter(Boolean), active: f.active, tone: 'teal' })
  }
  return (
    <Modal open={open} title="Yangi chipta turi qo‘shish" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Chipta turi nomi" req error={err.name}><input className={inputCls(err.name)} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Narx" req error={err.price}><div className="flex items-center gap-1"><input className={inputCls(err.price)} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value.replace(/\D/g, '') })} /><span className="text-[12px]">so‘m</span></div></Field>
          <Field label="Joylar soni" req error={err.seats}><input className={inputCls(err.seats)} value={f.seats} onChange={(e) => setF({ ...f, seats: e.target.value.replace(/\D/g, '') })} /></Field>
        </div>
        <Field label="Tavsif" hint={`${f.note.length}/500`}><textarea maxLength={500} className={`${inputCls()} h-20 py-2`} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
        <div className="flex gap-2">{['#0c8f86', '#3b82f6', '#8b5cf6', '#f59e0b', '#e11d48', '#14b8a6'].map((c) => <button key={c} type="button" aria-label={c} onClick={() => setF({ ...f, color: c })} className="size-6 rounded-full" style={{ background: c, outline: f.color === c ? `2px solid ${c}` : '', outlineOffset: 2 }} />)}</div>
        <div className="flex items-center justify-between text-[13px]">Holat · Faol <Toggle on={f.active} onChange={(v) => setF({ ...f, active: v })} label="Faol" /></div>
        <div className="flex justify-end gap-2"><Btn kind="soft" onClick={onClose}>Bekor qilish</Btn><Btn onClick={save}>Saqlash</Btn></div>
      </div>
    </Modal>
  )
}

function SpeakerModal({ open, onClose, onSave }) {
  const [f, setF] = useState({ name: 'Dr. Alisher Karimov', role: 'Implantolog', city: 'Toshkent', bio: '10 yillik tajribaga ega implantolog. Xalqaro seminarlar ishtirokchisi.', avatar: IMG.teeth })
  const [err, setErr] = useState({})
  const save = () => {
    const e = {}
    if (f.name.trim().length < 3) e.name = 'Ism-familiyani kiriting'
    if (!f.role.trim()) e.role = 'Lavozimni kiriting'
    setErr(e)
    if (Object.keys(e).length) return
    onSave({ id: `s${Date.now()}`, ...f })
  }
  return (
    <Modal open={open} title="Ma’ruzachi qo‘shish" onClose={onClose}>
      <div className="space-y-3">
        <label className="grid size-16 cursor-pointer place-items-center overflow-hidden rounded-full bg-[#e7f6f3] text-[11px] text-[#0c8f86]">
          {f.avatar ? <img src={f.avatar} alt="" className="size-full object-cover" /> : 'Rasm'}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setF({ ...f, avatar: URL.createObjectURL(file) }) }} />
        </label>
        <Field label="Ism-familiya" req error={err.name}><input className={inputCls(err.name)} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Lavozim" req error={err.role}><input className={inputCls(err.role)} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} /></Field>
        <Field label="Tavsif" hint={`${f.bio.length}/500`}><textarea maxLength={500} className={`${inputCls()} h-20 py-2`} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></Field>
        <Field label="Shahar"><input className={inputCls()} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></Field>
        <div className="flex justify-end gap-2"><Btn kind="soft" onClick={onClose}>Bekor qilish</Btn><Btn onClick={save}>Saqlash</Btn></div>
      </div>
    </Modal>
  )
}

function PromoModal({ open, onClose, onSave }) {
  const [f, setF] = useState({ code: 'EARLYBIRD', kind: 'foiz', value: '20', from: '2026-11-01', to: '2026-11-15', limit: '100', active: true })
  const [err, setErr] = useState({})
  const save = () => {
    const e = {}
    if (!/^[A-Z0-9]{3,16}$/.test(f.code.trim().toUpperCase())) e.code = 'Kod noto‘g‘ri'
    if (!Number(f.value)) e.value = 'Miqdorni kiriting'
    setErr(e)
    if (Object.keys(e).length) return
    onSave({ id: `p${Date.now()}`, code: f.code.toUpperCase(), off: f.kind === 'foiz' ? `−${f.value}%` : `−${f.value} so‘m`, note: `${f.from} – ${f.to}`, on: f.active })
  }
  return (
    <Modal open={open} title="Promo-kod yaratish" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Promo-kod" req error={err.code}><input className={inputCls(err.code)} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} /></Field>
        <div className="flex gap-3 text-[13px]"><label><input type="radio" checked={f.kind === 'foiz'} onChange={() => setF({ ...f, kind: 'foiz' })} /> Foiz (%)</label><label><input type="radio" checked={f.kind === 'summa'} onChange={() => setF({ ...f, kind: 'summa' })} /> Summa (so‘m)</label></div>
        <Field label="Chegirma miqdori" req error={err.value}><input className={inputCls(err.value)} value={f.value} onChange={(e) => setF({ ...f, value: e.target.value.replace(/\D/g, '') })} /></Field>
        <div className="grid grid-cols-2 gap-2"><input type="date" className={inputCls()} value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /><input type="date" className={inputCls()} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></div>
        <Field label="Foydalanish limiti"><input className={inputCls()} value={f.limit} onChange={(e) => setF({ ...f, limit: e.target.value.replace(/\D/g, '') })} /></Field>
        <div className="flex items-center justify-between text-[13px]">Faol <Toggle on={f.active} onChange={(v) => setF({ ...f, active: v })} label="Faol" /></div>
        <div className="flex justify-end gap-2"><Btn kind="soft" onClick={onClose}>Bekor qilish</Btn><Btn onClick={save}>Saqlash</Btn></div>
      </div>
    </Modal>
  )
}
