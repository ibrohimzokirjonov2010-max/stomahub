import { useEffect, useState } from 'react'
import { FileText, Image as ImageIcon, Plus, RefreshCw, Trash2, Upload } from 'lucide-react'
import { TEAL, box, uploadImage } from './wizardBits'
import { CertFrame } from './certArt'

// Tashkilotchi ustasidagi qo‘shimcha maydonlar: poster, galereya, manzil izohlari,
// FAQ, aloqa va o‘z sertifikat dizayni. Desktop va mobil ustalar bir xil komponentdan foydalanadi.

const area = 'w-full resize-y rounded-xl border border-[#e3eeec] px-3 py-2 text-[13px] leading-snug outline-none placeholder:text-[#9aafb4] focus:border-[var(--color-org-teal)]'
const IMG_RE = /^image\/(png|jpeg|webp)$/

function Lab({ children, hint }) {
  return (
    <span className="mb-1.5 block text-[12.5px] font-medium text-[#1c4a5a]">
      {children}{hint && <span className="ml-1 font-normal text-[#8aa0a4]">{hint}</span>}
    </span>
  )
}

function useUpload(notify) {
  const [busy, setBusy] = useState(false)
  const run = async (file, folder, onOk, accept = IMG_RE, badText = 'Faqat JPG, PNG yoki WEBP rasm') => {
    if (!file) return
    if (!accept.test(file.type)) { notify?.(badText); return }
    setBusy(true)
    try { onOk(await uploadImage(file, folder), file) } catch (e) { notify?.(e?.message || 'Yuklab bo‘lmadi') } finally { setBusy(false) }
  }
  return [busy, run]
}

// Rasm o‘lchamini o‘qib, tavsiya etilgan nisbatdan chetlanishni aytadi
function useRatio(src) {
  const [r, setR] = useState(null)
  useEffect(() => {
    if (!src) { setR(null); return }
    const img = new Image()
    img.onload = () => setR({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = src
  }, [src])
  return r
}

/** Sahifa tepasidagi poster (muqova). Tavsiya: 16:9, kamida 1920×1080. */
export function PosterField({ form, set, notify, compact = false }) {
  const [busy, run] = useUpload(notify)
  const size = useRatio(form.cover)
  const ratio = size ? size.w / size.h : 0
  const warn = size && (Math.abs(ratio - 16 / 9) > 0.12 || size.w < 1280)
  const pick = (e) => run(e.target.files?.[0], 'seminars', (src) => set({ cover: src, thumbs: [src, ...(form.thumbs || []).filter((x) => x !== src)].slice(0, 4) }))
  return (
    <div data-shot="poster">
      <Lab hint="(seminar sahifasining eng tepasida ko‘rinadi)">Seminar posteri</Lab>
      {form.cover ? (
        <div className={`grid gap-3 ${compact ? '' : 'sm:grid-cols-[minmax(0,1fr)_150px]'}`}>
          <div>
            <div className="relative aspect-video overflow-hidden rounded-xl bg-[#0b4f55]">
              <img src={form.cover} alt="Seminar posteri" className="size-full object-cover" />
              {/* Kesish ko‘rsatkichlari: kompyuter va telefon kadrlari */}
              <span className="pointer-events-none absolute inset-y-0 right-0 w-[58%] border-2 border-dashed border-white/85" />
              <span className="pointer-events-none absolute right-1 top-1 rounded bg-white/90 px-1.5 text-[10px] font-semibold text-[#143044]">Kompyuter kadri</span>
              <span className="pointer-events-none absolute inset-y-0 left-1/2 w-[34%] -translate-x-1/2 border-2 border-dotted border-[#f5b400]" />
              <span className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-[#f5b400] px-1.5 text-[10px] font-semibold text-[#143044]">Telefon kadri</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-[#d7ebe6] bg-white px-2.5 text-[12px] font-semibold" style={{ color: TEAL }}>
                <RefreshCw className="size-3.5" /> {busy ? 'Yuklanmoqda…' : 'Almashtirish'}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pick} />
              </label>
              <button type="button" onClick={() => set({ cover: '' })} className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[12px] font-semibold text-[#e11d48] hover:bg-[#fff5f7]"><Trash2 className="size-3.5" /> O‘chirish</button>
              {size && <span className={`text-[11px] ${warn ? 'text-[#c2410c]' : 'text-[#5e787e]'}`}>{size.w}×{size.h}{warn ? ' — 16:9 nisbatda, kamida 1920×1080 tavsiya etiladi' : ' — mos'}</span>}
            </div>
          </div>
          <p className="text-[11px] leading-snug text-[#7e9398]">Tavsiya: 16:9 nisbat, 1920×1080 piksel. Muhim matn va yuzlarni markazga joylang — telefonda chetlari qirqiladi, kompyuterda poster o‘ng tomonda ko‘rinadi.</p>
        </div>
      ) : (
        <label className="grid aspect-video max-h-[180px] w-full cursor-pointer place-items-center rounded-xl border border-dashed border-[#cfe0dc] bg-[#f7fbfb] text-center">
          <span>
            <ImageIcon className="mx-auto size-6" style={{ color: TEAL }} />
            <span className="mt-1 block text-[13px] font-semibold text-[#143044]">{busy ? 'Yuklanmoqda…' : 'Poster yuklash'}</span>
            <span className="mt-0.5 block text-[11px] text-[#8aa0a4]">JPG, PNG yoki WEBP · 16:9 · kamida 1920×1080</span>
          </span>
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pick} />
        </label>
      )}
    </div>
  )
}

/** Galereya — sahifadagi rasm to‘plami (8 tagacha). */
export function GalleryField({ form, set, notify }) {
  const [busy, run] = useUpload(notify)
  const list = form.gallery || []
  return (
    <div data-shot="gallery">
      <Lab hint="(8 tagacha rasm, sahifada poster ostida chiqadi)">Galereya</Lab>
      <div className="flex flex-wrap gap-2">
        {list.map((src) => (
          <span key={src} className="relative h-16 w-24 overflow-hidden rounded-lg bg-[#f4fbfa]">
            <img src={src} alt="" className="size-full object-cover" />
            <button type="button" aria-label="Rasmni o‘chirish" onClick={() => set({ gallery: list.filter((x) => x !== src) })} className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-white text-[#e11d48] shadow"><Trash2 className="size-3" /></button>
          </span>
        ))}
        {list.length < 8 && (
          <label className="grid h-16 w-24 cursor-pointer place-items-center rounded-lg border border-dashed border-[#cfe0dc] bg-[#f7fbfb] text-[11px] font-semibold" style={{ color: TEAL }}>
            <span className="flex flex-col items-center"><Plus className="size-4" />{busy ? 'Yuklanmoqda…' : 'Rasm qo‘shish'}</span>
            <input type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => {
              const files = [...(e.target.files || [])].slice(0, 8 - list.length)
              let acc = list
              files.forEach((f) => run(f, 'seminars', (src) => { acc = [...acc, src].slice(0, 8); set({ gallery: acc }) }))
            }} />
          </label>
        )}
      </div>
    </div>
  )
}

/** Manzil izohlari (zal, avtoturargoh, metro) — har qatorda bittadan. */
export function VenueNotesField({ form, set }) {
  return (
    <label className="block">
      <Lab hint="(har qatorda bittadan: zal, avtoturargoh, metro)">Manzil bo‘yicha izohlar</Lab>
      <textarea rows={3} value={form.venueNotes || ''} onChange={(e) => set({ venueNotes: e.target.value })} className={area} placeholder={'Konferens-zal, 3-qavat\nAvtoturargoh bor\nMetro: Amir Temur xiyoboni'} />
    </label>
  )
}

/** Tez-tez so‘raladigan savollar. */
export function FaqField({ form, set }) {
  const list = form.faq || []
  const setRow = (i, patch) => set({ faq: list.map((r, j) => (j === i ? { ...r, ...patch } : r)) })
  return (
    <div data-shot="faq">
      <Lab hint="(bo‘sh qolsa sahifada ko‘rinmaydi)">Tez-tez so‘raladigan savollar</Lab>
      <div className="space-y-2">
        {list.map((r, i) => (
          <div key={i} className="rounded-xl border border-[#e7f0ee] p-2">
            <div className="flex gap-1.5">
              <input aria-label="Savol" placeholder="Savol" value={r.q || ''} onChange={(e) => setRow(i, { q: e.target.value })} className={`${box} min-w-0 flex-1`} />
              <button type="button" aria-label="Savolni o‘chirish" onClick={() => set({ faq: list.filter((_, j) => j !== i) })} className="grid size-10 shrink-0 place-items-center rounded-xl text-[#e11d48] hover:bg-[#fff5f7]"><Trash2 className="size-4" /></button>
            </div>
            <textarea aria-label="Javob" rows={2} placeholder="Javob" value={r.a || ''} onChange={(e) => setRow(i, { a: e.target.value })} className={`${area} mt-1.5`} />
          </div>
        ))}
        <button type="button" onClick={() => set({ faq: [...list, { q: '', a: '' }] })} className="inline-flex items-center gap-1 text-[12.5px] font-semibold" style={{ color: TEAL }}>
          <Plus className="size-4" /> Savol qo‘shish
        </button>
      </div>
    </div>
  )
}

/** Tashkilotchining shu seminar bo‘yicha aloqa ma’lumotlari. */
export function ContactField({ form, set, compact = false }) {
  return (
    <div className={`grid gap-3 ${compact ? '' : 'sm:grid-cols-2'}`}>
      <label className="block"><Lab hint="(ixtiyoriy)">Savollar uchun telefon</Lab><input className={box} inputMode="tel" placeholder="+998 90 123 45 67" value={form.contactPhone || ''} onChange={(e) => set({ contactPhone: e.target.value })} /></label>
      <label className="block"><Lab hint="(ixtiyoriy)">Telegram</Lab><input className={box} placeholder="@tashkilotchi" value={form.contactTelegram || ''} onChange={(e) => set({ contactTelegram: e.target.value })} /></label>
    </div>
  )
}

// PDF ning birinchi sahifasini rasmga aylantirish (faqat oldindan ko‘rish uchun)
const pdfCache = new Map()
export async function pdfFirstPage(url) {
  if (pdfCache.has(url)) return pdfCache.get(url)
  const pdfjs = await import('pdfjs-dist')
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const doc = await pdfjs.getDocument({ url }).promise
  const page = await doc.getPage(1)
  const vp = page.getViewport({ scale: 1.5 })
  const canvas = document.createElement('canvas')
  canvas.width = vp.width
  canvas.height = vp.height
  await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
  const out = canvas.toDataURL('image/png')
  pdfCache.set(url, out)
  return out
}

export function useCertBackground(design) {
  const [bg, setBg] = useState('')
  useEffect(() => {
    let alive = true
    if (!design?.url) { setBg(''); return undefined }
    if (design.kind !== 'pdf') { setBg(design.url); return undefined }
    setBg('')
    pdfFirstPage(design.url).then((src) => { if (alive) setBg(src) }, () => { if (alive) setBg('') })
    return () => { alive = false }
  }, [design?.url, design?.kind])
  return bg
}

export const cmeText = (form) => [form.cmeHours && `${form.cmeHours} soat`, form.cmePoints && `${form.cmePoints} CME ball`].filter(Boolean).join(' · ')

/** “O‘z dizaynini yuklash”: rasm yoki PDF, jonli namunaviy ko‘rinish bilan. */
export function CertUpload({ form, set, notify, orgName = '', dateText = '' }) {
  const [busy, run] = useUpload(notify)
  const design = form.certDesign || null
  const bg = useCertBackground(design)
  const pick = (e) => run(
    e.target.files?.[0], 'certificates',
    (url, file) => set({ certDesign: { url, kind: file.type === 'application/pdf' ? 'pdf' : 'image', name: file.name }, template: 'custom' }),
    /^(image\/(png|jpeg|webp)|application\/pdf)$/,
    'Faqat JPG, PNG, WEBP yoki PDF',
  )
  return (
    <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]" data-shot="cert">
      <div>
        {design ? (
          <div className="rounded-xl border border-[#e6f1ef] p-3">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#143044]"><FileText className="size-4" style={{ color: TEAL }} /> <span className="truncate">{design.name || 'Dizayn fayli'}</span></p>
            <p className="mt-0.5 text-[11.5px] text-[#7e9398]">{design.kind === 'pdf' ? 'PDF — birinchi sahifa fon sifatida ishlatiladi' : 'Rasm fon sifatida ishlatiladi'}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-[#d7ebe6] bg-white px-2.5 text-[12px] font-semibold" style={{ color: TEAL }}>
                <RefreshCw className="size-3.5" /> {busy ? 'Yuklanmoqda…' : 'Almashtirish'}
                <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={pick} />
              </label>
              <button type="button" onClick={() => set({ certDesign: null, template: form.template === 'custom' ? 'teal' : form.template })} className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[12px] font-semibold text-[#e11d48] hover:bg-[#fff5f7]"><Trash2 className="size-3.5" /> O‘chirish</button>
            </div>
          </div>
        ) : (
          <label className="grid h-32 cursor-pointer place-items-center rounded-xl border border-dashed border-[#cfe0dc] bg-[#f7fbfb] text-center">
            <span>
              <Upload className="mx-auto size-5" style={{ color: TEAL }} />
              <span className="mt-1 block text-[13px] font-semibold text-[#143044]">{busy ? 'Yuklanmoqda…' : 'Dizayn faylini yuklash'}</span>
              <span className="mt-0.5 block text-[11px] text-[#8aa0a4]">JPG, PNG, WEBP yoki PDF · tik (portret) A4 · 10 MB gacha</span>
            </span>
            <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={pick} />
          </label>
        )}
        <p className="mt-2 text-[11.5px] leading-snug text-[#7e9398]">Ishtirokchi ismi, seminar nomi, sana va CME soatlari dizayn ustiga avtomatik joylanadi. Markaziy qismni bo‘sh qoldiring.</p>
      </div>
      <div>
        <p className="mb-1.5 text-[12px] font-semibold text-[#1c4a5a]">Namunaviy ko‘rinish</p>
        {design
          ? (bg ? <CertFrame width={240} design={bg} name="Aliyeva Mohira" course={form.name || 'Seminar nomi'} date={dateText || '—'} cme={cmeText(form)} org={orgName} />
            : <div className="grid h-[321px] w-[240px] place-items-center rounded-lg bg-[#f4fbfa] text-[12px] text-[#8aa0a4]">Ko‘rinish tayyorlanmoqda…</div>)
          : <div className="grid h-[321px] w-[240px] place-items-center rounded-lg border border-dashed border-[#e3eeec] text-center text-[12px] text-[#8aa0a4]">Dizayn yuklangach,<br />shu yerda ko‘rinadi</div>}
      </div>
    </div>
  )
}

/** Zal (manzil) rasmi — sahifadagi “Manzil” bo‘limida chiqadi. */
export function PlaceImgField({ form, set, notify }) {
  const [busy, run] = useUpload(notify)
  return (
    <div>
      <Lab hint="(ixtiyoriy)">Zal yoki bino rasmi</Lab>
      <div className="flex items-center gap-2">
        {form.placeImg && <img src={form.placeImg} alt="" className="h-14 w-20 rounded-lg object-cover" />}
        <label className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-lg border border-[#d7ebe6] bg-white px-2.5 text-[12.5px] font-semibold" style={{ color: TEAL }}>
          <Upload className="size-3.5" /> {busy ? 'Yuklanmoqda…' : form.placeImg ? 'Almashtirish' : 'Rasm yuklash'}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => run(e.target.files?.[0], 'seminars', (src) => set({ placeImg: src }))} />
        </label>
        {form.placeImg && <button type="button" onClick={() => set({ placeImg: '' })} className="text-[12px] font-semibold text-[#e11d48]">O‘chirish</button>}
      </div>
    </div>
  )
}
