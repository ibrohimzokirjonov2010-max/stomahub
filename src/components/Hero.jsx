import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'

function Dots({ count, active, onChange, light }) {
  return (
    <div className="flex items-center gap-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          aria-label={`Slayd ${i + 1}`}
          className={`size-[7px] rounded-full transition ${
            i === active ? (light ? 'bg-white' : 'bg-[#163b6b]') : light ? 'bg-white/40' : 'bg-[#c9d3e0]'
          }`}
        />
      ))}
    </div>
  )
}

export default function Hero() {
  const [main, setMain] = useState(0)
  const [side, setSide] = useState(1)

  useEffect(() => {
    const t = setInterval(() => setMain((i) => (i + 1) % 3), 6000)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_27.4%]">
      {/* Asosiy banner */}
      <div className="relative h-[170px] overflow-hidden rounded-xl bg-[#e3edf8] sm:h-[156px]">
        <img src="/images/hero-main.jpg" alt="" className="absolute inset-y-0 right-0 h-full w-[78%] object-cover object-right sm:w-[66%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#dfeaf7] from-35% via-[#e6eff9]/70 via-50% to-transparent to-70%" />
        <div className="relative flex h-full flex-col justify-center px-5 sm:px-8">
          <h1 className="max-w-[300px] text-[20px] font-bold leading-[1.18] text-[#0c2a4d] sm:max-w-[260px] sm:text-[19.5px]">
            Sifatli stomatologik mahsulotlar endi yanada yaqinroq
          </h1>
          <p className="mt-1 max-w-[260px] text-[12px] leading-[1.45] text-[#2c3b52]">
            Stomatologlar uchun eng yaxshi brendlar, tez yetkazib berish, ishonchli sotuvchilar.
          </p>
          <a href="#" className="mt-3 inline-flex h-[30px] w-fit items-center gap-2 rounded-md bg-brand px-3.5 text-[11.5px] font-semibold text-white transition hover:bg-brand-600">
            Xarid qilish <ArrowRight className="size-3.5" />
          </a>
        </div>
        <div className="absolute bottom-3.5 left-1/2 hidden sm:block">
          <Dots count={3} active={main} onChange={setMain} />
        </div>
      </div>

      {/* Implant banner */}
      <div className="relative hidden h-[156px] overflow-hidden rounded-xl bg-[#1d3d58] sm:block">
        <img src="/images/hero-implant.jpg" alt="" className="absolute inset-y-0 right-0 h-full w-[50%] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1c3a55] from-40% via-[#1c3a55]/60 via-55% to-transparent" />
        <div className="relative flex h-full flex-col justify-center px-5">
          <h2 className="text-[19px] font-bold leading-[1.2] text-white">Implant<br />yechimlari</h2>
          <p className="mt-2 text-[11.5px] leading-[1.5] text-white/85">
            Dunyoga mashhur brendlar<br />endi StomaHub’da
          </p>
          <a href="#" className="mt-3 inline-flex h-[28px] w-fit items-center gap-2 rounded-md bg-white px-3 text-[11.5px] font-semibold text-ink transition hover:bg-brand-50">
            Katalogni ko‘rish <ArrowRight className="size-3.5" />
          </a>
        </div>
        <div className="absolute bottom-3.5 right-6">
          <Dots count={3} active={side} onChange={setSide} light />
        </div>
      </div>
    </section>
  )
}
