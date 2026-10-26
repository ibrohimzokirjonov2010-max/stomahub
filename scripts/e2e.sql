-- End-to-end checks against the seeded demo organizer.
-- Runs inside a transaction and rolls back so the seed stays intact.

begin;

-- anon cannot read registrations
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
set local role anon;
do $$
declare
  n int;
begin
  select count(*) into n from public.registrations;
  raise exception 'anon should not read registrations, got %', n;
exception when insufficient_privilege then
  null;
end $$;

-- anon can read the published catalog and the live EARLYBIRD code
do $$
declare
  n int;
begin
  select count(*) into n from public.seminars where published;
  if n < 8 then
    raise exception 'expected published seminars, got %', n;
  end if;
  select count(*) into n from public.promo_codes where code = 'EARLYBIRD' and status = 'faol';
  if n < 1 then
    raise exception 'active EARLYBIRD missing for anon';
  end if;
end $$;
reset role;

-- organizer creates a seminar
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

insert into public.seminars (
  id, organizer_id, title, speaker, date_label, city, format, days, sold, seats, revenue,
  status, badge, image, topic, published, held, about, category, tags, cover,
  start_date, start_time, end_date, end_time, place, address, place_img, template, checked, sort_at
) values (
  'e2e-live', '11111111-1111-4111-8111-111111111111', 'E2E Implant seminar', 'Dr. Test', '1-dekabr 2026',
  'Toshkent', 'Oflayn', '1 kunlik seminar', 0, 40, 0, 'rejalashtirilgan', 'Rejalashtirilgan',
  '/images/seminars/teeth.jpg', 'Implantologiya', true, false, 'Jonli sinov seminari uchun tavsif.',
  'Tibbiy amaliy seminar', array['Implantologiya'], '/images/seminars/teeth.jpg',
  '2026-12-01', '10:00', '2026-12-01', '18:00', 'Toshkent, Congress Hall', 'Toshkent',
  '/images/seminars/hotel.jpg', 'teal', 0, -1
);

insert into public.tickets (id, seminar_id, organizer_id, name, price, seats, sold, active, perks, icon, note, sort_at)
values (
  'e2e-live-std', 'e2e-live', '11111111-1111-4111-8111-111111111111', 'Standart', 500000, 40, 0, true,
  array['Seminarga kirish','Sertifikat'], 'gem', 'Asosiy', 0
);

reset role;

-- customer (anon) registers with EARLYBIRD
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
set local role anon;

do $$
declare
  res jsonb;
  paid numeric;
begin
  res := public.register_sale(jsonb_build_object(
    'seminarId', 'e2e-live',
    'ticket', 'Standart',
    'name', 'Aliyeva Test',
    'phone', '+998 90 111 22 33',
    'email', 'aliyeva.test@example.uz',
    'clinic', 'Stoma Clinic',
    'city', 'Toshkent',
    'spec', 'Stomatolog',
    'method', 'Click',
    'subtotal', 1,
    'promoCode', 'EARLYBIRD'
  ));
  if coalesce(res->>'ok', 'false') <> 'true' then
    raise exception 'register_sale failed: %', res;
  end if;
  paid := (res->>'paid')::numeric;
  if paid <> 400000 then
    raise exception 'expected 20%% of 500000 = 400000, got %', paid;
  end if;
  if res->>'promo' <> 'EARLYBIRD' then
    raise exception 'promo not applied: %', res;
  end if;
end $$;
reset role;

-- cabinet sees the registration, payment, wallet hold, then check-in
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare
  n int;
  sold int;
  used int;
  hold numeric;
  res jsonb;
  reg_id text;
begin
  select count(*) into n from public.registrations where seminar_id = 'e2e-live' and name = 'Aliyeva Test';
  if n <> 1 then
    raise exception 'participant missing in Ishtirokchilar, count %', n;
  end if;
  select count(*) into n from public.payments where seminar_id = 'e2e-live' and state = 'ok' and sum = 400000;
  if n <> 1 then
    raise exception 'payment missing in To‘lovlar, count %', n;
  end if;
  select s.sold into sold from public.seminars s where s.id = 'e2e-live';
  if sold <> 1 then
    raise exception 'seminar sold should be 1, got %', sold;
  end if;
  select p.used into used from public.promo_codes p where p.id = 'early-live';
  if used <> 13 then
    raise exception 'EARLYBIRD used should be 13, got %', used;
  end if;
  select w.hold into hold from public.organizer_wallet('11111111-1111-4111-8111-111111111111') w;
  if hold < 352000 then
    raise exception 'wallet hold should include net 352000, got %', hold;
  end if;
  select id into reg_id from public.registrations where seminar_id = 'e2e-live' and name = 'Aliyeva Test';
  res := public.check_in(reg_id);
  if coalesce(res->>'ok', 'false') <> 'true' then
    raise exception 'check_in failed: %', res;
  end if;
  if not exists (select 1 from public.checkins where registration_id = reg_id) then
    raise exception 'checkins row missing';
  end if;
  if (select checked from public.seminars where id = 'e2e-live') <> 1 then
    raise exception 'checked counter not incremented';
  end if;
  -- second check-in is idempotent
  res := public.check_in(reg_id);
  if (select checked from public.seminars where id = 'e2e-live') <> 1 then
    raise exception 'check-in double counted';
  end if;
end $$;

-- a customer cannot open the organizer wallet or another organizer's drafts
reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
set local role anon;
do $$
declare
  n int;
begin
  select count(*) into n from public.seminars where id = 'e2e-live' and published;
  if n <> 1 then
    raise exception 'published seminar hidden from catalog';
  end if;
  begin
    select count(*) into n from public.payments;
    raise exception 'anon read payments, got %', n;
  exception when insufficient_privilege then
    null;
  end;
end $$;

rollback;
