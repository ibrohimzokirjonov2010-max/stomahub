-- 0074: kurs testini tuzatish. 0072 jonli bazada qo‘llangan — uni tahrirlamang.
-- Qo‘lda qo‘llanadi. create or replace, takror ishga tushirish xavfsiz.
-- Har bir savolga bitta javob. Dublikat, noma’lum id yoki ortiqcha qator rad etiladi.
-- To‘g‘ri soni savollar sonidan oshmaydi. Xato savol idlari qaytmaydi.
-- O‘tish: xato (javobsiz ham) soni max_mistakes dan oshmasa. Odatiy qiymat 2.
-- pass_threshold saqlanadi, baholashda ishlatilmaydi.
-- Urinishlar: 60 soniya tanaffus va bir dars uchun kuniga 5 ta.

create index if not exists course_quiz_attempts_window_idx
  on public.course_quiz_attempts (user_id, lesson_id, created_at desc);

alter table public.course_lessons
  add column if not exists max_mistakes integer not null default 2;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'course_lessons_max_mistakes_chk') then
    alter table public.course_lessons
      add constraint course_lessons_max_mistakes_chk check (max_mistakes between 0 and 20);
  end if;
end $$;

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
  v_correct integer := 0;
  v_score integer;
  v_passed boolean;
  v_marked jsonb;
  v_day_count integer := 0;
  v_last_at timestamptz;
  v_oldest_at timestamptz;
  v_wait integer;
  v_n integer := 0;
  v_bad integer := 0;
  v_distinct integer := 0;
  v_unknown integer := 0;
  v_mistakes integer := 0;
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
    return jsonb_build_object(
      'ok', true,
      'passed', true,
      'score', 100,
      'threshold', les.pass_threshold,
      'correct', 0,
      'total', 0,
      'mistakes', 0,
      'maxMistakes', les.max_mistakes,
      'wrongCount', 0,
      'wrongIds', '[]'::jsonb,
      'pointsAwarded', coalesce((v_marked->>'points')::int, 0),
      'certificate', v_marked->'certificate'
    );
  end if;

  select count(*)::int, max(created_at), min(created_at)
    into v_day_count, v_last_at, v_oldest_at
    from public.course_quiz_attempts
   where user_id = uid
     and lesson_id = les.id
     and created_at > now() - interval '1 day';

  if v_day_count >= 5 then
    v_wait := greatest(1, ceil(extract(epoch from (v_oldest_at + interval '1 day' - now())))::int);
    return jsonb_build_object(
      'ok', false,
      'code', 'daily',
      'error', 'Bugun bu dars uchun 5 ta urinish ishlatildi. Ertaga qayta urinib ko‘ring.',
      'retryAfter', v_wait,
      'attemptsLeft', 0
    );
  end if;

  if v_last_at is not null and v_last_at > now() - interval '60 seconds' then
    v_wait := greatest(1, ceil(extract(epoch from (v_last_at + interval '60 seconds' - now())))::int);
    return jsonb_build_object(
      'ok', false,
      'code', 'cooldown',
      'error', 'Keyingi urinishdan oldin biroz kuting.',
      'retryAfter', v_wait,
      'attemptsLeft', greatest(0, 5 - v_day_count)
    );
  end if;

  with raw as (
    select case
             when jsonb_typeof(elem) = 'object'
              and coalesce(elem->>'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
             then (elem->>'id')::uuid
           end as id,
           case
             when jsonb_typeof(elem) = 'object'
              and coalesce(elem->>'choice', '') ~ '^[0-9]+$'
             then (elem->>'choice')::int
             else -1
           end as choice
      from jsonb_array_elements(p_answers) as elem
  ),
  stats as (
    select count(*)::int as n,
           count(*) filter (where id is null)::int as bad,
           count(distinct id)::int as uniq
      from raw
  ),
  unknown as (
    select count(*)::int as n
      from raw r
     where r.id is not null
       and not exists (
         select 1
           from public.course_questions q
          where q.id = r.id
            and q.lesson_id = les.id
       )
  ),
  one_each as (
    select distinct on (id) id, choice
      from raw
     where id is not null
     order by id
  ),
  graded as (
    select count(*) filter (where a.choice = q.correct_index)::int as correct
      from public.course_questions q
      left join one_each a on a.id = q.id
     where q.lesson_id = les.id
  )
  select stats.n, stats.bad, stats.uniq, unknown.n, least(coalesce(graded.correct, 0), v_total)
    into v_n, v_bad, v_distinct, v_unknown, v_correct
    from stats
    cross join unknown
    cross join graded;

  if coalesce(v_n, 0) > v_total
     or coalesce(v_bad, 0) > 0
     or coalesce(v_n, 0) is distinct from coalesce(v_distinct, 0)
     or coalesce(v_unknown, 0) > 0 then
    return jsonb_build_object('ok', false, 'error', 'Har bir savolga bitta javob yuboring');
  end if;

  v_correct := least(coalesce(v_correct, 0), v_total);
  v_mistakes := v_total - v_correct;
  v_score := least(100, round((100.0 * v_correct) / v_total)::int);
  v_passed := v_mistakes <= les.max_mistakes;

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
    'mistakes', v_mistakes,
    'maxMistakes', les.max_mistakes,
    'wrongCount', v_mistakes,
    'wrongIds', '[]'::jsonb,
    'retryAfter', case when v_passed then 0 else 60 end,
    'attemptsLeft', greatest(0, 4 - v_day_count),
    'pointsAwarded', coalesce((v_marked->>'points')::int, 0),
    'certificate', v_marked->'certificate'
  );
end;
$$;

revoke all on function public.course_submit_quiz(uuid, jsonb) from public, anon;
grant execute on function public.course_submit_quiz(uuid, jsonb) to authenticated;

comment on function public.course_submit_quiz(uuid, jsonb) is
  'Bitta javob. O‘tish: xatolar <= max_mistakes (odatiy 2). 60s tanaffus, kuniga 5 urinish. Xato savol idlari qaytmaydi.';


-- Talaba pleeri maxMistakes ni ko‘rsatadi. pass_threshold faqat eski maydon.
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
      'maxMistakes', rec.max_mistakes,
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

revoke all on function public.course_player(uuid) from public;
grant execute on function public.course_player(uuid) to anon, authenticated;

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
      'maxMistakes', rec.max_mistakes,
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

revoke all on function public.course_editor(uuid) from public, anon;
grant execute on function public.course_editor(uuid) to authenticated;

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
  v_max_mistakes integer;
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
    if coalesce(v_item->>'maxMistakes', '2') !~ '^[0-9]+$' then
      return jsonb_build_object('ok', false, 'error', 'Ruxsat etilgan xato soni noto‘g‘ri');
    end if;
    v_threshold := least(100, greatest(1, (v_item->>'passThreshold')::int));
    v_max_mistakes := least(20, greatest(0, coalesce(v_item->>'maxMistakes', '2')::int));
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
      'maxMistakes', v_max_mistakes,
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
             max_mistakes = (v_row->>'maxMistakes')::int,
             points = (v_row->>'points')::int
       where id = v_lid and course_id = v_id;
    else
      insert into public.course_lessons (course_id, position, title, description, module_title, pass_threshold, max_mistakes, points)
      values (
        v_id, v_pos, v_row->>'title', coalesce(v_row->>'description', ''), coalesce(v_row->>'moduleTitle', ''),
        (v_row->>'passThreshold')::int, (v_row->>'maxMistakes')::int, (v_row->>'points')::int
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

revoke all on function public.course_save(jsonb) from public, anon;
grant execute on function public.course_save(jsonb) to authenticated;
