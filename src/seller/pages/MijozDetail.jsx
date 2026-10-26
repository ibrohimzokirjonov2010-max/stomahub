import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, ShoppingCart, MessageSquare, Percent, Ban, UserRound, Phone, MapPin, FileDigit, FileText, Plus, ShoppingBag, Coins, CalendarDays, Store, Eye, Heart, Send, Trash2, ChevronRight, BadgeCheck, Wallet, Ellipsis, X } from 'lucide-react'
import { useSellerData, updateRow, deleteRow, useAsync, netOf } from '../api'
import { num, som, dmy, hm } from '../format'
import { card, Btn, Crumbs, Th, Td, toast, Textarea, Input, Menu, Err, Pager, usePaged, Chips, Select } from '../components/ui'
import Empty from '../components/shell/Empty'
import Modal from '../components/shell/Modal'
import Confirm from '../components/shell/Confirm'
import ProductThumb from '../components/bosh-sahifa/ProductThumb'
import CustomerForm from '../components/mijozlar/CustomerForm'
import OrderForm from '../components/buyurtmalar/OrderForm'
import { OrderBadge } from './Buyurtmalar'
import { TagBadge, masked } from './Mijozlar'
import { KIND, TAGS, statsOf, tagsOf, initials } from '../components/mijozlar/constants'

export default function MijozDetail() {
  const { id } = useParams()
  const data = useSellerData()
  const navigate = useNavigate()
  const c = data.customers.find((x) => x.id === id)
  const [edit, setEdit] = useState(false)
  const [order, setOrder] = useState(false)
  const [disc, setDisc] = useState(null)
  const [del, setDel] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)
  const [note, setNote] = useState('')
  const [mtab, setMtab] = useState('orders')
  const a = useAsync()
  const st = useMemo(() => (c ? statsOf(c, data.orders) : null), [c, data.orders])
  const pg = usePaged(st?.list || [], 8)
  const fav = useMemo(() => {
    if (!st) return []
    const m = {}
    st.list.filter((o) => o.status !== 'bekor_qilindi').forEach((o) => o.items.forEach((it) => { const k = it.product_id || it.name; m[k] = m[k] || { ...it, n: 0 }; m[k].n += it.qty }))
    return Object.values(m).sort((x, y) => y.n - x.n).slice(0, 5)
  }, [st])
  const reviews = data.reviews.filter((r) => st?.list.some((o) => o.id === r.order_id))

  if (data.loading) return <div className={`${card} h-64 animate-pulse`} />
  if (!c) return <div className={card}><Empty icon={UserRound} title="Mijoz topilmadi" text="U o‘chirilgan yoki sizga tegishli emas." action={<Btn className="mt-4" onClick={() => navigate('/sotuvchi/mijozlar')}>Mijozlar ro‘yxatiga qaytish</Btn>} /></div>
  const tags = tagsOf(c, st)
  const KI = KIND[c.kind]?.[3] || Store
  const notes = c.notes || []
  const patch = (p, msg) => a.go(() => updateRow('seller_customers', c.id, p), () => msg && toast(msg))
  const addNote = () => { const t = note.trim(); if (!t) return; patch({ notes: [{ text: t.slice(0, 500), at: new Date().toISOString(), author: 'Siz' }, ...notes] }, 'Izoh qo‘shildi'); setNote('') }
  const write = () => (c.phone ? (location.href = `sms:${c.phone.replace(/\s/g, '')}`) : toast('Mijozning telefon raqami kiritilmagan'))
  const call = () => (c.phone ? (location.href = `tel:${c.phone.replace(/\s/g, '')}`) : toast('Mijozning telefon raqami kiritilmagan'))
  const block = () => patch({ blocked: !c.blocked }, c.blocked ? 'Blokdan chiqarildi' : 'Mijoz bloklandi')
  const Stat = ({ icon: I, l, v }) => <div className={`${card} flex items-center gap-3 p-3`}><span className="grid size-11 place-items-center rounded-lg bg-[#E3F4F2] text-[#0F766E]"><I className="size-5" /></span><div className="min-w-0"><div className="text-[12px] text-[#5C6E80]">{l}</div><div className="truncate text-[16px] font-extrabold xl:text-[18px]">{v}</div></div></div>
  const Info = ({ icon: I, l, children }) => <div className="flex gap-2.5"><I className="mt-0.5 size-4 shrink-0 text-[#0F766E]" /><div className="min-w-0 text-[12px] text-[#5C6E80]">{l}<div className="text-[13px] text-[#10283F]">{children}</div></div></div>
  const modals = <>
    <CustomerForm open={edit} edit={c} onClose={() => setEdit(false)} />
    <OrderForm open={order} presetCustomer={c.id} onClose={() => setOrder(false)} onCreated={(o) => o?.id && navigate(`/sotuvchi/buyurtmalar/${o.id}`)} />
    <Modal open={disc !== null} onClose={() => setDisc(null)} title="Shaxsiy chegirma" subtitle="Ushbu mijozning qo‘lda yaratilgan buyurtmalariga avtomatik qo‘llanadi." width="max-w-[420px]">
      <label className="block text-[13px]">Chegirma foizi (1–90)<Input type="number" min={1} max={90} value={disc ?? ''} onChange={(e) => setDisc(e.target.value)} placeholder="Masalan: 5" /></label>
      <Err>{a.error}</Err>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {c.personal_discount ? <Btn variant="outline" onClick={() => { patch({ personal_discount: null }, 'Chegirma olib tashlandi'); setDisc(null) }}>Olib tashlash</Btn> : <Btn variant="outline" onClick={() => setDisc(null)}>Bekor qilish</Btn>}
        <Btn onClick={() => { const n = Math.round(Number(disc)); if (!(n >= 1 && n <= 90)) return a.setError('1 dan 90 gacha foiz kiriting'); a.go(() => updateRow('seller_customers', c.id, { personal_discount: n }), () => { toast(`${n}% shaxsiy chegirma berildi`); setDisc(null) }) }}>Saqlash</Btn>
      </div>
    </Modal>
    <Modal open={tagOpen} onClose={() => setTagOpen(false)} title="Teg qo‘shish" width="max-w-[380px]">
      <div className="flex flex-wrap gap-2">{TAGS.map((t) => { const on = (c.tags || []).includes(t); return <button key={t} type="button" onClick={() => patch({ tags: on ? c.tags.filter((x) => x !== t) : [...(c.tags || []), t] })} className={`rounded-lg border px-3 py-1.5 text-[13px] ${on ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]' : 'border-[#DCE5E7]'}`}>{t}</button> })}</div>
      <Btn className="mt-5 w-full" onClick={() => setTagOpen(false)}>Tayyor</Btn>
    </Modal>
    <Confirm open={del} title="Mijozni o‘chirish" text={`${c.name} o‘chiriladi. Buyurtmalari saqlanib qoladi.`} okText="O‘chirish" onClose={() => setDel(false)} onOk={async () => { const r = await deleteRow('seller_customers', c.id); setDel(false); if (r.ok) { toast('Mijoz o‘chirildi'); navigate('/sotuvchi/mijozlar') } else toast(r.error) }} />
  </>

  return (
    <div>
      <div className="hidden md:block">
        <Crumbs items={[['Mijozlar', '/sotuvchi/mijozlar'], ['Mijoz tafsiloti']]} />
        <div className="flex items-start justify-between"><div><h1 className="text-[30px] font-extrabold">Mijoz tafsiloti</h1><p className="text-[14px] text-[#3D4E5F]">Mijoz haqida to‘liq ma’lumot va buyurtmalar tarixi.</p></div><Btn variant="outline" icon={ArrowLeft} className="border-[#DCE5E7] text-[#10283F]" onClick={() => navigate('/sotuvchi/mijozlar')}>Mijozlar ro‘yxatiga qaytish</Btn></div>
        <Err>{a.error}</Err>
        <div className="mt-4 grid grid-cols-[1fr_200px] gap-3 xl:grid-cols-[1fr_240px]">
          <div className={`${card} grid grid-cols-1 gap-4 p-4 xl:grid-cols-[1fr_1.5fr]`}>
            <div className="xl:border-r xl:border-[#EEF3F4]">
              <div className="flex items-center gap-4"><span className="grid size-[74px] place-items-center rounded-full bg-[#E3F4F2] text-[#0F766E]"><KI className="size-9" /></span><div><h2 className="text-[20px] font-extrabold">{c.name}</h2><div className="text-[13px] text-[#5C6E80]">{KIND[c.kind]?.[2]}</div><span className="mt-1.5 inline-block rounded-md bg-[#CCFBF1] px-4 py-1 text-[12px] text-[#0F766E]">{KIND[c.kind]?.[1]}</span>{c.blocked && <span className="ml-2 rounded-md bg-[#EEF2F3] px-2 py-1 text-[12px]">Bloklangan</span>}</div></div>
              <div className="mt-4 flex flex-wrap gap-2">{tags.map((t) => <TagBadge key={t} t={t} />)}{c.city && <span className="rounded-md bg-[#EEF2F3] px-3 py-1 text-[12px]">{c.city}</span>}{c.personal_discount && <span className="rounded-md bg-[#E3F4F2] px-3 py-1 text-[12px] text-[#0F766E]">−{c.personal_discount}%</span>}<button type="button" onClick={() => setTagOpen(true)} className="flex items-center gap-1 rounded-md border border-[#DCE5E7] px-3 py-1 text-[12px]"><Plus className="size-3.5" />Teg qo‘shish</button></div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Info icon={UserRound} l="Mas’ul shaxs">{c.contact_person || '—'}</Info>
              <Info icon={Phone} l="Telefon">{c.phone || '—'}</Info>
              <Info icon={MapPin} l="Shahar">{c.city || '—'}{c.region && c.region !== 'Toshkent shahri' ? `, ${c.region}` : ''}</Info>
              <Info icon={MapPin} l="Manzil">{c.address || '—'}</Info>
              <Info icon={FileDigit} l="STIR">{c.stir || '—'}</Info>
              <Info icon={FileText} l="Izoh">{c.note || '—'}</Info>
            </div>
          </div>
          <div className={`${card} flex flex-col gap-2 p-2.5`}>
            <Btn icon={Pencil} onClick={() => setEdit(true)}>Tahrirlash</Btn>
            <Btn variant="outline" icon={ShoppingCart} disabled={c.blocked} onClick={() => setOrder(true)}>Buyurtma yaratish</Btn>
            <Btn variant="outline" icon={MessageSquare} onClick={write}>Xabar yozish</Btn>
            <Btn variant="outline" icon={Percent} onClick={() => setDisc(c.personal_discount || '')}>{c.personal_discount ? `Chegirma: ${c.personal_discount}%` : 'Shaxsiy chegirma berish'}</Btn>
            <Btn variant="outline" icon={Ban} className="border-[#AEB8C2] text-[#10283F]" onClick={block}>{c.blocked ? 'Blokdan chiqarish' : 'Bloklash'}</Btn>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_240px]">
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3"><Stat icon={ShoppingBag} l="Jami buyurtmalar" v={`${st.count} ta`} /><Stat icon={Coins} l="Jami xarid" v={som(st.sum)} /><Stat icon={CalendarDays} l="Oxirgi buyurtma" v={st.last ? dmy(st.last) : '—'} /><Stat icon={KI} l="Mijoz turi" v={KIND[c.kind]?.[1]} /></div>
            <div className={`${card} p-4`}>
              <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-[16px] font-bold text-[#0F766E]"><FileText className="size-5" />Buyurtmalar tarixi</h3><Btn variant="outline" size="sm" icon={Plus} className="bg-[#F0FDFA]" disabled={c.blocked} onClick={() => setOrder(true)}>Buyurtma qo‘shish</Btn></div>
              <table className="mt-3 w-full">
                <thead className="bg-[#F6FAFA]"><tr><Th>#</Th><Th>Buyurtma raqami</Th><Th>Sana ↓</Th><Th className="text-center">Mahsulotlar soni</Th><Th className="text-center">Summa (so‘m)</Th><Th>To‘lov</Th><Th className="text-center">Holat</Th><Th className="text-center">Amallar</Th></tr></thead>
                <tbody>{pg.rows.map((o, i) => <tr key={o.id} onClick={() => navigate(`/sotuvchi/buyurtmalar/${o.id}`)} className="cursor-pointer border-t border-[#EEF3F4] hover:bg-[#F7FCFB]"><Td>{pg.offset + i + 1}</Td><Td>{o.code}</Td><Td className="text-[#3D4E5F]">{dmy(o.created_at)} {hm(o.created_at)}</Td><Td className="text-center">{o.items.reduce((s, x) => s + x.qty, 0)}</Td><Td className="text-center">{num(netOf(o) + Number(o.delivery_fee || 0))}</Td><Td>Naqd</Td><Td className="text-center"><OrderBadge status={o.status} /></Td><Td className="text-center"><Eye className="inline size-4" /></Td></tr>)}</tbody>
              </table>
              {!pg.rows.length && <Empty icon={ShoppingBag} title="Buyurtmalar yo‘q" text="Bu mijoz hali buyurtma bermagan." />}
              <Pager {...pg} />
            </div>
          </div>
          <div className="space-y-3">
            <div className={`${card} p-3`}>
              <h3 className="flex items-center gap-2 text-[15px] font-bold"><Heart className="size-5 text-[#0F766E]" />Sevimli mahsulotlar</h3>
              {fav.length ? <><div className="mt-1 text-right text-[11px] text-[#5C6E80]">Xaridlar soni</div>{fav.map((f) => <div key={f.product_id || f.name} className="flex items-center gap-2.5 border-b border-[#EEF3F4] py-1.5 last:border-0"><ProductThumb src={f.image_url} className="h-8 w-10" /><div className="min-w-0 flex-1 text-[12.5px]"><div className="truncate">{f.name}</div><div className="text-[11px] text-[#5C6E80]">{f.variant || ''}</div></div><span className="text-[12.5px]">{f.n} ta</span></div>)}</> : <p className="py-4 text-center text-[12.5px] text-[#5C6E80]">Xaridlar bo‘lgach shu yerda ko‘rinadi.</p>}
            </div>
            <NotesCard notes={notes} note={note} setNote={setNote} addNote={addNote} remove={(i) => patch({ notes: notes.filter((_, j) => j !== i) }, 'Izoh o‘chirildi')} />
          </div>
        </div>
      </div>

      <div className="md:hidden">
        <div className="-mx-4 -mt-4 flex items-center justify-between bg-white px-4 py-3"><button type="button" aria-label="Ortga" onClick={() => navigate('/sotuvchi/mijozlar')} className="text-[#0F766E]"><ArrowLeft className="size-6" /></button><h1 className="text-[18px] font-bold">Mijoz tafsiloti</h1><Menu icon={Ellipsis} items={[['Teg qo‘shish', () => setTagOpen(true), Plus], ['Shaxsiy chegirma', () => setDisc(c.personal_discount || ''), Percent], ['Xabar yozish', write, MessageSquare], [c.blocked ? 'Blokdan chiqarish' : 'Bloklash', block, Ban]]} /></div>
        <div className="-mx-4 bg-white px-4 pb-4">
          <div className="flex gap-4"><span className="grid size-[74px] shrink-0 place-items-center rounded-full bg-[#E3F4F2] text-[24px] font-semibold text-[#0F766E]">{initials(c.contact_person || c.name)}</span><div className="min-w-0 text-[12.5px] text-[#5C6E80]"><div className="text-[17px] font-bold text-[#10283F]">{c.contact_person || c.name}</div>{c.contact_person && <div className="text-[14px]">{c.name}</div>}<div className="mt-1 flex items-center gap-1.5"><Phone className="size-4 text-[#0F766E]" />{c.phone || '—'}</div><div className="flex items-start gap-1.5"><MapPin className="mt-0.5 size-4 shrink-0 text-[#0F766E]" />{[c.city && `${c.city} shahri`, c.address].filter(Boolean).join(', ') || '—'}</div></div></div>
          <button type="button" onClick={() => setEdit(true)} className="mt-4 flex items-center gap-2 rounded-full bg-[#0F766E] px-5 py-2.5 text-[13px] text-white"><Pencil className="size-4" />Mijoz profilini tahrirlash</button>
        </div>
        <div className="mt-3 grid grid-cols-4 divide-x divide-[#CCFBF1] rounded-xl bg-[#F0FDFA] py-3 text-[11px] text-[#5C6E80]">
          {[[ShoppingCart, st.count, 'Jami buyurtma'], [CalendarDays, st.last ? dmy(st.last) : '—', 'Oxirgi buyurtma'], [Wallet, num(Math.round(st.sum/1000))+"k", 'Jami xarid summasi'], [BadgeCheck, c.blocked ? 'Blok' : 'Faol', 'Holat']].map(([I, v, l]) => <div key={l} className="px-1.5"><I className="size-5 text-[#0F766E]" /><div className="mt-1 whitespace-nowrap text-[12px] font-bold tracking-tight text-[#10283F]">{v}</div><div className="mt-0.5 leading-tight">{l}</div></div>)}
        </div>
        <div className="mt-4"><Chips tabs={[['orders', 'Buyurtmalar', st.list.length], ['reviews', 'Sharhlar', reviews.length], ['notes', 'Izohlar', notes.length], ['info', 'Ma’lumotlar']]} value={mtab} onChange={setMtab} /></div>
        <div className="mt-3 space-y-2.5">
          {mtab === 'orders' && (st.list.length ? st.list.map((o) => <button key={o.id} type="button" onClick={() => navigate(`/sotuvchi/buyurtmalar/${o.id}`)} className={`${card} flex w-full items-center gap-3 p-2.5 text-left`}><ProductThumb src={o.items[0]?.image_url} className="h-[70px] w-[84px] shrink-0" /><div className="min-w-0 flex-1 text-[12px] text-[#5C6E80]"><div className="flex items-center justify-between gap-2"><span className="text-[14px] font-bold text-[#10283F]">#{o.code}</span><OrderBadge status={o.status} icon className="rounded-full !min-w-0" /></div>{dmy(o.created_at)} {hm(o.created_at)}<div className="flex items-center justify-between"><span className="flex items-center gap-1"><ShoppingCart className="size-3.5" />{o.items.length} ta mahsulot</span><b className="text-[14px] text-[#10283F]">{som(netOf(o) + Number(o.delivery_fee || 0))}</b></div></div><ChevronRight className="size-4 shrink-0" /></button>) : <div className={card}><Empty icon={ShoppingBag} title="Buyurtmalar yo‘q" text="Bu mijoz hali buyurtma bermagan." /></div>)}
          {mtab === 'reviews' && (reviews.length ? reviews.map((r) => <div key={r.id} className={`${card} p-3 text-[13px]`}><div className="flex justify-between"><b>{'★'.repeat(r.rating)}<span className="text-[#CFDADD]">{'★'.repeat(5 - r.rating)}</span></b><span className="text-[12px] text-[#5C6E80]">{dmy(r.created_at)}</span></div><p className="mt-1 text-[#3D4E5F]">{r.body}</p></div>) : <div className={card}><Empty icon={MessageSquare} title="Sharhlar yo‘q" text="Mijoz buyurtmalariga sharh qoldirmagan." /></div>)}
          {mtab === 'notes' && <NotesCard notes={notes} note={note} setNote={setNote} addNote={addNote} remove={(i) => patch({ notes: notes.filter((_, j) => j !== i) }, 'Izoh o‘chirildi')} />}
          {mtab === 'info' && <div className={`${card} space-y-3 p-3`}><Info icon={Store} l="Mijoz turi">{KIND[c.kind]?.[1]}</Info><Info icon={UserRound} l="Mas’ul shaxs">{c.contact_person || '—'}</Info><Info icon={FileDigit} l="STIR">{c.stir || '—'}</Info><Info icon={FileText} l="Izoh">{c.note || '—'}</Info><div className="flex flex-wrap gap-1.5">{tags.map((t) => <TagBadge key={t} t={t} />)}</div></div>}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 pb-4">
          <Btn icon={Pencil} onClick={() => setEdit(true)}>Tahrirlash</Btn>
          <Btn variant="outline" icon={ShoppingCart} disabled={c.blocked} onClick={() => setOrder(true)}>Buyurtma yaratish</Btn>
          <Btn variant="outline" icon={Phone} onClick={call}>Qo‘ng‘iroq qilish</Btn>
          <Btn variant="outline" icon={Trash2} onClick={() => setDel(true)}>O‘chirish</Btn>
        </div>
      </div>
      {modals}
    </div>
  )
}

function NotesCard({ notes, note, setNote, addNote, remove }) {
  return (
    <div className={`${card} p-3`}>
      <h3 className="flex items-center gap-2 text-[15px] font-bold"><FileText className="size-5 text-[#0F766E]" />Ichki izohlar</h3>
      <div className="mt-2 max-h-[260px] space-y-2 overflow-y-auto">
        {notes.map((n, i) => <div key={n.at + i} className="rounded-lg border border-[#EEF3F4] p-2.5 text-[12px]"><div className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-[#E3F4F2] text-[11px] text-[#0F766E]">{(n.author || 'S')[0]}</span><div className="flex-1"><b>{n.author || 'Siz'}</b><div className="text-[11px] text-[#5C6E80]">{dmy(n.at)} {hm(n.at)}</div></div><button type="button" aria-label="O‘chirish" onClick={() => remove(i)}><X className="size-4 text-[#5C6E80]" /></button></div><p className="mt-1.5 text-[#3D4E5F]">{n.text}</p></div>)}
        {!notes.length && <p className="py-3 text-center text-[12.5px] text-[#5C6E80]">Hali izoh yo‘q. Faqat siz ko‘rasiz.</p>}
      </div>
      <div className="mt-2 flex gap-2"><Textarea rows={1} className="!min-h-[42px] flex-1" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Izoh qo‘shing..." /><button type="button" aria-label="Yuborish" onClick={addNote} className="grid size-[42px] shrink-0 place-items-center rounded-lg bg-[#0F766E] text-white"><Send className="size-4" /></button></div>
    </div>
  )
}
