-- StomaHub — Sotuvchi kabineti: 02..10 bo'limlari uchun kengaytma.
-- 0003_seller.sql dan keyin ishga tushiring. Qayta ishga tushirish xavfsiz (idempotent).

-- ============ 02. Mahsulotlar ====================================================
alter table public.seller_products add column if not exists brand text not null default '';
alter table public.seller_products add column if not exists country text not null default '';
alter table public.seller_products add column if not exists unit text not null default '';
alter table public.seller_products add column if not exists expires_on date;
alter table public.seller_products add column if not exists images jsonb not null default '[]'::jsonb;
alter table public.seller_products add column if not exists variants jsonb not null default '[]'::jsonb;
alter table public.seller_products add column if not exists documents jsonb not null default '[]'::jsonb;
alter table public.seller_products add column if not exists reject_reason text not null default '';
alter table public.seller_products drop constraint if exists seller_products_status_check;
alter table public.seller_products add constraint seller_products_status_check
  check (status in ('active', 'review', 'rejected', 'inactive', 'archived', 'draft'));
alter table public.seller_products alter column status set default 'review';

-- Sotuvchi mahsulotni o'zi "Faol" qila olmaydi: yangi mahsulot tekshiruvga tushadi,
-- faqat moderator (service_role / SQL) active yoki rejected qiladi.
create or replace function public.seller_product_guard()
returns trigger language plpgsql as $$
declare v_sum int;
begin
  if jsonb_typeof(new.variants) = 'array' and jsonb_array_length(new.variants) > 0 then
    select coalesce(sum(greatest(0, coalesce((v->>'stock')::int, 0))), 0) into v_sum from jsonb_array_elements(new.variants) v;
    new.stock := v_sum;
  end if;
  if new.image_url = '' and jsonb_typeof(new.images) = 'array' and jsonb_array_length(new.images) > 0 then
    new.image_url := new.images->>0;
  end if;
  if current_user in ('postgres', 'service_role', 'supabase_admin') then return new; end if;
  if tg_op = 'INSERT' then
    if new.status <> 'draft' then new.status := 'review'; end if;
    return new;
  end if;
  if new.status is distinct from old.status then
    if not (
      (new.status = 'review' and old.status in ('draft', 'rejected')) or
      (new.status = 'inactive' and old.status in ('active', 'archived')) or
      (new.status = 'active' and old.status = 'inactive') or
      (new.status = 'archived' and old.status <> 'review') or
      (new.status = 'draft' and old.status = 'draft')
    ) then
      raise exception 'Mahsulot holatini o''zgartirib bo''lmaydi (% → %)', old.status, new.status;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists seller_products_guard on public.seller_products;
create trigger seller_products_guard before insert or update on public.seller_products
  for each row execute function public.seller_product_guard();

-- media bucket (rasm, hujjat, logo) — har sotuvchi o'z papkasiga yozadi
do $storage$
begin
  insert into storage.buckets (id, name, public) values ('seller-media', 'seller-media', true)
  on conflict (id) do nothing;
  execute 'drop policy if exists seller_media_read on storage.objects';
  execute $p$create policy seller_media_read on storage.objects for select to anon, authenticated using (bucket_id = 'seller-media')$p$;
  execute 'drop policy if exists seller_media_write on storage.objects';
  execute $p$create policy seller_media_write on storage.objects for insert to authenticated
    with check (bucket_id = 'seller-media' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
  execute 'drop policy if exists seller_media_delete on storage.objects';
  execute $p$create policy seller_media_delete on storage.objects for delete to authenticated
    using (bucket_id = 'seller-media' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
exception when undefined_table or invalid_schema_name or insufficient_privilege then null;
end $storage$;

-- ============ 04. Mijozlar =========================================================
alter table public.seller_customers add column if not exists kind text not null default 'klinika';
alter table public.seller_customers drop constraint if exists seller_customers_kind_check;
alter table public.seller_customers add constraint seller_customers_kind_check check (kind in ('klinika', 'shifokor', 'laboratoriya'));
alter table public.seller_customers add column if not exists contact_person text not null default '';
alter table public.seller_customers add column if not exists region text not null default '';
alter table public.seller_customers add column if not exists address text not null default '';
alter table public.seller_customers add column if not exists stir text not null default '';
alter table public.seller_customers add column if not exists tags text[] not null default '{}';
alter table public.seller_customers add column if not exists blocked boolean not null default false;
alter table public.seller_customers add column if not exists personal_discount integer check (personal_discount between 1 and 90);
alter table public.seller_customers add column if not exists notes jsonb not null default '[]'::jsonb;

-- ============ 06. Chegirmalar ======================================================
alter table public.seller_discounts add column if not exists kind text not null default 'foiz';
alter table public.seller_discounts drop constraint if exists seller_discounts_kind_check;
alter table public.seller_discounts add constraint seller_discounts_kind_check check (kind in ('foiz', 'summa', 'promokod', 'bir_bepul'));
alter table public.seller_discounts add column if not exists value numeric(14,0) not null default 0;
alter table public.seller_discounts add column if not exists promo_code text not null default '';
alter table public.seller_discounts add column if not exists scope text not null default 'all';
alter table public.seller_discounts drop constraint if exists seller_discounts_scope_check;
alter table public.seller_discounts add constraint seller_discounts_scope_check check (scope in ('all', 'products', 'category'));
alter table public.seller_discounts add column if not exists product_ids uuid[] not null default '{}';
alter table public.seller_discounts add column if not exists category text not null default '';
alter table public.seller_discounts add column if not exists min_order numeric(14,0) not null default 0;
alter table public.seller_discounts add column if not exists usage_limit integer check (usage_limit > 0);
alter table public.seller_discounts add column if not exists is_draft boolean not null default false;
alter table public.seller_discounts add column if not exists description text not null default '';
alter table public.seller_discounts alter column percent drop not null;
alter table public.seller_discounts drop constraint if exists seller_discounts_percent_check;
alter table public.seller_discounts add constraint seller_discounts_percent_check check (percent is null or percent between 1 and 90);
alter table public.seller_discounts drop constraint if exists seller_discounts_value_check;
alter table public.seller_discounts add constraint seller_discounts_value_check check (
  (kind in ('foiz', 'promokod') and value between 1 and 90) or (kind = 'summa' and value > 0) or kind = 'bir_bepul' or is_draft) not valid;

-- ============ 03. Buyurtmalar ======================================================
alter table public.seller_orders add column if not exists customer_id uuid references public.seller_customers (id) on delete set null;
alter table public.seller_orders add column if not exists contact_person text not null default '';
alter table public.seller_orders add column if not exists region text not null default '';
alter table public.seller_orders add column if not exists city text not null default '';
alter table public.seller_orders add column if not exists delivery_method text not null default 'kuryer';
alter table public.seller_orders drop constraint if exists seller_orders_delivery_method_check;
alter table public.seller_orders add constraint seller_orders_delivery_method_check check (delivery_method in ('kuryer', 'olib_ketish', 'pochta'));
alter table public.seller_orders add column if not exists delivery_date date;
alter table public.seller_orders add column if not exists delivery_fee numeric(14,0) not null default 0 check (delivery_fee >= 0);
alter table public.seller_orders add column if not exists internal_note text not null default '';
alter table public.seller_orders add column if not exists discount_id uuid references public.seller_discounts (id) on delete set null;
-- komissiya chegirmadan keyingi summadan olinadi; yetkazish narxi to'liq sotuvchiga
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'seller_orders' and column_name = 'discount_amount') then
    alter table public.seller_orders add column discount_amount numeric(14,0) not null default 0 check (discount_amount >= 0);
    alter table public.seller_orders drop column if exists payout;
    alter table public.seller_orders drop column if exists commission;
    alter table public.seller_orders add column commission numeric(14,0) generated always as (round(greatest(subtotal - discount_amount, 0) * commission_rate)) stored;
    alter table public.seller_orders add column payout numeric(14,0) generated always as (greatest(subtotal - discount_amount, 0) - round(greatest(subtotal - discount_amount, 0) * commission_rate) + delivery_fee) stored;
  end if;
end $$;
create index if not exists seller_orders_customer_idx on public.seller_orders (customer_id);

-- bekor qilinganda zaxira qaytadi
create or replace function public.seller_order_restock()
returns trigger language plpgsql security definer set search_path = public as $$
declare it record;
begin
  if new.status = 'bekor_qilindi' and old.status <> 'bekor_qilindi' then
    for it in select * from public.seller_order_items where order_id = new.id and product_id is not null loop
      update public.seller_products p set
        variants = case when it.variant <> '' and jsonb_array_length(p.variants) > 0 then (
          select jsonb_agg(case when v->>'sku' = it.variant or v->>'label' = it.variant
            then jsonb_set(v, '{stock}', to_jsonb(coalesce((v->>'stock')::int, 0) + it.qty)) else v end)
          from jsonb_array_elements(p.variants) v) else p.variants end,
        stock = p.stock + it.qty
      where p.id = it.product_id;
    end loop;
  end if;
  return null;
end $$;
drop trigger if exists seller_orders_restock on public.seller_orders;
create trigger seller_orders_restock after update of status on public.seller_orders
  for each row execute function public.seller_order_restock();

-- qo'lda buyurtma: bir nechta mahsulot, variant, mijoz, yetkazish, chegirma
create or replace function public.seller_create_manual_order(payload jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  v_order public.seller_orders; v_item jsonb; v_p public.seller_products; v_qty int; v_price numeric;
  v_var jsonb; v_c public.seller_customers; v_d public.seller_discounts; v_sub numeric := 0; v_disc numeric := 0;
  v_used int;
begin
  if not public.is_seller() then raise exception 'Faqat sotuvchilar uchun'; end if;
  if jsonb_array_length(coalesce(payload->'items', '[]'::jsonb)) = 0 then raise exception 'Kamida bitta mahsulot tanlang'; end if;
  if nullif(payload->>'customer_id', '') is not null then
    select * into v_c from public.seller_customers where id = (payload->>'customer_id')::uuid and seller_id = auth.uid();
    if v_c.id is null then raise exception 'Mijoz topilmadi'; end if;
    if v_c.blocked then raise exception 'Bu mijoz bloklangan'; end if;
  end if;
  insert into public.seller_orders (seller_id, customer_id, customer_name, customer_phone, contact_person, region, city, address, note,
    internal_note, delivery_method, delivery_date, delivery_fee, source)
  values (auth.uid(), v_c.id,
    coalesce(nullif(payload->>'customer_name', ''), v_c.name, ''), coalesce(nullif(payload->>'customer_phone', ''), v_c.phone, ''),
    coalesce(nullif(payload->>'contact_person', ''), v_c.contact_person, ''), coalesce(nullif(payload->>'region', ''), v_c.region, ''),
    coalesce(nullif(payload->>'city', ''), v_c.city, ''), coalesce(nullif(payload->>'address', ''), v_c.address, ''),
    coalesce(payload->>'note', ''), coalesce(payload->>'internal_note', ''), coalesce(nullif(payload->>'delivery_method', ''), 'kuryer'),
    nullif(payload->>'delivery_date', '')::date, greatest(0, coalesce((payload->>'delivery_fee')::numeric, 0)), 'manual')
  returning * into v_order;
  for v_item in select * from jsonb_array_elements(payload->'items') loop
    select * into v_p from public.seller_products where id = (v_item->>'product_id')::uuid and seller_id = auth.uid() for update;
    if v_p.id is null then raise exception 'Mahsulot topilmadi'; end if;
    v_qty := greatest(1, coalesce((v_item->>'qty')::int, 1));
    v_price := v_p.price; v_var := null;
    if nullif(v_item->>'variant', '') is not null then
      select v into v_var from jsonb_array_elements(v_p.variants) v where v->>'sku' = v_item->>'variant' limit 1;
      if v_var is null then raise exception 'Variant topilmadi'; end if;
      if coalesce((v_var->>'stock')::int, 0) < v_qty then raise exception '% (%) zaxirada yetarli emas', v_p.name, v_item->>'variant'; end if;
      v_price := coalesce(nullif(v_var->>'price', '')::numeric, v_p.price);
      update public.seller_products set variants = (select jsonb_agg(case when v->>'sku' = v_item->>'variant'
        then jsonb_set(v, '{stock}', to_jsonb(coalesce((v->>'stock')::int, 0) - v_qty)) else v end) from jsonb_array_elements(variants) v)
      where id = v_p.id;
    else
      if v_p.stock < v_qty then raise exception '% zaxirada yetarli emas (bor: %)', v_p.name, v_p.stock; end if;
      update public.seller_products set stock = stock - v_qty where id = v_p.id;
    end if;
    insert into public.seller_order_items (order_id, seller_id, product_id, name, variant, image_url, qty, price)
    values (v_order.id, auth.uid(), v_p.id, v_p.name, coalesce(v_item->>'variant', ''), v_p.image_url, v_qty, v_price);
    v_sub := v_sub + v_qty * v_price;
  end loop;
  if nullif(payload->>'discount_id', '') is not null then
    select * into v_d from public.seller_discounts where id = (payload->>'discount_id')::uuid and seller_id = auth.uid()
      and active and not is_draft and starts_on <= current_date and (ends_on is null or ends_on >= current_date);
    if v_d.id is null then raise exception 'Chegirma faol emas'; end if;
    select count(*) into v_used from public.seller_orders where discount_id = v_d.id and status <> 'bekor_qilindi';
    if v_d.usage_limit is not null and v_used >= v_d.usage_limit then raise exception 'Chegirma limiti tugagan'; end if;
    if v_sub < v_d.min_order then raise exception 'Chegirma uchun minimal buyurtma: %', v_d.min_order; end if;
    v_disc := case v_d.kind when 'summa' then least(v_d.value, v_sub) when 'bir_bepul' then 0 else round(v_sub * coalesce(nullif(v_d.value, 0), v_d.percent) / 100.0) end;
    update public.seller_orders set discount_id = v_d.id, discount_amount = v_disc where id = v_order.id;
  elsif v_c.personal_discount is not null then
    -- mijozning shaxsiy chegirmasi (boshqa chegirma tanlanmagan bo'lsa)
    update public.seller_orders set discount_amount = round(v_sub * v_c.personal_discount / 100.0) where id = v_order.id;
  end if;
  select * into v_order from public.seller_orders where id = v_order.id;
  return jsonb_build_object('id', v_order.id, 'code', v_order.code);
end $$;

-- ============ 05. Sharhlar ========================================================
alter table public.seller_reviews add column if not exists reply_public boolean not null default true;
alter table public.seller_reviews add column if not exists replied_at timestamptz;
alter table public.seller_reviews add column if not exists hidden boolean not null default false;
alter table public.seller_reviews add column if not exists reported boolean not null default false;
alter table public.seller_reviews add column if not exists report_reason text not null default '';
alter table public.seller_reviews add column if not exists images jsonb not null default '[]'::jsonb;
alter table public.seller_reviews add column if not exists author_city text not null default '';
-- sotuvchi faqat javob / yashirish / shikoyat maydonlarini o'zgartira oladi
create or replace function public.seller_review_guard()
returns trigger language plpgsql as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then return new; end if;
  if auth.uid() = old.seller_id and (new.rating, new.body, new.author_name, new.product_id, new.author_id, new.images, new.created_at)
     is distinct from (old.rating, old.body, old.author_name, old.product_id, old.author_id, old.images, old.created_at) then
    raise exception 'Sharh matnini o''zgartirib bo''lmaydi';
  end if;
  if new.reply is distinct from old.reply then new.replied_at := case when new.reply = '' then null else now() end; end if;
  return new;
end $$;
drop trigger if exists seller_reviews_guard on public.seller_reviews;
create trigger seller_reviews_guard before update on public.seller_reviews for each row execute function public.seller_review_guard();

-- ============ 07. Reklama =========================================================
alter table public.seller_campaigns add column if not exists kind text not null default 'qidiruv';
alter table public.seller_campaigns drop constraint if exists seller_campaigns_kind_check;
alter table public.seller_campaigns add constraint seller_campaigns_kind_check check (kind in ('qidiruv', 'banner', 'kategoriya'));
alter table public.seller_campaigns add column if not exists product_ids uuid[] not null default '{}';
alter table public.seller_campaigns add column if not exists starts_on date not null default current_date;
alter table public.seller_campaigns add column if not exists ends_on date;
alter table public.seller_campaigns add column if not exists region text not null default 'Barcha hududlar';
alter table public.seller_campaigns alter column status set default 'faol';

create table if not exists public.seller_ad_topups (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  amount numeric(14,0) not null check (amount > 0),
  created_at timestamptz not null default now()
);
create table if not exists public.seller_ad_stats (
  campaign_id uuid not null references public.seller_campaigns (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid,
  day date not null default current_date,
  impressions integer not null default 0,
  clicks integer not null default 0,
  spent numeric(14,0) not null default 0,
  primary key (campaign_id, day, product_id)
);
alter table public.seller_ad_stats alter column product_id set default '00000000-0000-0000-0000-000000000000';
update public.seller_ad_stats set product_id = '00000000-0000-0000-0000-000000000000' where product_id is null;

create or replace function public.seller_ad_balance(p_seller uuid default auth.uid())
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce((select sum(amount) from public.seller_ad_topups where seller_id = p_seller), 0)
       - coalesce((select sum(spent) from public.seller_ad_stats where seller_id = p_seller), 0);
$$;

-- Bozor sahifasi (anon ham) ko'rish/bosishni yozadi. Bosish narxi 1 000 so'm, kunlik byudjetdan oshmaydi.
create or replace function public.seller_ad_track(p_campaign uuid, p_product uuid, p_event text)
returns void language plpgsql security definer set search_path = public as $$
declare c public.seller_campaigns; v_today numeric; v_cost numeric := 0;
begin
  select * into c from public.seller_campaigns where id = p_campaign and status = 'faol'
    and starts_on <= current_date and (ends_on is null or ends_on >= current_date);
  if c.id is null then return; end if;
  if p_event = 'click' then
    select coalesce(sum(spent), 0) into v_today from public.seller_ad_stats where campaign_id = c.id and day = current_date;
    v_cost := greatest(0, least(1000, c.daily_budget - v_today, public.seller_ad_balance(c.seller_id)));
  end if;
  insert into public.seller_ad_stats (campaign_id, seller_id, product_id, impressions, clicks, spent)
  values (c.id, c.seller_id, coalesce(p_product, '00000000-0000-0000-0000-000000000000'),
          (p_event = 'view')::int, (p_event = 'click')::int, v_cost)
  on conflict (campaign_id, day, product_id) do update set
    impressions = seller_ad_stats.impressions + excluded.impressions,
    clicks = seller_ad_stats.clicks + excluded.clicks,
    spent = seller_ad_stats.spent + excluded.spent;
end $$;

-- ============ 09. Hamyon: reklama to'lovlari balansdan yechiladi ===================
create or replace function public.seller_wallet()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'earned', coalesce((select sum(payout) from public.seller_orders where seller_id = auth.uid() and status = 'yetkazildi'), 0),
    'pending', coalesce((select sum(payout) from public.seller_orders where seller_id = auth.uid() and status in ('yangi','tasdiqlandi','tayyorlanmoqda','yetkazilmoqda')), 0),
    'withdrawn', coalesce((select sum(amount) from public.seller_payouts where seller_id = auth.uid() and status <> 'rad_etildi'), 0)
               + coalesce((select sum(amount) from public.seller_ad_topups where seller_id = auth.uid()), 0)
  );
$$;
drop trigger if exists seller_ad_topups_guard on public.seller_ad_topups;
create trigger seller_ad_topups_guard before insert on public.seller_ad_topups
  for each row execute function public.seller_payout_guard();

-- ============ 10. Sozlamalar ======================================================
create table if not exists public.seller_settings (
  seller_id uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  phone text not null default '',
  address text not null default '',
  work_days text not null default 'Dushanba - Shanba',
  work_hours text not null default '09:00 - 18:00',
  logo_url text not null default '',
  notify jsonb not null default '{"yangi_buyurtma":true,"holat":true,"sharh":true,"pul":true,"reklama":false,"tizim":true}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.seller_branches (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  address text not null default '',
  phone text not null default '',
  hours text not null default '09:00 - 18:00',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.seller_staff (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  phone text not null default '',
  role text not null default 'Operator' check (role in ('Admin', 'Manager', 'Omborchi', 'Operator')),
  permissions text[] not null default '{}',
  branch_id uuid references public.seller_branches (id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.seller_activity (
  id bigint generated always as identity primary key,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  staff_id uuid references public.seller_staff (id) on delete set null,
  action text not null,
  details text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists seller_activity_idx on public.seller_activity (seller_id, created_at desc);

-- ============ RLS =================================================================
alter table public.seller_ad_topups enable row level security;
alter table public.seller_ad_stats enable row level security;
alter table public.seller_settings enable row level security;
alter table public.seller_branches enable row level security;
alter table public.seller_staff enable row level security;
alter table public.seller_activity enable row level security;
do $$
declare t text;
begin
  foreach t in array array['seller_settings','seller_branches','seller_staff'] loop
    execute format('drop policy if exists %I on public.%I', t || '_own', t);
    execute format('create policy %I on public.%I for all to authenticated using (seller_id = auth.uid()) with check (seller_id = auth.uid())', t || '_own', t);
  end loop;
  -- faqat o'qish + qo'shish (o'zgartirib/o'chirib bo'lmaydi)
  foreach t in array array['seller_ad_topups','seller_activity'] loop
    execute format('drop policy if exists %I on public.%I', t || '_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('create policy %I on public.%I for select to authenticated using (seller_id = auth.uid())', t || '_read', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (seller_id = auth.uid())', t || '_insert', t);
  end loop;
  execute 'drop policy if exists seller_ad_stats_read on public.seller_ad_stats';
  execute 'create policy seller_ad_stats_read on public.seller_ad_stats for select to authenticated using (seller_id = auth.uid())';
end $$;

grant select, insert, update, delete on public.seller_settings, public.seller_branches, public.seller_staff to authenticated;
grant select, insert on public.seller_ad_topups, public.seller_activity to authenticated;
grant select on public.seller_ad_stats to authenticated;
grant execute on function public.seller_ad_balance(uuid), public.seller_wallet() to authenticated;
grant execute on function public.seller_ad_track(uuid, uuid, text) to anon, authenticated;
