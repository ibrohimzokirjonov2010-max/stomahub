import { useEffect, useRef, useState } from 'react'

/**
 * Rasm hech qachon o‘zining asl (natural) o‘lchamidan kattalashtirilmaydi — kichik yoki eni keng
 * rasmlar katta ramkada xira bo‘lib cho‘zilmaydi, markazda asl o‘lchamida turadi.
 * boundW / boundH — ota blok chegarasi (CSS qiymati), masalan '100%' yoki '100cqw'.
 */
export default function NaturalImg({ src, alt = '', className = '', style, boundW = '100%', boundH = '100%', ...rest }) {
  const ref = useRef(null)
  const [nat, setNat] = useState(null)
  const read = (el) => { if (el?.naturalWidth && el?.naturalHeight) setNat({ w: el.naturalWidth, h: el.naturalHeight, src: el.currentSrc || src }) }
  useEffect(() => { if (ref.current?.complete) read(ref.current) }, [src]) // eslint-disable-line react-hooks/exhaustive-deps
  const known = nat && nat.src && (nat.src === src || nat.src.endsWith(src))
  const cap = known
    ? { maxWidth: `min(${boundW}, ${nat.w}px)`, maxHeight: `min(${boundH}, ${nat.h}px)` }
    : { maxWidth: boundW, maxHeight: boundH }
  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      data-natural={known ? `${nat.w}x${nat.h}` : undefined}
      onLoad={(e) => read(e.currentTarget)}
      className={`h-auto w-auto object-contain ${className}`}
      style={{ ...cap, ...style }}
      {...rest}
    />
  )
}
