/* notification links */
function noteDate(n){
  var m=/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/.exec(n.body||'');if(!m)return '';
  var ref=bkk(n.ts||now()).date,y=+ref.slice(0,4),mo=+m[2],dd=+m[1];
  if(m[3]){y=+m[3];if(y>2400)y-=543;}
  else{var rm=+ref.slice(5,7);if(mo-rm>6)y--;else if(rm-mo>6)y++;}
  if(mo<1||mo>12||dd<1||dd>31)return '';
  return y+'-'+(mo<10?'0':'')+mo+'-'+(dd<10?'0':'')+dd;
}
function noteTarget(n){
  if(!me)return null;
  var A=me.role==='admin',t=n.title||'',d=noteDate(n),who=(n.to||[]).map(emp).filter(function(x){return x&&x.role==='staff';})[0];
  var team=t==='ตารางกะทีม B'?'B':who&&who.team==='B'?'B':(!A&&me.team==='B'?'B':'A');
  var sched={v:'schedule',label:'ตารางกะ',d:d,t:team};
  if(/คำขอลา/.test(t))return A?{v:'leaves',label:'คำขอลา',lvf:t==='คำขอลาใหม่'?'pending':'all'}:{v:'leave',label:'ขอลา'};
  if(/การลา/.test(t))return A?{v:'leaves',label:'คำขอลา',lvf:'all'}:{v:'leave',label:'ขอลา'};
  if(t==='ตารางหมุนกะ'||t==='ตารางกะทีม B')return A?{v:'settings',label:'ตั้งค่า'}:sched;
  if(/ทำแทน|สลับกะ|ฉุกเฉิน|ตารางกะ|ยกเลิกการหยุด|เปลี่ยนกะ/.test(t))return sched;
  if(/เข้างานสาย|ออกงานก่อนเวลา|ลงเวลาแทน|ลืม/.test(t))return A?{v:'today',label:'รายละเอียดวัน',det:d?'day:'+d:''}:{v:'history',label:'ประวัติ'};
  if(/บัญชี|โปรไฟล์|พนักงาน|รหัสผ่าน/.test(t))return A?{v:'people',label:'พนักงาน'}:null;
  if(/กฎการลงเวลา/.test(t))return A?{v:'settings',label:'ตั้งค่า'}:{v:'home',label:'ลงเวลา'};
  return null;
}
function goNote(n){
  var g=noteTarget(n);if(!g)return false;
  if(tabList().map(function(x){return x[0];}).indexOf(g.v)<0)return false;
  view=g.v;resetUi();
  if(g.v==='schedule'){if(g.d)schedAnchor=g.d;schedTeam=g.t;}
  if(g.lvf)lvFilter=g.lvf;
  renderAll();window.scrollTo(0,0);
  if(g.det)setTimeout(function(){openDet(g.det);},30);
  return true;
}
function markNoteRead(n){
  if(n&&n.read.indexOf(me.id)<0){n.read.push(me.id);rpc('mark_read',{p_ids:[n.id]}).catch(function(){});}
}
