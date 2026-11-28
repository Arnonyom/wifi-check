/* ---------- Supabase data layer ---------- */
var CFG=window.APP_CONFIG||{};
var sb=null;
try{sb=window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});}catch(e){sb=null;}
var busy=false,loginMsg='',lastNoteTs=0,loaded=false,curUid=null;
function emptyState(){return {settings:{openBefore:30,lateAfter:30},employees:[],overrides:{},attendance:[],notifications:[],leaves:[],locs:{},holidays:{}};}
function save(){}
function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function errMsg(e){
  var m=(e&&e.message)||String(e||'เกิดข้อผิดพลาด');
  if(m.indexOf('profiles_one_per_shift')>=0)return 'กะนี้มีผู้ประจำอยู่แล้ว ย้ายคนนั้นไปกะอื่นก่อน';
  if(/Failed to fetch|NetworkError|Load failed/i.test(m))return 'เชื่อมต่ออินเทอร์เน็ตไม่ได้ ลองใหม่อีกครั้ง';
  if(/JWT|token/i.test(m)&&/expired|invalid/i.test(m))return 'หมดเวลาการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่';
  return m;
}
async function adminFn(body,again){
  var r=await sb.functions.invoke('admin-users',{body:body});
  if(r.error){
    var m=r.error.message,st=r.error.context&&r.error.context.status;
    try{var j=await r.error.context.json();if(j&&j.error)m=j.error;}catch(e){}
    // 401 = การล็อกอินของเครื่องนี้ใช้ไม่ได้แล้ว (หมดอายุ หรือถูกออกจากระบบจากที่อื่น)
    if(st===401||m==='ยังไม่ได้ล็อกอิน'){
      if(!again){var rf=null;try{rf=await sb.auth.refreshSession();}catch(e){}if(rf&&rf.data&&rf.data.session&&!rf.error)return adminFn(body,true);}
      sessionLost();
      throw new Error('การเข้าสู่ระบบของเครื่องนี้หมดอายุ กรุณาเข้าสู่ระบบใหม่');
    }
    throw new Error(m);
  }
  if(r.data&&r.data.error)throw new Error(r.data.error);
  return r.data;
}
/* การล็อกอินใช้ไม่ได้แล้ว → ล้างข้อมูลในเครื่อง กลับหน้าล็อกอิน พร้อมบอกเหตุผล */
function sessionLost(){
  setTimeout(async function(){
    try{await sb.auth.signOut({scope:'local'});}catch(e){}
    me=null;pwm=null;modal=null;bellOpen=false;dp=null;view='home';state=emptyState();
    loginMsg='การเข้าสู่ระบบหมดอายุ (อาจออกจากระบบจากเครื่องอื่น) กรุณาเข้าสู่ระบบใหม่';renderAll();
  },1500);
}
async function rpc(name,args){
  var r=await sb.rpc(name,args||{});
  if(r.error)throw r.error;
  return Array.isArray(r.data)?r.data[0]:r.data;
}
function mapEmp(p){
  return {id:p.id,username:p.username,name:p.name,role:p.role,team:p.team,shift:p.shift_id,active:p.active,canWork:p.can_work,notify:p.notify,mustChange:!!p.must_change_pw,sortOrder:p.sort_order==null?null:p.sort_order,push:lsGet('wc-push-'+p.id)==='1'};
}
async function loadAll(){
  var today=bkk(Date.now()).date,since=addDays(today,-130);
  var q=await Promise.all([
    sb.rpc('server_now'),
    sb.from('profiles').select('*').order('created_at'),
    sb.from('settings').select('*').eq('id',1).maybeSingle(),
    sb.from('overrides').select('*').gte('work_date',since),
    sb.from('attendance').select('*').gte('work_date',since).order('check_in'),
    sb.from('leaves').select('*').order('created_at'),
    sb.from('notifications').select('*').order('ts',{ascending:false}).limit(200),
    sb.from('notification_reads').select('notif_id'),
    sb.from('rota_periods').select('*').order('week_from'),
    sb.from('rota_b').select('*').order('start_date')
  ]);
  for(var i=0;i<q.length;i++)if(q[i].error)throw q[i].error;
  // ตำแหน่งตอนเข้า/ออกงาน: เห็นเฉพาะของตัวเอง (ผู้ดูแลเห็นทุกคน) · ถ้าโหลดไม่ได้ก็ใช้งานส่วนอื่นต่อได้
  // วันหยุดราชการ/นักขัตฤกษ์ (ทีม A ไม่ทำงาน) · โหลดไม่ได้ก็ใช้งานส่วนอื่นต่อได้
  var hq=null;try{hq=await sb.from('holidays').select('*').order('d');}catch(e){hq=null;}
  var lq=null;try{lq=await sb.from('attendance_locations').select('*').gte('created_at',since+'T00:00:00+07:00');}catch(e){lq=null;}
  if(q[0].data)clockOffset=Date.parse(q[0].data)-Date.now();
  var S=emptyState();
  S.employees=(q[1].data||[]).map(mapEmp);
  if(q[2].data)S.settings={openBefore:q[2].data.open_before,lateAfter:q[2].data.late_after};
  (q[3].data||[]).forEach(function(o){S.overrides[o.work_date+'|'+o.shift_id]={off:true,cover:o.cover,note:o.note||'',kind:o.kind||'',leave:o.leave_id,by:o.set_by,ts:Date.parse(o.set_at)};});
  S.attendance=(q[4].data||[]).map(function(a){return {id:a.id,emp:a.emp,date:a.work_date,shift:a.shift_id,in:Date.parse(a.check_in),out:a.check_out?Date.parse(a.check_out):null,late:a.late_min,lateFlag:a.late_flag,early:a.early_min,earlyFlag:a.early_flag,cover:a.is_cover,byAdmin:a.by_admin||null,adminNote:a.admin_note||''};});
  S.leaves=(q[5].data||[]).map(function(l){return {id:l.id,emp:l.emp,type:l.type,from:l.from_date,to:l.to_date,days:l.days,reason:l.reason||'',status:l.status,note:l.note||'',by:l.decided_by,decidedTs:l.decided_at?Date.parse(l.decided_at):null,ts:Date.parse(l.created_at)};});
  var read={};(q[7].data||[]).forEach(function(r){read[r.notif_id]=1;});
  var uid0=me?me.id:curUid;
  S.notifications=(q[6].data||[]).map(function(n){return {id:n.id,ts:Date.parse(n.ts),to:n.to_ids||[],title:n.title,body:n.body||'',kind:n.kind||'',read:read[n.id]&&uid0?[uid0]:[]};});
  S.rota=(q[8].data||[]).map(function(r){return {week:r.week_from,active:r.active,cyc:r.cyc||3,ids:[r.a2,r.a3,r.a4,r.a1||null]};});
  S.rotaB=(q[9].data||[]).map(function(r){return {start:r.start_date,active:r.active,day:r.b_day,night:r.b_night};});
  (lq&&!lq.error?lq.data||[]:[]).forEach(function(l){S.locs[l.att_id+'|'+l.kind]={status:l.status,lat:l.lat,lng:l.lng,acc:l.acc,place:l.place||null};});
  (hq&&!hq.error?hq.data||[]:[]).forEach(function(h){S.holidays[h.d]=h.name;});
  state=S;
  if(me){var fresh=emp(me.id);if(fresh)me=fresh;}
  loaded=true;
}
function announceNew(first){
  var mx=lastNoteTs;
  state.notifications.slice().sort(function(a,b){return a.ts-b.ts;}).forEach(function(n){
    if(n.ts>lastNoteTs){
      mx=Math.max(mx,n.ts);
      if(!first&&me&&me.notify!==false&&n.read.indexOf(me.id)<0&&(me.role==='admin'||n.to.indexOf(me.id)>=0)){
        toast(n.title,n.body,n.kind,n.id);
        if(me.push){try{if(window.Notification&&Notification.permission==='granted')new Notification(n.title,{body:n.body});}catch(e){}}
      }
    }
  });
  lastNoteTs=mx;
}
async function refreshData(){
  if(!me||busy)return;
  try{await loadAll();announceNew(false);renderChrome();if(det.length)renderDet();if(!modal&&!dp&&(view==='home'||(view==='today'&&!document.querySelector('details.tv[open]'))))renderView();}catch(e){}
}
async function enter(uid){
  curUid=uid;
  $('main').innerHTML='<p class="muted center" style="padding:40px 0" role="status">กำลังโหลดข้อมูล…</p>';
  try{await loadAll();}catch(e){loginMsg=errMsg(e);await sb.auth.signOut({scope:'local'});me=null;renderAll();return false;}
  var e=emp(uid);
  if(!e||!e.active){loginMsg='บัญชีนี้ถูกปิดใช้งาน ติดต่อผู้ดูแล';await sb.auth.signOut({scope:'local'});me=null;renderAll();return false;}
  me=e;view=e.role==='admin'?'today':'home';schedTeam=(e.team==='B')?'B':'A';schedAnchor=bkk(now()).date;
  editSlot=null;editEmp=null;armed='';modal=null;bellOpen=false;flash=null;dp=null;lvOpen=null;lvReject=null;lvErr='';loginMsg='';
  det=[];lastNoteTs=0;announceNew(true);
  renderAll();return true;
}

