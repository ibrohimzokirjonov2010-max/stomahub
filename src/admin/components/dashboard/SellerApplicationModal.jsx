import { friendlyError } from '../../../lib/friendlyError'
import { useEffect, useState } from 'react'
import { Ban, Check, FileText, Mail, MapPin, Phone, Search, Store, User, X } from 'lucide-react'
import Modal from '../Modal'
import Lightbox from '../Lightbox'
import { fetchSellerApplication, reviewSeller } from '../../api'
import { dmyhm, maskEmail, maskPhone } from '../../format'

const BADGE = {
  official: { label: 'Rasmiy do‘kon', cls: 'bg-[#10283F] text-white' },
  approved: { label: 'Tasdiqlangan', cls: 'bg-[#E3F4F1] text-[#0F766E]' },
  pending: { label: 'Yangi ariza', cls: 'bg-[#E0F2FE] text-[#0369A1]' },
  registered: { label: 'Ariza yuborilmagan', cls: 'bg-[#EEF2F4] text-[#5C6E80]' },
  rejected: { label: 'Rad etilgan', cls: 'bg-[#FDE8E8] text-[#b42318]' },
  blocked: { label: 'Bloklangan', cls: 'bg-[#FDE8E8] text-[#b42318]' },
}

export default function SellerApplicationModal({ id, official: officialProp = false, onClose, onDone }) {
  const [state, setState] = useState({ loading: true, error: '', data: null })
  const [busy, setBusy] = useState('')
  const [reason, setReason] = useState('')
  const [lb, setLb] = useState({ open: false, index: 0 })

  useEffect(() => {
    if (!id) return
    let live = true
    setState({ loading: true, error: '', data: null })
    setReason('')
    fetchSellerApplication(id)
      .then((data) => { if (live) setState({ loading: false, error: '', data }) })
      .catch((e) => { if (live) setState({ loading: false, error: friendlyError(e), data: null }) })
    return () => { live = false }
  }, [id])

  async function act(action) {
    if ((action === 'reject' || action === 'block') && reason.trim().length < 3) {
      setState((s) => ({ ...s, error: 'Sababni yozing (kamida 3 belgi).' }))
      return
    }
    setBusy(action)
    try {
      await reviewSeller(id, action, reason)
      onDone?.()
      onClose()
    } catch (e) {
      setState((s) => ({ ...s, error: friendlyError(e) }))
    } finally {
      setBusy('')
    }
  }

  const d = state.data
  const official = !!(d?.official || officialProp)
  const st = official ? 'official' : (d?.blocked ? 'blocked' : (!d?.seller_status || d.seller_status === 'none' ? 'registered' : d.seller_status))
  const can = {
    approve: ['pending', 'rejected', 'registered'].includes(st),
    reject: st === 'pending',
    block: !['official', 'blocked'].includes(st),
  }
  const docs = (d?.docs || []).map((doc) => ({
    label: doc.label || doc.name || 'Hujjat',
    url: doc.url || doc.image_url || '',
  }))

  const footer = d ? (
    <div className="flex flex-wrap items-center gap-2">
      {can.approve && <button type="button" disabled={!!busy} onClick={() => act('approve')} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0F766E] px-5 text-[14px] font-semibold text-white disabled:opacity-60">
        <Check className="size-4" /> Tasdiqlash
      </button>}
      {can.reject && <button type="button" disabled={!!busy} onClick={() => act('reject')} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1F2A3C] px-5 text-[14px] font-semibold text-white disabled:opacity-60">
        <X className="size-4" /> Rad etish
      </button>}
      {can.block && <button type="button" disabled={!!busy} onClick={() => act('block')} className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#E6EEF0] bg-white px-5 text-[14px] font-semibold text-[#10283F] disabled:opacity-60">
        <Ban className="size-4" /> Bloklash
      </button>}
      <button type="button" onClick={onClose} className="ml-auto inline-flex h-11 items-center rounded-xl border border-[#E6EEF0] bg-white px-5 text-[14px] font-semibold text-[#10283F]">Yopish</button>
    </div>
  ) : null

  return (
    <>
      <Modal open={!!id} onClose={onClose} title={official ? "Rasmiy do‘kon" : "Sotuvchi arizasi"} subtitle={official ? "Platformaning o‘z do‘koni ma’lumotlari." : "Sotuvchi tomonidan yuborilgan ma’lumotlarni ko‘rib chiqing."} width="max-w-[860px]" footer={footer}>
        {state.loading && <p className="py-10 text-center text-[#5C6E80]">Yuklanmoqda…</p>}
        {state.error && <p role="alert" className="mb-3 rounded-xl bg-[#FEF2F2] px-3 py-2 text-[13px] text-[#b42318]">{state.error}</p>}
        {d && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start gap-3">
              <span className="grid size-14 place-items-center rounded-2xl bg-[#F0FDFA] text-[#0F766E]"><Store className="size-7" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[20px] font-extrabold text-[#10283F]">{d.shop_name || d.name || '—'}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${BADGE[st]?.cls || BADGE.registered.cls}`}>{BADGE[st]?.label || st}</span>
                </div>
                <p className="mt-0.5 text-[13.5px] text-[#5C6E80]">{d.shop_type || 'Tibbiy va stomatologik mahsulotlar'}</p>
                <p className="mt-1 text-[12.5px] text-[#8A9AA8]">{official ? 'Yaratilgan' : 'Ariza sanasi'}: {dmyhm(d.applied_at || d.created_at)}</p>
                {d.products_count != null && (
                  <p className="mt-1 text-[12.5px] text-[#5C6E80]">
                    Mahsulotlar: {d.products_active ?? 0} faol / {d.products_count} jami · Buyurtmalar: {d.orders_count ?? 0} (yetkazilgan {d.orders_delivered ?? 0})
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard title="Shaxsiy / tashkilot">
                <Row icon={User} label="Mas’ul shaxs" value={d.name || '—'} />
                <Row icon={Phone} label="Telefon" value={maskPhone(d.phone)} />
                <Row icon={Mail} label="Email" value={maskEmail(d.email)} />
                <Row icon={MapPin} label="Manzil" value={d.address || '—'} />
                <Row icon={FileText} label="Tashkilot turi" value={d.org_type || '—'} />
                <Row icon={FileText} label="STIR" value={d.stir || '—'} />
                {d.extra && <p className="mt-2 text-[13px] leading-relaxed text-[#3D4E5F]">{d.extra}</p>}
              </InfoCard>
              <InfoCard title="Do‘kon">
                <Row icon={Store} label="Do‘kon nomi" value={d.shop_name || '—'} />
                <Row icon={Store} label="Kategoriyalar" value={(d.categories || []).join(', ') || '—'} />
                <Row icon={MapPin} label="Manzil" value={d.shop_address || d.address || '—'} />
                {d.shop_description && <p className="mt-2 text-[13px] leading-relaxed text-[#3D4E5F]">{d.shop_description}</p>}
              </InfoCard>
            </div>

            <div>
              <h4 className="mb-2 text-[14px] font-bold text-[#10283F]">Yuborilgan hujjatlar</h4>
              {!docs.length && <p className="rounded-xl border border-dashed border-[#E6EEF0] px-3 py-4 text-center text-[13px] text-[#8A9AA8]">Hujjat yuklanmagan</p>}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {docs.map((doc, i) => (
                  <button
                    key={doc.label + i}
                    type="button"
                    onClick={() => setLb({ open: true, index: i })}
                    className="group relative overflow-hidden rounded-xl border border-[#E6EEF0] bg-[#F8FBFC] p-3 text-center hover:border-[#0F766E]/40"
                  >
                    <div className="relative mx-auto grid size-16 place-items-center overflow-hidden rounded-lg bg-white text-[#0F766E] shadow-sm">
                      {doc.url ? (
                        <img src={doc.url} alt="" className="size-full object-cover" />
                      ) : (
                        <FileText className="size-7" />
                      )}
                      <span className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/35">
                        <Search className="size-5 text-white opacity-0 transition group-hover:opacity-100" />
                      </span>
                    </div>
                    <div className="mt-2 text-[12px] font-semibold text-[#10283F]">{doc.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {(can.reject || can.block) && <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-[#3D4E5F]">Rad etish / bloklash sababi</span>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Ixtiyoriy (rad/blok uchun majburiy)" className="w-full rounded-xl border border-[#E6EEF0] bg-[#F8FBFC] px-3 py-2.5 text-[14px] outline-none focus:border-[#0F766E]" />
            </label>}
          </div>
        )}
      </Modal>
      <Lightbox open={lb.open} items={docs} index={lb.index} onClose={() => setLb({ open: false, index: 0 })} onIndex={(i) => setLb((s) => ({ ...s, index: i }))} />
    </>
  )
}

function InfoCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-[#E6EEF0] bg-[#F8FBFC] p-4">
      <h4 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#5C6E80]">{title}</h4>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  )
}

function Row({ icon: Icon, label, value }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-white text-[#0F766E] shadow-sm"><Icon className="size-3.5" /></span>
      <div className="min-w-0">
        <div className="text-[11.5px] font-medium text-[#8A9AA8]">{label}</div>
        <div className="text-[13.5px] font-semibold text-[#10283F]">{value}</div>
      </div>
    </li>
  )
}
