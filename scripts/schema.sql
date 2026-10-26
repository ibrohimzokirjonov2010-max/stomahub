-- StomaHub seminar hub. Idempotent. Run the generated file
-- supabase/migrations/0001_init.sql in the Supabase SQL editor.
-- Does not drop or alter marketplace tables (users, products, orders, reviews, sellers).

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
exception when insufficient_privilege then
  null;
end $$;

-- ---------------------------------------------------------------------------
-- profiles (auth.users)
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'organizer')),
  name text not null default '',
  phone text,
  telegram_id bigint,
  email text,
  specialty text,
  avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_phone_uidx on public.profiles (phone) where phone is not null and phone <> '';
create unique index if not exists profiles_telegram_uidx on public.profiles (telegram_id) where telegram_id is not null;

-- ---------------------------------------------------------------------------
-- seminars, tickets, promos
-- ---------------------------------------------------------------------------

create table if not exists public.seminars (
  id text primary key,
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  speaker text not null default '',
  date_label text not null default '',
  city text not null default '',
  format text not null default 'Oflayn',
  days text not null default '',
  sold integer not null default 0,
  seats integer not null default 0,
  revenue numeric not null default 0,
  status text not null default 'qoralama',
  badge text not null default '',
  image text not null default '',
  topic text not null default '',
  published boolean not null default false,
  held boolean not null default false,
  about text not null default '',
  category text not null default '',
  tags text[] not null default '{}',
  cover text not null default '',
  start_date text not null default '',
  start_time text not null default '10:00',
  end_date text not null default '',
  end_time text not null default '18:00',
  place text not null default '',
  address text not null default '',
  place_img text not null default '',
  template text not null default 'teal',
  checked integer not null default 0,
  cancel_reason text not null default '',
  form jsonb,
  speakers jsonb not null default '[]'::jsonb,
  sort_at bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seminars_organizer_idx on public.seminars (organizer_id, sort_at);
create index if not exists seminars_published_idx on public.seminars (published, status);

create table if not exists public.tickets (
  id text primary key,
  seminar_id text not null references public.seminars (id) on delete cascade,
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  price numeric not null default 0,
  seats integer not null default 0,
  sold integer not null default 0,
  active boolean not null default true,
  perks text[] not null default '{}',
  icon text not null default 'gem',
  note text not null default '',
  sort_at integer not null default 0
);

create index if not exists tickets_seminar_idx on public.tickets (seminar_id, sort_at);

create table if not exists public.promo_codes (
  id text primary key,
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  seminar_id text,
  code text not null,
  name text not null default '',
  kind text not null default 'foiz' check (kind in ('foiz', 'summa')),
  value numeric not null default 0,
  used integer not null default 0,
  limit_n integer not null default 0,
  status text not null default 'faol',
  from_label text not null default '',
  to_label text not null default '',
  sort_at bigint not null default 0
);

create index if not exists promo_codes_lookup_idx on public.promo_codes (organizer_id, code);

-- ---------------------------------------------------------------------------
-- registrations, payments, check-ins, certificates, wallet
-- ---------------------------------------------------------------------------

create table if not exists public.registrations (
  id text primary key,
  seminar_id text not null references public.seminars (id) on delete cascade,
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  customer_id uuid references public.profiles (id) on delete set null,
  name text not null,
  clinic text not null default '',
  phone text not null default '',
  email text not null default '',
  ticket text not null default 'Standart',
  ticket_id text,
  pay text not null default 'paid',
  registered text not null default '',
  city text not null default '',
  role text not null default '',
  avatar text not null default '',
  code text not null default '',
  arrived boolean not null default false,
  sort_at bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists registrations_org_idx on public.registrations (organizer_id, sort_at);
create index if not exists registrations_customer_idx on public.registrations (customer_id);
create index if not exists registrations_seminar_idx on public.registrations (seminar_id);

create table if not exists public.payments (
  id text primary key,
  registration_id text references public.registrations (id) on delete set null,
  seminar_id text references public.seminars (id) on delete set null,
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  customer_id uuid references public.profiles (id) on delete set null,
  who text not null default '',
  clinic text not null default '',
  seminar_title text not null default '',
  sum numeric not null default 0,
  gross numeric,
  discount numeric not null default 0,
  promo text not null default '',
  method text not null default '',
  state text not null default 'ok',
  phone text not null default '',
  email text not null default '',
  ticket text not null default '',
  when_label text not null default '',
  avatar text not null default '',
  face integer not null default 0,
  sort_at bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists payments_org_idx on public.payments (organizer_id, sort_at);
create index if not exists payments_seminar_idx on public.payments (seminar_id);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  registration_id text not null unique references public.registrations (id) on delete cascade,
  seminar_id text not null,
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  method text not null default 'qr',
  created_at timestamptz not null default now()
);

create index if not exists checkins_org_idx on public.checkins (organizer_id, created_at desc);

create table if not exists public.certificates (
  id text primary key,
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  seminar_id text,
  name text not null,
  clinic text not null default '',
  seminar_title text not null default '',
  state text not null default 'none',
  code text not null default '',
  date_label text not null default '',
  avatar text not null default '',
  sort_at bigint not null default 0
);

create index if not exists certificates_org_idx on public.certificates (organizer_id, sort_at);

create table if not exists public.wallet_transactions (
  id text primary key,
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric not null,
  card text not null default '',
  date_label text not null default '',
  method text not null default 'card',
  kind text not null default 'withdraw',
  created_at timestamptz not null default now()
);

create index if not exists wallet_org_idx on public.wallet_transactions (organizer_id, created_at desc);

create table if not exists public.requisites (
  id text primary key,
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  label text not null default '',
  detail text not null default ''
);

create index if not exists requisites_org_idx on public.requisites (organizer_id);

create table if not exists public.activity_log (
  id text primary key,
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  icon text not null default 'cal',
  title text not null default '',
  text text not null default '',
  time_label text not null default '',
  sort_at bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists activity_org_idx on public.activity_log (organizer_id, sort_at);

create table if not exists public.seminar_reviews (
  id text primary key,
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  clinic text not null default '',
  stars integer not null default 5,
  text text not null default '',
  date_label text not null default '',
  avatar text not null default '',
  sort_at bigint not null default 0
);

create table if not exists public.organizer_speakers (
  id text primary key,
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  role text not null default '',
  city text not null default '',
  avatar text not null default '',
  bio text not null default '',
  links jsonb not null default '[]'::jsonb,
  sort_at bigint not null default 0
);

create table if not exists public.organizer_settings (
  organizer_id uuid primary key references public.profiles (id) on delete cascade,
  name text not null default '',
  email text not null default '',
  notes boolean not null default true,
  city text not null default 'Toshkent',
  qr_sound boolean not null default true,
  marketing jsonb not null default '{}'::jsonb
);

create table if not exists public.support_messages (
  id text primary key,
  organizer_id uuid references public.profiles (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null,
  at_label text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists support_messages_org_idx on public.support_messages (organizer_id, created_at);

-- Server-only. No policies: service role bypasses RLS.
create table if not exists public.telegram_contacts (
  phone text primary key,
  telegram_id bigint,
  chat_id bigint not null,
  name text not null default '',
  linked_at timestamptz not null default now()
);

create table if not exists public.phone_otps (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  consumed_at timestamptz,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists phone_otps_phone_idx on public.phone_otps (phone, created_at desc);

-- ---------------------------------------------------------------------------
-- counter protection: sold / revenue / used change only inside RPCs
-- ---------------------------------------------------------------------------

create or replace function public.protect_counters()
returns trigger
language plpgsql
as $$
begin
  if current_setting('stomahub.trusted', true) = 'on' then
    return new;
  end if;
  if tg_table_name = 'tickets' then
    new.sold := old.sold;
  elsif tg_table_name = 'seminars' then
    new.sold := old.sold;
    new.revenue := old.revenue;
    new.checked := old.checked;
  elsif tg_table_name = 'promo_codes' then
    new.used := old.used;
  end if;
  return new;
end $$;

drop trigger if exists seminars_protect_counters on public.seminars;
create trigger seminars_protect_counters before update on public.seminars
for each row execute function public.protect_counters();

drop trigger if exists tickets_protect_counters on public.tickets;
create trigger tickets_protect_counters before update on public.tickets
for each row execute function public.protect_counters();

drop trigger if exists promo_protect_counters on public.promo_codes;
create trigger promo_protect_counters before update on public.promo_codes
for each row execute function public.protect_counters();

-- ---------------------------------------------------------------------------
-- auth profile + helpers
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data->>'role', 'customer');
  v_tg text := coalesce(new.raw_user_meta_data->>'telegram_id', '');
begin
  if v_role not in ('customer', 'organizer') then
    v_role := 'customer';
  end if;
  insert into public.profiles (id, role, name, phone, telegram_id, email, specialty)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    case when v_tg ~ '^[0-9]+$' then v_tg::bigint else null end,
    new.email,
    nullif(new.raw_user_meta_data->>'specialty', '')
  )
  on conflict (id) do update set
    name = coalesce(nullif(excluded.name, ''), public.profiles.name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    telegram_id = coalesce(excluded.telegram_id, public.profiles.telegram_id),
    email = coalesce(excluded.email, public.profiles.email),
    specialty = coalesce(excluded.specialty, public.profiles.specialty),
    updated_at = now();
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_organizer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'organizer'
  );
$$;

create or replace function public.organizer_wallet(p_org uuid)
returns table (hold numeric, available numeric, transferred numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_hold numeric := 0;
  v_ready numeric := 0;
  v_out numeric := 0;
  r record;
  s record;
  v_net numeric;
begin
  if auth.uid() is distinct from p_org and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'ruxsat yo‘q';
  end if;
  for r in select * from public.payments where organizer_id = p_org and state = 'ok'
  loop
    select * into s from public.seminars where id = r.seminar_id;
    v_net := coalesce(r.sum, 0) - round(coalesce(r.sum, 0) * 0.12);
    if s.id is not null and (s.held or s.status = 'yakunlangan') then
      v_ready := v_ready + v_net;
    else
      v_hold := v_hold + v_net;
    end if;
  end loop;
  select coalesce(sum(amount), 0) into v_out
  from public.wallet_transactions
  where organizer_id = p_org and kind = 'withdraw';
  hold := v_hold;
  available := greatest(0, v_ready - v_out);
  transferred := v_out;
  return next;
end $$;

-- ---------------------------------------------------------------------------
-- registration + payment (single transaction)
-- ---------------------------------------------------------------------------

create or replace function public.register_sale(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seminar public.seminars%rowtype;
  v_ticket public.tickets%rowtype;
  v_promo public.promo_codes%rowtype;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_paid numeric := 0;
  v_code text := '';
  v_id text;
  v_pay_id text;
  v_name text;
  v_ticket_name text;
  v_customer uuid := auth.uid();
  v_when text;
  v_avatar text;
  v_face integer;
  v_has_promo boolean := false;
  v_ticket_ok boolean := false;
begin
  if payload is null or coalesce(payload->>'seminarId', '') = '' then
    return jsonb_build_object('ok', false, 'error', 'Seminar tanlanmagan');
  end if;
  v_name := trim(coalesce(payload->>'name', ''));
  if char_length(v_name) < 2 then
    return jsonb_build_object('ok', false, 'error', 'Ismni kiriting');
  end if;

  select * into v_seminar from public.seminars where id = payload->>'seminarId' for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Seminar topilmadi');
  end if;
  if v_seminar.status = 'bekor' or not v_seminar.published or v_seminar.status = 'qoralama' then
    return jsonb_build_object('ok', false, 'error', 'Ro‘yxatdan o‘tish yopiq');
  end if;

  v_ticket_name := coalesce(nullif(trim(payload->>'ticket'), ''), 'Standart');
  select * into v_ticket
  from public.tickets
  where seminar_id = v_seminar.id
    and active
    and (
      id = payload->>'ticketId'
      or lower(name) = lower(v_ticket_name)
      or lower(name) like lower(v_ticket_name) || '%'
    )
  order by (lower(name) = lower(v_ticket_name)) desc, sort_at
  limit 1
  for update;
  v_ticket_ok := found;

  if v_ticket_ok then
    if v_ticket.seats > 0 and v_ticket.sold >= v_ticket.seats then
      return jsonb_build_object('ok', false, 'error', 'Bu chipta turi tugagan');
    end if;
    v_subtotal := v_ticket.price;
    v_ticket_name := v_ticket.name;
  else
    v_subtotal := least(greatest(coalesce((payload->>'subtotal')::numeric, 0), 0), 50000000);
  end if;

  v_code := upper(trim(coalesce(payload->>'promoCode', '')));
  if v_code <> '' then
    select * into v_promo
    from public.promo_codes
    where upper(code) = v_code
      and status = 'faol'
      and organizer_id = v_seminar.organizer_id
      and (seminar_id is null or seminar_id = 'all' or seminar_id = v_seminar.id)
      and (limit_n = 0 or used < limit_n)
    order by case when seminar_id = v_seminar.id then 0 when seminar_id = 'all' or seminar_id is null then 1 else 2 end
    limit 1
    for update;
    if not found then
      return jsonb_build_object('ok', false, 'error', 'Promokod topilmadi yoki muddati o‘tgan');
    end if;
    v_has_promo := true;
    if v_promo.kind = 'summa' then
      v_discount := least(v_subtotal, v_promo.value);
    else
      v_discount := round(v_subtotal * v_promo.value / 100.0);
    end if;
  end if;

  v_paid := greatest(0, v_subtotal - v_discount);
  v_id := coalesce(nullif(payload->>'clientId', ''), (floor(extract(epoch from clock_timestamp()) * 1000)::bigint)::text);
  if exists (select 1 from public.registrations where id = v_id) then
    v_id := v_id || floor(random() * 1000)::text;
  end if;
  v_pay_id := 'ST' || to_char(now(), 'YYYY') || '-' || v_id;
  v_when := to_char(now(), 'FMDD') || '-' ||
    (array['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'])[extract(month from now())::int]
    || ' ' || to_char(now(), 'YYYY') || ', ' || to_char(now(), 'HH24:MI');
  v_avatar := coalesce(nullif(payload->>'avatar', ''), '/images/avatar.jpg');
  v_face := (abs(hashtext(v_id)) % 8);

  perform set_config('stomahub.trusted', 'on', true);

  insert into public.registrations (
    id, seminar_id, organizer_id, customer_id, name, clinic, phone, email, ticket, ticket_id,
    pay, registered, city, role, avatar, code, arrived, sort_at
  ) values (
    v_id, v_seminar.id, v_seminar.organizer_id, v_customer, v_name,
    coalesce(nullif(payload->>'clinic', ''), '—'),
    coalesce(payload->>'phone', ''),
    coalesce(payload->>'email', ''),
    v_ticket_name, case when v_ticket_ok then v_ticket.id else null end,
    'paid', v_when,
    coalesce(nullif(payload->>'city', ''), v_seminar.city, 'Toshkent'),
    coalesce(nullif(payload->>'spec', ''), 'Stomatolog'),
    v_avatar, 'QR-' || v_id, false, -floor(extract(epoch from clock_timestamp()) * 1000)::bigint
  );

  insert into public.payments (
    id, registration_id, seminar_id, organizer_id, customer_id, who, clinic, seminar_title,
    sum, gross, discount, promo, method, state, phone, email, ticket, when_label, avatar, face, sort_at
  ) values (
    v_pay_id, v_id, v_seminar.id, v_seminar.organizer_id, v_customer, v_name,
    coalesce(nullif(payload->>'clinic', ''), '—'),
    v_seminar.title, v_paid, v_subtotal, v_discount,
    case when v_has_promo then v_promo.code else '' end,
    coalesce(nullif(payload->>'method', ''), 'Click'),
    'ok',
    coalesce(payload->>'phone', ''),
    coalesce(payload->>'email', ''),
    v_ticket_name, v_when, v_avatar, v_face,
    -floor(extract(epoch from clock_timestamp()) * 1000)::bigint
  );

  update public.seminars
  set sold = sold + 1,
      revenue = revenue + v_paid,
      seats = greatest(seats, sold + 1)
  where id = v_seminar.id;

  if v_ticket_ok then
    update public.tickets set sold = sold + 1 where id = v_ticket.id;
  end if;

  if v_has_promo then
    update public.promo_codes set used = used + 1 where id = v_promo.id;
  end if;

  insert into public.activity_log (id, organizer_id, icon, title, text, time_label, sort_at)
  values (
    'act-' || v_id, v_seminar.organizer_id, 'pay', 'To‘lov qabul qilindi',
    v_name || ' — ' || trim(to_char(v_paid, 'FM999 999 999 999')) || ' so‘m',
    to_char(now(), 'HH24:MI'),
    -floor(extract(epoch from clock_timestamp()) * 1000)::bigint
  );

  return jsonb_build_object(
    'ok', true,
    'paid', v_paid,
    'discount', v_discount,
    'promo', case when v_has_promo then v_promo.code else '' end,
    'promoId', case when v_has_promo then v_promo.id else '' end,
    'person', jsonb_build_object(
      'id', v_id,
      'name', v_name,
      'clinic', coalesce(nullif(payload->>'clinic', ''), '—'),
      'phone', coalesce(payload->>'phone', ''),
      'email', coalesce(payload->>'email', ''),
      'ticket', v_ticket_name,
      'pay', 'paid',
      'registered', v_when,
      'city', coalesce(nullif(payload->>'city', ''), v_seminar.city, 'Toshkent'),
      'role', coalesce(nullif(payload->>'spec', ''), 'Stomatolog'),
      'avatar', v_avatar,
      'seminarId', v_seminar.id,
      'arrived', false,
      'code', 'QR-' || v_id
    ),
    'payment', jsonb_build_object(
      'id', v_pay_id,
      'who', v_name,
      'clinic', coalesce(nullif(payload->>'clinic', ''), '—'),
      'seminar', v_seminar.title,
      'seminarId', v_seminar.id,
      'sum', v_paid,
      'gross', v_subtotal,
      'discount', v_discount,
      'promo', case when v_has_promo then v_promo.code else '' end,
      'method', coalesce(nullif(payload->>'method', ''), 'Click'),
      'state', 'ok',
      'phone', coalesce(payload->>'phone', ''),
      'email', coalesce(payload->>'email', ''),
      'ticket', v_ticket_name,
      'when', v_when,
      'avatar', v_avatar,
      'face', v_face
    ),
    'seminar', (
      select jsonb_build_object(
        'id', s.id,
        'sold', s.sold,
        'revenue', s.revenue,
        'checked', s.checked,
        'seats', s.seats
      )
      from public.seminars s where s.id = v_seminar.id
    )
  );
exception when others then
  return jsonb_build_object('ok', false, 'error', sqlerrm);
end $$;

drop function if exists public.check_in(text);
create or replace function public.check_in(p_registration_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.registrations%rowtype;
  v_title text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Avval kiring');
  end if;
  select * into r from public.registrations where id = p_registration_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Ishtirokchi topilmadi');
  end if;
  if r.organizer_id <> auth.uid() then
    return jsonb_build_object('ok', false, 'error', 'Ruxsat yo‘q');
  end if;
  if r.arrived then
    return jsonb_build_object('ok', true, 'already', true, 'id', r.id, 'name', r.name);
  end if;
  perform set_config('stomahub.trusted', 'on', true);
  update public.registrations set arrived = true where id = r.id;
  insert into public.checkins (registration_id, seminar_id, organizer_id, method)
  values (r.id, r.seminar_id, r.organizer_id, 'qr')
  on conflict (registration_id) do nothing;
  update public.seminars set checked = checked + 1 where id = r.seminar_id;
  select title into v_title from public.seminars where id = r.seminar_id;
  insert into public.activity_log (id, organizer_id, icon, title, text, time_label, sort_at)
  values (
    'chk-' || r.id, r.organizer_id, 'qr', r.name || ' — Keldi', coalesce(v_title, ''),
    to_char(now(), 'HH24:MI'), -floor(extract(epoch from clock_timestamp()) * 1000)::bigint
  )
  on conflict (id) do nothing;
  return jsonb_build_object('ok', true, 'id', r.id, 'name', r.name);
end $$;

create or replace function public.add_participant(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sem public.seminars%rowtype;
  v_id text;
  v_pay text;
begin
  if not public.is_organizer() then
    return jsonb_build_object('ok', false, 'error', 'Faqat tashkilotchi qo‘sha oladi');
  end if;
  select * into v_sem from public.seminars where id = payload->>'seminarId' and organizer_id = auth.uid() for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Seminar topilmadi');
  end if;
  v_id := coalesce(nullif(payload->>'id', ''), (floor(extract(epoch from clock_timestamp()) * 1000)::bigint)::text);
  v_pay := coalesce(nullif(payload->>'pay', ''), 'paid');
  insert into public.registrations (
    id, seminar_id, organizer_id, name, clinic, phone, email, ticket, pay, registered, city, role, avatar, code, arrived, sort_at
  ) values (
    v_id, v_sem.id, auth.uid(),
    coalesce(payload->>'name', 'Ishtirokchi'),
    coalesce(payload->>'clinic', '—'),
    coalesce(payload->>'phone', ''),
    coalesce(payload->>'email', ''),
    coalesce(payload->>'ticket', 'Standart'),
    v_pay,
    coalesce(payload->>'registered', to_char(now(), 'HH24:MI')),
    coalesce(payload->>'city', v_sem.city),
    coalesce(payload->>'role', 'Stomatolog'),
    coalesce(payload->>'avatar', '/images/avatar.jpg'),
    coalesce(nullif(payload->>'code', ''), 'QR-' || v_id),
    coalesce((payload->>'arrived')::boolean, false),
    -floor(extract(epoch from clock_timestamp()) * 1000)::bigint
  )
  on conflict (id) do nothing;
  if v_pay <> 'cancel' then
    perform set_config('stomahub.trusted', 'on', true);
    update public.seminars
    set sold = sold + 1, seats = greatest(seats, sold + 1)
    where id = v_sem.id;
  end if;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

create or replace function public.remove_participant(registration_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.registrations%rowtype;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Avval kiring');
  end if;
  select * into r from public.registrations where id = registration_id for update;
  if not found then
    return jsonb_build_object('ok', true);
  end if;
  if r.organizer_id <> auth.uid() then
    return jsonb_build_object('ok', false, 'error', 'Ruxsat yo‘q');
  end if;
  delete from public.registrations where id = r.id;
  perform set_config('stomahub.trusted', 'on', true);
  update public.seminars
  set sold = greatest(0, sold - 1)
  where id = r.seminar_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.refund_payment(payment_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.payments%rowtype;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Avval kiring');
  end if;
  select * into p from public.payments where id = payment_id for update;
  if not found or p.organizer_id <> auth.uid() then
    return jsonb_build_object('ok', false, 'error', 'To‘lov topilmadi');
  end if;
  if p.state = 'refund' then
    return jsonb_build_object('ok', true);
  end if;
  update public.payments set state = 'refund' where id = p.id;
  if p.state = 'ok' then
    perform set_config('stomahub.trusted', 'on', true);
    update public.seminars
    set revenue = greatest(0, revenue - coalesce(p.sum, 0))
    where id = p.seminar_id;
  end if;
  insert into public.activity_log (id, organizer_id, icon, title, text, time_label, sort_at)
  values (
    'rf-' || p.id, p.organizer_id, 'pay', 'To‘lov qaytarildi', p.who,
    to_char(now(), 'HH24:MI'), -floor(extract(epoch from clock_timestamp()) * 1000)::bigint
  )
  on conflict (id) do nothing;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.cancel_seminar(seminar_id text, reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.seminars%rowtype;
  v_drop numeric := 0;
  p record;
begin
  if not public.is_organizer() then
    return jsonb_build_object('ok', false, 'error', 'Ruxsat yo‘q');
  end if;
  select * into s from public.seminars where id = seminar_id and organizer_id = auth.uid() for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Seminar topilmadi');
  end if;
  for p in select * from public.payments where seminar_id = s.id and state = 'ok' for update
  loop
    v_drop := v_drop + coalesce(p.sum, 0);
    update public.payments set state = 'refund' where id = p.id;
  end loop;
  perform set_config('stomahub.trusted', 'on', true);
  update public.seminars
  set status = 'bekor',
      published = true,
      badge = 'Bekor qilingan',
      cancel_reason = coalesce(reason, ''),
      revenue = greatest(0, revenue - v_drop)
  where id = s.id;
  insert into public.activity_log (id, organizer_id, icon, title, text, time_label, sort_at)
  values (
    'cx-' || s.id || '-' || floor(extract(epoch from clock_timestamp()))::text,
    s.organizer_id, 'cal', 'Seminar bekor qilindi', s.title,
    to_char(now(), 'HH24:MI'), -floor(extract(epoch from clock_timestamp()) * 1000)::bigint
  );
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.withdraw_funds(p_amount numeric, p_card text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avail numeric;
  v_id text;
begin
  if not public.is_organizer() then
    return jsonb_build_object('ok', false, 'error', 'Ruxsat yo‘q');
  end if;
  if coalesce(p_amount, 0) < 1000 then
    return jsonb_build_object('ok', false, 'error', 'Kamida 1 000 so‘m kiriting');
  end if;
  select available into v_avail from public.organizer_wallet(auth.uid());
  if p_amount > coalesce(v_avail, 0) then
    return jsonb_build_object('ok', false, 'error', 'Yechib olish mumkin bo‘lgan summadan oshmasin');
  end if;
  v_id := 'w-' || floor(extract(epoch from clock_timestamp()) * 1000)::text;
  insert into public.wallet_transactions (id, organizer_id, amount, card, date_label, method, kind)
  values (v_id, auth.uid(), p_amount, coalesce(nullif(p_card, ''), '4521'), to_char(now(), 'DD.MM.YYYY'), 'card', 'withdraw');
  insert into public.activity_log (id, organizer_id, icon, title, text, time_label, sort_at)
  values (
    'wd-' || v_id, auth.uid(), 'pay', 'Pul yechish so‘rovi',
    trim(to_char(p_amount, 'FM999 999 999 999')) || ' so‘m',
    to_char(now(), 'HH24:MI'), -floor(extract(epoch from clock_timestamp()) * 1000)::bigint
  );
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.seminars enable row level security;
alter table public.tickets enable row level security;
alter table public.promo_codes enable row level security;
alter table public.registrations enable row level security;
alter table public.payments enable row level security;
alter table public.checkins enable row level security;
alter table public.certificates enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.requisites enable row level security;
alter table public.activity_log enable row level security;
alter table public.seminar_reviews enable row level security;
alter table public.organizer_speakers enable row level security;
alter table public.organizer_settings enable row level security;
alter table public.support_messages enable row level security;
alter table public.telegram_contacts enable row level security;
alter table public.phone_otps enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select to authenticated using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert to authenticated with check (id = auth.uid());

drop policy if exists seminars_public_read on public.seminars;
create policy seminars_public_read on public.seminars
for select to anon, authenticated
using (published = true and status <> 'qoralama');

drop policy if exists seminars_owner_read on public.seminars;
create policy seminars_owner_read on public.seminars
for select to authenticated using (organizer_id = auth.uid());

drop policy if exists seminars_owner_write on public.seminars;
create policy seminars_owner_write on public.seminars
for insert to authenticated
with check (organizer_id = auth.uid() and public.is_organizer());

drop policy if exists seminars_owner_update on public.seminars;
create policy seminars_owner_update on public.seminars
for update to authenticated
using (organizer_id = auth.uid() and public.is_organizer())
with check (organizer_id = auth.uid() and public.is_organizer());

drop policy if exists seminars_owner_delete on public.seminars;
create policy seminars_owner_delete on public.seminars
for delete to authenticated
using (organizer_id = auth.uid() and public.is_organizer());

drop policy if exists tickets_public_read on public.tickets;
create policy tickets_public_read on public.tickets
for select to anon, authenticated
using (
  exists (
    select 1 from public.seminars s
    where s.id = tickets.seminar_id
      and ((s.published and s.status <> 'qoralama') or s.organizer_id = auth.uid())
  )
);

drop policy if exists tickets_owner_write on public.tickets;
create policy tickets_owner_write on public.tickets
for all to authenticated
using (organizer_id = auth.uid() and public.is_organizer())
with check (organizer_id = auth.uid() and public.is_organizer());

drop policy if exists promo_public_read on public.promo_codes;
create policy promo_public_read on public.promo_codes
for select to anon, authenticated
using (
  status = 'faol'
  and (
    seminar_id is null or seminar_id = 'all'
    or exists (
      select 1 from public.seminars s
      where s.id = promo_codes.seminar_id and s.published and s.status <> 'qoralama'
    )
  )
);

drop policy if exists promo_owner_all on public.promo_codes;
create policy promo_owner_all on public.promo_codes
for all to authenticated
using (organizer_id = auth.uid() and public.is_organizer())
with check (organizer_id = auth.uid() and public.is_organizer());

drop policy if exists registrations_owner on public.registrations;
create policy registrations_owner on public.registrations
for all to authenticated
using (organizer_id = auth.uid() and public.is_organizer())
with check (organizer_id = auth.uid() and public.is_organizer());

drop policy if exists registrations_customer_read on public.registrations;
create policy registrations_customer_read on public.registrations
for select to authenticated using (customer_id = auth.uid());

drop policy if exists payments_owner on public.payments;
create policy payments_owner on public.payments
for all to authenticated
using (organizer_id = auth.uid() and public.is_organizer())
with check (organizer_id = auth.uid() and public.is_organizer());

drop policy if exists payments_customer_read on public.payments;
create policy payments_customer_read on public.payments
for select to authenticated using (customer_id = auth.uid());

drop policy if exists checkins_owner on public.checkins;
create policy checkins_owner on public.checkins
for all to authenticated
using (organizer_id = auth.uid() and public.is_organizer())
with check (organizer_id = auth.uid() and public.is_organizer());

drop policy if exists certificates_owner on public.certificates;
create policy certificates_owner on public.certificates
for all to authenticated
using (organizer_id = auth.uid() and public.is_organizer())
with check (organizer_id = auth.uid() and public.is_organizer());

drop policy if exists wallet_owner on public.wallet_transactions;
create policy wallet_owner on public.wallet_transactions
for all to authenticated
using (organizer_id = auth.uid() and public.is_organizer())
with check (organizer_id = auth.uid() and public.is_organizer());

drop policy if exists requisites_owner on public.requisites;
create policy requisites_owner on public.requisites
for all to authenticated
using (organizer_id = auth.uid() and public.is_organizer())
with check (organizer_id = auth.uid() and public.is_organizer());

drop policy if exists activity_owner on public.activity_log;
create policy activity_owner on public.activity_log
for all to authenticated
using (organizer_id = auth.uid() and public.is_organizer())
with check (organizer_id = auth.uid() and public.is_organizer());

drop policy if exists reviews_owner on public.seminar_reviews;
create policy reviews_owner on public.seminar_reviews
for all to authenticated
using (organizer_id = auth.uid() and public.is_organizer())
with check (organizer_id = auth.uid() and public.is_organizer());

drop policy if exists speakers_owner on public.organizer_speakers;
create policy speakers_owner on public.organizer_speakers
for all to authenticated
using (organizer_id = auth.uid() and public.is_organizer())
with check (organizer_id = auth.uid() and public.is_organizer());

drop policy if exists settings_owner on public.organizer_settings;
create policy settings_owner on public.organizer_settings
for all to authenticated
using (organizer_id = auth.uid() and public.is_organizer())
with check (organizer_id = auth.uid() and public.is_organizer());

drop policy if exists messages_owner on public.support_messages;
create policy messages_owner on public.support_messages
for all to authenticated
using (organizer_id = auth.uid() or author_id = auth.uid())
with check (organizer_id = auth.uid() or author_id = auth.uid());

grant usage on schema public to anon, authenticated;

grant select on public.seminars, public.tickets, public.promo_codes to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on
  public.seminars, public.tickets, public.promo_codes, public.registrations, public.payments,
  public.checkins, public.certificates, public.wallet_transactions, public.requisites,
  public.activity_log, public.seminar_reviews, public.organizer_speakers, public.organizer_settings,
  public.support_messages
to authenticated;

revoke all on public.telegram_contacts from anon, authenticated;
revoke all on public.phone_otps from anon, authenticated;

revoke all on function public.register_sale(jsonb) from public;
revoke all on function public.check_in(text) from public;
revoke all on function public.add_participant(jsonb) from public;
revoke all on function public.remove_participant(text) from public;
revoke all on function public.refund_payment(text) from public;
revoke all on function public.cancel_seminar(text, text) from public;
revoke all on function public.withdraw_funds(numeric, text) from public;
revoke all on function public.organizer_wallet(uuid) from public;
revoke all on function public.is_organizer() from public;

grant execute on function public.register_sale(jsonb) to anon, authenticated;
grant execute on function public.check_in(text) to authenticated;
grant execute on function public.add_participant(jsonb) to authenticated;
grant execute on function public.remove_participant(text) to authenticated;
grant execute on function public.refund_payment(text) to authenticated;
grant execute on function public.cancel_seminar(text, text) to authenticated;
grant execute on function public.withdraw_funds(numeric, text) to authenticated;
grant execute on function public.organizer_wallet(uuid) to authenticated;
grant execute on function public.is_organizer() to anon, authenticated;

-- realtime: a new registration shows up in the cabinet without a reload
do $$
declare
  t text;
begin
  foreach t in array array[
    'seminars', 'tickets', 'promo_codes', 'registrations', 'payments',
    'checkins', 'certificates', 'wallet_transactions'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when others then
      null;
    end;
    execute format('alter table public.%I replica identity full', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- demo organizer (Ibrohim Karimov). Password: StomaHub-demo-2026
-- ---------------------------------------------------------------------------

do $demo$
declare
  v_id uuid := '11111111-1111-4111-8111-111111111111';
  v_hash text;
begin
  begin
    v_hash := extensions.crypt('StomaHub-demo-2026', extensions.gen_salt('bf'));
  exception when undefined_function or invalid_schema_name then
    v_hash := public.crypt('StomaHub-demo-2026', public.gen_salt('bf'));
  end;

  if not exists (select 1 from auth.users where id = v_id) then
    if exists (select 1 from auth.users where lower(email) = 'organizer@stomahub.uz') then
      raise notice 'organizer@stomahub.uz already exists with another id; demo user left as-is';
    else
      begin
        insert into auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
          confirmation_token, recovery_token, email_change_token_new, email_change,
          email_change_token_current, is_sso_user, is_anonymous
        ) values (
          '00000000-0000-0000-0000-000000000000',
          v_id,
          'authenticated',
          'authenticated',
          'organizer@stomahub.uz',
          v_hash,
          now(),
          '{"provider":"email","providers":["email"]}'::jsonb,
          '{"name":"Ibrohim Karimov","role":"organizer"}'::jsonb,
          now(), now(),
          '', '', '', '', '',
          false, false
        );
      exception when others then
        insert into auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
          confirmation_token, recovery_token, email_change, email_change_token_new
        ) values (
          '00000000-0000-0000-0000-000000000000',
          v_id,
          'authenticated',
          'authenticated',
          'organizer@stomahub.uz',
          v_hash,
          now(),
          '{"provider":"email","providers":["email"]}'::jsonb,
          '{"name":"Ibrohim Karimov","role":"organizer"}'::jsonb,
          now(), now(),
          '', '', '', ''
        );
      end;
    end if;
  end if;

  if to_regclass('auth.identities') is not null
     and exists (select 1 from auth.users where id = v_id)
     and not exists (select 1 from auth.identities where user_id = v_id and provider = 'email')
  then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'auth' and table_name = 'identities' and column_name = 'provider_id'
    ) then
      insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
      values (
        '22222222-2222-4222-8222-222222222222',
        v_id,
        jsonb_build_object('sub', v_id::text, 'email', 'organizer@stomahub.uz', 'email_verified', true),
        'email',
        v_id::text,
        now(), now(), now()
      );
    end if;
  end if;
exception when others then
  raise notice 'demo auth user: %', sqlerrm;
end
$demo$;

insert into public.profiles (id, role, name, email)
select '11111111-1111-4111-8111-111111111111'::uuid, 'organizer', 'Ibrohim Karimov', 'organizer@stomahub.uz'
where exists (select 1 from auth.users where id = '11111111-1111-4111-8111-111111111111'::uuid)
on conflict (id) do update
set role = 'organizer',
    name = excluded.name,
    email = coalesce(public.profiles.email, excluded.email),
    updated_at = now();
