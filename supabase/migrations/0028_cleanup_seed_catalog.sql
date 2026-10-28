-- 0028: Demo (egasiz) katalog yozuvlarini tozalash.
-- DIQQAT: hali qo'llanmagan. Frontend bu turlarni allaqachon yashiradi (recordSync SEED_KINDS).
-- Qo'llashdan oldin zaxira oling va owner_id IS NULL yozuvlar haqiqatan demo ekanini tasdiqlang.
begin;

-- 248 ta soxta vakansiya (Smile Dental, DentaCare ...)
delete from public.catalog_items where kind = 'job' and owner_id is null;

-- Soxta reyting / "120+ sotilgan" li demo aksiyalar
delete from public.catalog_items where kind = 'deal' and owner_id is null;

-- O'ylab topilgan obunachi sonli demo kanallar
delete from public.catalog_items where kind = 'channel' and owner_id is null;

commit;
