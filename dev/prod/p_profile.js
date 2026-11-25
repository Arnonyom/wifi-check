/* หน้าโปรไฟล์ (เปิดจากปุ่มรูปคนมุมขวาบน): ข้อมูลของฉัน · สมาชิกในทีม · เปลี่ยนรหัสผ่าน · ภาษา · (ผู้ดูแล) ตั้งค่าระบบ
   ไม่แสดงกะประจำ เพราะทีม A หมุนกะทุกสัปดาห์ และทีม B สลับกะทุก 2 สัปดาห์ */
function teamMembers(e){
  var same=state.employees.filter(function(x){
    if(!x.active)return false;
    return e.role==='admin'?x.role==='admin':(x.role==='staff'&&x.team===e.team);
  });
  return byOrder(same);
}
function viewProfile(){
  var e=me,isAdm=e.role==='admin',T0=isAdm?null:TEAMS[e.team];
  var ini=esc((e.name||'?').trim().charAt(0).toUpperCase());
  var mem=teamMembers(e);
  var rows=mem.map(function(x){
    return '<div class="li pmem"><span class="pav sm" aria-hidden="true">'+esc((x.name||'?').trim().charAt(0).toUpperCase())+'</span><span class="grow"><b>'+esc(x.name)+'</b><br><span class="muted small">'+esc(x.username)+'</span></span>'+
      (x.id===e.id?'<span class="chip">คุณ</span>':'')+'</div>';
  }).join('')||'<p class="muted small" style="padding:10px 0">ยังไม่มีสมาชิกคนอื่น</p>';
  var go='<span class="go" aria-hidden="true">›</span>';
  return '<div class="stack"><h1>โปรไฟล์</h1>'+
    '<section class="card stack"><div class="phd"><span class="pav" aria-hidden="true">'+ini+'</span><div class="grow"><h2>'+esc(e.name)+'</h2><p class="muted">'+esc(e.username)+'</p></div></div>'+
    '<dl class="kv">'+
      '<div><dt>บทบาท</dt><dd>'+(isAdm?'ผู้ดูแลระบบ':'พนักงาน')+'</dd></div>'+
      (isAdm?'':'<div><dt>ทีม</dt><dd>'+esc(T0.name)+'<br><span class="muted small">'+esc(T0.dayText)+'</span></dd></div>')+
      (isAdm?'<div><dt>ช่วยทำงานแทน</dt><dd>'+(e.canWork?'ได้':'ไม่ได้')+'</dd></div>':'')+
      '<div><dt>สถานะบัญชี</dt><dd>ใช้งาน</dd></div>'+
    '</dl></section>'+
    '<section class="card"><h2>'+(isAdm?'ผู้ดูแลระบบ':'สมาชิกในทีม')+' <span class="muted small">'+mem.length+' คน</span></h2><div class="list">'+rows+'</div></section>'+
    '<section class="card stack"><h2>ตั้งค่า</h2><div class="list">'+
      '<button class="li lib" data-act="pw-self"><span class="grow"><b>เปลี่ยนรหัสผ่าน</b><br><span class="muted small">ตั้งรหัสผ่านใหม่สำหรับเข้าสู่ระบบ</span></span>'+go+'</button>'+
      (isAdm?'<button class="li lib" data-act="tab" data-v="settings"><span class="grow"><b>ตั้งค่าระบบ</b><br><span class="muted small">การหมุนกะ กฎการลงเวลา นำเข้า/ส่งออกตารางกะ และทดสอบเข้า-ออกงาน</span></span>'+go+'</button>':'')+
    '</div><div class="plang">'+langRow()+'</div></section></div>';
}
