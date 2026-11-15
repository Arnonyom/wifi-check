import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import re
s=open('app_src.html',encoding='utf-8').read()
P=lambda n:open('prod/'+n,encoding='utf-8').read()
def between(s,a,b,new):
    i=s.index(a); j=s.index(b,i+len(a)); return s[:i]+new+s[j:]
def rep(s,a,b):
    assert a in s,a[:60]; return s.replace(a,b,1)

# data layer / notify
s=rep(s,'var state=load();','var state=emptyState();')
s=between(s,'function seed(){','function ST(){',P('p_data.js'))
s=between(s,'function notify(to,title,body,kind){','function visibleNotes()',P('p_notify.js'))
# login
s=between(s,'function renderLogin(){','/* ---------- views ---------- */',P('p_login2.js'))
s=between(s,'function confirmModal(){','/* staff history */',P('p_modal.js'))
s=between(s,'function saveSlot(){','/* people (admin) */',P('p_slot.js'))
s=between(s,'function saveEmp(){','/* report (admin) */',P('p_emp.js'))
s=between(s,'function applyCsv(){','function viewSettings(){',P('p_csv.js'))
s=between(s,'function submitLeave(){','function suggestCover(',P('p_leave2.js'))
s=between(s,'function approveLeave(id){','/* ---------- date picker ---------- */',P('p_leave3.js'))
# demo bar off
s=between(s,'  dv.simD=t.date;','}\nfunction renderAll()',"  demo.innerHTML='';\n")
# settings: remove reset card
i=s.index("+\n    '<section class=\"card row between\"><div><h3>ข้อมูลตัวอย่างของต้นแบบ")
j=s.index("</section></div>';",i)
s=s[:i]+"+'</div>';"+s[j+len("</section></div>';"):]
s=rep(s,"รีเซ็ตข้อมูลตัวอย่าง","รีเซ็ตข้อมูลตัวอย่าง") if False else s
# emp form: username read-only when editing
s=rep(s,'<input id="fUser" autocapitalize="none" value="\'+esc(c.username)+\'">','<input id="fUser" autocapitalize="none" value="\'+esc(c.username)+\'"\'+(isNew?\'\':\' disabled\')+\'>')
# events
s=rep(s,"    case 'logout':me=null;view='home';modal=null;bellOpen=false;dp=null;renderAll();break;","    case 'logout':doLogout();break;")
s=between(s,"    case 'bell-notify':","    case 'tab':",open('prod/ev_bell.js',encoding='utf-8').read())
s=between(s,"    case 'read':","    case 'save-rules':",open('prod/ev_read.js',encoding='utf-8').read())
s=between(s,"    case 'save-rules':","    case 'xl-rep':",open('prod/ev_rules.js',encoding='utf-8').read())
s=between(s,"    case 'reset':","    case 'calnav':","")
s=between(s,"    case 'lv-cancel':","    case 'lvf':",open('prod/ev_lvcancel.js',encoding='utf-8').read())
s=between(s,"    case 'lv-reject-yes':","    case 'dp':",open('prod/ev_lvrej.js',encoding='utf-8').read())
# boot
tail="renderAll();\n})();\n</script>"
assert s.rstrip().endswith(tail)
s=s.rstrip()[:-len(tail)]+open('prod/boot.js',encoding='utf-8').read()
# page shell
head='''<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link rel="manifest" href="manifest.json?v=2">
<link rel="icon" href="favicon.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png?v=2">
<style>html{color-scheme:light}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}img{max-width:100%}</style>
'''
s=s.replace('<meta name="claude:viewport-fit-sides" content="cover">\n','',1)
s=s.replace('</style>\n\n<div class="shell"','</style>\n</head>\n<body>\n<div class="shell"',1)
assert '<body>' in s
s=s.replace('<script>\n(function(){','<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>\n<script src="config.js"></script>\n<script>\n(function(){',1)
s=head+s.rstrip()+'\n</body>\n</html>\n'
open('index.html','w',encoding='utf-8').write(s)
m=re.findall(r'<script>(.*?)</script>',s,re.S)

print(len(s))
