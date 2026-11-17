-- 0078: Kurs muallifi kabineti. QO‘LDA QO‘LLANADI — faqat Ibrohim roziligi bilan. Takror ishga tushirish xavfsiz.
-- (0077 bemor fayllari uchun band.)
--
-- Nima qiladi:
--   1) courses: qisqa tavsif, til, treyler, «Nimalarni o‘rganasiz», «Kimlar uchun», chegirma,
--      sertifikat sozlamalari va moderatsiya ustunlari. Yangi holat: 'review' (moderatsiyada).
--   2) course_lessons: «Nimalar o‘rgatiladi» bandlari va materiallar (havola ro‘yxati).
--   3) course_enrollments: paid_at, payment_method, payment_note, marked_by.
--      Chegirma faol bo‘lsa yozilishda price_amount chegirmali narx bo‘ladi (trigger).
--   4) course_payment_events: to‘lov belgilari jurnali (faqat muallif va o‘quvchining o‘zi ko‘radi).
--   5) RLS: o‘quvchi faqat o‘z yozilishi/progressi/test urinishlarini, muallif faqat o‘z kurslari
--      o‘quvchilarini ko‘radi (SELECT). Yozish hamon faqat security definer RPC orqali.
--   6) Moderatsiya: muallif (admin bo‘lmagan) kursni to‘g‘ridan-to‘g‘ri nashr qila olmaydi —
--      'published' so‘rovi 'review' ga aylanadi. Admin course_moderate() bilan tasdiqlaydi yoki qaytaradi.
--   7) Sertifikat: muallif o‘chirsa berilmaydi; minimal o‘rtacha ball sharti.
--   8) Muallif RPC lari: dashboard, kurslar, o‘quvchilar, to‘lovlar, holat, nusxa, qo‘shimcha maydonlar,
--      «To‘landi deb belgilash» (faqat o‘z kursi, faqat unpaid, sinov kursi emas).
--   9) Ochiq RPC: course_public_extras() — kurs sahifasi uchun qo‘shimcha maydonlar.
--
-- To‘lov tizimi (Click/Payme) bu migratsiyada YO‘Q. Pul o‘tkazilmaydi, faqat holat belgilanadi.

begin;

-- 1) courses ---------------------------------------------------------------
alter table public.courses
  add column if not exists seed_batch text,
  add column if not exists subtitle text not null default '',
  add column if not exists language text not null default 'uz',
  add column if not exists trailer_url text not null default '',
  add column if not exists learn_points jsonb not null default '[]'::jsonb,
  add column if not exists audience jsonb not null default '[]'::jsonb,
  add column if not exists discount_price integer,
  add column if not exists discount_until timestamptz,
  add column if not exists certificate_enabled boolean not null default true,
  add column if not exists certificate_min_score integer not null default 0,
  add column if not exists moderation_note text not null default '',
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles (id) on delete set null;

alter table public.courses drop constraint if exists courses_status_chk;
alter table public.courses add constraint courses_status_chk
  check (status in ('draft', 'review', 'published', 'archived'));

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'courses_language_chk') then
    alter table public.courses add constraint courses_language_chk check (language in ('uz', 'ru', 'en'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'courses_learn_points_chk') then
    alter table public.courses add constraint courses_learn_points_chk
      check (jsonb_typeof(learn_points) = 'array' and jsonb_typeof(audience) = 'array');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'courses_discount_chk') then
    alter table public.courses add constraint courses_discount_chk
      check (discount_price is null or (discount_price > 0 and discount_price < price));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'courses_cert_score_chk') then
    alter table public.courses add constraint courses_cert_score_chk check (certificate_min_score between 0 and 100);
  end if;
end $$;

create index if not exists courses_review_idx on public.courses (submitted_at) where status = 'review';

-- 2) course_lessons --------------------------------------------------------
alter table public.course_lessons
  add column if not exists takeaways jsonb not null default '[]'::jsonb,
  add column if not exists materials jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'course_lessons_extras_chk') then
    alter table public.course_lessons add constraint course_lessons_extras_chk
      check (jsonb_typeof(takeaways) = 'array' and jsonb_typeof(materials) = 'array');
  end if;
end $$;

-- 3) course_enrollments ----------------------------------------------------
alter table public.course_enrollments
  add column if not exists paid_at timestamptz,
  add column if not exists payment_method text,
  add column if not exists payment_note text not null default '',
  add column if not exists marked_by uuid references public.profiles (id) on delete set null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'course_enrollments_method_chk') then
    alter table public.course_enrollments add constraint course_enrollments_method_chk
      check (payment_method is null or payment_method in ('click', 'payme', 'cash', 'transfer', 'other'));
  end if;
end $$;

create index if not exists course_enrollments_course_idx on public.course_enrollments (course_id, created_at desc);

-- Chegirma: yozilish paytida faol chegirma bo‘lsa, price_amount chegirmali narx.
create or replace function public.course_enroll_price() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  crs public.courses;
begin
  select * into crs from public.courses where id = new.course_id;
  if found and crs.price > 0 and crs.discount_price is not null and crs.discount_price > 0
     and crs.discount_price < crs.price and (crs.discount_until is null or crs.discount_until > now()) then
    new.price_amount := crs.discount_price;
  end if;
  return new;
end $$;
revoke all on function public.course_enroll_price() from public, anon, authenticated;
drop trigger if exists course_enrollments_price on public.course_enrollments;
create trigger course_enrollments_price before insert on public.course_enrollments
  for each row execute function public.course_enroll_price();

-- 4) To‘lov belgilari jurnali --------------------------------------------
create table if not exists public.course_payment_events (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  amount integer not null default 0,
  method text,
  note text not null default '',
  created_at timestamptz not null default now(),
  constraint course_payment_events_action_chk check (action in ('marked_paid'))
);
create index if not exists course_payment_events_course_idx on public.course_payment_events (course_id, created_at desc);
alter table public.course_payment_events enable row level security;
revoke all on public.course_payment_events from anon, authenticated;
grant select on public.course_payment_events to authenticated;
drop policy if exists course_payment_events_read on public.course_payment_events;
create policy course_payment_events_read on public.course_payment_events
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.courses c where c.id = course_id and c.author_id = (select auth.uid()))
  );

-- 5) RLS: faqat o‘qish. O‘quvchi — o‘zinikini, muallif — o‘z kurslarinikini.
create or replace function public.course_authored_by(p_course uuid, p_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.courses c where c.id = p_course and c.author_id = p_uid);
$$;
create or replace function public.course_lesson_authored_by(p_lesson uuid, p_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.course_lessons l join public.courses c on c.id = l.course_id
    where l.id = p_lesson and c.author_id = p_uid
  );
$$;
revoke all on function public.course_authored_by(uuid, uuid) from public, anon;
grant execute on function public.course_authored_by(uuid, uuid) to authenticated;
revoke all on function public.course_lesson_authored_by(uuid, uuid) from public, anon;
grant execute on function public.course_lesson_authored_by(uuid, uuid) to authenticated;

grant select on public.course_enrollments to authenticated;
drop policy if exists course_enrollments_read on public.course_enrollments;
create policy course_enrollments_read on public.course_enrollments
  for select to authenticated
  using (user_id = (select auth.uid()) or public.course_authored_by(course_id, (select auth.uid())));

grant select on public.course_lesson_progress to authenticated;
drop policy if exists course_lesson_progress_read on public.course_lesson_progress;
create policy course_lesson_progress_read on public.course_lesson_progress
  for select to authenticated
  using (user_id = (select auth.uid()) or public.course_lesson_authored_by(lesson_id, (select auth.uid())));

grant select on public.course_quiz_attempts to authenticated;
drop policy if exists course_quiz_attempts_read on public.course_quiz_attempts;
create policy course_quiz_attempts_read on public.course_quiz_attempts
  for select to authenticated
  using (user_id = (select auth.uid()) or public.course_lesson_authored_by(lesson_id, (select auth.uid())));

-- 6) Moderatsiya darvozasi -------------------------------------------------
-- SECURITY INVOKER: auth.uid() chaqiruvchi foydalanuvchi. SQL Editor / servis (uid yo‘q) — o‘tadi.
create or replace function public.course_moderation_gate() returns trigger
language plpgsql security invoker set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null or public.course_is_admin(uid) then
    return new;
  end if;
  -- OLD faqat UPDATE da o‘qiladi.
  if tg_op = 'INSERT' then
    if new.status = 'published' then
      new.status := 'review';
      new.submitted_at := now();
      new.published_at := null;
    end if;
    -- Muallif moderatsiya izohini va tekshiruvchini o‘zi qo‘ya olmaydi.
    new.reviewed_at := null;
    new.reviewed_by := null;
    new.moderation_note := '';
  else
    if new.status = 'published' and old.status is distinct from 'published' then
      new.status := 'review';
      new.submitted_at := now();
      new.published_at := old.published_at;
    end if;
    new.reviewed_at := old.reviewed_at;
    new.reviewed_by := old.reviewed_by;
    if new.status = 'review' and old.status is distinct from 'review' then
      new.moderation_note := '';
    else
      new.moderation_note := old.moderation_note;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists courses_moderation_gate on public.courses;
create trigger courses_moderation_gate before insert or update on public.courses
  for each row execute function public.course_moderation_gate();

-- 7) Sertifikat: muallif sozlamalari bilan ---------------------------------
create or replace function public.course_issue_certificate(p_user uuid, p_course uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lessons integer;
  v_score integer;
  v_points integer;
  v_seconds integer;
  v_hours numeric;
  v_title text;
  v_format text;
  v_author text;
  v_holder text;
  v_code text;
  v_id uuid;
  v_issued date;
  v_enabled boolean;
  v_min integer;
begin
  select count(*) into v_lessons from public.course_lessons where course_id = p_course;
  if v_lessons = 0 then return null; end if;
  if exists (
    select 1 from public.course_lessons l
    where l.course_id = p_course
      and not exists (
        select 1 from public.course_lesson_progress p
        where p.user_id = p_user and p.lesson_id = l.id and p.quiz_passed
      )
  ) then
    return null;
  end if;

  select coalesce(round(avg(p.quiz_score))::int, 0)
    into v_score
    from public.course_lesson_progress p
    join public.course_lessons l on l.id = p.lesson_id
   where p.user_id = p_user and l.course_id = p_course and p.quiz_passed;

  -- Kurs tugadi: sertifikat bo‘lmasa ham yakun sanasi va ball yoziladi.
  update public.course_enrollments
     set score_pct = v_score, completed_at = coalesce(completed_at, now())
   where user_id = p_user and course_id = p_course;

  select coalesce(c.certificate_enabled, true), coalesce(c.certificate_min_score, 0)
    into v_enabled, v_min
    from public.courses c where c.id = p_course;
  if not coalesce(v_enabled, true) or v_score < coalesce(v_min, 0) then
    return null;
  end if;

  select points into v_points from public.course_enrollments where user_id = p_user and course_id = p_course;
  select coalesce(sum(duration_seconds), 0) into v_seconds from public.course_lessons where course_id = p_course;
  v_hours := round((v_seconds::numeric / 3600), 1);
  select c.title, c.format,
         coalesce(nullif(public.display_name(a.name, a.full_name, a.email), ''), 'Muallif')
    into v_title, v_format, v_author
    from public.courses c
    join public.profiles a on a.id = c.author_id
   where c.id = p_course;
  select coalesce(nullif(public.display_name(p.name, p.full_name, p.email), ''), 'Tinglovchi')
    into v_holder from public.profiles p where p.id = p_user;
  v_code := 'SH-KURS-' || upper(substr(md5(p_user::text || ':' || p_course::text), 1, 8));
  v_issued := public.tashkent_today();

  insert into public.customer_certificates (
    user_id, course_id, title, issued_at, file_url, kind, hours, cme, format, place, speaker, holder_name, score_pct, code
  ) values (
    p_user, 'course:' || p_course::text, v_title, v_issued, '', 'online',
    nullif(v_hours, 0), nullif(coalesce(v_points, 0), 0), v_format, 'Onlayn', v_author, v_holder, v_score, v_code
  )
  on conflict (user_id, course_id) do update set
    title = excluded.title,
    issued_at = excluded.issued_at,
    kind = excluded.kind,
    hours = excluded.hours,
    cme = excluded.cme,
    format = excluded.format,
    place = excluded.place,
    speaker = excluded.speaker,
    holder_name = excluded.holder_name,
    score_pct = excluded.score_pct,
    code = excluded.code
  returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'code', v_code,
    'title', v_title,
    'scorePct', v_score,
    'points', coalesce(v_points, 0),
    'hours', v_hours,
    'holderName', v_holder,
    'speaker', v_author,
    'issuedAt', v_issued,
    'kind', 'online',
    'format', v_format
  );
end;
$$;
revoke all on function public.course_issue_certificate(uuid, uuid) from public, anon, authenticated;

-- 8) Muallif RPC lari ------------------------------------------------------

-- Bitta yozilish qatori (muallif ko‘radigan shakl). Ichki yordamchi.
create or replace function public.course_author_enrollment_row(p_user uuid, p_course uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'userId', e.user_id,
    'name', coalesce(nullif(public.display_name(p.name, p.full_name, p.email), ''), 'O‘quvchi'),
    'avatar', coalesce(nullif(p.avatar_url, ''), nullif(p.avatar, ''), ''),
    'courseId', c.id,
    'courseTitle', c.title,
    'enrolledAt', e.created_at,
    'paymentStatus', e.payment_status,
    'access', e.access,
    'amount', e.price_amount,
    'paidAt', e.paid_at,
    'method', e.payment_method,
    'note', e.payment_note,
    'lessonsTotal', (select count(*)::int from public.course_lessons l where l.course_id = c.id),
    'lessonsDone', (
      select count(*)::int from public.course_lesson_progress lp
      join public.course_lessons l on l.id = lp.lesson_id
      where lp.user_id = e.user_id and l.course_id = c.id and lp.quiz_passed
    ),
    'avgScore', (
      select round(avg(lp.quiz_score))::int from public.course_lesson_progress lp
      join public.course_lessons l on l.id = lp.lesson_id
      where lp.user_id = e.user_id and l.course_id = c.id and lp.quiz_score is not null
    ),
    'attempts', (
      select count(*)::int from public.course_quiz_attempts qa
      join public.course_lessons l on l.id = qa.lesson_id
      where qa.user_id = e.user_id and l.course_id = c.id
    ),
    'lastActivity', greatest(e.created_at, (
      select max(lp.updated_at) from public.course_lesson_progress lp
      join public.course_lessons l on l.id = lp.lesson_id
      where lp.user_id = e.user_id and l.course_id = c.id
    )),
    'completedAt', e.completed_at,
    'certificate', (
      select jsonb_build_object('code', cc.code, 'issuedAt', cc.issued_at, 'scorePct', cc.score_pct)
      from public.customer_certificates cc
      where cc.user_id = e.user_id and cc.course_id = 'course:' || c.id::text
      limit 1
    )
  )
  from public.course_enrollments e
  join public.courses c on c.id = e.course_id
  join public.profiles p on p.id = e.user_id
  where e.user_id = p_user and e.course_id = p_course;
$$;
revoke all on function public.course_author_enrollment_row(uuid, uuid) from public, anon, authenticated;

create or replace function public.course_author_courses()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when auth.uid() is null then '[]'::jsonb else coalesce((
    select jsonb_agg(to_jsonb(x) order by x."updatedAt" desc)
    from (
      select c.id, c.title, c.subtitle, c.status, c.price,
             c.discount_price as "discountPrice", c.discount_until as "discountUntil",
             c.cover_url as cover, c.format, c.level, c.direction, c.language,
             c.updated_at as "updatedAt", c.published_at as "publishedAt", c.submitted_at as "submittedAt",
             c.moderation_note as "moderationNote", c.certificate_enabled as "certificateEnabled",
             (c.seed_batch is not null) as "testSeed",
             (select count(*)::int from public.course_lessons l where l.course_id = c.id) as lessons,
             (select coalesce(sum(l.duration_seconds), 0)::int from public.course_lessons l where l.course_id = c.id) as "durationSeconds",
             (select count(*)::int from public.course_enrollments e where e.course_id = c.id) as enrolled,
             (select count(*)::int from public.course_enrollments e where e.course_id = c.id and e.completed_at is not null) as completed,
             (select coalesce(sum(e.price_amount), 0)::bigint from public.course_enrollments e where e.course_id = c.id and e.payment_status = 'paid') as "paidSum",
             (select coalesce(sum(e.price_amount), 0)::bigint from public.course_enrollments e where e.course_id = c.id and e.payment_status = 'unpaid') as "pendingSum"
        from public.courses c
       where c.author_id = auth.uid()
    ) x
  ), '[]'::jsonb) end;
$$;
revoke all on function public.course_author_courses() from public, anon;
grant execute on function public.course_author_courses() to authenticated;

create or replace function public.course_author_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_totals jsonb;
  v_monthly jsonb;
  v_recent jsonb;
  v_top jsonb;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'Kirish kerak');
  end if;

  select jsonb_build_object(
    'courses', count(distinct c.id),
    'published', count(distinct c.id) filter (where c.status = 'published'),
    'review', count(distinct c.id) filter (where c.status = 'review'),
    'draft', count(distinct c.id) filter (where c.status = 'draft'),
    'students', count(distinct e.user_id),
    'enrollments', count(e.user_id),
    'active', count(e.user_id) filter (where e.access and e.completed_at is null),
    'completed', count(e.user_id) filter (where e.completed_at is not null),
    'paidSum', coalesce(sum(e.price_amount) filter (where e.payment_status = 'paid'), 0),
    'pendingSum', coalesce(sum(e.price_amount) filter (where e.payment_status = 'unpaid'), 0),
    'paidCount', count(e.user_id) filter (where e.payment_status = 'paid'),
    'pendingCount', count(e.user_id) filter (where e.payment_status = 'unpaid'),
    'freeCount', count(e.user_id) filter (where e.payment_status = 'free'),
    'certificates', (
      select count(*) from public.customer_certificates cc
      join public.courses c2 on cc.course_id = 'course:' || c2.id::text
      where c2.author_id = uid
    )
  ) into v_totals
  from public.courses c
  left join public.course_enrollments e on e.course_id = c.id
  where c.author_id = uid;

  -- Oxirgi 6 oy (Toshkent vaqti): yozilishlar (yozilgan oy) va to‘langan summa (to‘langan oy).
  select coalesce(jsonb_agg(jsonb_build_object(
           'month', to_char(m.month, 'YYYY-MM'),
           'enrollments', coalesce(s.n, 0),
           'paid', coalesce(pd.paid, 0)
         ) order by m.month), '[]'::jsonb)
    into v_monthly
    from generate_series(
      date_trunc('month', (now() at time zone 'Asia/Tashkent')) - interval '5 months',
      date_trunc('month', (now() at time zone 'Asia/Tashkent')),
      interval '1 month'
    ) as m(month)
    left join (
      select date_trunc('month', e.created_at at time zone 'Asia/Tashkent') as month, count(*)::int as n
        from public.course_enrollments e
        join public.courses c on c.id = e.course_id
       where c.author_id = uid
       group by 1
    ) s on s.month = m.month
    left join (
      select date_trunc('month', coalesce(e.paid_at, e.created_at) at time zone 'Asia/Tashkent') as month,
             sum(e.price_amount)::bigint as paid
        from public.course_enrollments e
        join public.courses c on c.id = e.course_id
       where c.author_id = uid and e.payment_status = 'paid'
       group by 1
    ) pd on pd.month = m.month;

  select coalesce(jsonb_agg(public.course_author_enrollment_row(x.user_id, x.course_id) order by x.created_at desc), '[]'::jsonb)
    into v_recent
    from (
      select e.user_id, e.course_id, e.created_at
        from public.course_enrollments e
        join public.courses c on c.id = e.course_id
       where c.author_id = uid
       order by e.created_at desc
       limit 8
    ) x;

  select coalesce(jsonb_agg(to_jsonb(t) order by t.enrolled desc, t."paidSum" desc), '[]'::jsonb)
    into v_top
    from (
      select c.id, c.title, c.cover_url as cover, c.status, c.price,
             count(e.user_id)::int as enrolled,
             count(e.user_id) filter (where e.completed_at is not null)::int as completed,
             coalesce(sum(e.price_amount) filter (where e.payment_status = 'paid'), 0)::bigint as "paidSum"
        from public.courses c
        left join public.course_enrollments e on e.course_id = c.id
       where c.author_id = uid
       group by c.id
       order by count(e.user_id) desc, coalesce(sum(e.price_amount) filter (where e.payment_status = 'paid'), 0) desc
       limit 5
    ) t;

  return jsonb_build_object('ok', true, 'totals', v_totals, 'monthly', v_monthly, 'recent', v_recent, 'top', v_top);
end;
$$;
revoke all on function public.course_author_dashboard() from public, anon;
grant execute on function public.course_author_dashboard() to authenticated;

create or replace function public.course_author_students(p_course_id uuid default null)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when auth.uid() is null then '[]'::jsonb else coalesce((
    select jsonb_agg(public.course_author_enrollment_row(e.user_id, e.course_id) order by e.created_at desc)
      from public.course_enrollments e
      join public.courses c on c.id = e.course_id
     where c.author_id = auth.uid()
       and (p_course_id is null or c.id = p_course_id)
  ), '[]'::jsonb) end;
$$;
revoke all on function public.course_author_students(uuid) from public, anon;
grant execute on function public.course_author_students(uuid) to authenticated;

create or replace function public.course_author_payments()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when auth.uid() is null then '[]'::jsonb else coalesce((
    select jsonb_agg(public.course_author_enrollment_row(e.user_id, e.course_id) order by coalesce(e.paid_at, e.created_at) desc)
      from public.course_enrollments e
      join public.courses c on c.id = e.course_id
     where c.author_id = auth.uid()
       and (e.payment_status <> 'free' or c.price > 0)
  ), '[]'::jsonb) end;
$$;
revoke all on function public.course_author_payments() from public, anon;
grant execute on function public.course_author_payments() to authenticated;

-- «To‘landi deb belgilash»: muallif naqd/o‘tkazma bilan olgan pulni qo‘lda belgilaydi.
-- Pul tizim orqali o‘tmaydi. Faqat o‘z kursi, faqat 'unpaid', sinov kursi emas. Jurnalga yoziladi.
create or replace function public.course_author_mark_paid(p_course_id uuid, p_user_id uuid, p_method text, p_note text default '')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  crs public.courses;
  enr public.course_enrollments;
  v_method text := coalesce(nullif(trim(p_method), ''), 'cash');
  v_note text := left(trim(coalesce(p_note, '')), 300);
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'Kirish kerak');
  end if;
  if v_method not in ('cash', 'transfer', 'other') then
    return jsonb_build_object('ok', false, 'error', 'To‘lov usuli noto‘g‘ri');
  end if;
  select * into crs from public.courses where id = p_course_id for update;
  if not found or crs.author_id is distinct from uid then
    return jsonb_build_object('ok', false, 'error', 'Kurs topilmadi');
  end if;
  if crs.seed_batch is not null then
    return jsonb_build_object('ok', false, 'error', 'Sinov kursida to‘lov belgilanmaydi');
  end if;
  select * into enr from public.course_enrollments where course_id = crs.id and user_id = p_user_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'O‘quvchi topilmadi');
  end if;
  if enr.payment_status <> 'unpaid' then
    return jsonb_build_object('ok', false, 'error', 'Bu yozilish to‘lov kutmayapti');
  end if;
  update public.course_enrollments
     set payment_status = 'paid', access = true, paid_at = now(),
         payment_method = v_method, payment_note = v_note, marked_by = uid
   where course_id = crs.id and user_id = p_user_id;
  insert into public.course_payment_events (course_id, user_id, actor_id, action, amount, method, note)
  values (crs.id, p_user_id, uid, 'marked_paid', enr.price_amount, v_method, v_note);
  return jsonb_build_object('ok', true, 'row', public.course_author_enrollment_row(p_user_id, crs.id));
end;
$$;
revoke all on function public.course_author_mark_paid(uuid, uuid, text, text) from public, anon;
grant execute on function public.course_author_mark_paid(uuid, uuid, text, text) to authenticated;

-- Holat: submit (moderatsiyaga), withdraw (moderatsiyadan qaytarish), unpublish (nashrdan olish).
create or replace function public.course_author_set_status(p_course_id uuid, p_action text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  crs public.courses;
  v_bad integer;
  v_n integer;
begin
  if uid is null or not public.course_is_teacher(uid) then
    return jsonb_build_object('ok', false, 'error', 'Ruxsat yo‘q');
  end if;
  select * into crs from public.courses where id = p_course_id for update;
  if not found or crs.author_id is distinct from uid then
    return jsonb_build_object('ok', false, 'error', 'Kurs topilmadi');
  end if;
  if p_action = 'submit' then
    if crs.status not in ('draft', 'archived') then
      return jsonb_build_object('ok', false, 'error', 'Kurs allaqachon yuborilgan yoki nashr qilingan');
    end if;
    if char_length(trim(crs.title)) < 3 then
      return jsonb_build_object('ok', false, 'error', 'Kurs nomini yozing');
    end if;
    select count(*) into v_n from public.course_lessons where course_id = crs.id;
    if v_n < 1 then
      return jsonb_build_object('ok', false, 'error', 'Kamida bitta dars qo‘shing');
    end if;
    select count(*) into v_bad from public.course_lessons
     where course_id = crs.id and (char_length(trim(title)) < 2 or coalesce(bunny_video_id, '') = '');
    if v_bad > 0 then
      return jsonb_build_object('ok', false, 'error', 'Har bir darsda nom va video bo‘lishi kerak');
    end if;
    -- Admin muallif to‘g‘ridan-to‘g‘ri nashr qiladi; boshqalarda trigger 'review' qiladi.
    update public.courses
       set status = case when public.course_is_admin(uid) then 'published' else 'review' end,
           submitted_at = now(),
           published_at = case when public.course_is_admin(uid) then coalesce(published_at, now()) else published_at end,
           updated_at = now()
     where id = crs.id;
  elsif p_action = 'withdraw' then
    if crs.status <> 'review' then
      return jsonb_build_object('ok', false, 'error', 'Kurs moderatsiyada emas');
    end if;
    update public.courses set status = 'draft', updated_at = now() where id = crs.id;
  elsif p_action = 'unpublish' then
    if crs.status <> 'published' then
      return jsonb_build_object('ok', false, 'error', 'Kurs nashr qilinmagan');
    end if;
    update public.courses set status = 'draft', updated_at = now() where id = crs.id;
  else
    return jsonb_build_object('ok', false, 'error', 'Amal noto‘g‘ri');
  end if;
  select * into crs from public.courses where id = p_course_id;
  return jsonb_build_object('ok', true, 'status', crs.status);
end;
$$;
revoke all on function public.course_author_set_status(uuid, text) from public, anon;
grant execute on function public.course_author_set_status(uuid, text) to authenticated;

-- Nusxa: qoralama, video va o‘quvchilarsiz. Savollar va qo‘shimcha maydonlar ko‘chadi.
create or replace function public.course_author_duplicate(p_course_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  crs public.courses;
  v_new uuid;
  les public.course_lessons;
  v_lid uuid;
begin
  if uid is null or not public.course_is_teacher(uid) then
    return jsonb_build_object('ok', false, 'error', 'Ruxsat yo‘q');
  end if;
  select * into crs from public.courses where id = p_course_id;
  if not found or crs.author_id is distinct from uid then
    return jsonb_build_object('ok', false, 'error', 'Kurs topilmadi');
  end if;
  insert into public.courses (
    author_id, title, description, direction, level, format, price, cover_url, status,
    subtitle, language, trailer_url, learn_points, audience, discount_price, discount_until,
    certificate_enabled, certificate_min_score
  ) values (
    uid, left(crs.title || ' (nusxa)', 140), crs.description, crs.direction, crs.level, crs.format, crs.price, crs.cover_url, 'draft',
    crs.subtitle, crs.language, crs.trailer_url, crs.learn_points, crs.audience, crs.discount_price, crs.discount_until,
    crs.certificate_enabled, crs.certificate_min_score
  ) returning id into v_new;
  for les in select * from public.course_lessons where course_id = crs.id order by position loop
    insert into public.course_lessons (
      course_id, position, title, description, module_title, pass_threshold, max_mistakes, points, takeaways, materials
    ) values (
      v_new, les.position, les.title, les.description, les.module_title, les.pass_threshold, les.max_mistakes, les.points,
      les.takeaways, les.materials
    ) returning id into v_lid;
    insert into public.course_questions (lesson_id, position, prompt, options, correct_index)
      select v_lid, q.position, q.prompt, q.options, q.correct_index
        from public.course_questions q where q.lesson_id = les.id;
  end loop;
  return jsonb_build_object('ok', true, 'id', v_new);
end;
$$;
revoke all on function public.course_author_duplicate(uuid) from public, anon;
grant execute on function public.course_author_duplicate(uuid) to authenticated;

-- Qo‘shimcha maydonlar: o‘qish (muallif) ------------------------------------
create or replace function public.course_author_extras(p_course_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  crs public.courses;
begin
  select * into crs from public.courses where id = p_course_id;
  if uid is null or not found or (crs.author_id is distinct from uid and not public.course_is_admin(uid)) then
    return jsonb_build_object('ok', false, 'error', 'Kurs topilmadi');
  end if;
  return jsonb_build_object(
    'ok', true,
    'course', jsonb_build_object(
      'subtitle', crs.subtitle,
      'language', crs.language,
      'trailerUrl', crs.trailer_url,
      'learnPoints', crs.learn_points,
      'audience', crs.audience,
      'discountPrice', crs.discount_price,
      'discountUntil', crs.discount_until,
      'certificateEnabled', crs.certificate_enabled,
      'certificateMinScore', crs.certificate_min_score,
      'moderationNote', crs.moderation_note,
      'submittedAt', crs.submitted_at,
      'status', crs.status
    ),
    'lessons', coalesce((
      select jsonb_agg(jsonb_build_object('id', l.id, 'takeaways', l.takeaways, 'materials', l.materials) order by l.position)
        from public.course_lessons l where l.course_id = crs.id
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.course_author_extras(uuid) from public, anon;
grant execute on function public.course_author_extras(uuid) to authenticated;

-- Matn ro‘yxatini tozalash: faqat satrlar, bo‘shlar tashlanadi, uzunlik va soni cheklanadi.
create or replace function public.course_clean_list(p_list jsonb, p_max integer, p_len integer)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select coalesce(jsonb_agg(to_jsonb(v) order by n), '[]'::jsonb)
    from (
      select left(trim(x.value #>> '{}'), p_len) as v, x.n
        from jsonb_array_elements(case when jsonb_typeof(p_list) = 'array' then p_list else '[]'::jsonb end)
             with ordinality as x(value, n)
       where jsonb_typeof(x.value) = 'string' and trim(x.value #>> '{}') <> ''
       order by x.n
       limit p_max
    ) s;
$$;

-- Qo‘shimcha maydonlar: saqlash (course_save dan keyin chaqiriladi) ----------
create or replace function public.course_author_save_extras(p_course_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  crs public.courses;
  v_lang text;
  v_trailer text;
  v_disc integer;
  v_until timestamptz;
  v_min integer;
  v_item jsonb;
  v_lid uuid;
  v_mats jsonb;
  v_mat jsonb;
  v_url text;
  v_title text;
begin
  if uid is null or not public.course_is_teacher(uid) then
    return jsonb_build_object('ok', false, 'error', 'Ruxsat yo‘q');
  end if;
  if jsonb_typeof(p_payload) is distinct from 'object' then
    return jsonb_build_object('ok', false, 'error', 'Ma’lumot noto‘g‘ri');
  end if;
  select * into crs from public.courses where id = p_course_id for update;
  if not found or (crs.author_id is distinct from uid and not public.course_is_admin(uid)) then
    return jsonb_build_object('ok', false, 'error', 'Kurs topilmadi');
  end if;

  v_lang := coalesce(nullif(p_payload->>'language', ''), 'uz');
  if v_lang not in ('uz', 'ru', 'en') then
    return jsonb_build_object('ok', false, 'error', 'Til noto‘g‘ri');
  end if;
  v_trailer := left(trim(coalesce(p_payload->>'trailerUrl', '')), 500);
  if v_trailer <> '' and v_trailer !~ '^https://' then
    return jsonb_build_object('ok', false, 'error', 'Treyler havolasi https:// bilan boshlansin');
  end if;
  v_disc := null;
  if coalesce(p_payload->>'discountPrice', '') ~ '^[0-9]+$' and (p_payload->>'discountPrice')::bigint > 0 then
    v_disc := least((p_payload->>'discountPrice')::bigint, 100000000)::int;
    if crs.price <= 0 or v_disc >= crs.price then
      return jsonb_build_object('ok', false, 'error', 'Chegirmali narx asl narxdan kam bo‘lsin');
    end if;
  end if;
  v_until := null;
  if v_disc is not null and nullif(p_payload->>'discountUntil', '') is not null then
    begin
      v_until := (p_payload->>'discountUntil')::timestamptz;
    exception when others then
      return jsonb_build_object('ok', false, 'error', 'Chegirma muddati noto‘g‘ri');
    end;
  end if;
  v_min := 0;
  if coalesce(p_payload->>'certificateMinScore', '0') ~ '^[0-9]+$' then
    v_min := least(100, greatest(0, (p_payload->>'certificateMinScore')::int));
  end if;

  update public.courses
     set subtitle = left(trim(coalesce(p_payload->>'subtitle', '')), 220),
         language = v_lang,
         trailer_url = v_trailer,
         learn_points = public.course_clean_list(p_payload->'learnPoints', 12, 160),
         audience = public.course_clean_list(p_payload->'audience', 8, 160),
         discount_price = v_disc,
         discount_until = v_until,
         certificate_enabled = coalesce((p_payload->>'certificateEnabled')::boolean, true),
         certificate_min_score = v_min,
         updated_at = now()
   where id = crs.id;

  if jsonb_typeof(p_payload->'lessons') = 'array' then
    for v_item in select value from jsonb_array_elements(p_payload->'lessons') loop
      begin
        v_lid := nullif(v_item->>'id', '')::uuid;
      exception when invalid_text_representation then
        continue;
      end;
      if v_lid is null then continue; end if;
      v_mats := '[]'::jsonb;
      if jsonb_typeof(v_item->'materials') = 'array' then
        for v_mat in select value from jsonb_array_elements(v_item->'materials') limit 10 loop
          v_url := left(trim(coalesce(v_mat->>'url', '')), 500);
          v_title := left(trim(coalesce(v_mat->>'title', '')), 120);
          if v_url ~ '^https://' then
            v_mats := v_mats || jsonb_build_array(jsonb_build_object('title', coalesce(nullif(v_title, ''), 'Material'), 'url', v_url));
          end if;
        end loop;
      end if;
      update public.course_lessons
         set takeaways = public.course_clean_list(v_item->'takeaways', 10, 160),
             materials = v_mats
       where id = v_lid and course_id = crs.id;
    end loop;
  end if;
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.course_author_save_extras(uuid, jsonb) from public, anon;
grant execute on function public.course_author_save_extras(uuid, jsonb) to authenticated;

-- 9) Ochiq: kurs sahifasi uchun qo‘shimcha maydonlar ------------------------
create or replace function public.course_public_extras(p_course_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  crs public.courses;
  v_access boolean := false;
begin
  select * into crs from public.courses where id = p_course_id;
  if not found or (crs.status <> 'published' and crs.author_id is distinct from uid and not public.course_is_admin(uid)) then
    return jsonb_build_object('ok', false, 'error', 'Kurs topilmadi');
  end if;
  if uid is not null then
    v_access := crs.author_id = uid or public.course_is_admin(uid) or exists (
      select 1 from public.course_enrollments e where e.user_id = uid and e.course_id = crs.id and e.access
    );
  end if;
  return jsonb_build_object(
    'ok', true,
    'subtitle', crs.subtitle,
    'language', crs.language,
    'trailerUrl', crs.trailer_url,
    'learnPoints', crs.learn_points,
    'audience', crs.audience,
    'discountPrice', case when crs.discount_price is not null and (crs.discount_until is null or crs.discount_until > now()) then crs.discount_price else null end,
    'discountUntil', case when crs.discount_price is not null and (crs.discount_until is null or crs.discount_until > now()) then crs.discount_until else null end,
    'certificateEnabled', crs.certificate_enabled,
    'certificateMinScore', crs.certificate_min_score,
    'lessons', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', l.id,
               'takeaways', l.takeaways,
               'materials', case when v_access then l.materials else '[]'::jsonb end,
               'materialsCount', jsonb_array_length(l.materials)
             ) order by l.position)
        from public.course_lessons l where l.course_id = crs.id
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.course_public_extras(uuid) from public;
grant execute on function public.course_public_extras(uuid) to anon, authenticated;

-- 10) Admin: moderatsiya navbati va qaror ------------------------------------
create or replace function public.course_review_queue()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when not public.course_is_admin(auth.uid()) then '[]'::jsonb else coalesce((
    select jsonb_agg(to_jsonb(x) order by x."submittedAt" nulls last)
    from (
      select c.id, c.title, c.subtitle, c.price, c.cover_url as cover, c.direction, c.level, c.format,
             c.submitted_at as "submittedAt", c.status,
             coalesce(nullif(public.display_name(a.name, a.full_name, a.email), ''), 'Muallif') as author,
             (select count(*)::int from public.course_lessons l where l.course_id = c.id) as lessons
        from public.courses c
        join public.profiles a on a.id = c.author_id
       where c.status = 'review'
    ) x
  ), '[]'::jsonb) end;
$$;
revoke all on function public.course_review_queue() from public, anon;
grant execute on function public.course_review_queue() to authenticated;

create or replace function public.course_moderate(p_course_id uuid, p_action text, p_note text default '')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  crs public.courses;
begin
  if uid is null or not public.course_is_admin(uid) then
    return jsonb_build_object('ok', false, 'error', 'Ruxsat yo‘q');
  end if;
  select * into crs from public.courses where id = p_course_id for update;
  if not found or crs.status <> 'review' then
    return jsonb_build_object('ok', false, 'error', 'Kurs moderatsiyada emas');
  end if;
  if p_action = 'approve' then
    update public.courses
       set status = 'published', published_at = coalesce(published_at, now()), moderation_note = '',
           reviewed_at = now(), reviewed_by = uid, updated_at = now()
     where id = crs.id;
  elsif p_action = 'reject' then
    if char_length(trim(coalesce(p_note, ''))) < 3 then
      return jsonb_build_object('ok', false, 'error', 'Sababini yozing');
    end if;
    update public.courses
       set status = 'draft', moderation_note = left(trim(p_note), 500),
           reviewed_at = now(), reviewed_by = uid, updated_at = now()
     where id = crs.id;
  else
    return jsonb_build_object('ok', false, 'error', 'Amal noto‘g‘ri');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.course_moderate(uuid, text, text) from public, anon;
grant execute on function public.course_moderate(uuid, text, text) to authenticated;


-- Video havolasi: muallif mavjud Bunny ID yoki pleyer havolasini darsga biriktiradi.
-- Fayl yuklash (Bunny API) bo‘lmasa ham video saqlanadi. Faqat o‘z darsi.
create or replace function public.course_author_attach_video(p_lesson_id uuid, p_video_id text, p_duration integer default 0)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  les public.course_lessons;
  v_id text;
  v_dur integer;
begin
  if uid is null or not public.course_is_teacher(uid) then
    return jsonb_build_object('ok', false, 'error', 'Ruxsat yo‘q');
  end if;
  if p_lesson_id is null then
    return jsonb_build_object('ok', false, 'error', 'Dars topilmadi');
  end if;
  select l.* into les
    from public.course_lessons l
    join public.courses c on c.id = l.course_id
   where l.id = p_lesson_id
     and c.author_id = uid
   for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Dars topilmadi');
  end if;
  v_id := left(trim(coalesce(p_video_id, '')), 80);
  if v_id = '' or v_id !~ '^[A-Za-z0-9_-]{6,80}$' then
    return jsonb_build_object('ok', false, 'error', 'Video identifikatori yoki havolasi noto‘g‘ri');
  end if;
  v_dur := least(86400, greatest(0, coalesce(p_duration, 0)));
  if v_dur = 0 then
    v_dur := greatest(coalesce(les.duration_seconds, 0), 1);
  end if;
  update public.course_lessons
     set bunny_video_id = v_id,
         encoding_status = 'finished',
         duration_seconds = v_dur
   where id = les.id;
  return jsonb_build_object('ok', true, 'videoId', v_id, 'encoding', 'finished', 'duration', v_dur);
end;
$$;
revoke all on function public.course_author_attach_video(uuid, text, integer) from public, anon;
grant execute on function public.course_author_attach_video(uuid, text, integer) to authenticated;

comment on table public.course_payment_events is
  '0078: muallif «To‘landi» belgilari. Pul tizim orqali o‘tmaydi (Click/Payme ulanmagan).';

commit;
