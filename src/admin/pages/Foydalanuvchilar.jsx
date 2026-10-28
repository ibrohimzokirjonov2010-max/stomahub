import { useMemo, useState } from 'react'
import { Ban, CheckCircle2, GraduationCap, MoreVertical, Plus, Stethoscope, User } from 'lucide-react'
import { listUsers, userBlock, userDetail, useAdminList } from '../api'
import { dmyhm, maskPhone } from '../format'
import Modal from '../components/Modal'
import {
  Avatar, Btn, DataTable, Empty, FilterTabs, MigrateBanner, MobileCards,
  PageHeader, Pagination, RowActions, SearchRow, StatusDot, TableCard,
} from '../components/ui'
import ConfirmReason from '../components/ConfirmReason'

export default function Foydalanuvchilar() {
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detail, setDetail] = useState(null)
  const [busy, setBusy] = useState('')
  const [reason, setReason] = useState('')
  const [blockRow, setBlockRow] = useState(null)
  const [msg, setMsg] = useState('')

  const { loading, error, needsMigration, rows, total, counts, reload } = useAdminList(
    () => listUsers({ tab, q, page, pageSize }),
    [tab, q, page, pageSize],
  )

  const tabs = useMemo(() => [
    { id: 'all', label: 'Barchasi', count: counts.all },
    { id: 'shifokor', label: 'Shifokorlar', count: counts.shifokor },
    { id: 'talaba', label: 'Talabalar', count: counts.talaba },
  ], [counts])

  async function openDetail(id) {
    try {
      setDetail(await userDetail(id))
      setReason('')
      setMsg('')
    } catch (e) { setMsg(e.message) }
  }

  async function block(id, doBlock, fromDetail) {
    if (doBlock && reason.trim().length < 3) {
      setMsg('Bloklash sababini yozing (kamida 3 belgi).')
      return
    }
    setBusy(id)
    try {
      await userBlock(id, doBlock, reason)
      setMsg(doBlock ? 'Foydalanuvchi bloklandi.' : 'Blokdan chiqarildi.')
      if (fromDetail) setDetail(await userDetail(id))
      reload()
    } catch (e) { setMsg(e.message) }
    finally { setBusy('') }
  }

  return (
    <div>
      <PageHeader
        title="Foydalanuvchilar"
        subtitle="Platformadan ro‘yxatdan o‘tgan barcha foydalanuvchilar"
        actions={<Btn tone="primary"><Plus className="size-4" /> Yangi foydalanuvchi</Btn>}
      />
      <MigrateBanner show={needsMigration} />
      {msg && <p role="status" className="mt-3 rounded-xl bg-[#eef8f6] px-3 py-2 text-[13px]">{msg}</p>}
      <FilterTabs tabs={tabs} value={tab} onChange={(v) => { setTab(v); setPage(1) }} />
      <SearchRow value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Ism, telefon yoki viloyat bo‘yicha qidirish..." onFilter={() => {}} />

      {loading && <p className="mt-6 text-[#5C6E80]">Yuklanmoqda…</p>}
      {error && !needsMigration && <p role="alert" className="mt-6 text-[#b42318]">{error}</p>}

      <MobileCards rows={rows} render={(r, i) => (
        <button type="button" className="flex w-full items-center gap-3 text-left" onClick={() => openDetail(r.id)}>
          <Avatar name={r.name} src={r.avatar} />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[#10283F]">{r.name}</div>
            <div className="text-[12px] text-[#5C6E80]">{r.user_type === 'talaba' ? 'Talaba' : 'Shifokor'} · {r.city || '—'} · {maskPhone(r.phone)}</div>
          </div>
          <StatusDot tone={r.blocked ? 'gray' : 'teal'}>{r.blocked ? 'Bloklangan' : 'Faol'}</StatusDot>
        </button>
      )} />

      <TableCard className="hidden lg:block">
        <DataTable head={['#', 'Foydalanuvchi', 'Rol', 'Viloyat', 'Ro‘yxatdan o‘tgan sana', 'Telefon raqam', 'Holat', 'Amallar']}>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-t border-[#EEF3F4] hover:bg-[#F8FBFC]/60">
              <td className="px-3 py-3 text-[#8A9AA8]">{(page - 1) * pageSize + i + 1}</td>
              <td className="px-3 py-3">
                <button type="button" className="flex items-center gap-2.5 text-left" onClick={() => openDetail(r.id)}>
                  <Avatar name={r.name} src={r.avatar} size="sm" />
                  <span className="font-semibold text-[#10283F]">{r.name}</span>
                </button>
              </td>
              <td className="px-3 py-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F0FDFA] px-2.5 py-0.5 text-[12px] font-semibold text-[#0F766E]">
                  {r.user_type === 'talaba' ? <GraduationCap className="size-3.5" /> : <Stethoscope className="size-3.5" />}
                  {r.user_type === 'talaba' ? 'Talaba' : 'Shifokor'}
                </span>
              </td>
              <td className="px-3 py-3 text-[#3D4E5F]">{r.city || '—'}</td>
              <td className="px-3 py-3 text-[#3D4E5F]">{dmyhm(r.created_at)}</td>
              <td className="px-3 py-3 text-[#3D4E5F]">{maskPhone(r.phone)}</td>
              <td className="px-3 py-3"><StatusDot tone={r.blocked ? 'gray' : 'teal'}>{r.blocked ? 'Bloklangan' : 'Faol'}</StatusDot></td>
              <td className="px-3 py-3">
                <RowActions>
                  {r.blocked
                    ? <Btn tone="soft" disabled={busy === r.id} onClick={() => { setReason(''); block(r.id, false) }}><CheckCircle2 className="size-3.5" /> Blokdan chiqarish</Btn>
                    : <Btn tone="ghost" disabled={busy === r.id} onClick={() => openDetail(r.id)}><Ban className="size-3.5" /> Bloklash</Btn>}
                  <button type="button" className="p-1 text-[#8A9AA8]" aria-label="Ko‘proq" onClick={() => openDetail(r.id)}><MoreVertical className="size-4" /></button>
                </RowActions>
              </td>
            </tr>
          ))}
          {!loading && !rows.length && <tr><td colSpan={8}><Empty /></td></tr>}
        </DataTable>
      </TableCard>

      <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1) }} />

      <ConfirmReason open={!!blockRow} title="Foydalanuvchini bloklash" danger confirmLabel="Bloklash" reasonLabel="Bloklash sababi"
        placeholder="Masalan: Qoidalarni buzganlik" text={blockRow ? `${blockRow.name || 'Foydalanuvchi'} bloklanadi va platformadan foydalana olmaydi.` : ''}
        onClose={() => setBlockRow(null)}
        onConfirm={async (r) => { await userBlock(blockRow.id, true, r); setMsg('Foydalanuvchi bloklandi.'); if (detail) setDetail(await userDetail(blockRow.id)); reload() }} />
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Foydalanuvchi ma’lumotlari"
        sheet
        headerIcon={<User className="size-5" />}
        width="max-w-[640px]"
        footer={detail && (
          <div className="flex flex-wrap gap-2">
            {detail.blocked
              ? <Btn tone="primary" disabled={busy === detail.id} onClick={() => block(detail.id, false, true)}><CheckCircle2 className="size-4" /> Blokdan chiqarish</Btn>
              : <Btn tone="danger" disabled={busy === detail.id} onClick={() => setBlockRow(detail)}><Ban className="size-4" /> Bloklash</Btn>}
            <Btn onClick={() => setDetail(null)}>Yopish</Btn>
          </div>
        )}
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Avatar name={detail.name} src={detail.avatar} size="lg" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[18px] font-extrabold text-[#10283F]">{detail.name}</h3>
                  {detail.blocked && <StatusDot tone="gray">Bloklangan</StatusDot>}
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F0FDFA] px-2.5 py-0.5 text-[12px] font-semibold text-[#0F766E]">
                    {detail.user_type === 'talaba' ? 'Talaba' : 'Shifokor'}
                  </span>
                </div>
                <p className="text-[13px] text-[#5C6E80]">{detail.specialty || '—'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <Field label="Telefon raqami" value={maskPhone(detail.phone)} />
              <Field label="Foydalanuvchi ID" value={`#${detail.code}`} />
              <Field label="Viloyat" value={detail.city || '—'} />
              <Field label="Buyurtmalar soni" value={`${detail.orders_count || 0} ta`} />
              <Field label="Ro‘yxatdan o‘tgan sana" value={dmyhm(detail.created_at)} />
              <Field label="E’lonlar soni" value={`${detail.ads_count || 0} ta`} />
            </div>
            {detail.blocked && (
              <div className="rounded-xl border border-[#E6EEF0] bg-[#F8FBFC] p-3 text-[13px]">
                <div><span className="text-[#5C6E80]">Bloklash sababi:</span> {detail.block_reason || '—'}</div>
                <div className="mt-1"><span className="text-[#5C6E80]">Bloklangan sana:</span> {dmyhm(detail.blocked_at)}</div>
                <div className="mt-1"><span className="text-[#5C6E80]">Bloklagan:</span> {detail.blocked_by_name || 'Admin'}</div>
              </div>
            )}
            <div className="rounded-xl border border-[#E6EEF0] p-3 text-[13px]">
              <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#5C6E80]">Shaxsiy ma’lumotlar</div>
              <Field label="Ism familiya" value={detail.name} />
              <Field label="Ixtisoslik" value={detail.specialty || '—'} />
              <Field label="Tibbiyot muassasasi" value={detail.clinic || '—'} />
              <Field label="Manzil" value={detail.address || '—'} />
              <Field label="Qo‘shimcha ma’lumot" value={detail.about || '—'} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div className="py-1">
      <div className="text-[11.5px] font-medium text-[#8A9AA8]">{label}</div>
      <div className="font-semibold text-[#10283F]">{value}</div>
    </div>
  )
}
