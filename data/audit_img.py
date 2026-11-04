import json,re,sys,hashlib,html,os,urllib.request,urllib.parse,time
UA={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36'}
def get(u,t=40):
    for k in range(3):
        try: return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=t).read()
        except Exception as e: err=e; time.sleep(2)
    raise err
def getpage(u):
    r=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=25);b=b''
    while True:
        try: c=r.read1(16384)
        except Exception: break
        if not c: break
        b+=c
        if b'og:image' in b and b.count(b'\n',b.find(b'og:image'))>3: break
    return b
def base(u): return re.sub(r'-\d+x\d+(?=\.\w+$)','',urllib.parse.unquote(u.split('?')[0]).rsplit('/',1)[-1]).lower()
def page_img(h):
    for p in [r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)',r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image',
              r'woocommerce-product-gallery__image[^>]*>\s*<a href="([^"]+)"',r'<img[^>]+class="[^"]*wp-post-image[^"]*"[^>]+src="([^"]+)"']:
        m=re.search(p,h)
        if m: return html.unescape(m.group(1))
rep={}
for s in sys.argv[1:]:
    f=s+'.json';d=json.load(open(f));bad=0;fixed=0;miss=[]
    for i,it in enumerate(d['items']):
        try: h=getpage(it['source_url']).decode('utf8','ignore')
        except Exception as e: miss.append((i,'page '+str(e)[:40]));continue
        pi=page_img(h)
        if not pi: miss.append((i,'no og'));continue
        pi=urllib.parse.urljoin(it['source_url'],pi)
        oldu=it.get('image_url') or '';old=it.get('image_local'); oldh=hashlib.md5(open(old,'rb').read()).hexdigest() if old and os.path.exists(old) else None
        try: b=get(pi)
        except Exception as e: miss.append((i,'img '+str(e)[:40]));continue
        newh=hashlib.md5(b).hexdigest()
        ok = base(pi)==base(oldu) and oldh==newh
        if not ok:
            bad+=1
        slug=urllib.parse.unquote(it['source_url'].rstrip('/').rsplit('/',1)[-1])
        slug=re.sub(r'[^\w-]+','-',slug,flags=re.A)[:50].strip('-') or 'p'
        ext=os.path.splitext(base(pi))[1] or '.jpg'
        nl=f'img/{s}/p{i+1:02d}-{slug}{ext}'
        if old and os.path.exists(old) and old!=nl: os.remove(old)
        open(nl,'wb').write(b); it['image_local']=nl; it['image_url']=pi
        if not ok: fixed+=1; print(s,i+1,'MISMATCH old',base(oldu),'samefile' if oldh==newh else 'difffile','->',base(pi),flush=True)
    json.dump(d,open(f,'w'),ensure_ascii=False,indent=1)
    rep[s]=dict(n=len(d['items']),mismatch=bad,fixed=fixed,unverified=miss); print(s,rep[s],flush=True)
json.dump(rep,open('/tmp/audit.json','w'))
