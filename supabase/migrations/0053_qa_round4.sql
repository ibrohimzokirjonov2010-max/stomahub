-- 0053: QA round 4. Ma'lumot o‘chirilmaydi: faqat yangi ustunlar, trigger yangilanishi,
-- bitta sertifikat qatorini to‘ldirish va seed hamjamiyat postlarini yashirish.

-- 0) YAGONA ism ustuvorligi: profiles.name → full_name → email (@ dan oldingi qism).
create or replace function public.display_name(p_name text, p_full text, p_email text)
returns text language sql immutable as $$
  select coalesce(nullif(trim(p_name), ''), nullif(trim(p_full), ''), nullif(split_part(coalesce(p_email, ''), '@', 1), ''), '')
$$;
grant execute on function public.display_name(text, text, text) to anon, authenticated;

-- 0052 community_author: avval full_name edi → endi yagona tartib
create or replace function public.community_author(p_id uuid, p_fallback jsonb)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', p_id,
    'name', coalesce(nullif(public.display_name(pr.name, pr.full_name, pr.email), ''), nullif(p_fallback->>'name', ''), 'Foydalanuvchi'),
    'avatar', coalesce(nullif(nullif(pr.avatar, ''), '/images/avatar.jpg'), nullif(nullif(p_fallback->>'avatar', ''), '/images/avatar.jpg'), ''),
    'role', coalesce(nullif(pr.specialty, ''), nullif(p_fallback->>'role', ''), 'Stomatolog'))
  from (select 1) one left join public.profiles pr on pr.id = p_id;
$$;
grant execute on function public.community_author(uuid, jsonb) to anon, authenticated;

-- 0050 admin_reports: test_accounts/duplicates ismi yagona tartibda (qolgan mantiq o‘zgarmagan)
create or replace function public.admin_reports(p_from timestamptz default null, p_to timestamptz default null, p_exclude_test boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_from timestamptz := coalesce(p_from, date_trunc('month', now()));
  v_to timestamptz := coalesce(p_to, now());
  v_ex boolean := coalesce(p_exclude_test, false);
  m jsonb;
begin
  if not public.is_admin() then raise exception 'Faqat admin'; end if;
  m := public.admin_money(v_from, v_to, v_ex);
  return jsonb_build_object(
    'turnover', m->'turnover', 'commission', m->'commission', 'commission_pct', m->'commission_pct',
    'turnover_in_progress', m->'turnover_in_progress',
    'orders', m->'orders_count', 'orders_delivered', m->'orders_delivered',
    'orders_in_progress', m->'orders_in_progress', 'orders_cancelled', m->'orders_cancelled',
    'users_new', (select count(*) from public.profiles p where p.created_at between v_from and v_to and p.role <> 'admin'
                    and not (v_ex and public.profile_is_test(p.id))),
    'sellers_new', (select count(*) from public.profiles p where p.created_at between v_from and v_to and p.role = 'seller'
                    and not (v_ex and public.profile_is_test(p.id))),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('day', d, 'sum', s, 'orders', n) order by d) from (
        select extract(day from o.created_at at time zone 'Asia/Tashkent')::int d, sum(o.subtotal) s, count(*)::int n
          from public.seller_orders o
         where o.created_at between v_from and v_to and o.status = 'yetkazildi' and not public.order_is_demo(o)
           and coalesce(o.payment_status, '') not in ('refunded', 'refund_pending', 'failed')
           and not (v_ex and public.order_is_test(o))
         group by 1) x), '[]'::jsonb),
    'top_sellers', coalesce((
      select jsonb_agg(jsonb_build_object('shop', shop, 'sum', s, 'orders', n) order by s desc) from (
        select coalesce(nullif(p.shop_name, ''), nullif(p.name, ''), p.email) shop, sum(o.subtotal) s, count(*)::int n
          from public.seller_orders o join public.profiles p on p.id = o.seller_id
         where o.created_at between v_from and v_to and o.status = 'yetkazildi' and not public.order_is_demo(o)
           and coalesce(o.payment_status, '') not in ('refunded', 'refund_pending', 'failed')
           and not (v_ex and public.order_is_test(o))
         group by 1 order by 2 desc limit 10) t), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('name', category, 'sum', s, 'orders', n) order by s desc) from (
        select coalesce(nullif(pr.category, ''), 'Boshqa') category, sum(i.total) s, count(distinct i.order_id)::int n
          from public.seller_order_items i
          left join public.seller_products pr on pr.id = i.product_id
          join public.seller_orders o on o.id = i.order_id
         where o.created_at between v_from and v_to and o.status = 'yetkazildi' and not public.order_is_demo(o)
           and coalesce(o.payment_status, '') not in ('refunded', 'refund_pending', 'failed')
           and not (v_ex and public.order_is_test(o))
         group by 1 order by 2 desc limit 10) c), '[]'::jsonb),
    -- Test akkauntlar va ehtimoliy dublikatlar (faqat ro‘yxat; hech narsa o‘chirilmaydi)
    'test_accounts', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'name', public.display_name(p.name, p.full_name, p.email),
                                          'email', p.email, 'role', p.role) order by p.created_at)
        from public.profiles p where public.profile_is_test(p.id)), '[]'::jsonb),
    'duplicates', coalesce((
      select jsonb_agg(jsonb_build_object('name', k, 'count', n, 'emails', emails) order by k) from (
        select lower(public.display_name(p.name, p.full_name, null)) k, count(*)::int n, jsonb_agg(p.email) emails
          from public.profiles p where public.display_name(p.name, p.full_name, null) <> ''
         group by 1 having count(*) > 1) d), '[]'::jsonb)
  );
end $$;
revoke all on function public.admin_reports(timestamptz, timestamptz, boolean) from public, anon;
grant execute on function public.admin_reports(timestamptz, timestamptz, boolean) to authenticated;

-- 1) Sertifikat: seminar turi, soat/CME, format, joy, spiker, egasining ismi
alter table public.customer_certificates
  add column if not exists kind text,
  add column if not exists hours numeric,
  add column if not exists cme numeric,
  add column if not exists format text,
  add column if not exists place text,
  add column if not exists speaker text,
  add column if not exists holder_name text;

create or replace function public.seminar_num(v text) returns numeric
language sql immutable as $$
  select case when trim(coalesce(v, '')) ~ '^[0-9]+([.,][0-9]+)?$' then replace(trim(v), ',', '.')::numeric end
$$;

create or replace function public.cert_to_customer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  s public.seminars;
  v_name text;
begin
  if new.state is distinct from 'done' then return new; end if;
  if tg_op = 'UPDATE' and old.state = 'done' then return new; end if;
  select r.customer_id into v_user from public.registrations r
   where r.id = regexp_replace(new.id, '^cert-', '') and (new.seminar_id is null or r.seminar_id = new.seminar_id);
  if v_user is null then return new; end if;
  select * into s from public.seminars where id = new.seminar_id;
  select nullif(public.display_name(p.name, p.full_name, p.email), '') into v_name from public.profiles p where p.id = v_user;
  insert into public.customer_certificates (user_id, course_id, title, issued_at, file_url,
                                            kind, hours, cme, format, place, speaker, holder_name)
  values (v_user, 'seminar:' || coalesce(new.seminar_id, new.id), coalesce(nullif(new.seminar_title, ''), 'Seminar sertifikati'),
          public.tashkent_today(), '',
          'seminar',
          nullif(public.seminar_num(s.form->>'cmeHours'), 0),
          nullif(public.seminar_num(s.form->>'cmePoints'), 0),
          nullif(s.format, ''), nullif(s.place, ''), nullif(s.speaker, ''),
          coalesce(v_name, nullif(trim(new.name), '')))
  on conflict (user_id, course_id) do update set
    title = excluded.title, issued_at = excluded.issued_at, kind = excluded.kind,
    hours = excluded.hours, cme = excluded.cme, format = excluded.format, place = excluded.place,
    speaker = excluded.speaker, holder_name = excluded.holder_name;
  return new;
end;
$$;

-- Faqat bitta QA qatori (user 142df471…, seminar:qa-test-endodontiya-amaliy-seminari--uqoo)
update public.customer_certificates cc
   set kind = 'seminar',
       hours = nullif(public.seminar_num(s.form->>'cmeHours'), 0),
       cme = nullif(public.seminar_num(s.form->>'cmePoints'), 0),
       format = nullif(s.format, ''),
       place = nullif(s.place, ''),
       speaker = nullif(s.speaker, ''),
       holder_name = coalesce(
         (select nullif(public.display_name(p.name, p.full_name, p.email), '') from public.profiles p where p.id = cc.user_id),
         (select nullif(trim(c.name), '') from public.certificates c where c.seminar_id = s.id and c.state = 'done'
            and exists (select 1 from public.registrations r where r.id = regexp_replace(c.id, '^cert-', '') and r.customer_id = cc.user_id)
          limit 1))
  from public.seminars s
 where cc.user_id = '142df471-3f96-42b1-b635-908e94c6b6c4'
   and cc.course_id = 'seminar:qa-test-endodontiya-amaliy-seminari--uqoo'
   and s.id = 'qa-test-endodontiya-amaliy-seminari--uqoo';

-- 2) Hamjamiyat: muallifsiz (seed/namuna) postlar yashiriladi, o‘chirilmaydi
update public.community_posts
   set hidden = true,
       hidden_reason = coalesce(nullif(hidden_reason, ''), 'Seed/namuna post (muallif yo‘q) — QA4')
 where author_id is null and not hidden;
