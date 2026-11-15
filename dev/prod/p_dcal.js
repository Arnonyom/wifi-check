/* ---------- ปฏิทินสถานะ: รายวัน / สัปดาห์ / เดือน / ปี / กำหนดช่วง ---------- */
var dcMode='month',dcAnchor='';
var _dst={a:null,n:-1,v:''};
function dataStart(){
  var A=state.attendance;
  if(_dst.a!==A||_dst.n!==A.length){
    var m='';A.forEach(function(a){if(!m||a.date<m)m=a.date;});
    var floor=addDays(bkk(now()).date,-125);
    _dst={a:A,n:A.length,v:!m?bkk(now()).date:(m<floor?floor:m)};
  }
  return _dst.v;
}
function dcRange(){
  var today=bkk(now()).date,f=getDv('dcFrom',addDays(today,-29)),t=getDv('dcTo',today);
  if(f>t){var x=f;f=t;t=x;}
  var cut=false;if(Date.parse(t)-Date.parse(f)>123*864e5){f=addDays(t,-123);cut=true;}
  return {f:f,t:t,cut:cut};
}
function dcLabel(){
  var a=dcAnchor;
  if(dcMode==='day')return thDate(a,{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  if(dcMode==='week'){var m=mondayOf(a);return thDate(m,{day:'numeric',month:'short'})+' – '+thDate(addDays(m,6),{day:'numeric',month:'short',year:'numeric'});}
  if(dcMode==='month')return thDate(a.slice(0,7)+'-01',{month:'long',year:'numeric'});
  if(dcMode==='year')return 'ปี '+thDate(a.slice(0,4)+'-01-01',{year:'numeric'});
  var r=dcRange();return thDate(r.f,{day:'numeric',month:'short',year:'numeric'})+' – '+thDate(r.t,{day:'numeric',month:'short',year:'numeric'});
}
function dcNav(n){
  var a=dcAnchor,today=bkk(now()).date;
  if(n==='t'){dcAnchor=today;return;}
  n=Number(n);
  if(dcMode==='day')dcAnchor=addDays(a,n);
  else if(dcMode==='week')dcAnchor=addDays(a,7*n);
  else if(dcMode==='month')dcAnchor=addMonth(a.slice(0,7),n)+'-01';
  else if(dcMode==='year')dcAnchor=(+a.slice(0,4)+n)+'-01-01';
  if(dcAnchor>today)dcAnchor=today;
}
function dayCounts(ds){
  var late=0,early=0,miss=0;
  ds.rows.forEach(function(r){if(r.rec&&r.rec.lateFlag)late++;if(r.rec&&r.rec.out&&r.rec.earlyFlag)early++;if(r.k==='missing'||r.k==='incomplete')miss++;});
  return {late:late,early:early,miss:miss};
}
function dayNote(ds,c){
  return ds.state==='bad'?'ไม่ครบ '+c.miss:ds.state==='warn'?(c.late?'สาย '+c.late:'')+(c.late&&c.early?' · ':'')+(c.early?'ออกก่อน '+c.early:''):ds.state==='ok'?ds.rows.length+' กะ':ds.state==='nodata'?'ไม่มีข้อมูล':'';
}
function dayTip(d,ds,c){
  return tipA(thDate(d,{weekday:'long',day:'numeric',month:'short'}),[['สถานะ',DSTATE[ds.state][0]],['กะ',String(ds.rows.length)]].concat(c.late?[['สาย',String(c.late)]]:[]).concat(c.early?[['ออกก่อน',String(c.early)]]:[]).concat(c.miss?[['ไม่ครบ',String(c.miss)]]:[]));
}
var DC_G={ok:'✓',warn:'!',bad:'✕'};
/* one day cell (used by month / week / range) */
function dcCell(d,idx,t,cnt,label){
  var today=bkk(t).date,ds=dayStatus(d,idx,t),c=dayCounts(ds);
  if(cnt&&cnt[ds.state]!=null)cnt[ds.state]++;
  var inner='<b>'+(label||(+d.slice(8)))+'</b><span class="g" aria-hidden="true">'+(DC_G[ds.state]||'')+'</span><span class="nt">'+esc(dayNote(ds,c))+'</span>';
  var cls='dc '+ds.state+(d===today?' tod':'');
  if(['none','future','nodata'].indexOf(ds.state)>=0)return '<span class="'+cls+'"'+dayTip(d,ds,c)+'>'+inner+'</span>';
  return '<button class="'+cls+'"'+dk('day:'+d)+dayTip(d,ds,c)+' aria-label="'+esc(dayShort(d)+' '+DSTATE[ds.state][0])+'">'+inner+'</button>';
}
function dcWeekHead(){return '<div class="dcal hd">'+WEEK_ORDER.map(function(w){return '<span>'+DOW_S[w]+'</span>';}).join('')+'</div>';}
/* grid of whole weeks covering [f,t]; days outside are blank */
function dcGrid(f,t,idx,cnt,inside){
  var st=mondayOf(f),en=addDays(mondayOf(t),6),out=[];
  for(var d=st;d<=en;d=addDays(d,1)){
    if(d<f||d>t||(inside&&!inside(d)))out.push('<span class="dcx"></span>');
    else out.push(dcCell(d,idx,now(),cnt,(d===f||d.slice(8)==='01')&&!inside?(+d.slice(8))+' '+thDate(d,{month:'short'}):''));
  }
  return dcWeekHead()+'<div class="dcal">'+out.join('')+'</div>';
}
function slotCls(r){
  if(!r||!r.w)return 'none';
  if(r.k==='ok')return 'ok';
  if(r.k==='late')return 'warn';
  if(r.k==='missing'||r.k==='incomplete')return 'bad';
  if(r.k==='working')return r.rec&&r.rec.lateFlag?'warn':'open';
  if(r.k==='noshow')return 'warn';
  return 'future';
}
function slotBox(r){
  if(!r)return '<span class="sb na">–</span>';
  if(r.d<dataStart())return '<span class="sb nodata">ไม่มีข้อมูล</span>';
  var who=r.w?esc(fn(r.w)):'ไม่มีผู้ทำงาน',tm=r.rec?fmtHM(r.rec.in)+(r.rec.out?'–'+fmtHM(r.rec.out):''):'';
  return '<button class="sb '+slotCls(r)+'"'+dk('slot:'+r.d+'|'+r.s.id)+'><b>'+who+'</b>'+(r.sl.off?'<small>ทำแทน '+esc(fn(r.sl.regular))+'</small>':'')+'<small class="tnum">'+(tm||(r.k==='future'||r.k==='waiting'?'ยังไม่ถึงเวลา':r.k==='noshow'?'ยังไม่เข้างาน':r.k==='missing'?'ไม่มีบันทึก':''))+'</small></button>';
}
function dcSum(cnt,f,t){
  var chip=function(st,label){return '<button class="chip dsum '+st+'"'+dk('rst:'+f+':'+t+':'+st)+'><i></i>'+label+' <b class="tnum">'+cnt[st]+'</b> วัน</button>';};
  return '<div class="row dsums">'+chip('ok','ปกติ')+chip('warn','ไม่ปกติ')+chip('bad','ผิดปกติ')+'<span class="chip mute dsum"><i class="op"></i>ยังไม่จบวัน / ไม่มีกะ</span><span class="chip mute dsum"><i class="nd"></i>ไม่มีข้อมูล</span></div>';
}
function dashCalHtml(idx,t){
  var today=bkk(t).date;
  if(!dcAnchor||dcAnchor>today)dcAnchor=today;
  var A=dcAnchor,cnt={ok:0,warn:0,bad:0},body='',f,to;
  if(dcMode==='day'){
    f=to=A;
    var wk=WEEK_ORDER.map(function(_,i){return addDays(mondayOf(A),i);});
    var strip='<div class="daystrip">'+wk.map(function(d){var ds=dayStatus(d,idx,t);return '<button class="dchip dst '+ds.state+(d===A?' on':'')+(d===today?' tod':'')+'" data-act="dc-day" data-d="'+d+'"'+(d>today?' disabled':'')+' aria-pressed="'+(d===A)+'"><small>'+DOW_S[dowOf(d)]+'</small><b>'+(+d.slice(8))+'</b><i aria-hidden="true">'+(DC_G[ds.state]||'')+'</i></button>';}).join('')+'</div>';
    var ds=dayStatus(A,idx,t);if(cnt[ds.state]!=null)cnt[ds.state]++;
    var rows=[];SHIFTS.forEach(function(s){var r=slotInfo(A,s,idx,t);if(r&&(r.w||r.sl.off))rows.push(r);});
    body=strip+'<div class="dban '+ds.state+'"><b>'+(DC_G[ds.state]?DC_G[ds.state]+' ':'')+esc(DSTATE[ds.state][0])+'</b><span>'+esc(dayNote(ds,dayCounts(ds)))+'</span></div>'+
      (ds.state==='nodata'?'<p class="muted small">วันนี้อยู่ก่อนเริ่มใช้ระบบ จึงไม่มีบันทึกการลงเวลา</p>':rowsList(rows,{sort:function(a,b){return a.st-b.st;}}));
  }else if(dcMode==='week'){
    f=mondayOf(A);to=addDays(f,6);
    var days=[];for(var d=f;d<=to;d=addDays(d,1))days.push(d);
    var top='<div class="dcal">'+days.map(function(d){return dcCell(d,idx,t,cnt,DOW_S[dowOf(d)]+' '+(+d.slice(8)));}).join('')+'</div>';
    var mat='<div class="scroll"><table class="wk smat"><thead><tr><th>กะ</th>'+days.map(function(d){return '<th class="'+(d===today?'today':'')+'">'+DOW_TH[dowOf(d)]+'<small>'+thDate(d,{day:'numeric',month:'short'})+'</small></th>';}).join('')+'</tr></thead><tbody>'+
      SHIFTS.map(function(s){return '<tr><td><b class="tnum">'+shiftLabel(s)+'</b><br><span class="muted small">'+TEAMS[s.team].name+'</span></td>'+days.map(function(d){return '<td>'+slotBox(slotInfo(d,s,idx,t))+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div>';
    body=top+'<h3 style="margin-top:6px">รายกะ</h3>'+mat;
  }else if(dcMode==='month'){
    var ym=A.slice(0,7);f=ym+'-01';to=addDays(addMonth(ym,1)+'-01',-1);
    body=dcGrid(f,to,idx,cnt,function(d){return d.slice(0,7)===ym;});
  }else if(dcMode==='year'){
    var y=A.slice(0,4);f=y+'-01-01';to=y+'-12-31';
    body='<div class="ygrid">'+[1,2,3,4,5,6,7,8,9,10,11,12].map(function(i){
      var m=y+'-'+('0'+i).slice(-2),mc={ok:0,warn:0,bad:0};
      var cells=monthGrid(m).map(function(d){
        if(d.slice(0,7)!==m)return '<span></span>';
        var ds=dayStatus(d,idx,t);if(mc[ds.state]!=null){mc[ds.state]++;cnt[ds.state]++;}
        var c=dayCounts(ds);
        return ['none','future','nodata'].indexOf(ds.state)>=0?'<span class="ym '+ds.state+'"'+dayTip(d,ds,c)+'>'+(+d.slice(8))+'</span>':'<button class="ym '+ds.state+(d===today?' tod':'')+'"'+dk('day:'+d)+dayTip(d,ds,c)+' aria-label="'+esc(dayShort(d)+' '+DSTATE[ds.state][0])+'">'+(+d.slice(8))+'</button>';
      }).join('');
      return '<section class="card mini"><button class="mhead" data-act="dc-month" data-m="'+m+'"><b>'+esc(thDate(m+'-01',{month:'long'}))+'</b><span class="muted small tnum">'+(mc.ok+mc.warn+mc.bad?'<span class="yd ok"></span>'+mc.ok+' <span class="yd warn"></span>'+mc.warn+' <span class="yd bad"></span>'+mc.bad:'—')+'</span></button><div class="mm hd">'+WEEK_ORDER.map(function(w){return '<span>'+DOW_S[w].replace('.','')+'</span>';}).join('')+'</div><div class="mm">'+cells+'</div></section>';
    }).join('')+'</div><p class="muted small">กดชื่อเดือนเพื่อเปิดมุมมองรายเดือน · กดที่วันเพื่อดูรายละเอียด</p>';
  }else{
    var R=dcRange();f=R.f;to=R.t;
    body='<div class="fields"><div><label>ตั้งแต่วันที่</label>'+dateField('dcFrom')+'</div><div><label>ถึงวันที่</label>'+dateField('dcTo')+'</div></div>'+
      '<div class="row" style="gap:6px;flex-wrap:wrap">'+[['7 วันล่าสุด'],['30 วันล่าสุด'],['สัปดาห์นี้'],['เดือนนี้'],['เดือนที่แล้ว']].map(function(p,i){return '<button class="btn sec sm" data-act="dc-preset" data-i="'+i+'">'+p[0]+'</button>';}).join('')+'</div>'+
      (R.cut?'<p class="alert-y">แสดงได้สูงสุดประมาณ 4 เดือนต่อครั้ง ระบบตัดให้เหลือ 124 วันล่าสุดของช่วงที่เลือก</p>':'')+
      dcGrid(f,to,idx,cnt);
  }
  var modes=[['day','รายวัน'],['week','สัปดาห์'],['month','เดือน'],['year','ปี'],['range','กำหนดช่วง']];
  var nav=dcMode==='range'?'':'<div class="row calnav"><button class="btn sec sm" data-act="dc-nav" data-n="-1" aria-label="ก่อนหน้า">‹</button><button class="btn sec sm" data-act="dc-nav" data-n="t">วันนี้</button><button class="btn sec sm" data-act="dc-nav" data-n="1" aria-label="ถัดไป"'+(dcMode==='day'&&A>=today||dcMode==='week'&&mondayOf(A)>=mondayOf(today)||dcMode==='month'&&A.slice(0,7)>=today.slice(0,7)||dcMode==='year'&&A.slice(0,4)>=today.slice(0,4)?' disabled':'')+'>›</button>'+dateField('dcJump',A)+'</div>';
  var tdays=[],tkeys=[];if(to>today)to=today;
  if(dcMode!=='day'&&f<=to){for(var dd=to;dd>=f;dd=addDays(dd,-1)){var ds2=dayStatus(dd,idx,t),c2=dayCounts(ds2);tdays.push([sd(dd),DSTATE[ds2.state][0],c2.late,c2.early,c2.miss]);tkeys.push(['none','nodata'].indexOf(ds2.state)<0?'day:'+dd:'');}}
  return '<section class="card chartcard span2 dcard" style="gap:10px"><div class="cardh"><div><h3>ปฏิทินสถานะรายวัน</h3><p class="muted small">สถานะจะขึ้นหลังจบวันนั้น (รวมกะข้ามคืน) · กดที่วันหรือกะเพื่อดูรายละเอียด</p></div></div>'+
    '<div class="seg" style="align-self:flex-start;max-width:100%;overflow-x:auto" role="group" aria-label="มุมมองปฏิทิน">'+modes.map(function(m){return '<button data-act="dc-mode" data-m="'+m[0]+'" aria-pressed="'+(dcMode===m[0])+'">'+m[1]+'</button>';}).join('')+'</div>'+
    '<div class="row between" style="gap:8px;flex-wrap:wrap"><b>'+esc(dcLabel())+'</b>'+nav+'</div>'+
    (dcMode!=='day'?dcSum(cnt,f,to<f?f:to):'')+body+
    (tdays.length?'<details class="tv"><summary>ดูเป็นตาราง</summary><div class="scroll">'+tbl(['วันที่','สถานะ','สาย','ออกก่อน','ไม่ครบ'],tdays,tkeys)+'</div></details>':'')+'</section>';
}
