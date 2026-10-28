import { Component } from 'react'

/** App-wide crash fallback: a runtime error shows a friendly Uzbek message instead of a white screen. */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[StomaHub] UI crash:', error, info?.componentStack)
  }

  componentDidMount() {
    // Navigating with browser back/forward clears the error so the next page can render.
    this.onPop = () => this.state.error && this.setState({ error: null })
    window.addEventListener('popstate', this.onPop)
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.onPop)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="grid min-h-screen place-items-center bg-[#f3f6fa] px-5">
        <div className="w-full max-w-[420px] rounded-2xl bg-white p-6 text-center shadow-card">
          <img src="/icons/icon-192.png" alt="StomaHub" className="mx-auto size-14 rounded-xl" />
          <h1 className="mt-4 text-[18px] font-bold text-ink">Kutilmagan xatolik yuz berdi</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            Sahifani ko‘rsatishda muammo chiqdi. Iltimos, sahifani yangilang yoki bosh sahifaga qayting.
          </p>
          <div className="mt-5 grid gap-2">
            <button type="button" onClick={() => window.location.reload()} className="h-11 rounded-lg bg-sea text-[14px] font-semibold text-white hover:bg-sea-600">
              Sahifani yangilash
            </button>
            <a href="/" className="grid h-11 place-items-center rounded-lg border border-sea-100 bg-sea-50 text-[14px] font-semibold text-sea">
              Bosh sahifaga qaytish
            </a>
          </div>
        </div>
      </div>
    )
  }
}
