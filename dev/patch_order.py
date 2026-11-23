# ลากการ์ดในหน้าพนักงานเพื่อจัดลำดับ (ในกลุ่มเดียวกัน) · เก็บลำดับในฐานข้อมูล profiles.sort_order
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)

GRIP='<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor"><circle cx="5.5" cy="3" r="1.5"/><circle cx="10.5" cy="3" r="1.5"/><circle cx="5.5" cy="8" r="1.5"/><circle cx="10.5" cy="8" r="1.5"/><circle cx="5.5" cy="13" r="1.5"/><circle cx="10.5" cy="13" r="1.5"/></svg>'
# การ์ด: ใส่ id + ขีดจับ
rep("return '<article class=\"card pcard\"><div><b>'+esc(e.name)+'</b><br><span class=\"muted small\">'+esc(e.username)+'</span></div>",
    "return '<article class=\"card pcard\" data-eid=\"'+e.id+'\"><div class=\"pchd\"><div><b>'+esc(e.name)+'</b><br><span class=\"muted small\">'+esc(e.username)+'</span></div>"
    "<button type=\"button\" class=\"dragh\" data-drag title=\"ลากเพื่อย้ายตำแหน่ง\" aria-label=\"ย้ายตำแหน่ง '+esc(e.name)+' (ลาก หรือกดลูกศร)\">"+GRIP+"</button></div>")
# เรียงตามลำดับที่จัดไว้
rep("(list.length?'<div class=\"pgrid\">'+list.map(pcard).join('')+'</div>'",
    "(list.length?'<div class=\"pgrid\" data-grp=\"'+g[0]+'\">'+byOrder(list).map(pcard).join('')+'</div>'")
rep("ผู้ใช้ต้องตั้งรหัสใหม่เองเมื่อล็อกอินครั้งแรก</p>",
    "ผู้ใช้ต้องตั้งรหัสใหม่เองเมื่อล็อกอินครั้งแรก</p><p class=\"muted small\" style=\"margin-top:4px\">ลากที่ปุ่มจุด ⠿ มุมการ์ดเพื่อสลับตำแหน่ง (ย้ายได้ในกลุ่มเดียวกัน)</p>")
# โค้ดลาก
rep("function viewPeople(){",open(S+'prod/p_order.js',encoding='utf-8').read()+"function viewPeople(){")
css="""
/* จัดลำดับการ์ดพนักงาน */
.pchd{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.dragh{flex:none;width:36px;height:36px;margin:-8px -8px 0 0;display:grid;place-items:center;border:0;border-radius:10px;background:transparent;color:var(--muted);cursor:grab;touch-action:none;-webkit-user-select:none;user-select:none}
.dragh:hover{background:var(--surface-2);color:var(--ink)}
.dragh:focus-visible{outline:2px solid var(--brand);outline-offset:1px}
.pgrid>.pcard:only-child .dragh{display:none}
.pcard.dragging{position:fixed;z-index:60;margin:0;pointer-events:none;box-shadow:0 14px 34px rgba(0,0,0,.35);transform:rotate(1.5deg);opacity:.96}
.pcard-ph{border:2px dashed var(--brand);border-radius:14px;background:var(--brand-soft);opacity:.5}
body.pdragging,body.pdragging *{cursor:grabbing!important;-webkit-user-select:none;user-select:none}
@media (max-width:720px){.dragh{width:44px;height:44px;margin:-12px -12px 0 0}}
"""
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('order patch ok')
