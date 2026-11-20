# หน้าลงเวลาของพนักงาน
# 1) เอา "ประวัติล่าสุด" ออก (ซ้ำกับแท็บประวัติ)
# 2) ปุ่มเข้างาน/ออกงานใหญ่ขึ้น ปรับขนาดตามความสูงจอให้การ์ดพอดีจอ ไม่ต้องเลื่อน
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)

# 1) ไม่มีประวัติล่าสุด
i=s.index("function viewHome(){");j=s.index("\n}\n",i)+3
s=s[:i]+"function viewHome(){\n  return '<div class=\"grid2\">'+checkCardHtml()+'<div class=\"stack\">'+upcomingHtml()+'</div></div>';\n}\n"+s[j:]

# 2) ขนาดปุ่ม: ใช้ตัวแปร --rw (ค่าเริ่มต้นตามความกว้างจอ) แล้ว fitRing() หดให้พอดีความสูงจอ
rep(".ring{--p:0;width:min(250px,68vw);",".ring{--p:0;--rw:min(340px,84vw);width:var(--rw);")
rep(".ring button span{font-size:30px;font-weight:700}",".ring button span{font-size:clamp(28px,calc(var(--rw)*.13),44px);font-weight:700}")
rep(".ring button small{font-size:14px;opacity:.85}",".ring button small{font-size:clamp(14px,calc(var(--rw)*.055),19px);opacity:.85}")
rep("  $('main').innerHTML=(fns[view]||viewHome)();\n","  $('main').innerHTML=(fns[view]||viewHome)();\n  if(view==='home')fitRing();\n")
rep("function viewHome(){",
"""/* ปุ่มลงเวลาใหญ่ที่สุดเท่าที่การ์ดยังพอดีจอ (ไม่ต้องเลื่อน) */
function fitRing(){
  var ring=document.querySelector('#main .ring'),card=ring&&ring.closest('.card');if(!ring||!card)return;
  ring.style.removeProperty('--rw');
  var nav=$('nav'),nr=nav&&!nav.hidden?nav.getBoundingClientRect():null;
  var bottom=nr&&nr.top>innerHeight/2?nr.top:innerHeight;
  var cr=card.getBoundingClientRect(),rw=ring.getBoundingClientRect().width;
  var top=cr.top+(window.scrollY||0);
  var other=cr.height-rw,room=bottom-top-other-12;
  var want=Math.max(180,Math.min(rw,room));
  if(want<rw)ring.style.setProperty('--rw',Math.floor(want)+'px');
}
function viewHome(){""")
rep("if(me&&(view==='today'||view==='report')&&!dp&&!modal){renderView();renderDet();}",
    "if(me&&(view==='today'||view==='report')&&!dp&&!modal){renderView();renderDet();}else if(me&&view==='home')fitRing();")
open(S+'app_src.html','w',encoding='utf-8').write(s);print('home patch ok')
