# รายงาน › สถิติ: เลือกดูทุกคน หรือคนเดียว (28 พ.ย. 2569)
#  - กราฟพฤติกรรม (รายวัน อัตราตรงเวลา เวลาเข้างานเฉลี่ย การกระจาย วันที่สาย ชั่วโมงรายวัน การลา) → เฉพาะคนที่เลือก
#  - กราฟเปรียบเทียบรายคน/ทีม (สายต่อคน ชั่วโมงต่อคน ภาระทำแทน ทีม) → ยังแสดงทุกคน แต่เน้นคนที่เลือก (คนอื่นจางลง)
#  + การ์ดสิทธิ์วันลาคงเหลือ (lvBalCard ใน p_leaveq.js) · ตารางกะเปิดมาเป็นมุมมอง "เดือน"
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)
rep("schedMode=window.innerWidth<720?'day':'week',","schedMode='month',")
rep("var dashDays=30;","var dashDays=30,dashEmp='';\nfunction dimC(id){return dashEmp&&id!==dashEmp?' dim':'';}")
rep("function dashData(N){","function dashData(N,who){")
rep("      if(['ok','late','missing','incomplete'].indexOf(r.k)<0)return;\n      var w=r.w,",
    "      if(['ok','late','missing','incomplete'].indexOf(r.k)<0)return;\n"
    "      if(who&&(!r.w||r.w.id!==who)){if(r.sl.off&&r.sl.regular&&r.sl.regular.id===who&&leave[r.sl.kind]!=null)leave[r.sl.kind]++;return;} // ดูคนเดียว: นับการลาของคนนั้นเอง\n"
    "      var w=r.w,")
rep("if(leave[r.sl.kind]!=null)leave[r.sl.kind]++;","if(leave[r.sl.kind]!=null&&!who)leave[r.sl.kind]++;")
rep("idx=attIdx(),D=dashData(dashDays),B=liveBoard(t,today,idx),tot=D.tot;",
    "idx=attIdx(),D=dashData(dashDays,part==='stats'?dashEmp:''),DA=part==='stats'&&dashEmp?dashData(dashDays,''):D,B=liveBoard(t,today,idx),tot=D.tot;")
rep("  var late=D.per.slice()","  var late=DA.per.slice()")
rep("  var hrsP=D.per.slice()","  var hrsP=DA.per.slice()")
rep("var T=D.tm[k];","var T=DA.tm[k];")
rep("  var cov=Object.keys(D.cover).map(function(k){return {id:k,n:D.cover[k]};})","  var cov=Object.keys(DA.cover).map(function(k){return {id:k,n:DA.cover[k]};})")
rep("text:String(p.late),cls:'f-warn',k:'emp:'+p.id,","text:String(p.late),cls:'f-warn'+dimC(p.id),k:'emp:'+p.id,")
rep("text:Math.round(p.hrs)+' ชม.',k:'emp:'+p.id,","text:Math.round(p.hrs)+' ชม.',cls:'f-s1'+dimC(p.id),k:'emp:'+p.id,")
rep("text:c.n+' กะ',cls:'f-s3',k:'cover:'+c.id,","text:c.n+' กะ',cls:'f-s3'+dimC(c.id),k:'cover:'+c.id,")
rep("+n+' วัน</button>';}).join('')+'</div></div>'+",
    "+n+' วัน</button>';}).join('')+'</div>'+dashEmpSel()+'</div>'+(dashEmp?'<p class=\"muted small\">กราฟของ <b>'+esc((emp(dashEmp)||{}).name||'')+'</b> · กราฟเปรียบเทียบรายคนและทีมยังแสดงทุกคน โดยเน้นคนที่เลือก</p>':'')+")
rep("+c9+c10+c11+'<section class=\"card\"><h3>ควรติดตาม</h3>","+c9+c10+c11+lvBalCard()+'<section class=\"card\"><h3>ควรติดตาม</h3>")
rep("function pct(a,b){","""function dashEmpSel(){
  var es=byOrder(state.employees.filter(function(e){return canCover(e)||state.attendance.some(function(a){return a.emp===e.id;});}));
  if(dashEmp&&!es.some(function(e){return e.id===dashEmp;}))dashEmp='';
  return '<label class="dsel small"><span>ดูของ</span><select id="dashEmp">'+'<option value="">ทุกคน</option>'+es.map(function(e){return '<option value="'+e.id+'"'+(dashEmp===e.id?' selected':'')+'>'+esc(e.name)+'</option>';}).join('')+'</select></label>';
}
document.addEventListener('change',function(e){if(e.target&&e.target.id==='dashEmp'){dashEmp=e.target.value;renderView(); /* ไม่โฟกัสช่องเลือกซ้ำ: บน iOS จะเปิดรายการขึ้นมาใหม่เอง */}});
function pct(a,b){""")
css="""
/* สถิติ: เลือกคน */
.dsel{display:flex;align-items:center;gap:8px}.dsel select{width:auto;min-width:160px}
.bar.dim{opacity:.22}
"""
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('stats patch ok')
