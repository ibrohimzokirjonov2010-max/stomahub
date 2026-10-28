import { Link } from 'react-router-dom'
import { Check, Send, X } from 'lucide-react'
import { saveSettings, useHub } from '../hubStore'

const SITE = 'https://stomahub-three.vercel.app'

/** Birinchi kirishdagi yo'riqnoma. Progress faqat haqiqiy ma'lumotdan: profil, seminar, ulashish. */
export function onboardingSteps(hub) {
  const ob = hub.settings?.onboarding || {}
  const profile = !!(hub.settings?.orgName || '').trim()
  const live = hub.seminars.find((s) => !['qoralama', 'bekor', 'yakunlangan'].includes(s.status))
  return {
    ob,
    live,
    steps: [
      { id: 'profile', title: 'Profilni to‘ldiring', done: profile, to: '/tashkilotchi/sozlamalar' },
      { id: 'seminar', title: 'Birinchi seminarni yarating', done: hub.seminars.length > 0, to: '/tashkilotchi/seminarlar/yangi' },
      { id: 'share', title: 'Havolani Telegram’da ulashing', done: !!ob.shared },
    ],
  }
}

export function shareUrl(sem) {
  const url = `${SITE}/seminarlar/${encodeURIComponent(sem?.id || '')}`
  const text = sem?.title ? `${sem.title} — StomaHub’da ro‘yxatdan o‘ting` : 'StomaHub seminari'
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
}

export default function OnboardingChecklist({ compact = false }) {
  const hub = useHub()
  if (!hub.ready) return null
  const { ob, live, steps } = onboardingSteps(hub)
  const done = steps.filter((s) => s.done).length
  if (ob.dismissed || done === steps.length) return null
  const patchOb = (next) => saveSettings({ onboarding: { ...ob, ...next } })
  const pct = Math.round((done / steps.length) * 100)
  return (
    <section data-testid="org-onboarding" className={`relative mb-3 rounded-[18px] border border-[#cfeae4] bg-gradient-to-br from-[#effaf7] to-white ${compact ? 'p-3.5' : 'p-4'}`}>
      <button type="button" aria-label="Yopish" onClick={() => patchOb({ dismissed: true })} className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-lg text-[#6e868c] hover:bg-white"><X className="size-4" /></button>
      <p className="pr-8 text-[15px] font-bold text-[#143044]">Boshlash uchun 3 qadam</p>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#dcefeb]"><div className="h-full rounded-full bg-[var(--color-org-teal)] transition-all" style={{ width: `${pct}%` }} /></div>
        <span className="text-[12px] font-semibold text-[var(--color-org-teal)]">{done}/{steps.length}</span>
      </div>
      <ol className={`mt-3 grid gap-2 ${compact ? '' : 'md:grid-cols-3'}`}>
        {steps.map((s, i) => {
          const body = (
            <>
              <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[12.5px] font-bold ${s.done ? 'bg-[var(--color-org-teal)] text-white' : 'border-2 border-[#bfe0d9] text-[#0e756f]'}`}>{s.done ? <Check className="size-4" strokeWidth={3} /> : i + 1}</span>
              <span className={`min-w-0 flex-1 text-[13px] font-semibold ${s.done ? 'text-[#7e9398] line-through' : 'text-[#143044]'}`}>{s.title}</span>
              {s.id === 'share' && !s.done && <Send className="size-4 shrink-0 text-[#229ED9]" />}
            </>
          )
          const cls = 'flex items-center gap-2.5 rounded-xl border border-[#e3f1ee] bg-white px-3 py-2.5 text-left hover:border-[#bfe0d9]'
          if (s.id === 'share') {
            const disabled = !live
            return (
              <li key={s.id}>
                <a
                  href={disabled ? undefined : shareUrl(live)}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={disabled}
                  title={disabled ? 'Avval seminar yarating' : 'Telegram’da ulashish'}
                  onClick={(e) => { if (disabled) { e.preventDefault(); return } patchOb({ shared: true }) }}
                  className={`${cls} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                >{body}</a>
              </li>
            )
          }
          return <li key={s.id}>{s.done ? <div className={cls}>{body}</div> : <Link to={s.to} className={cls}>{body}</Link>}</li>
        })}
      </ol>
    </section>
  )
}
