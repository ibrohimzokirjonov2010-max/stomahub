import { useEffect, useRef, useState } from 'react'
import { FileText, Save, Upload } from 'lucide-react'
import { supabase } from '../../../supabaseClient'
import { upsertSettings, uploadMedia } from '../../api'
import { Btn, Field, Input, Select, toast } from '../ui'

// Seller legal requisites (seller_settings.legal, migration 0029). Pre-filled from the seller's
// latest seller_applications row (legal_type, stir, full_name) when nothing is saved yet.
const EMPTY = { legal_type: '', org_name: '', director: '', stir: '', bank: '', mfo: '', account: '', license_no: '', license_url: '', license_name: '' }
const TYPES = [['yatt', 'YaTT (yakka tartibdagi tadbirkor)'], ['mchj', 'MChJ (mas’uliyati cheklangan jamiyat)']]
const digits = (s, n) => String(s || '').replace(/\D/g, '').slice(0, n)

function validateLegal(v) {
  if (v.stir && v.stir.length !== 9) return 'STIR 9 ta raqamdan iborat bo‘lishi kerak'
  if (v.mfo && v.mfo.length !== 5) return 'MFO 5 ta raqamdan iborat bo‘lishi kerak'
  if (v.account && v.account.length !== 20) return 'Hisob raqam 20 ta raqamdan iborat bo‘lishi kerak'
  return ''
}

export default function Rekvizitlar({ settings, uid, card = '', compact = false }) {
  const [v, setV] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [fromApp, setFromApp] = useState(false)
  const [noCol, setNoCol] = useState(false)
  const fileRef = useRef(null)
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current || !settings) return
    loaded.current = true
    if (!('legal' in settings) && settings.seller_id) setNoCol(true)
    const saved = settings.legal && typeof settings.legal === 'object' ? settings.legal : {}
    setV({ ...EMPTY, ...saved })
    if (!saved.stir && uid && supabase) {
      supabase.from('seller_applications').select('legal_type, stir, full_name, shop_name').eq('user_id', uid).eq('kind', 'seller')
        .order('created_at', { ascending: false }).limit(1).maybeSingle()
        .then(({ data }) => {
          if (!data) return
          setFromApp(true)
          setV((x) => ({ ...x, legal_type: x.legal_type || data.legal_type || '', stir: x.stir || data.stir || '', director: x.director || data.full_name || '', org_name: x.org_name || data.shop_name || '' }))
        })
    }
  }, [settings, uid])

  const set = (k, f = (x) => x) => (e) => setV((x) => ({ ...x, [k]: f(e?.target ? e.target.value : e) }))
  const save = async () => {
    const err = validateLegal(v)
    if (err) return toast(err)
    setBusy(true)
    const r = await upsertSettings({ legal: v })
    setBusy(false)
    if (!r.ok) return toast(/legal/.test(r.error || '') ? 'Rekvizitlar uchun 0029 migratsiyasi qo‘llanmagan' : r.error)
    setFromApp(false)
    toast('Rekvizitlar saqlandi')
  }
  const onFile = async (e) => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    const r = await uploadMedia(f, 'license')
    if (!r.ok) return toast(r.error || 'Yuklanmadi')
    setV((x) => ({ ...x, license_url: r.url, license_name: f.name }))
    toast('Litsenziya fayli yuklandi — Saqlashni bosing')
  }

  const grid = compact ? 'grid gap-3' : 'grid gap-3 md:grid-cols-2'
  return (
    <section className={`${card} ${compact ? 'p-4' : 'p-5'}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-[17px] font-bold">Rekvizitlar va litsenziya</h2>
          <p className="text-[12.5px] text-[#5C6E80]">Hisob-faktura, shartnoma va 1C eksport uchun ishlatiladi.</p>
        </div>
        {!compact && <Btn size="sm" icon={Save} disabled={busy} onClick={save}>Saqlash</Btn>}
      </div>
      {fromApp && <p className="mb-3 rounded-lg bg-[#F0FDFA] px-3 py-2 text-[12.5px] text-[#0F766E]">Ma’lumotlar sotuvchi arizangizdan olindi. Tekshirib, saqlang.</p>}
      {noCol && <p className="mb-3 rounded-lg bg-[#FFF7ED] px-3 py-2 text-[12.5px] text-[#9A3412]">Rekvizitlarni saqlash uchun 0029 migratsiyasi kerak.</p>}
      <div className={grid}>
        <Field label="Tashkiliy shakl"><Select value={v.legal_type} onChange={set('legal_type')} options={TYPES} placeholder="Tanlang" /></Field>
        <Field label={v.legal_type === 'yatt' ? 'YaTT F.I.Sh.' : 'Tashkilot nomi'}><Input value={v.org_name} onChange={set('org_name')} placeholder={v.legal_type === 'yatt' ? 'Aliyev Vali Valiyevich' : '“Dental Trade” MChJ'} /></Field>
        <Field label="STIR (INN)"><Input inputMode="numeric" value={v.stir} onChange={set('stir', (x) => digits(x, 9))} placeholder="9 ta raqam" /></Field>
        <Field label="Rahbar"><Input value={v.director} onChange={set('director')} placeholder="F.I.Sh." /></Field>
        <Field label="Bank nomi"><Input value={v.bank} onChange={set('bank')} placeholder="Kapitalbank, Toshkent filiali" /></Field>
        <Field label="MFO"><Input inputMode="numeric" value={v.mfo} onChange={set('mfo', (x) => digits(x, 5))} placeholder="5 ta raqam" /></Field>
        <Field label="Hisob raqam"><Input inputMode="numeric" value={v.account} onChange={set('account', (x) => digits(x, 20))} placeholder="20 ta raqam" /></Field>
        <Field label="Farmatsevtik litsenziya raqami"><Input value={v.license_no} onChange={set('license_no')} placeholder="Masalan: FL-0123" /></Field>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Btn size="sm" variant="outline" icon={Upload} onClick={() => fileRef.current?.click()}>Litsenziya faylini yuklash</Btn>
        {v.license_url && <a href={v.license_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[13px] font-medium text-[#0F766E] hover:underline"><FileText className="size-4" /> {v.license_name || 'Litsenziya'}</a>}
        <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={onFile} />
      </div>
      {compact && <Btn className="mt-4 w-full" icon={Save} disabled={busy} onClick={save}>Saqlash</Btn>}
    </section>
  )
}
