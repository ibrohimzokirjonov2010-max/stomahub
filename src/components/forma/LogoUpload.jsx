import { useEffect, useRef, useState } from 'react'
import { ImageUp, RefreshCw, Trash2, Loader2, CircleAlert } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { getSession } from '../../sessionStore'
import { LOGO_BUCKET, LOGO_ACCEPT, LOGO_MAX_MB, logoFileError, logoType, logoPath, fmtSize } from '../../lib/formaLogo'

/**
 * Logo yuklash (Forma → logo tikish). value: { path, name, size, preview } | null.
 * Haqiqiy mahsulotda fayl Supabase Storage’ga yuklanadi (faqat o‘z papkasiga); namuna (demo)da faqat
 * ko‘rinish uchun mahalliy ko‘rinish (preview) — hech narsa yuklanmaydi.
 */
export default function LogoUpload({ value, onChange, demo = false }) {
  const ref = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => () => { if (value?.preview?.startsWith('blob:')) URL.revokeObjectURL(value.preview) }, [value?.preview])
  // Avval yuklangan (savatda saqlangan) logo — ko‘rinish uchun vaqtinchalik imzolangan havola (faqat egasi o‘qiy oladi)
  const [signed, setSigned] = useState('')
  useEffect(() => {
    if (!value?.path || value.preview || value.path.startsWith('/') || !supabase) return
    let off = false
    supabase.storage.from(LOGO_BUCKET).createSignedUrl(value.path, 3600).then(({ data }) => { if (!off) setSigned(data?.signedUrl || '') }, () => {})
    return () => { off = true }
  }, [value?.path, value?.preview])
  // DEV namuna (/forma-shot, skrinshotlar): '/...' yo‘li to‘g‘ridan-to‘g‘ri ko‘rsatiladi
  const devPath = import.meta.env.DEV && value?.path?.startsWith('/') ? value.path : ''
  const shown = value?.preview || devPath || signed

  async function pick(file) {
    setErr('')
    const bad = logoFileError(file)
    if (bad) { setErr(bad); return }
    const preview = URL.createObjectURL(file)
    if (demo) { onChange({ path: '', name: file.name, size: file.size, preview }); return }
    const uid = getSession().user?.id
    if (!supabase || !uid) { URL.revokeObjectURL(preview); setErr('Logo yuklash uchun hisobingizga kiring'); return }
    setBusy(true)
    const path = logoPath(uid, file)
    const { error } = await supabase.storage.from(LOGO_BUCKET).upload(path, file, { contentType: logoType(file), upsert: false, cacheControl: '3600' })
    setBusy(false)
    if (error) { URL.revokeObjectURL(preview); setErr('Logoni yuklab bo‘lmadi. Qayta urinib ko‘ring'); return }
    const old = value?.path
    onChange({ path, name: file.name, size: file.size, preview })
    // Eski (hali buyurtmaga biriktirilmagan) faylni o‘chiramiz; biriktirilgan bo‘lsa RLS ruxsat bermaydi
    if (old && old !== path) supabase.storage.from(LOGO_BUCKET).remove([old]).catch(() => {})
  }
  function clear() {
    const old = value?.path
    onChange(null)
    setErr('')
    if (old && supabase) supabase.storage.from(LOGO_BUCKET).remove([old]).catch(() => {})
  }

  return (
    <div data-testid="logo-upload">
      <input ref={ref} type="file" accept={LOGO_ACCEPT} hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) pick(f) }} />
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-2.5">
          <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-[#f6f8fa] p-1">
            {shown ? <img src={shown} alt="Yuklangan logo" className="max-h-full max-w-full object-contain" /> : <ImageUp className="size-5 text-muted" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-ink">{value.name || 'Logo fayli'}</span>
            <span className="block text-[11px] text-muted">{value.size ? `${fmtSize(value.size)} · ` : ''}{demo ? 'namuna — yuklanmaydi' : 'yuklandi'}</span>
          </span>
          <button type="button" onClick={() => ref.current?.click()} disabled={busy} aria-label="Logoni almashtirish" className="grid size-9 shrink-0 place-items-center rounded-lg border border-line text-ink disabled:opacity-40">{busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}</button>
          <button type="button" onClick={clear} disabled={busy} aria-label="Logoni o‘chirish" className="grid size-9 shrink-0 place-items-center rounded-lg border border-line text-sale disabled:opacity-40"><Trash2 className="size-4" /></button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} disabled={busy}
          className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#99D5CE] bg-[#F0FDFA] py-3.5 text-center disabled:opacity-60">
          {busy ? <Loader2 className="size-6 animate-spin text-sea" /> : <ImageUp className="size-6 text-sea" />}
          <span className="mt-1 text-[13.5px] font-semibold text-sea">{busy ? 'Yuklanmoqda…' : 'Logo faylini yuklang'}</span>
          <span className="text-[11px] text-muted">PNG, JPG, WEBP yoki SVG · {LOGO_MAX_MB} MB gacha</span>
        </button>
      )}
      {err && <p role="alert" className="mt-1.5 flex items-center gap-1 text-[11.5px] font-medium text-sale"><CircleAlert className="size-3.5 shrink-0" />{err}</p>}
    </div>
  )
}
