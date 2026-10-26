import { useEffect, useState } from 'react'
import { UserRound, Building2, Phone, Map, FileText, MapPin, FileDigit, Tag, Check, CircleCheck, Circle } from 'lucide-react'
import { insertRow, updateRow, useAsync } from '../../api'
import { Btn, Input, Textarea, Select, Err, toast } from '../ui'
import Modal from '../shell/Modal'
import { KINDS, REGIONS, TAGS } from './constants'

const blank = { kind: 'klinika', name: '', contact_person: '', phone: '+998 ', region: '', city: '', address: '', stir: '', tags: [], note: '' }
const H = ({ n, icon: I, children }) => <div className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-[#0F766E]"><I className="size-4" />{n}. {children}</div>

export default function CustomerForm({ open, onClose, edit, onSaved }) {
  const [v, setV] = useState(blank)
  const a = useAsync()
  useEffect(() => { if (open) { setV(edit ? { ...blank, ...edit, tags: edit.tags || [] } : blank); a.setError('') } }, [open, edit]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e?.target ? e.target.value : e }))
  const label = { klinika: 'Klinika nomi', shifokor: 'Shifokor F.I.Sh.', laboratoriya: 'Laboratoriya nomi' }[v.kind]
  function save() {
    if (!v.name.trim()) return a.setError(`${label}ni kiriting`)
    const ph = v.phone.replace(/\s/g, '')
    if (ph && ph !== '+998' && !/^\+998\d{9}$/.test(ph)) return a.setError('Telefon raqami +998 XX XXX XX XX ko‘rinishida bo‘lsin')
    if (v.stir && !/^\d{9}$/.test(v.stir.trim())) return a.setError('STIR 9 ta raqamdan iborat bo‘ladi')
    const row = { kind: v.kind, name: v.name.trim(), contact_person: v.contact_person.trim(), phone: ph === '+998' ? '' : v.phone.trim(), region: v.region, city: v.city, address: v.address.trim(), stir: v.stir.trim(), tags: v.tags, note: v.note.trim().slice(0, 500) }
    a.go(() => (edit ? updateRow('seller_customers', edit.id, row) : insertRow('seller_customers', row)), (r) => { toast(edit ? 'Mijoz yangilandi' : 'Mijoz qo‘shildi'); onSaved?.(r.data); onClose() })
  }
  const footer = <div className="grid grid-cols-2 gap-3 md:flex md:justify-end"><Btn variant="outline" className="md:w-[150px]" onClick={onClose}>Bekor qilish</Btn><Btn icon={Check} className="md:w-[200px]" disabled={a.busy} onClick={save}>Saqlash</Btn></div>
  return (
    <Modal open={open} onClose={onClose} full width="max-w-[480px]" title={edit ? 'Mijozni tahrirlash' : 'Mijoz qo‘shish'} subtitle="Yangi mijoz haqida ma’lumotlarni kiriting." footer={footer}>
      <div className="space-y-3.5">
        <div><H n={1} icon={UserRound}>Mijoz turi</H>
          <div className="grid grid-cols-3 gap-2">{KINDS.map(([k, l, sub, I]) => { const on = v.kind === k; return (
            <button key={k} type="button" onClick={() => set('kind')(k)} className={`relative rounded-[10px] border px-2 py-2.5 text-center ${on ? 'border-[#0F766E] bg-[#F0FDFA]' : 'border-[#DCE5E7]'}`}>
              {on ? <CircleCheck className="absolute left-2 top-2 size-4 fill-[#0F766E] text-white" /> : <Circle className="absolute left-2 top-2 size-4 text-[#AEB8C2]" />}
              <I className="mx-auto size-5 text-[#0F766E]" /><div className="mt-1 text-[13px] font-semibold">{l}</div><div className="text-[11px] text-[#5C6E80]">{sub}</div></button>) })}</div></div>
        <div><H n={2} icon={Building2}>{label}</H><Input icon={Building2} value={v.name} onChange={set('name')} maxLength={120} placeholder={`${label}ni kiriting...`} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><H n={3} icon={UserRound}>Mas’ul shaxs</H><Input value={v.contact_person} onChange={set('contact_person')} maxLength={80} placeholder="Mas’ul shaxs F.I.Sh..." /></div>
          <div><H n={4} icon={Phone}>Telefon</H><Input type="tel" inputMode="tel" value={v.phone} onChange={set('phone')} maxLength={17} placeholder="+998 90 123 45 67" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><H n={5} icon={Map}>Viloyat</H><Select value={v.region} onChange={(r) => setV((s) => ({ ...s, region: r, city: REGIONS[r]?.length === 1 ? REGIONS[r][0] : '' }))} options={Object.keys(REGIONS)} placeholder="Viloyatni tanlang" /></div>
          <div><H n={6} icon={FileText}>Shahar</H><Select value={v.city} onChange={set('city')} options={REGIONS[v.region] || []} placeholder="Shaharni tanlang" /></div>
        </div>
        <div><H n={7} icon={MapPin}>Manzil</H><Textarea rows={2} className="!min-h-[60px]" value={v.address} onChange={set('address')} maxLength={200} placeholder="To‘liq manzilni kiriting..." /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><H n={8} icon={FileDigit}>STIR (ixtiyoriy)</H><Input inputMode="numeric" value={v.stir} onChange={set('stir')} maxLength={9} placeholder="STIR raqamini kiriting..." /></div>
          <div><H n={9} icon={Tag}>Teglar</H><Select value="" onChange={(t) => t && setV((s) => ({ ...s, tags: s.tags.includes(t) ? s.tags : [...s.tags, t] }))} options={TAGS.filter((t) => !v.tags.includes(t))} placeholder={v.tags.length ? `${v.tags.length} ta teg` : 'Teglar tanlang...'} /></div>
        </div>
        {v.tags.length > 0 && <div className="flex flex-wrap gap-1.5">{v.tags.map((t) => <button key={t} type="button" onClick={() => setV((s) => ({ ...s, tags: s.tags.filter((x) => x !== t) }))} className="rounded-md bg-[#E3F4F2] px-2 py-1 text-[12px] text-[#0F766E]">{t} ×</button>)}</div>}
        <div><H n={10} icon={FileText}>Izoh (ixtiyoriy)</H><Textarea rows={2} className="!min-h-[60px]" value={v.note} onChange={set('note')} maxLength={500} placeholder="Qo‘shimcha ma’lumot..." /></div>
        <Err>{a.error}</Err>
      </div>
    </Modal>
  )
}
