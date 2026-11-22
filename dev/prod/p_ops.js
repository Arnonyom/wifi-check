/* ---------- ผู้ดูแล: เปลี่ยนคนทำงาน/สลับกะหลายวัน + ลงเวลาแทน ---------- */
function rangeEnd(d,r){
  if(r==='day')return d;
  if(r==='week')return addDays(mondayOf(d),6);
  if(r==='2w')return addDays(mondayOf(d),13);
  return editSlot.to&&editSlot.to>=d?editSlot.to:d;
}
/* วันที่จะมีผล + วันที่ข้าม (พร้อมเหตุผล) */
function planDays(s,mode,other,from,to){
  var ok=[],skip=[];
  for(var dd=from;dd<=to;dd=addDays(dd,1)){
    var sl=slot(dd,s);if(!sl)continue;
    if(mode==='work'){if(state.overrides[dd+'|'+s.id])ok.push(dd);continue;}
    if(!sl.regular){skip.push([dd,'ไม่มีผู้ประจำ']);continue;}
    if(!other){ok.push(dd);continue;}
    if(other===sl.regular.id){skip.push([dd,'เป็นผู้ประจำอยู่แล้ว']);continue;}
    var oe=emp(other);
    if(mode==='cover'){
      var b=busyIn(other,startTs(dd,s),endTs(dd,s),dd+'|'+s.id,dd);
      if(b)skip.push([dd,'ชนกะ '+b]);else ok.push(dd);
    }else{
      var os=shiftOn(oe,dd),osh=os&&shiftById(os);
      if(!osh||os===s.id||!slot(dd,osh))skip.push([dd,'ไม่มีกะของ '+fn(oe)]);else ok.push(dd);
    }
  }
  return {ok:ok,skip:skip};
}
function swapOptions(d,s,sel){
  var sl=slot(d,s),reg=sl&&sl.regular?sl.regular.id:'';
  var opts=state.employees.filter(function(e){return e.active&&(e.role==='staff'||e.canWork)&&e.id!==reg;}).map(function(e){
    var os=shiftOn(e,d),osh=os&&shiftById(os);
    if(!osh||!slot(d,osh)||os===s.id)return '';
    return '<option value="'+e.id+'"'+(e.id===sel?' selected':'')+'>'+esc(e.name)+' · '+shiftLabel(osh)+' ('+TEAMS[osh.team].name+')</option>';
  }).filter(Boolean);
  return '<option value="">— เลือกคนที่จะสลับกะด้วย —</option>'+opts.join('');
}
function coverOptions2(d,s,sel){
  var sl=slot(d,s),reg=sl&&sl.regular?sl.regular.id:'';
  var list=state.employees.filter(function(e){return canCover(e)&&e.id!==reg;});
  var grp=function(label,arr){return arr.length?'<optgroup label="'+esc(label)+'">'+arr.map(function(e){var b=busyIn(e.id,startTs(d,s),endTs(d,s),d+'|'+s.id,d);return '<option value="'+e.id+'"'+(e.id===sel?' selected':'')+'>'+esc(e.name)+(b?' — วันนี้มีกะ '+b:'')+'</option>';}).join('')+'</optgroup>':'';};
  return '<option value="">— เลือกผู้ทำงานแทน —</option>'+
    grp(TEAMS[s.team].name+' (ทีมเดียวกัน)',list.filter(function(e){return e.role==='staff'&&e.team===s.team;}))+
    grp('Operation (Daytime) · สำรอง',list.filter(function(e){return e.role==='staff'&&e.team==='OPS';}))+
    grp('ทีมอื่น',list.filter(function(e){return e.role==='staff'&&(e.team==='A'||e.team==='B')&&e.team!==s.team;}))+
    grp('ผู้ดูแลระบบ (ช่วยทำงาน)',list.filter(function(e){return e.role==='admin';}));
}
function slotEditor2(d,s,sl){
  var E=editSlot,key=d+'|'+s.id,o=state.overrides[key];
  if(!E.mode)E.mode=!o?'work':(o.kind==='swap'?'swap':'cover');
  if(E.other===undefined)E.other=o&&o.cover?o.cover:'';
  if(!E.range)E.range='day';
  var head='<h2>แก้ไขกะ '+shiftLabel(s)+' · '+TEAMS[s.team].name+'</h2><p class="muted small">'+esc(thDate(d,{weekday:'long',day:'numeric',month:'long',year:'numeric'}))+'</p>';
  var now0=!sl.off?'ทำงานตามปกติ':(o&&o.kind==='swap'?'สลับกะ: '+esc(sl.cover?sl.cover.name:'—')+' มาทำแทน':(sl.cover?esc(sl.cover.name)+' ทำแทน':'หยุด · ยังไม่มีผู้ทำแทน'));
  var to=rangeEnd(d,E.range),from=d,plan=planDays(s,E.mode,E.mode==='work'?null:E.other,from,to);
  var rangeSel='<select id="edRange">'+[['day','เฉพาะวันนี้'],['week','ถึงสิ้นสัปดาห์นี้ ('+thDate(addDays(mondayOf(d),6),{day:'numeric',month:'short'})+')'],['2w','ถึงสิ้นสัปดาห์หน้า ('+thDate(addDays(mondayOf(d),13),{day:'numeric',month:'short'})+')'],['custom','กำหนดวันสิ้นสุดเอง']].map(function(x){return '<option value="'+x[0]+'"'+(E.range===x[0]?' selected':'')+'>'+esc(x[1])+'</option>';}).join('')+'</select>';
  var pick=E.mode==='cover'?'<div><label for="edOther">ผู้ทำงานแทน (ทีมเดียวกันก็ได้)</label><select id="edOther">'+coverOptions2(d,s,E.other)+'</select></div>'
    :E.mode==='swap'?'<div><label for="edOther">สลับกะกับ</label><select id="edOther">'+swapOptions(d,s,E.other)+'</select></div>':'';
  var chips=plan.ok.map(function(x){return '<span class="chip">'+esc(DOW_S[dowOf(x)]+' '+thDate(x,{day:'numeric',month:'short'}))+'</span>';}).join('')+
    plan.skip.map(function(x){return '<span class="chip mute" title="'+esc(x[1])+'">ข้าม '+esc(DOW_S[dowOf(x[0])]+' '+thDate(x[0],{day:'numeric',month:'short'}))+' · '+esc(x[1])+'</span>';}).join('');
  var who=E.mode==='swap'&&E.other?(function(){var oe=emp(E.other),os=shiftOn(oe,d);return '<p class="muted small">'+esc(sl.regular?sl.regular.name:'—')+' ไปทำกะ '+(os?shiftLabel(shiftById(os)):'—')+' ของ '+esc(fn(oe))+' และ '+esc(fn(oe))+' มาทำกะ '+shiftLabel(s)+' แทน</p>';})():'';
  var sec1='<section class="card stack" id="slotEd">'+head+
    '<p>ผู้ประจำกะ: <b>'+esc(sl.regular?sl.regular.name:'ยังไม่มี')+'</b> · ตอนนี้: '+now0+'</p>'+
    '<div class="row edmodes" role="radiogroup" aria-label="ใครทำงานกะนี้">'+[['work','ทำงานตามปกติ'],['cover','ให้คนอื่นทำแทน'],['swap','สลับกะกับคนอื่น']].map(function(m){return '<label class="radchip'+(E.mode===m[0]?' on':'')+'"><input type="radio" name="edMode" value="'+m[0]+'"'+(E.mode===m[0]?' checked':'')+'> '+m[1]+'</label>';}).join('')+'</div>'+
    '<div class="fields">'+pick+'<div><label for="edRange">ช่วงวันที่</label>'+rangeSel+'</div>'+(E.range==='custom'?'<div><label>ถึงวันที่</label>'+dateField('edTo',E.to||d)+'</div>':'')+
    (E.mode!=='work'?'<div><label for="edNote">หมายเหตุ (ไม่บังคับ)</label><input id="edNote" maxlength="80" value="'+esc(E.note!=null?E.note:(o&&o.kind!=='swap'?o.note:''))+'" placeholder="เช่น ลาทั้งสัปดาห์ สลับกะกัน"></div>':'')+'</div>'+who+
    '<div><p class="small muted" style="margin-bottom:6px">'+(E.mode==='work'?'วันที่จะกลับเป็นตามปกติ':'วันที่จะมีผล')+' ('+plan.ok.length+' วัน)</p><div class="row" style="gap:6px;flex-wrap:wrap">'+(chips||'<span class="muted small">ไม่มีวันที่ต้องเปลี่ยน</span>')+'</div></div>'+
    '<div class="err" id="slotErr" role="alert"></div>'+
    '<div class="row"><button class="btn" data-act="save-days"'+(plan.ok.length&&(E.mode==='work'||E.other)?'':' disabled')+'>บันทึก '+plan.ok.length+' วัน</button><button class="btn sec" data-act="cancel-slot">ปิด</button></div></section>';
  return d<=bkk(now()).date?attEditor(d,s,sl)+sec1:sec1+attEditor(d,s,sl);
}
/* ลงเวลาแทน: เลือกได้ว่าจะลงเวลาเข้างาน ออกงาน หรือทั้งสองอย่าง · ใส่แค่เวลา (ระบบเลือกวันที่ให้ตามกะ) */
function attTs(d,s,hhmm,anchor){
  if(!/^\d\d:\d\d$/.test(hhmm||''))return null;
  var best=null;[-1,0,1].forEach(function(k){var t=Date.parse(addDays(d,k)+'T'+hhmm+':00+07:00');if(best===null||Math.abs(t-anchor)<Math.abs(best-anchor))best=t;});
  return best;
}
function attState(d,s,sl){
  var E=editSlot,rec=state.attendance.find(function(a){return a.date===d&&a.shift===s.id;}),t=now(),st=startTs(d,s),en=endTs(d,s);
  var mode=E.attMode||(rec?(rec.out?'both':'out'):(t<en?'in':'both'));
  if(mode==='out'&&!rec)mode='both';
  var tin=E.tinT!=null?E.tinT:(rec?fmtHM(rec.in):fmtHM(t>st&&t<en?t:st));
  var tout=E.toutT!=null?E.toutT:(rec&&rec.out?fmtHM(rec.out):fmtHM(t>st&&t<en?t:en));
  var inTs=mode==='out'?(rec?rec.in:null):attTs(d,s,tin,st),outTs=mode==='in'?(rec&&rec.out?rec.out:null):attTs(d,s,tout,en);
  return {rec:rec,mode:mode,tin:tin,tout:tout,inTs:inTs,outTs:outTs,st:st,en:en};
}
function attPreviewTxt(d,s,A){
  if(!A.inTs)return 'ใส่เวลาเข้างาน';
  if(A.outTs&&A.outTs<=A.inTs)return '⚠ เวลาออกงานต้องอยู่หลังเวลาเข้างาน';
  if(A.inTs>now()+5*60000)return '⚠ เวลาเข้างานยังมาไม่ถึง';
  if(A.mode!=='in'&&A.outTs&&A.outTs>now()+5*60000)return '⚠ เวลาออกงานยังมาไม่ถึง ถ้าพนักงานยังทำงานอยู่ ให้เลือก "เข้างาน" อย่างเดียว';
  var L=ST().lateAfter,late=Math.floor((A.inTs-A.st)/60000),early=A.outTs?Math.floor((A.en-A.outTs)/60000):0;
  var dl=function(ts){var x=bkk(ts).date;return x!==d?' ('+sd(x)+')':'';};
  return 'จะบันทึก: เข้า '+fmtHM(A.inTs)+dl(A.inTs)+(A.outTs?' · ออก '+fmtHM(A.outTs)+dl(A.outTs):' · ยังไม่ออกงาน')+' → '+
    (late>L?'สาย '+late+' นาที':'เข้าตรงเวลา')+(A.outTs?(early>0?' · ออกก่อน '+early+' นาที':' · ออกตรงเวลา'):'');
}
function attEditor(d,s,sl){
  var w=sl.working,E=editSlot,A=attState(d,s,sl),rec=A.rec;
  var head='<h2>ลงเวลาแทน</h2>';
  if(!w&&!rec)return '<section class="card stack" id="attEd">'+head+'<p class="muted">กะนี้ยังไม่มีผู้ทำงาน ตั้งผู้ทำงานในส่วน "ใครทำงานกะนี้" ก่อน</p></section>';
  var pe=rec?emp(rec.emp):w,t=now();
  var box=function(lbl,ts,sub){return '<span><small>'+lbl+'</small><b class="tnum">'+(ts?fmtHM(ts):'—')+'</b><small>'+sub+'</small></span>';};
  var cur='<div class="iotimes attcur">'+box('เข้างาน',rec&&rec.in,rec?(rec.byAdmin?'ผู้ดูแลลงให้':'ลงเอง'):'ยังไม่ลง')+box('ออกงาน',rec&&rec.out,rec&&rec.out?(rec.byAdmin?'ผู้ดูแลลงให้':'ลงเอง'):'ยังไม่ลง')+'</div>';
  var modes=[['in','เข้างาน'],['out','ออกงาน'],['both','เข้า + ออก']];
  var seg='<div class="seg attmode" role="radiogroup" aria-label="ลงเวลาอะไร">'+modes.map(function(m){var dis=m[0]==='out'&&!rec;return '<button type="button" role="radio" data-act="att-mode" data-m="'+m[0]+'" aria-checked="'+(A.mode===m[0])+'" aria-pressed="'+(A.mode===m[0])+'"'+(dis?' disabled title="ยังไม่มีเวลาเข้างาน"':'')+'>'+m[1]+'</button>';}).join('')+'</div>'+
    (!rec?'<p class="muted small">ยังไม่มีเวลาเข้างาน จึงลงเฉพาะออกงานไม่ได้</p>':'');
  var nowHM=fmtHM(t);
  var field=function(k,lbl,val,qs){return '<div class="attf"><label for="at'+k+'T">'+lbl+'</label><div class="row attrow"><input id="at'+k+'T" type="time" value="'+esc(val)+'">'+
    qs.map(function(q){return '<button type="button" class="btn sec sm" data-act="att-set" data-k="'+k+'" data-v="'+q[1]+'">'+q[0]+'</button>';}).join('')+'</div></div>';};
  var fields=(A.mode!=='out'?field('In','เวลาเข้างาน',A.tin,[['เริ่มกะ '+fmtHM(A.st),fmtHM(A.st)],['ตอนนี้',nowHM]]):'')+
    (A.mode!=='in'?field('Out','เวลาออกงาน',A.tout,[['เลิกกะ '+fmtHM(A.en),fmtHM(A.en)],['ตอนนี้',nowHM]]):'');
  return '<section class="card stack" id="attEd">'+head+
    '<p>พนักงาน: <b>'+esc(pe?pe.name:'—')+'</b> · กะ '+shiftLabel(s)+' · '+esc(dayShort(d))+(rec&&w&&rec.emp!==w.id?' <span class="chip late">บันทึกเป็นชื่อคนอื่น ผู้ทำงานตอนนี้คือ '+esc(w.name)+'</span>':'')+'</p>'+
    cur+'<p class="small" style="margin-bottom:-4px"><b>ต้องการลงเวลาอะไร</b></p>'+seg+fields+
    '<div><label for="atNote">เหตุผล (ไม่บังคับ)</label><input id="atNote" maxlength="120" value="'+esc(E.atNote!=null?E.atNote:(rec?rec.adminNote||'':''))+'" placeholder="เช่น ลืมเช็กอิน โทรศัพท์แบตหมด"></div>'+
    '<p class="attprev small" id="attPrev" role="status">'+esc(attPreviewTxt(d,s,A))+'</p>'+
    '<div class="err" id="attErr" role="alert"></div><div class="row"><button class="btn" data-act="save-att">บันทึกเวลา'+(A.mode==='in'?'เข้างาน':A.mode==='out'?'ออกงาน':'')+'</button>'+(rec?'<button class="btn sec" data-act="del-att">ลบบันทึกเวลา</button>':'')+'</div>'+
    '<p class="muted small">ระบบคิดสาย/ออกก่อนตามกฎเดียวกับการลงเวลาปกติ และแจ้งเตือนพนักงาน</p></section>';
}
function attRefresh(){
  if(!editSlot)return;var s=shiftById(editSlot.s),d=editSlot.d,sl=slot(d,s),el=$('attPrev');if(!el||!sl&&!s)return;
  el.textContent=attPreviewTxt(d,s,attState(d,s,sl||{}));
}
async function saveDays(){
  if(busy||!editSlot)return;
  var E=editSlot,s=shiftById(E.s),to=rangeEnd(E.d,E.range),plan=planDays(s,E.mode,E.mode==='work'?null:E.other,E.d,to),er=$('slotErr');
  if(E.mode!=='work'&&!E.other){er.textContent=E.mode==='swap'?'เลือกคนที่จะสลับกะด้วย':'เลือกผู้ทำงานแทน';return;}
  if(!plan.ok.length){er.textContent='ไม่มีวันที่จะบันทึก';return;}
  busy=true;er.textContent='';
  try{
    var r=await rpc('set_override_days',{p_shift:s.id,p_dates:plan.ok,p_mode:E.mode,p_other:E.mode==='work'?null:E.other,p_note:$('edNote')?$('edNote').value.trim():''});
    editSlot=null;await loadAll();busy=false;renderAll();
    var sk=r&&r.skipped&&r.skipped.length?' · ข้าม '+r.skipped.length+' วัน':'';
    toast(E.mode==='work'?'กลับเป็นตามปกติแล้ว':E.mode==='swap'?'สลับกะแล้ว':'ตั้งผู้ทำแทนแล้ว',(r&&r.done!=null?r.done:plan.ok.length)+' วัน · กะ '+shiftLabel(s)+sk);
  }catch(e){busy=false;er=$('slotErr');if(er)er.textContent=errMsg(e);}
}
async function saveAtt(del){
  if(busy||!editSlot)return;
  var E=editSlot,s=shiftById(E.s),d=E.d,sl=slot(d,s),er=$('attErr');
  var A=attState(d,s,sl||{}),rec=A.rec;
  var who=A.mode==='out'&&rec?rec.emp:(sl&&sl.working?sl.working.id:(rec?rec.emp:null));
  if(!del){
    if(!who){er.textContent='ยังไม่มีผู้ทำงานในกะนี้';return;}
    if(!A.inTs){er.textContent='ใส่เวลาเข้างาน';return;}
    if(A.mode!=='in'&&!A.outTs){er.textContent='ใส่เวลาออกงาน';return;}
    if(A.outTs&&A.outTs<=A.inTs){er.textContent='เวลาออกงานต้องอยู่หลังเวลาเข้างาน';return;}
    if(A.inTs>now()+5*60000){er.textContent='เวลาเข้างานยังมาไม่ถึง';return;}
    if(A.mode!=='in'&&A.outTs&&A.outTs>now()+5*60000){er.textContent='เวลาออกงานยังมาไม่ถึง ถ้าพนักงานยังทำงานอยู่ ให้เลือก "เข้างาน" อย่างเดียว';return;}
  }
  busy=true;er.textContent='';
  try{
    await rpc('admin_attendance',{p_date:d,p_shift:s.id,p_emp:del?null:who,p_in:del?null:new Date(A.inTs).toISOString(),p_out:del||!A.outTs?null:new Date(A.outTs).toISOString(),p_note:$('atNote').value.trim()});
    editSlot=null;await loadAll();busy=false;renderAll();
    toast(del?'ลบบันทึกเวลาแล้ว':'บันทึกเวลาแทนแล้ว',dayShort(d)+' กะ '+shiftLabel(s)+(del?'':' · เข้า '+fmtHM(A.inTs)+(A.outTs?' ออก '+fmtHM(A.outTs):'')));
  }catch(e){busy=false;er=$('attErr');if(er)er.textContent=errMsg(e);}
}
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('[data-act=att-mode],[data-act=att-set]');if(!b||!editSlot||b.disabled)return;
  if(b.dataset.act==='att-mode')editSlot.attMode=b.dataset.m;
  else editSlot[b.dataset.k==='In'?'tinT':'toutT']=b.dataset.v;
  renderView();var ed=$('attEd');if(ed&&ed.scrollIntoView&&ed.getBoundingClientRect().top<0)ed.scrollIntoView({block:'start'});
});
document.addEventListener('change',function(e){
  var t=e.target;if(!t||!editSlot||view!=='schedule')return;
  if(t.name==='edMode'){editSlot.mode=t.value;editSlot.other='';renderView();}
  else if(t.id==='edOther'){editSlot.other=t.value;renderView();}
  else if(t.id==='edRange'){editSlot.range=t.value;renderView();}
  else if(t.id==='atInT'){editSlot.tinT=t.value;attRefresh();}
  else if(t.id==='atOutT'){editSlot.toutT=t.value;attRefresh();}
});
document.addEventListener('input',function(e){var t=e.target;if(!t||!editSlot)return;if(t.id==='edNote')editSlot.note=t.value;else if(t.id==='atNote')editSlot.atNote=t.value;else if(t.id==='atInT'){editSlot.tinT=t.value;attRefresh();}else if(t.id==='atOutT'){editSlot.toutT=t.value;attRefresh();}});

/* ---------- ธีม: สว่าง / มืด / Liquid Glass ---------- */
var themeOpen=false,GLASS_KEY='wc-glass';
function curTheme(){return document.documentElement.getAttribute('data-theme')||(effDark()?'dark':'light');}
function glassLevel(){var v=60;try{var x=localStorage.getItem(GLASS_KEY);if(x!=null&&x!=='')v=+x;}catch(e){}return isNaN(v)?60:Math.max(0,Math.min(100,v));}
function applyGlass(v){var r=document.documentElement.style,ga=0.12+0.78*v/100;r.setProperty('--ga',ga.toFixed(3));r.setProperty('--gp',Math.max(ga,0.38).toFixed(3));r.setProperty('--gb',Math.round(6+22*v/100)+'px');}
function setTheme(t){document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem(THEME_KEY,t);}catch(e){}if(t==='glass')applyGlass(glassLevel());renderAll();}
applyGlass(glassLevel());
function themePanel(){
  var t=curTheme(),v=glassLevel();
  return '<div class="pop thpop" role="dialog" aria-label="ธีมหน้าจอ"><p class="small muted">ธีมหน้าจอ</p><div class="thopts">'+
    [['light','สว่าง',ICONS.sun],['dark','มืด',ICONS.moon],['glass','Liquid Glass',ICONS.sun]].map(function(o){return '<button class="thopt'+(t===o[0]?' on':'')+'" data-act="theme-set" data-t="'+o[0]+'" aria-pressed="'+(t===o[0])+'"><span class="thsw thsw-'+o[0]+'"></span>'+o[1]+'</button>';}).join('')+'</div>'+
    (t==='glass'?'<label for="glassRange" class="small">ความใส ↔ ขุ่น <b class="tnum" id="glassVal">'+v+'%</b></label><input id="glassRange" type="range" min="0" max="100" step="1" value="'+v+'"><div class="row between small muted"><span>ใส</span><span>ขุ่น</span></div>':'')+'</div>';
}
document.addEventListener('input',function(e){
  if(e.target&&e.target.id==='glassRange'){var v=+e.target.value;applyGlass(v);try{localStorage.setItem(GLASS_KEY,String(v));}catch(x){}var gv=$('glassVal');if(gv)gv.textContent=v+'%';}
});

/* รายงาน: หมายเหตุเมื่อผู้ดูแลลงเวลาให้ + ใครลืมลงเวลาบ่อย */
function adminRemark(a){
  if(!a||!a.byAdmin)return '';
  var by=emp(a.byAdmin);
  return ' <span class="chip late" title="'+esc('ลงโดย '+(by?by.name:'ผู้ดูแล'))+'">ผู้ดูแลลงให้</span>'+(a.adminNote?'<br><span class="muted small">หมายเหตุ: '+esc(a.adminNote)+'</span>':'')+'<br><span class="muted small">โดย '+esc(by?fn(by):'ผู้ดูแล')+'</span>';
}
function forgotData(rows){
  var per={};
  rows.forEach(function(r){
    if(!r.w)return;
    var fin=['ok','late','missing','incomplete'].indexOf(r.k)>=0;
    var p=per[r.w.id]||(per[r.w.id]={e:r.w,adm:0,miss:0,shifts:0,notes:{}});
    if(fin)p.shifts++;
    if(r.rec&&r.rec.byAdmin){p.adm++;if(r.rec.adminNote)p.notes[r.rec.adminNote]=(p.notes[r.rec.adminNote]||0)+1;}
    if(r.k==='missing'||r.k==='incomplete')p.miss++;
  });
  return Object.keys(per).map(function(k){var p=per[k];p.reason=Object.keys(p.notes).sort(function(a,b){return p.notes[b]-p.notes[a];})[0]||'';return p;})
    .filter(function(p){return p.adm+p.miss>0;}).sort(function(a,b){return (b.adm+b.miss)-(a.adm+a.miss)||b.adm-a.adm;});
}
function forgotCard(rows){
  var list=forgotData(rows);
  var mx=list.length?list[0].adm+list[0].miss:1;
  var body=list.length?list.map(function(p,i){
    var tot=p.adm+p.miss,reason=p.reason;
    return '<button class="li lib"'+dk('emp:'+p.e.id)+'><span class="fgrow" style="flex:1;min-width:0"><span><b>'+(i+1)+'. '+esc(p.e.name)+'</b><br><span class="muted small">'+p.shifts+' กะในช่วงนี้'+(reason?' · เหตุผลที่พบบ่อย: '+esc(reason):'')+'</span></span>'+
      '<span class="fgbar" aria-hidden="true"><i class="a" style="width:'+(100*p.adm/mx)+'%"></i><i class="m" style="width:'+(100*p.miss/mx)+'%"></i></span>'+
      '<span class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-end">'+(p.adm?'<span class="chip late">ผู้ดูแลลงให้ '+p.adm+'</span>':'')+(p.miss?'<span class="chip off">ไม่มีบันทึก/ไม่ครบ '+p.miss+'</span>':'')+'<b class="tnum">'+tot+' ครั้ง</b></span></span><span class="go" aria-hidden="true">›</span></button>';
  }).join(''):'<p class="muted small" style="padding:10px 0">ไม่มีใครลืมลงเวลาในช่วงที่เลือก</p>';
  return '<section class="card stack">'+tblHead('ใครลืมลงเวลามากที่สุด','นับจากกะที่ผู้ดูแลต้องลงเวลาให้ <span class="chip late">เหลือง</span> และกะที่ยังไม่มีบันทึกหรือลงไม่ครบ <span class="chip off">แดง</span> ในช่วงวันที่และตัวกรองด้านบน','xl-forgot')+'<div class="list">'+body+'</div></section>';
}
