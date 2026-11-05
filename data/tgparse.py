import re,html,json,sys
def clean(s): return html.unescape(re.sub(r'<br\s*/?>','\n',re.sub(r'<(?!br)[^>]+>','',s))).strip()
def parse(fn):
    h=open(fn,encoding='utf-8',errors='ignore').read()
    m=lambda p:(re.search(p,h,re.S) or [None,None])[1]
    ch=dict(title=html.unescape(m(r'og:title" content="([^"]*)') or ''),desc=html.unescape(m(r'og:description" content="([^"]*)') or ''),avatar=m(r'og:image" content="([^"]*)'))
    posts=[]
    for blk in h.split('tgme_widget_message_wrap')[1:]:
        url=re.search(r'data-post="([^"]+)"',blk); t=re.search(r'tgme_widget_message_text[^>]*>(.*?)</div>',blk,re.S)
        d=re.search(r'datetime="([^"]+)"',blk); img=re.search(r"tgme_widget_message_photo_wrap[^>]*background-image:url\('([^']+)'",blk)
        posts.append(dict(url='https://t.me/'+url[1] if url else None,date=d[1] if d else None,img=img[1] if img else None,text=clean(t[1]) if t else ''))
    return ch,posts
if __name__=='__main__':
    ch,p=parse(sys.argv[1]); print(json.dumps(ch,ensure_ascii=False))
    for x in p: print('---',x['url'],x['date'],'IMG' if x['img'] else '-'); print(x['text'][:int(sys.argv[2]) if len(sys.argv)>2 else 500])
