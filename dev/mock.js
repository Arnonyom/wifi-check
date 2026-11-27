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
  var db={tokens:{},profiles:[],settings:[{id:1,open_before:30,late_after:30}],overrides:[],attendance:[],leaves:[],notifications:[],reads:[],pw:{}};
  P.forEach(function(p,i){db.profiles.push({id:p[0],username:p[1],name:p[2],role:p[3],team:p[4],shift_id:p[5],phone:'',active:true,can_work:false,notify:true,created_at:new Date(1e12+i).toISOString()});db.pw[p[1]]=[p[0],p[6]];});
  var now=Date.now(),today=bkk(now),x=1;function R(){x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;}
  for(var i=-100;i<0;i++){var d=addDays(today,i);Object.keys(SH).forEach(function(sid){
    if(DAYS[SH[sid][0]].indexOf(dow(d))<0)return;var e=P.find(function(p){return p[5]===sid;});var s=st(d,sid),en=s+SH[sid][2]*60000;if(en>now)return;if(R()<.02)return;
    var o=R()<.1?31+Math.floor(R()*40):Math.floor(R()*46)-16,o2=R()<.04?-(8+Math.floor(R()*30)):Math.floor(R()*20);
    db.attendance.push({id:uuid(),emp:e[0],work_date:d,shift_id:sid,check_in:new Date(s+o*6e4).toISOString(),check_out:new Date(en+o2*6e4).toISOString(),late_min:Math.max(0,o),late_flag:o>30,early_min:Math.max(0,-o2),early_flag:o2<0,is_cover:false});});}
  db.notifications.push({id:'n1',ts:new Date(now-36e5).toISOString(),to_ids:['e1'],title:'ทดสอบ',body:'ข้อความ',kind:''});
  return db;
}
var HOLS={};
var db=build();
db.holidays=[['2026-12-05','วันพ่อแห่งชาติ'],['2026-12-07','ชดเชยวันพ่อแห่งชาติ'],['2026-12-10','วันรัฐธรรมนูญ'],['2026-12-31','วันสิ้นปี'],['2027-01-01','วันขึ้นปีใหม่'],['2027-02-22','ชดเชยวันมาฆบูชา']].map(function(h){return {d:h[0],name:h[1]};});db.holidays.forEach(function(h){HOLS[h.d]=h.name;});
function rowsOf(t){return {profiles:db.profiles,settings:db.settings,overrides:db.overrides,attendance:db.attendance,holidays:db.holidays||(db.holidays=[]),attendance_locations:(db.locs||(db.locs=[])).filter(function(l){return session&&(session.role==='admin'||l.emp===session.uid);}),leaves:db.leaves,notifications:db.notifications,notification_reads:db.reads,rota_periods:[],rota_b:[]}[t];}
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
 set_profile_order:function(a){if(session.role!=='admin')throw new Error('เฉพาะผู้ดูแลระบบ');(a.p_ids||[]).forEach(function(id,i){var p=db.profiles.find(function(x){return x.id===id;});if(p)p.sort_order=i+1;});return null;},
 set_my_location:function(a){var r=db.attendance.find(function(x){return x.id===a.p_att;});if(!r||r.emp!==session.uid)throw new Error('ไม่พบรายการเข้างาน');
   db.locs=db.locs||[];db.locs=db.locs.filter(function(l){return !(l.att_id===a.p_att&&l.kind===a.p_kind);});var ok=a.p_status==='ok';
   db.locs.push({att_id:a.p_att,kind:a.p_kind,emp:r.emp,status:a.p_status,lat:ok?a.p_lat:null,lng:ok?a.p_lng:null,acc:ok?a.p_acc:null,place:ok?a.p_place:null,created_at:new Date().toISOString()});return null;},
 admin_set_holiday:function(a){if(session.role!=='admin')throw new Error('เฉพาะผู้ดูแลระบบ');db.holidays=(db.holidays||[]).filter(function(h){return h.d!==a.p_d;});if(a.p_name&&a.p_name.trim())db.holidays.push({d:a.p_d,name:a.p_name.trim()});db.holidays.sort(function(x,y){return x.d<y.d?-1:1;});HOLS={};db.holidays.forEach(function(h){HOLS[h.d]=h.name;});return null;},
 admin_clear_data:function(a){if(session.role!=='admin')throw new Error('เฉพาะผู้ดูแลระบบ');if(!a.p_from||!a.p_to||a.p_from>a.p_to)throw new Error('เลือกช่วงวันที่ให้ถูกต้อง');
   var F=a.p_from,T=a.p_to,inR=function(d){return d>=F&&d<=T;},bd=function(ts){return new Date(Date.parse(ts)+7*36e5).toISOString().slice(0,10);};
   var att=a.p_att?db.attendance.filter(function(x){return inR(x.work_date);}):[],ov=a.p_sched?db.overrides.filter(function(x){return inR(x.work_date);}):[],
     lv=a.p_sched?db.leaves.filter(function(x){return x.from_date<=T&&x.to_date>=F;}):[],nt=a.p_notif?db.notifications.filter(function(x){return inR(bd(x.ts));}):[],
     rp=a.p_rota?(db.rota||[]).filter(function(x){return inR(x.week_from);}):[],rb=a.p_rota?(db.rota_b||[]).filter(function(x){return inR(x.start_date);}):[];
   if(!a.p_dry){var rm=function(arr,del){for(var i=arr.length-1;i>=0;i--)if(del.indexOf(arr[i])>=0)arr.splice(i,1);};
     var ids=att.map(function(x){return x.id;});rm(db.attendance,att);if(db.locs)db.locs=db.locs.filter(function(l){return ids.indexOf(l.att_id)<0;});
     rm(db.overrides,ov);rm(db.leaves,lv);rm(db.notifications,nt);if(db.rota)rm(db.rota,rp);if(db.rota_b)rm(db.rota_b,rb);if(typeof ROTA!=='undefined')rm(ROTA,rp);if(typeof ROTB!=='undefined')rm(ROTB,rb);}
   return {attendance:att.length,overrides:ov.length,leaves:lv.length,notifications:nt.length,rota:rp.length+rb.length};},
 server_now:function(){return new Date().toISOString();},
 check_in:function(a){var me=db.profiles.find(function(p){return p.id===session.uid;});
   var ov=db.overrides.find(function(o){return o.work_date===a.p_date&&o.shift_id===a.p_shift;});
   var who=ov?ov.cover:(db.profiles.find(function(p){return p.shift_id===a.p_shift;})||{}).id;
   if(who!==me.id)throw new Error('คุณไม่ได้อยู่ในกะนี้');
   if(db.attendance.some(function(x){return x.emp===me.id&&!x.check_out&&st(x.work_date,x.shift_id)+SH[x.shift_id][2]*6e4+12*36e5>Date.now();}))throw new Error('ยังมีกะที่ไม่ได้ออกงาน');
   var s=st(a.p_date,a.p_shift),late=Math.floor((Date.now()-s)/6e4);
   var r={id:uuid(),emp:me.id,work_date:a.p_date,shift_id:a.p_shift,check_in:new Date().toISOString(),check_out:null,late_min:Math.max(0,late),late_flag:late>db.settings[0].late_after,early_min:0,early_flag:false,is_cover:!!ov};
   db.attendance.push(r);if(r.late_flag)db.notifications.push({id:uuid(),ts:new Date().toISOString(),to_ids:[me.id],title:'เข้างานสาย',body:'สาย',kind:'warn'});return r;},
 check_out:function(a){var r=db.attendance.find(function(x){return x.id===a.p_id;});r.check_out=new Date().toISOString();var e=st(r.work_date,r.shift_id)+SH[r.shift_id][2]*6e4,early=Math.floor((e-Date.now())/6e4);r.early_min=Math.max(0,early);r.early_flag=early>0;return r;},
 set_override_days:function(a){(a.p_dates||[]).forEach(function(d){RPC.set_override({p_date:d,p_shift:a.p_shift,p_cover:a.p_mode==='work'?null:a.p_other,p_note:a.p_note});});return {done:(a.p_dates||[]).length,skipped:[]};},
 set_override:function(a){db.overrides=db.overrides.filter(function(o){return !(o.work_date===a.p_date&&o.shift_id===a.p_shift);});if(a.p_cover)db.overrides.push({work_date:a.p_date,shift_id:a.p_shift,cover:a.p_cover,note:a.p_note,kind:'',leave_id:null,set_by:session.uid,set_at:new Date().toISOString()});return null;},
 request_leave:function(a){var me=db.profiles.find(function(p){return p.id===session.uid;});var n=0;for(var d=a.p_from;d<=a.p_to;d=addDays(d,1))if(DAYS[SH[me.shift_id][0]].indexOf(dow(d))>=0)n++;
   var l={id:uuid(),emp:me.id,type:a.p_type,from_date:a.p_from,to_date:a.p_to,days:n,reason:a.p_reason,status:'pending',note:'',decided_by:null,decided_at:null,created_at:new Date().toISOString()};db.leaves.push(l);return l;},
 admin_cancel_leave:function(a){var l=db.leaves.find(function(x){return x.id===a.p_id&&x.status==='approved';});if(!l)throw new Error('ไม่พบการลาที่อนุมัติแล้ว');var td=new Date(Date.now()+7*36e5).toISOString().slice(0,10);if(l.from_date<td)throw new Error('เริ่มลาไปแล้ว ยกเลิกไม่ได้ ให้แก้ในตารางกะแทน');db.overrides=db.overrides.filter(function(o){return o.leave_id!==l.id;});l.status='cancelled';l.decided_by=session.uid;l.decided_at=new Date().toISOString();db.notifications.push({id:uuid(),ts:new Date().toISOString(),to_ids:[l.emp],title:'ยกเลิกการลา',body:'ผู้ดูแลยกเลิกการลา',kind:'warn'});return null;},
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
