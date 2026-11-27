/* ---------- ทีม A: หมุน 4 กะรายสัปดาห์ · ทีม B: รอบ 2 สัปดาห์ · กะฉุกเฉิน 19.00–04.00 ---------- */
var ROT=['A2','A3','A4','A1'],rotaEdit=false,rotaWeek=null,rotaBEdit=false,rotaBStart=null;
function rotaAt(S,d){
  var m=mondayOf(d),best=null;
  (S&&S.rota||[]).forEach(function(r){if(r.week<=m&&(!best||r.week>best.week))best=r;});
  return best&&best.active?best:null;
}
function rotaK(r,d){return Math.round((Date.parse(mondayOf(d))-Date.parse(r.week))/(7*864e5));}
function rotaBAt(S,d){
  var best=null;(S&&S.rotaB||[]).forEach(function(r){if(r.start<=d&&(!best||r.start>best.start))best=r;});
  return best&&best.active?best:null;
}
function rotaBOff(r,d){return Math.round((Date.parse(d)-Date.parse(r.start))/864e5);}
/* วันทำงานของทีม */
function teamWorksS(S,team,d){
  if(team==='A')return [1,2,3,4,5].indexOf(dowOf(d))>=0&&!(S&&S.holidays&&S.holidays[d]); // ทีม A หยุดวันหยุดราชการ/นักขัตฤกษ์
  if(team!=='B')return false;
  var r=rotaBAt(S,d);if(!r)return [5,6,0,1].indexOf(dowOf(d))>=0;
  return [0,1,2,3,7,8,9].indexOf(((rotaBOff(r,d)%14)+14)%14)>=0;
}
function teamDayIdx(team,d){return teamWorksS(state,team,d)?0:-1;}
function teamDayText(id){
  if(id==='B'&&rotaBAt(state,bkk(now()).date))return 'ศ.–จ. สลับ ศ.–อา. (รอบ 2 สัปดาห์)';
  return TEAMS[id]?TEAMS[id].dayText:'';
}
function isRotating(e){var t=bkk(now()).date,r=rotaAt(state,t),b=rotaBAt(state,t);return !!(e&&((r&&r.ids.indexOf(e.id)>=0)||(b&&(b.day===e.id||b.night===e.id))));}
/* กะที่คนนี้ทำในวันที่ d */
function shiftOnS(S,e,d){
  if(!e)return null;
  if(e.team==='B'||e.shift==='B1'||e.shift==='B2'){
    var b=rotaBAt(S,d);if(!b)return e.shift;
    var c=Math.floor(rotaBOff(b,d)/14)%2;
    if(e.id===b.day)return c===0?'B1':'B2';
    if(e.id===b.night)return c===0?'B2':'B1';
    return (e.shift==='B1'||e.shift==='B2')?null:e.shift;
  }
  var r=rotaAt(S,d);if(!r)return e.shift;
  var n=r.cyc,sh=ROT.slice(0,n),ids=r.ids.slice(0,n),i=ids.indexOf(e.id);
  if(i<0)return sh.indexOf(e.shift)>=0?null:e.shift;
  return sh[((i+rotaK(r,d))%n+n)%n];
}
/* ผู้ประจำกะ */
function regularOfS(S,d,s){
  if(s.flex)return null;
  var find=function(id){return S.employees.find(function(e){return e.id===id&&e.active&&e.role==='staff';})||null;};
  if(s.id==='B1'||s.id==='B2'){
    var b=rotaBAt(S,d);
    if(b){var c=Math.floor(rotaBOff(b,d)/14)%2;return find((s.id==='B1')===(c===0)?b.day:b.night);}
    return S.employees.find(function(e){return e.active&&e.role==='staff'&&e.shift===s.id;})||null;
  }
  var r=rotaAt(S,d);
  if(r){
    var n=r.cyc,ids=r.ids.slice(0,n),j=ROT.slice(0,n).indexOf(s.id);
    if(j>=0)return find(ids[((j-rotaK(r,d))%n+n)%n]);
    return S.employees.find(function(e){return e.active&&e.role==='staff'&&e.shift===s.id&&ids.indexOf(e.id)<0;})||null;
  }
  return S.employees.find(function(e){return e.active&&e.role==='staff'&&e.shift===s.id;})||null;
}
function shiftOn(e,d){return shiftOnS(state,e,d);}
function shiftTxt(e,d){
  var sid=shiftOn(e,d||bkk(now()).date);
  if(!sid)return isRotating(e)?'หมุนกะ · สัปดาห์นี้ไม่มีกะ':'';
  return (isRotating(e)?'หมุนกะ · ตอนนี้ ':'กะ ')+shiftLabel(shiftById(sid));
}
function wkRange(m){return esc(thDate(m,{day:'numeric',month:'short'}))+' – '+esc(thDate(addDays(m,4),{day:'numeric',month:'short'}));}
function rotaCard(){
  var today=bkk(now()).date,mon=mondayOf(today),a=rotaAt(state,today),fut=(state.rota||[]).filter(function(r){return r.week>mon&&r.active;}).sort(function(x,y){return x.week<y.week?-1:1;})[0];
  var teamA=state.employees.filter(function(e){return e.active&&e.role==='staff'&&e.team==='A';});
  if(rotaWeek===null)rotaWeek=fut?fut.week:(a?addDays(mon,7):mon);
  var cur=ROT.map(function(sid){var sl=slot(rotaWeek,shiftById(sid));return sl&&sl.regular?sl.regular.id:'';});
  var head='<h2>การหมุนกะทีม A</h2><p class="muted small">ทุกคนเวียนครบ 4 กะ เปลี่ยนทุกวันจันทร์: 10.00 → 18.00 → 23.30 → 08.30 → กลับมา 10.00 (ครบรอบ 4 สัปดาห์) · กะ 08.30 เปลี่ยนเป็น 19.00–04.00 รายวันได้ที่หน้าตารางกะ</p>';
  var weeks=[];for(var i=0;i<8;i++)weeks.push(addDays(mon,7*i));
  var rows=weeks.map(function(m,i){return '<tr'+(i===0?' class="today"':'')+'><td class="tnum">'+wkRange(m)+(i===0?' <span class="chip">สัปดาห์นี้</span>':'')+'</td>'+ROT.map(function(sid){var sl=slot(m,shiftById(sid));var p=sl&&sl.regular;return '<td>'+(p?esc(p.name):'<span class="muted">ว่าง</span>')+'</td>';}).join('')+'</tr>';}).join('');
  var table='<div class="scroll"><table><thead><tr><th>สัปดาห์</th>'+ROT.map(function(sid){return '<th>'+shiftLabel(shiftById(sid))+'</th>';}).join('')+'</tr></thead><tbody>'+rows+'</tbody></table></div>';
  var status=a||fut?'<p>'+(a?'เปิดการหมุนกะอยู่':'ยังไม่เริ่ม')+(fut?' · รอบใหม่เริ่ม <b>'+esc(thDate(fut.week,{weekday:'long',day:'numeric',month:'long',year:'numeric'}))+'</b>':'')+'</p>':'<p class="alert-y">ยังไม่ได้เปิดการหมุนกะ ตอนนี้ทุกคนอยู่กะเดิมทุกสัปดาห์</p>';
  if(!rotaEdit)return '<section class="card stack">'+head+status+'<h3>8 สัปดาห์ข้างหน้า</h3>'+table+'<div class="row"><button class="btn'+(a||fut?' sec':'')+'" data-act="rota-edit">'+(a||fut?'แก้ไขการหมุนกะ':'ตั้งการหมุนกะ')+'</button>'+(a||fut?'<button class="btn sec" data-act="rota-off">ปิดการหมุนกะ</button>':'')+'</div><div class="err" id="rotaErr" role="alert"></div></section>';
  var opt=function(sel){return '<option value="">— ว่าง —</option>'+teamA.map(function(e){return '<option value="'+e.id+'"'+(e.id===sel?' selected':'')+'>'+esc(e.name)+'</option>';}).join('');};
  return '<section class="card stack" id="rotaEd">'+head+
    '<div class="fields"><div><label for="rotaStart">เริ่มใช้ตั้งแต่สัปดาห์</label><select id="rotaStart">'+weeks.map(function(m,i){return '<option value="'+m+'"'+(m===rotaWeek?' selected':'')+'>'+wkRange(m)+(i===0?' (สัปดาห์นี้)':'')+'</option>';}).join('')+'</select></div></div>'+
    '<p>เลือกว่าในสัปดาห์เริ่มต้นใครอยู่กะไหน สัปดาห์ต่อไประบบหมุนให้อัตโนมัติ · สัปดาห์ก่อนหน้ายังเป็นแบบเดิม ไม่กระทบประวัติ</p>'+
    '<div class="fields">'+ROT.map(function(sid,i){return '<div><label for="rota'+i+'">กะ '+shiftLabel(shiftById(sid))+'</label><select id="rota'+i+'">'+opt(cur[i])+'</select></div>';}).join('')+'</div>'+
    '<p class="muted small">ตารางที่เคยตั้งหยุด/ทำแทนไว้ยังอยู่เหมือนเดิม</p>'+
    '<div class="err" id="rotaErr" role="alert"></div><div class="row"><button class="btn" data-act="rota-save">บันทึกการหมุนกะ</button><button class="btn sec" data-act="rota-cancel">ยกเลิก</button></div></section>';
}
async function saveRota(off){
  if(busy)return;var er=$('rotaErr');
  var ids=off?[null,null,null,null]:[0,1,2,3].map(function(i){return $('rota'+i).value||null;});
  var picked=ids.filter(Boolean);
  if(!off&&picked.length!==new Set(picked).size){er.textContent='เลือกคนซ้ำกันไม่ได้';return;}
  if(!off&&!picked.length){er.textContent='เลือกอย่างน้อย 1 คน';return;}
  busy=true;er.textContent='';
  try{
    await rpc('set_rotation',{p_week:off?null:rotaWeek,p_a2:ids[0],p_a3:ids[1],p_a4:ids[2],p_a1:ids[3]});
    rotaEdit=false;rotaWeek=null;await loadAll();busy=false;renderAll();
    toast(off?'ปิดการหมุนกะแล้ว':'บันทึกการหมุนกะแล้ว',off?'ทุกคนจะอยู่กะเดิมทุกสัปดาห์':'ตารางกะหมุนให้อัตโนมัติทุกวันจันทร์');
  }catch(e){busy=false;er=$('rotaErr');if(er)er.textContent=errMsg(e);}
}
/* ทีม B */
function nextFridays(n){var t=bkk(now()).date,d=t;while(dowOf(d)!==5)d=addDays(d,1);var out=[];for(var i=0;i<n;i++)out.push(addDays(d,7*i));return out;}
function rotaBCard(){
  var today=bkk(now()).date,b=rotaBAt(state,today),fut=(state.rotaB||[]).filter(function(r){return r.start>today&&r.active;}).sort(function(x,y){return x.start<y.start?-1:1;})[0];
  var teamB=state.employees.filter(function(e){return e.active&&e.role==='staff'&&e.team==='B';});
  var fr=nextFridays(10);
  if(rotaBStart===null)rotaBStart=fut?fut.start:fr[0];
  var head='<h2>รอบทำงานทีม B</h2><p class="muted small">ทำ ศ.–จ. (ทำ 4 หยุด 3) สลับกับ ศ.–อา. (ทำ 3 หยุด 4) · 2 คนทำวันเดียวกัน คนหนึ่งกะ 07.00–19.00 อีกคน 19.00–07.00 · สลับกะทุก 2 สัปดาห์</p>';
  var blocks=[],seen={};
  for(var d=mondayOf(today),k=0;k<70&&blocks.length<8;k++,d=addDays(d,1)){
    if(!teamWorksS(state,'B',d)||dowOf(d)!==5)continue;
    var days=[];for(var x=d;teamWorksS(state,'B',x)&&days.length<4;x=addDays(x,1))days.push(x);
    var s1=slot(d,shiftById('B1')),s2=slot(d,shiftById('B2'));
    blocks.push('<tr><td class="tnum">'+esc(thDate(days[0],{day:'numeric',month:'short'}))+' – '+esc(thDate(days[days.length-1],{weekday:'short',day:'numeric',month:'short'}))+' <span class="chip mute">'+days.length+' วัน</span></td><td>'+(s1&&s1.regular?esc(s1.regular.name):'<span class="muted">ว่าง</span>')+'</td><td>'+(s2&&s2.regular?esc(s2.regular.name):'<span class="muted">ว่าง</span>')+'</td></tr>');
  }
  var table='<div class="scroll"><table><thead><tr><th>ช่วงทำงาน</th><th>07.00–19.00</th><th>19.00–07.00</th></tr></thead><tbody>'+blocks.join('')+'</tbody></table></div>';
  var status=b||fut?'<p>'+(b?'ใช้รอบ 2 สัปดาห์อยู่':'ตอนนี้ยังทำ ศ.–จ. ทุกสัปดาห์')+(fut?' · รอบใหม่เริ่ม <b>'+esc(thDate(fut.start,{weekday:'long',day:'numeric',month:'long',year:'numeric'}))+'</b>':'')+'</p>':'<p class="alert-y">ยังไม่ได้ตั้งรอบ ตอนนี้ทีม B ทำ ศ.–จ. ทุกสัปดาห์ และอยู่กะเดิม</p>';
  if(!rotaBEdit)return '<section class="card stack">'+head+status+'<h3>ช่วงทำงานข้างหน้า</h3>'+table+'<div class="row"><button class="btn'+(b||fut?' sec':'')+'" data-act="rotab-edit">'+(b||fut?'แก้ไขรอบทีม B':'ตั้งรอบทีม B')+'</button></div><div class="err" id="rotaBErr" role="alert"></div></section>';
  var cd=b||fut,curDay=cd?cd.day:'',curNight=cd?cd.night:'';
  if(!cd){var e1=teamB.find(function(e){return e.shift==='B1';}),e2=teamB.find(function(e){return e.shift==='B2';});curDay=e1?e1.id:'';curNight=e2?e2.id:'';}
  var opt=function(sel){return '<option value="">— ว่าง —</option>'+teamB.map(function(e){return '<option value="'+e.id+'"'+(e.id===sel?' selected':'')+'>'+esc(e.name)+'</option>';}).join('');};
  return '<section class="card stack" id="rotaBEd">'+head+
    '<div class="fields"><div><label for="rotaBStart">เริ่มรอบวันศุกร์ (ทำ 4 วันก่อน)</label><select id="rotaBStart">'+fr.map(function(f){return '<option value="'+f+'"'+(f===rotaBStart?' selected':'')+'>'+esc(thDate(f,{weekday:'short',day:'numeric',month:'short',year:'numeric'}))+'</option>';}).join('')+'</select></div>'+
    '<div><label for="rotaBDay">กะ 07.00–19.00 ใน 2 สัปดาห์แรก</label><select id="rotaBDay">'+opt(curDay)+'</select></div><div><label for="rotaBNight">กะ 19.00–07.00 ใน 2 สัปดาห์แรก</label><select id="rotaBNight">'+opt(curNight)+'</select></div></div>'+
    '<p class="muted small">ก่อนวันเริ่มรอบยังเป็นแบบเดิม (ศ.–จ. ทุกสัปดาห์) ไม่กระทบประวัติ</p>'+
    '<div class="err" id="rotaBErr" role="alert"></div><div class="row"><button class="btn" data-act="rotab-save">บันทึกรอบทีม B</button><button class="btn sec" data-act="rotab-cancel">ยกเลิก</button></div></section>';
}
async function saveRotaB(){
  if(busy)return;var er=$('rotaBErr'),dy=$('rotaBDay').value||null,nt=$('rotaBNight').value||null;
  if(dy&&dy===nt){er.textContent='เลือกคนซ้ำกันไม่ได้';return;}
  if(!dy&&!nt){er.textContent='เลือกอย่างน้อย 1 คน';return;}
  busy=true;er.textContent='';
  try{
    await rpc('set_rotation_b',{p_start:rotaBStart,p_day:dy,p_night:nt});
    var st0=rotaBStart;rotaBEdit=false;rotaBStart=null;await loadAll();busy=false;renderAll();
    toast('บันทึกรอบทีม B แล้ว','เริ่ม '+dayShort(st0));
  }catch(e){busy=false;er=$('rotaBErr');if(er)er.textContent=errMsg(e);}
}
/* ตัวแก้ไขกะฉุกเฉิน 19.00–04.00 */
function flexEditor(d,s,sl){
  var on=!!(sl&&sl.off),cur=on&&sl.cover?sl.cover.id:'';
  var A1=shiftById('A1'),dsl=slot(d,A1),D=dsl&&dsl.regular;
  var list=state.employees.filter(function(e){return e.active&&(e.role==='staff'||e.canWork);});
  if(!cur&&D)cur=D.id;
  return '<section class="card stack" id="slotEd"><h2>กะฉุกเฉิน 19.00–04.00 · ทีม A</h2><p class="muted small">'+esc(thDate(d,{weekday:'long',day:'numeric',month:'long',year:'numeric'}))+'</p>'+
    '<p>ปกติไม่มีคนเข้ากะนี้ เรียกตัวเมื่อมีเหตุฉุกเฉิน'+(D?' · ปกติจะเรียก <b>'+esc(D.name)+'</b> (คนที่อยู่กะ 08.30–17.30 วันนั้น)':'')+'</p>'+
    '<div class="fields"><div><label for="flexSel">เรียกใครเข้ากะ</label><select id="flexSel">'+list.map(function(e){return '<option value="'+e.id+'"'+(e.id===cur?' selected':'')+'>'+esc(e.name)+' · '+esc(teamLabel(e))+'</option>';}).join('')+'</select></div>'+
    '<div><label for="flexNote">หมายเหตุ (ไม่บังคับ)</label><input id="flexNote" maxlength="80" value="'+esc(on?sl.note:'')+'" placeholder="เช่น ระบบล่ม"></div></div>'+
    '<label style="margin:0"><input type="checkbox" id="flexMove" checked> ให้คนนี้หยุดกะประจำของวันนั้น (ย้ายมาเข้ากะ 19.00–04.00 แทน)</label>'+
    '<div class="err" id="slotErr" role="alert"></div><div class="row"><button class="btn" data-act="flex-save">เรียกเข้ากะ</button>'+(on?'<button class="btn sec" data-act="flex-clear">ยกเลิกการเรียกตัว</button>':'')+'<button class="btn sec" data-act="cancel-slot">ปิด</button></div></section>';
}
async function saveFlex(clear){
  if(busy)return;var d=editSlot.d,er=$('slotErr');
  busy=true;er.textContent='';
  try{
    await rpc('call_flex',{p_date:d,p_emp:clear?null:$('flexSel').value,p_move:clear?false:$('flexMove').checked,p_note:clear?'':$('flexNote').value.trim()});
    editSlot=null;await loadAll();busy=false;renderAll();
    toast(clear?'ยกเลิกการเรียกตัวแล้ว':'เรียกเข้ากะฉุกเฉินแล้ว',dayShort(d)+' กะ 19.00–04.00');
  }catch(e){busy=false;er=$('slotErr');if(er)er.textContent=errMsg(e);}
}

document.addEventListener('change',function(e){if(!e.target)return;if(e.target.id==='rotaStart'){rotaWeek=e.target.value;renderView();}else if(e.target.id==='rotaBStart'){rotaBStart=e.target.value;renderView();}});
