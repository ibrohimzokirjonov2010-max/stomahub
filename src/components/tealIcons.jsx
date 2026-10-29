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

// Menyu ikonkalari (kat-talim, kat-forum-2, kat-klinika, kat-hisobim varaqlari)
export const MenuIcons = {
  talim: imgIcon('talim', 'talim'), kurslar: imgIcon('talim', 'kurslar'), vebinarlar: imgIcon('talim', 'vebinarlar'),
  sertifikatlar: imgIcon('talim', 'sertifikatlar'), testlar: imgIcon('talim', 'testlar'), maqolalar: imgIcon('talim', 'maqolalar'),
  forum: imgIcon('forum-menu', 'forum'), yangiMavzu: imgIcon('forum-menu', 'yangi-mavzu'), meningMavzularim: imgIcon('forum-menu', 'mening-mavzularim'),
  mashhur: imgIcon('forum-menu', 'mashhur'), saqlanganlar: imgIcon('forum-menu', 'saqlanganlar'), bildirishnomalar: imgIcon('forum-menu', 'bildirishnomalar'),
  klinika: imgIcon('klinika', 'mening-klinikam'), bemorlar: imgIcon('klinika', 'bemorlar'), qabullar: imgIcon('klinika', 'qabullar'),
  rejalar: imgIcon('klinika', 'davolash-rejalari'), tolovlar: imgIcon('klinika', 'tolovlar'), ombor: imgIcon('klinika', 'ombor'),
  xodimlar: imgIcon('klinika', 'xodimlar'), hisobotlar: imgIcon('klinika', 'hisobotlar'), vakansiyalar: imgIcon('klinika', 'vakansiyalar'),
  hisobim: imgIcon('hisobim', 'mening-hisobim'), buyurtmalar: imgIcon('hisobim', 'buyurtmalar'), sevimlilar: imgIcon('hisobim', 'sevimlilar'),
  hamyon: imgIcon('hisobim', 'hamyon'), aksiyalar: imgIcon('hisobim', 'aksiyalar'), xabarlar: imgIcon('hisobim', 'xabarlar'),
  sozlamalar: imgIcon('hisobim', 'sozlamalar'), yordam: imgIcon('hisobim', 'yordam'), chiqish: imgIcon('hisobim', 'chiqish'),
}
