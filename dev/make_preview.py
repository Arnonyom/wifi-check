import re,sys
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
m=open(S+'mock_preview.js',encoding='utf-8').read()
h=open(S+'index.html',encoding='utf-8').read()
h=h.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>\n<script src="config.js"></script>','<script>\n'+m+'\nwindow.APP_CONFIG={SUPABASE_URL:"x",SUPABASE_KEY:"x",USER_DOMAIN:"wifi-check.app"};\n</script>',1)
assert 'mockdb' in h
banner='<div style="background:#FFF4CC;color:#5C4400;padding:8px 16px;font:14px system-ui;text-align:center;line-height:1.6">ตัวอย่างสำหรับอนุมัติ · ข้อมูลจำลอง ไม่เชื่อมฐานข้อมูลจริง<br>ลองล็อกอิน: <b>admin</b> / <b>Admin@2026</b> (ผู้ดูแล) · <b>somchai</b> / <b>Temp1234!</b> (บัญชีรหัสชั่วคราว จะถูกให้ตั้งรหัสใหม่) · พนักงานอื่น เช่น <b>malee</b> / <b>Temp1234!</b></div>\n'
open(S+'preview_detail.html','w',encoding='utf-8').write(h.replace('<body>\n','<body>\n'+banner,1))
# artifact version: no doc skeleton, no relative asset links
a=h
a=re.sub(r'<!doctype html>\s*<html[^>]*>\s*<head>\s*','',a,flags=re.I)
a=re.sub(r'<meta charset[^>]*>\s*<meta name="viewport"[^>]*>\s*','',a)
a=re.sub(r'<link rel="(manifest|icon|apple-touch-icon)"[^>]*>\s*','',a)
a=a.replace('</head>\n<body>\n','\n'+banner,1).replace('</body>\n</html>\n','')
a='<title>WiFi-Check Preview</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'+a
open(S+'preview_artifact.html','w',encoding='utf-8').write(a)
hk=h.replace('(async function boot(){','window.__t={toast:toast,st:function(){return state;}};\n(async function boot(){',1)
open(S+'preview_hook.html','w',encoding='utf-8').write(hk.replace('<body>\n','<body>\n'+banner,1))  # test-only
print('ok')
