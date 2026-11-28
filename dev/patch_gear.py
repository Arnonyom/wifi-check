# เมนูฟันเฟือง (28 พ.ย. 2569): ถามยืนยันทุกการเปลี่ยนแปลง · ธีม Black + กำหนดสีเอง · เปลี่ยนรหัสผ่านอยู่ที่นี่ (prod/p_gear.js)
# โปรไฟล์: เอาเปลี่ยนรหัสผ่านออก · "ตั้งค่าระบบ" → "Admin tool" (การ์ดสีเข้ม)
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)
i=s.index("function setTheme(t){document.documentElement.setAttribute('data-theme',t);")
j=s.index("/* รายงาน: หมายเหตุเมื่อผู้ดูแลลงเวลาให้",i)
old=s[i:j];assert old.count('function themePanel(){')==1 and "e.target.id==='glassRange'" in old
s=s[:i]+"applyGlass(glassLevel());\n"+open(S+'prod/p_gear.js',encoding='utf-8').read()+"\n"+s[j:]
rep("function effDark(){var t=document.documentElement.getAttribute('data-theme');if(t)return t==='dark';return window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches;}\n","")
# โปรไฟล์
rep("""    '<section class="card stack"><h2>ตั้งค่า</h2><div class="list">'+
      '<button class="li lib" data-act="pw-self"><span class="grow"><b>เปลี่ยนรหัสผ่าน</b><br><span class="muted small">ตั้งรหัสผ่านใหม่สำหรับเข้าสู่ระบบ</span></span>'+go+'</button>'+
      (isAdm?'<button class="li lib" data-act="tab" data-v="settings"><span class="grow"><b>ตั้งค่าระบบ</b><br><span class="muted small">การหมุนกะ กฎการลงเวลา นำเข้า/ส่งออกตารางกะ และทดสอบเข้า-ออกงาน</span></span>'+go+'</button>':'')+
    '</div></section></div>';""",
"""    (isAdm?'<button class="card admtool" data-act="tab" data-v="settings"><span class="admic" aria-hidden="true">'+ico(ICONS.gear)+'</span><span class="grow"><b>Admin tool</b><br><span class="small">การหมุนกะ วันหยุด วันลา กฎการลงเวลา นำเข้า/ส่งออก และทดสอบ</span></span>'+go+'</button>':'')+
    '<p class="muted small center">เปลี่ยนรหัสผ่าน ภาษา และธีม ได้ที่ปุ่มฟันเฟืองด้านบน</p></div>';""")
rep("<h1>ตั้งค่า</h1><p class=\"muted\">","<h1>Admin tool</h1><p class=\"muted\">")
css="""
.thpop{max-height:min(86vh,680px)}.thpop>*{flex-shrink:0}
/* ธีม Black (ดำสนิท) */
:root[data-theme="black"]{
  --bg:#000000; --surface:#0E0E0E; --surface-2:#171717; --ink:#F2F2F2; --muted:#A6A6A6; --line:#2A2A2A;
  --brand:#8FD65A; --brand-strong:#8FD65A; --on-strong:#000000; --brand-soft:#14240F; --on-brand:#000000;
  --late:#F2C265; --late-soft:#2E230B; --amber:#F2C265; --off:#F19A92; --off-soft:#331614; --hatch:#121212;
  --scrim:rgba(0,0,0,.75); --shadow:0 0 0 1px #1f1f1f; --grid:#222222; --axis:#3a3a3a;
  --s1:#3987e5; --s2:#d95926; --s3:#199e70; color-scheme:dark;
}
.thsw-black{background:#000;border-color:#444}
/* ธีม White (ขาวล้วน) */
:root[data-theme="white"]{
  --bg:#FFFFFF; --surface:#FFFFFF; --surface-2:#F4F5F4; --ink:#111312; --muted:#5C6460; --line:#E2E5E2;
  --brand:#7AC143; --brand-strong:#2E7D1A; --on-strong:#FFFFFF; --brand-soft:#EEF7E6; --on-brand:#10281A;
  --late:#7A4A00; --late-soft:#FFF0CF; --amber:#E0A100; --off:#A8322A; --off-soft:#FBE6E3; --hatch:#F2F3F2;
  --scrim:rgba(0,0,0,.45); --shadow:0 0 0 1px #E6E8E6,0 6px 18px rgba(0,0,0,.05); --grid:#ECEEEC; --axis:#C6CBC8;
  --s1:#2a78d6; --s2:#eb6834; --s3:#1baf7a; color-scheme:light;
}
.thsw-white{background:#fff;border-color:#c8cbc9}
.thsw{display:grid;place-items:center}.thsw svg{width:15px;height:15px}
.thsw-light svg{color:#E0A100}.thsw-dark svg{color:#E7F2E4}
/* กำหนดสีเอง แบบแก้ว: พื้นหลังไล่สีจากสีที่เลือก */
:root[data-theme="glass"][data-cust] body{background:var(--cgb);background-image:radial-gradient(60vw 50vw at 8% 10%,var(--cg1),transparent 60%),radial-gradient(55vw 45vw at 92% 18%,var(--cg2),transparent 60%),radial-gradient(60vw 55vw at 75% 95%,var(--cg3),transparent 60%),radial-gradient(50vw 45vw at 15% 90%,var(--cg4),transparent 60%);background-attachment:fixed}
.thsw-custom{background:linear-gradient(135deg,#7AC143 0 50%,#fff 50% 100%)}
.thopt.pend{border-style:dashed;border-color:var(--brand-strong)}
.gask{border:1px solid var(--brand-strong);background:var(--brand-soft);border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:8px}.gask p{margin:0}
.cust{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.cust input[type=color]{width:44px;height:36px;padding:0;border:1px solid var(--line);border-radius:8px;background:none;cursor:pointer}
.cust .seg{flex:1}
.custsw{display:flex;gap:8px;flex-wrap:wrap}.csw{width:28px;height:28px;border-radius:50%;border:2px solid var(--surface);box-shadow:0 0 0 1px var(--line);cursor:pointer}.csw.on{box-shadow:0 0 0 2px var(--ink)}
/* โปรไฟล์: Admin tool (การ์ดสีเข้ม) */
.admtool{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:12px;padding:16px;border-radius:16px;cursor:pointer;background:#14281B;background:color-mix(in srgb,var(--brand-strong) 32%,#070B08);color:#fff;border:1px solid var(--brand-strong);box-shadow:var(--shadow)}
.admtool b{font-size:17px;font-family:var(--font-display)}.admtool .small{opacity:.8}.admtool .go{color:inherit;opacity:.8}
.admtool:hover{filter:brightness(1.15)}.admtool:focus-visible{outline:3px solid var(--brand);outline-offset:2px}
.admic{flex:none;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--brand);color:var(--on-brand)}.admic svg{width:22px;height:22px}
.center{text-align:center}
"""
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('gear patch ok')
