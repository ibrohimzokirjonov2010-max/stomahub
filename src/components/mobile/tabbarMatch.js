// Pure tab-route matching (tests + MobileTabBar). /ortiqcha Marketplace emas.
export const TAB_MATCH = {
  home: ['/', '/ishlar', '/ustalar'],
  seminarlar: ['/seminarlar'],
  marketplace: ['/marketplace', '/product', '/dokon', '/kategoriyalar', '/brendlar', '/kitoblar', '/sertifikatlar', '/mutaxassislar', '/elonlar', '/buyurtma', '/jihozlar'],
  forma: ['/forma'],
  profil: ['/profil', '/klinika', '/community', '/bemorlar', '/uchrashuvlar', '/tolovlar', '/ombor'],
}

export const isTabActive = (pathname, match) => match.some((m) => (m === '/' ? pathname === '/' : pathname === m || pathname.startsWith(`${m}/`)))
