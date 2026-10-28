import { useEffect, useMemo, useRef, useState } from 'react'

import MapPicker, { MapPreview } from '../components/MapPicker'
import { Link, useNavigate } from 'react-router-dom'
import {
  BadgeCheck, Bell, Building2, Camera, Check, CreditCard, Download, Globe,
  GraduationCap, Heart, IdCard, LogOut, MapPin, Pencil, Phone, Plus, Shield,
  ShoppingBag, Star, Trash2, Wallet,
} from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import { fetchNotifications, markNotificationsRead, useRemote } from '../buyerApi'
import { marketProducts, som } from '../marketData'
import {
  ADDRESS_KINDS, COURSES, addr, allOrders, courseDone, flushProfile, profileStore, useProfile,
} from '../profileStore'
import { demoBadgeProps, isDemoPayments, linkWalletInput, tokenizeCardInput, WALLET_PROVIDERS } from '../payments/paymentService'
import { canEnterSeller, signOut, useSession } from '../sessionStore'
import PhoneInput, { extractUzLocalDigits, PHONE_INCOMPLETE_MSG, toE164 } from '../components/PhoneInput'

const SPECS = ['Ortoped stomatolog', 'Stomatolog', 'Terapevt', 'Ortodont', 'Jarroh', 'Implantolog', 'Endodontist', 'Gigiyenist', 'Talaba', 'Klinika egasi']
const YEARS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '12', '15', '20', '25', '30']
const LANGS = [['uz', 'O‘zbekcha'], ['ru', 'Русский'], ['en', 'English']]
const NAV = [
  ['info', 'Shaxsiy ma’lumotlar'],
  ['clinic', 'Klinikam'],
  ['orders', 'Buyurtmalarim'],
  ['courses', 'Kurslarim va sertifikatlar'],
  ['saved', 'Saqlanganlar'],
  ['addresses', 'Manzillar'],
  ['payments', 'To‘lov usullari'],
  ['notifs', 'Bildirishnomalar'],
  ['security', 'Xavfsizlik'],
  ['seller', 'Sotuvchi bo‘lish'],
  ['logout', 'Chiqish'],
]
const NOTIF_TOGGLES = [
  ['email', 'Email bildirishnomalar'],
  ['sms', 'SMS xabarlar'],
  ['market', 'Market yangiliklari'],
  ['courses', 'Kurslar eslatmalari'],
  ['promo', 'Maxsus takliflar'],
]
const field = 'mt-1.5 h-11 w-full rounded-xl border border-[#d7e5e3] bg-white px-3 text-[14px] text-[#1a2b3c] outline-none focus:border-[#0F766E] disabled:bg-[#f4f7f9] disabled:text-[#5b6b7d]'
const card = 'rounded-2xl border border-[#e6eef2] bg-white p-4 shadow-[0_1px_2px_rgb(15_30_50/0.03)]'
const pill = {
  shipping: 'bg-[#e8f1fc] text-[#1f6fd1]',
  processing: 'bg-[#fff4d6] text-[#b45309]',
  delivered: 'bg-[#e5f6ec] text-[#15803d]',
  cancelled: 'bg-[#fde8e8] text-[#b42318]',
}

function toAvatar(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Rasmni o‘qib bo‘lmadi'))
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const size = 480
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const scale = Math.max(size / img.width, size / img.height)
        const w = img.width * scale
        const h = img.height * scale
        canvas.getContext('2d').drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = () => resolve(String(reader.result))
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export function profileCompleteness(p) {
  const checks = [
    p.name, p.phone, p.email, p.role, p.experience, p.license, p.about,
    p.clinic || p.clinicInfo?.name, p.city, p.avatar,
  ]
  const filled = checks.filter((v) => String(v || '').trim()).length
  return Math.round((filled / checks.length) * 100)
}

const fmtPhone = (p) => {
  const d = String(p || '').replace(/\D/g, '').slice(-9)
  if (d.length !== 9) return p || '—'
  return `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`
}

const fmtBonus = (n) => (Number(n) || 0).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')

const SECTION_TAB = {
  profile: 'info',
  info: 'info',
  orders: 'orders',
  tickets: 'courses',
  courses: 'courses',
  addresses: 'addresses',
  payments: 'payments',
  saved: 'saved',
  clinic: 'clinic',
  settings: 'info',
  notifs: 'notifs',
  security: 'security',
}

export default function Profil({ section = 'profile' }) {
  const initial = SECTION_TAB[section] || 'info'
  return (
    <ShopLayout active="profil" search="plain" placeholder="Stomatologiya mahsulotlari...">
      <Board initial={initial} />
    </ShopLayout>
  )
}

function Board({ initial }) {
  const profile = useProfile()
  const session = useSession()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [tab, setTab] = useState(initial)
  const [toast, setToast] = useState('')
  const [err, setErr] = useState('')
  const [editingInfo, setEditingInfo] = useState(false)
  const [editingClinic, setEditingClinic] = useState(false)
  const [infoForm, setInfoForm] = useState(null)
  const [clinicForm, setClinicForm] = useState(null)
  const [addrForm, setAddrForm] = useState(null)
  const [cardForm, setCardForm] = useState(null)
  const [walletForm, setWalletForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notifTick, setNotifTick] = useState(0)

  const notifRes = useRemote(() => (profile.accountLive ? fetchNotifications() : Promise.resolve([])), [profile.accountLive, notifTick])
  const unread = (notifRes.data || []).filter((n) => !n.read_at && !(profile.readNotifs || []).includes(n.id)).length

  useEffect(() => { setTab(initial) }, [initial])
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 2800)
      return () => clearTimeout(t)
    }
  }, [toast])

  const live = session.status === 'authed' || profile.accountLive
  const name = profile.name || session.profile?.name || ''
  const avatar = profile.avatar || session.profile?.avatar_url || ''
  const role = profile.role || session.profile?.specialty || ''
  const orders = allOrders(profile)
  const completeness = profileCompleteness(profile)
  const myCourses = useMemo(() => {
    const ids = new Set([...(profile.favCourses || []), ...Object.keys(profile.courseDone || {})])
    const list = COURSES.filter((c) => ids.has(c.id) || (profile.courseDone?.[c.id] ?? 0) > 0)
    return (list.length ? list : []).map((c) => {
      const done = courseDone(profile, c)
      const pct = Math.round((done / c.lessons) * 100)
      return { ...c, done, pct, complete: pct >= 100 }
    })
  }, [profile])
  const certCount = (profile.certificates || []).length || myCourses.filter((c) => c.complete).length
  const favCount = (profile.favProducts || []).length + (profile.favCourses || []).length + (profile.favMasters || []).length
  const clinic = profile.clinicInfo || {}

  const infoDraft = infoForm || {
    name: name || '',
    phone: profile.phone || '',
    email: profile.email || '',
    role: role || '',
    experience: profile.experience || '',
    license: profile.license || '',
    about: profile.about || '',
  }
  const clinicDraft = clinicForm || {
    name: clinic.name || profile.clinic || '',
    address: clinic.address || '',
    hours: clinic.hours || '',
    phone: clinic.phone || '',
    website: clinic.website || '',
    photo: clinic.photo || '',
  }

  if (!live) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-[26px] font-extrabold text-[#12263a]">Profil</h1>
        <p className="mt-2 text-[14px] text-[#6b7c8f]">Ism, buyurtmalar va sozlamalarni ko‘rish uchun hisobingizga kiring.</p>
        <Link to="/kirish" className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#0F766E] px-5 text-[14px] font-semibold text-white">Kirish</Link>
      </div>
    )
  }

  const pickAvatar = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setBusy(true)
      profileStore.update({ accountLive: true, loggedOut: false, avatar: await toAvatar(file) })
      await flushProfile()
      setToast('Rasm saqlandi')
    } catch (error) {
      setErr(error?.message || 'Rasm saqlanmadi')
    } finally {
      setBusy(false)
    }
  }

  const saveInfo = async () => {
    if (infoDraft.name.trim().length < 2) return setErr('Ism familiyani kiriting')
    setErr('')
    setBusy(true)
    try {
      profileStore.update({
        accountLive: true,
        name: infoDraft.name.trim(),
        phone: String(infoDraft.phone).replace(/\D/g, '').slice(-9),
        email: infoDraft.email.trim(),
        role: infoDraft.role,
        experience: infoDraft.experience,
        license: infoDraft.license.trim(),
        about: infoDraft.about.trim(),
      })
      await flushProfile()
      setEditingInfo(false)
      setInfoForm(null)
      setToast('Profil saqlandi')
    } catch (error) {
      setErr(error?.message || 'Saqlanmadi')
    } finally {
      setBusy(false)
    }
  }

  const saveClinic = async () => {
    setBusy(true)
    setErr('')
    try {
      profileStore.update({
        accountLive: true,
        clinic: clinicDraft.name.trim(),
        clinicInfo: { ...clinicDraft, name: clinicDraft.name.trim() },
      })
      await flushProfile()
      setEditingClinic(false)
      setClinicForm(null)
      setToast('Klinika saqlandi')
    } catch (error) {
      setErr(error?.message || 'Klinika saqlanmadi')
    } finally {
      setBusy(false)
    }
  }

  const logout = async () => {
    await signOut()
    profileStore.update({ loggedOut: true, accountLive: false })
    navigate('/kirish')
  }

  const onNav = (id) => {
    if (id === 'seller') {
      navigate(canEnterSeller(session.profile) ? '/sotuvchi' : '/sotuvchi-bolish')
      return
    }
    if (id === 'logout') {
      logout()
      return
    }
    setTab(id)
    setErr('')
  }

  const stats = [
    { label: 'Buyurtmalar', value: orders.length, icon: ShoppingBag, tone: 'bg-[#e7f6f4] text-[#0F766E]' },
    { label: 'Sertifikatlar', value: certCount, icon: IdCard, tone: 'bg-[#e8f0fc] text-[#2563eb]' },
    { label: 'Kurslar', value: myCourses.length, icon: GraduationCap, tone: 'bg-[#e8f0fc] text-[#2563eb]' },
    { label: 'Bonus ballar', value: fmtBonus(profile.bonus), icon: Star, tone: 'bg-[#fff6df] text-[#d97706]' },
    { label: 'Saqlanganlar', value: favCount, icon: Heart, tone: 'bg-[#fde8ef] text-[#e11d48]' },
  ]

  return (
    <div className="pb-12 pt-4">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickAvatar} />
      {(toast || profile.syncError || err) && (
        <div className="mb-3 space-y-2">
          {toast && <p className="rounded-xl bg-[#e7f8ee] px-3 py-2 text-[13px] text-[#15803d]">{toast}</p>}
          {profile.syncError && <p className="rounded-xl bg-[#fff4f4] px-3 py-2 text-[13px] text-[#b42318]">{profile.syncError}</p>}
          {err && <p role="alert" className="rounded-xl bg-[#fff4f4] px-3 py-2 text-[13px] text-[#b42318]">{err}</p>}
        </div>
      )}

      {/* Header card */}
      <section className={`${card} flex flex-col gap-4 p-5 lg:flex-row lg:items-center`}>
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <button type="button" onClick={() => fileRef.current?.click()} className="relative shrink-0" aria-label="Rasm yuklash" disabled={busy}>
            <img src={avatar || '/images/avatar.jpg'} alt="" className="size-[88px] rounded-full object-cover ring-4 ring-white shadow-[0_4px_14px_rgb(15_30_50/0.12)]" />
            <span className="absolute bottom-0.5 right-0.5 grid size-8 place-items-center rounded-full bg-[#0F766E] text-white shadow"><Camera className="size-3.5" /></span>
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-[22px] font-extrabold text-[#12263a]">{name || 'Ism kiritilmagan'}</h1>
              {profile.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f1fc] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#1f6fd1]">
                  <BadgeCheck className="size-3.5 fill-[#1f6fd1] text-white" /> Tasdiqlangan shifokor
                </span>
              )}
            </div>
            <p className="mt-1 text-[13.5px] text-[#5b6b7d]">{role || 'Mutaxassislik tanlanmagan'}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-[#5b6b7d]">
              <span className="inline-flex items-center gap-1"><Building2 className="size-3.5 text-[#0F766E]" />{[clinic.name || profile.clinic, profile.city].filter(Boolean).join(', ') || 'Klinika kiritilmagan'}</span>
              {profile.experience && <span>{profile.experience} yil tajriba</span>}
              {profile.license && <span>Litsenziya № {profile.license}</span>}
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[220px]">
          <div>
            <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-[#12263a]">
              <span>Profil to‘liqligi</span><span className="text-[#0F766E]">{completeness}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#e7eef2]">
              <div className="h-full rounded-full bg-[#0F766E] transition-all" style={{ width: `${completeness}%` }} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setTab('info'); setEditingInfo(true); setInfoForm(infoDraft) }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#0F766E] bg-white px-4 text-[13.5px] font-semibold text-[#0F766E] hover:bg-[#e7f6f4]"
          >
            <Pencil className="size-3.5" /> Profilni tahrirlash
          </button>
        </div>
      </section>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className={`${card} flex items-center gap-3 p-3.5`}>
            <span className={`grid size-10 place-items-center rounded-xl ${s.tone}`}><s.icon className="size-5" /></span>
            <div className="min-w-0">
              <p className="truncate text-[18px] font-extrabold leading-none text-[#12263a]">{s.value}</p>
              <p className="mt-1 truncate text-[12px] text-[#6b7c8f]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className={`${card} h-fit p-2`}>
          <nav className="grid gap-0.5">
            {NAV.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => onNav(id)}
                className={`flex h-10 items-center rounded-xl px-3 text-left text-[13.5px] font-semibold transition ${
                  tab === id
                    ? 'bg-[#0F766E] text-white'
                    : id === 'logout'
                      ? 'text-[#d14343] hover:bg-[#fff5f5]'
                      : 'text-[#1a2b3c] hover:bg-[#f3faf8]'
                }`}
              >
                {id === 'seller' && canEnterSeller(session.profile) ? 'Sotuvchi kabineti' : id === 'logout' ? <span className="inline-flex items-center gap-2"><LogOut className="size-4" /> {label}</span> : label}
              </button>
            ))}
          </nav>
          {unread > 0 && (
            <button type="button" onClick={() => setTab('notifs')} className="mt-2 flex w-full items-center gap-2 rounded-xl bg-[#fff4e0] px-3 py-2 text-[12px] font-semibold text-[#b45309]">
              <Bell className="size-4" /> {unread} ta yangi bildirishnoma
            </button>
          )}
        </aside>

        <div className="min-w-0 space-y-4">
          {(tab === 'info') && (
            <>
              <PersonalCard
                draft={infoDraft}
                editing={editingInfo}
                setEditing={setEditingInfo}
                setForm={setInfoForm}
                onSave={saveInfo}
                busy={busy}
              />
              <div className="grid gap-4 xl:grid-cols-2">
                <ClinicCard
                  draft={clinicDraft}
                  editing={editingClinic}
                  setEditing={setEditingClinic}
                  setForm={setClinicForm}
                  onSave={saveClinic}
                  onPhoto={async (file) => {
                    try {
                      const data = await toAvatar(file)
                      setClinicForm({ ...clinicDraft, photo: data })
                    } catch (e) { setErr(e.message) }
                  }}
                  busy={busy}
                />
                <SettingsCard profile={profile} />
              </div>
              <CoursesBlock courses={myCourses} />
              <div className="grid gap-4 xl:grid-cols-2">
                <OrdersBlock orders={orders.slice(0, 5)} status={profile.ordersStatus} error={profile.ordersError} />
                <AddressesBlock
                  profile={profile}
                  form={addrForm}
                  setForm={setAddrForm}
                  onToast={setToast}
                  onErr={setErr}
                />
              </div>
              <PaymentsBlock
                profile={profile}
                cardForm={cardForm}
                setCardForm={setCardForm}
                walletForm={walletForm}
                setWalletForm={setWalletForm}
                onToast={setToast}
                onErr={setErr}
              />
            </>
          )}
          {tab === 'clinic' && (
            <ClinicCard
              draft={clinicDraft}
              editing={editingClinic}
              setEditing={setEditingClinic}
              setForm={setClinicForm}
              onSave={saveClinic}
              onPhoto={async (file) => {
                try {
                  const data = await toAvatar(file)
                  setClinicForm({ ...clinicDraft, photo: data })
                  setEditingClinic(true)
                } catch (e) { setErr(e.message) }
              }}
              busy={busy}
              full
            />
          )}
          {tab === 'orders' && <OrdersBlock orders={orders} status={profile.ordersStatus} error={profile.ordersError} full />}
          {tab === 'courses' && <CoursesBlock courses={myCourses} full />}
          {tab === 'saved' && <SavedBlock profile={profile} />}
          {tab === 'addresses' && (
            <AddressesBlock profile={profile} form={addrForm} setForm={setAddrForm} onToast={setToast} onErr={setErr} full />
          )}
          {tab === 'payments' && (
            <PaymentsBlock
              profile={profile}
              cardForm={cardForm}
              setCardForm={setCardForm}
              walletForm={walletForm}
              setWalletForm={setWalletForm}
              onToast={setToast}
              onErr={setErr}
              full
            />
          )}
          {tab === 'notifs' && (
            <NotifsBlock
              items={notifRes.data}
              loading={notifRes.loading}
              error={notifRes.error}
              read={profile.readNotifs || []}
              onMark={async (ids) => {
                await markNotificationsRead(ids)
                profileStore.update({ readNotifs: [...new Set([...(profile.readNotifs || []), ...ids])] })
                setNotifTick((t) => t + 1)
              }}
            />
          )}
          {tab === 'security' && <SecurityBlock />}
        </div>
      </div>
    </div>
  )
}

function SectionHead({ title, action, onAction }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-[16px] font-extrabold text-[#12263a]">{title}</h2>
      {action && (
        <button type="button" onClick={onAction} className="text-[13px] font-semibold text-[#0F766E] hover:underline">{action}</button>
      )}
    </div>
  )
}

function Empty({ text }) {
  return <p className="rounded-xl border border-dashed border-[#d5ebe6] px-4 py-8 text-center text-[13px] text-[#6b7c8f]">{text}</p>
}

function PersonalCard({ draft, editing, setEditing, setForm, onSave, busy }) {
  const set = (k) => (e) => setForm((f) => ({ ...(f || draft), [k]: e.target.value }))
  return (
    <section className={card}>
      <SectionHead
        title="Shaxsiy ma’lumotlar"
        action={editing ? 'Bekor qilish' : 'Tahrirlash'}
        onAction={() => {
          if (editing) { setEditing(false); setForm(null) }
          else { setEditing(true); setForm(draft) }
        }}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-[12.5px] font-semibold text-[#12263a]">Ism familiya
          <input disabled={!editing} className={field} value={draft.name} onChange={set('name')} />
        </label>
        <label className="block text-[12.5px] font-semibold text-[#12263a]">Telefon
          <PhoneInput disabled={!editing} className={`mt-1.5 h-11 ${!editing ? 'opacity-60' : ''}`} inputClassName="text-[14px]" value={draft.phone} onChange={(v) => setForm((f) => ({ ...(f || draft), phone: extractUzLocalDigits(v) }))} valueMode="local" placeholder="+998 90 123 45 67" />
        </label>
        <label className="block text-[12.5px] font-semibold text-[#12263a]">Email
          <input disabled={!editing} className={field} value={draft.email} onChange={set('email')} placeholder="email@example.com" />
        </label>
        <label className="block text-[12.5px] font-semibold text-[#12263a]">Mutaxassislik
          <select disabled={!editing} className={field} value={draft.role} onChange={set('role')}>
            <option value="">Tanlang</option>
            {SPECS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="block text-[12.5px] font-semibold text-[#12263a]">Tajriba (yil)
          <select disabled={!editing} className={field} value={draft.experience} onChange={set('experience')}>
            <option value="">Tanlang</option>
            {YEARS.map((y) => <option key={y} value={y}>{y} yil</option>)}
          </select>
        </label>
        <label className="block text-[12.5px] font-semibold text-[#12263a]">Litsenziya raqami
          <input disabled={!editing} className={field} value={draft.license} onChange={set('license')} placeholder="012345" />
        </label>
        <label className="block text-[12.5px] font-semibold text-[#12263a] sm:col-span-2">Men haqimda
          <textarea disabled={!editing} rows={3} className={`${field} h-auto py-2`} value={draft.about} onChange={set('about')} placeholder="Qisqa bio…" />
        </label>
      </div>
      {editing && (
        <button type="button" disabled={busy} onClick={onSave} className="mt-4 h-10 rounded-xl bg-[#0F766E] px-5 text-[13.5px] font-semibold text-white disabled:opacity-60">
          Saqlash
        </button>
      )}
    </section>
  )
}

function ClinicCard({ draft, editing, setEditing, setForm, onSave, onPhoto, busy, full }) {
  const set = (k) => (e) => setForm((f) => ({ ...(f || draft), [k]: e.target.value }))
  const empty = !draft.name && !draft.address && !draft.phone
  return (
    <section className={card}>
      <SectionHead
        title="Klinikam"
        action={editing ? 'Bekor qilish' : 'Tahrirlash'}
        onAction={() => {
          if (editing) { setEditing(false); setForm(null) }
          else { setEditing(true); setForm(draft) }
        }}
      />
      {!editing && empty ? (
        <Empty text="Klinika ma’lumotlari qo‘shilmagan." />
      ) : (
        <div className={`grid gap-3 ${full ? 'lg:grid-cols-[240px_1fr]' : ''}`}>
          <div className="relative overflow-hidden rounded-xl bg-[#eef5f4]">
            {draft.photo ? (
              <img src={draft.photo} alt="" className="h-36 w-full object-cover" />
            ) : (
              <img src="/images/ishlar/ish-reception.jpg" alt="" className="h-36 w-full object-cover opacity-80" />
            )}
            {editing && (
              <label className="absolute inset-x-2 bottom-2 flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-white/95 text-[12.5px] font-semibold text-[#0F766E]">
                <Camera className="size-3.5" /> Rasm
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onPhoto(f) }} />
              </label>
            )}
          </div>
          <div className="grid gap-2">
            {editing ? (
              <>
                <input className={field} value={draft.name} onChange={set('name')} placeholder="Klinika nomi" />
                <input className={field} value={draft.address} onChange={set('address')} placeholder="Manzil" />
                <MapPicker lat={draft.lat} lng={draft.lng} onChange={({ lat, lng, geo }) => setForm((d) => ({ ...(d || draft), lat, lng, ...(geo?.display ? { address: [geo.city, geo.district && geo.district !== 'Markaz' ? geo.district : '', geo.street].filter(Boolean).join(', ') } : {}) }))} />
                <input className={field} value={draft.hours} onChange={set('hours')} placeholder="09:00–19:00" />
                <PhoneInput className="h-11" value={draft.phone} onChange={(v) => setForm((f) => ({ ...(f || draft), phone: extractUzLocalDigits(v) }))} valueMode="local" placeholder="+998 90 123 45 67" />
                <input className={field} value={draft.website} onChange={set('website')} placeholder="https://" />
                <button type="button" disabled={busy} onClick={onSave} className="mt-1 h-10 rounded-xl bg-[#0F766E] px-4 text-[13.5px] font-semibold text-white">Saqlash</button>
              </>
            ) : (
              <>
                <p className="text-[15px] font-bold text-[#12263a]">{draft.name || '—'}</p>
                <p className="flex items-start gap-2 text-[13px] text-[#5b6b7d]"><MapPin className="mt-0.5 size-3.5 shrink-0 text-[#0F766E]" />{draft.address || '—'}</p>
                {draft.lat != null && <MapPreview lat={draft.lat} lng={draft.lng} />}
                <p className="text-[13px] text-[#5b6b7d]">Ish vaqti: {draft.hours || '—'}</p>
                <p className="flex items-center gap-2 text-[13px] text-[#5b6b7d]"><Phone className="size-3.5 text-[#0F766E]" />{draft.phone || '—'}</p>
                {draft.website && <a href={draft.website} target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-[#0F766E]">{draft.website}</a>}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function SettingsCard({ profile }) {
  const setLang = (e) => profileStore.update({ lang: e.target.value })
  const toggle = (key) => () => profileStore.update({ notif: { ...profile.notif, [key]: !profile.notif?.[key] } })
  return (
    <section className={card}>
      <SectionHead title="Tizim sozlamalari" />
      <label className="block text-[12.5px] font-semibold text-[#12263a]">Til
        <select className={field} value={profile.lang || 'uz'} onChange={setLang}>
          {LANGS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <ul className="mt-3 divide-y divide-[#eef3f2]">
        {NOTIF_TOGGLES.map(([key, label]) => (
          <li key={key} className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-[13.5px] text-[#1a2b3c]">{label}</span>
            <button
              type="button"
              role="switch"
              aria-checked={!!profile.notif?.[key]}
              onClick={toggle(key)}
              className={`relative h-6 w-11 rounded-full transition ${profile.notif?.[key] ? 'bg-[#0F766E]' : 'bg-[#cfd8df]'}`}
            >
              <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${profile.notif?.[key] ? 'left-5' : 'left-0.5'}`} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function CoursesBlock({ courses, full }) {
  return (
    <section className={card}>
      <SectionHead title="Kurslarim va sertifikatlar" />
      {!courses.length ? (
        <Empty text="Hali kurs yo‘q. Ta’lim bo‘limidan kurs qo‘shing." />
      ) : (
        <div className={`grid gap-3 ${full ? 'md:grid-cols-2 xl:grid-cols-3' : ''}`}>
          {courses.map((c) => (
            <article key={c.id} className="flex gap-3 rounded-xl border border-[#e7eef2] p-2.5">
              <img src={c.image} alt="" className="size-[72px] shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-bold text-[#12263a]">{c.title}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e7eef2]">
                  <div className={`h-full rounded-full ${c.complete ? 'bg-[#16a34a]' : 'bg-[#0F766E]'}`} style={{ width: `${c.pct}%` }} />
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="text-[11.5px] font-semibold text-[#5b6b7d]">{c.pct}%</span>
                  {c.complete ? (
                    <button type="button" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#0F766E]"><Download className="size-3.5" /> Sertifikatni yuklab olish</button>
                  ) : (
                    <Link to="/talim" className="text-[12px] font-semibold text-[#0F766E]">Davom ettirish</Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function OrdersBlock({ orders, status, error, full }) {
  return (
    <section className={card}>
      <SectionHead title={full ? 'Buyurtmalarim' : 'Oxirgi buyurtmalar'} action={full ? null : 'Barchasi'} onAction={() => {}} />
      {status === 'loading' && !orders.length && <p className="py-6 text-center text-[13px] text-[#6b7c8f]">Yuklanmoqda…</p>}
      {status === 'error' && (
        <p role="alert" className="rounded-xl bg-[#fff4f4] px-3 py-2 text-[13px] text-[#b42318]">
          {error} <button type="button" className="ml-2 font-semibold text-[#0F766E]" onClick={() => profileStore.refreshOrders()}>Qayta urinish</button>
        </p>
      )}
      {status !== 'loading' && status !== 'error' && !orders.length && <Empty text="Hali buyurtma yo‘q." />}
      <ul className="divide-y divide-[#eef3f2]">
        {orders.map((o) => {
          const thumb = o.items?.[0]?.image || '/images/market/p1.jpg'
          const tone = pill[o.status] || pill.processing
          return (
            <li key={o.dbId || o.id} className="flex items-center gap-3 py-3">
              <img src={thumb} alt="" className="size-11 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-bold text-[#12263a]"># {o.id}</p>
                <p className="text-[12px] text-[#6b7c8f]">{o.at}</p>
              </div>
              <div className="text-right">
                <p className="text-[13px] font-bold text-[#12263a]">{som(o.total || o.goods || 0)}</p>
                <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{o.statusLabel || o.status}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function AddressesBlock({ profile, form, setForm, onToast, onErr, full }) {
  const list = profile.addresses || []
  const blank = () => ({ id: `a${Date.now().toString(36)}`, kind: 'home', name: profile.name || '', phone: profile.phone || '', city: profile.city || 'Toshkent', district: 'Markaz', street: '', extra: '' })
  const save = async () => {
    try {
      const row = addr(form.id, form.kind, form.name, form.phone, form.district, form.street, form.extra, form.city, form.lat ?? null, form.lng ?? null)
      const exists = list.some((x) => x.id === row.id)
      const addresses = exists ? list.map((x) => (x.id === row.id ? row : x)) : [...list, row]
      profileStore.update({ addresses, defaultAddr: profile.defaultAddr || row.id })
      await flushProfile()
      setForm(null)
      onToast(exists ? 'Manzil yangilandi' : 'Manzil qo‘shildi')
    } catch (e) { onErr(e.message) }
  }
  const remove = async (id) => {
    const addresses = list.filter((x) => x.id !== id)
    profileStore.update({ addresses, defaultAddr: profile.defaultAddr === id ? addresses[0]?.id || '' : profile.defaultAddr })
    await flushProfile()
    onToast('Manzil o‘chirildi')
  }
  return (
    <section className={card}>
      <SectionHead title="Manzillar" />
      {!list.length && !form && <Empty text="Saqlangan manzil yo‘q." />}
      <div className={`grid gap-3 ${full ? 'md:grid-cols-2 xl:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {list.map((a) => (
          <article key={a.id} className={`rounded-xl border p-3 ${a.id === profile.defaultAddr ? 'border-[#0F766E] bg-[#f0faf8]' : 'border-[#e7eef2]'}`}>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-[#e7f6f4] px-2 py-0.5 text-[11.5px] font-semibold text-[#0F766E]">{a.tag}</span>
              {a.id === profile.defaultAddr && <span className="text-[11px] font-semibold text-[#0F766E]">Asosiy</span>}
              <span className="flex-1" />
              <button type="button" aria-label="Tahrirlash" onClick={() => setForm({ ...a })} className="text-[#0F766E]"><Pencil className="size-3.5" /></button>
              <button type="button" aria-label="O‘chirish" onClick={() => remove(a.id)} className="text-[#d14343]"><Trash2 className="size-3.5" /></button>
            </div>
            <p className="mt-2 text-[13.5px] font-bold text-[#12263a]">{a.name}</p>
            <p className="mt-1 text-[12.5px] text-[#5b6b7d]">{fmtPhone(a.phone)}</p>
            <p className="mt-1 text-[12.5px] text-[#5b6b7d]">{a.city}, {a.address}</p>
            {a.lat != null && <MapPreview lat={a.lat} lng={a.lng} />}
            {a.id !== profile.defaultAddr && (
              <button type="button" className="mt-2 text-[12px] font-semibold text-[#0F766E]" onClick={() => { profileStore.update({ defaultAddr: a.id }); flushProfile() }}>Asosiy qilish</button>
            )}
          </article>
        ))}
        {!form && (
          <button type="button" onClick={() => setForm(blank())} className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#0F766E]/40 text-[13px] font-semibold text-[#0F766E] hover:bg-[#f0faf8]">
            <Plus className="size-5" /> Yangi manzil qo‘shish
          </button>
        )}
      </div>
      {form && (
        <div className="mt-3 grid gap-2 rounded-xl border border-[#d7e5e3] bg-[#f8fbfb] p-3 sm:grid-cols-2">
          <select className={field} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            {ADDRESS_KINDS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input className={field} placeholder="Ism" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <PhoneInput className="h-11" placeholder="+998 90 123 45 67" value={form.phone} onChange={(v) => setForm({ ...form, phone: extractUzLocalDigits(v) })} valueMode="local" />
          <input className={field} placeholder="Shahar" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input className={field} placeholder="Tuman" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
          <input className={field} placeholder="Ko‘cha, uy" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
          <div className="sm:col-span-2"><MapPicker lat={form.lat} lng={form.lng} height={240} onChange={({ lat, lng, geo }) => setForm((f) => ({ ...f, lat, lng, ...(geo?.city ? { city: geo.city } : {}), ...(geo?.district ? { district: geo.district.replace(/ tumani$/i, '') } : {}), ...(geo?.street ? { street: geo.street } : {}) }))} /></div>
          <div className="flex gap-2 sm:col-span-2">
            <button type="button" onClick={save} className="h-10 rounded-xl bg-[#0F766E] px-4 text-[13px] font-semibold text-white">Saqlash</button>
            <button type="button" onClick={() => setForm(null)} className="h-10 rounded-xl border border-[#d7e5e3] px-4 text-[13px] font-semibold">Bekor</button>
          </div>
        </div>
      )}
    </section>
  )
}

function PaymentsBlock({ profile, cardForm, setCardForm, walletForm, setWalletForm, onToast, onErr, full }) {
  const cards = profile.cards || []
  const wallets = profile.linkedWallets || []
  const demo = isDemoPayments()
  const badge = demoBadgeProps()

  const saveCard = async () => {
    try {
      const token = tokenizeCardInput(cardForm)
      const next = cards.some((c) => c.id === token.id)
        ? cards.map((c) => (c.id === token.id ? token : c))
        : [...cards.map((c) => (token.isDefault ? { ...c, isDefault: false } : c)), token]
      if (token.isDefault || !cards.length) {
        next.forEach((c) => { c.isDefault = c.id === token.id })
      }
      profileStore.update({ cards: next, defaultPay: token.isDefault ? `card:${token.id}` : profile.defaultPay })
      await flushProfile()
      setCardForm(null)
      onToast('Karta qo‘shildi (faqat oxirgi 4 raqam saqlandi)')
    } catch (e) { onErr(e.message) }
  }

  const saveWallet = async () => {
    try {
      const row = linkWalletInput(walletForm)
      const rest = wallets.filter((w) => w.provider !== row.provider)
      const next = [...(row.isDefault ? rest.map((w) => ({ ...w, isDefault: false })) : rest), row]
      profileStore.update({ linkedWallets: next, defaultPay: row.isDefault ? `wallet:${row.provider}` : profile.defaultPay })
      await flushProfile()
      setWalletForm(null)
      onToast(`${row.provider === 'click' ? 'Click' : 'Payme'} bog‘landi`)
    } catch (e) { onErr(e.message) }
  }

  const removeCard = async (id) => {
    profileStore.update({ cards: cards.filter((c) => c.id !== id) })
    await flushProfile()
    onToast('Karta olib tashlandi')
  }

  return (
    <section className={card}>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-[16px] font-extrabold text-[#12263a]">To‘lov usullari</h2>
        {demo && (
          <span title={badge.title} className="rounded-full bg-[#fff4d6] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#b45309]">{badge.label}</span>
        )}
      </div>
      <p className="mb-3 text-[12.5px] text-[#6b7c8f]">
        UZCARD/HUMO uchun faqat turi, oxirgi 4 raqam va muddat saqlanadi. Click/Payme uchun telefon yoki nom. To‘liq karta raqami va CVV hech qachon yozilmaydi.
        {demo && ' Hozircha to‘lovlar simulyatsiya (demo) rejimida.'}
      </p>
      <div className={`grid gap-3 ${full ? 'md:grid-cols-2 xl:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        {cards.map((c) => (
          <article key={c.id} className={`relative overflow-hidden rounded-2xl p-4 text-white ${c.brand === 'HUMO' ? 'bg-gradient-to-br from-[#0b4f8a] to-[#1d7ad6]' : 'bg-gradient-to-br from-[#0F766E] to-[#14b8a6]'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold tracking-wide">{c.brand}</span>
              {c.isDefault && <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10.5px] font-semibold">Asosiy</span>}
            </div>
            <p className="mt-6 text-[18px] font-bold tracking-[0.2em]">•••• {c.last4}</p>
            <div className="mt-3 flex items-center justify-between text-[12px]">
              <span>{c.exp}</span>
              <button type="button" onClick={() => removeCard(c.id)} className="rounded-md bg-white/15 px-2 py-0.5">O‘chirish</button>
            </div>
          </article>
        ))}
        {wallets.map((w) => (
          <article key={w.id} className="rounded-2xl border border-[#e7eef2] bg-[#f8fbfb] p-4">
            <div className="flex items-center gap-2">
              <Wallet className="size-5 text-[#0F766E]" />
              <span className="text-[14px] font-bold text-[#12263a]">{w.provider === 'click' ? 'Click' : 'Payme'}</span>
              {w.isDefault && <span className="rounded-full bg-[#e7f6f4] px-2 py-0.5 text-[10.5px] font-semibold text-[#0F766E]">Asosiy</span>}
              {demo && <span className="rounded-full bg-[#fff4d6] px-1.5 py-0.5 text-[10px] font-bold text-[#b45309]">Demo</span>}
            </div>
            <p className="mt-3 text-[13px] text-[#5b6b7d]">{w.label || fmtPhone(w.phone)}</p>
            <button
              type="button"
              className="mt-3 text-[12px] font-semibold text-[#d14343]"
              onClick={async () => {
                profileStore.update({ linkedWallets: wallets.filter((x) => x.id !== w.id) })
                await flushProfile()
                onToast('Uzildi')
              }}
            >
              Uzish
            </button>
          </article>
        ))}
        {!cardForm && (
          <button type="button" onClick={() => setCardForm({ brand: 'UZCARD', number: '', exp: '', setDefault: !cards.length })} className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#0F766E]/40 text-[13px] font-semibold text-[#0F766E] hover:bg-[#f0faf8]">
            <CreditCard className="size-5" /> Yangi karta qo‘shish
          </button>
        )}
      </div>

      {cardForm && (
        <div className="mt-3 grid gap-2 rounded-xl border border-[#d7e5e3] bg-[#f8fbfb] p-3 sm:grid-cols-2">
          <select className={field} value={cardForm.brand} onChange={(e) => setCardForm({ ...cardForm, brand: e.target.value })}>
            <option value="UZCARD">UZCARD</option>
            <option value="HUMO">HUMO</option>
          </select>
          <input className={field} inputMode="numeric" placeholder="Karta raqami (saqlanmaydi)" value={cardForm.number} onChange={(e) => setCardForm({ ...cardForm, number: e.target.value.replace(/\D/g, '').slice(0, 16) })} />
          <input className={field} placeholder="MM/YY" value={cardForm.exp} onChange={(e) => {
            const d = e.target.value.replace(/\D/g, '').slice(0, 4)
            const v = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
            setCardForm({ ...cardForm, exp: v })
          }} />
          <label className="flex items-center gap-2 text-[13px] text-[#1a2b3c]">
            <input type="checkbox" checked={!!cardForm.setDefault} onChange={(e) => setCardForm({ ...cardForm, setDefault: e.target.checked })} /> Asosiy qilish
          </label>
          <p className="sm:col-span-2 text-[11.5px] text-[#6b7c8f]">CVV so‘ralmaydi va saqlanmaydi. Raqam faqat oxirgi 4 ta uchun ishlatiladi.</p>
          <div className="flex gap-2 sm:col-span-2">
            <button type="button" onClick={saveCard} className="h-10 rounded-xl bg-[#0F766E] px-4 text-[13px] font-semibold text-white">Saqlash</button>
            <button type="button" onClick={() => setCardForm(null)} className="h-10 rounded-xl border px-4 text-[13px] font-semibold">Bekor</button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {WALLET_PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setWalletForm({ provider: p.id, phone: profile.phone || '', label: '', setDefault: false })}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#d7e5e3] bg-white px-3 text-[12.5px] font-semibold text-[#12263a] hover:border-[#0F766E]"
          >
            <Plus className="size-3.5 text-[#0F766E]" /> {p.label} bog‘lash
          </button>
        ))}
      </div>
      {walletForm && (
        <div className="mt-3 grid gap-2 rounded-xl border border-[#d7e5e3] bg-[#f8fbfb] p-3 sm:grid-cols-2">
          <p className="sm:col-span-2 text-[13px] font-semibold text-[#12263a]">{walletForm.provider === 'click' ? 'Click' : 'Payme'} — demo bog‘lash</p>
          <PhoneInput className="h-11" placeholder="+998 90 123 45 67" value={walletForm.phone} onChange={(v) => setWalletForm({ ...walletForm, phone: extractUzLocalDigits(v) })} valueMode="local" />
          <input className={field} placeholder="Nom (ixtiyoriy)" value={walletForm.label} onChange={(e) => setWalletForm({ ...walletForm, label: e.target.value })} />
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={!!walletForm.setDefault} onChange={(e) => setWalletForm({ ...walletForm, setDefault: e.target.checked })} /> Asosiy qilish
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="button" onClick={saveWallet} className="h-10 rounded-xl bg-[#0F766E] px-4 text-[13px] font-semibold text-white">Bog‘lash</button>
            <button type="button" onClick={() => setWalletForm(null)} className="h-10 rounded-xl border px-4 text-[13px] font-semibold">Bekor</button>
          </div>
        </div>
      )}
    </section>
  )
}

function SavedBlock({ profile }) {
  const products = (profile.favProducts || []).map((id) => marketProducts.find((p) => String(p.id) === String(id)) || { id, name: String(id) })
  const courses = (profile.favCourses || []).map((id) => COURSES.find((c) => c.id === id) || { id, title: id })
  const masters = profile.favMasters || []
  const n = products.length + courses.length + masters.length
  const remove = async (key, id) => {
    profileStore.toggleFav(key, id)
    await flushProfile()
  }
  return (
    <section className={card}>
      <SectionHead title="Saqlanganlar" />
      {!n ? <Empty text="Saqlangan mahsulot, kurs yoki usta yo‘q." /> : (
        <ul className="grid gap-2">
          {products.map((p) => (
            <li key={`p-${p.id}`} className="flex items-center justify-between rounded-xl border border-[#e7eef2] px-3 py-2 text-[13.5px]">
              <span className="font-semibold text-[#12263a]">{p.name || p.title || p.id}</span>
              <button type="button" className="text-[12px] font-semibold text-[#d14343]" onClick={() => remove('favProducts', p.id)}>O‘chirish</button>
            </li>
          ))}
          {courses.map((c) => (
            <li key={`c-${c.id}`} className="flex items-center justify-between rounded-xl border border-[#e7eef2] px-3 py-2 text-[13.5px]">
              <span className="font-semibold text-[#12263a]">{c.title || c.id}</span>
              <button type="button" className="text-[12px] font-semibold text-[#d14343]" onClick={() => remove('favCourses', c.id)}>O‘chirish</button>
            </li>
          ))}
          {masters.map((id) => (
            <li key={`m-${id}`} className="flex items-center justify-between rounded-xl border border-[#e7eef2] px-3 py-2 text-[13.5px]">
              <span className="font-semibold text-[#12263a]">{id}</span>
              <button type="button" className="text-[12px] font-semibold text-[#d14343]" onClick={() => remove('favMasters', id)}>O‘chirish</button>
            </li>
          ))}
        </ul>
      )}
      <Link to="/marketplace" className="mt-3 inline-flex text-[13px] font-semibold text-[#0F766E]">Marketplace’ga o‘tish</Link>
    </section>
  )
}

function NotifsBlock({ items, loading, error, read, onMark }) {
  const unreadIds = (items || []).filter((n) => !n.read_at && !read.includes(n.id)).map((n) => n.id)
  return (
    <section className={card}>
      <SectionHead title="Bildirishnomalar" action={unreadIds.length ? 'Barchasini o‘qildi' : null} onAction={() => onMark(unreadIds)} />
      {loading && <p className="py-6 text-center text-[13px] text-[#6b7c8f]">Yuklanmoqda…</p>}
      {error && <p className="rounded-xl bg-[#fff4f4] px-3 py-2 text-[13px] text-[#b42318]">{error}</p>}
      {!loading && !error && !(items || []).length && <Empty text="Bildirishnoma yo‘q." />}
      <ul className="divide-y divide-[#eef3f2]">
        {(items || []).map((n) => {
          const isRead = n.read_at || read.includes(n.id)
          return (
            <li key={n.id} className={`py-3 ${isRead ? 'opacity-70' : ''}`}>
              <p className="text-[13.5px] font-bold text-[#12263a]">{n.title}</p>
              <p className="mt-0.5 text-[12.5px] text-[#5b6b7d]">{n.body}</p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function SecurityBlock() {
  return (
    <section className={card}>
      <SectionHead title="Xavfsizlik" />
      <div className="flex items-start gap-3 rounded-xl bg-[#f4f8f7] p-3">
        <Shield className="mt-0.5 size-5 text-[#0F766E]" />
        <div>
          <p className="text-[14px] font-bold text-[#12263a]">Hisob himoyasi</p>
          <p className="mt-1 text-[13px] text-[#5b6b7d]">Parolni o‘zgartirish va ikki bosqichli tasdiqlash tez orada qo‘shiladi. Hozircha sessiyani chiqish orqali yakunlang.</p>
        </div>
      </div>
      <div className="mt-3 flex items-start gap-3 rounded-xl bg-[#f4f8f7] p-3">
        <Globe className="mt-0.5 size-5 text-[#0F766E]" />
        <div>
          <p className="text-[14px] font-bold text-[#12263a]">Faol qurilmalar</p>
          <p className="mt-1 text-[13px] text-[#5b6b7d]">Ushbu brauzer sessiyasi faol.</p>
        </div>
      </div>
    </section>
  )
}
