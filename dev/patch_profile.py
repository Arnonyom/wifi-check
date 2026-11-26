# เมนูโปรไฟล์: แท็บ "โปรไฟล์" ท้ายเมนูล่าง → ข้อมูลของฉัน สมาชิกในทีม เปลี่ยนรหัสผ่าน ภาษา · ผู้ดูแล: ตั้งค่าระบบอยู่ในนี้
# แถบด้านบน: กระดิ่ง + ปุ่มฟันเฟือง (ภาษา · ธีม · ออกจากระบบ ถามยืนยันก่อน) แทนปุ่มภาษา/ธีม/กุญแจ/ออก
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)

PERSON='<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'
GEAR='<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
rep("var ICONS={","var ICONS={\n  user:'"+PERSON+"',\n  gear:'"+GEAR+"',")
# แถบด้านบน: เหลือ กระดิ่ง + ชื่อ (กดไปโปรไฟล์) + ปุ่มฟันเฟือง (ภาษา · ธีม · ออกจากระบบ)
rep("  top.innerHTML=brandHtml()+'<div class=\"top-right\">'+themeBtn()+\n",
    "  top.innerHTML=brandHtml()+'<div class=\"top-right\">'+\n")
rep("'<div class=\"user\"><div class=\"uname\"><b>'+esc(me.name)+'</b><span>'+esc(teamLabel(me))+'</span></div>'+",
    "'<div class=\"user\">'+(me.mustChange?'<div class=\"uname\">':'<button class=\"uname ubtn\" data-act=\"profile\" title=\"โปรไฟล์\">')+'<b>'+esc(me.name)+'</b><span>'+esc(teamLabel(me))+'</span>'+(me.mustChange?'</div>':'</button>')+")
rep("(me.mustChange?'':'<button class=\"iconbtn\" data-act=\"pw-self\" aria-label=\"เปลี่ยนรหัสผ่าน\" title=\"เปลี่ยนรหัสผ่าน\">'+ico('<circle cx=\"8\" cy=\"15\" r=\"4\"/><path d=\"M10.8 12.2 20 3M17 6l3 3M14.5 8.5l2.5 2.5\"/>')+'</button>')","''")
rep("+'<button class=\"iconbtn\" data-act=\"logout\" aria-label=\"ออกจากระบบ\" title=\"ออกจากระบบ\">'+ico(ICONS.out)+'</button></div></div>';",
    "+'</div>'+themeBtn()+'</div>';")
# ปุ่มฟันเฟือง (ใช้กลไกเดิมของเมนูธีม data-act=theme)
rep("aria-label=\"ธีมหน้าจอ\" title=\"ธีมหน้าจอ\" aria-expanded=\"'+themeOpen+'\">'+ico(curTheme()==='dark'?ICONS.moon:ICONS.sun)+'</button>",
    "aria-label=\"ตั้งค่า\" title=\"ตั้งค่า\" aria-haspopup=\"dialog\" aria-expanded=\"'+themeOpen+'\">'+ico(ICONS.gear)+'</button>")
rep("  return '<div class=\"pop thpop\" role=\"dialog\" aria-label=\"ธีมหน้าจอ\"><p class=\"small muted\">ธีมหน้าจอ</p><div class=\"thopts\">'+",
    "  return '<div class=\"pop thpop\" role=\"dialog\" aria-label=\"ตั้งค่า\">'+langRow()+'<p class=\"small muted\">ธีมหน้าจอ</p><div class=\"thopts\">'+")
rep("<span>ใส</span><span>ขุ่น</span></div>':'')+'</div>';",
    "<span>ใส</span><span>ขุ่น</span></div>':'')+(me?'<div class=\"thout\">'+(logoutAsk"
    "?'<p class=\"small\" role=\"alert\"><b>ออกจากระบบใช่ไหม?</b></p><div class=\"row\" style=\"gap:8px\"><button class=\"btn danger grow\" data-act=\"logout\">ใช่ ออกจากระบบ</button><button class=\"btn sec\" data-act=\"logout-no\">ยกเลิก</button></div>'"
    ":'<button class=\"btn sec grow\" data-act=\"logout-ask\">'+ico(ICONS.out)+'<span>ออกจากระบบ</span></button>')+'</div>':'')+'</div>';")
rep("var themeOpen=false,GLASS_KEY='wc-glass';","var themeOpen=false,logoutAsk=false,GLASS_KEY='wc-glass';")
rep("    case 'theme':themeOpen=!themeOpen;renderChrome();break;",
    "    case 'theme':themeOpen=!themeOpen;logoutAsk=false;renderChrome();break;\n    case 'logout-ask':logoutAsk=true;renderChrome();break;\n    case 'logout-no':logoutAsk=false;renderChrome();break;")
rep("  if(themeOpen&&!e.target.closest('.thwrap')){themeOpen=false;renderChrome();}",
    "  if(themeOpen&&!e.target.closest('.thwrap')){themeOpen=false;logoutAsk=false;renderChrome();}")
# เมนูล่าง: + โปรไฟล์ (ทุกคน) · ผู้ดูแลไม่มีแท็บตั้งค่าแล้ว (อยู่ในโปรไฟล์)
rep(",['settings','ตั้งค่า','sliders']]",",['profile','โปรไฟล์','user']]")
rep(",['history','ประวัติ','doc']]",",['history','ประวัติ','doc'],['profile','โปรไฟล์','user']]")
rep("(view===x[0]||(view==='sim'&&x[0]==='settings')?","(view===x[0]||((view==='sim'||view==='settings')&&x[0]==='profile')?")
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
.phd{display:flex;align-items:center;gap:14px}
.phd h2{margin:0}.phd p{margin:2px 0 0}
.pav{flex:none;width:56px;height:56px;border-radius:50%;background:var(--brand);color:var(--on-brand);display:grid;place-items:center;font-weight:700;font-size:24px;font-family:var(--font-display)}
.pav.sm{width:34px;height:34px;font-size:15px}
.pmem{flex-wrap:nowrap}
.plang{display:flex;flex-direction:column;gap:8px}.plang p{margin:0}
/* เมนูฟันเฟือง: ออกจากระบบ (ถามยืนยันก่อน) */
.thout{border-top:1px solid var(--line);padding-top:10px;display:flex;flex-direction:column;gap:8px}.thout p{margin:0}
.thout .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px}.thout .btn svg{width:18px;height:18px}
"""
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('profile patch ok')
