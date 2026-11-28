# รูปโปรไฟล์ + แก้ชื่อเอง + สวิตช์สิทธิ์ของพนักงาน (28 พ.ย. 2569) · prod/p_avatar.js
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)
rep("function viewPeople(){",open(S+'prod/p_avatar.js',encoding='utf-8').read()+"function viewPeople(){")
# โปรไฟล์: รูป + แก้ชื่อ + ปุ่มเปลี่ยนรูป
rep("'<section class=\"card stack\"><div class=\"phd\"><span class=\"pav\" aria-hidden=\"true\">'+ini+'</span><div class=\"grow\"><h2>'+esc(e.name)+'</h2><p class=\"muted\">'+esc(e.username)+'</p></div></div>'+",
    "'<section class=\"card stack\"><div class=\"phd\">'+avHtml(e)+'<div class=\"grow\">'+nameHtml(e)+'<p class=\"muted\">'+esc(e.username)+'</p>'+(nameEd===null&&canEditName()?'<button class=\"lnk small\" data-act=\"name-edit\">แก้ชื่อ</button>':'')+'</div></div>'+avButtons(e)+")
rep("<span class=\"pav sm\" aria-hidden=\"true\">'+esc((x.name||'?').trim().charAt(0).toUpperCase())+'</span>","'+avHtml(x,'sm')+'")
rep("    (isAdm?'<button class=\"card admtool\"","    permCard()+\n    (isAdm?'<button class=\"card admtool\"")
# หน้าพนักงาน: รูป + ปุ่มเปลี่ยนรูป
rep("<span class=\"pav sm\" aria-hidden=\"true\">'+esc((e.name||'?').trim().charAt(0).toUpperCase())+'</span>","'+avHtml(e,'sm')+'")
rep(":'<button class=\"btn sec sm\" data-act=\"edit-emp\" data-id=\"'+e.id+'\">แก้ไข</button>'+",
    ":'<button class=\"btn sec sm\" data-act=\"edit-emp\" data-id=\"'+e.id+'\">แก้ไข</button><button class=\"btn sec sm\" data-act=\"av-pick\" data-id=\"'+e.id+'\">'+(e.avatar?'เปลี่ยนรูป':'ใส่รูป')+'</button>'+(e.avatar?'<button class=\"btn sec sm\" data-act=\"av-del\" data-id=\"'+e.id+'\">ลบรูป</button>':'')+")
css="""
/* รูปโปรไฟล์ */
.pav.img{background:var(--surface-2);overflow:hidden;padding:0}
.pav img{width:100%;height:100%;object-fit:cover;display:block;border-radius:50%}
.avbtns .btn{display:inline-flex;align-items:center;gap:6px}.avbtns svg{width:16px;height:16px}
.lnk{all:unset;cursor:pointer;color:var(--brand-strong);text-decoration:underline;margin-top:2px;display:inline-block}
.lnk:focus-visible{outline:2px solid var(--brand);outline-offset:2px;border-radius:4px}
.nameed{display:flex;flex-direction:column;gap:6px}
.permsw{padding:10px 6px}.permsw b{font-size:15px}
"""
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('avatar patch ok')
