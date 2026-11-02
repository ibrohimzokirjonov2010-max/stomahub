import { Link } from 'react-router-dom'

/** Mavjud bo‘lmagan manzil uchun sahifa (bo‘sh oq ekran o‘rniga). */
export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#f6faf9] px-6 pb-[env(safe-area-inset-bottom)] text-center">
      <div>
        <p className="text-[56px] font-extrabold leading-none text-sea">404</p>
        <h1 className="mt-3 text-[20px] font-bold text-ink">Sahifa topilmadi</h1>
        <p className="mt-1 text-[13px] text-muted">Siz qidirgan sahifa mavjud emas yoki ko‘chirilgan.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link to="/" className="inline-flex h-10 items-center rounded-xl bg-sea px-4 text-[13px] font-semibold text-white">Bosh sahifaga</Link>
          <Link to="/marketplace" className="inline-flex h-10 items-center rounded-xl border border-[#d8ece9] bg-white px-4 text-[13px] font-semibold text-sea">Marketplace</Link>
        </div>
      </div>
    </main>
  )
}
