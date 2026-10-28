import { useEffect, useRef, useState } from 'react'
import { LocateFixed, MapPin, ExternalLink } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

const TASHKENT = [41.3111, 69.2797]
let lastGeo = 0

// Reverse geocode via Nominatim (free, no key). Max ~1 req/s, only on user action.
const CYR = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'j',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'x',ц:'s',ч:'ch',ш:'sh',щ:'sh',ъ:'’',ы:'i',ь:'',э:'e',ю:'yu',я:'ya',ў:'o‘',қ:'q',ғ:'g‘',ҳ:'h' }
export function translit(t = '') {
  if (!/[\u0400-\u04FF]/.test(t)) return t
  return t.replace(/\s*(улица|кўчаси)/gi, ' ko‘chasi').replace(/\s*(проспект|шоҳ кўчаси)/gi, ' shoh ko‘chasi').replace(/\s*(переулок|тор кўчаси)/gi, ' tor ko‘chasi').replace(/^(улица|проспект|переулок)\s+(.+)$/i, '$2 $1').replace(/[\u0400-\u04FF]/g, (ch) => { const l = ch.toLowerCase(); const r = CYR[l] ?? ch; return ch !== l ? r.charAt(0).toUpperCase() + r.slice(1) : r })
    .replace(/\bUlitsa\b|\bulitsa\b/g, 'ko‘chasi').replace(/\bProspekt\b|\bprospekt\b/g, 'shoh ko‘chasi').replace(/\bpereulok\b/gi, 'tor ko‘chasi')
}
// Canonical cities/districts with Russian/Uzbek aliases (lowercased stems).
const CITY_ALIAS = { Toshkent: ['toshkent', 'tashkent', 'ташкент', 'тошкент'], Samarqand: ['samarqand', 'samarkand', 'самарканд'], Buxoro: ['buxoro', 'bukhara', 'бухара'], Andijon: ['andijon', 'andijan', 'андижан'], 'Farg‘ona': ['farg', 'fergana', 'фергана', 'фарғона'], Namangan: ['namangan', 'наманган'], Nukus: ['nukus', 'нукус'] }
const DIST_ALIAS = {
  Yunusobod: ['yunusobod', 'юнусабад', 'юнусобод'], Chilonzor: ['chilonzor', 'чиланзар', 'чилонзор'], 'Mirzo Ulug‘bek': ['mirzo ulug', 'мирзо-улугбек', 'мирзо улугбек', 'мирзо улуғбек'],
  Yakkasaroy: ['yakkasaroy', 'яккасарай', 'яккасарой'], Mirobod: ['mirobod', 'мирабад', 'миробод'], Shayxontohur: ['shayxontohur', 'шайхантахур', 'шайхонтоҳур'],
  Sergeli: ['sergeli', 'сергели'], Uchtepa: ['uchtepa', 'учтепа'], Yashnobod: ['yashnobod', 'яшнабад', 'яшнобод'], Olmazor: ['olmazor', 'алмазар', 'олмазор'], Bektemir: ['bektemir', 'бектемир'],
  Siab: ['siab', 'сиаб', 'сиёб'], Kogon: ['kogon', 'каган', 'когон'], Asaka: ['asaka', 'асака'], 'Qo‘qon': ['qo‘qon', 'qoqon', 'коканд', 'қўқон'], Chortoq: ['chortoq', 'чартак', 'чортоқ'],
}
const pick = (table, vals) => { for (const v of vals) { const l = String(v || '').toLowerCase(); if (!l) continue; for (const [k, al] of Object.entries(table)) if (al.some((x) => l.includes(x))) return k } return '' }
export function normalizeGeo(a) {
  const notMahalla = (v) => (v && !/махалл|mahalla|mfy/i.test(v) ? v : '')
  // districts only from district-level fields; never neighbourhood/mahalla
  const district = pick(DIST_ALIAS, [a.city_district, a.district, a.county, a.borough, a.suburb]) || 'Markaz'
  const iso = { 'UZ-TK': 'Toshkent', 'UZ-SA': 'Samarqand', 'UZ-BU': 'Buxoro', 'UZ-AN': 'Andijon', 'UZ-FA': 'Farg‘ona', 'UZ-NG': 'Namangan', 'UZ-QR': 'Nukus' }[a['ISO3166-2-lvl4']]
  const TASH = ['Yunusobod', 'Chilonzor', 'Mirzo Ulug‘bek', 'Yakkasaroy', 'Mirobod', 'Shayxontohur', 'Sergeli', 'Uchtepa', 'Yashnobod', 'Olmazor', 'Bektemir']
  const city = pick(CITY_ALIAS, [notMahalla(a.city), a.state, notMahalla(a.town), a.region]) || iso || (TASH.includes(district) ? 'Toshkent' : '') || translit(notMahalla(a.city) || notMahalla(a.town) || a.state || '').replace(/\s*(shahri|viloyati)$/i, '')
  const road = translit(a.road || a.pedestrian || a.footway || '')
  const street = [road, a.house_number ? `${translit(a.house_number)}-uy` : ''].filter(Boolean).join(', ')
  return { city, district, street }
}

export async function reverseGeocode(lat, lng) {
  const wait = Math.max(0, 1100 - (Date.now() - lastGeo))
  if (wait) await new Promise((r) => setTimeout(r, wait))
  lastGeo = Date.now()
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&lat=${lat}&lon=${lng}&accept-language=uz,ru`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('geocode')
  const j = await res.json()
  const n = normalizeGeo(j.address || {})
  return { ...n, display: j.display_name || '' }
}

// Orders store coordinates as a trailing token in the address text until orders.lat/lng columns exist.
export const withGeo = (address, p) => (p && p.lat != null ? `${address} [geo:${p.lat},${p.lng}]` : address)
export function parseGeo(text = '') {
  const m = String(text).match(/\[geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\]/)
  return m ? { lat: +m[1], lng: +m[2], text: String(text).replace(m[0], '').trim() } : { lat: null, lng: null, text }
}

export const mapUrl = (lat, lng) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`

function tile(lat, lng, z = 16) {
  const n = 2 ** z
  const x = ((lng + 180) / 360) * n
  const r = (lat * Math.PI) / 180
  const y = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n
  return { z, x: Math.floor(x), y: Math.floor(y), fx: x % 1, fy: y % 1 }
}

// Small static map preview + "Xaritada ochish" link.
export function MapPreview({ lat, lng, className = '' }) {
  if (lat == null || lng == null || Number.isNaN(+lat)) return null
  const t = tile(+lat, +lng)
  return (
    <div className={`mt-2 ${className}`}>
      <a href={mapUrl(lat, lng)} target="_blank" rel="noreferrer" className="relative block h-[96px] overflow-hidden rounded-xl border border-line bg-[#e8eef0]">
        {[-1, 0, 1].flatMap((dy) => [-1, 0, 1].map((dx) => (
          <img key={`${dx}${dy}`} src={`https://tile.openstreetmap.org/${t.z}/${t.x + dx}/${t.y + dy}.png`} alt="" className="absolute size-[256px] max-w-none" style={{ left: `calc(50% - ${(t.fx - dx) * 256}px)`, top: `calc(50% - ${(t.fy - dy) * 256}px)` }} loading="lazy" />
        )))}
        <MapPin className="absolute left-1/2 top-1/2 size-7 -translate-x-1/2 -translate-y-full fill-[#0b6d73] text-white drop-shadow" />
      </a>
      <a href={mapUrl(lat, lng)} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-sea"><ExternalLink className="size-3.5" /> Xaritada ochish</a>
    </div>
  )
}

// Interactive picker: draggable pin, tap to move, "Joylashuvim" geolocation, reverse-geocode on change.
export default function MapPicker({ lat, lng, onChange, height = 200 }) {
  const box = useRef(null)
  const map = useRef(null)
  const pin = useRef(null)
  const cb = useRef(onChange)
  cb.current = onChange
  const [busy, setBusy] = useState('')

  const emit = async (p) => {
    const pos = { lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6) }
    cb.current?.({ ...pos, geo: null })
    setBusy('Manzil aniqlanmoqda...')
    try { cb.current?.({ ...pos, geo: await reverseGeocode(pos.lat, pos.lng) }); setBusy('') } catch { setBusy('Manzilni aniqlab bo‘lmadi, qo‘lda kiriting') }
  }

  useEffect(() => {
    let dead = false
    import('leaflet').then(({ default: L }) => {
      if (dead || !box.current || map.current) return
      const start = lat != null ? [lat, lng] : TASHKENT
      const m = L.map(box.current, { zoomControl: true, attributionControl: true }).setView(start, lat != null ? 17 : 12)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m)
      const icon = L.divIcon({ className: '', html: '<svg width="34" height="34" viewBox="0 0 24 24" fill="#0b6d73" stroke="#fff" stroke-width="1.5"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6" fill="#fff"/></svg>', iconSize: [34, 34], iconAnchor: [17, 33] })
      const mk = L.marker(start, { draggable: true, icon }).addTo(m)
      mk.on('dragend', () => emit(mk.getLatLng()))
      m.on('click', (e) => { mk.setLatLng(e.latlng); emit(e.latlng) })
      map.current = m; pin.current = mk
      setTimeout(() => m.invalidateSize(), 250)
    })
    return () => { dead = true; map.current?.remove(); map.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const locate = () => {
    if (!navigator.geolocation) { setBusy('Qurilma joylashuvni qo‘llab-quvvatlamaydi'); return }
    setBusy('Joylashuv aniqlanmoqda...')
    navigator.geolocation.getCurrentPosition(
      (p) => { const ll = { lat: p.coords.latitude, lng: p.coords.longitude }; pin.current?.setLatLng(ll); map.current?.setView(ll, 17); emit(ll) },
      () => setBusy('Joylashuvga ruxsat berilmadi'),
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  return (
    <div className="mt-3">
      <div className="relative overflow-hidden rounded-xl border border-line" style={{ height }}>
        <div ref={box} className="size-full" style={{ touchAction: 'none' }} />
        <button type="button" onClick={locate} className="absolute bottom-2 right-2 z-[500] flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-[#0b6d73] shadow-card">
          <LocateFixed className="size-4" /> Joylashuvim
        </button>
      </div>
      <p className="mt-1 text-[11px] text-muted">{busy || (lat != null ? `Belgilangan: ${(+lat).toFixed(5)}, ${(+lng).toFixed(5)}` : 'Pinni suring yoki xaritaga bosing')}</p>
    </div>
  )
}
