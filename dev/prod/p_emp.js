async function saveEmp(){
  if(busy)return;
  var g=$,isNew=editEmp==='new',cur=isNew?null:emp(editEmp);
  var name=g('fName').value.trim(),username=isNew?g('fUser').value.trim().toLowerCase():cur.username,pin=isNew?g('fPin').value:'',pin2=isNew?g('fPin2').value:'',phone=g('fPhone').value.trim();
  var role=g('fRole').value,active=g('fActive').checked,errs=[];
  var team=role==='admin'?null:g('fTeam').value;
  var shift=(role==='admin'||team==='OPS')?null:g('fShift').value;
  var canWork=role==='admin'&&g('fWork').checked;
  if(!name)errs.push('กรอกชื่อ-นามสกุล');
  if(isNew){
    if(!/^[a-z0-9._-]{3,20}$/.test(username))errs.push('ชื่อผู้ใช้ 3–20 ตัว ใช้ a-z 0-9 . _ - เท่านั้น');
    else if(state.employees.some(function(e){return e.username===username;}))errs.push('ชื่อผู้ใช้นี้ถูกใช้แล้ว');
  }
  if(isNew){pwProblems(pin).forEach(function(x){errs.push('รหัสผ่าน: '+x);});if(pin!==pin2)errs.push('รหัสผ่านทั้งสองช่องไม่ตรงกัน');}
  if(role==='staff'&&team!=='OPS'){
    if(!shift)errs.push('เลือกกะประจำ');
    else if(active){
      var holder=state.employees.find(function(e){return e.active&&e.role==='staff'&&e.shift===shift&&(!cur||e.id!==cur.id);});
      if(holder)errs.push('กะนี้มี '+holder.name+' ประจำอยู่แล้ว ย้ายคนนั้นไปกะอื่นก่อน');
    }
  }
  if(cur&&cur.id===me.id&&(role!=='admin'||!active))errs.push('ไม่สามารถลดสิทธิ์หรือปิดใช้งานบัญชีของตัวเอง');
  if(errs.length){g('fErr').textContent=errs.join(' · ');return;}
  var teamTxt=team==='OPS'?'Operation (Daytime)':(team?TEAMS[team].name+' กะ '+shiftLabel(shiftById(shift)):'ผู้ดูแล');
  busy=true;g('fErr').textContent='';
  try{
    if(isNew){
      var r=await adminFn({action:'create',username:username,password:pin,name:name,role:role,team:team,shift_id:shift,phone:phone,can_work:canWork});
      if(!active&&r&&r.id){var u0=await sb.from('profiles').update({active:false}).eq('id',r.id);if(u0.error)throw u0.error;}
    }else{
      var ch=[];
      if(cur.name!==name)ch.push('ชื่อ');
      if(cur.team!==team||cur.shift!==shift)ch.push('ทีม/กะประจำ เป็น '+teamTxt);
      if(cur.active!==active)ch.push(active?'เปิดใช้งานบัญชี':'ปิดใช้งานบัญชี');
      if(!!cur.canWork!==canWork)ch.push(canWork?'เปิดสิทธิ์ช่วยทำงานแทน':'ปิดสิทธิ์ช่วยทำงานแทน');
      if(cur.role!==role)ch.push('บทบาท');
      var u=await sb.from('profiles').update({name:name,role:role,team:team,shift_id:shift,phone:phone,active:active,can_work:canWork}).eq('id',cur.id).select('id');
      if(u.error)throw u.error;
      if(!u.data||!u.data.length)throw new Error('บันทึกไม่สำเร็จ (ไม่มีสิทธิ์แก้ไข)');
      if(ch.length)notify([cur.id,me.id],'แก้ไขโปรไฟล์','ผู้ดูแลแก้ไขข้อมูล '+name+': '+ch.join(', '));
    }
    editEmp=null;await loadAll();busy=false;renderAll();
  }catch(e){busy=false;var er=$('fErr');if(er)er.textContent=errMsg(e);}
}
async function deleteEmp(id){
  var e=emp(id);if(!e||e.id===me.id||busy)return;
  busy=true;
  try{
    await adminFn({action:'delete',id:id});
    notify([me.id],'ลบพนักงาน','ลบโปรไฟล์ '+e.name+' แล้ว (ประวัติลงเวลาและรายการลาของคนนี้ถูกลบด้วย)');
    armed='';await loadAll();
  }catch(er){armed='';flash=null;toast('ลบไม่สำเร็จ',errMsg(er),'warn');}
  busy=false;renderAll();
}

