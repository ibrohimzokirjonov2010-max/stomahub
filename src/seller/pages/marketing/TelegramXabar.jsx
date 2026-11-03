import { useState } from 'react'
import { Send, Info, Users } from 'lucide-react'
import { useSellerData } from '../../api'
import { card, PageHead, Btn, Textarea } from '../../components/ui'

const MAX = 1000

export default function TelegramXabar() {
  const data = useSellerData()
  const [text, setText] = useState('')
  const reach = data.customers.filter((c) => (c.phone || '').trim()).length
  return (
    <div className="mx-auto max-w-[760px]">
      <PageHead title="Telegram xabar" subtitle="O‘z mijozlaringizga Telegram orqali xabar yuboring" back="/sotuvchi/marketing" />
      <div data-testid="tg-soon" className="mb-4 flex items-start gap-3 rounded-2xl border border-[#CCFBF1] bg-[#F0FDFA] p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-[#0F766E]" />
        <div className="text-[13.5px] leading-snug text-[#3D4E5F]"><b className="block text-[14.5px] text-[#10283F]">Tez orada</b>Mijozlarga Telegram orqali ommaviy xabar yuborish hozircha ishga tushmagan. Xabar faqat StomaHub botiga ulangan va roziligini bergan mijozlaringizga yuboriladi.</div>
      </div>
      <div className={`${card} space-y-4 p-4 md:p-5`}>
        <div className="flex items-center gap-3 rounded-xl bg-[#F6FAFA] px-3.5 py-3">
          <Users className="size-5 text-[#0F766E]" />
          <span className="text-[13.5px] text-[#3D4E5F]">Telefon raqami bor mijozlaringiz: <b className="text-[#10283F]">{data.loading ? '…' : `${reach} ta`}</b></span>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-[#10283F]">Xabar matni</span>
          <Textarea value={text} maxLength={MAX} onChange={(e) => setText(e.target.value)} placeholder="Masalan: Hurmatli mijoz! Bu hafta barcha kompozitlarga 15% chegirma." className="min-h-[150px]" />
          <span className="mt-1 block text-right text-[12px] text-[#8A98A8]">{text.length} / {MAX}</span>
        </label>
        <Btn icon={Send} disabled className="w-full md:w-auto" title="Tez orada">Yuborish — tez orada</Btn>
      </div>
    </div>
  )
}
