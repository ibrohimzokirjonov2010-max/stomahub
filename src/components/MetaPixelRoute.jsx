import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { initMetaPixel, trackPageView } from '../lib/metaPixel'

export default function MetaPixelRoute() {
  const { pathname, search } = useLocation()
  useEffect(() => { initMetaPixel() }, [])
  useEffect(() => { trackPageView() }, [pathname, search])
  return null
}
