-- 0053: QA round 4. Ma'lumot o‘chirilmaydi: faqat yangi ustunlar, trigger yangilanishi,
-- bitta sertifikat qatorini to‘ldirish va seed hamjamiyat postlarini yashirish.

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
  select coalesce(nullif(trim(p.name), ''), nullif(trim(p.full_name), '')) into v_name from public.profiles p where p.id = v_user;
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
         (select coalesce(nullif(trim(p.name), ''), nullif(trim(p.full_name), '')) from public.profiles p where p.id = cc.user_id),
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
