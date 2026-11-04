import { friendlyError } from '../../lib/friendlyError'
import { useEffect, useMemo, useState } from 'react'
import { EyeOff, Eye, Trash2, Flag, CheckCircle2 } from 'lucide-react'
import { communityOpenReports, listContent, moderateContent, useAdminList } from '../api'
import { dmyhm, num } from '../format'
import ConfirmReason from '../components/ConfirmReason'
import {
  Btn, DataTable, Empty, FilterTabs, MigrateBanner, MobileCards, PageHeader, Pagination, RowActions, SearchRow, StatusDot, TableCard,
} from '../components/ui'

// StomaHub Market official kinds (Forma, Jihozlar, Marketplace) are intentionally NOT here.
export const MOD_KINDS = [
  ['ad', 'E’lonlar'], ['surplus', 'Ortiqcha materiallar'], ['post', 'Hamjamiyat postlari'], ['post_reported', 'Shikoyatlar'], ['master', 'Ustalar'],
  ['book', 'Kitoblar'], ['course', 'Kurslar'], ['job', 'Vakansiyalar'], ['channel', 'Kanallar'], ['seminar', 'Seminarlar'],
]

// Muallif maydoni ba'zan JSON obyekt ({"name","avatar"}) yoki uning matni bo‘lib keladi
export function ownerInfo(owner) {
  let o = owner
  if (typeof o === 'string' && /^\s*\{/.test(o)) { try { o = JSON.parse(o) } catch { /* oddiy matn */ } }
  if (o && typeof o === 'object') return { name: String(o.name || o.full_name || o.title || '—'), avatar: typeof o.avatar === 'string' ? o.avatar : '' }
  return { name: o == null || o === '' ? '—' : String(o), avatar: '' }
}

function Owner({ value, avatar: extra }) {
  const info = ownerInfo(value)
  const name = info.name
  const avatar = info.avatar || (typeof extra === 'string' ? extra : '')
  return (
    <span className="inline-flex items-center gap-2">
      {avatar && <img src={avatar} alt="" className="size-6 rounded-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />}
      <span>{name}</span>
    </span>
  )
}

export default function Moderatsiya() {
  const [kind, setKind] = useState('ad')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [pick, setPick] = useState(null) // { row, action }
  const [msg, setMsg] = useState('')
  const { loading, error, needsMigration, rows: allRows, total, reload } = useAdminList(
    async () => {
      const raw = await listContent({ kind, q, page, pageSize })
      // har bir qatorga so‘ralgan bo‘lim belgilanadi — boshqa tabning javobi bu tabda chiqmaydi
      return { ...(raw || {}), rows: (raw?.rows || []).filter((r) => !r.kind || r.kind === kind || (kind === 'post_reported' && r.kind === 'post')).map((r) => ({ ...r, _kind: kind })) }
    }, [kind, q, page, pageSize],
  )
  const rows = allRows.filter((r) => r._kind === kind)
  // Hamjamiyat shikoyatlari soni (ochiq) — tab yonida badge
  const [openReports, setOpenReports] = useState(0)
  useEffect(() => {
    let alive = true
    communityOpenReports().then((n) => { if (alive) setOpenReports(Number(n) || 0) }).catch(() => {})
    return () => { alive = false }
  }, [allRows])
  const tabs = useMemo(() => MOD_KINDS.map(([id, label]) => ({ id, label: id === 'post_reported' && openReports > 0 ? `${label} (${openReports})` : label })), [openReports])
  const dismiss = async (r) => {
    try { await moderateContent(kind, r.id, 'dismiss'); setMsg('Shikoyatlar rad etildi.'); reload() } catch (e) { setMsg(friendlyError(e)) }
  }
  const Reports = ({ r }) => (r.report_count > 0 ? (
    <details className="mt-1 text-[12px]">
      <summary className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-[#fff1f2] px-2 py-0.5 font-semibold text-[#b42318]"><Flag className="size-3" /> {r.report_count} shikoyat</summary>
      <ul className="mt-1 space-y-0.5 text-[#5C6E80]">
        {(r.reports || []).map((x, i) => <li key={i}>• {x.reason || '—'} <span className="text-[#8A9AA8]">({x.by || '—'}{x.at ? `, ${dmyhm(x.at)}` : ''})</span></li>)}
      </ul>
    </details>
  ) : null)
  const unhide = async (r) => {
    try { await moderateContent(kind, r.id, 'unhide'); setMsg('Qayta ko‘rsatildi.'); reload() } catch (e) { setMsg(friendlyError(e)) }
  }
  const actions = (r) => (
    <RowActions>
      {r.hidden
        ? <Btn onClick={() => unhide(r)}><Eye className="size-3.5" /> Ko‘rsatish</Btn>
        : <Btn onClick={() => setPick({ row: r, action: 'hide' })}><EyeOff className="size-3.5" /> Yashirish</Btn>}
      <Btn tone="ghost" onClick={() => setPick({ row: r, action: 'delete' })}><Trash2 className="size-3.5" /> O‘chirish</Btn>
      {r.report_count > 0 && <Btn tone="ghost" onClick={() => dismiss(r)}><CheckCircle2 className="size-3.5" /> Shikoyatni rad etish</Btn>}
    </RowActions>
  )
  return (
    <div>
      <PageHeader title="Kontent moderatsiyasi" subtitle="Foydalanuvchi kontentini yashirish yoki tasdiq bilan o‘chirish" />
      <MigrateBanner show={needsMigration} />
      {msg && <p role="status" className="mt-3 rounded-xl bg-[#eef8f6] px-3 py-2 text-[13px]">{msg}</p>}
      <FilterTabs tabs={tabs} value={kind} onChange={(v) => { setKind(v); setPage(1) }} />
      <SearchRow value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Sarlavha yoki muallif bo‘yicha..." onFilter={() => {}} />
      {loading && <p className="mt-6 text-[#5C6E80]">Yuklanmoqda…</p>}
      {error && !needsMigration && <p role="alert" className="mt-6 text-[#b42318]">{error}</p>}
      <MobileCards rows={rows} render={(r) => (
        <div className="space-y-2">
          <div className="font-semibold">{r.title}</div>
          <Reports r={r} />
          <div className="text-[12px] text-[#5C6E80]"><Owner value={r.owner} avatar={r.owner_avatar} /> · {typeof r.at === "string" ? dmyhm(r.at) : "—"}</div>
          <StatusDot tone={r.hidden ? 'gray' : 'teal'}>{r.hidden ? 'Yashirilgan' : 'Ko‘rinadi'}</StatusDot>
          {actions(r)}
        </div>
      )} />
      <TableCard className="hidden lg:block">
        <DataTable head={['#', 'Sarlavha', 'Muallif', 'Sana', 'Holat', 'Amallar']}>
          {rows.map((r, i) => (
            <tr key={`${r._kind}:${r.id}`} className="border-t border-[#EEF3F4]">
              <td className="px-3 py-3 text-[#8A9AA8]">{(page - 1) * pageSize + i + 1}</td>
              <td className="px-3 py-3"><b>{r.title}</b><Reports r={r} /></td>
              <td className="px-3 py-3"><Owner value={r.owner} avatar={r.owner_avatar} /></td>
              <td className="px-3 py-3">{typeof r.at === "string" ? dmyhm(r.at) : "—"}</td>
              <td className="px-3 py-3"><StatusDot tone={r.hidden ? 'gray' : 'teal'}>{r.hidden ? 'Yashirilgan' : 'Ko‘rinadi'}</StatusDot></td>
              <td className="px-3 py-3">{actions(r)}</td>
            </tr>
          ))}
          {!loading && !rows.length && <tr><td colSpan={6}><Empty /></td></tr>}
        </DataTable>
      </TableCard>
      <p className="mt-2 text-[12px] text-[#8A9AA8]">Jami: {num(total)}</p>
      <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1) }} />
      <ConfirmReason open={!!pick} danger={pick?.action === 'delete'}
        title={pick?.action === 'delete' ? 'O‘chirishni tasdiqlang' : 'Yashirish'}
        confirmLabel={pick?.action === 'delete' ? 'Butunlay o‘chirish' : 'Yashirish'}
        text={pick ? (pick.action === 'delete'
          ? `“${pick.row.title}” butunlay o‘chiriladi. Bu amalni qaytarib bo‘lmaydi.`
          : `“${pick.row.title}” ommaga ko‘rinmaydi (muallif va admin ko‘radi).`) : ''}
        onClose={() => setPick(null)}
        onConfirm={async (reason) => { await moderateContent(kind, pick.row.id, pick.action, reason); setMsg(pick.action === 'delete' ? 'O‘chirildi.' : 'Yashirildi.'); reload() }} />
    </div>
  )
}
