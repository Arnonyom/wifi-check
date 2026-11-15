/* ---------- dashboard drill-down (กดขยายดูรายละเอียด) ---------- */
var det=[],DCB={};
function dk(k){return ' data-act="det" data-k="'+esc(k)+'" role="button" tabindex="0"';}
function isFin(r){return ['ok','late','missing','incomplete'].indexOf(r.k)>=0;}
function offMin(r){return r.rec?Math.trunc((r.rec.in-r.st)/60000):null;}
function histBucket(off){return off<-15?0:off<0?1:off<15?2:off<=30?3:off<=60?4:5;}
function hrsOf(r){return r.rec&&r.rec.out?(r.rec.out-r.rec.in)/3600000:0;}
function rangeRows(N){
  var t=now(),today=bkk(t).date,idx=attIdx(),out=[];
  for(var i=N-1;i>=0;i--){var d=addDays(today,-i);if(d<dataStart())continue;SHIFTS.forEach(function(s){var r=slotInfo(d,s,idx,t);if(r&&(r.w||r.sl.off))out.push(r);});}
  return out;
}
function liveRows(){
  var t=now(),today=bkk(t).date,yest=addDays(today,-1),idx=attIdx(),out=[];
  [yest,today].forEach(function(d){SHIFTS.forEach(function(s){
    var r=slotInfo(d,s,idx,t);if(!r)return;
    if(d===yest&&(!crosses(s)||r.en<=t))return;
    out.push(r);
  });});
  return out;
}
function signed(n){return (n>0?'+':n<0?'−':'')+Math.abs(n);}
function offTxt(off){return off==null?'':off<0?'ก่อนเริ่มกะ '+(-off)+' นาที':off===0?'ตรงเวลาเริ่มกะ':'หลังเริ่มกะ '+off+' นาที';}
function rowHtml(r,opt){
  opt=opt||{};
  var who=r.w?esc(r.w.name):'<span class="muted">ไม่มีผู้ทำงาน</span>';
  var sub=r.sl.off?' <span class="chip">ทำแทน '+esc(fn(r.sl.regular))+'</span>':'';
  var right='';
  if(opt.asRegular)right='<span class="chip off">หยุด'+(LEAVE_TH[r.sl.kind]?' · '+LEAVE_TH[r.sl.kind]:'')+'</span> <span class="muted small">'+(r.sl.cover?esc(fn(r.sl.cover))+' ทำแทน':'ยังไม่มีผู้ทำแทน')+'</span>';
  else{
    if(r.rec)right+='<span class="muted small tnum">เข้า '+fmtHM(r.rec.in)+' · ออก '+(r.rec.out?fmtHM(r.rec.out):'—')+'</span> ';
    if(opt.extra)right+='<span class="chip mute tnum">'+esc(opt.extra(r))+'</span> ';
    right+=kChip(r)+(r.rec&&r.rec.byAdmin?' <span class="chip late">ผู้ดูแลลงให้</span>':'');
  }
  return '<button class="li lib"'+dk('slot:'+r.d+'|'+r.s.id)+'><span class="grow"><span class="when">'+esc(dayShort(r.d))+'</span> <span class="muted small tnum">'+TEAMS[r.s.team].name+' · '+shiftLabel(r.s)+'</span><br>'+who+sub+'</span><span class="row" style="gap:6px;justify-content:flex-end">'+right+'</span><span class="go" aria-hidden="true">›</span></button>';
}
function rowsList(rows,opt){
  opt=opt||{};
  if(!rows.length)return '<p class="muted small" style="padding:12px 0">ไม่มีรายการ</p>';
  var list=rows.slice().sort(opt.sort||function(a,b){return b.st-a.st;}),cap=300;
  return '<div class="list">'+list.slice(0,cap).map(function(r){return rowHtml(r,opt);}).join('')+'</div>'+(list.length>cap?'<p class="muted small">แสดง '+cap+' จาก '+list.length+' รายการ</p>':'');
}
function sumBox(items){return '<div class="sum">'+items.map(function(i){return '<div><b class="tnum">'+i[1]+'</b><span class="muted small">'+esc(i[0])+'</span></div>';}).join('')+'</div>';}
function finSum(rows){
  var f=rows.filter(isFin),ok=0,late=0,early=0,miss=0,h=0;
  f.forEach(function(r){if(r.rec){if(r.rec.lateFlag)late++;else ok++;if(r.rec.out){h+=hrsOf(r);if(r.rec.earlyFlag)early++;}}if(r.k==='missing'||r.k==='incomplete')miss++;});
  return sumBox([['กะทั้งหมด',f.length],['ตรงเวลา',pct(ok,f.length)+'%'],['สาย',late],['ออกก่อน',early],['ไม่ครบ',miss],['ชั่วโมงรวม',h.toFixed(1)]]);
}
function rangeTxt(){return 'ช่วง '+dashDays+' วันล่าสุด';}
function btnK(k,label,sec){return '<button class="btn'+(sec?' sec':'')+' sm"'+dk(k)+'>'+label+'</button>';}

function detContent(k){
  var p=k.split(':'),kind=p[0],arg=p.slice(1).join(':'),R,t=now(),today=bkk(t).date;
  if(kind==='card'){
    var c=DCB[arg];if(!c)return {title:'ไม่พบข้อมูล',html:''};
    var w=Math.max(260,Math.min(window.innerWidth,860)-(window.innerWidth<720?40:80));
    return {title:c.title,sub:c.sub,html:(c.legend||'')+'<div class="chartbox">'+c.body(w)+'</div><p class="muted small">กดที่แท่ง จุด หรือแถวในตาราง เพื่อดูรายละเอียดเพิ่ม</p><div class="scroll">'+c.table+'</div>'};
  }
  if(kind==='now'){
    var L=liveRows(),map={
      working:['กำลังทำงาน',function(r){return r.k==='working';}],
      waiting:['รอเข้างาน',function(r){return r.k==='waiting'||r.k==='future';}],
      late:['สาย / ยังไม่เข้า',function(r){return r.k==='noshow'||(r.rec&&r.rec.lateFlag);}],
      off:['วันนี้มีคนหยุด',function(r){return r.sl.off&&r.d===today;}]};
    if(arg==='pend'){
      var pend=state.leaves.filter(function(l){return l.status==='pending';}).sort(function(a,b){return a.ts-b.ts;});
      return {title:'คำขอลาที่รออนุมัติ',sub:pend.length+' รายการ',html:pend.length?'<div class="list">'+pend.map(pendRow).join('')+'</div>':'<p class="muted small">ไม่มีคำขอลาที่รออนุมัติ</p>',foot:btnK('go:leaves','ไปหน้าคำขอลา')};
    }
    var m=map[arg];R=L.filter(m[1]);
    return {title:m[0],sub:'ตอนนี้ · '+R.length+' กะ',html:rowsList(R,{sort:function(a,b){return a.st-b.st;}})};
  }
  if(kind==='st'){
    R=rangeRows(dashDays);var F=R.filter(isFin);
    var S={
      ok:['เข้างานตรงเวลา',F.filter(function(r){return r.rec&&!r.rec.lateFlag;}),{extra:function(r){return signed(offMin(r))+' น.';}}],
      late:['เข้างานสาย',F.filter(function(r){return r.rec&&r.rec.lateFlag;}),{extra:function(r){return 'สาย '+r.rec.late+' น.';},sort:function(a,b){return b.rec.late-a.rec.late;}}],
      early:['ออกก่อนเวลา',F.filter(function(r){return r.rec&&r.rec.out&&r.rec.earlyFlag;}),{extra:function(r){return 'ก่อน '+r.rec.early+' น.';}}],
      miss:['ไม่ครบ / ไม่ลงเวลา',F.filter(function(r){return r.k==='missing'||r.k==='incomplete';})],
      hours:['ชั่วโมงทำงาน',F.filter(function(r){return r.rec&&r.rec.out;}),{extra:function(r){return hrsOf(r).toFixed(1)+' ชม.';},sort:function(a,b){return hrsOf(b)-hrsOf(a);}}],
      cover:['กะที่มีคนทำแทน',F.filter(function(r){return r.sl.off;})]}[arg];
    var head=arg==='ok'?finSum(R):'';
    if(arg==='hours'){var hp={};S[1].forEach(function(r){hp[r.w.name]=(hp[r.w.name]||0)+hrsOf(r);});head=sumBox(Object.keys(hp).sort(function(a,b){return hp[b]-hp[a];}).map(function(n){return [n,hp[n].toFixed(1)];}));}
    return {title:S[0],sub:rangeTxt()+' · '+S[1].length+' กะ',html:head+rowsList(S[1],S[2])};
  }
  if(kind==='rst'){
    var q0=arg.split(':'),f0=q0[0],t0=q0[1],st0=q0[2],idx0=attIdx(),list0=[];
    for(var d0=t0;d0>=f0;d0=addDays(d0,-1)){var ds0=dayStatus(d0,idx0,t);if(ds0.state===st0)list0.push(ds0);}
    return {title:'วันที่'+DSTATE[st0][0].split(' ')[0],sub:sd(f0)+(f0!==t0?' – '+sd(t0):'')+' · '+list0.length+' วัน',
      html:list0.length?'<div class="list">'+list0.map(function(ds0){
        var c=dayCounts(ds0);
        return '<button class="li lib"'+dk('day:'+ds0.d)+'><span class="grow"><span class="when">'+esc(thDate(ds0.d,{weekday:'long',day:'numeric',month:'short'}))+'</span><br><span class="muted small">'+ds0.rows.length+' กะ</span></span><span class="row" style="gap:6px">'+(c.late?'<span class="chip late">สาย '+c.late+'</span>':'')+(c.early?'<span class="chip late">ออกก่อน '+c.early+'</span>':'')+(c.miss?'<span class="chip off">ไม่ครบ '+c.miss+'</span>':'')+(!c.late&&!c.early&&!c.miss?'<span class="chip">ตรงเวลาทุกกะ</span>':'')+'</span><span class="go" aria-hidden="true">›</span></button>';
      }).join('')+'</div>':'<p class="muted small">ไม่มีวันในสถานะนี้</p>'};
  }
  if(kind==='day'||kind==='wk'){
    var days=kind==='day'?[arg]:[0,1,2,3,4,5,6].map(function(i){return addDays(arg,i);}).filter(function(d){return d<=today;});
    var idx=attIdx();R=[];days.forEach(function(d){SHIFTS.forEach(function(s){var r=slotInfo(d,s,idx,t);if(r&&(r.w||r.sl.off))R.push(r);});});
    var ds=kind==='day'?dayStatus(arg,idx,t):null;
    if(ds&&ds.state==='nodata')return {title:thDate(arg,{weekday:'long',day:'numeric',month:'long',year:'numeric'}),sub:'ไม่มีข้อมูล',html:'<p class="muted">วันนี้อยู่ก่อนเริ่มใช้ระบบ จึงไม่มีบันทึกการลงเวลา</p>'};
    R=R.filter(function(r){return r.d>=dataStart();});
    return {title:kind==='day'?thDate(arg,{weekday:'long',day:'numeric',month:'long',year:'numeric'}):'สัปดาห์ '+sd(days[0])+' – '+sd(days[days.length-1]),
      sub:ds?'สถานะวัน: '+DSTATE[ds.state][0]:R.length+' กะ',html:finSum(R)+rowsList(R,{sort:function(a,b){return a.st-b.st;}})};
  }
  if(kind==='emp'){
    var e=emp(arg);R=rangeRows(dashDays);
    var mineR=R.filter(function(r){return r.w&&r.w.id===arg;}),offR=R.filter(function(r){return r.sl.off&&r.sl.regular&&r.sl.regular.id===arg;});
    var covN=mineR.filter(function(r){return r.sl.off;}).length;
    return {title:e?e.name:'พนักงาน',sub:(e?teamLabel(e)+(e.shift?' · '+shiftTxt(e):''):'')+' · '+rangeTxt(),
      html:finSum(mineR)+'<p class="muted small">ทำแทนคนอื่น '+covN+' กะ · หยุด '+offR.length+' กะ</p><h3>กะที่ทำงาน</h3>'+rowsList(mineR.filter(isFin),{extra:function(r){return r.rec?signed(offMin(r))+' น.':'';}})+(offR.length?'<h3>วันที่หยุด</h3>'+rowsList(offR,{asRegular:true}):'')};
  }
  if(kind==='shift'){
    var s=shiftById(arg);R=rangeRows(dashDays).filter(function(r){return isFin(r)&&r.rec&&r.s.id===arg;});
    var avg=R.length?Math.round(R.reduce(function(a,r){return a+offMin(r);},0)/R.length):0;
    return {title:'กะ '+shiftLabel(s)+' · '+TEAMS[s.team].name,sub:rangeTxt(),html:sumBox([['ครั้งที่ลงเวลา',R.length],['เข้างานเฉลี่ย',signed(avg)+' น.'],['สาย',R.filter(function(r){return r.rec.lateFlag;}).length]])+rowsList(R,{extra:function(r){return signed(offMin(r))+' น.';}})};
  }
  if(kind==='hist'){
    var hb=['ก่อนเริ่มกะเกิน 15 นาที','ก่อนเริ่มกะ 1–15 นาที','หลังเริ่มกะ 0–14 นาที','หลังเริ่มกะ 15–30 นาที','สาย 31–60 นาที','สายเกิน 60 นาที'],bi=+arg;
    R=rangeRows(dashDays).filter(function(r){return isFin(r)&&r.rec&&histBucket(offMin(r))===bi;});
    return {title:'เข้างาน'+hb[bi],sub:rangeTxt()+' · '+R.length+' ครั้ง',html:rowsList(R,{extra:function(r){return signed(offMin(r))+' น.';}})};
  }
  if(kind==='dow'){
    var dwn=['จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์','อาทิตย์'],di=+arg;
    R=rangeRows(dashDays).filter(function(r){return isFin(r)&&r.rec&&r.rec.lateFlag&&(dowOf(r.d)+6)%7===di;});
    return {title:'สายในวัน'+dwn[di],sub:rangeTxt()+' · '+R.length+' ครั้ง',html:rowsList(R,{extra:function(r){return 'สาย '+r.rec.late+' น.';}})};
  }
  if(kind==='team'){
    R=rangeRows(dashDays).filter(function(r){return isFin(r)&&r.s.team===arg;});
    return {title:TEAMS[arg].name,sub:rangeTxt(),html:finSum(R)+rowsList(R)};
  }
  if(kind==='leave'){
    R=rangeRows(dashDays).filter(function(r){return isFin(r)&&r.sl.off&&r.sl.kind===arg;});
    return {title:LEAVE_TH[arg]||'การลา',sub:rangeTxt()+' · '+R.length+' กะ',html:rowsList(R)};
  }
  if(kind==='cover'){
    var ce=emp(arg);R=rangeRows(dashDays).filter(function(r){return isFin(r)&&r.sl.off&&r.w&&r.w.id===arg;});
    return {title:'กะที่ '+(ce?ce.name:'—')+' ทำแทน',sub:rangeTxt()+' · '+R.length+' กะ',html:rowsList(R),foot:btnK('emp:'+arg,'ดูข้อมูลทั้งหมดของคนนี้',true)};
  }
  if(kind==='lv'){
    var l=state.leaves.find(function(x){return x.id===arg;});if(!l)return {title:'ไม่พบคำขอลา',html:''};
    var le=emp(l.emp),ov=Object.keys(state.overrides).filter(function(kk){return state.overrides[kk].leave===l.id;}).sort();
    return {title:'คำขอ'+LEAVE_TH[l.type],sub:le?le.name:'',
      html:'<dl class="kv"><div><dt>ผู้ขอ</dt><dd>'+esc(le?le.name:'—')+'</dd></div><div><dt>ประเภท</dt><dd>'+LEAVE_TH[l.type]+'</dd></div><div><dt>วันที่</dt><dd>'+esc(sd(l.from))+(l.to!==l.from?' – '+esc(sd(l.to)):'')+'</dd></div><div><dt>จำนวน</dt><dd>'+l.days+' วัน</dd></div><div><dt>เหตุผล</dt><dd>'+esc(l.reason||'—')+'</dd></div><div><dt>สถานะ</dt><dd><span class="chip '+LEAVE_ST[l.status][1]+'">'+LEAVE_ST[l.status][0]+'</span></dd></div><div><dt>ส่งคำขอเมื่อ</dt><dd class="tnum">'+esc(sd(bkk(l.ts).date))+' '+bkk(l.ts).hhmm+' น.</dd></div>'+(l.note?'<div><dt>หมายเหตุผู้ดูแล</dt><dd>'+esc(l.note)+'</dd></div>':'')+'</dl>'+
        (ov.length?'<h3>กะที่มีคนทำแทน</h3><div class="list">'+ov.map(function(kk){var x=kk.split('|');var s2=shiftById(x[1]),r=slotInfo(x[0],s2,attIdx(),t);return r?rowHtml(r):'';}).join('')+'</div>':''),
      foot:l.status==='pending'?'<button class="btn sm" data-act="go-leave" data-id="'+l.id+'">อนุมัติ / ไม่อนุมัติ</button>':''};
  }
  if(kind==='slot'){
    var q=arg.split('|'),sl2=shiftById(q[1]),r2=slotInfo(q[0],sl2,attIdx(),t);
    if(!r2)return {title:'ไม่มีกะในวันนี้',html:''};
    var a=r2.rec,o=state.overrides[q[0]+'|'+q[1]],ob=o&&o.by?emp(o.by):null,off2=offMin(r2);
    var kv=[['วันที่',thDate(r2.d,{weekday:'long',day:'numeric',month:'long',year:'numeric'})],['กะ',shiftLabel(sl2)+(crosses(sl2)?' (ข้ามคืน)':'')+' · '+TEAMS[sl2.team].name],['ผู้ประจำกะ',r2.sl.regular?r2.sl.regular.name:'—']];
    if(r2.sl.off)kv.push(['หยุด',(LEAVE_TH[r2.sl.kind]||'หยุด')+(r2.sl.note?' · '+r2.sl.note:'')],['ผู้ทำงานแทน',r2.sl.cover?r2.sl.cover.name:'ยังไม่มีผู้ทำแทน']);
    var kvh=kv.map(function(x){return '<div><dt>'+esc(x[0])+'</dt><dd>'+esc(x[1])+'</dd></div>';}).join('')+'<div><dt>สถานะ</dt><dd>'+kChip(r2)+'</dd></div>';
    if(a){
      kvh+='<div><dt>เวลาเข้างาน</dt><dd class="tnum">'+fmtHM(a.in)+' น. <span class="muted small">('+esc(offTxt(off2))+')</span></dd></div>';
      kvh+='<div><dt>เวลาออกงาน</dt><dd class="tnum">'+(a.out?fmtHM(a.out)+' น.'+(a.earlyFlag?' <span class="muted small">(ก่อนเลิกกะ '+a.early+' นาที)</span>':''):'ยังไม่ออกงาน')+'</dd></div>';
      if(a.byAdmin){var ab=emp(a.byAdmin);kvh+='<div><dt>ลงเวลาโดย</dt><dd>ผู้ดูแล '+esc(ab?ab.name:'')+(a.adminNote?' <span class="muted small">· หมายเหตุ: '+esc(a.adminNote)+'</span>':'')+'</dd></div>';}
      if(a.out)kvh+='<div><dt>ชั่วโมงทำงาน</dt><dd class="tnum">'+hrsOf(r2).toFixed(2)+' ชม.</dd></div>';
    }
    if(o&&o.ts)kvh+='<div><dt>ตั้งการหยุดโดย</dt><dd>'+esc(ob?ob.name:'—')+' <span class="muted small tnum">'+esc(sd(bkk(o.ts).date))+' '+bkk(o.ts).hhmm+'</span></dd></div>';
    var foot=btnK('day:'+r2.d,'ดูทั้งวัน',true)+(r2.w?btnK('emp:'+r2.w.id,'ดูข้อมูลของ '+esc(fn(r2.w)),true):'')+(o&&o.leave?btnK('lv:'+o.leave,'ดูคำขอลา',true):'')+'<button class="btn sec sm" data-act="go-sched" data-d="'+r2.d+'" data-t="'+sl2.team+'">เปิดในตารางกะ</button>'+(me.role==='admin'&&!sl2.flex?'<button class="btn sm" data-act="go-edit" data-d="'+r2.d+'" data-s="'+sl2.id+'" data-t="'+sl2.team+'">ลงเวลาแทน / เปลี่ยนคน</button>':'');
    return {title:(r2.w?r2.w.name:'กะ '+shiftLabel(sl2)),sub:dayShort(r2.d)+' · '+shiftLabel(sl2),html:'<dl class="kv">'+kvh+'</dl>',foot:foot};
  }
  return {title:'ไม่พบข้อมูล',html:''};
}
function pendRow(l){
  var e=emp(l.emp);
  return '<button class="li lib"'+dk('lv:'+l.id)+'><span class="grow"><b>'+esc(e?e.name:'—')+'</b> <span class="chip mute">'+LEAVE_TH[l.type]+'</span><br><span class="muted small">'+esc(sd(l.from))+(l.to!==l.from?' – '+esc(sd(l.to)):'')+' · '+l.days+' วัน'+(l.reason?' · '+esc(l.reason):'')+'</span></span><span class="go" aria-hidden="true">›</span></button>';
}
function openDet(k){hideTip();det.push(k);renderDet();var b=document.querySelector('#detbox .modal');if(b)b.focus();}
function closeDet(all){if(all)det=[];else det.pop();renderDet();}
function renderDet(){
  var box=$('detbox');if(!box)return;
  if(!det.length||!me){box.innerHTML='';det=[];return;}
  var c=detContent(det[det.length-1]);
  box.innerHTML='<div class="overlay" data-act="det-bg"><div class="modal detm" role="dialog" aria-modal="true" aria-labelledby="dTitle" tabindex="-1">'+
    '<div class="dhd">'+(det.length>1?'<button class="iconbtn" data-act="det-back" aria-label="ย้อนกลับ">‹</button>':'')+'<div class="grow"><h2 id="dTitle">'+esc(c.title)+'</h2>'+(c.sub?'<p class="muted small">'+esc(c.sub)+'</p>':'')+'</div><button class="iconbtn" data-act="det-close" aria-label="ปิด">✕</button></div>'+
    '<div class="dbody">'+c.html+'</div>'+(c.foot?'<div class="row dft">'+c.foot+'</div>':'')+'</div></div>';
}
