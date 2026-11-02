import { friendlyError } from '../../lib/friendlyError'
import { useState } from 'react'
import { Landmark, Eye, CheckCircle2 } from 'lucide-react'
import { listSellerPayouts, markSellerPaid, useAdminList } from '../api'
import { dmy, dmyhm, num, som } from '../format'
import Modal from '../components/Modal'
import {
  Btn, DataTable, Empty, FilterTabs, KpiStrip, MigrateBanner, MobileCards,
  PageHeader, Pagination, SearchRow, TableCard,
} from '../components/ui'

const TABS = [
  { id: 'kutilmoqda', label: 'To‘lanishi kerak' },
  { id: 'tolandi', label: 'To‘langan' },
  { id: 'all', label: 'Barchasi' },
]

export default function SotuvchigaTolov() {
  const [tab, setTab] = useState('kutilmoqda')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sel, setSel] = useState(null)
  const [ref, setRef] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [tick, setTick] = useState(0)

  const { loading, error, needsMigration, rows, total, extra } = useAdminList(
    () => listSellerPayouts({ tab, q, page, pageSize }),
    [tab, q, page, pageSize, tick],
  )
  const s = extra.summary || {}

  const open = (r) => { setSel(r); setRef(''); setNote(''); setErr(''); setOk('') }
  const pay = async () => {
    setBusy(true); setErr(''); setOk('')
    try {
      const r = await markSellerPaid(sel.seller_id, ref, null, note)
      setOk(`${som(r?.amount ?? sel.due)} to‘landi deb belgilandi (${num(r?.count ?? sel.due_orders)} ta buyurtma)`)
      setSel((x) => ({ ...x, due: 0, items: [] }))
      setTick((n) => n + 1)
    } catch (e) {
      setErr(friendlyError(e, 'Belgilab bo‘lmadi'))
    } finally {
      setBusy(false)
    }
  }
  const bank = (r) => [r.bank, r.mfo && `MFO ${r.mfo}`, r.account].filter(Boolean).join(' · ') || 'Rekvizit kiritilmagan'

  return (
    <div>
      <PageHeader title="Sotuvchiga to‘lov" subtitle="Escrowdan chiqarilgan tushum (12% komissiyasiz) — bank orqali o‘tkazing va shu yerda belgilang" />
      <MigrateBanner show={needsMigration} file="0042_real_escrow.sql" />
      <KpiStrip items={[
        { label: 'To‘lanishi kerak', value: som(s.due), sub: `${num(s.due_sellers)} ta sotuvchi`, active: true, icon: Landmark },
        { label: 'Jami to‘langan', value: som(s.paid), sub: 'Bank o‘tkazmalari' },
        { label: 'Ushlangan komissiya', value: som(s.commission), sub: 'Chiqarilgan onlayn buyurtmalar' },
      ]} />
      <FilterTabs tabs={TABS} value={tab} onChange={(v) => { setTab(v); setPage(1) }} />
      <SearchRow value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Do‘kon nomi..." onFilter={() => {}} />
      {loading && <p className="mt-6 text-[#5C6E80]">Yuklanmoqda…</p>}
      {error && !needsMigration && <p role="alert" className="mt-6 text-[#b42318]">{error}</p>}

      <MobileCards rows={rows} render={(r) => (
        <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => open(r)}>
          <div><div className="font-semibold">{r.shop_name}</div><div className="text-[12px] text-[#5C6E80]">{bank(r)}</div></div>
          <div className="text-right"><div className="font-bold text-[#0F766E]">{som(r.due)}</div><div className="text-[11px] text-[#8A9AA8]">{num(r.due_orders)} ta buyurtma</div></div>
        </button>
      )} />

      <TableCard className="hidden lg:block">
        <DataTable head={['Do‘kon', 'Bank rekvizitlari', 'To‘lanishi kerak', 'Buyurtmalar', 'To‘langan', 'Komissiya', 'Oxirgi to‘lov', '']}>
          {rows.map((r) => (
            <tr key={r.seller_id} className="border-t border-[#EEF3F4]">
              <td className="px-3 py-3 font-semibold">{r.shop_name}{r.stir && <div className="text-[11px] font-normal text-[#8A9AA8]">STIR {r.stir}</div>}</td>
              <td className="px-3 py-3 text-[12px]">{bank(r)}</td>
              <td className="px-3 py-3 font-bold text-[#0F766E]">{som(r.due)}</td>
              <td className="px-3 py-3">{num(r.due_orders)}</td>
              <td className="px-3 py-3">{som(r.paid)}</td>
              <td className="px-3 py-3">{som(r.commission)}</td>
              <td className="px-3 py-3">{r.last_paid_at ? dmy(r.last_paid_at) : '—'}</td>
              <td className="px-3 py-3"><Btn tone={Number(r.due) > 0 ? 'primary' : 'ghost'} onClick={() => open(r)}>{Number(r.due) > 0 ? <><Landmark className="size-3.5" /> To‘lash</> : <><Eye className="size-3.5" /> Ko‘rish</>}</Btn></td>
            </tr>
          ))}
          {!loading && !rows.length && <tr><td colSpan={8}><Empty text="To‘lanadigan mablag‘ yo‘q" /></td></tr>}
        </DataTable>
      </TableCard>
      <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1) }} />

      <Modal open={!!sel} onClose={() => setSel(null)} title={sel ? `Sotuvchiga to‘lov — ${sel.shop_name}` : ''} sheet
        headerIcon={<Landmark className="size-5" />}
        footer={(
          <div className="flex w-full flex-wrap gap-2">
            {sel && Number(sel.due) > 0 && (
              <Btn tone="primary" disabled={busy || ref.trim().length < 3} onClick={pay}>
                <CheckCircle2 className="size-3.5" /> {busy ? 'Belgilanmoqda…' : `${som(sel.due)} to‘landi`}
              </Btn>
            )}
            <Btn onClick={() => setSel(null)}>Yopish</Btn>
          </div>
        )}
      >
        {sel && (
          <div className="space-y-3 text-[13px]">
            {err && <p role="alert" className="rounded-lg bg-[#fdecec] px-3 py-2 text-[#b42318]">{err}</p>}
            {ok && <p role="status" className="rounded-lg bg-[#F0FDFA] px-3 py-2 text-[#0F766E]">{ok}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div><div className="text-[#8A9AA8]">To‘lanishi kerak</div><div className="text-[18px] font-extrabold text-[#0F766E]">{som(sel.due)}</div></div>
              <div><div className="text-[#8A9AA8]">Bank rekvizitlari</div><div className="font-semibold">{bank(sel)}</div></div>
            </div>
            {Array.isArray(sel.items) && sel.items.length > 0 && (
              <div>
                <div className="mb-1 text-[#8A9AA8]">Chiqarilgan buyurtmalar</div>
                <ul className="space-y-1">
                  {sel.items.map((it) => (
                    <li key={it.id} className="flex justify-between gap-2 border-t border-[#EEF3F4] py-1">
                      <span>#{it.code} · {dmyhm(it.released_at)}<span className="text-[11px] text-[#8A9AA8]"> · {som(it.gross)} − {som(it.commission)}</span></span>
                      <span className="font-semibold">{som(it.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {Number(sel.due) > 0 && (
              <>
                <label className="block">
                  <span className="text-[#8A9AA8]">Bank to‘lov hujjati raqami *</span>
                  <input value={ref} onChange={(e) => setRef(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#DCE5E7] px-3" placeholder="Masalan: P/T № 000123" />
                </label>
                <label className="block">
                  <span className="text-[#8A9AA8]">Izoh</span>
                  <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#DCE5E7] px-3" placeholder="Ixtiyoriy" />
                </label>
                <p className="text-[11.5px] text-[#8A9AA8]">Avval pulni bank orqali o‘tkazing, keyin belgilang. Sotuvchiga bildirishnoma yuboriladi.</p>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
