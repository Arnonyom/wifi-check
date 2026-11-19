# ลดความซ้ำซ้อนสำหรับผู้ดูแล (โดยเฉพาะบนมือถือ)
# 1) ภาพรวม = เฉพาะ "ตอนนี้" + ใครหยุด ใครทำแทน 14 วันข้างหน้า
#    (เอารายการคำขอลาซ้ำออก — มีการ์ดตัวเลข + แท็บคำขอลาอยู่แล้ว)
# 2) ปฏิทินสถานะ + สถิติย้อนหลัง ย้ายไปหน้า "รายงาน" (เหลือปฏิทินเดียว)
#    หน้ารายงานแบ่งเป็น 3 ส่วน: ปฏิทิน · สถิติ · ตารางละเอียด
# 3) เมนูล่าง 7 → 6: "ทดสอบ" ย้ายเข้าไปในหน้าตั้งค่า
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)

# --- 3) เมนู: เอา "ทดสอบ" ออก, เปิดจากหน้าตั้งค่าแทน (แท็บตั้งค่ายังสว่างอยู่ตอนอยู่หน้าทดสอบ)
rep("['report','รายงาน','doc'],['sim','ทดสอบ','clock'],['settings','ตั้งค่า','sliders']]",
    "['report','รายงาน','doc'],['settings','ตั้งค่า','sliders']]")
rep("""'<button class="tab" data-act="tab" data-v="'+x[0]+'"'+(view===x[0]?""",
    """'<button class="tab" data-act="tab" data-v="'+x[0]+'"'+(view===x[0]||(view==='sim'&&x[0]==='settings')?""")
rep("""return '<div class="stack"><div><h1>ตั้งค่า</h1><p class="muted">การหมุนกะ กฎเวลาลงเวลา และนำเข้า/ส่งออกตารางกะ</p></div>'+""",
    """return '<div class="stack"><div><h1>ตั้งค่า</h1><p class="muted">การหมุนกะ กฎเวลาลงเวลา และนำเข้า/ส่งออกตารางกะ</p></div>'+
    '<section class="card" style="padding:4px 14px"><button class="li lib simgo" data-act="tab" data-v="sim"><span class="grow"><b>ทดสอบเข้า-ออกงาน</b><br><span class="muted small">ลองลงเวลาแทนพนักงานในวันและเวลาที่ต้องการ (ไม่บันทึกจริง)</span></span><span class="go" aria-hidden="true">›</span></button></section>'+""")
rep("""'<div><h1>ทดสอบเข้า-ออกงาน</h1>""",
    """'<div><button class="btn sec sm" data-act="tab" data-v="settings" style="margin-bottom:8px">‹ กลับไปตั้งค่า</button><h1>ทดสอบเข้า-ออกงาน</h1>""")

# --- 1+2) แยก viewDash เป็น "ตอนนี้" กับ ปฏิทิน/สถิติ
rep("function viewDash(){\n  var t=now()",
    "function viewDash(){return dashParts('now');}\nfunction dashParts(part){\n  var t=now()")
i=s.index("function dashParts(part){");j=s.index("\n}\n",i)
body=s[i:j]
k=body.index("  return '<div class=\"stack\">'+")
old=body[k:]
a=old.index("    '<div class=\"cgrid\">'+heatCard+")
b=old.index("    '<div class=\"sech\"><h2>สถิติย้อนหลัง</h2>")
upcoming="""'<section class="card"><h3>ใครหยุด ใครทำแทน (14 วันข้างหน้า)</h3><div class="list" style="max-height:300px;overflow:auto">'+(upc.join('')||'<p class="muted small" style="padding:10px 0">ไม่มีการหยุดล่วงหน้า</p>')+'</section>'"""
assert "<h3>ใครหยุด ใครทำแทน (14 วันข้างหน้า)</h3><div class=\"list\" style=\"max-height:300px;overflow:auto\">'+(upc.join('')||'<p class=\"muted small\" style=\"padding:10px 0\">ไม่มีการหยุดล่วงหน้า</p>')+'</div></section></div>'+" in old[a:b], 'upcoming card changed'
nowPart=old[:a]+"    "+upcoming.replace("+'</section>'","+'</div></section>'")+"+'</div>';\n"
stats=old[b:]
assert stats.endswith("</div></div>';"),stats[-40:]
newRet=("  if(part==='cal')return heatCard;\n"
        "  if(part==='stats')return '<div class=\"stack\">'+\n"+stats+"\n"
        +nowPart.rstrip('\n'))
body=body[:k]+newRet
s=s[:i]+body+s[j:]
# หน้ารายงาน: แบ่ง 3 ส่วน
rep("var rep={team:'',emp:'',csv:'',calMonth:'',calSel:''};","var rep={team:'',emp:'',csv:'',calMonth:'',calSel:'',sec:'cal'};")
rep("""  return '<div class="stack"><div><h1>รายงานเวลาเข้า–ออกงาน</h1><p class="muted">ดูออนไลน์ ปฏิทินสรุปสถานะ และส่งออกเป็น CSV</p></div>'+
    calMonthHtml(idx,t)+""",
"""  var secs=[['cal','ปฏิทิน'],['stats','สถิติ'],['table','ตารางละเอียด']];
  var head='<div class="stack"><div><h1>รายงาน</h1><p class="muted">ปฏิทินสถานะ สถิติย้อนหลัง และตารางละเอียด (ส่งออก Excel ได้)</p></div>'+
    '<div class="seg rsec" role="group" aria-label="ส่วนของรายงาน">'+secs.map(function(x){return '<button data-act="rsec" data-s="'+x[0]+'" aria-pressed="'+(rep.sec===x[0])+'">'+x[1]+'</button>';}).join('')+'</div>';
  if(rep.sec!=='table'){return head+(rep.sec==='stats'?dashParts('stats'):'<div class="cgrid">'+dashParts('cal')+'</div>')+'</div>';}
  return head+""")
rep("    case 'dash':dashDays=Number(D.n);renderView();break;",
    "    case 'dash':dashDays=Number(D.n);renderView();break;\n    case 'rsec':rep.sec=D.s;renderView();break;")
rep("if(me&&view==='today'&&!dp&&!modal){renderView();renderDet();}",
    "if(me&&(view==='today'||view==='report')&&!dp&&!modal){renderView();renderDet();}")
css="""
/* slim: report sections + settings link */
.seg.rsec{align-self:flex-start;max-width:100%;overflow-x:auto}
.simgo{width:100%;text-align:left;border:0!important}
"""
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('slim patch ok')
