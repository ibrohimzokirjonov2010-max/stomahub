import { useEffect, useState } from 'react'
import Modal from '../shell/Modal'
import { Btn, Field, Input, Err, toast } from '../ui'
import { updateRow, logActivity, useAsync } from '../../api'
import { variantLabel } from './constants'

export default function StockModal({ product, onClose }) {
  const [stock, setStock] = useState('')
  const [vars, setVars] = useState([])
  const { busy, error, go } = useAsync()
  useEffect(() => { if (product) { setStock(String(product.stock)); setVars((product.variants || []).map((v) => ({ ...v, stock: String(v.stock ?? 0) }))) } }, [product])
  if (!product) return null
  async function save() {
    const patch = vars.length ? { variants: vars.map((v) => ({ ...v, stock: Math.max(0, Number(v.stock) || 0) })) } : { stock: Math.max(0, Number(stock) || 0) }
    const r = await go(() => updateRow('seller_products', product.id, patch))
    if (r?.ok) { logActivity('Stok yangilandi', product.name); toast('Stok yangilandi'); onClose() }
  }
  return (
    <Modal open onClose={onClose} title="Stokni yangilash" subtitle={product.name} width="max-w-[440px]">
      {vars.length ? (
        <div className="space-y-2.5">
          {vars.map((v, i) => (
            <div key={v.sku || i} className="flex items-center gap-3">
              <span className="min-w-0 flex-1 text-[14px]">{variantLabel(v) || v.sku}<span className="block text-[12px] text-[#6B7A88]">{v.sku}</span></span>
              <Input inputMode="numeric" value={v.stock} onChange={(e) => setVars((s) => s.map((x, j) => (j === i ? { ...x, stock: e.target.value } : x)))} className="!w-[110px]" />
            </div>
          ))}
        </div>
      ) : <Field label="Ombordagi soni (dona)"><Input inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} autoFocus /></Field>}
      <div className="mt-3"><Err>{error}</Err></div>
      <div className="mt-5 grid grid-cols-2 gap-3"><Btn variant="outline" onClick={onClose}>Bekor qilish</Btn><Btn disabled={busy} onClick={save}>Saqlash</Btn></div>
    </Modal>
  )
}
