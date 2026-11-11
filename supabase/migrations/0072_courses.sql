-- 0072: onlayn kurslar (Ta’lim). Qo‘lda qo‘llanadi, takror ishga tushirish xavfsiz.
-- Video Bunny Stream’da. To‘g‘ri javoblar, ball, sertifikat va dars ochilishi
-- faqat security definer RPC orqali. Talaba to‘g‘ridan-to‘g‘ri yozolmaydi.
-- Narx saqlanadi. To‘lov ulanmagan: faqat bepul (price = 0) kursga kirish ochiladi.

alter table public.customer_certificates
  add column if not exists score_pct integer,
  add column if not exists code text;

-- Talaba o‘ziga sertifikat yozolmasin. Seminar berilishi cert_to_customer() (security definer) orqali qoladi.
drop policy if exists customer_certificates_own on public.customer_certificates;
create policy customer_certificates_own on public.customer_certificates
  for select to authenticated
  using (user_id = (select auth.uid()));
revoke insert, update, delete on public.customer_certificates from anon, authenticated;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default '',
  description text not null default '',
  direction text not null default 'terapiya',
  level text not null default 'bosh',
  format text not null default 'kurs',
  price integer not null default 0,
  cover_url text not null default '',
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courses_price_chk check (price >= 0 and price <= 100000000),
  constraint courses_status_chk check (status in ('draft', 'published', 'archived')),
  constraint courses_direction_chk check (direction in ('terapiya', 'endo', 'impl', 'ortoped', 'orto', 'paro', 'digital', 'klinika')),
  constraint courses_level_chk check (level in ('bosh', 'orta', 'ekspert')),
  constraint courses_format_chk check (format in ('video', 'kurs', 'vebinar'))
);

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  position integer not null,
  title text not null default '',
  description text not null default '',
  module_title text not null default '',
  bunny_video_id text not null default '',
  duration_seconds integer not null default 0,
  encoding_status text not null default 'empty',
  pass_threshold integer not null default 70,
  points integer not null default 10,
  created_at timestamptz not null default now(),
  constraint course_lessons_threshold_chk check (pass_threshold between 1 and 100),
  constraint course_lessons_points_chk check (points between 0 and 100),
  constraint course_lessons_encoding_chk check (encoding_status in ('empty', 'created', 'uploading', 'processing', 'finished', 'failed'))
);

create table if not exists public.course_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.course_lessons (id) on delete cascade,
  position integer not null,
  prompt text not null,
  options jsonb not null,
  correct_index integer not null,
  constraint course_questions_correct_chk check (correct_index >= 0)
);

create table if not exists public.course_enrollments (
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  price_amount integer not null default 0,
  payment_status text not null default 'free',
  access boolean not null default false,
  points integer not null default 0,
  score_pct integer,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id),
  constraint course_enrollments_pay_chk check (payment_status in ('free', 'unpaid', 'paid'))
);

create table if not exists public.course_lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.course_lessons (id) on delete cascade,
  watched_seconds integer not null default 0,
  watched_ratio numeric not null default 0,
  quiz_unlocked boolean not null default false,
  quiz_passed boolean not null default false,
  quiz_score integer,
  quiz_attempts integer not null default 0,
  points_awarded integer not null default 0,
  last_report_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.course_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.course_lessons (id) on delete cascade,
  score integer not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists courses_published_idx on public.courses (published_at desc) where status = 'published';
create index if not exists courses_author_idx on public.courses (author_id, updated_at desc);
create index if not exists course_lessons_course_idx on public.course_lessons (course_id, position);
create index if not exists course_questions_lesson_idx on public.course_questions (lesson_id, position);
create index if not exists course_enrollments_user_idx on public.course_enrollments (user_id);
create index if not exists course_progress_user_idx on public.course_lesson_progress (user_id);
create index if not exists course_quiz_attempts_user_idx on public.course_quiz_attempts (user_id, lesson_id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'course_lessons_position_key') then
    alter table public.course_lessons
      add constraint course_lessons_position_key unique (course_id, position) deferrable initially deferred;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'course_questions_position_key') then
    alter table public.course_questions
      add constraint course_questions_position_key unique (lesson_id, position) deferrable initially deferred;
  end if;
end $$;

alter table public.courses enable row level security;
alter table public.course_lessons enable row level security;
alter table public.course_questions enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.course_lesson_progress enable row level security;
alter table public.course_quiz_attempts enable row level security;

drop policy if exists courses_read on public.courses;
create policy courses_read on public.courses
  for select to anon, authenticated
  using (status = 'published' or author_id = (select auth.uid()));

revoke all on public.courses from anon, authenticated;
grant select on public.courses to anon, authenticated;
revoke all on public.course_lessons from anon, authenticated;
revoke all on public.course_questions from anon, authenticated;
revoke all on public.course_enrollments from anon, authenticated;
revoke all on public.course_lesson_progress from anon, authenticated;
revoke all on public.course_quiz_attempts from anon, authenticated;

-- To‘g‘ri javob ustuni hatto keyin SELECT berilsa ham talabaga ochilmasin.
revoke all on public.course_questions from anon, authenticated;

create or replace function public.course_is_admin(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles p where p.id = p_uid and p.role = 'admin');
$$;

create or replace function public.course_is_teacher(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_uid
      and (p.role = 'admin' or (p.role = 'organizer' and p.org_status = 'approved'))
  );
$$;

create or replace function public.course_mark_passed(p_user uuid, p_lesson uuid, p_score integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points integer;
  v_course uuid;
  v_cert jsonb;
begin
  update public.course_lesson_progress prog
     set quiz_passed = true,
         quiz_score = p_score,
         quiz_unlocked = true,
         points_awarded = l.points,
         updated_at = now()
    from public.course_lessons l
   where prog.lesson_id = l.id
     and prog.user_id = p_user
     and prog.lesson_id = p_lesson
     and prog.quiz_passed = false
  returning l.points, l.course_id into v_points, v_course;
  if not found then
    return null;
  end if;
  update public.course_enrollments
     set points = points + coalesce(v_points, 0)
   where user_id = p_user and course_id = v_course;
  v_cert := public.course_issue_certificate(p_user, v_course);
  return jsonb_build_object('points', coalesce(v_points, 0), 'certificate', v_cert);
end;
$$;

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

  update public.course_enrollments
     set score_pct = v_score, completed_at = coalesce(completed_at, now())
   where user_id = p_user and course_id = p_course;

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

create or replace function public.course_catalog()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select jsonb_agg(to_jsonb(x) order by x.published_at desc nulls last)
    from (
      select c.id,
             c.title,
             c.description as about,
             c.direction,
             c.level,
             c.format,
             c.price,
             c.cover_url as cover,
             c.published_at,
             coalesce(nullif(public.display_name(p.name, p.full_name, p.email), ''), 'Muallif') as doctor,
             coalesce(p.avatar_url, '') as avatar,
             coalesce(nullif(p.specialty, ''), 'Muallif') as role,
             (select count(*)::int from public.course_lessons l where l.course_id = c.id) as lessons,
             (select coalesce(sum(l.duration_seconds), 0)::int from public.course_lessons l where l.course_id = c.id) as duration_seconds,
             (select count(*)::int from public.course_enrollments e where e.course_id = c.id) as enrolled
        from public.courses c
        join public.profiles p on p.id = c.author_id
       where c.status = 'published'
    ) x
  ), '[]'::jsonb);
$$;

-- fn:course_player
create or replace function public.course_player(p_course_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  crs public.courses;
  author public.profiles;
  enr public.course_enrollments;
  v_preview boolean := false;
  v_access boolean := false;
  v_enrolled boolean := false;
  lessons jsonb := '[]'::jsonb;
  rec public.course_lessons;
  prog public.course_lesson_progress;
  has_quiz boolean;
  complete boolean;
  open_lesson boolean;
  prev_done boolean := true;
  questions jsonb;
  cert public.customer_certificates;
  done_n integer := 0;
  lesson_n integer := 0;
  v_has_prog boolean := false;
  v_has_cert boolean := false;
begin
  select * into crs from public.courses where id = p_course_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Kurs topilmadi');
  end if;
  if crs.status <> 'published' and crs.author_id is distinct from uid and not public.course_is_admin(uid) then
    return jsonb_build_object('ok', false, 'error', 'Kurs topilmadi');
  end if;
  select * into author from public.profiles where id = crs.author_id;
  if uid is not null then
    select * into enr from public.course_enrollments where user_id = uid and course_id = crs.id;
    v_enrolled := found;
    if found then v_access := enr.access; end if;
    select * into cert from public.customer_certificates
     where user_id = uid and course_id = 'course:' || crs.id::text;
    v_has_cert := found;
  end if;
  v_preview := uid is not null and (crs.author_id = uid or public.course_is_admin(uid)) and not v_access;

  for rec in
    select * from public.course_lessons where course_id = crs.id order by position, created_at
  loop
    lesson_n := lesson_n + 1;
    v_has_prog := false;
    if uid is not null then
      select * into prog from public.course_lesson_progress where user_id = uid and lesson_id = rec.id;
      v_has_prog := found;
    end if;
    select exists (select 1 from public.course_questions q where q.lesson_id = rec.id) into has_quiz;
    complete := v_has_prog and prog.quiz_passed;
    if complete then done_n := done_n + 1; end if;
    open_lesson := v_preview or (v_access and prev_done);
    questions := '[]'::jsonb;
    if open_lesson and has_quiz and v_has_prog and prog.quiz_unlocked and not complete then
      select coalesce(jsonb_agg(jsonb_build_object(
               'id', qq.id,
               'prompt', qq.prompt,
               'options', qq.options
             ) order by qq.position), '[]'::jsonb)
        into questions
        from public.course_questions qq
       where qq.lesson_id = rec.id;
    end if;
    lessons := lessons || jsonb_build_array(jsonb_build_object(
      'id', rec.id,
      'position', rec.position,
      'title', rec.title,
      'description', rec.description,
      'moduleTitle', rec.module_title,
      'durationSeconds', rec.duration_seconds,
      'encodingStatus', rec.encoding_status,
      'hasQuiz', has_quiz,
      'passThreshold', rec.pass_threshold,
      'points', rec.points,
      'locked', not open_lesson,
      'videoId', case when open_lesson then rec.bunny_video_id else '' end,
      'watchedSeconds', case when v_has_prog then prog.watched_seconds else 0 end,
      'watchedRatio', case when v_has_prog then prog.watched_ratio else 0 end,
      'quizUnlocked', v_has_prog and prog.quiz_unlocked and open_lesson,
      'quizPassed', complete,
      'quizScore', case when v_has_prog then prog.quiz_score else null end,
      'attempts', case when v_has_prog then prog.quiz_attempts else 0 end,
      'complete', complete,
      'questions', questions
    ));
    prev_done := complete;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'course', jsonb_build_object(
      'id', crs.id,
      'title', crs.title,
      'about', crs.description,
      'direction', crs.direction,
      'level', crs.level,
      'format', crs.format,
      'price', crs.price,
      'cover', crs.cover_url,
      'status', crs.status,
      'doctor', coalesce(nullif(public.display_name(author.name, author.full_name, author.email), ''), 'Muallif'),
      'role', coalesce(nullif(author.specialty, ''), 'Muallif'),
      'avatar', coalesce(author.avatar_url, ''),
      'authorId', crs.author_id,
      'lessons', lesson_n,
      'done', done_n,
      'pct', case when lesson_n = 0 then 0 else round(100.0 * done_n / lesson_n)::int end,
      'enrolled', v_enrolled,
      'access', v_access,
      'preview', v_preview,
      'paymentStatus', case when v_enrolled then enr.payment_status else '' end,
      'points', case when v_enrolled then enr.points else 0 end,
      'score', case when v_enrolled then enr.score_pct else null end,
      'completed', v_enrolled and enr.completed_at is not null,
      'certificate', case when not v_has_cert then null else jsonb_build_object(
        'id', cert.id, 'code', cert.code, 'title', cert.title, 'scorePct', cert.score_pct,
        'points', cert.cme, 'hours', cert.hours, 'holderName', cert.holder_name,
        'speaker', cert.speaker, 'issuedAt', cert.issued_at, 'kind', coalesce(cert.kind, 'online')
      ) end
    ),
    'lessons', lessons
  );
end;
$$;
-- endfn:course_player

create or replace function public.course_enroll(p_course_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  crs public.courses;
  enr public.course_enrollments;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'Kirish kerak');
  end if;
  select * into crs from public.courses where id = p_course_id and status = 'published';
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Kurs topilmadi');
  end if;
  insert into public.course_enrollments (user_id, course_id, price_amount, payment_status, access)
  values (
    uid, crs.id, crs.price,
    case when crs.price = 0 then 'free' else 'unpaid' end,
    crs.price = 0
  )
  on conflict (user_id, course_id) do nothing;
  select * into enr from public.course_enrollments where user_id = uid and course_id = crs.id;
  return jsonb_build_object(
    'ok', true,
    'access', enr.access,
    'paymentStatus', enr.payment_status,
    'price', crs.price
  );
end;
$$;

create or replace function public.course_report_progress(p_lesson_id uuid, p_position numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  les public.course_lessons;
  enr public.course_enrollments;
  prog public.course_lesson_progress;
  v_cap integer;
  v_prev integer;
  v_pos integer;
  v_next integer;
  v_ratio numeric;
  v_unlock boolean;
  v_has_quiz boolean;
  v_marked jsonb;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'Kirish kerak');
  end if;
  perform pg_advisory_xact_lock(hashtext(uid::text), hashtext(p_lesson_id::text));
  select * into les from public.course_lessons where id = p_lesson_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Dars topilmadi');
  end if;
  select * into enr from public.course_enrollments where user_id = uid and course_id = les.course_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Kursga yozilmagansiz');
  end if;
  if not enr.access then
    return jsonb_build_object('ok', false, 'error', 'Kursga yozilmagansiz');
  end if;
  if exists (
    select 1 from public.course_lessons older
    where older.course_id = les.course_id
      and (older.position < les.position or (older.position = les.position and older.created_at < les.created_at and older.id <> les.id))
      and not exists (
        select 1 from public.course_lesson_progress p
        where p.user_id = uid and p.lesson_id = older.id and p.quiz_passed
      )
  ) then
    return jsonb_build_object('ok', false, 'error', 'Avval oldingi darsni yakunlang');
  end if;
  if les.encoding_status is distinct from 'finished' or les.duration_seconds <= 0 then
    return jsonb_build_object('ok', true, 'watched', 0, 'ratio', 0, 'quizUnlocked', false, 'encoding', les.encoding_status);
  end if;

  select * into prog from public.course_lesson_progress where user_id = uid and lesson_id = les.id;
  if found and prog.quiz_passed then
    return jsonb_build_object('ok', true, 'watched', prog.watched_seconds, 'ratio', prog.watched_ratio, 'quizUnlocked', true, 'quizPassed', true);
  end if;
  if not found then
    v_cap := 20;
    v_prev := 0;
  elsif prog.last_report_at is null then
    v_cap := 20;
    v_prev := coalesce(prog.watched_seconds, 0);
  else
    v_cap := least(30, greatest(floor(extract(epoch from (now() - prog.last_report_at)))::int, 0));
    v_prev := coalesce(prog.watched_seconds, 0);
  end if;
  v_pos := greatest(0, coalesce(floor(least(greatest(coalesce(p_position, 0), 0), les.duration_seconds))::int, 0));
  v_next := least(les.duration_seconds, greatest(v_prev, least(v_pos, v_prev + v_cap)));
  v_ratio := v_next::numeric / les.duration_seconds;
  v_unlock := v_ratio >= 0.9;

  insert into public.course_lesson_progress as p (
    user_id, lesson_id, watched_seconds, watched_ratio, quiz_unlocked, last_report_at, updated_at
  ) values (
    uid, les.id, v_next, v_ratio, v_unlock, now(), now()
  )
  on conflict (user_id, lesson_id) do update set
    watched_seconds = excluded.watched_seconds,
    watched_ratio = excluded.watched_ratio,
    quiz_unlocked = p.quiz_unlocked or excluded.quiz_unlocked,
    last_report_at = excluded.last_report_at,
    updated_at = excluded.updated_at;

  select exists (select 1 from public.course_questions q where q.lesson_id = les.id) into v_has_quiz;
  v_marked := null;
  if v_unlock and not v_has_quiz then
    v_marked := public.course_mark_passed(uid, les.id, 100);
  end if;

  return jsonb_build_object(
    'ok', true,
    'watched', v_next,
    'ratio', v_ratio,
    'quizUnlocked', v_unlock,
    'quizPassed', v_marked is not null,
    'pointsAwarded', coalesce((v_marked->>'points')::int, 0),
    'certificate', v_marked->'certificate'
  );
end;
$$;

create or replace function public.course_submit_quiz(p_lesson_id uuid, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  les public.course_lessons;
  enr public.course_enrollments;
  prog public.course_lesson_progress;
  v_total integer;
  v_correct integer;
  v_score integer;
  v_passed boolean;
  v_wrong jsonb;
  v_marked jsonb;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'Kirish kerak');
  end if;
  if jsonb_typeof(coalesce(p_answers, 'null'::jsonb)) is distinct from 'array' then
    return jsonb_build_object('ok', false, 'error', 'Javoblar noto‘g‘ri');
  end if;
  perform pg_advisory_xact_lock(hashtext(uid::text), hashtext(p_lesson_id::text));
  select * into les from public.course_lessons where id = p_lesson_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Dars topilmadi');
  end if;
  select * into enr from public.course_enrollments where user_id = uid and course_id = les.course_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Kursga yozilmagansiz');
  end if;
  if not enr.access then
    return jsonb_build_object('ok', false, 'error', 'Kursga yozilmagansiz');
  end if;
  select * into prog from public.course_lesson_progress where user_id = uid and lesson_id = les.id;
  if found and prog.quiz_passed then
    return jsonb_build_object('ok', true, 'passed', true, 'score', prog.quiz_score, 'already', true, 'threshold', les.pass_threshold);
  end if;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Test ochilishi uchun darsning 90% ini tomosha qiling');
  end if;
  if not prog.quiz_unlocked then
    return jsonb_build_object('ok', false, 'error', 'Test ochilishi uchun darsning 90% ini tomosha qiling');
  end if;

  select count(*) into v_total from public.course_questions where lesson_id = les.id;
  if v_total = 0 then
    v_marked := public.course_mark_passed(uid, les.id, 100);
    return jsonb_build_object('ok', true, 'passed', true, 'score', 100, 'threshold', les.pass_threshold, 'correct', 0, 'total', 0, 'wrongIds', '[]'::jsonb, 'pointsAwarded', coalesce((v_marked->>'points')::int, 0), 'certificate', v_marked->'certificate');
  end if;

  with answers as (
    select case when elem->>'id' ~* '^[0-9a-f-]{36}$' then (elem->>'id')::uuid else null end as id,
           case when coalesce(elem->>'choice', '') ~ '^[0-9]+$' then (elem->>'choice')::int else -1 end as choice
      from jsonb_array_elements(p_answers) elem
  )
  select count(*) filter (where a.choice = q.correct_index),
         coalesce(jsonb_agg(q.id) filter (where a.choice is distinct from q.correct_index), '[]'::jsonb)
    into v_correct, v_wrong
    from public.course_questions q
    left join answers a on a.id = q.id
   where q.lesson_id = les.id;

  v_score := round(100.0 * v_correct / v_total)::int;
  v_passed := v_score >= les.pass_threshold;

  insert into public.course_quiz_attempts (user_id, lesson_id, score, passed)
  values (uid, les.id, v_score, v_passed);
  update public.course_lesson_progress
     set quiz_attempts = quiz_attempts + 1,
         quiz_score = v_score,
         updated_at = now()
   where user_id = uid and lesson_id = les.id;

  v_marked := null;
  if v_passed then
    v_marked := public.course_mark_passed(uid, les.id, v_score);
  end if;

  return jsonb_build_object(
    'ok', true,
    'passed', v_passed,
    'score', v_score,
    'threshold', les.pass_threshold,
    'correct', v_correct,
    'total', v_total,
    'wrongIds', v_wrong,
    'pointsAwarded', coalesce((v_marked->>'points')::int, 0),
    'certificate', v_marked->'certificate'
  );
end;
$$;

create or replace function public.my_courses()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when auth.uid() is null then '[]'::jsonb else coalesce((
    select jsonb_agg(to_jsonb(x) order by x.complete, x.created_at desc)
    from (
      select c.id,
             c.title,
             c.description as about,
             c.cover_url as cover,
             c.price,
             c.direction,
             c.level,
             c.format,
             coalesce(nullif(public.display_name(p.name, p.full_name, p.email), ''), 'Muallif') as doctor,
             coalesce(nullif(p.specialty, ''), '') as role,
             coalesce(p.avatar_url, '') as avatar,
             (select count(*)::int from public.course_lessons l where l.course_id = c.id) as lessons,
             (select count(*)::int from public.course_lesson_progress pr
                join public.course_lessons l on l.id = pr.lesson_id
               where pr.user_id = e.user_id and l.course_id = c.id and pr.quiz_passed) as done,
             (select coalesce(sum(l.duration_seconds), 0)::int from public.course_lessons l where l.course_id = c.id) as duration_seconds,
             e.points,
             e.score_pct as score,
             e.access,
             e.payment_status as payment_status,
             e.created_at,
             (e.completed_at is not null) as complete,
             cert.id as certificate_id,
             cert.code,
             cert.holder_name,
             cert.issued_at,
             cert.hours,
             cert.cme,
             cert.speaker
        from public.course_enrollments e
        join public.courses c on c.id = e.course_id
        join public.profiles p on p.id = c.author_id
        left join public.customer_certificates cert
          on cert.user_id = e.user_id and cert.course_id = 'course:' || c.id::text
       where e.user_id = auth.uid()
    ) x
  ), '[]'::jsonb) end;
$$;

create or replace function public.course_authored()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when auth.uid() is null or not public.course_is_teacher(auth.uid()) then '[]'::jsonb else coalesce((
    select jsonb_agg(to_jsonb(x) order by x.updated_at desc)
    from (
      select c.id, c.title, c.status, c.price, c.cover_url as cover, c.format, c.level, c.direction, c.updated_at,
             (select count(*)::int from public.course_lessons l where l.course_id = c.id) as lessons,
             (select count(*)::int from public.course_enrollments e where e.course_id = c.id) as enrolled
        from public.courses c
       where c.author_id = auth.uid()
          or (public.course_is_admin(auth.uid()) and c.author_id = auth.uid())
    ) x
  ), '[]'::jsonb) end;
$$;

create or replace function public.course_editor(p_course_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  crs public.courses;
  lessons jsonb := '[]'::jsonb;
  rec public.course_lessons;
  questions jsonb;
begin
  if uid is null or not public.course_is_teacher(uid) then
    return jsonb_build_object('ok', false, 'error', 'Ruxsat yo‘q');
  end if;
  select * into crs from public.courses where id = p_course_id;
  if not found or (crs.author_id is distinct from uid and not public.course_is_admin(uid)) then
    return jsonb_build_object('ok', false, 'error', 'Kurs topilmadi');
  end if;
  for rec in select * from public.course_lessons where course_id = crs.id order by position loop
    select coalesce(jsonb_agg(jsonb_build_object(
             'id', q.id,
             'prompt', q.prompt,
             'options', q.options,
             'correctIndex', q.correct_index
           ) order by q.position), '[]'::jsonb)
      into questions
      from public.course_questions q
     where q.lesson_id = rec.id;
    lessons := lessons || jsonb_build_array(jsonb_build_object(
      'id', rec.id,
      'position', rec.position,
      'title', rec.title,
      'description', rec.description,
      'moduleTitle', rec.module_title,
      'passThreshold', rec.pass_threshold,
      'points', rec.points,
      'bunnyVideoId', rec.bunny_video_id,
      'encodingStatus', rec.encoding_status,
      'durationSeconds', rec.duration_seconds,
      'questions', questions
    ));
  end loop;
  return jsonb_build_object(
    'ok', true,
    'course', jsonb_build_object(
      'id', crs.id,
      'title', crs.title,
      'description', crs.description,
      'direction', crs.direction,
      'level', crs.level,
      'format', crs.format,
      'price', crs.price,
      'coverUrl', crs.cover_url,
      'status', crs.status
    ),
    'lessons', lessons
  );
end;
$$;

create or replace function public.course_delete(p_course_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  crs public.courses;
  v_n integer;
begin
  if uid is null or not public.course_is_teacher(uid) then
    return jsonb_build_object('ok', false, 'error', 'Ruxsat yo‘q');
  end if;
  select * into crs from public.courses where id = p_course_id;
  if not found or (crs.author_id is distinct from uid and not public.course_is_admin(uid)) then
    return jsonb_build_object('ok', false, 'error', 'Kurs topilmadi');
  end if;
  select count(*) into v_n from public.course_enrollments where course_id = crs.id;
  if v_n > 0 then
    update public.courses set status = 'archived', updated_at = now() where id = crs.id;
    return jsonb_build_object('ok', true, 'archived', true);
  end if;
  delete from public.courses where id = crs.id;
  return jsonb_build_object('ok', true, 'deleted', true);
end;
$$;

create or replace function public.course_save(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_raw_id text;
  v_id uuid;
  v_owner uuid;
  v_title text;
  v_about text;
  v_direction text;
  v_level text;
  v_format text;
  v_price integer;
  v_cover text;
  v_status text;
  v_lessons jsonb;
  v_clean jsonb := '[]'::jsonb;
  v_item jsonb;
  v_n integer := 0;
  v_title_l text;
  v_desc text;
  v_module text;
  v_threshold integer;
  v_points integer;
  v_lid uuid;
  v_raw text;
  v_video text;
  v_encoding text;
  v_duration integer;
  v_qs jsonb;
  v_q jsonb;
  v_qi integer;
  v_prompt text;
  v_opts jsonb;
  v_opt jsonb;
  v_text text;
  v_clean_opts jsonb;
  v_correct integer;
  v_kept uuid[] := '{}';
  v_row jsonb;
  v_new uuid;
  v_out jsonb := '[]'::jsonb;
  v_pos integer := 0;
begin
  if uid is null or not public.course_is_teacher(uid) then
    return jsonb_build_object('ok', false, 'error', 'Kurs yaratish uchun tasdiqlangan tashkilotchi kerak');
  end if;
  if jsonb_typeof(p_payload) is distinct from 'object' then
    return jsonb_build_object('ok', false, 'error', 'Ma’lumot noto‘g‘ri');
  end if;

  v_raw_id := nullif(trim(coalesce(p_payload->>'id', '')), '');
  if v_raw_id is not null then
    begin
      v_id := v_raw_id::uuid;
    exception when invalid_text_representation then
      return jsonb_build_object('ok', false, 'error', 'Kurs identifikatori noto‘g‘ri');
    end;
    select author_id into v_owner from public.courses where id = v_id;
    if not found then
      return jsonb_build_object('ok', false, 'error', 'Kurs topilmadi');
    end if;
    if v_owner is distinct from uid and not public.course_is_admin(uid) then
      return jsonb_build_object('ok', false, 'error', 'Bu kurs sizga tegishli emas');
    end if;
  else
    v_owner := uid;
  end if;

  v_status := coalesce(nullif(p_payload->>'status', ''), 'draft');
  if v_status not in ('draft', 'published') then
    return jsonb_build_object('ok', false, 'error', 'Holat noto‘g‘ri');
  end if;
  v_title := left(trim(coalesce(p_payload->>'title', '')), 140);
  v_about := left(trim(coalesce(p_payload->>'description', '')), 5000);
  v_direction := coalesce(nullif(p_payload->>'direction', ''), 'terapiya');
  v_level := coalesce(nullif(p_payload->>'level', ''), 'bosh');
  v_format := coalesce(nullif(p_payload->>'format', ''), 'kurs');
  if v_direction not in ('terapiya', 'endo', 'impl', 'ortoped', 'orto', 'paro', 'digital', 'klinika')
     or v_level not in ('bosh', 'orta', 'ekspert')
     or v_format not in ('video', 'kurs', 'vebinar') then
    return jsonb_build_object('ok', false, 'error', 'Yo‘nalish, daraja yoki format noto‘g‘ri');
  end if;
  if coalesce(p_payload->>'price', '0') !~ '^[0-9]+$' then
    return jsonb_build_object('ok', false, 'error', 'Narx noto‘g‘ri');
  end if;
  v_price := least((p_payload->>'price')::int, 100000000);
  v_cover := left(trim(coalesce(p_payload->>'coverUrl', '')), 500);
  if v_cover <> '' and v_cover !~ '^https://' and v_cover !~ '^/' then
    return jsonb_build_object('ok', false, 'error', 'Muqova manzili noto‘g‘ri');
  end if;
  if v_status = 'published' and char_length(v_title) < 3 then
    return jsonb_build_object('ok', false, 'error', 'Nashr uchun kurs nomi kerak');
  end if;
  if v_title = '' then v_title := 'Nomsiz kurs'; end if;

  if jsonb_typeof(p_payload->'lessons') is distinct from 'array' then
    v_lessons := '[]'::jsonb;
  else
    v_lessons := p_payload->'lessons';
  end if;
  if v_status = 'published' and jsonb_array_length(v_lessons) < 1 then
    return jsonb_build_object('ok', false, 'error', 'Nashr uchun kamida bitta dars kerak');
  end if;

  for v_item in select value from jsonb_array_elements(v_lessons) loop
    v_n := v_n + 1;
    if v_n > 40 then
      return jsonb_build_object('ok', false, 'error', 'Darslar 40 tadan oshmasin');
    end if;
    v_title_l := left(trim(coalesce(v_item->>'title', '')), 160);
    v_desc := left(trim(coalesce(v_item->>'description', '')), 2000);
    v_module := left(trim(coalesce(v_item->>'moduleTitle', '')), 80);
    if coalesce(v_item->>'passThreshold', '70') !~ '^[0-9]+$' or coalesce(v_item->>'points', '10') !~ '^[0-9]+$' then
      return jsonb_build_object('ok', false, 'error', 'Test bali yoki ball noto‘g‘ri');
    end if;
    v_threshold := least(100, greatest(1, (v_item->>'passThreshold')::int));
    v_points := least(100, greatest(0, (v_item->>'points')::int));
    v_lid := null;
    v_video := '';
    v_encoding := 'empty';
    v_duration := 0;
    v_raw := nullif(trim(coalesce(v_item->>'id', '')), '');
    if v_raw is not null then
      begin
        v_lid := v_raw::uuid;
      exception when invalid_text_representation then
        return jsonb_build_object('ok', false, 'error', 'Dars identifikatori noto‘g‘ri');
      end;
      if v_id is not null then
        select bunny_video_id, encoding_status, duration_seconds
          into v_video, v_encoding, v_duration
          from public.course_lessons
         where id = v_lid and course_id = v_id;
        if not found then
          v_lid := null;
          v_video := '';
          v_encoding := 'empty';
          v_duration := 0;
        end if;
      else
        v_lid := null;
      end if;
    end if;
    if v_status = 'published' and (char_length(v_title_l) < 2 or coalesce(v_video, '') = '') then
      return jsonb_build_object('ok', false, 'error', 'Nashr uchun har bir darsda nom va video bo‘lishi kerak');
    end if;
    if v_title_l = '' then v_title_l := v_n || '-dars'; end if;

    v_qs := '[]'::jsonb;
    v_qi := 0;
    if jsonb_typeof(v_item->'questions') = 'array' then
      for v_q in select value from jsonb_array_elements(v_item->'questions') loop
        v_qi := v_qi + 1;
        if v_qi > 20 then
          return jsonb_build_object('ok', false, 'error', 'Bir darsda 20 tadan ortiq savol bo‘lmasin');
        end if;
        v_prompt := left(trim(coalesce(v_q->>'prompt', '')), 500);
        if char_length(v_prompt) < 2 then
          return jsonb_build_object('ok', false, 'error', 'Savol matni kerak');
        end if;
        if jsonb_typeof(v_q->'options') is distinct from 'array' then
          return jsonb_build_object('ok', false, 'error', 'Javob variantlari kerak');
        end if;
        v_clean_opts := '[]'::jsonb;
        for v_opt in select value from jsonb_array_elements(v_q->'options') loop
          v_text := left(trim(coalesce(v_opt #>> '{}', '')), 200);
          if v_text = '' then
            return jsonb_build_object('ok', false, 'error', 'Bo‘sh javob varianti bo‘lmasin');
          end if;
          v_clean_opts := v_clean_opts || jsonb_build_array(v_text);
        end loop;
        if jsonb_array_length(v_clean_opts) < 2 or jsonb_array_length(v_clean_opts) > 6 then
          return jsonb_build_object('ok', false, 'error', 'Har bir savolda 2 tadan 6 tagacha variant bo‘lsin');
        end if;
        if coalesce(v_q->>'correctIndex', '') !~ '^[0-9]+$' then
          return jsonb_build_object('ok', false, 'error', 'To‘g‘ri javobni belgilang');
        end if;
        v_correct := (v_q->>'correctIndex')::int;
        if v_correct < 0 or v_correct >= jsonb_array_length(v_clean_opts) then
          return jsonb_build_object('ok', false, 'error', 'To‘g‘ri javob variantlardan biri bo‘lsin');
        end if;
        v_qs := v_qs || jsonb_build_array(jsonb_build_object(
          'prompt', v_prompt, 'options', v_clean_opts, 'correctIndex', v_correct
        ));
      end loop;
    end if;

    v_clean := v_clean || jsonb_build_array(jsonb_build_object(
      'id', v_lid,
      'title', v_title_l,
      'description', v_desc,
      'moduleTitle', v_module,
      'passThreshold', v_threshold,
      'points', v_points,
      'questions', v_qs
    ));
  end loop;

  if v_id is null then
    insert into public.courses (author_id, title, description, direction, level, format, price, cover_url, status, published_at)
    values (v_owner, v_title, v_about, v_direction, v_level, v_format, v_price, v_cover, v_status,
            case when v_status = 'published' then now() else null end)
    returning id into v_id;
  else
    update public.courses
       set title = v_title,
           description = v_about,
           direction = v_direction,
           level = v_level,
           format = v_format,
           price = v_price,
           cover_url = v_cover,
           status = v_status,
           published_at = case when v_status = 'published' then coalesce(published_at, now()) else published_at end,
           updated_at = now()
     where id = v_id;
  end if;

  v_pos := 0;
  for v_row in select value from jsonb_array_elements(v_clean) loop
    v_pos := v_pos + 1;
    v_lid := null;
    if nullif(v_row->>'id', '') is not null then
      v_lid := (v_row->>'id')::uuid;
      update public.course_lessons
         set position = v_pos,
             title = v_row->>'title',
             description = coalesce(v_row->>'description', ''),
             module_title = coalesce(v_row->>'moduleTitle', ''),
             pass_threshold = (v_row->>'passThreshold')::int,
             points = (v_row->>'points')::int
       where id = v_lid and course_id = v_id;
    else
      insert into public.course_lessons (course_id, position, title, description, module_title, pass_threshold, points)
      values (
        v_id, v_pos, v_row->>'title', coalesce(v_row->>'description', ''), coalesce(v_row->>'moduleTitle', ''),
        (v_row->>'passThreshold')::int, (v_row->>'points')::int
      )
      returning id into v_lid;
    end if;
    v_kept := array_append(v_kept, v_lid);
    delete from public.course_questions where lesson_id = v_lid;
    v_qi := 0;
    for v_q in select value from jsonb_array_elements(coalesce(v_row->'questions', '[]'::jsonb)) loop
      v_qi := v_qi + 1;
      insert into public.course_questions (lesson_id, position, prompt, options, correct_index)
      values (v_lid, v_qi, v_q->>'prompt', v_q->'options', (v_q->>'correctIndex')::int);
    end loop;
    v_out := v_out || jsonb_build_array(jsonb_build_object('id', v_lid, 'position', v_pos));
  end loop;

  delete from public.course_lessons
   where course_id = v_id and not (id = any (v_kept));

  return jsonb_build_object('ok', true, 'id', v_id, 'lessons', v_out);
end;
$$;

revoke all on function public.course_is_admin(uuid) from public, anon, authenticated;
revoke all on function public.course_is_teacher(uuid) from public, anon, authenticated;
revoke all on function public.course_mark_passed(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.course_issue_certificate(uuid, uuid) from public, anon, authenticated;

revoke all on function public.course_catalog() from public;
grant execute on function public.course_catalog() to anon, authenticated;

revoke all on function public.course_player(uuid) from public;
grant execute on function public.course_player(uuid) to anon, authenticated;

revoke all on function public.course_enroll(uuid) from public, anon;
grant execute on function public.course_enroll(uuid) to authenticated;

revoke all on function public.course_report_progress(uuid, numeric) from public, anon;
grant execute on function public.course_report_progress(uuid, numeric) to authenticated;

revoke all on function public.course_submit_quiz(uuid, jsonb) from public, anon;
grant execute on function public.course_submit_quiz(uuid, jsonb) to authenticated;

revoke all on function public.my_courses() from public, anon;
grant execute on function public.my_courses() to authenticated;

revoke all on function public.course_authored() from public, anon;
grant execute on function public.course_authored() to authenticated;

revoke all on function public.course_editor(uuid) from public, anon;
grant execute on function public.course_editor(uuid) to authenticated;

revoke all on function public.course_delete(uuid) from public, anon;
grant execute on function public.course_delete(uuid) to authenticated;

revoke all on function public.course_save(jsonb) from public, anon;
grant execute on function public.course_save(jsonb) to authenticated;

comment on table public.course_questions is
  'correct_index talabaga yuborilmaydi. O‘qish faqat course_editor (muallif) va course_submit_quiz (baholash) orqali.';
