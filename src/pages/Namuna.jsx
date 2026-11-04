import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

// Yashirin "namuna" sahifa: faqat aniq token bilan ochiladi, ro‘yxatlarga chiqmaydi,
// buyurtma / ro‘yxatdan o‘tish o‘chirilgan (server tomonda ham — demo ma’lumotlar alohida jadvalda).
const KIND_LABEL = { shop: 'Do‘kon', organizer: 'Seminar tashkilotchisi', bookseller: 'Kitob sotuvchisi' }
const fmt = (n) => (n == null ? null : Number(n).toLocaleString('ru-RU').replace(/,/g, ' ') + ' so‘m')

function useNoIndex() {
  useEffect(() => {
    const m = document.createElement('meta')
    m.name = 'robots'; m.content = 'noindex, nofollow'
    document.head.appendChild(m)
    return () => m.remove()
  }, [])
}

export default function Namuna() {
  const { token } = useParams()
  const [sp] = useSearchParams()
  const src = sp.get('src') || ''
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

  if (state.loading) return <div className="p-10 text-center text-[#64748B]">Yuklanmoqda…</div>
  if (!state.data) return (
    <div className="mx-auto max-w-xl p-10 text-center">
      <h1 className="text-xl font-bold">Sahifa topilmadi</h1>
      <p className="mt-2 text-[#64748B]">Havola noto‘g‘ri yoki muddati tugagan.</p>
      <Link to="/" className="mt-4 inline-block text-[#0F766E] underline">Bosh sahifaga</Link>
    </div>
  )

  const { entity: e, items } = state.data
  const regHref = '/sotuvchi-bolish' + (src ? `?src=${encodeURIComponent(src)}` : '')
  const orgHref = '/tashkilotchi-bolish' + (src ? `?src=${encodeURIComponent(src)}` : '')

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="sticky top-0 z-20 bg-[#FEF3C7] px-4 py-3 text-center text-[14px] text-[#92400E]">
        <b>Namuna</b> — bu sahifa StomaHub’da qanday ko‘rinishingizni ko‘rsatish uchun ochiq manbalardagi ma’lumotlardan tayyorlangan.
        Buyurtma va ro‘yxatdan o‘tish o‘chirilgan.
      </div>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
          {e.logo_url && <img src={e.logo_url} alt="" className="h-16 w-16 rounded-xl object-cover" />}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#0F172A]">{e.name}</h1>
              <span className="rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-[12px] font-semibold text-[#92400E]">Namuna</span>
            </div>
            <div className="mt-1 text-[14px] text-[#64748B]">{KIND_LABEL[e.kind]}{e.city ? ` · ${e.city}` : ''}</div>
            {e.description && <p className="mt-2 text-[14px] text-[#334155]">{e.description}</p>}
          </div>
          <Link to={e.kind === 'organizer' ? orgHref : regHref} className="rounded-xl bg-[#0F766E] px-4 py-2.5 text-[14px] font-semibold text-white">
            Bu sizning {e.kind === 'organizer' ? 'markazingizmi' : 'do‘koningizmi'}? Ulanish
          </Link>
        </div>

        <h2 className="mt-6 mb-3 text-lg font-semibold">
          {e.kind === 'organizer' ? 'Seminarlar' : e.kind === 'bookseller' ? 'Kitoblar' : 'Mahsulotlar'} ({items.length})
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it) => (
            <div key={it.id} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="relative aspect-square bg-[#F1F5F9]">
                {it.image_url && <img src={it.image_url} alt={it.name} loading="lazy" className="h-full w-full object-cover" />}
                <span className="absolute left-2 top-2 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-semibold text-[#92400E]">Namuna</span>
              </div>
              <div className="flex flex-1 flex-col p-3">
                <div className="line-clamp-2 text-[14px] font-medium text-[#0F172A]">{it.name}</div>
                {it.kind === 'seminar' && it.extra?.start_date && <div className="mt-1 text-[12px] text-[#64748B]">{it.extra.start_date}{it.extra.place ? ` · ${it.extra.place}` : ''}</div>}
                <div className="mt-1 text-[15px] font-bold text-[#0F766E]">{it.price != null ? fmt(it.price) : (it.price_text || 'Narx ko‘rsatilmagan')}</div>
                {it.description && <p className="mt-1 line-clamp-3 text-[12px] text-[#64748B]">{it.description}</p>}
                <button type="button" disabled className="mt-auto pt-2">
                  <span className="block w-full cursor-not-allowed rounded-lg bg-[#E2E8F0] py-2 text-[13px] font-semibold text-[#94A3B8]">
                    {it.kind === 'seminar' ? 'Ro‘yxatdan o‘tish o‘chirilgan' : 'Savatchaga qo‘shib bo‘lmaydi'}
                  </span>
                </button>
                <a href={it.source_url} target="_blank" rel="noreferrer nofollow" className="mt-1 text-[11px] text-[#64748B] underline">Manba</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
