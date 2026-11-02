import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, ExternalLink, Package, Truck } from 'lucide-react'
import { som } from '../marketData'
import { allOrders, profileStore, useProfile } from '../profileStore'
import { timeline } from '../components/mobile/MobileBuyurtmalar'

const STATUS = { new: 'Qabul qilindi', shipping: 'Yo‘lda', delivered: 'Yetkazildi', cancelled: 'Bekor qilindi' }

// Desktop buyurtma kuzatuvi (/buyurtma/kuzatish/:id). Avval /klinika ga yo‘naltirilardi.
export default function OrderTracking() {
  const { id } = useParams()
  const profile = useProfile()
  const order = allOrders(profile).find((o) => o.id === id)

  useEffect(() => {
    document.title = `Buyurtma #${id} — StomaHub`
    profileStore.refreshOrders?.()
    const t = setInterval(() => profileStore.refreshOrders?.(), 8000)
    return () => clearInterval(t)
  }, [id])

  if (!order) {
    return (
      <main className="mx-auto max-w-[760px] px-4 py-16 text-center">
        <Package className="mx-auto size-10 text-muted" />
        <h1 className="mt-3 text-[20px] font-bold text-ink">{profile.ordersStatus === 'loading' ? 'Yuklanmoqda…' : 'Buyurtma topilmadi'}</h1>
        <p className="mt-1 text-[13px] text-muted">#{id} raqamli buyurtma mavjud emas yoki sizning hisobingizga tegishli emas.</p>
        <Link to="/klinika" className="mt-5 inline-flex h-10 items-center rounded-xl bg-sea px-4 text-[13px] font-semibold text-white">Buyurtmalarim</Link>
      </main>
    )
  }

  const steps = order.status === 'cancelled' ? [] : timeline(order)
  return (
    <main className="mx-auto max-w-[960px] px-4 py-8">
      <nav className="text-[12px] text-muted"><Link to="/klinika" className="hover:text-sea">Buyurtmalarim</Link> / #{order.id}</nav>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-extrabold text-ink">Buyurtma #{order.id}</h1>
        <span className="rounded-full bg-[#e6f6f3] px-3 py-1 text-[12px] font-semibold text-[#0b6d73]">{STATUS[order.status] || 'Qabul qilindi'}</span>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-xl bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-[15px] font-bold"><Truck className="size-5 text-sea" /> Buyurtma holati</h2>
          {order.status === 'cancelled' ? (
            <p className="mt-3 text-[13px] text-ink-2">Buyurtma bekor qilindi.</p>
          ) : (
            <ol className="mt-4 space-y-4">
              {steps.map((s) => (
                <li key={s.label} className="flex gap-3">
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full ${s.state === 'done' ? 'bg-sea text-white' : s.state === 'current' ? 'border-2 border-sea bg-white' : 'border-2 border-line bg-white'}`}>{s.state === 'done' && <Check className="size-3.5" />}</span>
                  <div>
                    <p className={`text-[13.5px] font-semibold ${s.state === 'todo' ? 'text-muted' : 'text-ink'}`}>{s.label}</p>
                    {s.time && <p className="text-[11.5px] text-muted">{s.time}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
          {order.trackingUrl && (
            <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-sea">Yetkazib berish xizmatida kuzatish <ExternalLink className="size-4" /></a>
          )}
          <p className="mt-4 text-[12px] text-muted">Yetkazib berish: sotuvchi bilan kelishiladi</p>
        </section>
        <aside className="rounded-xl bg-white p-5 shadow-card">
          <h2 className="text-[15px] font-bold">Mahsulotlar</h2>
          <ul className="mt-3 space-y-2.5">
            {(order.items || []).map((it) => (
              <li key={`${it.id}-${it.variant || ''}`} className="flex items-center gap-2.5">
                <img src={it.image} alt="" className="size-11 shrink-0 rounded-lg bg-[#f2f6f7] object-contain" />
                <Link to={`/product/${it.id}`} className="min-w-0 flex-1 truncate text-[12.5px] hover:text-sea">{it.name}</Link>
                <span className="whitespace-nowrap text-[12px] text-muted">{it.qty || 1} ta</span>
              </li>
            ))}
          </ul>
          {order.total != null && <p className="mt-4 flex justify-between border-t border-line pt-3 text-[14px] font-bold"><span>Jami</span><span>{som(order.total)}</span></p>}
        </aside>
      </div>
    </main>
  )
}
