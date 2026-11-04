import json,glob
def q(v):
    if v is None: return 'null'
    return "'"+str(v).replace("'","''")+"'"
SP="'<SUPABASE_URL>/storage/v1/object/public/seller-media/'"
out=["-- 0056: NAMUNA (demo) seed — QO'LLANMAGAN. 0055_demo_stores.sql dan keyin ishga tushiriladi.",
"-- Ma'lumotlar faqat ochiq manbalardan (har bir qatorda source_url). Ko'rsatilmagan narx = NULL, hech narsa to'qilmagan.",
"-- Dental Trading: USD narx 04.11.2026 CBU kursi (11 911.71) bo'yicha so'mga o'girilgan; asl USD extra.usd_price/usd_text da.",
"--",
"-- RASMLAR — APPLY VAQTIDAGI REJA (hozir bajarilmagan):",
"--  1) 0055, keyin shu fayl qo'llanadi. image_url/logo_url dastlab manba URL (Telegram CDN URL'lari muddati o'tadi!).",
"--  2) Repo ildizidan: SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_KEY=... bash data/upload_storage.sh",
"--     data/img/<slug>/* -> public 'seller-media' bucket, demo/<slug>/<fayl> (x-upsert: true).",
"--  3) Fayl oxiridagi izohlangan UPDATE'larni <SUPABASE_URL> ni almashtirib ishga tushiring.",
"begin;"]
logos=[]
for f in sorted(glob.glob('*.json')):
    s=json.load(open(f))
    if 'slug' not in s or 'items' not in s: continue
    out.append(f"\n-- {s['name']} [{s['kind']}] ({len(s['items'])} ta)")
    out.append(f"insert into public.demo_entities (kind, slug, name, description, city, address, phone, website, telegram, logo_url, source_urls) values ({q(s['kind'])}, {q(s['slug'])}, {q(s['name'])}, {q(s.get('description'))}, {q(s.get('city'))}, {q(s.get('address'))}, {q(s.get('phone'))}, {q(s.get('website'))}, {q(s.get('telegram'))}, {q(s.get('logo_url'))}, array[{', '.join(q(u) for u in s['source_urls'])}]::text[]) on conflict (slug) do nothing;")
    if s.get('logo_local'): logos.append((s['slug'],'demo/'+s['logo_local'].split('img/',1)[1]))
    kind={'shop':'product','organizer':'seminar','bookseller':'book'}[s['kind']]
    for n,it in enumerate(s['items']):
        ex=dict(it.get('extra') or {})
        if it.get('image_local'): ex['storage_path']='demo/'+it['image_local'].split('img/',1)[1]
        out.append(f"insert into public.demo_items (entity_id, kind, name, price, price_text, currency, image_url, description, source_url, extra, sort_at) select id, {q(kind)}, {q(it['name'])}, {it['price'] if it.get('price') is not None else 'null'}, {q(it.get('price_text'))}, {q(it.get('currency'))}, {q(it.get('image_url'))}, {q(it.get('description'))}, {q(it['source_url'])}, {q(json.dumps(ex,ensure_ascii=False))}::jsonb, {n} from public.demo_entities where slug = {q(s['slug'])} and not exists (select 1 from public.demo_items x where x.entity_id = demo_entities.id and x.source_url = {q(it['source_url'])} and x.name = {q(it['name'])});")
out.append("commit;")
out.append("\n-- 3-qadam (upload_storage.sh dan keyin):")
out.append(f"-- update public.demo_items set image_url = {SP} || (extra->>'storage_path') where extra ? 'storage_path';")
for sl,p in logos: out.append(f"-- update public.demo_entities set logo_url = {SP} || {q(p)} where slug = {q(sl)};")
out.append("\n-- Havolalar: select kind, slug, 'https://stomahub-three.vercel.app/namuna/' || demo_token || '?src=' || slug from public.demo_entities where is_demo order by kind, slug;")
open('/workspace/migsrv/0056_demo_seed.sql','w').write('\n'.join(out)+'\n'); print('ok',len(logos))
