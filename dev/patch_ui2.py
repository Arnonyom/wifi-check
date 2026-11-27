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
/* หน้าตั้งค่าระบบ: การ์ดหุบ/ขยาย */
.sacc:not(.open)>*:not(.acchead){display:none!important}
.sacc .acchead{margin:0}
.acchd{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;cursor:pointer;border-radius:8px;font:inherit}
.acchd:focus-visible{outline:2px solid var(--brand);outline-offset:3px}
.accchev{color:var(--muted);font-size:22px;line-height:1;transition:transform .15s}
.sacc.open .accchev{transform:rotate(90deg)}
.accfoot{display:flex;justify-content:flex-end}
@media (prefers-reduced-motion:reduce){.accchev{transition:none}}
/* ฟันเฟือง: สวิตช์ภาษา */
.langsw{padding:6px 2px}.langsw .lsw{display:flex;align-items:center;gap:8px}.langsw .lsw>span[lang]{font-size:14px;color:var(--muted)}.langsw .lsw>span.on{color:var(--ink);font-weight:700}
"""
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('ui2 patch ok')
