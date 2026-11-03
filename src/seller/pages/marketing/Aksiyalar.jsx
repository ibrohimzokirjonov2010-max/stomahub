import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Flame, ExternalLink } from 'lucide-react'
import { supabase } from '../../../supabaseClient'
import { useSession } from '../../../sessionStore'
import { useSellerData, uid, useAsync } from '../../api'
import { dmy, som } from '../../format'
import { card, PageHead, Btn, Input, Select, Toggle, Badge, Err, Fab, toast } from '../../components/ui'
import Empty from '../../components/shell/Empty'
import Modal from '../../components/shell/Modal'
import ProductThumb from '../../components/bosh-sahifa/ProductThumb'
import { today } from '../../components/chegirmalar/constants'

const missingTable = (e) => e && (e.code === '42P01' || e.code === 'PGRST205' || /seller_promotions/.test(e.message || ''))

function usePromotions() {
  const me = useSession().user?.id
  const [st, setSt] = useState({ loading: true, rows: [], unavailable: false, error: '' })
  const load = useCallback(async () => {
    if (!supabase || !me) { setSt({ loading: false, rows: [], unavailable: false, error: 'Avval kiring' }); return }
    const { data, error } = await supabase.from('seller_promotions').select('*').eq('seller_id', me).order('created_at', { ascending: false })
    if (error) setSt({ loading: false, rows: [], unavailable: missingTable(error), error: missingTable(error) ? '' : error.message })
    else setSt({ loading: false, rows: data || [], unavailable: false, error: '' })
  }, [me])
  useEffect(() => { load() }, [load])
  return { ...st, reload: load }
}

const statusOf = (r) => (!r.active ? ['To‘xtatilgan', 'off'] : r.ends_on < today() ? ['Tugagan', 'off'] : r.starts_on > today() ? ['Rejalashtirilgan', 'mid'] : ['Faol', 'on'])

export default function Aksiyalar() {
  const data = useSellerData()
  const promo = usePromotions()
  const [form, setForm] = useState(false)
  const byId = useMemo(() => Object.fromEntries(data.products.map((p) => [p.id, p])), [data.products])
  const toggle = async (r) => {
    const { error } = await supabase.from('seller_promotions').update({ active: !r.active, updated_at: new Date().toISOString() }).eq('id', r.id).eq('seller_id', uid())
    toast(error ? error.message : r.active ? 'Aksiya to‘xtatildi' : 'Aksiya yoqildi'); promo.reload()
  }
  const add = <Btn icon={Plus} disabled={promo.unavailable} onClick={() => setForm(true)}>Aksiyaga qo‘shish</Btn>
  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHead title="Aksiyalar" subtitle="Mahsulotlaringizni saytning “Aksiyalar” bo‘limiga chiqaring" back="/sotuvchi/marketing" action={add} />
      <Err>{promo.error}</Err>
      <div className={`${card} overflow-hidden`}>
        {promo.loading ? <div className="p-6 text-center text-[13px] text-[#5C6E80]">Yuklanmoqda...</div>
          : promo.unavailable ? <Empty icon={Flame} title="Aksiyalar tez orada ishga tushadi" text="Bu bo‘lim hozircha sozlanmoqda. Tayyor bo‘lgach, mahsulotlaringizni shu yerdan aksiyaga qo‘sha olasiz." />
          : !promo.rows.length ? <Empty icon={Flame} title="Hali aksiya yo‘q" text="Mahsulotingizga aksiya narxi va muddat belgilang — u saytdagi “Aksiyalar” sahifasida ko‘rinadi." action={<div className="mt-4">{add}</div>} />
          : <ul className="divide-y divide-[#EEF3F4]">
            {promo.rows.map((r) => {
              const p = byId[r.product_id]
              const [sl, tone] = statusOf(r)
              const off = Math.round((1 - r.price / r.old_price) * 100)
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <ProductThumb src={p?.image_url} className="h-11 w-12 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><span className="truncate font-semibold">{p?.name || 'Mahsulot'}</span><Badge tone={tone} dot>{sl}</Badge></div>
                    <div className="mt-0.5 text-[12.5px] text-[#5C6E80]"><b className="text-[#0F766E]">{som(r.price)}</b> <s>{som(r.old_price)}</s> · −{off}% · {dmy(r.starts_on)} – {dmy(r.ends_on)}</div>
                  </div>
                  {r.ends_on >= today() && <Toggle checked={!!r.active} onChange={() => toggle(r)} />}
                </li>
              )
            })}
          </ul>}
      </div>
      <Link to="/aksiyalar" className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0F766E]"><ExternalLink className="size-4" />Saytdagi Aksiyalar sahifasi</Link>
      {!promo.unavailable && <Fab icon={Plus} onClick={() => setForm(true)}>Aksiya</Fab>}
      {form && <PromoForm products={data.products.filter((p) => p.status === 'active')} busyIds={promo.rows.filter((r) => r.active && r.ends_on >= today()).map((r) => r.product_id)} onClose={() => setForm(false)} onSaved={promo.reload} />}
    </div>
  )
}

function PromoForm({ products, busyIds, onClose, onSaved }) {
  const a = useAsync()
  const free = products.filter((p) => !busyIds.includes(p.id))
  const [v, setV] = useState({ product_id: free[0]?.id || '', percent: '', starts_on: today(), ends_on: '' })
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e?.target ? e.target.value : e }))
  const p = products.find((x) => x.id === v.product_id)
  const pct = Number(v.percent)
  const newPrice = p ? Math.round(Number(p.price) * (1 - pct / 100)) : 0
  const save = () => {
    if (!p) return a.setError('Mahsulotni tanlang')
    if (!(Number(p.price) > 0)) return a.setError('Mahsulot narxi kiritilmagan')
    if (!(pct >= 1 && pct <= 90)) return a.setError('Chegirma 1% dan 90% gacha bo‘lsin')
    if (!v.ends_on) return a.setError('Tugash sanasini kiriting')
    if (v.ends_on < v.starts_on) return a.setError('Tugash sanasi boshlanishdan oldin bo‘lmasin')
    a.go(async () => {
      const { error } = await supabase.from('seller_promotions').insert({ seller_id: uid(), product_id: p.id, old_price: Number(p.price), price: newPrice, starts_on: v.starts_on, ends_on: v.ends_on, active: true })
      return error ? { ok: false, error: missingTable(error) ? 'Aksiyalar hali ishga tushmagan' : error.message } : { ok: true }
    }, () => { toast('Mahsulot aksiyaga qo‘shildi'); onSaved(); onClose() })
  }
  const L = ({ children }) => <span className="mb-1.5 block text-[13px] font-medium text-[#10283F]">{children}</span>
  return (
    <Modal open onClose={onClose} title="Aksiyaga qo‘shish"
      footer={<div className="flex justify-end gap-2"><Btn variant="gray" onClick={onClose}>Bekor qilish</Btn><Btn onClick={save} disabled={a.busy || !free.length}>{a.busy ? 'Saqlanmoqda...' : 'Qo‘shish'}</Btn></div>}>
      {!free.length ? <Empty icon={Flame} title="Mos mahsulot yo‘q" text="Aksiyaga faqat sotuvdagi (faol) mahsulotlarni qo‘shish mumkin." /> : (
        <div className="space-y-3.5 pb-1">
          <div><L>Mahsulot *</L><Select value={v.product_id} onChange={set('product_id')} options={free.map((x) => [x.id, x.name])} /></div>
          <label className="block"><L>Chegirma foizi *</L><Input type="number" inputMode="numeric" min="1" max="90" value={v.percent} onChange={set('percent')} placeholder="Masalan: 20" /></label>
          {p && pct > 0 && <div className="rounded-xl bg-[#F0FDFA] px-3.5 py-2.5 text-[13.5px]">Aksiya narxi: <b className="text-[#0F766E]">{som(newPrice)}</b> <s className="text-[#5C6E80]">{som(p.price)}</s></div>}
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><L>Boshlanish *</L><Input type="date" value={v.starts_on} onChange={set('starts_on')} /></label>
            <label className="block"><L>Tugash *</L><Input type="date" value={v.ends_on} onChange={set('ends_on')} /></label>
          </div>
          <Err>{a.error}</Err>
        </div>)}
    </Modal>
  )
}
