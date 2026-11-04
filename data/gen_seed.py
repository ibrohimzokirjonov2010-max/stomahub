import json,glob,os
def q(v):
    if v is None: return 'null'
    return "'"+str(v).replace("'","''")+"'"
out=["-- 0056: NAMUNA (demo) seed — QO'LLANMAGAN. 0055_demo_stores.sql dan keyin ishga tushiriladi.",
"-- Rasmlar: data/img/<slug>/ ichida. Reja: ularni Storage 'catalog' bucket'iga demo/<slug>/ ga yuklab,",
"-- image_url ni public URL ga almashtirish (hozircha manba URL saqlangan). Ma'lumotlar faqat ochiq manbadan; yo'q bo'lsa NULL.",
"begin;"]
links=[]
for f in sorted(glob.glob('*.json')):
    s=json.load(open(f))
    if 'slug' not in s: continue
    out.append(f"\n-- {s['name']} ({len(s['items'])} ta)")
    out.append(f"insert into public.demo_entities (kind, slug, name, description, city, address, phone, website, telegram, logo_url, source_urls) values ({q(s['kind'])}, {q(s['slug'])}, {q(s['name'])}, {q(s.get('description'))}, {q(s.get('city'))}, {q(s.get('address'))}, {q(s.get('phone'))}, {q(s.get('website'))}, {q(s.get('telegram'))}, {q(s.get('logo_url'))}, array[{', '.join(q(u) for u in s['source_urls'])}]::text[]) on conflict (slug) do nothing;")
    kind={'shop':'product','organizer':'seminar','bookseller':'book'}[s['kind']]
    for n,it in enumerate(s['items']):
        out.append(f"insert into public.demo_items (entity_id, kind, name, price, price_text, currency, image_url, description, source_url, extra, sort_at) select id, {q(kind)}, {q(it['name'])}, {it['price'] if it.get('price') is not None else 'null'}, {q(it.get('price_text'))}, {q(it.get('currency'))}, {q(it.get('image_url'))}, {q(it.get('description'))}, {q(it['source_url'])}, {q(json.dumps(it.get('extra') or {},ensure_ascii=False))}::jsonb, {n} from public.demo_entities where slug = {q(s['slug'])} and not exists (select 1 from public.demo_items x where x.entity_id = demo_entities.id and x.source_url = {q(it['source_url'])} and x.name = {q(it['name'])});")
out.append("commit;\n-- Havolalar: select slug, 'https://stomahub-three.vercel.app/namuna/' || demo_token || '?src=' || slug from public.demo_entities where is_demo order by kind, slug;")
open('/workspace/migsrv/0056_demo_seed.sql','w').write('\n'.join(out)+'\n')
print('ok')
