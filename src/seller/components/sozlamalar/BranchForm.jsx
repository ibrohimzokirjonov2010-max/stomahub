import { useState } from 'react'
import { Phone, MapPin, Clock, Save, Plus } from 'lucide-react'
import Modal from '../shell/Modal'
import { Btn, Field, Input, Toggle, Err, toast } from '../ui'
import { insertRow, updateRow, logActivity } from '../../api'

export default function BranchForm({ edit, onClose }) {
  const [v, setV] = useState(() => edit ? { ...edit } : { name: '', address: '', phone: '+998 ', hours: '09:00 - 18:00', active: true })
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const set = (k, x) => { setV((s) => ({ ...s, [k]: x })); setErr('') }
  const save = async () => {
    if (!v.name.trim()) return setErr('Filial nomini kiriting.')
    if (!v.address.trim()) return setErr('Manzilni kiriting.')
    const row = { name: v.name.trim(), address: v.address.trim(), phone: v.phone.trim(), hours: v.hours.trim(), active: v.active }
    setBusy(true); const r = edit ? await updateRow('seller_branches', edit.id, row) : await insertRow('seller_branches', row); setBusy(false)
    if (!r.ok) return setErr(r.error || 'Saqlanmadi.')
    await logActivity(edit ? 'Filial tahrirlandi' : 'Filial qo‘shildi', row.name)
    toast(edit ? 'Filial saqlandi' : 'Filial qo‘shildi'); onClose()
  }
  return (
    <Modal open onClose={onClose} title={edit ? 'Filialni tahrirlash' : 'Filial qo‘shish'} subtitle="Filial manzili va ish vaqtini kiriting." width="md:max-w-[520px]"
      footer={<div className="grid grid-cols-2 gap-3"><Btn variant="outline" onClick={onClose}>Bekor qilish</Btn><Btn icon={edit ? Save : Plus} disabled={busy} onClick={save}>{edit ? 'Saqlash' : 'Filial qo‘shish'}</Btn></div>}>
      <div className="space-y-3">
        <Field label="Filial nomi"><Input value={v.name} onChange={(e) => set('name', e.target.value)} placeholder="Masalan: Chilonzor filiali" /></Field>
        <Field label="Manzil"><Input icon={MapPin} value={v.address} onChange={(e) => set('address', e.target.value)} placeholder="Shahar, tuman, ko‘cha" /></Field>
        <div className="grid gap-3 md:grid-cols-2"><Field label="Telefon"><Input icon={Phone} value={v.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" /></Field><Field label="Ish vaqti"><Input icon={Clock} value={v.hours} onChange={(e) => set('hours', e.target.value)} placeholder="09:00 - 18:00" /></Field></div>
        <div className="flex items-center gap-3"><Toggle checked={v.active} onChange={(x) => set('active', x)} /><span className="text-[13px] font-semibold">{v.active ? 'Faol' : 'Faol emas'}</span></div>
        <Err>{err}</Err>
      </div>
    </Modal>
  )
}
