# แก้บั๊กจากการตรวจ (พ.ย. 2569)
# 1) ลืมออกงาน: กะที่ค้างเกิน 12 ชม. หลังเลิกกะไม่บล็อกการเข้างานกะใหม่ (ตรงกับ check_in ใหม่ในฐานข้อมูล)
#    และหน้าลงเวลาเตือนพนักงานให้แจ้งผู้ดูแลลงเวลาออกให้
# 2) รายงานตามช่วงวันที่ ไม่นับวันก่อนเริ่มมีข้อมูลเป็น "ไม่มีบันทึก"
# 3) ลบพนักงาน: เตือนก่อนว่าประวัติจะหายถาวร แนะนำให้ปิดใช้งานแทน
# 4) ข้อความแจ้งเตือน Push ให้ตรงกับที่ทำได้จริง (เด้งเฉพาะตอนเปิดแอปอยู่)
# 5) ผู้ดูแลยกเลิกการลาที่อนุมัติแล้วได้ (ก่อนวันเริ่มลา) ผ่าน admin_cancel_leave
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)

# --- 1) ลืมออกงาน
STALE="endTs(a.date,shiftById(a.shift))+12*3600000"
# สถานการณ์ทดสอบ (ทดสอบเข้า-ออกงาน) ใช้กฎเดียวกับเซิร์ฟเวอร์ใหม่
rep("var openRec=state.attendance.find(function(a){return a.emp===e.id&&!a.out&&!(a.date===d&&a.shift===s.id);});",
    "var openRec=state.attendance.find(function(a){return a.emp===e.id&&!a.out&&!(a.date===d&&a.shift===s.id)&&"+STALE+">t;});")
# การ์ดลงเวลา: เตือนกะที่ลืมออก (ย้อนหลัง 14 วัน)
rep("""  var f=flash;flash=null;
  return '<section class="card hero">""",
"""  var f=flash;flash=null;
  var stale=state.attendance.filter(function(a){return a.emp===me.id&&!a.out&&"""+STALE+"""<=t&&a.date>=addDays(today,-14);});
  var staleHtml=stale.length?'<p class="alert-y" style="margin-top:8px" role="status">ยังไม่ได้ลงเวลาออก: '+stale.map(function(a){return esc(dayShort(a.date))+' กะ '+shiftLabel(shiftById(a.shift));}).join(', ')+' · แจ้งผู้ดูแลให้ลงเวลาออกให้ (ลงเวลาเข้างานกะใหม่ได้ตามปกติ)</p>':'';
  return '<section class="card hero">""")
rep("""    (f?'<p class="center '+(f.warn?'alert-y':'ok')+'" style="margin-top:8px" role="status">'+esc(f.t)+'</p>':'')+
    '<p class="center muted small" style="margin-top:8px">เปิดให้ลงเวลาก่อนเริ่มกะ""",
"""    (f?'<p class="center '+(f.warn?'alert-y':'ok')+'" style="margin-top:8px" role="status">'+esc(f.t)+'</p>':'')+staleHtml+
    '<p class="center muted small" style="margin-top:8px">เปิดให้ลงเวลาก่อนเริ่มกะ""")

# --- 2) รายงาน: ข้ามวันก่อนเริ่มมีข้อมูล
rep("""  for(var d=R.t;d>=R.f;d=addDays(d,-1)){
    SHIFTS.forEach(function(s){
      if(rep.team&&s.team!==rep.team)return;""",
"""  var d0=dataStart();
  for(var d=R.t;d>=R.f&&d>=d0;d=addDays(d,-1)){
    SHIFTS.forEach(function(s){
      if(rep.team&&s.team!==rep.team)return;""")
rep("""(R.cut?'<p class="alert-y">แสดงสูงสุด 93 วันต่อครั้ง ตัดช่วงให้อัตโนมัติ</p>':'')+'</section>'+""",
    """(R.cut?'<p class="alert-y">แสดงสูงสุด 93 วันต่อครั้ง ตัดช่วงให้อัตโนมัติ</p>':'')+(R.f<dataStart()?'<p class="muted small">ข้อมูลลงเวลาเริ่มวันที่ '+esc(sd(dataStart()))+' วันก่อนหน้านั้นจึงไม่แสดงในรายงาน</p>':'')+'</section>'+""")

# --- 3) ลบพนักงาน: เตือนก่อน
rep("""?'<button class="btn danger sm" data-act="del-yes" data-id="'+e.id+'">ยืนยันลบ</button><button class="btn sec sm" data-act="del-no">ยกเลิก</button>'""",
    """?'<p class="alert-y small" style="flex-basis:100%;margin:4px 0">ลบแล้วประวัติลงเวลาและการลาของ '+esc(e.name)+' จะหายถาวร ถ้าแค่เลิกใช้งาน ให้กด "แก้ไข" แล้วปิดใช้งานแทน</p><button class="btn danger sm" data-act="del-yes" data-id="'+e.id+'">ยืนยันลบถาวร</button><button class="btn sec sm" data-act="del-no">ยกเลิก</button>'""")

# --- 4) ข้อความ Push
rep("""<p class="muted small">เมื่อนำเว็บขึ้นใช้งานจริง (GitHub Pages + Supabase) และผู้ใช้กด "เพิ่มลงหน้าจอโฮม" ระบบจะส่งแจ้งเตือนเข้าเครื่องได้แม้ปิดเว็บอยู่ ในต้นแบบนี้ทดสอบได้เฉพาะแจ้งเตือนที่เด้งในหน้าเว็บ (กระดิ่งและป๊อปอัป) ผู้ใช้เปิด/ปิดได้ที่สวิตช์ในกระดิ่ง</p>""",
    """<p class="muted small">ตอนนี้แจ้งเตือนจะเด้งเฉพาะตอนเปิดเว็บหรือแอปค้างไว้ (กระดิ่ง ป๊อปอัป และแจ้งเตือนของเครื่องถ้าเปิดสวิตช์ไว้) ถ้าปิดแอปไปแล้วจะยังไม่ได้รับ เพราะยังไม่มีระบบส่ง Push เบื้องหลัง · ผู้ใช้เปิด/ปิดได้ที่สวิตช์ในกระดิ่ง</p>""")
rep("swRow('bell-push',!!me.push,'แจ้งเตือนบนอุปกรณ์ (Push)')","swRow('bell-push',!!me.push,'แจ้งเตือนของเครื่อง (ขณะเปิดแอป)')")

# --- 5) ยกเลิกการลาที่อนุมัติแล้ว (ผู้ดูแล)
rep("""    var act=l.status==='pending'&&!lvOpen&&!lvReject?""",
    """    if(l.status==='approved'&&l.from>=bkk(now()).date&&!lvOpen&&!lvReject){
      panel=armed==='lvc:'+l.id
        ?'<div class="stack" style="margin-top:8px"><p class="alert-y small">ยกเลิกการลานี้? ผู้ทำแทนจะถูกเอาออกจากตาราง และ '+esc(fn(e))+' ต้องมาทำงานตามกะเดิม (ระบบแจ้งทั้งสองฝ่าย)</p><div class="row"><button class="btn danger sm" data-act="lv-adm-cancel-yes" data-id="'+l.id+'">ยืนยันยกเลิกการลา</button><button class="btn sec sm" data-act="del-no">ไม่ยกเลิก</button></div></div>'
        :'<div class="row" style="margin-top:8px"><button class="btn sec sm" data-act="lv-adm-cancel" data-id="'+l.id+'">ยกเลิกการลา</button></div>';
    }
    var act=l.status==='pending'&&!lvOpen&&!lvReject?""")
rep("""    case 'del-yes':deleteEmp(D.id);break;""",
    """    case 'del-yes':deleteEmp(D.id);break;
    case 'lv-adm-cancel':armed='lvc:'+D.id;renderView();break;
    case 'lv-adm-cancel-yes':
      if(busy)break;busy=true;
      rpc('admin_cancel_leave',{p_id:D.id,p_note:''}).then(function(){armed='';toast('ยกเลิกการลาแล้ว','เอาผู้ทำแทนออกจากตารางและแจ้งพนักงานแล้ว');return loadAll();}).then(function(){busy=false;renderAll();},function(er){busy=false;armed='';toast('ยกเลิกไม่สำเร็จ',errMsg(er),'warn');renderView();});
      break;""")
open(S+'app_src.html','w',encoding='utf-8').write(s);print('fix patch ok')
