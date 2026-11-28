/* รอบ 29 พ.ย. 2569 (บ่าย)
   1) สำรองข้อมูลทั้งหมดเป็น Excel (Admin tool › นำเข้า/ส่งออก) — ดึงทุกตารางจากฐานข้อมูลใหม่ทั้งหมด (ไม่จำกัดวันที่) แยกเป็นชีต
   2) สถิติ: เลือกช่วงได้ 7 / 30 / 90 / 180 วัน / 1 ปี หรือกำหนดวันเอง (ไม่เกิน 366 วัน) · ช่วงยาวกว่า 92 วัน กราฟรายวันรวมเป็นรายสัปดาห์
      ข้อมูลเก่ากว่า 130 วันโหลดเพิ่มเฉพาะตอนเลือกช่วงยาว (histDays) ไม่ดึงทุกครั้ง
   3) แถบสีด้านบนของมือถือ/แอป (theme-color) เปลี่ยนตามธีม
   4) iOS: เปิดหน้าต่างตั้งค่าแล้วไม่เด้งแป้นพิมพ์เอง · ตอนพิมพ์ หน้าต่างยกขึ้นพ้นแป้นพิมพ์ */

/* ---------- 1) สำรองข้อมูล ---------- */
var BK_TABLES=[
  ['profiles','บัญชีผู้ใช้'],['attendance','ลงเวลา'],['attendance_locations','ตำแหน่งเข้าออก'],['overrides','หยุด-ทำแทน'],
  ['leaves','การลา'],['leave_quota','สิทธิ์วันลา'],['leave_quota_log','ประวัติสิทธิ์วันลา'],['rota_periods','หมุนกะทีม A'],
  ['rota_b','รอบทีม B'],['holidays','วันหยุด'],['settings','ตั้งค่า'],['notifications','แจ้งเตือน']
];
var BK_SKIP={avatar:1,prefs:1}; // รูป (ข้อมูลยาว) และธีมส่วนตัว ไม่ต้องสำรอง
var bkUi={busy:false,msg:'',err:'',prog:''};
async function bkFetch(t){
  var out=[],step=1000;
  for(var i=0;i<100;i++){
    var r=await sb.from(t).select('*').range(i*step,i*step+step-1);
    if(r.error)throw r.error;
    var d=r.data||[];out=out.concat(d);if(d.length<step)break;
  }
  return out;
}
function bkSheet(name,rows){
  if(!rows.length)return {name:name,rows:[['(ไม่มีข้อมูล)']],widths:[20]};
  var keys=[];rows.forEach(function(r){Object.keys(r).forEach(function(k){if(!BK_SKIP[k]&&keys.indexOf(k)<0)keys.push(k);});});
  // คอลัมน์ที่เป็นรหัสผู้ใช้ เติมชื่อไว้ข้าง ๆ ให้อ่านง่าย
  var idCols=keys.filter(function(k){return rows.some(function(r){var v=r[k];return typeof v==='string'&&emp(v);})||/^(emp|cover|by_admin|by_id|decided_by|set_by|updated_by|a1|a2|a3|a4|b_day|b_night)$/.test(k);});
  var head=[];keys.forEach(function(k){head.push(k);if(idCols.indexOf(k)>=0)head.push(k+'_name');});
  var body=rows.map(function(r){var a=[];keys.forEach(function(k){var v=r[k];a.push(v==null?'':typeof v==='object'?JSON.stringify(v):v);if(idCols.indexOf(k)>=0){var e=typeof v==='string'?emp(v):null;a.push(e?e.name:'');}});return a;});
  return {name:name,rows:[head].concat(body),widths:head.map(function(h){return /_name$|name|note|reason|body|place|title/.test(h)?24:/date|_at|ts|check_|^d$|from|to/.test(h)?20:12;})};
}
async function bkRun(){
  if(bkUi.busy)return;bkUi.busy=true;bkUi.err='';bkUi.msg='';rerenderSettings();
  try{
    var sheets=[],total=0;
    for(var i=0;i<BK_TABLES.length;i++){
      var t=BK_TABLES[i];bkUi.prog=(i+1)+'/'+BK_TABLES.length+' · '+t[1];var pe=$('bkProg');if(pe)pe.textContent=bkUi.prog;
      var rows=[];try{rows=await bkFetch(t[0]);}catch(e){rows=[{error:errMsg(e)}];}
      total+=rows.length;sheets.push(bkSheet(t[1],rows));
    }
    var d=bkk(now());
    XL.download(sheets,'wifi-check-backup-'+d.date+'-'+d.hms.slice(0,5).replace(':','')+'.xlsx');
    bkUi.msg='ดาวน์โหลดแล้ว '+sheets.length+' ชีต · '+total+' แถว';toast('สำรองข้อมูลแล้ว',bkUi.msg,'ok');
  }catch(e){bkUi.err=errMsg(e);}
  bkUi.busy=false;bkUi.prog='';rerenderSettings();
}
function bkCard(){
  return '<section class="card stack" id="bkCard"><h2>สำรองข้อมูลทั้งหมด (Excel)</h2>'+
    '<p class="muted small">ดาวน์โหลดข้อมูลทุกอย่างในระบบเป็นไฟล์ Excel ไฟล์เดียว แยกชีตตามหมวด: '+BK_TABLES.map(function(t){return t[1];}).join(' · ')+'</p>'+
    '<p class="muted small">แนะนำให้สำรองเก็บไว้ทุกเดือน (ฐานข้อมูลแบบฟรีไม่มีสำรองอัตโนมัติ) · ไม่มีรหัสผ่านอยู่ในไฟล์ · รูปโปรไฟล์ไม่รวม</p>'+
    '<div class="row"><button class="btn" data-act="bk-run"'+(bkUi.busy?' disabled':'')+'>'+ico('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>')+'<span>'+(bkUi.busy?'กำลังสำรองข้อมูล…':'ดาวน์โหลดข้อมูลทั้งหมด')+'</span></button>'+
    '<span class="muted small" id="bkProg" role="status">'+esc(bkUi.prog)+'</span>'+(bkUi.msg?'<span class="ok" role="status">'+esc(bkUi.msg)+'</span>':'')+(bkUi.err?'<span class="err" role="alert">'+esc(bkUi.err)+'</span>':'')+'</div></section>';
}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-act="bk-run"]');if(b&&!b.disabled&&me&&me.role==='admin'){e.stopPropagation();bkRun();}},true);

/* ---------- 2) ช่วงเวลาของสถิติ ---------- */
var dashTo='',dashCustom=false,histDays=130,histLoading=false;
var DASH_PRESETS=[[7,'7 วัน'],[30,'30 วัน'],[90,'90 วัน'],[180,'180 วัน'],[365,'1 ปี']];
function dashEnd(){var td=bkk(now()).date;return dashTo&&dashTo<td?dashTo:td;}
function dashStart(){return addDays(dashEnd(),-(dashDays-1));}
function daysBetween(a,b){return Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/864e5);}
// กำหนดเอง: อ่านวันที่ที่เลือก → ตั้ง dashDays/dashTo (ไม่เกิน 366 วัน ไม่เลยวันนี้)
function dashSync(){
  if(!dashCustom)return;
  var td=bkk(now()).date,t=getDv('dsTo',td),f=getDv('dsFrom',addDays(td,-29));
  if(t>td)t=td;if(f>t)f=t;if(daysBetween(f,t)>365)f=addDays(t,-365);
  dv.dsFrom=f;dv.dsTo=t;dashTo=t===td?'':t;dashDays=daysBetween(f,t)+1;
}
// ต้องการข้อมูลเก่ากว่าที่โหลดไว้ → โหลดเพิ่มครั้งเดียว
function dashNeedHist(){
  var need=daysBetween(dashStart(),bkk(now()).date)+3;
  if(need>histDays&&!histLoading){
    histDays=Math.min(400,Math.max(need,histDays));histLoading=true;
    loadAll().then(function(){histLoading=false;if(view==='report')renderView();},function(){histLoading=false;});
  }
  return histLoading;
}
function dashRangeHtml(){
  dashSync();
  var seg='<div class="seg dseg" role="group" aria-label="ช่วงเวลา">'+DASH_PRESETS.map(function(p){var on=!dashCustom&&dashDays===p[0];return '<button data-act="dash" data-n="'+p[0]+'" aria-pressed="'+on+'">'+p[1]+'</button>';}).join('')+
    '<button data-act="dash-custom" aria-pressed="'+dashCustom+'">กำหนดเอง</button></div>';
  var cus=dashCustom?'<div class="fields dsrange"><div><label>ตั้งแต่วันที่</label>'+dateField('dsFrom',dv.dsFrom)+'</div><div><label>ถึงวันที่</label>'+dateField('dsTo',dv.dsTo)+'</div></div>':'';
  var load=dashNeedHist()?'<p class="muted small" role="status">กำลังโหลดข้อมูลย้อนหลัง…</p>':'';
  return seg+cus+'<p class="muted small dsinfo">'+esc(thDate(dashStart(),{day:'numeric',month:'short',year:'numeric'}))+' – '+esc(thDate(dashEnd(),{day:'numeric',month:'short',year:'numeric'}))+' · '+dashDays+' วัน'+(dashDays>92?' · กราฟรายวันแสดงเป็นรายสัปดาห์':'')+'</p>'+load;
}
// ช่วงยาว: รวมรายวันเป็นรายสัปดาห์ (เริ่มวันจันทร์)
function weekly(rows){
  if(dashDays<=92)return rows;
  var m={},order=[];rows.forEach(function(r){var k=mondayOf(r.d);if(!m[k]){m[k]={d:k,vals:r.vals.map(function(){return 0;}),k:'wk:'+k};order.push(k);}r.vals.forEach(function(v,i){m[k].vals[i]+=v;});});
  return order.map(function(k){return m[k];});
}
function rangeTxt(){return dashTo||dashCustom?'ช่วง '+sd(dashStart())+' – '+sd(dashEnd()):'ช่วง '+dashDays+' วันล่าสุด';}
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('[data-act="dash"],[data-act="dash-custom"]');if(!b||view!=='report')return;
  e.stopPropagation();
  if(b.getAttribute('data-act')==='dash-custom'){var td=bkk(now()).date;dashCustom=true;dv.dsTo=dashEnd();dv.dsFrom=dashStart();if(dv.dsFrom===dv.dsTo)dv.dsFrom=addDays(td,-29);}
  else{dashCustom=false;dashTo='';dashDays=Number(b.getAttribute('data-n'));}
  renderView();
},true);

/* ---------- 3) แถบสีด้านบน (theme-color) ตามธีม ---------- */
function syncThemeColor(){
  try{
    var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement('meta');m.name='theme-color';document.head.appendChild(m);}
    var c=getComputedStyle(document.body).backgroundColor;
    if(!c||c==='rgba(0, 0, 0, 0)'||c==='transparent')c=getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()||'#F3F8EE';
    m.setAttribute('content',c);
  }catch(e){}
}
try{if(window.matchMedia)matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){setTimeout(syncThemeColor,50);});}catch(e){}

/* ---------- 4) iOS: แป้นพิมพ์ไม่บังหน้าต่าง ---------- */
(function(){
  var vv=window.visualViewport;if(!vv)return;
  var fit=function(){var kb=Math.max(0,window.innerHeight-vv.height-vv.offsetTop);document.documentElement.style.setProperty('--kb',kb+'px');};
  vv.addEventListener('resize',fit);vv.addEventListener('scroll',fit);
  document.addEventListener('focusin',function(e){var t=e.target;if(!t||!t.closest||!t.closest('section.spop.open'))return;if(!/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))return;setTimeout(function(){fit();try{t.scrollIntoView({block:'center'});}catch(x){}},300);});
})();
