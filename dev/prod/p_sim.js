/* ---------- หน้าทดสอบเข้า-ออกงาน (จำลอง ไม่บันทึกจริง) ---------- */
var sim={emp:'',date:'',shift:'',tin:'',tout:'',rin:null,rout:null,log:[]};
function durTxt(m){var d=Math.floor(m/1440),h=Math.floor(m%1440/60),n=m%60;return ((d?d+' วัน ':'')+(h?h+' ชม. ':'')+(n||(!d&&!h)?n+' นาที':'')).trim();}
function dtl(ts){var b=bkk(ts);return b.date+'T'+b.hhmm;}
function dtlParse(v){return v?Date.parse(v+':00+07:00'):NaN;}
function simWorkers(){return state.employees.filter(function(e){return e.active&&(e.role==='staff'||e.canWork);});}
function simWho(d,s){var sl=slot(d,s);if(!sl)return null;return sl.off?sl.cover:sl.regular;}
function simDefaults(){
  var today=bkk(now()).date,W=simWorkers();
  if(!sim.date)sim.date=today;
  if(!sim.emp||!emp(sim.emp))sim.emp=W.length?W[0].id:'';
  var cur=sim.shift?shiftById(sim.shift):null;
  if(!cur){var mine=SHIFTS.find(function(s){var w=simWho(sim.date,s);return w&&w.id===sim.emp;});sim.shift=(mine||SHIFTS[0]).id;}
  var s=shiftById(sim.shift);
  if(!sim.tin)sim.tin=dtl(startTs(sim.date,s));
  if(!sim.tout)sim.tout=dtl(endTs(sim.date,s));
}
function simReset(keepTimes){sim.rin=null;sim.rout=null;if(!keepTimes){sim.tin='';sim.tout='';}}
/* กฎเดียวกับฟังก์ชัน check_in บนเซิร์ฟเวอร์ */
function simCheckIn(){
  var e=emp(sim.emp),s=shiftById(sim.shift),d=sim.date,t=dtlParse(sim.tin),S=ST();
  var r={kind:'in',when:t,emp:e,d:d,s:s};
  if(isNaN(t)){r.err='กรุณาเลือกวันและเวลาเข้างาน';return r;}
  var sl=slot(d,s);
  if(!sl&&s.flex&&TEAMS[s.team].days.indexOf(dowOf(d))>=0){r.err='คุณไม่ได้อยู่ในกะนี้';r.why='กะฉุกเฉิน 19.00–04.00 วันนี้ยังไม่มีการเรียกตัว (เรียกได้ที่หน้าตารางกะ)';return r;}
  if(!sl){r.err='ทีมนี้ไม่ทำงานวันดังกล่าว';r.why=TEAMS[s.team].name+' ไม่มีกะในวัน'+DOW_TH[dowOf(d)];return r;}
  var w=sl.off?sl.cover:sl.regular;
  if(!w||w.id!==e.id){r.err='คุณไม่ได้อยู่ในกะนี้';r.why=sl.off?(sl.cover?'วันนี้ '+sl.cover.name+' ทำแทน '+fn(sl.regular):fn(sl.regular)+' หยุด และยังไม่มีผู้ทำแทน'):'ผู้ประจำกะนี้คือ '+(sl.regular?sl.regular.name:'— (ยังไม่มีผู้ประจำ)');return r;}
  var st=startTs(d,s),en=endTs(d,s),open=st-S.openBefore*60000;
  if(t<open){r.err='ยังไม่ถึงเวลาเปิดให้ลงเวลา';r.why='เปิดให้ลงเวลาตั้งแต่ '+fmtHM(open)+' น. (ก่อนเริ่มกะ '+S.openBefore+' นาที) · ยังเหลืออีก '+durTxt(Math.ceil((open-t)/60000));return r;}
  if(t>en){r.err='กะนี้สิ้นสุดแล้ว';r.why='กะเลิก '+fmtHM(en)+' น. '+(bkk(en).date!==d?'('+sd(bkk(en).date)+')':'')+' เลยเวลามาแล้ว '+durTxt(Math.floor((t-en)/60000));return r;}
  var openRec=state.attendance.find(function(a){return a.emp===e.id&&!a.out&&!(a.date===d&&a.shift===s.id);});
  if(openRec){r.err='ยังมีกะที่ไม่ได้ออกงาน';r.why='ในระบบจริง '+e.name+' ยังไม่ได้ออกงานกะ '+shiftLabel(shiftById(openRec.shift))+' วันที่ '+sd(openRec.date);return r;}
  if(state.attendance.some(function(a){return a.emp===e.id&&a.date===d&&a.shift===s.id;})){r.err='ลงเวลาเข้างานกะนี้ไปแล้ว';r.why='ในระบบจริงมีบันทึกเข้างานของกะนี้อยู่แล้ว';return r;}
  var late=Math.floor((t-st)/60000);
  r.ok=true;r.late=Math.max(0,late);r.off=late;r.flag=late>S.lateAfter;r.cover=!!sl.off;
  r.msg='เข้างานสำเร็จ เวลา '+fmtHM(t)+' น. · '+(r.flag?'สาย '+r.late+' นาที':'ตรงเวลา');
  r.detail=late<0?'เข้าก่อนเริ่มกะ '+(-late)+' นาที':late===0?'เข้าตรงเวลาเริ่มกะพอดี':late<=S.lateAfter?'หลังเริ่มกะ '+late+' นาที ยังอยู่ในเวลาผ่อนผัน '+S.lateAfter+' นาที จึงนับว่าตรงเวลา':'หลังเริ่มกะ '+late+' นาที เกินเวลาผ่อนผัน '+S.lateAfter+' นาที จึงนับว่าสาย';
  r.notify=r.flag?e.name+' เข้างานสาย '+r.late+' นาที (กะ '+s.start.replace(':','.')+' · '+d.slice(8)+'/'+d.slice(5,7)+')':'';
  return r;
}
/* กฎเดียวกับฟังก์ชัน check_out บนเซิร์ฟเวอร์ */
function simCheckOut(){
  var e=emp(sim.emp),s=shiftById(sim.shift),d=sim.date,t=dtlParse(sim.tout),tin=sim.rin&&sim.rin.when;
  var r={kind:'out',when:t,emp:e,d:d,s:s};
  if(!sim.rin||!sim.rin.ok){r.err='ไม่พบรายการเข้างาน';r.why='ต้องทดสอบเข้างานให้สำเร็จก่อน';return r;}
  if(isNaN(t)){r.err='กรุณาเลือกวันและเวลาออกงาน';return r;}
  if(t<tin){r.err='เวลาออกงานต้องอยู่หลังเวลาเข้างาน';r.why='เข้างาน '+fmtHM(tin)+' น. วันที่ '+sd(bkk(tin).date);return r;}
  var en=endTs(d,s),early=Math.floor((en-t)/60000);
  r.ok=true;r.early=Math.max(0,early);r.flag=early>0;r.hours=(t-tin)/3600000;
  r.msg='ออกงานสำเร็จ เวลา '+fmtHM(t)+' น. · '+(r.flag?'ออกก่อน '+r.early+' นาที':'ตรงเวลา');
  r.detail=early>0?'ออกก่อนเลิกกะ '+early+' นาที':early===0?'ออกตรงเวลาเลิกกะพอดี':'ออกหลังเลิกกะ '+(-early)+' นาที';
  r.notify=r.flag?e.name+' ออกงานก่อนเวลา '+r.early+' นาที ('+d.slice(8)+'/'+d.slice(5,7)+')':'';
  return r;
}
function simResult(r){
  if(!r)return '';
  if(r.err)return '<div class="simres bad" role="status"><b>✕ '+esc(r.err)+'</b>'+(r.why?'<p>'+esc(r.why)+'</p>':'')+'<p class="small">พนักงานจะเห็นข้อความนี้ และระบบจะไม่บันทึกเวลา</p></div>';
  return '<div class="simres '+(r.flag?'warn':'ok')+'" role="status"><b>'+(r.flag?'! ':'✓ ')+esc(r.msg)+'</b><p>'+esc(r.detail)+(r.kind==='out'?' · ทำงานรวม '+r.hours.toFixed(2)+' ชม.':'')+(r.cover?' · บันทึกเป็นกะทำแทน':'')+'</p>'+
    '<p class="small">'+(r.notify?'จะมีแจ้งเตือนถึงพนักงานและผู้ดูแล: "'+esc(r.notify)+'"':'ไม่มีแจ้งเตือน')+'</p></div>';
}
function simTimeline(s,d){
  var S=ST(),st=startTs(d,s),en=endTs(d,s),open=st-S.openBefore*60000,lim=st+S.lateAfter*60000;
  var a=open-30*60000,b=en+30*60000,W=b-a,x=function(t){return Math.max(0,Math.min(100,(t-a)/W*100));};
  var seg=function(c,t1,t2,label){return '<span class="tl-'+c+'" style="left:'+x(t1)+'%;width:'+(x(t2)-x(t1))+'%" title="'+esc(label)+'"></span>';};
  var mk=function(v,c,label){var t=dtlParse(v);if(isNaN(t)||t<a-864e5||t>b+864e5)return '';return '<i class="tl-mk '+c+'" style="left:'+x(t)+'%" title="'+esc(label)+'"><em>'+esc(label)+'</em></i>';};
  return '<div class="tl" aria-hidden="true">'+seg('pre',a,open,'ยังไม่เปิด')+seg('open',open,lim,'เข้างานได้ ไม่สาย')+seg('late',lim,en,'สาย')+seg('end',en,b,'หลังเลิกกะ')+mk(sim.tin,'in','เข้า '+(sim.tin?sim.tin.slice(11):''))+(sim.rin&&sim.rin.ok?mk(sim.tout,'out','ออก '+(sim.tout?sim.tout.slice(11):'')):'')+'</div>'+
    '<div class="tl-lab small tnum"><span><i class="tl-k pre"></i>ยังไม่เปิด · ก่อน '+fmtHM(open)+'</span><span><i class="tl-k open"></i>เข้าได้ ไม่สาย · '+fmtHM(open)+'–'+fmtHM(lim)+'</span><span><i class="tl-k late"></i>เข้าได้ แต่นับว่าสาย · '+fmtHM(lim)+'–'+fmtHM(en)+'</span><span><i class="tl-k end"></i>เลิกกะ '+fmtHM(en)+(bkk(en).date!==d?' ('+sd(bkk(en).date)+')':'')+' · หลังจากนี้เข้างานไม่ได้</span></div>';
}
function viewSim(){
  simDefaults();
  var W=simWorkers(),e=emp(sim.emp),s=shiftById(sim.shift),sl=slot(sim.date,s),who=simWho(sim.date,s),S=ST();
  var st=startTs(sim.date,s),en=endTs(sim.date,s),open=st-S.openBefore*60000;
  var empOpts=W.map(function(x){return '<option value="'+x.id+'"'+(x.id===sim.emp?' selected':'')+'>'+esc(x.name)+' · '+esc(teamLabel(x))+'</option>';}).join('');
  var shOpts=SHIFTS.map(function(x){var w=simWho(sim.date,x),sl2=slot(sim.date,x);return '<option value="'+x.id+'"'+(x.id===sim.shift?' selected':'')+'>'+TEAMS[x.team].name+' '+shiftLabel(x)+' · '+(!sl2?'ไม่ทำงานวันนี้':(sl2.off?'ทำแทน: ':'')+(w?w.name:'ไม่มีผู้ทำงาน'))+'</option>';}).join('');
  var info=!sl?'<p class="alert-y">'+TEAMS[s.team].name+' ไม่ทำงานในวันที่เลือก การทดสอบจะได้ผล "ทีมนี้ไม่ทำงานวันดังกล่าว"</p>':
    (who&&e&&who.id===e.id?'<p class="muted small">✓ '+esc(e.name)+' เป็นผู้ทำงานในกะนี้'+(sl.off?' (ทำแทน '+esc(fn(sl.regular))+')':'')+'</p>':'<p class="alert-y">ผู้ทำงานกะนี้คือ '+esc(who?who.name:'—')+' ถ้าทดสอบด้วย '+esc(e?e.name:'—')+' จะได้ผล "คุณไม่ได้อยู่ในกะนี้"</p>');
  var pin=[['ก่อนเปิด 10 นาที',open-10*6e4],['พอดีเปิด',open],['ตรงเวลา',st],['สาย '+S.lateAfter+' นาที (ยังไม่นับสาย)',st+S.lateAfter*6e4],['สาย '+(S.lateAfter+15)+' นาที',st+(S.lateAfter+15)*6e4],['หลังเลิกกะ 5 นาที',en+5*6e4]];
  var pout=[['ออกก่อน 30 นาที',en-30*6e4],['ตรงเวลาเลิกกะ',en],['หลังเลิกกะ 15 นาที',en+15*6e4]];
  var chips=function(list,k){return '<div class="row simchips">'+list.map(function(p){return '<button class="btn sec sm" data-act="sim-set" data-k="'+k+'" data-v="'+dtl(p[1])+'">'+esc(p[0])+'</button>';}).join('')+'</div>';};
  var log=sim.log.length?'<div class="scroll"><table class="simlog"><thead><tr><th>ทดสอบ</th><th>พนักงาน</th><th>วัน / กะ</th><th>เวลาจำลอง</th><th>ผล</th></tr></thead><tbody>'+sim.log.slice().reverse().map(function(r){
      return '<tr><td>'+(r.kind==='in'?'เข้างาน':'ออกงาน')+'</td><td>'+esc(r.emp?r.emp.name:'—')+'</td><td class="tnum">'+esc(sd(r.d))+' · '+shiftLabel(r.s)+'</td><td class="tnum">'+(isNaN(r.when)?'—':esc(sd(bkk(r.when).date))+' '+fmtHM(r.when))+'</td><td>'+(r.err?'<span class="chip off">'+esc(r.err)+'</span>':'<span class="chip '+(r.flag?'late':'')+'">'+esc(r.msg.split(' · ')[1])+'</span>')+'</td></tr>';
    }).join('')+'</tbody></table></div><button class="btn sec sm" data-act="sim-clear" style="align-self:flex-start">ล้างประวัติการทดสอบ</button>':'<p class="muted small">ยังไม่มีการทดสอบ</p>';
  return '<div class="stack">'+
    '<div><h1>ทดสอบเข้า-ออกงาน</h1><p class="muted">ลองเข้างานและออกงานแทนพนักงานคนไหนก็ได้ ในวันและเวลาที่ต้องการ ใช้กฎเดียวกับระบบจริง</p></div>'+
    '<p class="simbanner">โหมดทดสอบ · ไม่บันทึกข้อมูลจริง ไม่ส่งแจ้งเตือน และไม่กระทบรายงานหรือสถิติ</p>'+
    '<section class="card stack"><h2>1. เลือกสถานการณ์</h2>'+
      '<div class="fields"><div><label for="simEmp">พนักงาน</label><select id="simEmp">'+empOpts+'</select></div><div><label>วันที่ทำงาน (วันเริ่มกะ)</label>'+dateField('simDate',sim.date)+'</div><div style="grid-column:1/-1"><label for="simShift">กะ</label><select id="simShift">'+shOpts+'</select></div></div>'+
      info+simTimeline(s,sim.date)+
      '<p class="muted small">กฎตอนนี้: เปิดให้ลงเวลาก่อนเริ่มกะ '+S.openBefore+' นาที · เข้าหลังเริ่มกะเกิน '+S.lateAfter+' นาที = สาย · ออกก่อนเวลาเลิกกะ = ออกก่อน (แก้กฎได้ที่หน้าตั้งค่า)</p></section>'+
    '<div class="grid2">'+
      '<section class="card stack"><h2>2. ทดสอบเข้างาน</h2><div><label for="simIn">วันและเวลาที่กดเข้างาน</label><input id="simIn" type="datetime-local" value="'+esc(sim.tin)+'"></div>'+chips(pin,'tin')+
        '<button class="btn" data-act="sim-in">ทดสอบเข้างาน</button>'+simResult(sim.rin)+'</section>'+
      '<section class="card stack'+(sim.rin&&sim.rin.ok?'':' simoff')+'"><h2>3. ทดสอบออกงาน</h2>'+(sim.rin&&sim.rin.ok?'':'<p class="muted small">ทดสอบเข้างานให้สำเร็จก่อน จึงจะทดสอบออกงานได้</p>')+
        '<div><label for="simOut">วันและเวลาที่กดออกงาน</label><input id="simOut" type="datetime-local" value="'+esc(sim.tout)+'"'+(sim.rin&&sim.rin.ok?'':' disabled')+'></div>'+(sim.rin&&sim.rin.ok?chips(pout,'tout'):'')+
        '<button class="btn" data-act="sim-out"'+(sim.rin&&sim.rin.ok?'':' disabled')+'>ทดสอบออกงาน</button>'+simResult(sim.rout)+'</section>'+
    '</div>'+
    '<section class="card stack"><h2>ประวัติการทดสอบรอบนี้</h2><p class="muted small">เก็บไว้แค่ในหน้านี้ ปิดหรือรีเฟรชหน้าแล้วจะหายไป</p>'+log+'</section></div>';
}
document.addEventListener('change',function(e){
  var id=e.target&&e.target.id;if(!me||view!=='sim')return;
  if(id==='simEmp'){sim.emp=e.target.value;sim.shift='';simReset(false);renderView();}
  else if(id==='simShift'){sim.shift=e.target.value;simReset(false);renderView();}
  else if(id==='simIn'){sim.tin=e.target.value;sim.rin=null;sim.rout=null;renderView();}
  else if(id==='simOut'){sim.tout=e.target.value;sim.rout=null;renderView();}
});
