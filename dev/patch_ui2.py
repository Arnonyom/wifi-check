# ปรับหน้าตา (ตามที่เจ้าของขอ 27 พ.ย. 2569):
#  1) แถบด้านบนเรียง ชื่อ → กระดิ่ง → ฟันเฟือง
#  2) หน้าโปรไฟล์ไม่มีเลือกภาษาแล้ว (อยู่ที่ฟันเฟืองที่เดียว · สวิตช์เลื่อนสร้างใน i18n.py)
#  3) หน้าตั้งค่าระบบ: การ์ดหุบเหลือหัวข้อ กดแล้วขยาย (prod/p_acc.js)
import os as _os,re; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)
# 1) เรียงแถบด้านบนใหม่
i=s.index("  top.innerHTML=brandHtml()+'<div class=\"top-right\">'+\n    '<div class=\"bellwrap\">")
j=s.index("''+'</div>'+themeBtn()+'</div>';",i)+len("''+'</div>'+themeBtn()+'</div>';")
blk=s[i:j]
lines=blk.split('\n')
assert len(lines)==4 and lines[1].lstrip().startswith("'<div class=\"bellwrap\">") and lines[2].lstrip().startswith("'<div class=\"user\">"),lines
bell=lines[1].strip();user=lines[2].strip()
assert bell.endswith("+'</div>'+") and user.endswith("+")
new="  top.innerHTML=brandHtml()+'<div class=\"top-right\">'+\n    "+user+"'</div>'+\n    "+bell+"themeBtn()+'</div>';"
s=s[:i]+new+s[j:]
# 2) โปรไฟล์: เอาเลือกภาษาออก
rep("'</div><div class=\"plang\">'+langRow()+'</div></section></div>';","'</div></section></div>';")
# 3) การ์ดหุบ/ขยายในหน้าตั้งค่าระบบ
rep("/* ---------- leave ---------- */",open(S+'prod/p_acc.js',encoding='utf-8').read()+"/* ---------- leave ---------- */")
rep("  $('main').innerHTML=(fns[view]||viewHome)();\n","  $('main').innerHTML=(fns[view]||viewHome)();\n  if(view==='settings')settingsAcc();\n")
css="""
/* หน้าตั้งค่าระบบ: แท็บหมวด + ตารางการ์ด + หน้าต่าง popup */
.settabs{align-self:flex-start;max-width:100%;overflow-x:auto;flex-wrap:nowrap}
.settabs button{white-space:nowrap}
.settabs button[aria-selected="true"]{background:var(--brand-strong);color:var(--on-strong)}
.setgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.stile{display:flex;align-items:center;gap:12px;padding:14px}
.stile[hidden]{display:none}
.stile .grow{min-width:0;display:flex;flex-direction:column;gap:2px}
.stile b{font-size:15px}
.stic{flex:none;width:44px;height:44px;border-radius:12px;background:var(--brand-soft);color:var(--brand-strong);display:grid;place-items:center}
section.spop:not(.open){display:none!important}
section.spop.open{position:fixed;z-index:42;left:50%;top:50%;transform:translate(-50%,-50%);width:min(680px,calc(100vw - 32px));max-height:min(86vh,900px);overflow:auto;box-shadow:var(--shadow);padding-top:18px}
section.spop.open>h2{padding-right:44px}
.spx{position:absolute;top:10px;right:10px}
section.spop.open{position:fixed}
.spbg{display:none}.spbg.on{display:block;position:fixed;inset:0;z-index:41;background:var(--scrim,rgba(0,0,0,.45))}
body.noscroll{overflow:hidden}
@media (max-width:720px){section.spop.open{left:0;right:0;bottom:0;top:auto;transform:none;width:100%;max-height:88vh;border-radius:18px 18px 0 0;padding-bottom:calc(18px + env(safe-area-inset-bottom,0px))}}
/* ฟันเฟือง: สวิตช์ภาษา */
.langsw{padding:6px 2px}.langsw .lsw{display:flex;align-items:center;gap:8px}.langsw .lsw>span[lang]{font-size:14px;color:var(--muted)}.langsw .lsw>span.on{color:var(--ink);font-weight:700}
"""
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('ui2 patch ok')
