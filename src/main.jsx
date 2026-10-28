import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // Reload once when a new SW takes control so the installed PWA picks up HTML/CSS/JS.
  const hadController = Boolean(navigator.serviceWorker.controller)
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || refreshing) return
    refreshing = true
    window.location.reload()
  })

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        const ping = () => {
          try {
            reg.update()
          } catch {
            /* ignore */
          }
        }
        ping()
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') ping()
        })
        setInterval(ping, 60_000)
      })
      .catch(() => {})
  })
}
