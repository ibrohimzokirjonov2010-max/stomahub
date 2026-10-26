import { useState } from 'react'
import { Phone, UserPlus, Save } from 'lucide-react'
import Modal from '../shell/Modal'
import { Btn, Field, Input, Select, Checkbox, Toggle, Err, toast } from '../ui'
import { insertRow, updateRow, logActivity } from '../../api'
import { PERMS, ROLES, ROLE_LABEL, DEFAULT_PERMS } from './constants'

export default function StaffForm({ edit, branches, onClose, permsOnly }) {
  const [v, setV] = useState(() => edit ? { ...edit } : { name: '', phone: '+998 ', role: 'Operator', permissions: DEFAULT_PERMS.Operator, branch_id: '', active: true })
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const set = (k, x) => { setV((s) => ({ ...s, [k]: x })); setErr('') }
  const toggle = (k) => set('permissions', v.permissions.includes(k) ? v.permissions.filter((x) => x !== k) : [...v.permissions, k])
  const save = async () => {
    if (!v.name.trim()) return setErr('Ism familiyani kiriting.')
    if (v.phone.replace(/\D/g, '').length < 12) return setErr('Telefon raqamni to‘liq kiriting.')
    const row = { name: v.name.trim(), phone: v.phone.trim(), role: v.role, permissions: v.permissions, branch_id: v.branch_id || null, active: v.active }
    setBusy(true); const r = edit ? await updateRow('seller_staff', edit.id, row) : await insertRow('seller_staff', row); setBusy(false)
    if (!r.ok) return setErr(r.error || 'Saqlanmadi.')
    await logActivity(edit ? 'Xodim tahrirlandi' : 'Xodim qo‘shildi', row.name)
    toast(edit ? 'Xodim ma’lumotlari saqlandi' : 'Xodim qo‘shildi'); onClose()
  }
  const perms = (
    <div><div className="text-[14px] font-bold">Ruxsatlar</div><div className="mb-2 text-[12px] text-[#5C6E80]">Xodimga beriladigan bo‘limlar va amallar.</div>
      <div className="grid gap-2 md:grid-cols-2">{PERMS.map(([k, l, d, I]) => <label key={k} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E2ECEE] p-3"><Checkbox checked={v.permissions.includes(k)} onChange={() => toggle(k)} /><I className="size-5 shrink-0 text-[#0F766E]" /><span><span className="block text-[13px] font-semibold">{l}</span><span className="block text-[11.5px] text-[#5C6E80]">{d}</span></span></label>)}</div></div>
  )
  return (
    <Modal open onClose={onClose} title={permsOnly ? 'Ruxsatlarni o‘zgartirish' : edit ? 'Xodimni tahrirlash' : 'Xodim qo‘shish'} subtitle={permsOnly ? edit.name : 'Do‘koningizda ishlaydigan yangi xodimni qo‘shing.'} width="md:max-w-[620px]"
      footer={<div className="grid grid-cols-2 gap-3"><Btn variant="outline" onClick={onClose}>Bekor qilish</Btn><Btn icon={edit ? Save : UserPlus} disabled={busy} onClick={save}>{edit ? 'Saqlash' : 'Xodimni qo‘shish'}</Btn></div>}>
      <div className="space-y-4">
        {!permsOnly && <>
          <div className="grid gap-3 md:grid-cols-2"><Field label="Ism familiya"><Input value={v.name} onChange={(e) => set('name', e.target.value)} placeholder="Masalan: Aliyev Javohir" /></Field><Field label="Telefon raqam"><Input icon={Phone} value={v.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" /></Field></div>
          <div className="grid gap-3 md:grid-cols-2"><Field label="Lavozim"><Select value={v.role} onChange={(x) => setV((s) => ({ ...s, role: x, permissions: edit ? s.permissions : DEFAULT_PERMS[x] }))} options={ROLES.map((r) => [r, ROLE_LABEL[r]])} /></Field><Field label="Filial"><Select value={v.branch_id || ''} onChange={(x) => set('branch_id', x)} options={[['', 'Filial tanlanmagan'], ...branches.map((b) => [b.id, b.name])]} /></Field></div>
        </>}
        {perms}
        {!permsOnly && <div><div className="mb-1.5 text-[14px] font-bold">Holat</div><div className="flex items-center gap-3"><Toggle checked={v.active} onChange={(x) => set('active', x)} /><b className="text-[13px]">{v.active ? 'Faol' : 'Faol emas'}</b><span className="text-[12px] text-[#5C6E80]">{v.active ? 'Faol xodim tizimga kira oladi.' : 'Xodim vaqtincha o‘chirilgan.'}</span></div></div>}
        <Err>{err}</Err>
      </div>
    </Modal>
  )
}
