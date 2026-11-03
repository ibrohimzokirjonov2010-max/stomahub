import MobileNavDrawer from './MobileNavDrawer'

export function MenuButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label="Menyu" aria-haspopup="dialog" className="grid size-10 place-items-center rounded-full text-ink active:bg-white/70">
      <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>
  )
}

export default function MobileMenu({ open, onClose }) {
  return <MobileNavDrawer open={open} onClose={onClose} />
}
