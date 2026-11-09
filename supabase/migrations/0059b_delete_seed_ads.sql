-- 0059b: Delete ownerless seed E'lonlar (classified ads). Ibrohim approved.
-- Idempotent: only kind='ad' AND owner_id IS NULL AND id IN (seed list).
-- DO NOT auto-apply; commit only. No other catalog kinds touched.

-- Confirmed via REST (anon) 2026-11-10: exactly these 11 rows, owner_id null.
-- unit-kreslo | Stomatologik unit (kreslo)
-- implant-toplam | Implant to‘plami (yangi)
-- kabinet-ijara | Stomatologik kabinet ijaraga
-- kompozit-a2 | Kompozit (A2)
-- stomatolog-kerak | Stomatolog shifokor kerak
-- avtoklav | Avtoklav (sterilizator)
-- nsk-turbina | NSK turbina uchligi
-- skaler-ijara | Ultratovush skaler ijaraga
-- assistent-kerak | Stomatolog assistenti kerak
-- endomotor | Endomotor apekslokator bilan
-- bond-set | Bonding to‘plami

delete from public.catalog_items
 where kind = 'ad'
   and owner_id is null
   and id in (
     'unit-kreslo',
     'implant-toplam',
     'kabinet-ijara',
     'kompozit-a2',
     'stomatolog-kerak',
     'avtoklav',
     'nsk-turbina',
     'skaler-ijara',
     'assistent-kerak',
     'endomotor',
     'bond-set'
   );

-- Favorites / user_blobs may reference these ids in JSON only (no FK) — leave blobs as-is;
-- UI already ignores missing ads via findAd → null.
