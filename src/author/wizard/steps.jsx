import { useRef, useState } from 'react'
import { Award, CheckCircle2, ImagePlus, Loader2, PlayCircle, Sparkles, Target, Trash2, UserRound } from 'lucide-react'
import { directions } from '../../educationData'
import { uploadImage } from '../../organizer/pages/wizardBits'
import { Certificate } from '../../pages/Sertifikatlar'
import { certFromRow } from '../../sertifikatData'
import { formatDuration, hoursNumber } from '../../courseRules'
import { Cover, cx, input, som } from '../ui'
import { Area, Card, Choice, Field, ListEditor, Text, Toggle } from './fields'
import { lessonCount, totalDuration } from './model'

const DIRS = directions.filter(([k]) => k !== 'all')

export function StepBasics({ course, patch, onError, shot }) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const onCover = async (file) => {
    if (!file) return
    if (!/^image\//.test(file.type)) { onError('Muqova uchun rasm tanlang (JPG yoki PNG)'); return }
    setBusy(true)
    try {
      const url = shot ? URL.createObjectURL(file) : await uploadImage(file, 'courses')
      patch({ coverUrl: url })
    } catch (e) {
      onError(e.message || 'Muqova yuklanmadi')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <Card title="Kurs haqida" sub="Bu ma’lumotlar katalog kartasi va kurs sahifasida chiqadi">
          <div className="space-y-4">
            <Field label="Kurs nomi" counter={`${course.title.length}/140`} hint="Aniq va qisqa: nima o‘rgatilishini ayting">
              <Text value={course.title} onChange={(v) => patch({ title: v })} max={140} placeholder="Masalan: Zamonaviy endodontiya: kanalni kengaytirish" />
            </Field>
            <Field label="Qisqa tavsif" counter={`${course.subtitle.length}/220`} hint="Kurs nomi ostida bitta jumla">
              <Text value={course.subtitle} onChange={(v) => patch({ subtitle: v })} max={220} placeholder="Rotatsion fayllar, irrigatsiya va obturatsiya — klinik holatlar bilan" />
            </Field>
            <Field label="To‘liq tavsif" counter={`${course.description.length}/5000`}>
              <Area value={course.description} onChange={(v) => patch({ description: v })} max={5000} rows={7} placeholder="Kurs kimga va nima uchun kerak, qanday natija beradi, qanday amaliy holatlar ko‘rib chiqiladi…" />
            </Field>
          </div>
        </Card>
        <Card title="Yo‘nalish va format">
          <div className="space-y-5">
            <Field label="Kategoriya">
              <select value={course.direction} onChange={(e) => patch({ direction: e.target.value })} className={input}>
                {DIRS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Field>
            <Field label="Daraja">
              <Choice value={course.level} onChange={(v) => patch({ level: v })} cols="grid-cols-3" items={[['bosh', 'Boshlang‘ich', 'Asoslar'], ['orta', 'O‘rta', 'Amaliyotchi'], ['ekspert', 'Ekspert', 'Murakkab holatlar']]} />
            </Field>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Format">
                <Choice value={course.format === 'video' ? 'kurs' : course.format} onChange={(v) => patch({ format: v })} cols="grid-cols-2" items={[['kurs', 'Kurs', 'Video darslar'], ['vebinar', 'Vebinar', 'Yozib olingan efir']]} />
              </Field>
              <Field label="Til">
                <Choice value={course.language} onChange={(v) => patch({ language: v })} cols="grid-cols-3" items={[['uz', 'O‘zbek'], ['ru', 'Rus'], ['en', 'Ingliz']]} />
              </Field>
            </div>
          </div>
        </Card>
      </div>
      <div className="space-y-4">
        <Card title="Muqova" sub="16:9, kamida 1280×720. JPG yoki PNG, 10 MB gacha">
          <button type="button" onClick={() => fileRef.current?.click()} className="group relative block w-full overflow-hidden rounded-xl border border-dashed border-[#C9D8DC] bg-[#F7FAFB]">
            {course.coverUrl ? (
              <>
                <Cover src={course.coverUrl} className="aspect-video w-full" />
                <span className="absolute inset-0 grid place-items-center bg-[#0B1F3A]/0 text-[13px] font-semibold text-white opacity-0 transition group-hover:bg-[#0B1F3A]/45 group-hover:opacity-100">Almashtirish</span>
              </>
            ) : (
              <span className="flex aspect-video w-full flex-col items-center justify-center gap-2 text-[#5B6F7E]">
                {busy ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-7 text-[#0F766E]" />}
                <span className="text-[13px] font-semibold">{busy ? 'Yuklanmoqda…' : 'Muqova yuklash'}</span>
              </span>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { onCover(e.target.files?.[0]); e.target.value = '' }} />
          {course.coverUrl && <button type="button" onClick={() => patch({ coverUrl: '' })} className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-[12.5px] font-semibold text-[#B42318]"><Trash2 className="size-3.5" /> Olib tashlash</button>}
        </Card>
        <Card title="Treyler" sub="Ixtiyoriy. 1–2 daqiqalik tanishtiruv videosi havolasi">
          <Field hint="https:// bilan boshlanadigan havola (YouTube, Bunny va h.k.)">
            <Text value={course.trailerUrl} onChange={(v) => patch({ trailerUrl: v.trim() })} max={500} placeholder="https://…" inputMode="url" />
          </Field>
          {course.trailerUrl && !/^https:\/\//.test(course.trailerUrl) && <p className="mt-2 text-[12px] text-[#B42318]">Havola https:// bilan boshlansin</p>}
        </Card>
      </div>
    </div>
  )
}

export function StepAudience({ course, patch }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card title="Nimalarni o‘rganasiz" sub="3–12 ta aniq natija. Har biri «… qila olasiz» ma’nosida bo‘lsin">
        <ListEditor items={course.learnPoints} onChange={(v) => patch({ learnPoints: v })} max={12} icon={Target}
          placeholder={(i) => ['Kanal anatomiyasini rentgenda o‘qish', 'Crown-down protokolini xavfsiz qo‘llash', 'Irrigatsiya ketma-ketligini tanlash'][i] || 'Yana bir natija'} />
      </Card>
      <Card title="Kimlar uchun" sub="Kursdan eng ko‘p foyda oladigan tinglovchilar">
        <ListEditor items={course.audience} onChange={(v) => patch({ audience: v })} max={8} icon={UserRound} addLabel="Auditoriya qo‘shish"
          placeholder={(i) => ['Endodontiyani o‘zlashtirayotgan terapevtlar', 'Ordinatorlar va yosh shifokorlar'][i] || 'Yana bir guruh'} />
      </Card>
    </div>
  )
}

export function StepPricing({ course, patch }) {
  const price = Number(course.price) || 0
  const disc = Number(course.discountPrice) || 0
  const pct = price && disc && disc < price ? Math.round((1 - disc / price) * 100) : 0
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <Card title="Kurs turi">
          <Choice value={course.paid ? 'paid' : 'free'} onChange={(v) => patch({ paid: v === 'paid' })} cols="grid-cols-2"
            items={[['free', 'Bepul', 'Yozilgan har kim darhol ko‘radi'], ['paid', 'Pullik', 'To‘lovdan keyin darslar ochiladi']]} />
        </Card>
        {course.paid && (
          <Card title="Narx">
            <div className="space-y-4">
              <Field label="Narx (so‘m)" hint={price ? som(price) : 'Masalan: 450 000'}>
                <Text value={price ? String(price) : ''} onChange={(v) => patch({ price: Number(v.replace(/\D/g, '').slice(0, 9)) || 0 })} inputMode="numeric" placeholder="450000" />
              </Field>
              <div className="rounded-xl border border-[#E4ECEE] p-3">
                <Toggle on={course.discountOn} onChange={(v) => patch({ discountOn: v })} label="Chegirma" sub="Katalogda eski narx chizilgan holda ko‘rinadi" />
                {course.discountOn && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="Chegirmali narx" error={disc && price && disc >= price ? 'Asl narxdan kam bo‘lsin' : ''} hint={pct ? `−${pct}%` : ''}>
                      <Text value={course.discountPrice} onChange={(v) => patch({ discountPrice: v.replace(/\D/g, '').slice(0, 9) })} inputMode="numeric" placeholder="360000" />
                    </Field>
                    <Field label="Amal qilish muddati" hint="Bo‘sh — muddatsiz">
                      <input type="date" value={course.discountUntil} onChange={(e) => patch({ discountUntil: e.target.value })} className={input} />
                    </Field>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
        <p className="flex items-start gap-2 rounded-xl border border-[#F8DFAE] bg-[#FFFAF0] px-3.5 py-3 text-[12.5px] leading-snug text-[#7A4B00]">
          <Sparkles className="mt-0.5 size-4 shrink-0" /> Click va Payme hali ulanmagan. Pullik kursga yozilganlar «To‘lov kutilmoqda» holatida turadi — to‘lovni qabul qilib, «To‘lovlar» bo‘limida belgilaysiz.
        </p>
      </div>
      <Card title="Katalogda shunday ko‘rinadi">
        <Cover src={course.coverUrl} className="aspect-video w-full rounded-xl" />
        <p className="mt-3 line-clamp-2 text-[15px] font-bold text-[#0B1F3A]">{course.title || 'Kurs nomi'}</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          {!course.paid ? <span className="text-[20px] font-extrabold text-[#0F766E]">Bepul</span> : course.discountOn && pct ? (
            <><span className="text-[20px] font-extrabold text-[#0B1F3A]">{som(disc)}</span><span className="text-[13px] text-[#8A9AA8] line-through">{som(price)}</span><span className="rounded-full bg-[#FFF1E6] px-2 py-0.5 text-[11.5px] font-bold text-[#C2410C]">−{pct}%</span></>
          ) : <span className="text-[20px] font-extrabold text-[#0B1F3A]">{price ? som(price) : '— so‘m'}</span>}
        </div>
      </Card>
    </div>
  )
}

export function StepCertificate({ course, modules, patch, authorName }) {
  const hours = hoursNumber(totalDuration(modules))
  const sample = certFromRow({ id: 'namuna', title: course.title || 'Kurs nomi', kind: 'online', hours, speaker: authorName, holderName: 'O‘quvchi ismi', scorePct: Math.max(Number(course.certificateMinScore) || 0, 92), code: 'SH-KURS-NAMUNA', courseId: 'course:namuna', issuedAt: new Date().toISOString() })
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="space-y-4">
        <Card>
          <Toggle on={course.certificateEnabled} onChange={(v) => patch({ certificateEnabled: v })} label="Sertifikat berilsin" sub="Kursni yakunlaganlarga StomaHub onlayn sertifikati (QR kod bilan tekshiriladi)" />
        </Card>
        {course.certificateEnabled && (
          <Card title="Berilish sharti">
            <ul className="space-y-2.5 text-[13.5px] text-[#22384A]">
              <li className="flex items-start gap-2.5"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#0F766E]" />Barcha {lessonCount(modules)} ta dars ko‘rilgan va testlari topshirilgan</li>
              <li className="flex items-start gap-2.5"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#0F766E]" />Darslar ketma-ket ochiladi: test topshirilmaguncha keyingisi yopiq</li>
            </ul>
            <div className="mt-5">
              <p className="mb-2 text-[13px] font-semibold text-[#22384A]">O‘rtacha test bali kamida</p>
              <Choice value={String(course.certificateMinScore || 0)} onChange={(v) => patch({ certificateMinScore: Number(v) })} cols="grid-cols-4"
                items={[['0', 'Shartsiz'], ['70', '70%'], ['80', '80%'], ['90', '90%']]} />
            </div>
            {!!hours && <p className="mt-4 text-[12.5px] text-[#6B7F8D]">Sertifikatda: {hours} soat · {formatDuration(totalDuration(modules))}</p>}
          </Card>
        )}
      </div>
      <Card title="Namuna" sub="O‘quvchi ismi va sana avtomatik qo‘yiladi">
        <div className={cx('relative overflow-hidden rounded-xl ring-1 ring-[#E4ECEE]', !course.certificateEnabled && 'opacity-40 grayscale')}>
          <Certificate c={sample} big />
          {!course.certificateEnabled && <span className="absolute inset-0 grid place-items-center"><span className="rounded-lg bg-white px-3 py-1.5 text-[13px] font-bold text-[#5B6F7E] shadow">Sertifikat o‘chirilgan</span></span>}
        </div>
        <p className="mt-3 flex items-center gap-2 text-[12.5px] text-[#6B7F8D]"><Award className="size-4 text-[#0F766E]" /> Sertifikat o‘quvchining «Sertifikatlarim» bo‘limiga tushadi</p>
      </Card>
    </div>
  )
}

export function VideoBadge({ lesson }) {
  if (lesson.uploadPct > 0 && lesson.uploadPct < 100) return <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#0F766E]"><Loader2 className="size-3 animate-spin" />{lesson.uploadPct}%</span>
  if (lesson.encodingStatus === 'finished') return <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#0B6B5F]"><PlayCircle className="size-3.5" />{formatDuration(lesson.durationSeconds) || 'Tayyor'}</span>
  if (['processing', 'uploading', 'created'].includes(lesson.encodingStatus) && lesson.bunnyVideoId) return <span className="text-[11.5px] font-semibold text-[#9A5B00]">Qayta ishlanmoqda</span>
  if (lesson.encodingStatus === 'failed') return <span className="text-[11.5px] font-semibold text-[#B42318]">Video xatosi</span>
  return <span className="text-[11.5px] text-[#98A8B3]">Video yo‘q</span>
}
