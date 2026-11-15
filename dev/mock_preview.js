(function(){
var LS='mockdb';
function uuid(){return 'u'+Math.random().toString(36).slice(2,10);}
var P=[
 ['e0','admin','ผู้ดูแลระบบ','admin',null,null,'000000'],
 ['e1','somchai','สมชาย ใจดี','staff','A','A1','123456'],['e2','malee','มาลี รักงาน','staff','A','A2','123456'],
 ['e3','wichai','วิชัย มั่นคง','staff','A','A3','123456'],['e4','nattaya','ณัฐธิดา สุขใจ','staff','A','A4','123456'],
 ['e5','prasert','ประเสริฐ เก่งกล้า','staff','B','B1','123456'],['e6','kanya','กัญญา ศรีสุข','staff','B','B2','123456'],
 ['e7','anan','อนันต์ ใจเย็น','staff','OPS',null,'123456'],['e8','porntip','พรทิพย์ คล่องงาน','staff','OPS',null,'123456']];
var SH={A1:['A','08:30',510],A2:['A','10:00',540],A3:['A','18:00',540],A4:['A','23:30',540],B1:['B','07:00',720],B2:['B','19:00',720],A5:['A','19:00',540]};
var ROT=['A2','A3','A4','A1'],ANCHOR=null,ROTA=[],ROTB=[];
function monday(d){var w=dow(d);return addDays(d,-((w+6)%7));}
function rotaAt(d){var m=monday(d),b=null;ROTA.forEach(function(r){if(r.week_from<=m&&(!b||r.week_from>b.week_from))b=r;});return b&&b.active?b:null;}
function rotbAt(d){var b=null;ROTB.forEach(function(r){if(r.start_date<=d&&(!b||r.start_date>b.start_date))b=r;});return b&&b.active?b:null;}
function teamWorks(t,d){if(t==='A')return DAYS.A.indexOf(dow(d))>=0;var b=rotbAt(d);if(!b)return DAYS.B.indexOf(dow(d))>=0;var o=((Math.round((Date.parse(d)-Date.parse(b.start_date))/864e5)%14)+14)%14;return [0,1,2,3,7,8,9].indexOf(o)>=0;}
function regOf(db,d,sid){if(sid==='A5')return null;
  if(sid==='B1'||sid==='B2'){var b=rotbAt(d);if(b){var c=Math.floor(Math.round((Date.parse(d)-Date.parse(b.start_date))/864e5)/14)%2;return (sid==='B1')===(c===0)?b.b_day:b.b_night;}var q=db.profiles.find(function(p){return p.active&&p.role==='staff'&&p.shift_id===sid;});return q?q.id:null;}
  var r=rotaAt(d);if(r){var n=r.cyc,ids=[r.a2,r.a3,r.a4,r.a1].slice(0,n),j=ROT.slice(0,n).indexOf(sid);if(j>=0){var k=Math.round((Date.parse(monday(d))-Date.parse(r.week_from))/6048e5);return ids[((j-k)%n+n)%n];}var p=db.profiles.find(function(p){return p.active&&p.role==='staff'&&p.shift_id===sid&&ids.indexOf(p.id)<0;});return p?p.id:null;}
  var p2=db.profiles.find(function(p){return p.active&&p.role==='staff'&&p.shift_id===sid;});return p2?p2.id:null;}
function bkk(ts){var f=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit'});return f.format(new Date(ts));}
function addDays(d,n){var x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10);}
function dow(d){return new Date(d+'T00:00:00Z').getUTCDay();}
var DAYS={A:[1,2,3,4,5],B:[5,6,0,1]};
function st(d,sid){return Date.parse(d+'T'+SH[sid][1]+':00+07:00');}
function build(){
  var db={tokens:{},profiles:[],settings:[{id:1,open_before:30,late_after:30}],overrides:[],attendance:[],leaves:[],notifications:[],reads:[],pw:{}};
  P.forEach(function(p,i){db.profiles.push({id:p[0],username:p[1],name:p[2],role:p[3],team:p[4],shift_id:p[5],phone:'',active:true,can_work:false,notify:true,must_change_pw:p[1]==='somchai',created_at:new Date(1e12+i).toISOString()});db.pw[p[1]]=[p[0],p[1]==='admin'?'Admin@2026':'Temp1234!'];});
  var now=Date.now(),today=bkk(now),x=1;ANCHOR=monday(addDays(today,-28));ROTA=db.rota=[{week_from:ANCHOR,active:true,cyc:3,a2:'e2',a3:'e3',a4:'e4',a1:null},{week_from:monday(addDays(today,16)),active:true,cyc:4,a2:'e1',a3:'e2',a4:'e3',a1:'e4'}];var fr=addDays(today,16);while(dow(fr)!==5)fr=addDays(fr,1);ROTB=db.rota_b=[{start_date:fr,active:true,b_day:'e5',b_night:'e6'}];function R(){x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;}
  for(var i=-100;i<=0;i++){var d=addDays(today,i);Object.keys(SH).forEach(function(sid){
    if(sid==='A5'||DAYS[SH[sid][0]].indexOf(dow(d))<0)return;var e=[regOf(db,d,sid)];if(!e[0])return;var s=st(d,sid),en=s+SH[sid][2]*60000;if(en>now)return;if(R()<.02)return;
    var o=R()<.1?31+Math.floor(R()*40):Math.floor(R()*46)-16,o2=R()<.04?-(8+Math.floor(R()*30)):Math.floor(R()*20);
    db.attendance.push({id:uuid(),emp:e[0],work_date:d,shift_id:sid,check_in:new Date(s+o*6e4).toISOString(),check_out:new Date(en+o2*6e4).toISOString(),late_min:Math.max(0,o),late_flag:o>30,early_min:Math.max(0,-o2),early_flag:o2<0,is_cover:false,by_admin:(e[0]==='e3'?R()<.18:R()<.05)?'e0':null,admin_note:['ลืมเช็กอิน','โทรศัพท์แบตหมด','อินเทอร์เน็ตใช้ไม่ได้'][Math.floor(R()*3)]});});}

  // preview extras: covers, leaves, live shift
  var kinds=['vac','per','sick'],L1={id:'lv1',emp:'e3',type:'vac',from_date:addDays(today,-12),to_date:addDays(today,-11),days:2,reason:'พาครอบครัวเที่ยว',status:'approved',note:'',decided_by:'e0',decided_at:new Date(now-15*864e5).toISOString(),created_at:new Date(now-16*864e5).toISOString()};
  db.leaves.push(L1);
  for(var k=-40;k<15;k+=3){var dd=addDays(today,k);Object.keys(SH).forEach(function(sid,ix){
    if(sid==='A5'||DAYS[SH[sid][0]].indexOf(dow(dd))<0||(k+ix)%5)return;
    var cov=['e7','e8'][(k+ix+100)%2],kd=kinds[(k+ix+99)%3],lid=null;
    if(sid==='A3'&&(dd===L1.from_date||dd===L1.to_date)){kd='vac';lid='lv1';}
    db.overrides.push({work_date:dd,shift_id:sid,cover:cov,note:'',kind:kd,leave_id:lid,set_by:'e0',set_at:new Date(now-20*864e5).toISOString()});
    db.attendance.forEach(function(a){if(a.work_date===dd&&a.shift_id===sid){a.emp=cov;a.is_cover=true;}});
  });}
  ['e3'].forEach(function(){});
  [L1.from_date,L1.to_date].forEach(function(dd){if(DAYS.A.indexOf(dow(dd))>=0&&!db.overrides.some(function(o){return o.work_date===dd&&o.shift_id==='A3';})){db.overrides.push({work_date:dd,shift_id:'A3',cover:'e7',note:'',kind:'vac',leave_id:'lv1',set_by:'e0',set_at:L1.decided_at});db.attendance.forEach(function(a){if(a.work_date===dd&&a.shift_id==='A3'){a.emp='e7';a.is_cover=true;}});}});
  db.leaves.push({id:'lv2',emp:'e2',type:'per',from_date:addDays(today,5),to_date:addDays(today,5),days:1,reason:'ไปทำธุระที่อำเภอ',status:'pending',note:'',decided_by:null,decided_at:null,created_at:new Date(now-5*36e5).toISOString()});
  db.leaves.push({id:'lv3',emp:'e6',type:'sick',from_date:today,to_date:today,days:1,reason:'มีไข้',status:'pending',note:'',decided_by:null,decided_at:null,created_at:new Date(now-2*36e5).toISOString()});
  // currently running shifts get a check-in
  [addDays(today,-1),today].forEach(function(dd){Object.keys(SH).forEach(function(sid){
    if(sid==='A5'||DAYS[SH[sid][0]].indexOf(dow(dd))<0)return;var s0=st(dd,sid),e0=s0+SH[sid][2]*60000;if(!(s0<now&&now<e0))return;
    var ov=db.overrides.find(function(o){return o.work_date===dd&&o.shift_id===sid;}),who=ov?ov.cover:regOf(db,dd,sid);if(!who)return;
    db.attendance.push({id:uuid(),emp:who,work_date:dd,shift_id:sid,check_in:new Date(s0+(sid==='B1'?42:-6)*6e4).toISOString(),check_out:null,late_min:sid==='B1'?42:0,late_flag:sid==='B1',early_min:0,early_flag:false,is_cover:!!ov});});});
  [['คำขอลาใหม่',"'มาลี ขอลากิจ '+(function(x){return x.slice(8,10)+'/'+x.slice(5,7);})(addDays(today,5))+' · ไปทำธุระที่อำเภอ'",[],'',1.5],
   ['เข้างานสาย',"'สมชาย เข้างาน '+(function(x){return x.slice(8,10)+'/'+x.slice(5,7);})(addDays(today,-1))+' สาย 42 นาที'",['e1'],'warn',3],
   ['มอบหมายให้ทำแทน',"'วิชัย ทำแทน 3 วัน (กะ 18.00) เริ่ม '+(function(x){return x.slice(8,10)+'/'+x.slice(5,7);})(addDays(today,2))",['e7'],'',5],
   ['ผู้ดูแลลงเวลาแทน',"'บันทึกเวลา '+(function(x){return x.slice(8,10)+'/'+x.slice(5,7);})(addDays(today,-2))+' เข้า 10:02 ออก 19:00'",['e2'],'',8],
   ['สร้างบัญชีใหม่',"'เพิ่มบัญชี best (ทีม A)'",[],'',30]].forEach(function(r,i){
    db.notifications.push({id:'nl'+i,ts:new Date(now-r[4]*36e5).toISOString(),to_ids:r[2],title:r[0],body:eval(r[1]),kind:r[3]});});
  return db;
}
var db=build();
function rowsOf(t){return {profiles:db.profiles,settings:db.settings,overrides:db.overrides,attendance:db.attendance,leaves:db.leaves,notifications:db.notifications,notification_reads:db.reads,rota_periods:db.rota,rota_b:db.rota_b}[t];}
var session=null;window.__calls=[];
function Q(t){this.t=t;this.f=[];this.op='select';}
Q.prototype.select=function(){this.sel=true;return this;};
Q.prototype.eq=function(k,v){this.f.push(function(r){return r[k]===v;});return this;};
Q.prototype.gte=function(k,v){this.f.push(function(r){return r[k]>=v;});return this;};
Q.prototype.order=function(k,o){this.ord=[k,!(o&&o.ascending===false)];return this;};
Q.prototype.limit=function(n){this.lim=n;return this;};
Q.prototype.maybeSingle=function(){this.single=true;return this;};
Q.prototype.update=function(o){this.op='update';this.upd=o;return this;};
Q.prototype.then=function(res,rej){
  var rows=rowsOf(this.t).filter(function(r){return this.f.every(function(f){return f(r);});}.bind(this)),data;
  if(this.op==='update'){rows.forEach(function(r){Object.assign(r,this.upd);}.bind(this));window.__calls.push(['update',this.t,this.upd]);data=this.sel?rows.slice():null;}
  else{if(this.t==='notification_reads')rows=rows.filter(function(r){return r.user_id===session.uid;});
    if(this.t==='leaves'&&session.role!=='admin')rows=rows.filter(function(r){return r.emp===session.uid;});
    if(this.ord){var k=this.ord[0],a=this.ord[1];rows=rows.slice().sort(function(x,y){return (x[k]>y[k]?1:x[k]<y[k]?-1:0)*(a?1:-1);});}
    if(this.lim)rows=rows.slice(0,this.lim);data=this.single?(rows[0]||null):rows.slice();}
  return Promise.resolve({data:data,error:null}).then(res,rej);};
function fail(m){return {data:null,error:{message:m}};}
var RPC={
 server_now:function(){return new Date().toISOString();},
 check_in:function(a){var me=db.profiles.find(function(p){return p.id===session.uid;});
   var ov=db.overrides.find(function(o){return o.work_date===a.p_date&&o.shift_id===a.p_shift;});
   var who=ov?ov.cover:regOf(db,a.p_date,a.p_shift);
   if(who!==me.id)throw new Error('คุณไม่ได้อยู่ในกะนี้');
   var s=st(a.p_date,a.p_shift),late=Math.floor((Date.now()-s)/6e4);
   var r={id:uuid(),emp:me.id,work_date:a.p_date,shift_id:a.p_shift,check_in:new Date().toISOString(),check_out:null,late_min:Math.max(0,late),late_flag:late>db.settings[0].late_after,early_min:0,early_flag:false,is_cover:!!ov};
   db.attendance.push(r);if(r.late_flag)db.notifications.push({id:uuid(),ts:new Date().toISOString(),to_ids:[me.id],title:'เข้างานสาย',body:'สาย',kind:'warn'});return r;},
 check_out:function(a){var r=db.attendance.find(function(x){return x.id===a.p_id;});r.check_out=new Date().toISOString();var e=st(r.work_date,r.shift_id)+SH[r.shift_id][2]*6e4,early=Math.floor((e-Date.now())/6e4);r.early_min=Math.max(0,early);r.early_flag=early>0;return r;},
 set_override_days:function(a){var done=0,sk=[];var nm=function(id){var q=db.profiles.find(function(p){return p.id===id;});return q?q.name:'';};
   var shiftOnM=function(id,d){var ks=Object.keys(SH);for(var i=0;i<ks.length;i++){if(ks[i]!=='A5'&&teamWorks(SH[ks[i]][0],d)&&regOf(db,d,ks[i])===id)return ks[i];}return null;};
   var up=function(o){db.overrides=db.overrides.filter(function(x){return !(x.work_date===o.work_date&&x.shift_id===o.shift_id);});db.overrides.push(o);};
   (a.p_dates||[]).forEach(function(d){var t=SH[a.p_shift][0];if(!teamWorks(t,d)){sk.push(d);return;}var reg=regOf(db,d,a.p_shift);
     if(a.p_mode==='work'){db.overrides=db.overrides.filter(function(o){return !(o.work_date===d&&(o.shift_id===a.p_shift||(o.kind==='swap'&&o.cover===reg)));});done++;return;}
     if(!reg||reg===a.p_other){sk.push(d);return;}
     if(a.p_mode==='cover'){up({work_date:d,shift_id:a.p_shift,cover:a.p_other,note:a.p_note||'',kind:'',leave_id:null,set_by:session.uid,set_at:new Date().toISOString()});}
     else{var oth=shiftOnM(a.p_other,d);if(!oth||oth===a.p_shift){sk.push(d);return;}up({work_date:d,shift_id:a.p_shift,cover:a.p_other,note:'สลับกะกับ '+nm(reg),kind:'swap',leave_id:null,set_by:session.uid,set_at:new Date().toISOString()});up({work_date:d,shift_id:oth,cover:reg,note:'สลับกะกับ '+nm(a.p_other),kind:'swap',leave_id:null,set_by:session.uid,set_at:new Date().toISOString()});}
     done++;});
   return {done:done,skipped:sk};},
 admin_attendance:function(a){db.attendance=db.attendance.filter(function(x){return !(x.work_date===a.p_date&&x.shift_id===a.p_shift);});if(!a.p_in)return null;
   var s=st(a.p_date,a.p_shift),en=s+SH[a.p_shift][2]*6e4,li=Math.floor((Date.parse(a.p_in)-s)/6e4),eo=a.p_out?Math.floor((en-Date.parse(a.p_out))/6e4):0;
   db.attendance.push({id:uuid(),emp:a.p_emp,work_date:a.p_date,shift_id:a.p_shift,check_in:a.p_in,check_out:a.p_out,late_min:Math.max(0,li),late_flag:li>db.settings[0].late_after,early_min:Math.max(0,eo),early_flag:eo>0,is_cover:db.overrides.some(function(o){return o.work_date===a.p_date&&o.shift_id===a.p_shift;}),by_admin:session.uid,admin_note:a.p_note||''});return null;},
 set_rotation:function(a){var wk=monday(a.p_week||bkk(Date.now()));db.rota=ROTA=db.rota.filter(function(r){return r.week_from<wk;});if(!a.p_week){db.rota.push({week_from:wk,active:false,cyc:4,a2:null,a3:null,a4:null,a1:null});return null;}db.rota.push({week_from:wk,active:true,cyc:4,a2:a.p_a2,a3:a.p_a3,a4:a.p_a4,a1:a.p_a1});return null;},
 set_rotation_b:function(a){if(dow(a.p_start)!==5)throw new Error('วันเริ่มรอบต้องเป็นวันศุกร์');db.rota_b=ROTB=db.rota_b.filter(function(r){return r.start_date<a.p_start;});db.rota_b.push({start_date:a.p_start,active:true,b_day:a.p_day,b_night:a.p_night});return null;},
 call_flex:function(a){db.overrides=db.overrides.filter(function(o){return !(o.work_date===a.p_date&&o.kind==='flex');});if(!a.p_emp)return null;db.overrides.push({work_date:a.p_date,shift_id:'A5',cover:a.p_emp,note:a.p_note||'เรียกเข้ากะฉุกเฉิน',kind:'flex',leave_id:null,set_by:session.uid,set_at:new Date().toISOString()});if(a.p_move){var home=Object.keys(SH).find(function(sid){return sid!=='A5'&&regOf(db,a.p_date,sid)===a.p_emp;});if(home&&!db.overrides.some(function(o){return o.work_date===a.p_date&&o.shift_id===home;}))db.overrides.push({work_date:a.p_date,shift_id:home,cover:null,note:'ย้ายไปกะ 19.00–04.00',kind:'flex',leave_id:null,set_by:session.uid,set_at:new Date().toISOString()});}return null;},
 set_override:function(a){db.overrides=db.overrides.filter(function(o){return !(o.work_date===a.p_date&&o.shift_id===a.p_shift);});if(a.p_cover)db.overrides.push({work_date:a.p_date,shift_id:a.p_shift,cover:a.p_cover,note:a.p_note,kind:'',leave_id:null,set_by:session.uid,set_at:new Date().toISOString()});return null;},
 request_leave:function(a){var me=db.profiles.find(function(p){return p.id===session.uid;});var n=0;for(var d=a.p_from;d<=a.p_to;d=addDays(d,1))if(DAYS[SH[me.shift_id][0]].indexOf(dow(d))>=0)n++;
   var l={id:uuid(),emp:me.id,type:a.p_type,from_date:a.p_from,to_date:a.p_to,days:n,reason:a.p_reason,status:'pending',note:'',decided_by:null,decided_at:null,created_at:new Date().toISOString()};db.leaves.push(l);return l;},
 cancel_leave:function(a){db.leaves.find(function(l){return l.id===a.p_id;}).status='cancelled';return null;},
 approve_leave:function(a){var l=db.leaves.find(function(x){return x.id===a.p_id;});a.p_covers.forEach(function(c){db.overrides.push({work_date:c.work_date,shift_id:c.shift_id,cover:c.cover,note:'ลา',kind:l.type,leave_id:l.id,set_by:session.uid,set_at:new Date().toISOString()});});l.status='approved';return null;},
 reject_leave:function(a){var l=db.leaves.find(function(x){return x.id===a.p_id;});l.status='rejected';l.note=a.p_note;return null;},
 mark_read:function(a){a.p_ids.forEach(function(i){db.reads.push({notif_id:i,user_id:session.uid});});return null;},
 set_my_notify:function(a){db.profiles.find(function(p){return p.id===session.uid;}).notify=a.p_on;return null;},
 admin_notify:function(a){db.notifications.push({id:uuid(),ts:new Date().toISOString(),to_ids:a.p_to,title:a.p_title,body:a.p_body,kind:a.p_kind});return null;}
};
window.supabase={createClient:function(){return {
  auth:{getSession:function(){return Promise.resolve({data:{session:session&&{user:{id:session.uid}}}});},
    signInWithPassword:function(o){var u=o.email.split('@')[0],r=db.pw[u];if(!r||r[1]!==o.password)return Promise.resolve({data:{},error:{message:'Invalid login credentials'}});session={uid:r[0],role:db.profiles.find(function(p){return p.id===r[0];}).role};return Promise.resolve({data:{user:{id:r[0]}},error:null});},
    signOut:function(){session=null;return Promise.resolve({});}},
  from:function(t){return new Q(t);},
  rpc:function(n,a){window.__calls.push(['rpc',n,a]);try{var d=RPC[n](a||{});return Promise.resolve({data:d,error:null});}catch(e){return Promise.resolve(fail(e.message));}},
  functions:{invoke:function(n,o){window.__calls.push(['fn',n,o.body]);var b=o.body;
    var okPw=function(x){return typeof x==='string'&&/^[\x21-\x7E]{8,72}$/.test(x);},err=function(m){return Promise.resolve({data:null,error:{message:m,context:{json:function(){return Promise.resolve({error:m});}}}});};
    var meP=db.profiles.find(function(p){return p.id===session.uid;});
    if(b.action==='change_own'){if(!okPw(b.password))return err('รหัสผ่านไม่ผ่านเกณฑ์');if(db.pw[meP.username][1]!==b.current)return err('รหัสผ่านปัจจุบันไม่ถูกต้อง');if(b.password===b.current)return err('รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม');db.pw[meP.username][1]=b.password;meP.must_change_pw=false;return Promise.resolve({data:{ok:true},error:null});}
    if(meP.role!=='admin')return err('เฉพาะผู้ดูแลระบบ');
    if(b.action==='set_password'){if(!okPw(b.password))return err('รหัสผ่านไม่ผ่านเกณฑ์');var tp=db.profiles.find(function(p){return p.id===b.id;});db.pw[tp.username][1]=b.password;tp.must_change_pw=true;return Promise.resolve({data:{ok:true},error:null});}
    if(b.action==='create'){if(!okPw(b.password))return err('รหัสผ่านไม่ผ่านเกณฑ์');var id=uuid();db.profiles.push({id:id,username:b.username,name:b.name,role:b.role,team:b.team,shift_id:b.shift_id,phone:b.phone||'',active:true,can_work:!!b.can_work,notify:true,must_change_pw:true,created_at:new Date().toISOString()});db.pw[b.username]=[id,b.password];return Promise.resolve({data:{ok:true,id:id},error:null});}
    if(b.action==='delete'){db.profiles=db.profiles.filter(function(p){return p.id!==b.id;});return Promise.resolve({data:{ok:true},error:null});}
    return Promise.resolve({data:{ok:true},error:null});}}
};}};
})();
