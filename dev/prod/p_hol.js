/* วันหยุดราชการ/นักขัตฤกษ์ + ล้างข้อมูลทดสอบ (หน้าตั้งค่าระบบของผู้ดูแล)
   วันหยุด: ทีม A ไม่ทำงาน (teamWorksS) · ทีม B ทำตามรอบปกติ · ตารางกะแสดงชื่อวันหยุด
   ล้างข้อมูล: เลือกหมวด + ช่วงวันที่ → นับก่อน → ถามยืนยันทุกครั้ง → ลบ (admin_clear_data) · ไม่แตะบัญชีผู้ใช้ */
var holUi={err:'',msg:'',del:''},clrUi={att:true,sched:true,notif:true,rota:false,ask:null,err:'',msg:''};
function holName(d){return state.holidays&&state.holidays[d]?_td(state.holidays[d]):'';} // ชื่อที่ใส่ไว้ตั้งต้นแปลเป็นอังกฤษได้ · ชื่อที่ผู้ดูแลพิมพ์เองแสดงตามเดิม
function holCard(){
  var today=bkk(now()).date,y0=today.slice(0,4);
  var list=Object.keys(state.holidays||{}).filter(function(d){return d.slice(0,4)>=y0;}).sort();
  var byY={};list.forEach(function(d){(byY[d.slice(0,4)]=byY[d.slice(0,4)]||[]).push(d);});
  var rows=Object.keys(byY).map(function(y){
    return '<h3 style="margin:10px 0 2px">ปี '+(LANG==='en'?y:(+y+543))+' <span class="muted small">'+byY[y].length+' วัน</span></h3>'+
      byY[y].map(function(d){
        var past=d<today,ask=holUi.del===d;
        return '<div class="li hrow'+(past?' past':'')+'"><span class="tnum hd">'+esc(thDate(d,{weekday:'short',day:'numeric',month:'short'}))+'</span><span class="grow">'+esc(holName(d))+'</span>'+
          (ask?'<button class="btn danger sm" data-act="hol-del-yes" data-d="'+d+'">ยืนยันลบ</button><button class="btn sec sm" data-act="hol-del-no">ยกเลิก</button>'
              :'<button class="btn sec sm" data-act="hol-del" data-d="'+d+'" aria-label="ลบวันหยุด '+esc(holName(d))+'">ลบ</button>')+'</div>';
      }).join('');
  }).join('')||'<p class="muted small">ยังไม่มีวันหยุดในรายการ</p>';
  return '<section class="card stack" id="holCard"><h2>วันหยุดราชการ / นักขัตฤกษ์</h2>'+
    '<p class="muted small">ทีม A หยุดวันเหล่านี้ (ไม่มีกะ ไม่นับเป็นวันลา) · ทีม B ทำงานตามรอบปกติ · วันหยุดปี 2570 ใส่ตามปฏิทินทั่วไป ควรตรวจกับประกาศ ครม. อีกครั้ง</p>'+
    '<div class="fields"><div><label>วันที่</label>'+dateField('holD',getDv('holD',today))+'</div><div><label for="holN">ชื่อวันหยุด</label><input id="holN" maxlength="80" placeholder="เช่น วันหยุดพิเศษ"></div></div>'+
    '<div class="row"><button class="btn" data-act="hol-add">เพิ่ม / แก้ไขวันหยุด</button>'+(holUi.msg?'<span class="ok" role="status">'+esc(holUi.msg)+'</span>':'')+(holUi.err?'<span class="err" role="alert">'+esc(holUi.err)+'</span>':'')+'</div>'+
    '<div class="list hlist">'+rows+'</div></section>';
}
function clrCard(){
  var today=bkk(now()).date,c=clrUi;
  var box=function(k,label,sub){return '<label class="clrk"><input type="checkbox" data-clr="'+k+'"'+(c[k]?' checked':'')+'> <span><b>'+label+'</b><br><span class="muted small">'+sub+'</span></span></label>';};
  var ask='';
  if(c.ask){
    var n=c.ask.n,parts=[];
    if(c.ask.att)parts.push('ลงเวลา '+n.attendance+' รายการ');
    if(c.ask.sched)parts.push('หยุด/ทำแทน '+n.overrides+' รายการ · คำขอลา '+n.leaves+' รายการ');
    if(c.ask.notif)parts.push('แจ้งเตือน '+n.notifications+' รายการ');
    if(c.ask.rota)parts.push('การตั้งหมุนกะ '+n.rota+' รายการ');
    var total=n.attendance+n.overrides+n.leaves+n.notifications+n.rota;
    ask='<div class="alert-y stack" style="gap:8px" role="alert"><b>ต้องการล้างข้อมูลจริงหรือไม่?</b><span class="small">ช่วง '+esc(thDate(c.ask.from,{day:'numeric',month:'short',year:'numeric'}))+' – '+esc(thDate(c.ask.to,{day:'numeric',month:'short',year:'numeric'}))+'</span>'+
      '<ul class="small" style="margin:0;padding-left:18px">'+parts.map(function(p){return '<li>'+p+'</li>';}).join('')+'</ul>'+
      '<span class="small">ลบแล้วกู้คืนไม่ได้ · บัญชีผู้ใช้ไม่ถูกลบ</span>'+
      '<div class="row" style="gap:8px">'+(total?'<button class="btn danger" data-act="clr-yes">ยืนยันล้างข้อมูล</button>':'<span class="muted small">ไม่มีข้อมูลให้ลบในช่วงนี้</span>')+'<button class="btn sec" data-act="clr-no">ยกเลิก</button></div></div>';
  }
  return '<section class="card stack" id="clrCard"><h2>ล้างข้อมูลทดสอบ</h2>'+
    '<p class="muted small">ลบข้อมูลที่ใส่ระหว่างทดสอบ · <b>บัญชีผู้ใช้ กฎการลงเวลา และวันหยุด ไม่ถูกลบ</b></p>'+
    '<div class="stack" style="gap:6px">'+
      box('att','ลงเวลาเข้า-ออกงาน','รวมตำแหน่งตอนเข้า/ออกงาน')+
      box('sched','หยุด / ทำแทน และคำขอลา','การตั้งหยุด ผู้ทำแทน เรียกกะฉุกเฉิน และคำขอลาที่มีวันอยู่ในช่วง')+
      box('notif','แจ้งเตือน','รายการในกระดิ่ง')+
      box('rota','การตั้งหมุนกะ (ทีม A / B)','รอบที่เริ่มในช่วงวันที่ที่เลือก')+
    '</div>'+
    '<div class="fields"><div><label>ตั้งแต่วันที่</label>'+dateField('clrFrom',getDv('clrFrom',today.slice(0,4)+'-01-01'))+'</div><div><label>ถึงวันที่</label>'+dateField('clrTo',getDv('clrTo',today))+'</div></div>'+
    '<div class="row"><button class="btn danger" data-act="clr-check"'+(c.ask?' disabled':'')+'>ล้างข้อมูล…</button>'+(c.msg?'<span class="ok" role="status">'+esc(c.msg)+'</span>':'')+(c.err?'<span class="err" role="alert">'+esc(c.err)+'</span>':'')+'</div>'+
    ask+'</section>';
}
function rerenderSettings(){if(view==='settings')renderView();}
document.addEventListener('change',function(e){var k=e.target&&e.target.getAttribute&&e.target.getAttribute('data-clr');if(k){clrUi[k]=e.target.checked;clrUi.ask=null;}});
document.addEventListener('click',async function(e){
  var b=e.target.closest&&e.target.closest('[data-act]');if(!b||view!=='settings'||!me||me.role!=='admin')return;
  var a=b.getAttribute('data-act');
  if(['hol-add','hol-del','hol-del-yes','hol-del-no','clr-check','clr-yes','clr-no'].indexOf(a)<0)return;
  e.stopPropagation();
  try{
    if(a==='hol-add'){
      var d=getDv('holD',bkk(now()).date),nm=($('holN').value||'').trim();holUi.err='';holUi.msg='';
      if(!nm){holUi.err='ใส่ชื่อวันหยุด';rerenderSettings();return;}
      if(busy)return;busy=true;
      try{await rpc('admin_set_holiday',{p_d:d,p_name:nm});state.holidays[d]=nm;holUi.msg='บันทึกวันหยุดแล้ว';}finally{busy=false;}
    }else if(a==='hol-del'){holUi.del=b.getAttribute('data-d');holUi.msg='';holUi.err='';}
    else if(a==='hol-del-no'){holUi.del='';}
    else if(a==='hol-del-yes'){
      var dd=b.getAttribute('data-d');if(busy)return;busy=true;
      try{await rpc('admin_set_holiday',{p_d:dd,p_name:''});delete state.holidays[dd];holUi.del='';holUi.msg='ลบวันหยุดแล้ว';}finally{busy=false;}
    }else if(a==='clr-no'){clrUi.ask=null;}
    else if(a==='clr-check'||a==='clr-yes'){
      var c=clrUi,from=getDv('clrFrom',''),to=getDv('clrTo','');c.err='';c.msg='';
      if(a==='clr-check'){
        if(!c.att&&!c.sched&&!c.notif&&!c.rota){c.err='เลือกอย่างน้อย 1 อย่างที่จะล้าง';rerenderSettings();return;}
        if(!from||!to||from>to){c.err='เลือกช่วงวันที่ให้ถูกต้อง';rerenderSettings();return;}
      }
      var q=a==='clr-yes'?c.ask:{from:from,to:to,att:c.att,sched:c.sched,notif:c.notif,rota:c.rota};
      if(!q||busy)return;busy=true;
      try{
        var n=await rpc('admin_clear_data',{p_from:q.from,p_to:q.to,p_att:q.att,p_sched:q.sched,p_notif:q.notif,p_rota:q.rota,p_dry:a==='clr-check'});
        if(a==='clr-check'){q.n=n;c.ask=q;}
        else{c.ask=null;c.msg='ล้างข้อมูลแล้ว';try{await loadAll();}catch(x){}renderChrome();toast('ล้างข้อมูลแล้ว','ลงเวลา '+n.attendance+' · หยุด/ทำแทน '+n.overrides+' · คำขอลา '+n.leaves+' · แจ้งเตือน '+n.notifications+' · หมุนกะ '+n.rota);}
      }finally{busy=false;}
    }
  }catch(err){if(a.indexOf('hol')===0)holUi.err=errMsg(err);else clrUi.err=errMsg(err);}
  rerenderSettings();
},true);
