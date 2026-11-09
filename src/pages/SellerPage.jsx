import { isTestShop } from '../testData'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Share2, Store } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { isUuid, useMarket } from '../buyerApi'
import { pickPublic } from '../seller-public/lib'
import SellerProfileView from '../seller-public/SellerProfileView'
import { useMobile } from '../useMobile'
import MobileTabBar from '../components/mobile/MobileTabBar'
import { MobileToast } from '../components/mobile/parts'

// Sotuvchining ochiq profili. 0036/0044/0057 RPC; RPC bo‘lmasa ham mahsulotlar ro‘yxati orqali ishlaydi.
function useSellerInfo(id) {
  const [state, setState] = useState({ status: 'loading', info: null })
  useEffect(() => {
    let off = false
    if (!supabase || !isUuid(id)) { setState({ status: 'ready', info: null }); return undefined }
    supabase.rpc('seller_public_profile', { p_id: id }).then(({ data, error }) => {
      if (!off) setState({ status: 'ready', info: error || isTestShop(data) ? null : pickPublic(data), test: !error && isTestShop(data) })
    })
    return () => { off = true }
  }, [id])
  return state
}

const iconBtn = 'grid size-11 shrink-0 place-items-center rounded-2xl border border-[#e3eef0] bg-white text-ink shadow-[0_2px_10px_rgb(11_60_70/0.07)] active:scale-95'

export default function SellerPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const mobile = useMobile()
  const market = useMarket()
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])
  const { status: infoStatus, info, test: testShop } = useSellerInfo(id)
  const products = useMemo(() => market.products.filter((p) => p.sellerId === id), [market.products, market.status, id])
  const loading = market.status !== 'ready' && market.status !== 'error' && !products.length
  const notFound = testShop || (!loading && infoStatus === 'ready' && !info && !products.length)

  const share = async () => {
    const url = window.location.href
    const title = info?.shop_name || 'Sotuvchi profili'
    try {
      if (navigator.share) { await navigator.share({ title, url }); return }
      await navigator.clipboard.writeText(url)
      setToast('Havola nusxalandi')
    } catch (e) {
      if (e?.name === 'AbortError') return
      try { await navigator.clipboard.writeText(url); setToast('Havola nusxalandi') } catch { setToast('Havolani nusxalab bo‘lmadi') }
    }
  }

  return (
    <div className={mobile ? 'min-h-[100dvh] overflow-x-clip bg-gradient-to-b from-[#e8f5f3] via-[#f2f8f8] to-page' : ''}>
      <div className="mx-auto w-full max-w-[1120px] px-3.5 pb-[calc(var(--bottom-nav-h)+var(--bottom-nav-float,14px)+max(env(safe-area-inset-bottom,0px),var(--safe-bottom-sim,0px))+28px)] pt-2.5 lg:px-0 lg:pb-10 lg:pt-3">
        <header className="mb-3 flex items-center gap-3">
          <button type="button" aria-label="Orqaga" onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/marketplace'))} className={iconBtn}>
            <ChevronLeft className="size-6" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-center text-[19px] font-bold text-ink lg:text-left lg:text-[22px]">Sotuvchi profili</h1>
          <button type="button" aria-label="Ulashish" onClick={share} className={iconBtn}>
            <Share2 className="size-5" />
          </button>
        </header>

        {notFound ? (
          <div className="rounded-2xl border border-line bg-white px-5 py-12 text-center">
            <Store className="mx-auto size-10 text-[#0b6d73]/60" strokeWidth={1.5} />
            <p className="mt-3 text-[15px] font-semibold text-ink">Sotuvchi topilmadi</p>
            <p className="mt-1 text-[13px] text-muted">Do‘kon yopilgan yoki hali tasdiqlanmagan bo‘lishi mumkin.</p>
            <Link to="/marketplace" className="mt-4 inline-flex h-11 items-center rounded-xl bg-[#0b6d73] px-5 text-[14px] font-semibold text-white">Marketplace’ga o‘tish</Link>
          </div>
        ) : (
          <SellerProfileView info={info} products={products} loading={loading} infoLoading={!info && infoStatus === 'loading'} onToast={setToast} />
        )}
      </div>
      <MobileToast text={toast} onClose={closeToast} bottom={mobile ? 'calc(var(--bottom-nav-h) + var(--bottom-nav-float, 14px) + max(env(safe-area-inset-bottom, 0px), var(--safe-bottom-sim, 0px)) + 12px)' : 24} />
      {mobile && <MobileTabBar />}
    </div>
  )
}
