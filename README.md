# StomaHub

Vite + React app. Shared seminar data (cabinet, catalog, registrations, payments, wallet) is stored in Supabase. The browser uses the anon key. Server routes under `/api` use the service role key and never ship it to the client.

Production: https://stomahub-three.vercel.app

## Apply the database

DDL cannot be applied with the anon or service-role REST key. Open the Supabase SQL editor for project `agmkoeuhqrwdvrreamhj` and run the full file:

`supabase/migrations/0001_init.sql`

Then run `supabase/migrations/0002_customer.sql` in the same editor. Both files are idempotent. `0001` creates seminar tables, RLS, registration/payment RPCs, and seeds the demo cabinet for `organizer@stomahub.uz` only. `0002` adds customer tables, per-user clinic blobs, the public `catalog_items` seed, and the avatars bucket. Neither file drops the existing marketplace tables (`users`, `products`, `orders`, `reviews`, `sellers`, and the rest). A new signed-in account starts empty.

Until that script has been run, the app still renders the static catalog and shows an error asking for the migration.

Demo organizer (created by the migration):

- email: `organizer@stomahub.uz`
- password: `StomaHub-demo-2026`

`EARLYBIRD` in the seeded promo list is expired. A second active code, also `EARLYBIRD` (`early-live`, 20%), is what registration uses.

## Environment variables

Copy `.env.example` to `.env.local` for `npm run dev`. On Vercel, set the same names for Production (and Preview if you use it).

| Name | Where | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | client | Supabase project URL, `https://agmkoeuhqrwdvrreamhj.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | client | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Auth admin, phone OTP, Telegram webhook. Never prefix with `VITE_` |
| `SUPABASE_URL` | server, optional | Falls back to `VITE_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | server, optional | Falls back to `VITE_SUPABASE_ANON_KEY`. Used to turn a magic link into a session |
| `TELEGRAM_BOT_TOKEN` | server only | Bot token from BotFather. Verifies the login widget and sends OTP messages |
| `TELEGRAM_BOT_USERNAME` | server | Bot username without `@`, for the phone-link error |
| `VITE_TELEGRAM_BOT_USERNAME` | client | Same username, for the login widget and `t.me` link |
| `TELEGRAM_WEBHOOK_SECRET` | server, optional | If set, `/api/telegram/webhook` requires `X-Telegram-Bot-Api-Secret-Token` |

`npm run dev` also serves `/api/*` locally so phone and Telegram routes can be tried without `vercel dev`.

## Google sign-in

1. In Google Cloud, create an OAuth client (Web). Authorized redirect URI: `https://agmkoeuhqrwdvrreamhj.supabase.co/auth/v1/callback`.
2. In Supabase → Authentication → Providers → Google, enable the provider and paste the client id and secret.
3. Authentication → URL configuration:
   - Site URL: `https://stomahub-three.vercel.app`
   - Additional redirect URLs: `https://stomahub-three.vercel.app/kirish` and `http://localhost:5173/kirish`
4. If email confirmation is enabled, email/password sign-up stays pending until the user confirms. The demo organizer is already confirmed by the SQL seed. Phone and Telegram sign-in confirm the user on the server.

The login page stores the chosen role (`customer` or `organizer`) in user metadata. `/tashkilotchi/*` requires an organizer profile. A signed-in customer can press **Tashkilotchi bo‘lish**.

## Telegram

1. Create a bot with BotFather. Set the domain for the login widget to `stomahub-three.vercel.app` (and `localhost` while developing, if BotFather allows it).
2. Put the token in `TELEGRAM_BOT_TOKEN` and the username in both `TELEGRAM_BOT_USERNAME` and `VITE_TELEGRAM_BOT_USERNAME`.
3. Point the webhook at the deployed function:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://stomahub-three.vercel.app/api/telegram/webhook","secret_token":"<TELEGRAM_WEBHOOK_SECRET>"}'
```

Phone login: the user opens `https://t.me/<username>?start=link`, shares their contact, then requests a 6-digit code on `/kirish`. The code is stored only as a hash, expires in 5 minutes, and is rate-limited. `/api/auth/telegram` checks the widget hash and returns a Supabase session.

These tokens are not in the repo. Google, the login widget, and phone OTP stay unavailable until they are set.

## Routes

`vercel.json` rewrites every path except `/api/` to `index.html`, so the Vite SPA and the Node functions coexist. The service worker does not cache `/api/`.

## Customer data

Run `supabase/migrations/0002_customer.sql` in the SQL editor after `0001_init.sql`. It is idempotent. It adds the signed-in customer's profile fields, addresses, saved cards (last 4 digits only), favorites, course progress, shop orders, per-user clinic blobs, the public `catalog_items` seed, and a public `avatars` storage bucket.

Until that file is applied, customer pages keep the bundled copy and show a sync error after sign-in. A signed-in user's own edits are stored in Supabase and loaded again on another device.

Personal rows belong to one account. Row level security uses `profiles.id = auth.uid()`, `user_id = auth.uid()`, or `organizer_id = auth.uid()`. Queries also filter by the current user. The demo organizer (`organizer@stomahub.uz`, id `11111111-1111-4111-8111-111111111111`) is the only account that receives the bundled clinic, cart, profile, and cabinet sample. Every other signed-in doctor starts empty: profile fields blank, orders and tickets empty, clinic patients/visits/stock/plans/payments empty, organizer charts and check-ins empty, with short Uzbek empty states. Logged-out pages may still show the bundled showcase. Public catalog rows stay shared.

| Section | Where it lives |
| --- | --- |
| Public seminar catalog, tickets on published seminars, active promos | Real shared catalog (`0001_init.sql`), readable by everyone |
| Organizer seminars, promos, registrations, payments, check-in, wallet, certificates, dashboard stats | Real, only that organizer's rows. A new organizer sees empty Uzbek states |
| Profile name, phone, specialty, clinic, city, language, notifications, avatar | Real (DB + Storage) for the signed-in user. A new user starts blank |
| Addresses, cards, favorites, course progress, shop orders | Real, `user_id = auth.uid()`. Empty until the user adds them |
| Saved seminars, saved ads, cart, book reading position | Real per user. Empty for a new account |
| Clinic patients, visits, stock, treatment plans, price list, payments, dashboard board, mobile community feed | Real per-user blobs. Empty for a new account. Sample rows exist only on the demo organizer |
| Marketplace, books, courses, news, channels, jobs, repair masters, ads, deals, surplus, uniforms, devices, consultations, community catalog | Real public `catalog_items`. The page still renders the bundled copy if `0002` has not been applied |
| Personal certificate gallery and Seminarlarim sample cards | Empty after sign-in. The logged-out page can still show the bundled gallery |
| Click, Payme, and Uzum checkout | Still opens the provider site and does not charge a merchant account |
| Google, Telegram Login, phone OTP | Implemented. They stay unavailable until the OAuth client and bot token are set |
| Desktop community composer | Signed-in name comes from the profile. Edits on that screen stay in memory; the mobile feed is the persisted per-user copy |

