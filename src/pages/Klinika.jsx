import { useEffect, useMemo, useRef, useState } from 'react'
import MapPicker, { withGeo, parseGeo } from '../components/MapPicker'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BadgeCheck, MapPin, Settings, ArrowRight, UserPlus, CalendarPlus, CalendarDays, UserRound, CircleDollarSign, Armchair,
  ChevronLeft, ChevronRight, MoreVertical, MoreHorizontal, Plus, Search, SlidersHorizontal, Clock, X, Phone, Check, AlertTriangle, Coffee, Truck,
} from 'lucide-react'
import { MenuIcons as M } from '../components/tealIcons'
import ShopLayout from '../components/market/ShopLayout'
import AppointmentForm from '../components/crm/AppointmentForm'
import PatientForm from '../components/crm/PatientForm'
import { STAFF_ROLES, setClinicSettings } from '../clinicSettings'
import { ToothIcon } from '../components/icons'
import { addBemor } from '../bemorData'
import { useOmbor, patchOmbor } from '../omborData'
import { currentUid, isDemoUser, loadBlob, onAccount, saveBlob } from '../recordSync'
import { supabase } from '../supabaseClient'
import { profileStore } from '../profileStore'
import { useCrmStats } from '../crmStats'
import {
  TODAY, DEFAULT_CHAIRS, SLOTS, SERVICES, CITY_LIST, STATUS, MONTHS_CAP, WD, WD_LONG,
  chairsFromSettings, shiftIso, weekday, label, avatarOf,
} from '../klinikaData'
import { scrubClinicBoard } from '../demoPurge'
import PhoneInput, { extractUzLocalDigits, isCompleteUzPhone, PHONE_INCOMPLETE_MSG, toE164 } from '../components/PhoneInput'

const som = (n) => `${Number(n || 0).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m`
const DEFAULT_SETTINGS = { name: '', city: '', open: '09:00', close: '18:00', phone: '', address: '', website: '', chair_count: 0, lunch: true, lunch_start: '13:00', lunch_end: '14:00', days_off: [6], staff: [] }
// customer_clinic jadvalida yo‘q maydonlar — clinic_board blobida saqlanadi (migratsiyasiz)
const pickExtra = (s = {}) => Object.fromEntries(['lunch', 'lunch_start', 'lunch_end', 'days_off', 'staff'].filter((k) => s[k] !== undefined).map((k) => [k, s[k]]))

function hoursParts(hours) {
  const m = String(hours || '').match(/(\d{1,2}:\d{2})\s*[–\-—]\s*(\d{1,2}:\d{2})/)
  return m ? { open: m[1], close: m[2] } : { open: '09:00', close: '18:00' }
}

function settingsFromClinic(row) {
  if (!row) return { ...DEFAULT_SETTINGS }
  const parts = hoursParts(row.hours)
  return {
    name: row.name || '',
    city: row.city || row.address || '',
    open: row.open_time || parts.open,
    close: row.close_time || parts.close,
    phone: row.phone || '',
    address: row.address || '',
    website: row.website || '',
    chair_count: Number(row.chair_count) || 0,
  }
}

async function fetchCustomerClinic(uid) {
  if (!supabase || !uid) return null
  const { data, error } = await supabase.from('customer_clinic').select('*').eq('user_id', uid).maybeSingle()
  if (error) return null
  return data
}

async function upsertCustomerClinic(uid, settings) {
  if (!supabase || !uid) return { ok: false, error: 'Kirish talab qilinadi' }
  const open = settings.open || '09:00'
  const close = settings.close || '18:00'
  const base = {
    user_id: uid,
    name: (settings.name || '').trim() || 'Mening klinikam',
    address: withGeo(parseGeo((settings.address || settings.city || '').trim()).text, settings),
    hours: `${open}–${close}`,
    phone: (settings.phone || '').trim(),
    website: (settings.website || '').trim(),
    updated_at: new Date().toISOString(),
  }
  const extended = {
    ...base,
    city: (settings.city || '').trim(),
    open_time: open,
    close_time: close,
    chair_count: Math.max(0, Math.min(12, Number(settings.chair_count) || 0)),
  }
  let error = (await supabase.from('customer_clinic').upsert(extended)).error
  if (error && /city|open_time|close_time|chair_count|schema cache|column/i.test(error.message || '')) {
    const { chair_count, ...noChair } = extended
    error = (await supabase.from('customer_clinic').upsert(noChair)).error
    if (error && /city|open_time|close_time|schema cache|column/i.test(error.message || '')) {
      error = (await supabase.from('customer_clinic').upsert(base)).error
    }
  }
  if (error) return { ok: false, error: error.message }
  profileStore.update({
    clinic: base.name,
    clinicInfo: {
      name: base.name,
      address: base.address,
      hours: base.hours,
      phone: base.phone,
      website: base.website,
      photo: profileStore.get()?.clinicInfo?.photo || '',
    },
  })
  return { ok: true, row: base }
}

export default function Klinika() {
  const navigate = useNavigate()
  const location = useLocation()
  const stock = useOmbor()
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS }))
  const [visits, setVisits] = useState([])
  const [patients, setPatients] = useState([])
  const crm = useCrmStats()
  const [boardReady, setBoardReady] = useState(false)
  const [date, setDate] = useState(TODAY)
  const [view, setView] = useState('day')
  const [menu, setMenu] = useState(null)
  const [booking, setBooking] = useState(null)
  const [adding, setAdding] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  useEffect(() => {
    if (location.state?.settings) setSettingsOpen(true)
  }, [location.state])
  useEffect(() => {
    let stop = false
    const unsub = onAccount(async (id) => {
      if (!id) {
        setBoardReady(false)
        setSettings({ ...DEFAULT_SETTINGS })
        setVisits([])
        setPatients([])
        return
      }
      const [clinic, payload] = await Promise.all([fetchCustomerClinic(id), loadBlob('clinic_board')])
      if (stop) return
      if (clinic) { const g = parseGeo(clinic.address || ''); setSettings({ ...settingsFromClinic({ ...clinic, address: g.text }), lat: g.lat, lng: g.lng }) }
      else if (payload?.settings) setSettings({ ...DEFAULT_SETTINGS, ...payload.settings })
      if (clinic && payload?.settings) setSettings((cur) => ({ ...cur, ...pickExtra(payload.settings) }))
      else setSettings({ ...DEFAULT_SETTINGS })
      if (payload) {
        const cleaned = isDemoUser() ? payload : scrubClinicBoard(payload)
        setVisits(Array.isArray(cleaned.visits) ? cleaned.visits : [])
        setPatients(Array.isArray(cleaned.patients) ? cleaned.patients : [])
        if (!isDemoUser() && JSON.stringify(cleaned) !== JSON.stringify(payload)) {
          saveBlob('clinic_board', cleaned)
        }
      } else {
        setVisits([])
        setPatients([])
      }
      setBoardReady(true)
    })
    return () => { stop = true; unsub() }
  }, [])
  useEffect(() => {
    if (!boardReady || !currentUid()) return
    saveBlob('clinic_board', { settings, visits, patients })
  }, [boardReady, settings, visits, patients])
  const [staffOpen, setStaffOpen] = useState(false)
  const [order, setOrder] = useState(null)
  const [toast, setToast] = useState('')
  const [newCount, setNewCount] = useState(0)

  const toastTimer = useRef(0)
  const flash = (text) => {
    setToast(text)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2600)
  }

  // Ko‘rsatkichlar umumiy crmStats funksiyasidan — /uchrashuvlar va /tolovlar bilan bir xil
  const todayCount = crm.todayAppointments
  const clinicIncome = crm.revenueTotal
  const chairList = chairsFromSettings(settings)
  const chairs = chairList.length ? chairList : []
  const totalSlots = Math.max(1, (chairs.length || 0) * SLOTS.length)
  const load = chairs.length ? Math.min(100, Math.round((todayCount / totalSlots) * 100)) : 0
  const dayVisits = visits.filter((x) => x.date === date)

  const setStatus = (id, status) => {
    setVisits((list) => list.map((x) => (x.id === id ? { ...x, status } : x)))
    setMenu(null)
  }
  const cancelVisit = (id) => {
    setVisits((list) => list.filter((x) => x.id !== id))
    setMenu(null)
    flash('Qabul bekor qilindi')
  }
  const saveVisit = (v) => {
    // Bosh sahifa jadvali uchun nusxa (kreslo indeksi bo‘yicha); asosiy yozuv uchrashuvData 'visits' da.
    const chair = Math.max(0, chairList.indexOf(v.room))
    setVisits((list) => [...list, { id: v.id, date: v.date, chair, time: v.start, name: v.name, service: v.service, status: 'tasdiq', female: false, phone: v.phone, avatar: avatarOf(v.name, false), patientId: v.patientId }])
    setDate(v.date)
    setView('day')
    setBooking(null)
    flash(`${v.name} ${label(v.date)}, ${v.start} ga yozildi`)
  }
  const savePatient = (p) => {
    const female = p.gender === 'Ayol'
    setPatients((list) => [{ id: p.id, name: p.name, female, phone: p.phone, last: '', next: '', debt: 0, status: 'Yangi', avatar: avatarOf(p.name, female) }, ...list])
    setNewCount((n) => n + 1)
    setAdding(false)
    flash('Bemor qo‘shildi va Bemorlar bo‘limiga saqlandi')
  }
  const saveSettings = async (next) => {
    const uid = currentUid()
    const cleaned = { ...DEFAULT_SETTINGS, ...next, name: (next.name || '').trim() || 'Mening klinikam' }
    setSettings(cleaned)
    setClinicSettings(cleaned)
    setSettingsOpen(false)
    const res = await upsertCustomerClinic(uid, cleaned)
    if (!res.ok) {
      flash(res.error || 'Saqlashda xato')
      return
    }
    flash('Sozlamalar saqlandi')
  }

  return (
    <ShopLayout active="klinika" search="plain" placeholder="Bemor qidirish (ism, telefon)...">
      <div className="space-y-3 pb-8 pt-3" onClick={() => menu && setMenu(null)}>
        <section className="klk-head">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sea-50 text-sea"><M.klinika className="size-11" /></span>
            <div className="min-w-0">
              <h1 className="flex items-center gap-1.5 text-[22px] font-extrabold tracking-tight text-ink">{settings.name || 'Mening klinikam'} <BadgeCheck className="size-5 fill-sea text-white" /></h1>
              <p className="mt-1 flex flex-wrap items-center gap-3 text-[11.5px] text-muted">
                <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {settings.city || 'Shahar tanlanmagan'}</span>
                <button type="button" onClick={() => setSettingsOpen(true)} className="inline-flex items-center gap-1 font-medium text-sea underline-offset-2 hover:underline"><Settings className="size-3.5" /> Sozlamalar</button>
              </p>
            </div>
          </div>
          <div className="relative flex min-h-[78px] min-w-0 items-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#d9f1f2] to-[#eef9f9]">
            <img src="/images/jihozlar/fengdan-room.jpg" alt="" className="absolute inset-y-0 left-0 h-full w-[38%] object-cover" style={{ maskImage: 'linear-gradient(90deg, #000 60%, transparent)' }} />
            <div className="relative ml-[36%] min-w-0 py-2 pr-3">
              <b className="block text-[13px] text-ink">Klinikangizni to‘liq nazorat qiling</b>
              <p className="text-[11px] text-ink-2">Bemorlar, moliya, ombor va xodimlar bir joyda</p>
              <button type="button" onClick={() => setSettingsOpen(true)} className="mt-1.5 inline-flex h-7 items-center gap-1 rounded-lg bg-sea px-3 text-[11px] font-semibold text-white">Klinika sozlamalari <ArrowRight className="size-3.5" /></button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setAdding(true)} className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-sea bg-white px-4 text-[12.5px] font-semibold text-sea"><Plus className="size-4" /> Bemor qo‘shish</button>
            <button type="button" onClick={() => setBooking({})} className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#0b5f63] px-4 text-[12.5px] font-semibold text-white"><CalendarPlus className="size-4" /> Qabulga yozish</button>
          </div>
        </section>

        <section className="klk-stats">
          <Stat icon={CalendarDays} title="Bugungi qabullar">
            <div className="flex items-end justify-between gap-3">
              <div><b className="text-[24px] leading-none">{todayCount}</b><p className="mt-1 text-[11px] text-muted">{chairs.length ? `Jami ${totalSlots} ta slotdan` : "Kreslo sozlanmagan"}</p></div>
              <div className="flex-1 pb-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-[#e7eef5]"><span className="block h-full rounded-full bg-sea" style={{ width: `${load}%` }} /></div>
                <p className="mt-1 text-right text-[10.5px] text-muted">{load}%</p>
              </div>
            </div>
          </Stat>
          <Stat icon={UserRound} title="Bemorlar">
            <div className="flex items-end justify-between gap-3">
              <div><b className="text-[24px] leading-none">{patients.length}</b><p className="mt-1 text-[11px] text-muted">{patients.length ? `shu hisobdagi bemorlar${newCount ? ` · +${newCount} yangi` : ''}` : 'Hali bemor yo‘q'}</p></div>
            </div>
          </Stat>
          <Stat icon={CircleDollarSign} title="Tushum" tone="#fff1df" ink="#c2410c">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0"><b className="whitespace-nowrap text-[19px] leading-none">{som(clinicIncome)}</b><p className="mt-1 truncate text-[10.5px] text-muted">{clinicIncome ? 'jami to‘lovlar' : 'Hali tushum yo‘q'}</p></div>
            </div>
          </Stat>
          <Stat icon={Armchair} title="Kreslo bandligi">
            <div className="flex items-end justify-between gap-3">
              <div><b className="text-[24px] leading-none">{load}%</b><p className="mt-1 text-[11px] text-muted">{chairs.length ? `${chairs.length} ta kreslodan` : "Kreslo sozlanmagan"}</p></div>
              <Ring value={load} />
            </div>
          </Stat>
        </section>

        <div className="klk-mid">
          <section className="min-w-0 rounded-2xl bg-white p-3 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[14px] font-bold">{date === TODAY ? 'Bugungi qabul jadvali' : 'Qabul jadvali'}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-8 items-center rounded-lg border border-line">
                  <button type="button" aria-label="Oldingi" onClick={() => setDate(shiftIso(date, view === 'week' ? -7 : view === 'month' ? -30 : -1))} className="grid h-full w-7 place-items-center text-muted"><ChevronLeft className="size-4" /></button>
                  <span className="inline-flex items-center gap-1.5 px-2 text-[12px] font-semibold"><CalendarDays className="size-3.5" /> {label(date)}</span>
                  <button type="button" aria-label="Keyingi" onClick={() => setDate(shiftIso(date, view === 'week' ? 7 : view === 'month' ? 30 : 1))} className="grid h-full w-7 place-items-center text-muted"><ChevronRight className="size-4" /></button>
                </div>
                <button type="button" onClick={() => setDate(TODAY)} className="h-8 rounded-lg border border-line px-3 text-[12px] font-medium">Bugun</button>
                <div className="flex h-8 rounded-lg bg-[#f1f5f9] p-0.5">
                  {[['day', 'Kun'], ['week', 'Hafta'], ['month', 'Oy']].map(([k, t]) => (
                    <button key={k} type="button" onClick={() => setView(k)} className={`rounded-md px-3 text-[12px] font-medium ${view === k ? 'bg-white text-sea shadow-sm' : 'text-ink-2'}`}>{t}</button>
                  ))}
                </div>
                <Link to="/uchrashuvlar" className="inline-flex h-8 items-center rounded-lg border border-sea px-3 text-[12px] font-semibold text-sea">Barcha qabullar</Link>
              </div>
            </div>

            {view === 'day' && (
              weekday(date) === 6 ? (
                <div className="mt-3 grid h-[300px] place-items-center rounded-xl bg-[#f7fafc] text-[13px] text-muted">Yakshanba — dam olish kuni</div>
              ) : !boardReady ? (
                <div className="mt-3 grid h-[300px] place-items-center rounded-xl bg-[#f7fafc] text-[13px] text-muted">Yuklanmoqda…</div>
              ) : !chairs.length ? (
                <div className="mt-3 grid h-[300px] place-items-center rounded-xl bg-[#f7fafc] px-4 text-center">
                  <div>
                    <p className="text-[14px] font-semibold text-ink">Hali qabul yo‘q</p>
                    <p className="mt-1 text-[12.5px] text-muted">Avval klinika sozlamalarida kreslo sonini kiriting, so‘ng qabulga yozing.</p>
                    <button type="button" onClick={() => setSettingsOpen(true)} className="mt-3 inline-flex h-9 items-center rounded-xl bg-sea px-4 text-[12.5px] font-semibold text-white">Klinika sozlamalari</button>
                  </div>
                </div>
              ) : dayVisits.length === 0 ? (
                <div className="mt-3 space-y-3">
                  <div className="grid place-items-center rounded-xl bg-[#f7fafc] px-4 py-8 text-center">
                    <p className="text-[14px] font-semibold text-ink">Hali qabul yo‘q</p>
                    <p className="mt-1 text-[12.5px] text-muted">Bugun uchun yozilgan bemorlar shu yerda ko‘rinadi.</p>
                    <button type="button" onClick={() => setBooking({})} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#0b5f63] px-4 text-[12.5px] font-semibold text-white"><CalendarPlus className="size-4" /> Qabulga yozish</button>
                  </div>
                  <div className="klk-chairs">
                    {chairs.map((chair, ci) => (
                      <ChairColumn
                        key={chair}
                        chair={chair}
                        index={ci}
                        visits={[]}
                        menu={menu}
                        setMenu={setMenu}
                        onStatus={setStatus}
                        onCancel={cancelVisit}
                        onBook={(time) => setBooking({ chair: ci, time, date })}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="klk-chairs mt-3">
                  {chairs.map((chair, ci) => (
                    <ChairColumn
                      key={chair}
                      chair={chair}
                      index={ci}
                      visits={dayVisits.filter((x) => x.chair === ci)}
                      menu={menu}
                      setMenu={setMenu}
                      onStatus={setStatus}
                      onCancel={cancelVisit}
                      onBook={(time) => setBooking({ chair: ci, time, date })}
                    />
                  ))}
                </div>
              )
            )}
            {view !== 'day' && <Overview visits={visits} date={date} mode={view} onPick={(iso) => { setDate(iso); setView('day') }} />}
          </section>

          <div className="min-w-0 space-y-3">
            <MiniCalendar visits={visits} date={date} onPick={(iso) => { setDate(iso); setView('day') }} />
            <Revenue total={clinicIncome} />
          </div>
        </div>

        <div className="klk-bottom">
          <PatientsCard patients={patients} setPatients={setPatients} menu={menu} setMenu={setMenu} onBook={(p) => setBooking({ name: p.name, phone: p.phone, female: p.female })} flash={flash} />
          <section className="min-w-0 rounded-2xl bg-white p-3 shadow-card">
            <CardHead title="Xodimlar" onMore={() => setStaffOpen(true)} />
            <ul className="mt-1 divide-y divide-line">
              <li className="px-2 py-6 text-center text-[12.5px] text-muted">Xodimlar ro‘yxati bo‘sh. Bu bo‘lim faqat sizning klinikangiz uchun.</li>
            </ul>
          </section>
          <section className="min-w-0 rounded-2xl bg-white p-3 shadow-card">
            <CardHead title="Ombor ogohlantirishlari" onMore={() => navigate('/ombor')} />
            <ul className="mt-1 space-y-2">
              {stock.filter((r) => r.status === 'kam' || r.status === 'tugash').length === 0 && (
                <li className="px-2 py-6 text-center text-[12.5px] text-muted">Ogohlantirish yo‘q. Ombor bo‘sh yoki zaxira yetarli.</li>
              )}
              {stock.filter((r) => r.status === 'kam' || r.status === 'tugash').slice(0, 4).map((r) => (
                <li key={r.id} className="flex items-center gap-2 rounded-xl border border-line p-1.5">
                  <img src={r.image} alt="" className="size-11 shrink-0 rounded-lg bg-[#f5f8fb] object-contain" />
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[12px]">{r.name}</b>
                    <span className="mt-0.5 flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-[#dc2626]"><AlertTriangle className="size-3.5 shrink-0" /> Kam qoldi: {r.qty} {r.unit}</span>
                  </span>
                  {r.incoming ? (
                    <span className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#e3f6ee] px-2 text-[11px] font-semibold text-[#15803d]"><Truck className="size-3.5" /> Yo‘lda</span>
                  ) : (
                    <button type="button" onClick={() => setOrder(r)} className="h-8 shrink-0 rounded-lg border border-sea px-2.5 text-[11px] font-semibold text-sea">Buyurtma</button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {booking && <AppointmentForm initial={booking} onClose={() => setBooking(null)} onSaved={saveVisit} />}
      {adding && <PatientForm onClose={() => setAdding(false)} onSaved={savePatient} />}
      {settingsOpen && <SettingsDialog value={settings} onClose={() => setSettingsOpen(false)} onSave={saveSettings} />}
      {staffOpen && (
        <Dialog title="Barcha xodimlar" onClose={() => setStaffOpen(false)}>
          <ul className="divide-y divide-line">
            <li className="px-2 py-6 text-center text-[12.5px] text-muted">Hali xodim qo‘shilmagan.</li>
          </ul>
        </Dialog>
      )}
      {order && (
        <OrderDialog
          item={order}
          onClose={() => setOrder(null)}
          onSave={(qty) => {
            patchOmbor(order.id, { incoming: true, note: `Buyurtma: ${qty} ${order.unit}` })
            setOrder(null)
            flash(`${order.name} — ${qty} ${order.unit} buyurtma qilindi`)
          }}
        />
      )}
      {toast && <div className="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-xl bg-ink px-4 py-2.5 text-[12.5px] font-medium text-white shadow-lg"><Check className="mr-1.5 inline size-4" />{toast}</div>}
    </ShopLayout>
  )
}

function Stat({ icon: Icon, title, tone = '#e3f4f5', ink = '#0b8a95', children }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl bg-white p-3 shadow-card">
      <span className="grid size-11 shrink-0 place-items-center rounded-full" style={{ background: tone, color: ink }}><Icon className="size-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="mb-1.5 text-[12px] text-ink-2">{title}</p>
        {children}
      </div>
    </div>
  )
}

function Bars({ values }) {
  const max = Math.max(...values)
  return (
    <div className="flex h-9 shrink-0 items-end gap-[3px]">
      {values.map((n, i) => <span key={i} className="w-[5px] rounded-sm" style={{ height: `${(n / max) * 100}%`, background: i === values.length - 1 ? '#0b8a95' : '#b9e3e6' }} />)}
    </div>
  )
}

function Ring({ value }) {
  const r = 18
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 44 44" className="size-12 shrink-0 -rotate-90">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#e3f4f5" strokeWidth="6" />
      <circle cx="22" cy="22" r={r} fill="none" stroke="#0b8a95" strokeWidth="6" strokeDasharray={`${(value / 100) * c} ${c}`} strokeLinecap="round" />
    </svg>
  )
}

function ChairColumn({ chair, index, visits, menu, setMenu, onStatus, onCancel, onBook }) {
  const busy = visits.some((x) => x.status === 'qabulda')
  const rows = SLOTS
  return (
    <div className="min-w-0 rounded-xl border border-line p-2">
      <div className="mb-1.5 flex items-center gap-1.5 px-1">
        <Armchair className="size-4 text-sea" />
        <b className="flex-1 text-[13px]">{chair}</b>
        <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold ${busy ? 'bg-[#e3f6ee] text-[#15803d]' : 'bg-[#eef1f5] text-muted'}`}><span className={`size-1.5 rounded-full ${busy ? 'bg-[#16a34a]' : 'bg-muted'}`} />{busy ? 'Band' : 'Bo‘sh'}</span>
        <span className="text-[11px] text-muted">{visits.length}/{SLOTS.length}</span>
      </div>
      <div className="space-y-1.5">
        {rows.map((time) => {
          const x = visits.find((y) => y.time === time)
          const key = `v-${index}-${time}`
          return (
            <div key={time} className="grid grid-cols-[38px_minmax(0,1fr)] items-center gap-1.5">
              <span className="text-[11px] text-muted">{time}</span>
              {x ? (
                <div className="relative flex min-w-0 items-center gap-1.5 rounded-lg border border-line bg-white px-1.5 py-1.5">
                  <img src={x.avatar} alt="" className="size-7 shrink-0 self-start rounded-full object-cover" />
                  <span className="min-w-0 flex-1 leading-tight">
                    <b className="block truncate pr-4 text-[11.5px]" title={x.name}>{x.name}</b>
                    <span className="mt-0.5 flex min-w-0 items-center gap-1">
                      <span className="min-w-0 flex-1 truncate text-[10.5px] text-muted" title={x.service}>{x.service}</span>
                      <span className="shrink-0 rounded-md px-1.5 py-px text-[9.5px] font-semibold" style={{ background: STATUS[x.status].bg, color: STATUS[x.status].color }}>{STATUS[x.status].label}</span>
                    </span>
                  </span>
                  <button type="button" aria-label="Amallar" onClick={(e) => { e.stopPropagation(); setMenu(menu === key ? null : key) }} className="absolute right-0.5 top-1 grid size-5 place-items-center text-muted"><MoreVertical className="size-3.5" /></button>
                  {menu === key && (
                    <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-line bg-white p-1 shadow-lg" onClick={(e) => e.stopPropagation()}>
                      {Object.entries(STATUS).map(([k, s]) => (
                        <button key={k} type="button" onClick={() => onStatus(x.id, k)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[12px] hover:bg-[#f4f8fb]">
                          {s.label} {x.status === k && <Check className="size-3.5 text-sea" />}
                        </button>
                      ))}
                      {x.phone && <a href={`tel:${x.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] hover:bg-[#f4f8fb]"><Phone className="size-3.5" /> Qo‘ng‘iroq</a>}
                      <button type="button" onClick={() => onCancel(x.id)} className="w-full rounded-lg px-2 py-1.5 text-left text-[12px] text-[#dc2626] hover:bg-[#fdf0f0]">Bekor qilish</button>
                    </div>
                  )}
                </div>
              ) : (
                <button type="button" onClick={() => onBook(time)} className="flex h-9 items-center justify-center gap-1 rounded-lg border border-dashed border-[#cbd5e1] text-[11.5px] text-ink-2 hover:border-sea hover:text-sea">
                  <Plus className="size-3.5" /> Bemor qabul qilish
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Overview({ visits, date, mode, onPick }) {
  const days = useMemo(() => {
    if (mode === 'week') {
      const start = shiftIso(date, -weekday(date))
      return Array.from({ length: 7 }, (_, i) => shiftIso(start, i))
    }
    const [y, m] = date.split('-')
    const count = new Date(Number(y), Number(m), 0).getDate()
    return Array.from({ length: count }, (_, i) => `${y}-${m}-${String(i + 1).padStart(2, '0')}`)
  }, [date, mode])
  const lead = mode === 'month' ? weekday(days[0]) : 0
  return (
    <div className="mt-3">
      <div className="grid grid-cols-7 gap-1.5">
        {mode === 'month' && WD.map((d) => <span key={d} className="text-center text-[11px] font-medium text-muted">{d}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`e${i}`} />)}
        {days.map((iso) => {
          const list = visits.filter((x) => x.date === iso)
          const pct = Math.round((list.length / Math.max(1, DEFAULT_CHAIRS.length * SLOTS.length)) * 100)
          const off = weekday(iso) === 6
          return (
            <button key={iso} type="button" onClick={() => onPick(iso)} className={`rounded-xl border p-2 text-left transition hover:border-sea ${iso === TODAY ? 'border-sea bg-sea-50' : 'border-line'} ${mode === 'week' ? 'min-h-[180px]' : ''}`}>
              <span className="flex items-center justify-between text-[11px] text-muted">
                <span>{mode === 'week' ? WD_LONG[weekday(iso)] : ''}</span>
                <b className="text-[13px] text-ink">{Number(iso.slice(8))}</b>
              </span>
              {off ? <span className="mt-2 block text-[11px] text-muted">Dam olish</span> : (
                <>
                  <span className="mt-2 block text-[12px] font-semibold">{list.length} qabul</span>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#e7eef5]"><span className="block h-full rounded-full bg-sea" style={{ width: `${pct}%` }} /></span>
                  {mode === 'week' && DEFAULT_CHAIRS.map((c, ci) => (
                    <span key={c} className="mt-1.5 flex justify-between text-[11px] text-ink-2"><span>{c}</span><span>{list.filter((x) => x.chair === ci).length}/{SLOTS.length}</span></span>
                  ))}
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MiniCalendar({ visits, date, onPick }) {
  const [month, setMonth] = useState(date.slice(0, 7))
  const [y, m] = month.split('-').map(Number)
  const count = new Date(y, m, 0).getDate()
  const lead = weekday(`${month}-01`)
  const move = (dir) => {
    const d = new Date(y, m - 1 + dir, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const dot = (iso) => {
    if (weekday(iso) === 6) return '#cbd5e1'
    const n = visits.filter((x) => x.date === iso).length
    if (!n) return null
    return n >= 12 ? '#ef4444' : '#22c55e'
  }
  return (
    <section className="rounded-2xl bg-white p-3 shadow-card">
      <CardHead title="Kalendar" to="/uchrashuvlar" />
      <div className="mt-2 flex items-center justify-between">
        <b className="text-[13px]">{MONTHS_CAP[m - 1]} {y}</b>
        <span className="flex gap-1">
          <button type="button" aria-label="Oldingi oy" onClick={() => move(-1)} className="grid size-7 place-items-center rounded-lg border border-line"><ChevronLeft className="size-3.5" /></button>
          <button type="button" aria-label="Keyingi oy" onClick={() => move(1)} className="grid size-7 place-items-center rounded-lg border border-line"><ChevronRight className="size-3.5" /></button>
        </span>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-y-1 text-center">
        {WD.map((d) => <span key={d} className="text-[10.5px] text-muted">{d}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`e${i}`} />)}
        {Array.from({ length: count }, (_, i) => {
          const iso = `${month}-${String(i + 1).padStart(2, '0')}`
          const color = dot(iso)
          const isToday = iso === TODAY
          const picked = iso === date
          return (
            <button key={iso} type="button" onClick={() => onPick(iso)} className="relative mx-auto grid size-7 place-items-center">
              <span className={`grid size-7 place-items-center rounded-full text-[11.5px] ${isToday ? 'bg-sea font-bold text-white' : picked ? 'bg-sea-50 font-semibold text-sea ring-1 ring-sea' : 'text-ink'}`}>{i + 1}</span>
              {color && !isToday && <span className="absolute -bottom-0.5 size-1 rounded-full" style={{ background: color }} />}
            </button>
          )
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] text-muted">
        {[['#0b8a95', 'Bugun'], ['#ef4444', 'Band'], ['#22c55e', 'Bo‘sh'], ['#cbd5e1', 'Boshqa']].map(([c, t]) => (
          <span key={t} className="inline-flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: c }} />{t}</span>
        ))}
      </div>
    </section>
  )
}

function Revenue({ total }) {
  return (
    <section className="rounded-2xl bg-white p-3 shadow-card">
      <b className="text-[13px]">Daromad statistikasi</b>
      <p className="mt-2 text-[19px] font-bold">{som(total)}</p>
      <p className="mt-3 text-[12.5px] text-muted">{total ? 'Bu raqam faqat sizning to‘lovlaringizdan olinadi.' : 'Hali tushum yo‘q. Bemor to‘lovlari shu yerda yig‘iladi.'}</p>
    </section>
  )
}

function CardHead({ title, to, onMore }) {
  const cls = 'inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[10.5px] font-medium text-sea'
  return (
    <div className="flex items-center justify-between gap-2">
      <b className="min-w-0 truncate text-[13px]">{title}</b>
      {to ? <Link to={to} className={cls}>Barchasini ko‘rish <ArrowRight className="size-3.5" /></Link>
        : <button type="button" onClick={onMore} className={cls}>Barchasini ko‘rish <ArrowRight className="size-3.5" /></button>}
    </div>
  )
}

function PatientsCard({ patients, setPatients, menu, setMenu, onBook, flash }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const query = q.trim().toLowerCase()
  const list = patients.filter((p) => {
    const okQ = !query || `${p.name} ${p.phone}`.toLowerCase().includes(query)
    const okF = filter === 'all' || (filter === 'debt' && p.debt > 0) || (filter === 'next' && p.next) || (filter === 'new' && p.status === 'Yangi')
    return okQ && okF
  }).slice(0, 5)
  const FILTERS = [['all', 'Hammasi'], ['debt', 'Qarzi borlar'], ['next', 'Keyingi tashrifi bor'], ['new', 'Yangi bemorlar']]
  return (
    <section className="min-w-0 rounded-2xl bg-white p-3 shadow-card">
      <CardHead title="Bemorlar ro‘yxati" to="/bemorlar" />
      <div className="mt-2 flex gap-2">
        <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-line px-2.5">
          <Search className="size-4 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Bemor qidirish..." className="min-w-0 flex-1 bg-transparent text-[12px] outline-none" />
        </label>
        <div className="relative">
          <button type="button" onClick={() => setFilterOpen(!filterOpen)} className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium ${filter !== 'all' ? 'border-sea text-sea' : 'border-line'}`}><SlidersHorizontal className="size-3.5" /> Filtrlar</button>
          {filterOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-line bg-white p-1 shadow-lg">
              {FILTERS.map(([k, t]) => (
                <button key={k} type="button" onClick={() => { setFilter(k); setFilterOpen(false) }} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[12px] hover:bg-[#f4f8fb]">{t} {filter === k && <Check className="size-3.5 text-sea" />}</button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[460px] text-left text-[10.5px]">
          <thead className="text-[10.5px] text-muted">
            <tr className="border-b border-line">
              {['#', 'Ism familiya', 'Telefon', 'Oxirgi tashrif', 'Keyingi tashrif', 'Qarz', 'Holat', ''].map((h) => <th key={h} className="py-1.5 pr-1.5 font-medium leading-tight">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {list.map((p, i) => {
              const key = `p-${p.id}`
              return (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="py-1.5 pr-1.5 text-muted">{i + 1}</td>
                  <td className="py-1.5 pr-1.5"><span className="flex items-center gap-1.5"><img src={p.avatar} alt="" className="size-6 shrink-0 rounded-full object-cover" /><b className="block max-w-[86px] truncate font-semibold" title={p.name}>{p.name}</b></span></td>
                  <td className="whitespace-nowrap py-1.5 pr-1.5">{p.phone}</td>
                  <td className="py-1.5 pr-1.5">{p.last || '—'}</td>
                  <td className="py-1.5 pr-1.5">{p.next || '—'}</td>
                  <td className={`whitespace-nowrap py-1.5 pr-1.5 font-semibold ${p.debt ? 'text-[#dc2626]' : ''}`}>{som(p.debt)}</td>
                  <td className="py-1.5 pr-1.5"><span className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold ${p.status === 'Yangi' ? 'bg-[#e6efff] text-[#2563eb]' : p.status === 'Faol' ? 'bg-[#e3f6ee] text-[#15803d]' : 'bg-[#fff3d6] text-[#b07d00]'}`}>{p.status}</span></td>
                  <td className="relative py-1.5">
                    <button type="button" aria-label="Amallar" onClick={(e) => { e.stopPropagation(); setMenu(menu === key ? null : key) }} className="grid size-6 place-items-center text-muted"><MoreHorizontal className="size-4" /></button>
                    {menu === key && (
                      <div className="absolute right-0 top-full z-20 w-44 rounded-xl border border-line bg-white p-1 shadow-lg" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => { setMenu(null); onBook(p) }} className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[12px] hover:bg-[#f4f8fb]"><CalendarPlus className="size-3.5" /> Qabulga yozish</button>
                        <a href={`tel:${p.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] hover:bg-[#f4f8fb]"><Phone className="size-3.5" /> Qo‘ng‘iroq</a>
                        {p.debt > 0 && (
                          <button type="button" onClick={() => { setPatients((all) => all.map((x) => (x.id === p.id ? { ...x, debt: 0 } : x))); setMenu(null); flash(`${p.name}: qarz yopildi`) }} className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[12px] hover:bg-[#f4f8fb]"><CircleDollarSign className="size-3.5" /> Qarzni yopish</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {!list.length && <tr><td colSpan={8} className="py-6 text-center text-[12px] text-muted">Bemor topilmadi</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function StaffRow({ s, menu, setMenu, plain }) {
  const key = `s-${s.id}${plain ? '-all' : ''}`
  return (
    <li className="relative flex items-center gap-2 py-2">
      <span className="relative grid size-8 shrink-0 place-items-center rounded-full text-[12px] font-bold" style={{ background: s.tone, color: s.ink }}>
        {s.initials}
        <span className={`absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white ${s.online ? 'bg-[#22c55e]' : 'bg-[#cbd5e1]'}`} />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <b className="block truncate text-[11.5px]" title={s.name}>{s.name}</b>
        <span className="mt-0.5 flex items-center gap-1.5">
          <span className="truncate text-[10.5px] text-muted">{s.role}</span>
          <span className="shrink-0 rounded-md px-1.5 py-px text-[9.5px] font-semibold" style={{ background: s.tone, color: s.ink }}>{s.tag}</span>
        </span>
        <span className="block text-[10px] text-muted">Bugun: {s.today} qabul</span>
      </span>
      <button type="button" aria-label="Amallar" onClick={(e) => { e.stopPropagation(); setMenu(menu === key ? null : key) }} className="grid size-5 shrink-0 place-items-center text-muted"><MoreVertical className="size-3.5" /></button>
      {menu === key && (
        <div className="absolute right-0 top-full z-20 w-40 rounded-xl border border-line bg-white p-1 shadow-lg" onClick={(e) => e.stopPropagation()}>
          <a href={`tel:${s.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] hover:bg-[#f4f8fb]"><Phone className="size-3.5" /> {s.phone}</a>
          <Link to="/uchrashuvlar" className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] hover:bg-[#f4f8fb]"><Clock className="size-3.5" /> Jadvalini ko‘rish</Link>
        </div>
      )}
    </li>
  )
}

function Dialog({ title, onClose, children, foot, width = 460 }) {
  return (
    <div className="bemor-shade" onClick={onClose}>
      <div className="bemor-dialog shadow-card" style={{ width: `min(${width}px, 100%)` }} role="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="bemor-dialog-head flex items-center justify-between px-4 pb-2 pt-3">
          <b className="text-[15px]">{title}</b>
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center rounded-lg text-muted hover:bg-[#f4f8fb]"><X className="size-4" /></button>
        </div>
        <div className="bemor-dialog-body px-4 pb-3">{children}</div>
        {foot && <div className="bemor-dialog-foot flex justify-end gap-2 border-t border-line px-4 py-3">{foot}</div>}
      </div>
    </div>
  )
}

const input = 'h-10 w-full rounded-xl border border-[#e6ebf2] bg-white px-3 text-[13px] outline-none focus:border-sea'

function Field({ label: text, children }) {
  return <label className="block"><span className="mb-1 block text-[11.5px] font-medium text-ink-2">{text}</span>{children}</label>
}

function GenderPick({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {[[false, 'Erkak'], [true, 'Ayol']].map(([v, t]) => (
        <button key={t} type="button" onClick={() => onChange(v)} className={`h-10 flex-1 rounded-xl border text-[12.5px] font-medium ${value === v ? 'border-sea bg-sea-50 text-sea' : 'border-[#e6ebf2]'}`}>{t}</button>
      ))}
    </div>
  )
}

function StaffEditor({ value, onChange }) {
  const [row, setRow] = useState({ name: '', role: STAFF_ROLES[0], phone: '' })
  const add = () => {
    if (!row.name.trim()) return
    onChange([...value, { ...row, name: row.name.trim(), id: `st-${Date.now()}` }])
    setRow({ name: '', role: STAFF_ROLES[0], phone: '' })
  }
  return (
    <div className="rounded-xl border border-line p-3">
      <p className="mb-2 text-[12.5px] font-semibold">Xodimlar</p>
      {value.length ? (
        <ul className="mb-2 space-y-1">
          {value.map((s, i) => (
            <li key={s.id || i} className="flex items-center justify-between gap-2 rounded-lg bg-[#f7fafd] px-2 py-1.5 text-[12.5px]">
              <span className="min-w-0 truncate"><b>{s.name}</b> · {s.role}{s.phone ? ` · ${s.phone}` : ''}</span>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-[11.5px] font-semibold text-[#dc2626]">O‘chirish</button>
            </li>
          ))}
        </ul>
      ) : <p className="mb-2 text-[11.5px] text-muted">Hali xodim qo‘shilmagan</p>}
      <div className="grid grid-cols-[1fr_120px] gap-2">
        <input value={row.name} onChange={(e) => setRow((r) => ({ ...r, name: e.target.value }))} placeholder="Ism familiya" className={input} />
        <select value={row.role} onChange={(e) => setRow((r) => ({ ...r, role: e.target.value }))} className={input}>{STAFF_ROLES.map((r) => <option key={r}>{r}</option>)}</select>
        <PhoneInput className={input + ' flex'} value={row.phone} onChange={(v) => setRow((r) => ({ ...r, phone: toE164(v) || extractUzLocalDigits(v) }))} valueMode="e164" placeholder="+998 90 123 45 67" />
        <button type="button" onClick={add} disabled={!row.name.trim()} className="h-10 rounded-xl bg-sea text-[12.5px] font-semibold text-white disabled:opacity-40">+ Qo‘shish</button>
      </div>
    </div>
  )
}

function SettingsDialog({ value, onClose, onSave }) {
  const [form, setForm] = useState(value)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const submit = async () => {
    if (saving) return
    setSaving(true)
    await onSave({ ...form, name: form.name.trim() || 'Mening klinikam' })
    setSaving(false)
  }
  return (
    <Dialog
      title="Klinika sozlamalari"
      onClose={onClose}
      foot={<><button type="button" onClick={onClose} className="h-10 rounded-xl border border-line px-4 text-[12.5px] font-medium">Bekor qilish</button><button type="button" disabled={saving} onClick={submit} className="h-10 rounded-xl bg-sea px-5 text-[12.5px] font-semibold text-white disabled:opacity-60">{saving ? 'Saqlanmoqda…' : 'Saqlash'}</button></>}
    >
      <div className="space-y-3">
        <Field label="Klinika nomi"><input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Masalan: Smile Dental" className={input} /></Field>
        <Field label="Shahar">
          <select value={form.city} onChange={(e) => set('city', e.target.value)} className={input}>
            <option value="">Shahar tanlanmagan</option>
            {CITY_LIST.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Manzil"><input value={form.address || ''} onChange={(e) => set('address', e.target.value)} placeholder="Ko‘cha, uy" className={input} /></Field>
        <MapPicker lat={form.lat} lng={form.lng} onChange={({ lat, lng, geo }) => { set('lat', lat); set('lng', lng); if (geo?.city && CITY_LIST.includes(geo.city)) set('city', geo.city); if (geo?.street) set('address', [geo.city, geo.district && geo.district !== 'Markaz' ? geo.district : '', geo.street].filter(Boolean).join(', ')) }} />
        <Field label="Telefon"><PhoneInput className={input + ' flex'} value={form.phone || ''} onChange={(v) => set('phone', toE164(v) || extractUzLocalDigits(v))} valueMode="e164" placeholder="+998 90 123 45 67" /></Field>
        <Field label="Veb-sayt"><input value={form.website || ''} onChange={(e) => set('website', e.target.value)} placeholder="https://" className={input} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Ish boshlanishi"><input type="time" value={form.open} onChange={(e) => set('open', e.target.value)} className={input} /></Field>
          <Field label="Ish tugashi"><input type="time" value={form.close} onChange={(e) => set('close', e.target.value)} className={input} /></Field>
        </div>
        <Field label="Kreslo soni">
          <input type="number" min="0" max="12" value={form.chair_count ?? 0} onChange={(e) => set('chair_count', Number(e.target.value) || 0)} className={input} />
        </Field>
        <p className="rounded-xl bg-[#f4f8fb] px-3 py-2 text-[11.5px] text-ink-2">Kreslo soni 0 bo‘lsa jadval bo‘sh holatda chiqadi.</p>
        <div className="rounded-xl border border-line p-3">
          <label className="flex items-center gap-2 text-[12.5px] font-semibold"><input type="checkbox" checked={form.lunch !== false} onChange={(e) => set('lunch', e.target.checked)} className="size-4 accent-[#0f9b8e]" /> Tushlik tanaffusi</label>
          {form.lunch !== false && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Field label="Boshlanishi"><input type="time" value={form.lunch_start || '13:00'} onChange={(e) => set('lunch_start', e.target.value)} className={input} /></Field>
              <Field label="Tugashi"><input type="time" value={form.lunch_end || '14:00'} onChange={(e) => set('lunch_end', e.target.value)} className={input} /></Field>
            </div>
          )}
        </div>
        <div>
          <p className="mb-1 text-[12px] font-medium text-ink-2">Dam olish kunlari</p>
          <div className="flex flex-wrap gap-1.5">
            {WD.map((d, i) => {
              const on = (form.days_off || []).includes(i)
              return <button key={d} type="button" aria-pressed={on} onClick={() => set('days_off', on ? form.days_off.filter((x) => x !== i) : [...(form.days_off || []), i])} className={`h-8 min-w-10 rounded-lg px-2 text-[12px] font-semibold ${on ? 'bg-[#fde2e2] text-[#b91c1c]' : 'bg-[#f4f7fb] text-ink-2'}`}>{d}</button>
            })}
          </div>
        </div>
        <StaffEditor value={form.staff || []} onChange={(v) => set('staff', v)} />
      </div>
    </Dialog>
  )
}

function OrderDialog({ item, onClose, onSave }) {
  const [qty, setQty] = useState(Math.max(1, item.min - item.qty))
  return (
    <Dialog
      title="Omborga buyurtma"
      onClose={onClose}
      foot={<><button type="button" onClick={onClose} className="h-10 rounded-xl border border-line px-4 text-[12.5px] font-medium">Bekor qilish</button><button type="button" onClick={() => qty > 0 && onSave(qty)} className="h-10 rounded-xl bg-sea px-5 text-[12.5px] font-semibold text-white">Buyurtma berish</button></>}
    >
      <div className="flex items-center gap-3">
        <img src={item.image} alt="" className="size-16 rounded-xl bg-[#f5f8fb] object-contain" />
        <div className="min-w-0">
          <b className="block text-[13.5px]">{item.name}</b>
          <p className="text-[11.5px] text-muted">{item.pack} · {item.supplier}</p>
          <p className="text-[11.5px] text-[#dc2626]">Qoldiq: {item.qty} {item.unit} (minimum {item.min})</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl border border-line p-2">
        <span className="text-[12.5px]">Miqdor ({item.unit})</span>
        <span className="flex items-center gap-1">
          <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="grid size-8 place-items-center rounded-lg border border-line">−</button>
          <input value={qty} onChange={(e) => setQty(Math.max(0, Number(e.target.value.replace(/\D/g, '')) || 0))} className="h-8 w-14 rounded-lg border border-line text-center text-[13px] outline-none" />
          <button type="button" onClick={() => setQty(qty + 1)} className="grid size-8 place-items-center rounded-lg border border-line">+</button>
        </span>
      </div>
      {item.price > 0 && <p className="mt-2 text-right text-[13px]">Taxminiy summa: <b>{som(item.price * qty)}</b></p>}
    </Dialog>
  )
}
