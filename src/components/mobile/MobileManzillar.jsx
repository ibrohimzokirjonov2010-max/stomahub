import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Check, MapPin, Pencil, Phone, Plus, Search, ShoppingCart, Trash2 } from 'lucide-react'
import { useCart } from '../../cart'
import { ADDRESS_KINDS, addr, profileStore, useProfile } from '../../profileStore'
import { BrandLogo, MobileToast, CountBadge } from './parts'
import MobileTabBar from './MobileTabBar'
import MapPicker, { MapPreview } from '../MapPicker'
import { BottomSheet } from './MobileSeminars'
import { ADDRESS_ICONS, CITIES } from './MobileCheckout'
import PhoneInput, { extractUzLocalDigits, isCompleteUzPhone, PHONE_INCOMPLETE_MSG, toE164 } from '../PhoneInput'

const teal = 'text-[#0b6d73]'
const navy = 'text-[#0d2a4a]'
const fmtPhone = (p) => `+998 ${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5, 7)} ${p.slice(7, 9)}`.trim()

export function SubTopBar({ title, subtitle }) {
  const navigate = useNavigate()
  const { items } = useCart()
  return (
    <>
      <header className="flex items-center gap-1">
        <button type="button" onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/profil'))} aria-label="Orqaga" className={`-ml-2 grid size-10 place-items-center rounded-full ${teal}`}>
          <ArrowLeft className="size-6" strokeWidth={1.9} />
        </button>
        <BrandLogo />
        <div className="ml-auto flex">
          <button type="button" onClick={() => navigate('/kategoriyalar')} aria-label="Qidirish" className={`grid size-10 place-items-center rounded-full ${navy}`}><Search className="size-[22px]" /></button>
          <button type="button" onClick={() => navigate('/buyurtma', { state: { from: 'profil' } })} aria-label="Savat" className={`relative grid size-10 place-items-center rounded-full ${teal}`}>
            <ShoppingCart className="size-[22px]" />
            {items.length > 0 && <CountBadge>{items.length}</CountBadge>}
          </button>
          <button type="button" onClick={() => navigate('/profil', { state: { sheet: 'inbox' } })} aria-label="Bildirishnomalar" className={`grid size-10 place-items-center rounded-full ${teal}`}><Bell className="size-[22px]" /></button>
        </div>
      </header>
      <h1 className={`mt-4 text-[28px] font-extrabold leading-tight ${navy}`}>{title}</h1>
      <p className="mt-0.5 text-[13.5px] text-[#7a8a9c]">{subtitle}</p>
    </>
  )
}

export default function MobileManzillar() {
  const profile = useProfile()
  const [edit, setEdit] = useState(null)
  const [toast, setToast] = useState(null)
  const closeToast = useCallback(() => setToast(null), [])
  const list = profile.addresses

  useEffect(() => { window.scrollTo(0, 0) }, [])

  const withUndo = (text) => {
    const snapshot = { addresses: profile.addresses, defaultAddr: profile.defaultAddr }
    setToast({ text, undo: () => { profileStore.update(snapshot); setToast(null) } })
  }

  const makeMain = (a) => {
    if (a.id === profile.defaultAddr) return
    withUndo(`${a.tag} — asosiy manzil qilindi`)
    profileStore.update({ defaultAddr: a.id })
  }

  const save = (a, main) => {
    const exists = list.some((x) => x.id === a.id)
    withUndo(exists ? 'Manzil yangilandi' : 'Yangi manzil qo‘shildi')
    const addresses = exists ? list.map((x) => (x.id === a.id ? a : x)) : [...list, a]
    profileStore.update({ addresses, defaultAddr: main || !profile.defaultAddr ? a.id : profile.defaultAddr })
    setEdit(null)
  }

  const remove = (a) => {
    withUndo('Manzil o‘chirildi')
    const rest = list.filter((x) => x.id !== a.id)
    profileStore.update({ addresses: rest, defaultAddr: profile.defaultAddr === a.id ? rest[0]?.id || '' : profile.defaultAddr })
    setEdit(null)
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef8f7_0%,#f6faf9_28%,#f6faf9_100%)] pb-[150px]">
      <div className="px-4 pt-3">
        <SubTopBar title="Manzillarim" subtitle="Yetkazib berish manzillarini boshqarish" />

        {!list.length && (
          <div className="mt-10 text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e3f4f1] text-[#0b6d73]"><MapPin className="size-8" strokeWidth={1.6} /></span>
            <p className={`mt-3 text-[15px] font-bold ${navy}`}>Saqlangan manzil yo‘q</p>
            <p className="mt-1 text-[12.5px] text-muted">Buyurtmani tezroq rasmiylashtirish uchun manzil qo‘shing</p>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {list.map((a) => {
            const main = a.id === profile.defaultAddr
            const Icon = ADDRESS_ICONS[a.kind] || MapPin
            return (
              <article key={a.id} onClick={() => makeMain(a)} className={`cursor-pointer rounded-2xl border p-3.5 transition active:scale-[0.995] ${main ? 'border-[#cde9e4] bg-[#f0f9f7] shadow-[0_2px_10px_rgb(11_109_115/0.06)]' : 'border-[#e5eef0] bg-white shadow-[0_1px_6px_rgb(11_31_58/0.04)]'}`}>
                <div className="flex items-center gap-2.5">
                  <span className={`grid size-12 shrink-0 place-items-center rounded-full bg-[#e3f4f1] ${teal}`}><Icon className="size-6" strokeWidth={1.7} /></span>
                  <span className={`rounded-lg bg-[#e3f4f1] px-2.5 py-1 text-[12.5px] font-semibold ${teal}`}>{a.tag}</span>
                  <span className="flex-1" />
                  {main && (
                    <span className={`flex items-center gap-1.5 rounded-full bg-[#dcf1ec] px-2.5 py-1 text-[12px] font-semibold ${teal}`}>
                      <span className="grid size-4 place-items-center rounded-full bg-[#0b6d73] text-white"><Check className="size-2.5" strokeWidth={4} /></span> Asosiy
                    </span>
                  )}
                  <button type="button" onClick={(e) => { e.stopPropagation(); setEdit(a) }} aria-label={`${a.tag} manzilini tahrirlash`} className={`grid size-10 shrink-0 place-items-center rounded-xl border border-[#e0eaed] bg-white ${teal}`}>
                    <Pencil className="size-[18px]" />
                  </button>
                </div>
                <p className={`mt-2.5 truncate text-[16px] font-bold ${navy}`}>{a.name || profile.name}</p>
                <p className="mt-1.5 flex items-center gap-2.5 text-[13px] text-[#5b6b7d]"><Phone className={`size-4 shrink-0 ${teal}`} /> {fmtPhone(a.phone || profile.phone)}</p>
                <p className="mt-1 flex items-start gap-2.5 text-[13px] leading-snug text-[#5b6b7d]"><MapPin className={`mt-0.5 size-4 shrink-0 ${teal}`} /> {a.city}, {a.address}</p>
              {a.lat != null && <MapPreview lat={a.lat} lng={a.lng} />}
              </article>
            )
          })}
        </div>
        {list.length > 1 && <p className="mt-3 text-center text-[11.5px] text-muted">Asosiy qilish uchun manzil ustiga bosing</p>}
      </div>

      <div className="fixed inset-x-0 bottom-[62px] z-30 bg-gradient-to-t from-[#f6faf9] via-[#f6faf9] to-[#f6faf9]/0 px-4 pb-2.5 pt-4">
        <button type="button" onClick={() => setEdit('new')} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b6d73] text-[15px] font-semibold text-white shadow-[0_6px_16px_rgb(11_109_115/0.3)] active:scale-[0.99]">
          <Plus className="size-5" /> Yangi manzil qo‘shish
        </button>
      </div>

      {edit && (
        <AddressSheet
          address={edit === 'new' ? null : edit}
          profile={profile}
          isMain={edit !== 'new' && edit.id === profile.defaultAddr}
          onClose={() => setEdit(null)}
          onSave={save}
          onRemove={remove}
        />
      )}

      <MobileToast
        text={toast?.text}
        onClose={closeToast}
        bottom={136}
        action={toast?.undo && <button type="button" onClick={toast.undo} className="shrink-0 text-[13px] font-semibold text-[#5fe0c8]">Qaytarish</button>}
      />
      <MobileTabBar />
    </div>
  )
}

const input = (bad) => `mt-1 h-11 w-full rounded-xl border bg-white px-3 text-[14px] text-ink outline-none focus:border-[#0b8a7a] ${bad ? 'border-sale' : 'border-[#dfe7ea]'}`

function Field({ label, err, children }) {
  return (
    <label className="mt-3 block">
      <span className="text-[12px] font-medium text-ink-2">{label}</span>
      {children}
      {err && <span className="mt-1 block text-[11.5px] text-sale">{err}</span>}
    </label>
  )
}

function AddressSheet({ address, profile, isMain, onClose, onSave, onRemove }) {
  const a = address
  const [f, setF] = useState(() => ({
    kind: a?.kind || 'home',
    name: a?.name || profile.name,
    phone: a?.phone || profile.phone,
    city: a?.city || 'Toshkent',
    district: a?.district || CITIES.Toshkent[0],
    street: a?.street || (a ? a.address.replace(`${a.district} tumani, `, '') : ''),
    extra: a?.extra || '',
    lat: a?.lat ?? null,
    lng: a?.lng ?? null,
  }))
  const [main, setMain] = useState(isMain || !profile.addresses.length)
  const [tried, setTried] = useState(false)
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: k === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 9) : e.target.value }))
  const errors = {
    name: f.name.trim().length < 3 && 'Qabul qiluvchini kiriting',
    phone: f.phone.length !== 9 && 'Raqamni to‘liq kiriting',
    street: f.street.trim().length < 5 && 'Ko‘cha va uy raqamini kiriting',
  }
  const submit = () => {
    setTried(true)
    if (Object.values(errors).some(Boolean)) return
    onSave(addr(a?.id || `a${Date.now()}`, f.kind, f.name.trim(), f.phone, f.district, f.street.trim(), f.extra.trim(), f.city, f.lat, f.lng), main)
  }

  return (
    <BottomSheet
      title={a ? 'Manzilni tahrirlash' : 'Yangi manzil'}
      onClose={onClose}
      footer={
        <>
          {a && (
            <button type="button" onClick={() => onRemove(a)} aria-label="Manzilni o‘chirish" className="grid size-12 shrink-0 place-items-center rounded-xl border border-[#f3c9c9] text-sale">
              <Trash2 className="size-5" />
            </button>
          )}
          <button type="button" onClick={submit} className="h-12 flex-1 rounded-xl bg-[#0b6d73] text-[14.5px] font-semibold text-white">Saqlash</button>
        </>
      }
    >
      <p className="mt-2 text-[12px] font-medium text-ink-2">Manzil turi</p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {ADDRESS_KINDS.map(([id, label]) => {
          const Icon = ADDRESS_ICONS[id]
          return (
            <button key={id} type="button" aria-pressed={f.kind === id} onClick={() => setF((v) => ({ ...v, kind: id }))} className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-semibold ${f.kind === id ? 'border-[#0b6d73] bg-[#e3f4f1] text-[#0b6d73]' : 'border-[#dfe7ea] text-ink-2'}`}>
              <Icon className="size-4" /> {label}
            </button>
          )
        })}
      </div>
      <Field label={f.kind === 'work' ? 'Klinika yoki qabul qiluvchi' : 'Qabul qiluvchi'} err={tried && errors.name}>
        <input value={f.name} onChange={set('name')} placeholder="Ism yoki klinika nomi" className={input(tried && errors.name)} />
      </Field>
      <Field label="Telefon" err={tried && errors.phone}>
        <PhoneInput className={input(tried && errors.phone)} inputClassName="bg-transparent outline-none" value={f.phone} onChange={(v) => set('phone')({ target: { value: extractUzLocalDigits(v) } })} valueMode="local" />
      </Field>
      <p className="mt-3 text-[12px] font-medium text-ink-2">Xaritada belgilang</p>
      <MapPicker lat={f.lat} lng={f.lng} onChange={({ lat, lng, geo }) => setF((v) => {
        const n = { ...v, lat, lng }
        if (!geo) return n
        const city = Object.keys(CITIES).find((c) => geo.city && (geo.city.includes(c) || c.includes(geo.city.split(' ')[0])))
        if (city) { n.city = city; n.district = CITIES[city][0] }
        const list = CITIES[n.city] || []
        const d = list.find((x) => geo.district && geo.district.toLowerCase().startsWith(x.toLowerCase().slice(0, 5)))
        if (d) n.district = d
        if (geo.street) n.street = geo.street
        return n
      })} />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Shahar">
          <select value={f.city} onChange={(e) => setF((v) => ({ ...v, city: e.target.value, district: CITIES[e.target.value][0] }))} className={input()}>
            {Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Tuman">
          <select value={f.district} onChange={set('district')} className={input()}>
            {CITIES[f.city].map((d) => <option key={d}>{d}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Ko‘cha va uy" err={tried && errors.street}>
        <input value={f.street} onChange={set('street')} placeholder="Amir Temur ko‘chasi, 25-uy" className={input(tried && errors.street)} />
      </Field>
      <Field label="Xonadon / qavat (ixtiyoriy)">
        <input value={f.extra} onChange={set('extra')} placeholder="12-xonadon" className={input()} />
      </Field>
      <button type="button" role="switch" aria-checked={main} onClick={() => setMain((v) => !v)} disabled={isMain} className="mt-4 flex w-full items-center justify-between rounded-xl bg-[#f3f8f8] px-3 py-3 text-left disabled:opacity-70">
        <span>
          <span className={`block text-[13.5px] font-semibold ${navy}`}>Asosiy manzil</span>
          <span className="block text-[11.5px] text-muted">Buyurtmada avtomatik tanlanadi</span>
        </span>
        <span className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition ${main ? 'bg-[#0b6d73]' : 'bg-[#cfd8de]'}`}>
          <span className={`absolute top-[3px] size-5 rounded-full bg-white shadow transition-all ${main ? 'left-[23px]' : 'left-[3px]'}`} />
        </span>
      </button>
    </BottomSheet>
  )
}
