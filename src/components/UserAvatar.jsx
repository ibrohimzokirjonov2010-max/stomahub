// Foydalanuvchi avatari: haqiqiy surat bo‘lsa — surat, aks holda ism initsiallari.
// Umumiy stok rasm (/images/avatar.jpg) haqiqiy surat hisoblanmaydi.
export const STOCK_AVATAR = /\/images\/avatar\.jpg(\?.*)?$/

export function realAvatar(src) {
  const s = typeof src === 'string' ? src.trim() : ''
  return s && !STOCK_AVATAR.test(s) ? s : ''
}

export function initialsOf(name) {
  const parts = String(name || '').replace(/^(dr\.?|prof\.?)\s+/i, '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return ((parts[0][0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export default function UserAvatar({ src, name, className = 'size-8', rounded = 'rounded-full', textClass = 'text-[11px]' }) {
  const url = realAvatar(src)
  if (url) return <img src={url} alt="" className={`${className} ${rounded} shrink-0 object-cover`} />
  return (
    <span aria-hidden="true" className={`${className} ${rounded} ${textClass} grid shrink-0 place-items-center bg-[#e3f1f2] font-bold text-[#0b6d73]`}>
      {initialsOf(name)}
    </span>
  )
}
