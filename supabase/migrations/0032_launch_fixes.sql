-- 0032_launch_fixes.sql — ishga tushirishdan oldingi tuzatishlar (QO‘LDA QO‘LLANADI)
-- 1) register_sale: pullik chipta endi hech qachon mijoz tomonida 'paid' / 'ok' bo‘lmaydi.
--    To‘lov summasi > 0 bo‘lsa registrations.pay='wait', payments.state='wait', revenue o‘zgarmaydi.
--    0 so‘mlik (bepul) chipta darhol 'paid' / 'ok'.
-- 2) confirm_registration_payment: tashkilotchi naqd/o‘tkazma to‘lovni qabul qilganini tasdiqlaydi.
-- 3) Bekor qilingan marketplace buyurtmalarida commission/payout = 0.

-- 1 -------------------------------------------------------------------------
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
    v_ticket_name, case when v_ticket_ok then v_ticket.id else null end,
    case when v_pending then 'wait' else 'paid' end, v_when,
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

  if v_ticket_ok then
    update public.tickets set sold = sold + 1 where id = v_ticket.id;
  end if;

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

-- 2 -------------------------------------------------------------------------
create or replace function public.confirm_registration_payment(p_registration_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.registrations%rowtype;
  v_sum numeric := 0;
begin
  select * into r from public.registrations where id = p_registration_id for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'Ishtirokchi topilmadi'); end if;
  if r.organizer_id <> auth.uid() and not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'Ruxsat yo‘q');
  end if;
  if r.pay <> 'wait' then return jsonb_build_object('ok', true, 'pay', r.pay); end if;
  perform set_config('stomahub.trusted', 'on', true);
  update public.registrations set pay = 'paid' where id = r.id;
  update public.payments set state = 'ok' where registration_id = r.id and state = 'wait'
    returning sum into v_sum;
  update public.seminars set revenue = revenue + coalesce(v_sum, 0) where id = r.seminar_id;
  return jsonb_build_object('ok', true, 'pay', 'paid', 'sum', coalesce(v_sum, 0));
end $$;
revoke all on function public.confirm_registration_payment(text) from public;
grant execute on function public.confirm_registration_payment(text) to authenticated;

-- 3 -------------------------------------------------------------------------
-- seller_orders.commission / payout — generated ustunlar (0004). Bekor qilingan buyurtmada 0 bo‘lishi uchun
-- ustunlar qayta yaratiladi (stored qiymatlar avtomatik qayta hisoblanadi, ma’lumot o‘chmaydi).
alter table public.seller_orders drop column if exists commission;
alter table public.seller_orders drop column if exists payout;
alter table public.seller_orders add column commission numeric(14,0) generated always as (
  case when status = 'bekor_qilindi' then 0
       else round(greatest(subtotal - discount_amount, 0) * commission_rate) end
) stored;
alter table public.seller_orders add column payout numeric(14,0) generated always as (
  case when status = 'bekor_qilindi' then 0
       else greatest(subtotal - discount_amount, 0) - round(greatest(subtotal - discount_amount, 0) * commission_rate) + delivery_fee end
) stored;
notify pgrst, 'reload schema';
