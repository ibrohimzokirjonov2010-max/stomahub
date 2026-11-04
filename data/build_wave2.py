import json,os,re,subprocess,sys,html,glob,urllib.parse
sys.path.insert(0,'.'); from tgparse import parse
W='raw/w2/'
def dl(u,fn):
    if not u: return None
    os.makedirs(os.path.dirname(fn),exist_ok=True)
    if not os.path.exists(fn) or os.path.getsize(fn)<500: subprocess.run(['curl','-sL','-m','120','--retry','2','-A','Mozilla/5.0','-o',fn,u])
    return fn if os.path.exists(fn) and os.path.getsize(fn)>500 else None
def ext(u): e=os.path.splitext(urllib.parse.urlparse(u).path)[1].lower(); return e if e in ('.jpg','.jpeg','.png','.webp','.gif') else '.jpg'
def txt(h):
    h=re.sub(r'(?s)<(script|style|svg)[^>]*>.*?</\1>','',h); t=html.unescape(re.sub(r'<[^>]+>','\n',h))
    return [l.strip() for l in t.split('\n') if l.strip()]
def short(s,n=600):
    s=re.sub(r'[ \t]+',' ',s).strip()
    return s if len(s)<=n else s[:n].rsplit(' ',1)[0]+'…'
def meta(h,k):
    m=re.search(r'<meta (?:property|name)="%s" content="([^"]*)'%re.escape(k),h); return html.unescape(m[1]).strip() if m else None
def tgent(ch):
    f=W+f'tg_{ch}.html'; return parse(f)
E={}
def ent(slug,kind,name,**k):
    E[slug]=dict(slug=slug,kind=kind,name=name,items=[],**k)
# ---------- shops
for slug,ch,name,city,addr,phone in [
 ('sarus','SARUSuz','Sarus','Toshkent','г. Ташкент, ул. Нукусская, д.89','+998 (78) 150-26-90'),
 ('dentoptics','dentoptics_uzb','DentOptics',None,None,'+998900969395')]:
    c,_=tgent(ch); ent(slug,'shop',name,description=c['desc'],city=city,address=addr,phone=phone,website=None,telegram='https://t.me/'+ch,logo_url=c['avatar'],source_urls=['https://t.me/'+ch])
# Dental Goods (WooCommerce store API)
t=open(W+'dg.json').read(); dg=json.loads(t[t.index('[{'):])
ent('dental-goods','shop','Dental Goods',description='Стоматологическое оборудование и материалы | Продажа и сервис',city='Toshkent',address='г. Ташкент, Юнусабадский район, 13 квартал, 64А',phone='+998 (55) 513-65-65; +998 (71) 223-65-65',website='https://dentalgoods.uz',telegram=None,logo_url='https://dentalgoods.uz/wp-content/uploads/2025/12/cropped-3213123-32x32.png',source_urls=['https://dentalgoods.uz'])
for p in dg[:20]:
    pr=int(p['prices']['price'] or 0)
    d=short(' '.join(txt(p['short_description'] or p['description'])))
    E['dental-goods']['items'].append(dict(kind='product',name=html.unescape(p['name']),price=pr or None,price_text=None,currency='UZS' if pr else None,image_url=p['images'][0]['src'] if p['images'] else None,source_url=p['permalink'],description=d or None,extra={}))
# Asia Stom Plus
ent('asia-stom-plus','shop','Asia Stom Plus',description='Официальный поставщик стоматологических материалов в Узбекистане. Официальный дистрибьютор Meta Biomed (Корея), MEGADENTA (Германия), i-dental (Литва), PD (Швейцария).',city='Toshkent',address='Ташкент, Мукимий 12',phone='+998 (90) 034-00-30',website='https://asiastom.uz',telegram=None,logo_url='https://asiastom.uz/favicon.png',source_urls=['https://asiastom.uz'])
for f in sorted(glob.glob(W+'as/*.html')):
    h=open(f,encoding='utf-8',errors='ignore').read(); L=txt(h); slug=os.path.basename(f)[:-5]
    try: i=max(j for j in range(len(L)-1) if L[j]=='/' and j>0 and L[j-1].startswith('Стоматологические'))
    except ValueError: continue
    name=L[i+1]; body=[]
    for l in L[i+3:]:
        if l.startswith('Оставить заявку'): break
        body.append(l)
    im=re.search(r'data-src="(/thumb/[^"]+)"',h)
    if not body: continue
    E['asia-stom-plus']['items'].append(dict(kind='product',name=name,price=None,price_text=None,currency=None,image_url='https://asiastom.uz'+im[1] if im else None,source_url='https://asiastom.uz/'+slug,description=short(' '.join(body)),extra={}))
E['asia-stom-plus']['items']=E['asia-stom-plus']['items'][:20]
# DENTRADE
ent('dentrade','shop','DENTRADE (PRO-TEXNIKA)',description='Магазин по продаже стоматологических расходных материалов, зубных имплантов и стоматологического оборудования.',city='Toshkent',address='г. Ташкент, ул. Абдуллы Каххара 47',phone='+998 (95) 340-10-10; +998 (95) 340-20-20',website='https://dentrade.uz',telegram=None,logo_url='https://dentrade.uz/thumb/2/LWXycLAsrYVHUeczKuvz_w/r/favicon.png',source_urls=['https://dentrade.uz/magazin'])
for f in sorted(glob.glob(W+'dtr/*.html')):
    h=open(f,encoding='utf-8',errors='ignore').read(); L=txt(h)
    i=L.index('Рейтинг:'); name=L[i-1]; pr=None
    for j in range(i,i+6):
        if L[j]=='сўм' and re.fullmatch(r'[\d\s]+',L[j-1]): pr=int(re.sub(r'\D','',L[j-1])); break
    try: a=L.index('Преимущества',i)+1; b=L.index('Оставить отзыв',a); body=L[a:b]
    except ValueError: body=[]
    im=re.search(r'<img src="(/thumb/[^"]+/1200r1200/[^"]+)"',h)
    E['dentrade']['items'].append(dict(kind='product',name=name,price=pr,price_text=None,currency='UZS' if pr else None,image_url='https://dentrade.uz'+im[1] if im else None,source_url='https://dentrade.uz/magazin/product/'+os.path.basename(f)[:-5],description=short(' '.join(body)) or None,extra={}))
# ---------- organizers (seminars from TG posts, upcoming only, checked manually on 2026-11-04)
SEM={
 'dk-study':('DK Study','dk_study_stom','DK_study_stom',dict(description='DKStudy – курсы для стоматологов и зубных техников (учебный центр Dentalkorzina).',city='Toshkent',address='ул. Янгибазар, 1, Машиносозлар МФЙ',phone='+998 91 781 76 76; +998 78 555 00 13',website='https://dkstudy.uz/ru'),[
   ('380','To‘g‘ridan-to‘g‘ri kompozit restavratsiya kursi (Anterior & Posterior)','2026-11-28','2026-yil 28–29-noyabr','DK Study (Toshkent sh.)','Sheroz Egamov'),
   ('393','Carestream CS 9600: KLT sir-sinoatlari — Ochiq eshiklar kuni','2026-11-22','22-noyabr','DK Study','Maksim Suxorukov'),
   ('394','Qayta endodontik davolash — 2 kunlik amaliy kurs','2026-12-06','6–7 dekabr, 2026','Toshkent sh., Yashnobod t., Yangibozor ko‘chasi, 1/4','Vyuchnov Ivan Nikolayevich'),
   ('389','«Iskusstvo preparirovaniya» — 2 kunlik intensiv kurs','2026-12-19','19–20 dekabr','DK Study','Nozima Xalmurzayeva')]),
 'dental-academy':('Dental Academy','DentalAcademy_uz','DentalAcademy_uz',dict(description=None,city='Toshkent',address=None,phone='@DentalAcademyUz',website=None),[
   ('702','Bepul kurs «Tishlar anatomiyasi» (har dushanba)','2026-11-09','09.11.2026, har dushanba 15:00 yoki 17:00','Toshkent, Dental Academy',None)]),
 'diamond-dental-education':('Diamond Dental Education','diamond_dental_education','diamond_dental_education',dict(description=None,city='Toshkent',address=None,phone='+998958845555',website=None),[
   ('1583','Domeniko Rikuchchi: «Международный апдейт в современной эндодонтии»','2026-11-20','20–22 ноября 2026','Ташкент','Доменико Рикуччи'),
   ('1547','Максим Копылов: «Кость. Мягкие ткани. Осложнения: Реконструктивная имплантология без иллюзий»','2026-11-28','28–29 ноября 2026','Ташкент','Максим Копылов')]),
 'marva-education':('Marva Education','marva_edu','marva_edu',dict(description=None,city='Toshkent',address=None,phone='+998 99 037 63 00',website=None),[
   ('1761','START 1.0 — 14 ta dars (nazariya + amaliyot)',None,'Sana ko‘rsatilmagan — yangi guruh yig‘ilyapti',None,None)]),
}
for slug,(name,fch,ch,info,posts) in SEM.items():
    files=[W+f'tg_{fch}.html']+([W+'tg_diamond2.html'] if slug.startswith('diamond') else [])
    c,_=parse(files[0]); allp={}
    for f in files:
        for p in parse(f)[1]: allp[p['url'].rsplit('/',1)[1]]=p
    ent(slug,'organizer',name,telegram='https://t.me/'+ch,logo_url=c['avatar'],source_urls=['https://t.me/'+ch],**{**info,'description':info['description'] or c['desc'] or None})
    for pid,title,start,dtext,loc,spk in posts:
        p=allp[pid]
        E[slug]['items'].append(dict(kind='seminar',name=title,price=None,price_text=None,currency=None,image_url=p['img'],source_url=p['url'],description=short(p['text'],700),extra=dict(start_date=start,date_text=dtext,location=loc,speaker=spk),sort_at=start))
# ---------- books
c,ps=tgent('stomatologiya_kitoblar')
ent('stomatologiya-kitoblar','bookseller','Stomatologiya kitoblar',description=c['desc'],city=None,address=None,phone='@STOM_KITOB',website=None,telegram='https://t.me/stomatologiya_kitoblar',logo_url=c['avatar'],source_urls=['https://t.me/stomatologiya_kitoblar'])
for p in ps:
    if not p['img'] or 'ISHGA' in p['text']: continue
    lines=[l for l in p['text'].split('\n') if l.strip() and not l.strip().startswith(('#','@','http'))]
    if not lines: continue
    nm=re.sub(r'^[^\wА-Яа-я«]+','',lines[0]).strip()
    if len(nm)<6: continue
    E['stomatologiya-kitoblar']['items'].append(dict(kind='book',name=nm,price=None,price_text=None,currency=None,image_url=p['img'],source_url=p['url'],description=short(p['text'].replace('https://t.me/TOSHKENT_STOMBAZAR','').strip(),500),extra={}))
ent('meed-books','bookseller','Meed Books',description='Продажа медицинской литературы для студентов, врачей и специалистов.',city='Toshkent',address=None,phone='+998 (90) 091-99-90',website='https://meed-books.uz',telegram=None,logo_url='https://meed-books.uz/apple-icon.png',source_urls=['https://meed-books.uz/ru/product-category/stomatologiya/'])
for f in sorted(glob.glob(W+'mb/p*.html'),key=lambda x:int(re.search(r'p(\d+)',os.path.basename(x))[1])):
    h=open(f,encoding='utf-8',errors='ignore').read(); L=txt(h); pr=None
    for l in L:
        m=re.fullmatch(r'([\d\s]+)\sUZS',l)
        if m: pr=int(re.sub(r'\D','',m[1])); break
    E['meed-books']['items'].append(dict(kind='book',name=meta(h,'og:title'),price=pr,price_text=None,currency='UZS' if pr else None,image_url=meta(h,'og:image'),source_url=open(f[:-5]+'.url').read().strip(),description=meta(h,'og:description'),extra={}))
ent('medis-book','bookseller','Medis Book',description='Канал предоставляет будущим врачам литературу для всех мед ВУЗов. Книги премиального качества, своевременная и надежная доставка.',city='Toshkent',address='Ташкент, Чиланзарский район',phone='+998 88 800 15 15; +998 97 462 99 77',website='https://id34167.gl.uz/about-company/',telegram=None,logo_url='https://files.glotr.uz/company/000/035/164/logo/2023-09-14-16-22-52-369219-3ce847a531d3f1ce23526e3f0811ed8c.webp',source_urls=['https://id34167.gl.uz/categories/'])
for f in sorted(glob.glob(W+'md/p*.html')):
    h=open(f,encoding='utf-8',errors='ignore').read(); L=txt(h); pr=None
    for j,l in enumerate(L):
        if l.startswith('сум') and re.fullmatch(r'[\d\s]+',L[j-1]): pr=int(re.sub(r'\D','',L[j-1])); break
    E['medis-book']['items'].append(dict(kind='book',name=re.sub(r'^(Book|Книга): ','',meta(h,'og:title')),price=pr,price_text=None,currency='UZS' if pr else None,image_url=meta(h,'og:image'),source_url=open(f[:-5]+'.url').read().strip(),description=meta(h,'og:description'),extra={}))
for slug,ch,name in [('stom-books','stom_kutubxona','Stom Books'),('med-book','med_bookk','MED BOOK')]:
    c,_=tgent(ch); ent(slug,'bookseller',name,description=c['desc'],city=None,address=None,phone=('+998931234578' if slug=='med-book' else '@Stomatolog_Abdulloh'),website=None,telegram='https://t.me/'+ch,logo_url=c['avatar'],source_urls=['https://t.me/'+ch])
# ---------- download + save
for slug,s in E.items():
    s['logo_local']=dl(s['logo_url'],f'img/{slug}/logo{ext(s["logo_url"] or "")}')
    for n,it in enumerate(s['items']):
        it['image_local']=dl(it['image_url'],f'img/{slug}/{n+1}{ext(it["image_url"] or "")}') if it['image_url'] else None
    json.dump(s,open(f'{slug}.json','w'),ensure_ascii=False,indent=1)
    it=s['items']; print(slug,s['kind'],len(it),'priced',sum(1 for i in it if i['price'] is not None),'img',sum(1 for i in it if i['image_local']),'logo',bool(s['logo_local']),flush=True)
