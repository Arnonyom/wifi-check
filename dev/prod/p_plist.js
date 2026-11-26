/* หน้าพนักงาน (ผู้ดูแล): แต่ละทีมเป็นการ์ดเดียว ข้างในเป็นรายชื่อ (แบบหน้าโปรไฟล์)
   กดชื่อ → ขยาย เห็นสถานะ + ปุ่ม แก้ไข / รีเซ็ตรหัสผ่าน / ลบ · กดคนอื่นสลับ · กดซ้ำ/กดที่อื่น → หุบ
   ยังลากที่ปุ่มจุด ⠿ เพื่อสลับตำแหน่งได้ (ใช้ class pcard/pgrid เดิมของ p_order) */
var pplOpen=null;
function pcard(e){
  var op=pplOpen===e.id;
  var del=armed==='del:'+e.id
    ?'<p class="alert-y small" style="flex-basis:100%;margin:4px 0">ลบแล้วประวัติลงเวลาและการลาของ '+esc(e.name)+' จะหายถาวร ถ้าแค่เลิกใช้งาน ให้กด "แก้ไข" แล้วปิดใช้งานแทน</p><button class="btn danger sm" data-act="del-yes" data-id="'+e.id+'">ยืนยันลบถาวร</button><button class="btn sec sm" data-act="del-no">ยกเลิก</button>'
    :'<button class="btn sec sm" data-act="edit-emp" data-id="'+e.id+'">แก้ไข</button>'+(e.id===me.id?'<button class="btn sec sm" data-act="pw-self">เปลี่ยนรหัสผ่าน</button>':'<button class="btn sec sm" data-act="pw-reset" data-id="'+e.id+'">รีเซ็ตรหัสผ่าน</button><button class="btn sec sm" data-act="del-emp" data-id="'+e.id+'">ลบ</button>');
  var chips='<span class="chip '+(e.active?'':'mute')+'">'+(e.active?'ใช้งาน':'ปิดใช้งาน')+'</span>'+(e.mustChange?'<span class="chip late">รอตั้งรหัสใหม่</span>':'');
  var st=e.role==='staff'&&e.shift?shiftTxt(e):'';
  if(st)chips+='<span class="chip mute tnum">'+st+'</span>';
  if(e.team==='OPS')chips+='<span class="chip mute">ทำแทนได้</span>';
  if(e.role==='admin'&&e.canWork)chips+='<span class="chip mute">ช่วยทำงานได้</span>';
  // แถวที่หุบ: บอกเฉพาะสถานะที่ต้องสนใจ
  var flag=(e.active?'':'<span class="chip mute">ปิดใช้งาน</span>')+(e.mustChange?'<span class="chip late">รอตั้งรหัสใหม่</span>':'');
  return '<div class="pcard prow'+(op?' open':'')+'" data-eid="'+e.id+'">'+
    '<div class="prhd" data-pr="'+e.id+'" role="button" tabindex="0" aria-expanded="'+op+'"><span class="pav sm" aria-hidden="true">'+esc((e.name||'?').trim().charAt(0).toUpperCase())+'</span>'+
    '<span class="grow prnm"><b>'+esc(e.name)+'</b><span class="muted small">'+esc(e.username)+'</span></span>'+(op?'':'<span class="prflag">'+flag+'</span>')+'<span class="pmchev" aria-hidden="true">›</span></div>'+
    '<button type="button" class="dragh" data-drag title="ลากเพื่อย้ายตำแหน่ง" aria-label="ย้ายตำแหน่ง '+esc(e.name)+' (ลาก หรือกดลูกศร)"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor"><circle cx="5.5" cy="3" r="1.5"/><circle cx="10.5" cy="3" r="1.5"/><circle cx="5.5" cy="8" r="1.5"/><circle cx="10.5" cy="8" r="1.5"/><circle cx="5.5" cy="13" r="1.5"/><circle cx="10.5" cy="13" r="1.5"/></svg></button>'+
    (op?'<div class="prx"><div class="row" style="gap:6px;flex-wrap:wrap">'+chips+'</div><div class="row" style="gap:6px;flex-wrap:wrap">'+del+'</div></div>':'')+
  '</div>';
}
function pplToggle(id){
  pplOpen=pplOpen===id?null:id;armed='';renderView();
  var h=document.querySelector('[data-pr="'+id+'"]');if(h&&h.focus)try{h.focus({preventScroll:true});}catch(x){}
}
document.addEventListener('click',function(e){
  if(view!=='people'){pplOpen=null;return;}
  if(pdrag)return;
  var h=e.target.closest&&e.target.closest('[data-pr]');
  if(h){pplToggle(h.getAttribute('data-pr'));return;}
  // กดที่อื่น → หุบ (ยกเว้นปุ่มในแถวที่เปิดอยู่ ฟอร์มแก้ไข และหน้าต่างรหัสผ่าน)
  if(pplOpen&&!e.target.closest('.prow.open,#empEd,#pwbox,.overlay,[data-act="new-emp"]')){pplOpen=null;armed='';renderView();}
});
document.addEventListener('keydown',function(e){
  var h=e.target.closest&&e.target.closest('[data-pr]');
  if(h&&(e.key==='Enter'||e.key===' ')){e.preventDefault();pplToggle(h.getAttribute('data-pr'));}
});
