# 1) ขีดจับ (แบบ iPhone) บนทุกหน้าต่างที่ปัดลงปิดได้: อยู่บนสุดเสมอ ไม่โดนหัวข้อบัง สีเข้มพอมองเห็น
# 2) ลงเวลาแทน: เปิดจากตาราง/รายละเอียดแล้วเลื่อนไปที่ส่วนลงเวลาแทนก่อน (วันนี้หรือย้อนหลัง) + สไตล์ใหม่
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)

FIRST="document.querySelector('#main #attEd,#main #slotEd')"
rep("case 'edit-slot':editSlot={d:D.d,s:D.s};renderView();var ed=$('slotEd');",
    "case 'edit-slot':editSlot={d:D.d,s:D.s};renderView();var ed="+FIRST+";")
rep("setTimeout(function(){var ed=$('slotEd');if(ed&&ed.scrollIntoView)ed.scrollIntoView({block:'start',behavior:'smooth'});},50);break;",
    "setTimeout(function(){var ed="+FIRST+";if(ed&&ed.scrollIntoView)ed.scrollIntoView({block:'start',behavior:'smooth'});},50);break;")

# ขีดจับ: แทนของเดิม (อยู่ในโฟลว์ จึงโดนหัวข้อแบบ sticky บัง และสีอ่อนเกิน)
rep("@media (max-width:720px){.overlay .modal::before{content:'';display:block;flex:none;width:42px;height:5px;border-radius:3px;background:var(--line);margin:-8px auto 0}}",
    "@media (max-width:720px){.overlay .modal{position:relative;padding-top:26px}.overlay .modal::before{content:'';position:absolute;top:9px;left:50%;transform:translateX(-50%);width:40px;height:5px;border-radius:3px;background:var(--muted);opacity:.45;z-index:5;pointer-events:none}.overlay .modal .dhd{top:-26px;margin-top:-26px;padding-top:26px}}")
css="""
/* ลงเวลาแทน */
#attEd .attcur span{min-width:120px}
#attEd .attmode{display:grid;grid-template-columns:repeat(3,1fr);width:100%}#attEd .attmode button{white-space:nowrap;padding-inline:6px}
#attEd .attmode button[disabled]{opacity:.45}
#attEd .attrow{gap:8px;flex-wrap:wrap;align-items:center}
#attEd .attrow input[type=time]{font-size:22px;font-family:var(--font-display);width:9.5em;min-height:48px;text-align:center}
#attEd .attprev{padding:10px 12px;border-radius:12px;background:var(--surface-2);border:1px solid var(--line)}
"""
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('att patch ok')
