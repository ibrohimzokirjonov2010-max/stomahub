-- 0020_order_geo: exact delivery point (lat/lng) on seller_orders.
-- The client appends "[geo:lat,lng]" to the address text; this trigger moves it into columns.
alter table public.seller_orders add column if not exists lat double precision;
alter table public.seller_orders add column if not exists lng double precision;

create or replace function public.seller_orders_extract_geo() returns trigger language plpgsql as $$
declare m text[];
begin
  m := regexp_match(coalesce(new.address, ''), '\[geo:(-?[0-9.]+),(-?[0-9.]+)\]');
  if m is not null then
    new.lat := m[1]::double precision;
    new.lng := m[2]::double precision;
    new.address := btrim(regexp_replace(new.address, '\s*\[geo:[^\]]+\]', ''));
  end if;
  return new;
end $$;

drop trigger if exists orders_extract_geo on public.seller_orders;
create trigger orders_extract_geo before insert or update of address on public.seller_orders
  for each row execute function public.seller_orders_extract_geo();
