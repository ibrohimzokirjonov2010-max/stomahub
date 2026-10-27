-- 0015 — Click/Payme payment ledger, order tracking_url, escrow release/refund RPCs.
-- Idempotent. DO NOT apply from CI; owner applies in Supabase SQL editor.
-- Run after 0014_regular_user_real.sql.

-- ---------------------------------------------------------------------------
-- 1. seller_orders: tracking + payment/escrow columns
-- ---------------------------------------------------------------------------
alter table public.seller_orders
  add column if not exists tracking_url text not null default '';

alter table public.seller_orders
  add column if not exists payment_status text not null default 'pending';

alter table public.seller_orders
  drop constraint if exists seller_orders_payment_status_check;
alter table public.seller_orders
  add constraint seller_orders_payment_status_check
  check (payment_status in ('pending', 'paid', 'held', 'released', 'refunded', 'failed'));

alter table public.seller_orders
  add column if not exists payment_ref text not null default '';

alter table public.seller_orders
  add column if not exists escrow_released_at timestamptz;

alter table public.seller_orders
  add column if not exists escrow_released_by uuid references public.profiles (id) on delete set null;

alter table public.seller_orders
  add column if not exists escrow_refunded_at timestamptz;

alter table public.seller_orders
  add column if not exists escrow_refund_reason text not null default '';

-- Cash orders already "held" until delivery; mark existing paid card rows as paid/held.
update public.seller_orders
set payment_status = case
  when status = 'yetkazildi' then 'released'
  when status = 'bekor_qilindi' then 'refunded'
  when payment_method in ('cash', 'naqd') then 'held'
  when coalesce(payment_ref, '') <> '' then 'paid'
  else payment_status
end
where payment_status = 'pending';

-- ---------------------------------------------------------------------------
-- 2. payment_transactions — Click / Payme idempotent ledger
-- ---------------------------------------------------------------------------
create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('click', 'payme', 'demo', 'uzcard', 'humo', 'card')),
  provider_trans_id text not null default '',
  provider_prepare_id text not null default '',
  merchant_trans_id text not null,
  order_id uuid references public.seller_orders (id) on delete set null,
  registration_id text references public.registrations (id) on delete set null,
  buyer_id uuid references public.profiles (id) on delete set null,
  seller_id uuid references public.profiles (id) on delete set null,
  organizer_id uuid references public.profiles (id) on delete set null,
  amount numeric(14,0) not null check (amount >= 0),
  commission numeric(14,0) not null default 0,
  payout numeric(14,0) not null default 0,
  currency text not null default 'UZS',
  state text not null default 'created'
    check (state in ('created', 'pending', 'paid', 'cancelled', 'refunded', 'failed')),
  reason int,
  perform_time timestamptz,
  cancel_time timestamptz,
  create_time timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payment_transactions_provider_trans_uidx
  on public.payment_transactions (provider, provider_trans_id)
  where provider_trans_id <> '';

do $$ begin
  alter table public.payment_transactions
    add constraint payment_transactions_provider_merchant_uidx unique (provider, merchant_trans_id);
exception when duplicate_table or duplicate_object then null;
end $$;


create index if not exists payment_transactions_order_idx
  on public.payment_transactions (order_id);

create index if not exists payment_transactions_create_idx
  on public.payment_transactions (create_time desc);

alter table public.payment_transactions enable row level security;

drop policy if exists payment_transactions_admin_all on public.payment_transactions;
create policy payment_transactions_admin_all on public.payment_transactions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists payment_transactions_buyer_read on public.payment_transactions;
create policy payment_transactions_buyer_read on public.payment_transactions
  for select to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid() or organizer_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. Yandex tracking URL helper
-- ---------------------------------------------------------------------------
create or replace function public.is_yandex_tracking_url(p_url text)
returns boolean
language sql
immutable
as $$
  select case
    when coalesce(trim(p_url), '') = '' then true
    when lower(trim(p_url)) ~ '^https?://([a-z0-9-]+\.)*(yandex\.(uz|ru|com|com\.tr)|ya\.ru|go\.yandex|delivery\.yandex|taxi\.yandex)(/|$|\?)'
      then true
    else false
  end;
$$;

-- ---------------------------------------------------------------------------
-- 4. seller_set_tracking_url
-- ---------------------------------------------------------------------------
create or replace function public.seller_set_tracking_url(p_order uuid, p_url text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.seller_orders;
  v_url text := left(trim(coalesce(p_url, '')), 500);
begin
  if auth.uid() is null then raise exception 'Avtorizatsiya kerak'; end if;
  select * into v_order from public.seller_orders where id = p_order and seller_id = auth.uid();
  if not found then raise exception 'Buyurtma topilmadi'; end if;
  if v_order.status in ('bekor_qilindi', 'yetkazildi') then
    raise exception 'Yopilgan buyurtmaga kuzatuv havolasi qo‘yib bo‘lmaydi';
  end if;
  if v_url <> '' and not public.is_yandex_tracking_url(v_url) then
    raise exception 'Faqat Yandex (yandex.uz / yandex.ru / ya.ru / go.yandex / delivery.yandex) havolasi ruxsat etiladi';
  end if;
  update public.seller_orders
  set tracking_url = v_url, updated_at = now()
  where id = p_order;
  return jsonb_build_object('ok', true, 'tracking_url', v_url, 'id', p_order);
end;
$$;

revoke all on function public.seller_set_tracking_url(uuid, text) from public, anon;
grant execute on function public.seller_set_tracking_url(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. payment_mark_paid — used by Click/Payme serverless after confirm
-- ---------------------------------------------------------------------------
create or replace function public.payment_mark_paid(
  p_provider text,
  p_merchant_trans_id text,
  p_provider_trans_id text,
  p_amount numeric,
  p_order_id uuid default null,
  p_registration_id text default null,
  p_meta jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx public.payment_transactions;
  v_order public.seller_orders;
  v_comm numeric(14,0);
  v_payout numeric(14,0);
  v_provider text := lower(trim(coalesce(p_provider, '')));
begin
  if v_provider not in ('click', 'payme', 'demo', 'uzcard', 'humo', 'card') then
    raise exception 'Noto‘g‘ri provayder';
  end if;

  -- Idempotent: already paid with same provider_trans_id
  select * into v_tx from public.payment_transactions
  where provider = v_provider and merchant_trans_id = p_merchant_trans_id
  limit 1;

  if found and v_tx.state = 'paid' then
    return jsonb_build_object('ok', true, 'idempotent', true, 'id', v_tx.id, 'state', v_tx.state);
  end if;

  if p_order_id is not null then
    select * into v_order from public.seller_orders where id = p_order_id;
    if not found then raise exception 'Buyurtma topilmadi'; end if;
    v_comm := coalesce(v_order.commission, round(greatest(v_order.subtotal - coalesce(v_order.discount_amount, 0), 0) * 0.12));
    v_payout := coalesce(v_order.payout, greatest(v_order.subtotal - coalesce(v_order.discount_amount, 0), 0) - v_comm + coalesce(v_order.delivery_fee, 0));
    if p_amount is not null and p_amount > 0 and abs(p_amount - (v_order.subtotal - coalesce(v_order.discount_amount, 0) + coalesce(v_order.delivery_fee, 0))) > 1 then
      raise exception 'Summa mos kelmaydi';
    end if;
  else
    v_comm := round(coalesce(p_amount, 0) * 0.12);
    v_payout := coalesce(p_amount, 0) - v_comm;
  end if;

  if found then
    update public.payment_transactions set
      provider_trans_id = coalesce(nullif(p_provider_trans_id, ''), provider_trans_id),
      amount = coalesce(p_amount, amount),
      commission = v_comm,
      payout = v_payout,
      state = 'paid',
      perform_time = now(),
      order_id = coalesce(p_order_id, order_id),
      registration_id = coalesce(p_registration_id, registration_id),
      meta = coalesce(meta, '{}'::jsonb) || coalesce(p_meta, '{}'::jsonb),
      updated_at = now()
    where id = v_tx.id
    returning * into v_tx;
  else
    insert into public.payment_transactions (
      provider, provider_trans_id, merchant_trans_id, order_id, registration_id,
      buyer_id, seller_id, organizer_id, amount, commission, payout, state, perform_time, meta
    ) values (
      v_provider, coalesce(p_provider_trans_id, ''), p_merchant_trans_id, p_order_id, p_registration_id,
      v_order.buyer_id, v_order.seller_id, null, coalesce(p_amount, 0), v_comm, v_payout, 'paid', now(), coalesce(p_meta, '{}'::jsonb)
    ) returning * into v_tx;
  end if;

  if p_order_id is not null then
    update public.seller_orders set
      payment_status = 'paid',
      payment_ref = left(coalesce(nullif(p_provider_trans_id, ''), p_merchant_trans_id), 64),
      payment_method = case
        when payment_method in ('cash', 'naqd') then v_provider
        else payment_method
      end,
      updated_at = now()
    where id = p_order_id;
  end if;

  -- Seminar registration: mark paid + credit organizer wallet via payments row if present
  if p_registration_id is not null then
    update public.registrations
    set pay = 'paid'
    where id = p_registration_id and coalesce(pay, '') <> 'paid';
  end if;

  return jsonb_build_object(
    'ok', true, 'id', v_tx.id, 'state', 'paid',
    'commission', v_comm, 'payout', v_payout, 'order_id', p_order_id
  );
end;
$$;

revoke all on function public.payment_mark_paid(text, text, text, numeric, uuid, text, jsonb) from public, anon;
-- Only service role / SECURITY DEFINER callers invoke this from serverless.

-- ---------------------------------------------------------------------------
-- 6. admin_escrow_release / admin_escrow_refund
-- ---------------------------------------------------------------------------
create or replace function public.admin_escrow_release(p_order uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.seller_orders;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select * into v_order from public.seller_orders where id = p_order;
  if not found then raise exception 'Buyurtma topilmadi'; end if;
  if v_order.status = 'bekor_qilindi' then raise exception 'Bekor qilingan buyurtmani chiqarib bo‘lmaydi'; end if;
  if v_order.payment_status = 'released' and v_order.status = 'yetkazildi' then
    return jsonb_build_object('ok', true, 'idempotent', true, 'id', p_order, 'status', v_order.status, 'payment_status', v_order.payment_status);
  end if;

  update public.seller_orders set
    status = case when status <> 'yetkazildi' then 'yetkazildi' else status end,
    payment_status = 'released',
    escrow_released_at = now(),
    escrow_released_by = auth.uid(),
    updated_at = now()
  where id = p_order
  returning * into v_order;

  update public.payment_transactions
  set state = 'paid', updated_at = now()
  where order_id = p_order and state in ('pending', 'paid', 'created');

  return jsonb_build_object(
    'ok', true, 'id', v_order.id, 'code', v_order.code,
    'status', v_order.status, 'payment_status', v_order.payment_status,
    'payout', v_order.payout, 'commission', v_order.commission,
    'released_at', v_order.escrow_released_at
  );
end;
$$;

create or replace function public.admin_escrow_refund(p_order uuid, p_reason text default '')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.seller_orders;
  v_reason text := left(trim(coalesce(p_reason, '')), 300);
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select * into v_order from public.seller_orders where id = p_order;
  if not found then raise exception 'Buyurtma topilmadi'; end if;
  if v_order.payment_status = 'released' then
    raise exception 'Chiqarilgan escrowni qaytarib bo‘lmaydi';
  end if;
  if v_order.payment_status = 'refunded' then
    return jsonb_build_object('ok', true, 'idempotent', true, 'id', p_order);
  end if;

  update public.seller_orders set
    status = 'bekor_qilindi',
    cancel_reason = case when v_reason = '' then 'Admin escrow refund' else v_reason end,
    payment_status = 'refunded',
    escrow_refunded_at = now(),
    escrow_refund_reason = case when v_reason = '' then 'Admin escrow refund' else v_reason end,
    updated_at = now()
  where id = p_order
  returning * into v_order;

  update public.payment_transactions
  set state = 'refunded', cancel_time = now(), reason = 5, updated_at = now()
  where order_id = p_order and state in ('pending', 'paid', 'created');

  return jsonb_build_object(
    'ok', true, 'id', v_order.id, 'code', v_order.code,
    'status', v_order.status, 'payment_status', v_order.payment_status
  );
end;
$$;

revoke all on function public.admin_escrow_release(uuid) from public, anon;
revoke all on function public.admin_escrow_refund(uuid, text) from public, anon;
grant execute on function public.admin_escrow_release(uuid) to authenticated;
grant execute on function public.admin_escrow_refund(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Enrich admin_escrow / admin_order_detail with payment_status + tracking
-- ---------------------------------------------------------------------------
create or replace function public.admin_escrow(p_page int default 1, p_page_size int default 10, p_q text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_page int := greatest(1, coalesce(p_page, 1));
  v_size int := least(50, greatest(1, coalesce(p_page_size, 10)));
  v_off int := (v_page - 1) * v_size;
  v_q text := lower(trim(coalesce(p_q, '')));
  v_total bigint; v_rows jsonb; v_sum jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select jsonb_build_object(
    'held', coalesce((select sum(payout) from public.seller_orders where payment_status in ('paid','held','pending') and status in ('yangi','tasdiqlandi','tayyorlanmoqda','yetkazilmoqda')), 0),
    'released', coalesce((select sum(payout) from public.seller_orders where payment_status = 'released' or status = 'yetkazildi'), 0),
    'commission', coalesce((select sum(commission) from public.seller_orders where status <> 'bekor_qilindi'), 0),
    'orders_held', coalesce((select count(*) from public.seller_orders where payment_status in ('paid','held','pending') and status in ('yangi','tasdiqlandi','tayyorlanmoqda','yetkazilmoqda')), 0)
  ) into v_sum;

  select count(*) into v_total from public.seller_orders o
  where o.status in ('yangi','tasdiqlandi','tayyorlanmoqda','yetkazilmoqda','yetkazildi')
    and (v_q = '' or lower(o.code) like '%'||v_q||'%');

  select coalesce(jsonb_agg(row_to_json(x)::jsonb), '[]'::jsonb) into v_rows from (
    select o.id, o.code, o.status, o.subtotal, o.commission, o.payout, o.payment_method,
           o.payment_status, o.payment_ref, o.tracking_url, o.customer_name, o.address, o.city,
           o.created_at, o.escrow_released_at,
           coalesce(nullif(s.shop_name,''), s.name) as shop_name,
           public.admin_mask_phone(o.customer_phone) as customer_phone
    from public.seller_orders o
    join public.profiles s on s.id = o.seller_id
    where o.status in ('yangi','tasdiqlandi','tayyorlanmoqda','yetkazilmoqda','yetkazildi')
      and (v_q = '' or lower(o.code) like '%'||v_q||'%' or lower(coalesce(s.shop_name,s.name,'')) like '%'||v_q||'%')
    order by o.created_at desc
    limit v_size offset v_off
  ) x;

  return jsonb_build_object('summary', v_sum, 'total', v_total, 'page', v_page, 'page_size', v_size, 'rows', v_rows);
end $$;

grant execute on function public.admin_escrow(int, int, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. buyer_create_order: stash payment_ref + set payment_status (based on 0013)
-- ---------------------------------------------------------------------------
create or replace function public.buyer_create_order(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_item jsonb; v_p public.seller_products; v_var jsonb; v_qty int; v_price numeric;
  v_order uuid; v_orders jsonb := '[]'::jsonb; v_seller uuid; v_code text;
  v_name text := trim(coalesce(payload->>'name', '')); v_phone text := regexp_replace(coalesce(payload->>'phone', ''), '\D', '', 'g');
  v_method text := coalesce(nullif(payload->>'delivery_method', ''), 'kuryer');
  v_pay text := lower(coalesce(nullif(trim(payload->>'payment_method'), ''), 'cash'));
  v_demo_ref text := left(coalesce(payload->>'payment_ref', ''), 64);
  v_pay_status text;
begin
  if v_uid is null then raise exception 'Buyurtma berish uchun hisobingizga kiring'; end if;
  if v_pay in ('naqd') then v_pay := 'cash'; end if;
  if v_pay not in ('cash', 'uzcard', 'humo', 'click', 'payme', 'card') then
    raise exception 'To''lov usuli qo''llab-quvvatlanmaydi';
  end if;
  if length(v_name) < 2 then raise exception 'Ism familiyani kiriting'; end if;
  if length(v_phone) < 9 then raise exception 'Telefon raqam noto''g''ri'; end if;
  if v_method not in ('kuryer', 'olib_ketish') then raise exception 'Yetkazish usuli noto''g''ri'; end if;
  if v_method = 'kuryer' and length(trim(coalesce(payload->>'address', ''))) < 3 then raise exception 'Manzilni kiriting'; end if;
  if jsonb_typeof(payload->'items') <> 'array' or jsonb_array_length(payload->'items') = 0 then raise exception 'Savat bo''sh'; end if;
  if jsonb_array_length(payload->'items') > 50 then raise exception 'Savatda juda ko''p mahsulot'; end if;

  v_pay_status := case
    when v_pay = 'cash' then 'held'
    when v_demo_ref <> '' then 'paid'
    else 'pending'
  end;

  for v_seller in
    select distinct p.seller_id from jsonb_array_elements(payload->'items') i
      join public.seller_products p on p.id = (i->>'product_id')::uuid
  loop
    if v_seller = v_uid then raise exception 'O''z mahsulotingizni buyurtma qila olmaysiz'; end if;
    insert into public.seller_orders (
      seller_id, buyer_id, customer_name, customer_phone, city, address, note,
      delivery_method, source, payment_method, payment_ref, payment_status
    )
    values (
      v_seller, v_uid, v_name, '+998' || right(v_phone, 9), coalesce(payload->>'city', ''),
      case when v_method = 'kuryer' then trim(payload->>'address') else 'Sotuvchidan olib ketish' end,
      left(coalesce(payload->>'note', '') || case when v_demo_ref <> '' then E'\n[pay:' || v_demo_ref || ']' else '' end, 500),
      v_method, 'marketplace', v_pay, v_demo_ref, v_pay_status
    )
    returning id, code into v_order, v_code;
    v_orders := v_orders || jsonb_build_object(
      'id', v_order, 'code', v_code, 'seller_id', v_seller,
      'payment_method', v_pay, 'payment_status', v_pay_status
    );
  end loop;

  for v_item in select * from jsonb_array_elements(payload->'items') loop
    select * into v_p from public.seller_products where id = (v_item->>'product_id')::uuid for update;
    if v_p.id is null or v_p.status <> 'active' then raise exception 'Mahsulot sotuvda emas'; end if;
    v_qty := coalesce((v_item->>'qty')::int, 0);
    if v_qty < 1 or v_qty > 999 then raise exception 'Miqdor noto''g''ri: %', v_p.name; end if;
    v_price := v_p.price; v_var := null;
    if nullif(v_item->>'variant', '') is not null then
      select v into v_var from jsonb_array_elements(v_p.variants) v where v->>'sku' = v_item->>'variant' limit 1;
      if v_var is null then raise exception 'Variant topilmadi: %', v_p.name; end if;
      if coalesce((v_var->>'stock')::int, 0) < v_qty then raise exception '% zaxirada yetarli emas', v_p.name; end if;
      v_price := coalesce(nullif(v_var->>'price', '')::numeric, v_p.price);
      update public.seller_products set variants = (select jsonb_agg(case when v->>'sku' = v_item->>'variant'
        then jsonb_set(v, '{stock}', to_jsonb(coalesce((v->>'stock')::int, 0) - v_qty)) else v end) from jsonb_array_elements(variants) v)
      where id = v_p.id;
    else
      if jsonb_typeof(v_p.variants) = 'array' and jsonb_array_length(v_p.variants) > 0 then raise exception 'Variantni tanlang: %', v_p.name; end if;
      if v_p.stock < v_qty then raise exception '% zaxirada yetarli emas (bor: %)', v_p.name, v_p.stock; end if;
      update public.seller_products set stock = stock - v_qty where id = v_p.id;
    end if;
    insert into public.seller_order_items (order_id, seller_id, product_id, name, variant, image_url, qty, price)
    select (o->>'id')::uuid, v_p.seller_id, v_p.id, v_p.name, coalesce(v_item->>'variant', ''), v_p.image_url, v_qty, v_price
      from jsonb_array_elements(v_orders) o where (o->>'seller_id')::uuid = v_p.seller_id;
  end loop;

  -- payment ledger rows (one per seller order)
  insert into public.payment_transactions (
    provider, provider_trans_id, merchant_trans_id, order_id, buyer_id, seller_id,
    amount, commission, payout, state, perform_time, meta
  )
  select
    case when v_pay = 'cash' then 'demo' else v_pay end,
    case when v_pay_status = 'paid' then v_demo_ref else '' end,
    coalesce(nullif(v_demo_ref, ''), o.code),
    o.id, v_uid, o.seller_id,
    greatest(o.subtotal - coalesce(o.discount_amount, 0), 0) + coalesce(o.delivery_fee, 0),
    o.commission, o.payout,
    case when v_pay_status = 'paid' then 'paid' when v_pay = 'cash' then 'pending' else 'created' end,
    case when v_pay_status = 'paid' then now() else null end,
    jsonb_build_object('source', 'buyer_create_order')
  from public.seller_orders o
  where o.id in (select (x->>'id')::uuid from jsonb_array_elements(v_orders) x);

  insert into public.customer_notifications (user_id, kind, title, body, link)
  select v_uid, 'order', 'Buyurtma qabul qilindi',
    'Buyurtma ' || (o->>'code') || ' · to''lov: ' || upper(v_pay) || ' · sotuvchiga yuborildi',
    '/profil/buyurtmalar'
    from jsonb_array_elements(v_orders) o;

  insert into public.customer_notifications (user_id, kind, title, body, link)
  select (o->>'seller_id')::uuid, 'order', 'Yangi buyurtma',
    'Buyurtma ' || (o->>'code') || ' qabul qilindi · ' || upper(v_pay),
    '/sotuvchi/buyurtmalar'
    from jsonb_array_elements(v_orders) o;

  return jsonb_build_object(
    'orders', v_orders, 'payment_method', v_pay,
    'payment_ref', v_demo_ref, 'payment_status', v_pay_status
  );
end $$;
revoke all on function public.buyer_create_order(jsonb) from public, anon;
grant execute on function public.buyer_create_order(jsonb) to authenticated;

comment on function public.buyer_create_order(jsonb) is
  'Marketplace checkout. Cash + demo/live card (uzcard/humo/click/payme/card). Writes payment_transactions. Commission 12%.';

comment on function public.payment_mark_paid(text, text, text, numeric, uuid, text, jsonb) is
  'Idempotent confirm for Click/Payme/demo. Marks seller_orders.payment_status=paid and takes 12% commission into ledger.';

comment on function public.admin_escrow_release(uuid) is
  'Admin releases escrow: status→yetkazildi, payment_status→released, credits seller wallet via status.';

comment on function public.admin_escrow_refund(uuid, text) is
  'Admin refunds escrow: cancels order, payment_status→refunded, restocks via existing trigger.';


-- ---------------------------------------------------------------------------
-- 9. admin_order_detail: include payment_status, tracking_url, city
-- ---------------------------------------------------------------------------
create or replace function public.admin_order_detail(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  select jsonb_build_object(
    'id', o.id, 'code', o.code, 'status', o.status, 'subtotal', o.subtotal,
    'commission', o.commission, 'payout', o.payout, 'commission_rate', o.commission_rate,
    'payment_method', o.payment_method, 'payment_status', o.payment_status, 'payment_ref', o.payment_ref,
    'tracking_url', o.tracking_url, 'city', o.city,
    'created_at', o.created_at, 'address', o.address, 'note', o.note,
    'customer_name', o.customer_name, 'customer_phone', public.admin_mask_phone(o.customer_phone),
    'cancel_reason', o.cancel_reason, 'status_history', o.status_history,
    'escrow_released_at', o.escrow_released_at, 'escrow_refunded_at', o.escrow_refunded_at,
    'seller', jsonb_build_object('id', s.id, 'name', s.name, 'shop_name', s.shop_name, 'city', s.city, 'phone', public.admin_mask_phone(s.phone)),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('id', i.id, 'name', i.name, 'variant', i.variant, 'image_url', i.image_url, 'qty', i.qty, 'price', i.price, 'total', i.total))
      from public.seller_order_items i where i.order_id = o.id
    ), '[]'::jsonb)
  ) into v
  from public.seller_orders o
  join public.profiles s on s.id = o.seller_id
  where o.id = p_id;
  if v is null then raise exception 'Buyurtma topilmadi'; end if;
  return v;
end $$;
grant execute on function public.admin_order_detail(uuid) to authenticated;
