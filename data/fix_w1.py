import json,os,subprocess,sys
sys.path.insert(0,'.'); from tgparse import parse
def dl(u,fn):
    if not os.path.exists(fn) or os.path.getsize(fn)<500: subprocess.run(['curl','-sL','-m','150','--retry','3','-o',fn,u])
    return fn if os.path.exists(fn) and os.path.getsize(fn)>500 else None
for slug,ch in [('pro-dental-tech','pro_dental_shop'),('dentalkorzina','dentalkorzina_uz')]:
    s=json.load(open(slug+'.json')); c,_=parse(f'raw/w2/tg_{ch}.html'); os.makedirs('img/'+slug,exist_ok=True)
    s['logo_url']=c['avatar']; s['logo_local']=dl(c['avatar'],f'img/{slug}/logo.jpg'); json.dump(s,open(slug+'.json','w'),ensure_ascii=False,indent=1); print(slug,s['logo_local'],flush=True)
s=json.load(open('dentashop.json'))
s['logo_local']=dl(s['logo_url'],'img/dentashop/logo.png'); print('ds logo',s['logo_local'],flush=True)
for n,it in enumerate(s['items']):
    if not it.get('image_local') and it.get('image_url'):
        ext=os.path.splitext(it['image_url'].split('?')[0])[1][:5] or '.jpg'
        it['image_local']=dl(it['image_url'],f'img/dentashop/{n+1}{ext}'); print(n+1,it['image_local'],flush=True)
        json.dump(s,open('dentashop.json','w'),ensure_ascii=False,indent=1)
json.dump(s,open('dentashop.json','w'),ensure_ascii=False,indent=1); print('DONE')
