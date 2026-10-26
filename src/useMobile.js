import { useSyncExternalStore } from 'react'

const QUERY = '(max-width: 767.98px)'

function subscribe(fn) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', fn)
  return () => mq.removeEventListener('change', fn)
}

export function useMobile() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false)
}
