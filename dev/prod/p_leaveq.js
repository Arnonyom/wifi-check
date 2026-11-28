/* วันลา (28 พ.ย. 2569)
   - สิทธิ์วันลารายคน ต่อปี: ค่าตั้งต้น (settings.q_*) หรือที่ผู้ดูแลกำหนดเอง (leave_quota) · ปรับ ตั้งเป็น/เพิ่ม/ลด ได้ตลอด มีประวัติ (leave_quota_log)
   - พนักงานยื่นลา: เลือกวันเริ่ม + จำนวนวัน · พักร้อน/ลากิจ เริ่มได้ตั้งแต่วันนี้ (ถึงเที่ยงคืน) ย้อนหลังไม่ได้
     ลาป่วย เริ่มได้เฉพาะวันนี้ (ตั้งแต่ 00.00) ลาล่วงหน้าไม่ได้ ครั้งละไม่เกิน 3 วัน
   - ผู้ดูแลลาแทนพนักงาน (ต้องใส่เหตุผล) → เปิดหน้าอนุมัติ + เลือกผู้ทำแทนให้ทันที
   - รายงาน › สถิติ: การ์ดสิทธิ์วันลาคงเหลือรายคน */
var LV_MAX={vac:30,per:30,sick:3};
var lvq={yr:'',type:'vac',mode:'set',days:'',note:'',pick:{},all:true,ask:null,err:'',msg:'',dErr:'',dMsg:''};
var lvAdm={open:false,emp:'',type:'vac',len:1,reason:'',err:''};
function curYear(){return +bkk(now()).date.slice(0,4);}
function yrLabel(y){return LANG==='en'?String(y):String(+y+543);}
function quotaOf(empId,yr,type){var k=empId+'|'+yr+'|'+type;return state.quota&&state.quota[k]!=null?state.quota[k]:ST().q?ST().q[type]:({vac:10,per:3,sick:30})[type];}
function quotaCustom(empId,yr,type){return !!(state.quota&&state.quota[empId+'|'+yr+'|'+type]!=null);}
function usedY(empId,type,statuses,yr){
  var y=String(yr||curYear());
  return state.leaves.filter(function(l){return l.emp===empId&&l.type===type&&statuses.indexOf(l.status)>=0&&l.from.slice(0,4)===y;}).reduce(function(a,l){return a+l.days;},0);
}
function leaveEmps(){return byOrder(state.employees.filter(function(e){return e.active&&e.shift;}));}
function lvLen(){var m=LV_MAX[lv.type]||30,n=+lv.len||1;return Math.max(1,Math.min(m,n));}
function lvRule(t){return t==='sick'?'ลาป่วยเริ่มได้เฉพาะวันนี้ (ตั้งแต่ 00.00) ลาล่วงหน้าไม่ได้ · ครั้งละไม่เกิน 3 วัน':'ลาล่วงหน้าได้ · ลาวันนี้ได้ถึงเที่ยงคืนวันนี้ · ย้อนหลังไม่ได้';}
function lenStepper(act,n,max){
  return '<div class="lenst" role="group" aria-label="จำนวนวัน"><button type="button" class="btn sec sm" data-act="'+act+'" data-n="-1" aria-label="ลดจำนวนวัน"'+(n<=1?' disabled':'')+'>−</button>'+
    '<b class="tnum" aria-live="polite">'+n+' วัน</b><button type="button" class="btn sec sm" data-act="'+act+'" data-n="1" aria-label="เพิ่มจำนวนวัน"'+(n>=max?' disabled':'')+'>+</button></div>';
}
function balHtml(empId){
  var y=curYear();
  return '<div class="bal">'+['vac','per','sick'].map(function(k){var q=quotaOf(empId,y,k),u=usedY(empId,k,['approved'],y),p=usedY(empId,k,['pending'],y);
    return '<div><span class="muted small">'+LEAVE_TH[k]+'</span><b>'+(q-u-p)+' <span class="muted small">/ '+q+' วัน</span></b><span class="muted small">ใช้แล้ว '+u+(p?' · รออนุมัติ '+p:'')+'</span></div>';}).join('')+'</div>';
}
/* ---------- พนักงาน: หน้า "ลา" ---------- */
function viewLeave(){
  if(!me.shift)return '<div class="stack"><h1>ลา</h1><section class="card"><p>บัญชีนี้ไม่มีกะประจำ จึงไม่ต้องยื่นขอลา พนักงานสำรอง (Operation) จะถูกมอบหมายเป็นผู้ทำแทนโดยผู้ดูแล</p></section></div>';
  var today=bkk(now()).date,sick=lv.type==='sick';
  var f=sick?today:getDv('lvFrom',today);if(sick)dv.lvFrom=today;
  var n=lvLen(),t=addDays(f,n-1);dv.lvTo=t;
  var days=countDays(me.id,f,t);
  var mine=state.leaves.filter(function(l){return l.emp===me.id;}).sort(function(a,b){return b.ts-a.ts;});
  return '<div class="stack"><div><h1>ลา</h1><p class="muted">ยื่นคำขอ ผู้ดูแลจะอนุมัติและจัดผู้ทำงานแทนให้ คุณจะได้รับแจ้งเตือน</p></div>'+balHtml(me.id)+
    '<section class="card stack"><h2>คำขอใหม่</h2>'+
    '<div class="typeseg" role="group" aria-label="ประเภทการลา">'+['vac','per','sick'].map(function(k){return '<button data-act="lvtype" data-t="'+k+'" aria-pressed="'+(lv.type===k)+'">'+LEAVE_TH[k]+'</button>';}).join('')+'</div>'+
    '<p class="muted small lvrule">'+lvRule(lv.type)+'</p>'+
    '<div class="fields"><div><label>วันที่เริ่มลา</label>'+(sick?'<div class="dfield dfix" aria-label="วันที่เริ่มลา">'+esc(thDate(today,{weekday:'short',day:'numeric',month:'short',year:'numeric'}))+' <span class="chip">วันนี้</span></div>':dateField('lvFrom',f))+'</div>'+
    '<div><label>จำนวนวัน</label>'+lenStepper('lv-len',n,LV_MAX[lv.type])+'</div></div>'+
    '<p class="muted small">ลาถึง <b>'+esc(thDate(t,{weekday:'short',day:'numeric',month:'short',year:'numeric'}))+'</b> · '+(days?'วันทำงานที่ลา: <b>'+days+' วัน</b> ('+shiftTxt(me)+')':'ช่วงนี้ไม่มีกะของคุณ (ทีมไม่ทำงาน)')+'</p>'+
    '<div><label for="lvReason">เหตุผล (ไม่บังคับ)</label><input id="lvReason" maxlength="120" value="'+esc(lv.reason)+'" placeholder="เช่น ไปพบแพทย์ ธุระครอบครัว"></div>'+
    '<div class="err" role="alert">'+esc(lv.err)+'</div>'+(lv.ok?'<p class="ok" role="status">'+esc(lv.ok)+'</p>':'')+
    '<div><button class="btn" data-act="lv-submit">ส่งคำขอลา</button></div></section>'+
    '<section class="card"><h2>คำขอของฉัน</h2><div class="list">'+(mine.map(function(l){return leaveRow(l,false);}).join('')||'<p class="muted small" style="padding:10px 0">ยังไม่มีคำขอ</p>')+'</div></section></div>';
}
/* ---------- ผู้ดูแล: ลาแทนพนักงาน (หน้า "ลา") ---------- */
function lvAdmHtml(){
  if(!lvAdm.open)return '<div><button class="btn sec" data-act="la-open">+ ลาแทนพนักงาน</button></div>';
  var es=leaveEmps(),a=lvAdm,today=bkk(now()).date;
  if(!a.emp||!es.some(function(e){return e.id===a.emp;}))a.emp=es.length?es[0].id:'';
  var f=getDv('laFrom',today),n=Math.max(1,Math.min(30,+a.len||1)),t=addDays(f,n-1),days=a.emp?countDays(a.emp,f,t):0;
  var y=+f.slice(0,4),q=a.emp?quotaOf(a.emp,y,a.type):0,u=a.emp?usedY(a.emp,a.type,['approved','pending'],y):0,e=emp(a.emp);
  return '<section class="card stack" id="laCard"><div class="row between"><h2>ลาแทนพนักงาน</h2><button class="btn sec sm" data-act="la-close">ปิด</button></div>'+
    '<p class="muted small">ใช้เมื่อพนักงานยื่นเองไม่ได้ · เลือกวันย้อนหลังหรือล่วงหน้าได้ · ต้องใส่เหตุผล · บันทึกแล้วเลือกผู้ทำแทนและอนุมัติต่อได้ทันที</p>'+
    '<div class="fields"><div><label for="laEmp">พนักงาน</label><select id="laEmp">'+es.map(function(x){return '<option value="'+x.id+'"'+(x.id===a.emp?' selected':'')+'>'+esc(x.name)+'</option>';}).join('')+'</select></div>'+
    '<div><label>ประเภทการลา</label><div class="typeseg" role="group" aria-label="ประเภทการลา">'+['vac','per','sick'].map(function(k){return '<button type="button" data-act="la-type" data-t="'+k+'" aria-pressed="'+(a.type===k)+'">'+LEAVE_TH[k]+'</button>';}).join('')+'</div></div></div>'+
    '<div class="fields"><div><label>วันที่เริ่มลา</label>'+dateField('laFrom',f)+'</div><div><label>จำนวนวัน</label>'+lenStepper('la-len',n,30)+'</div></div>'+
    '<p class="muted small">ลาถึง <b>'+esc(thDate(t,{weekday:'short',day:'numeric',month:'short',year:'numeric'}))+'</b> · '+(days?'วันทำงานที่ลา: <b>'+days+' วัน</b>':'ช่วงนี้ไม่มีกะของพนักงานคนนี้')+
      (e?' · สิทธิ์'+LEAVE_TH[a.type]+'คงเหลือ <b>'+(q-u)+'</b> / '+q+' วัน (ปี '+yrLabel(y)+')':'')+'</p>'+
    '<div><label for="laReason">เหตุผลที่ลาแทน (บังคับ)</label><input id="laReason" maxlength="120" value="'+esc(a.reason)+'" placeholder="เช่น โทรแจ้งว่าป่วย เข้าระบบไม่ได้"></div>'+
    '<div class="err" role="alert">'+esc(a.err)+'</div>'+
    '<div><button class="btn" data-act="la-submit">บันทึกการลาแทน</button></div></section>';
}
async function submitAdmLeave(){
  if(busy)return;
  var a=lvAdm,today=bkk(now()).date,f=getDv('laFrom',today),n=Math.max(1,Math.min(30,+a.len||1)),t=addDays(f,n-1);a.err='';
  var y=+f.slice(0,4),days=a.emp?countDays(a.emp,f,t):0;
  if(!a.emp)a.err='เลือกพนักงาน';
  else if(!a.reason.trim())a.err='กรอกเหตุผลที่ลาแทน';
  else if(!days)a.err='ช่วงนี้ไม่มีกะของพนักงานคนนี้';
  else if(state.leaves.some(function(l){return l.emp===a.emp&&(l.status==='pending'||l.status==='approved')&&l.from<=t&&l.to>=f;}))a.err='มีคำขอลาที่ทับช่วงวันนี้อยู่แล้ว';
  else if(usedY(a.emp,a.type,['approved','pending'],y)+days>quotaOf(a.emp,y,a.type))a.err='เกินสิทธิ์'+LEAVE_TH[a.type]+'คงเหลือ';
  if(a.err){renderView();return;}
  busy=true;
  try{
    var r=await rpc('admin_request_leave',{p_emp:a.emp,p_type:a.type,p_from:f,p_to:t,p_reason:a.reason.trim()});
    await loadAll();
    lvAdm={open:false,emp:a.emp,type:a.type,len:1,reason:'',err:''};lvFilter='pending';lvReject=null;lvErr='';lvOpen=r&&r.id?r.id:null;
    toast('บันทึกการลาแทนแล้ว','เลือกผู้ทำแทนในแต่ละกะ แล้วกด "ยืนยันอนุมัติ"');
  }catch(er){a.err=errMsg(er);}
  busy=false;renderAll();
  var c=document.querySelector('.lvcard .stack select');if(c&&c.scrollIntoView)c.closest('.lvcard').scrollIntoView({block:'center'});
}
/* ---------- ผู้ดูแล: การ์ด "การตั้งค่าวันลา" ในหน้าตั้งค่าระบบ ---------- */
function lvqPreview(){
  var y=+lvq.yr||curYear(),d=parseInt(lvq.days,10),ids=lvqIds();
  return ids.map(function(id){var o=quotaOf(id,y,lvq.type),n=lvq.mode==='set'?d:lvq.mode==='add'?o+d:o-d;return {id:id,o:o,n:Math.max(0,Math.min(366,n))};});
}
function lvqIds(){return leaveEmps().filter(function(e){return lvq.all||lvq.pick[e.id];}).map(function(e){return e.id;});}
function lvqCard(){
  var cy=curYear(),y=+lvq.yr||cy,es=leaveEmps(),Q=ST().q||{vac:10,per:3,sick:30};
  var yrs=[cy-1,cy,cy+1];
  var tbl='<div class="scroll"><table class="rt lvqt"><thead><tr><th>พนักงาน</th>'+['vac','per','sick'].map(function(k){return '<th>'+LEAVE_TH[k]+'</th>';}).join('')+'</tr></thead><tbody>'+
    (es.map(function(e){return '<tr><td>'+esc(e.name)+'</td>'+['vac','per','sick'].map(function(k){var q=quotaOf(e.id,y,k),u=usedY(e.id,k,['approved'],y),p=usedY(e.id,k,['pending'],y);
      return '<td class="tnum"><b>'+(q-u-p)+'</b> <span class="muted small">/ '+q+(quotaCustom(e.id,y,k)?'*':'')+'</span>'+(u||p?'<br><span class="muted small">ใช้ '+u+(p?' · รอ '+p:'')+'</span>':'')+'</td>';}).join('')+'</tr>';}).join('')||'<tr><td colspan="4" class="muted">ยังไม่มีพนักงานที่มีกะประจำ</td></tr>')+
    '</tbody></table></div><p class="muted small">ตัวเลข = คงเหลือ / สิทธิ์ทั้งปี · * = กำหนดเฉพาะคน (ไม่ใช่ค่าตั้งต้น)</p>';
  var picks='<label class="clrk"><input type="checkbox" data-lvq-all'+(lvq.all?' checked':'')+'> <b>ทุกคน</b></label>'+
    '<div class="lvqpick">'+es.map(function(e){return '<label class="clrk"><input type="checkbox" data-lvq-emp="'+e.id+'"'+(lvq.all||lvq.pick[e.id]?' checked':'')+(lvq.all?' disabled':'')+'> '+esc(e.name)+'</label>';}).join('')+'</div>';
  var ask='';
  if(lvq.ask){
    var pv=lvqPreview(),ch=pv.filter(function(x){return x.n!==x.o;});
    ask='<div class="alert-y stack" style="gap:8px" role="alert"><b>ยืนยันปรับสิทธิ์'+LEAVE_TH[lvq.type]+' ปี '+yrLabel(y)+' ?</b>'+
      '<ul class="small" style="margin:0;padding-left:18px">'+pv.map(function(x){var e=emp(x.id);return '<li>'+esc(e?e.name:'—')+': '+x.o+' → <b>'+x.n+'</b> วัน'+(x.n===x.o?' (ไม่เปลี่ยน)':'')+'</li>';}).join('')+'</ul>'+
      '<div class="row" style="gap:8px">'+(ch.length?'<button class="btn" data-act="lvq-yes">ยืนยันปรับสิทธิ์ ('+ch.length+' คน)</button>':'<span class="muted small">ไม่มีใครเปลี่ยน</span>')+'<button class="btn sec" data-act="lvq-no">ยกเลิก</button></div></div>';
  }
  var log=(state.quotaLog||[]).filter(function(r){return r.yr===y;}).slice(0,20).map(function(r){var e=emp(r.emp),b=emp(r.by);
    return '<div class="li"><span class="grow"><b>'+esc(e?e.name:'—')+'</b> · '+LEAVE_TH[r.type]+' <span class="tnum">'+r.old+' → <b>'+r.nw+'</b></span>'+(r.note?'<br><span class="muted small">'+esc(r.note)+'</span>':'')+'</span><span class="muted small tnum">'+esc(sd(bkk(r.ts).date))+(b?' · '+esc(fn(b)):'')+'</span></div>';}).join('')||'<p class="muted small">ยังไม่มีการปรับในปีนี้</p>';
  return '<section class="card stack" id="lvqCard"><h2>การตั้งค่าวันลา</h2>'+
    '<div class="row"><label for="lvqYr" class="small">ปี</label><select id="lvqYr" style="width:auto">'+yrs.map(function(v){return '<option value="'+v+'"'+(v===y?' selected':'')+'>'+yrLabel(v)+'</option>';}).join('')+'</select></div>'+
    '<h3>สิทธิ์วันลาคงเหลือ</h3>'+tbl+
    '<h3>กำหนด / เพิ่ม / ลด สิทธิ์</h3>'+
    '<div class="fields"><div><label for="lvqType">ประเภทการลา</label><select id="lvqType">'+['vac','per','sick'].map(function(k){return '<option value="'+k+'"'+(lvq.type===k?' selected':'')+'>'+LEAVE_TH[k]+'</option>';}).join('')+'</select></div>'+
      '<div><label>วิธีปรับ</label><div class="seg" role="group" aria-label="วิธีปรับ">'+[['set','ตั้งเป็น'],['add','เพิ่ม'],['sub','ลด']].map(function(m){return '<button type="button" data-act="lvq-mode" data-m="'+m[0]+'" aria-pressed="'+(lvq.mode===m[0])+'">'+m[1]+'</button>';}).join('')+'</div></div>'+
      '<div><label for="lvqDays">จำนวนวัน</label><input id="lvqDays" type="number" inputmode="numeric" min="0" max="366" value="'+esc(lvq.days)+'"></div></div>'+
    '<div><label for="lvqNote">หมายเหตุ (ไม่บังคับ)</label><input id="lvqNote" maxlength="120" value="'+esc(lvq.note)+'" placeholder="เช่น อายุงานครบ 3 ปี แก้ที่ใส่ผิด"></div>'+
    '<div class="stack" style="gap:6px"><span class="small muted">ให้ใคร</span>'+picks+'</div>'+
    '<div class="row"><button class="btn" data-act="lvq-check"'+(lvq.ask?' disabled':'')+'>ปรับสิทธิ์…</button>'+(lvq.msg?'<span class="ok" role="status">'+esc(lvq.msg)+'</span>':'')+(lvq.err?'<span class="err" role="alert">'+esc(lvq.err)+'</span>':'')+'</div>'+ask+
    '<h3>ค่าตั้งต้น <span class="muted small">(ใช้กับคนที่ยังไม่ได้กำหนดเฉพาะ · ทุกปี)</span></h3>'+
    '<div class="fields">'+['vac','per','sick'].map(function(k){return '<div><label for="lvqD_'+k+'">'+LEAVE_TH[k]+' (วัน)</label><input id="lvqD_'+k+'" type="number" inputmode="numeric" min="0" max="366" value="'+Q[k]+'"></div>';}).join('')+'</div>'+
    '<div class="row"><button class="btn sec" data-act="lvq-def">บันทึกค่าตั้งต้น</button>'+(lvq.dMsg?'<span class="ok" role="status">'+esc(lvq.dMsg)+'</span>':'')+(lvq.dErr?'<span class="err" role="alert">'+esc(lvq.dErr)+'</span>':'')+'</div>'+
    '<h3>ประวัติการปรับสิทธิ์ <span class="muted small">ปี '+yrLabel(y)+'</span></h3><div class="list lvqlog">'+log+'</div>'+
    '<div class="row"><button class="btn sec" data-act="la-go">ลาแทนพนักงาน ›</button></div></section>';
}
document.addEventListener('change',function(e){
  var t=e.target;if(!t||!me)return;
  if(t.id==='laEmp'){lvAdm.emp=t.value;lvAdm.err='';renderView();return;}
  if(view!=='settings')return;
  if(t.id==='lvqYr'){lvq.yr=t.value;lvq.ask=null;renderView();}
  else if(t.id==='lvqType'){lvq.type=t.value;lvq.ask=null;renderView();}
  else if(t.hasAttribute&&t.hasAttribute('data-lvq-all')){lvq.all=t.checked;if(!t.checked)leaveEmps().forEach(function(x){lvq.pick[x.id]=true;});lvq.ask=null;renderView();}
  else if(t.getAttribute&&t.getAttribute('data-lvq-emp')){lvq.pick[t.getAttribute('data-lvq-emp')]=t.checked;lvq.ask=null;renderView();}
});
document.addEventListener('input',function(e){
  var t=e.target;if(!t)return;
  if(t.id==='lvqDays'){lvq.days=t.value;lvq.ask=null;}else if(t.id==='lvqNote')lvq.note=t.value;
  else if(t.id==='laReason')lvAdm.reason=t.value;else if(t.id==='lvReason')lv.reason=t.value;
});
document.addEventListener('click',async function(e){
  var b=e.target.closest&&e.target.closest('[data-act]');if(!b||!me||b.disabled)return;
  var a=b.getAttribute('data-act'),n=+b.getAttribute('data-n');
  if(a==='lv-len'){e.stopPropagation();lv.len=Math.max(1,Math.min(LV_MAX[lv.type]||30,lvLen()+n));lv.err='';lv.ok='';renderView();return;}
  if(a==='lvtype'){lv.len=Math.min(lvLen(),LV_MAX[b.getAttribute('data-t')]||30);return;} // ปุ่มเดิมทำต่อ (เปลี่ยนประเภท)
  if(me.role!=='admin')return;
  if(a==='la-open'){e.stopPropagation();lvAdm.open=true;lvAdm.err='';lvOpen=null;lvReject=null;renderView();var c=document.getElementById('laEmp');if(c)try{c.focus();}catch(x){}return;}
  if(a==='la-close'){e.stopPropagation();lvAdm.open=false;renderView();return;}
  if(a==='la-type'){e.stopPropagation();lvAdm.type=b.getAttribute('data-t');lvAdm.err='';renderView();return;}
  if(a==='la-len'){e.stopPropagation();lvAdm.len=Math.max(1,Math.min(30,(+lvAdm.len||1)+n));lvAdm.err='';renderView();return;}
  if(a==='la-submit'){e.stopPropagation();submitAdmLeave();return;}
  if(a==='la-go'){e.stopPropagation();lvAdm.open=true;view='leaves';resetUi();renderAll();window.scrollTo(0,0);return;}
  if(view!=='settings')return;
  if(a==='lvq-mode'){e.stopPropagation();lvq.mode=b.getAttribute('data-m');lvq.ask=null;renderView();return;}
  if(a==='lvq-no'){e.stopPropagation();lvq.ask=null;renderView();return;}
  if(a==='lvq-check'){
    e.stopPropagation();lvq.err='';lvq.msg='';var d=parseInt(lvq.days,10);
    if(isNaN(d)||d<0||d>366)lvq.err='ใส่จำนวนวัน 0–366';else if(!lvqIds().length)lvq.err='เลือกพนักงานอย่างน้อย 1 คน';else lvq.ask=true;
    renderView();return;
  }
  if(a==='lvq-yes'){
    e.stopPropagation();if(busy)return;busy=true;
    var dd=parseInt(lvq.days,10),y=+lvq.yr||curYear();
    try{
      var c2=await rpc('admin_set_quota',{p_emps:lvqIds(),p_yr:y,p_type:lvq.type,p_mode:lvq.mode==='set'?'set':'add',p_days:lvq.mode==='sub'?-dd:dd,p_note:lvq.note.trim()});
      lvq.ask=null;lvq.msg='ปรับสิทธิ์แล้ว '+(c2==null?'':c2)+' คน';lvq.note='';await loadAll();
    }catch(er){lvq.err=errMsg(er);lvq.ask=null;}
    busy=false;renderView();return;
  }
  if(a==='lvq-def'){
    e.stopPropagation();lvq.dErr='';lvq.dMsg='';
    var v={};['vac','per','sick'].forEach(function(k){var el=document.getElementById('lvqD_'+k);v[k]=el?parseInt(el.value,10):NaN;});
    if(['vac','per','sick'].some(function(k){return isNaN(v[k])||v[k]<0||v[k]>366;})){lvq.dErr='ใส่จำนวนวัน 0–366';renderView();return;}
    if(busy)return;busy=true;
    try{await rpc('admin_set_leave_defaults',{p_vac:v.vac,p_per:v.per,p_sick:v.sick});lvq.dMsg='บันทึกค่าตั้งต้นแล้ว';await loadAll();}catch(er){lvq.dErr=errMsg(er);}
    busy=false;renderView();return;
  }
},true);
/* ---------- รายงาน › สถิติ: สิทธิ์วันลาคงเหลือรายคน (ปีนี้) ---------- */
function lvBalCard(){
  var y=curYear(),es=leaveEmps();if(dashEmp)es=es.filter(function(e){return e.id===dashEmp;});
  var cols=[['vac','var(--s1)'],['per','var(--s2)'],['sick','var(--s3)']];
  var rows=es.map(function(e){
    return '<button class="li lib lvbrow"'+dk('emp:'+e.id)+'><b class="lvbn">'+esc(e.name)+'</b><span class="lvbm">'+cols.map(function(c){var k=c[0],q=quotaOf(e.id,y,k),u=usedY(e.id,k,['approved'],y),p=usedY(e.id,k,['pending'],y),w=q?Math.min(100,100*(u+p)/q):0,wu=q?Math.min(100,100*u/q):0;
      return '<span class="lvbx" title="'+esc(LEAVE_TH[k]+': ใช้ '+u+(p?' · รอ '+p:'')+' / '+q)+'"><span class="small muted">'+LEAVE_TH[k]+'</span><span class="lvbar" aria-hidden="true"><i class="p" style="width:'+w+'%;background:'+c[1]+'"></i><i style="width:'+wu+'%;background:'+c[1]+'"></i></span><span class="small tnum">เหลือ <b>'+(q-u-p)+'</b>/'+q+'</span></span>';}).join('')+'</span></button>';
  }).join('')||'<p class="muted small" style="padding:10px 0">ยังไม่มีพนักงานที่มีกะประจำ</p>';
  var adm=state.leaves.filter(function(l){return l.byAdmin&&l.from.slice(0,4)===String(y)&&(!dashEmp||l.emp===dashEmp);}).length;
  var t=tbl(['ชื่อ','พักร้อน ใช้/สิทธิ์','ลากิจ ใช้/สิทธิ์','ลาป่วย ใช้/สิทธิ์'],es.map(function(e){return [e.name].concat(['vac','per','sick'].map(function(k){return usedY(e.id,k,['approved'],y)+' / '+quotaOf(e.id,y,k);}));}),es.map(function(e){return 'emp:'+e.id;}));
  return '<section class="card chartcard span2" id="lvBal"><div class="cardh"><h3>สิทธิ์วันลาคงเหลือ ปี '+yrLabel(y)+'</h3></div><p class="muted small">แถบเข้ม = ใช้แล้ว · แถบจาง = รออนุมัติ'+(adm?' · ผู้ดูแลบันทึกลาแทน '+adm+' ครั้ง':'')+'</p>'+
    '<div class="list">'+rows+'</div><details class="tv"><summary>ดูเป็นตาราง</summary><div class="scroll">'+t+'</div></details></section>';
}
