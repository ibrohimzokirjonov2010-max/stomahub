import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Share2 } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { demoEntityToInfo, demoItemsToCards, demoProductsLabel, demoProfileTitle } from '../seller-public/lib'
import SellerProfileView from '../seller-public/SellerProfileView'
import { useMobile } from '../useMobile'
import MobileTabBar from '../components/mobile/MobileTabBar'
import { MobileToast } from '../components/mobile/parts'

// Yashirin "namuna" sahifa: faqat aniq token bilan ochiladi, ro‘yxatlarga chiqmaydi,
// buyurtma / ro‘yxatdan o‘tish o‘chirilgan (server tomonda ham — demo ma’lumotlar alohida jadvalda).
// Dizayn: /dokon/:id dagi SellerProfileView v2 (demo rejimida).

function useNoIndex() {
  useEffect(() => {
    const m = document.createElement('meta')
    m.name = 'robots'; m.content = 'noindex, nofollow'
    document.head.appendChild(m)
    return () => m.remove()
  }, [])
}

const iconBtn = 'grid size-11 shrink-0 place-items-center rounded-2xl border border-[#e3eef0] bg-white text-ink shadow-[0_2px_10px_rgb(11_60_70/0.07)] active:scale-95'

export default function Namuna() {
  const { token } = useParams()
  const [sp] = useSearchParams()
  const src = sp.get('src') || ''
  const navigate = useNavigate()
  const mobile = useMobile()
  const [toast, setToast] = useState('')
  const [state, setState] = useState({ loading: true, data: null })
  useNoIndex()

  useEffect(() => {
    if (src) { try { localStorage.setItem('stomahub_src', JSON.stringify({ src, at: Date.now(), via: 'namuna' })) } catch { /* ignore */ } }
    let alive = true
    ;(async () => {
      if (!supabase) return alive && setState({ loading: false, data: null })
      const { data, error } = await supabase.rpc('get_demo', { p_token: token, p_src: src || null })
      if (alive) setState({ loading: false, data: error ? null : data })
    })()
    return () => { alive = false }
  }, [token, src])

  const entity = state.data?.entity
  const items = state.data?.items
  const info = useMemo(() => demoEntityToInfo(entity), [entity])
  const products = useMemo(() => demoItemsToCards(items, entity?.name || ''), [items, entity?.name])
  const productsLabel = demoProductsLabel(entity?.kind)
  const regHref = '/sotuvchi-bolish' + (src ? `?src=${encodeURIComponent(src)}` : '')
  const orgHref = '/tashkilotchi-bolish' + (src ? `?src=${encodeURIComponent(src)}` : '')
  const joinHref = entity?.kind === 'organizer' ? orgHref : regHref
  const joinLabel = entity?.kind === 'organizer'
    ? 'Bu sizning markazingizmi? Ulanish'
    : entity?.kind === 'bookseller'
      ? 'Bu sizning do‘koningizmi? Ulanish'
      : 'Bu sizning do‘koningizmi? Ulanish'

  const share = async () => {
    const url = window.location.href
    const title = info?.shop_name || 'Namuna profil'
    try {
      if (navigator.share) { await navigator.share({ title, url }); return }
      await navigator.clipboard.writeText(url)
      setToast('Havola nusxalandi')
    } catch (e) {
      if (e?.name === 'AbortError') return
      try { await navigator.clipboard.writeText(url); setToast('Havola nusxalandi') } catch { setToast('Havolani nusxalab bo‘lmadi') }
    }
  }

  if (state.loading) {
    return <div className="p-10 text-center text-[#64748B]">Yuklanmoqda…</div>
  }
  if (!state.data || !info) {
    return (
      <div className="mx-auto max-w-xl p-10 text-center">
        <h1 className="text-xl font-bold">Sahifa topilmadi</h1>
        <p className="mt-2 text-[#64748B]">Havola noto‘g‘ri yoki muddati tugagan.</p>
        <Link to="/" className="mt-4 inline-block text-[#0F766E] underline">Bosh sahifaga</Link>
      </div>
    )
  }

  return (
    <div className={mobile ? 'min-h-[100dvh] overflow-x-clip bg-gradient-to-b from-[#e8f5f3] via-[#f2f8f8] to-page' : 'min-h-screen bg-gradient-to-b from-[#e8f5f3] via-[#f2f8f8] to-[#F8FAFC]'}>
      <div className="sticky top-0 z-30 bg-[#FEF3C7] px-4 py-2.5 text-center text-[13px] leading-snug text-[#92400E]">
        <b>Namuna</b> — bu sahifa StomaHub’da qanday ko‘rinishingizni ko‘rsatish uchun ochiq manbalardagi ma’lumotlardan tayyorlangan.
        Buyurtma va ro‘yxatdan o‘tish o‘chirilgan.
      </div>
      <div className="mx-auto w-full max-w-[1120px] px-3.5 pb-[calc(var(--bottom-nav-h)+max(env(safe-area-inset-bottom,0px),var(--safe-bottom-sim,0px))+28px)] pt-2.5 lg:px-0 lg:pb-10">
        <header className="mb-3 flex items-center gap-3">
          <button type="button" aria-label="Orqaga" onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'))} className={iconBtn}>
            <ChevronLeft className="size-6" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-center text-[19px] font-bold text-ink lg:text-left lg:text-[22px]">{demoProfileTitle(entity?.kind)}</h1>
          <button type="button" aria-label="Ulashish" onClick={share} className={iconBtn}>
            <Share2 className="size-5" />
          </button>
        </header>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#fde68a] bg-[#FFFBEB] px-3.5 py-3">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#92400E]">
            <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-bold">Namuna</span>
            Haqiqiy buyurtma qabul qilinmaydi
          </span>
          <Link to={joinHref} className="inline-flex h-10 items-center rounded-xl bg-[#0b6d73] px-3.5 text-[13px] font-semibold text-white">
            {joinLabel}
          </Link>
        </div>

        <SellerProfileView
          demo
          info={info}
          products={products}
          productsLabel={productsLabel}
          onToast={setToast}
        />
      </div>
      <MobileToast text={toast} onClose={() => setToast('')} bottom={mobile ? 'calc(var(--bottom-nav-h) + max(env(safe-area-inset-bottom, 0px), var(--safe-bottom-sim, 0px)) + 12px)' : 24} />
      {mobile && <MobileTabBar />}
    </div>
  )
}
