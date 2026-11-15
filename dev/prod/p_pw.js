/* ---------- รหัสผ่าน: กฎ / เปลี่ยนเอง / ผู้ดูแลรีเซ็ต / บังคับเปลี่ยน ---------- */
var pwm=null,lastPw='';
var PW_RULE='อย่างน้อย 8 ตัว ใช้ได้ทั้งตัวอักษรภาษาอังกฤษตัวเล็ก ตัวใหญ่ ตัวเลข และอักขระพิเศษ เช่น ! @ # $ % _ - (ห้ามมีช่องว่างหรือภาษาไทย)';
function pwProblems(p){
  var out=[];
  if(p.length<8)out.push('ยาวอย่างน้อย 8 ตัว (ตอนนี้ '+p.length+')');
  if(p.length>72)out.push('ยาวไม่เกิน 72 ตัว');
  if(p&&!/^[\x21-\x7E]*$/.test(p))out.push('ใช้ได้เฉพาะ A–Z a–z 0–9 และอักขระพิเศษ (ห้ามช่องว่าง/ภาษาไทย)');
  return out;
}
function pwStrength(p){var k=0;if(/[a-z]/.test(p))k++;if(/[A-Z]/.test(p))k++;if(/\d/.test(p))k++;if(/[^A-Za-z0-9]/.test(p))k++;if(p.length>=12)k++;return k;}
function pwField(id,label,ac){
  return '<div><label for="'+id+'">'+label+'</label><div class="pwrow"><input id="'+id+'" type="password" maxlength="72" autocomplete="'+(ac||'new-password')+'" autocapitalize="none" spellcheck="false"><button type="button" class="iconbtn pweye" data-act="pw-eye" data-id="'+id+'" aria-label="แสดงรหัสผ่าน">👁</button></div></div>';
}
function pwFormHtml(o){
  return (o.current?pwField('pwCur','รหัสผ่านปัจจุบัน','current-password'):'')+
    pwField('pwNew',o.newLabel||'รหัสผ่านใหม่')+
    '<ul class="pwchk" id="pwChk" aria-live="polite"><li data-k="len">อย่างน้อย 8 ตัว</li><li data-k="chr">เฉพาะ A–Z a–z 0–9 และอักขระพิเศษ</li><li data-k="mat">ยืนยันรหัสตรงกัน</li></ul><div class="pwbar" aria-hidden="true"><i id="pwBar"></i></div>'+
    pwField('pwNew2','ยืนยันรหัสผ่านใหม่อีกครั้ง')+
    '<p class="muted small">'+PW_RULE+'</p><div class="err" id="pwErr" role="alert"></div>';
}
function pwLive(){
  var a=$('pwNew'),b=$('pwNew2'),c=$('pwChk');if(!a||!c)return;
  var p=a.value,q=b?b.value:'';
  var st={len:p.length>=8&&p.length<=72,chr:p.length>0&&/^[\x21-\x7E]*$/.test(p),mat:p.length>0&&p===q};
  Array.prototype.forEach.call(c.children,function(li){li.className=st[li.dataset.k]?'on':'';});
  var bar=$('pwBar');if(bar){var s=p?pwStrength(p):0;bar.style.width=(s*20)+'%';bar.className='s'+s;}
}
function pwValues(needCur){
  var cur=needCur?$('pwCur').value:'',p=$('pwNew').value,q=$('pwNew2').value,errs=pwProblems(p);
  if(needCur&&!cur)errs.unshift('กรอกรหัสผ่านปัจจุบัน');
  if(p!==q)errs.push('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน');
  if(needCur&&cur&&p===cur)errs.push('รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม');
  return {cur:cur,p:p,errs:errs};
}
function renderPw(){
  var box=$('pwbox');if(!box)return;
  if(!pwm||!me){box.innerHTML='';return;}
  var t=pwm.mode==='reset'?emp(pwm.id):me,isReset=pwm.mode==='reset';
  box.innerHTML='<div class="overlay" data-act="pw-bg"><form class="modal" id="pwForm" role="dialog" aria-modal="true" aria-labelledby="pwTitle" autocomplete="off">'+
    '<h2 id="pwTitle">'+(isReset?'รีเซ็ตรหัสผ่าน':'เปลี่ยนรหัสผ่าน')+'</h2>'+
    '<dl class="kv"><div><dt>ชื่อ</dt><dd>'+esc(t?t.name:'—')+'</dd></div><div><dt>ชื่อผู้ใช้</dt><dd class="tnum"><b>'+esc(t?t.username:'—')+'</b></dd></div></dl>'+
    pwFormHtml({current:!isReset})+
    (isReset?'<p class="alert-y">รหัสนี้เป็นรหัสชั่วคราว เมื่อ '+esc(t?fn(t):'')+' ล็อกอินครั้งถัดไป ระบบจะให้ตั้งรหัสใหม่ของตัวเองทันที</p>':'')+
    '<div class="row"><button class="btn grow" type="submit" id="pwOk">ยืนยัน</button><button class="btn sec" type="button" data-act="pw-close">ยกเลิก</button></div></form></div>';
  var f=$(isReset?'pwNew':'pwCur');if(f)f.focus();
}
async function submitPw(){
  if(busy||!pwm)return;
  var isReset=pwm.mode==='reset',v=pwValues(!isReset),er=$('pwErr'),btn=$('pwOk');
  if(v.errs.length){er.textContent=v.errs.join(' · ');return;}
  busy=true;btn.disabled=true;er.textContent='';
  try{
    if(isReset){
      var t=emp(pwm.id);
      await adminFn({action:'set_password',id:pwm.id,password:v.p});
      pwm=null;busy=false;renderPw();await loadAll();renderAll();
      toast('รีเซ็ตรหัสผ่านแล้ว',(t?t.name+' ('+t.username+')':'')+' ต้องตั้งรหัสใหม่เมื่อล็อกอินครั้งถัดไป');
    }else{
      await adminFn({action:'change_own',current:v.cur,password:v.p});
      await sb.auth.signInWithPassword({email:me.username+'@'+(CFG.USER_DOMAIN||'wifi-check.app'),password:v.p});
      pwm=null;busy=false;renderPw();toast('เปลี่ยนรหัสผ่านแล้ว','ครั้งหน้าให้ใช้รหัสผ่านใหม่ในการล็อกอิน');
    }
  }catch(e){busy=false;if(btn)btn.disabled=false;if(er)er.textContent=errMsg(e);}
}
/* หน้าบังคับตั้งรหัสใหม่ (บัญชีที่ใช้รหัสชั่วคราวหรือรหัสแบบเก่า) */
function viewForcePw(){
  return '<div class="login-wrap" style="grid-template-columns:minmax(0,460px)"><form class="card hero stack" id="forceForm" autocomplete="off">'+
    '<h1>ตั้งรหัสผ่านใหม่</h1><p class="muted">สวัสดี '+esc(me.name)+' (<b>'+esc(me.username)+'</b>) ก่อนใช้งานต่อ กรุณาตั้งรหัสผ่านใหม่ของคุณเอง</p>'+
    pwFormHtml({current:!lastPw})+
    '<button class="btn" type="submit" id="pwOk">ยืนยันและเข้าสู่ระบบ</button><button class="btn sec" type="button" data-act="logout">ออกจากระบบ</button></form></div>';
}
async function submitForce(){
  if(busy)return;
  var v=pwValues(!lastPw),er=$('pwErr'),btn=$('pwOk');
  var cur=lastPw||v.cur;
  if(lastPw&&v.p===lastPw)v.errs.push('รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม');
  if(v.errs.length){er.textContent=v.errs.join(' · ');return;}
  busy=true;btn.disabled=true;er.textContent='';
  try{
    await adminFn({action:'change_own',current:cur,password:v.p});
    var r=await sb.auth.signInWithPassword({email:me.username+'@'+(CFG.USER_DOMAIN||'wifi-check.app'),password:v.p});
    lastPw='';busy=false;
    await enter(r&&r.data&&r.data.user?r.data.user.id:me.id);
    toast('ตั้งรหัสผ่านใหม่แล้ว','ครั้งหน้าให้ใช้รหัสผ่านใหม่ในการล็อกอิน');
  }catch(e){busy=false;if(btn)btn.disabled=false;if(er)er.textContent=errMsg(e);}
}
document.addEventListener('input',function(e){if(e.target&&(e.target.id==='pwNew'||e.target.id==='pwNew2'))pwLive();});
document.addEventListener('submit',function(e){
  if(e.target.id==='pwForm'){e.preventDefault();submitPw();}
  else if(e.target.id==='forceForm'){e.preventDefault();submitForce();}
});
