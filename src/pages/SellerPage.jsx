import { isTestShop } from '../testData'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Store } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { isUuid, useMarket } from '../buyerApi'
import { pickPublic } from '../seller-public/lib'
import SellerProfileView from '../seller-public/SellerProfileView'

// Sotuvchining ochiq profili. 0036 RPC bo‘lmasa ham mahsulotlar ro‘yxati orqali ishlaydi.
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

export default function SellerPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const market = useMarket()
  const { status: infoStatus, info, test: testShop } = useSellerInfo(id)
  const products = useMemo(() => market.products.filter((p) => p.sellerId === id), [market.products, market.status, id])
  const loading = market.status !== 'ready' && market.status !== 'error' && !products.length
  const notFound = testShop || (!loading && infoStatus === 'ready' && !info && !products.length)

  return (
    <div className="mx-auto w-full max-w-[1120px] px-3.5 pb-[120px] pt-[calc(var(--safe-top,0px)+12px)] lg:px-0 lg:pb-10 lg:pt-3">
      <button type="button" onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/marketplace'))} className="mb-3 flex h-10 items-center gap-1 rounded-xl pr-3 text-[13.5px] font-semibold text-[#0b6d73]">
        <ChevronLeft className="size-5" /> Orqaga
      </button>

      {notFound ? (
        <div className="rounded-2xl border border-line bg-white px-5 py-12 text-center">
          <Store className="mx-auto size-10 text-[#0b6d73]/60" strokeWidth={1.5} />
          <p className="mt-3 text-[15px] font-semibold text-ink">Sotuvchi topilmadi</p>
          <p className="mt-1 text-[13px] text-muted">Do‘kon yopilgan yoki hali tasdiqlanmagan bo‘lishi mumkin.</p>
          <Link to="/marketplace" className="mt-4 inline-flex h-11 items-center rounded-xl bg-[#0b6d73] px-5 text-[14px] font-semibold text-white">Marketplace’ga o‘tish</Link>
        </div>
      ) : (
        <>
          <SellerProfileView info={info} products={products} loading={loading} />
        </>
      )}
    </div>
  )
}
