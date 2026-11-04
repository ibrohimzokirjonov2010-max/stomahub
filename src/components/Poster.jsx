// Poster to‘liq ko‘rinadi (object-contain), bo‘sh joy shu rasmning xira fonidan to‘ldiriladi —
// 16:9 posterlar kvadrat/tor kartochkada kesilib "ST POSTER" bo‘lib qolmasligi uchun.
export default function Poster({ src, alt = '', className = '', imgClassName = '' }) {
  if (!src) return <span className={`block bg-[#e6f0f0] ${className}`} />
  return (
    <span className={`relative block overflow-hidden bg-[#e6f0f0] ${className}`}>
      <img src={src} alt="" aria-hidden="true" className="absolute inset-0 size-full scale-110 object-cover opacity-60 blur-md" />
      <img src={src} alt={alt} loading="lazy" className={`relative size-full object-contain ${imgClassName}`} />
    </span>
  )
}
