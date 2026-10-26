import { useState } from 'react'
import { Phone, CalendarDays, Briefcase, Building2, Pencil, ShieldCheck, UserX, UserCheck, Trash2, ChevronRight } from 'lucide-react'
import Modal from '../shell/Modal'
import Confirm from '../shell/Confirm'
import { Btn, Badge, Checkbox, Th, Td, toast } from '../ui'
import { updateRow, deleteRow, logActivity } from '../../api'
import { dmy, hm } from '../../format'
import { useMobile } from '../../../useMobile'
import { PERMS, ROLE_LABEL, maskPhone, initials } from './constants'

export default function StaffDetail({ s, branches, activity, onClose, onEdit, onPerms }) {
  const mobile = useMobile()
  const [del, setDel] = useState(false)
  const branch = branches.find((b) => b.id === s.branch_id)?.name || 'Filial tanlanmagan'
  const acts = activity.filter((a) => a.staff_id === s.id).slice(0, 5)
  const toggleActive = async () => { const r = await updateRow('seller_staff', s.id, { active: !s.active }); if (r.ok) { await logActivity(s.active ? 'Xodim faolsizlantirildi' : 'Xodim faollashtirildi', s.name); toast(s.active ? 'Xodim faolsizlantirildi' : 'Xodim faollashtirildi') } else toast(r.error) }
  const remove = async () => { const r = await deleteRow('seller_staff', s.id); if (r.ok) { await logActivity('Xodim o‘chirildi', s.name); toast('Xodim o‘chirildi'); onClose() } else toast(r.error) }
  const status = <Badge tone={s.active ? 'on' : 'off'} dot className="rounded-full px-3">{s.active ? 'Faol' : 'Faol emas'}</Badge>
  const PA = s.active ? UserX : UserCheck
  const actions = [[Pencil, 'Tahrirlash', onEdit], [ShieldCheck, 'Ruxsatlarni o‘zgartirish', onPerms], [PA, s.active ? 'Faolsizlantirish' : 'Faollashtirish', toggleActive], [Trash2, 'O‘chirish', () => setDel(true)]]
  return (
    <Modal open onClose={onClose} full={mobile} title="Xodim ma’lumotlari" subtitle={mobile ? undefined : 'Xodim haqida to‘liq ma’lumot va faoliyat tarixi.'} width="md:max-w-[720px]"
      footer={mobile ? null : <div className="flex gap-2">{actions.map(([I, l, f]) => <Btn key={l} size="sm" variant="outline" icon={I} onClick={f}>{l}</Btn>)}<Btn size="sm" onClick={onClose} className="ml-auto px-8">Yopish</Btn></div>}>
      {mobile ? (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-[#E2ECEE]"><div className="flex items-center gap-4 bg-[#F0FDFA] p-4"><span className="grid size-20 place-items-center rounded-full bg-[#CCFBF1] text-[24px] font-bold text-[#0F766E]">{initials(s.name)}</span><div className="space-y-1.5"><div className="text-[19px] font-extrabold">{s.name}</div><Badge className="rounded-full px-3">{ROLE_LABEL[s.role]}</Badge><div>{status}</div></div></div>
            {[[Phone, 'Telefon raqami', s.phone], [CalendarDays, 'Qo‘shilgan sana', `${dmy(s.created_at)}, ${hm(s.created_at)}`], [Building2, 'Filial', branch]].map(([I, l, v]) => <div key={l} className="flex items-center gap-3 border-t border-[#EEF3F4] p-3"><span className="grid size-9 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]"><I className="size-4" /></span><div><div className="text-[13px]">{l}</div><div className="text-[13px] text-[#3D4E5F]">{v}</div></div></div>)}</div>
          <div className="rounded-2xl border border-[#E2ECEE] p-3"><b className="text-[15px]">Huquqlar</b><p className="text-[12px] text-[#5C6E80]">Xodimga berilgan ruxsatlar.</p>{PERMS.filter((p) => s.permissions.includes(p[0])).map(([k, l, d, I]) => <div key={k} className="flex items-center gap-3 border-b border-[#EEF3F4] py-2.5 last:border-0"><span className="grid size-10 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]"><I className="size-5" /></span><div><div className="text-[13px] font-semibold">{l}</div><div className="text-[12px] text-[#5C6E80]">{d}</div></div></div>)}{!s.permissions.length && <p className="py-3 text-[13px] text-[#5C6E80]">Ruxsatlar berilmagan.</p>}</div>
          {actions.map(([I, l, f], i) => <button key={l} type="button" onClick={f} className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-[14px] font-semibold ${i === 0 ? 'border-[#0F766E] bg-[#0F766E] text-white' : i === 3 ? 'border-[#D5DEE0] bg-[#F6F8F9]' : 'border-[#99D5CE] bg-white text-[#10283F]'}`}><I className="size-5" /><span className="flex-1 text-left">{l}</span><ChevronRight className="size-4" /></button>)}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-xl bg-[#F0FDFA] p-4"><span className="grid size-16 place-items-center rounded-full bg-[#CCFBF1] text-[20px] font-bold text-[#0F766E]">{initials(s.name)}</span><div className="flex-1"><div className="flex items-center gap-2"><b className="text-[20px]">{s.name}</b><Badge className="rounded-full">{ROLE_LABEL[s.role]}</Badge></div><div className="text-[13px] text-[#5C6E80]">{branch}</div></div><div className="text-right">{status}<div className="mt-1 text-[11.5px] text-[#5C6E80]">{dmy(s.created_at)} dan beri</div></div></div>
          <div className="grid grid-cols-2 gap-3">{[[Phone, 'Telefon raqam', maskPhone(s.phone)], [CalendarDays, 'Qo‘shilgan sana', `${dmy(s.created_at)} ${hm(s.created_at)}`], [Briefcase, 'Lavozim', ROLE_LABEL[s.role]], [Building2, 'Filial', branch]].map(([I, l, v]) => <div key={l} className="flex items-center gap-3 rounded-xl border border-[#E2ECEE] p-3"><span className="grid size-10 place-items-center rounded-full bg-[#F0FDFA] text-[#0F766E]"><I className="size-5" /></span><div><div className="text-[12px] text-[#5C6E80]">{l}</div><div className="text-[14px] font-semibold">{v}</div></div></div>)}</div>
          <div><b className="text-[15px]">Ruxsatlar</b><p className="mb-2 text-[12px] text-[#5C6E80]">Xodimga berilgan bo‘limlar va amallar.</p><div className="grid grid-cols-2 gap-2">{PERMS.map(([k, l, d, I]) => <div key={k} className="flex items-center gap-3 rounded-xl border border-[#E2ECEE] p-2.5"><Checkbox checked={s.permissions.includes(k)} onChange={() => onPerms()} /><I className="size-5 text-[#0F766E]" /><div><div className="text-[13px] font-semibold">{l}</div><div className="text-[11.5px] text-[#5C6E80]">{d}</div></div></div>)}</div></div>
          <div><b className="text-[15px]">Oxirgi faoliyat</b><p className="mb-2 text-[12px] text-[#5C6E80]">Xodimning platformadagi so‘nggi amallari.</p>{acts.length ? <table className="w-full text-[12.5px]"><thead className="bg-[#F6FAFA]"><tr><Th>#</Th><Th>Sana va vaqt</Th><Th>Amal</Th><Th>Tavsif</Th></tr></thead><tbody>{acts.map((a, i) => <tr key={a.id} className="border-t border-[#EEF3F4]"><Td>{i + 1}</Td><Td>{dmy(a.created_at)} {hm(a.created_at)}</Td><Td>{a.action}</Td><Td>{a.details}</Td></tr>)}</tbody></table> : <p className="rounded-xl bg-[#F6FAFA] p-4 text-center text-[13px] text-[#5C6E80]">Hali faoliyat qayd etilmagan.</p>}</div>
        </div>
      )}
      <Confirm open={del} onClose={() => setDel(false)} title="Xodimni o‘chirish" text={`${s.name} ro‘yxatdan butunlay o‘chiriladi.`} okText="O‘chirish" onOk={remove} />
    </Modal>
  )
}
