import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, LogOut, MapPin, Ticket } from 'lucide-react'
import ShopLayout from '../components/market/ShopLayout'
import LiveQr from '../components/LiveQr'
import { allOrders, flushProfile, profileStore, useProfile } from '../profileStore'
import { publicRecords, useHub } from '../hubStore'
import { signOut, useSession } from '../sessionStore'
import { som } from '../marketData'

const SPECS = ['Stomatolog', 'Talaba', 'Klinika egasi', 'Tish texnigi', 'Sotuvchi', 'Implantolog', 'Ortodont', 'Endodontist', 'Terapevt']
const CITIES = ['Toshkent', 'Samarqand', 'Buxoro', 'Andijon', 'Farg‘ona', 'Namangan', 'Nukus', 'Boshqa']
const field = 'mt-1.5 h-11 w-full rounded-xl border border-[#dbe8e6] bg-white px-3 text-[14px] text-ink outline-none focus:border-sea'

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

export default function Profil({ section = 'profile' }) {
  return (
    <ShopLayout active="profil" search="plain" placeholder="Mahsulot, kurs yoki seminar qidiring...">
      <Board initial={section} />
    </ShopLayout>
  )
}

function Board({ initial }) {
  const profile = useProfile()
  const session = useSession()
  const hub = useHub()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [tab, setTab] = useState(initial === 'orders' ? 'orders' : initial === 'tickets' ? 'tickets' : 'profile')
  const [form, setForm] = useState(null)
  const [toast, setToast] = useState('')
  const [err, setErr] = useState('')
  const base = profile.accountLive ? profile : {
    name: session.profile?.name || '',
    phone: String(session.profile?.phone || '').replace(/^\+998/, ''),
    role: session.profile?.specialty || '',
    city: session.profile?.city || '',
    clinic: session.profile?.clinic || '',
  }
  const draft = form || {
    name: base.name || '',
    phone: base.phone || '',
    role: base.role || '',
    city: base.city || '',
    clinic: base.clinic || '',
  }
  const set = (key) => (e) => setForm({ ...draft, [key]: e.target.value })
  const orders = allOrders(profile)
  const shownName = profile.name || session.profile?.name || ''
  const shownAvatar = profile.avatar || session.profile?.avatar_url || ''
  const ticketsLoading = !hub.ready
  const catalog = publicRecords(hub)
  const tickets = (hub.myRegistrations || []).map((row) => {
    const seminar = catalog.find((item) => item.id === row.seminar_id)
    return {
      id: row.id,
      code: row.code || `QR-${row.id}`,
      title: seminar?.title || 'Seminar',
      when: seminar ? `${seminar.day} ${seminar.mon}` : (row.registered || ''),
      place: [seminar?.city || row.city, seminar?.place].filter(Boolean).join(', '),
      ticket: row.ticket || 'Chipta',
      href: row.seminar_id ? `/seminarlar/${row.seminar_id}` : '/seminarlar',
    }
  })

  const save = async () => {
    if (draft.name.trim().length < 2) {
      setErr('Ism familiyani kiriting')
      return
    }
    setErr('')
    profileStore.update({
      accountLive: true,
      loggedOut: false,
      name: draft.name.trim(),
      phone: draft.phone.replace(/\D/g, '').slice(-9),
      role: draft.role,
      city: draft.city,
      clinic: draft.clinic.trim(),
    })
    try {
      await flushProfile()
      setToast('Profil saqlandi')
    } catch (error) {
      setErr(error?.message || 'Profil saqlanmadi')
    }
  }

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      profileStore.update({ accountLive: true, loggedOut: false, avatar: await toAvatar(file) })
      await flushProfile()
      setToast('Rasm saqlandi')
    } catch (error) {
      setErr(error?.message || 'Rasmni o‘qib bo‘lmadi')
    }
  }

  const logout = async () => {
    await signOut()
    profileStore.update({ loggedOut: true, accountLive: false })
    navigate('/kirish')
  }

  if (session.status !== 'authed' && !profile.accountLive) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-[26px] font-extrabold text-ink">Profil</h1>
        <p className="mt-2 text-[14px] text-muted">Ism, chiptalar va buyurtmalarni ko‘rish uchun hisobingizga kiring.</p>
        <Link to="/kirish" className="mt-5 inline-flex h-11 items-center rounded-xl bg-sea px-5 text-[14px] font-semibold text-white">Kirish</Link>
      </div>
    )
  }

  return (
    <div className="grid gap-4 pb-10 pt-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-2xl bg-white p-4 shadow-card">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => fileRef.current?.click()} className="relative shrink-0" aria-label="Rasm yuklash">
            <img src={shownAvatar || '/images/avatar.jpg'} alt="" className="size-16 rounded-full object-cover" />
            <span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-sea text-white"><Camera className="size-3.5" /></span>
          </button>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-ink">{shownName || 'Ism kiritilmagan'}</p>
            <p className="truncate text-[12px] text-muted">{profile.role || session.profile?.specialty || 'Mutaxassislik tanlanmagan'}</p>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />
        <nav className="mt-4 grid gap-1">
          {[
            ['profile', 'Profil'],
            ['tickets', `Mening chiptalarim (${tickets.length})`],
            ['orders', `Buyurtmalar (${orders.length})`],
          ].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTab(id)} className={`h-10 rounded-xl px-3 text-left text-[13.5px] font-semibold ${tab === id ? 'bg-[#e7f6f4] text-sea' : 'text-ink hover:bg-page'}`}>{label}</button>
          ))}
        </nav>
        <button type="button" onClick={logout} className="mt-3 flex h-10 w-full items-center gap-2 rounded-xl px-3 text-[13.5px] font-semibold text-[#d14343] hover:bg-[#fff5f5]">
          <LogOut className="size-4" /> Chiqish
        </button>
      </aside>

      <section className="min-w-0 rounded-2xl bg-white p-4 shadow-card sm:p-5">
        {toast && <p className="mb-3 rounded-xl bg-[#e7f8ee] px-3 py-2 text-[13px] text-[#15803d]">{toast}</p>}
        {profile.syncError && <p className="mb-3 rounded-xl bg-[#fff4f4] px-3 py-2 text-[13px] text-[#b42318]">{profile.syncError}</p>}
        {tab === 'profile' && (
          <form onSubmit={(e) => { e.preventDefault(); save() }}>
            <h1 className="text-[22px] font-extrabold text-ink">Profil</h1>
            <p className="mt-1 text-[13px] text-muted">Ism, telefon va klinika ma’lumotlari shu hisobda saqlanadi.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-[13px] font-semibold text-ink">Ism familiya
                <input name="customer-name" autoComplete="name" className={field} value={draft.name} onChange={set('name')} />
              </label>
              <label className="block text-[13px] font-semibold text-ink">Telefon
                <input name="customer-phone" autoComplete="tel" inputMode="numeric" className={field} value={draft.phone} onChange={set('phone')} placeholder="90 123 45 67" />
              </label>
              <label className="block text-[13px] font-semibold text-ink">Mutaxassislik
                <select name="customer-spec" className={field} value={draft.role} onChange={set('role')}>
                  <option value="">Tanlang</option>
                  {SPECS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="block text-[13px] font-semibold text-ink">Shahar
                <select name="customer-city" className={field} value={draft.city} onChange={set('city')}>
                  <option value="">Tanlang</option>
                  {CITIES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="block text-[13px] font-semibold text-ink sm:col-span-2">Klinika
                <input name="customer-clinic" className={field} value={draft.clinic} onChange={set('clinic')} placeholder="Klinika nomi" />
              </label>
            </div>
            {err && <p className="mt-2 text-[13px] text-[#d14343]">{err}</p>}
            <button type="submit" className="mt-4 h-11 rounded-xl bg-sea px-5 text-[14px] font-semibold text-white">Saqlash</button>
          </form>
        )}
        {tab === 'tickets' && (
          <div>
            <h1 className="text-[22px] font-extrabold text-ink">Mening chiptalarim</h1>
            <p className="mt-1 text-[13px] text-muted">Ro‘yxatdan o‘tgan seminarlar va elektron chiptalar.</p>
            {ticketsLoading && <p className="mt-6 rounded-2xl border border-dashed border-[#d5ebe6] px-4 py-10 text-center text-[13px] text-muted">Chiptalar yuklanmoqda…</p>}
            {!ticketsLoading && !tickets.length && <p className="mt-6 rounded-2xl border border-dashed border-[#d5ebe6] px-4 py-10 text-center text-[13px] text-muted">Hali chipta yo‘q. Seminarga yozilgach, QR chipta shu yerda chiqadi.</p>}
            <div className="mt-4 grid gap-3">
              {tickets.map((item) => (
                <article key={item.id} className="flex flex-col gap-3 rounded-2xl border border-[#e6f1ef] p-3 sm:flex-row sm:items-center">
                  <LiveQr text={`STH:${item.code}`} className="size-28 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-ink">{item.title}</p>
                    <p className="mt-1 flex items-center gap-1 text-[12.5px] text-muted"><Ticket className="size-3.5" /> {item.ticket} · {item.code}</p>
                    <p className="mt-1 flex items-center gap-1 text-[12.5px] text-muted"><MapPin className="size-3.5" /> {[item.when, item.place].filter(Boolean).join(' · ') || 'Sana keyinroq'}</p>
                    <Link to={item.href} className="mt-2 inline-flex text-[13px] font-semibold text-sea">Seminarni ochish</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
        {tab === 'orders' && (
          <div>
            <h1 className="text-[22px] font-extrabold text-ink">Buyurtmalar</h1>
            <p className="mt-1 text-[13px] text-muted">Do‘kondagi buyurtmalaringiz.</p>
            {!orders.length && <p className="mt-6 rounded-2xl border border-dashed border-[#d5ebe6] px-4 py-10 text-center text-[13px] text-muted">Hali buyurtma yo‘q.</p>}
            <ul className="mt-4 divide-y divide-[#eef3f2]">
              {orders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-ink">{order.id}</p>
                    <p className="truncate text-[12px] text-muted">{order.at} · {order.status || 'processing'}</p>
                  </div>
                  <p className="shrink-0 text-[13px] font-bold text-ink">{som(order.total || order.goods || 0)}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
