-- Customer tables: anon can read the catalog, not another person's orders.
begin;

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
set local role anon;

do $$
declare
  n int;
begin
  select count(*) into n from public.catalog_items;
  if n < 100 then
    raise exception 'catalog seed missing, got %', n;
  end if;
  begin
    select count(*) into n from public.shop_orders;
    raise exception 'anon read shop_orders, got %', n;
  exception when insufficient_privilege then
    null;
  end;
end $$;

reset role;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

insert into public.customer_addresses (id, user_id, payload, sort_at)
values (
  '11111111-1111-4111-8111-111111111111:e2e',
  '11111111-1111-4111-8111-111111111111',
  '{"id":"e2e","kind":"home","name":"E2E","address":"Toshkent"}'::jsonb,
  0
);

insert into public.shop_orders (id, user_id, status, payload)
values (
  'SH-e2e-customer',
  '11111111-1111-4111-8111-111111111111',
  'processing',
  '{"id":"SH-e2e-customer","status":"processing","total":1000}'::jsonb
);

insert into public.user_blobs (user_id, kind, payload)
values (
  '11111111-1111-4111-8111-111111111111',
  'e2e',
  '{"ok":true}'::jsonb
);

do $$
declare
  n int;
begin
  select count(*) into n from public.shop_orders where id = 'SH-e2e-customer';
  if n <> 1 then
    raise exception 'own order missing';
  end if;
  select count(*) into n from public.customer_addresses where id like '%:e2e';
  if n <> 1 then
    raise exception 'own address missing';
  end if;
end $$;

rollback;
