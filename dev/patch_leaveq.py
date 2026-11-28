# วันลา (28 พ.ย. 2569): สิทธิ์วันลารายคน · ผู้ดูแลลาแทน · กติกาวันลาใหม่ + เลือกจำนวนวัน · เมนู "ลา" · การ์ดในหน้าตั้งค่าระบบ (prod/p_leaveq.js)
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)
# หน้าขอลาเดิม → ใช้ viewLeave ใหม่ใน p_leaveq.js
i=s.index('function viewLeave(){');j=s.index('function submitLeave(){',i);s=s[:i]+s[j:]
rep("/* ---------- leave ---------- */",open(S+'prod/p_leaveq.js',encoding='utf-8').read()+"/* ---------- leave ---------- */")
rep("var lv={type:'vac',reason:'',err:'',ok:''}","var lv={type:'vac',len:1,reason:'',err:'',ok:''}")
# ผู้ดูแล: หน้า "ลา" + ปุ่มลาแทนพนักงาน
rep("  return '<div class=\"stack\"><div><h1>คำขอลา</h1><p class=\"muted\">อนุมัติแล้วระบบจะตั้งกะเป็นหยุดและระบุผู้ทำแทนในตารางให้อัตโนมัติ</p></div>'+",
    "  return '<div class=\"stack\"><div><h1>ลา</h1><p class=\"muted\">อนุมัติแล้วระบบจะตั้งกะเป็นหยุดและระบุผู้ทำแทนในตารางให้อัตโนมัติ</p></div>'+lvAdmHtml()+")
# รายการลา: ป้ายเมื่อผู้ดูแลบันทึกให้
rep("+esc(LEAVE_TH[l.type])+'</b> <span class=\"muted small tnum\">'","+esc(LEAVE_TH[l.type])+'</b>'+(l.byAdmin?' <span class=\"chip late\">ผู้ดูแลบันทึกให้</span>':'')+' <span class=\"muted small tnum\">'")
# เมนู: ขอลา / คำขอลา → ลา
rep("['leaves','คำขอลา','bag']","['leaves','ลา','bag']")
rep("['leave','ขอลา','bag']","['leave','ลา','bag']")
rep("{v:'leaves',label:'คำขอลา',","{v:'leaves',label:'ลา',",2)
rep("{v:'leave',label:'ขอลา'}","{v:'leave',label:'ลา'}",2)
# ปฏิทินเลือกวัน: วันที่ที่ไม่ได้อยู่เป็นคู่ (เช่น laFrom, holD, clrFrom) ต้องจำค่าที่เลือกด้วย (เดิมเลือกแล้วไม่เปลี่ยน)
rep("function onDate(id,val){\n  var p=PAIRS[id];\n  if(p){","function onDate(id,val){\n  var p=PAIRS[id];\n  if(!p)dv[id]=val;\n  if(p){")
# หน้าตั้งค่าระบบ: การ์ดตั้งค่าวันลา
rep("    holCard()+clrCard()+","    holCard()+lvqCard()+clrCard()+")
css="""
/* วันลา */
section.spop.open>*{flex-shrink:0}
.lenst{display:flex;align-items:center;gap:10px;min-height:44px}.lenst b{min-width:56px;text-align:center}
.lenst .btn{min-width:44px;font-size:18px;font-weight:700}
.dfix{cursor:default;gap:8px;justify-content:flex-start}
.lvrule{margin-top:-4px}
.lvqt td,.lvqt th{white-space:nowrap}
.lvqpick{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:6px 12px;padding-left:4px}
.lvqlog{max-height:260px;overflow:auto}
.lvbrow{flex-wrap:wrap;gap:6px 14px}.lvbn{min-width:120px;flex:1 1 120px}
.lvbm{display:grid;grid-template-columns:repeat(3,minmax(90px,1fr));gap:10px;flex:3 1 300px}
.lvbx{display:flex;flex-direction:column;gap:3px;min-width:0}
.lvbar{position:relative;height:8px;border-radius:4px;background:var(--surface-2);overflow:hidden}
.lvbar i{position:absolute;left:0;top:0;bottom:0;border-radius:4px}.lvbar i.p{opacity:.35}
"""
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('leaveq patch ok')
