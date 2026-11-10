/** Seminar posteri: to‘liq ko‘rinadi (object-contain), orqa fon — xira nusxasi. */
export default function SeminarPosterFrame({ src, alt = '', className = '', imgClassName = 'max-h-[200px]' }) {
  if (!src) return <div className={`rounded-xl bg-[#e8eef1] ${imgClassName} ${className}`} />
  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#e8eef1] ${className}`}>
      <img src={src} alt="" aria-hidden className="absolute inset-0 size-full scale-[1.25] object-cover opacity-50 blur-2xl" />
      <img src={src} alt={alt} className={`relative z-[1] mx-auto block h-auto w-full object-contain ${imgClassName}`} />
    </div>
  )
}
