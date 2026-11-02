-- 0043 — Sotuvchi reklamasi (real): moderatsiya, server-tomon validatsiya,
-- “To‘ldirish so‘rovi” (naqd / bank o‘tkazma, admin tasdiqlaydi), xaridor
-- joylashuvlari (qidiruv / bosh sahifa banneri / kategoriya) va xavfsiz kuzatuv.
--
-- Platforma faqat naqd; komissiya 12% (bu migratsiya komissiyaga tegmaydi).
-- seller_wallet() ga TEGILMAYDI (0039 / 0042 escrow bilan to‘qnashmaslik uchun):
-- yangi so‘rovlar alohida jadvalda (seller_ad_topup_requests) turadi, shuning uchun
-- ular hamyondan hech narsa ayirmaydi. Eski seller_ad_topups (hamyondan o‘tkazma)
-- faqat o‘qish uchun qoladi va balansda hisobga olinadi.
--
-- Hech qanday mahsulot / buyurtma o‘chirilmaydi.

-- ---------------------------------------------------------------------------
-- 0. Yordamchilar
-- ---------------------------------------------------------------------------
create or replace function public.ads_today()
returns date language sql stable set search_path = public as $$
  select (now() at time zone 'Asia/Tashkent')::date
$$;
grant execute on function public.ads_today() to anon, authenticated;

-- Bitta bosish narxi (so‘m) va minimal limitlar — bir joyda.
create or replace function public.ads_cfg(p_key text)
returns numeric language sql immutable as $$
  select case p_key
    when 'click_cost'   then 1000
    when 'min_daily'    then 10000
    when 'min_total'    then 50000
    when 'min_topup'    then 50000
    when 'max_topup'    then 100000000
    when 'max_products' then 20
    when 'max_days'     then 90
  end::numeric
$$;
grant execute on function public.ads_cfg(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1. Kampaniya: yangi ustunlar va holatlar
-- ---------------------------------------------------------------------------
alter table public.seller_campaigns
  add column if not exists approved_at timestamptz,
  add column if not exists pause_reason text not null default '',
  add column if not exists updated_at timestamptz not null default now(),
  -- Banner matnlari (faqat kind='banner' uchun majburiy sarlavha)
  add column if not exists headline text not null default '',
  add column if not exists body_text text not null default '',
  add column if not exists cta_text text not null default 'Ko‘rish';

alter table public.seller_campaigns drop constraint if exists seller_campaigns_status_check;
alter table public.seller_campaigns add constraint seller_campaigns_status_check
  check (status in ('moderatsiyada', 'faol', 'toxtatilgan', 'rad_etilgan', 'yakunlangan'));
alter table public.seller_campaigns alter column status set default 'moderatsiyada';

-- Mavjud “faol/to‘xtatilgan” kampaniyalar ilgari moderatsiyasiz faol bo‘lgan:
-- ularni qayta ko‘rib chiqishga yuboramiz (o‘chirilmaydi).
update public.seller_campaigns
   set status = 'moderatsiyada', approved_at = null
 where status in ('faol', 'toxtatilgan') and approved_at is null and reviewed_at is null;
-- Admin avval tasdiqlaganlar — tasdiqlangan deb belgilanadi.
update public.seller_campaigns
   set approved_at = reviewed_at
 where approved_at is null and reviewed_at is not null and status = 'faol';
-- Avval “rad etish” toxtatilgan + sabab bilan saqlangan edi.
update public.seller_campaigns
   set status = 'rad_etilgan'
 where status = 'toxtatilgan' and reject_reason <> '' and approved_at is null;

create index if not exists seller_campaigns_live_idx on public.seller_campaigns (kind, status) where status = 'faol';

-- ---------------------------------------------------------------------------
-- 2. Guard trigger: sotuvchi faqat ruxsat etilgan narsani o‘zgartiradi
-- ---------------------------------------------------------------------------
create or replace function public.seller_campaign_validate(c public.seller_campaigns)
returns void language plpgsql stable set search_path = public as $$
declare v_bad int; v_n int := coalesce(cardinality(c.product_ids), 0);
begin
  if length(trim(coalesce(c.title, ''))) < 3 then raise exception 'Kampaniya nomini kiriting (kamida 3 belgi)'; end if;
  if length(c.title) > 120 then raise exception 'Kampaniya nomi juda uzun'; end if;
  if length(coalesce(c.description, '')) > 1000 then raise exception 'Tavsif juda uzun'; end if;
  if v_n = 0 then raise exception 'Kamida bitta mahsulot tanlang'; end if;
  if v_n > public.ads_cfg('max_products') then raise exception 'Bitta kampaniyada ko‘pi bilan 20 ta mahsulot'; end if;
  select count(*) into v_bad from unnest(c.product_ids) pid
   where not exists (select 1 from public.seller_products p
                      where p.id = pid and p.seller_id = c.seller_id and p.status = 'active'
                        and not coalesce(p.is_test, false));
  if v_bad > 0 then raise exception 'Faqat o‘zingizning sotuvdagi (faol) mahsulotlaringizni reklama qilish mumkin'; end if;
  if c.daily_budget < public.ads_cfg('min_daily') then raise exception 'Kunlik byudjet kamida 10 000 so‘m bo‘lishi kerak'; end if;
  if c.total_budget is null or c.total_budget < public.ads_cfg('min_total') then raise exception 'Umumiy byudjet kamida 50 000 so‘m bo‘lishi kerak'; end if;
  if c.total_budget < c.daily_budget then raise exception 'Umumiy byudjet kunlik byudjetdan kam bo‘lmasin'; end if;
  if c.starts_on is null or c.ends_on is null then raise exception 'Boshlanish va tugash sanasini tanlang'; end if;
  if c.ends_on < c.starts_on then raise exception 'Tugash sanasi boshlanish sanasidan oldin bo‘lishi mumkin emas'; end if;
  if c.ends_on - c.starts_on + 1 > public.ads_cfg('max_days') then raise exception 'Kampaniya muddati ko‘pi bilan 90 kun'; end if;
  if c.image_url <> '' and c.image_url !~ '^https://' then raise exception 'Rasm havolasi noto‘g‘ri'; end if;
  if length(coalesce(c.headline, '')) > 50 then raise exception 'Sarlavha ko‘pi bilan 50 belgi'; end if;
  if length(coalesce(c.body_text, '')) > 100 then raise exception 'Qisqa matn ko‘pi bilan 100 belgi'; end if;
  if length(coalesce(c.cta_text, '')) > 20 then raise exception 'Tugma yozuvi ko‘pi bilan 20 belgi'; end if;
  if c.kind = 'banner' then
    if coalesce(c.image_url, '') = '' then raise exception 'Banner uchun rasm majburiy (1200×400)'; end if;
    if length(trim(coalesce(c.headline, ''))) < 2 then raise exception 'Banner uchun sarlavha kiriting'; end if;
  end if;
end $$;

create or replace function public.seller_campaign_guard()
returns trigger language plpgsql set search_path = public as $$
declare v_content boolean; v_today date := public.ads_today();
begin
  -- Ishonchli kontekst: SECURITY DEFINER funksiyalar (admin RPC, kuzatuv) va server.
  if current_user in ('postgres', 'service_role', 'supabase_admin') then return new; end if;

  if tg_op = 'INSERT' then
    new.seller_id := auth.uid();
    new.status := 'moderatsiyada';
    new.approved_at := null; new.reviewed_at := null; new.reviewed_by := null;
    new.reject_reason := ''; new.pause_reason := '';
    new.product_id := new.product_ids[1];
    if new.starts_on is null or new.starts_on < v_today then raise exception 'Boshlanish sanasi bugundan oldin bo‘lishi mumkin emas'; end if;
    new.days := least(90, greatest(1, coalesce(new.ends_on - new.starts_on + 1, 1)));
    new.updated_at := now();
    perform public.seller_campaign_validate(new);
    return new;
  end if;

  -- UPDATE
  if new.seller_id <> old.seller_id then raise exception 'Ruxsat yo‘q'; end if;
  if new.approved_at is distinct from old.approved_at or new.reviewed_at is distinct from old.reviewed_at
     or new.reviewed_by is distinct from old.reviewed_by or new.reject_reason is distinct from old.reject_reason
     or new.pause_reason is distinct from old.pause_reason and new.status = old.status then
    raise exception 'Bu maydonlarni faqat administrator o‘zgartiradi';
  end if;
  if old.status = 'yakunlangan' then raise exception 'Yakunlangan kampaniyani o‘zgartirib bo‘lmaydi'; end if;

  v_content := new.title is distinct from old.title or new.description is distinct from old.description
            or new.image_url is distinct from old.image_url or new.kind is distinct from old.kind
            or new.product_ids is distinct from old.product_ids or new.region is distinct from old.region
            or new.headline is distinct from old.headline or new.body_text is distinct from old.body_text
            or new.cta_text is distinct from old.cta_text;

  if new.starts_on is distinct from old.starts_on and new.starts_on < v_today then
    raise exception 'Boshlanish sanasi bugundan oldin bo‘lishi mumkin emas';
  end if;
  new.product_id := new.product_ids[1];
  new.days := least(90, greatest(1, coalesce(new.ends_on - new.starts_on + 1, 1)));
  new.updated_at := now();
  perform public.seller_campaign_validate(new);

  if v_content then
    -- Kontent o‘zgardi → qayta moderatsiya.
    new.status := 'moderatsiyada';
    new.approved_at := null; new.reject_reason := ''; new.pause_reason := '';
    return new;
  end if;

  if new.status is distinct from old.status then
    if new.status = 'yakunlangan' then
      new.pause_reason := '';
    elsif old.status = 'faol' and new.status = 'toxtatilgan' then
      new.pause_reason := '';
    elsif old.status = 'toxtatilgan' and new.status = 'faol' then
      if old.approved_at is null then raise exception 'Kampaniya hali tasdiqlanmagan'; end if;
      if old.pause_reason = 'Administrator to‘xtatdi' then raise exception 'Kampaniyani administrator to‘xtatgan — qo‘llab-quvvatlash xizmatiga yozing'; end if;
      if new.ends_on < v_today then raise exception 'Kampaniya muddati tugagan — sanani uzaytiring'; end if;
      if public.seller_ad_balance(new.seller_id) < public.ads_cfg('click_cost') then raise exception 'Reklama balansi yetarli emas — avval hisobni to‘ldiring'; end if;
      new.pause_reason := '';
    else
      raise exception 'Bu holatni o‘zgartirib bo‘lmaydi';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists seller_campaigns_guard on public.seller_campaigns;
create trigger seller_campaigns_guard before insert or update on public.seller_campaigns
  for each row execute function public.seller_campaign_guard();

-- Sarflangan kampaniyani o‘chirish balansni “qaytarib” yuborardi — taqiqlanadi.
create or replace function public.seller_campaign_delete_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then return old; end if;
  if old.approved_at is not null or exists (select 1 from public.seller_ad_stats s where s.campaign_id = old.id) then
    raise exception 'Ishlagan kampaniyani o‘chirib bo‘lmaydi — uni yakunlang';
  end if;
  return old;
end $$;
drop trigger if exists seller_campaigns_delete_guard on public.seller_campaigns;
create trigger seller_campaigns_delete_guard before delete on public.seller_campaigns
  for each row execute function public.seller_campaign_delete_guard();

-- ---------------------------------------------------------------------------
-- 3. Statistika va eski to‘ldirishlar: sotuvchi endi yoza olmaydi
-- ---------------------------------------------------------------------------
drop policy if exists seller_ad_stats_own_write on public.seller_ad_stats;
revoke insert, update, delete on public.seller_ad_stats from anon, authenticated;

drop policy if exists seller_ad_topups_own_write on public.seller_ad_topups;
drop policy if exists seller_ad_topups_insert on public.seller_ad_topups;
revoke insert, update, delete on public.seller_ad_topups from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. To‘ldirish so‘rovi (naqd / bank o‘tkazma) — faqat admin tasdiqlaydi
-- ---------------------------------------------------------------------------
create table if not exists public.seller_ad_topup_requests (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  amount numeric(14,0) not null check (amount > 0),
  method text not null check (method in ('naqd', 'bank', 'click')),
  receipt_url text not null default '',
  note text not null default '',
  status text not null default 'kutilmoqda' check (status in ('kutilmoqda', 'tasdiqlandi', 'rad_etildi')),
  reject_reason text not null default '',
  provider_ref text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists seller_ad_topup_requests_seller_idx on public.seller_ad_topup_requests (seller_id, created_at desc);
create index if not exists seller_ad_topup_requests_status_idx on public.seller_ad_topup_requests (status, created_at desc);
create unique index if not exists seller_ad_topup_requests_provider_ref_uidx on public.seller_ad_topup_requests (provider_ref) where provider_ref is not null;

alter table public.seller_ad_topup_requests enable row level security;
drop policy if exists seller_ad_topup_requests_own_read on public.seller_ad_topup_requests;
create policy seller_ad_topup_requests_own_read on public.seller_ad_topup_requests
  for select to authenticated using (seller_id = auth.uid());
-- Yozish faqat RPC orqali.
revoke insert, update, delete on public.seller_ad_topup_requests from anon, authenticated;
grant select on public.seller_ad_topup_requests to authenticated;

-- Kelajakdagi Click to‘lovi uchun bayroq (hozircha o‘chiq).
create or replace function public.ads_click_topup_enabled()
returns boolean language sql immutable as $$ select false $$;
grant execute on function public.ads_click_topup_enabled() to authenticated;

create or replace function public.seller_ad_topup_request(p_amount numeric, p_method text, p_receipt_url text default '', p_note text default '')
returns public.seller_ad_topup_requests language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r public.seller_ad_topup_requests; v_url text := trim(coalesce(p_receipt_url, ''));
begin
  if me is null or not public.is_seller() then raise exception 'Faqat sotuvchilar uchun'; end if;
  if p_method not in ('naqd', 'bank') then
    if p_method = 'click' and public.ads_click_topup_enabled() then
      raise exception 'Click orqali to‘ldirish to‘lov sahifasi orqali amalga oshiriladi';
    end if;
    raise exception 'To‘lov usulini tanlang: naqd yoki bank o‘tkazma';
  end if;
  if p_amount is null or p_amount <> round(p_amount) then raise exception 'Summani to‘g‘ri kiriting'; end if;
  if p_amount < public.ads_cfg('min_topup') then raise exception 'Eng kam summa — 50 000 so‘m'; end if;
  if p_amount > public.ads_cfg('max_topup') then raise exception 'Summa juda katta'; end if;
  if v_url <> '' and position('/storage/v1/object/public/seller-media/' || me::text || '/' in v_url) = 0 then
    raise exception 'Chek rasmi noto‘g‘ri yuklangan';
  end if;
  if (select count(*) from public.seller_ad_topup_requests where seller_id = me and status = 'kutilmoqda') >= 3 then
    raise exception 'Sizda 3 ta ko‘rib chiqilmagan so‘rov bor — admin tasdiqlashini kuting';
  end if;
  insert into public.seller_ad_topup_requests (seller_id, amount, method, receipt_url, note)
  values (me, p_amount, p_method, v_url, left(trim(coalesce(p_note, '')), 500))
  returning * into r;
  return r;
end $$;
revoke all on function public.seller_ad_topup_request(numeric, text, text, text) from public, anon;
grant execute on function public.seller_ad_topup_request(numeric, text, text, text) to authenticated;

-- Sotuvchi o‘z kutilayotgan so‘rovini bekor qilishi mumkin.
create or replace function public.seller_ad_topup_cancel(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.seller_ad_topup_requests set status = 'rad_etildi', reject_reason = 'Sotuvchi bekor qildi', reviewed_at = now()
   where id = p_id and seller_id = auth.uid() and status = 'kutilmoqda';
  if not found then raise exception 'So‘rov topilmadi yoki allaqachon ko‘rib chiqilgan'; end if;
end $$;
revoke all on function public.seller_ad_topup_cancel(uuid) from public, anon;
grant execute on function public.seller_ad_topup_cancel(uuid) to authenticated;

-- Balans = eski o‘tkazmalar + TASDIQLANGAN so‘rovlar − sarf.
create or replace function public.seller_ad_balance(p_seller uuid default auth.uid())
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce((select sum(amount) from public.seller_ad_topups where seller_id = p_seller), 0)
       + coalesce((select sum(amount) from public.seller_ad_topup_requests where seller_id = p_seller and status = 'tasdiqlandi'), 0)
       - coalesce((select sum(spent) from public.seller_ad_stats where seller_id = p_seller), 0);
$$;
revoke all on function public.seller_ad_balance(uuid) from public, anon;
grant execute on function public.seller_ad_balance(uuid) to authenticated;

-- Admin: so‘rovlar ro‘yxati va ko‘rib chiqish.
create or replace function public.admin_ad_topups_list(p_status text default 'kutilmoqda', p_page int default 1, p_page_size int default 20)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_page int := greatest(1, coalesce(p_page, 1)); v_size int := least(50, greatest(1, coalesce(p_page_size, 20)));
  v_rows jsonb; v_counts jsonb; v_total bigint;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select jsonb_build_object('all', count(*),
    'kutilmoqda', count(*) filter (where status = 'kutilmoqda'),
    'tasdiqlandi', count(*) filter (where status = 'tasdiqlandi'),
    'rad_etildi', count(*) filter (where status = 'rad_etildi'),
    'pending_sum', coalesce(sum(amount) filter (where status = 'kutilmoqda'), 0))
    into v_counts from public.seller_ad_topup_requests;
  select count(*) into v_total from public.seller_ad_topup_requests where p_status = 'all' or status = p_status;
  select coalesce(jsonb_agg(row_to_json(x)::jsonb), '[]'::jsonb) into v_rows from (
    select t.id, t.amount, t.method, t.receipt_url, t.note, t.status, t.reject_reason, t.created_at, t.reviewed_at,
           s.id as seller_id, coalesce(nullif(s.shop_name, ''), s.name) as shop_name, s.city,
           public.admin_mask_phone(s.phone) as phone, public.seller_ad_balance(s.id) as balance
      from public.seller_ad_topup_requests t join public.profiles s on s.id = t.seller_id
     where p_status = 'all' or t.status = p_status
     order by (t.status = 'kutilmoqda') desc, t.created_at desc
     limit v_size offset (v_page - 1) * v_size) x;
  return jsonb_build_object('total', v_total, 'counts', v_counts, 'page', v_page, 'page_size', v_size, 'rows', v_rows);
end $$;
revoke all on function public.admin_ad_topups_list(text, int, int) from public, anon;
grant execute on function public.admin_ad_topups_list(text, int, int) to authenticated;

create or replace function public.admin_review_ad_topup(p_id uuid, p_action text, p_reason text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.seller_ad_topup_requests;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  if p_action not in ('confirm', 'reject') then raise exception 'Noto‘g‘ri amal'; end if;
  if p_action = 'reject' and length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'Rad etish sababini yozing'; end if;
  select * into r from public.seller_ad_topup_requests where id = p_id for update;
  if r.id is null then raise exception 'So‘rov topilmadi'; end if;
  if r.status <> 'kutilmoqda' then raise exception 'So‘rov allaqachon ko‘rib chiqilgan'; end if;
  if r.seller_id = auth.uid() then raise exception 'O‘z so‘rovingizni tasdiqlay olmaysiz'; end if;
  update public.seller_ad_topup_requests set
    status = case p_action when 'confirm' then 'tasdiqlandi' else 'rad_etildi' end,
    reject_reason = case when p_action = 'reject' then left(trim(p_reason), 500) else '' end,
    reviewed_at = now(), reviewed_by = auth.uid()
   where id = p_id;
  -- Balans tugab to‘xtagan kampaniyalarni qayta yoqamiz.
  if p_action = 'confirm' then
    update public.seller_campaigns set status = 'faol', pause_reason = ''
     where seller_id = r.seller_id and status = 'toxtatilgan' and pause_reason = 'Balans tugadi'
       and approved_at is not null and ends_on >= public.ads_today();
  end if;
  return jsonb_build_object('ok', true, 'action', p_action, 'balance', public.seller_ad_balance(r.seller_id));
end $$;
revoke all on function public.admin_review_ad_topup(uuid, text, text) from public, anon;
grant execute on function public.admin_review_ad_topup(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Admin: kampaniyalarni moderatsiya qilish
-- ---------------------------------------------------------------------------
create or replace function public.admin_review_campaign(p_id uuid, p_action text, p_reason text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare c public.seller_campaigns; v_status text; v_pause text := '';
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  if p_action not in ('approve', 'reject', 'pause') then raise exception 'Noto‘g‘ri amal'; end if;
  if p_action = 'reject' and length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'Rad etish sababini yozing'; end if;
  select * into c from public.seller_campaigns where id = p_id for update;
  if c.id is null then raise exception 'E’lon topilmadi'; end if;
  if c.status = 'yakunlangan' then raise exception 'Yakunlangan kampaniya'; end if;
  if p_action = 'approve' then
    if public.seller_ad_balance(c.seller_id) < public.ads_cfg('click_cost') then
      v_status := 'toxtatilgan'; v_pause := 'Balans tugadi';
    else v_status := 'faol'; end if;
  elsif p_action = 'reject' then v_status := 'rad_etilgan';
  else v_status := 'toxtatilgan'; v_pause := 'Administrator to‘xtatdi';
  end if;
  update public.seller_campaigns set
    status = v_status,
    pause_reason = v_pause,
    approved_at = case p_action when 'approve' then now() when 'reject' then null else approved_at end,
    reject_reason = case when p_action = 'reject' then left(trim(p_reason), 500) when p_action = 'approve' then '' else reject_reason end,
    reviewed_at = now(), reviewed_by = auth.uid(), updated_at = now()
  where id = p_id;
  return jsonb_build_object('ok', true, 'action', p_action, 'status', v_status, 'pause_reason', v_pause);
end $$;
revoke all on function public.admin_review_campaign(uuid, text, text) from public, anon;
grant execute on function public.admin_review_campaign(uuid, text, text) to authenticated;

create or replace function public.admin_campaigns_list(p_tab text default 'all', p_q text default '', p_page int default 1, p_page_size int default 10)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_page int := greatest(1, coalesce(p_page, 1));
  v_size int := least(50, greatest(1, coalesce(p_page_size, 10)));
  v_q text := lower(trim(coalesce(p_q, '')));
  v_total bigint; v_counts jsonb; v_rows jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select jsonb_build_object('all', count(*),
    'moderatsiyada', count(*) filter (where status = 'moderatsiyada'),
    'faol', count(*) filter (where status = 'faol'),
    'toxtatilgan', count(*) filter (where status = 'toxtatilgan'),
    'rad_etilgan', count(*) filter (where status = 'rad_etilgan'),
    'yakunlangan', count(*) filter (where status = 'yakunlangan'))
    into v_counts from public.seller_campaigns;
  select count(*) into v_total from public.seller_campaigns c join public.profiles s on s.id = c.seller_id
   where (p_tab = 'all' or c.status = p_tab)
     and (v_q = '' or lower(c.title) like '%'||v_q||'%' or lower(coalesce(s.shop_name, s.name, '')) like '%'||v_q||'%');
  select coalesce(jsonb_agg(row_to_json(x)::jsonb), '[]'::jsonb) into v_rows from (
    select c.id, c.title, c.status, c.kind, c.daily_budget, c.total_budget, c.days, c.starts_on, c.ends_on, c.region,
           c.created_at, c.image_url, c.headline, c.body_text, c.cta_text, c.reject_reason, c.pause_reason, c.approved_at, cardinality(c.product_ids) as products,
           s.id as seller_id, coalesce(nullif(s.shop_name, ''), s.name) as shop_name,
           s.city, public.admin_mask_phone(s.phone) as phone,
           coalesce((select sum(spent) from public.seller_ad_stats st where st.campaign_id = c.id), 0) as spent
      from public.seller_campaigns c join public.profiles s on s.id = c.seller_id
     where (p_tab = 'all' or c.status = p_tab)
       and (v_q = '' or lower(c.title) like '%'||v_q||'%' or lower(coalesce(s.shop_name, s.name, '')) like '%'||v_q||'%')
     order by (c.status = 'moderatsiyada') desc, c.created_at desc
     limit v_size offset (v_page - 1) * v_size) x;
  return jsonb_build_object('total', v_total, 'counts', v_counts, 'page', v_page, 'page_size', v_size, 'rows', v_rows);
end $$;

create or replace function public.admin_campaign_detail(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select jsonb_build_object(
    'id', c.id, 'title', c.title, 'status', c.status, 'kind', c.kind, 'daily_budget', c.daily_budget,
    'total_budget', c.total_budget, 'days', c.days, 'starts_on', c.starts_on, 'ends_on', c.ends_on, 'region', c.region,
    'description', c.description, 'image_url', c.image_url,
    'headline', c.headline, 'body_text', c.body_text, 'cta_text', c.cta_text, 'reject_reason', c.reject_reason,
    'pause_reason', c.pause_reason, 'approved_at', c.approved_at, 'reviewed_at', c.reviewed_at,
    'created_at', c.created_at, 'product_id', c.product_id,
    'balance', public.seller_ad_balance(c.seller_id),
    'stats', (select jsonb_build_object('impressions', coalesce(sum(impressions), 0), 'clicks', coalesce(sum(clicks), 0), 'spent', coalesce(sum(spent), 0))
                from public.seller_ad_stats st where st.campaign_id = c.id),
    'seller', jsonb_build_object('id', s.id, 'name', s.name, 'shop_name', s.shop_name, 'city', s.city,
      'phone', public.admin_mask_phone(s.phone), 'avatar', s.avatar),
    'product', (select jsonb_build_object('id', pr.id, 'name', pr.name, 'image_url', pr.image_url, 'price', pr.price)
                  from public.seller_products pr where pr.id = c.product_id),
    'products', coalesce((select jsonb_agg(jsonb_build_object('id', pr.id, 'name', pr.name, 'image_url', pr.image_url,
                   'price', pr.price, 'status', pr.status, 'category', pr.category))
                  from public.seller_products pr where pr.id = any (c.product_ids)), '[]'::jsonb)
  ) into v
  from public.seller_campaigns c join public.profiles s on s.id = c.seller_id
  where c.id = p_id;
  if v is null then raise exception 'E’lon topilmadi'; end if;
  return v;
end $$;

-- ---------------------------------------------------------------------------
-- 6. Xaridor joylashuvlari: mos kampaniyalar
-- ---------------------------------------------------------------------------
drop function if exists public.ads_placements(text, text, int);
create or replace function public.ads_placements(p_kind text, p_region text default null, p_limit int default 12)
returns table (campaign_id uuid, kind text, title text, description text, image_url text,
               headline text, body_text text, cta_text text,
               seller_id uuid, shop_name text, product_ids uuid[])
language sql stable security definer set search_path = public as $$
  with today as (select public.ads_today() d),
  cand as (
    select c.* from public.seller_campaigns c, today
     where c.status = 'faol' and c.approved_at is not null
       and c.kind = p_kind
       and c.starts_on <= today.d and (c.ends_on is null or c.ends_on >= today.d)
       and (c.region = 'Barcha hududlar' or p_region is null or c.region = p_region)
  )
  select c.id, c.kind, c.title, c.description, c.image_url, c.headline, c.body_text, c.cta_text, c.seller_id,
         coalesce(nullif(pr.shop_name, ''), pr.name, 'Sotuvchi'),
         array(select p.id from public.seller_products p
                where p.id = any (c.product_ids) and p.seller_id = c.seller_id
                  and p.status = 'active' and not coalesce(p.is_test, false))
    from cand c
    join public.profiles pr on pr.id = c.seller_id and not coalesce(pr.is_test, false)
   where public.seller_ad_balance(c.seller_id) >= public.ads_cfg('click_cost')
     and coalesce((select sum(spent) from public.seller_ad_stats s, today where s.campaign_id = c.id and s.day = today.d), 0)
         + public.ads_cfg('click_cost') <= c.daily_budget
     and (c.total_budget is null or coalesce((select sum(spent) from public.seller_ad_stats s where s.campaign_id = c.id), 0)
         + public.ads_cfg('click_cost') <= c.total_budget)
     and exists (select 1 from public.seller_products p where p.id = any (c.product_ids)
                  and p.seller_id = c.seller_id and p.status = 'active' and not coalesce(p.is_test, false))
   order by random()
   limit least(greatest(coalesce(p_limit, 12), 1), 30);
$$;
revoke all on function public.ads_placements(text, text, int) from public;
grant execute on function public.ads_placements(text, text, int) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Xavfsiz kuzatuv (ko‘rish / bosish)
-- ---------------------------------------------------------------------------
revoke all on function public.seller_ad_track(uuid, uuid, text) from public, anon, authenticated;

create table if not exists public.seller_ad_events (
  id bigint generated always as identity primary key,
  campaign_id uuid not null references public.seller_campaigns (id) on delete cascade,
  product_id uuid,
  event text not null check (event in ('view', 'click')),
  viewer_key text not null,
  ip_key text not null default '',
  day date not null,
  charged numeric(14,0) not null default 0,
  at timestamptz not null default now()
);
create unique index if not exists seller_ad_events_view_uidx on public.seller_ad_events (campaign_id, viewer_key, day) where event = 'view';
create index if not exists seller_ad_events_click_viewer_idx on public.seller_ad_events (viewer_key, at) where event = 'click';
create index if not exists seller_ad_events_click_ip_idx on public.seller_ad_events (ip_key, at) where event = 'click';
create index if not exists seller_ad_events_click_camp_idx on public.seller_ad_events (campaign_id, at) where event = 'click';
alter table public.seller_ad_events enable row level security;
revoke all on public.seller_ad_events from anon, authenticated;

create or replace function public.ad_track(p_campaign uuid, p_product uuid, p_event text, p_session text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  v_today date := public.ads_today();
  v_cost numeric := public.ads_cfg('click_cost');
  v_ip text; v_ipk text; v_viewer text; v_sess text := left(coalesce(p_session, ''), 64);
  c public.seller_campaigns; v_day_spent numeric; v_total_spent numeric; v_bal numeric;
  v_ins int; v_charge numeric := 0;
begin
  if p_event not in ('view', 'click') then return jsonb_build_object('ok', false); end if;
  if v_sess !~ '^[A-Za-z0-9-]{16,64}$' then v_sess := ''; end if;
  begin
    v_ip := split_part(coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', ''), ',', 1);
  exception when others then v_ip := ''; end;
  v_ipk := case when trim(v_ip) = '' then '' else md5('ip:' || trim(v_ip)) end;
  v_viewer := case when me is not null then 'u:' || me::text
                   when v_sess <> '' then 's:' || md5(v_sess || '|' || v_ipk)
                   when v_ipk <> '' then 'i:' || v_ipk
                   else '' end;
  if v_viewer = '' then return jsonb_build_object('ok', false, 'reason', 'no_viewer'); end if;

  select * into c from public.seller_campaigns where id = p_campaign;
  if c.id is null or c.status <> 'faol' or c.approved_at is null
     or c.starts_on > v_today or (c.ends_on is not null and c.ends_on < v_today) then
    return jsonb_build_object('ok', false, 'reason', 'inactive');
  end if;
  if p_product is not null and not (p_product = any (c.product_ids)) then
    return jsonb_build_object('ok', false, 'reason', 'product');
  end if;
  -- Sotuvchining o‘z ko‘rish/bosishlari hisoblanmaydi.
  if me is not null and me = c.seller_id then return jsonb_build_object('ok', true, 'own', true); end if;

  if p_event = 'view' then
    insert into public.seller_ad_events (campaign_id, product_id, event, viewer_key, ip_key, day)
    values (c.id, p_product, 'view', v_viewer, v_ipk, v_today)
    on conflict do nothing;
    get diagnostics v_ins = row_count;
    if v_ins > 0 then
      insert into public.seller_ad_stats (campaign_id, seller_id, product_id, day, impressions)
      values (c.id, c.seller_id, coalesce(p_product, '00000000-0000-0000-0000-000000000000'), v_today, 1)
      on conflict (campaign_id, day, product_id) do update set impressions = seller_ad_stats.impressions + 1;
    end if;
    return jsonb_build_object('ok', true, 'counted', v_ins > 0);
  end if;

  -- CLICK: tezlik cheklovi (bir tomoshabin / IP soatiga 30 ta bosish).
  if (select count(*) from public.seller_ad_events
       where event = 'click' and at > now() - interval '1 hour'
         and (viewer_key = v_viewer or (v_ipk <> '' and ip_key = v_ipk))) >= 30 then
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;
  -- 24 soat ichida shu kampaniyaga takroriy bosish hisoblanmaydi.
  if exists (select 1 from public.seller_ad_events
              where event = 'click' and campaign_id = c.id and at > now() - interval '24 hours'
                and (viewer_key = v_viewer or (me is null and v_ipk <> '' and ip_key = v_ipk))) then
    return jsonb_build_object('ok', true, 'counted', false);
  end if;

  -- Byudjetni bir vaqtda ikki marta sarflamaslik uchun kampaniya qatorini qulflaymiz.
  perform 1 from public.seller_campaigns where id = c.id for update;
  select coalesce(sum(spent), 0) into v_day_spent from public.seller_ad_stats where campaign_id = c.id and day = v_today;
  select coalesce(sum(spent), 0) into v_total_spent from public.seller_ad_stats where campaign_id = c.id;
  v_bal := public.seller_ad_balance(c.seller_id);

  if v_bal < v_cost then
    update public.seller_campaigns set status = 'toxtatilgan', pause_reason = 'Balans tugadi', updated_at = now() where id = c.id;
    return jsonb_build_object('ok', true, 'counted', false, 'reason', 'balance');
  end if;
  if c.total_budget is not null and v_total_spent + v_cost > c.total_budget then
    update public.seller_campaigns set status = 'yakunlangan', pause_reason = 'Umumiy byudjet tugadi', updated_at = now() where id = c.id;
    return jsonb_build_object('ok', true, 'counted', false, 'reason', 'total_budget');
  end if;
  if v_day_spent + v_cost > c.daily_budget then
    return jsonb_build_object('ok', true, 'counted', false, 'reason', 'daily_budget');
  end if;

  v_charge := v_cost;
  insert into public.seller_ad_events (campaign_id, product_id, event, viewer_key, ip_key, day, charged)
  values (c.id, p_product, 'click', v_viewer, v_ipk, v_today, v_charge);
  insert into public.seller_ad_stats (campaign_id, seller_id, product_id, day, clicks, spent)
  values (c.id, c.seller_id, coalesce(p_product, '00000000-0000-0000-0000-000000000000'), v_today, 1, v_charge)
  on conflict (campaign_id, day, product_id) do update set clicks = seller_ad_stats.clicks + 1, spent = seller_ad_stats.spent + excluded.spent;

  -- Keyingi bosishga balans yetmasa — avtomatik to‘xtatamiz.
  if v_bal - v_charge < v_cost then
    update public.seller_campaigns set status = 'toxtatilgan', pause_reason = 'Balans tugadi', updated_at = now() where id = c.id;
  elsif c.total_budget is not null and v_total_spent + v_charge + v_cost > c.total_budget then
    update public.seller_campaigns set status = 'yakunlangan', pause_reason = 'Umumiy byudjet tugadi', updated_at = now() where id = c.id;
  end if;
  return jsonb_build_object('ok', true, 'counted', true, 'charged', v_charge);
end $$;
revoke all on function public.ad_track(uuid, uuid, text, text) from public;
grant execute on function public.ad_track(uuid, uuid, text, text) to anon, authenticated;
