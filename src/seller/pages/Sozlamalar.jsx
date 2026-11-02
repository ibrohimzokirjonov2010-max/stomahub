import { useEffect, useRef, useState } from 'react'
import MapPicker, { MapPreview, parseGeo, withGeo } from '../../components/MapPicker'
import { useSearchParams, useNavigate } from 'react-router'
import { Save, Store, Phone, MapPin, Clock, CalendarDays, Upload, UserPlus, Plus, Pencil, Trash2, Eye, Users, Building2, Bell, Lock, ShieldCheck, Globe, UserRound, ChevronRight, ChevronLeft, LogOut, Info, FileText } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useSession, signOut } from '../../sessionStore'
import Rekvizitlar from '../components/sozlamalar/Rekvizitlar'
import FeaturedPicker from '../components/sozlamalar/FeaturedPicker'
import PublicPreview from '../components/sozlamalar/PublicPreview'
import { toPublicCard, featuredError } from '../../seller-public/lib'
import { useSellerData, upsertSettings, uploadMedia, deleteRow, logActivity } from '../api'
import { Btn, Field, Input, Textarea, Badge, Toggle, Th, Td, Err, toast } from '../components/ui'
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
  const fileRef = useRef(null); const coverRef = useRef(null); const loaded = useRef(false); const legalSave = useRef(null)
  const publicUrl = session.user?.id ? `/dokon/${session.user.id}` : ''
  const myProducts = (d.products || []).filter((p) => p.status === 'active').map(toPublicCard)
  const featuredLive = (shop.featured || []).filter((id) => myProducts.some((p) => p.id === id))
  const visReviews = (d.reviews || []).filter((r) => !r.hidden)
  // Same shape as seller_public_profile (0044) returns — fed to the real public page component.
  const previewInfo = {
    id: session.user?.id, shop_name: shop.name || 'Sotuvchi', description: shop.description, avatar_url: shop.logo_url, cover_url: shop.cover_url,
    work_days: shop.pub ? shop.work_days : '', work_hours: shop.pub ? shop.work_hours : '',
    phone: shop.pub && shop.show_phone ? shop.phone : '', address: shop.pub && shop.show_address ? withGeo(shop.address, shop) : '',
    since: d.settings?.created_at || new Date().toISOString(), featured_ids: featuredLive,
    reviews_count: visReviews.length, rating: visReviews.length ? visReviews.reduce((a, r) => a + Number(r.rating || 0), 0) / visReviews.length : null,
    reviews: visReviews.slice(0, 20).map((r) => ({ rating: r.rating, body: r.body, reply: r.reply, created_at: r.created_at, author: String(r.author_name || 'Xaridor').split(' ')[0] })),
  }

  useEffect(() => {
    if (d.loading || loaded.current) return
    loaded.current = true
    const s = d.settings || {}
    setShop((x) => ({ ...x, phone: s.phone || '', address: parseGeo(s.address || '').text, lat: parseGeo(s.address || '').lat, lng: parseGeo(s.address || '').lng, work_days: s.work_days || 'Dushanba - Shanba', work_hours: s.work_hours || '09:00 - 18:00', logo_url: s.logo_url || '', owner_name: s.owner_name || '', telegram: s.telegram || '', instagram: s.instagram || '', website: s.website || '', description: s.description || '', ext: 'telegram' in s, pub: 'show_phone' in s, show_phone: !!s.show_phone, show_address: s.show_address !== false, cover_url: s.cover_url || '', featured: Array.isArray(s.featured_product_ids) ? s.featured_product_ids : [], hasFeatured: 'featured_product_ids' in s }))
    setNotify({ ...DEFAULT_NOTIFY, ...(s.notify || {}) })
    const uid = session.user?.id
    if (uid && supabase) supabase.from('profiles').select('shop_name').eq('id', uid).maybeSingle().then(({ data }) => setShop((x) => ({ ...x, name: data?.shop_name || '' })))
  }, [d.loading, d.settings, session.user?.id])

  const saveShop = async () => {
    if (!shop.name.trim()) return setErr('Do‘kon nomini kiriting.')
    const fErr = shop.hasFeatured ? featuredError(featuredLive) : ''
    if (fErr) return setErr(fErr)
    setBusy(true); setErr('')
    const { error } = await supabase.from('profiles').update({ shop_name: shop.name.trim() }).eq('id', session.user.id)
    const r = error ? { ok: false, error: 'Do‘kon nomi saqlanmadi.' } : await upsertSettings({ phone: shop.phone, address: withGeo(shop.address, shop), work_days: shop.work_days, work_hours: shop.work_hours, logo_url: shop.logo_url || '', notify, ...(shop.ext ? { owner_name: shop.owner_name.trim(), telegram: shop.telegram.trim(), instagram: shop.instagram.trim(), website: shop.website.trim(), description: shop.description.trim() } : {}), ...(shop.pub ? { show_phone: shop.show_phone, show_address: shop.show_address, cover_url: shop.cover_url || '' } : {}), ...(shop.hasFeatured ? { featured_product_ids: featuredLive } : {}) })
    setBusy(false)
    if (!r.ok) return setErr(r.error)
    if (legalSave.current) { const l = await legalSave.current(); if (!l.ok) return setErr(`Rekvizitlar: ${l.error}`) }
    window.dispatchEvent(new CustomEvent('shop-name', { detail: shop.name.trim() }))
    await logActivity('Sozlamalar yangilandi', 'Do‘kon ma’lumotlari')
    toast('Sozlamalar saqlandi')
  }
  const setN = async (k, v) => { const n = { ...notify, [k]: v }; setNotify(n); const r = await upsertSettings({ notify: n }); if (!r.ok) { toast(r.error); setNotify(notify) } }
  const onLogo = async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; if (f.size > 2 * 1024 * 1024) return toast('Rasm 2 MB dan oshmasin'); const r = await uploadMedia(f, 'logo'); if (!r.ok) return toast(r.error || 'Yuklanmadi'); setShop((x) => ({ ...x, logo_url: r.url })); await upsertSettings({ logo_url: r.url }); toast('Logotip yuklandi') }
  const onCover = async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; if (f.size > 3 * 1024 * 1024) return toast('Rasm 3 MB dan oshmasin'); const r = await uploadMedia(f, 'cover'); if (!r.ok) return toast(r.error || 'Yuklanmadi'); setShop((x) => ({ ...x, cover_url: r.url })); toast('Muqova yuklandi — Saqlashni bosing') }
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
    <input ref={coverRef} type="file" accept="image/png,image/jpeg" hidden onChange={onCover} />
    <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={onLogo} />
  </>

  const shopFields = (
    <div className="space-y-3">
      <Field label="Do‘kon nomi"><Input icon={Store} value={shop.name} onChange={(e) => setShop({ ...shop, name: e.target.value })} /></Field>
      {shop.ext && <Field label="Egasining to‘liq ismi"><Input value={shop.owner_name} onChange={(e) => setShop({ ...shop, owner_name: e.target.value })} placeholder="Aliyev Vali" /></Field>}
      <Field label="Telefon raqam"><PhoneInput className="h-11" value={shop.phone} onChange={(v) => setShop({ ...shop, phone: toE164(v) || extractUzLocalDigits(v) })} valueMode="e164" placeholder="+998 90 123 45 67" /></Field>
      <Field label="Manzil"><Input icon={MapPin} value={shop.address} onChange={(e) => setShop({ ...shop, address: e.target.value })} placeholder="Shahar, tuman, ko‘cha" /></Field>
      <MapPicker lat={shop.lat} lng={shop.lng} onChange={({ lat, lng, geo }) => setShop((x) => ({ ...x, lat, lng, ...(geo?.street ? { address: [geo.city, geo.district && geo.district !== 'Markaz' ? geo.district : '', geo.street].filter(Boolean).join(', ') } : {}) }))} />
      <div className="grid grid-cols-2 gap-3"><Field label="Ish kunlari"><Input icon={CalendarDays} value={shop.work_days} onChange={(e) => setShop({ ...shop, work_days: e.target.value })} /></Field><Field label="Ish vaqti"><Input icon={Clock} value={shop.work_hours} onChange={(e) => setShop({ ...shop, work_hours: e.target.value })} /></Field></div>
      {shop.ext && <div className="grid gap-3 md:grid-cols-3"><Field label="Telegram"><Input value={shop.telegram} onChange={(e) => setShop({ ...shop, telegram: e.target.value })} placeholder="@dokon" /></Field><Field label="Instagram"><Input value={shop.instagram} onChange={(e) => setShop({ ...shop, instagram: e.target.value })} placeholder="@dokon" /></Field><Field label="Veb-sayt"><Input value={shop.website} onChange={(e) => setShop({ ...shop, website: e.target.value })} placeholder="dokon.uz" /></Field></div>}
      <Err>{err}</Err>
    </div>
  )
  const pubRow = (label, on, note) => <li key={label} className="flex items-center justify-between gap-2 py-1.5 text-[13px]"><span>{label}</span><Badge tone={on ? 'on' : 'off'} dot>{on ? 'Ko‘rinadi' : (note || 'Ko‘rinmaydi')}</Badge></li>
  const publicSection = (
    <div className="space-y-3">
      <p className="text-[12.5px] text-[#5C6E80]">Xaridorlar mahsulot sahifasidagi do‘kon nomini bosib profilingizga kiradi.</p>
      {shop.ext && <Field label="Do‘kon haqida"><Textarea value={shop.description} maxLength={600} onChange={(e) => setShop({ ...shop, description: e.target.value })} placeholder="Qisqacha: qanday mahsulotlar sotasiz, nimasi bilan farq qilasiz" /></Field>}
      {shop.pub && <div><div className="mb-1 text-[13px] font-semibold">Muqova rasmi</div>{shop.cover_url ? <img src={shop.cover_url} alt="" className="mb-2 h-24 w-full rounded-xl object-cover" /> : null}<Btn size="sm" variant="outline" icon={Upload} onClick={() => coverRef.current?.click()}>{shop.cover_url ? 'Muqovani almashtirish' : 'Muqova yuklash'}</Btn></div>}
      {shop.pub ? <>
        <div className="flex items-center justify-between gap-3"><span className="text-[13.5px]">Telefon raqamni ko‘rsatish</span><Toggle checked={shop.show_phone} onChange={(x) => setShop({ ...shop, show_phone: x })} /></div>
        <div className="flex items-center justify-between gap-3"><span className="text-[13.5px]">Manzil va xaritani ko‘rsatish</span><Toggle checked={shop.show_address} onChange={(x) => setShop({ ...shop, show_address: x })} /></div>
      </> : <p className="rounded-lg bg-[#FFF7ED] px-3 py-2 text-[12.5px] text-[#9A3412]">Telefon/manzilni ko‘rsatish va muqova uchun 0044 migratsiyasi kerak.</p>}
      {shop.hasFeatured && <FeaturedPicker value={shop.featured} products={myProducts} onChange={(ids) => setShop((x) => ({ ...x, featured: ids }))} />}
      <ul className="divide-y divide-[#EEF3F4] rounded-xl border border-[#E2ECEE] px-3">
        {pubRow('Do‘kon nomi, logotip, tavsif', true)}{pubRow('Ish kunlari va vaqti', !!shop.pub)}{pubRow('Telefon', shop.pub && shop.show_phone)}{pubRow('Manzil va xarita', shop.pub && shop.show_address)}{pubRow('Reyting, sharhlar, mahsulotlar', true)}{pubRow('STIR, bank, MFO, hisob, rahbar', false, 'Hech qachon')}
      </ul>
      <Btn variant="outline" icon={Eye} className="w-full" disabled={!publicUrl} onClick={() => window.open(publicUrl, '_blank', 'noopener')}>Profilimni xaridor sifatida ko‘rish</Btn>
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
    else if (v === 'ommaviy') { const tab = sp.get('tab') === 'korinish' ? 'korinish' : 'tahrir'; body = <>{back('Ommaviy profil')}
      <div role="tablist" className="mb-3 grid grid-cols-2 rounded-xl bg-[#F0F5F6] p-1 text-[13.5px] font-semibold">{[['tahrir', 'Tahrirlash'], ['korinish', 'Ko‘rinish']].map(([k, t]) => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => set('tab', k === 'tahrir' ? '' : k)} className={`h-9 rounded-lg ${tab === k ? 'bg-white text-[#0F766E] shadow-sm' : 'text-[#5C6E80]'}`}>{t}</button>)}</div>
      {tab === 'korinish' ? <PublicPreview info={previewInfo} products={myProducts} height={560} /> : <div className={`${card} p-4`}>{publicSection}</div>}
      <Btn className="mt-4 w-full" icon={Save} disabled={busy} onClick={saveShop}>Saqlash</Btn></> }
    else if (v === 'rekvizitlar') body = <>{back('Rekvizitlar')}<Rekvizitlar settings={d.loading ? null : (d.settings || {})} uid={session.user?.id} card={card} compact /></>
    else if (v === 'filiallar') body = <>{back('Filiallar', <Btn size="sm" icon={Plus} onClick={() => setBranchForm({})}>Qo‘shish</Btn>)}<div className="space-y-2">{branches.length ? branches.map((b) => <div key={b.id} className={`${card} p-3`}><div className="flex items-center gap-2"><b className="flex-1 text-[14px]">{b.name}</b><Badge tone={b.active ? 'on' : 'off'} dot>{b.active ? 'Faol' : 'Faol emas'}</Badge></div><div className="mt-1 text-[12.5px] text-[#5C6E80]">{parseGeo(b.address).text}</div>{parseGeo(b.address).lat != null && <MapPreview lat={parseGeo(b.address).lat} lng={parseGeo(b.address).lng} />}<div className="text-[12.5px] text-[#5C6E80]">{b.phone} · {b.hours}</div><div className="mt-2 flex gap-2"><Btn size="sm" variant="outline" icon={Pencil} onClick={() => setBranchForm({ edit: b })}>Tahrirlash</Btn><Btn size="sm" variant="outline" icon={Trash2} onClick={() => setDelB(b)}>O‘chirish</Btn></div></div>) : <div className={card}>{branchEmpty}</div>}</div></>
    else body = <>
      <h1 className="mb-3 text-[22px] font-extrabold">Sozlamalar</h1>
      <div className={`${card} mb-4 flex items-center gap-3 p-4`}><span className="grid size-14 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]">{logo}</span><div className="min-w-0 flex-1"><div className="truncate text-[17px] font-extrabold">{shop.name || 'Do‘kon nomi kiritilmagan'}</div><div className="truncate text-[12.5px] text-[#5C6E80]">{shop.phone || 'Telefon kiritilmagan'}</div></div><button type="button" onClick={() => set('v', 'dokon')} className="rounded-lg p-2 text-[#0F766E] hover:bg-[#F0FDFA]" aria-label="Tahrirlash"><Pencil className="size-5" /></button></div>
      <div className="mb-1.5 text-[13px] font-bold text-[#5C6E80]">Asosiy</div>
      <div className={`${card} mb-4`}>{row(Store, 'Do‘kon ma’lumotlari', shop.address || 'Manzil, ish vaqti, logotip', () => set('v', 'dokon'))}{row(Eye, 'Ommaviy profil', 'Xaridorlar nimani ko‘radi', () => set('v', 'ommaviy'))}{row(FileText, 'Rekvizitlar va litsenziya', d.settings?.legal?.stir ? `STIR ${d.settings.legal.stir}` : 'STIR, bank, MFO, litsenziya', () => set('v', 'rekvizitlar'), true)}</div>
      <div className="mb-1.5 text-[13px] font-bold text-[#5C6E80]">Bildirishnomalar</div>
      <div className={`${card} mb-4`}>{NOTIFY.map(([k, t, sub]) => <div key={k} className="flex items-center gap-3 px-3 py-3"><Bell className="size-5 text-[#0F766E]" /><span className="flex-1"><span className="block text-[14px]">{t}</span><span className="block text-[12px] text-[#5C6E80]">{sub}</span></span><Toggle checked={!!notify[k]} onChange={(x) => setN(k, x)} /></div>)}</div>
      <div className="mb-1.5 text-[13px] font-bold text-[#5C6E80]">Boshqa</div>
      <div className={`${card} mb-4`}>{EXTRA.map(([k, I, t, s], i) => row(I, t, s, () => setExtra(k), i === EXTRA.length - 1))}</div>
      <Btn variant="outline" icon={LogOut} className="w-full" onClick={async () => { await signOut(); nav('/') }}>Chiqish</Btn>
    </>
    return <div className="p-4 pb-24">{body}{modals}</div>
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_460px] gap-5 p-6"><div className="min-w-0 space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-[26px] font-extrabold">Sozlamalar</h1><p className="text-[13.5px] text-[#5C6E80]">Do‘kon ma’lumotlari, ommaviy profil, rekvizitlar. Barchasi bitta «Saqlash» bilan saqlanadi.</p></div><Btn icon={Save} disabled={busy} onClick={saveShop}>Saqlash</Btn></div>
      <div className="grid gap-5 2xl:grid-cols-2">
        <section className={`${card} p-5`}><h2 className="mb-4 text-[17px] font-bold">Do‘kon ma’lumotlari</h2>
          <div className="mb-4 flex items-center gap-4"><span className="grid size-20 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]">{logo}</span><div><Btn size="sm" variant="outline" icon={Upload} onClick={() => fileRef.current?.click()}>Logotip yuklash</Btn><p className="mt-1 text-[11.5px] text-[#5C6E80]">PNG yoki JPG, 2 MB gacha</p></div></div>{shopFields}</section>
        <div className="space-y-5">
          <section className={`${card} p-5`}><h2 className="mb-3 text-[17px] font-bold">Ommaviy profil</h2>{publicSection}</section>
          <section className={`${card} p-5`}><h2 className="mb-3 text-[17px] font-bold">Bildirishnomalar</h2>{NOTIFY.map(([k, t, sub]) => <div key={k} className="flex items-center gap-3 py-1"><div className="flex-1"><div className="text-[13.5px] font-semibold">{t}</div><div className="text-[12px] text-[#5C6E80]">{sub}</div></div><Toggle checked={!!notify[k]} onChange={(x) => setN(k, x)} /></div>)}</section>
        </div>
      </div>
      <Rekvizitlar settings={d.loading ? null : (d.settings || {})} uid={session.user?.id} card={card} saveRef={legalSave} />
      <section className={`${card} p-5`}><h2 className="mb-2 text-[17px] font-bold">Qo‘shimcha sozlamalar</h2><div className="grid grid-cols-3 gap-3">{EXTRA.map(([k, I, t, s]) => <button key={k} type="button" onClick={() => setExtra(k)} className="flex items-center gap-3 rounded-xl border border-[#E2ECEE] p-3 text-left hover:bg-[#F0FDFA]"><I className="size-5 shrink-0 text-[#0F766E]" /><span className="min-w-0"><span className="block text-[13px] font-semibold">{t}</span><span className="block text-[11.5px] text-[#5C6E80]">{s}</span></span></button>)}</div></section>
      {modals}
    </div>
    <aside className="sticky top-4 self-start"><PublicPreview info={previewInfo} products={myProducts} height={720} /></aside>
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
