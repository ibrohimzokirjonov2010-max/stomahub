import { useEffect, useState } from 'react'
import { Info, Link2, Phone, Truck, UserRound, Clock3, ExternalLink, Pencil } from 'lucide-react'
import Modal from '../shell/Modal'
import { Btn, Field, Input, Err, card } from '../ui'
import { useAsync, setDelivery, shipOrder } from '../../api'
import { DELIVERY_SERVICES, deliveryErrors, deliveryFromOrder, hasErrors, safeTrackingUrl, serviceLabel, telHref } from '../../../lib/deliveryTracking'

const PLACEHOLDER = { yandex: 'https://go.yandex/…', boshqa: 'https://…', ozim: 'https://… (ixtiyoriy)' }

/**
 * «Yetkazilmoqda» ga o‘tkazish (mode='ship') yoki yetkazish ma’lumotini tahrirlash (mode='edit').
 * Kuryer ismi/telefoni — sotuvchi kiritadi; Yandex’dan avtomatik olinmaydi.
 */
export default function DeliveryModal({ open, onClose, order, mode = 'ship', onDone, initial }) {
  const [v, setV] = useState(() => ({ ...deliveryFromOrder(order), ...initial }))
  const [tried, setTried] = useState(false)
  const a = useAsync()
  useEffect(() => {
    if (!open) return
    const d = deliveryFromOrder(order)
    setV({ ...d, service: d.service || 'yandex', ...initial })
    setTried(!!initial?.tried); a.setError('')
  }, [open, order?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e?.target ? e.target.value : e }))
  const err = deliveryErrors(v)
  const show = tried ? err : { service: '', url: '', phone: '' }
  const ozim = v.service === 'ozim'

  const submit = () => {
    setTried(true)
    if (hasErrors(err)) return
    a.go(() => (mode === 'ship' ? shipOrder(order.id, v) : setDelivery(order.id, v)), () => { onDone?.(mode); onClose() })
  }

  return (
    <Modal open={open} onClose={onClose} width="max-w-[520px]"
      title={mode === 'ship' ? 'Yetkazishga topshirish' : 'Yetkazish ma’lumoti'}
      subtitle={`${order?.code || ''} — xaridor bu ma’lumotni buyurtma sahifasida ko‘radi.`}
      footer={<div className="grid grid-cols-2 gap-3"><Btn variant="outline" onClick={onClose}>Bekor qilish</Btn><Btn icon={Truck} disabled={a.busy} onClick={submit} data-testid="delivery-submit">{a.busy ? 'Saqlanmoqda…' : mode === 'ship' ? 'Yo‘lga chiqarish' : 'Saqlash'}</Btn></div>}>
      <div data-testid="delivery-form" className="space-y-3.5">
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-[#10283F]">Yetkazib berish xizmati *</span>
          <div role="radiogroup" aria-label="Yetkazib berish xizmati" className="grid grid-cols-3 gap-2">
            {DELIVERY_SERVICES.map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={v.service === k} onClick={() => set('service')(k)}
                className={`min-h-[46px] rounded-[10px] border px-2 py-1.5 text-[12.5px] font-semibold leading-tight transition ${v.service === k ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F766E] ring-1 ring-[#0F766E]' : 'border-[#DCE5E7] bg-white text-[#3D4E5F] hover:bg-[#F6FAFA]'}`}>{l}</button>
            ))}
          </div>
          {show.service && <p role="alert" className="mt-1 text-[12px] font-semibold text-[#BE123C]">{show.service}</p>}
        </div>

        <Field label={`Kuzatuv linki${ozim ? ' (ixtiyoriy)' : ''}`} required={!ozim}
          hint={v.service === 'yandex' ? 'Yandex Go / Yandex Dostavka ilovasida buyurtmani oching → «Ulashish» → havolani nusxalab shu yerga qo‘ying.' : ozim ? 'O‘zingiz yetkazsangiz, link shart emas.' : 'Yetkazib berish xizmatining kuzatuv sahifasi (https://).'}>
          <Input icon={Link2} type="url" inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck={false} maxLength={500}
            value={v.url} onChange={set('url')} placeholder={PLACEHOLDER[v.service] || 'https://…'} aria-invalid={!!show.url} data-testid="delivery-url"
            className={show.url ? '!border-[#E11D48]' : ''} />
          {show.url && <span role="alert" className="mt-1 block text-[12px] font-semibold text-[#BE123C]">{show.url}</span>}
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Kuryer ismi (ixtiyoriy)"><Input icon={UserRound} maxLength={80} value={v.name} onChange={set('name')} placeholder="Masalan: Jasur" /></Field>
          <Field label="Kuryer telefoni (ixtiyoriy)">
            <Input icon={Phone} type="tel" inputMode="tel" maxLength={20} value={v.phone} onChange={set('phone')} placeholder="+998 90 123 45 67" aria-invalid={!!show.phone} className={show.phone ? '!border-[#E11D48]' : ''} />
            {show.phone && <span role="alert" className="mt-1 block text-[12px] font-semibold text-[#BE123C]">{show.phone}</span>}
          </Field>
        </div>
        <Field label="Taxminiy yetib borish vaqti (ixtiyoriy)"><Input icon={Clock3} maxLength={60} value={v.eta} onChange={set('eta')} placeholder="Masalan: bugun 15:00–16:00" /></Field>

        <div className="flex gap-2 rounded-lg bg-[#F0FDFA] p-3 text-[12px] leading-snug text-[#3D4E5F]">
          <Info className="size-4 shrink-0 text-[#0F766E]" />
          <span>Kuryer ismi va telefoni Yandex’dan avtomatik olinmaydi — xaridor aynan siz kiritgan ma’lumotni ko‘radi. Kuryerning jonli joylashuvi kuzatuv linki orqali ochiladi.</span>
        </div>
        <Err>{a.error}</Err>
      </div>
    </Modal>
  )
}

/** Sotuvchi kabinetidagi saqlangan yetkazish ma’lumoti + tahrirlash. */
export function DeliveryInfo({ order, onEdit, compact = false }) {
  const url = safeTrackingUrl(order.tracking_url)
  const has = order.delivery_service || url || order.courier_name || order.courier_phone
  const open = !['bekor_qilindi', 'yetkazildi'].includes(order.status)
  if (!has && order.status !== 'yetkazilmoqda') return null
  const tel = telHref(order.courier_phone)
  return (
    <div data-testid="delivery-info" className={`${card} ${compact ? 'p-3' : 'mt-3 p-4'}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="flex items-center gap-2 text-[15px] font-bold text-[#0F766E]"><Truck className="size-5" />Yetkazib berish</h3>
        {open && <Btn size="sm" variant="outline" icon={Pencil} onClick={onEdit}>{has ? 'Tahrirlash' : 'Ma’lumot kiritish'}</Btn>}
      </div>
      {has ? (
        <dl className="mt-2.5 grid gap-x-4 gap-y-2 text-[13px] sm:grid-cols-2">
          <Item l="Xizmat" v={serviceLabel(order.delivery_service || 'yandex')} />
          <Item l="Kuryer" v={[order.courier_name, order.courier_phone].filter(Boolean).join(' · ') || '—'} href={tel} />
          {order.delivery_eta ? <Item l="Taxminiy vaqt" v={order.delivery_eta} /> : null}
          <div className="min-w-0 sm:col-span-2"><dt className="text-[11.5px] text-[#5C6E80]">Kuzatuv linki</dt>
            <dd className="mt-0.5 flex min-w-0 items-center gap-2">{url ? <><span className="min-w-0 flex-1 truncate text-[#10283F]">{url}</span><a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-[#0F766E]"><ExternalLink className="size-3.5" />Ochish</a></> : <span className="text-[#5C6E80]">Link yo‘q (o‘zi yetkazadi)</span>}</dd></div>
        </dl>
      ) : <p className="mt-2 text-[12.5px] text-[#5C6E80]">Yetkazish ma’lumoti kiritilmagan. Xaridor kuryer ma’lumotini ko‘rishi uchun kiriting.</p>}
    </div>
  )
}
const Item = ({ l, v, href }) => <div className="min-w-0"><dt className="text-[11.5px] text-[#5C6E80]">{l}</dt><dd className="mt-0.5 truncate font-medium text-[#10283F]">{href ? <a href={href} className="text-[#0F766E]">{v}</a> : v}</dd></div>
