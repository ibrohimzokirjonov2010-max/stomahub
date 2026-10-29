// Yangi teal rastr ikonkalar: public/icons/<group>/<slug>.png (256×256, shaffof fon).
// imgIcon() lucide-ikonka o‘rnida ishlatiladigan komponent qaytaradi: className saqlanadi,
// SVG-ga xos proplar (fill, stroke, strokeWidth...) e’tiborsiz qoldiriladi.
// `raster = true` belgisi orqali chip/nav faol holatini rastrga moslab chizish mumkin.
export const iconSrc = (group, slug) => `/icons/${group}/${slug}.png`

export function imgIcon(group, slug) {
  const src = iconSrc(group, slug)
  function TealIcon({ className = '', style }) {
    return <img src={src} alt="" aria-hidden="true" draggable="false" decoding="async" className={`object-contain ${className}`} style={style} />
  }
  TealIcon.displayName = `TealIcon(${group}/${slug})`
  TealIcon.raster = true
  return TealIcon
}

export const SectionIcons = {
  seminarlar: imgIcon('sections', 'seminarlar'),
  marketplace: imgIcon('sections', 'marketplace'),
  forum: imgIcon('sections', 'forum'),
  ortiqcha: imgIcon('sections', 'ortiqcha-material'),
  kitoblar: imgIcon('sections', 'kitoblar'),
  jihozlar: imgIcon('sections', 'jihozlar'),
}

export const NavIcons = {
  home: imgIcon('nav', 'bosh-sahifa'),
  profil: imgIcon('nav', 'profil'),
}
