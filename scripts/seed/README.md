# StomaHub official catalog seed

Content: `marketplace-seed.json` (20 products, 2 books). Script: `seed-marketplace.mjs` (dry-run by default).

1. Crop images (products already cropped to `/workspace/mp-out`):
   `python3 scripts/seed/crop_grid.py designs/.../01-kompozit.png /workspace/mp-out 01-kompozit` (one per product)
   Products 11–20 (3+2 collages, 5 images each, `imageCount: 5`):
   `python3 scripts/seed/crop_collage.py designs/marketplace-products-2/11-implant.png /workspace/mp-out 11-implant`
   Books: `crop_grid.py kitob-01-terapevtik.png /workspace/mp-out book-terapevtik-stomatologiya-2004` and
   `crop_grid.py kitob-02-ortopedik.png /workspace/mp-out book-ortopedik-stomatologiya-propedevtikasi-2006`
2. Apply `supabase/migrations/0021_product_specs.sql` in the Supabase SQL editor.
3. Dry run: `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… STOMAHUB_SELLER_EMAIL=… node scripts/seed/seed-marketplace.mjs`
4. Apply (needs owner OK): same command + `--apply` (add `--skip-books` if book images are not ready).

Products go live as `status='active'` under the profile `shop_name='StomaHub'`, `role='seller'`, `seller_status='approved'`. Stock starts at 10 and can be edited in the seller cabinet.
Books go to `catalog_items(kind='book')` with `price: null` → shown as "Narxi kelishiladi" (no cart).

## Book PDFs (needs migration 0022_book_files.sql)
- The full PDF is uploaded unchanged to the **private** bucket `book-files/<book_id>/<name>.pdf`. It is linked as `payload.pdf` (`path`, `pages`, `size`) and `payload.pages` is set from `pdfinfo`.
- The preview is the first 20 pages, rendered with `pdftoppm` to jpeg files in the public bucket `catalog/books/<book_id>/preview/` and stored as `payload.pdf.preview`. It uses page images rather than a PDF excerpt because the Terapevtik PDF has owner restrictions, which are not removed.
- Who can open the full PDF: the user must have a `book_access(user_id, book_id)` row, or be the book owner or an admin. They get a 10-minute signed URL. To grant access after a sale (as the owner, admin or service role):
  `insert into book_access (user_id, book_id, source) values ('<buyer uuid>', 'terapevtik-stomatologiya-2004', 'purchase');`
- Source files are taken from `PDF_DIR` (default `/workspace/designs/marketplace-products`).

## Existing seller account (never downgraded)
If `STOMAHUB_SELLER_EMAIL` already belongs to a user, the seed sets only `shop_name='StomaHub'` and `seller_status='approved'`. The role stays `seller`/`admin`; customer/organizer is promoted to `seller`. The personal name is kept (it is set to "StomaHub" only for a brand-new or nameless profile). The dry run prints the planned change.
An `admin` can open the seller cabinet (SellerGate admits admin). The seller RPCs need `0023_admin_can_sell.sql` (`is_seller()` accepts admin); apply it before seeding into an admin account.
