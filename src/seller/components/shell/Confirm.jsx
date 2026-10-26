import Modal from './Modal'
import { Btn } from '../ui'

export default function Confirm({ open, title, text, okText = 'Tasdiqlash', onOk, onClose, busy, children }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-[440px]">
      {text && <p className="text-[14px] leading-relaxed text-[#3D4E5F]">{text}</p>}
      {children}
      <div className="mt-5 grid grid-cols-2 gap-3"><Btn variant="outline" onClick={onClose}>Bekor qilish</Btn><Btn disabled={busy} onClick={onOk}>{okText}</Btn></div>
    </Modal>
  )
}
