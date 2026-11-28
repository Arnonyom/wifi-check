# รอบ 29 พ.ย. 2569 (บ่าย): สำรองข้อมูลเป็น Excel · Admin tool อยู่ใต้การ์ดโปรไฟล์ · เอาการ์ดแจ้งเตือนบนมือถือออก
# สถิติเลือกช่วงได้ถึง 1 ปี / กำหนดเอง · แถบสีด้านบนตามธีม · iOS แป้นพิมพ์/ช่องเลือก (prod/p_r4.js)
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)
rep("/* ---------- leave ---------- */",open(S+'prod/p_r4.js',encoding='utf-8').read()+"/* ---------- leave ---------- */")
# สถิติ: ช่วงเวลาสิ้นสุดที่ dashEnd() (วันนี้ หรือวันที่เลือก)
rep("    var d=addDays(today,-i),ds=dayStatus(d,idx,t),c={d:d,","    var d=addDays(dashEnd(),-i),ds=dayStatus(d,idx,t),c={d:d,")
rep("  for(var i=N-1;i>=0;i--){var d=addDays(today,-i);if(d<dataStart())continue;","  for(var i=N-1;i>=0;i--){var d=addDays(dashEnd(),-i);if(d<dataStart())continue;")
rep("idx=attIdx(),D=dashData(dashDays,part==='stats'?dashEmp:'')","idx=attIdx(),_ds=dashSync(),D=dashData(dashDays,part==='stats'?dashEmp:'')")
rep("  var daily=D.daysArr.map(function(c){return {d:c.d,vals:[c.ok,c.late,c.miss],k:'day:'+c.d};});","  var daily=weekly(D.daysArr.map(function(c){return {d:c.d,vals:[c.ok,c.late,c.miss],k:'day:'+c.d};}));")
rep("  var hTeam=D.daysArr.map(function(c){return {d:c.d,vals:[Math.round(c.hA),Math.round(c.hB)],k:'day:'+c.d};});","  var hTeam=weekly(D.daysArr.map(function(c){return {d:c.d,vals:[Math.round(c.hA),Math.round(c.hB)],k:'day:'+c.d};}));")
rep("""'<div class="sech"><h2>สถิติย้อนหลัง</h2><div class="seg" role="group" aria-label="ช่วงเวลา">'+[7,30,90].map(function(n){return '<button data-act="dash" data-n="'+n+'" aria-pressed="'+(dashDays===n)+'">'+n+' วัน</button>';}).join('')+'</div>'+dashEmpSel()+'</div>'""",
    """'<div class="sech"><h2>สถิติย้อนหลัง</h2>'+dashEmpSel()+'</div>'+dashRangeHtml()""")
# Admin tool: การ์ดสำรองข้อมูล
rep("    holCard()+lvqCard()+clrCard()+","    holCard()+lvqCard()+bkCard()+clrCard()+")
# โปรไฟล์: Admin tool ย้ายมาอยู่ใต้การ์ดโปรไฟล์
i=s.index("    (isAdm?'<button class=\"card admtool\"");j=s.index("\n",i)+1;adm=s[i:j];s=s[:i]+s[j:]
rep("    '</dl></section>'+\n    (isAdm?'<section class=\"card\"><h2>'","    '</dl></section>'+\n"+adm+"    (isAdm?'<section class=\"card\"><h2>'")
css="""
/* สถิติ: ช่วงเวลา */
.dseg{align-self:flex-start;max-width:100%;overflow-x:auto;flex-wrap:nowrap}.dseg button{white-space:nowrap}
@media (max-width:640px){.dseg{display:grid;grid-template-columns:repeat(3,1fr);width:100%;align-self:stretch}.dsrange{display:grid;grid-template-columns:1fr 1fr;gap:8px}}
.dsrange{max-width:520px}.dsinfo{margin-top:-4px}
/* สำรองข้อมูล */
#bkCard .btn{display:inline-flex;align-items:center;gap:8px}#bkCard .btn svg{width:18px;height:18px}
/* iOS: หน้าต่างแบบแผ่นล่างยกขึ้นพ้นแป้นพิมพ์ */
@media (max-width:720px){section.spop.open{bottom:var(--kb,0px)!important;max-height:calc(88vh - var(--kb,0px))!important}}
"""
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('r4 patch ok')
