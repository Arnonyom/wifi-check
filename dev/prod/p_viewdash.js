function dcard(key,title,sub,bodyFn,w,legend,table,span2){
  DCB[key]={title:title,sub:sub,body:bodyFn,legend:legend,table:table};
  return chartCard(title,sub,bodyFn(w),legend,table,span2,key);
}
function kpiB(k,label,val,cls,extra){return '<button class="kpi go'+(cls?' '+cls:'')+'"'+dk(k)+'><span class="muted small">'+label+'</span><b'+(cls==='heroK'?' class="heroN"':' class="tnum"')+'>'+val+'</b>'+(extra||'')+'</button>';}
function viewDash(){
  var t=now(),today=bkk(t).date,idx=attIdx(),D=dashData(dashDays),B=liveBoard(t,today,idx),tot=D.tot;
  var w1=cardW(false),w2=cardW(true);DCB={};
  var mine=me.canWork?'<div class="grid2">'+checkCardHtml()+upcomingHtml()+'</div>':'';
  var pend=state.leaves.filter(function(l){return l.status==='pending';}).sort(function(a,b){return a.ts-b.ts;});
  var pendHtml=pend.length?pend.slice(0,4).map(pendRow).join('')+(pend.length>4?'<button class="li lib"'+dk('now:pend')+'><span class="grow muted small">ดูทั้งหมด '+pend.length+' รายการ</span><span class="go">›</span></button>':''):'<p class="muted small" style="padding:10px 0">ไม่มีคำขอลาที่รออนุมัติ</p>';
  var upc=[];
  for(var j=1;j<=14;j++){var dd=addDays(today,j);SHIFTS.forEach(function(s){var sl=slot(dd,s);if(sl&&sl.off)upc.push('<button class="li lib"'+dk('slot:'+dd+'|'+s.id)+'><span class="grow"><span class="when">'+esc(dayShort(dd))+'</span> <span class="muted small tnum">'+TEAMS[s.team].name+' '+shiftLabel(s)+'</span><br><span class="small"><span class="strike">'+esc(fn(sl.regular))+'</span> → '+(sl.cover?'<b>'+esc(fn(sl.cover))+'</b>'+tagFor(sl.cover):'<span class="chip off">ยังไม่มีผู้ทำแทน</span>')+'</span></span><span class="chip mute">'+esc(LEAVE_TH[sl.kind]||sl.note||'หยุด')+'</span><span class="go" aria-hidden="true">›</span></button>');});}
  var attn=D.per.filter(function(p){return p.late+p.miss>0;}).sort(function(a,b){return (b.late+b.miss)-(a.late+a.miss);}).slice(0,5).map(function(p){
    return '<button class="li lib"'+dk('emp:'+p.id)+'><b class="grow">'+esc(p.name)+'</b><span class="row" style="gap:6px">'+(p.late?'<span class="chip late">สาย '+p.late+' ครั้ง</span>':'')+(p.miss?'<span class="chip off">ไม่ครบ '+p.miss+' ครั้ง</span>':'')+'<span class="chip mute">ตรงเวลา '+pct(p.ok,p.fin)+'%</span></span><span class="go" aria-hidden="true">›</span></button>';
  }).join('')||'<p class="muted small" style="padding:10px 0">ไม่มีพนักงานที่ต้องติดตามในช่วงนี้</p>';

  var daily=D.daysArr.map(function(c){return {d:c.d,vals:[c.ok,c.late,c.miss],k:'day:'+c.d};});
  var serD=[{name:'ตรงเวลา',cls:'f-good',v:'var(--st-good)'},{name:'สาย',cls:'f-warn',v:'var(--st-warn)'},{name:'ไม่ครบ/ไม่ลงเวลา',cls:'f-bad',v:'var(--st-bad)'}];
  var dayKeys=D.daysArr.slice().reverse().map(function(c){return 'day:'+c.d;});
  var c1=dcard('daily','ลงเวลารายวัน','จำนวนกะต่อวันแยกตามสถานะการเข้างาน',function(w){return chStacked(daily,w,220,serD,'กราฟแท่งซ้อนรายวัน: ตรงเวลา สาย ไม่ครบ');},w2,legendHtml([['ตรงเวลา','var(--st-good)'],['สาย','var(--st-warn)'],['ไม่ครบ/ไม่ลงเวลา','var(--st-bad)']]),
    tbl(['วันที่','ตรงเวลา','สาย','ไม่ครบ'],D.daysArr.slice().reverse().map(function(c){return [sd(c.d),c.ok,c.late,c.miss];}),dayKeys),true);

  var pts=[];
  if(dashDays<=14)D.daysArr.forEach(function(c){var n=c.ok+c.late+c.miss;if(n)pts.push({x:sd(c.d),t:sd(c.d),v:pct(c.ok,n),n:n,k:'day:'+c.d});});
  else{var wk={};D.daysArr.forEach(function(c){var k=mondayOf(c.d),o=wk[k]||(wk[k]={k:k,ok:0,n:0});o.ok+=c.ok;o.n+=c.ok+c.late+c.miss;});Object.keys(wk).sort().forEach(function(k){if(wk[k].n)pts.push({x:sd(k),t:'สัปดาห์ '+sd(k),v:pct(wk[k].ok,wk[k].n),n:wk[k].n,k:'wk:'+k});});}
  var c2=dcard('ontime','อัตราตรงเวลา',dashDays<=14?'รายวัน':'รายสัปดาห์ (เริ่มวันจันทร์)',function(w){return pts.length?chLine(pts,w,200,'เส้นอัตราตรงเวลา','%'):'<p class="muted small">ยังไม่มีข้อมูล</p>';},w1,'',tbl(['ช่วง','ตรงเวลา %','จำนวนกะ'],pts.map(function(p){return [p.t,p.v+'%',p.n];}),pts.map(function(p){return p.k;})));

  var late=D.per.slice().sort(function(a,b){return b.late-a.late||a.name.localeCompare(b.name);});
  var c3=dcard('late','จำนวนครั้งที่สายต่อคน','เรียงจากมากไปน้อย',function(w){return chHBar(late.map(function(p){return {label:p.name,v:p.late,text:String(p.late),cls:'f-warn',k:'emp:'+p.id,tip:[['สาย',p.late+' ครั้ง','var(--st-warn)'],['ตรงเวลา',pct(p.ok,p.fin)+'%'],['จำนวนกะ',String(p.fin)]]};}),w,'กราฟแท่งแนวนอนจำนวนครั้งที่สาย');},w1,'',
    tbl(['ชื่อ','สาย','ตรงเวลา %','กะทั้งหมด'],late.map(function(p){return [p.name,p.late,pct(p.ok,p.fin)+'%',p.fin];}),late.map(function(p){return 'emp:'+p.id;})));

  var shRows=SHIFTS.filter(function(s){return D.sh[s.id];}).map(function(s){var z=D.sh[s.id],avg=Math.round(z.sum/z.n);return {label:s.team+' '+shiftLabel(s),v:avg,k:'shift:'+s.id,tip:[['เข้างานเฉลี่ย',(avg>0?'+':'')+avg+' นาที','var(--s1)'],['จำนวนครั้ง',String(z.n)],['สาย',String(z.late)]]};});
  var c4=dcard('avgin','เวลาเข้างานเฉลี่ยของแต่ละกะ','นาทีก่อน/หลังเวลาเริ่มกะ (ติดลบ = เข้าก่อน)',function(w){return chDiverge(shRows,w,'กราฟเวลาเข้างานเฉลี่ยต่อกะ');},w1,'',tbl(['กะ','เฉลี่ย (นาที)'],shRows.map(function(r){return [r.label,r.v];}),shRows.map(function(r){return r.k;})));

  var hb=[['ก่อน 15+','ก่อนเริ่มกะเกิน 15 นาที'],['ก่อน <15','ก่อนเริ่มกะ 1–15 นาที'],['0–14','หลังเริ่มกะ 0–14 นาที'],['15–30','หลังเริ่มกะ 15–30 นาที'],['31–60','สาย 31–60 นาที'],['60+','สายเกิน 60 นาที']];
  var hItems=D.hist.map(function(v,i){return {label:hb[i][0],v:v,k:'hist:'+i,cls:i>=4?'f-warn':'f-s1',tip:[['จำนวนครั้ง',String(v),i>=4?'var(--st-warn)':'var(--s1)']],tipT:hb[i][1]};});
  var c5=dcard('dist','การกระจายเวลาเข้างาน','จำนวนครั้งตามช่วงนาทีเทียบเวลาเริ่มกะ (สีเหลือง = เกินเวลาผ่อนผัน)',function(w){return chCols(hItems,w,210,'กราฟการกระจายเวลาเข้างาน');},w1,'',tbl(['ช่วง','ครั้ง'],hItems.map(function(i,k){return [hb[k][1],i.v];}),hItems.map(function(i){return i.k;})));

  var dwn=['จันทร์','อังคาร','พุธ','พฤหัส','ศุกร์','เสาร์','อาทิตย์'];
  var wItems=D.dow.map(function(v,i){return {label:dwn[i].slice(0,3)==='พฤห'?'พฤ.':dwn[i].slice(0,2)+'.',v:v,k:'dow:'+i,cls:'f-warn',tip:[['สาย',v+' ครั้ง','var(--st-warn)']],tipT:'วัน'+dwn[i]};});
  var c6=dcard('dow','วันที่มีคนสายมากที่สุด','รวมทุกทีมตามวันในสัปดาห์',function(w){return chCols(wItems,w,210,'กราฟจำนวนครั้งที่สายตามวัน');},w1,'',tbl(['วัน','สาย (ครั้ง)'],wItems.map(function(i,k){return [dwn[k],i.v];}),wItems.map(function(i){return i.k;})));

  var hrsP=D.per.slice().sort(function(a,b){return b.hrs-a.hrs;});
  var c7=dcard('hours','ชั่วโมงทำงานต่อคน','รวมกะทำแทนด้วย',function(w){return chHBar(hrsP.map(function(p){return {label:p.name,v:Math.round(p.hrs),text:Math.round(p.hrs)+' ชม.',k:'emp:'+p.id,tip:[['ชั่วโมงรวม',p.hrs.toFixed(1),'var(--s1)'],['จำนวนกะ',String(p.fin)]]};}),w,'กราฟชั่วโมงทำงานต่อคน');},w1,'',tbl(['ชื่อ','ชั่วโมง','กะ'],hrsP.map(function(p){return [p.name,p.hrs.toFixed(1),p.fin];}),hrsP.map(function(p){return 'emp:'+p.id;})));

  var hTeam=D.daysArr.map(function(c){return {d:c.d,vals:[Math.round(c.hA),Math.round(c.hB)],k:'day:'+c.d};});
  var serT=[{name:'ทีม A',cls:'f-s1',v:'var(--s1)'},{name:'ทีม B',cls:'f-s2',v:'var(--s2)'}];
  var c8=dcard('teamhrs','ชั่วโมงทำงานรายวันแยกทีม','รวมชั่วโมงของพนักงานที่ลงเวลาครบ',function(w){return chStacked(hTeam,w,210,serT,'กราฟชั่วโมงรายวันแยกทีม');},w1,legendHtml([['ทีม A','var(--s1)'],['ทีม B','var(--s2)']]),tbl(['วันที่','ทีม A','ทีม B'],D.daysArr.slice().reverse().map(function(c){return [sd(c.d),Math.round(c.hA),Math.round(c.hB)];}),dayKeys));

  var teamItems=['A','B'].map(function(k,i){var T=D.tm[k];return {label:TEAMS[k].name,v:pct(T.ok,T.n),text:pct(T.ok,T.n)+'%',cls:C_FILL[i],k:'team:'+k,tip:[['ตรงเวลา',pct(T.ok,T.n)+'%',C_VAR[i]],['จำนวนกะ',String(T.n)],['ชั่วโมงรวม',T.hrs.toFixed(0)]]};});
  var c9=dcard('teams','เปรียบเทียบอัตราตรงเวลาแต่ละทีม','ร้อยละของกะที่เข้างานตรงเวลา',function(w){return chHBar(teamItems,w,'กราฟเปรียบเทียบอัตราตรงเวลาของทีม A และ B',{max:100});},w1,legendHtml([['ทีม A','var(--s1)'],['ทีม B','var(--s2)']]),tbl(['ทีม','ตรงเวลา %','กะ'],teamItems.map(function(i,k){return [i.label,i.v+'%',D.tm[['A','B'][k]].n];}),teamItems.map(function(i){return i.k;})));

  var lvItems=[['vac','ลาพักร้อน'],['per','ลากิจ'],['sick','ลาป่วย']].map(function(x){return {label:x[1],v:D.leave[x[0]],k:'leave:'+x[0]};});
  var c10=dcard('leave','การลาและกะที่มีคนทำแทน','แยกตามประเภทการลาในช่วงที่เลือก',function(){return chDonut(lvItems,'กราฟโดนัทประเภทการลา');},w1,legendHtml(lvItems.map(function(i,k){return [i.label+' '+i.v,C_VAR[k]];})),tbl(['ประเภท','กะ'],lvItems.map(function(i){return [i.label,i.v];}),lvItems.map(function(i){return i.k;})));

  var cov=Object.keys(D.cover).map(function(k){return {id:k,n:D.cover[k]};}).sort(function(a,b){return b.n-a.n;});
  var c11=dcard('cover','ภาระการทำแทนต่อคน','จำนวนกะที่ทำแทนคนหยุด (พนักงานสำรอง Ops ผู้ดูแล และทีมอื่น)',function(w){return cov.length?chHBar(cov.map(function(c){var e=emp(c.id);return {label:e?e.name:'—',v:c.n,text:c.n+' กะ',cls:'f-s3',k:'cover:'+c.id,tip:[['ทำแทน',c.n+' กะ','var(--s3)'],['ทีม',e?teamLabel(e):'—']]};}),w,'กราฟจำนวนกะที่ทำแทนต่อคน'):'<p class="muted small">ไม่มีกะทำแทนในช่วงนี้</p>';},w1,'',tbl(['ชื่อ','กะที่ทำแทน'],cov.map(function(c){var e=emp(c.id);return [e?e.name:'—',c.n];}),cov.map(function(c){return 'cover:'+c.id;})));

  var heatCard=dashCalHtml(idx,t);

  return '<div class="stack">'+
    '<div class="row between"><div><h1>ภาพรวม</h1><p class="muted">'+esc(thDate(today,{weekday:'long',day:'numeric',month:'long',year:'numeric'}))+' · <span class="tnum" id="clk">'+bkk(t).hms+'</span></p></div><p class="muted small hint">กดที่ตัวเลข กราฟ หรือรายการ เพื่อดูรายละเอียด</p></div>'+mine+
    '<div class="sech"><h2>ตอนนี้</h2></div>'+
    '<div class="kpis">'+kpiB('now:working','กำลังทำงาน',B.working)+kpiB('now:waiting','รอเข้างาน',B.waiting)+kpiB('now:late','สาย / ยังไม่เข้า',B.late)+kpiB('now:off','วันนี้มีคนหยุด',B.off)+kpiB('now:pend','คำขอลารออนุมัติ',pend.length)+'</div>'+
    '<div class="pgrid">'+(B.cards.join('')||'<p class="muted">วันนี้ไม่มีกะ</p>')+'</div>'+
    '<div class="cgrid">'+heatCard+'<section class="card"><h3>คำขอลาที่รออนุมัติ</h3><div class="list">'+pendHtml+'</div></section><section class="card"><h3>ใครหยุด ใครทำแทน (14 วันข้างหน้า)</h3><div class="list" style="max-height:300px;overflow:auto">'+(upc.join('')||'<p class="muted small" style="padding:10px 0">ไม่มีการหยุดล่วงหน้า</p>')+'</div></section></div>'+
    '<div class="sech"><h2>สถิติย้อนหลัง</h2><div class="seg" role="group" aria-label="ช่วงเวลา">'+[7,30,90].map(function(n){return '<button data-act="dash" data-n="'+n+'" aria-pressed="'+(dashDays===n)+'">'+n+' วัน</button>';}).join('')+'</div></div>'+
    '<div class="kpis">'+kpiB('st:ok','ตรงเวลา',pct(tot.ok,tot.fin)+'%','heroK','<span class="muted small">'+tot.ok+' จาก '+tot.fin+' กะ ใน '+dashDays+' วัน</span>')+
    kpiB('st:late','สาย',tot.late)+kpiB('st:early','ออกก่อนเวลา',tot.early)+kpiB('st:miss','ไม่ครบ/ไม่ลงเวลา',tot.miss)+kpiB('st:hours','ชั่วโมงทำงานรวม',Math.round(tot.hours))+kpiB('st:cover','กะที่มีคนทำแทน',tot.cover)+'</div>'+
    '<div class="cgrid">'+c1+c2+c3+c4+c5+c6+c7+c8+c9+c10+c11+'<section class="card"><h3>ควรติดตาม</h3><p class="muted small">คนที่สายหรือลงเวลาไม่ครบมากที่สุดในช่วงนี้</p><div class="list">'+attn+'</div></section></div></div>';
}
