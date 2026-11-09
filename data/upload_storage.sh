#!/usr/bin/env bash
# 0056 apply vaqtida ishga tushiriladi (hozir ishlatilmagan). Kalit faqat env orqali, chop etilmaydi.
set -euo pipefail
: "${SUPABASE_URL:?}"; : "${SUPABASE_SERVICE_KEY:?}"
cd "$(dirname "$0")/img"
find . -type f | while read -r f; do
  p="demo/${f#./}"
  # Supabase Storage ASCII bo'lmagan kalitlarni rad etadi — bunday fayl nomini oldindan to'xtatamiz.
  if LC_ALL=C grep -q '[^ -~]' <<<"$p"; then echo "FAIL $p (ASCII bo'lmagan nom — faylni qayta nomlang)"; continue; fi
  case "$f" in *.png) ct=image/png;; *.webp) ct=image/webp;; *.gif) ct=image/gif;; *) ct=image/jpeg;; esac
  curl -sf -X POST "$SUPABASE_URL/storage/v1/object/seller-media/$p" -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" -H "x-upsert: true" -H "Content-Type: $ct" --data-binary "@$f" >/dev/null && echo "ok $p" || echo "FAIL $p"
done
