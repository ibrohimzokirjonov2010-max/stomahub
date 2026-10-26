import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Copy, Wallet, Check, Box, Truck, FileText, MessageSquare, X, Store, UserRound, Phone, MapPin, Navigation, Info, Printer, RefreshCw, ArrowLeft, ShoppingCart, Banknote, Calculator, Ellipsis } from 'lucide-react'
import { useSellerData, setOrderStatus, updateRow, netOf, useAsync } from '../api'
import { num, som, dmy, hm } from '../format'
import { card, Btn, Crumbs, Th, Td, toast, Textarea, Menu, Err } from '../components/ui'
import Empty from '../components/shell/Empty'
import Modal from '../components/shell/Modal'
import ProductThumb from '../components/bosh-sahifa/ProductThumb'
import { OrderBadge } from './Buyurtmalar'
import { O_LABEL, O_NEXT, O_FLOW, DELIVERY, showPhone, phoneOf } from '../components/buyurtmalar/constants'

const REASONS = ['Mahsulot omborda qolmagan', 'Xaridor bekor qilishni so‘radi', 'Xaridor bilan bog‘lanib bo‘lmadi', 'Manzil noto‘g‘ri', 'Boshqa sabab']
const mapUrl = (a) => `https://yandex.uz/maps/?text=${encodeURIComponent(a)}`

function printWaybill(o, shop) {
  const w = window.open('', '_blank', 'width=800,height=900')
  if (!w) { toast('Brauzer yangi oynani blokladi'); return }
  const rows = o.items.map((it, i) => `<tr><td>${i + 1}</td><td>${it.name}${it.variant ? ` (${it.variant})` : ''}</td><td>${it.qty}</td><td>${num(it.price)}</td><td>${num(it.price * it.qty)}</td></tr>`).join('')
  w.document.write(`<html><head><title>Nakladnoy ${o.code}</title><style>body{font-family:sans-serif;padding:32px;color:#10283F}table{width:100%;border-collapse:collapse;margin:16px 0}td,th{border:1px solid #ccd;padding:6px 8px;text-align:left;font-size:13px}h1{color:#0F766E}</style></head><body>
  <h1>Nakladnoy № ${o.code}</h1><p>Sana: ${dmy(o.created_at)} ${hm(o.created_at)}<br>Sotuvchi: ${shop || ''}<br>Xaridor: ${o.customer_name || ''} ${o.customer_phone || ''}<br>Manzil: ${o.address || ''}</p>
  <table><tr><th>#</th><th>Mahsulot</th><th>Soni</th><th>Narx (so‘m)</th><th>Jami (so‘m)</th></tr>${rows}</table>
  <p>Mahsulotlar: ${som(o.subtotal)}<br>Chegirma: ${som(o.discount_amount || 0)}<br>Yetkazish: ${som(o.delivery_fee || 0)}<br><b>Jami: ${som(netOf(o) + Number(o.delivery_fee || 0))}</b><br>To‘lov: naqd pul, yetkazilganda</p>
  <p style="margin-top:48px">Topshirdi: ____________ &nbsp;&nbsp; Qabul qildi: ____________</p><script>print()</script></body></html>`)
  w.document.close()
}

export default function BuyurtmaDetail() {
  const { id } = useParams()
  const data = useSellerData()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const o = data.orders.find((x) => x.id === id)
  const [note, setNote] = useState('')
  const [cancel, setCancel] = useState(false)
  const [reason, setReason] = useState(REASONS[0])
  const [other, setOther] = useState('')
  const a = useAsync()
  const { shop } = useOutletContext() || {}
  useEffect(() => { if (o) setNote(o.internal_note || '') }, [o?.id, o?.internal_note]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (sp.get('cancel')) { setCancel(true); sp.delete('cancel'); setSp(sp, { replace: true }) } }, [sp, setSp])

  if (data.loading) return <div className={`${card} h-64 animate-pulse`} />
  if (!o) return <div className={card}><Empty icon={FileText} title="Buyurtma topilmadi" text="U o‘chirilgan yoki sizga tegishli emas." action={<Btn className="mt-4" onClick={() => navigate('/sotuvchi/buyurtmalar')}>Buyurtmalarga qaytish</Btn>} /></div>

  const hist = Object.fromEntries((o.status_history || []).map((h) => [h.status, h.at]))
  hist.yangi = hist.yangi || o.created_at
  const cancelled = o.status === 'bekor_qilindi'
  const idx = O_FLOW.indexOf(o.status)
  const next = O_NEXT[o.status]
  const total = netOf(o) + Number(o.delivery_fee || 0)
  const open = !cancelled && o.status !== 'yetkazildi'
  const phoneOk = showPhone(o) && o.customer_phone
  const go = async (s, r) => a.go(() => setOrderStatus(o.id, s, r), () => toast(`Holat: ${O_LABEL[s]}`))
  const copy = () => { navigator.clipboard?.writeText(o.code); toast('Nusxalandi') }
  const write = () => { if (!phoneOk) { toast('Telefon raqami buyurtma tasdiqlangandan keyin ko‘rinadi'); return } location.href = `sms:${o.customer_phone.replace(/\s/g, '')}` }
  const call = () => { if (!phoneOk) { toast('Telefon raqami buyurtma tasdiqlangandan keyin ko‘rinadi'); return } location.href = `tel:${o.customer_phone.replace(/\s/g, '')}` }
  const saveNote = () => a.go(() => updateRow('seller_orders', o.id, { internal_note: note.slice(0, 500) }), () => toast('Ichki izoh saqlandi'))
  const doCancel = () => a.go(() => setOrderStatus(o.id, 'bekor_qilindi', reason === 'Boshqa sabab' ? other.trim() || reason : reason), () => { toast('Buyurtma bekor qilindi, qoldiq qaytarildi'); setCancel(false) })
  const deliv = DELIVERY.find((d) => d[0] === o.delivery_method)?.[1] || 'Kuryer orqali yetkazish'

  const stepper = (mobile) => {
    const steps = mobile ? [['yangi', 'Yangi', FileText], ['tayyorlanmoqda', 'Yig‘ilmoqda', Box], ['yetkazilmoqda', 'Yetkazilmoqda', Truck], ['yetkazildi', 'Yakunlangan', Check]] : O_FLOW.map((s) => [s, O_LABEL[s] === 'Tasdiqlangan' ? 'Tasdiqlangan' : O_LABEL[s], Check])
    return (
      <div className="flex">
        {steps.map(([s, l, I], i) => {
          const done = !cancelled && O_FLOW.indexOf(s) <= idx
          const lineDone = !cancelled && i < steps.length - 1 && O_FLOW.indexOf(steps[i + 1][0]) <= idx
          return (
            <div key={s} className="relative flex flex-1 flex-col items-center text-center">
              {i < steps.length - 1 && <span className={`absolute top-[11px] left-1/2 w-full md:top-[9px] ${lineDone ? 'h-[3px] bg-[#0F766E]' : 'border-t-2 border-dashed border-[#CFDADD]'} ${mobile ? 'top-[16px]' : ''}`} />}
              <span className={`relative grid place-items-center rounded-full ${mobile ? 'size-9' : 'size-5'} ${done ? 'bg-[#0F766E] text-white' : 'bg-[#E6EEF0] text-[#5C6E80]'}`}>{mobile ? <I className="size-4" /> : <Check className="size-3" strokeWidth={3} />}</span>
              <div className={`mt-1.5 text-[12px] ${done ? 'font-semibold text-[#10283F]' : 'text-[#3D4E5F]'} ${mobile && done && s !== 'yangi' ? '!text-[#0F766E]' : ''}`}>{l}</div>
              <div className="text-[11px] leading-tight text-[#5C6E80]">{hist[s] ? <>{dmy(hist[s])}<br />{hm(hist[s])}</> : mobile ? '—' : ''}</div>
            </div>
          )
        })}
      </div>
    )
  }
  const cancelModal = (
    <Modal open={cancel} onClose={() => setCancel(false)} title="Buyurtmani bekor qilish" subtitle={`${o.code} — mahsulotlar qoldiqqa qaytariladi.`} width="max-w-[480px]">
      <div className="space-y-2">{REASONS.map((r) => <label key={r} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[#E6EEF0] px-3 py-2.5 text-[14px] has-[:checked]:border-[#0F766E] has-[:checked]:bg-[#F0FDFA]"><input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-[#0F766E]" />{r}</label>)}</div>
      {reason === 'Boshqa sabab' && <Textarea className="mt-3" rows={3} maxLength={300} value={other} onChange={(e) => setOther(e.target.value)} placeholder="Sababni yozing" />}
      <Err>{a.error}</Err>
      <div className="mt-5 grid grid-cols-2 gap-3"><Btn variant="outline" onClick={() => setCancel(false)}>Ortga</Btn><Btn disabled={a.busy} onClick={doCancel}>Bekor qilish</Btn></div>
    </Modal>
  )

  return (
    <div>
      {/* Desktop */}
      <div className="hidden md:block">
        <Crumbs items={[['Buyurtmalar', '/sotuvchi/buyurtmalar'], ['Buyurtma tafsiloti']]} />
        <div className="flex items-start justify-between gap-4">
          <div><h1 className="text-[30px] font-extrabold text-[#10283F]">Buyurtma tafsiloti</h1><p className="text-[14px] text-[#3D4E5F]">Buyurtma haqida to‘liq ma’lumot va amallar.</p></div>
          <Btn variant="outline" icon={ChevronLeft} className="border-[#DCE5E7] text-[#10283F]" onClick={() => navigate('/sotuvchi/buyurtmalar')}>Buyurtmalarga qaytish</Btn>
        </div>
        <Err>{a.error}</Err>
        <div className="mt-5 grid grid-cols-[1fr_220px] gap-3 xl:grid-cols-[1fr_290px]">
          <div className={`${card} p-5`}>
            <div className="grid grid-cols-4 divide-x divide-[#EEF3F4] border-b border-[#EEF3F4] pb-4 text-[12.5px] text-[#5C6E80]">
              <div className="pr-3">Buyurtma raqami<div className="mt-1 flex items-center gap-2 text-[17px] font-bold text-[#10283F]">{o.code}<button type="button" aria-label="Nusxalash" onClick={copy}><Copy className="size-4 text-[#5C6E80]" /></button></div></div>
              <div className="px-4">Sana<div className="mt-1 text-[17px] font-bold text-[#10283F]">{dmy(o.created_at)}</div>{hm(o.created_at)}</div>
              <div className="px-4">To‘lov usuli<div className="mt-1 flex items-center gap-2"><Wallet className="size-5 text-[#0F766E]" /><div><b className="text-[15px] text-[#10283F]">Naqd</b><br />Yetkazilganda</div></div></div>
              <div className="pl-4">Holat<div className="mt-2"><OrderBadge status={o.status} /></div></div>
            </div>
            <div className="pt-5">{cancelled ? <div className="rounded-lg bg-[#F3F5F6] p-3 text-[13px] text-[#3D4E5F]"><b>Bekor qilingan.</b> Sabab: {o.cancel_reason || '—'}</div> : stepper(false)}</div>
          </div>
          <div className={`${card} flex flex-col gap-2 p-2.5`}>
            {next && <Btn icon={next[0] === 'tayyorlanmoqda' ? Box : next[0] === 'yetkazilmoqda' ? Truck : Check} disabled={a.busy} onClick={() => go(next[0])}>{next[1]}</Btn>}
            {o.status === 'tasdiqlandi' && <Btn variant="outline" icon={Truck} disabled={a.busy} onClick={() => go('yetkazilmoqda')}>Yetkazishga topshirish</Btn>}
            <Btn variant="outline" icon={FileText} onClick={() => printWaybill(o, shop)}>Nakladnoy chop etish</Btn>
            <Btn variant="outline" icon={MessageSquare} onClick={write}>Xaridorga yozish</Btn>
            {open && <Btn variant="outline" icon={X} className="border-[#AEB8C2] text-[#10283F]" onClick={() => setCancel(true)}>Bekor qilish</Btn>}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_290px]">
          <div className="space-y-3">
            <div className={`${card} p-4`}>
              <h3 className="text-[16px] font-bold text-[#0F766E]">Xaridor ma’lumotlari</h3>
              <div className="mt-3 grid grid-cols-[1fr_1.6fr] gap-4">
                <div className="flex items-center gap-3 border-r border-[#EEF3F4]"><span className="grid size-11 place-items-center rounded-full bg-[#E3F4F2] text-[#0F766E]"><Store className="size-5" /></span><div><b className="text-[14px]">{o.customer_name || '—'}</b><div className="text-[12.5px] text-[#5C6E80]">{o.city || o.region || ''}</div></div></div>
                <div>
                  <div className="grid grid-cols-2 gap-3 border-b border-[#EEF3F4] pb-2.5 text-[12px] text-[#5C6E80]">
                    <div className="flex gap-2"><UserRound className="size-4 text-[#0F766E]" /><div>Mas’ul shaxs<div className="text-[13.5px] text-[#10283F]">{o.contact_person || o.customer_name || '—'}</div></div></div>
                    <div className="flex gap-2"><Phone className="size-4 text-[#0F766E]" /><div>Telefon<div className="text-[13.5px] text-[#10283F]">{phoneOf(o)}</div></div></div>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2 text-[12px] text-[#5C6E80]"><MapPin className="size-4 shrink-0 text-[#0F766E]" /><div className="flex-1">Manzil<div className="text-[12.5px] text-[#3D4E5F]">{o.address || '—'}</div></div>{o.address && <a href={mapUrl(o.address)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg border border-[#DCE5E7] px-3 py-2 text-[12px] font-semibold text-[#0F766E]"><Navigation className="size-3.5" />Xaritada ko‘rish</a>}</div>
                </div>
              </div>
            </div>
            <div className={`${card} overflow-x-auto p-4`}>
              <h3 className="flex items-center gap-2 text-[16px] font-bold text-[#0F766E]"><Box className="size-5" />Mahsulotlar ({o.items.length} ta)</h3>
              <table className="mt-3 w-full min-w-[560px]">
                <thead className="bg-[#F6FAFA]"><tr><Th>#</Th><Th>Rasm</Th><Th>Mahsulot nomi</Th><Th>SKU</Th><Th>Rang / O‘lcham</Th><Th>Soni</Th><Th className="text-right">Narx (so‘m)</Th><Th className="text-right">Jami (so‘m)</Th></tr></thead>
                <tbody>{o.items.map((it, i) => { const p = data.products.find((x) => x.id === it.product_id); return (
                  <tr key={it.id} className="border-t border-[#EEF3F4]"><Td>{i + 1}</Td><Td><ProductThumb src={it.image_url} className="h-9 w-11" /></Td><Td>{p ? <Link to={`/sotuvchi/mahsulotlar/${p.id}`} className="font-medium hover:text-[#0F766E]">{it.name}</Link> : it.name}</Td><Td>{p?.sku || '—'}</Td><Td>{it.variant || '—'}</Td><Td>{it.qty}</Td><Td className="text-right">{num(it.price)}</Td><Td className="text-right">{num(it.price * it.qty)}</Td></tr>) })}</tbody>
              </table>
              <div className="mt-2 text-[12.5px] text-[#5C6E80]">Yetkazish: {deliv}{o.delivery_date ? `, ${dmy(o.delivery_date)}` : ''}</div>
            </div>
          </div>
          <div className={`${card} h-fit p-4 text-[13px]`}>
            <h3 className="text-[15px] font-bold">To‘lov ma’lumotlari</h3>
            <div className="mt-3 space-y-1.5"><Row l="Mahsulotlar jami" v={som(o.subtotal)} />{Number(o.discount_amount) > 0 && <Row l="Chegirma" v={`−${som(o.discount_amount)}`} />}<Row l="Yetkazib berish" v={som(o.delivery_fee || 0)} /></div>
            <div className="-mx-1 my-3 flex justify-between rounded-lg bg-[#F0FDFA] px-3 py-2.5 font-bold"><span>Jami summa</span><span>{som(total)}</span></div>
            <Row l="Stoqm Hub komissiyasi (12%)" v={som(o.commission)} />
            <div className="-mx-1 my-3 flex justify-between rounded-lg bg-[#F0FDFA] px-3 py-2.5 font-bold"><span>Sizga tushadi</span><span>{som(o.payout)}</span></div>
            <div className="flex gap-2 rounded-lg bg-[#F0FDFA] p-3 text-[12px] text-[#3D4E5F]"><Info className="size-5 shrink-0 text-[#0F766E]" /><div><b className="text-[#10283F]">To‘lov naqd pulda amalga oshiriladi.</b><br />Xaridordan to‘lov yetkazilganda qabul qilinadi.</div></div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className={`${card} p-4`}><h3 className="flex items-center gap-2 text-[14px] font-bold text-[#0F766E]"><FileText className="size-4" />Izoh (xaridor)</h3><div className="mt-2 min-h-[42px] rounded-lg border border-[#E6EEF0] px-3 py-2.5 text-[13px] text-[#3D4E5F]">{o.note || 'Izoh qoldirilmagan.'}</div></div>
          <div className={`${card} p-4`}><h3 className="flex items-center gap-2 text-[14px] font-bold text-[#0F766E]"><FileText className="size-4" />Ichki izoh (sotuvchi)</h3><Textarea rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Faqat siz ko‘rasiz" className="mt-2" />{note !== (o.internal_note || '') && <Btn size="sm" className="mt-2" disabled={a.busy} onClick={saveNote}>Saqlash</Btn>}</div>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="-mx-4 -mt-4 mb-3 flex items-start justify-between bg-white px-4 pb-3 pt-3">
          <button type="button" aria-label="Ortga" onClick={() => navigate('/sotuvchi/buyurtmalar')} className="pt-1 text-[#0F766E]"><ArrowLeft className="size-6" /></button>
          <div className="text-center"><div className="text-[17px] font-bold">Buyurtma tafsiloti</div><div className="text-[17px] font-bold">#{o.code}</div><div className="text-[12.5px] text-[#5C6E80]">{dmy(o.created_at)} {hm(o.created_at)} da yaratilgan</div></div>
          <Menu icon={Ellipsis} items={[['Nusxalash', copy, Copy], ['Nakladnoy chop etish', () => printWaybill(o, shop), Printer], ['Xaridorga yozish', write, MessageSquare]]} />
        </div>
        <Err>{a.error}</Err>
        <div className="space-y-3">
          <div className={`${card} p-3`}>{cancelled ? <div className="text-[13px]"><OrderBadge status={o.status} /> <span className="ml-2 text-[#3D4E5F]">Sabab: {o.cancel_reason || '—'}</span></div> : stepper(true)}</div>
          <div className={`${card} p-3`}>
            <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-[15px] font-bold"><span className="grid size-8 place-items-center rounded-full bg-[#E3F4F2] text-[#0F766E]"><UserRound className="size-4" /></span>Mijoz ma’lumotlari</h3>{o.customer_id && <Link to={`/sotuvchi/mijozlar/${o.customer_id}`} className="text-[12.5px] text-[#0F766E]">Mijoz profilini ko‘rish ›</Link>}</div>
            <div className="mt-2 flex items-center gap-3"><span className="grid size-12 place-items-center rounded-full bg-[#E3F4F2] font-semibold text-[#0F766E]">{(o.customer_name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</span><div className="text-[12.5px] text-[#5C6E80]"><div className="text-[14.5px] font-semibold text-[#10283F]">{o.customer_name || '—'}</div><div className="flex items-center gap-1.5"><Phone className="size-3.5 text-[#0F766E]" />{phoneOf(o)}</div><div className="flex items-center gap-1.5"><MapPin className="size-3.5 text-[#0F766E]" />{o.city || o.region || '—'}</div></div></div>
          </div>
          <div className={`${card} p-3`}>
            <h3 className="flex items-center gap-2 text-[15px] font-bold"><ShoppingCart className="size-5 text-[#0F766E]" />Mahsulotlar ({o.items.length} ta)</h3>
            {o.items.map((it) => { const p = data.products.find((x) => x.id === it.product_id); return (
              <div key={it.id} className="flex items-center gap-3 border-b border-[#EEF3F4] py-2.5 last:border-0"><ProductThumb src={it.image_url} className="h-[62px] w-[76px]" /><div className="min-w-0 flex-1 text-[12px] text-[#5C6E80]"><div className="truncate text-[13.5px] font-medium text-[#10283F]">{it.name}</div>SKU: {p?.sku || '—'}{it.variant ? ` · ${it.variant}` : ''}<div className="text-[14.5px] font-bold text-[#10283F]">{som(it.price)}</div></div><div className="text-right text-[12px] text-[#5C6E80]">Soni: {it.qty} dona<div className="text-[14px] font-bold text-[#10283F]">{som(it.price * it.qty)}</div></div></div>) })}
          </div>
          <div className={`${card} p-3`}>
            <h3 className="flex items-center gap-2 text-[15px] font-bold"><MapPin className="size-5 text-[#0F766E]" />Yetkazib berish manzili</h3>
            <div className="mt-2 flex gap-2"><div className="flex flex-1 gap-2 rounded-lg border border-[#CCFBF1] bg-[#F0FDFA] p-2.5 text-[12px] text-[#3D4E5F]"><MapPin className="size-4 shrink-0 text-[#0F766E]" /><div>{o.address || '—'}<div className="text-[#5C6E80]">{deliv}</div></div></div>{o.address && <a href={mapUrl(o.address)} target="_blank" rel="noreferrer" className="flex w-[118px] items-center justify-center gap-1 rounded-lg bg-[#F3F7F7] text-[12px] text-[#0F766E]"><MapPin className="size-4" />Xaritada ko‘rish</a>}</div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className={`${card} p-3 text-[12px] text-[#5C6E80]`}><h3 className="mb-1.5 flex items-center gap-1.5 text-[14px] font-bold text-[#10283F]"><Banknote className="size-5 text-[#0F766E]" />To‘lov ma’lumotlari</h3><b className="text-[13px] text-[#10283F]">Naqd pul</b><br />Buyurtma mijozga yetkazilganda naqd pulda to‘lanadi.</div>
            <div className={`${card} p-3 text-[12px] text-[#5C6E80]`}><h3 className="mb-1.5 flex items-center gap-1.5 text-[14px] font-bold text-[#10283F]"><FileText className="size-5 text-[#0F766E]" />Qo‘shimcha ma’lumot</h3><b className="text-[13px] text-[#10283F]">Izoh</b><br />{o.note || 'Izoh qoldirilmagan.'}</div>
          </div>
          <div className={`${card} p-3`}><h3 className="text-[13.5px] font-bold">Ichki izoh (sotuvchi)</h3><Textarea rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Faqat siz ko‘rasiz" className="mt-2" />{note !== (o.internal_note || '') && <Btn size="sm" className="mt-2" disabled={a.busy} onClick={saveNote}>Saqlash</Btn>}</div>
          <div className="rounded-xl border border-[#CCFBF1] bg-[#F0FDFA] p-3 text-[13px]">
            <h3 className="flex items-center gap-2 font-bold text-[#0F766E]"><Calculator className="size-5" />Buyurtma summasi</h3>
            <div className="mt-2 space-y-1"><Row l="Mahsulotlar jami:" v={som(o.subtotal)} />{Number(o.discount_amount) > 0 && <Row l="Chegirma:" v={`−${som(o.discount_amount)}`} />}{Number(o.delivery_fee) > 0 && <Row l="Yetkazish:" v={som(o.delivery_fee)} />}<Row l="Komissiya (12%):" v={som(o.commission)} /></div>
            <div className="mt-2 flex justify-between border-t border-[#CCFBF1] pt-2 font-bold"><span>Mijozdan olinadigan summa:</span><span className="text-[15px]">{som(total)}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 pb-4">
            <Btn icon={RefreshCw} disabled={!next || a.busy} onClick={() => next && go(next[0])}>{next ? 'Holatni yangilash' : O_LABEL[o.status]}</Btn>
            <Btn variant="outline" icon={Printer} onClick={() => printWaybill(o, shop)}>Chek chop etish</Btn>
            <Btn variant="outline" icon={Phone} onClick={call}>Mijoz bilan bog‘lanish</Btn>
            <Btn variant="outline" icon={X} disabled={!open} onClick={() => setCancel(true)}>Bekor qilish</Btn>
          </div>
        </div>
      </div>
      {cancelModal}
    </div>
  )
}
const Row = ({ l, v }) => <div className="flex justify-between gap-2 text-[#3D4E5F]"><span>{l}</span><span className="text-[#10283F]">{v}</span></div>
