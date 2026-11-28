/* ถามยืนยันก่อนทุกปุ่ม ส่ง / อนุมัติ / บันทึก (29 พ.ย. 2569)
   - ดักการกดแบบ capture ก่อนตัวจัดการอื่น (ต้องลงทะเบียนก่อน จึงวางไว้ต้นสคริปต์) → แสดงหน้าต่างยืนยัน → กด "ยืนยัน" แล้วกดปุ่มเดิมให้อีกครั้ง
   - askConfirm(ข้อความ) ใช้ตรง ๆ ได้ (คืน Promise true/false) เช่น ส่งคำขอลา: ตรวจข้อมูลก่อน แล้วค่อยถาม
   - ปุ่มที่เป็น "ยืนยัน…" อยู่แล้ว (ลบ ล้างข้อมูล ปรับสิทธิ์ ฯลฯ) ไม่ถามซ้ำ */
var cfPass=false,cfOpen=null;
var CF_ACTS={
  'lv-cancel':function(){return 'ยกเลิกคำขอลานี้?';},
  'lv-approve':function(b){var l=state.leaves.find(function(x){return x.id===b.getAttribute('data-id');}),e=l&&emp(l.emp);return 'อนุมัติ'+(l?LEAVE_TH[l.type]:'การลา')+(e?' ของ '+e.name:'')+(l?' ('+l.days+' วัน)':'')+'?';},
  'save-rules':1,'save-emp':1,'save-slot':1,'save-att':1,'save-days':1,'rota-save':1,'rotab-save':1,'hol-add':1,'apply-csv':1,'flex-save':1,'lvq-def':1,'name-save':1
};
function cfText(b){var t=(b.textContent||'').replace(/\s+/g,' ').trim();return t?'ยืนยัน "'+t+'"?':'ยืนยันการทำรายการนี้?';}
function askConfirm(msg,yes){
  return new Promise(function(res){
    var box=document.getElementById('cfbox');
    if(!box){box=document.createElement('div');box.id='cfbox';document.body.appendChild(box);}
    if(cfOpen)cfOpen(false);
    var back=document.activeElement;
    box.innerHTML='<div class="overlay cfov"><div class="modal cfm" role="alertdialog" aria-modal="true" aria-labelledby="cfT" aria-describedby="cfM">'+
      '<div class="cfic" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/></svg></div>'+
      '<h2 id="cfT">ยืนยันการทำรายการ</h2><p id="cfM">'+esc(msg)+'</p>'+
      '<div class="row cfbtns"><button type="button" class="btn grow" data-cf="yes">'+esc(yes||'ยืนยัน')+'</button><button type="button" class="btn sec" data-cf="no">ยกเลิก</button></div></div></div>';
    var done=function(v){if(cfOpen!==done)return;cfOpen=null;box.innerHTML='';if(!v&&back&&back.isConnected&&back.focus)try{back.focus({preventScroll:true});}catch(x){}res(v);};
    cfOpen=done;
    var y=box.querySelector('[data-cf="yes"]');if(y)try{y.focus({preventScroll:true});}catch(x){}
  });
}
document.addEventListener('click',function(e){
  var c=e.target.closest&&e.target.closest('#cfbox [data-cf], #cfbox .cfov');
  if(c&&cfOpen){e.stopImmediatePropagation();var v=c.getAttribute('data-cf');if(v)cfOpen(v==='yes');else if(e.target===c)cfOpen(false);return;}
  if(cfPass)return;
  var b=e.target.closest&&e.target.closest('[data-act]');if(!b||b.disabled||!me)return;
  var a=b.getAttribute('data-act'),f=CF_ACTS[a];if(!f)return;
  e.stopImmediatePropagation();e.preventDefault();
  var sel='[data-act="'+a+'"]'+(b.getAttribute('data-id')?'[data-id="'+b.getAttribute('data-id')+'"]':'');
  askConfirm(typeof f==='function'?f(b):cfText(b)).then(function(ok){
    if(!ok)return;
    var t=b.isConnected?b:document.querySelector(sel);if(!t)return;
    cfPass=true;try{t.click();}finally{cfPass=false;}
  });
},true);
document.addEventListener('keydown',function(e){if(cfOpen&&e.key==='Escape'){e.stopImmediatePropagation();cfOpen(false);}},true);
// หน้าต่างเปลี่ยน/รีเซ็ตรหัสผ่าน ไม่ถามซ้ำ เพราะปุ่มในหน้าต่างคือ "ยืนยัน" อยู่แล้ว
