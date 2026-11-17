-- 0077: Klinika CRM — bemor hujjatlari, rentgen va bemor rasmi uchun yopiq Storage bucket. NOT applied automatically.
--   Bucket 'patient-files' (yopiq, public = false): 25 MB gacha; JPG/PNG/WEBP/HEIC rasm va PDF.
--   Yo‘l: <shifokor uid>/patients/<bemor id>/<vaqt>-<fayl nomi>.
--   RLS: yuklash, o‘qish, yangilash va o‘chirish — FAQAT papka egasi (auth.uid()). Admin uchun ham o‘qish yo‘q:
--   bemor ma’lumoti faqat o‘sha shifokorga tegishli. Ko‘rish faqat signed URL orqali.
-- Takror ishga tushirish xavfsiz (idempotent). Hech qanday qator o‘chirilmaydi.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('patient-files', 'patient-files', false, 26214400,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists patient_files_insert_own on storage.objects;
create policy patient_files_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'patient-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists patient_files_read_own on storage.objects;
create policy patient_files_read_own on storage.objects for select to authenticated
  using (bucket_id = 'patient-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists patient_files_update_own on storage.objects;
create policy patient_files_update_own on storage.objects for update to authenticated
  using (bucket_id = 'patient-files' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'patient-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists patient_files_delete_own on storage.objects;
create policy patient_files_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'patient-files' and (storage.foldername(name))[1] = auth.uid()::text);
