/* ทดสอบตำแหน่ง (Admin tool › ทดสอบ) — 29 พ.ย. 2569
   กด "สแกนตำแหน่ง" → อ่านตำแหน่งจากเครื่องนี้แบบเดียวกับตอนพนักงานลงเวลา (ความแม่นยำสูง รอได้ 12 วินาที)
   → แปลงเป็นชื่อสถานที่ด้วย OpenStreetMap → แสดงผลเท่านั้น ไม่บันทึกลงฐานข้อมูล
   เก็บผลไว้ 5 ครั้งล่าสุด (เฉพาะหน้านี้ หายเมื่อรีเฟรช) ไว้เทียบกัน */
var gt={busy:false,list:[],perm:''};
function gtPermCheck(){
  try{if(navigator.permissions&&navigator.permissions.query)navigator.permissions.query({name:'geolocation'}).then(function(r){gt.perm=r.state;var el=$('gtPerm');if(el)el.innerHTML=gtPermHtml();}).catch(function(){});}catch(e){}
}
function gtPermHtml(){
  var p=gt.perm;if(!p)return '';
  return 'สิทธิ์ตำแหน่งของเบราว์เซอร์นี้: '+(p==='granted'?'<span class="chip">อนุญาตแล้ว</span>':p==='denied'?'<span class="chip off">ไม่อนุญาต</span>':'<span class="chip late">ยังไม่ได้เลือก (จะถามตอนสแกน)</span>');
}
function gtQuality(acc){return acc<=20?['ok','แม่นยำมาก']:acc<=100?['','พอใช้']:acc<=500?['late','หยาบ']:['off','หยาบมาก'];}
function gtRun(){
  if(gt.busy)return;gt.busy=true;rerenderSettings();
  var r={ts:Date.now(),status:'wait',lat:null,lng:null,acc:null,place:null,ms:0},t0=Date.now();gt.list.unshift(r);gt.list=gt.list.slice(0,5);
  var done=function(){r.ms=Date.now()-t0;gt.busy=false;gtPermCheck();rerenderSettings();};
  var M=window.__geoMock,nav=M&&M.geo?M.geo:(navigator.geolocation||null);
  if(!nav){r.status='unsupported';done();return;}
  try{
    nav.getCurrentPosition(function(pos){
      r.status='ok';r.lat=pos.coords.latitude;r.lng=pos.coords.longitude;r.acc=Math.round(pos.coords.accuracy||0);r.ms=Date.now()-t0;r.placeWait=true;rerenderSettings();
      geoReverse(r.lat,r.lng).then(function(pl){r.place=pl;r.placeWait=false;gt.busy=false;gtPermCheck();rerenderSettings();});
    },function(err){r.status=err&&err.code===1?'denied':(err&&err.code===3?'timeout':'unavailable');done();},
    {enableHighAccuracy:true,timeout:12000,maximumAge:0});
  }catch(e){r.status='unavailable';done();}
}
function gtRow(r,i){
  var when=esc(bkk(r.ts).hms);
  var st=r.status==='wait'?'<span class="muted">กำลังหาตำแหน่ง…</span>'
    :r.status==='ok'?'<span class="chip">อ่านตำแหน่งได้</span>'
    :r.status==='denied'?'<span class="chip off">ไม่ได้อนุญาตตำแหน่ง</span>'
    :r.status==='timeout'?'<span class="chip late">หมดเวลา (เกิน 12 วินาที)</span>'
    :r.status==='unsupported'?'<span class="chip off">เครื่อง/เบราว์เซอร์นี้ไม่รองรับ</span>':'<span class="chip late">อ่านค่าตำแหน่งไม่ได้</span>';
  var body='';
  if(r.status==='ok'){
    var q=gtQuality(r.acc);
    body='<div class="gtres"><div class="gtplace">'+(r.placeWait?'<span class="muted">กำลังหาชื่อสถานที่…</span>':r.place?'<b>'+esc(r.place)+'</b>':'<span class="muted">หาชื่อสถานที่ไม่ได้ (ยังมีพิกัด)</span>')+'</div>'+
      '<dl class="kv gtkv"><div><dt>พิกัด</dt><dd class="tnum">'+geoCoords(r)+'</dd></div>'+
      '<div><dt>ความแม่นยำ</dt><dd class="tnum">± '+r.acc+' ม. <span class="chip '+q[0]+'">'+q[1]+'</span></dd></div>'+
      '<div><dt>ใช้เวลา</dt><dd class="tnum">'+(r.ms/1000).toFixed(1)+' วินาที</dd></div></dl>'+
      '<a class="btn sec sm" href="'+geoMap(r)+'" target="_blank" rel="noopener">ดูบนแผนที่ ↗</a></div>';
  }else if(r.status==='denied'){
    body='<p class="small">พนักงานที่ไม่อนุญาตตำแหน่ง<b>จะลงเวลาไม่ได้</b> · เปิดสิทธิ์ได้ที่การตั้งค่าเบราว์เซอร์/แอป แล้วลองสแกนใหม่</p>';
  }else if(r.status!=='wait'){
    body='<p class="muted small">ถ้าเป็นแบบนี้ตอนลงเวลา พนักงานยังลงเวลาได้ แต่ผู้ดูแลจะเห็นป้าย "อ่านค่าตำแหน่งไม่ได้" · ลองออกไปที่โล่ง เปิด GPS/Wi‑Fi แล้วสแกนใหม่</p>';
  }
  return '<div class="gtrow'+(i===0?' gtnew':'')+'"><div class="row between"><span>'+st+'</span><span class="muted small tnum">'+when+'</span></div>'+body+'</div>';
}
function geoTestCard(){
  if(!gt.perm)gtPermCheck();
  return '<section class="card stack" id="geoTestCard"><h2>ทดสอบตำแหน่ง</h2>'+
    '<p class="muted small">สแกนตำแหน่งของเครื่องนี้แบบเดียวกับตอนพนักงานกดเข้า/ออกงาน เพื่อดูว่าระบบเห็นว่าอยู่ที่ไหน · <b>ทดสอบเท่านั้น ไม่บันทึก</b></p>'+
    '<p class="small" id="gtPerm">'+gtPermHtml()+'</p>'+
    '<div><button class="btn ibtn" data-act="geot-run"'+(gt.busy?' disabled':'')+'>'+ico('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>')+'<span>'+(gt.busy?'กำลังสแกน…':'สแกนตำแหน่งตอนนี้')+'</span></button></div>'+
    (gt.list.length?'<div class="gtlist" aria-live="polite">'+gt.list.map(gtRow).join('')+'</div>':'')+
    '</section>';
}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-act="geot-run"]');if(b&&!b.disabled&&me&&me.role==='admin'){e.stopPropagation();gtRun();}},true);
