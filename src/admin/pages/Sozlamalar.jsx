import { useEffect, useState } from 'react'
import { Save, Settings } from 'lucide-react'
import { getSettings, setSettings } from '../api'
import { maskPhone } from '../format'
import { Btn, FilterTabs, MigrateBanner, PageHeader, card } from '../components/ui'

const TABS = [
  { id: 'umumiy', label: 'Umumiy ma’lumot' },
  { id: 'komissiya', label: 'Komissiya va to‘lov' },
  { id: 'bildirishnoma', label: 'Bildirishnomalar' },
  { id: 'xavfsizlik', label: 'Xavfsizlik' },
]

export default function Sozlamalar() {
  const [tab, setTab] = useState('umumiy')
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [needsMigration, setNeeds] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getSettings()
      .then((d) => { setForm(normalize(d)); setNeeds(false) })
      .catch((e) => {
        const m = e?.message || String(e)
        setError(m)
        setNeeds(/admin_settings|Could not find|PGRST/i.test(m))
        setForm(normalize({}))
      })
  }, [])

  function patch(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function save() {
    setBusy(true); setMsg('')
    try {
      const saved = await setSettings({
        platform_name: form.platform_name,
        tagline: form.tagline,
        description: form.description,
        site_url: form.site_url,
        contact_phone: form.contact_phone,
        contact_email: form.contact_email,
        primary_color: form.primary_color || '#0F766E',
        commission_pct: Number(form.commission_pct) || 12,
        payment_methods: form.payment_methods,
        notify_orders: form.notify_orders,
        notify_sellers: form.notify_sellers,
        notify_organizers: form.notify_organizers,
        notify_complaints: form.notify_complaints,
        twofa_required: form.twofa_required,
        ip_restrict: form.ip_restrict,
      })
      setForm(normalize(saved))
      setMsg('Saqlandi.')
    } catch (e) { setMsg(e.message) }
    finally { setBusy(false) }
  }

  if (!form) return <p className="text-[#5C6E80]">Yuklanmoqda…</p>

  return (
    <div>
      <PageHeader
        title="Sozlamalar"
        subtitle="Platforma sozlamalarini boshqaring"
        actions={<Btn tone="primary" disabled={busy} onClick={save}><Save className="size-4" /> O‘zgarishlarni saqlash</Btn>}
      />
      <MigrateBanner show={needsMigration} />
      {error && !needsMigration && <p role="alert" className="mt-3 text-[#b42318]">{error}</p>}
      {msg && <p role="status" className="mt-3 rounded-xl bg-[#eef8f6] px-3 py-2 text-[13px]">{msg}</p>}
      <FilterTabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'umumiy' && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className={`${card} space-y-3 p-4`}>
            <h3 className="text-[15px] font-bold">Platforma ma’lumotlari</h3>
            <Field label="Platforma nomi" value={form.platform_name} onChange={(v) => patch('platform_name', v)} />
            <Field label="Sarlavha" value={form.tagline} onChange={(v) => patch('tagline', v)} />
            <Field label="Tavsif" value={form.description} onChange={(v) => patch('description', v)} textarea />
            <Field label="Sayt manzili" value={form.site_url} onChange={(v) => patch('site_url', v)} />
            <Field label="Aloqa telefon" value={form.contact_phone} onChange={(v) => patch('contact_phone', v)} hint={maskPhone(form.contact_phone)} />
            <Field label="Email manzil" value={form.contact_email} onChange={(v) => patch('contact_email', v)} />
          </section>
          <section className={`${card} space-y-3 p-4`}>
            <h3 className="text-[15px] font-bold">Tashqi ko‘rinish</h3>
            <Field label="Asosiy rang" value={form.primary_color} onChange={(v) => patch('primary_color', v)} />
            <div className="flex items-center gap-3">
              <span className="size-10 rounded-xl border border-[#E6EEF0]" style={{ background: form.primary_color || '#0F766E' }} />
              <span className="text-[13px] text-[#5C6E80]">Dizayn rangi: #0F766E (tavsiya)</span>
            </div>
            <div className="rounded-xl border border-dashed border-[#E6EEF0] p-4 text-center text-[13px] text-[#8A9AA8]">
              <Settings className="mx-auto mb-2 size-8 text-[#0F766E]" />
              Logotip / favicon yuklash keyingi iteratsiyada (storage).
            </div>
          </section>
        </div>
      )}

      {tab === 'komissiya' && (
        <section className={`${card} mt-4 max-w-xl space-y-3 p-4`}>
          <h3 className="text-[15px] font-bold">Komissiya va to‘lov</h3>
          <Field label="Platforma komissiyasi (%)" value={String(form.commission_pct)} onChange={(v) => patch('commission_pct', v)} />
          <div className="rounded-xl bg-[#F0FDFA] px-3 py-2 text-[13px] text-[#0F766E]">
            Hozirgi komissiya: {form.commission_pct}% — barcha yangi buyurtmalarda 12% standart.
          </div>
          <div>
            <div className="mb-2 text-[13px] font-semibold">To‘lov usullari (demo)</div>
            <div className="flex flex-wrap gap-2">
              {['uzcard', 'humo', 'click', 'payme'].map((m) => {
                const on = (form.payment_methods || []).includes(m)
                return (
                  <button key={m} type="button"
                    onClick={() => patch('payment_methods', on
                      ? form.payment_methods.filter((x) => x !== m)
                      : [...(form.payment_methods || []), m])}
                    className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold uppercase ${on ? 'bg-[#0F766E] text-white' : 'border border-[#E6EEF0] text-[#3D4E5F]'}`}
                  >{m}</button>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {tab === 'bildirishnoma' && (
        <section className={`${card} mt-4 max-w-xl space-y-3 p-4`}>
          <h3 className="text-[15px] font-bold">Bildirishnomalar</h3>
          <Toggle label="Yangi buyurtmalar" checked={form.notify_orders} onChange={(v) => patch('notify_orders', v)} />
          <Toggle label="Yangi sotuvchi arizasi" checked={form.notify_sellers} onChange={(v) => patch('notify_sellers', v)} />
          <Toggle label="Yangi tashkilotchi arizasi" checked={form.notify_organizers} onChange={(v) => patch('notify_organizers', v)} />
          <Toggle label="Yangi shikoyatlar" checked={form.notify_complaints} onChange={(v) => patch('notify_complaints', v)} />
        </section>
      )}

      {tab === 'xavfsizlik' && (
        <section className={`${card} mt-4 max-w-xl space-y-3 p-4`}>
          <h3 className="text-[15px] font-bold">Xavfsizlik</h3>
          <Toggle label="2FA majburiy" checked={form.twofa_required} onChange={(v) => patch('twofa_required', v)} />
          <Toggle label="IP cheklovi" checked={form.ip_restrict} onChange={(v) => patch('ip_restrict', v)} />
          <p className="text-[12.5px] text-[#8A9AA8]">Parol o‘zgartirish va sessiyalar auth provider orqali boshqariladi.</p>
        </section>
      )}
    </div>
  )
}

function normalize(d = {}) {
  return {
    platform_name: d.platform_name || 'StomaHub',
    tagline: d.tagline || 'Stomatologlar uchun yagona platforma',
    description: d.description || '',
    site_url: d.site_url || 'https://stomahub.uz',
    contact_phone: d.contact_phone || '',
    contact_email: d.contact_email || 'info@stomahub.uz',
    primary_color: d.primary_color || '#0F766E',
    commission_pct: d.commission_pct ?? 12,
    payment_methods: Array.isArray(d.payment_methods) ? d.payment_methods : ['uzcard', 'humo', 'click', 'payme'],
    notify_orders: d.notify_orders !== false,
    notify_sellers: d.notify_sellers !== false,
    notify_organizers: d.notify_organizers !== false,
    notify_complaints: d.notify_complaints !== false,
    twofa_required: d.twofa_required !== false,
    ip_restrict: !!d.ip_restrict,
  }
}

function Field({ label, value, onChange, textarea, hint }) {
  const cls = 'mt-1 w-full rounded-xl border border-[#E6EEF0] bg-[#F8FBFC] px-3 py-2 text-[14px] outline-none focus:border-[#0F766E]'
  return (
    <label className="block text-[13px]">
      <span className="font-semibold text-[#10283F]">{label}</span>
      {textarea
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={cls} />
        : <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />}
      {hint && <span className="mt-0.5 block text-[11.5px] text-[#8A9AA8]">Ko‘rinish: {hint}</span>}
    </label>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl border border-[#E6EEF0] px-3 py-2.5 text-left text-[13.5px] font-semibold">
      {label}
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-[#0F766E]' : 'bg-[#D1D5DB]'}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${checked ? 'left-5' : 'left-0.5'}`} />
      </span>
    </button>
  )
}
