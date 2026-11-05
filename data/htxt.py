import re,html,sys
h=open(sys.argv[1],encoding='utf-8',errors='ignore').read()
h=re.sub(r'(?s)<(script|style|svg)[^>]*>.*?</\1>','',h)
t=html.unescape(re.sub(r'<[^>]+>','\n',h)); t=re.sub(r'\n\s*\n+','\n',t)
print(t[:int(sys.argv[2]) if len(sys.argv)>2 else 4000])
