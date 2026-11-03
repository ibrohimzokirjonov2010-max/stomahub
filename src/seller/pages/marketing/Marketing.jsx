import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useSellerData } from '../../api'
import { MARKETING_NAV } from '../../nav'
import { card, PageHead } from '../../components/ui'
import { statusOf } from '../../components/chegirmalar/constants'

const DESC = {
  Chegirmalar: 'Mahsulotlarga foiz yoki summa chegirma, 2+1 aksiyalar',
  Promokodlar: 'Mijozlar checkoutda kiritadigan maxsus kodlar',
  Aksiyalar: 'Mahsulotingizni saytning “Aksiyalar” bo‘limiga chiqaring',
  Reklama: 'Kampaniyalar, reklama balansi va natijalar',
  'Telegram xabar': 'O‘z mijozlaringizga Telegram orqali xabar yuborish',
}

export default function Marketing() {
  const data = useSellerData()
  const activeDisc = data.discounts.filter((d) => statusOf(d, data.orders) === 'faol')
  const stat = {
    Chegirmalar: `${activeDisc.filter((d) => !d.promo_code).length} ta faol`,
    Promokodlar: `${activeDisc.filter((d) => d.promo_code).length} ta faol`,
    Reklama: `${data.campaigns.filter((c) => c.status === 'faol' || c.active).length} ta kampaniya`,
    'Telegram xabar': 'Tez orada',
  }
  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHead title="Marketing" subtitle="Sotuvni oshirish uchun barcha vositalar bir joyda" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MARKETING_NAV.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={`${card} group flex items-start gap-3.5 p-4 transition hover:border-[#99D5CE]`}>
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#F0FDFA] text-[#0F766E]"><Icon className="size-[22px]" /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-[15.5px] font-bold text-[#10283F]">{label}</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-[#5C6E80]">{DESC[label]}</span>
              {stat[label] && <span className="mt-2 inline-block rounded-lg bg-[#F6FAFA] px-2 py-0.5 text-[12px] font-medium text-[#3D4E5F]">{stat[label]}</span>}
            </span>
            <ChevronRight className="mt-3 size-5 shrink-0 text-[#8A98A8] group-hover:text-[#0F766E]" />
          </Link>
        ))}
      </div>
    </div>
  )
}
