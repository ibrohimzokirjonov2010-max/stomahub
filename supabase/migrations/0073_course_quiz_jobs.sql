-- 0073: dars videosidan AI test qoralamasi. Qo‘lda qo‘llanadi, takror ishga tushirish xavfsiz.
-- Ish holati shu jadvalda. Talaba ko‘rmaydi. Yozish faqat service role (API).
-- O‘qish: kurs muallifi yoki admin. To‘g‘ri javoblar shu qoralamada turadi,
-- course_questions ga faqat shifokor saqlaganda (course_save) tushadi.
-- Audio bo‘laklari yopiq bucketda: mijoz o‘qiy olmaydi, policy yo‘q.

create table if not exists public.course_quiz_jobs (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.course_lessons (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'queued',
  progress integer not null default 0,
  stage text not null default '',
  error text not null default '',
  error_code text not null default '',
  stt_id text not null default '',
  stt_idempotency_key uuid,
  llm_model text not null default '',
  transcript_raw text not null default '',
  transcript_clean text not null default '',
  questions jsonb not null default '[]'::jsonb,
  plan jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  lock_token text not null default '',
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_quiz_jobs_status_chk check (status in (
    'queued', 'resolving', 'extracting', 'uploading', 'transcribing', 'cleaning', 'generating', 'ready', 'failed'
  )),
  constraint course_quiz_jobs_progress_chk check (progress between 0 and 100),
  constraint course_quiz_jobs_attempts_chk check (attempts >= 0 and attempts <= 8)
);

create index if not exists course_quiz_jobs_lesson_idx
  on public.course_quiz_jobs (lesson_id, created_at desc);

alter table public.course_quiz_jobs enable row level security;

drop policy if exists course_quiz_jobs_owner_read on public.course_quiz_jobs;
create policy course_quiz_jobs_owner_read on public.course_quiz_jobs
  for select to authenticated
  using (
    exists (
      select 1
        from public.courses c
       where c.id = course_quiz_jobs.course_id
         and (
           c.author_id = (select auth.uid())
           or exists (
             select 1 from public.profiles p
              where p.id = (select auth.uid()) and p.role = 'admin'
           )
         )
    )
  );

revoke all on public.course_quiz_jobs from public, anon, authenticated;
grant select on public.course_quiz_jobs to authenticated;

comment on table public.course_quiz_jobs is
  'AI test qoralamasi. Talabaga ochilmaydi. INSERT/UPDATE/DELETE faqat service role. SELECT: kurs muallifi yoki admin.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('course-quiz-audio', 'course-quiz-audio', false, 83886080, array['application/octet-stream', 'audio/mp4'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Bucketda authenticated/anon policy yo‘q: mijoz o‘qiy olmaydi va yoza olmaydi.
-- Service role RLS ni chetlab o‘tadi. Eski policy qolgan bo‘lsa olib tashlanadi.
drop policy if exists course_quiz_audio_all on storage.objects;
drop policy if exists course_quiz_audio_read on storage.objects;
drop policy if exists course_quiz_audio_write on storage.objects;
