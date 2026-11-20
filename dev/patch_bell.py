# กระดิ่ง: กดเปิดแล้วตัวเลขหายไป (นับเฉพาะข้อความใหม่หลังเปิดครั้งล่าสุด)
# จุดเขียว "ยังไม่อ่าน" ในรายการยังอยู่จนกว่าจะกดอ่านข้อความนั้น
# เวลาที่เปิดกระดิ่งล่าสุดเก็บในเครื่อง (localStorage) แยกต่อผู้ใช้
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)

rep("function unread(){if(me.notify===false)return 0;return visibleNotes().filter(function(n){return n.read.indexOf(me.id)<0;}).length;}",
"""function bellSeen(){try{return Number(localStorage.getItem('wc-seen-'+me.id))||0;}catch(e){return 0;}}
function markBellSeen(){var mx=0;visibleNotes().forEach(function(n){if(n.ts>mx)mx=n.ts;});if(mx>bellSeen()){try{localStorage.setItem('wc-seen-'+me.id,String(mx));}catch(e){}}}
function unread(){if(me.notify===false)return 0;var seen=bellSeen();return visibleNotes().filter(function(n){return n.read.indexOf(me.id)<0&&n.ts>seen;}).length;}""")
rep("    case 'bell':bellOpen=!bellOpen;renderChrome();break;",
    "    case 'bell':bellOpen=!bellOpen;if(bellOpen)markBellSeen();renderChrome();break;")
open(S+'app_src.html','w',encoding='utf-8').write(s);print('bell patch ok')
