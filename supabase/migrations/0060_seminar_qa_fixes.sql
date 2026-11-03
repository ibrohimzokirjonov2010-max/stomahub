-- 0060: Seminar QA tuzatishlari (QA B). HECH NARSA O‘CHIRILMAYDI, mavjud qatorlar o‘zgartirilmaydi
-- (faqat moderated_at yangi ustuniga mavjud e’lon qilingan seminarlar uchun belgi qo‘yiladi).
--  1) register_sale: chipta faqat shu seminarniki (ticketId yoki aniq nom), narx serverdan,
--     early bird form->tickets dan, tashkilotchi o‘z seminariga yozilmaydi, promo chegirma <= narx,
--     shahar/mutaxassislik uchun soxta 'Toshkent'/'Stomatolog' qiymati yo‘q, yashirin/o‘tgan seminar yopiq.
--  2) check_promo: xuddi shu narx va chegirma qoidasi (ticketId bilan).
--  3) promo_codes: foiz 1..100, summa > 0 (yangi/yangilangan yozuvlar uchun trigger).
--  4) check_in: faqat seminar kunlari (boshlanishidan 1 kun oldin .. tugash kuni, Toshkent vaqti).
--  5) Moderatsiya: tashkilotchi e’lon qilgan yangi seminar admin tasdiqlaguncha yashirin
--     (hidden = true, hidden_reason = 'moderatsiya'). Admin "Qayta ko‘rsatish" = tasdiqlash.
--  6) seminars_public: savollar uchun telefon (contact_phone) — tashkilotchi o‘zi ochiq e’lon qilgan raqam.
--  7) seminars: start/end sana o‘tmishda bo‘lgan yangi seminarni e’lon qilib bo‘lmaydi.

-- 1) register_sale -------------------------------------------------------------------------------
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
  v_pending boolean := false;
  v_early numeric := 0;
  v_early_until text := '';
  v_has_tickets boolean := false;
  v_today text := to_char(now() at time zone 'Asia/Tashkent', 'YYYY-MM-DD');
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
  if v_seminar.status in ('bekor', 'yakunlangan') or not v_seminar.published or v_seminar.status = 'qoralama'
     or v_seminar.hidden or coalesce(nullif(v_seminar.end_date, ''), v_seminar.start_date, '9999-12-31') < v_today then
    return jsonb_build_object('ok', false, 'error', 'Ro‘yxatdan o‘tish yopiq');
  end if;
  -- 0060: tashkilotchi o‘z seminariga xaridor sifatida yozila olmaydi (do‘kondagi kabi)
  if v_customer is not null and v_customer = v_seminar.organizer_id then
    return jsonb_build_object('ok', false, 'error', 'O‘z seminaringizga ro‘yxatdan o‘ta olmaysiz');
  end if;

  -- 0060: chipta faqat shu seminarning haqiqiy, faol chiptasi bo‘lishi shart.
  -- Prefiks bo‘yicha qidiruv va mijoz yuborgan subtotal ga qaytish olib tashlandi (VIP xatosi).
  select exists (select 1 from public.tickets where seminar_id = v_seminar.id and active) into v_has_tickets;
  v_ticket_name := nullif(trim(coalesce(payload->>'ticket', '')), '');
  select * into v_ticket
  from public.tickets
  where seminar_id = v_seminar.id
    and active
    and (
      (coalesce(payload->>'ticketId', '') <> '' and id = payload->>'ticketId')
      or (coalesce(payload->>'ticketId', '') = '' and v_ticket_name is not null and lower(name) = lower(v_ticket_name))
    )
  order by sort_at
  limit 1
  for update;
  v_ticket_ok := found;

  if not v_ticket_ok then
    if v_has_tickets then
      return jsonb_build_object('ok', false, 'error', 'Chipta turi topilmadi. Sahifani yangilab, chiptani qayta tanlang');
    end if;
    return jsonb_build_object('ok', false, 'error', 'Bu seminar uchun chiptalar hali qo‘shilmagan');
  end if;
  if v_ticket.seats > 0 and v_ticket.sold >= v_ticket.seats then
    return jsonb_build_object('ok', false, 'error', 'Bu chipta turi tugagan');
  end if;
  v_subtotal := greatest(coalesce(v_ticket.price, 0), 0);
  v_ticket_name := v_ticket.name;
  -- Early bird narxi seminars.form->tickets[] da saqlanadi (sahifadagi bilan bir manba)
  select coalesce(nullif(x->>'earlyPrice', '')::numeric, 0), coalesce(x->>'earlyUntil', '')
    into v_early, v_early_until
    from jsonb_array_elements(case when jsonb_typeof(v_seminar.form->'tickets') = 'array' then v_seminar.form->'tickets' else '[]'::jsonb end) x
   where x->>'id' = v_ticket.id
   limit 1;
  if coalesce(v_early, 0) > 0 and coalesce(v_early_until, '') <> '' and v_today <= v_early_until and v_early < v_subtotal then
    v_subtotal := v_early;
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
    if v_promo.value <= 0 or (v_promo.kind = 'foiz' and v_promo.value > 100) then
      return jsonb_build_object('ok', false, 'error', 'Promokod noto‘g‘ri sozlangan');
    end if;
    if v_subtotal <= 0 then
      return jsonb_build_object('ok', false, 'error', 'Bepul chiptaga promokod qo‘llanmaydi');
    end if;
    if v_promo.kind = 'summa' then
      if v_promo.value > v_subtotal then
        return jsonb_build_object('ok', false, 'error', 'Promokod chegirmasi chipta narxidan katta');
      end if;
      v_discount := v_promo.value;
    else
      v_discount := round(v_subtotal * least(v_promo.value, 100) / 100.0);
    end if;
  end if;

  v_paid := greatest(0, v_subtotal - v_discount);
  -- Real to‘lov shlyuzi yo‘q: pullik chipta har doim 'kutilmoqda' bo‘lib yoziladi, tashkilotchi tasdiqlaydi.
  v_pending := v_paid > 0;
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
    v_ticket_name, v_ticket.id,
    case when v_pending then 'wait' else 'paid' end, v_when,
    coalesce(nullif(trim(payload->>'city'), ''), ''),
    coalesce(nullif(trim(payload->>'spec'), ''), ''),
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
    case when v_pending then 'wait' else 'ok' end,
    coalesce(payload->>'phone', ''),
    coalesce(payload->>'email', ''),
    v_ticket_name, v_when, v_avatar, v_face,
    -floor(extract(epoch from clock_timestamp()) * 1000)::bigint
  );

  update public.seminars
  set sold = sold + 1,
      revenue = revenue + case when v_pending then 0 else v_paid end,
      seats = greatest(seats, sold + 1)
  where id = v_seminar.id;

  update public.tickets set sold = sold + 1 where id = v_ticket.id;

  if v_has_promo then
    update public.promo_codes set used = used + 1 where id = v_promo.id;
  end if;

  insert into public.activity_log (id, organizer_id, icon, title, text, time_label, sort_at)
  values (
    'act-' || v_id, v_seminar.organizer_id, 'pay', case when v_pending then 'Yangi ro‘yxat (to‘lov kutilmoqda)' else 'Ro‘yxatdan o‘tdi (bepul)' end,
    v_name || ' — ' || trim(to_char(v_paid, 'FM999 999 999 999')) || ' so‘m',
    to_char(now(), 'HH24:MI'),
    -floor(extract(epoch from clock_timestamp()) * 1000)::bigint
  );

  return jsonb_build_object(
    'ok', true, 'pending', v_pending,
    'gross', v_subtotal,
    'ticketId', v_ticket.id,
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
      'pay', case when v_pending then 'wait' else 'paid' end,
      'registered', v_when,
      'city', coalesce(nullif(trim(payload->>'city'), ''), ''),
      'role', coalesce(nullif(trim(payload->>'spec'), ''), ''),
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
      'state', case when v_pending then 'wait' else 'ok' end,
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
revoke all on function public.register_sale(jsonb) from public;
grant execute on function public.register_sale(jsonb) to anon, authenticated;

-- 2) check_promo (chipta bilan) --------------------------------------------------------------------
create or replace function public.check_promo_ticket(p_seminar_id text, p_ticket_id text, p_code text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_sem public.seminars%rowtype;
  v_ticket public.tickets%rowtype;
  v_promo public.promo_codes%rowtype;
  v_code text := upper(trim(coalesce(p_code, '')));
  v_amount numeric := 0;
  v_early numeric := 0;
  v_early_until text := '';
  v_today text := to_char(now() at time zone 'Asia/Tashkent', 'YYYY-MM-DD');
  v_discount numeric := 0;
begin
  if v_code = '' then return jsonb_build_object('ok', false, 'error', 'Promokodni kiriting'); end if;
  if length(v_code) > 64 then return jsonb_build_object('ok', false, 'error', 'Promokod topilmadi yoki muddati o‘tgan'); end if;
  select * into v_sem from public.seminars
   where id = p_seminar_id and published and status <> 'qoralama' and not hidden and not coalesce(is_test, false);
  if not found then return jsonb_build_object('ok', false, 'error', 'Seminar topilmadi'); end if;
  select * into v_ticket from public.tickets where id = p_ticket_id and seminar_id = v_sem.id and active;
  if not found then return jsonb_build_object('ok', false, 'error', 'Chipta turi topilmadi'); end if;
  v_amount := greatest(coalesce(v_ticket.price, 0), 0);
  select coalesce(nullif(x->>'earlyPrice', '')::numeric, 0), coalesce(x->>'earlyUntil', '')
    into v_early, v_early_until
    from jsonb_array_elements(case when jsonb_typeof(v_sem.form->'tickets') = 'array' then v_sem.form->'tickets' else '[]'::jsonb end) x
   where x->>'id' = v_ticket.id limit 1;
  if coalesce(v_early, 0) > 0 and coalesce(v_early_until, '') <> '' and v_today <= v_early_until and v_early < v_amount then
    v_amount := v_early;
  end if;
  if v_amount <= 0 then return jsonb_build_object('ok', false, 'error', 'Bepul chiptaga promokod qo‘llanmaydi'); end if;
  select * into v_promo from public.promo_codes
   where upper(code) = v_code and status = 'faol' and organizer_id = v_sem.organizer_id
     and (seminar_id is null or seminar_id = 'all' or seminar_id = v_sem.id)
     and (limit_n = 0 or used < limit_n)
   order by case when seminar_id = v_sem.id then 0 else 1 end
   limit 1;
  if not found then return jsonb_build_object('ok', false, 'error', 'Promokod topilmadi yoki muddati o‘tgan'); end if;
  if v_promo.value <= 0 or (v_promo.kind = 'foiz' and v_promo.value > 100) then
    return jsonb_build_object('ok', false, 'error', 'Promokod noto‘g‘ri sozlangan');
  end if;
  if v_promo.kind = 'summa' then
    if v_promo.value > v_amount then
      return jsonb_build_object('ok', false, 'error', 'Promokod chegirmasi chipta narxidan katta');
    end if;
    v_discount := v_promo.value;
  else
    v_discount := round(v_amount * v_promo.value / 100.0);
  end if;
  return jsonb_build_object('ok', true, 'code', v_code, 'kind', v_promo.kind, 'value', v_promo.value,
                            'amount', v_amount, 'discount', v_discount, 'total', greatest(0, v_amount - v_discount));
end $$;
revoke all on function public.check_promo_ticket(text, text, text) from public;
grant execute on function public.check_promo_ticket(text, text, text) to anon, authenticated;

-- 3) promo_codes qiymat chegaralari -------------------------------------------------------------
create or replace function public.promo_codes_validate()
returns trigger language plpgsql as $$
begin
  if new.kind = 'foiz' and (coalesce(new.value, 0) <= 0 or new.value > 100) then
    raise exception 'Foizli chegirma 1–100%% oralig‘ida bo‘lishi kerak';
  end if;
  if new.kind = 'summa' and coalesce(new.value, 0) <= 0 then
    raise exception 'Chegirma summasi 0 dan katta bo‘lishi kerak';
  end if;
  if new.kind = 'summa' and coalesce(new.seminar_id, 'all') <> 'all' and exists (
       select 1 from public.tickets t where t.seminar_id = new.seminar_id and t.active and t.price > 0)
     and new.value > (select max(t.price) from public.tickets t where t.seminar_id = new.seminar_id and t.active) then
    raise exception 'Chegirma summasi chipta narxidan katta bo‘lmasligi kerak';
  end if;
  return new;
end $$;
drop trigger if exists promo_codes_validate on public.promo_codes;
create trigger promo_codes_validate before insert or update of kind, value, seminar_id on public.promo_codes
  for each row execute function public.promo_codes_validate();

-- 4) check_in: faqat seminar kunlari ---------------------------------------------------------------
create or replace function public.check_in(p_registration_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.registrations%rowtype;
  s public.seminars%rowtype;
  v_today date := (now() at time zone 'Asia/Tashkent')::date;
  v_start date;
  v_end date;
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
  if r.pay = 'cancel' then
    return jsonb_build_object('ok', false, 'error', 'Ro‘yxat bekor qilingan');
  end if;
  select * into s from public.seminars where id = r.seminar_id;
  begin
    v_start := nullif(s.start_date, '')::date;
    v_end := coalesce(nullif(s.end_date, '')::date, v_start);
  exception when others then
    v_start := null; v_end := null;
  end;
  if v_start is not null and (v_today < v_start - 1 or v_today > v_end) then
    return jsonb_build_object('ok', false, 'error',
      case when v_today < v_start - 1 then 'Kirishni tasdiqlash faqat seminar kunlari ochiladi (' || to_char(v_start, 'DD.MM.YYYY') || ')'
           else 'Seminar yakunlangan — kirishni tasdiqlab bo‘lmaydi' end);
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
  insert into public.activity_log (id, organizer_id, icon, title, text, time_label, sort_at)
  values (
    'chk-' || r.id, r.organizer_id, 'qr', r.name || ' — Keldi', coalesce(s.title, ''),
    to_char(now(), 'HH24:MI'), -floor(extract(epoch from clock_timestamp()) * 1000)::bigint
  )
  on conflict (id) do nothing;
  return jsonb_build_object('ok', true, 'id', r.id, 'name', r.name);
end $$;

-- 5) Moderatsiya ---------------------------------------------------------------------------------
alter table public.seminars add column if not exists moderated_at timestamptz;
-- Hozir ommaga ko‘rinib turgan seminarlar avval tasdiqlangan deb belgilanadi (qatorlar o‘chirilmaydi).
update public.seminars set moderated_at = coalesce(updated_at, now())
 where moderated_at is null and published and not hidden;

create or replace function public.seminars_moderation_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() or current_setting('stomahub.trusted', true) = 'on' then
    -- admin yashirishni olib tashlasa — bu moderatsiyadan o‘tish
    if tg_op = 'UPDATE' and old.hidden and not new.hidden then
      new.moderated_at := coalesce(new.moderated_at, now());
    end if;
    return new;
  end if;
  if tg_op = 'UPDATE' then
    -- tashkilotchi yashirish/moderatsiya holatini o‘zi o‘zgartira olmaydi
    new.hidden := old.hidden;
    new.hidden_reason := old.hidden_reason;
    new.moderated_at := old.moderated_at;
  else
    new.hidden := false;
    new.hidden_reason := '';
    new.moderated_at := null;
  end if;
  if new.published and new.status <> 'qoralama' and new.moderated_at is null and not new.hidden then
    new.hidden := true;
    new.hidden_reason := 'moderatsiya';
  end if;
  return new;
end $$;
drop trigger if exists seminars_moderation_guard on public.seminars;
create trigger seminars_moderation_guard before insert or update on public.seminars
  for each row execute function public.seminars_moderation_guard();

-- 7) O‘tgan sanaga yangi seminar e’lon qilinmaydi
create or replace function public.seminars_date_guard()
returns trigger language plpgsql as $$
declare v_today text := to_char(now() at time zone 'Asia/Tashkent', 'YYYY-MM-DD');
begin
  if public.is_admin() or current_setting('stomahub.trusted', true) = 'on' then return new; end if;
  if new.published and new.status not in ('qoralama', 'yakunlangan', 'bekor')
     and coalesce(nullif(new.start_date, ''), v_today) < v_today
     and (tg_op = 'INSERT' or coalesce(old.start_date, '') is distinct from coalesce(new.start_date, '') or not old.published) then
    raise exception 'Seminar sanasi o‘tib ketgan — kelajakdagi sanani tanlang';
  end if;
  if coalesce(nullif(new.end_date, ''), new.start_date) < new.start_date then
    raise exception 'Tugash sanasi boshlanish sanasidan oldin bo‘lmasin';
  end if;
  return new;
end $$;
drop trigger if exists seminars_date_guard on public.seminars;
create trigger seminars_date_guard before insert or update of published, start_date, end_date, status on public.seminars
  for each row execute function public.seminars_date_guard();

-- 6) seminars_public: savollar uchun telefon ----------------------------------------------------
create or replace view public.seminars_public with (security_barrier = true) as
select s.id, s.organizer_id, s.title, s.speaker, s.date_label, s.city, s.format, s.days, s.seats,
       greatest(s.seats - s.sold, 0) as seats_left,
       s.status, s.badge, s.image, s.topic, s.published, s.held, s.about, s.category, s.tags, s.cover,
       s.start_date, s.start_time, s.end_date, s.end_time, s.place, s.address, s.place_img, s.template,
       case when s.form is null then null
            else s.form - 'promos' - 'contactPhone' - 'cancelReason' - 'revenue' - 'sold' end as form,
       s.speakers, s.sort_at, s.created_at, s.updated_at,
       s.gallery, s.faq, s.venue_notes, s.cert_design, s.contact_telegram,
       coalesce(nullif(s.contact_phone, ''), s.form->>'contactPhone', '') as contact_phone
  from public.seminars s
 where s.published = true and s.status <> 'qoralama' and not s.hidden and not coalesce(s.is_test, false)
   and public.organizer_is_public(s.organizer_id);
grant select on public.seminars_public to anon, authenticated;
