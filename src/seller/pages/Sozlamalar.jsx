import { useEffect, useRef, useState } from 'react'
import MapPicker, { MapPreview, parseGeo, withGeo } from '../../components/MapPicker'
import { useSearchParams, useNavigate } from 'react-router'
import { Save, Store, Phone, MapPin, Clock, CalendarDays, Upload, UserPlus, Plus, Pencil, Trash2, Eye, Users, Building2, Bell, Lock, ShieldCheck, Globe, UserRound, ChevronRight, ChevronLeft, LogOut, Info } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useSession, signOut } from '../../sessionStore'
import { useSellerData, upsertSettings, uploadMedia, deleteRow, logActivity } from '../api'
import { Btn, Field, Input, Badge, Toggle, Th, Td, Err, toast } from '../components/ui'
import Modal from '../components/shell/Modal'
import Confirm from '../components/shell/Confirm'
import Empty from '../components/shell/Empty'
import { useMobile } from '../../useMobile'
import StaffForm from '../components/sozlamalar/StaffForm'
import BranchForm from '../components/sozlamalar/BranchForm'
import StaffDetail from '../components/sozlamalar/StaffDetail'
import { ROLE_LABEL, NOTIFY, DEFAULT_NOTIFY, maskPhone, initials } from '../components/sozlamalar/constants'
import PhoneInput, { extractUzLocalDigits, isCompleteUzPhone, PHONE_INCOMPLETE_MSG, toE164 } from '../../components/PhoneInput'

const card = 'rounded-2xl border border-[#E2ECEE] bg-white'
const EXTRA = [
  ['parol', Lock, 'Parolni o‘zgartirish', 'Hisob xavfsizligi uchun parolingizni yangilang'],
  ['xavfsizlik', ShieldCheck, 'Xavfsizlik sozlamalari', 'Kirish va sessiyalar haqida'],
  ['til', Globe, 'Til va mintaqa', 'O‘zbek (lotin), Toshkent vaqti'],
  ['hisob', UserRound, 'Hisob ma’lumotlari', 'Hisobingiz haqida ma’lumot'],
  ['ochirish', Trash2, 'Hisobni o‘chirish', 'Hisobni o‘chirish bo‘yicha ma’lumot'],
]

export default function Sozlamalar() {
  const d = useSellerData()
  const session = useSession()
  const mobile = useMobile()
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const set = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n, { replace: k !== 'v' }) }
  const [shop, setShop] = useState({ name: '', phone: '', address: '', work_days: '', work_hours: '', logo_url: '' })
  const [notify, setNotify] = useState(DEFAULT_NOTIFY)
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const [staffForm, setStaffForm] = useState(null); const [branchForm, setBranchForm] = useState(null)
  const [delB, setDelB] = useState(null); const [delS, setDelS] = useState(null); const [extra, setExtra] = useState(null)
  const fileRef = useRef(null); const loaded = useRef(false)

  useEffect(() => {
    if (d.loading || loaded.current) return
    loaded.current = true
    const s = d.settings || {}
    setShop((x) => ({ ...x, phone: s.phone || '', address: parseGeo(s.address || '').text, lat: parseGeo(s.address || '').lat, lng: parseGeo(s.address || '').lng, work_days: s.work_days || 'Dushanba - Shanba', work_hours: s.work_hours || '09:00 - 18:00', logo_url: s.logo_url || '' }))
    setNotify({ ...DEFAULT_NOTIFY, ...(s.notify || {}) })
    const uid = session.user?.id
    if (uid && supabase) supabase.from('profiles').select('shop_name').eq('id', uid).maybeSingle().then(({ data }) => setShop((x) => ({ ...x, name: data?.shop_name || '' })))
  }, [d.loading, d.settings, session.user?.id])

  const saveShop = async () => {
    if (!shop.name.trim()) return setErr('Do‘kon nomini kiriting.')
    setBusy(true); setErr('')
    const { error } = await supabase.from('profiles').update({ shop_name: shop.name.trim() }).eq('id', session.user.id)
    const r = error ? { ok: false, error: 'Do‘kon nomi saqlanmadi.' } : await upsertSettings({ phone: shop.phone, address: withGeo(shop.address, shop), work_days: shop.work_days, work_hours: shop.work_hours, logo_url: shop.logo_url || '', notify })
    setBusy(false)
    if (!r.ok) return setErr(r.error)
    window.dispatchEvent(new CustomEvent('shop-name', { detail: shop.name.trim() }))
    await logActivity('Sozlamalar yangilandi', 'Do‘kon ma’lumotlari')
    toast('Sozlamalar saqlandi')
  }
  const setN = async (k, v) => { const n = { ...notify, [k]: v }; setNotify(n); const r = await upsertSettings({ notify: n }); if (!r.ok) { toast(r.error); setNotify(notify) } }
  const onLogo = async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; if (f.size > 2 * 1024 * 1024) return toast('Rasm 2 MB dan oshmasin'); const r = await uploadMedia(f, 'logo'); if (!r.ok) return toast(r.error || 'Yuklanmadi'); setShop((x) => ({ ...x, logo_url: r.url })); await upsertSettings({ logo_url: r.url }); toast('Logotip yuklandi') }
  const removeBranch = async () => { const r = await deleteRow('seller_branches', delB.id); if (r.ok) { await logActivity('Filial o‘chirildi', delB.name); toast('Filial o‘chirildi') } else toast(r.error); setDelB(null) }
  const removeStaff = async () => { const r = await deleteRow('seller_staff', delS.id); if (r.ok) { await logActivity('Xodim o‘chirildi', delS.name); toast('Xodim o‘chirildi') } else toast(r.error); setDelS(null) }

  const staff = d.staff || []; const branches = d.branches || []
  const sel = staff.find((s) => s.id === sp.get('xodim'))
  const branchName = (id) => branches.find((b) => b.id === id)?.name || '—'
  const logo = shop.logo_url ? <img src={shop.logo_url} alt="" className="size-full rounded-full object-cover" /> : <Store className="size-8" />

  const modals = <>
    {staffForm && <StaffForm edit={staffForm.edit} permsOnly={staffForm.perms} branches={branches} onClose={() => setStaffForm(null)} />}
    {branchForm && <BranchForm edit={branchForm.edit} onClose={() => setBranchForm(null)} />}
    {sel && !staffForm && <StaffDetail s={sel} branches={branches} activity={d.activity || []} onClose={() => set('xodim')} onEdit={() => setStaffForm({ edit: sel })} onPerms={() => setStaffForm({ edit: sel, perms: true })} />}
    <Confirm open={!!delB} onClose={() => setDelB(null)} title="Filialni o‘chirish" text={`${delB?.name || ''} o‘chiriladi. Unga biriktirilgan xodimlar filialsiz qoladi.`} okText="O‘chirish" onOk={removeBranch} />
    <Confirm open={!!delS} onClose={() => setDelS(null)} title="Xodimni o‘chirish" text={`${delS?.name || ''} ro‘yxatdan o‘chiriladi.`} okText="O‘chirish" onOk={removeStaff} />
    {extra && <ExtraModal k={extra} email={session.user?.email} onClose={() => setExtra(null)} />}
    <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={onLogo} />
  </>

  const shopFields = (
    <div className="space-y-3">
      <Field label="Do‘kon nomi"><Input icon={Store} value={shop.name} onChange={(e) => setShop({ ...shop, name: e.target.value })} /></Field>
      <Field label="Telefon raqam"><PhoneInput className="h-11" value={shop.phone} onChange={(v) => setShop({ ...shop, phone: toE164(v) || extractUzLocalDigits(v) })} valueMode="e164" placeholder="+998 90 123 45 67" /></Field>
      <Field label="Manzil"><Input icon={MapPin} value={shop.address} onChange={(e) => setShop({ ...shop, address: e.target.value })} placeholder="Shahar, tuman, ko‘cha" /></Field>
      <MapPicker lat={shop.lat} lng={shop.lng} onChange={({ lat, lng, geo }) => setShop((x) => ({ ...x, lat, lng, ...(geo?.street ? { address: [geo.city, geo.district && geo.district !== 'Markaz' ? geo.district : '', geo.street].filter(Boolean).join(', ') } : {}) }))} />
      <div className="grid grid-cols-2 gap-3"><Field label="Ish kunlari"><Input icon={CalendarDays} value={shop.work_days} onChange={(e) => setShop({ ...shop, work_days: e.target.value })} /></Field><Field label="Ish vaqti"><Input icon={Clock} value={shop.work_hours} onChange={(e) => setShop({ ...shop, work_hours: e.target.value })} /></Field></div>
      <Err>{err}</Err>
    </div>
  )
  const staffEmpty = <Empty icon={Users} title="Xodimlar yo‘q" text="Do‘koningizda ishlaydigan xodimlarni qo‘shing." action={<Btn size="sm" icon={UserPlus} onClick={() => setStaffForm({})}>Xodim qo‘shish</Btn>} />
  const branchEmpty = <Empty icon={Building2} title="Filiallar yo‘q" text="Do‘koningiz filiallarini qo‘shing." action={<Btn size="sm" icon={Plus} onClick={() => setBranchForm({})}>Filial qo‘shish</Btn>} />

  if (d.loading) return <div className="p-8 text-[#5C6E80]">Yuklanmoqda…</div>

  if (mobile) {
    const v = sp.get('v')
    const back = (t, extraBtn) => <div className="mb-3 flex items-center gap-2"><button type="button" onClick={() => set('v')} className="rounded-lg p-1.5 hover:bg-[#F0FDFA]" aria-label="Orqaga"><ChevronLeft className="size-5" /></button><h1 className="flex-1 text-[20px] font-extrabold">{t}</h1>{extraBtn}</div>
    const row = (I, t, s, f, last) => <button key={t} type="button" onClick={f} className={`flex w-full items-center gap-3 px-3 py-3 text-left ${last ? '' : 'border-b border-[#EEF3F4]'}`}><span className="grid size-10 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]"><I className="size-5" /></span><span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold">{t}</span><span className="block truncate text-[12px] text-[#5C6E80]">{s}</span></span><ChevronRight className="size-4 text-[#5C6E80]" /></button>
    let body
    if (v === 'dokon') body = <>{back('Do‘kon ma’lumotlari')}<div className={`${card} p-4`}><div className="mb-4 flex items-center gap-3"><span className="grid size-16 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]">{logo}</span><Btn size="sm" variant="outline" icon={Upload} onClick={() => fileRef.current?.click()}>Logotip yuklash</Btn></div>{shopFields}<Btn className="mt-4 w-full" icon={Save} disabled={busy} onClick={saveShop}>Saqlash</Btn></div></>
    else if (v === 'xodimlar') body = <>{back('Xodimlar', <Btn size="sm" icon={UserPlus} onClick={() => setStaffForm({})}>Qo‘shish</Btn>)}<div className={card}>{staff.length ? staff.map((s, i) => <button key={s.id} type="button" onClick={() => set('xodim', s.id)} className={`flex w-full items-center gap-3 p-3 text-left ${i < staff.length - 1 ? 'border-b border-[#EEF3F4]' : ''}`}><span className="grid size-10 place-items-center rounded-full bg-[#CCFBF1] text-[13px] font-bold text-[#0F766E]">{initials(s.name)}</span><span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold">{s.name}</span><span className="block text-[12px] text-[#5C6E80]">{ROLE_LABEL[s.role]} · {branchName(s.branch_id)}</span></span><Badge tone={s.active ? 'on' : 'off'} dot>{s.active ? 'Faol' : 'Faol emas'}</Badge></button>) : staffEmpty}</div></>
    else if (v === 'filiallar') body = <>{back('Filiallar', <Btn size="sm" icon={Plus} onClick={() => setBranchForm({})}>Qo‘shish</Btn>)}<div className="space-y-2">{branches.length ? branches.map((b) => <div key={b.id} className={`${card} p-3`}><div className="flex items-center gap-2"><b className="flex-1 text-[14px]">{b.name}</b><Badge tone={b.active ? 'on' : 'off'} dot>{b.active ? 'Faol' : 'Faol emas'}</Badge></div><div className="mt-1 text-[12.5px] text-[#5C6E80]">{parseGeo(b.address).text}</div>{parseGeo(b.address).lat != null && <MapPreview lat={parseGeo(b.address).lat} lng={parseGeo(b.address).lng} />}<div className="text-[12.5px] text-[#5C6E80]">{b.phone} · {b.hours}</div><div className="mt-2 flex gap-2"><Btn size="sm" variant="outline" icon={Pencil} onClick={() => setBranchForm({ edit: b })}>Tahrirlash</Btn><Btn size="sm" variant="outline" icon={Trash2} onClick={() => setDelB(b)}>O‘chirish</Btn></div></div>) : <div className={card}>{branchEmpty}</div>}</div></>
    else body = <>
      <h1 className="mb-3 text-[22px] font-extrabold">Sozlamalar</h1>
      <div className={`${card} mb-4 flex items-center gap-3 p-4`}><span className="grid size-14 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]">{logo}</span><div className="min-w-0 flex-1"><div className="truncate text-[17px] font-extrabold">{shop.name || 'Do‘kon nomi kiritilmagan'}</div><div className="truncate text-[12.5px] text-[#5C6E80]">{shop.phone || 'Telefon kiritilmagan'}</div></div><button type="button" onClick={() => set('v', 'dokon')} className="rounded-lg p-2 text-[#0F766E] hover:bg-[#F0FDFA]" aria-label="Tahrirlash"><Pencil className="size-5" /></button></div>
      <div className="mb-1.5 text-[13px] font-bold text-[#5C6E80]">Asosiy</div>
      <div className={`${card} mb-4`}>{row(Store, 'Do‘kon ma’lumotlari', shop.address || 'Manzil, ish vaqti, logotip', () => set('v', 'dokon'))}{row(Users, 'Xodimlar', `${staff.length} ta xodim`, () => set('v', 'xodimlar'))}{row(Building2, 'Filiallar', `${branches.length} ta filial`, () => set('v', 'filiallar'), true)}</div>
      <div className="mb-1.5 text-[13px] font-bold text-[#5C6E80]">Bildirishnomalar</div>
      <div className={`${card} mb-4`}>{NOTIFY.map(([k, t], i) => <div key={k} className={`flex items-center gap-3 px-3 py-3 ${i < NOTIFY.length - 1 ? 'border-b border-[#EEF3F4]' : ''}`}><Bell className="size-5 text-[#0F766E]" /><span className="flex-1 text-[14px]">{t}</span><Toggle checked={!!notify[k]} onChange={(x) => setN(k, x)} /></div>)}</div>
      <div className="mb-1.5 text-[13px] font-bold text-[#5C6E80]">Boshqa</div>
      <div className={`${card} mb-4`}>{EXTRA.map(([k, I, t, s], i) => row(I, t, s, () => setExtra(k), i === EXTRA.length - 1))}</div>
      <Btn variant="outline" icon={LogOut} className="w-full" onClick={async () => { await signOut(); nav('/') }}>Chiqish</Btn>
    </>
    return <div className="p-4 pb-24">{body}{modals}</div>
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between"><div><h1 className="text-[26px] font-extrabold">Sozlamalar</h1><p className="text-[13.5px] text-[#5C6E80]">Do‘kon, xodimlar, filiallar va bildirishnomalarni boshqaring.</p></div><Btn icon={Save} disabled={busy} onClick={saveShop}>Saqlash</Btn></div>
      <div className="grid grid-cols-[1fr_1.6fr] gap-5">
        <section className={`${card} p-5`}><h2 className="mb-4 text-[17px] font-bold">Do‘kon ma’lumotlari</h2>
          <div className="mb-4 flex items-center gap-4"><span className="grid size-20 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]">{logo}</span><div><Btn size="sm" variant="outline" icon={Upload} onClick={() => fileRef.current?.click()}>Logotip yuklash</Btn><p className="mt-1 text-[11.5px] text-[#5C6E80]">PNG yoki JPG, 2 MB gacha</p></div></div>{shopFields}</section>
        <section className={`${card} p-5`}><div className="mb-3 flex items-center justify-between"><h2 className="text-[17px] font-bold">Xodimlar</h2><Btn size="sm" icon={UserPlus} onClick={() => setStaffForm({})}>Xodim qo‘shish</Btn></div>
          {staff.length ? <table className="w-full text-[13px]"><thead className="bg-[#F6FAFA]"><tr><Th>Ism familiya</Th><Th>Lavozim</Th><Th>Telefon</Th><Th>Filial</Th><Th>Holat</Th><Th className="text-center">Amallar</Th></tr></thead><tbody>{staff.map((s) => <tr key={s.id} onClick={() => set('xodim', s.id)} className="cursor-pointer border-t border-[#EEF3F4] hover:bg-[#F0FDFA]/50"><Td><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-full bg-[#CCFBF1] text-[11px] font-bold text-[#0F766E]">{initials(s.name)}</span><b>{s.name}</b></div></Td><Td>{ROLE_LABEL[s.role]}</Td><Td><span className="whitespace-nowrap">{maskPhone(s.phone)}</span></Td><Td>{branchName(s.branch_id)}</Td><Td><Badge tone={s.active ? 'on' : 'off'} dot>{s.active ? 'Faol' : 'Faol emas'}</Badge></Td><Td><div className="flex justify-center gap-1" onClick={(e) => e.stopPropagation()}><button type="button" title="Ko‘rish" onClick={() => set('xodim', s.id)} className="rounded-lg p-1.5 hover:bg-[#F0FDFA]"><Eye className="size-4" /></button><button type="button" title="Tahrirlash" onClick={() => setStaffForm({ edit: s })} className="rounded-lg p-1.5 hover:bg-[#F0FDFA]"><Pencil className="size-4" /></button><button type="button" title="O‘chirish" onClick={() => setDelS(s)} className="rounded-lg p-1.5 hover:bg-[#F0FDFA]"><Trash2 className="size-4" /></button></div></Td></tr>)}</tbody></table> : staffEmpty}</section>
      </div>
      <div className="grid grid-cols-[1.6fr_1fr] gap-5">
        <section className={`${card} p-5`}><div className="mb-3 flex items-center justify-between"><h2 className="text-[17px] font-bold">Filiallar</h2><Btn size="sm" icon={Plus} onClick={() => setBranchForm({})}>Filial qo‘shish</Btn></div>
          {branches.length ? <table className="w-full text-[13px]"><thead className="bg-[#F6FAFA]"><tr><Th>Filial nomi</Th><Th>Manzil</Th><Th>Telefon</Th><Th>Ish vaqti</Th><Th>Holat</Th><Th className="text-center">Amallar</Th></tr></thead><tbody>{branches.map((b) => <tr key={b.id} className="border-t border-[#EEF3F4]"><Td><b>{b.name}</b></Td><Td>{parseGeo(b.address).text}</Td><Td><span className="whitespace-nowrap">{b.phone}</span></Td><Td><span className="whitespace-nowrap">{b.hours}</span></Td><Td><Badge tone={b.active ? 'on' : 'off'} dot>{b.active ? 'Faol' : 'Faol emas'}</Badge></Td><Td><div className="flex justify-center gap-1"><button type="button" title="Tahrirlash" onClick={() => setBranchForm({ edit: b })} className="rounded-lg p-1.5 hover:bg-[#F0FDFA]"><Pencil className="size-4" /></button><button type="button" title="O‘chirish" onClick={() => setDelB(b)} className="rounded-lg p-1.5 hover:bg-[#F0FDFA]"><Trash2 className="size-4" /></button></div></Td></tr>)}</tbody></table> : branchEmpty}</section>
        <section className={`${card} p-5`}><h2 className="mb-3 text-[17px] font-bold">Bildirishnomalar</h2>{NOTIFY.map(([k, t, s]) => <div key={k} className="flex items-center gap-3 border-b border-[#EEF3F4] py-2.5 last:border-0"><div className="flex-1"><div className="text-[13.5px] font-semibold">{t}</div><div className="text-[12px] text-[#5C6E80]">{s}</div></div><Toggle checked={!!notify[k]} onChange={(x) => setN(k, x)} /></div>)}</section>
      </div>
      <section className={`${card} p-5`}><h2 className="mb-2 text-[17px] font-bold">Qo‘shimcha sozlamalar</h2><div className="grid grid-cols-5 gap-3">{EXTRA.map(([k, I, t, s]) => <button key={k} type="button" onClick={() => setExtra(k)} className="flex items-center gap-3 rounded-xl border border-[#E2ECEE] p-3 text-left hover:bg-[#F0FDFA]"><I className="size-5 shrink-0 text-[#0F766E]" /><span className="min-w-0"><span className="block text-[13px] font-semibold">{t}</span><span className="block text-[11.5px] text-[#5C6E80]">{s}</span></span></button>)}</div></section>
      {modals}
    </div>
  )
}

function ExtraModal({ k, email, onClose }) {
  const [p1, setP1] = useState(''); const [p2, setP2] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const t = EXTRA.find((e) => e[0] === k)[2]
  const savePw = async () => {
    if (p1.length < 8) return setErr('Parol kamida 8 belgidan iborat bo‘lsin.')
    if (p1 !== p2) return setErr('Parollar mos emas.')
    setBusy(true); const { error } = await supabase.auth.updateUser({ password: p1 }); setBusy(false)
    if (error) return setErr('Parol o‘zgartirilmadi. Qayta urinib ko‘ring.')
    toast('Parol yangilandi'); onClose()
  }
  const info = {
    xavfsizlik: 'Hisobingizga faqat siz kirasiz. Barcha qurilmalardan chiqish uchun «Chiqish» tugmasidan foydalaning. Shubhali faollik sezsangiz parolni darhol o‘zgartiring.',
    til: 'Interfeys tili: O‘zbek (lotin). Vaqt mintaqasi: Toshkent (UTC+5). Boshqa tillar hozircha mavjud emas.',
    hisob: `Hisob: ${email || '—'}. To‘lov usuli: faqat naqd pul. Platforma komissiyasi: 12%.`,
    ochirish: 'Hisobni o‘chirish qaytarib bo‘lmaydigan amal. Buning uchun StomaHub qo‘llab-quvvatlash xizmatiga murojaat qiling — ochiq buyurtmalar va hamyon qoldig‘i tekshirilgandan so‘ng hisob yopiladi.',
  }
  return (
    <Modal open onClose={onClose} title={t} width="md:max-w-[460px]" footer={k === 'parol' ? <div className="grid grid-cols-2 gap-3"><Btn variant="outline" onClick={onClose}>Bekor qilish</Btn><Btn icon={Save} disabled={busy} onClick={savePw}>Saqlash</Btn></div> : <Btn className="w-full" onClick={onClose}>Tushunarli</Btn>}>
      {k === 'parol' ? <div className="space-y-3"><Field label="Yangi parol"><Input type="password" value={p1} onChange={(e) => { setP1(e.target.value); setErr('') }} /></Field><Field label="Parolni takrorlang"><Input type="password" value={p2} onChange={(e) => { setP2(e.target.value); setErr('') }} /></Field><Err>{err}</Err></div>
        : <div className="flex gap-3 rounded-xl bg-[#F0FDFA] p-4 text-[13.5px] text-[#10283F]"><Info className="size-5 shrink-0 text-[#0F766E]" /><p>{info[k]}</p></div>}
    </Modal>
  )
}
