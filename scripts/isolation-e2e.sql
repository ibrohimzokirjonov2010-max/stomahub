-- Two accounts must not see each other's private rows.
-- Rolls back. Run against local stomahub_test after 0001 and 0002.
-- Do not run scripts/local-prelude.sql on the hosted Supabase project.
begin;

insert into auth.users (
  id, email, role, raw_user_meta_data, created_at, updated_at, aud
) values (
  '33333333-3333-4333-8333-333333333333',
  'doctor-b@stomahub.test',
  'authenticated',
  '{"role":"customer","name":"Doctor B"}'::jsonb,
  now(),
  now(),
  'authenticated'
);

-- Account A: demo organizer. Private seminar, order, clinic blob, registration.
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

insert into public.seminars (id, organizer_id, title, status, published)
values ('iso-private-a', '11111111-1111-4111-8111-111111111111', 'A ning yopiq seminari', 'qoralama', false);

insert into public.shop_orders (id, user_id, status, payload)
values (
  'SH-iso-a',
  '11111111-1111-4111-8111-111111111111',
  'processing',
  '{"id":"SH-iso-a","status":"processing","total":5000}'::jsonb
);

insert into public.user_blobs (user_id, kind, payload)
values (
  '11111111-1111-4111-8111-111111111111',
  'patients',
  '[{"id":"a-patient","name":"A bemori"}]'::jsonb
)
on conflict (user_id, kind) do update set payload = excluded.payload;

insert into public.registrations (id, seminar_id, organizer_id, customer_id, name)
values (
  'iso-reg-a',
  'iso-private-a',
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111',
  'A ishtirokchi'
);

do $$
declare
  n int;
begin
  select count(*) into n from public.seminars where id = 'iso-private-a';
  if n <> 1 then raise exception 'A cannot see own private seminar, got %', n; end if;
  select count(*) into n from public.shop_orders where id = 'SH-iso-a';
  if n <> 1 then raise exception 'A cannot see own order, got %', n; end if;
end $$;

reset role;

-- Account B must not see A's private rows, and can still read the public catalog.
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare
  n int;
  published_n int;
  catalog_n int;
begin
  select count(*) into n from public.seminars where id = 'iso-private-a';
  if n <> 0 then raise exception 'B sees A private seminar, got %', n; end if;

  select count(*) into n from public.shop_orders where id = 'SH-iso-a';
  if n <> 0 then raise exception 'B sees A shop order, got %', n; end if;

  select count(*) into n from public.user_blobs
    where user_id = '11111111-1111-4111-8111-111111111111' and kind = 'patients';
  if n <> 0 then raise exception 'B sees A patients blob, got %', n; end if;

  select count(*) into n from public.registrations where id = 'iso-reg-a';
  if n <> 0 then raise exception 'B sees A registration, got %', n; end if;

  select count(*) into n from public.profiles where id = '11111111-1111-4111-8111-111111111111';
  if n <> 0 then raise exception 'B sees A profile, got %', n; end if;

  select count(*) into n from public.profiles where id = '33333333-3333-4333-8333-333333333333';
  if n <> 1 then raise exception 'B cannot see own profile, got %', n; end if;

  select count(*) into published_n from public.seminars where published = true and status <> 'qoralama';
  if published_n < 1 then raise exception 'B cannot read the public seminar catalog, got %', published_n; end if;

  select count(*) into catalog_n from public.catalog_items;
  if catalog_n < 100 then raise exception 'B cannot read catalog_items, got %', catalog_n; end if;

  raise notice 'B hidden: private seminar %, A order %, A patients %, A registration %, A profile %', 0, 0, 0, 0, 0;
  raise notice 'B public catalog: seminars %, catalog_items %', published_n, catalog_n;
end $$;

insert into public.shop_orders (id, user_id, status, payload)
values (
  'SH-iso-b',
  '33333333-3333-4333-8333-333333333333',
  'processing',
  '{"id":"SH-iso-b","status":"processing","total":900}'::jsonb
);

reset role;

-- A must not see B's order. Anon must not read private tables.
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare
  n int;
begin
  select count(*) into n from public.shop_orders where id = 'SH-iso-b';
  if n <> 0 then raise exception 'A sees B shop order, got %', n; end if;
  select count(*) into n from public.shop_orders where id = 'SH-iso-a';
  if n <> 1 then raise exception 'A lost own order, got %', n; end if;
  raise notice 'A sees own order 1, B order 0';
end $$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
set local role anon;

do $$
declare
  n int;
begin
  begin
    select count(*) into n from public.shop_orders;
    raise exception 'anon read shop_orders, got %', n;
  exception when insufficient_privilege then
    null;
  end;
  begin
    select count(*) into n from public.registrations;
    raise exception 'anon read registrations, got %', n;
  exception when insufficient_privilege then
    null;
  end;
  begin
    select count(*) into n from public.user_blobs;
    raise exception 'anon read user_blobs, got %', n;
  exception when insufficient_privilege then
    null;
  end;
  select count(*) into n from public.seminars where published = true and status <> 'qoralama';
  if n < 1 then raise exception 'anon cannot read published seminars, got %', n; end if;
  raise notice 'anon blocked from shop_orders, registrations, user_blobs; published seminars %', n;
end $$;

rollback;
