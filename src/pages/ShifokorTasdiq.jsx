import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BadgeCheck } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useSession } from '../sessionStore'
import { useProfile } from '../profileStore'

const LIC = {
  none: ['Tasdiqlanmagan', '#5C6E80'], pending: ['Tekshiruvda', '#B45309'],
  approved: ['Tasdiqlangan shifokor', '#0F766E'], rejected: ['Rad etilgan', '#b42318'],
}

// Shifokor litsenziyasini tasdiqlash (mobil va kompyuter uchun bitta sahifa).
export default function ShifokorTasdiq() {
  const session = useSession()
  const profile = useProfile()
  const uid = session.user?.id
  const [st, setSt] = useState(null)
  const [lic, setLic] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  useEffect(() => { if (profile?.license && !lic) setLic(profile.license) }, [profile?.license]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!uid || !supabase) return
    supabase.from('profiles').select('license_status,doctor_verified,license_reject_reason').eq('id', uid).maybeSingle()
      .then(({ data, error }) => setSt(error ? { unavailable: true } : (data || {})))
  }, [uid])
  const status = st?.doctor_verified ? 'approved' : (st?.license_status || 'none')
  async function submit(e) {
    e.preventDefault()
    setMsg('')
    if (lic.trim().length < 3) { setMsg('Litsenziya raqamini kiriting.'); return }
    setBusy(true)
    const { error } = await supabase.rpc('submit_doctor_license', { p_license: lic.trim(), p_doc: null })
    setBusy(false)
    if (error) setMsg('Yuborib bo‘lmadi. Keyinroq qayta urinib ko‘ring.')
    else { setSt({ ...st, license_status: 'pending' }); setMsg('Ariza yuborildi — admin tekshiradi.') }
  }
  return (
    <div className="mx-auto w-full max-w-[560px] px-4 pb-[120px] pt-[calc(var(--safe-top,0px)+16px)]">
      <Link to="/profil" className="inline-flex items-center gap-1 text-[13px] text-[#0F766E]"><ArrowLeft className="size-4" /> Profil</Link>
      <h1 className="mt-3 flex items-center gap-2 text-[20px] font-bold text-[#12263a]"><BadgeCheck className="size-6 text-[#0F766E]" /> Shifokor sifatida tasdiqlash</h1>
      <p className="mt-1 text-[13px] text-[#5C6E80]">Retsept bilan sotiladigan va klinik mahsulotlarni (masalan, 35% oqartirish geli) faqat litsenziyasi tasdiqlangan shifokorlar buyurtma qila oladi.</p>
      {!uid ? (
        <Link to={`/kirish?next=${encodeURIComponent('/profil/shifokor')}`} className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#0F766E] px-4 text-[13px] font-semibold text-white">Hisobga kirish</Link>
      ) : st?.unavailable ? (
        <p className="mt-4 text-[13px] text-[#5C6E80]">Tasdiqlash xizmati vaqtincha ishlamayapti.</p>
      ) : (
        <form onSubmit={submit} className="mt-4 rounded-2xl border border-[#E6EEF0] bg-white p-4">
          <p className="text-[13px] font-semibold">Holat: <span style={{ color: LIC[status][1] }}>{LIC[status][0]}</span></p>
          {status === 'rejected' && st?.license_reject_reason && <p className="mt-1 text-[12.5px] text-[#b42318]">Sabab: {st.license_reject_reason}</p>}
          {(status === 'none' || status === 'rejected') && (
            <>
              <label className="mt-3 block text-[12.5px] font-semibold">Litsenziya raqami
                <input value={lic} onChange={(e) => setLic(e.target.value)} inputMode="text" className="mt-1 h-11 w-full rounded-xl border border-[#dbe5ee] px-3 text-[16px] outline-none focus:border-[#0F766E]" placeholder="012345" />
              </label>
              <button disabled={busy} className="mt-3 h-11 w-full rounded-xl bg-[#0F766E] text-[14px] font-semibold text-white disabled:opacity-60">{busy ? 'Yuborilmoqda…' : 'Tekshiruvga yuborish'}</button>
            </>
          )}
          {msg && <p role="status" className="mt-2 text-[12.5px]">{msg}</p>}
        </form>
      )}
    </div>
  )
}
