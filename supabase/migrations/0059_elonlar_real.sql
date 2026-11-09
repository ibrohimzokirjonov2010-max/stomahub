-- 0059 E'lonlar (classifieds) real: status, ad guard (owner cannot self-unhide), no seed deletion.
-- Idempotent. DO NOT auto-apply; commit only.

alter table public.catalog_items
  add column if not exists status text not null default 'active';

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'catalog_items_status_chk'
  ) then
    alter table public.catalog_items
      add constraint catalog_items_status_chk
      check (status in ('active', 'sold', 'closed'));
  end if;
end $$;

create index if not exists catalog_items_kind_status_idx
  on public.catalog_items (kind, status, hidden);

comment on column public.catalog_items.status is
  'Listing lifecycle: active | sold | closed. Public list shows active + not hidden only.';

-- Owner insert already requires owner_id = auth.uid() (0013/0018).
-- Harden: non-admin cannot flip hidden; insert forces moderatsiya for kind=ad.
create or replace function public.ad_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_title text;
  v_phone text;
  v_price numeric;
  v_status text;
begin
  if new.kind <> 'ad' then return new; end if;
  if coalesce(public.is_admin(), false) then return new; end if;

  -- Force ownership on insert
  if tg_op = 'INSERT' then
    if auth.uid() is null then
      raise exception 'ad_auth: E''lon berish uchun hisobingizga kiring';
    end if;
    new.owner_id := auth.uid();
    new.hidden := true;
    new.hidden_reason := 'moderatsiya';
    new.status := coalesce(nullif(trim(new.status), ''), 'active');
    if new.status not in ('active', 'sold', 'closed') then
      new.status := 'active';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    -- Owner cannot self-unhide or change owner
    new.hidden := old.hidden;
    new.hidden_reason := old.hidden_reason;
    new.owner_id := old.owner_id;
    v_status := coalesce(nullif(trim(new.status), ''), old.status, 'active');
    if v_status not in ('active', 'sold', 'closed') then
      v_status := old.status;
    end if;
    new.status := v_status;
  end if;

  -- Light validation on payload for inserts / payload changes
  if tg_op = 'INSERT' or (tg_op = 'UPDATE' and new.payload is distinct from old.payload) then
    v_title := trim(coalesce(new.payload->>'title', ''));
    v_phone := regexp_replace(coalesce(new.payload->'sellerInfo'->>'phone', new.payload->>'phone', ''), '\D', '', 'g');
    v_price := nullif(regexp_replace(coalesce(new.payload->>'price', ''), '[^0-9.]', '', 'g'), '')::numeric;
    if length(v_title) < 3 then
      raise exception 'ad_title: Sarlavhani kiriting (kamida 3 belgi)';
    end if;
    if v_price is null or v_price < 0 then
      raise exception 'ad_price: Narxni kiriting';
    end if;
    if length(v_phone) < 12 then
      raise exception 'ad_phone: Telefon raqamini to''liq kiriting';
    end if;
  end if;

  -- Keep payload.status in sync with column
  new.payload := jsonb_set(coalesce(new.payload, '{}'::jsonb), '{status}', to_jsonb(new.status), true);

  return new;
end $$;

drop trigger if exists catalog_items_ad_guard on public.catalog_items;
create trigger catalog_items_ad_guard
  before insert or update on public.catalog_items
  for each row execute function public.ad_guard();

-- Seed ads with owner_id IS NULL are intentionally left untouched (Ibrohim approval required to delete).
