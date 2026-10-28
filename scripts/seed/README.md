# StomaHub official catalog seed

Content: `marketplace-seed.json` (10 products, 2 books). Script: `seed-marketplace.mjs` (dry-run by default).

1. Crop images (products already cropped to `/workspace/mp-out`):
   `python3 scripts/seed/crop_grid.py designs/.../01-kompozit.png /workspace/mp-out 01-kompozit` (one per product)
   Books: `crop_grid.py kitob-01-terapevtik.png /workspace/mp-out book-terapevtik-stomatologiya-2004` and
   `crop_grid.py kitob-02-ortopedik.png /workspace/mp-out book-ortopedik-stomatologiya-propedevtikasi-2006`
2. Apply `supabase/migrations/0021_product_specs.sql` in the Supabase SQL editor.
3. Dry run: `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… STOMAHUB_SELLER_EMAIL=… node scripts/seed/seed-marketplace.mjs`
4. Apply (needs owner OK): same command + `--apply` (add `--skip-books` if book images are not ready).

Products go live as `status='active'` under the profile `shop_name='StomaHub'`, `role='seller'`, `seller_status='approved'`. Stock starts at 10 and can be edited in the seller cabinet.
Books go to `catalog_items(kind='book')` with `price: null` → shown as "Narxi kelishiladi" (no cart).
