// Generates supabase/migrations/0063_demo_content.sql from data.mjs.
// Usage: node scripts/demo-content/build-sql.mjs
import { writeFileSync } from 'node:fs'
import { demoRows } from './data.mjs'

const rows = demoRows()
const tag = '$demo$'
const values = rows.map((r) => {
  const json = JSON.stringify(r.payload)
  if (json.includes(tag)) throw new Error(`payload contains ${tag}: ${r.id}`)
  return `  ('${r.kind}', '${r.id}', ${tag}${json}${tag}::jsonb, ${r.sort_at})`
}).join(',\n')

const counts = rows.reduce((m, r) => ({ ...m, [r.kind]: (m[r.kind] || 0) + 1 }), {})

const sql = `-- 0063 NAMUNA (demo) kontent: Forma, Ustalar, Ortiqcha material, E’lonlar.
-- QO‘LDA QO‘LLANADI — faqat Ibrohim «chiqar» deganidan keyin. Idempotent (qayta ishga tushirsa bo‘ladi).
-- Generatsiya: node scripts/demo-content/build-sql.mjs (manba: scripts/demo-content/data.mjs). Qo‘lda tahrirlamang.
--
-- Nima qiladi:
--   1) catalog_items.is_demo ustuni (default false) — namuna qatorlarini belgilash va bir buyruq bilan o‘chirish uchun.
--   2) catalog_items_demo_guard: admin/servis bo‘lmagan foydalanuvchi is_demo ni true qila olmaydi.
--   3) ${rows.length} ta namuna qator: ${Object.entries(counts).map(([k, n]) => `${k}=${n}`).join(', ')}.
--      owner_id = NULL, hidden = false, status = 'active', is_demo = true, payload.isDemo = true.
--      Telefon/Telegram YO‘Q — saytda aloqa va savat tugmalari o‘rniga «Namuna e’lon» yozuvi chiqadi.
--   ad_guard (0059) va surplus_guard (0048) triggerlari INSERT paytida faqat shu tranzaksiya ichida o‘chiriladi:
--   ad_guard SQL Editor’da auth.uid() bo‘lmagani uchun 'ad_auth' xatosini beradi, surplus_guard esa qatorni yashirib qo‘yadi.
--   Boshqa qatorlarga tegilmaydi. Olib tashlash: 0063b_remove_demo_content.sql.

begin;

alter table public.catalog_items add column if not exists is_demo boolean not null default false;
comment on column public.catalog_items.is_demo is
  'Vaqtinchalik namuna (demo) yozuv. 0063b_remove_demo_content.sql hammasini o‘chiradi.';
create index if not exists catalog_items_is_demo_idx on public.catalog_items (is_demo) where is_demo;

create or replace function public.catalog_items_demo_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or coalesce(public.is_admin(), false) then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.is_demo := false;
  else
    new.is_demo := old.is_demo;
  end if;
  return new;
end $$;
drop trigger if exists catalog_items_demo_guard on public.catalog_items;
create trigger catalog_items_demo_guard
  before insert or update on public.catalog_items
  for each row execute function public.catalog_items_demo_guard();

alter table public.catalog_items disable trigger catalog_items_ad_guard;
alter table public.catalog_items disable trigger catalog_items_surplus_guard;

insert into public.catalog_items (kind, id, payload, sort_at, owner_id, hidden, hidden_reason, status, is_demo, updated_at)
select v.kind, v.id, v.payload, v.sort_at, null, false, '', 'active', true, now()
from (values
${values}
) as v(kind, id, payload, sort_at)
on conflict (kind, id) do update
  set payload = excluded.payload, sort_at = excluded.sort_at, hidden = false, hidden_reason = '',
      status = 'active', is_demo = true, updated_at = now()
  where public.catalog_items.is_demo and public.catalog_items.owner_id is null;

alter table public.catalog_items enable trigger catalog_items_ad_guard;
alter table public.catalog_items enable trigger catalog_items_surplus_guard;

commit;

-- Tekshiruv (kutilgan: ${Object.entries(counts).map(([k, n]) => `${k} ${n}`).join(', ')}):
-- select kind, count(*) from public.catalog_items where is_demo group by kind order by kind;
`
writeFileSync(new URL('../../supabase/migrations/0063_demo_content.sql', import.meta.url), sql)

const remove = `-- 0063b NAMUNA (demo) kontentni olib tashlash.
-- QO‘LDA QO‘LLANADI — faqat Ibrohim roziligi bilan. Faqat is_demo = true va egasi yo‘q qatorlarni o‘chiradi.
-- Haqiqiy e’lonlar, StomaHub Market mahsulotlari va buyurtmalarga tegmaydi. Qayta ishga tushirish xavfsiz.

delete from public.catalog_items
 where is_demo = true
   and owner_id is null
   and kind in ('uniform', 'master', 'surplus', 'ad');

-- is_demo ustuni va catalog_items_demo_guard qoldiriladi (zararsiz; keyingi namunalar uchun ham kerak).
-- Tekshiruv (kutilgan: 0 qator):
-- select kind, count(*) from public.catalog_items where is_demo group by kind;
`
writeFileSync(new URL('../../supabase/migrations/0063b_remove_demo_content.sql', import.meta.url), remove)
console.log('rows', rows.length, counts)
