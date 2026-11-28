(function(){
var LS='mockdb';
function uuid(){return 'u'+Math.random().toString(36).slice(2,10);}
var P=[
 ['e0','admin','ผู้ดูแลระบบ','admin',null,null,'000000'],
 ['e1','somchai','สมชาย ใจดี','staff','A','A1','123456'],['e2','malee','มาลี รักงาน','staff','A','A2','123456'],
 ['e3','wichai','วิชัย มั่นคง','staff','A','A3','123456'],['e4','nattaya','ณัฐธิดา สุขใจ','staff','A','A4','123456'],
 ['e5','prasert','ประเสริฐ เก่งกล้า','staff','B','B1','123456'],['e6','kanya','กัญญา ศรีสุข','staff','B','B2','123456'],
 ['e7','anan','อนันต์ ใจเย็น','staff','OPS',null,'123456'],['e8','porntip','พรทิพย์ คล่องงาน','staff','OPS',null,'123456']];
var SH={A1:['A','08:30',510],A2:['A','10:00',540],A3:['A','18:00',540],A4:['A','23:30',540],B1:['B','07:00',720],B2:['B','19:00',720]};
function bkk(ts){var f=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit'});return f.format(new Date(ts));}
function addDays(d,n){var x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10);}
function dow(d){return new Date(d+'T00:00:00Z').getUTCDay();}
var DAYS={A:[1,2,3,4,5],B:[5,6,0,1]};
function st(d,sid){return Date.parse(d+'T'+SH[sid][1]+':00+07:00');}
function build(){
  var db={tokens:{},profiles:[],settings:[{id:1,open_before:30,late_after:30,q_vac:10,q_per:3,q_sick:30,allow_avatar:false,allow_name:false}],overrides:[],attendance:[],leaves:[],notifications:[],reads:[],pw:{}};
  P.forEach(function(p,i){db.profiles.push({id:p[0],username:p[1],name:p[2],role:p[3],team:p[4],shift_id:p[5],phone:'',active:true,can_work:false,notify:true,created_at:new Date(1e12+i).toISOString()});db.pw[p[1]]=[p[0],p[6]];});
  var now=Date.now(),today=bkk(now),x=1;function R(){x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;}
  for(var i=-100;i<=0;i++){var d=addDays(today,i);Object.keys(SH).forEach(function(sid){
    if(DAYS[SH[sid][0]].indexOf(dow(d))<0)return;var e=P.find(function(p){return p[5]===sid;});var s=st(d,sid),en=s+SH[sid][2]*60000;if(en>now)return;if(R()<.02)return;
    var o=R()<.1?31+Math.floor(R()*40):Math.floor(R()*46)-16,o2=R()<.04?-(8+Math.floor(R()*30)):Math.floor(R()*20);
    db.attendance.push({id:uuid(),emp:e[0],work_date:d,shift_id:sid,check_in:new Date(s+o*6e4).toISOString(),check_out:new Date(en+o2*6e4).toISOString(),late_min:Math.max(0,o),late_flag:o>30,early_min:Math.max(0,-o2),early_flag:o2<0,is_cover:false});});}

  // preview extras: covers, leaves, live shift
  var kinds=['vac','per','sick'],L1={id:'lv1',emp:'e3',type:'vac',from_date:addDays(today,-12),to_date:addDays(today,-11),days:2,reason:'พาครอบครัวเที่ยว',status:'approved',note:'',decided_by:'e0',decided_at:new Date(now-15*864e5).toISOString(),created_at:new Date(now-16*864e5).toISOString()};
  db.leaves.push(L1);
  for(var k=-40;k<15;k+=3){var dd=addDays(today,k);Object.keys(SH).forEach(function(sid,ix){
    if(DAYS[SH[sid][0]].indexOf(dow(dd))<0||(k+ix)%5)return;
    var cov=['e7','e8'][(k+ix+100)%2],kd=kinds[(k+ix+99)%3],lid=null;
    if(sid==='A3'&&(dd===L1.from_date||dd===L1.to_date)){kd='vac';lid='lv1';}
    db.overrides.push({work_date:dd,shift_id:sid,cover:cov,note:'',kind:kd,leave_id:lid,set_by:'e0',set_at:new Date(now-20*864e5).toISOString()});
    var reg=P.find(function(p){return p[5]===sid;})[0];
    db.attendance.forEach(function(a){if(a.work_date===dd&&a.shift_id===sid){a.emp=cov;a.is_cover=true;}});
  });}
  ['e3'].forEach(function(){});
  [L1.from_date,L1.to_date].forEach(function(dd){if(DAYS.A.indexOf(dow(dd))>=0&&!db.overrides.some(function(o){return o.work_date===dd&&o.shift_id==='A3';})){db.overrides.push({work_date:dd,shift_id:'A3',cover:'e7',note:'',kind:'vac',leave_id:'lv1',set_by:'e0',set_at:L1.decided_at});db.attendance.forEach(function(a){if(a.work_date===dd&&a.shift_id==='A3'){a.emp='e7';a.is_cover=true;}});}});
  db.leaves.push({id:'lv2',emp:'e2',type:'per',from_date:addDays(today,5),to_date:addDays(today,5),days:1,reason:'ไปทำธุระที่อำเภอ',status:'pending',note:'',decided_by:null,decided_at:null,created_at:new Date(now-5*36e5).toISOString()});
  db.leaves.push({id:'lv3',emp:'e6',type:'sick',from_date:today,to_date:today,days:1,reason:'มีไข้',status:'pending',note:'',decided_by:null,decided_at:null,created_at:new Date(now-2*36e5).toISOString()});
  // currently running shifts get a check-in
  [addDays(today,-1),today].forEach(function(dd){Object.keys(SH).forEach(function(sid){
    if(DAYS[SH[sid][0]].indexOf(dow(dd))<0)return;var s0=st(dd,sid),e0=s0+SH[sid][2]*60000;if(!(s0<now&&now<e0))return;
    var ov=db.overrides.find(function(o){return o.work_date===dd&&o.shift_id===sid;}),who=ov?ov.cover:P.find(function(p){return p[5]===sid;})[0];
    db.attendance.push({id:uuid(),emp:who,work_date:dd,shift_id:sid,check_in:new Date(s0+(sid==='B1'?42:-6)*6e4).toISOString(),check_out:null,late_min:sid==='B1'?42:0,late_flag:sid==='B1',early_min:0,early_flag:false,is_cover:!!ov});});});
  db.notifications.push({id:'n1',ts:new Date(now-36e5).toISOString(),to_ids:['e1'],title:'ทดสอบ',body:'ข้อความ',kind:''});
  return db;
}
var db=build();db.attendance=[];db.overrides=[];db.leaves=[];
function rowsOf(t){return {profiles:db.profiles,leave_quota:(db.lq||(db.lq=[])).filter(function(r){return session&&(session.role==='admin'||r.emp===session.uid);}),leave_quota_log:(db.lql||(db.lql=[])).filter(function(r){return session&&(session.role==='admin'||r.emp===session.uid);}),settings:db.settings,overrides:db.overrides,attendance:db.attendance,holidays:[],attendance_locations:[],leaves:db.leaves,notifications:db.notifications,notification_reads:db.reads,rota_periods:[],rota_b:[]}[t];}
var session={uid:'e0',role:'admin'};window.__calls=[];
function Q(t){this.t=t;this.f=[];this.op='select';}
Q.prototype.select=function(){this.sel=true;return this;};
Q.prototype.eq=function(k,v){this.f.push(function(r){return r[k]===v;});return this;};
Q.prototype.gte=function(k,v){this.f.push(function(r){return r[k]>=v;});return this;};
Q.prototype.order=function(k,o){this.ord=[k,!(o&&o.ascending===false)];return this;};
Q.prototype.limit=function(n){this.lim=n;return this;};Q.prototype.range=function(a,b){this.rng=[a,b];return this;};
Q.prototype.maybeSingle=function(){this.single=true;return this;};
Q.prototype.update=function(o){this.op='update';this.upd=o;return this;};
Q.prototype.then=function(res,rej){
  var rows=rowsOf(this.t).filter(function(r){return this.f.every(function(f){return f(r);});}.bind(this)),data;
  if(this.op==='update'){rows.forEach(function(r){Object.assign(r,this.upd);}.bind(this));window.__calls.push(['update',this.t,this.upd]);data=this.sel?rows.slice():null;}
  else{if(this.t==='notification_reads')rows=rows.filter(function(r){return r.user_id===session.uid;});
    if(this.t==='leaves'&&session.role!=='admin')rows=rows.filter(function(r){return r.emp===session.uid;});
    if(this.ord){var k=this.ord[0],a=this.ord[1];rows=rows.slice().sort(function(x,y){return (x[k]>y[k]?1:x[k]<y[k]?-1:0)*(a?1:-1);});}
    if(this.lim)rows=rows.slice(0,this.lim);if(this.rng)rows=rows.slice(this.rng[0],this.rng[1]+1);data=this.single?(rows[0]||null):rows.slice();}
  return Promise.resolve({data:data,error:null}).then(res,rej);};
function fail(m){return {data:null,error:{message:m}};}
var RPC={
 set_my_prefs:function(a){var p=db.profiles.find(function(x){return x.id===session.uid;});if(!p)throw new Error('ยังไม่ได้ล็อกอิน');p.prefs=JSON.parse(JSON.stringify(a.p_prefs||{}));return null;},
 admin_set_quota:function(a){if(session.role!=='admin')throw new Error('เฉพาะผู้ดูแลระบบ');if(!a.p_emps||!a.p_emps.length)throw new Error('เลือกพนักงานอย่างน้อย 1 คน');db.lq=db.lq||[];db.lql=db.lql||[];var s0=db.settings[0],c=0;
   a.p_emps.forEach(function(e){var r=db.lq.find(function(x){return x.emp===e&&x.yr===a.p_yr&&x.type===a.p_type;}),o=r?r.days:s0['q_'+a.p_type],n=Math.max(0,Math.min(366,a.p_mode==='set'?a.p_days:o+a.p_days));
     if(r)r.days=n;else db.lq.push({emp:e,yr:a.p_yr,type:a.p_type,days:n});if(n!==o){c++;db.lql.unshift({id:db.lql.length+1,emp:e,yr:a.p_yr,type:a.p_type,old_days:o,new_days:n,note:a.p_note||'',by_id:session.uid,at:new Date().toISOString()});}});return c;},
 admin_set_leave_defaults:function(a){if(session.role!=='admin')throw new Error('เฉพาะผู้ดูแลระบบ');var s0=db.settings[0];s0.q_vac=a.p_vac;s0.q_per=a.p_per;s0.q_sick=a.p_sick;return null;},
 admin_request_leave:function(a){if(session.role!=='admin')throw new Error('เฉพาะผู้ดูแลระบบ');if(!a.p_reason||!a.p_reason.trim())throw new Error('กรอกเหตุผลที่ลาแทน');var me=db.profiles.find(function(p){return p.id===a.p_emp;});var n=0;for(var d=a.p_from;d<=a.p_to;d=addDays(d,1))if(DAYS[SH[me.shift_id][0]].indexOf(dow(d))>=0)n++;
   var l={id:uuid(),emp:me.id,type:a.p_type,from_date:a.p_from,to_date:a.p_to,days:n,reason:a.p_reason.trim(),status:'pending',note:'',decided_by:null,decided_at:null,created_at:new Date().toISOString(),by_admin:session.uid};db.leaves.push(l);return l;},
 set_avatar:function(a){var s0=db.settings[0];if(session.role!=='admin'){if(a.p_emp!==session.uid)throw new Error('เฉพาะผู้ดูแลระบบ');if(!s0.allow_avatar)throw new Error('ผู้ดูแลยังไม่เปิดให้แก้รูปเอง');}var p=db.profiles.find(function(x){return x.id===a.p_emp;});p.avatar=a.p_avatar;return null;},
 set_my_name:function(a){if(session.role!=='admin'&&!db.settings[0].allow_name)throw new Error('ผู้ดูแลยังไม่เปิดให้แก้ชื่อเอง');var nm=(a.p_name||'').trim();if(nm.length<2||nm.length>60)throw new Error('ชื่อต้องยาว 2–60 ตัวอักษร');db.profiles.find(function(x){return x.id===session.uid;}).name=nm;return null;},
 admin_set_profile_perms:function(a){if(session.role!=='admin')throw new Error('เฉพาะผู้ดูแลระบบ');var s0=db.settings[0];if(a.p_avatar!=null)s0.allow_avatar=a.p_avatar;if(a.p_name!=null)s0.allow_name=a.p_name;return null;},
 server_now:function(){return new Date().toISOString();},
 check_in:function(a){var me=db.profiles.find(function(p){return p.id===session.uid;});
   var ov=db.overrides.find(function(o){return o.work_date===a.p_date&&o.shift_id===a.p_shift;});
   var who=ov?ov.cover:(db.profiles.find(function(p){return p.shift_id===a.p_shift;})||{}).id;
   if(who!==me.id)throw new Error('คุณไม่ได้อยู่ในกะนี้');
   var s=st(a.p_date,a.p_shift),late=Math.floor((Date.now()-s)/6e4);
   var r={id:uuid(),emp:me.id,work_date:a.p_date,shift_id:a.p_shift,check_in:new Date().toISOString(),check_out:null,late_min:Math.max(0,late),late_flag:late>db.settings[0].late_after,early_min:0,early_flag:false,is_cover:!!ov};
   db.attendance.push(r);if(r.late_flag)db.notifications.push({id:uuid(),ts:new Date().toISOString(),to_ids:[me.id],title:'เข้างานสาย',body:'สาย',kind:'warn'});return r;},
 check_out:function(a){var r=db.attendance.find(function(x){return x.id===a.p_id;});r.check_out=new Date().toISOString();var e=st(r.work_date,r.shift_id)+SH[r.shift_id][2]*6e4,early=Math.floor((e-Date.now())/6e4);r.early_min=Math.max(0,early);r.early_flag=early>0;return r;},
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
    if(b.action==='create'){var id=uuid();db.profiles.push({id:id,username:b.username,name:b.name,role:b.role,team:b.team,shift_id:b.shift_id,phone:b.phone||'',active:true,can_work:!!b.can_work,notify:true,created_at:new Date().toISOString()});return Promise.resolve({data:{ok:true,id:id},error:null});}
    if(b.action==='delete'){db.profiles=db.profiles.filter(function(p){return p.id!==b.id;});return Promise.resolve({data:{ok:true},error:null});}
    return Promise.resolve({data:{ok:true},error:null});}}
};}};
})();
