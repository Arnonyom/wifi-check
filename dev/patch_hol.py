# วันหยุดราชการ/นักขัตฤกษ์ (ทีม A หยุด) + ล้างข้อมูลทดสอบ · การ์ดในหน้าตั้งค่าระบบ + ชื่อวันหยุดในตารางกะ (prod/p_hol.js)
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)
# (แทรกหลัง viewSettings: ช่วงก่อนหน้า build_prod เขียนทับด้วย p_csv.js)
rep("/* ---------- leave ---------- */",open(S+'prod/p_hol.js',encoding='utf-8').read()+"/* ---------- leave ---------- */")
rep("    '<section class=\"card stack\"><h2>แจ้งเตือนบนมือถือ (Push)</h2>","    holCard()+clrCard()+\n    '<section class=\"card stack\"><h2>แจ้งเตือนบนมือถือ (Push)</h2>")
rep("return '<div class=\"cell na\">–</div>';}",
    "var hn=s.team==='A'?holName(d):'';return hn?'<div class=\"cell na hol\" title=\"'+esc(hn)+'\"><span>'+esc(hn)+'</span></div>':'<div class=\"cell na\">–</div>';}")
rep("    ?'<section class=\"card muted\">'+T.name+' ไม่ทำงานวัน'+DOW_TH[dowOf(d)]+'ที่ '+esc(thDate(d,{day:'numeric',month:'long'}))+'</section>'",
    "    ?(T.id==='A'&&holName(d)?'<section class=\"card muted\">'+T.name+' หยุดวันหยุดราชการ: <b>'+esc(holName(d))+'</b></section>':'<section class=\"card muted\">'+T.name+' ไม่ทำงานวัน'+DOW_TH[dowOf(d)]+'ที่ '+esc(thDate(d,{day:'numeric',month:'long'}))+'</section>')")
css="""
/* วันหยุด + ล้างข้อมูล */
.cell.hol span{font-size:11px;line-height:1.25;text-align:center;color:var(--off);font-weight:600;padding:0 4px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.hlist{max-height:380px;overflow:auto}
.hrow{flex-wrap:nowrap}.hrow .hd{min-width:96px;color:var(--muted)}.hrow.past{opacity:.55}
.clrk{display:flex;gap:10px;align-items:flex-start;margin:0;cursor:pointer}.clrk input{margin-top:4px}
"""
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('hol patch ok')
