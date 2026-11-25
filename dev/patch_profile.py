# เมนูโปรไฟล์: ปุ่มรูปคนมุมขวาบน (แทนปุ่มกุญแจเปลี่ยนรหัส) → หน้าโปรไฟล์ (ข้อมูลของฉัน สมาชิกในทีม เปลี่ยนรหัสผ่าน ภาษา)
# แท็บ "ตั้งค่า" ของผู้ดูแลย้ายเข้าไปในโปรไฟล์ · ปุ่มเปลี่ยนภาษาอยู่บนแถบด้านบนหลังล็อกอินด้วย
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)

PERSON='<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'
# แถบด้านบน: + ปุ่มภาษา · ชื่อกดได้ · ปุ่มกุญแจ → ปุ่มโปรไฟล์
rep("  top.innerHTML=brandHtml()+'<div class=\"top-right\">'+themeBtn()+\n",
    "  top.innerHTML=brandHtml()+'<div class=\"top-right\">'+langBtn()+themeBtn()+\n")
rep("'<div class=\"user\"><div class=\"uname\"><b>'+esc(me.name)+'</b><span>'+esc(teamLabel(me))+'</span></div>'+",
    "'<div class=\"user\">'+(me.mustChange?'<div class=\"uname\">':'<button class=\"uname ubtn\" data-act=\"profile\" title=\"โปรไฟล์\">')+'<b>'+esc(me.name)+'</b><span>'+esc(teamLabel(me))+'</span>'+(me.mustChange?'</div>':'</button>')+")
rep("(me.mustChange?'':'<button class=\"iconbtn\" data-act=\"pw-self\" aria-label=\"เปลี่ยนรหัสผ่าน\" title=\"เปลี่ยนรหัสผ่าน\">'+ico('<circle cx=\"8\" cy=\"15\" r=\"4\"/><path d=\"M10.8 12.2 20 3M17 6l3 3M14.5 8.5l2.5 2.5\"/>')+'</button>')",
    "(me.mustChange?'':'<button class=\"iconbtn\" data-act=\"profile\" aria-label=\"โปรไฟล์\" title=\"โปรไฟล์\"'+(view==='profile'||view==='settings'||view==='sim'?' aria-current=\"page\"':'')+'>'+ico('"+PERSON+"')+'</button>')")
# เมนูหลักของผู้ดูแล: ไม่มีแท็บตั้งค่าแล้ว
rep(",['settings','ตั้งค่า','sliders']]","]")
# หน้าใหม่ + ปุ่มเปิด
rep("leave:viewLeave,leaves:viewLeaves};","leave:viewLeave,leaves:viewLeaves,profile:viewProfile};")
rep("    case 'tab':view=D.v;resetUi();renderAll();window.scrollTo(0,0);break;",
    "    case 'tab':view=D.v;resetUi();renderAll();window.scrollTo(0,0);break;\n    case 'profile':view='profile';resetUi();renderAll();window.scrollTo(0,0);break;")
rep("function viewPeople(){",open(S+'prod/p_profile.js',encoding='utf-8').read()+"function viewPeople(){")
# หน้าตั้งค่าระบบ: ปุ่มกลับไปโปรไฟล์
rep("  return '<div class=\"stack\"><div><h1>ตั้งค่า</h1>",
    "  return '<div class=\"stack\"><div><button class=\"btn sec sm\" data-act=\"profile\" style=\"margin-bottom:8px\">‹ โปรไฟล์</button><h1>ตั้งค่า</h1>")
css="""
/* โปรไฟล์ */
.ubtn{all:unset;cursor:pointer;display:block;border-radius:8px;padding:2px 4px}
.ubtn:hover b{text-decoration:underline}
.ubtn:focus-visible{outline:2px solid var(--brand);outline-offset:2px}
.topbar .iconbtn[aria-current=page]{border-color:var(--brand-strong);color:var(--brand-strong)}
.phd{display:flex;align-items:center;gap:14px}
.phd h2{margin:0}.phd p{margin:2px 0 0}
.pav{flex:none;width:56px;height:56px;border-radius:50%;background:var(--brand);color:var(--on-brand);display:grid;place-items:center;font-weight:700;font-size:24px;font-family:var(--font-display)}
.pav.sm{width:34px;height:34px;font-size:15px}
.pmem{flex-wrap:nowrap}
.plang{display:flex;flex-direction:column;gap:8px}.plang p{margin:0}
@media (max-width:400px){.topbar.in .langbtn{min-width:34px;padding:0 6px}}
@media (max-width:370px){.topbar.in .brand>div:not(.mark){display:none}.topbar.in .top-right{gap:5px}}
"""
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('profile patch ok')
