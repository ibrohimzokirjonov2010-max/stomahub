import { useMemo, useState } from 'react'
import { Plus, TicketPercent, Pencil, Copy } from 'lucide-react'
import { useSellerData, insertRow, updateRow, useAsync } from '../../api'
import { dmy, som } from '../../format'
import { card, PageHead, Btn, Input, Toggle, Badge, Err, Fab, toast, SearchInput } from '../../components/ui'
import Empty from '../../components/shell/Empty'
import Modal from '../../components/shell/Modal'
import { STATUS, statusOf, usesOf, today } from '../../components/chegirmalar/constants'

const isPromo = (d) => !!(d.promo_code || '').trim()
const valText = (d) => (d.kind === 'summa' ? som(d.value) : `${d.value || d.percent || 0}%`)

export default function Promokodlar() {
  const data = useSellerData()
  const [form, setForm] = useState(null)
  const [q, setQ] = useState('')
  const rows = useMemo(() => data.discounts.filter(isPromo)
    .map((d) => ({ ...d, s: statusOf(d, data.orders), used: usesOf(d, data.orders).length }))
    .filter((d) => !q.trim() || `${d.promo_code} ${d.title}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')), [data.discounts, data.orders, q])
  const toggle = async (r) => { const res = await updateRow('seller_discounts', r.id, { active: !r.active }); toast(res.ok ? (r.active ? 'Promokod o‘chirildi' : 'Promokod yoqildi') : res.error) }
  const copy = (c) => { navigator.clipboard?.writeText(c).then(() => toast('Promokod nusxalandi'), () => {}) }

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHead title="Promokodlar" subtitle="Mijozlar buyurtmada kiritadigan chegirma kodlari" back="/sotuvchi/marketing"
        action={<Btn icon={Plus} onClick={() => setForm({})}>Promokod yaratish</Btn>} />
      {data.needs0004 && <div className="mb-3"><Err>Chegirmalar jadvali hali tayyor emas. Ma’lumotlar bazasi yangilangach promokodlar shu yerda chiqadi.</Err></div>}
      <SearchInput value={q} onChange={setQ} placeholder="Promokod yoki nomi bo‘yicha qidirish..." className="mb-3 md:max-w-[360px]" />
      <div className={`${card} overflow-hidden`}>
        {data.loading ? <div className="p-6 text-center text-[13px] text-[#5C6E80]">Yuklanmoqda...</div>
          : !rows.length ? <Empty icon={TicketPercent} title={q ? 'Hech narsa topilmadi' : 'Hali promokod yo‘q'} text="Promokod yarating va uni mijozlaringizga ulashing — ular buyurtmada kodni kiritib chegirma oladi."
            action={!q && <Btn className="mt-4" icon={Plus} onClick={() => setForm({})}>Promokod yaratish</Btn>} />
          : <ul className="divide-y divide-[#EEF3F4]">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F0FDFA] text-[#0F766E]"><TicketPercent className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => copy(r.promo_code)} title="Nusxa olish" className="inline-flex items-center gap-1 font-mono text-[15px] font-bold tracking-wide text-[#10283F]">{r.promo_code}<Copy className="size-3.5 text-[#8A98A8]" /></button><Badge tone={STATUS[r.s][1]} dot>{STATUS[r.s][0]}</Badge></div>
                  <div className="mt-0.5 text-[12.5px] text-[#5C6E80]">{valText(r)} chegirma · {dmy(r.starts_on)} – {r.ends_on ? dmy(r.ends_on) : 'muddatsiz'} · Foydalanildi: {r.used}{r.usage_limit ? ` / ${r.usage_limit}` : ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  {r.s !== 'tugagan' && <Toggle checked={!!r.active} onChange={() => toggle(r)} />}
                  <button type="button" aria-label="Tahrirlash" onClick={() => setForm({ edit: r })} className="rounded-lg p-2 hover:bg-[#F0FDFA]"><Pencil className="size-4" /></button>
                </div>
              </li>
            ))}
          </ul>}
      </div>
      <Fab icon={Plus} onClick={() => setForm({})}>Promokod</Fab>
      {form && <PromoForm edit={form.edit} existing={data.discounts} onClose={() => setForm(null)} />}
    </div>
  )
}

function PromoForm({ edit, existing, onClose }) {
  const a = useAsync()
  const [v, setV] = useState(() => edit
    ? { code: edit.promo_code, kind: edit.kind === 'summa' ? 'summa' : 'foiz', value: String(edit.value || edit.percent || ''), starts_on: edit.starts_on || today(), ends_on: edit.ends_on || '', usage_limit: edit.usage_limit ? String(edit.usage_limit) : '', active: !!edit.active }
    : { code: '', kind: 'foiz', value: '', starts_on: today(), ends_on: '', usage_limit: '', active: true })
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e?.target ? e.target.value : e }))
  const save = () => {
    const code = v.code.trim().toUpperCase()
    const val = Number(v.value)
    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) return a.setError('Kod 3–20 ta lotin harf yoki raqamdan iborat bo‘lsin')
    if (existing.some((d) => d.id !== edit?.id && (d.promo_code || '').toUpperCase() === code)) return a.setError('Bu promokod allaqachon mavjud')
    if (v.kind === 'foiz' ? !(val >= 1 && val <= 90) : !(val > 0)) return a.setError(v.kind === 'foiz' ? 'Foiz 1 dan 90 gacha bo‘lsin' : 'Chegirma summasini kiriting')
    if (v.ends_on && v.ends_on < v.starts_on) return a.setError('Tugash sanasi boshlanishdan oldin bo‘lmasin')
    if (v.usage_limit && !(Number(v.usage_limit) > 0)) return a.setError('Foydalanish limiti musbat son bo‘lsin')
    const row = { title: edit?.title || `Promokod ${code}`, kind: v.kind === 'foiz' ? 'promokod' : 'summa', value: val, percent: v.kind === 'foiz' ? val : null, promo_code: code,
      scope: edit?.scope || 'all', starts_on: v.starts_on || today(), ends_on: v.ends_on || null, usage_limit: v.usage_limit ? Number(v.usage_limit) : null, active: v.active, is_draft: false }
    a.go(() => (edit ? updateRow('seller_discounts', edit.id, row) : insertRow('seller_discounts', { ...row, product_ids: [], category: '', min_order: 0, description: '' })), () => { toast(edit ? 'Promokod yangilandi' : 'Promokod yaratildi'); onClose() })
  }
  const L = ({ children }) => <span className="mb-1.5 block text-[13px] font-medium text-[#10283F]">{children}</span>
  return (
    <Modal open onClose={onClose} title={edit ? 'Promokodni tahrirlash' : 'Yangi promokod'}
      footer={<div className="flex justify-end gap-2"><Btn variant="gray" onClick={onClose}>Bekor qilish</Btn><Btn onClick={save} disabled={a.busy}>{a.busy ? 'Saqlanmoqda...' : 'Saqlash'}</Btn></div>}>
      <div className="space-y-3.5 pb-1">
        <label className="block"><L>Promokod *</L><Input value={v.code} onChange={(e) => set('code')(e.target.value.toUpperCase().replace(/\s/g, ''))} placeholder="Masalan: YANGI10" maxLength={20} className="font-mono tracking-wide" /></label>
        <div><L>Chegirma turi *</L><div className="grid grid-cols-2 gap-2">{[['foiz', 'Foiz (%)'], ['summa', 'Qat’iy summa (so‘m)']].map(([k, l]) => <button key={k} type="button" onClick={() => set('kind')(k)} className={`h-[42px] rounded-[10px] border text-[13.5px] font-semibold ${v.kind === k ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]' : 'border-[#DCE5E7] text-[#3D4E5F]'}`}>{l}</button>)}</div></div>
        <label className="block"><L>Qiymati *</L><Input type="number" inputMode="numeric" min="1" value={v.value} onChange={set('value')} placeholder={v.kind === 'foiz' ? 'Masalan: 10' : 'Masalan: 50000'} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><L>Boshlanish sanasi</L><Input type="date" value={v.starts_on} onChange={set('starts_on')} /></label>
          <label className="block"><L>Tugash sanasi</L><Input type="date" value={v.ends_on} onChange={set('ends_on')} /></label>
        </div>
        <label className="block"><L>Foydalanish limiti</L><Input type="number" inputMode="numeric" min="1" value={v.usage_limit} onChange={set('usage_limit')} placeholder="Cheklanmagan" /></label>
        <div className="flex items-center justify-between rounded-xl bg-[#F6FAFA] px-3.5 py-3"><span className="text-[14px] font-medium">Faol</span><Toggle checked={v.active} onChange={set('active')} /></div>
        <Err>{a.error}</Err>
      </div>
    </Modal>
  )
}
