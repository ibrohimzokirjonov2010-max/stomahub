-- 0033: seminar sahifasidagi barcha bloklar uchun alohida ustunlar
-- (galereya, savol-javob, manzil izohlari, o‘z sertifikat dizayni, aloqa).
-- Ilova hozircha shu ma’lumotlarni seminars.form (jsonb) ichida saqlaydi va
-- ustun bo‘lsa undan, bo‘lmasa form dan o‘qiydi. Migratsiya qo‘llangach
-- Vercel’da VITE_SEMINAR_EXTRA_COLS=1 yoqilsa, ustunlarga ham yoziladi.

alter table public.seminars
  add column if not exists gallery          jsonb not null default '[]'::jsonb,
  add column if not exists faq              jsonb not null default '[]'::jsonb,
  add column if not exists venue_notes      text  not null default '',
  add column if not exists cert_design      jsonb,
  add column if not exists contact_phone    text  not null default '',
  add column if not exists contact_telegram text  not null default '';

-- Mavjud form jsonb dagi qiymatlarni ko‘chirish (faqat bo‘sh ustunlarga)
update public.seminars set
  gallery          = case when jsonb_typeof(form->'gallery') = 'array' then form->'gallery' else gallery end,
  faq              = case when jsonb_typeof(form->'faq') = 'array' then form->'faq' else faq end,
  venue_notes      = coalesce(nullif(form->>'venueNotes', ''), venue_notes),
  cert_design      = case when jsonb_typeof(form->'certDesign') = 'object' then form->'certDesign' else cert_design end,
  contact_phone    = coalesce(nullif(form->>'contactPhone', ''), contact_phone),
  contact_telegram = coalesce(nullif(form->>'contactTelegram', ''), contact_telegram)
where form is not null;

alter table public.seminars
  add constraint seminars_gallery_is_array check (jsonb_typeof(gallery) = 'array') not valid,
  add constraint seminars_faq_is_array check (jsonb_typeof(faq) = 'array') not valid;
