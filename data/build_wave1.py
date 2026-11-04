import json,re,html,os,subprocess,hashlib
R='raw/'
def tgavatar(f):
    s=open(R+f).read(); m=re.search(r'<i class="tgme_page_photo_image[^"]*"><img src="([^"]+)"',s); return m.group(1) if m else None
dk=json.load(open(R+'dk_posts.json')); P={p['post'].rsplit('/',1)[1]:p for p in dk}
def dkp(pid,name,desc,i=0):
    p=P[str(pid)]; return dict(name=name,price=None,price_text=None,currency=None,image_url=(p['images'][i] if p['images'] else None),source_url=p['post'],description=desc)
shops={
 'pro-dental-tech':dict(kind='shop',name='PRO DENTAL TECH',city='Toshkent',address="Yunusobod 17-kvartal (M Cosmetics yonida)",phone='+998 94 688 56 06; +998 99 993 51 06',website=None,telegram='https://t.me/pro_dental_shop',
   description="Stomatologik materiallar va uskunalar. HAGER kreslolari rasmiy dileri (2 yil kafolat). Toshkent bo'ylab yetkazish bepul.",logo_url=tgavatar('tg_pro_dental_shop.html'),source_urls=['https://t.me/s/pro_dental_shop'],items=[]),
 'dentalkorzina':dict(kind='shop',name='Dentalkorzina',city='Toshkent',address="Toshkent sh., Yashnobod t., Yangibozor ko'chasi, 1",phone='+998 90 830-76-76; +998 91 781-76-76; +998 91 785-01-60',website='https://dentalkorzina.com',telegram='https://t.me/dentalkorzina_uz',
   description="Dentalkorzina — sifatli va ishonchli tibbiy uskunalar. WOSON, Carestream, Ivoclar, FGM, BEGO, MEDESY mahsulotlari.",logo_url=tgavatar('tg_dentalkorzina_uz.html'),source_urls=['https://t.me/s/dentalkorzina_uz'],items=[
   dkp(821,'Carestream CS 9600',"5 tasi 1 da diagnostika majmuasi: Panorama, 3D KAKT (16×17), Sefalometriya, 3D yuz skani va CS MAR texnologiyasi. Endodontiya uchun 75 mkm gacha aniqlik."),
   dkp(810,'WOSON stomatologik qurilmalari (WOVO, WOZO 2.0, WODO, WODO Junior)',"To'liq komplektatsiya: nakonechniklar, skeyler, lampa, Full HD kamera, shifokor va assistent stullari. FARO (Italiya) premium soyasiz chiroqlari."),
   dkp(810,'WOSON B sinf avtoklavlari (Tancy Touch 2L — Tanvo 45L)',"3 bosqichli predvakuum va vakuumli quritish. 2L (Tancy Touch) dan 45L (Tanvo) gacha.",1),
   dkp(795,'BEGO 3D-bosma qatronlari (doimiy koronkalar uchun)',"Biomoslashuvchan; bukilishga chidamliligi 116 MPa; qatlam qalinligi 50 mkm; xizmat muddati 7 yilgacha. Turli xil ranglar mavjud."),
   dkp(790,'FGM Vitra APS kompoziti',"Qulay va rangni aniq tanlash imkonini beruvchi kompozit."),
   dkp(790,'FGM Vitra Unique kompoziti',"\"Xameleon effekti\": bitta universal rang tishga moslashadi."),
   dkp(773,'G-WHITE WHITE.FORM modellashtirish smolasi, 10 ml',"Har qanday kompozit asbobga yopishishini to'xtatadi. Tiniq — restavratsiya rangiga ta'sir qilmaydi. Tomchili dozatorli 10 ml flakon."),
   dkp(774,'Ivoclar Vivadent IPS e.max Ceram materiallari (Dentin, Incisal, Glaze Powder, Glaze FLUO)',"Laboratoriya uchun: rang chuqurligi va aniq anatomiya, emalning tabiiy shaffofligi, glyanets va flyuoressensiya."),
   dkp(774,'Ivoclar IPS Alox Plunger Separator',"Plunjerni himoya qilish va oson ochish uchun.",1),
   dkp(786,'MEDESY stomatologik asboblari (Italiya)',"Jarrohlik, terapevtik stomatologiya, parodontologiya, ortodontiya uchun italyan asboblari."),
   dkp(760,'DK Study 3D-modellari (restavratsiya mashqlari uchun)',"Yakka tishlar, 2 va 3 tishdan iborat to'plamlar, frontal va yon tishlar segmentlari."),
   dkp(781,'EsCom 100 System Kit (A1, A2, A3, A3.5, B2)',"Yangi kelgan materiallar ro'yxatidan. Narx uchun shaxsiy xabar orqali murojaat qilinadi."),
   dkp(781,'EsCom 250 System Kit (A1, A2, A3, A3.5, B2)',"Yangi kelgan materiallar ro'yxatidan. Narx uchun shaxsiy xabar orqali murojaat qilinadi."),
   dkp(781,'EsFlow (A1, A2, A3)',"Yangi kelgan materiallar ro'yxatidan. Narx uchun shaxsiy xabar orqali murojaat qilinadi."),
   dkp(781,'Core.it Dual (Yellow, White)',"Yangi kelgan materiallar ro'yxatidan. Narx uchun shaxsiy xabar orqali murojaat qilinadi."),
   dkp(787,'MTA material (vismutsiz)',"Vismutsiz zamonaviy MTA material: tish rangi o'zgarishi xavfini kamaytiradi. Rasmiy diler."),
 ]),
 'dental-trading':dict(kind='shop',name='Dental Trading',city='Toshkent',address='Toshkent sh., Qorasaroy ko‘chasi, 270',phone='+998 77 282 08 00',website='https://dentaltrading.uz',telegram='https://t.me/DentalTradingshop',
   description="Stomatologik uskunalar va sarf materiallari: JINME, Lifedent, Voldent, Perfect Dental. Bepul yetkazib berish.",logo_url='https://dentaltrading.uz/images/logo/dental-trading-logo.svg',source_urls=['https://dentaltrading.uz/ru/catalog','https://t.me/s/DentalTradingshop'],items=[]),
 'dentashop':dict(kind='shop',name='Dentashop (Max Denta Tech)',city='Toshkent',address="Toshkent, Chilonzor, Naqqoshlik 16A",phone='+998 33 344-48-90; +998 33 137-77-54',website='https://dentashop.uz',telegram=None,
   description="«Max Denta Tech» — stomatologik va tish texnikasi uskunalari hamda sarf materiallari yetkazib beruvchi.",logo_url='https://dentashop.uz/wp-content/themes/vegan/favicons/apple-touch-icon.png',source_urls=['https://dentashop.uz/'],items=[]),
}
for it in json.load(open(R+'dt_items.json')):
    shops['dental-trading']['items'].append(dict(name=it['name'],price=None,price_text=it['price_text'],currency='USD' if it['price_text'] else None,image_url=it['image_url'],source_url=it['source_url'],description=it['description'],extra={'brand':it['brand'],'availability':it['availability']}))
for it in json.load(open(R+'ds_items.json')):
    it['currency']='UZS' if it['price'] else None; shops['dentashop']['items'].append(it)
os.makedirs('img',exist_ok=True)
def dl(url,slug,i):
    if not url: return None
    ext=os.path.splitext(url.split('?')[0])[1][:5] or '.jpg'
    fn=f'img/{slug}/{i}{ext}'; os.makedirs(os.path.dirname(fn),exist_ok=True)
    if not os.path.exists(fn) or os.path.getsize(fn)==0:
        subprocess.run(['curl','-sL','-m','90','-o',fn,url])
    return fn if os.path.exists(fn) and os.path.getsize(fn)>500 else None
for slug,s in shops.items():
    s['slug']=slug; s['logo_local']=dl(s['logo_url'],slug,'logo')
    for n,it in enumerate(s['items'][:20]):
        it.setdefault('extra',{}); it['image_local']=dl(it['image_url'],slug,n+1)
    s['items']=s['items'][:20]
    json.dump(s,open(f'{slug}.json','w'),ensure_ascii=False,indent=1)
    print(slug,len(s['items']),'priced',sum(1 for i in s['items'] if i['price'] is not None or i.get('price_text')),'imgs',sum(1 for i in s['items'] if i['image_local']),'logo',bool(s['logo_local']))
